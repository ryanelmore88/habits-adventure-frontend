// src/contexts/CharacterContext.jsx - Updated with temporary HP support

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

    // Add temporary HP for combat (this doesn't save to backend)
    const [temporaryHp, setTemporaryHp] = useState(null);

    // Get effective character data (with temporary HP if in combat)
    const getEffectiveCharacter = () => {
        if (!selectedCharacter) return null;

        return {
            ...selectedCharacter,
            current_hp: temporaryHp !== null ? temporaryHp : selectedCharacter.current_hp
        };
    };

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
                setTemporaryHp(null); // Reset temporary HP when selecting character

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

    // Refresh current character
    const refreshCharacter = async () => {
        if (!selectedCharacter) return;

        try {
            setLoading(true);
            setError(null);

            const response = await apiCall(`/api/character/${selectedCharacter.id}`);

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
                setTemporaryHp(null); // Reset temporary HP when refreshing

                return characterData;
            } else {
                throw new Error('Failed to refresh character data');
            }
        } catch (err) {
            console.error('Failed to refresh character:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Clear character selection
    const clearCharacter = () => {
        setSelectedCharacter(null);
        setTemporaryHp(null);
        localStorage.removeItem('selectedCharacterId');
    };

    // Update temporary HP (for combat)
    const updateTemporaryHp = (newHp) => {
        setTemporaryHp(newHp);
    };

    // Clear temporary HP (when combat ends)
    const clearTemporaryHp = () => {
        setTemporaryHp(null);
    };

    // Auto-load character from localStorage on mount
    useEffect(() => {
        const savedCharacterId = localStorage.getItem('selectedCharacterId');
        if (savedCharacterId && !selectedCharacter) {
            selectCharacter(savedCharacterId).catch(err => {
                console.warn('Failed to auto-load saved character:', err);
                localStorage.removeItem('selectedCharacterId');
            });
        }

        // Always load available characters
        loadCharacters();
    }, []);

    const value = {
        // Character data
        selectedCharacter: getEffectiveCharacter(), // Returns character with temporary HP if set
        originalCharacter: selectedCharacter, // Original character data without temporary changes
        availableCharacters,

        // State
        loading,
        error,
        isCharacterSelected: !!selectedCharacter,

        // Actions
        selectCharacter,
        refreshCharacter,
        clearCharacter,
        loadCharacters,

        // Temporary HP for combat
        updateTemporaryHp,
        clearTemporaryHp,
        isInCombat: temporaryHp !== null
    };

    return (
        <CharacterContext.Provider value={value}>
            {children}
        </CharacterContext.Provider>
    );
};