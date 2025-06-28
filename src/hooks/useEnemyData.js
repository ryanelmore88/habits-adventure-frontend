// File: frontend/src/hooks/useEnemyData.js
// Updated to provide what CombatArea expects

import { useState, useEffect, useCallback } from 'react';
import { enemyApi } from '../api/enemyApi';

export const useEnemyData = () => {
    const [enemyTemplates, setEnemyTemplates] = useState({});
    const [availableEnemies, setAvailableEnemies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasData, setHasData] = useState(false);

    // Function to get a specific enemy template
    const getEnemyTemplate = useCallback((enemyType) => {
        if (enemyTemplates[enemyType]) {
            return enemyTemplates[enemyType];
        }

        // Return fallback data if not found
        return getDefaultEnemyData(enemyType);
    }, [enemyTemplates]);

    // Function to refresh enemy data
    const refreshEnemyData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await enemyApi.getEnemyTemplates();

            if (response && response.status === 'success' && response.data) {
                // Convert array to object with enemy type as key
                const templates = {};
                const enemyTypes = [];

                response.data.forEach(enemy => {
                    const enemyType = enemy.enemy_id || enemy.type || enemy.name?.toLowerCase();
                    if (enemyType) {
                        templates[enemyType] = {
                            name: enemy.name,
                            level: enemy.level,
                            maxHp: enemy.max_hp || enemy.maxHp,
                            dicePool: enemy.dice_pool || enemy.dicePool,
                            xpReward: enemy.xp_reward || enemy.xpReward,
                            lootTable: enemy.loot_table || enemy.lootTable || [],
                            description: enemy.description,
                            difficulty: enemy.difficulty
                        };
                        enemyTypes.push(enemyType);
                    }
                });

                setEnemyTemplates(templates);
                setAvailableEnemies(enemyTypes);
                setHasData(true);
                console.log('Loaded enemy templates from backend:', templates);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            console.error('Failed to fetch enemy templates:', err);
            setError(err.message);

            // Fall back to default enemies
            const defaultTemplates = getDefaultEnemyTemplates();
            setEnemyTemplates(defaultTemplates);
            setAvailableEnemies(Object.keys(defaultTemplates));
            setHasData(false);
            console.log('Using fallback enemy templates:', defaultTemplates);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load enemy data on mount
    useEffect(() => {
        refreshEnemyData();
    }, [refreshEnemyData]);

    return {
        enemyTemplates,
        availableEnemies,
        loading,
        error,
        hasData,
        getEnemyTemplate,
        refreshEnemyData
    };
};

// Default enemy data for fallback
const getDefaultEnemyData = (enemyType) => {
    const defaultEnemies = getDefaultEnemyTemplates();
    return defaultEnemies[enemyType] || {
        name: "Unknown Enemy",
        level: 1,
        maxHp: 10,
        dicePool: "1d6",
        xpReward: 20,
        lootTable: [],
        description: "A mysterious foe.",
        difficulty: "Easy"
    };
};

// Complete set of default enemy templates
const getDefaultEnemyTemplates = () => {
    return {
        goblin: {
            name: "Goblin",
            level: 1,
            maxHp: 7,
            dicePool: "1d6+2",
            xpReward: 25,
            lootTable: [{ type: "gold", quantity: 5 }],
            description: "A small, green-skinned creature with sharp teeth and a nasty disposition.",
            difficulty: "Easy"
        },
        skeleton: {
            name: "Skeleton",
            level: 1,
            maxHp: 13,
            dicePool: "2d4+1",
            xpReward: 30,
            lootTable: [{ type: "gold", quantity: 8 }],
            description: "An animated skeleton warrior, its bones held together by dark magic.",
            difficulty: "Easy"
        },
        orc: {
            name: "Orc",
            level: 2,
            maxHp: 15,
            dicePool: "3d4",
            xpReward: 50,
            lootTable: [{ type: "gold", quantity: 12 }],
            description: "A brutish humanoid with tusks and a fierce temper.",
            difficulty: "Medium"
        },
        wolf: {
            name: "Wolf",
            level: 1,
            maxHp: 11,
            dicePool: "2d4+1",
            xpReward: 25,
            lootTable: [{ type: "fur", quantity: 1 }],
            description: "A wild wolf with keen senses and sharp fangs.",
            difficulty: "Easy"
        },
        bandit: {
            name: "Bandit",
            level: 2,
            maxHp: 16,
            dicePool: "2d6",
            xpReward: 50,
            lootTable: [{ type: "gold", quantity: 15 }],
            description: "A human outlaw wielding a curved sword.",
            difficulty: "Medium"
        },
        giant_spider: {
            name: "Giant Spider",
            level: 2,
            maxHp: 18,
            dicePool: "2d6+1",
            xpReward: 60,
            lootTable: [{ type: "web", quantity: 2 }],
            description: "A massive arachnid with venomous fangs.",
            difficulty: "Medium"
        },
        troll: {
            name: "Troll",
            level: 5,
            maxHp: 84,
            dicePool: "6d4+2",
            xpReward: 200,
            lootTable: [{ type: "gold", quantity: 50 }],
            description: "A huge, regenerating creature with incredible strength.",
            difficulty: "Hard"
        },
        dark_knight: {
            name: "Dark Knight",
            level: 4,
            maxHp: 65,
            dicePool: "4d6",
            xpReward: 150,
            lootTable: [{ type: "armor", quantity: 1 }],
            description: "A fallen paladin clad in blackened plate armor.",
            difficulty: "Hard"
        },
        dragon: {
            name: "Ancient Dragon",
            level: 10,
            maxHp: 200,
            dicePool: "2d12",
            xpReward: 400,
            lootTable: [{ type: "gold", quantity: 200 }, { type: "treasure", quantity: 1 }],
            description: "A massive, ancient dragon with scales like molten metal.",
            difficulty: "Legendary"
        }
    };
};

// Single enemy data hook (for backward compatibility)
export const useEnemyDataSingle = (enemyType) => {
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

                const response = await enemyApi.getEnemyTemplate(enemyType);

                if (response && response.status === 'success' && response.data) {
                    setEnemyData(response.data);
                } else {
                    setEnemyData(getDefaultEnemyData(enemyType));
                }
            } catch (err) {
                console.error(`Failed to fetch enemy data for ${enemyType}:`, err);

                if (err.response?.status === 404) {
                    setEnemyData(getDefaultEnemyData(enemyType));
                } else {
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

export default useEnemyData;