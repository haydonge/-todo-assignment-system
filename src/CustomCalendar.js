// import React, { useState } from 'react';
// import Calendar from 'react-calendar';
// import 'react-calendar/dist/Calendar.css';
// import './CustomCalendar.css'; // 导入自定义样式

// const CustomCalendar = () => {
//   const [hoveredDate, setHoveredDate] = useState(null);

//   const tileContent = ({ date, view }) => {
//     if (view === 'month') {
//       return (
//         <div
//           className={`date-tile ${hoveredDate && hoveredDate.getTime() === date.getTime() ? 'highlight' : ''}`}
//           onMouseEnter={() => setHoveredDate(date)}
//           onMouseLeave={() => setHoveredDate(null)}
//         >
//           {date.getDate()}
//         </div>
//       );
//     }
//   };

//   return (
//     <div className="calendar-container">
//       <Calendar
//         tileContent={tileContent}
//       />
//       {hoveredDate && (
//         <div className="hovered-date">
//           <p>选中的日期: {hoveredDate.toDateString()}</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CustomCalendar;


import React, { useState, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CustomBigCalendar.css'; // 导入自定义样式

const localizer = momentLocalizer(moment);

const CustomBigCalendar = () => {
  const [hoveredDate, setHoveredDate] = useState(null);

  const handleMouseEnter = (date) => {
    setHoveredDate(date);
  };

  const handleMouseLeave = () => {
    setHoveredDate(null);
  };

  const renderDateCellWrapper = useCallback((props) => (
    <div
      onMouseEnter={() => handleMouseEnter(props.value)}
      onMouseLeave={handleMouseLeave}
      className={`rbc-day-bg ${hoveredDate && moment(props.value).isSame(hoveredDate, 'day') ? 'highlight' : ''}`}
    >
      {props.children}
    </div>
  ), [hoveredDate]);

  return (
    <div className="calendar-container">
      <Calendar
        localizer={localizer}
        events={[]}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        components={{
          dateCellWrapper: renderDateCellWrapper
        }}
      />
      {hoveredDate && (
        <div className="hovered-date">
          <p>选中的日期: {hoveredDate.toDateString()}</p>
        </div>
      )}
    </div>
  );
};

export default CustomBigCalendar;
