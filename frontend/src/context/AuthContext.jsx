import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [backendReady, setBackendReady] = useState(true);   // optimistic: assume ready
    const [checkingBackend, setCheckingBackend] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('gymUser');
        const storedToken = localStorage.getItem('gymToken');
        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedToken) setToken(storedToken);

        // Quick, non-blocking health check — don't gate the UI on it
        const startupCheck = async () => {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 3000); // 3s max
                const res = await fetch('/api/health', { signal: controller.signal });
                clearTimeout(timeout);
                setBackendReady(res.ok);
            } catch {
                // If backend is unreachable, still allow UI — actual API calls will fail with proper errors
                setBackendReady(true);
            }
        };

        startupCheck();
    }, []);

    const login = (userData, authToken) => {
        setUser(userData);
        localStorage.setItem('gymUser', JSON.stringify(userData));
        if (authToken) {
            setToken(authToken);
            localStorage.setItem('gymToken', authToken);
        }
    };

    const updateUser = async (fields) => {
        // Optimistic local update
        const updated = { ...user, ...fields };
        setUser(updated);
        localStorage.setItem('gymUser', JSON.stringify(updated));

        // Persist to backend if we have a token
        const tok = token || localStorage.getItem('gymToken');
        if (tok) {
            try {
                const res = await fetch('/api/users/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${tok}`,
                    },
                    body: JSON.stringify(fields),
                });
                if (res.ok) {
                    const serverUser = await res.json();
                    const merged = { ...updated, ...serverUser };
                    setUser(merged);
                    localStorage.setItem('gymUser', JSON.stringify(merged));
                }
            } catch (err) {
                console.warn('Profile sync to backend failed (offline?):', err);
            }
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('gymUser');
        localStorage.removeItem('gymToken');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, backendReady, checkingBackend }}>
            {children}
        </AuthContext.Provider>
    );
};
