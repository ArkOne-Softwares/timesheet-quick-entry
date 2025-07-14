import React, { useState, useEffect } from 'react';
import { FaClock, FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaTasks, FaCalendarAlt, FaPlay, FaProjectDiagram, FaUser, FaStopwatch } from 'react-icons/fa';

const TimesheetForm = ({ task, project, onClose, onSuccess }) => {
  const [timesheetEntries, setTimesheetEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [projectDetails, setProjectDetails] = useState({});
  const [formData, setFormData] = useState({
    hours: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    activity_type: 'Development',
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

      // Fetch activity types
      const actResponse = await frappe.call({
        method: 'arkone_projects.arkone_projects.api.get_activity_types'
      });
      if (actResponse.message?.success) {
        setActivityTypes(actResponse.message.activity_types || []);
        
        // Set the first activity type as default if available
        const firstActivityType = actResponse.message.activity_types?.[0];
        if (firstActivityType) {
          setFormData(prev => ({
            ...prev,
            activity_type: firstActivityType.name
          }));
        }
      }

      // Fetch project details
      const projResponse = await frappe.call({
        method: 'arkone_projects.arkone_projects.api.get_project_details',
        args: { project_id: project.name }
      });
      if (projResponse.message?.success) {
        const projData = projResponse.message.details;
        setProjectDetails(projData);
        
        // Set default values from project (customer will be used automatically in backend)
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
          activity_type: activityTypes[0]?.name || 'Development',
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
          activity_type: activityTypes[0]?.name || 'Development',
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
      activity_type: activityTypes[0]?.name || 'Development',
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
        <div className="timesheet-header-left">
          <div className="timesheet-icon">
            <FaClock />
          </div>
          <div className="timesheet-header-text">
            <h3>Timesheet Entries</h3>
            <span className="timesheet-task-name">{task.subject}</span>
          </div>
        </div>
        <div className="timesheet-header-right">
          <div className="total-hours-card">
            <div className="total-hours-label">Total Hours</div>
            <div className="total-hours-value">{getTotalHours().toFixed(1)}</div>
          </div>
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
              <>
                <div className="timesheet-entries-header">
                  <div className="entries-count">
                    {timesheetEntries.length} {timesheetEntries.length === 1 ? 'entry' : 'entries'}
                  </div>
                  <div className="entries-sort">
                    <span>Recent first</span>
                  </div>
                </div>
                {timesheetEntries.map((entry, index) => (
                  <div key={entry.name} className={`timesheet-entry ${entry.docstatus === 1 ? 'submitted' : 'draft'}`}>
                    <div className="timesheet-entry-info">
                      <div className="timesheet-entry-task">
                        <FaTasks />
                        {task.subject}
                      </div>
                      <div className="timesheet-entry-details">
                        <div className="timesheet-detail-item">
                          <FaCalendarAlt />
                          <span className="timesheet-detail-value">{formatDate(entry.start_date)}</span>
                        </div>
                        <div className="timesheet-detail-item">
                          <FaPlay />
                          <span className="timesheet-detail-value">{entry.activity_type}</span>
                        </div>
                        <div className="timesheet-detail-item">
                          <FaProjectDiagram />
                          <span className="timesheet-detail-value">{project.name}</span>
                        </div>
                        <div className="timesheet-detail-item">
                          <FaUser />
                          <span className="timesheet-detail-value">{entry.employee || 'Self'}</span>
                        </div>
                      </div>
                      {entry.description && (
                        <div className="timesheet-entry-description">
                          {entry.description}
                        </div>
                      )}
                    </div>
                    <div className="timesheet-entry-hours">
                      <FaStopwatch />
                      {entry.hours}h
                    </div>
                    <div className="timesheet-entry-header">
                      <div className="entry-right">
                        <div className="entry-status">
                          {entry.docstatus === 1 ? (
                            <span className="status-submitted">
                              <span className="status-icon">✓</span>
                              Submitted
                            </span>
                          ) : (
                            <span className="status-draft">
                              <span className="status-icon">•</span>
                              Draft
                            </span>
                          )}
                        </div>
                        <div className="timesheet-entry-actions">
                          <button
                            className="action-btn edit-btn"
                            onClick={() => startEdit(entry)}
                            title="Edit Entry"
                            disabled={entry.docstatus === 1}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteEntry(entry.name)}
                            title="Delete Entry"
                            disabled={entry.docstatus === 1}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="timesheet-no-entries">
                <div className="no-entries-icon">
                  <FaClock />
                </div>
                <div className="no-entries-text">
                  <h4>No timesheet entries yet</h4>
                  <p>Start tracking your time by adding your first entry below.</p>
                </div>
              </div>
            )}
          </div>

          {/* Add/Edit Form */}
          {showAddForm || editingEntry ? (
            <div className={`timesheet-add-form ${editingEntry ? 'editing' : ''}`}>
              <div className="add-form-header">
                <h4 className="add-form-title">
                  <FaPlus className="add-form-icon" />
                  {editingEntry ? 'Edit Time Entry' : 'Add New Time Entry'}
                </h4>
                {!editingEntry && (
                  <p className="add-form-subtitle">Record time spent on this task</p>
                )}
              </div>
              
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
            <div className="timesheet-add-button">
              <button
                className="primary-add-btn"
                onClick={() => setShowAddForm(true)}
              >
                <FaPlus />
                Add Time Entry
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TimesheetForm;