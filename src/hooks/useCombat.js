// File: src/hooks/useCombat.js
// Enhanced useCombat hook with combined multi-enemy support

import { useState, useCallback } from 'react';
import { CombatEngine } from '../utils/combatEngine';

export function useCombat(character, externalEnemyTemplates = null) {
    const [combatEngine] = useState(() => new CombatEngine());
    const [combatState, setCombatState] = useState({
        phase: 'selection', // selection, active, victory, defeat
        enemy: null,        // This will be the combined enemy representation
        combatLog: [],
        totalXpGained: 0,
        totalLoot: [],
        characterHp: character?.current_hp || character?.max_hp || 20,
        damage: 0,

        // NEW: Multi-enemy tracking
        individualEnemies: [],    // Array of individual enemy instances
        isMultiEnemy: false,      // Flag to indicate multi-enemy combat
        originalCharacterHp: character?.current_hp || character?.max_hp || 20
    });

    // Use external enemy templates if provided, otherwise fall back to engine's templates
    const enemyTemplates = externalEnemyTemplates || combatEngine.enemyTemplates;
    const availableEnemies = Object.keys(enemyTemplates);

    // Create enemy instance from template
    const createEnemyInstance = useCallback((enemyType, instanceId = 0) => {
        if (externalEnemyTemplates && externalEnemyTemplates[enemyType]) {
            const template = externalEnemyTemplates[enemyType];
            return {
                id: `${enemyType}_${instanceId}`,
                type: enemyType,
                name: template.name,
                level: template.level,
                maxHp: template.maxHp,
                currentHp: template.maxHp,
                hp: template.maxHp, // For compatibility
                dicePool: template.dicePool,
                xpReward: template.xpReward,
                lootTable: template.lootTable || []
            };
        } else {
            const enemy = combatEngine.createEnemy(enemyType);
            return {
                id: `${enemyType}_${instanceId}`,
                type: enemyType,
                ...enemy,
                maxHp: enemy.hp || enemy.maxHp,
                currentHp: enemy.hp || enemy.maxHp
            };
        }
    }, [combatEngine, externalEnemyTemplates]);

    // NEW: Calculate combined enemy stats from individual enemies
    const calculateCombinedEnemy = useCallback((individualEnemies) => {
        if (!individualEnemies || individualEnemies.length === 0) {
            return null;
        }

        // Filter out defeated enemies (currentHp > 0)
        const aliveEnemies = individualEnemies.filter(enemy => enemy.currentHp > 0);

        if (aliveEnemies.length === 0) {
            return null;
        }

        // Calculate combined stats
        const totalHp = aliveEnemies.reduce((sum, enemy) => sum + enemy.currentHp, 0);
        const totalMaxHp = aliveEnemies.reduce((sum, enemy) => sum + enemy.maxHp, 0);
        const totalXpReward = aliveEnemies.reduce((sum, enemy) => sum + enemy.xpReward, 0);

        // Combine dice pools
        const combinedDicePool = combatEngine.combineDicePools(aliveEnemies.map(enemy => enemy.dicePool));

        // Create display name
        const groupedByType = aliveEnemies.reduce((groups, enemy) => {
            groups[enemy.name] = (groups[enemy.name] || 0) + 1;
            return groups;
        }, {});

        const displayName = Object.entries(groupedByType)
            .map(([name, count]) => count > 1 ? `${name} x${count}` : name)
            .join(' + ');

        return {
            name: displayName,
            currentHp: totalHp,
            maxHp: totalMaxHp,
            hp: totalHp, // For compatibility
            dicePool: combinedDicePool,
            xpReward: totalXpReward,
            lootTable: aliveEnemies.flatMap(enemy => enemy.lootTable || []),
            // Additional properties for tracking
            aliveCount: aliveEnemies.length,
            defeatedCount: individualEnemies.length - aliveEnemies.length
        };
    }, [combatEngine]);

    // NEW: Apply damage to individual enemies (lowest HP first)
    const applyDamageToEnemies = useCallback((individualEnemies, totalDamage) => {
        if (totalDamage <= 0) return individualEnemies;

        // Work with a copy
        const enemies = [...individualEnemies];
        let remainingDamage = totalDamage;
        const defeatedEnemies = [];

        while (remainingDamage > 0) {
            // Find alive enemy with lowest current HP
            const aliveEnemies = enemies.filter(enemy => enemy.currentHp > 0);
            if (aliveEnemies.length === 0) break;

            const targetEnemy = aliveEnemies.reduce((lowest, current) =>
                current.currentHp < lowest.currentHp ? current : lowest
            );

            // Apply damage to this enemy
            const damageToApply = Math.min(remainingDamage, targetEnemy.currentHp);
            targetEnemy.currentHp -= damageToApply;
            remainingDamage -= damageToApply;

            // Track if enemy was defeated this round
            if (targetEnemy.currentHp <= 0) {
                defeatedEnemies.push(targetEnemy.name);
            }
        }

        return { updatedEnemies: enemies, defeatedThisRound: defeatedEnemies };
    }, []);

    // ORIGINAL: Start combat with single enemy
    const startCombat = useCallback((enemyType) => {
        const enemy = createEnemyInstance(enemyType, 0);
        console.log(`Starting single combat with: ${enemy.name}`);

        setCombatState({
            phase: 'active',
            enemy,
            combatLog: [],
            totalXpGained: 0,
            totalLoot: [],
            characterHp: character?.current_hp || character?.max_hp || 20,
            damage: 0,
            individualEnemies: [enemy],
            isMultiEnemy: false,
            originalCharacterHp: character?.current_hp || character?.max_hp || 20
        });
    }, [createEnemyInstance, character]);

    // NEW: Start combat with multiple enemies (combined)
    const startMultiCombat = useCallback((enemyTypes) => {
        if (!Array.isArray(enemyTypes) || enemyTypes.length === 0) {
            console.error('Invalid enemy types for multi-combat');
            return;
        }

        // Create individual enemy instances
        const individualEnemies = enemyTypes.map((type, index) => createEnemyInstance(type, index));

        // Calculate combined enemy representation
        const combinedEnemy = calculateCombinedEnemy(individualEnemies);

        if (!combinedEnemy) {
            console.error('Failed to create combined enemy');
            return;
        }

        console.log(`Starting multi-combat: ${combinedEnemy.name} (${combinedEnemy.dicePool}, ${combinedEnemy.currentHp} HP)`);

        setCombatState({
            phase: 'active',
            enemy: combinedEnemy,
            combatLog: [{
                type: 'encounter',
                description: `Encounter: ${combinedEnemy.name} - Combined dice pool: ${combinedEnemy.dicePool}`
            }],
            totalXpGained: 0,
            totalLoot: [],
            characterHp: character?.current_hp || character?.max_hp || 20,
            damage: 0,
            individualEnemies,
            isMultiEnemy: true,
            originalCharacterHp: character?.current_hp || character?.max_hp || 20
        });
    }, [createEnemyInstance, calculateCombinedEnemy, character]);

    // ENHANCED: Execute round with combined enemy damage distribution
    const executeRound = useCallback((customRoundResult = null) => {
        if (combatState.phase !== 'active' || !combatState.enemy) return;

        let result;
        let newCharacterHp = combatState.characterHp;

        if (customRoundResult) {
            // Use custom result from 3D dice rolling
            result = {
                ...customRoundResult,
                newCharacterHp: customRoundResult.newCharacterHp !== undefined
                    ? customRoundResult.newCharacterHp
                    : (customRoundResult.winner === 'enemy'
                        ? Math.max(0, combatState.characterHp - customRoundResult.damage)
                        : combatState.characterHp),
                newEnemyHp: customRoundResult.winner === 'character'
                    ? Math.max(0, combatState.enemy.currentHp - customRoundResult.damage)
                    : combatState.enemy.currentHp,
                combatEnded: false,
                victory: false,
                defeat: false
            };

            newCharacterHp = result.newCharacterHp;
        } else {
            // Use combat engine for fallback
            result = combatEngine.executeCombatRound(character, combatState.enemy);
            newCharacterHp = result.newCharacterHp;
        }

        let updatedIndividualEnemies = combatState.individualEnemies;
        let defeatedThisRound = [];

        // Apply damage to individual enemies if character won
        if (result.winner === 'character' && result.damage > 0 && combatState.isMultiEnemy) {
            const damageResult = applyDamageToEnemies(combatState.individualEnemies, result.damage);
            updatedIndividualEnemies = damageResult.updatedEnemies;
            defeatedThisRound = damageResult.defeatedThisRound;
        } else if (result.winner === 'character' && result.damage > 0) {
            // Single enemy - apply damage normally
            updatedIndividualEnemies = [{
                ...combatState.individualEnemies[0],
                currentHp: result.newEnemyHp
            }];
        }

        // Recalculate combined enemy after damage
        const updatedCombinedEnemy = calculateCombinedEnemy(updatedIndividualEnemies);

        // Check for combat end
        const combatEnded = newCharacterHp <= 0 || !updatedCombinedEnemy || updatedCombinedEnemy.currentHp <= 0;
        const victory = updatedCombinedEnemy && updatedCombinedEnemy.currentHp <= 0 && newCharacterHp > 0;
        const defeat = newCharacterHp <= 0;

        // Create enhanced log entry for multi-enemy
        let logDescription = result.description;
        if (combatState.isMultiEnemy && defeatedThisRound.length > 0) {
            logDescription += ` ${defeatedThisRound.join(', ')} defeated!`;
            if (updatedCombinedEnemy && updatedCombinedEnemy.currentHp > 0) {
                logDescription += ` Remaining: ${updatedCombinedEnemy.name} (${updatedCombinedEnemy.dicePool})`;
            }
        }

        const enhancedResult = {
            ...result,
            description: logDescription,
            defeatedThisRound,
            newEnemyHp: updatedCombinedEnemy ? updatedCombinedEnemy.currentHp : 0,
            combatEnded,
            victory,
            defeat
        };

        const newLog = [...combatState.combatLog, enhancedResult];
        const totalDamage = combatState.originalCharacterHp - newCharacterHp;

        if (combatEnded) {
            if (victory) {
                // Victory! Generate combined loot and XP
                const totalXp = updatedIndividualEnemies.reduce((sum, enemy) => sum + (enemy.xpReward || 0), 0);
                const combinedLoot = updatedIndividualEnemies.flatMap(enemy =>
                    combatEngine.generateLoot(enemy) || []
                );

                setCombatState(prev => ({
                    ...prev,
                    phase: 'victory',
                    enemy: updatedCombinedEnemy || prev.enemy,
                    combatLog: [
                        ...newLog,
                        {
                            type: 'victory',
                            description: `All enemies defeated! Total XP: +${totalXp}`
                        }
                    ],
                    totalXpGained: totalXp,
                    totalLoot: combinedLoot,
                    characterHp: newCharacterHp,
                    damage: totalDamage,
                    individualEnemies: updatedIndividualEnemies
                }));
            } else {
                // Defeat
                setCombatState(prev => ({
                    ...prev,
                    phase: 'defeat',
                    enemy: updatedCombinedEnemy || prev.enemy,
                    combatLog: newLog,
                    characterHp: 0,
                    damage: totalDamage,
                    individualEnemies: updatedIndividualEnemies
                }));
            }
        } else {
            // Combat continues
            setCombatState(prev => ({
                ...prev,
                enemy: updatedCombinedEnemy,
                combatLog: newLog,
                characterHp: newCharacterHp,
                damage: totalDamage,
                individualEnemies: updatedIndividualEnemies
            }));
        }

        // Return updated character HP for UI updates
        return newCharacterHp;
    }, [combatEngine, character, combatState, applyDamageToEnemies, calculateCombinedEnemy]);

    const resetCombat = useCallback(() => {
        setCombatState({
            phase: 'selection',
            enemy: null,
            combatLog: [],
            totalXpGained: 0,
            totalLoot: [],
            characterHp: character?.current_hp || character?.max_hp || 20,
            damage: 0,
            individualEnemies: [],
            isMultiEnemy: false,
            originalCharacterHp: character?.current_hp || character?.max_hp || 20
        });
    }, [character]);

    // Get dice pool information for display
    const getCharacterDiceInfo = useCallback(() => {
        if (!character) return { dicePool: '1d4', description: 'No character' };

        const diceInfo = combatEngine.getCharacterDicePool ?
            combatEngine.getCharacterDicePool(character) :
            { dicePool: '1d4', description: 'Default' };

        return diceInfo;
    }, [combatEngine, character]);

    const getEnemyDiceInfo = useCallback(() => {
        if (!combatState.enemy) return { dicePool: '1d4', description: 'No enemy' };

        return {
            dicePool: combatState.enemy.dicePool || '2d4',
            description: combatState.isMultiEnemy
                ? `Combined dice pool from ${combatState.individualEnemies.filter(e => e.currentHp > 0).length} enemies`
                : `${combatState.enemy.name} combat dice`
        };
    }, [combatState.enemy, combatState.isMultiEnemy, combatState.individualEnemies]);

    // NEW: Get individual enemy status for multi-enemy display
    const getIndividualEnemyStatus = useCallback(() => {
        if (!combatState.isMultiEnemy) return [];

        return combatState.individualEnemies.map(enemy => ({
            id: enemy.id,
            name: enemy.name,
            currentHp: enemy.currentHp,
            maxHp: enemy.maxHp,
            isAlive: enemy.currentHp > 0,
            dicePool: enemy.dicePool
        }));
    }, [combatState.isMultiEnemy, combatState.individualEnemies]);

    return {
        combatState,
        startCombat,           // Original single enemy combat
        startMultiCombat,      // NEW: Combined multi-enemy combat
        executeRound,
        resetCombat,
        getCharacterDiceInfo,
        getEnemyDiceInfo,
        getIndividualEnemyStatus, // NEW: Get individual enemy status
        availableEnemies,
        isUsingExternalEnemies: !!externalEnemyTemplates,

        // Helper functions
        createEnemyInstance,
        isMultiEnemy: combatState.isMultiEnemy
    };
}