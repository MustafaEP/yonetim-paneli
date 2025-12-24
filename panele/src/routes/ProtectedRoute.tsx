// src/routes/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  requiredPermission?: string;
  alternativePermission?: string;
  alternativePermission2?: string;
  alternativePermission3?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  requiredPermission, 
  alternativePermission,
  alternativePermission2,
  alternativePermission3,
}) => {
  const { isAuthenticated, hasPermission, isLoading } = useAuth();

  // Token kontrolü tamamlanana kadar bekle
  if (isLoading) {
    return null; // veya bir loading spinner gösterilebilir
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission) {
    const hasRequired = hasPermission(requiredPermission);
    const hasAlternative = alternativePermission ? hasPermission(alternativePermission) : false;
    const hasAlternative2 = alternativePermission2 ? hasPermission(alternativePermission2) : false;
    const hasAlternative3 = alternativePermission3 ? hasPermission(alternativePermission3) : false;
    
    if (!hasRequired && !hasAlternative && !hasAlternative2 && !hasAlternative3) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
