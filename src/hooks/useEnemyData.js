// File: frontend/src/hooks/useEnemyData.js
// Updated enemy data hook using authenticated API

import { useState, useEffect } from 'react';
import { enemyApi } from '../api';

const useEnemyData = (enemyType) => {
    const [enemyData, setEnemyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEnemyData = async () => {
            if (!enemyType) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // First try to get the specific enemy template
                const response = await enemyApi.getEnemyTemplate(enemyType);

                if (response.status === 'success' && response.data) {
                    setEnemyData(response.data);
                } else {
                    // If no data from backend, fall back to local defaults
                    setEnemyData(getDefaultEnemyData(enemyType));
                }
            } catch (err) {
                console.error(`Failed to fetch enemy data for ${enemyType}:`, err);

                // If it's a 404, use default data
                if (err.response?.status === 404) {
                    console.log(`Enemy template ${enemyType} not found, using defaults`);
                    setEnemyData(getDefaultEnemyData(enemyType));
                } else if (err.response?.status === 401) {
                    // Authentication error - the interceptor will handle redirect
                    setError('Authentication required');
                } else {
                    // For other errors, still provide default data so the game can continue
                    setError(err.message || 'Failed to load enemy data');
                    setEnemyData(getDefaultEnemyData(enemyType));
                }
            } finally {
                setLoading(false);
            }
        };

        fetchEnemyData();
    }, [enemyType]);

    return { enemyData, loading, error };
};

// Default enemy data for fallback
const getDefaultEnemyData = (enemyType) => {
    const defaultEnemies = {
        goblin: {
            name: "Goblin",
            level: 1,
            maxHp: 7,
            attackBonus: 4,
            damageDice: "1d6+2",
            xpReward: 25,
            description: "A small, green-skinned creature with sharp teeth and a nasty disposition.",
            imageUrl: "/enemies/goblin.png"
        },
        skeleton: {
            name: "Skeleton",
            level: 1,
            maxHp: 8,
            attackBonus: 3,
            damageDice: "1d6+1",
            xpReward: 30,
            description: "An animated skeleton warrior, its bones held together by dark magic.",
            imageUrl: "/enemies/skeleton.png"
        },
        orc: {
            name: "Orc",
            level: 2,
            maxHp: 15,
            attackBonus: 5,
            damageDice: "1d8+3",
            xpReward: 50,
            description: "A brutish humanoid with greenish skin, prominent tusks, and a love for violence.",
            imageUrl: "/enemies/orc.png"
        },
        wolf: {
            name: "Wolf",
            level: 1,
            maxHp: 10,
            attackBonus: 4,
            damageDice: "2d4+2",
            xpReward: 35,
            description: "A fierce predator with sharp fangs and keen senses.",
            imageUrl: "/enemies/wolf.png"
        },
        bandit: {
            name: "Bandit",
            level: 2,
            maxHp: 12,
            attackBonus: 4,
            damageDice: "1d8+2",
            xpReward: 40,
            description: "A lawless rogue who preys on travelers.",
            imageUrl: "/enemies/bandit.png"
        },
        giant_spider: {
            name: "Giant Spider",
            level: 2,
            maxHp: 14,
            attackBonus: 5,
            damageDice: "1d8+3",
            xpReward: 45,
            description: "An enormous arachnid with venomous fangs.",
            imageUrl: "/enemies/giant_spider.png"
        },
        troll: {
            name: "Troll",
            level: 3,
            maxHp: 25,
            attackBonus: 6,
            damageDice: "2d6+4",
            xpReward: 100,
            description: "A massive, regenerating monster with incredible strength.",
            imageUrl: "/enemies/troll.png"
        },
        dark_knight: {
            name: "Dark Knight",
            level: 4,
            maxHp: 30,
            attackBonus: 7,
            damageDice: "2d8+4",
            xpReward: 150,
            description: "A fallen warrior clad in cursed armor.",
            imageUrl: "/enemies/dark_knight.png"
        },
        dragon_wyrmling: {
            name: "Dragon Wyrmling",
            level: 5,
            maxHp: 40,
            attackBonus: 8,
            damageDice: "2d10+5",
            xpReward: 250,
            description: "A young dragon, small but still incredibly dangerous.",
            imageUrl: "/enemies/dragon_wyrmling.png"
        }
    };

    return defaultEnemies[enemyType] || {
        name: "Unknown Enemy",
        level: 1,
        maxHp: 10,
        attackBonus: 3,
        damageDice: "1d6",
        xpReward: 20,
        description: "A mysterious foe.",
        imageUrl: "/enemies/unknown.png"
    };
};

// Export a helper to get all available enemy types
export const getAllEnemyTypes = async () => {
    try {
        const response = await enemyApi.getEnemyTemplates();
        if (response.status === 'success' && response.data) {
            // Map backend enemy data to a simplified format
            return response.data.map(enemy => ({
                type: enemy.enemy_id || enemy.type,
                name: enemy.name,
                level: enemy.level,
                difficulty: enemy.difficulty
            }));
        }
    } catch (err) {
        console.error('Failed to fetch enemy types:', err);
    }

    // Return default enemy types as fallback
    return [
        { type: 'goblin', name: 'Goblin', level: 1, difficulty: 'Easy' },
        { type: 'skeleton', name: 'Skeleton', level: 1, difficulty: 'Easy' },
        { type: 'orc', name: 'Orc', level: 2, difficulty: 'Medium' },
        { type: 'wolf', name: 'Wolf', level: 1, difficulty: 'Easy' },
        { type: 'bandit', name: 'Bandit', level: 2, difficulty: 'Medium' },
        { type: 'giant_spider', name: 'Giant Spider', level: 2, difficulty: 'Medium' },
        { type: 'troll', name: 'Troll', level: 3, difficulty: 'Hard' },
        { type: 'dark_knight', name: 'Dark Knight', level: 4, difficulty: 'Hard' },
        { type: 'dragon_wyrmling', name: 'Dragon Wyrmling', level: 5, difficulty: 'Legendary' }
    ];
};

// Export a helper to get enemies by difficulty
export const getEnemiesByDifficulty = async (difficulty) => {
    try {
        const response = await enemyApi.getEnemiesByDifficulty(difficulty);
        if (response.status === 'success' && response.data) {
            return response.data;
        }
    } catch (err) {
        console.error(`Failed to fetch enemies by difficulty ${difficulty}:`, err);
    }

    // Return filtered default enemies as fallback
    const allEnemies = await getAllEnemyTypes();
    return allEnemies.filter(enemy => enemy.difficulty === difficulty);
};

export default useEnemyData;