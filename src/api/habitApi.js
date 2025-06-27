// File: frontend/src/api/habitApi.js
// Complete habit API with authentication

import authClient from './authApi';
import { getLocalTodayDate, getCurrentWeekDatesSundayStart, isValidDate } from '../utils/dateUtils.js';

// Validate date format (YYYY-MM-DD)
const validateDate = (dateString) => {
    if (!isValidDate(dateString)) {
        throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }
};

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

// Fetch all habits for a character (daily view)
export const fetchHabitsForDate = async (characterId, date = null) => {
    // Input validation
    if (!characterId || !characterId.trim()) {
        throw new Error('Character ID is required');
    }

    // Use today's date if none provided
    const targetDate = date || getLocalTodayDate();
    validateDate(targetDate);

    try {
        const response = await apiCall(`/api/character/${characterId.trim()}/habits`);

        // Handle both array responses and { data: array } responses
        const habits = response.data || response;

        if (!Array.isArray(habits)) {
            return [];
        }

        // TODO: Filter by date when backend supports it
        // For now, return all habits - you might want to add date filtering logic here
        return habits;

    } catch (error) {
        if (error.status === 404) {
            return []; // No habits found is not an error
        }
        handleApiError(error, 'Fetch habits for date');
    }
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