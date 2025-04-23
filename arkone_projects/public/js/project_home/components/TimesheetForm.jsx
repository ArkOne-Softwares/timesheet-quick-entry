import React, { useState, useEffect } from 'react';
import { useProjectContext } from '../store/ProjectContext';

export default function TimesheetForm({ task, onClose }) {
    const { createTimesheetEntry, selectedProject } = useProjectContext();
    const [activityTypes, setActivityTypes] = useState([]);
    const [timesheets, setTimesheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [useExistingTimesheet, setUseExistingTimesheet] = useState(true);
    // New states for task management
    const [isSubmittingTimesheet, setIsSubmittingTimesheet] = useState(false);
    
    const [formData, setFormData] = useState({
        parent: '', // Timesheet docname
        activity_type: '',
        from_time: new Date().toISOString().split('T')[0],
        hours: 1,
        description: task.subject || '',
        is_billable: 1,
        task: task.name,
    });

    // Fetch activity types, timesheets, and task statuses when component mounts
    useEffect(() => {
        Promise.all([
            fetchActivityTypes(),
            fetchTimesheets(),
        ]).then(() => {
            setLoading(false);
        }).catch(error => {
            setError(error.message || 'Failed to fetch required data');
            setLoading(false);
        });
    }, []);

    const fetchActivityTypes = async () => {
        return frappe.db.get_list('Activity Type', {
            fields: ['name'],
            limit: 50
        }).then(data => {
            setActivityTypes(data);
            if (data.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    activity_type: data[0].name
                }));
            }
        });
    };

    const fetchTimesheets = async () => {
        return frappe.db.get_list('Timesheet', {
            filters: {
                status: 'Draft'
            },
            fields: ['name'],
            limit: 10
        }).then(data => {
            setTimesheets(data);
            if (data.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    parent: data[0].name
                }));
            } else {
                // If no timesheets available, default to creating a new one
                setUseExistingTimesheet(false);
            }
        });
    };
    
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        }));
    };

    const toggleTimesheetMode = () => {
        setUseExistingTimesheet(prev => !prev);
    };

    // Submit timesheet and complete task
    const submitTimesheetAndCompleteTask = async () => {
        setIsSubmittingTimesheet(true);
        setError(null);
        
        try {
            // First check if we have a valid timesheet
            let timesheetDoc;
            
            if (useExistingTimesheet && formData.parent) {
                timesheetDoc = formData.parent;
            } else {
                // Create new timesheet first
                await createNewTimesheetWithEntry();
                // Get the newest timesheet created
                const timesheets = await frappe.db.get_list('Timesheet', {
                    filters: {
                        status: 'Draft',
                        owner: frappe.session.user
                    },
                    fields: ['name'],
                    order_by: 'creation desc',
                    limit: 1
                });
                
                if (timesheets && timesheets.length > 0) {
                    timesheetDoc = timesheets[0].name;
                } else {
                    throw new Error("Could not find the created timesheet");
                }
            }
            
            // Submit the timesheet
            await frappe.call({
                method: 'frappe.client.submit',
                args: {
                    doc: {
                        doctype: 'Timesheet',
                        name: timesheetDoc
                    }
                }
            });
            
            // Get employee data for current user
            const employeeData = await frappe.db.get_list('Employee', { 
                filters: { user_id: frappe.session.user },
                fields: ['name']
            });
            
            if (!employeeData || employeeData.length === 0) {
                throw new Error("Could not find an employee record for the current user");
            }
            
            // Update the task as completed
            await frappe.db.set_value('Task', task.name, {
                status: 'Completed',
                completed_by: employeeData[0].name,
                completed_on: frappe.datetime.now_datetime()
            });
            
            frappe.show_alert({
                message: 'Timesheet submitted and task completed successfully',
                indicator: 'green'
            });
            
            onClose(); // Close the form on success
        } catch (err) {
            setError(err.message || 'Failed to submit timesheet and complete task');
        } finally {
            setIsSubmittingTimesheet(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (useExistingTimesheet) {
                const timesheetDetail = {
                    activity_type: formData.activity_type,
                    from_time: `${formData.from_time} 00:00:00`,
                    hours: parseFloat(formData.hours),
                    description: formData.description,
                    is_billable: formData.is_billable,
                    task: formData.task,
                    parent_project: selectedProject?.name,
                    parent: formData.parent,
                };
                await createTimesheetEntry(timesheetDetail);
            } else {
                // Create a new timesheet with this entry
                await createNewTimesheetWithEntry();
            }
            
            frappe.show_alert({
                message: 'Timesheet entry added successfully',
                indicator: 'green'
            });
            onClose(); // Close the form on success
        } catch (err) {
            setError(err.message || 'Failed to create timesheet entry');
        } finally {
            setIsSubmitting(false);
        }
    };

    const createNewTimesheetWithEntry = async () => {
        // Get current user and employee info
        const userData = await frappe.db.get_value('User', frappe.session.user, ['full_name']);
        const employeeData = await frappe.db.get_list('Employee', { 
            filters: { user_id: frappe.session.user },
            fields: ['name']
        });

        if (!employeeData || employeeData.length === 0) {
            throw new Error("Could not find an employee record for the current user");
        }

        // Create new timesheet document with the timesheet detail
        const timesheetDetail = {
            activity_type: formData.activity_type,
            from_time: `${formData.from_time} 00:00:00`,
            hours: parseFloat(formData.hours),
            description: formData.description,
            is_billable: formData.is_billable,
            task: formData.task,
            parent_project: selectedProject?.name,
            parent: formData.parent,
        };

        const newTimesheet = {
            doctype: 'Timesheet',
            employee: employeeData[0].name,
            employee_name: userData.message.full_name,
            status: 'Draft',
            time_logs: [timesheetDetail]
        };

        // Add project info if available
        if (selectedProject) {
            if (selectedProject.company) {
                newTimesheet.company = selectedProject.company;
            }
            
            if (selectedProject.customer) {
                newTimesheet.customer = selectedProject.customer;
            }
        }

        // Create the timesheet with child record already filled
        await frappe.db.insert(newTimesheet);
    };

    if (loading) {
        return (
            <div className="timesheet-form loading-state">
                <p>Loading form data...</p>
            </div>
        );
    }

    return (
        <div className="timesheet-form">
            <div className="form-header">
                <h3>Add Timesheet Entry</h3>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>
            
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
            
            {/* Task Management Buttons */}
            <div className="task-management-buttons">
                <button 
                    type="button" 
                    className="task-btn submit-timesheet-btn"
                    onClick={submitTimesheetAndCompleteTask}
                    disabled={isSubmittingTimesheet}
                >
                    {isSubmittingTimesheet ? 'Processing...' : 'Submit & Complete Task'}
                </button>
            </div>
            
            <form onSubmit={handleSubmit}>
                <div className="timesheet-option">
                    <div className="radio-group">
                        <label className="radio-label">
                            <input 
                                type="radio" 
                                name="timesheetMode" 
                                checked={useExistingTimesheet} 
                                onChange={toggleTimesheetMode}
                                disabled={timesheets.length === 0} 
                            />
                            Use existing timesheet
                        </label>
                        <label className="radio-label">
                            <input 
                                type="radio" 
                                name="timesheetMode" 
                                checked={!useExistingTimesheet}
                                onChange={toggleTimesheetMode}
                            />
                            Create new timesheet
                        </label>
                    </div>
                    
                    {useExistingTimesheet && timesheets.length > 0 && (
                        <div className="form-group">
                            <label htmlFor="parent">Select Timesheet</label>
                            <select
                                id="parent"
                                name="parent"
                                value={formData.parent}
                                onChange={handleChange}
                                required={useExistingTimesheet}
                                className="select-timesheet"
                            >
                                {timesheets.map(ts => (
                                    <option key={ts.name} value={ts.name}>{ts.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {useExistingTimesheet && timesheets.length === 0 && (
                        <div className="no-timesheet-message">
                            <p>No existing timesheets found. Please create a new one.</p>
                        </div>
                    )}
                </div>
                
                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Describe the work done"
                        required
                    ></textarea>
                </div>
                
                <div className="form-group">
                    <label htmlFor="activity_type">Activity Type</label>
                    <select
                        id="activity_type"
                        name="activity_type"
                        value={formData.activity_type}
                        onChange={handleChange}
                        required
                    >
                        {activityTypes.length === 0 && (
                            <option value="">No activity types available</option>
                        )}
                        {activityTypes.map(type => (
                            <option key={type.name} value={type.name}>{type.name}</option>
                        ))}
                    </select>
                </div>
                
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="from_time">Date</label>
                        <input
                            type="date"
                            id="from_time"
                            name="from_time"
                            value={formData.from_time}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="hours">Hours</label>
                        <input
                            type="number"
                            id="hours"
                            name="hours"
                            value={formData.hours}
                            onChange={handleChange}
                            min="0.1"
                            step="0.1"
                            required
                        />
                    </div>
                </div>
                
                <div className="form-group checkbox-group">
                    <input
                        type="checkbox"
                        id="is_billable"
                        name="is_billable"
                        checked={formData.is_billable === 1}
                        onChange={handleChange}
                    />
                    <label htmlFor="is_billable">Is Billable</label>
                </div>
                
                <div className="form-actions">
                    <button 
                        type="button" 
                        className="cancel-btn" 
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="submit-btn"
                        disabled={isSubmitting || !formData.activity_type || (useExistingTimesheet && timesheets.length === 0)}
                    >
                        {isSubmitting ? 'Saving...' : 'Save Entry'}
                    </button>
                </div>
            </form>
            
            <style jsx>{`
                .timesheet-form {
                    background-color: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.5rem;
                    padding: 1.5rem;
                    margin-top: 1.5rem;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .form-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.25rem;
                }
                h3 {
                    margin: 0;
                    font-size: 1.125rem;
                }
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    line-height: 1;
                    cursor: pointer;
                    color: #6b7280;
                }
                .error-message {
                    background-color: #fee2e2;
                    color: #b91c1c;
                    padding: 0.75rem;
                    border-radius: 0.375rem;
                    margin-bottom: 1rem;
                    font-size: 0.875rem;
                }
                .loading-state {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 200px;
                }
                .timesheet-option {
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid #e5e7eb;
                }
                .radio-group {
                    display: flex;
                    gap: 1.5rem;
                    margin-bottom: 1rem;
                }
                .radio-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    font-weight: 500;
                }
                .no-timesheet-message {
                    background-color: #f3f4f6;
                    padding: 0.75rem;
                    border-radius: 0.375rem;
                    margin-top: 0.5rem;
                    font-size: 0.875rem;
                    color: #4b5563;
                }
                .select-timesheet {
                    margin-top: 0.5rem;
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
                .checkbox-group {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .checkbox-group input {
                    width: auto;
                }
                .checkbox-group label {
                    margin-bottom: 0;
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
                input[type="radio"] {
                    width: auto;
                    margin-right: 0.25rem;
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
                
                /* New styles for task management buttons */
                .task-management-buttons {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1.25rem;
                    flex-wrap: wrap;
                }
                
                .task-btn {
                    padding: 0.5rem 0.75rem;
                    font-size: 0.8125rem;
                    border-radius: 0.375rem;
                    font-weight: 500;
                    cursor: pointer;
                    flex: 1;
                    min-width: 120px;
                    text-align: center;
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
                
                .submit-timesheet-btn {
                    background-color: #edf9e6;
                    border: 1px solid #b9e3a5;
                    color: #2e7d32;
                }
                
                .submit-timesheet-btn:hover:not(:disabled) {
                    background-color: #dff3d5;
                }
                
                .status-change-container {
                    position: relative;
                    flex: 1;
                    min-width: 120px;
                }
                
                .status-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background-color: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.375rem;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    z-index: 10;
                    max-height: 200px;
                    overflow-y: auto;
                    margin-top: 0.25rem;
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
            `}</style>
        </div>
    );
}