import React, { useEffect } from 'react';
import theme from '../../styles/theme';

// 将主题对象转换为CSS变量
const convertThemeToCSSVariables = (theme) => {
  const cssVars = {
    // Colors
    '--todo-primary': theme.colors.primary,
    '--todo-secondary': theme.colors.secondary,
    
    // Task Status Colors
    '--todo-task-not-started': theme.colors.taskStatus.notStarted,
    '--todo-task-in-progress': theme.colors.taskStatus.inProgress,
    '--todo-task-completed': theme.colors.taskStatus.completed,
    '--todo-task-overdue': theme.colors.taskStatus.overdue,
    
    // Calendar Colors
    '--todo-calendar-today': theme.colors.calendar.today,
    '--todo-calendar-highlight': theme.colors.calendar.highlight,
    '--todo-calendar-border': theme.colors.calendar.border,
    '--todo-calendar-event-text': theme.colors.calendar.eventText,
    
    // Text Colors
    '--todo-text-primary': theme.colors.text.primary,
    '--todo-text-secondary': theme.colors.text.secondary,
    '--todo-text-light': theme.colors.text.light,
    
    // Background Colors
    '--todo-background-primary': theme.colors.background.primary,
    '--todo-background-secondary': theme.colors.background.secondary,
    '--todo-background-hover': theme.colors.background.hover,
    
    // UI Colors
    '--todo-ui-shadow': theme.colors.ui.shadow,
    '--todo-ui-overlay': theme.colors.ui.overlay,
    '--todo-ui-border': theme.colors.ui.border,
    '--todo-ui-focus': theme.colors.ui.focus,
    
    // Spacing
    '--todo-spacing-xs': theme.spacing.xs,
    '--todo-spacing-sm': theme.spacing.sm,
    '--todo-spacing-md': theme.spacing.md,
    '--todo-spacing-lg': theme.spacing.lg,
    '--todo-spacing-xl': theme.spacing.xl,
    
    // Border Radius
    '--todo-border-radius-sm': theme.borderRadius.sm,
    '--todo-border-radius-md': theme.borderRadius.md,
    '--todo-border-radius-lg': theme.borderRadius.lg,
    '--todo-border-radius-round': theme.borderRadius.round,
    
    // Shadows
    '--todo-shadow-sm': theme.shadows.sm,
    '--todo-shadow-md': theme.shadows.md,
    '--todo-shadow-lg': theme.shadows.lg,
    
    // Transitions
    '--todo-transition-default': theme.transitions.default,
    '--todo-transition-fast': theme.transitions.fast,
    '--todo-transition-slow': theme.transitions.slow,
  };

  return cssVars;
};

const ThemeProvider = ({ children }) => {
  useEffect(() => {
    // 将主题变量应用到根元素
    const cssVariables = convertThemeToCSSVariables(theme);
    const root = document.documentElement;
    
    Object.entries(cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }, []);

  return <>{children}</>;
};

export default ThemeProvider;
