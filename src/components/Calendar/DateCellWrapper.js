import React from 'react';
import { Droppable } from 'react-beautiful-dnd';

const DateCellWrapper = ({ children, value }) => (
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
);

export default React.memo(DateCellWrapper);
