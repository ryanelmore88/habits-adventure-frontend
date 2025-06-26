// File: src/components/CombatArea.jsx
// CombatArea with your original working 3D dice functionality restored

import { useState, useEffect, useRef } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { useCombat } from '../hooks/useCombat';
import { useEnemyData } from '../hooks/useEnemyData';
import '../styles/CombatArea.css';

const CombatArea = ({
                        onAdventureComplete,
                        enemyType = null,
                        questContext = null
                    }) => {
    const { selectedCharacter, updateTemporaryHp, clearTemporaryHp } = useCharacter();

    // Get enemy data from backend
    const {
        availableEnemies,
        enemyTemplates,
        loading: enemyLoading,
        error: enemyError,
        refreshEnemyData,
        getEnemyTemplate,
        hasData
    } = useEnemyData();

    // Pass enemy templates to useCombat
    const {
        combatState,
        startCombat,
        executeRound,
        resetCombat,
        getCharacterDiceInfo,
        getEnemyDiceInfo,
        isUsingExternalEnemies
    } = useCombat(selectedCharacter, enemyTemplates);

    // 3D Dice state - exactly as in your working version
    const [diceBox, setDiceBox] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    const [characterCurrentHp, setCharacterCurrentHp] = useState(selectedCharacter?.current_hp || 20);
    const [questCombatInitialized, setQuestCombatInitialized] = useState(false);
    const [showDiceBorder, setShowDiceBorder] = useState(false); // Toggle for visible border
    const diceBoxRef = useRef(null);
    const cleanupTimeoutRef = useRef(null);

    // Quest combat logic
    const isQuestCombat = questContext?.isQuestCombat || false;
    const predeterminedEnemy = enemyType;

    // Auto-start combat in quest mode
    useEffect(() => {
        if (isQuestCombat && predeterminedEnemy && !questCombatInitialized && combatState.phase === 'selection') {
            console.log(`Quest combat: Auto-starting combat with ${predeterminedEnemy}`);
            startCombat(predeterminedEnemy);
            setQuestCombatInitialized(true);
        }
    }, [isQuestCombat, predeterminedEnemy, questCombatInitialized, combatState.phase, startCombat]);

    // Character HP management
    useEffect(() => {
        if (selectedCharacter) {
            const newHp = selectedCharacter.current_hp || selectedCharacter.max_hp || 20;
            setCharacterCurrentHp(newHp);
            clearTemporaryHp();
        }
    }, [selectedCharacter, clearTemporaryHp]);

    useEffect(() => {
        if (combatState.phase === 'active' || combatState.phase === 'victory' || combatState.phase === 'defeat') {
            updateTemporaryHp(characterCurrentHp);
        }
    }, [characterCurrentHp, combatState.phase, updateTemporaryHp]);

    // 3D DICE INITIALIZATION - Your exact working version
    useEffect(() => {
        let mounted = true;
        let currentDiceBox = null;

        const initDiceBox = async () => {
            try {
                // Clean up existing dice box
                if (diceBoxRef.current) {
                    try {
                        if (diceBoxRef.current.clear) {
                            diceBoxRef.current.clear();
                        }
                    } catch (error) {
                        console.warn('Error cleaning up previous dice box:', error);
                    }
                    diceBoxRef.current = null;
                }

                if (cleanupTimeoutRef.current) {
                    clearTimeout(cleanupTimeoutRef.current);
                    cleanupTimeoutRef.current = null;
                }

                if (mounted) {
                    // Import DiceBox correctly - it's the default export
                    const DiceBoxModule = await import('@3d-dice/dice-box');
                    const DiceBox = DiceBoxModule.default || DiceBoxModule;

                    // Mobile-optimized configuration with boundaries
                    currentDiceBox = new DiceBox('#dice-box', {
                        id: 'dice-canvas',
                        assetPath: '/assets/dice-box/',
                        startingHeight: 8,
                        throwForce: 6,
                        spinForce: 5,
                        lightIntensity: 0.9,
                        scale: 6,           // Good size for mobile
                        gravity: 1,         // Reasonable gravity
                        mass: 1,
                        friction: 0.8,      // Good bouncing
                        restitution: 0.3,   // Not too bouncy
                        shadowIntensity: 0.6,
                        enableShadows: true,
                        // Mobile performance optimizations
                        shadowQuality: 'medium',
                        lightingQuality: 'medium',

                        // BOUNDARY SETTINGS - Keep dice on screen
                        bounds: {
                            x: { min: 20, max: window.innerWidth - 20 },
                            y: { min: 20, max: window.innerHeight - 20 },
                            z: { min: -10, max: 50 }
                        },

                        // Physics boundaries
                        world: {
                            width: window.innerWidth - 40,
                            height: window.innerHeight - 40,
                            depth: 60
                        }
                    });

                    await currentDiceBox.init();

                    if (mounted) {
                        diceBoxRef.current = currentDiceBox;
                        setDiceBox(currentDiceBox);
                        console.log('3D Dice box initialized successfully');

                        // Your working onRollComplete handler
                        currentDiceBox.onRollComplete = (results) => {
                            console.log('3D Dice roll completed:', results);
                            setIsRolling(false);

                            // Remove border when rolling completes
                            const diceBoxElement = document.getElementById('dice-box');
                            if (diceBoxElement) {
                                diceBoxElement.classList.remove('rolling-border');
                            }

                            // Auto-clear after 4 seconds
                            cleanupTimeoutRef.current = setTimeout(() => {
                                if (diceBoxRef.current && mounted) {
                                    try {
                                        diceBoxRef.current.clear();
                                    } catch (error) {
                                        console.warn('Error clearing dice:', error);
                                    }
                                }
                            }, 4000);
                        };
                    }
                }
            } catch (error) {
                console.error('Error initializing 3D dice box:', error);
                if (mounted) {
                    setDiceBox(null);
                }
            }
        };

        initDiceBox();

        return () => {
            mounted = false;
            if (currentDiceBox) {
                try {
                    if (currentDiceBox.clear) {
                        currentDiceBox.clear();
                    }
                } catch (error) {
                    console.warn('Error cleaning up dice box:', error);
                }
            }
            if (cleanupTimeoutRef.current) {
                clearTimeout(cleanupTimeoutRef.current);
            }
        };
    }, []);

    // CHARACTER DICE POOL - Your exact implementation
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

    // 3D DICE ROLLING - Your exact working implementation
    const rollDice = async (playerDiceInfo, enemyDicePool) => {
        if (!diceBox || !diceBoxRef.current || isRolling) {
            console.warn('Cannot roll - dice not ready or already rolling');
            return null;
        }

        setIsRolling(true);

        // Clear any pending cleanup
        if (cleanupTimeoutRef.current) {
            clearTimeout(cleanupTimeoutRef.current);
            cleanupTimeoutRef.current = null;
        }

        // Clear existing dice before rolling
        try {
            await diceBoxRef.current.hide();
            await diceBoxRef.current.clear();
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (e) {
            console.warn('Error clearing dice before roll:', e);
        }

        try {
            await diceBoxRef.current.show();

            // Add border when rolling starts (optional visual feedback)
            const diceBoxElement = document.getElementById('dice-box');
            if (diceBoxElement && showDiceBorder) {
                diceBoxElement.classList.add('rolling-border');
            }

            // Parse dice pools - YOUR EXACT LOGIC
            const playerDiceCount = playerDiceInfo.totalDice || 1;
            const enemyDiceMatch = enemyDicePool.match(/(\d+)d(\d+)/);
            const enemyDiceCount = enemyDiceMatch ? parseInt(enemyDiceMatch[1]) : 1;
            const enemyDiceSize = enemyDiceMatch ? parseInt(enemyDiceMatch[2]) : 4;

            // Create individual dice objects - YOUR EXACT FORMAT
            const allDice = [];

            // Player dice (blue) - YOUR EXACT IMPLEMENTATION
            for (let i = 0; i < playerDiceCount; i++) {
                allDice.push({
                    qty: 1,
                    sides: 4,
                    themeColor: '#3b82f6'  // Blue for player
                });
            }

            // Enemy dice (red) - YOUR EXACT IMPLEMENTATION
            for (let i = 0; i < enemyDiceCount; i++) {
                allDice.push({
                    qty: 1,
                    sides: enemyDiceSize,
                    themeColor: '#ef4444'  // Red for enemy
                });
            }

            console.log('Rolling 3D dice:', {playerDiceCount, enemyDiceCount, enemyDiceSize, totalDice: allDice.length});

            // Roll all dice at once - YOUR EXACT CALL
            const allRolls = await diceBoxRef.current.roll(allDice);

            console.log('3D Roll results:', allRolls);

            // Split results between player and enemy - YOUR EXACT LOGIC
            const playerRolls = allRolls.slice(0, playerDiceCount);
            const enemyRolls = allRolls.slice(playerDiceCount);

            const playerTotal = playerRolls.reduce((sum, die) => sum + (die.value || 0), 0);
            const enemyTotal = enemyRolls.reduce((sum, die) => sum + (die.value || 0), 0);

            console.log('3D Dice totals:', {playerTotal, enemyTotal, playerRolls, enemyRolls});

            return {
                playerTotal,
                enemyTotal,
                playerRolls,
                enemyRolls
            };

        } catch (error) {
            console.error('Error rolling 3D dice:', error);
            setIsRolling(false);
            return null;
        }
    };

    // COMBAT ROUND HANDLER - Updated to use your dice system
    const handleCombatRound = async () => {
        if (isRolling || combatState.phase !== 'active') {
            console.log('Cannot start combat round - rolling:', isRolling, 'phase:', combatState.phase);
            return;
        }

        const characterDiceInfo = getCharacterDicePool();

        // Roll the 3D dice
        const diceResults = await rollDice(characterDiceInfo, combatState.enemy.dicePool);

        if (!diceResults) {
            // Fallback if 3D dice fails
            console.warn('3D dice roll failed, using fallback');
            const fallbackResult = executeRound();
            if (fallbackResult !== undefined) {
                setCharacterCurrentHp(fallbackResult);
            }
            return;
        }

        // Process dice results
        let winner, damage, description;
        const { playerTotal, enemyTotal } = diceResults;

        if (playerTotal > enemyTotal) {
            winner = 'character';
            damage = Math.max(1, playerTotal - enemyTotal);
            description = `You rolled ${playerTotal}, ${combatState.enemy.name} rolled ${enemyTotal}. You deal ${damage} damage!`;
        } else if (enemyTotal > playerTotal) {
            winner = 'enemy';
            damage = Math.max(1, enemyTotal - playerTotal);
            description = `${combatState.enemy.name} rolled ${enemyTotal}, you rolled ${playerTotal}. You take ${damage} damage!`;
        } else {
            winner = 'tie';
            damage = 0;
            description = `Both rolled ${playerTotal}. No damage dealt this round.`;
        }

        // Create custom result for executeRound
        const customRoundResult = {
            winner,
            damage,
            description,
            characterRoll: playerTotal,
            enemyRoll: enemyTotal,
            characterDice: characterDiceInfo,
            enemyDice: { dicePool: combatState.enemy.dicePool }
        };

        // Use useCombat's executeRound with our 3D dice result
        const newCharacterHp = executeRound(customRoundResult);
        if (newCharacterHp !== undefined) {
            setCharacterCurrentHp(newCharacterHp);
        }
    };

    // Combat completion handler
    const handleCombatComplete = (results) => {
        if (isQuestCombat && onAdventureComplete) {
            onAdventureComplete({
                victory: combatState.phase === 'victory',
                defeat: combatState.phase === 'defeat',
                hpChange: (selectedCharacter?.max_hp || 20) - characterCurrentHp,
                xpGained: combatState.totalXpGained,
                loot: combatState.totalLoot,
                questContext: questContext
            });
        } else if (onAdventureComplete) {
            onAdventureComplete(results);
        }
    };

    // Character validation
    if (!selectedCharacter) {
        return (
            <div className="combat-area-loading">
                <h3>⚠️ No Character Selected</h3>
                <p>Please select a character to begin combat.</p>
            </div>
        );
    }

    // Loading states
    if (isQuestCombat && enemyLoading) {
        return (
            <div className="combat-area-loading">
                <h3>⚔️ Preparing for Battle...</h3>
                <p>Loading enemy data for {predeterminedEnemy}...</p>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!isQuestCombat && enemyLoading) {
        return (
            <div className="combat-area-loading">
                <h3>🏹 Loading Combat Arena...</h3>
                <p>Fetching enemies from the backend...</p>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="combat-area">
            {/* CRITICAL: 3D Dice Box Element - MUST be present for dice to render */}
            <div id="dice-box"></div>

            {/* Quest Combat Header */}
            {isQuestCombat && questContext && (
                <div className="quest-combat-header">
                    <h3>🏛️ {questContext.questTitle}</h3>
                    <h4>📍 {questContext.roomTitle}</h4>
                    {predeterminedEnemy && (
                        <p className="enemy-encounter">
                            You must face: <strong>{getEnemyTemplate(predeterminedEnemy)?.name || predeterminedEnemy}</strong>
                        </p>
                    )}
                </div>
            )}

            {/* Enemy Selection - ONLY FOR SKIRMISH */}
            {!isQuestCombat && combatState.phase === 'selection' && (
                <div className="enemy-selection">
                    <h3>⚔️ Choose Your Opponent</h3>

                    <div className="enemy-source-status">
                        {isUsingExternalEnemies ? (
                            <div className="status-success">
                                ✅ Using enemies from backend database
                            </div>
                        ) : (
                            <div className="status-fallback">
                                ⚠️ Using offline enemy data
                                <button onClick={refreshEnemyData} className="refresh-button">
                                    🔄 Try Backend
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="enemy-buttons">
                        {availableEnemies.map(enemyType => {
                            const template = isUsingExternalEnemies
                                ? getEnemyTemplate(enemyType)
                                : null;

                            const displayInfo = template ? {
                                name: template.name,
                                level: template.level,
                                hp: template.maxHp,
                                dice: template.dicePool,
                                xp: template.xpReward,
                                description: template.description
                            } : {
                                name: enemyType.charAt(0).toUpperCase() + enemyType.slice(1),
                                level: enemyType === 'troll' || enemyType === 'dragon' ? 5 :
                                    enemyType === 'orc' ? 2 : 1,
                                hp: enemyType === 'troll' || enemyType === 'dragon' ? 84 :
                                    enemyType === 'orc' ? 15 :
                                        enemyType === 'skeleton' ? 13 : 7,
                                dice: enemyType === 'dragon' ? '2d12' :
                                    enemyType === 'troll' ? '6d4+2' :
                                        enemyType === 'skeleton' ? '2d4+1' :
                                            enemyType === 'orc' ? '3d4' : '2d4',
                                xp: enemyType === 'dragon' ? 400 :
                                    enemyType === 'troll' ? 200 :
                                        enemyType === 'orc' ? 50 :
                                            enemyType === 'skeleton' ? 30 : 25
                            };

                            return (
                                <button
                                    key={enemyType}
                                    onClick={() => startCombat(enemyType)}
                                    className="enemy-button"
                                >
                                    <div className="enemy-name">{displayInfo.name}</div>
                                    <div className="enemy-details">
                                        <div>Level {displayInfo.level}</div>
                                        <div>{displayInfo.hp} HP</div>
                                        <div>Dice: {displayInfo.dice}</div>
                                        <div>XP: {displayInfo.xp}</div>
                                    </div>
                                    {displayInfo.description && (
                                        <div className="enemy-description">
                                            {displayInfo.description}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Quest Combat Loading */}
            {isQuestCombat && combatState.phase === 'selection' && !questCombatInitialized && (
                <div className="quest-combat-loading">
                    <h3>⚔️ Entering Combat...</h3>
                    <p>Preparing to face {predeterminedEnemy}...</p>
                </div>
            )}

            {/* Active Combat Phase */}
            {combatState.phase === 'active' && (
                <div className="combat-active">
                    {/* Combat Mode Indicator */}
                    <div className={`combat-mode-indicator ${isQuestCombat ? 'quest-mode' : 'skirmish-mode'}`}>
                        {isQuestCombat ? '🏛️ Quest Combat' : '⚔️ Skirmish Combat'}
                    </div>

                    {/* Character Status */}
                    <div className="character-status">
                        <h3>🧙‍♂️ {selectedCharacter.name}</h3>
                        <div className="hp-bar">
                            <div
                                className="hp-fill character-hp"
                                style={{
                                    width: `${(characterCurrentHp / (selectedCharacter.max_hp || 20)) * 100}%`,
                                    backgroundColor: characterCurrentHp > (selectedCharacter.max_hp || 20) * 0.5
                                        ? '#10b981'
                                        : characterCurrentHp > (selectedCharacter.max_hp || 20) * 0.2
                                            ? '#f59e0b'
                                            : '#ef4444'
                                }}
                            ></div>
                            <span className="hp-text">
                                {characterCurrentHp}/{selectedCharacter.max_hp || 20} HP
                            </span>
                        </div>
                        <div className="character-dice-info">
                            {(() => {
                                const diceInfo = getCharacterDicePool();
                                return (
                                    <>
                                        <p><strong>Dice Pool:</strong> {diceInfo.dicePool}</p>
                                        <p><strong>Breakdown:</strong> {diceInfo.description}</p>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Enemy Status */}
                    <div className="enemy-status">
                        <h3>👹 {combatState.enemy.name}</h3>
                        <div className="hp-bar">
                            <div
                                className="hp-fill enemy-hp"
                                style={{
                                    width: `${(combatState.enemy.currentHp / combatState.enemy.maxHp) * 100}%`
                                }}
                            ></div>
                            <span className="hp-text">
                                {combatState.enemy.currentHp}/{combatState.enemy.maxHp} HP
                            </span>
                        </div>
                        <div className="enemy-dice-info">
                            <p><strong>Level:</strong> {combatState.enemy.level}</p>
                            <p><strong>Dice Pool:</strong> {combatState.enemy.dicePool}</p>
                        </div>
                    </div>

                    {/* Combat Actions - The main attack button */}
                    <div className="combat-actions">
                        <button
                            onClick={handleCombatRound}
                            className="combat-button attack-button"
                            disabled={isRolling}
                        >
                            {isRolling ? '🎲 Rolling 3D Dice...' : '🎲 Roll 3D Dice for Combat!'}
                        </button>

                        {/* Dice Border Toggle (Optional) */}
                        <button
                            onClick={() => setShowDiceBorder(!showDiceBorder)}
                            className="combat-button border-toggle-button"
                            disabled={isRolling}
                            title="Toggle dice border visibility"
                        >
                            {showDiceBorder ? '🎯 Hide Border' : '🎯 Show Border'}
                        </button>

                        {isQuestCombat ? (
                            <button
                                onClick={() => handleCombatComplete({ victory: false, defeat: true })}
                                className="combat-button retreat-button"
                                disabled={isRolling}
                            >
                                🏃‍♂️ Retreat from Quest
                            </button>
                        ) : (
                            <button
                                onClick={resetCombat}
                                className="combat-button flee-button"
                                disabled={isRolling}
                            >
                                🏃‍♂️ Flee Combat
                            </button>
                        )}
                    </div>

                    {/* Rolling Indicator */}
                    {isRolling && (
                        <div className="rolling-indicator">
                            <div className="dice-animation">🎲</div>
                            <p>Watch the 3D dice fly across your screen!</p>
                        </div>
                    )}

                    {/* Combat Log */}
                    <div className="combat-log">
                        <h4>📜 Combat Log</h4>
                        <div className="log-entries">
                            {combatState.combatLog.map((entry, index) => (
                                <div key={index} className="log-entry">
                                    {typeof entry === 'string' ? entry : (
                                        <div className="combat-round">
                                            <div className="roll-summary">
                                                <span className="player-roll">
                                                    🔵 You: {entry.characterRoll} ({entry.characterDice?.dicePool || 'unknown'})
                                                </span>
                                                <span className="vs">vs</span>
                                                <span className="enemy-roll">
                                                    🔴 {combatState.enemy.name}: {entry.enemyRoll} ({entry.enemyDice?.dicePool || 'unknown'})
                                                </span>
                                            </div>
                                            <div className="result-text">
                                                {entry.description || entry.result || 'Combat action'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Victory/Defeat Results */}
            {combatState.phase === 'victory' && (
                <div className="combat-result victory">
                    <h3>🎉 Victory!</h3>
                    <p>You defeated the {combatState.enemy.name}!</p>
                    <p>Gained {combatState.totalXpGained} XP!</p>
                    {combatState.totalLoot.length > 0 && (
                        <p>Loot: {combatState.totalLoot.join(', ')}</p>
                    )}
                    <div className="result-actions">
                        {isQuestCombat ? (
                            <button onClick={() => handleCombatComplete({ victory: true, defeat: false })}>
                                ➡️ Continue Quest
                            </button>
                        ) : (
                            <>
                                <button onClick={resetCombat}>⚔️ Fight Another</button>
                                <button onClick={() => handleCombatComplete({ victory: true })}>
                                    🏰 Return to Hub
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {combatState.phase === 'defeat' && (
                <div className="combat-result defeat">
                    <h3>💀 Defeat!</h3>
                    <p>The {combatState.enemy.name} has defeated you!</p>
                    {isQuestCombat && (
                        <p>You retreat from the quest, wounded but alive.</p>
                    )}
                    <div className="result-actions">
                        {isQuestCombat ? (
                            <button onClick={() => handleCombatComplete({ victory: false, defeat: true })}>
                                ⬅️ Return to Quest (Defeated)
                            </button>
                        ) : (
                            <>
                                <button onClick={resetCombat}>🔄 Try Again</button>
                                <button onClick={() => handleCombatComplete({ victory: false })}>
                                    🏰 Return to Hub
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CombatArea;