// File: src/components/Character/AttributeDisplay.jsx
// Enhanced component to display attribute levels and dice pools - Fixed Constitution NaN issue

import React from 'react';
import '../../styles/AttributeDisplay.css';

const AttributeDisplay = ({ character, onAttributeClick, className = "" }) => {
    if (!character || !character.attributes) {
        return (
            <div className={`attribute-display ${className}`}>
                <p>No attributes available</p>
            </div>
        );
    }

    const getAttributeLevelName = (level) => {
        const levelNames = {
            1: 'Novice',
            2: 'Trained',
            3: 'Expert',
            4: 'Master',
            5: 'Legendary'
        };
        return levelNames[Math.min(level, 5)] || 'Legendary';
    };

    const getAttributeLevelColor = (level) => {
        const colors = {
            1: '#6b7280', // Gray - Novice
            2: '#10b981', // Green - Trained
            3: '#3b82f6', // Blue - Expert
            4: '#8b5cf6', // Purple - Master
            5: '#f59e0b'  // Gold - Legendary
        };
        return colors[Math.min(level, 5)] || '#f59e0b';
    };

    // Calculate D&D style bonus from effective score
    const calculateDnDBonus = (effectiveScore) => {
        return Math.floor((effectiveScore - 10) / 2);
    };

    const attributeOrder = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

    return (
        <div className={`attribute-display ${className}`}>
            <div className="attributes-grid">
                {attributeOrder.map(attrName => {
                    const attribute = character.attributes[attrName];
                    if (!attribute) return null;

                    const isConstitution = attrName === 'constitution';
                    const levelName = getAttributeLevelName(attribute.level);
                    const levelColor = getAttributeLevelColor(attribute.level);

                    // Calculate D&D bonus from effective score
                    const dndBonus = calculateDnDBonus(attribute.effectiveScore || 10);

                    return (
                        <div
                            key={attrName}
                            className={`attribute-card ${isConstitution ? 'constitution' : 'combat'}`}
                            onClick={() => onAttributeClick && onAttributeClick(attrName)}
                            style={{ '--level-color': levelColor }}
                        >
                            {/* Attribute Header */}
                            <div className="attribute-header">
                                <h4 className="attribute-name">
                                    {attrName.charAt(0).toUpperCase() + attrName.slice(1)}
                                </h4>
                                <div
                                    className="attribute-level-badge"
                                    style={{ backgroundColor: levelColor }}
                                >
                                    Level {attribute.level}
                                </div>
                            </div>

                            {/* Level Name */}
                            <div className="attribute-level-name">
                                {levelName}
                            </div>

                            {/* Main Contribution */}
                            <div className="attribute-contribution">
                                {isConstitution ? (
                                    <>
                                        <div className="contribution-icon">❤️</div>
                                        <div className="contribution-text">
                                            <span className="contribution-value">
                                                +{attribute.hpBonus || 0}
                                            </span>
                                            <span className="contribution-label">HP</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="contribution-icon">🎲</div>
                                        <div className="contribution-text">
                                            <span className="contribution-value">
                                                {attribute.diceNotation || '1d4'}
                                            </span>
                                            <span className="contribution-label">Dice</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Attribute Breakdown */}
                            <div className="attribute-breakdown">
                                <div className="breakdown-row">
                                    <span className="breakdown-label">Base Score:</span>
                                    <span className="breakdown-value">{attribute.base || 10}</span>
                                </div>
                                <div className="breakdown-row">
                                    <span className="breakdown-label">Habit Points:</span>
                                    <span className="breakdown-value">{attribute.habitPoints || 0}</span>
                                </div>
                                <div className="breakdown-row">
                                    <span className="breakdown-label">Effective Score:</span>
                                    <span className="breakdown-value">{attribute.effectiveScore || 10}</span>
                                </div>
                                <div className="breakdown-row">
                                    <span className="breakdown-label">D&D Bonus:</span>
                                    <span className="breakdown-value">
                                        {dndBonus >= 0 ? '+' : ''}{dndBonus}
                                    </span>
                                </div>
                            </div>

                            {/* Special Note for Constitution */}
                            {isConstitution && (
                                <div className="attribute-note">
                                    Constitution affects HP, not combat dice
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Combat Summary */}
            {character.getCombatDicePool && (
                <div className="combat-summary">
                    <h3>Combat Dice Pool</h3>
                    <div className="combat-dice-display">
                        <div className="dice-pool-main">
                            <span className="dice-notation">
                                {character.getCombatDicePool().notation || '1d4'}
                            </span>
                            <span className="dice-description">
                                ({character.getCombatDicePool().totalDice || 1} total dice)
                            </span>
                        </div>
                        <p className="dice-explanation">
                            Your combat dice pool combines all attributes except Constitution.
                            Higher attribute levels grant better dice!
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttributeDisplay;