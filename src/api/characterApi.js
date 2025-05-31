// src/api/characterApi.js
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
        throw new Error('Character not found');
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

// Fetch a character by ID
export const fetchCharacter = async (characterId) => {
    // Input validation
    if (!characterId || !characterId.trim()) {
        throw new Error('Character ID is required');
    }

    try {
        const response = await apiCall(`/api/character/${characterId.trim()}`);

        if (!response.data) {
            throw new Error('Invalid response format from server');
        }

        return response.data;

    } catch (error) {
        handleApiError(error, 'Fetch character');
    }
};

// Create a new character
export const createCharacter = async (payload) => {
    // Input validation
    if (!payload || typeof payload !== 'object') {
        throw new Error('Character data is required');
    }

    const { name, strength, dexterity, constitution, intelligence, wisdom, charisma } = payload;

    // Validate required fields
    if (!name || !name.trim()) {
        throw new Error('Character name is required');
    }

    // Validate attribute scores
    const attributes = { strength, dexterity, constitution, intelligence, wisdom, charisma };
    for (const [attrName, value] of Object.entries(attributes)) {
        if (typeof value !== 'number' || value < 1 || value > 30) {
            throw new Error(`${attrName} must be a number between 1 and 30`);
        }
    }

    try {
        const response = await apiCall('/api/character', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!response.data) {
            throw new Error('Invalid response format from server');
        }

        return response;

    } catch (error) {
        handleApiError(error, 'Create character');
    }
};

// Create a habit (moved from habitApi for consistency, but you might want to keep it separate)
export const createHabit = async (habitData) => {
    // Input validation
    if (!habitData || typeof habitData !== 'object') {
        throw new Error('Habit data is required');
    }

    const { character_id, habit_name, attribute, description } = habitData;

    if (!character_id || !character_id.trim()) {
        throw new Error('Character ID is required');
    }

    if (!habit_name || !habit_name.trim()) {
        throw new Error('Habit name is required');
    }

    if (!attribute || !attribute.trim()) {
        throw new Error('Attribute is required');
    }

    const validAttributes = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    if (!validAttributes.includes(attribute.toLowerCase())) {
        throw new Error(`Attribute must be one of: ${validAttributes.join(', ')}`);
    }

    try {
        const response = await apiCall('/api/habit', {
            method: 'POST',
            body: JSON.stringify({
                character_id: character_id.trim(),
                habit_name: habit_name.trim(),
                attribute: attribute.toLowerCase(),
                description: description ? description.trim() : ''
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

// Update character habit points
export const updateCharacterHabits = async (characterId, attribute, habitPoints) => {
    // Input validation
    if (!characterId || !characterId.trim()) {
        throw new Error('Character ID is required');
    }

    if (!attribute || !attribute.trim()) {
        throw new Error('Attribute is required');
    }

    if (typeof habitPoints !== 'number' || habitPoints < 0) {
        throw new Error('Habit points must be a non-negative number');
    }

    try {
        const response = await apiCall(`/api/character/${characterId.trim()}/habit`, {
            method: 'PUT',
            body: JSON.stringify({
                attribute: attribute.toLowerCase(),
                habit_points: habitPoints
            })
        });

        return response;

    } catch (error) {
        handleApiError(error, 'Update character habits');
    }
};

// Delete a character
export const deleteCharacter = async (characterId) => {
    // Input validation
    if (!characterId || !characterId.trim()) {
        throw new Error('Character ID is required');
    }

    try {
        const response = await apiCall(`/api/character/${characterId.trim()}`, {
            method: 'DELETE'
        });

        return response;

    } catch (error) {
        handleApiError(error, 'Delete character');
    }
};

// Fetch character list/summary
export const fetchCharacterList = async () => {
    try {
        const response = await apiCall('/api/characters');

        if (!Array.isArray(response)) {
            throw new Error('Invalid response format from server');
        }

        return response;

    } catch (error) {
        handleApiError(error, 'Fetch character list');
    }
};

// Get basic character info (using the basic endpoint you have)
export const fetchBasicCharacter = async (characterId) => {
    // Input validation
    if (!characterId || !characterId.trim()) {
        throw new Error('Character ID is required');
    }

    try {
        const response = await apiCall(`/api/character/basic/${characterId.trim()}`);

        if (!response.data) {
            throw new Error('Invalid response format from server');
        }

        return response.data;

    } catch (error) {
        handleApiError(error, 'Fetch basic character');
    }
};

// Export API_CONFIG for other modules that might need it
export { API_CONFIG };