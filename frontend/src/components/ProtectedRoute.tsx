import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from './hooks/useStore';
import { AuthService } from '../services/auth';
import logger from '../utils/logger';

type ProtectedRouteProps = {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [{ user, accessToken }, setAppState] = useStore((state) => (state));
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    const tryInitializeAuth = async () => {
      if (user && accessToken && AuthService.isTokenValid(accessToken)) {
        setHasCheckedAuth(true);
        return;
      }

      setAppState({ loading: true });
      try {
        const authData = await AuthService.initializeAuth();
        if (authData) {
          AuthService.setToken(authData.accessToken);
          setAppState({
            user: authData.user,
            accessToken: authData.accessToken,
          });
        }
      } catch (error) {
        logger.error({ message: 'Failed to get current user', error });
      } finally {
        setHasCheckedAuth(true);
        setAppState({ loading: false });
      }
    };

    tryInitializeAuth();
  }, [accessToken, setAppState, user]);

  if (!hasCheckedAuth) {
    return null;
  }

  if (!user || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
