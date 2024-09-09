import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import Papa from 'papaparse';
import { Trash2 } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CustomBigCalendar.css';
import Dashboard from './components/Dashbaords'; // 确保导入新创建的 Dashboard 组件


const localizer = momentLocalizer(moment);

const API_BASE_URL = 'https://todo.knowivf.ac.cn'; // 替换为您的实际API基础URL

const RecycleBin = ({ isOver }) => (
  <div className={`flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full ${isOver ? 'bg-red-200' : ''}`}>
    <Trash2 size={32} className={`text-gray-600 ${isOver ? 'text-red-600' : ''}`} />
  </div>
);



const ToDoAssignmentSystem = () => {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const calculateStats = useCallback(() => {
    const taskStats = {
      total: tasks.length,
    };

    const today = new Date();
    const eventStats = {
      total: events.length,
      completed: events.filter(event => event.is_completed).length,
      inProgress: events.filter(event => 
        new Date(event.start) <= today && today <= new Date(event.end) && !event.is_completed
      ).length,
      overdue: events.filter(event => 
        new Date(event.end) < today && !event.is_completed
      ).length,
    };

    return { taskStats, eventStats };
  }, [tasks, events]);

  const { taskStats, eventStats } = calculateStats();

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

  const checkTaskUniqueness = useCallback((newTask) => {
    return !tasks.some(task => 
      task.content === newTask.content &&
      task.applicant === newTask.applicant &&
      task.apply_date === newTask.apply_date
    );
  }, [tasks]);

  const addTask = useCallback(async (taskData) => {
    if (checkTaskUniqueness(taskData)) {
      try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData)
        });
        if (!response.ok) throw new Error('创建任务失败');
        await fetchTasks(); // 刷新任务列表
        return true; // 任务添加成功
      } catch (error) {
        console.error('创建任务时出错:', error);
        return false;
      }
    }
    return false; // 任务已存在，未添加
  }, [checkTaskUniqueness, fetchTasks]);

  const calculateWorkingDays = (hours) => {
    const hoursPerDay = 8;
    return Math.ceil(hours / hoursPerDay);
  };

  const checkEventUniqueness = useCallback((newEvent) => {
    return !events.some(event => 
      event.task_content === newEvent.task_content &&
      event.applicant === newEvent.applicant &&
      event.apply_date === newEvent.apply_date
    );
  }, [events]);



//第二段。。。。 const onDragEnd = useCallback(async (result) => {
  const onDragEnd = useCallback(async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const task = tasks.find(t => t.id.toString() === draggableId);

    if (!task) {
      console.error('只能从任务列表拖拽任务到日历');
      return;
    }

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

      const newEvent = {
        task_content: task.content,
        applicant: task.applicant,
        apply_date: task.apply_date,
        responsible: "默认负责人",
        start: startDate.toISOString(),
        end: endDate.toISOString()
      };

      if (!checkEventUniqueness(newEvent)) {
        alert('该任务已存在于日历中，无法重复添加。');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/assign/${task.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEvent)
        });
        if (!response.ok) throw new Error('分配任务失败');

        const assignedEvent = await response.json();
        window.location.reload();
        
        // 使用函数式更新来确保我们总是基于最新的状态进行更新
        setEvents(prevEvents => [
          ...prevEvents,
          {
            ...assignedEvent,
            title: assignedEvent.task_content,
            start: new Date(assignedEvent.start),
            end: new Date(assignedEvent.end)
          }
        ]);
        
        setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
        window.location.reload();

        // 触发更新
        setUpdateTrigger(prev => prev + 1);
      } catch (error) {
        console.error('分配任务时出错:', error);
      }
    }
  }, [tasks, checkEventUniqueness]);

  // 使用 useEffect 来监听 events 的变化
  useEffect(() => {
    console.log('Events updated:', events);
  }, [events]);


//...



  const returnTaskToList = useCallback(async (event) => {
    try {
      const taskData = {
        content: event.task_content,
        applicant: event.applicant,
        apply_date: event.apply_date,
        due_date: event.due_date,
        duration: event.duration
      };

      if (checkTaskUniqueness(taskData)) {
        const response = await fetch(`${API_BASE_URL}/return/${event.id}`, { method: 'POST' });
        if (!response.ok) throw new Error('退回任务失败');
        await fetchTasks(); // 重新获取任务列表  ....需要强制删除。。。~~~
        setEvents(prevEvents => prevEvents.filter(e => e.id !== event.id));
      } else {
        alert('该任务已存在于任务列表中，无法退回。');
      }
    } catch (error) {
      console.error('退回任务时出错:', error);
    }
  }, [checkTaskUniqueness, fetchTasks]);

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

            const added = await addTask(taskData);
            if (added) {
              newTasks++;
            } else {
              skippedTasks++;
            }
          }

          alert(`导入完成。\n新增任务: ${newTasks}\n跳过重复任务: ${skippedTasks}`);
        },
        header: true,
        skipEmptyLines: true
      });
    }
  }, [addTask]);

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
            content: `${item['工单号']} - ${item['治具名称']}`,
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
      }

      await fetchTasks(); // 刷新任务列表
      alert(`导入完成。\n新增任务: ${newTasks}\n跳过重复任务: ${skippedTasks}`);
    } catch (error) {
      console.error('导入外部数据时出错:', error);
      alert('导入外部数据失败，请查看控制台了解详细错误信息。');
    }
  }, [checkTaskUniqueness, checkEventUniqueness, fetchTasks]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // const CustomAgendaEvent = ({ event }) => (
  //   <div className="custom-agenda-event">
  //     <div className="agenda-event-title">{event.task_content}</div>
  //     <div className="agenda-event-details">
  //       <div>申请人: {event.applicant}</div>
  //       <div>负责人: {event.responsible}</div>
  //       <div>工期: {event.duration} 天</div>
  //     </div>
  //   </div>
  // );

  // const CustomAgendaDate = ({ label }) => (
  //   <span>{moment(label).format('YYYY-MM-DD')}</span>
  // );

  // const CustomAgendaTime = ({ event }) => (
  //   <span>{moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}</span>
  // );

  const customComponents = {
    dateCellWrapper: renderDateCellWrapper,
    // agenda: {
    //   // event: CustomAgendaEvent,
    //   // date: CustomAgendaDate,
    //   time: CustomAgendaTime,
    // },
  };

  return (
    <div className="relative flex h-screen">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'w-10' : 'w-64'} flex-shrink-0`}>
          <TaskList 
            tasks={tasks} 
            isCollapsed={isCollapsed} 
            toggleSidebar={toggleSidebar}
            exportToCSV={exportToCSV}
            importFromCSV={importFromCSV}
            importExternalData={importExternalData}
          />
        </div>
        <div className="flex flex-grow">
          <div className="flex-grow p-4">
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
              key={updateTrigger}
            />
          </div>
          <div className="w-[10%] p-4 bg-gray-100">
            <Dashboard taskStats={taskStats} eventStats={eventStats} />
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

// 任务列表组件
const TaskList = React.memo(({ tasks, isCollapsed, toggleSidebar, exportToCSV, importFromCSV, importExternalData }) => {
  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className={`h-full bg-gray-100 flex flex-col`}>
      <button
        onClick={toggleSidebar}
        className="w-full py-2 bg-blue-500 text-white font-bold"
      >
        {isCollapsed ? '>' : '<'}
      </button>
      {!isCollapsed && (
        <>
          <Droppable droppableId="taskList" type="TASK">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`flex-grow p-4 ${snapshot.isDraggingOver ? 'bg-blue-100' : ''} overflow-y-auto`}
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
          <div className="p-4 border-t border-gray-200">
            <Droppable droppableId="recycleBin" type="TASK">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="mb-4 p-2 flex justify-center"
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
              className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-2"
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
            <button 
              onClick={importExternalData}
              className="w-full bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            >
              导入外部数据
            </button>
          </div>
        </>
      )}
    </div>
  );
});

export default ToDoAssignmentSystem;