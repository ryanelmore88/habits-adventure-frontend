// File: src/components/CombatArea.jsx
// Fixed dice rolling and combat system using existing 3D dice setup

import { useState, useEffect, useRef } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { useCombat } from '../hooks/useCombat';
import { Dice, CharacterDice, OpponentDice } from '../components/dice/DiceBox.js';
import '../styles/CombatArea.css';

const CombatArea = ({ onAdventureComplete }) => {
    const {
        selectedCharacter,
        characterInstance,
        refreshCharacter,
        updateTemporaryHp,
        clearTemporaryHp,
        getCharacterDicePool
    } = useCharacter();

    // Initialize combat state manually since useCombat might be causing issues
    const [combatState, setCombatState] = useState({
        phase: 'selection', // selection, active, victory, defeat
        enemy: null,
        combatLog: [],
        totalXpGained: 0,
        totalLoot: [],
        characterHp: selectedCharacter?.current_hp || 20
    });

    const [diceBox, setDiceBox] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    const [characterCurrentHp, setCharacterCurrentHp] = useState(selectedCharacter?.current_hp || 20);
    const diceContainerRef = useRef(null);

    // Hard-coded enemy templates
    const enemyTemplates = [
        {
            id: 'goblin',
            name: 'Goblin',
            level: 1,
            maxHp: 15,
            currentHp: 15,
            dicePool: '2d4',
            description: 'A weak but cunning creature. Good for beginners.',
            xpReward: 10
        },
        {
            id: 'orc',
            name: 'Orc',
            level: 2,
            maxHp: 25,
            currentHp: 25,
            dicePool: '1d6 + 1d4',
            description: 'A brutal warrior with decent fighting skills.',
            xpReward: 20
        },
        {
            id: 'skeleton',
            name: 'Skeleton',
            level: 2,
            maxHp: 20,
            currentHp: 20,
            dicePool: '2d6',
            description: 'Undead fighter that feels no pain.',
            xpReward: 15
        },
        {
            id: 'troll',
            name: 'Troll',
            level: 3,
            maxHp: 40,
            currentHp: 40,
            dicePool: '1d8 + 1d6',
            description: 'A large, regenerating beast. Very dangerous!',
            xpReward: 35
        },
        {
            id: 'dragon',
            name: 'Young Dragon',
            level: 5,
            maxHp: 80,
            currentHp: 80,
            dicePool: '2d12',
            description: 'A powerful dragon. Only for the most skilled warriors!',
            xpReward: 100
        }
    ];

    // Update character HP when selected character changes
    useEffect(() => {
        if (selectedCharacter) {
            const newHp = selectedCharacter.current_hp || selectedCharacter.max_hp || 20;
            setCharacterCurrentHp(newHp);
            clearTemporaryHp();
        }
    }, [selectedCharacter, clearTemporaryHp]);

    // Initialize 3D dice system
    useEffect(() => {
        const initDiceSystem = async () => {
            try {
                console.log('Initializing 3D dice system...');

                // Initialize the main dice system
                await Dice.init();
                await CharacterDice.init();
                await OpponentDice.init();

                console.log('3D dice system initialized successfully!');
                setDiceBox(Dice); // Use the main Dice object

            } catch (error) {
                console.warn('Could not initialize 3D dice system:', error);
                setDiceBox(null);
            }
        };

        initDiceSystem();

        return () => {
            try {
                if (Dice.clear) Dice.clear();
                if (CharacterDice.clear) CharacterDice.clear();
                if (OpponentDice.clear) OpponentDice.clear();
            } catch (e) {
                console.warn('Error cleaning up dice system:', e);
            }
        };
    }, []);

    // Start combat with selected enemy
    const startCombat = (enemy) => {
        console.log('Starting combat with:', enemy.name);
        setCombatState({
            phase: 'active',
            enemy: { ...enemy, currentHp: enemy.maxHp },
            combatLog: [],
            totalXpGained: 0,
            totalLoot: [],
            characterHp: characterCurrentHp
        });
    };

    // Parse dice notation to get roll total
    const rollDice = (notation) => {
        // Simple dice parser for notations like "2d6", "1d8+1d4", etc.
        let total = 0;

        // Split by + to handle multiple dice groups
        const groups = notation.split('+').map(s => s.trim());

        for (const group of groups) {
            const match = group.match(/(\d+)d(\d+)/);
            if (match) {
                const count = parseInt(match[1]);
                const sides = parseInt(match[2]);

                for (let i = 0; i < count; i++) {
                    total += Math.floor(Math.random() * sides) + 1;
                }
            }
        }

        return total || Math.floor(Math.random() * 6) + 1; // Fallback
    };

    // Roll combat dice with 3D animation
    const rollCombatDice = async () => {
        if (isRolling || combatState.phase !== 'active') return;

        console.log('Rolling 3D combat dice...');
        setIsRolling(true);

        try {
            // Clear any existing dice
            if (Dice.clear) Dice.clear();
            if (CharacterDice.clear) CharacterDice.clear();
            if (OpponentDice.clear) OpponentDice.clear();

            const characterDicePool = getCharacterDicePool();
            console.log('Character dice pool:', characterDicePool);

            // Parse character dice notation into rollable format
            const charNotation = characterDicePool.notation || '2d6';
            console.log('Rolling character dice:', charNotation);

            // Roll character dice first (blue)
            CharacterDice.show();
            const charRollPromise = CharacterDice.roll(charNotation);

            // Wait a moment, then roll enemy dice
            await new Promise(resolve => setTimeout(resolve, 500));

            const enemyNotation = combatState.enemy.dicePool || '2d6';
            console.log('Rolling enemy dice:', enemyNotation);

            // Roll enemy dice (red)
            OpponentDice.show();
            const enemyRollPromise = OpponentDice.roll(enemyNotation);

            // Wait for both rolls to complete
            const [charResults, enemyResults] = await Promise.all([charRollPromise, enemyRollPromise]);

            // Calculate totals
            const characterTotal = charResults.reduce((sum, die) => sum + (die.value || die), 0);
            const enemyTotal = enemyResults.reduce((sum, die) => sum + (die.value || die), 0);

            console.log(`Character rolled: ${characterTotal}, Enemy rolled: ${enemyTotal}`);

            // Wait for dice to settle
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Process the combat round
            processCombatRound(characterTotal, enemyTotal);

        } catch (error) {
            console.error('Error during 3D dice rolling:', error);
            // Fallback to mathematical rolling
            const characterDicePool = getCharacterDicePool();
            const characterTotal = rollDice(characterDicePool.notation || '2d6');
            const enemyTotal = rollDice(combatState.enemy.dicePool || '2d6');
            console.log(`Fallback rolls - Character: ${characterTotal}, Enemy: ${enemyTotal}`);
            processCombatRound(characterTotal, enemyTotal);
        } finally {
            setIsRolling(false);
        }
    };

    // Process combat round results
    const processCombatRound = (characterRoll, enemyRoll) => {
        let winner, damage = 0;

        if (characterRoll > enemyRoll) {
            winner = 'character';
            damage = Math.max(1, characterRoll - enemyRoll);
        } else if (enemyRoll > characterRoll) {
            winner = 'enemy';
            damage = Math.max(1, enemyRoll - characterRoll);
        } else {
            winner = 'tie';
            damage = 0;
        }

        // Calculate new HP
        let newCharacterHp = characterCurrentHp;
        let newEnemyHp = combatState.enemy.currentHp;

        if (winner === 'character') {
            newEnemyHp = Math.max(0, combatState.enemy.currentHp - damage);
        } else if (winner === 'enemy') {
            newCharacterHp = Math.max(0, characterCurrentHp - damage);
            setCharacterCurrentHp(newCharacterHp);
        }

        // Create combat log entry
        const logEntry = {
            characterRoll,
            enemyRoll,
            winner,
            damage
        };

        // Update combat state
        const updatedEnemy = { ...combatState.enemy, currentHp: newEnemyHp };
        const newLog = [...combatState.combatLog, logEntry];

        // Check for combat end
        if (newCharacterHp <= 0) {
            // Defeat
            setCombatState(prev => ({
                ...prev,
                phase: 'defeat',
                enemy: updatedEnemy,
                combatLog: newLog,
                totalXpGained: Math.floor(combatState.enemy.xpReward / 2) // Half XP for trying
            }));
        } else if (newEnemyHp <= 0) {
            // Victory
            setCombatState(prev => ({
                ...prev,
                phase: 'victory',
                enemy: updatedEnemy,
                combatLog: newLog,
                totalXpGained: combatState.enemy.xpReward
            }));
        } else {
            // Combat continues
            setCombatState(prev => ({
                ...prev,
                enemy: updatedEnemy,
                combatLog: newLog
            }));
        }
    };

    // Complete adventure and return to hub
    const handleAdventureComplete = () => {
        const results = {
            victory: combatState.phase === 'victory',
            xpGained: combatState.totalXpGained || 0,
            hpChange: (selectedCharacter.current_hp || selectedCharacter.max_hp || 20) - characterCurrentHp,
            loot: combatState.totalLoot || []
        };

        // Reset combat state
        setCombatState({
            phase: 'selection',
            enemy: null,
            combatLog: [],
            totalXpGained: 0,
            totalLoot: [],
            characterHp: characterCurrentHp
        });

        onAdventureComplete(results);
    };

    if (!selectedCharacter) {
        return (
            <div className="combat-area-loading">
                <p>No character selected for combat</p>
            </div>
        );
    }

    const characterDicePool = getCharacterDicePool();

    return (
        <div className="combat-area">
            {/* Dice container for 3D dice - matches your existing setup */}
            <div id="dice-box"></div>

            {/* Combat UI */}
            <div className="combat-ui">
                {/* Enemy Selection Phase */}
                {combatState.phase === 'selection' && (
                    <div className="pre-combat">
                        <h2>⚔️ Choose Your Enemy</h2>

                        {/* Character Combat Summary */}
                        <div className="character-combat-summary">
                            <h3>{selectedCharacter.name} - Combat Ready</h3>
                            <div className="combat-stats-summary">
                                <div className="stat-item">
                                    <span className="stat-label">Combat Dice:</span>
                                    <span className="stat-value">{characterDicePool.notation}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">HP:</span>
                                    <span className="stat-value">{characterCurrentHp}/{selectedCharacter.max_hp}</span>
                                </div>
                            </div>
                        </div>

                        {/* Enemy Selection Grid */}
                        <div className="enemy-selection">
                            <h3>Available Enemies</h3>
                            <div className="enemy-grid">
                                {enemyTemplates.map(enemy => (
                                    <div key={enemy.id} className="enemy-card">
                                        <h4 className="enemy-name">{enemy.name}</h4>
                                        <div className="enemy-stats">
                                            <span className="enemy-level">Level {enemy.level}</span>
                                            <span className="enemy-hp">HP: {enemy.maxHp}</span>
                                            <span className="enemy-dice">Dice: {enemy.dicePool}</span>
                                        </div>
                                        <p className="enemy-description">{enemy.description}</p>
                                        <div className="enemy-reward">XP Reward: {enemy.xpReward}</div>
                                        <button
                                            onClick={() => startCombat(enemy)}
                                            className="start-combat-btn"
                                        >
                                            Fight {enemy.name}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Active Combat Phase */}
                {combatState.phase === 'active' && combatState.enemy && (
                    <div className="active-combat">
                        <div className="combat-header">
                            <h2>Combat vs {combatState.enemy.name}</h2>
                        </div>

                        <div className="combat-stats">
                            <div className="character-combat-info">
                                <h3>{selectedCharacter.name}</h3>
                                <div className="hp-display">
                                    HP: {characterCurrentHp}/{selectedCharacter.max_hp}
                                </div>
                                <div className="dice-info">
                                    Dice: {characterDicePool.notation}
                                </div>
                            </div>

                            <div className="vs-divider">VS</div>

                            <div className="enemy-combat-info">
                                <h3>{combatState.enemy.name}</h3>
                                <div className="hp-display">
                                    HP: {combatState.enemy.currentHp}/{combatState.enemy.maxHp}
                                </div>
                                <div className="dice-info">
                                    Dice: {combatState.enemy.dicePool}
                                </div>
                            </div>
                        </div>

                        <div className="combat-actions">
                            <button
                                onClick={rollCombatDice}
                                disabled={isRolling}
                                className="roll-dice-btn"
                            >
                                {isRolling ? '🎲 Rolling Dice...' : '🎲 Roll for Attack!'}
                            </button>
                            {isRolling && (
                                <div className="rolling-indicator">
                                    <div className="dice-animation">⚀⚁⚂⚃⚄⚅</div>
                                    <p>Rolling your dice...</p>
                                </div>
                            )}
                        </div>

                        {/* Combat Log */}
                        {combatState.combatLog.length > 0 && (
                            <div className="combat-log">
                                <h4>Combat Log</h4>
                                <div className="log-entries">
                                    {combatState.combatLog.map((entry, index) => (
                                        <div key={index} className="log-entry">
                                            <div className="roll-summary">
                                                <span className="player-roll">You rolled: {entry.characterRoll}</span>
                                                <span className="vs">vs</span>
                                                <span className="enemy-roll">{combatState.enemy.name}: {entry.enemyRoll}</span>
                                            </div>
                                            {entry.winner === 'character' && (
                                                <p className="victory-text">You hit for {entry.damage} damage!</p>
                                            )}
                                            {entry.winner === 'enemy' && (
                                                <p className="damage-text">You took {entry.damage} damage!</p>
                                            )}
                                            {entry.winner === 'tie' && (
                                                <p className="tie-text">Tied! No damage dealt.</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Combat End Phase */}
                {(combatState.phase === 'victory' || combatState.phase === 'defeat') && (
                    <div className="combat-end">
                        {combatState.phase === 'victory' && (
                            <div className="victory">
                                <h3>🎉 Victory!</h3>
                                <p>You defeated the {combatState.enemy?.name}!</p>
                                <p>Gained {combatState.totalXpGained} XP!</p>
                            </div>
                        )}

                        {combatState.phase === 'defeat' && (
                            <div className="defeat">
                                <h3>💀 Defeat!</h3>
                                <p>You were defeated by the {combatState.enemy?.name}!</p>
                                <p>Gained {combatState.totalXpGained} XP for trying!</p>
                            </div>
                        )}

                        <button
                            onClick={handleAdventureComplete}
                            className="complete-adventure-btn"
                        >
                            Complete Adventure
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CombatArea;