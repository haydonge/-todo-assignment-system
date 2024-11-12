// import React from 'react';

// const Dashboard = ({ taskStats, eventStats }) => {
//   return (
//     <div className="bg-white shadow-md rounded px-4 py-6 h-full overflow-auto">
//       <h2 className="text-xl font-bold mb-4">仪表板</h2>
//       <div className="mb-6">
//         <h3 className="font-bold text-lg mb-2">任务统计</h3>
//         <p className="mb-1">总数: {taskStats.total}</p>
//       </div>
//       <div>
//         <h3 className="font-bold text-lg mb-2">事件统计</h3>
//         <p className="mb-1">总数: {eventStats.total}</p>
//         <p className="mb-1">已完成: {eventStats.completed}</p>
//         <p className="mb-1">进行中: {eventStats.inProgress}</p>
//         <p className="mb-1">逾期: {eventStats.overdue}</p>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;

import React from 'react';
import { AlertTriangle, Clock, CheckCircle, Calendar } from 'lucide-react';

const Dashboard = ({ taskStats, eventStats }) => {
  // 计算各状态任务的百分比
  const calculatePercentage = (value) => {
    if (eventStats.total === 0) return 0;
    return Math.round((value / eventStats.total) * 100);
  };

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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;