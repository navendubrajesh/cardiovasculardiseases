import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { Permission } from '../../lib/permissions';
import { useAuth } from '../../state/AuthProvider';

type RequirePermissionProps = {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
};

export const RequirePermission = ({ permission, children, fallback }: RequirePermissionProps) => {
  const { permissions, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!permissions.includes(permission)) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h2 className="text-lg font-semibold">Access restricted</h2>
        <p className="mt-2 text-sm">Your role does not include the <code>{permission}</code> permission.</p>
      </div>
    );
  }

  return <>{children}</>;
};
