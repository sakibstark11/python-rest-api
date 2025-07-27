import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { theme } from './theme';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { HomePage } from './pages/HomePage';
import { CreateEventPage } from './pages/CreateEventPage';
import { EventResponsePage } from './pages/EventResponsePage';
import { useStore } from './hooks/useStore';
import { AuthService } from './services/auth';
import { useEffect } from 'react';

function App() {
  const [state, actions] = useStore();

  useEffect(() => {
    // Check if user is already authenticated on app start
    const checkInitialAuth = async () => {
      if (AuthService.isAuthenticated() && !state.user) {
        try {
          const user = await AuthService.getCurrentUser();
          actions.setUser(user);
        } catch {
          AuthService.logout();
        }
      }
    };

    checkInitialAuth();
  }, [actions, state.user]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Router>
          <Layout>
            <Routes>
              {/* Public routes */}
              <Route 
                path="/login" 
                element={
                  state.user ? <Navigate to="/" replace /> : <LoginPage />
                } 
              />
              <Route 
                path="/signup" 
                element={
                  state.user ? <Navigate to="/" replace /> : <SignupPage />
                } 
              />
              
              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/create"
                element={
                  <ProtectedRoute>
                    <CreateEventPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:eventId/respond"
                element={
                  <ProtectedRoute>
                    <EventResponsePage />
                  </ProtectedRoute>
                }
              />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App