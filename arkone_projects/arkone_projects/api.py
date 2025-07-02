"""
API endpoints for Arkone Projects
Enhanced API with comprehensive timesheet management
"""

import frappe
from frappe import _
from frappe.utils import getdate, today, get_datetime, flt, add_to_date
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
def create_timesheet_entry(task_id, project_id, hours, description, activity_type="Task", billing_hours=None, date=None):
    """
    Create a timesheet entry for a task
    """
    try:
        if not date:
            date = today()
        
        # Get or create employee for current user
        employee = get_employee_for_user(frappe.session.user)
        if not employee:
            return {"success": False, "error": "No employee record found for current user"}
        
        # Get project timesheet mode
        project_doc = frappe.get_doc("Project", project_id)
        timesheet_mode = getattr(project_doc, 'timesheet_mode', 'Per Task')  # Default to Per Task
        
        # Check if timesheet already exists for this task/date combination
        timesheet_name = None
        if timesheet_mode == 'Per Day':
            # For per day mode, find existing timesheet for the date
            existing_timesheet = frappe.db.get_value(
                "Timesheet", 
                {"employee": employee, "start_date": date, "docstatus": 0}, 
                "name"
            )
            if existing_timesheet:
                timesheet_name = existing_timesheet
        else:
            # For per task mode, find existing timesheet for the task
            existing_timesheet = frappe.db.sql("""
                SELECT ts.name 
                FROM `tabTimesheet` ts
                INNER JOIN `tabTimesheet Detail` tsd ON ts.name = tsd.parent
                WHERE ts.employee = %s AND tsd.task = %s AND ts.docstatus = 0
                LIMIT 1
            """, (employee, task_id))
            if existing_timesheet:
                timesheet_name = existing_timesheet[0][0]
        
        # Create new timesheet if none exists
        if not timesheet_name:
            timesheet_doc = frappe.new_doc("Timesheet")
            timesheet_doc.employee = employee
            timesheet_doc.start_date = date
            timesheet_doc.end_date = date
            timesheet_doc.save(ignore_permissions=True)
            timesheet_name = timesheet_doc.name
        
        # Add timesheet detail entry
        timesheet_doc = frappe.get_doc("Timesheet", timesheet_name)
        
        detail = timesheet_doc.append("time_logs")
        detail.activity_type = activity_type
        detail.task = task_id
        detail.project = project_id
        detail.hours = flt(hours)
        detail.billing_hours = flt(billing_hours) if billing_hours else flt(hours)
        detail.description = description
        detail.from_time = get_datetime(f"{date} 09:00:00")
        detail.to_time = add_to_date(get_datetime(f"{date} 09:00:00"), hours=flt(hours))
        
        timesheet_doc.save(ignore_permissions=True)
        
        return {
            "success": True,
            "timesheet_name": timesheet_name,
            "detail_name": detail.name,
            "message": f"Timesheet entry added successfully"
        }
        
    except Exception as e:
        frappe.log_error(f"Error creating timesheet entry: {str(e)}")
        return {"success": False, "error": str(e)}

@frappe.whitelist()
def get_task_timesheet_entries(task_id):
    """
    Get all timesheet entries for a specific task
    """
    try:
        entries = frappe.db.sql("""
            SELECT 
                tsd.name,
                tsd.parent,
                tsd.activity_type,
                tsd.hours,
                tsd.billing_hours,
                tsd.description,
                tsd.from_time,
                tsd.to_time,
                ts.employee,
                ts.docstatus,
                ts.start_date
            FROM `tabTimesheet Detail` tsd
            INNER JOIN `tabTimesheet` ts ON tsd.parent = ts.name
            WHERE tsd.task = %s
            ORDER BY ts.start_date DESC, tsd.from_time DESC
        """, (task_id,), as_dict=True)
        
        return {"success": True, "entries": entries}
        
    except Exception as e:
        frappe.log_error(f"Error fetching timesheet entries: {str(e)}")
        return {"success": False, "error": str(e)}

@frappe.whitelist()
def update_timesheet_entry(detail_name, hours, description, billing_hours=None):
    """
    Update an existing timesheet entry
    """
    try:
        detail_doc = frappe.get_doc("Timesheet Detail", detail_name)
        timesheet_doc = frappe.get_doc("Timesheet", detail_doc.parent)
        
        # Check if timesheet is not submitted
        if timesheet_doc.docstatus == 1:
            return {"success": False, "error": "Cannot update submitted timesheet"}
        
        # Update the detail
        detail_doc.hours = flt(hours)
        detail_doc.billing_hours = flt(billing_hours) if billing_hours else flt(hours)
        detail_doc.description = description
        
        # Update to_time based on new hours
        if detail_doc.from_time:
            detail_doc.to_time = add_to_date(detail_doc.from_time, hours=flt(hours))
        
        timesheet_doc.save(ignore_permissions=True)
        
        return {
            "success": True,
            "message": "Timesheet entry updated successfully"
        }
        
    except Exception as e:
        frappe.log_error(f"Error updating timesheet entry: {str(e)}")
        return {"success": False, "error": str(e)}

@frappe.whitelist()
def delete_timesheet_entry(detail_name):
    """
    Delete a timesheet entry
    """
    try:
        detail_doc = frappe.get_doc("Timesheet Detail", detail_name)
        timesheet_doc = frappe.get_doc("Timesheet", detail_doc.parent)
        
        # Check if timesheet is not submitted
        if timesheet_doc.docstatus == 1:
            return {"success": False, "error": "Cannot delete from submitted timesheet"}
        
        # Remove the detail
        timesheet_doc.remove(detail_doc)
        
        # If no more details, delete the entire timesheet
        if not timesheet_doc.time_logs:
            timesheet_doc.delete(ignore_permissions=True)
        else:
            timesheet_doc.save(ignore_permissions=True)
        
        return {
            "success": True,
            "message": "Timesheet entry deleted successfully"
        }
        
    except Exception as e:
        frappe.log_error(f"Error deleting timesheet entry: {str(e)}")
        return {"success": False, "error": str(e)}

@frappe.whitelist()
def submit_task_timesheet(task_id):
    """
    Submit all timesheets related to a task when task is completed
    """
    try:
        # Get all unsubmitted timesheets for this task
        timesheets = frappe.db.sql("""
            SELECT DISTINCT ts.name
            FROM `tabTimesheet` ts
            INNER JOIN `tabTimesheet Detail` tsd ON ts.name = tsd.parent
            WHERE tsd.task = %s AND ts.docstatus = 0
        """, (task_id,), as_dict=True)
        
        submitted_timesheets = []
        for timesheet in timesheets:
            timesheet_doc = frappe.get_doc("Timesheet", timesheet.name)
            timesheet_doc.submit()
            submitted_timesheets.append(timesheet.name)
        
        return {
            "success": True,
            "submitted_timesheets": submitted_timesheets,
            "message": f"Submitted {len(submitted_timesheets)} timesheet(s)"
        }
        
    except Exception as e:
        frappe.log_error(f"Error submitting task timesheets: {str(e)}")
        return {"success": False, "error": str(e)}

@frappe.whitelist()
def complete_task_and_submit_timesheets(task_id):
    """
    Complete a task and automatically submit all related draft timesheets
    """
    try:
        # Update task status to Completed
        frappe.db.set_value("Task", task_id, "status", "Completed")
        
        # Get all draft timesheets related to this task
        timesheets = frappe.db.sql("""
            SELECT DISTINCT ts.name
            FROM `tabTimesheet` ts
            INNER JOIN `tabTimesheet Detail` tsd ON ts.name = tsd.parent
            WHERE tsd.task = %s AND ts.docstatus = 0
        """, (task_id,), as_dict=True)
        
        submitted_timesheets = []
        errors = []
        
        # Submit each timesheet
        for timesheet in timesheets:
            try:
                timesheet_doc = frappe.get_doc("Timesheet", timesheet.name)
                timesheet_doc.submit()
                submitted_timesheets.append(timesheet.name)
            except Exception as e:
                errors.append(f"Error submitting timesheet {timesheet.name}: {str(e)}")
        
        # Commit the changes
        frappe.db.commit()
        
        result = {
            "success": True,
            "message": f"Task completed successfully",
            "submitted_timesheets": submitted_timesheets
        }
        
        if errors:
            result["warnings"] = errors
            
        return result
        
    except Exception as e:
        frappe.log_error(f"Error completing task and submitting timesheets: {str(e)}")
        frappe.db.rollback()
        return {"success": False, "error": str(e)}

@frappe.whitelist()
def get_project_timesheet_mode(project_id):
    """
    Get the timesheet mode for a project (Per Task or Per Day)
    """
    try:
        project_doc = frappe.get_doc("Project", project_id)
        timesheet_mode = getattr(project_doc, 'timesheet_mode', 'Per Task')  # Default to Per Task
        
        return {
            "success": True,
            "timesheet_mode": timesheet_mode
        }
        
    except Exception as e:
        frappe.log_error(f"Error getting project timesheet mode: {str(e)}")
        return {"success": False, "error": str(e)}

@frappe.whitelist()
def set_project_timesheet_mode(project_id, timesheet_mode):
    """
    Set the timesheet mode for a project (Per Task or Per Day)
    """
    try:
        if timesheet_mode not in ['Per Task', 'Per Day']:
            return {"success": False, "error": "Invalid timesheet mode. Must be 'Per Task' or 'Per Day'"}
            
        frappe.db.set_value("Project", project_id, "timesheet_mode", timesheet_mode)
        frappe.db.commit()
        
        return {
            "success": True,
            "message": f"Project timesheet mode set to {timesheet_mode}"
        }
        
    except Exception as e:
        frappe.log_error(f"Error setting project timesheet mode: {str(e)}")
        return {"success": False, "error": str(e)}

def get_employee_for_user(user=None):
    """
    Helper function to get employee record for a user
    """
    if not user:
        user = frappe.session.user
    
    employee = frappe.db.get_value("Employee", {"user_id": user}, "name")
    if not employee:
        # Try to create employee if doesn't exist
        try:
            user_doc = frappe.get_doc("User", user)
            employee_doc = frappe.new_doc("Employee")
            employee_doc.employee_name = user_doc.full_name or user_doc.email
            employee_doc.user_id = user
            employee_doc.save(ignore_permissions=True)
            employee = employee_doc.name
        except:
            pass
    
    return employee

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
            "can_submit_timesheet": frappe.has_permission("Timesheet", "submit"),
            "user": user,
            "employee": get_employee_for_user(user)
        }
        
        return {
            "success": True,
            "data": permissions
        }
        
    except Exception as e:
        frappe.log_error(f"Error getting user permissions: {str(e)}")
        return {
            "success": False,
            "error": f"Error getting user permissions: {str(e)}"
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
def complete_task_with_timesheet_submission(task_id):
    """
    Complete a task and automatically submit associated timesheets
    """
    try:
        # First, submit all timesheets for this task
        timesheet_result = submit_task_timesheet(task_id)
        
        # Then update the task status to Completed
        task_doc = frappe.get_doc("Task", task_id)
        task_doc.status = "Completed"
        
        # Get employee for current user
        employee = get_employee_for_user(frappe.session.user)
        if employee:
            task_doc.completed_by = employee
        
        task_doc.completed_on = frappe.utils.now_datetime()
        task_doc.save(ignore_permissions=True)
        
        return {
            "success": True,
            "message": f"Task completed and {len(timesheet_result.get('submitted_timesheets', []))} timesheet(s) submitted",
            "timesheet_result": timesheet_result
        }
        
    except Exception as e:
        frappe.log_error(f"Error completing task with timesheet submission: {str(e)}")
        return {"success": False, "error": str(e)}

def get_employee_for_user(user=None):
    """
    Helper function to get employee record for a user
    """
    if not user:
        user = frappe.session.user
    
    employee = frappe.db.get_value("Employee", {"user_id": user}, "name")
    if not employee:
        # Try to create employee if doesn't exist
        try:
            user_doc = frappe.get_doc("User", user)
            employee_doc = frappe.new_doc("Employee")
            employee_doc.employee_name = user_doc.full_name or user_doc.email
            employee_doc.user_id = user
            employee_doc.save(ignore_permissions=True)
            employee = employee_doc.name
        except:
            pass
    
    return employee

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
            "can_submit_timesheet": frappe.has_permission("Timesheet", "submit"),
            "user": user,
            "employee": get_employee_for_user(user)
        }
        
        return {
            "success": True,
            "data": permissions
        }
        
    except Exception as e:
        frappe.log_error(f"Error getting user permissions: {str(e)}")
        return {
            "success": False,
            "error": f"Error getting user permissions: {str(e)}"
        }
