import frappe
import json
from frappe.desk.doctype.workspace.workspace import Workspace

def update_workspace(workspace_name, shortcuts=None, charts=None, links=None, custom_blocks=None):
    """
    Update an existing workspace with new content
    
    Args:
        workspace_name (str): Name of the workspace to update
        shortcuts (list, optional): List of shortcut objects to add/update
        charts (list, optional): List of chart objects to add/update
        links (list, optional): List of link card objects to add/update
        custom_blocks (list, optional): List of custom block objects to add/update
    
    Returns:
        dict: Result of the update operation
    """
    try:
        # Get the existing workspace
        workspace = frappe.get_doc("Workspace", workspace_name)
        
        # Load the current content
        current_content = []
        if workspace.content:
            current_content = json.loads(workspace.content)
            
            # Validate that content is a list
            if not isinstance(current_content, list):
                current_content = []
        
        # Update the content with new elements
        updated_content = update_content_section(current_content, "shortcuts", shortcuts)
        updated_content = update_content_section(updated_content, "charts", charts)
        updated_content = update_content_section(updated_content, "cards", links)
        
        if custom_blocks:
            for block in custom_blocks:
                updated_content.append(block)
        
        # Save the updated content back to the workspace
        workspace.content = json.dumps(updated_content)
        workspace.save()
        
        return {"status": "success", "message": f"Workspace {workspace_name} updated successfully"}
    
    except Exception as e:
        frappe.log_error(f"Error updating workspace: {str(e)}", "Workspace Update Error")
        return {"status": "error", "message": str(e)}


def update_content_section(content, section_type, new_items):
    """
    Update a specific section of workspace content
    
    Args:
        content (list): Current workspace content
        section_type (str): Type of section to update ('shortcuts', 'charts', 'cards')
        new_items (list): New items to add/update in the section
    
    Returns:
        list: Updated content list
    """
    if not new_items:
        return content
    
    # Find existing sections of the specified type
    section_indices = [i for i, item in enumerate(content) 
                      if item.get("type") == section_type]
    
    if section_indices:
        # Update existing section
        section_index = section_indices[0]
        
        # Get existing items
        existing_items = content[section_index].get("items", [])
        
        # Create a map of existing items by label/name for easy lookup
        existing_item_map = {item.get("label", item.get("name", "")): item 
                            for item in existing_items}
        
        # Update or add new items
        for new_item in new_items:
            item_key = new_item.get("label", new_item.get("name", ""))
            if item_key in existing_item_map:
                # Update existing item
                item_index = existing_items.index(existing_item_map[item_key])
                existing_items[item_index] = new_item
            else:
                # Add new item
                existing_items.append(new_item)
        
        # Update the section's items
        content[section_index]["items"] = existing_items
    else:
        # Create a new section of this type
        new_section = {
            "type": section_type,
            "items": new_items
        }
        content.append(new_section)
    
    return content


def remove_workspace_item(workspace_name, section_type, item_identifier):
    """
    Remove a specific item from a workspace section
    
    Args:
        workspace_name (str): Name of the workspace
        section_type (str): Type of section ('shortcuts', 'charts', 'cards')
        item_identifier (str): Label or name of the item to remove
    
    Returns:
        dict: Result of the operation
    """
    try:
        workspace = frappe.get_doc("Workspace", workspace_name)
        current_content = json.loads(workspace.content) if workspace.content else []
        
        # Find the section
        for i, section in enumerate(current_content):
            if section.get("type") == section_type:
                items = section.get("items", [])
                
                # Find the item to remove
                for j, item in enumerate(items):
                    if (item.get("label") == item_identifier or 
                        item.get("name") == item_identifier):
                        # Remove the item
                        items.pop(j)
                        section["items"] = items
                        current_content[i] = section
                        
                        # Save the updated content
                        workspace.content = json.dumps(current_content)
                        workspace.save()
                        
                        return {"status": "success", 
                                "message": f"Item {item_identifier} removed successfully"}
        
        return {"status": "error", "message": f"Item {item_identifier} not found"}
    
    except Exception as e:
        frappe.log_error(f"Error removing workspace item: {str(e)}", "Workspace Update Error")
        return {"status": "error", "message": str(e)}


def create_shortcut(label, doctype=None, report=None, page=None, dashboard=None, link=None):
    """
    Create a shortcut item for workspace
    
    Args:
        label (str): Label to display for the shortcut
        doctype (str, optional): DocType to link to
        report (str, optional): Report to link to
        page (str, optional): Page to link to
        dashboard (str, optional): Dashboard to link to
        
    Returns:
        dict: Shortcut item configuration
    """
    shortcut = {"label": label}
    
    if doctype:
        shortcut["link_to"] = "DocType"
        shortcut["link_to_type"] = "doctype"
        shortcut["doctype"] = doctype
    elif report:
        shortcut["link_to"] = "Report"
        shortcut["link_to_type"] = "report"
        shortcut["report"] = report
    elif page:
        shortcut["link_to"] = "Page"
        shortcut["link_to_type"] = "page"
        shortcut["page"] = page
    elif dashboard:
        shortcut["link_to"] = "Dashboard"
        shortcut["link_to_type"] = "dashboard"
        shortcut["dashboard"] = dashboard
    
    return shortcut


def create_chart(chart_name, doctype, timespan="Last Year", time_interval="Monthly", chart_type="Sum"):
    """
    Create a chart item for workspace dashboard
    
    Args:
        chart_name (str): Name of the chart to add
        doctype (str): DocType the chart is based on
        timespan (str, optional): Timespan for the chart
        time_interval (str, optional): Time interval for the chart
        chart_type (str, optional): Type of chart aggregation
        
    Returns:
        dict: Chart item configuration
    """
    return {
        "name": chart_name,
        "doctype": doctype,
        "timespan": timespan,
        "time_interval": time_interval,
        "chart_type": chart_type
    }


def create_link_card(label, items):
    """
    Create a link card for workspace
    
    Args:
        label (str): Label for the card section
        items (list): List of dictionaries with link details
            Each item should have:
            - label (str): Label to display
            - type (str): 'DocType', 'Report', 'Page', etc.
            - name (str): Name of the item to link to
            
    Returns:
        dict: Link card configuration
    """
    return {
        "label": label,
        "items": items
    }


def create_custom_block(block_type, content, title=None):
    """
    Create a custom block for workspace
    
    Args:
        block_type (str): Type of block ('header', 'paragraph', 'card', etc.)
        content (str or dict): Content for the block
        title (str, optional): Title for the block
        
    Returns:
        dict: Custom block configuration
    """
    block = {
        "type": block_type,
        "data": content
    }
    
    if title:
        block["title"] = title
    
    return block
