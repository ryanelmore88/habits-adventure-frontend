// File: src/components/CombatArea.jsx
// CombatArea with 3D dice rolling restored + combined multi-enemy system

import { useState, useEffect, useRef } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { useCombat } from '../hooks/useCombat';
import { useEnemyData } from '../hooks/useEnemyData';
import SimpleDicePopup from './dice/SimpleDicePopup';
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
        startMultiCombat,           // Combined multi-enemy combat
        executeRound,
        resetCombat,
        getCharacterDiceInfo,
        getEnemyDiceInfo,
        getIndividualEnemyStatus,   // Get status of individual enemies
        isUsingExternalEnemies,
        isMultiEnemy
    } = useCombat(selectedCharacter, enemyTemplates);

    // 3D DICE STATE - RESTORED
    const [diceBox, setDiceBox] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    const [characterCurrentHp, setCharacterCurrentHp] = useState(selectedCharacter?.current_hp || 20);
    const [questCombatInitialized, setQuestCombatInitialized] = useState(false);
    const [showDiceBorder, setShowDiceBorder] = useState(false);
    const diceBoxRef = useRef(null);
    const cleanupTimeoutRef = useRef(null);

    // Simple popup state
    const [showDicePopup, setShowDicePopup] = useState(false);
    const [popupData, setPopupData] = useState({ characterTotal: 0, enemyTotal: 0 });
    const [pendingRoundResult, setPendingRoundResult] = useState(null);

    // Multi-enemy selection state
    const [enemySelection, setEnemySelection] = useState({}); // { enemyId: count }
    const [selectionMode, setSelectionMode] = useState('single'); // 'single' or 'multiple'

    // Quest combat logic
    const isQuestCombat = questContext?.isQuestCombat || false;
    const predeterminedEnemy = enemyType;

    // Auto-start combat in quest mode
    useEffect(() => {
        if (isQuestCombat && predeterminedEnemy && !questCombatInitialized && combatState.phase === 'selection') {
            console.log(`Quest combat: Auto-starting combat with ${predeterminedEnemy}`);
            const enemy = getEnemyTemplate(predeterminedEnemy);
            if (enemy) {
                startCombat(enemy);
                setQuestCombatInitialized(true);
            }
        }
    }, [isQuestCombat, predeterminedEnemy, questCombatInitialized, combatState.phase, getEnemyTemplate, startCombat]);

    // Character HP sync
    useEffect(() => {
        if (selectedCharacter) {
            const initialHp = selectedCharacter.current_hp || selectedCharacter.max_hp || 20;
            setCharacterCurrentHp(initialHp);
            // Ensure character context has the current HP
            if (selectedCharacter.current_hp !== initialHp) {
                updateTemporaryHp(initialHp);
            }
        }
    }, [selectedCharacter, updateTemporaryHp]);

    // 3D DICE INITIALIZATION - COMPREHENSIVE DEBUGGING
    useEffect(() => {
        const loadDiceBox = async () => {
            try {
                console.log('Loading 3D DiceBox...');

                // First check if the dice-box element exists
                const diceElement = document.getElementById('dice-box');
                if (!diceElement) {
                    console.error('Dice box element not found!');
                    return;
                }
                console.log('Dice box element found:', diceElement);

                // Try to import the package with comprehensive error handling
                let DiceBox;
                try {
                    console.log('Attempting to import @3d-dice/dice-box...');
                    const module = await import('@3d-dice/dice-box');
                    console.log('Import successful, module:', module);

                    // Try different possible exports
                    DiceBox = module.DiceBox || module.default || module;
                    console.log('DiceBox constructor:', DiceBox, typeof DiceBox);

                    if (typeof DiceBox !== 'function') {
                        // Sometimes it's nested deeper
                        DiceBox = module.DiceBox?.DiceBox || module.default?.DiceBox;
                        console.log('Trying nested DiceBox:', DiceBox, typeof DiceBox);
                    }
                } catch (importError) {
                    console.error('Import failed:', importError);
                    throw new Error(`Failed to import @3d-dice/dice-box: ${importError.message}`);
                }

                if (!DiceBox || typeof DiceBox !== 'function') {
                    throw new Error(`DiceBox is not a constructor. Type: ${typeof DiceBox}, Value:`, DiceBox);
                }

                console.log('Creating DiceBox instance...');

                // Check if assets exist
                console.log('Dice assets should be at: /assets/dice-box/');

                const newDiceBox = new DiceBox('#dice-box', {
                    assetPath: '/assets/dice-box/',
                    theme: 'default',
                    scale: 6,
                    gravity: 1,
                    mass: 1,
                    friction: .8,
                    restitution: 0,
                    angularDamping: .4,
                    linearDamping: .5,
                    spinForce: 6,
                    throwForce: 5,
                    startingHeight: 8,
                    settleTimeout: 5000,
                    offscreen: false,
                    delay: 10
                });

                console.log('DiceBox instance created:', newDiceBox);
                console.log('Initializing DiceBox...');

                await newDiceBox.init();

                setDiceBox(newDiceBox);
                diceBoxRef.current = newDiceBox;
                console.log('✅ 3D DiceBox initialized successfully!');

            } catch (error) {
                console.error('❌ Failed to initialize 3D DiceBox:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                });
                console.warn('🔄 Using fallback dice rolling instead');

                // Set diceBox to null to indicate fallback should be used
                setDiceBox(null);
                diceBoxRef.current = null;
            }
        };

        // Add a small delay to ensure DOM is ready
        setTimeout(loadDiceBox, 100);

        return () => {
            if (cleanupTimeoutRef.current) {
                clearTimeout(cleanupTimeoutRef.current);
            }
            if (diceBoxRef.current) {
                try {
                    console.log('Cleaning up DiceBox...');
                    diceBoxRef.current.clear();
                } catch (e) {
                    console.warn('Error cleaning up dice box:', e);
                }
                diceBoxRef.current = null;
            }
        };
    }, []);

    // GET CHARACTER DICE POOL - RESTORED
    const getCharacterDicePool = () => {
        if (!selectedCharacter?.attributes) {
            return { totalDice: 2, notation: '2d4', breakdown: {}, description: '2 dice (default)' };
        }

        const attributeNames = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        let totalDice = 0;
        const breakdown = {};

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

    // 3D DICE ROLLING FUNCTION - WITH BETTER FALLBACK
    const rollDice = async (playerDiceInfo, enemyDicePool) => {
        // Check if 3D dice is available
        if (!diceBox || !diceBoxRef.current) {
            console.log('3D dice not available, using fallback dice rolling');
            return null; // This will trigger fallback in handleCombatRound
        }

        if (isRolling) {
            console.warn('Dice already rolling, please wait');
            return null;
        }

        setIsRolling(true);
        console.log('Starting 3D dice roll...', { playerDiceInfo, enemyDicePool });

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

            // Add visual border when rolling starts (optional)
            const diceBoxElement = document.getElementById('dice-box');
            if (diceBoxElement && showDiceBorder) {
                diceBoxElement.classList.add('rolling-border');
            }

            // Parse player dice
            const playerDiceCount = playerDiceInfo.totalDice || 1;

            // Parse enemy dice - ENHANCED for combined pools
            const enemyDiceMatch = enemyDicePool.match(/(\d+)d(\d+)/);
            const enemyDiceCount = enemyDiceMatch ? parseInt(enemyDiceMatch[1]) : 1;
            const enemyDiceSize = enemyDiceMatch ? parseInt(enemyDiceMatch[2]) : 4;

            console.log('Dice breakdown:', {
                playerDiceCount,
                enemyDiceCount,
                enemyDiceSize,
                isMultiEnemy,
                enemyDicePool
            });

            // Create dice array for 3D rolling
            const allDice = [];

            // Player dice (blue)
            for (let i = 0; i < playerDiceCount; i++) {
                allDice.push({
                    qty: 1,
                    sides: 4,
                    themeColor: '#3b82f6'  // Blue for player
                });
            }

            // Enemy dice (red) - handles combined pools
            for (let i = 0; i < enemyDiceCount; i++) {
                allDice.push({
                    qty: 1,
                    sides: enemyDiceSize,
                    themeColor: '#ef4444'  // Red for enemy
                });
            }

            console.log('Rolling 3D dice with config:', {
                playerDiceCount,
                enemyDiceCount,
                enemyDiceSize,
                totalDice: allDice.length,
                isMultiEnemy
            });

            // Roll all dice at once
            const allRolls = await diceBoxRef.current.roll(allDice);
            console.log('3D Roll complete:', allRolls);

            // Split results between player and enemy
            const playerRolls = allRolls.slice(0, playerDiceCount);
            const enemyRolls = allRolls.slice(playerDiceCount);

            const playerTotal = playerRolls.reduce((sum, die) => sum + (die.value || 0), 0);
            const enemyTotal = enemyRolls.reduce((sum, die) => sum + (die.value || 0), 0);

            console.log('3D Dice totals:', {
                playerTotal,
                enemyTotal,
                playerRolls: playerRolls.map(d => d.value),
                enemyRolls: enemyRolls.map(d => d.value),
                isMultiEnemy
            });

            // Schedule dice cleanup
            cleanupTimeoutRef.current = setTimeout(async () => {
                try {
                    if (diceBoxRef.current) {
                        await diceBoxRef.current.hide();
                        const diceBoxElement = document.getElementById('dice-box');
                        if (diceBoxElement) {
                            diceBoxElement.classList.remove('rolling-border');
                        }
                    }
                } catch (e) {
                    console.warn('Error during dice cleanup:', e);
                }
            }, 3000);

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

    // COMBAT ROUND HANDLER - WITH 3D DICE INTEGRATION
    const handleCombatRound = async () => {
        if (isRolling || combatState.phase !== 'active') {
            console.log('Cannot start combat round - rolling:', isRolling, 'phase:', combatState.phase);
            return;
        }

        console.log('Starting combat round...');
        const characterDiceInfo = getCharacterDicePool();

        // Roll the 3D dice first
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

        // Show dice results popup
        setPopupData({ characterTotal: playerTotal, enemyTotal: enemyTotal });
        setShowDicePopup(true);

        // Store the round result to process after popup closes
        setPendingRoundResult({
            winner,
            damage,
            description,
            characterRoll: playerTotal,
            enemyRoll: enemyTotal,
            characterDice: characterDiceInfo,
            enemyDice: { dicePool: combatState.enemy.dicePool }
        });
    };

    // Handle popup close and continue combat
    const handlePopupClose = () => {
        setShowDicePopup(false);

        if (pendingRoundResult) {
            const newCharacterHp = executeRound(pendingRoundResult);
            if (newCharacterHp !== undefined) {
                setCharacterCurrentHp(newCharacterHp);
                // UPDATE: Sync with character header immediately
                updateTemporaryHp(newCharacterHp);
            }
            setPendingRoundResult(null);
        }

        setIsRolling(false);
    };

    // Handle enemy selection for multi-combat
    const handleEnemyCountChange = (enemyId, change) => {
        setEnemySelection(prev => {
            const currentCount = prev[enemyId] || 0;
            const newCount = Math.max(0, currentCount + change);

            if (newCount === 0) {
                const { [enemyId]: removed, ...rest } = prev;
                return rest;
            } else {
                return { ...prev, [enemyId]: newCount };
            }
        });
    };

    // Start multi-enemy combat with selected enemies
    const handleStartMultiCombat = () => {
        const selectedEnemyTypes = [];

        for (const [enemyId, count] of Object.entries(enemySelection)) {
            for (let i = 0; i < count; i++) {
                selectedEnemyTypes.push(enemyId);
            }
        }

        if (selectedEnemyTypes.length === 0) {
            alert('Please select at least one enemy');
            return;
        }

        if (selectedEnemyTypes.length === 1) {
            startCombat(selectedEnemyTypes[0]);
        } else {
            startMultiCombat(selectedEnemyTypes);
        }

        setEnemySelection({});
    };

    // Combat completion handler
    const handleCombatComplete = (results) => {
        // Make sure final HP is synced with character context
        updateTemporaryHp(characterCurrentHp);

        if (isQuestCombat && onAdventureComplete) {
            onAdventureComplete({
                victory: combatState.phase === 'victory',
                defeat: combatState.phase === 'defeat',
                hpChange: (selectedCharacter?.max_hp || 20) - characterCurrentHp,
                xpGained: combatState.totalXpGained,
                loot: combatState.totalLoot,
                enemy: combatState.enemy?.name
            });
        }
    };

    // Enhanced reset combat function
    const handleResetCombat = () => {
        // Clear temporary HP changes when resetting combat
        clearTemporaryHp();
        setCharacterCurrentHp(selectedCharacter?.current_hp || selectedCharacter?.max_hp || 20);
        setEnemySelection({});
        resetCombat();
    };

    // Get individual enemy status for display
    const individualEnemyStatus = getIndividualEnemyStatus();

    // Calculate total selected enemies
    const totalSelectedEnemies = Object.values(enemySelection).reduce((sum, count) => sum + count, 0);

    // Component render logic
    if (!selectedCharacter) {
        return (
            <div className="combat-area-loading">
                <h2>Select a character to begin combat</h2>
            </div>
        );
    }

    if (enemyLoading) {
        return (
            <div className="combat-area-loading">
                <h2>Loading enemy data...</h2>
            </div>
        );
    }

    return (
        <div className="combat-area">
            {/* 3D DICE CONTAINER - RESTORED */}
            <div id="dice-box" className="dice-container"></div>

            {/* Quest Combat Header */}
            {isQuestCombat && questContext && (
                <div className="quest-combat-header">
                    <h3>{questContext.questName}</h3>
                    <h4>{questContext.locationName}</h4>
                    <p className="enemy-encounter">
                        <strong>Enemy Encounter:</strong> {combatState.enemy?.name || predeterminedEnemy}
                    </p>
                </div>
            )}

            {/* Enemy Selection Phase */}
            {combatState.phase === 'selection' && !isQuestCombat && (
                <div className="enemy-selection">
                    <h3>Choose Your Combat</h3>

                    {/* Combat Mode Selection */}
                    <div className="combat-mode-selection" style={{
                        display: 'flex',
                        gap: '16px',
                        justifyContent: 'center',
                        marginBottom: '24px'
                    }}>
                        <button
                            className={`mode-button ${selectionMode === 'single' ? 'active' : ''}`}
                            onClick={() => {
                                setSelectionMode('single');
                                setEnemySelection({});
                            }}
                            style={{
                                background: selectionMode === 'single' ? '#3b82f6' : '#374151',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            🥊 Single Combat
                        </button>
                        <button
                            className={`mode-button ${selectionMode === 'multiple' ? 'active' : ''}`}
                            onClick={() => {
                                setSelectionMode('multiple');
                                setEnemySelection({});
                            }}
                            style={{
                                background: selectionMode === 'multiple' ? '#ef4444' : '#374151',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            ⚔️ Combined Multi-Enemy
                        </button>
                    </div>

                    {/* 3D Dice Status Indicator */}
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '16px',
                        padding: '8px 16px',
                        background: diceBox ? '#065f46' : '#92400e',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                    }}>
                        {diceBox ? '🎲 3D Dice Ready' : '⚠️ Using Fallback Dice (3D dice failed to load)'}
                    </div>

                    {/* Enemy Source Status */}
                    <div className="enemy-source-status">
                        {isUsingExternalEnemies ? (
                            <div className="status-success">
                                ✅ Connected to Enemy Database
                            </div>
                        ) : (
                            <div className="status-fallback">
                                ⚠️ Using Fallback Enemies
                                <button
                                    className="refresh-button"
                                    onClick={refreshEnemyData}
                                    title="Try to reconnect to enemy database"
                                >
                                    🔄 Retry
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Selected Enemies Preview (Multi-mode only) */}
                    {selectionMode === 'multiple' && totalSelectedEnemies > 0 && (
                        <div style={{
                            background: '#1f2937',
                            border: '2px solid #3b82f6',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '20px'
                        }}>
                            <h4 style={{ color: '#3b82f6', margin: '0 0 12px 0' }}>
                                Selected Encounter ({totalSelectedEnemies} enemies):
                            </h4>
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px',
                                marginBottom: '16px'
                            }}>
                                {Object.entries(enemySelection).map(([enemyId, count]) => (
                                    <span key={enemyId} style={{
                                        background: '#374151',
                                        color: '#eee',
                                        padding: '4px 12px',
                                        borderRadius: '16px',
                                        fontSize: '0.9rem'
                                    }}>
                                        {count}x {enemyTemplates[enemyId]?.name || enemyId}
                                    </span>
                                ))}
                            </div>

                            {/* Combined Stats Preview */}
                            <div style={{
                                background: '#374151',
                                padding: '12px',
                                borderRadius: '8px',
                                marginBottom: '16px',
                                fontSize: '0.9rem'
                            }}>
                                <strong>Combined Enemy Stats:</strong>
                                <div style={{ marginTop: '8px', color: '#d1d5db' }}>
                                    <div>Total HP: {Object.entries(enemySelection).reduce((total, [enemyId, count]) => {
                                        const enemy = enemyTemplates[enemyId];
                                        return total + (enemy ? enemy.maxHp * count : 0);
                                    }, 0)}</div>
                                    <div>Combined Dice Pool: (calculated during combat)</div>
                                </div>
                            </div>

                            <button
                                onClick={handleStartMultiCombat}
                                style={{
                                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '1rem'
                                }}
                            >
                                ⚔️ Start Combined Encounter
                            </button>
                        </div>
                    )}

                    {/* Enemy Buttons */}
                    <div className="enemy-buttons">
                        {(isUsingExternalEnemies ? availableEnemies : []).map(enemyId => {
                            const enemy = enemyTemplates[enemyId];
                            const selectedCount = enemySelection[enemyId] || 0;

                            return (
                                <div
                                    key={enemyId}
                                    className="enemy-button"
                                    style={{
                                        border: selectedCount > 0 ? '3px solid #3b82f6' : '2px solid #4b5563',
                                        background: selectedCount > 0 ? '#1e40af' : '#374151',
                                        position: 'relative'
                                    }}
                                >
                                    <div className="enemy-name">{enemy?.name || enemyId}</div>
                                    <div className="enemy-details">
                                        <div><strong>HP:</strong> {enemy?.maxHp || enemy?.hp}</div>
                                        <div><strong>Dice:</strong> {enemy?.dicePool}</div>
                                    </div>
                                    {enemy?.description && (
                                        <div className="enemy-description">{enemy.description}</div>
                                    )}

                                    {/* Combat Mode Actions */}
                                    {selectionMode === 'single' ? (
                                        <button
                                            onClick={() => startCombat(enemyId)}
                                            style={{
                                                position: 'absolute',
                                                bottom: '8px',
                                                right: '8px',
                                                background: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Fight
                                        </button>
                                    ) : (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '8px',
                                            right: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            background: 'rgba(0, 0, 0, 0.6)',
                                            padding: '4px 8px',
                                            borderRadius: '6px'
                                        }}>
                                            <button
                                                onClick={() => handleEnemyCountChange(enemyId, -1)}
                                                disabled={selectedCount === 0}
                                                style={{
                                                    background: '#ef4444',
                                                    color: 'white',
                                                    border: 'none',
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    fontWeight: 'bold',
                                                    opacity: selectedCount === 0 ? 0.5 : 1
                                                }}
                                            >
                                                -
                                            </button>
                                            <span style={{
                                                color: 'white',
                                                fontWeight: 'bold',
                                                minWidth: '20px',
                                                textAlign: 'center'
                                            }}>
                                                {selectedCount}
                                            </span>
                                            <button
                                                onClick={() => handleEnemyCountChange(enemyId, 1)}
                                                style={{
                                                    background: '#10b981',
                                                    color: 'white',
                                                    border: 'none',
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                +
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Active Combat Phase */}
            {combatState.phase === 'active' && (
                <div className="combat-active">
                    {/* Combat Mode Indicator */}
                    <div className={`combat-mode-indicator ${isQuestCombat ? 'quest-mode' : 'skirmish-mode'}`}>
                        <span>
                            {isQuestCombat ? '⚔️ Quest Combat' :
                                isMultiEnemy ? '⚔️ Combined Multi-Enemy Encounter' : '🥊 Single Combat'}
                        </span>
                        {isMultiEnemy && (
                            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                                {individualEnemyStatus.filter(e => e.isAlive).length} alive, {individualEnemyStatus.filter(e => !e.isAlive).length} defeated
                            </span>
                        )}
                    </div>

                    {/* Combined Enemy Status */}
                    <div className="enemy-status">
                        <h3>{combatState.enemy.name}</h3>
                        <div className="hp-bar">
                            <div
                                className="hp-fill enemy-hp"
                                style={{width: `${(combatState.enemy.currentHp / combatState.enemy.maxHp) * 100}%`}}
                            ></div>
                            <div className="hp-text">
                                {combatState.enemy.currentHp} / {combatState.enemy.maxHp} HP
                            </div>
                        </div>
                        <div className="enemy-dice-info">
                            <p><strong>Combined Dice Pool:</strong> {combatState.enemy.dicePool}</p>
                            {isMultiEnemy && (
                                <p>{getEnemyDiceInfo().description}</p>
                            )}
                        </div>
                    </div>

                    {/* Combat Actions */}
                    <div className="combat-actions">
                        <button
                            className="attack-button"
                            onClick={handleCombatRound}
                            disabled={isRolling}
                            style={{
                                background: isRolling
                                    ? 'linear-gradient(135deg, #6b7280, #4b5563)'
                                    : 'linear-gradient(135deg, #ef4444, #dc2626)',
                                color: 'white',
                                border: 'none',
                                padding: '16px 32px',
                                borderRadius: '12px',
                                cursor: isRolling ? 'not-allowed' : 'pointer',
                                fontWeight: '700',
                                fontSize: '1.2rem',
                                minWidth: '200px',
                                opacity: isRolling ? 0.6 : 1
                            }}
                        >
                            {isRolling ? (
                                <>
                                    <span style={{ animation: 'spin 1s linear infinite' }}>🎲</span>
                                    Rolling 3D Dice...
                                </>
                            ) : (
                                <>
                                    ⚔️ ATTACK! {diceBox ? '🎲' : '⚠️'}
                                </>
                            )}
                        </button>
                    </div>

                    {/* Individual Enemy Status (Multi-Enemy only) */}
                    {isMultiEnemy && individualEnemyStatus.length > 0 && (
                        <div style={{
                            background: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '20px'
                        }}>
                            <h4 style={{ color: '#a5b4fc', margin: '0 0 12px 0' }}>Individual Enemy Status:</h4>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '12px'
                            }}>
                                {individualEnemyStatus.map((enemy, index) => (
                                    <div
                                        key={enemy.id}
                                        style={{
                                            background: enemy.isAlive ? '#374151' : '#1f2937',
                                            border: `1px solid ${enemy.isAlive ? '#4b5563' : '#6b7280'}`,
                                            borderRadius: '8px',
                                            padding: '12px',
                                            opacity: enemy.isAlive ? 1 : 0.6
                                        }}
                                    >
                                        <div style={{
                                            fontWeight: 'bold',
                                            color: enemy.isAlive ? '#eee' : '#9ca3af',
                                            marginBottom: '6px'
                                        }}>
                                            {enemy.name} {enemy.isAlive ? '' : '(💀 Defeated)'}
                                        </div>
                                        <div style={{
                                            fontSize: '0.9rem',
                                            color: enemy.isAlive ? '#d1d5db' : '#6b7280'
                                        }}>
                                            HP: {enemy.currentHp} / {enemy.maxHp}
                                        </div>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: enemy.isAlive ? '#9ca3af' : '#6b7280'
                                        }}>
                                            Dice: {enemy.dicePool}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}



                    {/* Rolling Indicator */}
                    {isRolling && (
                        <div className="rolling-indicator">
                            <div className="dice-spinner">🎲</div>
                            <p>Rolling 3D dice...</p>
                        </div>
                    )}
                </div>
            )}

            {/* Combat Results */}
            {(combatState.phase === 'victory' || combatState.phase === 'defeat') && (
                <div className={`combat-result ${combatState.phase}`}>
                    <h3>{combatState.phase === 'victory' ? 'VICTORY!' : 'DEFEAT!'}</h3>
                    <p>
                        {isMultiEnemy && combatState.phase === 'victory'
                            ? `All enemies defeated!`
                            : `Combat has ended against ${combatState.enemy?.name}.`
                        }
                    </p>

                    {combatState.phase === 'victory' && (
                        <div className="victory-rewards">
                            <p><strong>Total XP Gained:</strong> {combatState.totalXpGained}</p>
                            {combatState.totalLoot && combatState.totalLoot.length > 0 && (
                                <p><strong>Loot:</strong> {combatState.totalLoot.join(', ')}</p>
                            )}
                        </div>
                    )}

                    <div className="result-actions">
                        {isQuestCombat ? (
                            <button onClick={() => handleCombatComplete({ victory: combatState.phase === 'victory', defeat: combatState.phase === 'defeat' })}>
                                ⬅️ Continue Quest
                            </button>
                        ) : (
                            <button onClick={handleResetCombat}>🔄 Fight Again</button>
                        )}
                    </div>
                </div>
            )}

            {/* Combat Log */}
            {combatState.combatLog && combatState.combatLog.length > 0 && (
                <div className="combat-log">
                    <h4>Combat Log</h4>
                    <div className="log-entries">
                        {combatState.combatLog.map((entry, index) => (
                            <div key={index} className="log-entry">
                                {entry.type === 'round' ? (
                                    <div className="combat-round">
                                        <div className="roll-summary">
                                            <span className="player-roll">You: {entry.characterRoll}</span>
                                            <span className="vs">vs</span>
                                            <span className="enemy-roll">{combatState.enemy?.name}: {entry.enemyRoll}</span>
                                        </div>
                                        <div className="result-text">{entry.description}</div>
                                    </div>
                                ) : entry.type === 'encounter' ? (
                                    <div style={{
                                        background: '#7c3aed',
                                        color: 'white',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        fontWeight: 'bold'
                                    }}>
                                        {entry.description}
                                    </div>
                                ) : entry.type === 'victory' ? (
                                    <div style={{
                                        background: '#10b981',
                                        color: 'white',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        fontWeight: 'bold'
                                    }}>
                                        {entry.description}
                                    </div>
                                ) : (
                                    <div>{entry.description}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Simple Dice Results Popup */}
            <SimpleDicePopup
                isVisible={showDicePopup}
                characterTotal={popupData.characterTotal}
                enemyTotal={popupData.enemyTotal}
                onClose={handlePopupClose}
                autoDismissDelay={3000}
            />
        </div>
    );
};

export default CombatArea;