import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../context/AppContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [user] = useAppStore((state) => state.user);
  const [accessToken] = useAppStore((state) => state.accessToken);

  if (!user || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}