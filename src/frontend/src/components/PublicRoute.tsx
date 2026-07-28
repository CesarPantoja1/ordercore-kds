import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingState from './LoadingState';

interface PublicRouteProps {
  children: ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isAuthLoading, setupCompleted } = useAuth();
  const location = window.location.pathname;

  if (isAuthLoading) {
    return <LoadingState message="Cargando..." />;
  }

  // Allow setup wizard even if not completed
  if (setupCompleted === false && location !== '/setup-wizard') {
    return <Navigate to="/setup-wizard" replace />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
