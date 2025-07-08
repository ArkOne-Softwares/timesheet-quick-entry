import React, { useState, useEffect } from 'react';
import { FaUser, FaPlus, FaTimes, FaCheck } from 'react-icons/fa';

const AssignmentForm = ({ task, onClose, onSuccess }) => {
  const [users, setUsers] = useState([]);
  const [currentAssignments, setCurrentAssignments] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchCurrentAssignments();
  }, [task]);

  const fetchUsers = async () => {
    try {
      const response = await frappe.call({
        method: 'arkone_projects.arkone_projects.api.get_users'
      });
      if (response.message?.success) {
        setUsers(response.message.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    }
  };

  const fetchCurrentAssignments = async () => {
    try {
      const response = await frappe.call({
        method: 'arkone_projects.arkone_projects.api.get_task_assignments',
        args: { task_id: task.name }
      });
      if (response.message?.success) {
        const assignments = response.message.assignments || [];
        setCurrentAssignments(assignments);
        setSelectedUsers([...assignments]);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError('Failed to load current assignments');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await frappe.call({
        method: 'arkone_projects.arkone_projects.api.update_task_assignments',
        args: {
          task_id: task.name,
          assigned_users: selectedUsers
        }
      });

      if (response.message?.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(response.message?.error || 'Failed to update assignments');
      }
    } catch (err) {
      console.error('Error updating assignments:', err);
      setError('Failed to update assignments');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userEmail) => {
    setSelectedUsers(prev => 
      prev.includes(userEmail) 
        ? prev.filter(email => email !== userEmail)
        : [...prev, userEmail]
    );
  };

  const getFilteredUsers = () => {
    if (!searchTerm) return users;
    return users.filter(user => 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getUserDisplayName = (user) => {
    return user.full_name || user.email || user.name;
  };

  const getUserInitials = (user) => {
    const name = getUserDisplayName(user);
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="assignment-form-content">
      <div className="assignment-task-info">
        <h4>{task.subject}</h4>
        <p>Select users to assign this task to:</p>
      </div>

      {error && (
        <div className="assignment-error">
          {error}
        </div>
      )}

      <div className="assignment-search">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="assignment-users-list">
        {getFilteredUsers().map(user => (
          <div 
            key={user.email} 
            className={`assignment-user-item ${selectedUsers.includes(user.email) ? 'selected' : ''}`}
            onClick={() => toggleUserSelection(user.email)}
          >
            <div className="assignment-user-avatar">
              {user.user_image ? (
                <img src={user.user_image} alt={getUserDisplayName(user)} />
              ) : (
                <span className="assignment-user-initials">
                  {getUserInitials(user)}
                </span>
              )}
            </div>
            <div className="assignment-user-info">
              <div className="assignment-user-name">
                {getUserDisplayName(user)}
              </div>
              <div className="assignment-user-email">
                {user.email}
              </div>
            </div>
            <div className="assignment-user-checkbox">
              {selectedUsers.includes(user.email) && <FaCheck />}
            </div>
          </div>
        ))}
      </div>

      {selectedUsers.length > 0 && (
        <div className="assignment-selected-users">
          <h5>Selected Users ({selectedUsers.length}):</h5>
          <div className="assignment-selected-list">
            {selectedUsers.map(userEmail => {
              const user = users.find(u => u.email === userEmail);
              return user ? (
                <div key={userEmail} className="assignment-selected-user">
                  <div className="assignment-selected-avatar">
                    {user.user_image ? (
                      <img src={user.user_image} alt={getUserDisplayName(user)} />
                    ) : (
                      <span className="assignment-selected-initials">
                        {getUserInitials(user)}
                      </span>
                    )}
                  </div>
                  <span>{getUserDisplayName(user)}</span>
                  <button 
                    className="assignment-remove-btn"
                    onClick={() => toggleUserSelection(userEmail)}
                  >
                    <FaTimes />
                  </button>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      <div className="assignment-form-actions">
        <button 
          className="assignment-save-btn"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Assignments'}
        </button>
        <button 
          className="assignment-cancel-btn"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AssignmentForm;
