import React, { useEffect, useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { useProjectContext } from '../store/ProjectContext';
import AddProjectForm from './AddProjectForm';
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
            
            {isLoading && <p>Loading...</p>}
            {error && <p style={{color: '#dc3545'}}>Error: {error.message || error}</p>}
            <div className="project-list">
                {projects && Array.isArray(projects) && projects.length > 0 ? (
                    projects.map((project) => (
                        <button 
                            key={project.name} 
                            className={`project-item ${selectedProject && selectedProject.name === project.name ? 'selected' : ''}`}
                            onClick={() => handleSelectProject(project)}
                        >
                            {project.project_name || project.name}
                        </button>
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
