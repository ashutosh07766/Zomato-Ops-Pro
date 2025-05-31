import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import ManagerDashboard from './components/ManagerDashboard';
import PartnerDashboard from './components/PartnerDashboard.tsx';

const PrivateRoute: React.FC<{ children: React.ReactNode; allowedRole: string }> = ({ children, allowedRole }) => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" />;
    }
    if (user.role !== allowedRole) {
        return <Navigate to={user.role === 'MANAGER' ? '/manager' : '/partner'} />;
    }
    return <>{children}</>;
};

const AppRoutes: React.FC = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate checking auth state
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (user) {
        return (
            <Routes>
                <Route
                    path="/manager"
                    element={
                        <PrivateRoute allowedRole="MANAGER">
                            <ManagerDashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/partner"
                    element={
                        <PrivateRoute allowedRole="PARTNER">
                            <PartnerDashboard />
                        </PrivateRoute>
                    }
                />
                <Route path="*" element={<Navigate to={user.role === 'MANAGER' ? '/manager' : '/partner'} />} />
            </Routes>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    );
};

const App: React.FC = () => {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
};

export default App; 