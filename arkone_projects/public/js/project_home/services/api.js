/**
 * API Service for Arkone Projects
 * Handles all communication with ERPNext backend
 */

const API_BASE = '/api/method/arkone_projects.arkone_projects.api';

class ApiService {
  
  async request(endpoint, data = null, method = 'GET') {
    const url = `${API_BASE}.${endpoint}`;
    
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Frappe-CSRF-Token': window.csrf_token || ''
      }
    };

    if (data) {
      if (method === 'GET') {
        const params = new URLSearchParams();
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined) {
            params.append(key, data[key]);
          }
        });
        const queryString = params.toString();
        const finalUrl = queryString ? `${url}?${queryString}` : url;
        console.log('API Request:', finalUrl); // Debug logging
        config.url = finalUrl;
      } else {
        config.body = JSON.stringify(data);
        config.url = url;
      }
    } else {
      config.url = url;
    }

    console.log('API Request:', config.url, config); // Debug logging
    
    try {
      const response = await fetch(config.url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API Response:', result); // Debug logging
      
      if (result.message && result.message.success !== undefined) {
        if (!result.message.success) {
          throw new Error(result.message.error || 'API request failed');
        }
        return result.message.data;
      } else {
        // Handle direct Frappe responses
        return result.message || result;
      }
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Projects API
  async getProjects(filters = null) {
    try {
      const params = {};
      if (filters) {
        params.filters = JSON.stringify(filters);
      }
      return await this.request('get_projects', params);
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  // Tasks API
  async getTasks(project = null, filters = null) {
    try {
      const params = {};
      if (project) params.project = project;
      if (filters) params.filters = JSON.stringify(filters);
      
      return await this.request('get_tasks', params);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  async updateTaskStatus(taskName, newStatus) {
    try {
      return await this.request('update_task_status', {
        task_name: taskName,
        new_status: newStatus
      }, 'POST');
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  async createTask(taskData) {
    try {
      return await this.request('create_task', {
        data: JSON.stringify(taskData)
      }, 'POST');
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  // Timesheet API
  async getTimesheetData(task = null, project = null, dateRange = null) {
    try {
      const params = {};
      if (task) params.task = task;
      if (project) params.project = project;
      if (dateRange) params.date_range = JSON.stringify(dateRange);
      
      return await this.request('get_timesheet_data', params);
    } catch (error) {
      console.error('Error fetching timesheet data:', error);
      throw error;
    }
  }

  async createTimesheetEntry(timesheetData) {
    try {
      return await this.request('create_timesheet_entry', {
        data: JSON.stringify(timesheetData)
      }, 'POST');
    } catch (error) {
      console.error('Error creating timesheet entry:', error);
      throw error;
    }
  }

  // User permissions
  async getUserPermissions() {
    try {
      return await this.request('get_user_permissions');
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      throw error;
    }
  }

  // Board view configurations
  async getBoardViewConfigs(doctype) {
    try {
      return frappe.call({
        method: 'frappe.client.get_list',
        args: {
          doctype: 'Board View Config',
          filters: {
            user: frappe.session.user,
            reference_doctype: doctype
          },
          fields: ['name', 'view_name', 'filters', 'column_config', 'sort_order', 'is_default']
        }
      }).then(r => r.message);
    } catch (error) {
      console.error('Error fetching board view configs:', error);
      throw error;
    }
  }

  async saveBoardViewConfig(viewData) {
    try {
      return frappe.call({
        method: 'frappe.client.save',
        args: {
          doc: {
            doctype: 'Board View Config',
            ...viewData,
            user: frappe.session.user
          }
        }
      }).then(r => r.message);
    } catch (error) {
      console.error('Error saving board view config:', error);
      throw error;
    }
  }

  // Test API connection
  async testConnection() {
    try {
      return await this.request('test_api_connection');
    } catch (error) {
      console.error('Error testing API connection:', error);
      throw error;
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
