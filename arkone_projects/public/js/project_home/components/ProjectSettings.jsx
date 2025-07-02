import React, { useState, useEffect } from 'react';
import { FaCog, FaSave, FaTimes } from 'react-icons/fa';

const ProjectSettings = ({ project, onClose, onSuccess }) => {
  const [timesheetMode, setTimesheetMode] = useState('Per Task');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch current project settings
  useEffect(() => {
    if (project) {
      fetchProjectSettings();
    }
  }, [project]);

  const fetchProjectSettings = async () => {
    try {
      setLoading(true);
      const response = await frappe.call({
        method: 'arkone_projects.arkone_projects.api.get_project_timesheet_mode',
        args: { project_id: project.name }
      });

      if (response.message?.success) {
        setTimesheetMode(response.message.timesheet_mode || 'Per Task');
      } else {
        setError(response.message?.error || 'Failed to fetch project settings');
      }
    } catch (err) {
      console.error('Error fetching project settings:', err);
      setError('Failed to fetch project settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await frappe.call({
        method: 'arkone_projects.arkone_projects.api.set_project_timesheet_mode',
        args: {
          project_id: project.name,
          timesheet_mode: timesheetMode
        }
      });

      if (response.message?.success) {
        frappe.show_alert({
          message: 'Project settings saved successfully',
          indicator: 'green'
        });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(response.message?.error || 'Failed to save project settings');
      }
    } catch (err) {
      console.error('Error saving project settings:', err);
      setError('Failed to save project settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-settings">
      <div className="project-settings-header">
        <div className="settings-icon">
          <FaCog />
        </div>
        <h3>Project Settings</h3>
      </div>

      {error && (
        <div className="settings-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="settings-loading">
          Loading project settings...
        </div>
      ) : (
        <div className="settings-content">
          <div className="settings-section">
            <h4>Timesheet Management</h4>
            <div className="setting-item">
              <label htmlFor="timesheet-mode">Timesheet Mode:</label>
              <select
                id="timesheet-mode"
                value={timesheetMode}
                onChange={(e) => setTimesheetMode(e.target.value)}
                className="timesheet-mode-select"
              >
                <option value="Per Task">Per Task</option>
                <option value="Per Day">Per Day</option>
              </select>
              <div className="setting-description">
                <strong>Per Task:</strong> Creates one timesheet per task (recommended)<br/>
                <strong>Per Day:</strong> Creates one timesheet per day with multiple tasks
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="settings-actions">
        <button
          className="settings-save-btn"
          onClick={handleSave}
          disabled={loading}
        >
          <FaSave /> {loading ? 'Saving...' : 'Save Settings'}
        </button>
        <button
          className="settings-cancel-btn"
          onClick={onClose}
          disabled={loading}
        >
          <FaTimes /> Cancel
        </button>
      </div>
    </div>
  );
};

export default ProjectSettings;
