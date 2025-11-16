"""
Permissions for customer management APIs
"""

from rest_framework import permissions


class IsCompanyUser(permissions.BasePermission):
    """
    Permission to check if user belongs to a company.
    """
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Check if user has CompanyUser relationship
        return request.user.company_users.filter(is_active=True).exists()


class CanManageCustomers(permissions.BasePermission):
    """
    Permission to manage customers based on role.
    
    - CEO, Manager: Full access
    - Sales Manager: Full access
    - Staff: Read-only access to assigned customers
    """
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Get user's company user relationship
        company_user = request.user.company_users.filter(is_active=True).first()
        if not company_user:
            return False
        
        user_role = company_user.role
        
        # CEO and managers have full access
        if user_role in ['ceo', 'manager', 'sales_manager']:
            return True
        
        # Staff has read-only access
        if user_role == 'support_staff':
            return request.method in permissions.SAFE_METHODS
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """
        Object-level permission to check if user can access this customer.
        """
        company_user = request.user.company_users.filter(is_active=True).first()
        if not company_user:
            return False
        
        user_role = company_user.role
        
        # CEO and managers can access all customers in their company
        if user_role in ['ceo', 'manager', 'sales_manager']:
            # Ensure customer belongs to user's company
            return obj.company == company_user.company
        
        # Staff can only access customers they manage
        if user_role == 'support_staff':
            if request.method in permissions.SAFE_METHODS:
                # Check if they are the account manager
                return (
                    obj.company == company_user.company and
                    obj.account_manager == request.user
                )
        
        return False

        """
        Object-level permission to check if user can access this customer.
        """
        user_role = request.user.role
        
        # CEO and managers can access all customers in their company
        if user_role in ['ceo', 'manager', 'sales_manager']:
            # Ensure customer belongs to user's company
            return obj.company == request.user.company
        
        # Staff can only access customers they manage
        if user_role == 'staff':
            if request.method in permissions.SAFE_METHODS:
                # Check if they are the account manager
                return (
                    obj.company == request.user.company and
                    obj.account_manager == request.user
                )
        
        return False
