import React, { useEffect } from 'react';
import { useProjectContext } from '../store/ProjectContext';

export default function Projects() {
    const { 
        projects, 
        isLoading, 
        error, 
        fetchProjects, 
        selectedProject, 
        setSelectedProject 
    } = useProjectContext();

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleSelectProject = (project) => {
        setSelectedProject(project);
    };

    return (
        <div className="project-sidebar">
            <h2 className="sidebar-title">Projects</h2>
            {isLoading && <p>Loading...</p>}
            {error && <p className="text-danger">Error: {error.message}</p>}
            <div className="project-list">
                {projects && projects.map((project) => (
                    <button 
                        key={project.name} 
                        className={`project-item ${selectedProject && selectedProject.name === project.name ? 'selected' : ''}`}
                        onClick={() => handleSelectProject(project)}
                    >
                        {project.project_name || project.name}
                    </button>
                ))}
            </div>
            <style jsx>{`
                .project-sidebar {
                    width: 100%;
                    height: 100%;
                    background-color: #f5f7fa;
                    padding: 1rem;
                    overflow-y: auto;
                    border-right: 1px solid #e2e8f0;
                }
                .sidebar-title {
                    margin-bottom: 1rem;
                    font-size: 1.25rem;
                    font-weight: 600;
                }
                .project-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .project-item {
                    text-align: left;
                    padding: 0.75rem 1rem;
                    background-color: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .project-item:hover {
                    background-color: #edf2f7;
                }
                .project-item.selected {
                    background-color: #4299e1;
                    color: white;
                    border-color: #4299e1;
                }
            `}</style>
        </div>
    );
}
