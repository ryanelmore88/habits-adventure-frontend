// File: src/pages/AdventurePage.jsx
// Updated Adventure page with dedicated Skirmish section for monster battles

import { useState, useEffect } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { useCombat } from '../hooks/useCombat';
import CombatArea from '../components/CombatArea';
import CharacterStatusWithImage from '../components/Character/CharacterStatusWithImage.jsx';
import QuestAdventure from '../components/QuestAdventure/QuestAdventure';
import '../styles/Adventure.css';

export default function AdventurePage() {
    const { selectedCharacter, refreshCharacter } = useCharacter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentSection, setCurrentSection] = useState('overview'); // 'overview', 'skirmish', 'quests'

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
                if (adventureResults.loot && adventureResults.loot.length > 0) {
                    message += ` Found ${adventureResults.loot.length} items!`;
                }
            } else {
                message += ` You were defeated but gained experience from the attempt.`;
            }

            alert(message);

            // Return to overview after combat
            setCurrentSection('overview');

        } catch (error) {
            console.error('Failed to complete adventure:', error);
            alert('Adventure completed locally. Backend save will be added later.');
            setCurrentSection('overview');
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

    // Render skirmish section (monster battles)
    if (currentSection === 'skirmish') {
        return (
            <div className="adventure-page skirmish-mode">
                <div className="skirmish-header">
                    <button
                        className="back-button"
                        onClick={() => setCurrentSection('overview')}
                    >
                        ← Back to Adventure Overview
                    </button>
                </div>


                {/* Combat System */}
                <CombatArea
                    character={selectedCharacter}
                    onAdventureComplete={handleAdventureComplete}
                />
            </div>
        );
    }

    // Render quest section
    if (currentSection === 'quests') {
        return (
            <div className="adventure-page quest-mode">
                <div className="quest-header">
                    <button
                        className="back-button"
                        onClick={() => setCurrentSection('overview')}
                    >
                        ← Back to Adventure Overview
                    </button>
                </div>

                {/* Quest Adventure System */}
                <QuestAdventure onAdventureComplete={handleAdventureComplete} />
            </div>
        );
    }

    // Main adventure overview page
    return (
        <div className="adventure-page">
            <div className="adventure-header">
                <h1>🏰 Adventure Hub</h1>
                <p>Choose your path and begin your adventure!</p>
            </div>

            {/* Adventure Mode Selection */}
            <div className="adventure-modes">
                <div className="adventure-mode-grid">

                    {/* Skirmish Mode */}
                    <div
                        className="adventure-mode skirmish-mode"
                        onClick={() => setCurrentSection('skirmish')}
                    >
                        <div className="mode-icon">⚔️</div>
                        <h3>Skirmish Combat</h3>
                        <p>Quick battles against various monsters. Perfect for testing your combat abilities and gaining experience.</p>
                        <div className="mode-details">
                            <span className="detail-item">🎲 Dice-based combat</span>
                            <span className="detail-item">⚡ Quick battles</span>
                            <span className="detail-item">🏆 XP rewards</span>
                        </div>
                        <button className="mode-button">Enter Skirmish</button>
                    </div>

                    {/* Quest Mode */}
                    <div
                        className="adventure-mode quest-mode"
                        onClick={() => setCurrentSection('quests')}
                    >
                        <div className="mode-icon">📜</div>
                        <h3>Quest Adventures</h3>
                        <p>Multi-room adventures with exploration, choices, and storytelling.</p>
                        <div className="mode-details">
                            <span className="detail-item">🏛️ Multi-room exploration</span>
                            <span className="detail-item">🎯 Player choices matter</span>
                            <span className="detail-item">📖 Story-driven content</span>
                        </div>
                        <button className="mode-button">Enter Quest</button>
                    </div>

                    {/* Expedition Mode (Coming Soon) */}
                    <div className="adventure-mode expedition-mode disabled">
                        <div className="mode-icon">🗺️</div>
                        <h3>Expeditions</h3>
                        <p>Long-form adventures that can take multiple sessions to complete.</p>
                        <div className="mode-details">
                            <span className="detail-item">🏕️ Multi-session</span>
                            <span className="detail-item">👥 Team-based</span>
                            <span className="detail-item">🏰 Epic rewards</span>
                        </div>
                        <button className="mode-button disabled">Coming Soon</button>
                    </div>
                </div>
            </div>

            {/* Adventure Selection (Legacy - now just shows upcoming content) */}
            <div className="legacy-adventures">
                <h3>📅 Upcoming Adventures</h3>
                <div className="adventure-list">
                    <div className="adventure-option preview">
                        <h4>🏰 The Goblin Warren</h4>
                        <p>A multi-room dungeon filled with goblin tribes and their treasures</p>
                        <span className="difficulty">Quest Mode - Coming Soon</span>
                    </div>
                    <div className="adventure-option preview">
                        <h4>🌲 The Whispering Woods</h4>
                        <p>A mysterious forest where strange creatures and ancient magic await</p>
                        <span className="difficulty">Expedition Mode - Coming Soon</span>
                    </div>
                    <div className="adventure-option preview">
                        <h4>⛰️ Dragon's Peak</h4>
                        <p>A legendary mountain where dragons are said to guard ancient treasures</p>
                        <span className="difficulty">Epic Expedition - Coming Soon</span>
                    </div>
                </div>
            </div>

            <div className="adventure-tips">
                <h3>💡 Adventure Tips</h3>
                <ul>
                    <li><strong>Start with Skirmish:</strong> Practice combat and gain XP quickly</li>
                    <li><strong>Manage your HP:</strong> Rest between difficult battles</li>
                    <li><strong>Improve attributes:</strong> Complete habits to increase your dice pool</li>
                    <li><strong>Know your dice:</strong> Higher attribute levels = better combat dice</li>
                    <li>🚧 <strong>More adventure types coming soon!</strong></li>
                </ul>
            </div>
        </div>
    );
}