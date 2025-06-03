// src/components/CombatArea.jsx

import { useState, useEffect, useRef } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { useCombat } from '../hooks/useCombat';

const CombatArea = ({ onAdventureComplete }) => {
    const { selectedCharacter } = useCharacter();
    const { combatState, startCombat, executeRound, resetCombat, availableEnemies } = useCombat(selectedCharacter);
    const [diceBox, setDiceBox] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    const diceContainerRef = useRef(null);

    // Initialize dice box
    useEffect(() => {
        const initDiceBox = async () => {
            try {
                // Import DiceBox dynamically
                const { default: DiceBox } = await import('@3d-dice/dice-box');

                const newDiceBox = new DiceBox('#combat-dice-container', {
                    id: 'combat-dice-canvas',
                    assetPath: '/assets/dice-box/',
                    startingHeight: 25,
                    throwForce: 15,
                    spinForce: 12,
                    lightIntensity: 1.5,
                    scale: 18, // Good size as requested
                    shadowIntensity: 0.8,
                    // Force the canvas to fill the entire viewport
                    worldWidth: window.innerWidth * 2,
                    worldHeight: window.innerHeight * 2,
                    offscreenBuffer: 300,
                    enableShadows: true,
                    theme: 'default',
                    gravity: 1,
                    settleTimeout: 5000,
                    delay: 0
                });

                await newDiceBox.init();

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

                setDiceBox(newDiceBox);

                // Set up dice roll completion callback
                newDiceBox.onRollComplete = (results) => {
                    console.log('Dice roll completed:', results);
                    setIsRolling(false);

                    // Hide dice after a longer delay to enjoy the results
                    setTimeout(() => {
                        newDiceBox.hide();
                    }, 5000);
                };

            } catch (error) {
                console.error('Failed to initialize dice box:', error);
            }
        };

        initDiceBox();

        return () => {
            if (diceBox) {
                diceBox.destroy?.();
            }
        };
    }, []);

    // Calculate character's dice pool based on attributes (excluding constitution)
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

        // Calculate dice per attribute based on base score
        attributeNames.forEach(attrName => {
            const attribute = selectedCharacter.attributes[attrName];
            if (attribute) {
                const score = attribute.base || 10;
                // Every 3 points above 8 gives 1d4, minimum 1d4
                const diceCount = Math.max(1, Math.floor((score - 8) / 3));
                breakdown[attrName] = diceCount;
                totalDice += diceCount;
            }
        });

        return {
            dicePool: `${totalDice}d4`,
            totalDice,
            breakdown,
            description: `${totalDice} dice from: ${Object.entries(breakdown).map(([attr, count]) => `${attr.slice(0,3)}(${count})`).join(', ')}`
        };
    };

    // Roll dice with 3D animation - BOTH ROLL AT SAME TIME
    const rollDice = async (playerDiceInfo, enemyDicePool) => {
        if (!diceBox || isRolling) return null;

        setIsRolling(true);

        try {
            // Show dice box
            diceBox.show();

            // Prepare player dice - create individual dice objects
            const playerDiceCount = playerDiceInfo.totalDice || 1;
            const playerDice = [];
            for (let i = 0; i < playerDiceCount; i++) {
                playerDice.push({
                    qty: 1,
                    sides: 4,
                    theme: 'default',
                    themeColor: '#3b82f6',
                    size: 'large',
                    // Spread dice across the left side of screen
                    x: (window.innerWidth * 0.1) + (i * 60),
                    y: window.innerHeight * 0.2,
                    z: 20
                });
            }

            // Prepare enemy dice
            const enemyDiceMatch = enemyDicePool.match(/(\d+)d(\d+)/);
            const enemyDiceCount = enemyDiceMatch ? parseInt(enemyDiceMatch[1]) : 1;
            const enemyDiceSize = enemyDiceMatch ? parseInt(enemyDiceMatch[2]) : 4;

            const enemyDice = [];
            for (let i = 0; i < enemyDiceCount; i++) {
                enemyDice.push({
                    qty: 1,
                    sides: enemyDiceSize,
                    theme: 'default',
                    themeColor: '#ef4444',
                    size: 'large',
                    // Spread dice across the right side of screen
                    x: (window.innerWidth * 0.7) + (i * 60),
                    y: window.innerHeight * 0.2,
                    z: 20
                });
            }

            // Roll all dice simultaneously - flatten the arrays
            const allDice = [...playerDice, ...enemyDice];
            console.log('Rolling dice:', allDice); // Debug log

            const allRolls = await diceBox.roll(allDice);
            console.log('Roll results:', allRolls); // Debug log

            // Split results back into player and enemy
            const playerRoll = allRolls.slice(0, playerDiceCount);
            const enemyRoll = allRolls.slice(playerDiceCount);

            return {
                playerTotal: playerRoll.reduce((sum, die) => sum + die.value, 0),
                enemyTotal: enemyRoll.reduce((sum, die) => sum + die.value, 0),
                playerRolls: playerRoll,
                enemyRolls: enemyRoll
            };

        } catch (error) {
            console.error('Error rolling dice:', error);
            setIsRolling(false);
            return null;
        }
    };

    // Roll dice with 3D animation - BOTH ROLL AT SAME TIME (Alternative approach)
    const rollDiceAlternative = async (playerDiceInfo, enemyDicePool) => {
        if (!diceBox || isRolling) return null;

        setIsRolling(true);

        try {
            // Show dice box
            diceBox.show();

            // Create dice notation strings instead of individual objects
            const playerDiceCount = playerDiceInfo.totalDice || 1;
            const playerNotation = `${playerDiceCount}d4`;

            const enemyDiceMatch = enemyDicePool.match(/(\d+)d(\d+)/);
            const enemyDiceCount = enemyDiceMatch ? parseInt(enemyDiceMatch[1]) : 1;
            const enemyDiceSize = enemyDiceMatch ? parseInt(enemyDiceMatch[2]) : 4;
            const enemyNotation = `${enemyDiceCount}d${enemyDiceSize}`;

            // Roll player and enemy dice with minimal delay
            const playerRollPromise = diceBox.roll(playerNotation, { themeColor: '#3b82f6' });

            // Very short delay to make them appear almost simultaneous
            setTimeout(() => {
                diceBox.roll(enemyNotation, { themeColor: '#ef4444' });
            }, 50);

            const playerRoll = await playerRollPromise;

            // Wait a bit for enemy roll to complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            // For now, simulate enemy roll results
            const enemyRoll = [];
            for (let i = 0; i < enemyDiceCount; i++) {
                enemyRoll.push({
                    value: Math.floor(Math.random() * enemyDiceSize) + 1
                });
            }

            return {
                playerTotal: playerRoll.reduce((sum, die) => sum + die.value, 0),
                enemyTotal: enemyRoll.reduce((sum, die) => sum + die.value, 0),
                playerRolls: playerRoll,
                enemyRolls: enemyRoll
            };

        } catch (error) {
            console.error('Error rolling dice:', error);
            setIsRolling(false);
            return null;
        }
    };

    // Enhanced combat round with dice rolling
    const handleCombatRound = async () => {
        if (isRolling || combatState.phase !== 'active') return;

        const characterDiceInfo = getCharacterDicePool();

        // Roll the dice with 3D animation
        const diceResults = await rollDice(characterDiceInfo, combatState.enemy.dicePool);

        if (!diceResults) {
            // Try alternative method if the first one fails
            const alternativeResults = await rollDiceAlternative(characterDiceInfo, combatState.enemy.dicePool);
            if (!alternativeResults) {
                // Fallback to regular combat if both dice methods fail
                const updatedCharacter = executeRound();
                return;
            }
            // Use alternative results
            const { playerTotal, enemyTotal } = alternativeResults;

            // Process combat results (rest of the function remains the same)
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

            const roundResult = {
                characterRoll: playerTotal,
                enemyRoll: enemyTotal,
                characterDice: characterDiceInfo,
                enemyDice: { dicePool: combatState.enemy.dicePool },
                damage: damage,
                winner: winner,
                diceResults: alternativeResults
            };

            executeRound(roundResult);
            return;
        }

        // Process combat results
        const { playerTotal, enemyTotal } = diceResults;

        // Determine winner and damage
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

        // Create combat round result
        const roundResult = {
            characterRoll: playerTotal,
            enemyRoll: enemyTotal,
            characterDice: characterDiceInfo,
            enemyDice: { dicePool: combatState.enemy.dicePool },
            damage: damage,
            winner: winner,
            diceResults: diceResults
        };

        // Update combat state through the hook
        executeRound(roundResult);
    };

    const handleAdventureComplete = async () => {
        const adventureResults = {
            characterId: selectedCharacter.id,
            hpChange: combatState.totalXpGained > 0 ? 0 : -combatState.damage || 0,
            xpGained: combatState.totalXpGained,
            loot: combatState.totalLoot,
            victory: combatState.phase === 'victory'
        };

        try {
            await onAdventureComplete(adventureResults);
            resetCombat();
        } catch (error) {
            console.error('Failed to complete adventure:', error);
        }
    };

    if (!selectedCharacter) {
        return (
            <div className="combat-area-loading">
                <h2>No Character Selected</h2>
                <p>Please select a character to enter combat.</p>
            </div>
        );
    }

    const characterDiceInfo = getCharacterDicePool();

    return (
        <div className="combat-area">
            {/* 3D Dice Container - Full screen */}
            <div
                id="combat-dice-container"
                ref={diceContainerRef}
                className="dice-container"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    pointerEvents: 'none',
                    zIndex: 1000,
                    background: isRolling ? 'rgba(0, 0, 0, 0.3)' : 'transparent'
                }}
            ></div>

            {/* Character Status */}
            <div className="character-status">
                <h3>{selectedCharacter.name}</h3>
                <div className="hp-bar">
                    <div
                        className="hp-fill"
                        style={{
                            width: `${((selectedCharacter.current_hp || 0) / (selectedCharacter.max_hp || 20)) * 100}%`,
                            backgroundColor: (selectedCharacter.current_hp || 0) > (selectedCharacter.max_hp || 20) * 0.5 ? '#10b981' :
                                (selectedCharacter.current_hp || 0) > (selectedCharacter.max_hp || 20) * 0.2 ? '#f59e0b' : '#ef4444'
                        }}
                    ></div>
                    <span className="hp-text">{selectedCharacter.current_hp || 0}/{selectedCharacter.max_hp || 20} HP</span>
                </div>
                <div className="character-dice-info">
                    <p><strong>Dice Pool:</strong> {characterDiceInfo.dicePool}</p>
                    <p><strong>Breakdown:</strong> {characterDiceInfo.description}</p>
                </div>
            </div>

            {/* Enemy Selection */}
            {combatState.phase === 'selection' && (
                <div className="enemy-selection">
                    <h3>Choose your opponent:</h3>
                    <div className="enemy-buttons">
                        {availableEnemies.map(enemyType => (
                            <button
                                key={enemyType}
                                onClick={() => startCombat(enemyType)}
                                className="enemy-button"
                            >
                                <div className="enemy-name">{enemyType.charAt(0).toUpperCase() + enemyType.slice(1)}</div>
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