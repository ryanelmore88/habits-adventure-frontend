import React, { useEffect, useState } from 'react';
import { fetchCharacter } from './api/characterApi';
import CharacterSheet from './components/Character/CharacterSheet.jsx';
import './styles/index.css';
import {createHabit} from "./api/habitApi.js";

function App() {
    const [character, setCharacter] = useState(null);
    const characterId = '1119884188369859454'; // Ensure this is a string if your backend expects a string

    useEffect(() => {
        const loadCharacter = async () => {
            const data = await fetchCharacter(characterId);
            console.log("Fetched character data:", data);
            setCharacter(data);
        };
        loadCharacter();
    }, [characterId]);

    const handleAddHabit = async (habitData) => {
        // habitData contains habitName, attribute, description, and completionDate (if today is complete)
        try {
            // Example API call - implement createHabit in your API file
            const response = await createHabit({
                character_id: character.id,
                ...habitData
            });
            console.log('Habit added:', response);
            // Optionally, update your local character state if needed.
        } catch (error) {
            console.error('Error adding habit:', error);
        }
    };

    return (
        <div className="app">
            <CharacterSheet character={character} onAddHabit={handleAddHabit} />
        </div>
    );
}

export default App;
