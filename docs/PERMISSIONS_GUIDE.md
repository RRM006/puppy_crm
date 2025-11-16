# 🔐 Permissions Guide

## 📋 Overview

Puppy CRM uses a role-based access control (RBAC) system to manage user permissions. This guide documents all user roles, their permissions, and how to implement role-based access in code.

**Last Updated**: November 21, 2025

---

## 👥 User Roles

### Company Roles

Company users belong to a company and have one of the following roles:

#### 1. CEO (Super Admin) 👑

**Role Code**: `ceo`

**Description**: Company owner/CEO with full administrative access.

**Default Permissions**:
- ✅ `can_invite_users` - Can invite team members
- ✅ `can_manage_deals` - Can create and manage deals
- ✅ `can_view_reports` - Can access reports and analytics
- ✅ `can_manage_customers` - Can manage customer information

**Special Privileges**:
- Can update company name and employee count
- Can access all company features
- Cannot be removed from company

**Use Cases**:
- Company founder/owner
- Primary administrator
- Full system access

---

#### 2. Manager 📊

**Role Code**: `manager`

**Description**: Manager with full operational access (same permissions as CEO, but not the company owner).

**Default Permissions**:
- ✅ `can_invite_users` - Can invite team members
- ✅ `can_manage_deals` - Can create and manage deals
- ✅ `can_view_reports` - Can access reports and analytics
- ✅ `can_manage_customers` - Can manage customer information

**Special Privileges**:
- Can manage team members
- Can access all operational features
- Cannot update company name/employee count (CEO only)

**Use Cases**:
- Department manager
- Operations manager
- Team lead

---

#### 3. Sales Manager 💼

**Role Code**: `sales_manager`

**Description**: Sales-focused role with deal and customer management access.

**Default Permissions**:
- ❌ `can_invite_users` - Cannot invite team members
- ✅ `can_manage_deals` - Can create and manage deals
- ✅ `can_view_reports` - Can access reports and analytics
- ✅ `can_manage_customers` - Can manage customer information

**Special Privileges**:
- Focus on sales operations
- Deal pipeline management
- Customer relationship management

**Use Cases**:
- Sales team lead
- Account manager
- Business development manager

---

#### 4. Support Staff 🎧

**Role Code**: `support_staff`

**Description**: Customer support role with limited access.

**Default Permissions**:
- ❌ `can_invite_users` - Cannot invite team members
- ❌ `can_manage_deals` - Cannot manage deals
- ❌ `can_view_reports` - Cannot access reports
- ✅ `can_manage_customers` - Can manage customer information

**Special Privileges**:
- Customer support access
- View customer information
- Update customer records

**Use Cases**:
- Customer service representative
- Support agent
- Help desk staff

---

### Customer Role

#### 5. Customer 👤

**Role Code**: `customer`

**Description**: B2C customer account (not a company user).

**Account Type**: `customer` (not a company role)

**Permissions**:
- Can manage own profile
- Can link to companies
- Can view linked companies
- Cannot access company features

**Use Cases**:
- End customers
- B2C users
- Individual users

---

## 📊 Permission Matrix

| Permission | CEO | Manager | Sales Manager | Support Staff | Customer |
|------------|-----|---------|---------------|---------------|----------|
| **Invite Users** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Manage Deals** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **View Reports** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Manage Customers** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Update Company Profile** | ✅* | ✅* | ✅* | ✅* | ❌ |
| **Update Company Name** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Update Employee Count** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **View Own Profile** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Link to Companies** | ❌ | ❌ | ❌ | ❌ | ✅ |

\* All company users can update company profile, but only CEO can update `company_name` and `employee_count`.

---

## 🔧 Implementation Guide

### Backend Implementation

#### 1. Permission Classes

**Location**: `backend/apps/authentication/permissions.py`

```python
from rest_framework.permissions import BasePermission

class IsCompanyUser(BasePermission):
    """Check if user is a company user."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.account_type == 'company'

class IsCompanyCEO(BasePermission):
    """Check if user is a CEO."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            company_user = CompanyUser.objects.get(
                user=request.user,
                is_active=True
            )
            return company_user.role == 'ceo'
        except CompanyUser.DoesNotExist:
            return False

class IsCustomer(BasePermission):
    """Check if user is a customer."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.account_type == 'customer'
```

#### 2. Using Permissions in Views

```python
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .permissions import IsCompanyUser, IsCompanyCEO

class CompanyProfileView(APIView):
    permission_classes = [IsAuthenticated, IsCompanyUser]
    
    def put(self, request):
        # Check if CEO for sensitive fields
        company_user = CompanyUser.objects.get(
            user=request.user,
            is_active=True
        )
        
        if 'company_name' in request.data and company_user.role != 'ceo':
            return Response({
                'non_field_errors': ['Only CEO can update company name.']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update company profile...
```

#### 3. Checking Permissions in Code

```python
from .models import CompanyUser

# Get user's company membership
company_user = CompanyUser.objects.get(
    user=request.user,
    is_active=True
)

# Check role
if company_user.role == 'ceo':
    # CEO-specific logic
    pass

# Check permissions
if company_user.can_invite_users:
    # Allow invitation
    pass

if company_user.can_manage_deals:
    # Allow deal management
    pass
```

#### 4. Permission-Based Serializers

```python
class CompanyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'company_name', 'logo', 'website', ...]
    
    def validate(self, data):
        # Check CEO permission for sensitive fields
        request = self.context.get('request')
        if request:
            company_user = CompanyUser.objects.get(
                user=request.user,
                is_active=True
            )
            if 'company_name' in data and company_user.role != 'ceo':
                raise serializers.ValidationError(
                    "Only CEO can update company name."
                )
        return data
```

---

### Frontend Web Implementation

#### 1. PermissionGate Component

**Location**: `frontend-web/src/components/PermissionGate.jsx`

```jsx
import { useAuth } from '../contexts/AuthContext';

const PermissionGate = ({ 
  roles = [], 
  permissions = [], 
  children, 
  fallback = null 
}) => {
  const { userRole, user } = useAuth();

  // If no restrictions, show children
  if (roles.length === 0 && permissions.length === 0) {
    return <>{children}</>;
  }

  // Check if user has required role
  const hasRole = roles.length === 0 || 
    (userRole && roles.includes(userRole));

  // Check if user has required permissions
  const hasPermissions = permissions.length === 0 ||
    permissions.every(perm => 
      user?.company?.[perm] === true || user?.[perm] === true
    );

  if (hasRole && hasPermissions) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default PermissionGate;
```

#### 2. Using PermissionGate

```jsx
import PermissionGate from '../components/PermissionGate';

function CompanyDashboard() {
  return (
    <div>
      <h1>Company Dashboard</h1>
      
      {/* Only show to CEO and Manager */}
      <PermissionGate roles={['ceo', 'manager']}>
        <InviteTeamButton />
      </PermissionGate>
      
      {/* Only show to users with invite permission */}
      <PermissionGate permissions={['can_invite_users']}>
        <InviteTeamButton />
      </PermissionGate>
      
      {/* Only show to Sales Manager and above */}
      <PermissionGate roles={['ceo', 'manager', 'sales_manager']}>
        <DealsSection />
      </PermissionGate>
      
      {/* Show fallback if no permission */}
      <PermissionGate 
        roles={['ceo']}
        fallback={<p>Only CEO can access this feature.</p>}
      >
        <CompanySettings />
      </PermissionGate>
    </div>
  );
}
```

#### 3. Checking Permissions in Components

```jsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { userRole, user } = useAuth();
  
  const canInvite = user?.company?.can_invite_users === true;
  const canManageDeals = user?.company?.can_manage_deals === true;
  const isCEO = userRole === 'ceo';
  
  return (
    <div>
      {canInvite && <InviteButton />}
      {canManageDeals && <DealsButton />}
      {isCEO && <AdminPanel />}
    </div>
  );
}
```

---

### Mobile App Implementation

#### 1. PermissionGate Component

**Location**: `mobile-app/src/components/PermissionGate.js`

```javascript
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const PermissionGate = ({ 
  roles = [], 
  permissions = [], 
  children, 
  fallback = null 
}) => {
  const { userRole, user } = useAuth();

  // If no restrictions, show children
  if (roles.length === 0 && permissions.length === 0) {
    return <>{children}</>;
  }

  // Check if user has required role
  const hasRole = roles.length === 0 || 
    (userRole && roles.includes(userRole));

  // Check if user has required permissions
  const hasPermissions = permissions.length === 0 ||
    permissions.every(perm => 
      user?.company?.[perm] === true || user?.[perm] === true
    );

  if (hasRole && hasPermissions) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default PermissionGate;
```

#### 2. Using PermissionGate in Mobile

```javascript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import PermissionGate from '../components/PermissionGate';

function CompanyDashboardScreen() {
  return (
    <View>
      <Text>Company Dashboard</Text>
      
      {/* Only show to CEO and Manager */}
      <PermissionGate roles={['ceo', 'manager']}>
        <TouchableOpacity onPress={handleInvite}>
          <Text>Invite Team Member</Text>
        </TouchableOpacity>
      </PermissionGate>
      
      {/* Only show to users with invite permission */}
      <PermissionGate permissions={['can_invite_users']}>
        <TouchableOpacity onPress={handleInvite}>
          <Text>Invite Team Member</Text>
        </TouchableOpacity>
      </PermissionGate>
    </View>
  );
}
```

#### 3. Checking Permissions in Mobile Components

```javascript
import { useAuth } from '../contexts/AuthContext';

function MyScreen() {
  const { userRole, user } = useAuth();
  
  const canInvite = user?.company?.can_invite_users === true;
  const canManageDeals = user?.company?.can_manage_deals === true;
  const isCEO = userRole === 'ceo';
  
  return (
    <View>
      {canInvite && <InviteButton />}
      {canManageDeals && <DealsButton />}
      {isCEO && <AdminPanel />}
    </View>
  );
}
```

---

## 🔍 Permission Checking Patterns

### Pattern 1: Role-Based Access

```javascript
// Check if user has specific role
if (userRole === 'ceo' || userRole === 'manager') {
  // Allow access
}
```

### Pattern 2: Permission-Based Access

```javascript
// Check if user has specific permission
if (user?.company?.can_invite_users) {
  // Allow invitation
}
```

### Pattern 3: Multiple Roles

```javascript
// Check if user has any of the roles
const allowedRoles = ['ceo', 'manager', 'sales_manager'];
if (allowedRoles.includes(userRole)) {
  // Allow access
}
```

### Pattern 4: Multiple Permissions

```javascript
// Check if user has all required permissions
const requiredPermissions = ['can_manage_deals', 'can_view_reports'];
const hasAllPermissions = requiredPermissions.every(
  perm => user?.company?.[perm] === true
);

if (hasAllPermissions) {
  // Allow access
}
```

---

## 🎯 Best Practices

### 1. Always Check Permissions on Backend

**❌ Bad**: Only checking permissions on frontend
```javascript
// Frontend only - NOT SECURE
if (userRole === 'ceo') {
  updateCompanyName();
}
```

**✅ Good**: Check on both frontend and backend
```python
# Backend - SECURE
if company_user.role != 'ceo':
    return Response({'error': 'Only CEO can update company name'}, 
                    status=403)
```

### 2. Use PermissionGate for UI

**✅ Good**: Use PermissionGate component
```jsx
<PermissionGate roles={['ceo']}>
  <AdminPanel />
</PermissionGate>
```

### 3. Provide Clear Error Messages

**✅ Good**: Clear permission error
```python
return Response({
    'detail': 'You do not have permission to invite users. '
              'Contact your manager to request access.'
}, status=403)
```

### 4. Cache Permission Checks

**✅ Good**: Cache company user data
```javascript
// Cache company user data in context
const { user, company } = useAuth();
const canInvite = company?.can_invite_users;
```

---

## 📝 Permission Updates

### Updating Permissions

Permissions are set automatically based on role when a `CompanyUser` is created. To manually update permissions:

```python
from apps.authentication.models import CompanyUser

company_user = CompanyUser.objects.get(user=user, company=company)
company_user.can_invite_users = True
company_user.can_manage_deals = True
company_user.save()
```

### Custom Permission Overrides

You can override default permissions for specific users:

```python
# Give support staff permission to view reports
support_user = CompanyUser.objects.get(
    user=user,
    role='support_staff'
)
support_user.can_view_reports = True
support_user.save()
```

---

## 🧪 Testing Permissions

### Backend Tests

```python
from django.test import TestCase
from rest_framework.test import APIClient
from apps.authentication.models import User, Company, CompanyUser

class PermissionTestCase(TestCase):
    def setUp(self):
        self.ceo = User.objects.create_user(
            email='ceo@test.com',
            password='test123',
            account_type='company'
        )
        self.company = Company.objects.create(
            company_name='Test Company',
            created_by=self.ceo
        )
        self.ceo_user = CompanyUser.objects.create(
            user=self.ceo,
            company=self.company,
            role='ceo'
        )
    
    def test_ceo_can_update_company_name(self):
        client = APIClient()
        client.force_authenticate(user=self.ceo)
        response = client.put('/api/auth/company/profile/', {
            'company_name': 'New Name'
        })
        self.assertEqual(response.status_code, 200)
    
    def test_manager_cannot_update_company_name(self):
        manager = User.objects.create_user(
            email='manager@test.com',
            password='test123',
            account_type='company'
        )
        CompanyUser.objects.create(
            user=manager,
            company=self.company,
            role='manager'
        )
        client = APIClient()
        client.force_authenticate(user=manager)
        response = client.put('/api/auth/company/profile/', {
            'company_name': 'New Name'
        })
        self.assertEqual(response.status_code, 400)
```

---

## 📚 Related Documentation

- [API Blueprint](./API_BLUEPRINT.md) - API endpoint documentation
- [Database Schema](./DATABASE_SCHEMA.md) - Database structure
- [Development Progress](./DEVELOPMENT_PROGRESS.md) - Project status

---

**Last Updated**: November 21, 2025  
**Maintained By**: Puppy CRM Development Team

