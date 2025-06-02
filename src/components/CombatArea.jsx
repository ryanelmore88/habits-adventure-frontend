import { useState, useEffect, useRef } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { useCombat } from '../hooks/useCombat';
import '../styles/CombatArea.css';

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
                    startingHeight: 15,
                    throwForce: 10,
                    spinForce: 8,
                    lightIntensity: 1.2,
                    scale: 25,
                    shadowIntensity: 0.8,
                    // Expand the physics world boundaries
                    worldWidth: window.innerWidth,
                    worldHeight: window.innerHeight,
                    // Make dice spread out more
                    offscreenBuffer: 100,
                    // Increase the "table" size for rolling
                    enableShadows: true,
                    theme: 'default'
                });

                await newDiceBox.init();
                setDiceBox(newDiceBox);

                // Set up dice roll completion callback
                newDiceBox.onRollComplete = (results) => {
                    console.log('Dice roll completed:', results);
                    setIsRolling(false);

                    // Hide dice after a longer delay to enjoy the results
                    setTimeout(() => {
                        newDiceBox.hide();
                    }, 5000); // 5 seconds instead of 3
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

    // Calculate character's dice pool based on best attribute
    const getCharacterDicePool = () => {
        if (!selectedCharacter?.attributes) return { dice: '1d20', bonus: 0, attribute: 'none' };

        let bestBonus = 0;
        let bestAttribute = 'strength';

        Object.entries(selectedCharacter.attributes).forEach(([name, data]) => {
            const total = (data.base || 10) + (data.bonus || 0);
            const bonus = Math.floor((total - 10) / 2);
            if (bonus > bestBonus) {
                bestBonus = bonus;
                bestAttribute = name;
            }
        });

        return {
            dice: `1d20+${bestBonus}`,
            bonus: bestBonus,
            attribute: bestAttribute
        };
    };

    // Roll dice with 3D animation
    const rollDice = async (playerDice, enemyDice) => {
        if (!diceBox || isRolling) return null;

        setIsRolling(true);

        try {
            // Show dice box
            diceBox.show();

            // Roll player dice (blue) with wider spread
            const playerRoll = await diceBox.roll([{
                qty: 1,
                sides: 20,
                modifier: getCharacterDicePool().bonus,
                theme: 'default',
                themeColor: '#3b82f6',
                size: 'large',
                // Throw from left side of screen
                x: window.innerWidth * 0.2,
                y: window.innerHeight * 0.3,
                z: 15
            }]);

            // Longer delay between rolls for better visual effect
            await new Promise(resolve => setTimeout(resolve, 1000));

            const enemyRoll = await diceBox.roll([{
                qty: 1,
                sides: 20,
                modifier: 0,
                theme: 'default',
                themeColor: '#ef4444',
                size: 'large',
                // Throw from right side of screen
                x: window.innerWidth * 0.8,
                y: window.innerHeight * 0.3,
                z: 15
            }]);

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

        const characterDice = getCharacterDicePool();

        // Roll the dice with 3D animation
        const diceResults = await rollDice(characterDice.dice, '1d20');

        if (!diceResults) {
            // Fallback to regular combat if dice fail
            const updatedCharacter = executeRound();
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
            characterDice: characterDice,
            enemyDice: '1d20',
            damage: damage,
            winner: winner,
            diceResults: diceResults
        };

        // Update combat state through the hook
        // Note: You'll need to modify your useCombat hook to accept custom round results
        executeRound(roundResult);
    };

    const handleAdventureComplete = async () => {
        const adventureResults = {
            characterId: selectedCharacter.id,
            hpChange: combatState.totalXpGained > 0 ? 0 : -damage, // Simplified
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

    return (
        <div className="combat-area">
            {/* 3D Dice Container */}
            <div id="combat-dice-container" ref={diceContainerRef} className="dice-container"></div>

            {/* Character Status */}
            <div className="character-status">
                <h3>{selectedCharacter.name}</h3>
                <div className="hp-bar">
                    <div
                        className="hp-fill"
                        style={{
                            width: `${(selectedCharacter.current_hp / selectedCharacter.max_hp) * 100}%`,
                            backgroundColor: selectedCharacter.current_hp > selectedCharacter.max_hp * 0.5 ? '#10b981' :
                                selectedCharacter.current_hp > selectedCharacter.max_hp * 0.2 ? '#f59e0b' : '#ef4444'
                        }}
                    ></div>
                    <span className="hp-text">{selectedCharacter.current_hp}/{selectedCharacter.max_hp} HP</span>
                </div>
                <div className="character-dice-info">
                    <p>Dice Pool: {getCharacterDicePool().dice}</p>
                    <p>Best Attribute: {getCharacterDicePool().attribute.charAt(0).toUpperCase() + getCharacterDicePool().attribute.slice(1)}</p>
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
                            <p>Dice Pool: {combatState.enemy.damageDice}</p>
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
                                        🔵 You: {round.characterRoll} ({round.characterDice.dice})
                                    </span>
                                    <span className="vs">vs</span>
                                    <span className="enemy-roll">
                                        🔴 {combatState.enemy.name}: {round.enemyRoll} ({round.enemyDice})
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