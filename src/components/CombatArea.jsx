
// File: src/components/CombatArea.jsx
// Updated to use character-based dice pool system

import { useState, useEffect, useRef } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { useCombat } from '../hooks/useCombat';
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

    const { combatState, startCombat, executeRound, resetCombat, availableEnemies } = useCombat(selectedCharacter);
    const [diceBox, setDiceBox] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    const [characterCurrentHp, setCharacterCurrentHp] = useState(selectedCharacter?.current_hp || 20);
    const diceContainerRef = useRef(null);
    const diceBoxRef = useRef(null);
    const cleanupTimeoutRef = useRef(null);

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
            // Clear any temporary HP when starting fresh
            clearTemporaryHp();
        }
    }, [selectedCharacter, clearTemporaryHp]);

    // Sync local HP with context whenever it changes
    useEffect(() => {
        if (combatState.phase === 'active' || combatState.phase === 'victory' || combatState.phase === 'defeat') {
            // During combat, update the context with temporary HP
            updateTemporaryHp(characterCurrentHp);
        }
    }, [characterCurrentHp, combatState.phase, updateTemporaryHp]);

    // Initialize dice box
    useEffect(() => {
        let mounted = true;
        let currentDiceBox = null;

        const initDiceBox = async () => {
            try {
                // Clean up any existing dice box first
                if (diceBoxRef.current) {
                    try {
                        if (diceBoxRef.current.clear) {
                            diceBoxRef.current.clear();
                        }
                        if (diceBoxRef.current.destroy) {
                            diceBoxRef.current.destroy();
                        }
                    } catch (e) {
                        console.warn('Error cleaning up previous dice box:', e);
                    }
                    diceBoxRef.current = null;
                }

                // Import DiceBox dynamically
                const { DiceBox } = await import('@3d-dice/dice-box');

                if (!mounted) return;

                // Create new dice box with combat-specific configuration
                currentDiceBox = new DiceBox(
                    "#combat-dice-container",
                    {
                        id: "combat-dice-box",
                        assetPath: "/assets/dice-box/",
                        theme: "default",
                        themeColor: "#1f2937",
                        offscreen: false,
                        scale: 6,
                        gravity: 1,
                        mass: 1,
                        friction: 0.8,
                        restitution: 0.3,
                        angularDamping: 0.4,
                        linearDamping: 0.5
                    }
                );

                if (!mounted) return;

                // Initialize the dice box
                await currentDiceBox.init();

                if (mounted) {
                    diceBoxRef.current = currentDiceBox;
                    setDiceBox(currentDiceBox);
                }

            } catch (error) {
                console.error('Failed to initialize dice box:', error);
                if (mounted) {
                    setDiceBox(null);
                }
            }
        };

        initDiceBox();

        return () => {
            mounted = false;
            if (cleanupTimeoutRef.current) {
                clearTimeout(cleanupTimeoutRef.current);
            }
            if (currentDiceBox) {
                try {
                    if (currentDiceBox.clear) currentDiceBox.clear();
                    if (currentDiceBox.destroy) currentDiceBox.destroy();
                } catch (e) {
                    console.warn('Error during dice box cleanup:', e);
                }
            }
        };
    }, []);

    // Roll dice for both character and enemy
    const rollCombatDice = async () => {
        if (!diceBox || isRolling) return;

        setIsRolling(true);

        try {
            // Clear previous dice
            diceBox.clear();

            // Get character dice pool from the Character class
            const characterDicePool = getCharacterDicePool();
            const enemyNotation = combatState.enemy.dicePool || '2d6';

            console.log('Character dice pool:', characterDicePool);

            // Roll character dice (blue)
            const characterRoll = await diceBox.roll([{
                qty: characterDicePool.diceCount,
                sides: 6,
                themeColor: '#3b82f6'
            }]);

            // Small delay before enemy dice
            await new Promise(resolve => setTimeout(resolve, 200));

            // Roll enemy dice (red)
            const enemyRoll = await diceBox.roll([{
                qty: parseInt(enemyNotation.split('d')[0]) || 2,
                sides: 6,
                themeColor: '#ef4444'
            }]);

            // Calculate totals
            const characterTotal = characterRoll.reduce((sum, die) => sum + die.value, 0) + characterDicePool.bonus;
            const enemyTotal = enemyRoll.reduce((sum, die) => sum + die.value, 0);

            const diceResults = {
                playerTotal: characterTotal,
                enemyTotal: enemyTotal,
                characterRoll: characterRoll,
                enemyRoll: enemyRoll
            };

            processCombatRound(diceResults, characterDicePool);

        } catch (error) {
            console.error('Error rolling dice:', error);
            setIsRolling(false);
        }
    };

    // Process the results of a combat round
    const processCombatRound = (diceResults, characterDicePool) => {
        if (!diceResults) {
            setIsRolling(false);
            return;
        }

        // Wait a bit for dice to settle before processing results
        setTimeout(() => {
            const { playerTotal, enemyTotal } = diceResults;

            let damage = 0;
            let winner = null;

            if (playerTotal > enemyTotal) {
                damage = playerTotal - enemyTotal;
                winner = 'character';
            } else if (enemyTotal > playerTotal) {
                damage = enemyTotal - playerTotal;
                winner = 'enemy';
            } else {
                winner = 'tie';
            }

            // Update character HP locally AND in context
            if (winner === 'enemy') {
                const newHp = Math.max(0, characterCurrentHp - damage);
                setCharacterCurrentHp(newHp);
                // This will trigger the useEffect that updates the context
            }

            const roundResult = {
                characterRoll: playerTotal,
                enemyRoll: enemyTotal,
                characterDice: characterDicePool,
                enemyDice: { dicePool: combatState.enemy.dicePool },
                damage: damage,
                winner: winner,
                diceResults: diceResults,
                newCharacterHp: winner === 'enemy' ? Math.max(0, characterCurrentHp - damage) : characterCurrentHp
            };

            executeRound(roundResult);
            setIsRolling(false);
        }, 1000); // Give dice time to display results
    };

    const handleAdventureComplete = async () => {
        const adventureResults = {
            characterId: selectedCharacter.id,
            hpChange: combatState.totalXpGained > 0 ? 0 : -(selectedCharacter.current_hp - characterCurrentHp),
            xpGained: combatState.totalXpGained,
            loot: combatState.totalLoot,
            victory: combatState.phase === 'victory'
        };

        try {
            // Clear temporary HP since combat is ending
            clearTemporaryHp();

            await onAdventureComplete(adventureResults);
            resetCombat();

            // Reset character HP to match backend
            await refreshCharacter();
        } catch (error) {
            console.error('Failed to complete adventure:', error);
        }
    };

    // Clean up temporary HP when combat ends
    useEffect(() => {
        if (combatState.phase === 'idle') {
            clearTemporaryHp();
        }
    }, [combatState.phase, clearTemporaryHp]);

    if (!selectedCharacter) {
        return (
            <div className="combat-area-loading">
                <h2>No Character Selected</h2>
                <p>Please select a character to enter combat.</p>
            </div>
        );
    }

    // Get character dice pool info for display
    const characterDicePool = getCharacterDicePool();

    return (
        <div className="combat-area">
            {/* 3D Dice Container - Full screen */}
            <div
                id="combat-dice-container"
                ref={diceContainerRef}
                className="dice-container"
                style={{
                    position: 'relative',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 9999,
                    background: isRolling ? 'rgba(0,0,0,0.1)' : 'transparent'
                }}
            />

            {/* Combat UI */}
            <div className="combat-ui">
                {combatState.phase === 'idle' && (
                    <div className="pre-combat">
                        <h2>Choose Your Enemy</h2>

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

                            {/* Dice Pool Breakdown */}
                            <div className="dice-breakdown">
                                <h4>Dice Pool Breakdown:</h4>
                                <div className="breakdown-details">
                                    {characterDicePool.details.map(detail => (
                                        <div key={detail.name} className="breakdown-item">
                                            <span className="attr-name">{detail.name.charAt(0).toUpperCase() + detail.name.slice(1)}:</span>
                                            <span className="attr-contribution">Level {detail.level} ({detail.dice} dice, {detail.bonus >= 0 ? '+' : ''}{detail.bonus} bonus)</span>
                                        </div>
                                    ))}
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

                {(combatState.phase === 'active' || combatState.phase === 'victory' || combatState.phase === 'defeat') && (
                    <div className="active-combat">
                        <div className="combat-header">
                            <h2>Combat vs {combatState.enemy?.name}</h2>
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
                                <h3>{combatState.enemy?.name}</h3>
                                <div className="hp-display">
                                    HP: {combatState.enemy?.currentHp}/{combatState.enemy?.maxHp}
                                </div>
                                <div className="dice-info">
                                    Dice: {combatState.enemy?.dicePool || '2d6'}
                                </div>
                            </div>
                        </div>

                        {combatState.phase === 'active' && (
                            <div className="combat-actions">
                                <button
                                    onClick={rollCombatDice}
                                    disabled={isRolling}
                                    className="roll-dice-btn"
                                >
                                    {isRolling ? 'Rolling...' : 'Roll for Attack!'}
                                </button>
                            </div>
                        )}

                        {/* Combat Log */}
                        {combatState.roundHistory.length > 0 && (
                            <div className="combat-log">
                                <h4>Combat Log</h4>
                                <div className="log-entries">
                                    {combatState.roundHistory.map((round, index) => (
                                        <div key={index} className="log-entry">
                                            <span className="round-number">Round {index + 1}:</span>
                                            <span className="character-roll">You rolled {round.characterRoll}</span>
                                            <span className="enemy-roll">{combatState.enemy.name} rolled {round.enemyRoll}</span>
                                            {round.winner === 'character' && (
                                                <span className="damage-dealt">You deal {round.damage} damage!</span>
                                            )}
                                            {round.winner === 'enemy' && (
                                                <span className="damage-taken">You take {round.damage} damage!</span>
                                            )}
                                            {round.winner === 'tie' && (
                                                <span className="tie">Tie! No damage dealt.</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Combat End */}
                        {(combatState.phase === 'victory' || combatState.phase === 'defeat') && (
                            <div className="combat-end">
                                {combatState.phase === 'victory' && (
                                    <div className="victory">
                                        <h3>Victory!</h3>
                                        <p>You defeated the {combatState.enemy?.name}!</p>
                                        <p>Gained {combatState.totalXpGained} XP</p>
                                        {combatState.totalLoot.length > 0 && (
                                            <p>Found {combatState.totalLoot.length} items!</p>
                                        )}
                                    </div>
                                )}

                                {combatState.phase === 'defeat' && (
                                    <div className="defeat">
                                        <h3>Defeat!</h3>
                                        <p>You were defeated by the {combatState.enemy?.name}!</p>
                                        <p>Gained {combatState.totalXpGained} XP for trying</p>
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
                )}
            </div>
        </div>
    );
};

export default CombatArea;
