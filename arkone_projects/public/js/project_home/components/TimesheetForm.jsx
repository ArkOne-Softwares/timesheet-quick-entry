import React, { useState, useEffect } from 'react';
import { FaClock, FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';

const TimesheetForm = ({ task, project, onClose, onSuccess }) => {
  const [timesheetEntries, setTimesheetEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [projectDetails, setProjectDetails] = useState({});
  const [formData, setFormData] = useState({
    hours: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    activity_type: 'Task',
    department: '',
    customer: ''
  });

  // Fetch existing timesheet entries
  useEffect(() => {
    if (task && project) {
      fetchTimesheetEntries();
      fetchFormData();
    }
  }, [task, project]);

  const fetchFormData = async () => {
    try {
      // Fetch departments
      const deptResponse = await frappe.call({
        method: 'arkone_projects.arkone_projects.api.get_departments'
      });
      if (deptResponse.message?.success) {
        setDepartments(deptResponse.message.departments || []);
      }

      // Fetch customers
      const custResponse = await frappe.call({
        method: 'arkone_projects.arkone_projects.api.get_customers'
      });
      if (custResponse.message?.success) {
        setCustomers(custResponse.message.customers || []);
      }

      // Fetch activity types
      const actResponse = await frappe.call({
        method: 'arkone_projects.arkone_projects.api.get_activity_types'
      });
      if (actResponse.message?.success) {
        setActivityTypes(actResponse.message.activity_types || []);
      }

      // Fetch project details
      const projResponse = await frappe.call({
        method: 'arkone_projects.arkone_projects.api.get_project_details',
        args: { project_id: project.name }
      });
      if (projResponse.message?.success) {
        const projData = projResponse.message.details;
        setProjectDetails(projData);
        
        // Set default values from project
        setFormData(prev => ({
          ...prev,
          customer: projData.customer || '',
          department: projData.department || ''
        }));
      }
    } catch (err) {
      console.error('Error fetching form data:', err);
    }
  };

  const fetchTimesheetEntries = async () => {
    try {
      setLoading(true);
      const response = await frappe.call({
        method: 'arkone_projects.arkone_projects.api.get_task_timesheet_entries',
        args: { task_id: task.name }
      });

      if (response.message?.success) {
        setTimesheetEntries(response.message.entries || []);
      } else {
        setError(response.message?.error || 'Failed to fetch timesheet entries');
      }
    } catch (err) {
      console.error('Error fetching timesheet entries:', err);
      setError('Failed to fetch timesheet entries');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!formData.hours || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await frappe.call({
        method: 'arkone_projects.arkone_projects.api.create_timesheet_entry',
        args: {
          task_id: task.name,
          project_id: project.name,
          hours: parseFloat(formData.hours),
          description: formData.description,
          date: formData.date,
          activity_type: formData.activity_type,
          department: formData.department,
          customer: formData.customer
        }
      });

      if (response.message?.success) {
        setFormData({
          hours: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          activity_type: 'Task',
          department: projectDetails.department || '',
          customer: projectDetails.customer || ''
        });
        setShowAddForm(false);
        fetchTimesheetEntries();
        if (onSuccess) onSuccess();
      } else {
        setError(response.message?.error || 'Failed to add timesheet entry');
      }
    } catch (err) {
      console.error('Error adding timesheet entry:', err);
      setError('Failed to add timesheet entry');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEntry = async () => {
    if (!editingEntry || !formData.hours || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await frappe.call({
        method: 'arkone_projects.arkone_projects.api.update_timesheet_entry',
        args: {
          detail_name: editingEntry.name,
          hours: parseFloat(formData.hours),
          description: formData.description,
          date: formData.date,
          activity_type: formData.activity_type
        }
      });

      if (response.message?.success) {
        setEditingEntry(null);
        setFormData({
          hours: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          activity_type: 'Task',
          department: projectDetails.department || '',
          customer: projectDetails.customer || ''
        });
        fetchTimesheetEntries();
        if (onSuccess) onSuccess();
      } else {
        setError(response.message?.error || 'Failed to update timesheet entry');
      }
    } catch (err) {
      console.error('Error updating timesheet entry:', err);
      setError('Failed to update timesheet entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryName) => {
    if (!confirm('Are you sure you want to delete this timesheet entry?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await frappe.call({
        method: 'arkone_projects.arkone_projects.api.delete_timesheet_entry',
        args: { detail_name: entryName }
      });

      if (response.message?.success) {
        fetchTimesheetEntries();
        if (onSuccess) onSuccess();
      } else {
        setError(response.message?.error || 'Failed to delete timesheet entry');
      }
    } catch (err) {
      console.error('Error deleting timesheet entry:', err);
      setError('Failed to delete timesheet entry');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      hours: entry.hours.toString(),
      description: entry.description,
      date: entry.start_date,
      activity_type: entry.activity_type || 'Task',
      department: entry.department || projectDetails.department || '',
      customer: entry.customer || projectDetails.customer || ''
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingEntry(null);
    setFormData({
      hours: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      activity_type: 'Task',
      department: projectDetails.department || '',
      customer: projectDetails.customer || ''
    });
    setShowAddForm(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTotalHours = () => {
    return timesheetEntries.reduce((total, entry) => total + (entry.hours || 0), 0);
  };

  return (
    <div className="timesheet-form">
      <div className="timesheet-form-header">
        <div className="timesheet-icon">
          <FaClock />
        </div>
        <h3>Timesheet Entries</h3>
        <div className="total-hours">
          Total: {getTotalHours().toFixed(1)} hrs
        </div>
      </div>

      {error && (
        <div className="timesheet-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="timesheet-loading">
          Loading timesheet entries...
        </div>
      ) : (
        <>
          {/* Existing Timesheet Entries */}
          <div className="timesheet-entries">
            {timesheetEntries.length > 0 ? (
              timesheetEntries.map((entry) => (
                <div key={entry.name} className="timesheet-entry">
                  <div className="timesheet-entry-header">
                    <div className="timesheet-entry-info">
                      <div className="timesheet-entry-date">
                        {formatDate(entry.start_date)}
                      </div>
                      <div className="timesheet-entry-hours">
                        {entry.hours}h
                      </div>
                    </div>
                    <div className="timesheet-entry-actions">
                      <button
                        className="edit-btn"
                        onClick={() => startEdit(entry)}
                        title="Edit Entry"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteEntry(entry.name)}
                        title="Delete Entry"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="timesheet-entry-description">
                    {entry.description}
                  </div>
                  {entry.docstatus === 1 && (
                    <div className="timesheet-entry-status">
                      ✓ Submitted
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="timesheet-no-entries">
                No timesheet entries found for this task.
              </div>
            )}
          </div>

          {/* Add/Edit Form */}
          {showAddForm || editingEntry ? (
            <div className={`timesheet-add-form ${editingEntry ? 'editing' : ''}`}>
              <h4>{editingEntry ? 'Edit Entry' : 'Add New Entry'}</h4>
              
              <div className="timesheet-form-row">
                <div className="timesheet-form-group">
                  <label htmlFor="hours">Hours *</label>
                  <input
                    type="number"
                    id="hours"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    placeholder="e.g. 2.5"
                    min="0.1"
                    step="0.1"
                    required
                  />
                </div>
                <div className="timesheet-form-group">
                  <label htmlFor="date">Date</label>
                  <input
                    type="date"
                    id="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="timesheet-form-group">
                <label htmlFor="activity_type">Activity Type</label>
                <select
                  id="activity_type"
                  value={formData.activity_type}
                  onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
                >
                  {activityTypes.length > 0 ? (
                    activityTypes.map(type => (
                      <option key={type.name} value={type.name}>
                        {type.activity_type || type.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Task">Task</option>
                      <option value="Research">Research</option>
                      <option value="Development">Development</option>
                      <option value="Testing">Testing</option>
                      <option value="Documentation">Documentation</option>
                      <option value="Meeting">Meeting</option>
                    </>
                  )}
                </select>
              </div>

              <div className="timesheet-form-row">
                <div className="timesheet-form-group">
                  <label htmlFor="department">Department</label>
                  <select
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.name} value={dept.name}>
                        {dept.department_name || dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="timesheet-form-group">
                  <label htmlFor="customer">Customer</label>
                  <select
                    id="customer"
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  >
                    <option value="">Select Customer</option>
                    {customers.map(cust => (
                      <option key={cust.name} value={cust.name}>
                        {cust.customer_name || cust.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="timesheet-form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the work performed..."
                  rows="3"
                  required
                />
              </div>

              <div className="timesheet-form-actions">
                {editingEntry ? (
                  <>
                    <button
                      type="button"
                      className="timesheet-save-btn"
                      onClick={handleUpdateEntry}
                      disabled={loading}
                    >
                      <FaSave /> {loading ? 'Saving...' : 'Update Entry'}
                    </button>
                    <button
                      type="button"
                      className="timesheet-cancel-btn"
                      onClick={cancelEdit}
                      disabled={loading}
                    >
                      <FaTimes /> Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="timesheet-add-btn"
                      onClick={handleAddEntry}
                      disabled={loading}
                    >
                      <FaPlus /> {loading ? 'Adding...' : 'Add Entry'}
                    </button>
                    <button
                      type="button"
                      className="timesheet-cancel-btn"
                      onClick={cancelEdit}
                      disabled={loading}
                    >
                      <FaTimes /> Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <button
              className="timesheet-show-add-btn"
              onClick={() => setShowAddForm(true)}
            >
              <FaPlus /> Add Timesheet Entry
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default TimesheetForm;