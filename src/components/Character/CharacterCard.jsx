// src/components/CharacterCard.jsx
import React, { useState } from 'react';
import { useCharacter } from '../../contexts/CharacterContext.jsx';

const CharacterCard = ({ characterName }) => {
    // Access characterId and setter from contexts.
    const { characterId, setCharacterId } = useCharacter();
    // Local state to hold the temporary value from the text input.
    const [tempId, setTempId] = useState(characterId || "");

    const handleIdChange = (e) => {
        setTempId(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Update contexts with the entered character ID.
        setCharacterId(tempId);
    };

    return (
        <div className="character-card">
            <h2>{characterName}</h2>
            {characterId ? (
                <p>Character ID: {characterId}</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={tempId}
                        onChange={handleIdChange}
                        placeholder="Enter Character ID"
                    />
                    <button type="submit">Set ID</button>
                </form>
            )}
        </div>
    );
};

export default CharacterCard;
