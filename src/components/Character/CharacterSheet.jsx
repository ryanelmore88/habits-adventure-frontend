// File: src/components/Character/CharacterSheet.jsx
// Updated to use the new attribute level system and AttributeDisplay

import { useState } from 'react';
import { useCharacter } from '../../contexts/CharacterContext';
import CharacterImageUpload from './CharacterImageUpload';
import AttributeDisplay from './AttributeDisplay';
import AttributeModal from '../AttributeModal';
import '../../styles/CharacterSheet.css';

const CharacterSheet = () => {
    const { selectedCharacter, characterInstance, refreshCharacter } = useCharacter();
    const [selectedAttribute, setSelectedAttribute] = useState(null);

    if (!selectedCharacter) {
        return (
            <div className="character-sheet-loading">
                <h2>No Character Selected</h2>
                <p>Please select a character to view their sheet.</p>
            </div>
        );
    }

    const handleAttributeClick = (attributeName) => {
        const attribute = selectedCharacter.attributes[attributeName];
        if (attribute) {
            setSelectedAttribute({
                attributeName: attributeName,
                base: attribute.base || 10,
                bonus: attribute.bonus || 0,
                level: attribute.level || 1,
                habitPoints: attribute.habitPoints || 0
            });
        }
    };

    const handleCloseModal = () => {
        setSelectedAttribute(null);
    };

    // Handle image update
    const handleImageUpdate = async (imageData) => {
        try {
            // Refresh character data to get updated image
            await refreshCharacter();
        } catch (error) {
            console.error('Failed to refresh character after image update:', error);
        }
    };

    // Get character summary for display
    const characterSummary = characterInstance ? characterInstance.getCharacterSummary() : null;

    return (
        <div className="character-sheet">
            {/* Character Header with Image */}
            {/*<div className="character-header">*/}
            {/*    <div className="character-header-content">*/}
            {/*        /!* Character Image Section *!/*/}
            {/*        <div className="character-image-section">*/}
            {/*            <CharacterImageUpload*/}
            {/*                character={selectedCharacter}*/}
            {/*                onImageUpdate={handleImageUpdate}*/}
            {/*                className="character-avatar-upload"*/}
            {/*            />*/}
            {/*        </div>*/}

            {/*        /!* Character Basic Info *!/*/}
            {/*        <div className="character-info">*/}
            {/*            <h1>{selectedCharacter.name}</h1>*/}
            {/*            <div className="character-stats">*/}
            {/*                <div className="stat">*/}
            {/*                    <label>Level</label>*/}
            {/*                    <span>{selectedCharacter.level || 1}</span>*/}
            {/*                </div>*/}
            {/*                <div className="stat">*/}
            {/*                    <label>HP</label>*/}
            {/*                    <span>{selectedCharacter.current_hp || 0}/{selectedCharacter.max_hp || 20}</span>*/}
            {/*                </div>*/}
            {/*                <div className="stat">*/}
            {/*                    <label>XP</label>*/}
            {/*                    <span>{selectedCharacter.current_xp || 0}</span>*/}
            {/*                </div>*/}
            {/*            </div>*/}

            {/*            /!* Enhanced Character Summary *!/*/}
            {/*            {characterSummary && (*/}
            {/*                <div className="character-summary-enhanced">*/}
            {/*                    <div className="summary-item">*/}
            {/*                        <span className="summary-label">Combat Dice:</span>*/}
            {/*                        <span className="summary-value">{characterSummary.combatDice}</span>*/}
            {/*                    </div>*/}
            {/*                    <div className="summary-item">*/}
            {/*                        <span className="summary-label">Highest Attribute:</span>*/}
            {/*                        <span className="summary-value">*/}
            {/*                            {characterSummary.highestAttribute.name} (Level {characterSummary.highestAttribute.level} - {characterSummary.highestAttribute.levelName})*/}
            {/*                        </span>*/}
            {/*                    </div>*/}
            {/*                    <div className="summary-item">*/}
            {/*                        <span className="summary-label">Constitution Bonus:</span>*/}
            {/*                        <span className="summary-value">+{characterSummary.constitution.hpBonus} HP</span>*/}
            {/*                    </div>*/}
            {/*                </div>*/}
            {/*            )}*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*</div>*/}

            {/* Enhanced Attributes Section */}
            <div className="attributes-section">
                <div className="section-header">
                    <h2>Character Attributes</h2>
                    <p className="section-description">
                        Each attribute has its own level based on base score + habit points.
                        Constitution affects HP, while other attributes contribute to your combat dice pool.
                    </p>
                </div>

                <AttributeDisplay
                    character={characterInstance}
                    onAttributeClick={handleAttributeClick}
                />
            </div>

            {/* Progression Info */}
            <div className="progression-section">
                <h3>Attribute Progression Guide</h3>
                <div className="progression-info">
                    <div className="progression-item">
                        <h4>Attribute Levels</h4>
                        <div className="level-guide">
                            <div className="level-item">
                                <span className="level-badge level-1">Level 1</span>
                                <span className="level-name">Novice</span>
                                <span className="level-requirement">(Score 10-11)</span>
                            </div>
                            <div className="level-item">
                                <span className="level-badge level-2">Level 2</span>
                                <span className="level-name">Trained</span>
                                <span className="level-requirement">(Score 12-13)</span>
                            </div>
                            <div className="level-item">
                                <span className="level-badge level-3">Level 3</span>
                                <span className="level-name">Expert</span>
                                <span className="level-requirement">(Score 14-15)</span>
                            </div>
                            <div className="level-item">
                                <span className="level-badge level-4">Level 4</span>
                                <span className="level-name">Master</span>
                                <span className="level-requirement">(Score 16-19)</span>
                            </div>
                            <div className="level-item">
                                <span className="level-badge level-5">Level 5</span>
                                <span className="level-name">Legendary</span>
                                <span className="level-requirement">(Score 20+)</span>
                            </div>
                        </div>
                    </div>

                    <div className="progression-item">
                        <h4>How to Improve</h4>
                        <ul>
                            <li><strong>Complete Habits:</strong> Every 5 habit points increases your effective score by 1</li>
                            <li><strong>Higher Levels:</strong> Grant more dice and bonuses for combat</li>
                            <li><strong>Constitution:</strong> Each +1 bonus adds +2 to maximum HP</li>
                            <li><strong>Combat Attributes:</strong> Strength, Dexterity, Intelligence, Wisdom, and Charisma all contribute dice to your combat pool</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Attribute Modal */}
            {selectedAttribute && (
                <AttributeModal
                    attributeName={selectedAttribute.attributeName}
                    base={selectedAttribute.base}
                    bonus={selectedAttribute.bonus}
                    level={selectedAttribute.level}
                    habitPoints={selectedAttribute.habitPoints}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default CharacterSheet;