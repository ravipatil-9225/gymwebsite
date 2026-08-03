import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

/**
 * PublicRoute – wraps pages that should ONLY be accessible when
 * the visitor is NOT logged in (Login, Register, Forgot-Password, etc.).
 *
 * If the user is already authenticated (regular user or admin),
 * they are redirected away from the auth pages.
 */
const PublicRoute = ({ children }) => {
    const { user, adminUser } = useContext(AuthContext);

    if (adminUser) {
        return <Navigate to="/admin" replace />;
    }

    if (user) {
        return <Navigate to="/home" replace />;
    }

    return children;
};

export default PublicRoute;
