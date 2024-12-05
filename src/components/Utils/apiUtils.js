const API_BASE_URL = '/api';

export const fetchTasks = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`);
    if (!response.ok) throw new Error('获取任务失败');
    return await response.json();
  } catch (error) {
    console.error('获取任务时出错:', error);
    throw error;
  }
};

export const fetchEvents = async () => {
  try {
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
    console.error('获取事件时出错:', error);
    throw error;
  }
};

export const assignTask = async (taskId, eventData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/assign/${taskId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
    if (!response.ok) throw new Error('分配任务失败');
    return await response.json();
  } catch (error) {
    console.error('分配任务时出错:', error);
    throw error;
  }
};

export const returnTask = async (eventId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/return/${eventId}`, { method: 'POST' });
    if (!response.ok) throw new Error('退回任务失败');
    return await response.json();
  } catch (error) {
    console.error('退回任务时出错:', error);
    throw error;
  }
};

export const completeTask = async (eventId, eventData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...eventData, is_completed: 1 })
    });
    if (!response.ok) throw new Error('更新事件失败');
    return await response.json();
  } catch (error) {
    console.error('完成任务时出错:', error);
    throw error;
  }
};
