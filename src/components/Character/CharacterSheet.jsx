// File: src/components/Character/CharacterSheet.jsx
// D&D 5e style character sheet based on the reference image

import { useState } from 'react';
import { useCharacter } from '../../contexts/CharacterContext';
import CharacterImageUpload from './CharacterImageUpload';
import AttributeModal from '../AttributeModal';
import '../../styles/CharacterSheet.css';

const CharacterSheet = () => {
    const { selectedCharacter, refreshCharacter } = useCharacter();
    const [selectedAttribute, setSelectedAttribute] = useState(null);

    if (!selectedCharacter) {
        return (
            <div className="character-sheet-loading">
                <h2>No Character Selected</h2>
                <p>Please select a character to view their sheet.</p>
            </div>
        );
    }

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

    // Calculate AC (base 10 + dex modifier + any bonuses)
    const getArmorClass = () => {
        const dexScore = getAttributeScore('dexterity');
        const dexMod = Math.floor((dexScore - 10) / 2);
        return 10 + dexMod + 3; // +3 for basic armor/natural armor
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
            setSelectedAttribute({
                attributeName: attributeName,
                base: attr.base || 10,
                bonus: Math.floor(((attr.base || 10) - 10) / 2) + Math.floor((attr.habit_points || 0) / 5),
                habitPoints: attr.habit_points || 0
            });
        }
    };

    const handleCloseModal = () => {
        setSelectedAttribute(null);
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
                {/* Armor Class */}
                <div className="stat-card armor-class">
                    <div className="stat-value">{getArmorClass()}</div>
                    <div className="stat-label">ARMOR<br/>CLASS</div>
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
                        className="character-portrait"
                    />
                    <div className="heroic-inspiration">
                        <div className="inspiration-icon">✨</div>
                        <div className="inspiration-text">HEROIC<br/>INSPIRATION</div>
                    </div>
                </div>

                {/* Hit Points */}
                <div className="stat-card hit-points">
                    <div className="stat-value">{selectedCharacter.current_hp || getMaxHP()}/{getMaxHP()}</div>
                    <div className="stat-label">HIT POINTS</div>
                    <div className="hp-bar">
                        <div
                            className="hp-fill"
                            style={{
                                width: `${Math.max(0, ((selectedCharacter.current_hp || getMaxHP()) / getMaxHP()) * 100)}%`
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Feature Icons Row */}
            <div className="feature-icons">
                <div className="feature-icon">🔥</div>
                <div className="feature-icon">⚙️</div>
            </div>

            {/* Abilities, Saves, Senses Section */}
            <div className="abilities-header">
                <div className="abilities-title">
                    <span className="abilities-icon">🎯</span>
                    Abilities, Saves, Senses
                </div>
                <div className="abilities-actions">
                    <div className="action-icon">⚡</div>
                    <div className="action-icon">🎲</div>
                </div>
            </div>

            {/* Main Attributes Grid */}
            <div className="attributes-grid">
                {attributes.map((attributeName) => {
                    const score = getAttributeScore(attributeName);
                    const modifier = getModifier(score);

                    return (
                        <div
                            key={attributeName}
                            className="attribute-card clickable"
                            onClick={() => handleAttributeClick(attributeName)}
                        >
                            <div className="attribute-name">
                                {attributeName.toUpperCase()}
                            </div>
                            <div className="attribute-modifier">
                                {modifier}
                            </div>
                            <div className="attribute-score">
                                {score}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Saving Throws Section */}
            <div className="saving-throws-section">
                <h3>Saving Throws</h3>
                <div className="saving-throws-grid">
                    {attributes.map((attributeName) => {
                        const score = getAttributeScore(attributeName);
                        const modifier = getModifier(score);
                        const isProficient = ['dexterity', 'wisdom'].includes(attributeName); // Example proficiencies

                        return (
                            <div key={attributeName} className="saving-throw-item">
                                <div className="proficiency-indicator">
                                    <div className={`proficiency-dot ${isProficient ? 'proficient' : ''}`}></div>
                                </div>
                                <div className="saving-throw-name">
                                    {attributeName.toUpperCase()}
                                </div>
                                <div className="saving-throw-modifier">
                                    {isProficient ? getModifier(score + 2) : modifier}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CharacterSheet;