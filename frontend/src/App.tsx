import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AppProvider } from './context/AppContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});


function App() {
    return (
        <AppProvider>
            <Router>
                <ThemeProvider theme={darkTheme}>
                    <CssBaseline />
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
                </ThemeProvider>
            </Router>
        </AppProvider>
    );
}

export default App;
