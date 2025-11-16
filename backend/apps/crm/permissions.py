from rest_framework.permissions import BasePermission
from apps.authentication.models import CompanyUser
from .models import Lead

class IsCompanyUser(BasePermission):
    message = "You must be a company user to access this resource."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.account_type != 'company':
            self.message = 'Only company accounts allowed.'
            return False
        return CompanyUser.objects.filter(user=request.user, is_active=True).exists()

class CanManageLeads(BasePermission):
    message = 'Insufficient permissions to manage leads.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return CompanyUser.objects.filter(user=request.user, is_active=True, can_manage_deals=True).exists()

class IsLeadOwnerOrManager(BasePermission):
    message = 'You must be lead owner, assignee or manager.'

    def has_object_permission(self, request, view, obj: Lead):
        if not request.user or not request.user.is_authenticated:
            return False
        if obj.created_by_id == request.user.id or (obj.assigned_to_id == request.user.id if obj.assigned_to_id else False):
            return True
        # Manager permission
        return CompanyUser.objects.filter(user=request.user, company=obj.company, is_active=True, can_manage_deals=True).exists()

class PipelineManagePermission(BasePermission):
    message = 'Only company CEO or Manager can manage pipelines.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.account_type != 'company':
            return False
        return CompanyUser.objects.filter(user=request.user, role__in=['ceo','manager'], is_active=True).exists()

class IsDealOwnerOrManager(BasePermission):
    message = 'You must be deal owner, assignee or manager.'

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if getattr(obj, 'created_by_id', None) == request.user.id:
            return True
        if getattr(obj, 'assigned_to_id', None) == request.user.id:
            return True
        return CompanyUser.objects.filter(user=request.user, company=obj.company, is_active=True, can_manage_deals=True).exists()
