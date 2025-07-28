import React, { useEffect } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AppProvider, useAppStore } from './context/AppContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import { AuthService } from './services/auth';

function AppContent() {
    const [, setAppState] = useAppStore((state) => state);

    useEffect(() => {
        const initializeAuth = async () => {
            setAppState({ loading: true });
            
            try {
                const authData = await AuthService.initializeAuth();
                if (authData) {
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
            }
        };

        initializeAuth();
    }, [setAppState]);

    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <HomePage />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </Layout>
        </Router>
    );
}

function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}

export default App;
