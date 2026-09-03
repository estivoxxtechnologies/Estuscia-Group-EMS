import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, authLoading } = useApp();

  // Authentication state is still being restored.
  // DO NOT redirect to /login yet.
  if (authLoading) {
    return <AuthLoadingScreen />;
  }

  // Session restoration finished and user is not authenticated.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AuthLoadingScreen: React.FC = () => {
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
};

export default ProtectedRoute;