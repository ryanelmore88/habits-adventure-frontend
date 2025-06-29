// File: src/components/CombatArea.jsx
// Simplified version focused on dice results modal functionality

import React, { useState, useRef, useEffect } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import DiceResultsModal from './dice/DiceResultsModal';
import '../styles/CombatArea.css';

const CombatArea = ({
                        isQuestCombat = false,
                        questEnemy = null,
                        onAdventureComplete = null,
                        onBackToQuests = null
                    }) => {
    const { selectedCharacter, updateTemporaryHp } = useCharacter();

    // Simple combat state
    const [combatPhase, setCombatPhase] = useState('selection'); // 'selection', 'active', 'victory', 'defeat'
    const [currentEnemy, setCurrentEnemy] = useState(null);
    const [characterCurrentHp, setCharacterCurrentHp] = useState(null);
    const [enemyCurrentHp, setEnemyCurrentHp] = useState(null);
    const [roundCount, setRoundCount] = useState(0);
    const [lastRoundResult, setLastRoundResult] = useState(null);
    const [isRolling, setIsRolling] = useState(false);

    // Dice Results Modal State
    const [showDiceResults, setShowDiceResults] = useState(false);
    const [diceResultsData, setDiceResultsData] = useState({
        playerRolls: [],
        enemyRolls: [],
        playerTotal: 0,
        enemyTotal: 0,
        winner: null
    });

    // Simple enemies list
    const defaultEnemies = [
        { id: 'goblin', name: 'Goblin', hp: 15, dicePool: '2d4', xpReward: 25 },
        { id: 'orc', name: 'Orc', hp: 25, dicePool: '3d4', xpReward: 50 },
        { id: 'skeleton', name: 'Skeleton', hp: 20, dicePool: '2d4+1', xpReward: 30 },
        { id: 'troll', name: 'Troll', hp: 40, dicePool: '6d4', xpReward: 200 },
        { id: 'dragon', name: 'Dragon', hp: 60, dicePool: '2d12', xpReward: 400 }
    ];

    // Initialize character HP
    useEffect(() => {
        if (selectedCharacter && characterCurrentHp === null) {
            setCharacterCurrentHp(selectedCharacter.current_hp || selectedCharacter.max_hp || 20);
        }
    }, [selectedCharacter, characterCurrentHp]);

    // Get character dice pool
    const getCharacterDicePool = () => {
        if (!selectedCharacter) return { totalDice: 2, notation: '2d4' };

        // Simple calculation: base 2 dice, +1 for every 5 points across attributes
        const totalAttributePoints = Object.values(selectedCharacter.attributes || {})
            .reduce((sum, attr) => sum + (attr.habit_points || 0), 0);

        const bonusDice = Math.floor(totalAttributePoints / 25); // Every 25 points = +1 die
        const totalDice = Math.max(2, 2 + bonusDice);

        return {
            totalDice,
            notation: `${totalDice}d4`
        };
    };

    // Simple dice rolling simulation (fallback if 3D dice fails)
    const rollSimpleDice = (notation) => {
        const match = notation.match(/(\d+)d(\d+)(\+\d+)?/);
        if (!match) return { total: 4, rolls: [{ value: 4, sides: 4 }] };

        const count = parseInt(match[1]);
        const sides = parseInt(match[2]);
        const bonus = match[3] ? parseInt(match[3]) : 0;

        const rolls = [];
        let total = bonus;

        for (let i = 0; i < count; i++) {
            const roll = Math.floor(Math.random() * sides) + 1;
            rolls.push({ value: roll, sides });
            total += roll;
        }

        return { total, rolls };
    };

    // Start combat with an enemy
    const startCombat = (enemy) => {
        setCurrentEnemy(enemy);
        setEnemyCurrentHp(enemy.hp);
        setCombatPhase('active');
        setRoundCount(0);
        setLastRoundResult(null);
        console.log('Started combat with:', enemy.name);
    };

    // Handle combat round
    const handleCombatRound = async () => {
        if (isRolling || combatPhase !== 'active') return;

        setIsRolling(true);

        // Get dice pools
        const characterDice = getCharacterDicePool();
        const enemyDicePool = currentEnemy.dicePool;

        // Roll dice (simplified simulation)
        const playerResult = rollSimpleDice(characterDice.notation);
        const enemyResult = rollSimpleDice(enemyDicePool);

        // Determine winner
        let winner, damage, description;
        if (playerResult.total > enemyResult.total) {
            winner = 'character';
            damage = Math.max(1, playerResult.total - enemyResult.total);
            description = `You rolled ${playerResult.total}, ${currentEnemy.name} rolled ${enemyResult.total}. You deal ${damage} damage!`;
        } else if (enemyResult.total > playerResult.total) {
            winner = 'enemy';
            damage = Math.max(1, enemyResult.total - playerResult.total);
            description = `${currentEnemy.name} rolled ${enemyResult.total}, you rolled ${playerResult.total}. You take ${damage} damage!`;
        } else {
            winner = 'tie';
            damage = 0;
            description = `Both rolled ${playerResult.total}. No damage dealt this round.`;
        }

        // Show dice results modal
        setDiceResultsData({
            playerRolls: playerResult.rolls,
            enemyRolls: enemyResult.rolls,
            playerTotal: playerResult.total,
            enemyTotal: enemyResult.total,
            winner
        });
        setShowDiceResults(true);

        // Store results for processing after modal closes
        window.pendingCombatResult = {
            winner,
            damage,
            description,
            playerTotal: playerResult.total,
            enemyTotal: enemyResult.total
        };

        setRoundCount(prev => prev + 1);
    };

    // Process combat result after dice modal closes
    const handleDiceResultsClose = () => {
        setShowDiceResults(false);

        if (window.pendingCombatResult) {
            const result = window.pendingCombatResult;
            delete window.pendingCombatResult;

            // Apply damage
            if (result.winner === 'character') {
                const newEnemyHp = Math.max(0, enemyCurrentHp - result.damage);
                setEnemyCurrentHp(newEnemyHp);
                if (newEnemyHp <= 0) {
                    setCombatPhase('victory');
                }
            } else if (result.winner === 'enemy') {
                const newCharacterHp = Math.max(0, characterCurrentHp - result.damage);
                setCharacterCurrentHp(newCharacterHp);
                updateTemporaryHp(newCharacterHp);
                if (newCharacterHp <= 0) {
                    setCombatPhase('defeat');
                }
            }

            setLastRoundResult(result);
        }

        setIsRolling(false);
    };

    // Reset combat
    const resetCombat = () => {
        setCombatPhase('selection');
        setCurrentEnemy(null);
        setEnemyCurrentHp(null);
        setCharacterCurrentHp(selectedCharacter?.current_hp || selectedCharacter?.max_hp || 20);
        setRoundCount(0);
        setLastRoundResult(null);
        setIsRolling(false);
    };

    // Handle combat completion
    const handleCombatComplete = () => {
        if (isQuestCombat && onAdventureComplete) {
            onAdventureComplete({
                victory: combatPhase === 'victory',
                defeat: combatPhase === 'defeat',
                hpChange: (selectedCharacter?.max_hp || 20) - characterCurrentHp,
                xpGained: combatPhase === 'victory' ? currentEnemy?.xpReward || 0 : 0,
                loot: combatPhase === 'victory' ? ['Gold coins'] : [],
                completedQuest: questEnemy?.name || currentEnemy?.name
            });
        } else {
            resetCombat();
        }
    };

    // Handle back to quests
    const handleBackToQuests = () => {
        resetCombat();
        if (onBackToQuests) {
            onBackToQuests();
        }
    };

    if (!selectedCharacter) {
        return (
            <div className="combat-area">
                <div className="loading-spinner"></div>
                <p>Please select a character to begin combat.</p>
            </div>
        );
    }

    return (
        <div className="combat-area">
            {/* Quest Combat Header */}
            {isQuestCombat && (
                <div className="quest-combat-header">
                    <button
                        className="back-to-quests-btn"
                        onClick={handleBackToQuests}
                    >
                        ← Back to Quests
                    </button>
                    <h3>Quest Combat: {questEnemy?.name || 'Unknown Enemy'}</h3>
                </div>
            )}

            {/* Enemy Selection */}
            {combatPhase === 'selection' && !isQuestCombat && (
                <div className="enemy-selection">
                    <h3>Choose Your Opponent</h3>
                    <div className="enemy-buttons">
                        {defaultEnemies.map((enemy) => (
                            <button
                                key={enemy.id}
                                className="enemy-button"
                                onClick={() => startCombat(enemy)}
                            >
                                <h4>{enemy.name}</h4>
                                <div className="enemy-details">
                                    <span>HP: {enemy.hp}</span>
                                    <span>Dice: {enemy.dicePool}</span>
                                    <span>XP: {enemy.xpReward}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Auto-start quest combat */}
            {combatPhase === 'selection' && isQuestCombat && questEnemy && (
                <div className="quest-auto-start">
                    <h3>⚔️ Entering Combat...</h3>
                    <p>Preparing to face {questEnemy.name}...</p>
                    <button
                        className="combat-button start"
                        onClick={() => startCombat(questEnemy)}
                    >
                        Begin Combat!
                    </button>
                </div>
            )}

            {/* Active Combat */}
            {combatPhase === 'active' && currentEnemy && (
                <div className="active-combat">
                    <div className="combat-status">
                        <div className="character-status">
                            <h4>{selectedCharacter.name}</h4>
                            <div className="hp-display">
                                HP: {characterCurrentHp}/{selectedCharacter.max_hp || 20}
                            </div>
                            <div className="dice-display">
                                Dice: {getCharacterDicePool().notation}
                            </div>
                        </div>

                        <div className="enemy-status">
                            <h4>{currentEnemy.name}</h4>
                            <div className="hp-display">
                                HP: {enemyCurrentHp}/{currentEnemy.hp}
                            </div>
                            <div className="dice-display">
                                Dice: {currentEnemy.dicePool}
                            </div>
                        </div>
                    </div>

                    <div className="combat-actions">
                        <button
                            className="combat-button attack"
                            onClick={handleCombatRound}
                            disabled={isRolling}
                        >
                            {isRolling ? 'Rolling Dice...' : 'Attack!'}
                        </button>
                    </div>

                    {lastRoundResult && (
                        <div className="last-round-result">
                            <p>{lastRoundResult.description}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Combat Results */}
            {(combatPhase === 'victory' || combatPhase === 'defeat') && (
                <div className="combat-result">
                    <h3>{combatPhase === 'victory' ? '🎉 Victory!' : '💀 Defeat!'}</h3>
                    <div className="result-summary">
                        <p>Total Rounds: {roundCount}</p>
                        <p>XP Gained: {combatPhase === 'victory' ? currentEnemy?.xpReward || 0 : 0}</p>
                        <p>Loot Found: {combatPhase === 'victory' ? 'Gold coins' : 'None'}</p>
                    </div>

                    <div className="result-actions">
                        <button
                            className="combat-button continue"
                            onClick={handleCombatComplete}
                        >
                            {isQuestCombat ? 'Complete Quest' : 'Fight Again'}
                        </button>
                        {!isQuestCombat && (
                            <button
                                className="combat-button secondary"
                                onClick={resetCombat}
                            >
                                Return to Town
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Dice Results Modal */}
            <DiceResultsModal
                isVisible={showDiceResults}
                playerRolls={diceResultsData.playerRolls}
                enemyRolls={diceResultsData.enemyRolls}
                playerTotal={diceResultsData.playerTotal}
                enemyTotal={diceResultsData.enemyTotal}
                winner={diceResultsData.winner}
                onClose={handleDiceResultsClose}
                autoDismissDelay={4000}
            />
        </div>
    );
};

export default CombatArea;