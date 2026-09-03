import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, authLoading } = useApp();

  // Don't decide whether /login is accessible
  // until session restoration has finished.
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#040312] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-white/10 border-t-[#5C3FE0] rounded-full animate-spin" />

          <p className="text-sm text-slate-400">
            Restoring your session...
          </p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;