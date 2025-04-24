import frappe
from arkone_projects.setup.workspace_utils import update_workspace
from arkone_projects.setup.workspace_utils import create_shortcut

def after_install():
    """
    After install or migrate update the workspace content
    and add a shortcut to the new page in project workspace
    """
    # Update the workspace
    result = update_workspace("Projects", shortcuts=[
        create_shortcut("Sales Order", page="project_home"),
    ])
    
    # Commit changes to ensure they persist
    frappe.db.commit()

