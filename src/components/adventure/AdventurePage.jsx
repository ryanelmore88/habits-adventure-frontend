// frontend/src/pages/AdventurePage.jsx

import { useState, useEffect } from 'react';
import { useCombat } from '../../hooks/useCombat'; // Import your custom combat hook
import CombatArea from '../CombatArea'; // Import the combat area component
import { apiCall } from '../../api/habitApi.js'; // Reuse your existing API utility
import '../../styles/Adventure.css'; // Import your styles

export default function AdventurePage({ selectedCharacter }) {
    const [character, setCharacter] = useState(null);
    const [adventureStatus, setAdventureStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    console.log('AdventurePage received selectedCharacter:', selectedCharacter);
    console.log('selectedCharacter?.id:', selectedCharacter?.id);

    // Load character and adventure status
    useEffect(() => {
        const loadAdventureData = async () => {
            // DEBUG: More logging
            console.log('useEffect triggered with selectedCharacter:', selectedCharacter);
            if (!selectedCharacter?.id) {
                setError("No character selected");
                setLoading(false);
                return;
            }

            //debug
            console.log('Attempting to load character with ID:', selectedCharacter.id);

            try {
                setLoading(true);
                setError(null);

                // Get adventure status (includes current HP, XP, inventory)
                const statusResponse = await apiCall(`/api/adventure/${selectedCharacter.id}/status`);

                if (response.status === 'success' && response.data) {
                    const characterData = response.data;
                    console.log('Character data received:', characterData);

                    // Add default adventure properties if missing
                    const adventureCharacter = {
                        ...characterData,
                        current_hp: characterData.current_hp || characterData.max_hp || 20,
                        max_hp: characterData.max_hp || 20,
                        level: characterData.level || 1,
                        current_xp: characterData.current_xp || 0,
                        inventory: characterData.inventory || {}
                    };

                    console.log('Setting character to:', adventureCharacter);
                    setCharacter(adventureCharacter);
                } else {
                    throw new Error('Failed to load character data');
                }

            } catch (err) {
                console.error('Failed to load character data:', err);
                setError('Failed to load character data: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        loadAdventureData();
    }, [selectedCharacter]);

    // Handle adventure completion (called from CombatArea)
    const handleAdventureComplete = async (adventureResults) => {
        try {
            const response = await apiCall(`/api/adventure/${character.id}/complete`, {
                method: 'POST',
                body: JSON.stringify({
                    characterId: character.id,
                    hpChange: adventureResults.hpChange,
                    xpGained: adventureResults.xpGained,
                    loot: adventureResults.loot,
                    victory: adventureResults.victory
                })
            });

            if (response.status === 'success') {
                // Refresh character status after adventure
                const statusResponse = await apiCall(`/api/adventure/${character.id}/status`);
                if (statusResponse.status === 'success') {
                    setCharacter(statusResponse.character);
                    setAdventureStatus(statusResponse);
                }

                // Show success message
                alert(`Adventure Complete! ${response.message}`);
            } else {
                throw new Error(response.message || 'Failed to complete adventure');
            }

        } catch (error) {
            console.error('Failed to complete adventure:', error);
            alert('Failed to complete adventure: ' + error.message);
            throw error; // Re-throw so CombatArea can handle it
        }
    };

    if (loading) {
        return (
            <div className="adventure-page loading">
                <h1>Loading Adventure...</h1>
                <p>Preparing your journey...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="adventure-page error">
                <h1>Adventure Error</h1>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>
                    Try Again
                </button>
            </div>
        );
    }

    if (!character) {
        return (
            <div className="adventure-page no-character">
                <h1>No Character</h1>
                <p>Please select a character to begin your adventure.</p>
            </div>
        );
    }

    if (!adventureStatus?.can_adventure) {
        return (
            <div className="adventure-page cannot-adventure">
                <h1>Cannot Adventure</h1>
                <p>Your character has 0 HP and needs healing before adventuring.</p>
                <div className="character-status">
                    <h3>{character.name}</h3>
                    <p>HP: {character.current_hp}/{character.max_hp}</p>
                    <p>Level: {character.level}</p>
                    <p>XP: {character.current_xp}</p>
                </div>
                <button onClick={() => {
                    // TODO: Add healing/rest functionality
                    alert("Healing system not yet implemented");
                }}>
                    Rest and Heal
                </button>
            </div>
        );
    }

    return (
        <div className="adventure-page">
            <header className="adventure-header">
                <h1>Adventure Awaits</h1>
                <div className="character-summary">
                    <h2>{character.name}</h2>
                    <div className="character-stats">
                        <div className="stat">
                            <label>HP:</label>
                            <span>{character.current_hp}/{character.max_hp}</span>
                        </div>
                        <div className="stat">
                            <label>Level:</label>
                            <span>{character.level}</span>
                        </div>
                        <div className="stat">
                            <label>XP:</label>
                            <span>{character.current_xp}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Inventory Display */}
            {character.inventory && Object.keys(character.inventory).length > 0 && (
                <div className="inventory-summary">
                    <h3>Inventory</h3>
                    <div className="inventory-items">
                        {Object.entries(character.inventory).map(([item, quantity]) => (
                            <div key={item} className="inventory-item">
                                <span className="item-name">{item}</span>
                                <span className="item-quantity">×{quantity}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Combat Area */}
            <CombatArea
                character={character}
                onAdventureComplete={handleAdventureComplete}
            />

            {/* Adventure Tips */}
            <div className="adventure-tips">
                <h3>Adventure Tips</h3>
                <ul>
                    <li>Choose your battles wisely - stronger enemies give more XP but are more dangerous</li>
                    <li>Your highest attribute bonus is added to your combat rolls</li>
                    <li>If you die, you'll need to heal before adventuring again</li>
                    <li>Completing habits improves your attributes and combat effectiveness</li>
                </ul>
            </div>
        </div>
    );
}