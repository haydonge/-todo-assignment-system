import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import Papa from 'papaparse';
import { Trash2 } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CustomBigCalendar.css';
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from './api/api'



const localizer = momentLocalizer(moment);

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
    <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-1/3'} bg-gray-100`}>
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
              className={`p-4 ${snapshot.isDraggingOver ? 'bg-blue-100' : ''} overflow-y-auto h-[calc(100vh-120px)]`}
            >
              <h2 className="text-xl font-bold mb-4">任务列表</h2>
              {tasks.map((task, index) => (
                  <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`task-item ${snapshot.isDragging ? 'dragging' : ''}`}
                      >
                        <h3 className="font-bold">{task.content}</h3>
                        <p>申请人: {task.applicant}</p>
                        <p>截止日期: {task.dueDate}</p>
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [duplicateTask, setDuplicateTask] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tasksData, eventsData] = await Promise.all([fetchTasks(), fetchEvents()]);
        console.log('Loaded tasks:', tasksData);
        
        // 过滤出未分配的任务
        const unassignedTasks = tasksData.filter(task => 
          !task.is_completed && !eventsData.some(event => event.taskId === task.id)
        );
        
        setTasks(unassignedTasks);
        
        setEvents(eventsData.map(event => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
          title: event.title || event.content,
          resource: tasksData.find(task => task.id === event.taskId)
        })));
      } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load data. Please try again later.');
      }
    };
    loadData();
  }, [lastUpdate]);

  //111111111111111111111111

  const onDragEnd = useCallback(async (result) => {
    if (!result.destination) return;
  
    const { source, destination, draggableId } = result;
    
    const task = tasks.find(t => t.id.toString() === draggableId);
  
    if (!task) {
      console.error(`Task with id ${draggableId} not found.`);
      return;
    }

    if (destination.droppableId === 'recycleBin') {
      try {
        await deleteTask(task.id);
        setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task. Please try again.');
      }
      return;
    }

    if (source.droppableId === 'taskList' && destination.droppableId.startsWith('calendar-')) {
      const dateString = destination.droppableId.split('calendar-')[1];
      const startDate = moment(dateString).toDate();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + task.duration);

      let isOverdue = false;
      if (endDate > new Date(task.dueDate)) {
        alert('警告：任务分配可能超过截止日期！');
        isOverdue = true;
      }

      const newEvent = {
        taskId: task.id,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      };

      try {
        const createdEvent = await createEvent(newEvent);
        const updatedTask = await updateTask(task.id, { ...task, is_completed: false });
        
        // 更新日历事件状态
        setEvents(prevEvents => [...prevEvents, {
          ...createdEvent,
          start: new Date(createdEvent.start),
          end: new Date(createdEvent.end),
          title: task.content,
          resource: updatedTask,
          isOverdue: isOverdue
        }]);
  
        // 从任务列表中移除任务
        setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));

        // 立即更新数据库中的任务状态
        await updateTask(task.id, { ...task, is_completed: false });
      } catch (error) {
        console.error('Error creating event:', error);
        alert('Failed to assign task. Please try again.');
      }
    }
  }, [tasks, events]);





  //222222222222222222222222



  const handleDuplicateTask = (action) => {
    if (action === 'overwrite') {
      setEvents(prevEvents => [
        ...prevEvents.filter(e => e.id !== duplicateTask.existing.id),
        duplicateTask.new
      ]);
      setTasks(prevTasks => prevTasks.filter(t => t.id !== duplicateTask.new.id));
    }
    // If action is 'cancel', we don't need to do anything
    setDuplicateTask(null);
  };

  const handleSelectSlot = useCallback((slotInfo) => {
    // 处理点击空白日期的逻辑
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
        break;
      case '3':
      default:
        // 取消操作，不做任何事
        break;
    }
  }, [tasks]);

  const returnTaskToList = async (event) => {
    try {
      await deleteEvent(event.id);
      const updatedTask = await updateTask(event.resource.id, { ...event.resource, is_completed: null });
      setTasks(prevTasks => [...prevTasks, updatedTask]);
      setEvents(prevEvents => prevEvents.filter(e => e.id !== event.id));
    } catch (error) {
      console.error('Error returning task to list:', error);
      alert('Failed to return task to list. Please try again.');
    }
  };


  const completeTask = async (event) => {
    try {
      const updatedEvent = await updateEvent(event.id, { ...event, is_completed: true });
      const updatedTask = await updateTask(event.resource.id, { ...event.resource, is_completed: true });
      setEvents(prevEvents => prevEvents.map(e => 
        e.id === updatedEvent.id ? { ...updatedEvent, isCompleted: true } : e
      ));
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task. Please try again.');
    }
  };

// 新加的选项  



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


  //根据任务栏状态，分配颜色
  const eventStyleGetter = useCallback((event, start, end, isSelected) => {
    let style = {
      backgroundColor: '#3174ad',
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block',
      overflow: 'hidden',
      whiteSpace: 'normal', // 允许文本换行
      height: '100%',
      fontSize: '12px',
      padding: '2px'
    };

    if (event.isCompleted) {
      style.backgroundColor = '#28a745';  // 绿色
    } else if (event.isOverdue) {
      style.backgroundColor = '#FFC0CB';
      style.color = 'black';
    }

    return { style };
  }, []);


  const CustomAgendaEvent = ({ event }) => (
    <div className="custom-agenda-event">
      <div className="agenda-event-title">{event.title}</div>
      <div className="agenda-event-details">
        <div>申请人: {event.resource?.applicant || 'N/A'}</div>
        <div>工期: {event.resource?.duration || 'N/A'} 天</div>
      </div>
    </div>
  );

  const CustomAgendaDate = ({ label }) => (
    <span>{moment(label).format('ddd MMM DD')}</span>
  );

  const CustomAgendaTime = ({ event }) => (
    <span>{moment(event.start).format('h:mm a')} - {moment(event.end).format('h:mm a')}</span>
  );

  const customComponents = {
    dateCellWrapper: renderDateCellWrapper,
    agenda: {
      event: CustomAgendaEvent,
      date: CustomAgendaDate,
      time: CustomAgendaTime,
    },
  };


  const exportToCSV = () => {
    const allTasks = [
      ...events.map(event => ({
        content: event.title,
        applyDate: moment(event.start).format('YYYY-MM-DD'),
        dueDate: event.resource.dueDate,
        applicant: event.resource.applicant,
        responsible: event.resource.responsible,
        duration: event.resource.duration,
        isCompleted: event.isCompleted ? '已完成' : '未完成'
      })),
      ...tasks.map(task => ({
        content: task.content,
        applyDate: task.applyDate || '',
        dueDate: task.dueDate,
        applicant: task.applicant,
        responsible: task.responsible,
        duration: task.duration,
        isCompleted: '未分配'
      }))
    ];
  
    const csv = Papa.unparse(allTasks);
    const BOM = '\uFEFF';
    const csvContent = BOM + csv;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'all_tasks_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  const importFromCSV = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        complete: async (results) => {
          const importedData = results.data.filter(row => row.content && row.content.trim() !== '');
          const newTasks = [];
          const newEvents = [];
  
          for (const row of importedData) {
            const taskData = {
              content: row.content?.trim() || '',
              applicant: row.applicant?.trim() || '',
              responsible: row.responsible?.trim() || '',
              duration: parseInt(row.duration) || 0,
              dueDate: row.dueDate?.trim() || '',
              applyDate: row.applyDate?.trim() || '',
              is_completed: row.isCompleted === '已完成'
            };
  
            try {
              let createdTask;
              if (taskData.is_completed || row.isCompleted === '未完成') {
                // 创建任务
                createdTask = await createTask(taskData);
  
                // 如果任务已分配（无论是已完成还是未完成），创建对应的事件
                const startDate = new Date(taskData.applyDate);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + taskData.duration);
  
                const createdEvent = await createEvent({
                  taskId: createdTask.id,
                  start: startDate.toISOString(),
                  end: endDate.toISOString(),
                });
  
                newEvents.push({
                  ...createdEvent,
                  start: new Date(createdEvent.start),
                  end: new Date(createdEvent.end),
                  title: taskData.content,
                  resource: createdTask,
                  isCompleted: taskData.is_completed
                });
              } else {
                // 如果任务未分配，只创建任务不创建事件
                createdTask = await createTask(taskData);
                newTasks.push(createdTask);
              }
            } catch (error) {
              console.error('Error importing task/event:', error);
            }
          }
  
          setTasks(prevTasks => [...prevTasks, ...newTasks]);
          setEvents(prevEvents => [...prevEvents, ...newEvents]);
  
          alert(`成功导入 ${newTasks.length} 个新的待分配任务和 ${newEvents.length} 个新的日历事件。`);
        },
        header: true,
        skipEmptyLines: true
      });
    }
  };



//  new import action to identify duplicate task


const toggleSidebar = () => {
  setIsCollapsed(!isCollapsed);
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
      onSelectSlot={handleSelectSlot}
      onSelectEvent={handleSelectEvent}
      selectable
      eventPropGetter={eventStyleGetter}
      formats={{
        eventTimeRangeFormat: () => null, // 不显示事件的时间范围
        agendaDateFormat: 'YYYY-MM-DD',
        agendaTimeRangeFormat: ({ start, end }) => {
          return `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`;
        },
      }}
    />
        </div>
      </div>
    </DragDropContext>

      {duplicateTask && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 10000 }}>
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="bg-white p-6 rounded-lg shadow-lg relative z-10">
            <h2 className="text-xl font-bold mb-4">任务重复</h2>
            <p>已存在相同内容的任务。您想要：</p>
            <div className="mt-4 flex justify-end space-x-4">
              <button 
                onClick={() => handleDuplicateTask('overwrite')}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                覆盖现有任务
              </button>
              <button 
                onClick={() => handleDuplicateTask('cancel')}
                className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded"
              >
                取消任务安排
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default ToDoAssignmentSystem;