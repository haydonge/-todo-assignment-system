const API_BASE_URL = '/api';

// 本地Mock数据生成器
const generateMockData = {
  tasks: () => {
    return [
      {
        id: 1,
        content: '测试治具 -8H - WO001',
        applicant: '张三',
        apply_date: '2024-01-15',
        due_date: '2024-01-22',
        duration: 1
      }
    ];
  },
  events: () => {
    return [
      {
        id: 1,
        task_content: '测试治具 -8H - WO001',
        applicant: '张三',
        start: new Date('2024-01-15'),
        end: new Date('2024-01-22'),
        is_completed: false
      }
    ];
  }
};

const apiUtils = {
  API_BASE_URL,
  getBaseUrl: () => API_BASE_URL,
  
  fetchTasks: async () => {
    try {
      // 检查是否为本地环境
      if (process.env.NODE_ENV === 'development' || !navigator.onLine) {
        console.warn('使用本地Mock数据');
        return generateMockData.tasks();
      }
      
      const response = await fetch(`${API_BASE_URL}/tasks`);
      if (!response.ok) throw new Error('获取任务失败');
      return await response.json();
    } catch (error) {
      console.error('获取任务时出错，使用本地Mock数据:', error);
      return generateMockData.tasks();
    }
  },

  fetchEvents: async () => {
    try {
      // 检查是否为本地环境
      if (process.env.NODE_ENV === 'development' || !navigator.onLine) {
        console.warn('使用本地Mock数据');
        return generateMockData.events();
      }
      
      const response = await fetch(`${API_BASE_URL}/events`);
      if (!response.ok) throw new Error('获取事件失败');
      const data = await response.json();
      return data.map(event => ({
        ...event,
        title: event.task_content,
        start: new Date(event.start),
        end: new Date(event.end),
        originalStart: event.start,
        originalEnd: event.end,
      }));
    } catch (error) {
      console.error('获取事件时出错，使用本地Mock数据:', error);
      return generateMockData.events();
    }
  },

  assignTask: async (taskId, eventData) => {
    try {
      if (process.env.NODE_ENV === 'development' || !navigator.onLine) {
        console.warn('模拟分配任务');
        return { ...eventData, id: taskId };
      }
      
      const response = await fetch(`${API_BASE_URL}/assign/${taskId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      if (!response.ok) throw new Error('分配任务失败');
      return await response.json();
    } catch (error) {
      console.error('分配任务时出错:', error);
      return { ...eventData, id: taskId };
    }
  },

  returnTask: async (eventId) => {
    try {
      if (process.env.NODE_ENV === 'development' || !navigator.onLine) {
        console.warn('模拟退回任务');
        return { id: eventId };
      }
      
      const response = await fetch(`${API_BASE_URL}/return/${eventId}`, { method: 'POST' });
      if (!response.ok) throw new Error('退回任务失败');
      return await response.json();
    } catch (error) {
      console.error('退回任务时出错:', error);
      return { id: eventId };
    }
  },

  completeTask: async (eventId, eventData) => {
    try {
      if (process.env.NODE_ENV === 'development' || !navigator.onLine) {
        console.warn('模拟完成任务');
        return { ...eventData, id: eventId };
      }
      
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...eventData, is_completed: 1 })
      });
      if (!response.ok) throw new Error('更新事件失败');
      return await response.json();
    } catch (error) {
      console.error('完成任务时出错:', error);
      return { ...eventData, id: eventId };
    }
  },

  createTask: async (task) => {
    try {
      if (process.env.NODE_ENV === 'development' || !navigator.onLine) {
        console.warn('模拟创建任务');
        return { ...task, id: Date.now() };
      }
      
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      if (!response.ok) throw new Error('创建任务失败');
      return await response.json();
    } catch (error) {
      console.error('创建任务时出错:', error);
      return { ...task, id: Date.now() };
    }
  },

  updateTask: async (id, task) => {
    try {
      if (process.env.NODE_ENV === 'development' || !navigator.onLine) {
        console.warn('模拟更新任务');
        return { ...task, id };
      }
      
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      if (!response.ok) throw new Error('更新任务失败');
      return await response.json();
    } catch (error) {
      console.error('更新任务时出错:', error);
      return { ...task, id };
    }
  },

  updateEvent: async (id, event) => {
    try {
      if (process.env.NODE_ENV === 'development' || !navigator.onLine) {
        console.warn('模拟更新事件');
        return { ...event, id };
      }
      
      const response = await fetch(`${API_BASE_URL}/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      if (!response.ok) throw new Error('更新事件失败');
      return await response.json();
    } catch (error) {
      console.error('更新事件时出错:', error);
      return { ...event, id };
    }
  }
};

export default apiUtils;
