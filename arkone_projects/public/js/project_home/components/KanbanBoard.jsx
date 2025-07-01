/**
 * Mobile-first Kanban Board Component
 * Drag and drop task management with react-beautiful-dnd
 */

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useProjectContext } from '../store/ProjectContext';
import { getStatusColor, getPriorityIcon, formatDate, truncateText, extractInitials } from '../utils';
import AddTaskForm from './AddTaskForm';
import Modal from './Modal';

const KanbanBoard = ({ tasks = [] }) => {
  const { updateTaskStatus, selectedProject } = useProjectContext();
  const [columns, setColumns] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [addTaskStatus, setAddTaskStatus] = useState('Open');

  // Standard task status columns
  const columnOrder = ['Open', 'Working', 'Pending Review', 'Completed'];
  const columnLabels = {
    'Open': '📋 To Do',
    'Working': '⚡ In Progress', 
    'Pending Review': '👀 Review',
    'Completed': '✅ Done'
  };

  // Organize tasks into columns
  useEffect(() => {
    const organizedColumns = columnOrder.reduce((acc, status) => {
      acc[status] = tasks.filter(task => task.status === status);
      return acc;
    }, {});
    setColumns(organizedColumns);
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

      // Update backend
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error('Failed to update task status:', error);
      // Revert optimistic update by re-organizing tasks
      const revertedColumns = columnOrder.reduce((acc, status) => {
        acc[status] = tasks.filter(task => task.status === status);
        return acc;
      }, {});
      setColumns(revertedColumns);
    }
  };

  // Task card component
  const TaskCard = ({ task, index, isDragging }) => (
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
            <span className={`arkone-priority-badge ${task.priority?.toLowerCase()}`}>
              {task.priority}
            </span>
          </div>

          {/* Task details */}
          <div className="arkone-task-details">
            {/* Project name (if visible) */}
            {task.project && (
              <div className="arkone-task-project">
                📁 {task.project}
              </div>
            )}

            {/* Due date */}
            {task.exp_end_date && (
              <div className="arkone-task-date">
                <span>📅</span>
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
                  {task.owner ? extractInitials(task.owner) : 'U'}
                </div>
                <span>
                  {isMobile ? 
                    (task.owner ? extractInitials(task.owner) : 'Unassigned') : 
                    (task.owner || 'Unassigned')
                  }
                </span>
              </div>
              {task.logged_hours > 0 && (
                <div className="arkone-task-hours">
                  ⏱️ {task.logged_hours}h
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );

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
            ➕
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
