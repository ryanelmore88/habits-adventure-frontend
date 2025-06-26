// File: frontend/src/contexts/AuthContext.jsx
// Authentication context for managing user state

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is logged in on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (token) {
                const userData = await authApi.getCurrentUser();
                setUser(userData);
            }
        } catch (err) {
            console.error('Auth check failed:', err);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setError(null);
            const response = await authApi.login(email, password);

            // Store tokens
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);

            // Get user data
            const userData = await authApi.getCurrentUser();
            setUser(userData);

            return { success: true };
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Login failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const register = async (email, password, confirmPassword) => {
        try {
            setError(null);
            const response = await authApi.register(email, password, confirmPassword);

            // Store tokens
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);

            // Get user data
            const userData = await authApi.getCurrentUser();
            setUser(userData);

            return { success: true };
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Registration failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            // Clear local data
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setUser(null);
        }
    };

    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        checkAuth,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};