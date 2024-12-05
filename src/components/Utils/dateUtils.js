import moment from 'moment';

export const addWorkingDays = (startDate, days) => {
  let currentDate = moment(startDate).startOf('day');
  let workingDaysAdded = 0;

  if (currentDate.isoWeekday() <= 5) {
    workingDaysAdded = 1;
  }

  while (workingDaysAdded < days) {
    currentDate.add(1, 'days');
    if (currentDate.isoWeekday() <= 5) {
      workingDaysAdded++;
    }
  }

  return currentDate.hour(17).minute(0).second(0).millisecond(0).toDate();
};

export const calculateWorkingDays = (hours) => {
  const hoursPerDay = 8;
  return Math.ceil(hours / hoursPerDay);
};
