import {
  Alert,
  Box,
  Button,
  Container,
  Link,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { AuthService } from '../services/auth';
import type { LoginCredentials } from '../types';

export const LoginPage = () => {
  const [state, actions] = useStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginCredentials>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof LoginCredentials]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginCredentials> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    actions.setLoading(true);
    actions.clearError();

    try {
      const authResponse = await AuthService.login(formData);
      actions.setUser(authResponse.user);
      navigate('/');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      const errorMessage = err.response?.data?.error?.message || 'Login failed';
      actions.setError(errorMessage);
    } finally {
      actions.setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
          <Typography component="h1" variant="h4" gutterBottom>
            Sign In
          </Typography>

          {state.error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {state.error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={state.loading}
            >
              {state.loading ? 'Signing In...' : 'Sign In'}
            </Button>
            <Box textAlign="center">
              <Link
                component="button"
                variant="body2"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/signup');
                }}
              >
                Don't have an account? Sign Up
              </Link>
            </Box>
          </Box>
        </Paper>
    </Container>
  );
};
