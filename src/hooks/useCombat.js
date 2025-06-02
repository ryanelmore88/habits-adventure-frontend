// 2. Combat Hook for React components
// hooks/useCombat.js

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

    const executeRound = useCallback(() => {
        if (combatState.phase !== 'active' || !combatState.enemy) return;

        const result = combatEngine.executeCombatRound(character, combatState.enemy);

        // Update enemy HP
        const updatedEnemy = {
            ...combatState.enemy,
            currentHp: result.newEnemyHp
        };

        // Update character HP (this will be sent to backend later)
        const updatedCharacter = {
            ...character,
            currentHp: result.newCharacterHp
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

    return {
        combatState,
        startCombat,
        executeRound,
        resetCombat,
        availableEnemies: Object.keys(combatEngine.enemyTemplates)
    };
}