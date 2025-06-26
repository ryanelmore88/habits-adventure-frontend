// File: frontend/src/api/apiClient.js
// Update the main API client to use authenticated requests

import authClient from './authApi';

// Use the authenticated client for all API calls
export const apiClient = authClient;

// Character API calls
export const characterApi = {
    createCharacter: async (characterData) => {
        const response = await apiClient.post('/character', characterData);
        return response.data;
    },

    getCharacter: async (characterId) => {
        const response = await apiClient.get(`/character/${characterId}`);
        return response.data;
    },

    getUserCharacters: async () => {
        const response = await apiClient.get('/character/user/characters');
        return response.data;
    },

    updateCharacter: async (characterId, updates) => {
        const response = await apiClient.put(`/character/${characterId}`, updates);
        return response.data;
    },

    deleteCharacter: async (characterId) => {
        const response = await apiClient.delete(`/character/${characterId}`);
        return response.data;
    }
};

// Habit API calls
export const habitApi = {
    createHabit: async (habitData) => {
        const response = await apiClient.post('/habit', habitData);
        return response.data;
    },

    getHabits: async (characterId) => {
        const response = await apiClient.get(`/habit/character/${characterId}`);
        return response.data;
    },

    markCompletion: async (completionData) => {
        const response = await apiClient.post('/habit/completion', completionData);
        return response.data;
    }
};