/**
 * Utility functions for Arkone Projects
 * Mobile-first project management tool utilities
 */

// Date formatting utilities
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(dateStr);
};

// Task status utilities
export const getStatusColor = (status) => {
  const statusColors = {
    'Open': 'bg-blue-100 text-blue-800',
    'Working': 'bg-yellow-100 text-yellow-800',
    'Pending Review': 'bg-orange-100 text-orange-800',
    'Overdue': 'bg-red-100 text-red-800',
    'Template': 'bg-gray-100 text-gray-800',
    'Completed': 'bg-green-100 text-green-800',
    'Cancelled': 'bg-gray-100 text-gray-500'
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

export const getPriorityColor = (priority) => {
  const priorityColors = {
    'Low': 'bg-blue-100 text-blue-700',
    'Medium': 'bg-yellow-100 text-yellow-700',
    'High': 'bg-orange-100 text-orange-700',
    'Urgent': 'bg-red-100 text-red-700'
  };
  return priorityColors[priority] || 'bg-gray-100 text-gray-700';
};

export const getPriorityIcon = (priority) => {
  const priorityIcons = {
    'Low': '🔽',
    'Medium': '➡️',
    'High': '🔺',
    'Urgent': '🚨'
  };
  return priorityIcons[priority] || '➡️';
};

// Progress utilities
export const getProgressColor = (progress) => {
  if (progress >= 100) return 'bg-green-500';
  if (progress >= 75) return 'bg-blue-500';
  if (progress >= 50) return 'bg-yellow-500';
  if (progress >= 25) return 'bg-orange-500';
  return 'bg-gray-300';
};

export const calculateProjectProgress = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  const totalProgress = tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
  return Math.round(totalProgress / tasks.length);
};

// Text utilities
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const extractInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

// Array utilities
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {});
};

export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    let aVal = a[key];
    let bVal = b[key];
    
    // Handle dates
    if (key.includes('date')) {
      aVal = new Date(aVal || 0);
      bVal = new Date(bVal || 0);
    }
    
    // Handle strings
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
};

// Mobile detection
export const isMobile = () => {
  return window.innerWidth < 768;
};

export const isTablet = () => {
  return window.innerWidth >= 768 && window.innerWidth < 1024;
};

export const isDesktop = () => {
  return window.innerWidth >= 1024;
};

// Local storage utilities
export const getStoredFilters = (key) => {
  try {
    const stored = localStorage.getItem(`arkone_projects_${key}`);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error getting stored filters:', error);
    return null;
  }
};

export const setStoredFilters = (key, filters) => {
  try {
    localStorage.setItem(`arkone_projects_${key}`, JSON.stringify(filters));
  } catch (error) {
    console.error('Error setting stored filters:', error);
  }
};

// Drag and drop utilities
export const reorderArray = (array, startIndex, endIndex) => {
  const result = Array.from(array);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

export const moveItemBetweenArrays = (sourceArray, destArray, sourceIndex, destIndex) => {
  const sourceClone = Array.from(sourceArray);
  const destClone = Array.from(destArray);
  const [removed] = sourceClone.splice(sourceIndex, 1);
  destClone.splice(destIndex, 0, removed);
  
  return {
    source: sourceClone,
    destination: destClone
  };
};

// Validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRequired = (value) => {
  return value !== null && value !== undefined && value !== '';
};

export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return true;
  return new Date(startDate) <= new Date(endDate);
};

// Error handling utilities
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  return 'An unexpected error occurred';
};

// Time tracking utilities
export const formatHours = (hours) => {
  if (!hours || hours === 0) return '0h';
  
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  
  return `${wholeHours}h ${minutes}m`;
};

export const parseTimeInput = (timeStr) => {
  // Parse input like "2.5", "2h 30m", "2:30", etc.
  if (!timeStr) return 0;
  
  // Handle decimal hours
  const decimalMatch = timeStr.match(/^(\d+\.?\d*)$/);
  if (decimalMatch) {
    return parseFloat(decimalMatch[1]);
  }
  
  // Handle "2h 30m" format
  const hourMinuteMatch = timeStr.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/);
  if (hourMinuteMatch) {
    const hours = parseInt(hourMinuteMatch[1] || 0);
    const minutes = parseInt(hourMinuteMatch[2] || 0);
    return hours + (minutes / 60);
  }
  
  // Handle "2:30" format
  const colonMatch = timeStr.match(/^(\d+):(\d+)$/);
  if (colonMatch) {
    const hours = parseInt(colonMatch[1]);
    const minutes = parseInt(colonMatch[2]);
    return hours + (minutes / 60);
  }
  
  return 0;
};
