import React, { useRef } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';

const TaskList = ({ tasks, isCollapsed, toggleSidebar, exportToCSV, importFromCSV, importExternalData }) => {
  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className={`h-full bg-gray-100 flex flex-col`}>
      <button
        onClick={toggleSidebar}
        className="p-2 hover:bg-gray-200 transition-colors"
      >
        {isCollapsed ? '→' : '←'}
      </button>
      
      {!isCollapsed && (
        <>
          <div className="p-4 space-y-2">
            <button
              onClick={exportToCSV}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              导出CSV
            </button>
            <button
              onClick={handleImportClick}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
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
              className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            >
              从Google表格导入
            </button>
          </div>

          <Droppable droppableId="taskList" type="TASK">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex-grow overflow-y-auto p-4"
              >
                {tasks.map((task, index) => (
                  <Draggable
                    key={task.id.toString()}
                    draggableId={task.id.toString()}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`p-4 mb-2 bg-white rounded shadow ${
                          snapshot.isDragging ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="font-bold text-black">{task.content}</div>
                        <div className="text-sm text-black">
                          申请人: {task.applicant}
                        </div>
                        <div className="text-sm text-black">
                          申请日期: {task.apply_date}
                        </div>
                        <div className="text-sm text-black">
                          工期: {task.duration} 天
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </>
      )}
    </div>
  );
};

export default React.memo(TaskList);
