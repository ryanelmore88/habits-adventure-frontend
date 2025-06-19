// File: src/components/Character/CharacterStatusWithImage.jsx
// Rewritten with longer HP bar and better positioning

import React from 'react';
import { useCharacter } from '../../contexts/CharacterContext';
import '../../styles/CharacterStatusWithImage.css';

const CharacterStatusWithImage = ({ character, className = "" }) => {
    const { getCharacterDicePool } = useCharacter();

    if (!character) return null;

    const hpPercentage = Math.max(0, Math.min(100, (character.current_hp / character.max_hp) * 100));

    // Get dice pool information
    const dicePool = getCharacterDicePool();

    // Determine HP bar color based on percentage
    const getHPColor = () => {
        if (hpPercentage > 50) return "#10b981"; // Green
        if (hpPercentage > 25) return "#f59e0b"; // Yellow
        return "#ef4444"; // Red
    };

    return (
        <div className={`character-status-with-image ${className} ${hpPercentage <= 25 ? 'low-hp' : ''}`}>
            <div className="character-info">
                <div className="character-image-container">
                    {/* Character Image */}
                    <div className="character-avatar-wrapper">
                        <div className="character-image-section">
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
                        </div>
                    </div>

                    <div className="hp-bar-info-overlay">
                        <div className="character-name-overlay">{character.name}</div>
                        <div className="character-stats-overlay">
                            <span className="stat-item-overlay">
                                <span className="stat-label-overlay">Level:</span>
                                <span className="stat-value-overlay">{character.level || 1}</span>
                            </span>
                                                <span className="stat-item-overlay dice-pool-overlay">
                                <span className="stat-label-overlay">Dice Pool:</span>
                                <span className="stat-value-overlay dice-notation-overlay">{dicePool.notation || '2d6'}</span>
                            </span>
                        </div>
                    </div>

                    {/* HP Bar that starts from the image edge - LONGER VERSION */}
                    <div className="hp-bar-container-new">
                        <div className="hp-bar-background-new">
                            <div
                                className="hp-bar-fill-new"
                                style={{
                                    width: `${hpPercentage}%`,
                                    backgroundColor: getHPColor()
                                }}
                            />
                        </div>

                        {/* HP Text positioned beneath the bar */}
                        <div className="hp-text-display-new">
                            <span className="hp-current">{character.current_hp || 0}</span>
                            <span className="hp-separator">/</span>
                            <span className="hp-max">{character.max_hp || 20}</span>
                        </div>
                    </div>
                </div>

                {/*<div className="character-details">*/}
                {/*    <h3 className="character-name">{character.name}</h3>*/}
                {/*    <div className="character-stats">*/}
                {/*        <div className="stat-item">*/}
                {/*            <span className="stat-label">Level:</span>*/}
                {/*            <span className="stat-value">{character.level || 1}</span>*/}
                {/*        </div>*/}
                {/*        <div className="stat-item">*/}
                {/*            <span className="stat-label">XP:</span>*/}
                {/*            <span className="stat-value">{character.current_xp || 0}</span>*/}
                {/*        </div>*/}
                {/*        <div className="stat-item dice-pool-stat">*/}
                {/*            <span className="stat-label">Dice Pool:</span>*/}
                {/*            <span className="stat-value dice-notation">{dicePool.notation || '2d6'}</span>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*</div>*/}
            </div>
        </div>
    );
};

export default CharacterStatusWithImage;