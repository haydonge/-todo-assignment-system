import React from 'react';

const Dashboard = ({ taskStats, eventStats }) => {
  return (
    <div className="bg-white shadow-md rounded px-4 py-6 h-full overflow-auto">
      <h2 className="text-xl font-bold mb-4">仪表板</h2>
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-2">任务统计</h3>
        <p className="mb-1">总数: {taskStats.total}</p>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-2">事件统计</h3>
        <p className="mb-1">总数: {eventStats.total}</p>
        <p className="mb-1">已完成: {eventStats.completed}</p>
        <p className="mb-1">进行中: {eventStats.inProgress}</p>
        <p className="mb-1">逾期: {eventStats.overdue}</p>
      </div>
    </div>
  );
};

export default Dashboard;