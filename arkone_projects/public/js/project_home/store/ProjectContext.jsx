import * as React from 'react';
import { createContext, useReducer, useContext } from 'react';
import { projectReducer, initialState, ACTIONS } from './projectReducer';

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
  const fetchProjects = () => {
    setLoading(true);
    frappe.db.get_list('Project', {
        filters: {
            status: 'Open'
        },
        fields: ['name', 'project_name', 'status', 'customer', 'project_type'],
        limit: 50,
    })
    .then((data) => {
        setProjects(data);
    })
    .catch((error) => {
        console.error('Error fetching projects:', error);
        setError(error);
    })
    .finally(() => {
        setLoading(false);
    });
  };

  // Function to fetch tasks for a project
  const fetchTasksForProject = (projectName) => {
    setTasksLoading(true);
    frappe.db.get_list('Task', {
        filters: {
            project: projectName,
            status: ['not in', ['Cancelled', 'Completed']]
        },
        fields: [
          'name', 
          'subject', 
          'status', 
          'priority', 
          'exp_start_date', 
          'exp_end_date',
          'progress'
        ],
        limit: 100,
    })
    .then((data) => {
        setTasks(data);
    })
    .catch((error) => {
        console.error(`Error fetching tasks for project ${projectName}:`, error);
        setTasksError(error);
    })
    .finally(() => {
        setTasksLoading(false);
    });
  };

  // Function to create a new task
  const createTask = (taskData) => {
    return new Promise((resolve, reject) => {
      frappe.call({
        method: 'frappe.client.insert',
        args: {
          doc: {
            doctype: 'Task',
            ...taskData
          }
        },
        callback: (response) => {
          if (response.message) {
            // Re-fetch tasks to update the list
            fetchTasksForProject(state.selectedProject.name);
            resolve(response.message);
          }
        },
        error: (err) => {
          console.error('Error creating task:', err);
          reject(err);
        }
      });
    });
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
    createTask,
    setSelectedTask,
    createTimesheetEntry
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