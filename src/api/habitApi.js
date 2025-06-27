// File: frontend/src/api/habitApi.js
// Complete habit API with authentication

import authClient from './authApi';

export const habitApi = {
    // Create a new habit
    createHabit: async (habitData) => {
        const response = await authClient.post('/habit', habitData);
        return response.data;
    },

    // Get all habits for a character
    getHabits: async (characterId) => {
        const response = await authClient.get(`/habit/character/${characterId}`);
        return response.data;
    },

    // Get habits for a specific attribute
    getHabitsByAttribute: async (characterId, attribute) => {
        const response = await authClient.get(`/habit?character_id=${characterId}&attribute=${attribute}`);
        return response.data;
    },

    // Mark habit completion
    markCompletion: async (completionData) => {
        const response = await authClient.post('/habit/completion', completionData);
        return response.data;
    },

    // Get week completions
    getWeekCompletions: async (characterId) => {
        const response = await authClient.get(`/habit/completions/week/${characterId}`);
        return response.data;
    },

    // Get today's completions
    getTodayCompletions: async (characterId) => {
        const response = await authClient.get(`/habit/completions/today/${characterId}`);
        return response.data;
    },

    // Delete a habit
    deleteHabit: async (habitId) => {
        const response = await authClient.delete(`/habit/${habitId}`);
        return response.data;
    }
};

// Legacy function exports for backward compatibility
export const loadHabits = async (characterId) => {
    const response = await habitApi.getHabits(characterId);
    return response.data; // Return just the data array
};

export const createHabit = async (characterId, habitName, attribute, description = '') => {
    return await habitApi.createHabit({
        character_id: characterId,
        habit_name: habitName,
        attribute: attribute,
        description: description
    });
};

export const markHabitComplete = async (habitId, date, completed = true) => {
    return await habitApi.markCompletion({
        habit_id: habitId,
        completion_date: date,
        completed: completed
    });
};

export const deleteHabit = async (habitId) => {
    return await habitApi.deleteHabit(habitId);
};

export const getWeeklyCompletions = async (characterId) => {
    const response = await habitApi.getWeekCompletions(characterId);
    return response.data;
};

// Remove or update the old apiCall function
// If you need to keep it for other endpoints, update it to use authClient:
export const apiCall = async (endpoint, method = 'GET', body = null) => {
    try {
        const config = {
            method,
            url: endpoint,
            data: body
        };

        const response = await authClient(config);
        return response.data;
    } catch (error) {
        console.error(`API call failed: ${method} ${endpoint}`, error);
        throw error;
    }
};