"""
Custom permissions for authentication app.
Phase 3.2 - Company Profile APIs
Phase 3.3 - Customer Profile APIs
"""

from rest_framework.permissions import BasePermission
from .models import CompanyUser, Customer


class IsCompanyUser(BasePermission):
    """
    Permission to check if user is a member of any company.
    Used for company-related endpoints.
    """
    message = "You must be a company user to access this resource."

    def has_permission(self, request, view):
        # User must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # User must have account_type 'company'
        if request.user.account_type != 'company':
            self.message = "This endpoint is only for company accounts."
            return False
        
        # User must be a member of at least one active company
        has_company = CompanyUser.objects.filter(
            user=request.user,
            is_active=True
        ).exists()
        
        if not has_company:
            self.message = "You are not a member of any company."
            return False
        
        return True


class IsCompanyCEO(BasePermission):
    """
    Permission to check if user is a CEO of their company.
    Used for sensitive company operations.
    """
    message = "Only company CEOs can perform this action."

    def has_permission(self, request, view):
        # User must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # User must have account_type 'company'
        if request.user.account_type != 'company':
            self.message = "This endpoint is only for company accounts."
            return False
        
        # User must be a CEO of at least one active company
        is_ceo = CompanyUser.objects.filter(
            user=request.user,
            role='ceo',
            is_active=True
        ).exists()
        
        if not is_ceo:
            self.message = "Only CEOs can perform this action."
            return False
        
        return True
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user is CEO of the specific company object.
        """
        # For Company objects
        if hasattr(obj, 'team_members'):
            return CompanyUser.objects.filter(
                user=request.user,
                company=obj,
                role='ceo',
                is_active=True
            ).exists()
        
        return False


class IsCustomer(BasePermission):
    """
    Permission to check if user is a customer.
    Used for customer-related endpoints.
    """
    message = "You must be a customer to access this resource."

    def has_permission(self, request, view):
        # User must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # User must have account_type 'customer'
        if request.user.account_type != 'customer':
            self.message = "This endpoint is only for customer accounts."
            return False
        
        # User must have a customer profile
        has_profile = Customer.objects.filter(user=request.user).exists()
        
        if not has_profile:
            self.message = "Customer profile not found."
            return False
        
        return True
