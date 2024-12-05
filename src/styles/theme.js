// Theme configuration for the Todo Assignment System
export const colors = {
  // Brand Colors
  primary: '#3174ad',      // 主色调：蓝色
  secondary: '#6c757d',    // 次要色调：灰色
  
  // Task Status Colors
  taskStatus: {
    notStarted: '#3174ad',  // 未开始：蓝色
    inProgress: '#9C2B0f',  // 进行中：紫色
    completed: '#28a323',   // 已完成：绿色
    overdue: '#dc3545',     // 逾期：红色
  },

  // Calendar Colors
  calendar: {
    today: '#f0f9ff',        // 今天的背景色
    highlight: '#c6f6d5',    // 高亮日期
    border: '#DDD',          // 边框颜色
    eventText: '#fff',       // 事件文本颜色
  },

  // Text Colors
  text: {
    primary: '#212529',      // 主要文本
    secondary: '#6c757d',    // 次要文本
    light: '#ffffff',        // 亮色文本
  },

  // Background Colors
  background: {
    primary: '#ffffff',      // 主背景
    secondary: '#f8f9fa',    // 次要背景
    hover: '#e9ecef',        // 悬停背景
  },

  // UI Element Colors
  ui: {
    shadow: 'rgba(0, 0, 0, 0.2)',  // 阴影颜色
    overlay: 'rgba(0, 0, 0, 0.5)', // 遮罩层颜色
    border: '#dee2e6',             // 边框颜色
    focus: '#80bdff',              // 焦点颜色
  }
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px'
};

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '16px',
  round: '50%'
};

export const shadows = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.2)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)'
};

export const transitions = {
  default: 'all 0.3s ease',
  fast: 'all 0.2s ease',
  slow: 'all 0.4s ease'
};

export default {
  colors,
  spacing,
  borderRadius,
  shadows,
  transitions
};
