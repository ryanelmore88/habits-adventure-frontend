// src/context/CharacterContext.jsx
import React, { createContext, useContext, useState } from 'react';

const CharacterContext = createContext();

export function CharacterProvider({ children }) {
    const [characterId,   setCharacterId]   = useState('');
    const [character,     setCharacter]     = useState(null);

    function getDiceNotation() {
        if (!character?.attributes) return {};
        return Object.entries(character.attributes)
            .filter(([ability]) => ability !== 'constitution')
            .reduce((map, [ability, { bonus }]) => {
                const sign = bonus >= 0 ? '+' : '';
                map[ability] = `1d20${sign}${bonus}`;
            }, {});
    }

    return (
        <CharacterContext.Provider value={{
            characterId,
            setCharacterId,
            character,
            setCharacter,
            getDiceNotation
        }}>
            {children}
        </CharacterContext.Provider>
    );
}

// custom hook to consume
export function useCharacter() {
    return useContext(CharacterContext);
}
