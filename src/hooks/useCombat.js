// File: src/hooks/useCombat.js
// Updated useCombat hook that accepts external enemy data instead of managing its own

import { useState, useCallback } from 'react';
import { CombatEngine } from '../utils/combatEngine';

export function useCombat(character, externalEnemyTemplates = null) {
    const [combatEngine] = useState(() => new CombatEngine());
    const [combatState, setCombatState] = useState({
        phase: 'selection', // selection, active, victory, defeat
        enemy: null,
        combatLog: [],
        totalXpGained: 0,
        totalLoot: [],
        characterHp: character?.current_hp || character?.max_hp || 20,
        damage: 0
    });

    // Use external enemy templates if provided, otherwise fall back to engine's templates
    const enemyTemplates = externalEnemyTemplates || combatEngine.enemyTemplates;
    const availableEnemies = Object.keys(enemyTemplates);

    const startCombat = useCallback((enemyType) => {
        let enemy;

        if (externalEnemyTemplates && externalEnemyTemplates[enemyType]) {
            // Use external enemy template (from backend)
            const template = externalEnemyTemplates[enemyType];
            enemy = {
                name: template.name,
                level: template.level,
                maxHp: template.maxHp,
                currentHp: template.maxHp,
                dicePool: template.dicePool,
                xpReward: template.xpReward,
                lootTable: template.lootTable || []
            };
            console.log(`Starting combat with backend enemy: ${enemy.name}`);
        } else {
            // Fall back to CombatEngine's createEnemy method
            enemy = combatEngine.createEnemy(enemyType);
            console.log(`Starting combat with fallback enemy: ${enemy.name}`);
        }

        setCombatState({
            phase: 'active',
            enemy,
            combatLog: [],
            totalXpGained: 0,
            totalLoot: [],
            characterHp: character?.current_hp || character?.max_hp || 20,
            damage: 0
        });
    }, [combatEngine, character, externalEnemyTemplates]);

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

            // Check for combat end conditions
            result.combatEnded = result.newCharacterHp <= 0 || result.newEnemyHp <= 0;
            result.victory = result.newEnemyHp <= 0 && result.newCharacterHp > 0;
            result.defeat = result.newCharacterHp <= 0;
        } else {
            // Use combat engine for fallback
            result = combatEngine.executeCombatRound(character, combatState.enemy);
            newCharacterHp = result.newCharacterHp;
        }

        // Update enemy HP
        const updatedEnemy = {
            ...combatState.enemy,
            currentHp: result.newEnemyHp
        };

        const newLog = [...combatState.combatLog, result];
        const totalDamage = (character?.current_hp || character?.max_hp || 20) - newCharacterHp;

        if (result.combatEnded) {
            if (result.victory) {
                // Victory! Generate rewards
                const loot = combatEngine.generateLoot(combatState.enemy);
                setCombatState(prev => ({
                    ...prev,
                    phase: 'victory',
                    enemy: updatedEnemy,
                    combatLog: newLog,
                    totalXpGained: combatState.enemy.xpReward,
                    totalLoot: loot,
                    characterHp: newCharacterHp,
                    damage: totalDamage
                }));
            } else {
                // Defeat
                setCombatState(prev => ({
                    ...prev,
                    phase: 'defeat',
                    enemy: updatedEnemy,
                    combatLog: newLog,
                    characterHp: 0,
                    damage: totalDamage
                }));
            }
        } else {
            // Combat continues
            setCombatState(prev => ({
                ...prev,
                enemy: updatedEnemy,
                combatLog: newLog,
                characterHp: newCharacterHp,
                damage: totalDamage
            }));
        }

        // Return updated character HP for UI updates
        return newCharacterHp;
    }, [combatEngine, character, combatState]);

    const resetCombat = useCallback(() => {
        setCombatState({
            phase: 'selection',
            enemy: null,
            combatLog: [],
            totalXpGained: 0,
            totalLoot: [],
            characterHp: character?.current_hp || character?.max_hp || 20,
            damage: 0
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
            description: `${combatState.enemy.name} combat dice`
        };
    }, [combatState.enemy]);

    return {
        combatState,
        startCombat,
        executeRound,
        resetCombat,
        getCharacterDiceInfo,
        getEnemyDiceInfo,
        availableEnemies, // This will now use external enemies when provided
        isUsingExternalEnemies: !!externalEnemyTemplates
    };
}