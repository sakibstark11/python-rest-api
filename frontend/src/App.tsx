import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AppProvider } from './context/AppContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

function App() {
    return (
        <AppProvider>
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
        </AppProvider>
    );
}

export default App;
