import React from 'react';
import { Trash2 } from 'lucide-react';

const RecycleBin = ({ isOver }) => (
  <div className={`flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full ${isOver ? 'bg-red-200' : ''}`}>
    <Trash2 size={32} className={`text-gray-600 ${isOver ? 'text-red-600' : ''}`} />
  </div>
);

export default RecycleBin;
