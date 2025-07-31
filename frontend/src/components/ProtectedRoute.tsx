import { Box, CircularProgress } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../context/AppContext';
import { AuthService } from '../services/auth';

type ProtectedRouteProps = {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [{ user, accessToken, loading }, setAppState] = useAppStore((state) => (state));
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
            loading: false,
          });
        } else {
          setAppState({ loading: false });
        }
      } catch (error) {
        setAppState({ loading: false });
      } finally {
        setHasCheckedAuth(true);
      }
    };

    tryInitializeAuth();
  }, []);

  if (loading || !hasCheckedAuth) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!user || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
