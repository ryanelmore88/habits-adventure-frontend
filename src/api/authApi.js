// File: frontend/src/api/authApi.js
// Updated API client for authentication endpoints

import axios from 'axios';
import { BACKEND_URL } from '../config';

const authClient = axios.create({
    baseURL: BACKEND_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
authClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle token refresh
authClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axios.post(`${BACKEND_URL}/auth/refresh`, {
                    refresh_token: refreshToken
                });

                localStorage.setItem('access_token', response.data.access_token);
                if (response.data.refresh_token) {
                    localStorage.setItem('refresh_token', response.data.refresh_token);
                }

                originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
                return authClient(originalRequest);
            } catch (refreshError) {
                // Refresh failed, redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export const authApi = {
    register: async (email, password, confirmPassword) => {
        const response = await authClient.post('/auth/register', {
            email,
            password,
            confirm_password: confirmPassword
        });
        return response.data;
    },

    login: async (email, password) => {
        const formData = new FormData();
        formData.append('username', email); // OAuth2 expects 'username'
        formData.append('password', password);

        const response = await authClient.post('/auth/login', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        // Note: Backend currently doesn't provide refresh_token
        // You may want to add refresh token support later
        return {
            ...response.data,
            refresh_token: null // Placeholder for future refresh token implementation
        };
    },

    logout: async () => {
        const response = await authClient.post('/auth/logout');
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await authClient.get('/auth/me');
        return response.data;
    },

    refreshToken: async (refreshToken) => {
        const response = await authClient.post('/auth/refresh', {
            refresh_token: refreshToken
        });
        return response.data;
    }
};

// Export the authenticated client for other API calls
export default authClient;