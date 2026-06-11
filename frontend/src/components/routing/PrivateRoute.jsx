import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { user, adminUser } = useContext(AuthContext);
    const location = useLocation();

    // Allow access if logged in as either a regular user or an admin
    if (!user && !adminUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default PrivateRoute;
