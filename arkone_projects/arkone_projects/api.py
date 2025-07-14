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
def create_timesheet_entry(task_id, project_id, hours, description, activity_type="Task", billing_hours=None, date=None, department=None, customer=None):
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
        
        # Get project details
        project_doc = frappe.get_doc("Project", project_id)
        timesheet_mode = getattr(project_doc, 'timesheet_mode', 'Per Task')  # Default to Per Task
        
        # Use project's customer if not provided
        if not customer and hasattr(project_doc, 'customer') and project_doc.customer:
            customer = project_doc.customer
        
        # Get employee's department if not provided
        if not department:
            employee_doc = frappe.get_doc("Employee", employee)
            if hasattr(employee_doc, 'department') and employee_doc.department:
                department = employee_doc.department
        
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
            
            # Set department and customer if provided and valid
            if department and frappe.db.exists("Department", department):
                timesheet_doc.department = department
            if customer and frappe.db.exists("Customer", customer):
                timesheet_doc.customer = customer
            
            # Add the time log entry immediately (before saving)
            detail = timesheet_doc.append("time_logs")
            detail.activity_type = activity_type
            detail.task = task_id
            detail.project = project_id
            detail.hours = flt(hours)
            detail.billing_hours = flt(billing_hours) if billing_hours else flt(hours)
            detail.description = description
            detail.from_time = get_datetime(f"{date} 09:00:00")
            detail.to_time = add_to_date(get_datetime(f"{date} 09:00:00"), hours=flt(hours))
            
            # Calculate total hours
            timesheet_doc.total_hours = flt(hours)
            
            timesheet_doc.save(ignore_permissions=True)
            frappe.db.commit()
            timesheet_name = timesheet_doc.name
            
            return {
                "success": True,
                "timesheet_name": timesheet_name,
                "detail_name": detail.name,
                "message": f"Timesheet entry added successfully"
            }
        
        # Add timesheet detail entry to existing timesheet
        timesheet_doc = frappe.get_doc("Timesheet", timesheet_name)
        
        # Create the time log entry
        detail = timesheet_doc.append("time_logs")
        detail.activity_type = activity_type
        detail.task = task_id
        detail.project = project_id
        detail.hours = flt(hours)
        detail.billing_hours = flt(billing_hours) if billing_hours else flt(hours)
        detail.description = description
        detail.from_time = get_datetime(f"{date} 09:00:00")
        detail.to_time = add_to_date(get_datetime(f"{date} 09:00:00"), hours=flt(hours))
        
        # Calculate and set total hours
        total_hours = sum(flt(d.hours) for d in timesheet_doc.time_logs)
        timesheet_doc.total_hours = total_hours
        
        timesheet_doc.save(ignore_permissions=True)
        frappe.db.commit()
        
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
def update_timesheet_entry(detail_name, hours, description, billing_hours=None, date=None, activity_type=None):
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
        
        # Update activity type if provided
        if activity_type:
            detail_doc.activity_type = activity_type
        
        # Update date if provided
        if date:
            detail_doc.from_time = get_datetime(f"{date} 09:00:00")
            detail_doc.to_time = add_to_date(get_datetime(f"{date} 09:00:00"), hours=flt(hours))
        else:
            # Update to_time based on new hours
            if detail_doc.from_time:
                detail_doc.to_time = add_to_date(detail_doc.from_time, hours=flt(hours))
        
        timesheet_doc.save(ignore_permissions=True)
        frappe.db.commit()
        
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
            frappe.db.commit()
        else:
            timesheet_doc.save(ignore_permissions=True)
            frappe.db.commit()
        
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

@frappe.whitelist()
def get_departments():
    """
    Get all available departments for autocomplete
    """
    try:
        departments = frappe.get_list("Department", 
            fields=["name", "department_name"], 
            filters={"disabled": 0},
            order_by="name"
        )
        return {"success": True, "departments": departments}
    except Exception as e:
        frappe.log_error(f"Error fetching departments: {str(e)}")
        return {"success": False, "error": str(e)}

@frappe.whitelist()
def get_customers():
    """
    Get all available customers for autocomplete
    """
    try:
        customers = frappe.get_list("Customer", 
            fields=["name", "customer_name"], 
            filters={"disabled": 0},
            order_by="name"
        )
        return {"success": True, "customers": customers}
    except Exception as e:
        frappe.log_error(f"Error fetching customers: {str(e)}")
        return {"success": False, "error": str(e)}

@frappe.whitelist()
def get_activity_types():
    """
    Get all available activity types for timesheet
    """
    try:
        activity_types = frappe.get_list("Activity Type", 
            fields=["name", "activity_type"], 
            filters={"disabled": 0},
            order_by="name"
        )
        
        # If no activity types found, create a default one
        if not activity_types:
            # Create default activity type
            try:
                default_activity = frappe.new_doc("Activity Type")
                default_activity.activity_type = "Development"
                default_activity.save(ignore_permissions=True)
                frappe.db.commit()
                activity_types = [{"name": "Development", "activity_type": "Development"}]
            except Exception as create_err:
                frappe.log_error(f"Error creating default activity type: {str(create_err)}")
                # Return a fallback list
                activity_types = [{"name": "Development", "activity_type": "Development"}]
        
        return {"success": True, "activity_types": activity_types}
    except Exception as e:
        frappe.log_error(f"Error fetching activity types: {str(e)}")
        # Return fallback activity types
        return {"success": True, "activity_types": [{"name": "Development", "activity_type": "Development"}]}

@frappe.whitelist()
def validate_department_and_customer(department=None, customer=None):
    """
    Validate if department and customer exist in the system
    """
    try:
        result = {"success": True, "valid_department": None, "valid_customer": None}
        
        if department:
            dept_exists = frappe.db.exists("Department", department)
            if dept_exists:
                result["valid_department"] = department
            else:
                result["valid_department"] = None
        
        if customer:
            cust_exists = frappe.db.exists("Customer", customer)
            if cust_exists:
                result["valid_customer"] = customer
            else:
                result["valid_customer"] = None
        
        return result
    except Exception as e:
        frappe.log_error(f"Error validating department/customer: {str(e)}")
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

@frappe.whitelist()
def get_project_details(project_id):
    """
    Get project details including department and customer information
    """
    try:
        project_doc = frappe.get_doc("Project", project_id)
        
        details = {
            "name": project_doc.name,
            "project_name": project_doc.project_name,
            "department": getattr(project_doc, 'department', None),
            "customer": getattr(project_doc, 'customer', None),
            "timesheet_mode": getattr(project_doc, 'timesheet_mode', 'Per Task')
        }
        
        return {"success": True, "details": details}
    except Exception as e:
        frappe.log_error(f"Error fetching project details: {str(e)}")
        return {"success": False, "error": str(e)}

@frappe.whitelist()
def get_users():
    """
    Get all active users for assignment autocomplete
    """
    try:
        users = frappe.get_list("User", 
            fields=["name", "full_name", "email", "user_image"], 
            filters={"enabled": 1, "name": ["not in", ["Administrator", "Guest"]]},
            order_by="full_name"
        )
        return {"success": True, "users": users}
    except Exception as e:
        frappe.log_error(f"Error fetching users: {str(e)}")
        return {"success": False, "error": str(e)}

@frappe.whitelist()
def assign_task(task_id, user_email):
    """
    Assign a task to a user using Frappe's native assignment system
    """
    try:
        # Use Frappe's native assignment system
        from frappe.desk.form.assign_to import add
        
        # Prepare arguments for the assignment
        args = {
            "assign_to": [user_email],
            "doctype": "Task",
            "name": task_id,
            "description": f"Task assigned via Project Management App"
        }
        
        # Add the assignment
        result = add(args)
        
        # Get the current _assign field value
        task_doc = frappe.get_doc("Task", task_id)
        current_assignments = []
        if task_doc._assign:
            try:
                current_assignments = json.loads(task_doc._assign)
            except (json.JSONDecodeError, TypeError):
                current_assignments = []
        
        # Add user to _assign if not already there
        if user_email not in current_assignments:
            current_assignments.append(user_email)
            task_doc._assign = json.dumps(current_assignments)
            task_doc.save(ignore_permissions=True)
            frappe.db.commit()
        
        return {
            "success": True,
            "message": f"Task assigned to {user_email}",
            "assignments": current_assignments
        }
        
    except Exception as e:
        frappe.log_error(f"Error assigning task: {str(e)}")
        return {"success": False, "error": str(e)}

@frappe.whitelist()
def unassign_task(task_id, user_email):
    """
    Unassign a task from a user using Frappe's native assignment system
    """
    try:
        # Use Frappe's native assignment system
        from frappe.desk.form.assign_to import remove
        
        # Remove the assignment
        result = remove("Task", task_id, user_email)
        
        # Get the current _assign field value
        task_doc = frappe.get_doc("Task", task_id)
        current_assignments = []
        if task_doc._assign:
            try:
                current_assignments = json.loads(task_doc._assign)
            except (json.JSONDecodeError, TypeError):
                current_assignments = []
        
        # Remove user from _assign if present
        if user_email in current_assignments:
            current_assignments.remove(user_email)
            task_doc._assign = json.dumps(current_assignments) if current_assignments else None
            task_doc.save(ignore_permissions=True)
            frappe.db.commit()
        
        return {
            "success": True,
            "message": f"Task unassigned from {user_email}",
            "assignments": current_assignments
        }
        
    except Exception as e:
        frappe.log_error(f"Error unassigning task: {str(e)}")
        return {"success": False, "error": str(e)}

@frappe.whitelist()
def get_task_assignments(task_id):
    """
    Get current assignments for a task
    """
    try:
        task_doc = frappe.get_doc("Task", task_id)
        assignments = []
        
        if task_doc._assign:
            try:
                assignments = json.loads(task_doc._assign)
            except (json.JSONDecodeError, TypeError):
                assignments = []
        
        # Get user details for assignments
        user_details = []
        for user_email in assignments:
            user_info = frappe.get_value("User", user_email, 
                ["name", "full_name", "email", "user_image"], as_dict=True)
            if user_info:
                user_details.append(user_info)
        
        return {
            "success": True,
            "assignments": assignments,
            "user_details": user_details
        }
        
    except Exception as e:
        frappe.log_error(f"Error getting task assignments: {str(e)}")
        return {"success": False, "error": str(e)}

@frappe.whitelist()
def update_task_assignments(task_id, assigned_users):
    """
    Update task assignments with a new list of users using Frappe's native assignment system
    """
    try:
        # Parse assigned_users if it's a string
        if isinstance(assigned_users, str):
            assigned_users = json.loads(assigned_users)
        
        # Get current assignments from ToDo
        current_assignments = frappe.get_all("ToDo", 
            fields=["allocated_to"],
            filters={
                "reference_type": "Task",
                "reference_name": task_id,
                "status": ("!=", "Cancelled")
            }
        )
        current_users = [t.allocated_to for t in current_assignments]
        
        # Remove users who are no longer assigned
        for user_email in current_users:
            if user_email not in assigned_users:
                try:
                    from frappe.desk.form.assign_to import remove
                    remove("Task", task_id, user_email)
                except Exception as e:
                    frappe.log_error(f"Error removing assignment for {user_email}: {str(e)}")
        
        # Add new users
        for user_email in assigned_users:
            if user_email not in current_users:
                try:
                    from frappe.desk.form.assign_to import add
                    args = {
                        "assign_to": [user_email],
                        "doctype": "Task",
                        "name": task_id,
                        "description": f"Task assigned via Project Management App"
                    }
                    add(args)
                except Exception as e:
                    frappe.log_error(f"Error adding assignment for {user_email}: {str(e)}")
        
        # Update _assign field
        task_doc = frappe.get_doc("Task", task_id)
        task_doc._assign = json.dumps(assigned_users) if assigned_users else None
        task_doc.save(ignore_permissions=True)
        frappe.db.commit()
        
        return {
            "success": True,
            "message": "Task assignments updated successfully",
            "assignments": assigned_users
        }
        
    except Exception as e:
        frappe.log_error(f"Error updating task assignments: {str(e)}")
        return {"success": False, "error": str(e)}

@frappe.whitelist()
def get_tasks_with_assignments(project_name=None):
    """
    Get tasks with their assignments - custom endpoint to ensure assignments are returned correctly
    """
    try:
        # Base query
        filters = {}
        if project_name:
            filters["project"] = project_name
        
        # Get tasks with all required fields
        tasks = frappe.get_list("Task", 
            fields=["name", "subject", "status", "priority", "project", "_assign", "exp_start_date", "exp_end_date", "description"],
            filters=filters,
            limit_page_length=0,
            order_by="creation desc"
        )
        
        # Process assignments for each task
        for task in tasks:
            # Get assignments from ToDo
            todo_assignments = frappe.get_all("ToDo", 
                fields=["allocated_to"],
                filters={
                    "reference_type": "Task",
                    "reference_name": task.name,
                    "status": ("!=", "Cancelled")
                }
            )
            
            # Extract user emails from ToDo assignments
            assignments = [t.allocated_to for t in todo_assignments]
            
            # Also try to get from _assign field as fallback
            if not assignments and task._assign:
                try:
                    assignments = json.loads(task._assign)
                except (json.JSONDecodeError, TypeError):
                    assignments = []
            
            # Update the _assign field to match ToDo assignments
            if assignments:
                task._assign = json.dumps(assignments)
                # Update the database to sync _assign with ToDo assignments
                frappe.db.set_value("Task", task.name, "_assign", json.dumps(assignments))
            else:
                task._assign = None
                frappe.db.set_value("Task", task.name, "_assign", None)
                
            task["assignedUsers"] = assignments
        
        # Commit the changes
        frappe.db.commit()
        
        return {
            "success": True,
            "tasks": tasks
        }
        
    except Exception as e:
        frappe.log_error(f"Error fetching tasks with assignments: {str(e)}")
        return {"success": False, "error": str(e)}

@frappe.whitelist()
def get_project_types():
    """
    Get all available project types for autocomplete
    """
    try:
        project_types = frappe.get_list("Project Type", 
            fields=["name", "project_type"], 
            filters={"disabled": 0},
            order_by="name"
        )
        return {"success": True, "project_types": project_types}
    except Exception as e:
        frappe.log_error(f"Error fetching project types: {str(e)}")
        return {"success": False, "error": str(e)}

@frappe.whitelist()
def search_customers(query=""):
    """
    Search customers for autocomplete with query filtering
    """
    try:
        filters = {}
        
        # Try to add disabled filter, but handle if field doesn't exist
        try:
            # Check if disabled field exists
            frappe.db.sql("SELECT disabled FROM `tabCustomer` LIMIT 1")
            filters["disabled"] = 0
        except:
            # If disabled field doesn't exist, continue without it
            pass
            
        if query:
            filters["customer_name"] = ["like", f"%{query}%"]
        
        customers = frappe.get_list("Customer", 
            fields=["name", "customer_name", "customer_group"], 
            filters=filters,
            order_by="customer_name",
            limit=20
        )
        return {"success": True, "customers": customers}
    except Exception as e:
        frappe.log_error(f"Error searching customers: {str(e)}")
        return {"success": False, "error": str(e)}

@frappe.whitelist()
def search_project_types(query=""):
    """
    Search project types for autocomplete with query filtering
    """
    try:
        # For project types, we'll provide a simple list since ERPNext Project Type doctype is basic
        # Let's check if we have any custom project types first, otherwise use defaults
        project_types = []
        
        try:
            # Try to get from Project Type doctype if it exists
            filters = {}
            if query:
                filters["name"] = ["like", f"%{query}%"]
            
            existing_types = frappe.get_list("Project Type", 
                fields=["name"], 
                filters=filters,
                order_by="name",
                limit=20
            )
            project_types = [{"name": pt.name, "description": ""} for pt in existing_types]
        except:
            # If Project Type doctype doesn't exist or has issues, provide defaults
            default_types = ["Internal", "External"]
            if query:
                project_types = [{"name": pt, "description": ""} for pt in default_types if query.lower() in pt.lower()]
            else:
                project_types = [{"name": pt, "description": ""} for pt in default_types]
        
        return {"success": True, "project_types": project_types}
    except Exception as e:
        frappe.log_error(f"Error searching project types: {str(e)}")
        return {"success": False, "error": str(e)}
