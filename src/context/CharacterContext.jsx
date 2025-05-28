// src/context/CharacterContext.jsx
import React, { createContext, useContext, useState } from 'react';

const CharacterContext = createContext();

export function CharacterProvider({ children }) {
    const [characterId,   setCharacterId]   = useState('');
    const [character,     setCharacter]     = useState(null);

    return (
        <CharacterContext.Provider value={{
            characterId,
            setCharacterId,
            character,
            setCharacter
        }}>
            {children}
        </CharacterContext.Provider>
    );
}

// custom hook to consume
export function useCharacter() {
    return useContext(CharacterContext);
}
