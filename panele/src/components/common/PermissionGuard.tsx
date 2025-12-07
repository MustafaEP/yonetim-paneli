import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface PermissionGuardProps {
  permissions?: string | string[];
  roles?: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permissions,
  roles,
  children,
  fallback = null,
}) => {
  const { user } = useAuth();

  // Role check
  if (roles) {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    const hasRole = user?.roles.some((role) => roleArray.includes(role));
    if (!hasRole) {
      return <>{fallback}</>;
    }
  }

  // Permission check (simplified - you may need to implement permission checking logic)
  // For now, we'll just check if user is authenticated
  if (permissions && !user) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGuard;

