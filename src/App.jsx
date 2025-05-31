// src/App.jsx

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { fetchCharacter } from './api/characterApi';
import CharacterSheet  from './components/Character/CharacterSheet.jsx';
import CharacterPrompt from './components/Character/CharacterPrompt.jsx';
import HabitsPage      from './components/Habit/HabitsPage.jsx';
import EquipmentPage   from './components/equipment/EquipmentPage.jsx';
import ErrorBoundary   from './components/Common/ErrorBoundary.jsx';
import AdventurePage   from './components/adventure/AdventurePage.jsx';
import DicePage        from './components/dice/DicePage.jsx';
import NavBar          from './components/Common/NavBar.jsx';
import { useCharacter } from './context/CharacterContext';

import './styles/index.css';

function App() {
    const [character, setCharacter] = useState(null);
    const { characterId, setCharacterId } = useCharacter();

    // Whenever characterId changes, fetch the raw character object
    useEffect(() => {
        // if no ID, clear out any existing character
        if (!characterId) {
            setCharacter(null);
            return;
        }

        const load = async () => {
            try {
                // fetchCharacter returns { id, name, attributes }
                const char = await fetchCharacter(characterId);
                setCharacter(char);
            } catch (err) {
                console.error("Error fetching character:", err);
                setCharacter(null);
            }
        };

        load();
    }, [characterId]);

    // Parent-level guard: prompt until we have a character
    if (!character) {
        return (
            <CharacterPrompt
                onFetchCharacter={(id) => {
                    // update context, triggers the above effect
                    setCharacterId(id);
                }}
            />
        );
    }

    // Only render the app once character is loaded
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <div className="app-container">
                    <Routes>
                        <Route
                            path="/character"
                            element={<CharacterSheet character={character} />}
                        />
                        <Route
                            path="/habits"
                            element={<HabitsPage character={character} />}
                        />
                        <Route
                            path="/equipment"
                            element={<EquipmentPage character={character} />}
                        />
                        <Route
                            path="/adventure"
                            element={<AdventurePage character={character} />}
                        />
                        <Route
                            path="/dice"
                            element={<DicePage character={character} />}
                        />
                        {/* default to character sheet */}
                        <Route
                            path="/"
                            element={<CharacterSheet character={character} />}
                        />
                    </Routes>

                    {/* persistent navigation bar */}
                    <NavBar />
                </div>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;
