// File: frontend/src/api/enemyApi.js
// API client for enemy-related operations

import API_CONFIG from '../config/api.js';
const { baseURL, debugMode, timeout } = API_CONFIG;

/**
 * Get all available enemies from the backend
 * @returns {Promise<{availableEnemies: string[], enemyTemplates: Object}>}
 */
export const getAvailableEnemies = async () => {
    try {
        const response = await fetch(`${baseURL}/api/enemy/available`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP ${response.status}: Failed to fetch available enemies`);
        }

        const data = await response.json();

        if (data.status !== 'success') {
            throw new Error(data.message || 'Failed to fetch available enemies');
        }

        return {
            availableEnemies: data.available_enemies || [],
            enemyTemplates: data.enemy_templates || {}
        };

    } catch (error) {
        console.error('Error fetching available enemies:', error);

        // Return fallback data to maintain functionality during development
        return {
            availableEnemies: ['goblin', 'orc', 'skeleton', 'dire_wolf'],
            enemyTemplates: {
                'goblin': {
                    name: 'Goblin',
                    level: 1,
                    maxHp: 8,
                    dicePool: '2d6',
                    xpReward: 25,
                    lootTable: ['copper coins', 'rusty dagger'],
                    description: 'A small, cunning creature with sharp teeth and beady eyes.'
                },
                'orc': {
                    name: 'Orc',
                    level: 2,
                    maxHp: 15,
                    dicePool: '3d6',
                    xpReward: 50,
                    lootTable: ['silver coins', 'orcish axe'],
                    description: 'A brutish warrior with crude weapons and armor.'
                },
                'skeleton': {
                    name: 'Skeleton',
                    level: 1,
                    maxHp: 6,
                    dicePool: '2d6',
                    xpReward: 30,
                    lootTable: ['bone fragments', 'tattered cloak'],
                    description: 'An animated skeleton wielding ancient weapons.'
                },
                'dire_wolf': {
                    name: 'Dire Wolf',
                    level: 3,
                    maxHp: 20,
                    dicePool: '4d6',
                    xpReward: 75,
                    lootTable: ['wolf pelt', 'sharp fang'],
                    description: 'A massive wolf with glowing eyes and powerful jaws.'
                }
            }
        };
    }
};

/**
 * Get enemies filtered by difficulty level
 * @param {string} difficulty - The difficulty level (Easy, Medium, Hard, Legendary)
 * @returns {Promise<Object[]>}
 */
export const getEnemiesByDifficulty = async (difficulty) => {
    try {
        const response = await fetch(`${baseURL}/api/enemy/difficulty/${difficulty}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP ${response.status}: Failed to fetch enemies by difficulty`);
        }

        const data = await response.json();

        if (data.status !== 'success') {
            throw new Error(data.message || 'Failed to fetch enemies by difficulty');
        }

        return data.data || [];

    } catch (error) {
        console.error(`Error fetching enemies by difficulty ${difficulty}:`, error);
        throw error;
    }
};

/**
 * Get enemies filtered by environment
 * @param {string} environment - The environment type (forest, caves, ruins, etc.)
 * @returns {Promise<Object[]>}
 */
export const getEnemiesByEnvironment = async (environment) => {
    try {
        const response = await fetch(`${baseURL}/api/enemy/environment/${environment}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP ${response.status}: Failed to fetch enemies by environment`);
        }

        const data = await response.json();

        if (data.status !== 'success') {
            throw new Error(data.message || 'Failed to fetch enemies by environment');
        }

        return data.data || [];

    } catch (error) {
        console.error(`Error fetching enemies by environment ${environment}:`, error);
        throw error;
    }
};

/**
 * Get all enemy templates from the backend
 * @returns {Promise<Object[]>}
 */
export const getAllEnemyTemplates = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/enemy/templates`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP ${response.status}: Failed to fetch enemy templates`);
        }

        const data = await response.json();

        if (data.status !== 'success') {
            throw new Error(data.message || 'Failed to fetch enemy templates');
        }

        return data.data || [];

    } catch (error) {
        console.error('Error fetching enemy templates:', error);
        throw error;
    }
};