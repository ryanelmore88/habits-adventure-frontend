// src/api/habitApi.js
import API_CONFIG from '../config/api.js';

const { baseURL, debugMode, timeout } = API_CONFIG;

// Helper function for handling API errors
const handleApiError = (error, operation) => {
    if (debugMode) {
        console.error(`${operation} failed:`, error);
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - please check your connection');
    }

    if (error.status === 404) {
        throw new Error('Habit not found');
    }

    if (error.status === 400) {
        throw new Error(error.message || 'Invalid request data');
    }

    if (error.status >= 500) {
        throw new Error('Server error - please try again later');
    }

    throw new Error(error.message || 'An unexpected error occurred');
};

// Generic API call helper with timeout and error handling
const apiCall = async (url, options = {}) => {
    const fullUrl = `${baseURL}${url}`;

    if (debugMode) {
        console.log(`API Call: ${options.method || 'GET'} ${fullUrl}`);
        if (options.body) {
            console.log('Request body:', options.body);
        }
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(fullUrl, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            signal: controller.signal,
            ...options
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.message || `HTTP ${response.status}`);
            error.status = response.status;
            throw error;
        }

        const data = await response.json();

        if (debugMode) {
            console.log(`API Response for ${fullUrl}:`, data);
        }

        return data;

    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error('Request timeout - please try again');
        }

        throw error;
    }
};

// Validate attribute names
const validateAttribute = (attribute) => {
    const validAttributes = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    if (!attribute || !validAttributes.includes(attribute.toLowerCase())) {
        throw new Error(`Attribute must be one of: ${validAttributes.join(', ')}`);
    }
    return attribute.toLowerCase();
};

// Validate date format (YYYY-MM-DD)
const validateDate = (dateString) => {
    if (!dateString) return null;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
        throw new Error('Date must be in YYYY-MM-DD format');
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        throw new Error('Invalid date provided');
    }

    return dateString;
};

// Create a new habit
export const createHabit = async (habitData) => {
    // Input validation
    if (!habitData || typeof habitData !== 'object') {
        throw new Error('Habit data is required');
    }

    const { character_id, habit_name, attribute, description = '' } = habitData;

    if (!character_id || !character_id.trim()) {
        throw new Error('Character ID is required');
    }

    if (!habit_name || !habit_name.trim()) {
        throw new Error('Habit name is required');
    }

    const validatedAttribute = validateAttribute(attribute);

    try {
        const response = await apiCall('/api/habit', {
            method: 'POST',
            body: JSON.stringify({
                character_id: character_id.trim(),
                habit_name: habit_name.trim(),
                attribute: validatedAttribute,
                description: description.trim()
            })
        });

        if (!response.data) {
            throw new Error('Invalid response format from server');
        }

        return response.data;

    } catch (error) {
        handleApiError(error, 'Create habit');
    }
};

// Fetch habits for a specific attribute
export const fetchHabitsForAttribute = async (characterId, attribute) => {
    // Input validation
    if (!characterId || !characterId.trim()) {
        throw new Error('Character ID is required');
    }

    const validatedAttribute = validateAttribute(attribute);

    try {
        const response = await apiCall(`/api/habit?character_id=${encodeURIComponent(characterId.trim())}&attribute=${encodeURIComponent(validatedAttribute)}`);

        // Handle both array responses and { data: array } responses
        const habits = response.data || response;

        if (!Array.isArray(habits)) {
            return [];
        }

        return habits;

    } catch (error) {
        if (error.status === 404) {
            return []; // No habits found is not an error
        }
        handleApiError(error, 'Fetch habits for attribute');
    }
};

// Delete a habit
export const deleteHabit = async (habitId) => {
    // Input validation
    if (!habitId || !habitId.trim()) {
        throw new Error('Habit ID is required');
    }

    try {
        const response = await apiCall(`/api/habit/${habitId.trim()}`, {
            method: 'DELETE'
        });

        return response;

    } catch (error) {
        handleApiError(error, 'Delete habit');
    }
};

// Fetch habit completions for a specific habit
export const fetchHabitCompletions = async (habitId) => {
    // Input validation
    if (!habitId || !habitId.trim()) {
        throw new Error('Habit ID is required');
    }

    try {
        const response = await apiCall(`/api/habit/${habitId.trim()}/completions`);

        // Handle both array responses and { data: array } responses
        const completions = response.data || response;

        if (!Array.isArray(completions)) {
            return [];
        }

        return completions;

    } catch (error) {
        if (error.status === 404) {
            return []; // No completions found is not an error
        }
        handleApiError(error, 'Fetch habit completions');
    }
};

// Get a specific habit by ID
export const fetchHabit = async (habitId) => {
    // Input validation
    if (!habitId || !habitId.trim()) {
        throw new Error('Habit ID is required');
    }

    try {
        const response = await apiCall(`/api/habit/${habitId.trim()}`);

        if (!response.data) {
            throw new Error('Invalid response format from server');
        }

        return response.data;

    } catch (error) {
        handleApiError(error, 'Fetch habit');
    }
};

// Fetch all habits for a character (daily view)
export const fetchHabitsForDate = async (characterId, date = null) => {
    // Input validation
    if (!characterId || !characterId.trim()) {
        throw new Error('Character ID is required');
    }

    // Use today's date if none provided
    const targetDate = date || new Date().toISOString().split('T')[0];
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

// Fetch habits for weekly view
export const fetchHabitsForWeek = async (characterId, weekDates = null) => {
    // Input validation
    if (!characterId || !characterId.trim()) {
        throw new Error('Character ID is required');
    }

    // Validate week dates if provided
    if (weekDates) {
        if (!Array.isArray(weekDates) || weekDates.length !== 7) {
            throw new Error('Week dates must be an array of 7 dates');
        }

        weekDates.forEach(date => validateDate(date));
    }

    try {
        // For now, use the same endpoint as daily - you might want to create a specific weekly endpoint
        const response = await apiCall(`/api/character/${characterId.trim()}/habits`);

        // Handle both array responses and { data: array } responses
        const habits = response.data || response;

        if (!Array.isArray(habits)) {
            return [];
        }

        // TODO: Add completion status for each day of the week when backend supports it
        return habits;

    } catch (error) {
        if (error.status === 404) {
            return []; // No habits found is not an error
        }
        handleApiError(error, 'Fetch habits for week');
    }
};

// Mark habit as completed for a specific date
export const markHabitComplete = async (habitId, completionDate = null, completed = true) => {
    // Input validation
    if (!habitId || !habitId.trim()) {
        throw new Error('Habit ID is required');
    }

    // Use today's date if none provided
    const targetDate = completionDate || new Date().toISOString().split('T')[0];
    validateDate(targetDate);

    if (typeof completed !== 'boolean') {
        throw new Error('Completed status must be a boolean');
    }

    try {
        const response = await apiCall('/api/habit/completion', {
            method: 'POST',
            body: JSON.stringify({
                habit_id: habitId.trim(),
                completion_date: targetDate,
                completed: completed
            })
        });

        if (!response.data) {
            throw new Error('Invalid response format from server');
        }

        return response.data;

    } catch (error) {
        handleApiError(error, 'Mark habit completion');
    }
};

// Get completions for current week
export const fetchWeekCompletions = async (characterId) => {
    // Input validation
    if (!characterId || !characterId.trim()) {
        throw new Error('Character ID is required');
    }

    try {
        const response = await apiCall(`/api/habit/completions/week?character_id=${encodeURIComponent(characterId.trim())}`);

        // Handle both array responses and { data: array } responses
        const completions = response.data || response;

        if (!Array.isArray(completions)) {
            return [];
        }

        return completions;

    } catch (error) {
        if (error.status === 404) {
            return []; // No completions found is not an error
        }
        handleApiError(error, 'Fetch week completions');
    }
};

// Get completions for current day
export const fetchDayCompletions = async (characterId) => {
    // Input validation
    if (!characterId || !characterId.trim()) {
        throw new Error('Character ID is required');
    }

    try {
        const response = await apiCall(`/api/habit/completions/day?character_id=${encodeURIComponent(characterId.trim())}`);

        // Handle both array responses and { data: array } responses
        const completions = response.data || response;

        if (!Array.isArray(completions)) {
            return [];
        }

        return completions;

    } catch (error) {
        if (error.status === 404) {
            return []; // No completions found is not an error
        }
        handleApiError(error, 'Fetch day completions');
    }
};

// Update habit details
export const updateHabit = async (habitId, updates) => {
    // Input validation
    if (!habitId || !habitId.trim()) {
        throw new Error('Habit ID is required');
    }

    if (!updates || typeof updates !== 'object') {
        throw new Error('Update data is required');
    }

    // Validate specific fields if they're being updated
    const validatedUpdates = { ...updates };

    if (updates.habit_name !== undefined) {
        if (!updates.habit_name || !updates.habit_name.trim()) {
            throw new Error('Habit name cannot be empty');
        }
        validatedUpdates.habit_name = updates.habit_name.trim();
    }

    if (updates.attribute !== undefined) {
        validatedUpdates.attribute = validateAttribute(updates.attribute);
    }

    if (updates.description !== undefined) {
        validatedUpdates.description = updates.description ? updates.description.trim() : '';
    }

    try {
        const response = await apiCall(`/api/habit/${habitId.trim()}`, {
            method: 'PUT',
            body: JSON.stringify(validatedUpdates)
        });

        if (!response.data) {
            throw new Error('Invalid response format from server');
        }

        return response.data;

    } catch (error) {
        handleApiError(error, 'Update habit');
    }
};

// Utility function to get today's date in YYYY-MM-DD format
export const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
};

// Utility function to get current week dates
export const getCurrentWeekDates = () => {
    const today = new Date();
    const day = today.getDay(); // 0 (Sun) to 6 (Sat)
    const start = new Date(today);
    start.setDate(today.getDate() - day); // Go to previous Sunday

    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        return date.toISOString().split('T')[0];
    });
};

// Export API_CONFIG for other modules that might need it
export { API_CONFIG };