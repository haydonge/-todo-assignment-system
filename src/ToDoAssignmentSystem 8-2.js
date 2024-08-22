import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import Papa from 'papaparse';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CustomBigCalendar.css';

const localizer = momentLocalizer(moment);

const TaskList = React.memo(({ tasks }) => {
  return (
    <Droppable droppableId="taskList" type="TASK">
      {(provided, snapshot) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className={`w-1/3 p-4 ${snapshot.isDraggingOver ? 'bg-blue-100' : 'bg-gray-100'} overflow-y-auto`}
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
  );
});

const ToDoAssignmentSystem = () => {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [draggingDate, setDraggingDate] = useState(null);

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
  }, []);
  const onDragEnd = useCallback((result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const task = tasks.find(t => t.id === draggableId);

    if (source.droppableId === 'taskList' && destination.droppableId.startsWith('calendar-')) {
      // const startDate = new Date(destination.droppableId.split('calendar-')[1]);
      const dateString = destination.droppableId.split('calendar-')[1];
      const startDate = moment(dateString).toDate();
      console.log(startDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + task.duration ); // 减去1天，因为开始日期也算一天

      if (endDate > new Date(task.dueDate)) {
        alert('警告：任务分配可能超过截止日期！');
      }

      const newEvent = {
        id: task.id,
        title: task.content,
        start: startDate,
        end: endDate,
        resource: task, // 保存完整的任务信息
      };

      setEvents(prevEvents => [...prevEvents, newEvent]);
      setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
    }
  }, [tasks]);

  const handleSelectSlot = useCallback((slotInfo) => {
    // 处理点击空白日期的逻辑
  }, []);

  const handleSelectEvent = useCallback((event) => {
    const isConfirmed = window.confirm(`是否确认将任务 "${event.title}" 退回到任务列表？`);
    
    if (isConfirmed) {
      // 将事件从日历中移除
      setEvents(prevEvents => prevEvents.filter(e => e.id !== event.id));
      
      // 将任务添加回任务列表
      setTasks(prevTasks => [...prevTasks, event.resource]);
    }
  }, []);

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
    return {
      style: {
        backgroundColor: '#3174ad',
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  }, []);

 const CustomAgenda = ({ events, date }) => {
    const eventsOnDate = events.filter(event => 
      moment(event.start).isSame(date, 'day')
    );

    return (
      <div>
        <div className="rbc-agenda-date-cell">
          {moment(date).format('YYYY-MM-DD')}
        </div>
        {eventsOnDate.map((event, idx) => (
          <div key={idx} className="rbc-agenda-event-cell">
            <span>
              <strong>{moment(event.start).format('HH:mm')}: {event.title}</strong>
              {event.resource && (
                <>
                  <br />
                  <small>申请人: {event.resource.applicant}</small>
                  <br />
                  <small>工期: {event.resource.duration} 天</small>
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    );
  };
  const customComponents = {
    dateCellWrapper: renderDateCellWrapper,
    agenda: {
      event: ({ event }) => (
        <span>
          {moment(event.start).format('YYYY-MM-DD')}: {event.title}
          {event.resource && (
            <>
              <br />
              <small>申请人: {event.resource.applicant}</small>
              <br />
              <small>工期: {event.resource.duration} 天</small>
            </>
          )}
        </span>
      ),
      date: ({ label }) => (
        <span>{label}</span>
      ),
    },
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
    <div className="flex h-screen">
      <TaskList tasks={tasks} />
      <div className="w-2/3 p-4">
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
              return `all day`;
            },
          }}
        />
      </div>
    </div>
  </DragDropContext>
);
};

export default ToDoAssignmentSystem;