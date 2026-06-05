import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    const location = useLocation();

    // Not logged in as a regular user → go to login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If an admin somehow lands on a user-only route, redirect them to admin dashboard
    if (user.role === 'admin') {
        return <Navigate to="/admin" replace />;
    }

    return children;
};

export default PrivateRoute;
