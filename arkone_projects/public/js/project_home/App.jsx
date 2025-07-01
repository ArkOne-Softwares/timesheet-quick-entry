import * as React from "react";
import { useState } from "react";
import Projects from "./components/Projects";
import Tasks from "./components/Tasks";
import KanbanBoard from "./components/KanbanBoard";
import FilterBar from "./components/FilterBar";
import { ProjectProvider, useProjectContext } from "./store/ProjectContext";
import Alltasks from "./components/Alltasks";
import "../../css/arkone_projects.css"; 

const AppContent = ({ showTasks = false }) => {
  const { tasks, selectedProject } = useProjectContext();
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [filteredTasks, setFilteredTasks] = useState([]);

  // If showing all tasks view
  if (showTasks) {
    return (
      <div className="arkone-app-content">
        <div className="arkone-header">
          <h1>All Tasks</h1>
        </div>
        <FilterBar 
          data={tasks} 
          onFilteredData={setFilteredTasks}
          storageKey="all_tasks"
        />
        <div className="arkone-content">
          <Alltasks tasks={filteredTasks} />
        </div>
      </div>
    );
  }

  return (
    <div className="arkone-app-content">
      {/* Sidebar */}
      <div className="arkone-sidebar">
        <Projects />
      </div>
      
      {/* Main content */}
      <div className="arkone-main">
        {/* Header */}
        <div className="arkone-header">
          <div className="arkone-header-content">
            <div>
              <h1>
                {selectedProject ? selectedProject.project_name : 'Select a Project'}
              </h1>
              {selectedProject && (
                <p>
                  {tasks.length} tasks • {selectedProject.status}
                </p>
              )}
            </div>
            
            {/* View mode toggle */}
            {selectedProject && (
              <div className="arkone-view-toggle">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={viewMode === 'kanban' ? 'active' : ''}
                >
                  📋 Board
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'active' : ''}
                >
                  📄 List
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter bar */}
        {selectedProject && (
          <FilterBar 
            data={tasks} 
            onFilteredData={setFilteredTasks}
            storageKey={`project_${selectedProject.name}`}
            showProjectFilter={false}
          />
        )}

        {/* Content area */}
        <div className="arkone-content">
          {!selectedProject ? (
            <div className="arkone-empty-state">
              <div className="arkone-empty-state-content">
                <div className="icon">📋</div>
                <h3>
                  Select a project to get started
                </h3>
                <p>
                  Choose a project from the sidebar to view and manage its tasks
                </p>
              </div>
            </div>
          ) : (
            <>
              {viewMode === 'kanban' ? (
                <KanbanBoard tasks={filteredTasks} />
              ) : (
                <Tasks tasks={filteredTasks} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export function App({ showTasks = false }) {
  return (
    <ProjectProvider>
      <div className="arkone-app">
        <AppContent showTasks={showTasks} />
      </div>
    </ProjectProvider>
  );
}