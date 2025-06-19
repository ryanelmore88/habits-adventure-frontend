// File: src/components/QuestAdventure/QuestAdventure.jsx
// Multi-scene adventure system with room navigation and choices

import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../contexts/CharacterContext';
import CombatArea from '../CombatArea';
import '../../styles/QuestAdventure.css';

const QuestAdventure = ({ onAdventureComplete }) => {
    const { selectedCharacter, updateCharacterHP } = useCharacter();
    const [currentQuest, setCurrentQuest] = useState(null);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [roomHistory, setRoomHistory] = useState([]);
    const [playerChoices, setPlayerChoices] = useState([]);
    const [questCompleted, setQuestCompleted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [inCombat, setInCombat] = useState(false);
    const [currentCombatFeature, setCurrentCombatFeature] = useState(null);
    const [resolvedFeatures, setResolvedFeatures] = useState(new Set());

    // Sample quest data - this could come from an API later
    const sampleQuests = {
        'abandoned-temple': {
            id: 'abandoned-temple',
            title: 'The Abandoned Temple',
            description: 'Ancient ruins hide secrets and dangers. What treasures await?',
            startRoom: 'temple-entrance',
            difficulty: 'Easy',
            rooms: {
                'temple-entrance': {
                    id: 'temple-entrance',
                    title: 'Temple Entrance',
                    description: 'You stand before massive stone doors, partially ajar. Vines creep up weathered walls, and you hear distant echoes from within.',
                    features: [
                        {
                            type: 'examination',
                            description: 'Ancient carvings on the door depict warnings about disturbing the dead.',
                            result: 'You gain insight about potential undead enemies (+1 to next combat roll)'
                        }
                    ],
                    exits: [
                        { direction: 'North', description: 'Through the main doors into darkness', roomId: 'main-hall' },
                        { direction: 'East', description: 'A narrow side passage between collapsed stones', roomId: 'side-chamber' }
                    ]
                },
                'main-hall': {
                    id: 'main-hall',
                    title: 'Main Hall',
                    description: 'A vast chamber with crumbling pillars. Sunlight streams through holes in the ceiling, illuminating ancient murals.',
                    features: [
                        {
                            type: 'combat',
                            description: 'Two skeletal guardians animate as you enter!',
                            enemy: 'skeleton', // Use existing enemy types from CombatArea
                            result: 'You defeat the guardians and find a golden amulet (+2 HP, +5 XP)'
                        }
                    ],
                    exits: [
                        { direction: 'North', description: 'Stairs leading to an upper level', roomId: 'upper-sanctum' },
                        { direction: 'West', description: 'A hidden passage behind a fallen pillar', roomId: 'treasure-room' },
                        { direction: 'South', description: 'Back to the entrance', roomId: 'temple-entrance' }
                    ]
                },
                'side-chamber': {
                    id: 'side-chamber',
                    title: 'Side Chamber',
                    description: 'A small chamber with ancient pottery and scrolls scattered about. The air smells of old parchment.',
                    features: [
                        {
                            type: 'puzzle',
                            description: 'Ancient texts describe a ritual to safely navigate the temple.',
                            result: 'You learn the safe path through the temple (Avoid all traps for this quest)'
                        }
                    ],
                    exits: [
                        { direction: 'West', description: 'Back to the entrance', roomId: 'temple-entrance' },
                        { direction: 'North', description: 'A secret passage to the main hall', roomId: 'main-hall' }
                    ]
                },
                'upper-sanctum': {
                    id: 'upper-sanctum',
                    title: 'Upper Sanctum',
                    description: 'The temple\'s inner sanctum. An ornate altar dominates the room, covered in precious gems and gold.',
                    features: [
                        {
                            type: 'treasure',
                            description: 'The altar holds the legendary Gem of Eternal Light!',
                            result: 'You claim the Gem of Eternal Light! (+10 XP, +50 Gold, Quest Complete!)'
                        }
                    ],
                    exits: [
                        { direction: 'South', description: 'Back to the main hall', roomId: 'main-hall' }
                    ],
                    isQuestEnd: true
                },
                'treasure-room': {
                    id: 'treasure-room',
                    title: 'Hidden Treasure Room',
                    description: 'A secret chamber filled with ancient coins and artifacts. However, you sense danger...',
                    features: [
                        {
                            type: 'trap',
                            description: 'Pressure plates trigger dart traps as you enter!',
                            result: 'You dodge most darts but take some damage (-3 HP, +2 XP for surviving)'
                        },
                        {
                            type: 'treasure',
                            description: 'Despite the traps, you find valuable treasure here.',
                            result: 'You gather ancient coins and gems (+25 Gold, +3 XP)'
                        }
                    ],
                    exits: [
                        { direction: 'East', description: 'Back to the main hall', roomId: 'main-hall' }
                    ]
                }
            }
        }
    };

    const startQuest = (questId) => {
        const quest = sampleQuests[questId];
        if (quest) {
            setCurrentQuest(quest);
            setCurrentRoom(quest.rooms[quest.startRoom]);
            setRoomHistory([quest.startRoom]);
            setPlayerChoices([]);
            setQuestCompleted(false);
        }
    };

    const resolveFeature = async (feature) => {
        // Handle combat separately
        if (feature.type === 'combat') {
            setCurrentCombatFeature(feature);
            setInCombat(true);
            return;
        }

        setLoading(true);

        // Simulate processing time for non-combat features
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Apply feature effects based on type
        let hpChange = 0;
        let xpGain = 0;

        switch (feature.type) {
            case 'trap':
                hpChange = -3;
                xpGain = 2;
                break;
            case 'treasure':
                hpChange = 0;
                xpGain = 3;
                break;
            case 'puzzle':
            case 'examination':
                xpGain = 1;
                break;
        }

        // Apply changes to character
        if (hpChange !== 0) {
            updateCharacterHP(selectedCharacter.id, hpChange);
        }

        // Add to player choices for history
        setPlayerChoices(prev => [...prev, {
            room: currentRoom.title,
            action: feature.description,
            result: feature.result,
            hpChange,
            xpGain
        }]);

        // Mark feature as resolved
        setResolvedFeatures(prev => new Set(prev).add(`${currentRoom.id}-${feature.type}`));

        setLoading(false);
        return { hpChange, xpGain };
    };

    // Handle combat completion from CombatArea
    const handleCombatComplete = async (combatResults) => {
        setInCombat(false);

        // Add combat results to player choices
        const feature = currentCombatFeature;
        setPlayerChoices(prev => [...prev, {
            room: currentRoom.title,
            action: feature.description,
            result: combatResults.victory ? feature.result : 'You were defeated but managed to escape!',
            hpChange: combatResults.hpChange || 0,
            xpGain: combatResults.xpGained || 0
        }]);

        // Mark combat feature as resolved
        setResolvedFeatures(prev => new Set(prev).add(`${currentRoom.id}-${feature.type}`));

        setCurrentCombatFeature(null);

        // If this was the final combat needed to complete the quest, check for completion
        if (currentRoom.isQuestEnd && combatResults.victory) {
            setQuestCompleted(true);
            if (onAdventureComplete) {
                onAdventureComplete({
                    questId: currentQuest.id,
                    questTitle: currentQuest.title,
                    completed: true,
                    choices: [...playerChoices, {
                        room: currentRoom.title,
                        action: feature.description,
                        result: feature.result,
                        hpChange: combatResults.hpChange || 0,
                        xpGain: combatResults.xpGained || 0
                    }]
                });
            }
        }
    };

    const navigateToRoom = (roomId) => {
        const newRoom = currentQuest.rooms[roomId];
        if (newRoom) {
            setCurrentRoom(newRoom);
            setRoomHistory(prev => [...prev, roomId]);

            if (newRoom.isQuestEnd) {
                setQuestCompleted(true);
                if (onAdventureComplete) {
                    onAdventureComplete({
                        questId: currentQuest.id,
                        questTitle: currentQuest.title,
                        completed: true,
                        choices: playerChoices
                    });
                }
            }
        }
    };

    const resetQuest = () => {
        setCurrentQuest(null);
        setCurrentRoom(null);
        setRoomHistory([]);
        setPlayerChoices([]);
        setQuestCompleted(false);
        setInCombat(false);
        setCurrentCombatFeature(null);
        setResolvedFeatures(new Set());
    };

    if (!selectedCharacter) {
        return (
            <div className="quest-adventure">
                <h2>Quest Adventures</h2>
                <p>Please select a character to begin adventures.</p>
            </div>
        );
    }

    // Render combat when in combat mode
    if (inCombat && currentCombatFeature) {
        return (
            <div className="quest-combat-mode">
                <div className="combat-header">
                    <h3>🏛️ {currentRoom.title} - Combat!</h3>
                    <p>{currentCombatFeature.description}</p>
                </div>
                <CombatArea
                    character={selectedCharacter}
                    enemyType={currentCombatFeature.enemy}
                    onAdventureComplete={handleCombatComplete}
                    questContext={{
                        questTitle: currentQuest.title,
                        roomTitle: currentRoom.title,
                        isQuestCombat: true
                    }}
                />
            </div>
        );
    }

    if (!currentQuest) {
        return (
            <div className="quest-adventure">
                <h2>Quest Adventures</h2>
                <p>Choose your adventure:</p>
                <div className="quest-selection">
                    {Object.values(sampleQuests).map(quest => (
                        <div key={quest.id} className="quest-card">
                            <h3>{quest.title}</h3>
                            <p className="quest-description">{quest.description}</p>
                            <p className="quest-difficulty">Difficulty: {quest.difficulty}</p>
                            <button
                                className="start-quest-btn"
                                onClick={() => startQuest(quest.id)}
                            >
                                Begin Adventure
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="quest-adventure">
            <div className="quest-header">
                <h2>{currentQuest.title}</h2>
                <button className="quit-quest-btn" onClick={resetQuest}>
                    Quit Quest
                </button>
            </div>

            <div className="current-room">
                <h3>{currentRoom.title}</h3>
                <p className="room-description">{currentRoom.description}</p>

                {/* Room Features */}
                {currentRoom.features && currentRoom.features.length > 0 && (
                    <div className="room-features">
                        <h4>Actions Available:</h4>
                        {currentRoom.features.map((feature, index) => {
                            const featureKey = `${currentRoom.id}-${feature.type}`;
                            const isResolved = resolvedFeatures.has(featureKey);

                            return (
                                <div key={index} className={`feature-card ${isResolved ? 'resolved' : ''}`}>
                                    <p className="feature-description">{feature.description}</p>
                                    {!isResolved ? (
                                        <button
                                            className={`feature-btn feature-${feature.type}`}
                                            onClick={() => resolveFeature(feature)}
                                            disabled={loading}
                                        >
                                            {loading ? 'Resolving...' : `Resolve ${feature.type}`}
                                        </button>
                                    ) : (
                                        <div className="feature-resolved">
                                            ✅ Resolved
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Room Exits */}
                {currentRoom.exits && currentRoom.exits.length > 0 && (
                    <div className="room-exits">
                        <h4>Where do you go?</h4>
                        <div className="exits-grid">
                            {currentRoom.exits.map((exit, index) => (
                                <button
                                    key={index}
                                    className="exit-btn"
                                    onClick={() => navigateToRoom(exit.roomId)}
                                >
                                    <strong>{exit.direction}</strong>
                                    <span>{exit.description}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {questCompleted && (
                    <div className="quest-complete">
                        <h3>🎉 Quest Completed!</h3>
                        <p>You have successfully completed {currentQuest.title}!</p>
                        <button className="new-quest-btn" onClick={resetQuest}>
                            Choose New Adventure
                        </button>
                    </div>
                )}
            </div>

            {/* Adventure Log */}
            {playerChoices.length > 0 && (
                <div className="adventure-log">
                    <h4>Adventure Log:</h4>
                    <div className="log-entries">
                        {playerChoices.map((choice, index) => (
                            <div key={index} className="log-entry">
                                <strong>{choice.room}:</strong> {choice.result}
                                {choice.hpChange !== 0 && (
                                    <span className={`hp-change ${choice.hpChange > 0 ? 'positive' : 'negative'}`}>
                                        {choice.hpChange > 0 ? '+' : ''}{choice.hpChange} HP
                                    </span>
                                )}
                                {choice.xpGain > 0 && (
                                    <span className="xp-gain">+{choice.xpGain} XP</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestAdventure;