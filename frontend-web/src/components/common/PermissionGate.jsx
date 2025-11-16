import React from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';

const PermissionGate = ({ roles = [], fallback = null, children }) => {
  const { userRole } = useAuth();

  if (!roles.length) return children;
  if (!userRole) return fallback;
  if (roles.includes(userRole)) return children;
  return fallback;
};

export default PermissionGate;
