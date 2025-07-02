"""
API endpoints for Arkone Projects
Simplified API with only essential custom endpoints
Most functionality now uses native Frappe APIs
"""

import frappe
from frappe import _
from frappe.utils import getdate, today, get_datetime
import json

@frappe.whitelist()
def test_api_connection():
    """
    Simple test endpoint to verify API connectivity
    """
    try:
        return {
            "success": True,
            "message": "API connection successful",
            "data": {
                "timestamp": frappe.utils.now(),
                "user": frappe.session.user,
                "version": frappe.__version__
            }
        }
    except Exception as e:
        frappe.log_error(f"API connection test failed: {str(e)}")
        return {
            "success": False,
            "error": f"API connection failed: {str(e)}"
        }

@frappe.whitelist()
def get_user_permissions():
    """
    Get user permissions for project management
    """
    try:
        user = frappe.session.user
        
        # Check basic permissions
        permissions = {
            "can_read_project": frappe.has_permission("Project", "read"),
            "can_write_project": frappe.has_permission("Project", "write"),
            "can_create_project": frappe.has_permission("Project", "create"),
            "can_read_task": frappe.has_permission("Task", "read"),
            "can_write_task": frappe.has_permission("Task", "write"),
            "can_create_task": frappe.has_permission("Task", "create"),
            "can_read_timesheet": frappe.has_permission("Timesheet", "read"),
            "can_write_timesheet": frappe.has_permission("Timesheet", "write"),
            "can_create_timesheet": frappe.has_permission("Timesheet", "create"),
        }
        
        return {
            "success": True,
            "data": permissions
        }
        
    except Exception as e:
        frappe.log_error(f"Error getting user permissions: {str(e)}")
        return {
            "success": False,
            "error": f"Error getting permissions: {str(e)}"
        }

@frappe.whitelist()
def get_timesheet_data(task=None, project=None, date_range=None):
    """
    Get timesheet data with filters
    Custom endpoint for complex timesheet queries if needed
    """
    try:
        conditions = []
        values = []
        
        # Base query
        query = """
            SELECT 
                ts.name,
                ts.start_date,
                ts.end_date,
                ts.total_hours,
                ts.employee,
                ts.status,
                tsd.task,
                tsd.project,
                tsd.hours,
                tsd.activity_type,
                tsd.description
            FROM `tabTimesheet` ts
            LEFT JOIN `tabTimesheet Detail` tsd ON ts.name = tsd.parent
            WHERE ts.docstatus = 1
        """
        
        if task:
            conditions.append("tsd.task = %s")
            values.append(task)
            
        if project:
            conditions.append("tsd.project = %s")
            values.append(project)
            
        if date_range:
            try:
                date_range = json.loads(date_range) if isinstance(date_range, str) else date_range
                if date_range.get('start_date'):
                    conditions.append("ts.start_date >= %s")
                    values.append(date_range['start_date'])
                if date_range.get('end_date'):
                    conditions.append("ts.end_date <= %s")
                    values.append(date_range['end_date'])
            except (json.JSONDecodeError, ValueError):
                pass
        
        if conditions:
            query += " AND " + " AND ".join(conditions)
            
        query += " ORDER BY ts.start_date DESC"
        
        data = frappe.db.sql(query, values, as_dict=True)
        
        return {
            "success": True,
            "data": data
        }
        
    except Exception as e:
        frappe.log_error(f"Error getting timesheet data: {str(e)}")
        return {
            "success": False,
            "error": f"Error getting timesheet data: {str(e)}"
        }

@frappe.whitelist()
def create_timesheet_entry(data):
    """
    Create a new timesheet entry
    Custom endpoint for complex timesheet creation if needed
    """
    try:
        if isinstance(data, str):
            data = json.loads(data)
            
        # Create timesheet document
        timesheet = frappe.new_doc("Timesheet")
        timesheet.employee = data.get('employee')
        timesheet.start_date = data.get('start_date', today())
        timesheet.end_date = data.get('end_date', today())
        
        # Add timesheet detail
        timesheet.append('time_logs', {
            'task': data.get('task'),
            'project': data.get('project'),
            'hours': data.get('hours', 0),
            'activity_type': data.get('activity_type'),
            'description': data.get('description', ''),
            'from_time': data.get('from_time'),
            'to_time': data.get('to_time')
        })
        
        timesheet.save()
        
        if data.get('submit'):
            timesheet.submit()
            
        return {
            "success": True,
            "data": timesheet.as_dict()
        }
        
    except Exception as e:
        frappe.log_error(f"Error creating timesheet entry: {str(e)}")
        return {
            "success": False,
            "error": f"Error creating timesheet entry: {str(e)}"
        }
