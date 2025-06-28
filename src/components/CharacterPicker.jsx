// File: src/components/CharacterPicker.jsx
// Updated character picker with improved empty state

import React, { useState, useEffect } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { useNavigate } from 'react-router-dom';
import '../styles/CharacterPicker.css';

export default function CharacterPicker() {
    const {
        availableCharacters,
        loading,
        error,
        selectCharacter,
        loadCharacters
    } = useCharacter();
    const [selecting, setSelecting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadCharacters();
    }, []);

    const handleSelectCharacter = async (characterId) => {
        try {
            setSelecting(true);
            await selectCharacter(characterId);
            // Navigate to character page after selection
            navigate('/character');
        } catch (err) {
            alert('Failed to select character: ' + err.message);
        } finally {
            setSelecting(false);
        }
    };

    const handleCreateCharacter = () => {
        navigate('/character/create');
    };

    if (loading) {
        return (
            <div className="character-picker loading">
                <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <h1>Loading Characters...</h1>
                    <p>Finding your heroes...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="character-picker error">
                <div className="error-content">
                    <h1>Error Loading Characters</h1>
                    <p>{error}</p>
                    <div className="error-actions">
                        <button onClick={loadCharacters} className="retry-button">
                            Try Again
                        </button>
                        <button onClick={handleCreateCharacter} className="create-button">
                            Create New Character
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Empty state - no characters exist
    if (availableCharacters.length === 0) {
        return (
            <div className="character-picker no-characters">
                <div className="empty-state">
                    <div className="empty-state-icon">
                        ⚔️
                    </div>
                    <h1>Welcome, Adventurer!</h1>
                    <p>You don't have any characters yet. Create your first character to begin your habit-building adventure!</p>

                    <div className="empty-state-features">
                        <div className="feature">
                            <span className="feature-icon">🏋️</span>
                            <span>Track habits to build character attributes</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon">🎲</span>
                            <span>Battle monsters in epic adventures</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon">📈</span>
                            <span>Level up as you complete goals</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCreateCharacter}
                        className="create-first-character-button"
                    >
                        Create Your First Character
                    </button>
                </div>
            </div>
        );
    }

    // Normal state - show character list
    return (
        <div className="character-picker">
            <header className="picker-header">
                <h1>Choose Your Character</h1>
                <p>Select which character you want to play with</p>
            </header>

            <div className="character-grid">
                {availableCharacters.map(character => (
                    <div key={character.character_id} className="character-card">
                        <div className="character-image">
                            {character.image_data ? (
                                <img
                                    src={character.image_data}
                                    alt={character.name}
                                    className="character-avatar"
                                />
                            ) : (
                                <div className="character-placeholder">
                                    <span className="placeholder-icon">👤</span>
                                </div>
                            )}
                        </div>

                        <div className="character-info">
                            <h3>{character.name}</h3>

                            <div className="character-stats">
                                <div className="stat">
                                    <label>Level</label>
                                    <span>{character.level || 1}</span>
                                </div>
                                <div className="stat">
                                    <label>XP</label>
                                    <span>{character.current_xp || 0}</span>
                                </div>
                            </div>

                            {character.attributes && (
                                <div className="attribute-summary">
                                    <h4>Attributes</h4>
                                    <div className="attributes">
                                        {Object.entries(character.attributes).slice(0, 6).map(([name, data]) => (
                                            <div key={name} className="attribute">
                                                <span className="attr-name">{name.slice(0, 3).toUpperCase()}</span>
                                                <span className="attr-value">{data.base || 10}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                className="select-button"
                                onClick={() => handleSelectCharacter(character.character_id)}
                                disabled={selecting}
                            >
                                {selecting ? 'Selecting...' : 'Select Character'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="picker-actions">
                <button
                    className="create-new-button"
                    onClick={handleCreateCharacter}
                >
                    Create New Character
                </button>
            </div>
        </div>
    );
}