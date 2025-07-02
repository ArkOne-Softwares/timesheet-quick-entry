/**
 * ERPNext Permission Utilities
 * Leverage native Frappe permission system
 */

// Check if user has permission for a specific doctype and action
export const checkPermission = async (doctype, permissionType = 'write', docName = null) => {
    try {
        // Use Frappe's native permission checking
        const response = await frappe.call({
            method: 'frappe.core.doctype.user_permission.user_permission.check_perm',
            args: {
                doctype: doctype,
                doc: docName,
                perm_type: permissionType
            }
        });
        return response.message || false;
    } catch (error) {
        console.error('Permission check failed:', error);
        return false;
    }
};

// Check if user can edit a specific document
export const canEdit = async (doctype, docName) => {
    try {
        // Use Frappe's has_permission method
        const response = await frappe.call({
            method: 'frappe.permissions.has_permission',
            args: {
                doctype: doctype,
                doc: docName,
                ptype: 'write'
            }
        });
        return response.message || false;
    } catch (error) {
        console.error('Edit permission check failed:', error);
        // Fallback: check if user is the owner or has write permission
        return await checkUserCanEdit(doctype, docName);
    }
};

// Fallback permission check using user roles and document ownership
export const checkUserCanEdit = async (doctype, docName) => {
    try {
        // Get current user
        const currentUser = frappe.session.user;
        
        // If user is Administrator, they can edit everything
        if (frappe.user.has_role('Administrator')) {
            return true;
        }

        // Check if user has System Manager role
        if (frappe.user.has_role('System Manager')) {
            return true;
        }

        // Check if user has specific doctype write permission
        if (frappe.user.has_role('Projects Manager') || frappe.user.has_role('Projects User')) {
            return true;
        }

        // If we have a specific document, check ownership
        if (docName) {
            const response = await frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: doctype,
                    name: docName
                }
            });

            const doc = response.message;
            if (doc && (doc.owner === currentUser || doc.assigned_to === currentUser)) {
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error('Fallback permission check failed:', error);
        return false;
    }
};

// Check if user can create new documents of a specific doctype
export const canCreate = (doctype) => {
    try {
        // Use Frappe's native permission checking
        return frappe.model.can_create(doctype);
    } catch (error) {
        console.error('Create permission check failed:', error);
        return false;
    }
};

// Check if user can delete a specific document
export const canDelete = async (doctype, docName) => {
    try {
        const response = await frappe.call({
            method: 'frappe.permissions.has_permission',
            args: {
                doctype: doctype,
                doc: docName,
                ptype: 'delete'
            }
        });
        return response.message || false;
    } catch (error) {
        console.error('Delete permission check failed:', error);
        return false;
    }
};

// Get user's role-based permissions for a doctype
export const getUserPermissions = (doctype) => {
    try {
        return {
            canRead: frappe.model.can_read(doctype),
            canWrite: frappe.model.can_write(doctype),
            canCreate: frappe.model.can_create(doctype),
            canDelete: frappe.model.can_delete(doctype),
            canCancel: frappe.model.can_cancel(doctype),
            canAmend: frappe.model.can_amend(doctype)
        };
    } catch (error) {
        console.error('Failed to get user permissions:', error);
        return {
            canRead: false,
            canWrite: false,
            canCreate: false,
            canDelete: false,
            canCancel: false,
            canAmend: false
        };
    }
};

// Check if current user is the owner of a document
export const isDocumentOwner = async (doctype, docName) => {
    try {
        const response = await frappe.call({
            method: 'frappe.client.get_value',
            args: {
                doctype: doctype,
                filters: { name: docName },
                fieldname: 'owner'
            }
        });

        const owner = response.message?.owner;
        return owner === frappe.session.user;
    } catch (error) {
        console.error('Failed to check document ownership:', error);
        return false;
    }
};

// Simplified permission check that combines multiple methods
export const hasTaskEditPermission = async (taskName) => {
    try {
        // Quick check using Frappe's built-in methods
        if (frappe.user.has_role(['Administrator', 'System Manager', 'Projects Manager'])) {
            return true;
        }

        // Check if user can write to Task doctype
        if (frappe.model.can_write('Task')) {
            return true;
        }

        // Check document-specific permissions
        return await canEdit('Task', taskName);
    } catch (error) {
        console.error('Task edit permission check failed:', error);
        return false;
    }
};
