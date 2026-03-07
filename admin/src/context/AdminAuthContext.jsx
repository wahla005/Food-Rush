import React, { createContext, useContext, useState } from 'react';

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
    const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken') || null);

    const adminLogin = (token) => {
        setAdminToken(token);
        localStorage.setItem('adminToken', token);
    };

    const adminLogout = () => {
        setAdminToken(null);
        localStorage.removeItem('adminToken');
    };

    return (
        <AdminAuthContext.Provider value={{ adminToken, adminLogin, adminLogout }}>
            {children}
        </AdminAuthContext.Provider>
    );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
