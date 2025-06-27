// File: frontend/src/api/adventureApi.js
// Adventure API with authentication

import authClient from './authApi';

export const adventureApi = {
    // Complete an adventure
    completeAdventure: async (characterId, results) => {
        const response = await authClient.post(`/adventure/${characterId}/complete`, results);
        return response.data;
    },

    // Get adventure history (if endpoint exists)
    getAdventureHistory: async (characterId) => {
        const response = await authClient.get(`/adventure/${characterId}/history`);
        return response.data;
    },

    // Get available quests
    getQuests: async () => {
        const response = await authClient.get('/adventure/quests');
        return response.data;
    },

    // Start a quest
    startQuest: async (characterId, questId) => {
        const response = await authClient.post(`/adventure/${characterId}/quest/start`, {
            quest_id: questId
        });
        return response.data;
    },

    // Complete quest checkpoint
    saveQuestProgress: async (characterId, questId, progress) => {
        const response = await authClient.post(`/adventure/${characterId}/quest/progress`, {
            quest_id: questId,
            progress: progress
        });
        return response.data;
    }
};

// Legacy exports
export const completeAdventure = async (characterId, results) => {
    return await adventureApi.completeAdventure(characterId, results);
};