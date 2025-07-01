"""
API endpoints for Arkone Projects
Mobile-first project management tool with ERPNext integration
"""

import frappe
from frappe import _
from frappe.utils import getdate, today, get_datetime
import json

@frappe.whitelist()
def get_projects(filters=None):
    """
    Get all projects with optional filters
    Returns: List of projects with basic info
    """
    try:
        # Base query for projects
        query = """
            SELECT 
                name,
                project_name,
                status,
                priority,
                expected_start_date,
                expected_end_date,
                percent_complete,
                project_type,
                customer,
                department,
                company
            FROM `tabProject`
        """
        
        conditions = []
        values = []
        
        if filters and filters != 'null':
            if isinstance(filters, str):
                try:
                    filters = json.loads(filters)
                except (json.JSONDecodeError, ValueError):
                    filters = None
            
            if filters and filters.get('status'):
                conditions.append("status = %s")
                values.append(filters.get('status'))
            
            if filters and filters.get('priority'):
                conditions.append("priority = %s")
                values.append(filters.get('priority'))
            
            if filters and filters.get('customer'):
                conditions.append("customer = %s")
                values.append(filters.get('customer'))
        
        if conditions:
            query += " AND " + " AND ".join(conditions)
        
        query += " ORDER BY creation DESC"
        
        projects = frappe.db.sql(query, values, as_dict=True)
        
        # Add task counts for each project
        for project in projects:
            task_count = frappe.db.count('Task', {'project': project.name})
            completed_tasks = frappe.db.count('Task', {
                'project': project.name,
                'status': 'Completed'
            })
            project['task_count'] = task_count
            project['completed_tasks'] = completed_tasks
        
        return {
            'success': True,
            'data': projects
        }
        
    except Exception as e:
        frappe.log_error(f"Error fetching projects: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

@frappe.whitelist()
def get_tasks(project=None, filters=None):
    """
    Get tasks with optional project and filters
    Returns: List of tasks with detailed info
    """
    try:
        query = """
            SELECT 
                name,
                subject,
                project,
                status,
                priority,
                task_weight,
                description,
                exp_start_date,
                exp_end_date,
                act_start_date,
                act_end_date,
                progress,
                creation,
                modified,
                owner,
                department,
                company
            FROM `tabTask`
            WHERE is_group = 0
        """
        
        conditions = []
        values = []
        
        if project:
            conditions.append("project = %s")
            values.append(project)
        
        if filters and filters != 'null':
            if isinstance(filters, str):
                try:
                    filters = json.loads(filters)
                except (json.JSONDecodeError, ValueError):
                    filters = None
            
            if filters and filters.get('status'):
                if isinstance(filters.get('status'), list):
                    placeholders = ', '.join(['%s'] * len(filters.get('status')))
                    conditions.append(f"status IN ({placeholders})")
                    values.extend(filters.get('status'))
                else:
                    conditions.append("status = %s")
                    values.append(filters.get('status'))
            
            if filters and filters.get('priority'):
                conditions.append("priority = %s")
                values.append(filters.get('priority'))
        
        if conditions:
            query += " AND " + " AND ".join(conditions)
        
        query += " ORDER BY creation DESC"
        
        tasks = frappe.db.sql(query, values, as_dict=True)
        
        # Add timesheet summary for each task
        for task in tasks:
            timesheet_hours = frappe.db.sql("""
                SELECT COALESCE(SUM(hours), 0) as total_hours
                FROM `tabTimesheet Detail`
                WHERE task = %s AND docstatus = 1
            """, [task.name], as_dict=True)
            
            task['logged_hours'] = timesheet_hours[0]['total_hours'] if timesheet_hours else 0
        
        return {
            'success': True,
            'data': tasks
        }
        
    except Exception as e:
        frappe.log_error(f"Error fetching tasks: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

@frappe.whitelist()
def update_task_status(task_name, new_status):
    """
    Update task status (for drag-and-drop in Kanban)
    """
    try:
        task = frappe.get_doc('Task', task_name)
        task.status = new_status
        
        # Auto-update progress based on status
        if new_status == 'Completed':
            task.progress = 100
        elif new_status == 'Working':
            if task.progress == 0:
                task.progress = 10
        
        task.save()
        
        return {
            'success': True,
            'message': f'Task status updated to {new_status}'
        }
        
    except Exception as e:
        frappe.log_error(f"Error updating task status: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

@frappe.whitelist()
def create_task(data):
    """
    Create a new task
    """
    try:
        if isinstance(data, str):
            data = json.loads(data)
        
        task = frappe.new_doc('Task')
        task.subject = data.get('subject')
        task.project = data.get('project')
        task.status = data.get('status', 'Open')
        task.priority = data.get('priority', 'Medium')
        task.description = data.get('description', '')
        task.exp_start_date = data.get('exp_start_date')
        task.exp_end_date = data.get('exp_end_date')
        
        task.insert()
        
        return {
            'success': True,
            'data': task.as_dict(),
            'message': 'Task created successfully'
        }
        
    except Exception as e:
        frappe.log_error(f"Error creating task: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

@frappe.whitelist()
def get_timesheet_data(task=None, project=None, date_range=None):
    """
    Get timesheet data for tasks/projects
    """
    try:
        query = """
            SELECT 
                ts.name as timesheet_name,
                ts.employee,
                ts.employee_name,
                ts.start_date,
                ts.end_date,
                ts.total_hours,
                tsd.task,
                tsd.project,
                tsd.hours,
                tsd.description,
                tsd.from_time,
                tsd.to_time,
                tsd.activity_type
            FROM `tabTimesheet` ts
            JOIN `tabTimesheet Detail` tsd ON ts.name = tsd.parent
            WHERE ts.docstatus = 1
        """
        
        conditions = []
        values = []
        
        if task:
            conditions.append("tsd.task = %s")
            values.append(task)
        
        if project:
            conditions.append("tsd.project = %s")
            values.append(project)
        
        if date_range and date_range != 'null':
            if isinstance(date_range, str):
                try:
                    date_range = json.loads(date_range)
                except (json.JSONDecodeError, ValueError):
                    date_range = None
            
            if date_range and date_range.get('start_date'):
                conditions.append("ts.start_date >= %s")
                values.append(date_range.get('start_date'))
            
            if date_range and date_range.get('end_date'):
                conditions.append("ts.end_date <= %s")
                values.append(date_range.get('end_date'))
        
        if conditions:
            query += " AND " + " AND ".join(conditions)
        
        query += " ORDER BY ts.start_date DESC"
        
        timesheets = frappe.db.sql(query, values, as_dict=True)
        
        return {
            'success': True,
            'data': timesheets
        }
        
    except Exception as e:
        frappe.log_error(f"Error fetching timesheet data: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

@frappe.whitelist()
def create_timesheet_entry(data):
    """
    Create a new timesheet entry
    """
    try:
        if isinstance(data, str):
            data = json.loads(data)
        
        # Check if timesheet exists for the employee and date
        existing_timesheet = frappe.db.get_value('Timesheet', {
            'employee': data.get('employee'),
            'start_date': data.get('date'),
            'docstatus': ['!=', 2]
        })
        
        if existing_timesheet:
            # Add to existing timesheet
            timesheet = frappe.get_doc('Timesheet', existing_timesheet)
        else:
            # Create new timesheet
            timesheet = frappe.new_doc('Timesheet')
            timesheet.employee = data.get('employee')
            timesheet.start_date = data.get('date')
            timesheet.end_date = data.get('date')
        
        # Add timesheet detail
        timesheet.append('time_logs', {
            'task': data.get('task'),
            'project': data.get('project'),
            'hours': data.get('hours'),
            'description': data.get('description', ''),
            'activity_type': data.get('activity_type', 'Task'),
            'from_time': data.get('from_time'),
            'to_time': data.get('to_time')
        })
        
        timesheet.save()
        
        return {
            'success': True,
            'data': timesheet.as_dict(),
            'message': 'Timesheet entry created successfully'
        }
        
    except Exception as e:
        frappe.log_error(f"Error creating timesheet entry: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

@frappe.whitelist()
def get_user_permissions():
    """
    Get current user's permissions and settings
    """
    try:
        user = frappe.session.user
        user_doc = frappe.get_doc('User', user)
        
        # Get employee if exists
        employee = frappe.db.get_value('Employee', {'user_id': user})
        
        return {
            'success': True,
            'data': {
                'user': user,
                'full_name': user_doc.full_name,
                'employee': employee,
                'roles': frappe.get_roles(user),
                'can_create_project': 'Project Manager' in frappe.get_roles(user),
                'can_create_task': 'Project User' in frappe.get_roles(user) or 'Project Manager' in frappe.get_roles(user)
            }
        }
        
    except Exception as e:
        frappe.log_error(f"Error getting user permissions: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

@frappe.whitelist()
def test_api_connection():
    """
    Simple test endpoint to verify API is working
    """
    try:
        return {
            'success': True,
            'message': 'API connection successful',
            'user': frappe.session.user,
            'timestamp': frappe.utils.now()
        }
    except Exception as e:
        frappe.log_error(f"Test API error: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
