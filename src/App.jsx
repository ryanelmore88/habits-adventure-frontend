// File: src/App.jsx
// Updated App.jsx with CharacterStatusWithImage as header when character is selected

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CharacterProvider } from './contexts/CharacterContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useCharacter } from './contexts/CharacterContext';
import NavBar from './components/Common/NavBar';
import CharacterStatusWithImage from './components/Character/CharacterStatusWithImage';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import CharacterPicker from './components/CharacterPicker';
import CharacterCreatePage from './pages/CharacterCreatePage';
import CharacterPage from './pages/CharacterPage';
import HabitsPage from './pages/HabitsPage';
import AdventurePage from './pages/AdventurePage';
import './styles/App.css';
import './styles/CharacterHeader.css';
import './styles/NavBar.css';

function AppContent() {
    const { isAuthenticated, loading } = useAuth();
    const { selectedCharacter, isCharacterSelected } = useCharacter();

    if (loading) {
        return (
            <div className="app-loading">
                <h2>Loading...</h2>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <Router>
                <Routes>
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="*" element={<LoginPage />} />
                </Routes>
            </Router>
        );
    }

    return (
        <Router>
            <div className="app">
                {/* Character Header - Only show when character is selected */}
                {isCharacterSelected && selectedCharacter && (
                    <div className="character-header-section">
                        <CharacterStatusWithImage
                            character={selectedCharacter}
                            className="header-character-status main-header"
                        />
                    </div>
                )}

                {/* Main Content */}
                <main className="main-content">
                    <Routes>
                        {/* Character Management Routes */}
                        <Route path="/characters" element={<CharacterPicker />} />
                        <Route path="/character/create" element={<CharacterCreatePage />} />
                        <Route path="/character" element={<CharacterPage />} />

                        {/* Game Pages */}
                        <Route path="/habits" element={<HabitsPage />} />
                        <Route path="/adventure" element={<AdventurePage />} />

                        {/* Default redirect */}
                        <Route path="/" element={<Navigate to="/characters" replace />} />

                        {/* Catch-all redirect */}
                        <Route path="*" element={<Navigate to="/characters" replace />} />
                    </Routes>
                </main>

                {/* Bottom Navigation Bar */}
                <NavBar />
            </div>
        </Router>
    );
}

function App() {
    return (
        <AuthProvider>
            <CharacterProvider>
                <AppContent />
            </CharacterProvider>
        </AuthProvider>
    );
}

export default App;