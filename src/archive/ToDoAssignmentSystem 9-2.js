import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import Papa from 'papaparse';
import { Trash2 } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CustomBigCalendar.css';

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
                <Draggable key={task.id} draggableId={task.id} index={index}>
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

  useEffect(() => {
    const storedTasks = localStorage.getItem('todoTasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    } else {
      // If no stored tasks, load from mock CSV
      const mockCSV = `id,applicant,applyDate,dueDate,duration,content,responsible
                        1,张三,2024-07-28,2024-08-05,5,完成报告,李四
                        2,王五,2024-07-29,2024-08-10,3,客户会议,赵六
                        3,赵六,2024-08-01,2024-08-25,10,项目开发,李四
                        4,李四,2024-07-29,2024-08-10,3,项目审核,王五
                        5,刘七,2024-07-29,2024-08-10,3,开发程序,张三`;

      Papa.parse(mockCSV, {
        header: true,
        complete: (results) => {
          const parsedTasks = results.data.map(task => ({
            ...task,
            duration: parseInt(task.duration)
          }));
          setTasks(parsedTasks);
          localStorage.setItem('todoTasks', JSON.stringify(parsedTasks));
        }
      });
    }
    
    const storedEvents = localStorage.getItem('agendaEvents');
    if (storedEvents) {
      setEvents(JSON.parse(storedEvents).map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
      })));
    }
  }, []);


  useEffect(() => {
    // Save events to localStorage whenever they change
    localStorage.setItem('agendaEvents', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    // Save tasks to localStorage whenever they change
    localStorage.setItem('todoTasks', JSON.stringify(tasks));
  }, [tasks]);

 // 新加的选项



 const onDragEnd = useCallback((result) => {
  if (!result.destination) return;

  const { source, destination, draggableId } = result;
  const task = tasks.find(t => t.id === draggableId);


    if (destination.droppableId === 'recycleBin') {
    // Delete the task
    setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
    return;
  }


  //  new 
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
      id: task.id,
      title: task.content,
      start: startDate,
      end: endDate,
      resource: task,
      isOverdue: isOverdue
    };

    const existingEvent = events.find(e => e.title === newEvent.title && e.resource.applicant === newEvent.resource.applicant);

    if (existingEvent) {
      setDuplicateTask({ existing: existingEvent, new: newEvent });
    } else {
      setEvents(prevEvents => [...prevEvents, newEvent]);
      setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
    }
  }
}, [tasks, events]);



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


  const handleSelectEvent = useCallback((event) => {
    const options = ['退回任务列表', '确认任务完成', '取消'];
    const choice = window.prompt(`请选择操作:\n1. ${options[0]}\n2. ${options[1]}\n3. ${options[2]}\n\n请输入选项编号:`);
    
    switch(choice) {
      case '1':
        returnTaskToList(event);
        break;
      case '2':
        completeTask(event);
        break;
      case '3':
      default:
        // 取消操作，不做任何事
        break;
    }
  }, [tasks]);


  const returnTaskToList = (event) => {
    const existingTask = tasks.find(t => 
      t.content === event.resource.content && 
      t.applicant === event.resource.applicant
    );

    if (existingTask) {
      const updatedTasks = tasks.map(t => 
        t.id === existingTask.id 
          ? { ...t, duration: t.duration + event.resource.duration }
          : t
      );
      setTasks(updatedTasks);
    } else {
      setTasks(prevTasks => [...prevTasks, event.resource]);
    }

    setEvents(prevEvents => prevEvents.filter(e => e.id !== event.id));
  };

  const completeTask = (event) => {
    setEvents(prevEvents => prevEvents.map(e => 
      e.id === event.id ? { ...e, isCompleted: true } : e
    ));
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
      display: 'block'
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
        <div>申请人: {event.resource.applicant}</div>
        <div>工期: {event.resource.duration} 天</div>
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
    // Export assigned tasks (events)
    const assignedTasks = events.map(event => ({
      id: event.id,
      title: event.title,
      start: moment(event.start).format('YYYY-MM-DD '),
      end: moment(event.end).format('YYYY-MM-DD'),
      dueDate: event.resource.dueDate,
      applicant: event.resource.applicant,
      responsible: event.resource.responsible,
      duration: event.resource.duration,
      status: event.isCompleted ? '已完成' : '已分配'
    }));

    // Export unassigned tasks
    const unassignedTasks = tasks.map(task => ({
      id: task.id,
      title: task.content,
      start: '',
      end: '',
      dueDate: task.dueDate,
      applicant: task.applicant,
      responsible: task.responsible,
      duration: task.duration,
      status: '未分配'
    }));

    // Combine assigned and unassigned tasks
    const allTasks = [...assignedTasks, ...unassignedTasks];

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
        complete: (results) => {
          const importedData = results.data.filter(row => row.id && row.id.trim() !== '');
          const newTasks = [];
          const newEvents = [];

          importedData.forEach((row) => {
            const taskData = {
              id: row.id.trim(),
              content: (row.title || row.content)?.trim() || '',
              applicant: row.applicant?.trim() || '',
              responsible: row.responsible?.trim() || '',
              duration: parseInt(row.duration) || 0,
              dueDate: row.dueDate?.trim() || '',
            };

            if (
              (row.status === '已完成' || row.status === '已分配') &&
              row.start && row.end && taskData.content && taskData.applicant && taskData.responsible
            ) {
              // Create an event for the calendar
              const event = {
                id: taskData.id,
                title: taskData.content,
                start: new Date(row.start),
                end: new Date(row.end),
                resource: taskData,
                isCompleted: row.status === '已完成',
              };
              
              // Check if the event already exists
              const existingEventIndex = events.findIndex(e => e.id === event.id);
              if (existingEventIndex === -1) {
                newEvents.push(event);
              }
            } else {
              // Check if the task already exists in tasks
              const existingTaskIndex = tasks.findIndex(t => t.id === taskData.id);
              if (existingTaskIndex === -1) {
                newTasks.push(taskData);
              }
            }
          });

          setTasks(prevTasks => {
            const updatedTasks = [...prevTasks, ...newTasks];
            localStorage.setItem('todoTasks', JSON.stringify(updatedTasks));
            return updatedTasks;
          });

          setEvents(prevEvents => {
            const updatedEvents = [...prevEvents, ...newEvents];
            localStorage.setItem('agendaEvents', JSON.stringify(updatedEvents));
            return updatedEvents;
          });

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