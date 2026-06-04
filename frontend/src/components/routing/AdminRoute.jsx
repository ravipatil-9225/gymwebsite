import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
    const token = localStorage.getItem('adminToken');
    const userStr = localStorage.getItem('adminUser');

    if (!token || !userStr) {
        return <Navigate to="/login" replace />;
    }

    try {
        const user = JSON.parse(userStr);
        if (user.role !== 'admin') {
            return <Navigate to="/" replace />;
        }
    } catch (error) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default AdminRoute;
