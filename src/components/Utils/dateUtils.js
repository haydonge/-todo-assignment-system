import moment from 'moment';

export const addWorkingDays = (startDate, duration) => {
  // 如果工期小于等于8小时（一个工作日），则在当天结束
  if (duration <= 1) {
    const endDate = moment(startDate)
      .hour(16) // 设置为当天下午4点结束
      .minute(0)
      .second(0)
      .millisecond(0);
    return endDate.toDate();
  }

  // 对于超过一天的任务，按照原来的逻辑处理
  let currentDate = moment(startDate).startOf('day');
  let workingDaysAdded = 0;

  // 如果起始日期是工作日，从当天开始计算
  if (currentDate.isoWeekday() <= 5) {
    workingDaysAdded = 1;
  }

  while (workingDaysAdded < duration) {
    currentDate.add(1, 'days');
    if (currentDate.isoWeekday() <= 5) { // 1-5 代表周一到周五
      workingDaysAdded++;
    }
  }

  // 设置结束时间为最后一个工作日的下午 4 点
  return currentDate.hour(16).minute(0).second(0).millisecond(0).toDate();
};

export const calculateWorkingDays = (hours) => {
  const hoursPerDay = 8;
  return Math.ceil(hours / hoursPerDay);
};
