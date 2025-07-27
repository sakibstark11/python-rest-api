import type { ReactNode} from 'react';
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthService } from '../services/auth';
import { useStore } from '../hooks/useStore';
import { Box, CircularProgress } from '@mui/material';

type ProtectedRouteProps = {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [state, actions] = useStore();

  useEffect(() => {
    const checkAuth = async () => {
      if (!state.user && AuthService.isAuthenticated()) {
        try {
          actions.setLoading(true);
          const user = await AuthService.getCurrentUser();
          actions.setUser(user);
        } catch {
          AuthService.logout();
        } finally {
          actions.setLoading(false);
        }
      }
    };

    checkAuth();
  }, [state.user, actions]);

  if (state.loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!state.user && !AuthService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};