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
    const mockCSV = `id,applicant,applyDate,dueDate,duration,content,responsible
1,张三,2024-07-28,2024-08-05,5,完成报告,李四
2,王五,2024-07-29,2024-08-10,3,客户会议,赵六
3,赵六,2024-08-01,2024-08-25,10,项目开发,李四
4,李四,2024-07-29,2024-08-10,3,项目审核,王五
5,刘七,2024-07-29,2024-08-10,3,开发程序,张三`;

    Papa.parse(mockCSV, {
      header: true,
      complete: (results) => {
        setTasks(results.data.map(task => ({
          ...task,
          duration: parseInt(task.duration)
        })));
      }
    });
    
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
    localStorage.setItem('agendaEvents', JSON.stringify(events));
  }, [events]);

  const onDragEnd = useCallback((result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const task = tasks.find(t => t.id === draggableId);

    if (destination.droppableId === 'recycleBin') {
      // Delete the task
      setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
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
    const isConfirmed = window.confirm(`是否确认将任务 "${event.title}" 退回到任务列表？`);
    
    if (isConfirmed) {
      const existingTask = tasks.find(t => 
        t.content === event.resource.content && 
        t.applicant === event.resource.applicant
      );

      if (existingTask) {
        // 如果存在重复任务，合并任务
        const updatedTasks = tasks.map(t => 
          t.id === existingTask.id 
            ? { ...t, duration: t.duration + event.resource.duration }
            : t
        );
        setTasks(updatedTasks);
      } else {
        // 如果不存在重复任务，添加新任务
        setTasks(prevTasks => [...prevTasks, event.resource]);
      }

      // 从日历中删除事件
      setEvents(prevEvents => prevEvents.filter(e => e.id !== event.id));
    }
  }, [tasks]);




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

  const eventStyleGetter = useCallback((event, start, end, isSelected) => {
    let style = {
      backgroundColor: '#3174ad',
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    };

    if (event.isOverdue) {
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
    const csvData = events.map(event => ({
      id: event.id,
      title: event.title,
      start: moment(event.start).format('YYYY-MM-DD HH:mm'),
      end: moment(event.end).format('YYYY-MM-DD HH:mm'),
      dueDate: event.resource.dueDate,
      applicant: event.resource.applicant,
      responsible: event.resource.responsible,
      duration: event.resource.duration
    }));

    const csv = Papa.unparse(csvData);
    const BOM = '\uFEFF';
    const csvContent = BOM + csv;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'agenda_export.csv');
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
          const importedTasks = results.data
            .filter(row => row.id && row.id.trim() !== '') // Filter out rows with empty id
            .map((row, index) => ({
              id: row.id.trim(),
              applicant: row.applicant?.trim() || '',
              applyDate: row.applyDate?.trim() || '',
              dueDate: row.dueDate?.trim() || '',
              duration: parseInt(row.duration) || 0,
              content: (row.title || row.content)?.trim() || '',
              responsible: row.responsible?.trim() || ''
            }));
          
          if (importedTasks.length > 0) {
            setTasks(prevTasks => [...prevTasks, ...importedTasks]);
            alert(`成功导入 ${importedTasks.length} 个任务。`);
          } else {
            alert('没有有效的任务数据被导入。请确保 CSV 文件包含有效的任务数据，且每个任务都有一个非空的 id。');
          }
        },
        header: true,
        skipEmptyLines: true // Skip empty lines in the CSV file
      });
    }
  };
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="relative">  {/* Add this wrapper div */}
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
        <div className="fixed inset-0 bg-black bg-opacity-100 flex items-center justify-center" style={{ zIndex: 100 }}>
          <div className="bg-white p-6 rounded-lg shadow-lg">
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