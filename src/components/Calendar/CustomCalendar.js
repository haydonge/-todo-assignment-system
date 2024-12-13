import React from 'react';
import { Calendar } from 'react-big-calendar';
import moment from 'moment';

const CustomCalendar = ({ 
  localizer, 
  events, 
  components, 
  handleSelectEvent, 
  eventStyleGetter,
  updateTrigger 
}) => {
  return (
    <Calendar
      localizer={localizer}
      events={events}
      eventLimit={8}
      startAccessor="start"
      endAccessor="end"
      style={{ height: 'calc(100vh - 2rem)' }}
      components={components}
      onSelectEvent={handleSelectEvent}
      selectable
      eventPropGetter={eventStyleGetter}
      popup={true}
      popupOffset={5}
      formats={{
        agendaDateFormat: 'YYYY-MM-DD',
        agendaTimeRangeFormat: ({ start, end }) => {
          return `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`;
        },
      }}
      messages={{
        showMore: (total) => `+${total} 更多`,
      }}
      key={updateTrigger}
    />
  );
};

export default React.memo(CustomCalendar);
