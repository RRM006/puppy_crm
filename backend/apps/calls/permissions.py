"""
Permissions for calls app
"""
from rest_framework.permissions import BasePermission
from apps.authentication.models import CompanyUser


class IsCompanyUser(BasePermission):
    """Check if user is a company user"""
    message = "You must be a company user to access this resource."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.account_type != 'company':
            self.message = 'Only company accounts allowed.'
            return False
        return CompanyUser.objects.filter(user=request.user, is_active=True).exists()


class CanManagePhoneNumbers(BasePermission):
    """Check if user can purchase/delete phone numbers (CEO and Managers only)"""
    message = 'Only CEO and Managers can purchase or delete phone numbers.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.account_type != 'company':
            return False
        return CompanyUser.objects.filter(
            user=request.user,
            role__in=['ceo', 'manager'],
            is_active=True
        ).exists()

