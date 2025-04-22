// Project reducer to handle project-related actions

// Action types
export const ACTIONS = {
  SET_PROJECTS: 'SET_PROJECTS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SELECT_PROJECT: 'SELECT_PROJECT',
  SET_TASKS: 'SET_TASKS',
  SET_TASKS_LOADING: 'SET_TASKS_LOADING',
  SET_TASKS_ERROR: 'SET_TASKS_ERROR',
  SET_SELECTED_TASK: 'SET_SELECTED_TASK'
};

// Initial state
export const initialState = {
  projects: [],
  isLoading: true,
  error: null,
  selectedProject: null,
  tasks: [],
  tasksLoading: false,
  tasksError: null,
  selectedTask: null
};

// Reducer function
export const projectReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_PROJECTS:
      return {
        ...state,
        projects: action.payload,
      };
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };
    case ACTIONS.SELECT_PROJECT:
      return {
        ...state,
        selectedProject: action.payload,
        tasks: [],
      };
    case ACTIONS.SET_TASKS:
      return {
        ...state,
        tasks: action.payload,
      };
    case ACTIONS.SET_TASKS_LOADING:
      return {
        ...state,
        tasksLoading: action.payload,
      };
    case ACTIONS.SET_TASKS_ERROR:
      return {
        ...state,
        tasksError: action.payload,
      };
    case ACTIONS.SET_SELECTED_TASK:
      return {
        ...state,
        selectedTask: action.payload,
      };
    default:
      return state;
  }
};