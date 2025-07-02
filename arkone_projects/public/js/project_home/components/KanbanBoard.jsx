/**
 * Mobile-first Kanban Board Component
 * Drag and drop task management with react-beautiful-dnd
 */

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  FaClipboardList, 
  FaBolt, 
  FaEye, 
  FaCheckCircle, 
  FaPlus,
  FaEdit,
  FaFolder,
  FaCalendarAlt,
  FaClock
} from 'react-icons/fa';
import { useProjectContext } from '../store/ProjectContext';
import { getStatusColor, getPriorityIcon, formatDate, truncateText, extractInitials } from '../utils';
import AddTaskForm from './AddTaskForm';
import EditTaskForm from './EditTaskForm';
import TimesheetForm from './TimesheetForm';
import Modal from './Modal';
import { hasTaskEditPermission } from '../permissions';

const KanbanBoard = ({ tasks = [] }) => {
  const { updateTaskStatus, selectedProject, fetchTasksForProject } = useProjectContext();
  const [columns, setColumns] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [showEditTaskForm, setShowEditTaskForm] = useState(false);
  const [showTimesheetForm, setShowTimesheetForm] = useState(false);
  const [addTaskStatus, setAddTaskStatus] = useState('Open');
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTaskForTimesheet, setSelectedTaskForTimesheet] = useState(null);
  const [taskPermissions, setTaskPermissions] = useState({});

  // Standard task status columns
  const columnOrder = ['Open', 'Working', 'Pending Review', 'Completed'];
  const columnLabels = {
    'Open': <><FaClipboardList className="column-icon" /> To Do</>,
    'Working': <><FaBolt className="column-icon" /> In Progress</>, 
    'Pending Review': <><FaEye className="column-icon" /> Review</>,
    'Completed': <><FaCheckCircle className="column-icon" /> Done</>
  };

  // Organize tasks into columns and check permissions
  useEffect(() => {
    const organizedColumns = columnOrder.reduce((acc, status) => {
      acc[status] = tasks.filter(task => task.status === status);
      return acc;
    }, {});
    setColumns(organizedColumns);

    // Check edit permissions for all tasks
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

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle drag end
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) return;

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    const taskId = draggableId;

    try {
      // Optimistic update
      const sourceColumn = [...columns[source.droppableId]];
      const destColumn = [...columns[destination.droppableId]];
      const [movedTask] = sourceColumn.splice(source.index, 1);
      
      movedTask.status = newStatus;
      destColumn.splice(destination.index, 0, movedTask);

      setColumns({
        ...columns,
        [source.droppableId]: sourceColumn,
        [destination.droppableId]: destColumn
      });

      // Update backend - use special endpoint for completion
      if (newStatus === 'Completed') {
        const response = await frappe.call({
          method: 'arkone_projects.arkone_projects.api.complete_task_and_submit_timesheets',
          args: { task_id: taskId }
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
        } else {
          throw new Error(response.message?.error || 'Failed to complete task');
        }
      } else {
        // Regular status update
        await updateTaskStatus(taskId, newStatus);
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      frappe.show_alert({
        message: 'Failed to update task status: ' + (error.message || 'Unknown error'),
        indicator: 'red'
      });
      // Revert optimistic update by re-organizing tasks
      const revertedColumns = columnOrder.reduce((acc, status) => {
        acc[status] = tasks.filter(task => task.status === status);
        return acc;
      }, {});
      setColumns(revertedColumns);
    }
  };

  // Handle edit task
  const handleEditTask = (task, e) => {
    e.stopPropagation(); // Prevent drag from starting
    setEditingTask(task);
    setShowEditTaskForm(true);
  };

  // Handle edit task success
  const handleEditTaskSuccess = () => {
    // Refresh tasks for current project
    if (selectedProject?.name) {
      fetchTasksForProject(selectedProject.name);
    }
    setShowEditTaskForm(false);
    setEditingTask(null);
  };

  // Handle timesheet for task
  const handleTimesheetTask = (task, e) => {
    e.stopPropagation(); // Prevent drag from starting
    setSelectedTaskForTimesheet(task);
    setShowTimesheetForm(true);
  };

  // Handle timesheet success
  const handleTimesheetSuccess = () => {
    // Refresh tasks for current project to update logged hours
    if (selectedProject?.name) {
      fetchTasksForProject(selectedProject.name);
    }
  };

  // Handle task completion (automatically submit timesheet)
  const handleCompleteTask = async (taskId) => {
    try {
      await frappe.call({
        method: 'arkone_projects.arkone_projects.api.complete_task_and_submit_timesheets',
        args: { task_id: taskId }
      });
      
      // Refresh tasks
      if (selectedProject) {
        await fetchTasksForProject(selectedProject.name);
      }
      
      frappe.msgprint('Task completed and timesheets submitted successfully');
    } catch (error) {
      console.error('Error completing task:', error);
      frappe.msgprint('Error completing task and submitting timesheets');
    }
  };

  // Task card component
  const TaskCard = ({ task, index, isDragging }) => {
    const canEdit = taskPermissions[task.name] || false;
    
    return (
      <Draggable draggableId={task.name} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`arkone-task-card ${snapshot.isDragging ? 'dragging' : ''}`}
          >
            {/* Priority indicator and title */}
            <div className="arkone-task-header">
              <div className="arkone-task-title-section">
                <span>{getPriorityIcon(task.priority)}</span>
                <h4 className="arkone-task-title">
                  {isMobile ? truncateText(task.subject, 25) : task.subject}
                </h4>
              </div>
              <div className="arkone-task-actions">
                {canEdit && (
                  <button
                    className="task-edit-btn"
                    onClick={(e) => handleEditTask(task, e)}
                    title="Edit Task"
                  >
                    <FaEdit />
                  </button>
                )}
                <button
                  className="task-timesheet-btn"
                  onClick={(e) => handleTimesheetTask(task, e)}
                  title="Add Timesheet"
                >
                  <FaClock />
                </button>
                <span className={`arkone-priority-badge ${task.priority?.toLowerCase()}`}>
                  {task.priority}
                </span>
              </div>
            </div>

          {/* Task details */}
          <div className="arkone-task-details">
            {/* Project name (if visible) */}
            {task.project && (
              <div className="arkone-task-project">
                <FaFolder className="task-icon" /> {task.project}
              </div>
            )}

            {/* Due date */}
            {task.exp_end_date && (
              <div className="arkone-task-date">
                <FaCalendarAlt className="task-icon" />
                {formatDate(task.exp_end_date)}
              </div>
            )}

            {/* Progress bar */}
            {task.progress > 0 && (
              <div className="progress-container">
                <div 
                  className="progress-bar"
                  style={{ width: `${task.progress}%` }}
                />
                <span className="progress-text">{task.progress}%</span>
              </div>
            )}

            {/* Assigned user and hours */}
            <div className="arkone-task-meta">
              <div className="arkone-task-assignee">
                <div className="arkone-avatar">
                  {task.assignedUsers && task.assignedUsers.length > 0 ? 
                    extractInitials(task.assignedUsers[0]) : 
                    (task.owner ? extractInitials(task.owner) : 'U')
                  }
                </div>
                <span>
                  {isMobile ? 
                    (task.assignedUsers && task.assignedUsers.length > 0 ? 
                      extractInitials(task.assignedUsers[0]) : 
                      (task.owner ? extractInitials(task.owner) : 'Unassigned')
                    ) : 
                    (task.assignedUsers && task.assignedUsers.length > 0 ? 
                      task.assignedUsers[0] : 
                      (task.owner || 'Unassigned')
                    )
                  }
                </span>
              </div>
              {task.logged_hours > 0 && (
                <div className="arkone-task-hours">
                  <FaClock className="task-icon" /> {task.logged_hours}h
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

  // Column component
  const Column = ({ status, tasks, title }) => (
    <div className="arkone-kanban-column">
      {/* Column header */}
      <div className="arkone-kanban-header">
        <h3>{title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="arkone-kanban-count">
            {tasks.length}
          </span>
          <button 
            className="add-task-btn"
            onClick={() => {
              setAddTaskStatus(status);
              setShowAddTaskForm(true);
            }}
            title="Add Task"
            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
          >
            <FaPlus />
          </button>
        </div>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`arkone-kanban-tasks ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.name}
                task={task}
                index={index}
                isDragging={snapshot.isDraggingOver}
              />
            ))}
            {provided.placeholder}
            
            {/* Empty state */}
            {tasks.length === 0 && (
              <div className="arkone-empty-state">
                <div className="icon">📝</div>
                <p>No tasks</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );

  if (Object.keys(columns).length === 0) {
    return (
      <div className="arkone-loading">
        <div className="arkone-spinner"></div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="arkone-kanban">
      {/* Add Task Modal */}
      {showAddTaskForm && (
        <Modal
          title={`Add Task to ${columnLabels[addTaskStatus]}`}
          onClose={() => setShowAddTaskForm(false)}
          isOpen={showAddTaskForm}
        >
          <AddTaskForm 
            projectName={selectedProject?.name}
            onCancel={() => setShowAddTaskForm(false)}
            initialStatus={addTaskStatus}
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

      {/* Timesheet Modal */}
      {showTimesheetForm && selectedTaskForTimesheet && (
        <Modal
          title={`Timesheet for: ${selectedTaskForTimesheet.subject}`}
          onClose={() => {
            setShowTimesheetForm(false);
            setSelectedTaskForTimesheet(null);
          }}
          isOpen={showTimesheetForm}
        >
          <TimesheetForm 
            task={selectedTaskForTimesheet}
            project={selectedProject}
            onClose={() => {
              setShowTimesheetForm(false);
              setSelectedTaskForTimesheet(null);
            }}
            onSuccess={handleTimesheetSuccess}
          />
        </Modal>
      )}
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="arkone-kanban-board">
          {columnOrder.map(status => (
            <Column
              key={status}
              status={status}
              tasks={columns[status] || []}
              title={columnLabels[status]}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
