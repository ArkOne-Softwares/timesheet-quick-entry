/**
 * API Service for Arkone Projects
 * Simplified service for any remaining custom endpoints
 * Most functionality now uses native Frappe APIs directly
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
        config.url = finalUrl;
      } else {
        config.body = JSON.stringify(data);
        config.url = url;
      }
    } else {
      config.url = url;
    }

    try {
      const response = await fetch(config.url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
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

  // Test API connection - if needed for debugging
  async testConnection() {
    try {
      return await this.request('test_api_connection');
    } catch (error) {
      console.error('Error testing API connection:', error);
      throw error;
    }
  }

  // Keep timesheet-related methods if they use custom logic
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

  // User permissions - if custom logic is needed
  async getUserPermissions() {
    try {
      return await this.request('get_user_permissions');
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      throw error;
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
