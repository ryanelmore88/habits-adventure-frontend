// File: src/api/habitApi.js
// Fixed to use consistent API endpoints and proper authentication

import authClient from './authApi';
import { getLocalTodayDate, isValidDate } from '../utils/dateUtils.js';

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

    // Get all habits for a character - FIXED TO USE CORRECT ENDPOINT
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

// FIXED: Fetch all habits for a character using correct endpoint
export const fetchHabitsForDate = async (characterId, date = null) => {
    // Input validation
    if (!characterId || !characterId.trim()) {
        throw new Error('Character ID is required');
    }

    // Use today's date if none provided
    const targetDate = date || getLocalTodayDate();
    validateDate(targetDate);

    try {
        // FIXED: Use the same endpoint as other habit functions
        const response = await habitApi.getHabits(characterId.trim());

        // Handle both array responses and { data: array } responses
        const habits = response.data || response;

        if (!Array.isArray(habits)) {
            return [];
        }

        // TODO: Filter by date when backend supports it
        // For now, return all habits - you might want to add date filtering logic here
        return habits;

    } catch (error) {
        if (error.response?.status === 404) {
            return []; // No habits found is not an error
        }
        console.error('API call failed for fetchHabitsForDate:', error);
        throw error;
    }
};

// Handle API errors consistently
const handleApiError = (error, operation) => {
    console.error(`${operation} failed:`, error);

    if (error.response) {
        // Server responded with error status
        const message = error.response.data?.detail || error.response.data?.message || 'Unknown error';
        throw new Error(`${operation} failed: ${message}`);
    } else if (error.request) {
        // Request made but no response received
        throw new Error(`${operation} failed: No response from server`);
    } else {
        // Something else happened
        throw new Error(`${operation} failed: ${error.message}`);
    }
};
