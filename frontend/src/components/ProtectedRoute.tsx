import { Box, CircularProgress } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../context/AppContext';
import { AuthService } from '../services/auth';
import logger from '../utils/logger';
import axios from 'axios';

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
        if (axios.isAxiosError(error)) {
          const requestId = error.response?.headers?.['x-request-id'];
          logger.error({ 
            message: 'Failed to get current user', 
            error: error.response?.data?.error?.message || error.message,
            request_id: requestId,
          });
        } else {
          logger.error({ message: 'Failed to get current user', error });
        }
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
