import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import Papa from 'papaparse';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CustomBigCalendar.css';
import Dashboard from './components/Dashbaords';

// Import new components
import TaskList from './components/TaskManagement/TaskList';
import RecycleBin from './components/TaskManagement/RecycleBin';
import CustomCalendar from './components/Calendar/CustomCalendar';
import DateCellWrapper from './components/Calendar/DateCellWrapper';
import { addWorkingDays, calculateWorkingDays } from './components/Utils/dateUtils';
import * as api from './components/Utils/apiUtils';

const localizer = momentLocalizer(moment);

const ToDoAssignmentSystem = () => {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const processedEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events.map(event => {
      let style = {
        backgroundColor: '#3174ad',
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      };

      if (event.is_completed) {
        style.backgroundColor = '#28a745';
      } else {
        const end = new Date(event.originalEnd || event.end);
        if (!event.is_completed && end < today) {
          style.backgroundColor = '#dc3545';
        } else if (new Date(event.originalStart || event.start) <= today && today <= end) {
          style.backgroundColor = '#ffc107';
        }
      }

      return {
        ...event,
        style
      };
    });
  }, [events]);

  const { taskStats, eventStats } = useMemo(() => {
    const taskStats = {
      total: tasks.length,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventStats = {
      total: events.length,
      completed: events.filter(event => event.is_completed).length,
      inProgress: events.filter(event => 
        !event.is_completed && 
        new Date(event.start) <= today && 
        today <= new Date(event.end)
      ).length,
      overdue: events.filter(event => 
        !event.is_completed && 
        new Date(event.end) < today
      ).length,
      onSchedule: events.filter(event => 
        !event.is_completed && 
        new Date(event.start) > today
      ).length
    };

    return { taskStats, eventStats };
  }, [tasks, events]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tasksData, eventsData] = await Promise.all([
          api.fetchTasks(),
          api.fetchEvents()
        ]);
        setTasks(tasksData);
        setEvents(eventsData);
      } catch (error) {
        console.error('加载数据时出错:', error);
      }
    };
    loadData();
  }, []);

  const handleDragEnd = useCallback(async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const task = tasks.find(t => t.id.toString() === draggableId);

    if (!task) return;

    if (destination.droppableId === 'recycleBin') {
      try {
        await fetch(`${API_BASE_URL}/tasks/${task.id}`, { method: 'DELETE' });
        setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
      } catch (error) {
        console.error('删除任务时出错:', error);
      }
      return;
    }

    if (source.droppableId === 'taskList' && destination.droppableId.startsWith('calendar-')) {
      const dateString = destination.droppableId.split('calendar-')[1];
      const startDate = moment(dateString).hour(8).minute(0).second(0).millisecond(0).toDate();
      const endDate = addWorkingDays(startDate, task.duration);

      const newEvent = {
        task_content: task.content,
        applicant: task.applicant,
        apply_date: task.apply_date,
        responsible: "AE负责人",
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        originalStart: startDate.toISOString(),
        originalEnd: endDate.toISOString(),
        duration: task.duration
      };

      try {
        const assignedEvent = await api.assignTask(task.id, newEvent);
        setEvents(prevEvents => [...prevEvents, assignedEvent]);
        setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
        setUpdateTrigger(prev => prev + 1);
      } catch (error) {
        console.error('分配任务时出错:', error);
      }
    }
  }, [tasks]);

  const handleSelectEvent = useCallback(async (event) => {
    const startDate = moment(event.originalStart || event.start).format('YYYY-MM-DD');
    const endDate = moment(event.originalEnd || event.end).format('YYYY-MM-DD');
    const duration = event.duration || moment(endDate).diff(moment(startDate), 'days') + 1;

    const message = `任务信息：
任务名称: ${event.task_content}
工期: ${duration} 天
原始分配的起始日期: ${startDate}
原始分配的结束日期: ${endDate}

请选择操作:
1. 退回任务列表
2. 确认任务完成
3. 取消

请输入选项编号:`;

    const choice = window.prompt(message);
    
    try {
      switch(choice) {
        case '1':
          await api.returnTask(event.id);
          await api.fetchTasks().then(setTasks);
          setEvents(prevEvents => prevEvents.filter(e => e.id !== event.id));
          break;
        case '2':
          const updatedEvent = await api.completeTask(event.id, event);
          setEvents(prevEvents => prevEvents.map(e => 
            e.id === updatedEvent.id ? { ...updatedEvent, start: new Date(updatedEvent.start), end: new Date(updatedEvent.end) } : e
          ));
          break;
      }
      setUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error('处理事件时出错:', error);
    }
  }, []);

  const eventStyleGetter = useCallback((event) => {
    return { style: event.style };
  }, []);

  const exportToCSV = useCallback(() => {
    const fields = [
      'id', 'content', 'applicant', 'apply_date', 'due_date', 'duration',
      'task_content', 'responsible', 'is_completed', 'start', 'end', 'status'
    ];

    const allData = [
      ...tasks.map(task => ({
        ...task,
        status: '未分配'
      })),
      ...events.map(event => ({
        id: event.id,
        content: event.task_content,
        applicant: event.applicant,
        apply_date: event.apply_date,
        due_date: event.due_date,
        duration: event.duration,
        task_content: event.task_content,
        responsible: event.responsible,
        is_completed: event.is_completed ? '1' : '0',
        start: event.start ? new Date(event.start).toISOString() : '',
        end: event.end ? new Date(event.end).toISOString() : '',
        status: event.is_completed ? '已完成' : '已分配'
      }))
    ];

    const csvContent = fields.join(',') + '\n' + 
      allData.map(item => 
        fields.map(field => {
          const value = item[field] !== undefined ? item[field] : '';
          return typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        }).join(',')
      ).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'tasks_and_events.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [tasks, events]);

  const importFromCSV = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        complete: async (results) => {
          const importedData = results.data.filter(row => row.id && row.id.trim() !== '');
          let newTasks = 0;
          let skippedTasks = 0;

          for (const row of importedData) {
            const taskData = {
              content: row.content,
              applicant: row.applicant,
              apply_date: row.apply_date,
              due_date: row.due_date,
              duration: parseInt(row.duration)
            };

            try {
              const response = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
              });
              if (response.ok) {
                newTasks++;
              } else {
                skippedTasks++;
              }
            } catch (error) {
              console.error('导入任务时出错:', error);
              skippedTasks++;
            }
          }

          alert(`导入完成。\n新增任务: ${newTasks}\n跳过重复任务: ${skippedTasks}`);
          await api.fetchTasks().then(setTasks);
        },
        header: true,
        skipEmptyLines: true
      });
    }
  }, []);

  const importExternalData = useCallback(async () => {
    try {
      const response = await fetch('https://opensheet.elk.sh/1ge-pyzr0uMTxlALiiUh_sEzdVo1ikGJGavLF04u6AVU/4');
      if (!response.ok) throw new Error('获取外部数据失败');
      const data = await response.json();

      let newTasks = 0;
      let skippedTasks = 0;

      for (const item of data) {
        if (item['完成状态'] === '未完成') {
          const estimatedHours = parseInt(item['预估工时']) || 0;
          const taskData = {
            content: `${item['治具名称']} -${item['预估工时']}H - ${item['工单号']} `,
            applicant: item['申请人'],
            apply_date: item['申请日期'],
            due_date: item['需求日期'],
            duration: calculateWorkingDays(estimatedHours)
          };

          try {
            const response = await fetch(`${API_BASE_URL}/tasks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(taskData)
            });
            if (response.ok) {
              newTasks++;
            } else {
              skippedTasks++;
            }
          } catch (error) {
            console.error('创建任务时出错:', error);
            skippedTasks++;
          }
        }
      }

      alert(`导入完成。\n新增任务: ${newTasks}\n跳过重复任务: ${skippedTasks}`);
      await api.fetchTasks().then(setTasks);
    } catch (error) {
      console.error('导入外部数据时出错:', error);
      alert('导入外部数据失败，请查看控制台了解详细错误信息。');
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed]);

  return (
    <div className="flex h-screen overflow-hidden">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className={`flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
          isCollapsed ? 'w-10' : 'w-64'
        }`}>
          <TaskList 
            tasks={tasks} 
            isCollapsed={isCollapsed} 
            toggleSidebar={toggleSidebar}
            exportToCSV={exportToCSV}
            importFromCSV={importFromCSV}
            importExternalData={importExternalData}
          />
        </div>

        <div className="flex-grow flex min-w-0">
          <div className="w-[90%] p-4 overflow-auto">
            <div className="h-full">
              <CustomCalendar
                localizer={localizer}
                events={processedEvents}
                components={{
                  dateCellWrapper: DateCellWrapper,
                }}
                handleSelectEvent={handleSelectEvent}
                eventStyleGetter={eventStyleGetter}
                updateTrigger={updateTrigger}
              />
            </div>
          </div>

          <div className="w-[10%] flex-shrink-0 p-4 bg-gray-100 overflow-y-auto">
            <Dashboard taskStats={taskStats} eventStats={eventStats} events={events} tasks={tasks} />
            <div className="mt-4">
              <RecycleBin />
            </div>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

export default ToDoAssignmentSystem;
