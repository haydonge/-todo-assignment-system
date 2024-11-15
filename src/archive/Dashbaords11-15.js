import React, { useState } from 'react';
import { AlertTriangle, Clock, CheckCircle, Calendar, ExternalLink } from 'lucide-react';
import { Dialog } from '../components/ui/Dialog.tsx';  // 使用您的自定义 Dialog 组件

const Dashboard = ({ taskStats, eventStats, events }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 计算百分比的函数
  const calculatePercentage = (value) => {
    if (eventStats.total === 0) return 0;
    return Math.round((value / eventStats.total) * 100);
  };

  // 获取逾期任务列表
  const getOverdueTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events.filter(event => 
      !event.is_completed && 
      new Date(event.end) < today
    );
  };

  const overdueList = getOverdueTasks();

  return (
    <div className="space-y-4">
      {/* 未分配任务统计 */}
      <div className="bg-white rounded-lg p-4 shadow">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">未分配任务</h3>
        <div className="text-2xl font-bold text-blue-600">{taskStats.total}</div>
      </div>

      {/* 总任务统计 */}
      <div className="bg-white rounded-lg p-4 shadow">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">已分配任务</h3>
        <div className="text-2xl font-bold text-blue-600">{eventStats.total}</div>
      </div>

      {/* 已完成任务 */}
      <div className="bg-white rounded-lg p-4 shadow">
        <div className="flex items-center gap-2">
          <CheckCircle className="text-green-500" size={20} />
          <h3 className="text-lg font-semibold text-gray-700">已完成</h3>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold text-green-600">
            {eventStats.completed}
            <span className="text-sm ml-1 text-gray-500">
              ({calculatePercentage(eventStats.completed)}%)
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
            {eventStats.inProgress}
            <span className="text-sm ml-1 text-gray-500">
              ({calculatePercentage(eventStats.inProgress)}%)
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
            {eventStats.onSchedule}
            <span className="text-sm ml-1 text-gray-500">
              ({calculatePercentage(eventStats.onSchedule)}%)
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
            {eventStats.overdue}
            <span className="text-sm ml-1 text-gray-500">
              ({calculatePercentage(eventStats.overdue)}%)
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

      {/* 逾期任务详情弹窗 */}
      <Dialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
            <AlertTriangle size={20} />
            逾期任务列表 ({overdueList.length})
          </h3>
        </div>
        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {overdueList.map((task, index) => (
            <div
              key={task.id}
              className="p-4 bg-red-50 rounded-lg border border-red-100"
            >
              <h4 className="font-semibold text-gray-900">{task.task_content}</h4>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>申请人: {task.applicant}</p>
                <p>责任人: {task.responsible}</p>
                <p>结束日期: {new Date(task.end).toLocaleDateString()}</p>
                <p>工期: {task.duration} 天</p>
                <p className="text-red-600">
                  逾期天数: {Math.floor((new Date() - new Date(task.end)) / (1000 * 60 * 60 * 24))} 天
                </p>
              </div>
            </div>
          ))}
        </div>
      </Dialog>
    </div>
  );
};

export default Dashboard;