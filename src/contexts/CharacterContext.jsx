// frontend/src/contexts/CharacterContext.jsx

import { createContext, useContext, useState, useEffect } from 'react';
import { apiCall } from '../api/habitApi';

const CharacterContext = createContext();

export const useCharacter = () => {
    const context = useContext(CharacterContext);
    if (!context) {
        throw new Error('useCharacter must be used within a CharacterProvider');
    }
    return context;
};

export const CharacterProvider = ({ children }) => {
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [availableCharacters, setAvailableCharacters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load available characters
    const loadCharacters = async () => {
        try {
            setLoading(true);
            setError(null);

            // Use your actual endpoint - returns array directly, not wrapped in data
            const response = await apiCall('/api/characters');

            // Your endpoint returns the array directly (not wrapped in response.data)
            if (Array.isArray(response)) {
                setAvailableCharacters(response);
            } else {
                throw new Error('Unexpected response format from characters endpoint');
            }
        } catch (err) {
            console.error('Failed to load characters:', err);
            setError(err.message);
            // Fallback: empty array if endpoint fails
            setAvailableCharacters([]);
        } finally {
            setLoading(false);
        }
    };

    // Select a character
    const selectCharacter = async (characterId) => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiCall(`/api/character/${characterId}`);

            if (response.status === 'success' && response.data) {
                const characterData = {
                    ...response.data,
                    current_hp: response.data.current_hp || response.data.max_hp || 20,
                    max_hp: response.data.max_hp || 20,
                    level: response.data.level || 1,
                    current_xp: response.data.current_xp || 0,
                    inventory: response.data.inventory || {}
                };

                setSelectedCharacter(characterData);

                // Persist selection in localStorage
                localStorage.setItem('selectedCharacterId', characterId);

                return characterData;
            } else {
                throw new Error('Failed to load character data');
            }
        } catch (err) {
            console.error('Failed to select character:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Clear character selection
    const clearCharacter = () => {
        setSelectedCharacter(null);
        localStorage.removeItem('selectedCharacterId');
    };

    // Refresh current character data
    const refreshCharacter = async () => {
        if (selectedCharacter?.id) {
            await selectCharacter(selectedCharacter.id);
        }
    };

    // Load saved character on app start
    useEffect(() => {
        const savedCharacterId = localStorage.getItem('selectedCharacterId');
        if (savedCharacterId) {
            selectCharacter(savedCharacterId).catch(err => {
                console.error('Failed to load saved character:', err);
                localStorage.removeItem('selectedCharacterId');
            });
        }
    }, []);

    const value = {
        selectedCharacter,
        availableCharacters,
        loading,
        error,
        selectCharacter,
        clearCharacter,
        loadCharacters,
        refreshCharacter,
        isCharacterSelected: !!selectedCharacter
    };

    return (
        <CharacterContext.Provider value={value}>
            {children}
        </CharacterContext.Provider>
    );
};