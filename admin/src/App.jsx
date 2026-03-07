import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';

import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';

// ── Guard ──────────────────────────────────
const AdminRoute = ({ children }) => {
    const { adminToken } = useAdminAuth();
    return adminToken ? children : <Navigate to="/login" replace />;
};

// ── Routes ──────────────────────────────────
const AppRoutes = () => (
    <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
);

const App = () => (
    <AdminAuthProvider>
        <BrowserRouter>
            <Toaster position="top-right" toastOptions={{ style: { fontFamily: "'Inter', sans-serif", fontSize: '14px' } }} />
            <AppRoutes />
        </BrowserRouter>
    </AdminAuthProvider>
);

export default App;
