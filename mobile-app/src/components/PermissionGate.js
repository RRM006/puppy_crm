import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * PermissionGate Component
 * Shows children only if user has required role/permissions
 * 
 * @param {Array} roles - Array of allowed roles (e.g., ['ceo', 'manager'])
 * @param {Array} permissions - Array of required permissions (e.g., ['can_invite_users'])
 * @param {ReactNode} children - Content to show if permission granted
 * @param {ReactNode} fallback - Content to show if permission denied (optional)
 */
const PermissionGate = ({ roles = [], permissions = [], children, fallback = null }) => {
  const { userRole, user } = useAuth();

  // If no restrictions, show children
  if (roles.length === 0 && permissions.length === 0) {
    return <>{children}</>;
  }

  // Check if user has required role
  const hasRole = roles.length === 0 || (userRole && roles.includes(userRole));

  // Check if user has required permissions
  // Permissions might be in user.company or directly on user
  const hasPermissions = permissions.length === 0 || 
    permissions.every(perm => user?.company?.[perm] === true || user?.[perm] === true);

  if (hasRole && hasPermissions) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default PermissionGate;

