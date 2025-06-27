// File: frontend/src/api/characterApi.js
// Complete character API with authentication

import authClient from './authApi';

export const characterApi = {
    // Create a new character
    createCharacter: async (characterData) => {
        const response = await authClient.post('/character', characterData);
        return response.data;
    },

    // Get all characters for the authenticated user
    getUserCharacters: async () => {
        const response = await authClient.get('/character/user/characters');
        return response.data;
    },

    // Get a specific character
    getCharacter: async (characterId) => {
        const response = await authClient.get(`/character/${characterId}`);
        return response.data;
    },

    // Update character (mainly for image)
    updateCharacter: async (characterId, updates) => {
        const response = await authClient.put(`/character/${characterId}`, updates);
        return response.data;
    },

    // Update character image specifically
    updateCharacterImage: async (characterId, imageData) => {
        const response = await authClient.put(`/character/${characterId}`, {
            image_data: imageData
        });
        return response.data;
    },

    // Delete a character
    deleteCharacter: async (characterId) => {
        const response = await authClient.delete(`/character/${characterId}`);
        return response.data;
    },

    // Update character habit score (if this endpoint exists)
    updateCharacterHabitScore: async (characterId, attribute, points) => {
        const response = await authClient.put(`/character/${characterId}/habit`, {
            attribute,
            habit_points: points
        });
        return response.data;
    }
};

// Legacy function exports for backward compatibility
export const loadCharacters = async () => {
    const response = await characterApi.getUserCharacters();
    return response.data; // Return just the data array for compatibility
};

export const loadCharacter = async (characterId) => {
    const response = await characterApi.getCharacter(characterId);
    return response.data;
};

export const createCharacter = async (characterData) => {
    return await characterApi.createCharacter(characterData);
};

export const updateCharacterImage = async (characterId, imageData) => {
    return await characterApi.updateCharacterImage(characterId, imageData);
};

export const deleteCharacter = async (characterId) => {
    return await characterApi.deleteCharacter(characterId);
};
