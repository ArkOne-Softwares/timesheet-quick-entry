import * as React from 'react';
import { createContext, useReducer, useContext } from 'react';
import { projectReducer, initialState, ACTIONS } from './projectReducer';
import apiService from '../services/api';

// Create context
const ProjectContext = createContext();

// Provider component
export function ProjectProvider({ children }) {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  // Projects actions
  const setProjects = (projects) => {
    dispatch({ type: ACTIONS.SET_PROJECTS, payload: projects });
  };

  const setLoading = (isLoading) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: isLoading });
  };

  const setError = (error) => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: error });
  };

  const setSelectedProject = (project) => {
    dispatch({ type: ACTIONS.SELECT_PROJECT, payload: project });
    
    // When a project is selected, fetch its tasks
    if (project) {
      fetchTasksForProject(project.name);
    }
  };

  // Tasks actions
  const setTasks = (tasks) => {
    dispatch({ type: ACTIONS.SET_TASKS, payload: tasks });
  };

  const setTasksLoading = (isLoading) => {
    dispatch({ type: ACTIONS.SET_TASKS_LOADING, payload: isLoading });
  };

  const setTasksError = (error) => {
    dispatch({ type: ACTIONS.SET_TASKS_ERROR, payload: error });
  };

  const setSelectedTask = (task) => {
    dispatch({ type: ACTIONS.SET_SELECTED_TASK, payload: task });
  };

  // Function to fetch projects
  const fetchProjects = async () => {
    console.log('Fetching projects...'); // Debug logging
    setLoading(true);
    try {
      const projects = await apiService.getProjects();
      console.log('Projects fetched:', projects); // Debug logging
      // Ensure projects is always an array
      setProjects(Array.isArray(projects) ? projects : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError(error);
      setProjects([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch all tasks regardless of project
  const fetchAllTasks = async () => {
    setTasksLoading(true);
    try {
      const tasks = await apiService.getTasks();
      setTasks(Array.isArray(tasks) ? tasks : []);
    } catch (error) {
      console.error('Error fetching all tasks:', error);
      setTasksError(error);
      setTasks([]); // Set empty array on error
    } finally {
      setTasksLoading(false);
    }
  };

  // Function to fetch tasks for a project
  const fetchTasksForProject = async (projectName) => {
    setTasksLoading(true);
    try {
      const tasks = await apiService.getTasks(projectName);
      setTasks(Array.isArray(tasks) ? tasks : []);
    } catch (error) {
      console.error(`Error fetching tasks for project ${projectName}:`, error);
      setTasksError(error);
      setTasks([]); // Set empty array on error
    } finally {
      setTasksLoading(false);
    }
  };

  // Function to create a new task
  const createTask = async (taskData) => {
    try {
      const newTask = await apiService.createTask(taskData);
      // Re-fetch tasks to update the list
      if (state.selectedProject) {
        await fetchTasksForProject(state.selectedProject.name);
      }
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  // Function to create a timesheet entry for a task
  const createTimesheetEntry = (timesheetData) => {
    return new Promise((resolve, reject) => {
      frappe.call({
        method: 'frappe.client.insert',
        args: {
          doc: {
            doctype: 'Timesheet Detail',
            parenttype: 'Timesheet',
            parentfield: 'time_logs',
            ...timesheetData
          }
        },
        callback: (response) => {
          if (response.message) {
            resolve(response.message);
          }
        },
        error: (err) => {
          console.error('Error creating timesheet entry:', err);
          reject(err);
        }
      });
    });
  };

  // Function to assign task to current user
  const assignTaskToSelf = async (taskId) => {
    try {
      // Get employee data for current user
      const employeeData = await frappe.db.get_list('Employee', { 
          filters: { user_id: frappe.session.user },
          fields: ['name']
      });
      
      if (!employeeData || employeeData.length === 0) {
          throw new Error("Could not find an employee record for the current user");
      }
      
      // Update the task
      await frappe.db.set_value('Task', taskId, {
          '_assign': JSON.stringify([frappe.session.user])
      });
      
      return true;
    } catch (error) {
      console.error('Error assigning task to self:', error);
      throw error;
    }
  };
  
  // Function to update task status
  const updateTaskStatus = async (taskId, status) => {
    try {
      await apiService.updateTaskStatus(taskId, status);
      
      // Refresh the task list
      if (state.selectedProject) {
        await fetchTasksForProject(state.selectedProject.name);
      } else {
        await fetchAllTasks();
      }
      
      return true;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  };
  
  // Function to submit timesheet and complete task
  const submitTimesheetAndCompleteTask = async (timesheetDoc, taskId) => {
    try {
      // Submit the timesheet
      await frappe.call({
        method: 'frappe.client.submit',
        args: {
          doc: {
            doctype: 'Timesheet',
            name: timesheetDoc
          }
        }
      });
      
      // Get employee data for current user
      const employeeData = await frappe.db.get_list('Employee', { 
        filters: { user_id: frappe.session.user },
        fields: ['name']
      });
      
      if (!employeeData || employeeData.length === 0) {
        throw new Error("Could not find an employee record for the current user");
      }
      
      // Update the task as completed
      await frappe.db.set_value('Task', taskId, {
        status: 'Completed',
        completed_by: employeeData[0].name,
        completed_on: frappe.datetime.now_datetime()
      });
      
      // Refresh the task list
      if (state.selectedProject) {
        fetchTasksForProject(state.selectedProject.name);
      }
      
      return true;
    } catch (error) {
      console.error('Error submitting timesheet and completing task:', error);
      throw error;
    }
  };
  
  // Function to get task's available status options
  const getTaskStatusOptions = async () => {
    try {
      const meta = await frappe.db.get_doc('DocType', 'Task');
      const statusField = meta.fields.find(field => field.fieldname === 'status');
      
      if (statusField && statusField.options) {
        return statusField.options.split('\n')
          .filter(option => option.trim() !== '');
      }
      return [];
    } catch (error) {
      console.error('Error fetching task status options:', error);
      throw error;
    }
  };

  // Value object to be provided to consumers
  const value = {
    projects: state.projects,
    isLoading: state.isLoading,
    error: state.error,
    selectedProject: state.selectedProject,
    tasks: state.tasks,
    tasksLoading: state.tasksLoading,
    tasksError: state.tasksError,
    selectedTask: state.selectedTask,
    fetchProjects,
    setProjects,
    setLoading,
    setError,
    setSelectedProject,
    fetchTasksForProject,
    fetchAllTasks,
    createTask,
    setSelectedTask,
    createTimesheetEntry,
    assignTaskToSelf,
    updateTaskStatus,
    submitTimesheetAndCompleteTask,
    getTaskStatusOptions
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

// Custom hook to use the project context
export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};