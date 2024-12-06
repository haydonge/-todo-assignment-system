import React from 'react';
import { Trash2 } from 'lucide-react';
import { Droppable } from 'react-beautiful-dnd';

const RecycleBin = ({ isOver }) => (
  <Droppable droppableId="recycleBin" type="TASK">
    {(provided) => (
      <div 
        ref={provided.innerRef}
        {...provided.droppableProps}
        className={`flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full ${isOver ? 'bg-red-200' : ''}`}
      >
        <Trash2 size={32} className={`text-gray-600 ${isOver ? 'text-red-600' : ''}`} />
        {provided.placeholder}
      </div>
    )}
  </Droppable>
);

export default RecycleBin;
