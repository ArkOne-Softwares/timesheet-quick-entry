import React, { useEffect, useState } from 'react';
import { FaPlus, FaCog } from 'react-icons/fa';
import { useProjectContext } from '../store/ProjectContext';
import AddProjectForm from './AddProjectForm';
import ProjectSettings from './ProjectSettings';
import Modal from './Modal';

export default function Projects() {
    const { 
        projects, 
        isLoading, 
        error, 
        fetchProjects, 
        selectedProject, 
        setSelectedProject 
    } = useProjectContext();
    
    const [showAddProjectForm, setShowAddProjectForm] = useState(false);
    const [showProjectSettings, setShowProjectSettings] = useState(false);
    const [settingsProject, setSettingsProject] = useState(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleSelectProject = (project) => {
        setSelectedProject(project);
    };

    const handleProjectCreated = (newProject) => {
        // Refresh projects list
        fetchProjects();
        setShowAddProjectForm(false);
    };

    const handleProjectSettings = (project, e) => {
        e.stopPropagation(); // Prevent project selection
        setSettingsProject(project);
        setShowProjectSettings(true);
    };

    const handleSettingsSuccess = () => {
        // Refresh projects if needed
        fetchProjects();
    };

    return (
        <div className="project-sidebar">
            <div className="header">
                <h2 className="sidebar-title">Projects</h2>
                <button 
                    className="add-task-btn"
                    onClick={() => setShowAddProjectForm(true)}
                    title="Add New Project"
                >
                    <FaPlus style={{ marginRight: '6px' }} />
                    Add
                </button>
            </div>
            
            {/* Add Project Modal */}
            {showAddProjectForm && (
                <Modal
                    title="Create New Project"
                    onClose={() => setShowAddProjectForm(false)}
                    isOpen={showAddProjectForm}
                >
                    <AddProjectForm 
                        onCancel={() => setShowAddProjectForm(false)}
                        onSuccess={handleProjectCreated}
                    />
                </Modal>
            )}

            {/* Project Settings Modal */}
            {showProjectSettings && settingsProject && (
                <Modal
                    title={`Settings - ${settingsProject.project_name || settingsProject.name}`}
                    onClose={() => {
                        setShowProjectSettings(false);
                        setSettingsProject(null);
                    }}
                    isOpen={showProjectSettings}
                >
                    <ProjectSettings 
                        project={settingsProject}
                        onClose={() => {
                            setShowProjectSettings(false);
                            setSettingsProject(null);
                        }}
                        onSuccess={handleSettingsSuccess}
                    />
                </Modal>
            )}
            
            {isLoading && <p>Loading...</p>}
            {error && <p style={{color: '#dc3545'}}>Error: {error.message || error}</p>}
            <div className="project-list">
                {projects && Array.isArray(projects) && projects.length > 0 ? (
                    projects.map((project) => (
                        <div 
                            key={project.name} 
                            className={`project-item-wrapper ${selectedProject && selectedProject.name === project.name ? 'selected' : ''}`}
                        >
                            <button 
                                className="project-item"
                                onClick={() => handleSelectProject(project)}
                            >
                                {project.project_name || project.name}
                            </button>
                            <button
                                className="project-settings-btn"
                                onClick={(e) => handleProjectSettings(project, e)}
                                title="Project Settings"
                            >
                                <FaCog />
                            </button>
                        </div>
                    ))
                ) : (
                    !isLoading && (
                        <div className="empty-state">
                            <p>No projects found</p>
                            <p style={{fontSize: '0.875rem', color: '#666', marginTop: '0.5rem'}}>
                                Create your first project to get started
                            </p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
