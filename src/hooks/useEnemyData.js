// File: frontend/src/hooks/useEnemyData.js
// Custom hook for managing enemy data and backend integration

import { useState, useEffect, useCallback } from 'react';
import {
    getAvailableEnemies,
    getEnemiesByDifficulty,
    getEnemiesByEnvironment,
    getAllEnemyTemplates
} from '../api/enemyApi';

/**
 * Custom hook for managing enemy data from backend
 * @returns {Object} Enemy data state and management functions
 */
export const useEnemyData = () => {
    // State for available enemies
    const [availableEnemies, setAvailableEnemies] = useState([]);
    const [enemyTemplates, setEnemyTemplates] = useState({});

    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Cache to avoid repeated API calls
    const [lastFetch, setLastFetch] = useState(null);
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    /**
     * Load available enemies from backend with caching
     */
    const loadAvailableEnemies = useCallback(async (forceRefresh = false) => {
        // Check cache validity
        const now = Date.now();
        const isCacheValid = lastFetch && (now - lastFetch) < CACHE_DURATION;

        if (!forceRefresh && isCacheValid && availableEnemies.length > 0) {
            console.log('Using cached enemy data');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            console.log('Fetching enemies from backend...');
            const {
                availableEnemies: enemies,
                enemyTemplates: templates
            } = await getAvailableEnemies();

            console.log('Successfully loaded enemies:', enemies);
            console.log('Enemy templates:', Object.keys(templates));

            setAvailableEnemies(enemies);
            setEnemyTemplates(templates);
            setLastFetch(now);

        } catch (err) {
            console.error('Failed to load enemies:', err);
            setError(err.message);

            // Set fallback data to keep the app functional
            const fallbackEnemies = ['goblin', 'orc', 'skeleton', 'dire_wolf'];
            const fallbackTemplates = {
                'goblin': {
                    name: 'Goblin',
                    level: 1,
                    maxHp: 8,
                    dicePool: '2d6',
                    xpReward: 25,
                    lootTable: ['copper coins', 'rusty dagger'],
                    description: 'A small, cunning creature with sharp teeth.'
                },
                'orc': {
                    name: 'Orc',
                    level: 2,
                    maxHp: 15,
                    dicePool: '3d6',
                    xpReward: 50,
                    lootTable: ['silver coins', 'orcish axe'],
                    description: 'A brutish warrior with crude weapons.'
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
                    description: 'A massive wolf with glowing eyes.'
                }
            };

            setAvailableEnemies(fallbackEnemies);
            setEnemyTemplates(fallbackTemplates);

        } finally {
            setLoading(false);
        }
    }, [availableEnemies.length, lastFetch]);

    /**
     * Get enemies filtered by difficulty
     */
    const getEnemiesForDifficulty = useCallback(async (difficulty) => {
        try {
            console.log(`Fetching ${difficulty} difficulty enemies...`);
            const enemies = await getEnemiesByDifficulty(difficulty);
            return enemies;
        } catch (err) {
            console.error(`Failed to fetch ${difficulty} enemies:`, err);

            // Return filtered fallback data
            const difficultyMap = {
                'Easy': ['goblin', 'skeleton'],
                'Medium': ['orc'],
                'Hard': ['dire_wolf'],
                'Legendary': []
            };

            const fallbackIds = difficultyMap[difficulty] || [];
            return fallbackIds
                .filter(id => enemyTemplates[id])
                .map(id => ({
                    enemy_id: `template_${id}`,
                    ...enemyTemplates[id]
                }));
        }
    }, [enemyTemplates]);

    /**
     * Get enemies filtered by environment
     */
    const getEnemiesForEnvironment = useCallback(async (environment) => {
        try {
            console.log(`Fetching enemies for ${environment} environment...`);
            const enemies = await getEnemiesByEnvironment(environment);
            return enemies;
        } catch (err) {
            console.error(`Failed to fetch ${environment} enemies:`, err);

            // Return filtered fallback data based on environment
            const environmentMap = {
                'forest': ['goblin', 'dire_wolf'],
                'caves': ['skeleton', 'orc'],
                'ruins': ['skeleton', 'orc'],
                'mountains': ['dire_wolf', 'orc'],
                'swamps': ['goblin'],
                'crypts': ['skeleton']
            };

            const fallbackIds = environmentMap[environment] || availableEnemies;
            return fallbackIds
                .filter(id => enemyTemplates[id])
                .map(id => ({
                    enemy_id: `template_${id}`,
                    ...enemyTemplates[id]
                }));
        }
    }, [availableEnemies, enemyTemplates]);

    /**
     * Get all detailed enemy templates
     */
    const getAllTemplates = useCallback(async () => {
        try {
            console.log('Fetching all enemy templates...');
            const templates = await getAllEnemyTemplates();
            return templates;
        } catch (err) {
            console.error('Failed to fetch all templates:', err);

            // Return current templates as fallback
            return Object.entries(enemyTemplates).map(([id, template]) => ({
                enemy_id: `template_${id}`,
                ...template
            }));
        }
    }, [enemyTemplates]);

    /**
     * Get enemy template by ID
     */
    const getEnemyTemplate = useCallback((enemyId) => {
        const template = enemyTemplates[enemyId];
        if (!template) {
            console.warn(`Enemy template not found: ${enemyId}`);
            return null;
        }
        return template;
    }, [enemyTemplates]);

    /**
     * Refresh enemy data from backend
     */
    const refreshEnemyData = useCallback(() => {
        return loadAvailableEnemies(true);
    }, [loadAvailableEnemies]);

    /**
     * Check if enemy data is stale and needs refresh
     */
    const isDataStale = useCallback(() => {
        if (!lastFetch) return true;
        const now = Date.now();
        return (now - lastFetch) > CACHE_DURATION;
    }, [lastFetch]);

    // Load enemies on mount
    useEffect(() => {
        loadAvailableEnemies();
    }, [loadAvailableEnemies]);

    // Auto-refresh stale data when component becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && isDataStale()) {
                console.log('Refreshing stale enemy data...');
                loadAvailableEnemies(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [loadAvailableEnemies, isDataStale]);

    return {
        // Data state
        availableEnemies,
        enemyTemplates,
        loading,
        error,

        // Data management functions
        loadAvailableEnemies,
        refreshEnemyData,
        getEnemyTemplate,

        // Filtered data functions
        getEnemiesForDifficulty,
        getEnemiesForEnvironment,
        getAllTemplates,

        // Utility functions
        isDataStale,
        hasData: availableEnemies.length > 0,
        cacheAge: lastFetch ? Date.now() - lastFetch : null
    };
};