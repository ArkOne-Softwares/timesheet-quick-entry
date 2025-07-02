/**
 * Utility functions for the project management app
 */
import React from 'react';
import { 
  FaCircle, 
  FaExclamationCircle, 
  FaExclamationTriangle, 
  FaFire 
} from 'react-icons/fa';

// Get status color for UI elements
export const getStatusColor = (status) => {
  const statusColors = {
    'Open': 'bg-blue-100 text-blue-800',
    'Working': 'bg-yellow-100 text-yellow-800',
    'Pending Review': 'bg-orange-100 text-orange-800',
    'Overdue': 'bg-red-100 text-red-800',
    'Completed': 'bg-green-100 text-green-800',
    'Cancelled': 'bg-gray-100 text-gray-800'
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

// Get priority color for UI elements
export const getPriorityColor = (priority) => {
  const priorityColors = {
    'Low': 'bg-green-100 text-green-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'High': 'bg-orange-100 text-orange-800',
    'Urgent': 'bg-red-100 text-red-800'
  };
  return priorityColors[priority] || 'bg-gray-100 text-gray-800';
};

// Get priority icon component
export const getPriorityIcon = (priority) => {
  const iconProps = { className: `priority-icon ${priority?.toLowerCase() || 'default'}` };
  
  switch (priority) {
    case 'Low':
      return React.createElement(FaCircle, iconProps);
    case 'Medium':
      return React.createElement(FaExclamationCircle, iconProps);
    case 'High':
      return React.createElement(FaExclamationTriangle, iconProps);
    case 'Urgent':
      return React.createElement(FaFire, iconProps);
    default:
      return React.createElement(FaCircle, iconProps);
  }
};

// Parse ERPNext assignment data from _assign field
export const parseAssignments = (assignField) => {
  if (!assignField) return [];
  
  try {
    // _assign field contains JSON string of assigned user emails
    const assignments = JSON.parse(assignField);
    return Array.isArray(assignments) ? assignments : [];
  } catch (error) {
    console.error('Error parsing assignment data:', error);
    return [];
  }
};

// Process task data to include parsed assignments
export const processTaskData = (tasks) => {
  if (!Array.isArray(tasks)) return [];
  
  return tasks.map(task => ({
    ...task,
    assignedUsers: parseAssignments(task._assign),
    // Keep backward compatibility
    assigned_to: parseAssignments(task._assign)?.[0] || null
  }));
};

// Format date for display
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
  if (diffDays <= 7) return `In ${diffDays} days`;
  
  return date.toLocaleDateString();
};

// Truncate text for mobile display
export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Extract initials from full name
export const extractInitials = (fullName) => {
  if (!fullName) return 'U';
  
  const names = fullName.split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

// Calculate progress percentage
export const calculateProgress = (task) => {
  if (task.progress) return task.progress;
  if (task.status === 'Completed') return 100;
  if (task.status === 'Working') return 50;
  if (task.status === 'Open') return 0;
  return 0;
};

// Get time ago string
export const getTimeAgo = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
};

// Validate form data
export const validateTaskForm = (formData) => {
  const errors = {};
  
  if (!formData.subject?.trim()) {
    errors.subject = 'Subject is required';
  }
  
  if (!formData.project?.trim()) {
    errors.project = 'Project is required';
  }
  
  if (formData.exp_start_date && formData.exp_end_date) {
    const startDate = new Date(formData.exp_start_date);
    const endDate = new Date(formData.exp_end_date);
    
    if (startDate > endDate) {
      errors.exp_end_date = 'End date must be after start date';
    }
  }
  
  return errors;
};

// Validate project form data
export const validateProjectForm = (formData) => {
  const errors = {};
  
  if (!formData.project_name?.trim()) {
    errors.project_name = 'Project name is required';
  }
  
  if (formData.expected_start_date && formData.expected_end_date) {
    const startDate = new Date(formData.expected_start_date);
    const endDate = new Date(formData.expected_end_date);
    
    if (startDate > endDate) {
      errors.expected_end_date = 'End date must be after start date';
    }
  }
  
  return errors;
};
