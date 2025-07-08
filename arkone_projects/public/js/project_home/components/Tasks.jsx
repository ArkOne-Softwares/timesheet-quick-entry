import React, { useState, useEffect } from 'react';
import { FaEdit, FaClock, FaUser } from 'react-icons/fa';
import { useProjectContext } from '../store/ProjectContext';
import AddTaskForm from './AddTaskForm';
import EditTaskForm from './EditTaskForm';
import TimesheetForm from './TimesheetForm';
import AssignmentForm from './AssignmentForm';
import Modal from './Modal';
import { hasTaskEditPermission } from '../permissions';

export default function Tasks({ tasks: tasksProp }) {
    const { 
        selectedProject, 
        tasks: contextTasks, 
        tasksLoading, 
        tasksError, 
        selectedTask,
        setSelectedTask,
        assignTaskToSelf,
        updateTaskStatus,
        getTaskStatusOptions
    } = useProjectContext();
    
    // Use prop tasks if provided, otherwise use context tasks
    const tasks = tasksProp || contextTasks || [];
    
    const [showAddTaskForm, setShowAddTaskForm] = useState(false);
    const [showEditTaskForm, setShowEditTaskForm] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [showTimesheetForm, setShowTimesheetForm] = useState(false);
    const [showAssignmentForm, setShowAssignmentForm] = useState(false);
    const [selectedTaskForAssignment, setSelectedTaskForAssignment] = useState(null);
    const [taskStatusOptions, setTaskStatusOptions] = useState([]);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isChangingStatus, setIsChangingStatus] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [taskPermissions, setTaskPermissions] = useState({});

    // Fetch task status options when component mounts
    useEffect(() => {
        const fetchTaskStatuses = async () => {
            try {
                const statuses = await getTaskStatusOptions();
                setTaskStatusOptions(statuses);
            } catch (err) {
                console.error("Error fetching task statuses:", err);
            }
        };
        
        fetchTaskStatuses();
    }, []);

    // When tasks change, check permissions for each task
    useEffect(() => {
        const checkPermissions = async () => {
            const permissions = {};
            for (const task of tasks) {
                try {
                    permissions[task.name] = await hasTaskEditPermission(task.name);
                } catch (error) {
                    console.error(`Failed to check permissions for task ${task.name}:`, error);
                    permissions[task.name] = false;
                }
            }
            setTaskPermissions(permissions);
        };

        if (tasks.length > 0) {
            checkPermissions();
        }
    }, [tasks]);

    if (!selectedProject) {
        return (
            <div className="task-content">
                <div className="empty-state">
                    <p>Select a project to view tasks</p>
                </div>
            </div>
        );
    }

    const handleTaskClick = (task) => {
        setSelectedTask(task === selectedTask ? null : task);
        setShowTimesheetForm(false);
        setShowStatusDropdown(false);
        setActionError(null);
    };

    const handleAddTimesheet = (e) => {
        // Prevent event from bubbling up to parent elements
        e.stopPropagation();
        setShowTimesheetForm(true);
        setShowStatusDropdown(false);
    };

    const handleEditTask = (task, e) => {
        e.stopPropagation();
        setEditingTask(task);
        setShowEditTaskForm(true);
        setShowStatusDropdown(false);
    };

    const handleEditTaskSuccess = () => {
        // Refresh tasks for current project
        if (selectedProject?.name) {
            fetchTasksForProject(selectedProject.name);
        }
        setShowEditTaskForm(false);
        setEditingTask(null);
    };
    
    const handleAssignToSelf = async (e) => {
        e.stopPropagation();
        setIsAssigning(true);
        setActionError(null);
        
        try {
            await assignTaskToSelf(selectedTask.name);
            frappe.show_alert({
                message: 'Task assigned to you successfully',
                indicator: 'green'
            });
        } catch (err) {
            setActionError("Failed to assign task: " + (err.message || "Unknown error"));
        } finally {
            setIsAssigning(false);
        }
    };
    
    const handleAssignTask = (task, e) => {
        e.stopPropagation();
        setSelectedTaskForAssignment(task);
        setShowAssignmentForm(true);
        setShowStatusDropdown(false);
    };

    const handleAssignmentSuccess = () => {
        // Refresh tasks for current project
        if (selectedProject?.name) {
            fetchTasksForProject(selectedProject.name);
        }
        setShowAssignmentForm(false);
        setSelectedTaskForAssignment(null);
    };
    
    const toggleStatusDropdown = (e) => {
        e.stopPropagation();
        setShowStatusDropdown(!showStatusDropdown);
    };
    
    const handleStatusChange = async (status, e) => {
        e.stopPropagation();
        setIsChangingStatus(true);
        setActionError(null);
        setShowStatusDropdown(false);
        
        try {
            if (status === 'Completed') {
                // Use the special API endpoint that completes the task and submits timesheets
                const response = await frappe.call({
                    method: 'arkone_projects.arkone_projects.api.complete_task_and_submit_timesheets',
                    args: { task_id: selectedTask.name }
                });
                
                if (response.message?.success) {
                    let message = 'Task completed successfully';
                    if (response.message.submitted_timesheets?.length > 0) {
                        message += ` and ${response.message.submitted_timesheets.length} timesheets submitted`;
                    }
                    frappe.show_alert({
                        message: message,
                        indicator: 'green'
                    });
                    
                    if (response.message.warnings?.length > 0) {
                        console.warn('Timesheet submission warnings:', response.message.warnings);
                    }
                } else {
                    throw new Error(response.message?.error || 'Failed to complete task');
                }
            } else {
                // Regular status update
                await updateTaskStatus(selectedTask.name, status);
                frappe.show_alert({
                    message: `Task status updated to ${status}`,
                    indicator: 'green'
                });
            }
        } catch (err) {
            setActionError("Failed to update status: " + (err.message || "Unknown error"));
        } finally {
            setIsChangingStatus(false);
        }
    };

    return (
        <div className="task-content">
            <div className="header">
                <h2 className="project-title">{selectedProject.project_name || selectedProject.name}</h2>
                <button 
                    className="add-task-btn" 
                    onClick={() => setShowAddTaskForm(true)}
                >
                    Add Task
                </button>
            </div>

            {/* Add Task Modal */}
            {showAddTaskForm && (
                <Modal
                    title="Create New Task"
                    onClose={() => setShowAddTaskForm(false)}
                    isOpen={showAddTaskForm}
                >
                    <AddTaskForm 
                        projectName={selectedProject.name}
                        onCancel={() => setShowAddTaskForm(false)} 
                    />
                </Modal>
            )}

            {/* Edit Task Modal */}
            {showEditTaskForm && editingTask && (
                <Modal
                    title={`Edit Task: ${editingTask.subject}`}
                    onClose={() => {
                        setShowEditTaskForm(false);
                        setEditingTask(null);
                    }}
                    isOpen={showEditTaskForm}
                >
                    <EditTaskForm 
                        task={editingTask}
                        onCancel={() => {
                            setShowEditTaskForm(false);
                            setEditingTask(null);
                        }}
                        onSuccess={handleEditTaskSuccess}
                    />
                </Modal>
            )}

            {/* Assignment Form Modal */}
            {showAssignmentForm && selectedTaskForAssignment && (
                <Modal
                    title={`Assign Task: ${selectedTaskForAssignment.subject}`}
                    onClose={() => {
                        setShowAssignmentForm(false);
                        setSelectedTaskForAssignment(null);
                    }}
                    isOpen={showAssignmentForm}
                >
                    <AssignmentForm 
                        task={selectedTaskForAssignment}
                        project={selectedProject}
                        onClose={() => {
                            setShowAssignmentForm(false);
                            setSelectedTaskForAssignment(null);
                        }}
                        onSuccess={handleAssignmentSuccess}
                    />
                </Modal>
            )}

            {tasksLoading && <p className="loading">Loading tasks...</p>}
            {tasksError && <p className="error">Error: {tasksError.message}</p>}
            {actionError && <p className="error">{actionError}</p>}

            {!tasksLoading && Array.isArray(tasks) && tasks.length === 0 && (
                <div className="empty-state">
                    <p>No tasks found for this project.</p>
                </div>
            )}

            <div className="task-list">
                {Array.isArray(tasks) && tasks.map(task => (
                    <div 
                        key={task.name}
                        className={`task-item ${selectedTask && selectedTask.name === task.name ? 'selected' : ''}`}
                        onClick={() => handleTaskClick(task)}
                    >
                        <div className="task-header">
                            <h3>{task.subject}</h3>
                            <div className="task-header-actions">
                                {taskPermissions[task.name] && (
                                    <button
                                        className="task-edit-btn"
                                        onClick={(e) => handleEditTask(task, e)}
                                        title="Edit Task"
                                    >
                                        <FaEdit />
                                    </button>
                                )}
                                <span className={`task-status status-${task.status?.toLowerCase()}`}>
                                    {task.status}
                                </span>
                            </div>
                        </div>
                        <div className="task-details">
                            <span className="task-id">{task.name}</span>
                            <span className="task-priority">Priority: {task.priority}</span>
                            {task.progress && (
                                <div className="progress-container">
                                    <div 
                                        className="progress-bar" 
                                        style={{width: `${task.progress}%`}}
                                    ></div>
                                    <span className="progress-text">{task.progress}%</span>
                                </div>
                            )}
                        </div>

                        {selectedTask && selectedTask.name === task.name && (
                            <div className="task-actions">
                                <button className="timesheet-btn" onClick={handleAddTimesheet}>
                                    <FaClock /> Add Timesheet Entry
                                </button>
                                
                                <button 
                                    className="assign-btn" 
                                    onClick={handleAssignToSelf}
                                    disabled={isAssigning}
                                >
                                    {isAssigning ? 'Assigning...' : 'Assign to Me'}
                                </button>
                                
                                <button 
                                    className="assign-task-btn" 
                                    onClick={(e) => handleAssignTask(task, e)}
                                >
                                    <FaUser /> Assign Task
                                </button>
                                
                                <div className="status-dropdown-container">
                                    <button 
                                        className="status-btn" 
                                        onClick={toggleStatusDropdown}
                                        disabled={isChangingStatus}
                                    >
                                        {isChangingStatus ? 'Updating...' : 'Change Status'}
                                    </button>
                                    
                                    {showStatusDropdown && (
                                        <div className="status-dropdown">
                                            {taskStatusOptions.map(status => (
                                                <div 
                                                    key={status} 
                                                    className={`status-option ${task.status === status ? 'selected' : ''}`}
                                                    onClick={(e) => handleStatusChange(status, e)}
                                                >
                                                    {status}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {showTimesheetForm && selectedTask && (
                <Modal
                    title={`Timesheet for: ${selectedTask.subject}`}
                    onClose={() => setShowTimesheetForm(false)}
                    isOpen={showTimesheetForm}
                >
                    <TimesheetForm 
                        task={selectedTask}
                        project={selectedProject}
                        onClose={() => setShowTimesheetForm(false)}
                        onSuccess={() => {
                            // Refresh tasks if needed
                            setShowTimesheetForm(false);
                        }}
                    />
                </Modal>
            )}

            <style jsx>{`
                .task-content {
                    padding: 1.5rem;
                    height: 100%;
                    overflow-y: auto;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .project-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin: 0;
                }
                .add-task-btn {
                    background-color: #4299e1;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    font-weight: 500;
                }
                .add-task-btn:hover {
                    background-color: #3182ce;
                }
                .empty-state {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 200px;
                    background-color: #f9fafb;
                    border-radius: 0.5rem;
                    color: #6b7280;
                }
                .loading, .error {
                    padding: 1rem;
                    border-radius: 0.375rem;
                }
                .error {
                    background-color: #fee2e2;
                    color: #b91c1c;
                }
                .task-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .task-item {
                    background-color: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.5rem;
                    padding: 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .task-item:hover {
                    border-color: #d1d5db;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }
                .task-item.selected {
                    border-color: #4299e1;
                    box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
                }
                .task-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 0.5rem;
                }
                .task-header h3 {
                    margin: 0;
                    font-size: 1rem;
                    font-weight: 500;
                }
                .task-status {
                    font-size: 0.75rem;
                    padding: 0.25rem 0.5rem;
                    border-radius: 1rem;
                    font-weight: 500;
                }
                .status-open {
                    background-color: #e0f2fe;
                    color: #0369a1;
                }
                .status-working {
                    background-color: #fef3c7;
                    color: #92400e;
                }
                .status-pending {
                    background-color: #f3e8ff;
                    color: #6b21a8;
                }
                .status-completed {
                    background-color: #dcfce7;
                    color: #15803d;
                }
                .task-details {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem 1rem;
                    font-size: 0.875rem;
                    color: #6b7280;
                    margin-bottom: 1rem;
                }
                .task-id {
                    font-family: monospace;
                }
                .progress-container {
                    width: 100%;
                    height: 0.5rem;
                    background-color: #e5e7eb;
                    border-radius: 0.25rem;
                    position: relative;
                    margin-top: 0.5rem;
                }
                .progress-bar {
                    height: 100%;
                    border-radius: 0.25rem;
                    background-color: #10b981;
                }
                .progress-text {
                    position: absolute;
                    right: 0;
                    top: -1.25rem;
                    font-size: 0.75rem;
                }
                .task-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e5e7eb;
                }
                .timesheet-btn, .assign-btn, .status-btn {
                    padding: 0.375rem 0.75rem;
                    border-radius: 0.375rem;
                    font-size: 0.875rem;
                    cursor: pointer;
                }
                .timesheet-btn {
                    background-color: #f3f4f6;
                    border: 1px solid #d1d5db;
                    color: #374151;
                }
                .timesheet-btn:hover:not(:disabled) {
                    background-color: #e5e7eb;
                }
                .assign-btn {
                    background-color: #e5f2ff;
                    border: 1px solid #90c8f9;
                    color: #1a73e8;
                }
                .assign-btn:hover:not(:disabled) {
                    background-color: #d0e7ff;
                }
                .status-btn {
                    background-color: #f0f5ff;
                    border: 1px solid #c7d9f9;
                    color: #3b5bdb;
                }
                .status-btn:hover:not(:disabled) {
                    background-color: #e5ecff;
                }
                .assign-task-btn {
                    background-color: #3b82f6;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: background-color 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .assign-task-btn:hover {
                    background-color: #2563eb;
                }
                .status-dropdown-container {
                    position: relative;
                    display: inline-block;
                }
                .status-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    margin-top: 0.25rem;
                    background-color: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.375rem;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    z-index: 10;
                    min-width: 150px;
                }
                .status-option {
                    padding: 0.5rem 0.75rem;
                    cursor: pointer;
                    font-size: 0.875rem;
                }
                .status-option:hover {
                    background-color: #f3f4f6;
                }
                .status-option.selected {
                    background-color: #e5e7eb;
                    font-weight: 500;
                }
                button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}