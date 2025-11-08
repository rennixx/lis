import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Spinner } from '@/components/ui/Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  roles,
  redirectTo = '/login',
}) => {
  const location = useLocation();
  const { isAuthenticated, user, hasPermission } = useAuthStore();

  // Debug: Log ProtectedRoute state
  React.useEffect(() => {
    console.log('🔍 [ProtectedRoute] ProtectedRoute rendered');
    console.log('🔍 [ProtectedRoute] Current path:', location.pathname);
    console.log('🔍 [ProtectedRoute] Is authenticated:', isAuthenticated);
    console.log('🔍 [ProtectedRoute] User:', user);
    console.log('🔍 [ProtectedRoute] Required roles:', roles);
    if (roles && user) {
      console.log('🔍 [ProtectedRoute] Has permission:', roles.some(role => hasPermission(role)));
    }
  }, [location, isAuthenticated, user, roles, hasPermission]);

  // Show loading spinner while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role permissions if roles are specified
  if (roles && roles.length > 0 && !roles.some(role => hasPermission(role))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access this page.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Your role: <span className="font-medium">{user?.role}</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Required roles: <span className="font-medium">{roles.join(', ')}</span>
            </p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="mt-6 btn btn-outline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Render children if authenticated and authorized
  return <>{children}</>;
};