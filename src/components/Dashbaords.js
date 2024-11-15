import React, { useState } from 'react';
import { AlertTriangle, Clock, CheckCircle, Calendar, ExternalLink, Search } from 'lucide-react';

const Dashboard = ({ taskStats = {}, eventStats = {}, events = [], tasks = [] }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState({ tasks: [], events: [] });

  // 计算百分比的函数，添加防护检查
  const calculatePercentage = (value) => {
    const total = eventStats?.total || 0;
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  // 搜索函数
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setSearchResults({ tasks: [], events: [] });
      return;
    }

    const searchRegex = new RegExp(term, 'i');
    
    // 搜索任务列表
    const matchedTasks = (tasks || []).filter(task => 
      searchRegex.test(task.content) || 
      searchRegex.test(task.applicant)
    );

    // 搜索事件列表
    const matchedEvents = (events || []).filter(event => 
      searchRegex.test(event.task_content) || 
      searchRegex.test(event.applicant) ||
      searchRegex.test(event.responsible)
    );

    setSearchResults({
      tasks: matchedTasks,
      events: matchedEvents
    });
    
    if (term.trim() && (matchedTasks.length > 0 || matchedEvents.length > 0)) {
      setIsSearchOpen(true);
    }
  };

  // 获取事件状态的辅助函数
  const getEventStatus = (event) => {
    if (!event) return '未知';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventEnd = new Date(event.end);
    
    if (event.is_completed) return '已完成';
    if (eventEnd < today) return '已逾期';
    if (new Date(event.start) <= today && today <= eventEnd) return '进行中';
    return '按计划';
  };

  // 获取状态对应的颜色类
  const getStatusColor = (status) => {
    switch (status) {
      case '已完成': return 'text-green-600';
      case '已逾期': return 'text-red-600';
      case '进行中': return 'text-blue-600';
      case '按计划': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  // 获取逾期任务列表
  const getOverdueTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (events || []).filter(event => 
      !event.is_completed && 
      new Date(event.end) < today
    );
  };

  const overdueList = getOverdueTasks();

  return (
    <div className="space-y-4">
      {/* 搜索框 */}
      <div className="bg-white rounded-lg p-4 shadow">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索任务..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
      </div>

      {/* 逾期任务详情对话框 */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">逾期任务详情</h3>
                <button 
                  onClick={() => setIsDialogOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
              {overdueList.length > 0 ? (
                <div className="space-y-3">
                  {overdueList.map(event => (
                    <div key={event.id} className="p-3 bg-gray-50 rounded-lg border border-red-200">
                      <h5 className="font-medium">{event.task_content}</h5>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>申请人: {event.applicant}</p>
                        <p>负责人: {event.responsible}</p>
                        <p>开始日期: {new Date(event.start).toLocaleDateString()}</p>
                        <p>结束日期: {new Date(event.end).toLocaleDateString()}</p>
                        <p className="text-red-600 font-medium">
                          逾期天数: {Math.floor((new Date() - new Date(event.end)) / (1000 * 60 * 60 * 24))} 天
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  没有逾期任务
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 搜索结果对话框 */}
      {isSearchOpen && (searchResults.tasks.length > 0 || searchResults.events.length > 0) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">搜索结果</h3>
                <button 
                  onClick={() => setIsSearchOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
              {/* 未分配任务结果 */}
              {searchResults.tasks.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-lg mb-3">未分配任务 ({searchResults.tasks.length})</h4>
                  <div className="space-y-3">
                    {searchResults.tasks.map(task => (
                      <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                        <h5 className="font-medium">{task.content}</h5>
                        <div className="mt-2 text-sm text-gray-600">
                          <p>申请人: {task.applicant}</p>
                          <p>工期: {task.duration} 天</p>
                          <p>截止日期: {task.due_date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 已分配任务结果 */}
              {searchResults.events.length > 0 && (
                <div>
                  <h4 className="font-semibold text-lg mb-3">已分配任务 ({searchResults.events.length})</h4>
                  <div className="space-y-3">
                    {searchResults.events.map(event => {
                      const status = getEventStatus(event);
                      const statusColor = getStatusColor(status);
                      
                      return (
                        <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                          <h5 className="font-medium">{event.task_content}</h5>
                          <div className="mt-2 text-sm text-gray-600">
                            <p>申请人: {event.applicant}</p>
                            <p>负责人: {event.responsible}</p>
                            <p>开始日期: {new Date(event.start).toLocaleDateString()}</p>
                            <p>结束日期: {new Date(event.end).toLocaleDateString()}</p>
                            <p className={`font-medium ${statusColor}`}>
                              状态: {status}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 统计卡片 */}
      <div className="bg-white rounded-lg p-4 shadow">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">未分配任务</h3>
        <div className="text-2xl font-bold text-blue-600">{taskStats?.total || 0}</div>
      </div>

      {/* 总任务统计 */}
      <div className="bg-white rounded-lg p-4 shadow">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">已分配任务</h3>
        <div className="text-2xl font-bold text-blue-600">{eventStats?.total || 0}</div>
      </div>

      {/* 已完成任务 */}
      <div className="bg-white rounded-lg p-4 shadow">
        <div className="flex items-center gap-2">
          <CheckCircle className="text-green-500" size={20} />
          <h3 className="text-lg font-semibold text-gray-700">已完成</h3>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-green-600">
            {eventStats?.completed || 0}
            <span className="text-sm ml-1 text-gray-500">
              ({calculatePercentage(eventStats?.completed || 0)}%)
            </span>
          </div>
        </div>
      </div>

      {/* 进行中任务 */}
      <div className="bg-white rounded-lg p-4 shadow">
        <div className="flex items-center gap-2">
          <Clock className="text-blue-500" size={20} />
          <h3 className="text-lg font-semibold text-gray-700">进行中</h3>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-blue-600">
            {eventStats?.inProgress || 0}
            <span className="text-sm ml-1 text-gray-500">
              ({calculatePercentage(eventStats?.inProgress || 0)}%)
            </span>
          </div>
        </div>
      </div>

      {/* 按计划任务（未开始） */}
      <div className="bg-white rounded-lg p-4 shadow">
        <div className="flex items-center gap-2">
          <Calendar className="text-purple-500" size={20} />
          <h3 className="text-lg font-semibold text-gray-700">按计划</h3>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-purple-600">
            {eventStats?.onSchedule || 0}
            <span className="text-sm ml-1 text-gray-500">
              ({calculatePercentage(eventStats?.onSchedule || 0)}%)
            </span>
          </div>
        </div>
      </div>

      {/* 逾期任务 */}
      <div className="bg-white rounded-lg p-4 shadow">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-red-500" size={20} />
          <h3 className="text-lg font-semibold text-gray-700">逾期</h3>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-red-600">
            {eventStats?.overdue || 0}
            <span className="text-sm ml-1 text-gray-500">
              ({calculatePercentage(eventStats?.overdue || 0)}%)
            </span>
          </div>
          <button 
            onClick={() => setIsDialogOpen(true)}
            className="mt-2 text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
          >
            查看详情 <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;