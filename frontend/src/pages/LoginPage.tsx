import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../context/AppContext';
import { AuthService } from '../services/auth';
import { tokenManager } from '../services/tokenManager';
import type { LoginCredentials } from '../types';

export default function LoginPage() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [{ user, accessToken }, setAppState] = useAppStore((state) => state);

  useEffect(() => {
    if (user && accessToken && AuthService.isTokenValid(accessToken)) {
      navigate('/');
    } else if (accessToken && !AuthService.isTokenValid(accessToken)) {
      setAppState({ user: null, accessToken: null });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setAppState({ loading: true, error: null });

    try {
      const authResponse = await AuthService.login(credentials);
      const user = await AuthService.getCurrentUser(authResponse.access_token);

      tokenManager.setToken(authResponse.access_token);
      setAppState({
        user,
        accessToken: authResponse.access_token,
        loading: false,
      });
      navigate('/');
    } catch (error: any) {
      setAppState({
        loading: false,
        error: error.response?.data?.message || 'Login failed',
      });
    }
  };

  const handleChange = (field: keyof LoginCredentials) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials({ ...credentials, [field]: e.target.value });
  };

  const [loading] = useAppStore((state) => state.loading);
  const [error] = useAppStore((state) => state.error);

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Paper sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Login
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
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
        </Paper>
      </Box>
    </Container>
  );
}
