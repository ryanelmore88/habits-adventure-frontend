// File: src/pages/CharacterPage.jsx
// Updated to use the new D&D style character sheet

import React from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import CharacterSheet from '../components/Character/CharacterSheet';

const CharacterPage = () => {
    const { selectedCharacter, isCharacterSelected } = useCharacter();

    if (!isCharacterSelected || !selectedCharacter) {
        return (
            <div className="character-page-loading">
                <div className="loading-content">
                    <h2>No Character Selected</h2>
                    <p>Please select a character from the Characters page to view their sheet.</p>
                    <div className="placeholder-icon">⚔️</div>
                </div>
            </div>
        );
    }

    return <CharacterSheet />;
};

export default CharacterPage;