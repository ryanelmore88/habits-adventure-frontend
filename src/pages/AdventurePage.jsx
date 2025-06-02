import { useState, useEffect } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { useCombat } from '../hooks/useCombat';
import CombatArea from '../components/CombatArea';
import { apiCall } from '../api/habitApi.js';

export default function AdventurePage() {  // No more props needed!
    const { selectedCharacter, refreshCharacter } = useCharacter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Simplified adventure completion
    const handleAdventureComplete = async (adventureResults) => {
        try {
            // Update local character state
            const hpChange = adventureResults.hpChange;
            const xpGained = adventureResults.xpGained;

            // Refresh character data from backend
            await refreshCharacter();

            // Show success message
            let message = `Adventure Complete!`;
            if (adventureResults.victory) {
                message += ` You gained ${xpGained} XP!`;
                if (adventureResults.loot.length > 0) {
                    message += ` Found ${adventureResults.loot.length} items!`;
                }
            } else {
                message += ` You were defeated but gained experience from the attempt.`;
            }

            alert(message);

        } catch (error) {
            console.error('Failed to complete adventure:', error);
            alert('Adventure completed locally. Backend save will be added later.');
        }
    };

    // Check if character can adventure
    const canAdventure = selectedCharacter && selectedCharacter.current_hp > 0;

    if (!selectedCharacter) {
        return (
            <div className="adventure-page error">
                <h1>No Character Selected</h1>
                <p>Please select a character first.</p>
            </div>
        );
    }

    if (!canAdventure) {
        return (
            <div className="adventure-page cannot-adventure">
                <h1>Cannot Adventure</h1>
                <p>Your character has 0 HP and needs healing before adventuring.</p>
                <div className="character-status">
                    <h3>{selectedCharacter.name}</h3>
                    <p>HP: {selectedCharacter.current_hp}/{selectedCharacter.max_hp}</p>
                    <p>Level: {selectedCharacter.level}</p>
                    <p>XP: {selectedCharacter.current_xp}</p>
                </div>
                <button onClick={async () => {
                    // Simple healing - this would be replaced with proper healing system
                    await refreshCharacter();
                    alert("Rest and recover to continue your adventures!");
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
                    <h2>{selectedCharacter.name}</h2>
                    <div className="character-stats">
                        <div className="stat">
                            <label>HP:</label>
                            <span>{selectedCharacter.current_hp}/{selectedCharacter.max_hp}</span>
                        </div>
                        <div className="stat">
                            <label>Level:</label>
                            <span>{selectedCharacter.level}</span>
                        </div>
                        <div className="stat">
                            <label>XP:</label>
                            <span>{selectedCharacter.current_xp}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Adventure Selection (for future) */}
            <div className="adventure-selection">
                <h3>Available Adventures</h3>
                <div className="adventure-list">
                    <div className="adventure-option default">
                        <h4>🏰 Goblin Cave</h4>
                        <p>A classic adventure perfect for gaining experience</p>
                        <span className="difficulty">Recommended Level: 1-3</span>
                    </div>
                    {/* Future adventures will go here */}
                </div>
            </div>

            {/* Current Combat System */}
            <CombatArea
                character={selectedCharacter}
                onAdventureComplete={handleAdventureComplete}
            />

            <div className="adventure-tips">
                <h3>Adventure Tips</h3>
                <ul>
                    <li>Choose your battles wisely - stronger enemies give more XP but are more dangerous</li>
                    <li>Your highest attribute bonus is added to your combat rolls</li>
                    <li>Complete habits to improve your attributes and combat effectiveness</li>
                    <li>🚧 More adventures coming soon!</li>
                </ul>
            </div>
        </div>
    );
}