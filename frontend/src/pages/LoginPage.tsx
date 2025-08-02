import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../context/AppContext';
import { AuthService } from '../services/auth';
import type { LoginCredentials } from '../types';
import logger from '../utils/logger';

export default function LoginPage() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [accessToken, setAppState] = useAppStore((state) => state.accessToken);
  const [loading] = useAppStore((state) => state.loading);
  const [error] = useAppStore((state) => state.error);

  useEffect(() => {
    if (accessToken && AuthService.isTokenValid(accessToken)) {
      navigate('/');
    } else {
      setAppState({ user: null, accessToken: null, events: [], error: null, loading: false });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setAppState({ loading: true, error: null });

    try {
      const authResponse = await AuthService.login(credentials);

      AuthService.setToken(authResponse.access_token);
      const user = await AuthService.getCurrentUser();

      setAppState({
        user,
        accessToken: authResponse.access_token,
        loading: false,
      });
      navigate('/');
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const requestId = error.response?.headers?.['x-request-id'];
        logger.error({ 
          message: 'Login failed', 
          error: error.response?.data?.error?.message || error.message,
          request_id: requestId,
        });
      } else {
        logger.error({ message: 'Login failed', error });
      }
      setAppState({
        loading: false,
        error: error.response?.data?.message || 'Login failed',
      });
    }
  };

  const handleChange = (field: keyof LoginCredentials) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setCredentials({ ...credentials, [field]: e.target.value });
  };

  return (
    <Container maxWidth="xs">
      <Card>
        <CardContent>
          <Box display="flex" flexDirection="column" alignItems="center">
            <Typography variant="h4" align="center">
              Login
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={credentials.email}
              onChange={handleChange('email')}
              margin="normal"
              required
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={credentials.password}
              onChange={handleChange('password')}
              margin="normal"
              required
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>

  );
}
