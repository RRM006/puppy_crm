from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import uuid
from datetime import timedelta

class User(AbstractUser):
    ACCOUNT_TYPE_CHOICES = [
        ('company', 'Company'),
        ('customer', 'Customer'),
    ]
    account_type = models.CharField(max_length=16, choices=ACCOUNT_TYPE_CHOICES)
    phone = models.CharField(max_length=32, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Company(models.Model):
    INDUSTRY_CHOICES = [
        ('technology', 'Technology'),
        ('healthcare', 'Healthcare'),
        ('finance', 'Finance'),
        ('retail', 'Retail'),
        ('manufacturing', 'Manufacturing'),
        ('other', 'Other'),
    ]
    
    company_name = models.CharField(max_length=255)
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    website = models.URLField(max_length=200, blank=True, null=True)
    industry = models.CharField(max_length=32, choices=INDUSTRY_CHOICES, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=32, blank=True, null=True)
    employee_count = models.PositiveIntegerField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    timezone = models.CharField(max_length=100, blank=True, null=True)
    created_by = models.ForeignKey('User', on_delete=models.CASCADE, related_name='companies_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Companies'

    def __str__(self):
        return self.company_name

class CompanyUser(models.Model):
    ROLE_CHOICES = [
        ('ceo', 'CEO'),
        ('manager', 'Manager'),
        ('sales_manager', 'Sales Manager'),
        ('support_staff', 'Support Staff'),
    ]
    
    DEPARTMENT_CHOICES = [
        ('sales', 'Sales'),
        ('support', 'Support'),
        ('marketing', 'Marketing'),
        ('management', 'Management'),
    ]
    
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='company_users')
    company = models.ForeignKey('Company', on_delete=models.CASCADE, related_name='company_users')
    role = models.CharField(max_length=32, choices=ROLE_CHOICES)
    department = models.CharField(max_length=32, choices=DEPARTMENT_CHOICES, blank=True, null=True)
    invited_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name='invitations_sent')
    joined_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    
    # Permissions
    can_invite_users = models.BooleanField(default=False)
    can_manage_deals = models.BooleanField(default=False)
    can_view_reports = models.BooleanField(default=False)
    can_manage_customers = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('user', 'company')
    
    def save(self, *args, **kwargs):
        # Set default permissions based on role
        if not self.pk:  # Only on creation
            if self.role == 'ceo':
                self.can_invite_users = True
                self.can_manage_deals = True
                self.can_view_reports = True
                self.can_manage_customers = True
            elif self.role == 'manager':
                self.can_invite_users = True
                self.can_manage_deals = True
                self.can_view_reports = True
                self.can_manage_customers = True
            elif self.role == 'sales_manager':
                self.can_manage_deals = True
                self.can_view_reports = True
                self.can_manage_customers = True
            elif self.role == 'support_staff':
                self.can_manage_customers = True
        super().save(*args, **kwargs)

class Customer(models.Model):
    user = models.OneToOneField('User', on_delete=models.CASCADE, related_name='customer_profile')
    profile_picture = models.ImageField(upload_to='customer_profiles/', blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.get_full_name()} - Customer"

class CustomerCompany(models.Model):
    CUSTOMER_STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('blocked', 'Blocked'),
    ]
    
    customer = models.ForeignKey('Customer', on_delete=models.CASCADE, related_name='companies')
    company = models.ForeignKey('Company', on_delete=models.CASCADE, related_name='customers')
    verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    added_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name='customers_added')
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Phase 5 additions
    customer_since = models.DateTimeField(null=True, blank=True, help_text='Date when verified')
    customer_status = models.CharField(max_length=20, choices=CUSTOMER_STATUS_CHOICES, default='active')
    account_manager = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_customers', help_text='Assigned company user')
    notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name_plural = 'Customer Companies'
    
    def save(self, *args, **kwargs):
        # Set customer_since when first verified
        if self.verified and not self.customer_since:
            self.customer_since = timezone.now()
        super().save(*args, **kwargs)


class UserInvitation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('expired', 'Expired'),
    ]
    
    company = models.ForeignKey('Company', on_delete=models.CASCADE, related_name='invitations')
    email = models.EmailField()
    role = models.CharField(max_length=32, choices=CompanyUser.ROLE_CHOICES)
    invited_by = models.ForeignKey('User', on_delete=models.CASCADE, related_name='invitations_created')
    invitation_token = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='pending')
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Generate unique token and set expiry on creation
        if not self.pk:
            self.invitation_token = str(uuid.uuid4())
            self.expires_at = timezone.now() + timedelta(days=7)
        super().save(*args, **kwargs)
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def __str__(self):
        return f"Invitation to {self.email} for {self.company.company_name}"
