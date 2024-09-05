import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import Papa from 'papaparse';
import { Trash2 } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CustomBigCalendar.css';

const localizer = momentLocalizer(moment);

const API_BASE_URL = 'https://todo.knowivf.ac.cn'; // 替换为您的实际API基础URL

const RecycleBin = ({ isOver }) => (
  <div className={`flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full ${isOver ? 'bg-red-200' : ''}`}>
    <Trash2 size={32} className={`text-gray-600 ${isOver ? 'text-red-600' : ''}`} />
  </div>
);

const TaskList = React.memo(({ tasks, isCollapsed, toggleSidebar, exportToCSV, importFromCSV }) => {
  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-1/5'} bg-gray-100`}>
      <button
        onClick={toggleSidebar}
        className="w-full py-2 bg-blue-500 text-white font-bold"
      >
        {isCollapsed ? '>' : '<'}
      </button>
      {!isCollapsed && (
        <Droppable droppableId="taskList" type="TASK">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`p-4 ${snapshot.isDraggingOver ? 'bg-blue-100' : ''} overflow-y-auto h-[calc(80vh-120px)]`}
            >
              <h2 className="text-xl font-bold mb-4">任务列表</h2>
              {tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`task-item ${snapshot.isDragging ? 'dragging' : ''}`}
                    >
                      <h3 className="font-bold">{task.content}</h3>
                      <p>申请人: {task.applicant}</p>
                      <p>截止日期: {task.due_date}</p>
                      <p>工期: {task.duration} 天</p>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <Droppable droppableId="recycleBin" type="TASK">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="mt-auto p-4 flex justify-center"
              >
                <RecycleBin isOver={snapshot.isDraggingOver} />
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <button 
            onClick={exportToCSV}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2"
          >
            导出CSV
          </button>
          <button 
            onClick={handleImportClick}
            className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            导入CSV
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={importFromCSV}
            style={{ display: 'none' }}
            accept=".csv"
          />
        </div>
      )}
    </div>
  );
});

const ToDoAssignmentSystem = () => {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(true);
  // const [isLoading, setIsLoading] = useState(false);

 
  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`);
      if (!response.ok) throw new Error('获取任务失败');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('获取任务时出错:', error);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/events`);
      if (!response.ok) throw new Error('获取事件失败');
      const data = await response.json();
      setEvents(data.map(event => ({
        ...event,
        title: event.task_content,
        start: new Date(event.start),
        end: new Date(event.end)
      })));
    } catch (error) {
      console.error('获取事件时出错:', error);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchEvents();
  }, [fetchTasks, fetchEvents]);


  //拖拽

  
  const onDragEnd = useCallback(async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const task = tasks.find(t => t.id.toString() === draggableId);

    if (destination.droppableId === 'recycleBin') {
      try {
        const response = await fetch(`${API_BASE_URL}/tasks/${task.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('删除任务失败');
        setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
      } catch (error) {
        console.error('删除任务时出错:', error);
      }
      return;
    }

    if (source.droppableId === 'taskList' && destination.droppableId.startsWith('calendar-')) {
      const dateString = destination.droppableId.split('calendar-')[1];
      const startDate = moment(dateString).toDate();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + task.duration);

      const assignData = {
        responsible: "默认负责人", // 这里可以添加一个方式来设置负责人
        start: startDate.toISOString(),
        end: endDate.toISOString()
      };

      try {
        const response = await fetch(`${API_BASE_URL}/assign/${task.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assignData)
        });
        if (!response.ok) throw new Error('分配任务失败');

        const assignedEvent = await response.json();
        setEvents(prevEvents => [...prevEvents, {
          ...assignedEvent,
          title: assignedEvent.task_content,
          start: new Date(assignedEvent.start),
          end: new Date(assignedEvent.end)
        }]);
        setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
        window.location.reload();

      } catch (error) {
        console.error('分配任务时出错:', error);
      }
    }
  }, [tasks]);

  const returnTaskToList = useCallback(async (event) => {
    try {
      const response = await fetch(`${API_BASE_URL}/return/${event.id}`, { method: 'POST' });
      if (!response.ok) throw new Error('退回任务失败');
      await fetchTasks(); // 重新获取任务列表
      setEvents(prevEvents => prevEvents.filter(e => e.id !== event.id));
    } catch (error) {
      console.error('退回任务时出错:', error);
    }
  }, [fetchTasks]);

 
  const completeTask = useCallback(async (event) => {
    try {
      const updatedEvent = { ...event, is_completed: 1 };
      const response = await fetch(`${API_BASE_URL}/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEvent)
      });
      if (!response.ok) throw new Error('更新事件失败');
      const updatedEventData = await response.json();
      setEvents(prevEvents => prevEvents.map(e => 
        e.id === updatedEventData.id ? { ...updatedEventData, start: new Date(updatedEventData.start), end: new Date(updatedEventData.end) } : e
      ));
    } catch (error) {
      console.error('完成任务时出错:', error);
    }
  }, []);

  const handleSelectEvent = useCallback(async (event) => {
    const options = ['退回任务列表', '确认任务完成', '取消'];
    const choice = window.prompt(`请选择操作:\n1. ${options[0]}\n2. ${options[1]}\n3. ${options[2]}\n\n请输入选项编号:`);
    
    switch(choice) {
      case '1':
        await returnTaskToList(event);
        break;
      case '2':
        await completeTask(event);
        window.location.reload();
        break;
      case '3':
      default:
        // 取消操作，不做任何事
        break;
    }
  }, [returnTaskToList, completeTask]);

 


  const renderDateCellWrapper = useCallback(({ children, value }) => (
    <Droppable droppableId={`calendar-${value.toISOString()}`} type="TASK">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`rbc-day-bg ${snapshot.isDraggingOver ? 'highlight' : ''}`}
          style={{ position: 'relative', height: '100%' }}
        >
          {children}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
 ), []);



  const eventStyleGetter = useCallback((event) => {
    let style = {
      backgroundColor: '#3174ad',
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    };
  
    const today = new Date();
    today.setHours(0, 0, 0, 0);  // Set to start of day for accurate comparison
  
    if (event.is_completed) {
      style.backgroundColor = '#28a745';  // Green for completed tasks
    } else if (new Date(event.end) < today) {
      style.backgroundColor = '#dc3545';  // Red for overdue tasks
    } else if (new Date(event.start) <= today && today <= new Date(event.end)) {
      style.backgroundColor = '#ffc107';  // Yellow for ongoing tasks
    }
  
    return { style };
  }, []);


  const exportToCSV = () => {
    // 定义所有可能的字段
    const fields = [
      'id', 'content', 'applicant', 'apply_date', 'due_date', 'duration',
      'task_content', 'responsible', 'is_completed', 'start', 'end', 'status'
    ];
  
    // 合并 tasks 和 events 数据
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
  
    // 创建 CSV 内容
    let csvContent = fields.join(',') + '\n';  // 添加标题行
  
    allData.forEach(item => {
      const row = fields.map(field => {
        const value = item[field] !== undefined ? item[field] : '';
        // 如果值包含逗号、换行符或双引号，将其包裹在双引号中
        if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
      csvContent += row + '\n';
    });
  
    // 添加 BOM (Byte Order Mark) 以确保 Excel 正确识别 UTF-8 编码
    const BOM = '\uFEFF';
    csvContent = BOM + csvContent;
  
    // 创建 Blob 对象
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 创建下载链接
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'tasks_and_events.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const importFromCSV = async (e) => {
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

            // 检查是否在任务列表中存在重复
            const isDuplicateTask = tasks.some(task => 
              task.content === taskData.content &&
              task.applicant === taskData.applicant &&
              task.apply_date === taskData.apply_date
            );

            // 检查是否在事件列表中存在重复
            const isDuplicateEvent = events.some(event => 
              event.task_content === taskData.content &&
              event.applicant === taskData.applicant &&
              event.apply_date === taskData.apply_date
            );

            if (!isDuplicateTask && !isDuplicateEvent) {
              try {
                const response = await fetch(`${API_BASE_URL}/tasks`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(taskData)
                });
                if (!response.ok) throw new Error('创建任务失败');
                newTasks++;
              } catch (error) {
                console.error('创建任务时出错:', error);
              }
            } else {
              skippedTasks++;
            }
          }

          // 刷新任务列表
          await fetchTasks();

          alert(`导入完成。\n新增任务: ${newTasks}\n跳过重复任务: ${skippedTasks}`);
        },
        header: true,
        skipEmptyLines: true
      });
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const CustomAgendaEvent = ({ event }) => (
    <div className="custom-agenda-event">
      <div className="agenda-event-title">{event.task_content}</div>
      <div className="agenda-event-details">
        <div>申请人: {event.applicant}</div>
        <div>负责人: {event.responsible}</div>
        <div>工期: {event.duration} 天</div>
      </div>
    </div>
  );

  const CustomAgendaDate = ({ label }) => (
    <span>{moment(label).format('YYYY-MM-DD')}</span>
  );

  const CustomAgendaTime = ({ event }) => (
    <span>{moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}</span>
  );

  const customComponents = {
    dateCellWrapper: renderDateCellWrapper,
    agenda: {
      event: CustomAgendaEvent,
      date: CustomAgendaDate,
      time: CustomAgendaTime,
    },
  };

  return (
    <div className="relative">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex h-screen">
          <TaskList 
            tasks={tasks} 
            isCollapsed={isCollapsed} 
            toggleSidebar={toggleSidebar}
            exportToCSV={exportToCSV}
            importFromCSV={importFromCSV}
          />
          <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[calc(100%-4rem)]' : 'w-2/3'} p-4`}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 'calc(100vh - 2rem)' }}
              components={customComponents}
              onSelectEvent={handleSelectEvent}
              selectable
              eventPropGetter={eventStyleGetter}
              formats={{
                agendaDateFormat: 'YYYY-MM-DD',
                agendaTimeRangeFormat: ({ start, end }) => {
                  return `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`;
                },
              }}
            />
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

export default ToDoAssignmentSystem;