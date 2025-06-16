// src/components/CharacterStatusWithImage.jsx
import React from 'react';
import '../../styles/CharacterStatusWithImage.css';

const CharacterStatusWithImage = ({ character, className = "" }) => {
    if (!character) return null;

    const hpPercentage = Math.max(0, Math.min(100, (character.current_hp / character.max_hp) * 100));

    // Calculate the curved path for HP bar
    const radius = 80; // Radius of the character image
    const strokeWidth = 12;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (hpPercentage / 100) * circumference;

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

                        {/* Curved HP Bar around the image */}
                        <svg
                            className="hp-ring"
                            height={radius * 2}
                            width={radius * 2}
                        >
                            {/* Background circle */}
                            <circle
                                stroke="#374151"
                                fill="transparent"
                                strokeWidth={strokeWidth}
                                r={normalizedRadius}
                                cx={radius}
                                cy={radius}
                            />
                            {/* HP progress circle */}
                            <circle
                                stroke={getHPColor()}
                                fill="transparent"
                                strokeWidth={strokeWidth}
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                r={normalizedRadius}
                                cx={radius}
                                cy={radius}
                                transform={`rotate(-90 ${radius} ${radius})`}
                                className="hp-progress"
                            />
                        </svg>

                        {/* HP Text */}
                        <div className="hp-text-overlay">
                            <span className="hp-current">{character.current_hp}</span>
                            <span className="hp-separator">/</span>
                            <span className="hp-max">{character.max_hp}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CharacterStatusWithImage;