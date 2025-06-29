// File: src/components/Character/CharacterSheet.jsx
// Updated to show habit streak instead of AC

import { useState, useEffect } from 'react';
import { useCharacter } from '../../contexts/CharacterContext';
import { habitApi } from '../../api/habitApi';
import { calculateCurrentStreak, getStreakMessage } from '../../utils/streakUtils';
import CharacterImageUpload from './CharacterImageUpload';
import AttributeModal from '../AttributeModal';
import '../../styles/CharacterSheet.css';

const CharacterSheet = () => {
    const { selectedCharacter, refreshCharacter } = useCharacter();
    const [selectedAttribute, setSelectedAttribute] = useState(null);
    const [habits, setHabits] = useState([]);
    const [streak, setStreak] = useState(0);
    const [streakLoading, setStreakLoading] = useState(false);

    if (!selectedCharacter) {
        return (
            <div className="character-sheet-loading">
                <h2>No Character Selected</h2>
                <p>Please select a character to view their sheet.</p>
            </div>
        );
    }

    // Load habits and calculate streak
    useEffect(() => {
        if (selectedCharacter?.id) {
            loadHabitsAndCalculateStreak();
        }
    }, [selectedCharacter?.id]);

    const loadHabitsAndCalculateStreak = async () => {
        try {
            setStreakLoading(true);
            const response = await habitApi.getHabits(selectedCharacter.id);
            const habitsData = response.data || response || [];

            setHabits(habitsData);

            // Calculate streak from habits data
            const currentStreak = calculateCurrentStreak(habitsData);
            setStreak(currentStreak);
        } catch (error) {
            console.error('Failed to load habits for streak calculation:', error);
            setHabits([]);
            setStreak(0);
        } finally {
            setStreakLoading(false);
        }
    };

    // Calculate D&D style modifiers
    const getModifier = (score) => {
        const modifier = Math.floor((score - 10) / 2);
        return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    };

    // Get attribute score (base + habit bonuses)
    const getAttributeScore = (attributeName) => {
        const attr = selectedCharacter.attributes?.[attributeName];
        if (!attr) return 10;
        return (attr.base || 10) + Math.floor((attr.habit_points || 0) / 5);
    };

    // Calculate initiative (dex modifier)
    const getInitiative = () => {
        const dexScore = getAttributeScore('dexterity');
        const dexMod = Math.floor((dexScore - 10) / 2);
        return dexMod >= 0 ? `+${dexMod}` : `${dexMod}`;
    };

    // Calculate max HP (base 10 + con modifier * level)
    const getMaxHP = () => {
        const conScore = getAttributeScore('constitution');
        const conMod = Math.floor((conScore - 10) / 2);
        const level = selectedCharacter.level || 1;
        return 10 + (conMod * level);
    };

    const handleImageUpdate = async () => {
        try {
            await refreshCharacter();
        } catch (error) {
            console.error('Failed to refresh character after image update:', error);
        }
    };

    // Handle attribute click to open habits modal
    const handleAttributeClick = (attributeName) => {
        const attr = selectedCharacter.attributes?.[attributeName];
        if (attr) {
            const attributeScore = getAttributeScore(attributeName);
            const totalBonus = Math.floor((attributeScore - 10) / 2);

            setSelectedAttribute({
                attributeName: attributeName,
                base: attr.base || 10,
                bonus: totalBonus,
                habitPoints: attr.habit_points || 0
            });
        }
    };

    const handleCloseModal = () => {
        setSelectedAttribute(null);
        // Refresh streak when modal closes (in case new habits were completed)
        loadHabitsAndCalculateStreak();
    };

    const attributes = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

    return (
        <div className="dnd-character-sheet">
            {/* Character Header */}
            <div className="character-header">
                <button className="back-button">←</button>
                <div className="character-title">
                    <h1>{selectedCharacter.name}</h1>
                    <p className="character-classes">
                        Human Fighter {selectedCharacter.level || 1}
                    </p>
                </div>
            </div>

            {/* Top Stats Row */}
            <div className="top-stats-section">
                {/* Streak (replacing AC) */}
                <div
                    className="stat-card streak"
                    title={getStreakMessage(streak)}
                    data-streak={streak === 0 ? "0" : streak >= 100 ? "legendary" : streak >= 30 ? "high" : "normal"}
                >
                    <div className="stat-value">
                        {streakLoading ? '...' : streak}
                        {streak > 0 && <span className="streak-fire">🔥</span>}
                    </div>
                    <div className="stat-label">STREAK<br/>DAYS</div>
                </div>

                {/* Initiative */}
                <div className="stat-card initiative">
                    <div className="stat-value">{getInitiative()}</div>
                    <div className="stat-label">INITIATIVE</div>
                </div>

                {/* Character Portrait */}
                <div className="character-portrait-section">
                    <CharacterImageUpload
                        character={selectedCharacter}
                        onImageUpdate={handleImageUpdate}
                    />
                </div>

                {/* Hit Points */}
                <div className="stat-card hit-points">
                    <div className="stat-value">{selectedCharacter.current_hp || getMaxHP()}/{getMaxHP()}</div>
                    <div className="stat-label">HIT POINTS</div>
                </div>
            </div>

            {/* Streak Message */}
            {!streakLoading && (
                <div className="streak-message">
                    <p>{getStreakMessage(streak)}</p>
                </div>
            )}

            {/* Attributes Grid */}
            <div className="attributes-section">
                <h2>Abilities, Saves, Senses</h2>
                <div className="attributes-grid">
                    {attributes.map((attr) => {
                        const score = getAttributeScore(attr);
                        const modifier = getModifier(score);

                        return (
                            <div
                                key={attr}
                                className="attribute-card clickable"
                                onClick={() => handleAttributeClick(attr)}
                                role="button"
                                tabIndex={0}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        handleAttributeClick(attr);
                                    }
                                }}
                            >
                                <div className="attribute-name">{attr.toUpperCase()}</div>
                                <div className="attribute-modifier">{modifier}</div>
                                <div className="attribute-score">{score}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Saving Throws */}
            <div className="saving-throws-section">
                <h2>Saving Throws</h2>
                <div className="saving-throws-grid">
                    {attributes.map((attr) => {
                        const score = getAttributeScore(attr);
                        const modifier = getModifier(score);
                        const isProficient = ['strength', 'constitution'].includes(attr); // Fighter proficiencies
                        const profBonus = isProficient ? 2 : 0; // Level 1 prof bonus
                        const totalBonus = Math.floor((score - 10) / 2) + profBonus;
                        const bonusStr = totalBonus >= 0 ? `+${totalBonus}` : `${totalBonus}`;

                        return (
                            <div key={`save-${attr}`} className="saving-throw">
                                <div className="save-proficiency">
                                    <div className={`proficiency-indicator ${isProficient ? 'proficient' : ''}`}></div>
                                </div>
                                <div className="save-name">{attr.toUpperCase()}</div>
                                <div className="save-bonus">{bonusStr}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal for Attribute Details */}
            {selectedAttribute && (
                <AttributeModal
                    attributeName={selectedAttribute.attributeName}
                    base={selectedAttribute.base}
                    bonus={selectedAttribute.bonus}
                    onClose={handleCloseModal}
                    onHabitsChanged={loadHabitsAndCalculateStreak}
                />
            )}
        </div>
    );
};

export default CharacterSheet;