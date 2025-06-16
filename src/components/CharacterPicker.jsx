import { useState, useEffect } from 'react';
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

    if (loading) {
        return (
            <div className="character-picker loading">
                <h1>Loading Characters...</h1>
                <p>Finding your heroes...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="character-picker error">
                <h1>Error Loading Characters</h1>
                <p>{error}</p>
                <button onClick={loadCharacters}>Try Again</button>

                {/* Fallback for testing */}
                <div className="fallback-section">
                    <h3>Or create a test character:</h3>
                    <button onClick={() => handleSelectCharacter('88961297876748847')}>
                        Use Test Character (Vigil Sortitus)
                    </button>
                </div>
            </div>
        );
    }

    if (availableCharacters.length === 0) {
        return (
            <div className="character-picker no-characters">
                <h1>No Characters Found</h1>
                <p>You don't have any characters yet.</p>
                <button onClick={() => navigate('/character/create')}>
                    Create Your First Character
                </button>

                {/* Fallback for testing */}
                <div className="fallback-section">
                    <h3>Or use a test character:</h3>
                    <button onClick={() => handleSelectCharacter('88961297876748847')}>
                        Use Test Character (Vigil Sortitus)
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="character-picker">
            <header className="picker-header">
                <h1>Choose Your Character</h1>
                <p>Select which character you want to play with</p>
            </header>

            <div className="character-grid">
                {availableCharacters.map(character => (
                    <div key={character.id} className="character-card">
                        <h3>{character.name}</h3>
                        <div className="character-stats">
                            <div className="stat">
                                <label>Level</label>
                                <span>{character.level || 1}</span>
                            </div>
                            <div className="stat">
                                <label>HP</label>
                                <span>{character.current_hp || character.max_hp || 20}/{character.max_hp || 20}</span>
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
                                    {Object.entries(character.attributes).map(([name, data]) => (
                                        <div key={name} className="attribute">
                                            <span className="attr-name">{name.slice(0, 3).toUpperCase()}</span>
                                            <span className="attr-value">{data.total || 0}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            className="select-button"
                            onClick={() => handleSelectCharacter(character.id)}
                            disabled={selecting}
                        >
                            {selecting ? 'Selecting...' : 'Select Character'}
                        </button>
                    </div>
                ))}
            </div>

            <div className="picker-actions">
                <button
                    className="create-new-button"
                    onClick={() => navigate('/character/create')}
                >
                    Create New Character
                </button>
            </div>
        </div>
    );
}