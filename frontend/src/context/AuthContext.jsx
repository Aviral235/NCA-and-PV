import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchCurrentUser = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const res = await api.get('/api/auth/me');
            setUser(res.data);
        } catch (err) {
            console.error('Failed to fetch profile', err.message);
            // If token is invalid or expired, clear it
            if (err.response && err.response.status === 401) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/login', { email, password });
        if (res.data && res.data.token) {
            localStorage.setItem('authToken', res.data.token);
            localStorage.setItem('userName', res.data.fullName || '');
            setUser(res.data);
            return res.data;
        }
        throw new Error('Login failed: no token returned');
    };

    const signup = async (fullName, email, password) => {
        const res = await api.post('/signup', { fullName, email, password });
        if (res.data && res.data.token) {
            localStorage.setItem('authToken', res.data.token);
            localStorage.setItem('userName', res.data.fullName || '');
            setUser(res.data);
            return res.data;
        }
        throw new Error('Signup failed: no token returned');
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userName');
        setUser(null);
    };

    const updateUserState = (updatedUser) => {
        setUser(updatedUser);
        if (updatedUser.fullName) {
            localStorage.setItem('userName', updatedUser.fullName);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUserState, fetchCurrentUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
