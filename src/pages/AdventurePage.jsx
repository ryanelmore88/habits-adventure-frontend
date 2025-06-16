// src/pages/AdventurePage.jsx
import { useState, useEffect } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { useCombat } from '../hooks/useCombat';
import CombatArea from '../components/CombatArea';
import CharacterStatusWithImage from '../components/Character/CharacterStatusWithImage.jsx';
import { apiCall } from '../api/habitApi.js';
import '../styles/Adventure.css';

export default function AdventurePage() {
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

                {/* Character Status with Image */}
                <CharacterStatusWithImage
                    character={selectedCharacter}
                    className="character-status-display"
                />

                <button
                    className="heal-button"
                    onClick={async () => {
                        // Simple healing - this would be replaced with proper healing system
                        await refreshCharacter();
                        alert("Rest and recover to continue your adventures!");
                    }}
                >
                    Rest and Heal
                </button>
            </div>
        );
    }

    return (
        <div className="adventure-page">

            {/* Current Combat System */}
            <CombatArea
                character={selectedCharacter}
                onAdventureComplete={handleAdventureComplete}
            />

            {/* Adventure Selection */}
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