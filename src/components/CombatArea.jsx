// src/components/CombatArea.jsx
// This is the component that candles dice rolling as well as the combat logic that also manaage character HP and combat state.
import {useState, useEffect, useRef} from 'react';
import {useCharacter} from '../contexts/CharacterContext';
import {useCombat} from '../hooks/useCombat';
import {useEnemyData} from '../hooks/useEnemyData';
import '../styles/CombatArea.css'; // Import your styles here


const CombatArea = ({onAdventureComplete}) => {
    const {selectedCharacter, refreshCharacter, updateTemporaryHp, clearTemporaryHp} = useCharacter();
    const {combatState, startCombat, executeRound, resetCombat} = useCombat(selectedCharacter);
    const [diceBox, setDiceBox] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    const [characterCurrentHp, setCharacterCurrentHp] = useState(selectedCharacter?.current_hp || 20);
    const diceContainerRef = useRef(null);
    const diceBoxRef = useRef(null);
    const cleanupTimeoutRef = useRef(null);
    // Use the custom hook for enemy data management
    const {availableEnemies, enemyTemplates, loading, error, refreshEnemyData, getEnemyTemplate, hasData} = useEnemyData();


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
        // Reference to the current dice box instance is assigned, after the newDiceBox is created
        // eslint-disable-next-line no-unused-vars
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
                const {default: DiceBox} = await import('@3d-dice/dice-box');

                if (!mounted) return;

                const newDiceBox = new DiceBox('#combat-dice-container', {
                    id: 'combat-dice-canvas',
                    assetPath: '/assets/dice-box/',
                    startingHeight: 20,
                    throwForce: 15,
                    spinForce: 12,
                    lightIntensity: 1.5,
                    scale: 6, // Dice size
                    shadowIntensity: 0.8,
                    // Force the canvas to fill the entire viewport
                    worldWidth: window.innerWidth * 2,
                    worldHeight: window.innerHeight * 2,
                    offscreenBuffer: 0,
                    enableShadows: true,
                    theme: 'default',
                    gravity: 1,
                    settleTimeout: 3000,
                    delay: 0
                });

                await newDiceBox.init();

                if (!mounted) {
                    if (newDiceBox.destroy) {
                        newDiceBox.destroy();
                    }
                    return;
                }

                // DON'T manipulate canvas after offscreen transfer - just set container size
                const container = document.getElementById('combat-dice-container');
                if (container) {
                    container.style.width = '100vw';
                    container.style.height = '100vh';
                    container.style.position = 'fixed';
                    container.style.top = '0';
                    container.style.left = '0';
                    container.style.zIndex = '1000';
                }

                currentDiceBox = newDiceBox;
                diceBoxRef.current = newDiceBox;
                setDiceBox(newDiceBox);

                // Set up dice roll completion callback
                newDiceBox.onRollComplete = (results) => {
                    console.log('Dice roll completed:', results);

                    // Clear dice after a delay
                    if (cleanupTimeoutRef.current) {
                        clearTimeout(cleanupTimeoutRef.current);
                    }

                    cleanupTimeoutRef.current = setTimeout(() => {
                        if (mounted && diceBoxRef.current) {
                            try {
                                diceBoxRef.current.clear();
                                diceBoxRef.current.hide();
                            } catch (e) {
                                console.warn('Error clearing dice:', e);
                            }
                        }
                        // Set rolling to false after cleanup
                        setIsRolling(false);
                    }, 3000);
                };

            } catch (error) {
                console.error('Failed to initialize dice box:', error);
            }
        };

        initDiceBox();

        return () => {
            mounted = false;

            // Clear any pending timeouts
            if (cleanupTimeoutRef.current) {
                clearTimeout(cleanupTimeoutRef.current);
            }

            // Clean up dice box
            if (diceBoxRef.current) {
                try {
                    if (diceBoxRef.current.clear) {
                        diceBoxRef.current.clear();
                    }
                    if (diceBoxRef.current.hide) {
                        diceBoxRef.current.hide();
                    }
                    if (diceBoxRef.current.destroy) {
                        diceBoxRef.current.destroy();
                    }
                } catch (e) {
                    console.warn('Error destroying dice box:', e);
                }
                diceBoxRef.current = null;
            }
        };
    }, []);

    // Calculate character's dice pool based on attributes
    const getCharacterDicePool = () => {
        if (!selectedCharacter?.attributes) {
            return {
                dicePool: '1d4',
                totalDice: 1,
                description: 'Default (no attributes found)'
            };
        }

        const attributeNames = ['strength', 'dexterity', 'intelligence', 'wisdom', 'charisma'];
        const breakdown = {};
        let totalDice = 0;

        attributeNames.forEach(attrName => {
            const attribute = selectedCharacter.attributes[attrName];
            if (attribute) {
                const score = attribute.base || 10;
                const diceCount = Math.max(1, Math.floor((score - 8) / 3));
                breakdown[attrName] = diceCount;
                totalDice += diceCount;
            }
        });

        return {
            dicePool: `${totalDice}d4`,
            totalDice,
            breakdown,
            description: `${totalDice} dice from: ${Object.entries(breakdown).map(([attr, count]) => `${attr.slice(0, 3)}(${count})`).join(', ')}`
        };
    };

    // Roll dice with improved performance
    const rollDice = async (playerDiceInfo, enemyDicePool) => {
        if (!diceBox || !diceBoxRef.current || isRolling) {
            console.warn('Cannot roll - dice not ready or already rolling');
            return null;
        }

        // Prevent multiple rolls
        setIsRolling(true);

        // Clear any pending cleanup timeout
        if (cleanupTimeoutRef.current) {
            clearTimeout(cleanupTimeoutRef.current);
            cleanupTimeoutRef.current = null;
        }

        // Clear any existing dice before rolling
        try {
            await diceBoxRef.current.hide();
            await diceBoxRef.current.clear();
            // Small delay to ensure cleanup
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (e) {
            console.warn('Error clearing dice before roll:', e);
        }

        try {
            await diceBoxRef.current.show();

            // Parse dice pools
            const playerDiceCount = playerDiceInfo.totalDice || 1;
            const enemyDiceMatch = enemyDicePool.match(/(\d+)d(\d+)/);
            const enemyDiceCount = enemyDiceMatch ? parseInt(enemyDiceMatch[1]) : 1;
            const enemyDiceSize = enemyDiceMatch ? parseInt(enemyDiceMatch[2]) : 4;

            // Create individual dice objects for both player and enemy
            const allDice = [];

            // Player dice (blue)
            for (let i = 0; i < playerDiceCount; i++) {
                allDice.push({
                    qty: 1,
                    sides: 4,
                    themeColor: '#3b82f6'
                });
            }

            // Enemy dice (red)
            for (let i = 0; i < enemyDiceCount; i++) {
                allDice.push({
                    qty: 1,
                    sides: enemyDiceSize,
                    themeColor: '#ef4444'
                });
            }

            console.log('Rolling dice:', {playerDiceCount, enemyDiceCount, enemyDiceSize, totalDice: allDice.length});

            // Roll all dice at once
            const allRolls = await diceBoxRef.current.roll(allDice);

            console.log('Roll results:', allRolls);

            // Split results between player and enemy
            const playerRolls = allRolls.slice(0, playerDiceCount);
            const enemyRolls = allRolls.slice(playerDiceCount);

            const playerTotal = playerRolls.reduce((sum, die) => sum + (die.value || 0), 0);
            const enemyTotal = enemyRolls.reduce((sum, die) => sum + (die.value || 0), 0);

            console.log('Totals:', {playerTotal, enemyTotal, playerRolls, enemyRolls});

            // Return results immediately - isRolling will be set to false by onRollComplete
            return {
                playerTotal,
                enemyTotal,
                playerRolls,
                enemyRolls
            };

        } catch (error) {
            console.error('Error rolling dice:', error);
            // Reset rolling state on error
            setIsRolling(false);
            return null;
        }
    };

    // Enhanced combat round with local HP tracking
    const handleCombatRound = async () => {
        if (isRolling || combatState.phase !== 'active') {
            console.log('Cannot start combat round - rolling:', isRolling, 'phase:', combatState.phase);
            return;
        }

        const characterDiceInfo = getCharacterDicePool();

        // Roll the dice
        const diceResults = await rollDice(characterDiceInfo, combatState.enemy.dicePool);

        if (!diceResults) {
            // Fallback if dice roll fails
            console.warn('Dice roll failed, using fallback');
            setIsRolling(false);
            return;
        }

        // Wait a bit for dice to settle before processing results
        setTimeout(() => {
            const {playerTotal, enemyTotal} = diceResults;

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
            }

            const roundResult = {
                characterRoll: playerTotal,
                enemyRoll: enemyTotal,
                characterDice: characterDiceInfo,
                enemyDice: {dicePool: combatState.enemy.dicePool},
                damage: damage,
                winner: winner,
                diceResults: diceResults,
                newCharacterHp: winner === 'enemy' ? Math.max(0, characterCurrentHp - damage) : characterCurrentHp
            };

            executeRound(roundResult);
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
                    background: isRolling ? 'rgba(0, 0, 0, 0.3)' : 'transparent'
                }}
            ></div>

            {/* Removed to use the CharacterStatusWithImage component */}
            {/* Character Status */}
            {/*<div className="character-status">*/}
            {/*    <h3>{selectedCharacter.name}</h3>*/}
            {/*    <div className="hp-bar">*/}
            {/*        <div*/}
            {/*            className="hp-fill"*/}
            {/*            style={{*/}
            {/*                width: `${(characterCurrentHp / (selectedCharacter.max_hp || 20)) * 100}%`,*/}
            {/*                backgroundColor: characterCurrentHp > (selectedCharacter.max_hp || 20) * 0.5 ? '#10b981' :*/}
            {/*                    characterCurrentHp > (selectedCharacter.max_hp || 20) * 0.2 ? '#f59e0b' : '#ef4444'*/}
            {/*            }}*/}
            {/*        ></div>*/}
            {/*        <span className="hp-text">{characterCurrentHp}/{selectedCharacter.max_hp || 20} HP</span>*/}
            {/*    </div>*/}
            {/*    <div className="character-dice-info">*/}
            {/*        <p><strong>Dice Pool:</strong> {characterDiceInfo.dicePool}</p>*/}
            {/*        <p><strong>Breakdown:</strong> {characterDiceInfo.description}</p>*/}
            {/*    </div>*/}
            {/*</div>*/}

            {/* Enemy Selection */}
            {combatState.phase === 'selection' && (
                <div className="enemy-selection">
                    <h3>⚔️ Skirmish Combat</h3>
                    <h3>Choose your opponent:</h3>
                    <div className="enemy-buttons">
                        {availableEnemies.map(enemyType => (
                            <button
                                key={enemyType}
                                onClick={() => startCombat(enemyType)}
                                className="enemy-button"
                            >
                                <div
                                    className="enemy-name">{enemyType.charAt(0).toUpperCase() + enemyType.slice(1)}</div>
                                <div className="enemy-details">
                                    Level {enemyType === 'goblin' || enemyType === 'skeleton' ? 1 :
                                    enemyType === 'orc' ? 2 : 5}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Combat */}
            {combatState.phase === 'active' && combatState.enemy && (
                <div className="active-combat">
                    <div className="enemy-status">
                        <h3>{combatState.enemy.name}</h3>
                        <div className="hp-bar">
                            <div
                                className="hp-fill enemy-hp"
                                style={{
                                    width: `${(combatState.enemy.currentHp / combatState.enemy.maxHp) * 100}%`
                                }}
                            ></div>
                            <span className="hp-text">{combatState.enemy.currentHp}/{combatState.enemy.maxHp} HP</span>
                        </div>
                        <div className="enemy-dice-info">
                            <p><strong>Dice Pool:</strong> {combatState.enemy.dicePool}</p>
                        </div>
                    </div>

                    <div className="combat-controls">
                        <button
                            onClick={handleCombatRound}
                            className="attack-button"
                            disabled={isRolling}
                        >
                            {isRolling ? '🎲 Rolling Dice...' : '🎲 Roll for Combat!'}
                        </button>

                        {isRolling && (
                            <p className="rolling-text">Watch the dice fly!</p>
                        )}
                    </div>

                    <div className="combat-log">
                        <h4>Combat Log</h4>
                        {combatState.combatLog.map((round, index) => (
                            <div key={index} className="combat-round">
                                <div className="roll-summary">
                                    <span className="player-roll">
                                        🔵 You: {round.characterRoll} ({round.characterDice?.dicePool || 'unknown'})
                                    </span>
                                    <span className="vs">vs</span>
                                    <span className="enemy-roll">
                                        🔴 {combatState.enemy.name}: {round.enemyRoll} ({round.enemyDice?.dicePool || 'unknown'})
                                    </span>
                                </div>

                                {round.winner === 'character' && (
                                    <p className="victory-text">💥 You deal {round.damage} damage!</p>
                                )}
                                {round.winner === 'enemy' && (
                                    <p className="damage-text">🩸 You take {round.damage} damage!</p>
                                )}
                                {round.winner === 'tie' && (
                                    <p className="tie-text">⚔️ It's a tie! No damage dealt.</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Victory Screen */}
            {combatState.phase === 'victory' && (
                <div className="victory-screen">
                    <h2>🎉 Victory!</h2>
                    <p>You defeated the {combatState.enemy.name}!</p>
                    <p><strong>XP Gained:</strong> {combatState.totalXpGained}</p>
                    {combatState.totalLoot.length > 0 && (
                        <div className="loot">
                            <h4>Loot Found:</h4>
                            {combatState.totalLoot.map(item => (
                                <p key={item.id}>{item.quantity}x {item.type}</p>
                            ))}
                        </div>
                    )}
                    <button onClick={handleAdventureComplete} className="complete-button">
                        Complete Adventure
                    </button>
                </div>
            )}

            {/* Defeat Screen */}
            {combatState.phase === 'defeat' && (
                <div className="defeat-screen">
                    <h2>💀 Defeat...</h2>
                    <p>You have been slain by the {combatState.enemy.name}!</p>
                    <p>Don't worry, you can heal up and try again.</p>
                    <button onClick={handleAdventureComplete} className="complete-button">
                        Return to Town
                    </button>
                </div>
            )}
        </div>
    );
};

export default CombatArea;