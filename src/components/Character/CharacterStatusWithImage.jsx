// src/components/Character/CharacterStatusWithImage.jsx
import React from 'react';
import '../../styles/CharacterStatusWithImage.css';
import '../../contexts/CharacterContext'; // Ensure context is imported for useCharacter hook

const CharacterStatusWithImage = ({ character, className = "" }) => {
    if (!character) return null;

    const hpPercentage = Math.max(0, Math.min(100, (character.current_hp / character.max_hp) * 100));

    // Determine HP bar color based on percentage
    const getHPColor = () => {
        if (hpPercentage > 50) return "#10b981"; // Green
        if (hpPercentage > 25) return "#f59e0b"; // Yellow
        return "#ef4444"; // Red
    };

    return (
        <div className={`character-status-with-image ${className} ${hpPercentage <= 25 ? 'low-hp' : ''}`}>
            <div className="character-info">
                <div className="character-details">
                    <h3 className="character-name">{character.name}</h3>
                    <div className="character-stats">
                        <div className="stat-item">
                            <span className="stat-label">Level:</span>
                            <span className="stat-value">{character.level || 1}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">XP:</span>
                            <span className="stat-value">{character.current_xp || 0}</span>
                        </div>
                        {/*<div className="stat-item">*/}
                        {/*    <p><strong>Dice Pool:</strong> {characterDiceInfo.dicePool}</p>*/}
                        {/*    <p><strong>Breakdown:</strong> {characterDiceInfo.description}</p>*/}
                        {/*</div>*/}
                    </div>
                </div>

                <div className="character-image-container">
                    {/* Character Image */}
                    <div className="character-avatar-wrapper">
                        {character.image_data ? (
                            <img
                                src={character.image_data}
                                alt={character.name}
                                className="character-avatar"
                            />
                        ) : (
                            <div className="character-avatar-placeholder">
                                <span className="placeholder-icon">⚔️</span>
                            </div>
                        )}

                        {/* Straight HP Bar that starts from the image edge */}
                        <div className="hp-bar-container">
                            <div className="hp-bar-background">
                                <div
                                    className="hp-bar-fill"
                                    style={{
                                        width: `${hpPercentage}%`,
                                        backgroundColor: getHPColor()
                                    }}
                                />
                            </div>

                            {/* HP Text */}
                            <div className="hp-text-display">
                                <span className="hp-current">{character.current_hp}</span>
                                <span className="hp-separator">/</span>
                                <span className="hp-max">{character.max_hp}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CharacterStatusWithImage;