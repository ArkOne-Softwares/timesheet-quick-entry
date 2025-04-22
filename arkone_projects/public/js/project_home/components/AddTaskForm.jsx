import React, { useState } from 'react';
import { useProjectContext } from '../store/ProjectContext';

export default function AddTaskForm({ projectName, onCancel }) {
    const { createTask } = useProjectContext();
    const [formData, setFormData] = useState({
        subject: '',
        project: projectName,
        description: '',
        status: 'Open',
        priority: 'Medium',
        exp_start_date: '',
        exp_end_date: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            await createTask(formData);
            onCancel(); // Close the form on success
        } catch (err) {
            setError(err.message || 'Failed to create task');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="add-task-form">
            <h3>Add New Task</h3>
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="subject">Subject *</label>
                    <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        placeholder="Enter task subject"
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Enter task description"
                    ></textarea>
                </div>
                
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="status">Status</label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <option value="Open">Open</option>
                            <option value="Working">Working</option>
                            <option value="Pending Review">Pending Review</option>
                            <option value="Overdue">Overdue</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="priority">Priority</label>
                        <select
                            id="priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                        </select>
                    </div>
                </div>
                
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="exp_start_date">Expected Start Date</label>
                        <input
                            type="date"
                            id="exp_start_date"
                            name="exp_start_date"
                            value={formData.exp_start_date}
                            onChange={handleChange}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="exp_end_date">Expected End Date</label>
                        <input
                            type="date"
                            id="exp_end_date"
                            name="exp_end_date"
                            value={formData.exp_end_date}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                
                <div className="form-actions">
                    <button 
                        type="button" 
                        className="cancel-btn" 
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="submit-btn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating...' : 'Create Task'}
                    </button>
                </div>
            </form>
            
            <style jsx>{`
                .add-task-form {
                    background-color: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.5rem;
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                }
                h3 {
                    margin-top: 0;
                    margin-bottom: 1.25rem;
                    font-size: 1.125rem;
                }
                .error-message {
                    background-color: #fee2e2;
                    color: #b91c1c;
                    padding: 0.75rem;
                    border-radius: 0.375rem;
                    margin-bottom: 1rem;
                    font-size: 0.875rem;
                }
                .form-group {
                    margin-bottom: 1rem;
                    width: 100%;
                }
                .form-row {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 500;
                    margin-bottom: 0.25rem;
                }
                input, select, textarea {
                    width: 100%;
                    padding: 0.5rem;
                    font-size: 0.875rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    background-color: white;
                }
                textarea {
                    resize: vertical;
                }
                input:focus, select:focus, textarea:focus {
                    outline: none;
                    border-color: #4299e1;
                    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
                }
                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    margin-top: 1.25rem;
                }
                button {
                    padding: 0.5rem 1rem;
                    font-size: 0.875rem;
                    border-radius: 0.375rem;
                    font-weight: 500;
                    cursor: pointer;
                }
                button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                .cancel-btn {
                    background-color: white;
                    border: 1px solid #d1d5db;
                    color: #374151;
                }
                .cancel-btn:hover:not(:disabled) {
                    background-color: #f3f4f6;
                }
                .submit-btn {
                    background-color: #4299e1;
                    border: 1px solid #4299e1;
                    color: white;
                }
                .submit-btn:hover:not(:disabled) {
                    background-color: #3182ce;
                }
            `}</style>
        </div>
    );
}