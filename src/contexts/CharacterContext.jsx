// File: src/contexts/CharacterContext.jsx
// Fixed to use authClient and handle authentication properly

import { createContext, useContext, useState, useEffect } from 'react';
import authClient from '../api/authApi';
import { Character } from '../components/Character/Character';

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

        const characterData = selectedCharacter.toComponentFormat();
        return {
            ...characterData,
            current_hp: temporaryHp !== null ? temporaryHp : characterData.current_hp
        };
    };

    // Load available characters - FIXED to use authClient
    const loadCharacters = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Loading characters...');
            const response = await authClient.get('/character/user/characters');
            console.log('Characters response:', response.data);

            // Handle wrapped response: {"status": "success", "data": [...]}
            if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
                setAvailableCharacters(response.data.data);
                console.log('Characters loaded successfully:', response.data.data);
            } else if (Array.isArray(response.data)) {
                // Fallback: handle direct array response
                setAvailableCharacters(response.data);
                console.log('Characters loaded (direct array):', response.data);
            } else {
                console.error('Unexpected response format:', response.data);
                throw new Error('Unexpected response format from characters endpoint');
            }
        } catch (err) {
            console.error('Failed to load characters:', err);
            setError(err.message);
            // Fallback: empty array if endpoint fails
            setAvailableCharacters([]);

            // FIXED: Clear any invalid character selection
            if (err.response?.status === 401 || err.response?.status === 403) {
                clearCharacter();
            }
        } finally {
            setLoading(false);
        }
    };

    // Select a character - FIXED to use authClient
    const selectCharacter = async (characterId) => {
        try {
            setLoading(true);
            setError(null);

            console.log('Selecting character:', characterId);
            const response = await authClient.get(`/character/${characterId}`);

            if (response.data && response.data.status === 'success' && response.data.data) {
                // Create a Character instance with enhanced functionality
                const character = new Character({
                    ...response.data.data,
                    current_hp: response.data.data.current_hp || response.data.data.max_hp || 20,
                    max_hp: response.data.data.max_hp || 20,
                    level: response.data.data.level || 1,
                    current_xp: response.data.data.current_xp || 0,
                    inventory: response.data.data.inventory || {}
                });

                setSelectedCharacter(character);
                setTemporaryHp(null); // Reset temporary HP when selecting character

                // Persist selection in localStorage
                localStorage.setItem('selectedCharacterId', characterId);

                console.log('Character selected successfully:', character.toComponentFormat());
                return character;
            } else {
                throw new Error('Failed to load character data');
            }
        } catch (err) {
            console.error('Failed to select character:', err);
            setError(err.message);

            // FIXED: Clear invalid character selection
            if (err.response?.status === 401 || err.response?.status === 403 || err.response?.status === 404) {
                clearCharacter();
            }

            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Refresh current character - FIXED to use authClient
    const refreshCharacter = async () => {
        if (!selectedCharacter) return;

        try {
            setLoading(true);
            setError(null);

            const response = await authClient.get(`/character/${selectedCharacter.id}`);

            if (response.data && response.data.status === 'success' && response.data.data) {
                // Update the existing Character instance with new data
                selectedCharacter.updateFromData({
                    ...response.data.data,
                    current_hp: response.data.data.current_hp || response.data.data.max_hp || 20,
                    max_hp: response.data.data.max_hp || 20,
                    level: response.data.data.level || 1,
                    current_xp: response.data.data.current_xp || 0,
                    inventory: response.data.data.inventory || {}
                });

                // Force a re-render by setting the character again
                setSelectedCharacter(new Character(selectedCharacter.toComponentFormat()));
                setTemporaryHp(null); // Reset temporary HP when refreshing

                return selectedCharacter;
            } else {
                throw new Error('Failed to refresh character data');
            }
        } catch (err) {
            console.error('Failed to refresh character:', err);
            setError(err.message);

            // FIXED: Clear character if refresh fails due to auth issues
            if (err.response?.status === 401 || err.response?.status === 403 || err.response?.status === 404) {
                clearCharacter();
            }

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
        console.log('Character selection cleared');
    };

    // Update temporary HP (for combat)
    const updateTemporaryHp = (newHp) => {
        setTemporaryHp(newHp);
    };

    // Clear temporary HP (when combat ends)
    const clearTemporaryHp = () => {
        setTemporaryHp(null);
    };

    // Get character dice pool (new method)
    const getCharacterDicePool = () => {
        if (!selectedCharacter) {
            return {
                diceCount: 2,
                bonus: 0,
                notation: '2d6',
                details: []
            };
        }

        return selectedCharacter.getCombatDicePool();
    };

    // Get character summary (new method)
    const getCharacterSummary = () => {
        if (!selectedCharacter) return null;
        return selectedCharacter.getCharacterSummary();
    };

    // Auto-load character from localStorage on mount
    useEffect(() => {
        const savedCharacterId = localStorage.getItem('selectedCharacterId');
        if (savedCharacterId && !selectedCharacter) {
            console.log('Auto-loading saved character:', savedCharacterId);
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
        originalCharacter: selectedCharacter ? selectedCharacter.toComponentFormat() : null, // Original character data without temporary changes
        characterInstance: selectedCharacter, // Access to the Character class instance
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
        isInCombat: temporaryHp !== null,

        // New dice pool methods
        getCharacterDicePool,
        getCharacterSummary
    };

    return (
        <CharacterContext.Provider value={value}>
            {children}
        </CharacterContext.Provider>
    );
};