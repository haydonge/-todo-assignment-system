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
import api from './components/Utils/apiUtils';

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
      let className = '';
      let style = {
        backgroundColor: 'var(--todo-task-not-started)',
        borderRadius: 'var(--todo-border-radius-sm)',
        opacity: 0.8,
        color: 'var(--todo-calendar-event-text)',
        border: '0px',
        display: 'block'
      };

      if (event.is_completed) {
        style.backgroundColor = 'var(--todo-task-completed)';
        className = 'completed';
      } else {
        const end = new Date(event.originalEnd || event.end);
        if (!event.is_completed && end < today) {
          style.backgroundColor = 'var(--todo-task-overdue)';
          className = 'overdue';
        } else if (new Date(event.originalStart || event.start) <= today && today <= end) {
          style.backgroundColor = 'var(--todo-task-in-progress)';
          className = 'in-progress';
        }
      }

      return {
        ...event,
        style,
        className
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
        await fetch(`${api.getBaseUrl()}/tasks/${task.id}`, { method: 'DELETE' });
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
        default:
          console.log('No action selected');
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

    const csvContent = `${fields.join(',')}\n${allData.map(item => 
        fields.map(field => {
          const value = item[field] !== undefined ? item[field] : '';
          return typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        }).join(',')
      ).join('\n')}`;

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
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
              const response = await fetch(`${api.getBaseUrl()}/tasks`, {
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

  const checkTaskUniqueness = useCallback((newTask) => {
    return !tasks.some(task => 
      task.content === newTask.content && 
      task.applicant === newTask.applicant && 
      task.apply_date === newTask.apply_date
    );
  }, [tasks]);

  const checkEventUniqueness = useCallback((newEvent) => {
    return !events.some(event => 
      event.task_content === newEvent.task_content && 
      event.applicant === newEvent.applicant && 
      event.apply_date === newEvent.apply_date
    );
  }, [events]);

  const handleDueDateChange = useCallback(async (existingItem, newTask, isEvent = false) => {
    return new Promise((resolve) => {
      // 创建一个自定义的大窗口样式
      const popupStyle = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        border: 2px solid #4A90E2;
        border-radius: 10px;
        padding: 20px;
        width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1000;
        text-align: center;
      `;

      const buttonsStyle = `
        display: flex;
        justify-content: center;
        margin-top: 20px;
      `;

      const buttonStyle = `
        margin: 0 10px;
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      `;

      const popupHtml = `
        <div style="${popupStyle}">
          <h2>检测到截止日期变化</h2>
          <div style="margin: 15px 0;">
            <h3>原任务信息</h3>
            <p>内容: ${isEvent ? existingItem.task_content : existingItem.content}</p>
            <p>申请人: ${isEvent ? existingItem.applicant : existingItem.applicant}</p>
            <p>申请日期: ${isEvent ? existingItem.apply_date : existingItem.apply_date}</p>
            <p style="color: blue;">原截止日期: ${isEvent ? existingItem.due_date : existingItem.due_date}</p>
            
            <h3 style="margin-top: 15px;">新任务信息</h3>
            <p style="color: green;">新截止日期: ${newTask.due_date}</p>
          </div>
          <div style="${buttonsStyle}">
            <button id="updateButton" style="${buttonStyle} background-color: #4CAF50; color: white;">更新截止日期</button>
            <button id="cancelButton" style="${buttonStyle} background-color: #f44336; color: white;">保留原截止日期</button>
          </div>
        </div>
      `;

      // 创建并显示弹窗
      const popupDiv = document.createElement('div');
      popupDiv.innerHTML = popupHtml;
      document.body.appendChild(popupDiv);

      // 添加按钮事件监听器
      const updateButton = popupDiv.querySelector('#updateButton');
      const cancelButton = popupDiv.querySelector('#cancelButton');

      updateButton.addEventListener('click', () => {
        document.body.removeChild(popupDiv);
        resolve({ action: 'update', item: { ...existingItem, due_date: newTask.due_date } });
      });

      cancelButton.addEventListener('click', () => {
        document.body.removeChild(popupDiv);
        resolve({ action: 'keep' });
      });
    });
  }, []);

  const importExternalData = useCallback(async () => {
    try {
      const response = await fetch('https://opensheet.elk.sh/1ge-pyzr0uMTxlALiiUh_sEzdVo1ikGJGavLF04u6AVU/4');
      const result = await response.json();
      const data = result.map(item => ({
        '治具名称': item['治具名称'],
        '申请人': item['申请人'],
        '申请日期': item['申请日期'],
        '需求日期': item['需求日期'],
        '预估工时': item['预估工时'],
        '工单号': item['工单号'],
        '完成状态': item['完成状态']
      }));
      
      let newTasks = 0;
      let skippedTasks = 0;
      let updatedTasks = 0;

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

          const isUnique = checkTaskUniqueness(taskData) && checkEventUniqueness({
            task_content: taskData.content,
            applicant: taskData.applicant,
            apply_date: taskData.apply_date
          });

          if (isUnique) {
            try {
              await api.createTask(taskData);
              newTasks++;
            } catch (error) {
              console.error('创建任务时出错:', error);
              skippedTasks++;
            }
          } else {
            // 检查是否有截止日期变化
            const existingTask = tasks.find(task => 
              task.content === taskData.content && 
              task.applicant === taskData.applicant && 
              task.apply_date === taskData.apply_date
            );

            const existingEvent = events.find(event => 
              event.task_content === taskData.content && 
              event.applicant === taskData.applicant && 
              event.apply_date === taskData.apply_date
            );

            if (existingTask && existingTask.due_date !== taskData.due_date) {
              const result = await handleDueDateChange(existingTask, taskData);
              
              if (result.action === 'update') {
                try {
                  await api.updateTask(existingTask.id, result.item);
                  updatedTasks++;
                } catch (error) {
                  console.error('更新任务时出错:', error);
                }
              }
            } else if (existingEvent && existingEvent.due_date !== taskData.due_date) {
              const result = await handleDueDateChange(existingEvent, taskData, true);
              
              if (result.action === 'update') {
                try {
                  await api.updateEvent(existingEvent.id, result.item);
                  updatedTasks++;
                } catch (error) {
                  console.error('更新事件时出错:', error);
                }
              }
            }
            
            skippedTasks++;
          }
        }
      }

      await api.fetchTasks().then(setTasks);
      alert(`导入完成。\n新增任务: ${newTasks}\n跳过重复任务: ${skippedTasks}\n更新任务: ${updatedTasks}`);
    } catch (error) {
      console.error('导入外部数据时出错:', error);
      alert('导入外部数据失败，请查看控制台了解详细错误信息。');
    }
  }, [checkTaskUniqueness, checkEventUniqueness, tasks, events, handleDueDateChange]);

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
