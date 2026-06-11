import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem('gymUser');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch {
            localStorage.removeItem('gymUser');
            return null;
        }
    });
    const [token, setToken] = useState(() => localStorage.getItem('gymToken'));
    
    const [adminUser, setAdminUser] = useState(() => {
        try {
            const storedAdmin = localStorage.getItem('adminUser');
            return storedAdmin ? JSON.parse(storedAdmin) : null;
        } catch {
            localStorage.removeItem('adminUser');
            return null;
        }
    });
    const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken'));

    const [backendReady, setBackendReady] = useState(true);
    const [checkingBackend, setCheckingBackend] = useState(false);

    // ── Cross-Tab Sync ──────────────────────────────────────────────────
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'gymUser') {
                if (!e.newValue) {
                    setUser(null);
                    setToken(null);
                } else {
                    try { setUser(JSON.parse(e.newValue)); } catch { setUser(null); }
                }
            }
            if (e.key === 'gymToken') {
                setToken(e.newValue);
            }
            if (e.key === 'adminUser') {
                if (!e.newValue) {
                    setAdminUser(null);
                    setAdminToken(null);
                } else {
                    try { setAdminUser(JSON.parse(e.newValue)); } catch { setAdminUser(null); }
                }
            }
            if (e.key === 'adminToken') {
                setAdminToken(e.newValue);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // ── Startup health check (non-blocking) ─────────────────────────────
    useEffect(() => {
        const startupCheck = async () => {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 3000);
                const res = await fetch('/api/health', { signal: controller.signal });
                clearTimeout(timeout);
                setBackendReady(res.ok);
            } catch {
                setBackendReady(true);
            }
        };
        startupCheck();
    }, []);

    // ── Login ────────────────────────────────────────────────────────────
    const login = useCallback((userData, authToken) => {
        if (userData.role === 'admin') {
            setAdminUser(userData);
            localStorage.setItem('adminUser', JSON.stringify(userData));
            if (authToken) {
                setAdminToken(authToken);
                localStorage.setItem('adminToken', authToken);
            }

            // STRICT SEPARATION: Clear regular user session
            setUser(null);
            setToken(null);
            localStorage.removeItem('gymUser');
            localStorage.removeItem('gymToken');
        } else {
            setUser(userData);
            localStorage.setItem('gymUser', JSON.stringify(userData));
            if (authToken) {
                setToken(authToken);
                localStorage.setItem('gymToken', authToken);
            }

            // STRICT SEPARATION: Clear admin session
            setAdminUser(null);
            setAdminToken(null);
            localStorage.removeItem('adminUser');
            localStorage.removeItem('adminToken');
        }
    }, []);

    // ── Update user profile ──────────────────────────────────────────────
    const updateUser = useCallback(async (fields) => {
        if (adminUser) {
            const updated = { ...adminUser, ...fields };
            setAdminUser(updated);
            localStorage.setItem('adminUser', JSON.stringify(updated));
            // You can also add API call for admin profile update if needed
            return;
        }

        const updated = { ...user, ...fields };
        setUser(updated);
        localStorage.setItem('gymUser', JSON.stringify(updated));

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
    }, [user, adminUser, token]);

    // ── Upload photo ─────────────────────────────────────────────────────
    const uploadPhoto = useCallback(async (file) => {
        const tok = token || adminToken;
        if (!tok) return;

        const formData = new FormData();
        formData.append('photo', file);

        try {
            const res = await fetch('/api/auth/upload-photo', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${tok}`,
                },
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                if (adminUser) {
                    const updated = { ...adminUser, profileImage: data.profileImage };
                    setAdminUser(updated);
                    localStorage.setItem('adminUser', JSON.stringify(updated));
                } else {
                    const updated = { ...user, profileImage: data.profileImage };
                    setUser(updated);
                    localStorage.setItem('gymUser', JSON.stringify(updated));
                }
                return data.profileImage;
            } else {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Upload failed');
            }
        } catch (err) {
            console.error('Photo upload failed:', err);
            throw err;
        }
    }, [user, adminUser, token, adminToken]);

    // ── Logout ───────────────────────────────────────────────────────────
    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('gymUser');
        localStorage.removeItem('gymToken');
        
        setAdminUser(null);
        setAdminToken(null);
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminToken');
    }, []);

    return (
        <AuthContext.Provider value={{ user, adminUser, token, adminToken, login, logout, updateUser, uploadPhoto, backendReady, checkingBackend }}>
            {children}
        </AuthContext.Provider>
    );
};
