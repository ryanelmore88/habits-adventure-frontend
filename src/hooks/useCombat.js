// src/hooks/useCombat.js

import { useState, useCallback } from 'react';
import { CombatEngine } from '../utils/combatEngine';

export function useCombat(character) {
    const [combatEngine] = useState(() => new CombatEngine());
    const [combatState, setCombatState] = useState({
        phase: 'selection', // selection, active, victory, defeat
        enemy: null,
        combatLog: [],
        totalXpGained: 0,
        totalLoot: []
    });

    const startCombat = useCallback((enemyType) => {
        const enemy = combatEngine.createEnemy(enemyType);
        setCombatState({
            phase: 'active',
            enemy,
            combatLog: [],
            totalXpGained: 0,
            totalLoot: []
        });
    }, [combatEngine]);

    const executeRound = useCallback((customRoundResult = null) => {
        if (combatState.phase !== 'active' || !combatState.enemy) return;

        let result;
        if (customRoundResult) {
            // Use custom result from 3D dice rolling
            result = {
                ...customRoundResult,
                newCharacterHp: customRoundResult.winner === 'enemy'
                    ? Math.max(0, (character.current_hp || character.currentHp || 20) - customRoundResult.damage)
                    : (character.current_hp || character.currentHp || 20),
                newEnemyHp: customRoundResult.winner === 'character'
                    ? Math.max(0, combatState.enemy.currentHp - customRoundResult.damage)
                    : combatState.enemy.currentHp,
                combatEnded: false,
                victory: false,
                defeat: false
            };

            // Check for combat end conditions
            result.combatEnded = result.newCharacterHp <= 0 || result.newEnemyHp <= 0;
            result.victory = result.newEnemyHp <= 0 && result.newCharacterHp > 0;
            result.defeat = result.newCharacterHp <= 0;
        } else {
            // Use combat engine for fallback
            result = combatEngine.executeCombatRound(character, combatState.enemy);
        }

        // Update enemy HP
        const updatedEnemy = {
            ...combatState.enemy,
            currentHp: result.newEnemyHp
        };

        // Update character HP (this will be sent to backend later)
        const updatedCharacter = {
            ...character,
            currentHp: result.newCharacterHp,
            current_hp: result.newCharacterHp // Support both naming conventions
        };

        const newLog = [...combatState.combatLog, result];

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
                    totalLoot: loot
                }));
            } else {
                // Defeat
                setCombatState(prev => ({
                    ...prev,
                    phase: 'defeat',
                    enemy: updatedEnemy,
                    combatLog: newLog
                }));
            }
        } else {
            // Combat continues
            setCombatState(prev => ({
                ...prev,
                enemy: updatedEnemy,
                combatLog: newLog
            }));
        }

        // Return updated character state for UI updates
        return updatedCharacter;
    }, [combatEngine, character, combatState]);

    const resetCombat = useCallback(() => {
        setCombatState({
            phase: 'selection',
            enemy: null,
            combatLog: [],
            totalXpGained: 0,
            totalLoot: []
        });
    }, []);

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
        availableEnemies: Object.keys(combatEngine.enemyTemplates)
    };
}