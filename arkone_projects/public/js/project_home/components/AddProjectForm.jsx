import React, { useState, useEffect } from 'react';
import SearchInput from './SearchInput.jsx';

export default function AddProjectForm({ onCancel, onSuccess }) {
    const [formData, setFormData] = useState({
        project_name: '',
        status: 'Open',
        priority: 'Medium',
        expected_start_date: '',
        expected_end_date: '',
        project_type: 'Internal',
        customer: '',
        department: '',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(true);

    // Fetch departments and customers on component mount
    useEffect(() => {
        fetchDropdownOptions();
    }, []);

    const fetchDropdownOptions = async () => {
        try {
            setLoadingOptions(true);
            
            // Fetch departments
            const deptResponse = await frappe.call({
                method: 'arkone_projects.arkone_projects.api.get_departments'
            });
            
            if (deptResponse.message?.success) {
                setDepartments(deptResponse.message.departments || []);
            }
        } catch (err) {
            console.error('Error fetching dropdown options:', err);
        } finally {
            setLoadingOptions(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Search function for project types
    const searchProjectTypes = async (query) => {
        try {
            const response = await frappe.call({
                method: 'arkone_projects.arkone_projects.api.search_project_types',
                args: { query }
            });
            
            if (response.message?.success) {
                return response.message.project_types || [];
            }
            return [];
        } catch (err) {
            console.error('Error searching project types:', err);
            return [];
        }
    };

    // Search function for customers
    const searchCustomers = async (query) => {
        try {
            const response = await frappe.call({
                method: 'arkone_projects.arkone_projects.api.search_customers',
                args: { query }
            });
            
            if (response.message?.success) {
                return response.message.customers || [];
            }
            return [];
        } catch (err) {
            console.error('Error searching customers:', err);
            return [];
        }
    };

    // Handle selection from SearchInput components
    const handleProjectTypeSelect = (projectType) => {
        setFormData(prev => ({
            ...prev,
            project_type: projectType.name,
            // Clear customer if switching to Internal
            customer: projectType.name === 'Internal' ? '' : prev.customer
        }));
    };

    const handleCustomerSelect = (customer) => {
        setFormData(prev => ({
            ...prev,
            customer: customer.name
        }));
    };

    const validateForm = () => {
        if (!formData.project_name.trim()) {
            setError('Project name is required');
            return false;
        }
        
        if (formData.expected_start_date && formData.expected_end_date) {
            const startDate = new Date(formData.expected_start_date);
            const endDate = new Date(formData.expected_end_date);
            if (startDate >= endDate) {
                setError('End date must be after start date');
                return false;
            }
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
            // Prepare project data, excluding empty department and customer fields
            const projectData = {
                doctype: 'Project',
                project_name: formData.project_name,
                status: formData.status,
                priority: formData.priority,
                expected_start_date: formData.expected_start_date || null,
                expected_end_date: formData.expected_end_date || null,
                project_type: formData.project_type,
                description: formData.description || null
            };

            // Only include department if it's selected and valid
            if (formData.department && formData.department.trim()) {
                projectData.department = formData.department;
            }

            // Only include customer if it's selected and valid
            if (formData.customer && formData.customer.trim()) {
                projectData.customer = formData.customer;
            }

            // Use Frappe's native API to create project
            const response = await frappe.call({
                method: 'frappe.client.insert',
                args: {
                    doc: projectData
                }
            });

            if (response.message) {
                onSuccess && onSuccess(response.message);
                onCancel(); // Close the form on success
            }
        } catch (err) {
            console.error('Error creating project:', err);
            setError(err.message || 'Failed to create project');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="add-task-form">
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                {/* Basic Information */}
                <div className="form-group">
                    <label htmlFor="project_name">Project Name *</label>
                    <input
                        type="text"
                        id="project_name"
                        name="project_name"
                        value={formData.project_name}
                        onChange={handleChange}
                        required
                        placeholder="Enter a descriptive project name"
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
                        placeholder="Describe the project goals and scope"
                    ></textarea>
                </div>
                
                {/* Project Settings */}
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
                        <label htmlFor="project_type">Project Type</label>
                        <SearchInput
                            searchFunction={searchProjectTypes}
                            onSelect={handleProjectTypeSelect}
                            placeholder="Search project types..."
                            value={formData.project_type}
                            getDisplayText={(item) => item.name}
                            getSubText={(item) => item.description}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="department">Department</label>
                        <select
                            id="department"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                        >
                            <option value="">Select Department (Optional)</option>
                            {departments.map((dept) => (
                                <option key={dept.name} value={dept.name}>
                                    {dept.department_name || dept.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                
                {/* Customer Information - Only show if project type is not Internal */}
                {formData.project_type !== 'Internal' && (
                    <div className="form-group">
                        <label htmlFor="customer">Customer</label>
                        <SearchInput
                            searchFunction={searchCustomers}
                            onSelect={handleCustomerSelect}
                            placeholder="Search customers..."
                            value={formData.customer}
                            getDisplayText={(item) => item.customer_name || item.name}
                            getSubText={(item) => item.customer_group}
                        />
                    </div>
                )}
                
                {/* Timeline */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="expected_start_date">Expected Start Date</label>
                        <input
                            type="date"
                            id="expected_start_date"
                            name="expected_start_date"
                            value={formData.expected_start_date}
                            onChange={handleChange}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="expected_end_date">Expected End Date</label>
                        <input
                            type="date"
                            id="expected_end_date"
                            name="expected_end_date"
                            value={formData.expected_end_date}
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
                        {isSubmitting ? 'Creating Project...' : 'Create Project'}
                    </button>
                </div>
            </form>
        </div>
    );
}
