// File: frontend/src/api/enemyApi.js
// Complete enemy API with authentication

import authClient from './authApi';

export const enemyApi = {
    // Get all enemy templates
    getEnemyTemplates: async () => {
        const response = await authClient.get('/enemy/templates');
        return response.data;
    },

    // Get a specific enemy template
    getEnemyTemplate: async (enemyId) => {
        const response = await authClient.get(`/enemy/template/${enemyId}`);
        return response.data;
    },

    // Get enemies by difficulty
    getEnemiesByDifficulty: async (difficulty) => {
        const response = await authClient.get(`/enemy/templates/difficulty/${difficulty}`);
        return response.data;
    },

    // Create a new enemy template (admin only)
    createEnemyTemplate: async (enemyData) => {
        const response = await authClient.post('/enemy/template', enemyData);
        return response.data;
    },

    // Update enemy template (admin only)
    updateEnemyTemplate: async (enemyId, updates) => {
        const response = await authClient.put(`/enemy/template/${enemyId}`, updates);
        return response.data;
    },

    // Delete enemy template (admin only)
    deleteEnemyTemplate: async (enemyId) => {
        const response = await authClient.delete(`/enemy/template/${enemyId}`);
        return response.data;
    }
};

// Legacy exports if needed
export const getEnemyTemplates = async () => {
    const response = await enemyApi.getEnemyTemplates();
    return response.data;
};

export const getEnemyByType = async (enemyType) => {
    // If your backend uses enemy types as IDs
    const response = await enemyApi.getEnemyTemplate(enemyType);
    return response.data;
};