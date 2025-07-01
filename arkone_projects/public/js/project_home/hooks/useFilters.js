/**
 * Custom hook for managing filters, search, and sorting
 * Mobile-first project management tool
 */

import { useState, useEffect, useMemo } from 'react';
import { getStoredFilters, setStoredFilters, groupBy, sortBy } from '../utils';

export const useFilters = (initialData = [], storageKey = 'default') => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState([]);
  const [assignedToFilter, setAssignedToFilter] = useState([]);
  const [projectFilter, setProjectFilter] = useState([]);
  const [sortField, setSortField] = useState('creation');
  const [sortDirection, setSortDirection] = useState('desc');
  const [groupByField, setGroupByField] = useState('');

  // Load filters from localStorage on mount
  useEffect(() => {
    const storedFilters = getStoredFilters(storageKey);
    if (storedFilters) {
      setSearchTerm(storedFilters.searchTerm || '');
      setStatusFilter(storedFilters.statusFilter || []);
      setPriorityFilter(storedFilters.priorityFilter || []);
      setAssignedToFilter(storedFilters.assignedToFilter || []);
      setProjectFilter(storedFilters.projectFilter || []);
      setSortField(storedFilters.sortField || 'creation');
      setSortDirection(storedFilters.sortDirection || 'desc');
      setGroupByField(storedFilters.groupByField || '');
    }
  }, [storageKey]);

  // Save filters to localStorage when they change
  useEffect(() => {
    const filters = {
      searchTerm,
      statusFilter,
      priorityFilter,
      assignedToFilter,
      projectFilter,
      sortField,
      sortDirection,
      groupByField
    };
    setStoredFilters(storageKey, filters);
  }, [
    storageKey,
    searchTerm,
    statusFilter,
    priorityFilter,
    assignedToFilter,
    projectFilter,
    sortField,
    sortDirection,
    groupByField
  ]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = initialData;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(item => statusFilter.includes(item.status));
    }

    // Apply priority filter
    if (priorityFilter.length > 0) {
      filtered = filtered.filter(item => priorityFilter.includes(item.priority));
    }

    // Apply assigned to filter
    if (assignedToFilter.length > 0) {
      filtered = filtered.filter(item => 
        item.assigned_to && assignedToFilter.includes(item.assigned_to)
      );
    }

    // Apply project filter
    if (projectFilter.length > 0) {
      filtered = filtered.filter(item => 
        item.project && projectFilter.includes(item.project)
      );
    }

    // Apply sorting
    filtered = sortBy(filtered, sortField, sortDirection);

    return filtered;
  }, [
    initialData,
    searchTerm,
    statusFilter,
    priorityFilter,
    assignedToFilter,
    projectFilter,
    sortField,
    sortDirection
  ]);

  // Group data if groupByField is set
  const groupedData = useMemo(() => {
    if (!groupByField) return { ungrouped: filteredData };
    return groupBy(filteredData, groupByField);
  }, [filteredData, groupByField]);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const statuses = [...new Set(initialData.map(item => item.status).filter(Boolean))];
    const priorities = [...new Set(initialData.map(item => item.priority).filter(Boolean))];
    const assignedTo = [...new Set(initialData.map(item => item.assigned_to).filter(Boolean))];
    const projects = [...new Set(initialData.map(item => item.project).filter(Boolean))];

    return {
      statuses,
      priorities,
      assignedTo,
      projects
    };
  }, [initialData]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter([]);
    setPriorityFilter([]);
    setAssignedToFilter([]);
    setProjectFilter([]);
    setSortField('creation');
    setSortDirection('desc');
    setGroupByField('');
  };

  // Toggle filter values
  const toggleStatusFilter = (status) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const togglePriorityFilter = (priority) => {
    setPriorityFilter(prev => 
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  };

  const toggleAssignedToFilter = (assignedTo) => {
    setAssignedToFilter(prev => 
      prev.includes(assignedTo)
        ? prev.filter(a => a !== assignedTo)
        : [...prev, assignedTo]
    );
  };

  const toggleProjectFilter = (project) => {
    setProjectFilter(prev => 
      prev.includes(project)
        ? prev.filter(p => p !== project)
        : [...prev, project]
    );
  };

  // Toggle sort direction
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || 
    statusFilter.length > 0 || 
    priorityFilter.length > 0 || 
    assignedToFilter.length > 0 || 
    projectFilter.length > 0;

  return {
    // State
    searchTerm,
    statusFilter,
    priorityFilter,
    assignedToFilter,
    projectFilter,
    sortField,
    sortDirection,
    groupByField,
    
    // Setters
    setSearchTerm,
    setStatusFilter,
    setPriorityFilter,
    setAssignedToFilter,
    setProjectFilter,
    setSortField,
    setSortDirection,
    setGroupByField,
    
    // Toggle functions
    toggleStatusFilter,
    togglePriorityFilter,
    toggleAssignedToFilter,
    toggleProjectFilter,
    toggleSort,
    
    // Data
    filteredData,
    groupedData,
    filterOptions,
    
    // Utilities
    clearFilters,
    hasActiveFilters
  };
};
