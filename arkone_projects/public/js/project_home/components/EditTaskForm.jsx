import React, { useState, useEffect } from 'react';
import { useProjectContext } from '../store/ProjectContext';

export default function EditTaskForm({ task, onCancel, onSuccess }) {
    const { updateTask } = useProjectContext();
    const [formData, setFormData] = useState({
        subject: '',
        project: '',
        description: '',
        status: '',
        priority: '',
        exp_start_date: '',
        exp_end_date: '',
        progress: 0,
        owner: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Initialize form data with task values
    useEffect(() => {
        if (task) {
            setFormData({
                subject: task.subject || '',
                project: task.project || '',
                description: task.description || '',
                status: task.status || '',
                priority: task.priority || '',
                exp_start_date: task.exp_start_date || '',
                exp_end_date: task.exp_end_date || '',
                progress: task.progress || 0,
                owner: task.owner || ''
            });
        }
    }, [task]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!formData.subject.trim()) {
            setError('Task subject is required');
            return false;
        }
        
        if (formData.exp_start_date && formData.exp_end_date) {
            const startDate = new Date(formData.exp_start_date);
            const endDate = new Date(formData.exp_end_date);
            if (startDate >= endDate) {
                setError('End date must be after start date');
                return false;
            }
        }

        if (formData.progress < 0 || formData.progress > 100) {
            setError('Progress must be between 0 and 100');
            return false;
        }
        
        setError(null);
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setIsSubmitting(true);
        setError(null);

        try {
            // Use Frappe's native API to update task
            const response = await frappe.call({
                method: 'frappe.client.set_value',
                args: {
                    doctype: 'Task',
                    name: task.name,
                    fieldname: formData
                }
            });

            if (response) {
                // Refresh tasks
                if (updateTask) {
                    await updateTask(task.name, formData);
                }
                onSuccess && onSuccess();
                onCancel(); // Close the form on success
            }
        } catch (err) {
            console.error('Error updating task:', err);
            setError(err.message || 'Failed to update task');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!task) {
        return null;
    }

    return (
        <div className="add-task-form">
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="subject">Task Subject *</label>
                    <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        placeholder="Enter a clear and descriptive task name"
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
                        placeholder="Describe what needs to be done, requirements, or acceptance criteria"
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

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="progress">Progress (%)</label>
                        <input
                            type="number"
                            id="progress"
                            name="progress"
                            value={formData.progress}
                            onChange={handleChange}
                            min="0"
                            max="100"
                            placeholder="0-100"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="owner">Assigned To</label>
                        <input
                            type="text"
                            id="owner"
                            name="owner"
                            value={formData.owner}
                            onChange={handleChange}
                            placeholder="User email or name"
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
                        {isSubmitting ? 'Updating Task...' : 'Update Task'}
                    </button>
                </div>
            </form>
        </div>
    );
}
