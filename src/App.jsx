// File: src/App.jsx
// Updated to hide character header on Character Sheet page to avoid redundancy

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
    const location = useLocation();

    // Hide character header on character sheet page since it's redundant
    const shouldShowCharacterHeader = isCharacterSelected &&
        selectedCharacter &&
        location.pathname !== '/character';

    if (loading) {
        return (
            <div className="app-loading">
                <h2>Loading...</h2>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <Routes>
                <Route path="/register" element={<RegisterPage />} />
                <Route path="*" element={<LoginPage />} />
            </Routes>
        );
    }

    return (
        <div className="app">
            {/* Character Header - Hide on Character Sheet page to avoid redundancy */}
            {shouldShowCharacterHeader && (
                <div className="character-header-section">
                    <CharacterStatusWithImage
                        character={selectedCharacter}
                        className="header-character-status main-header"
                    />
                </div>
            )}

            {/* Main Content */}
            <main className={`main-content ${shouldShowCharacterHeader ? 'with-header' : 'no-header'}`}>
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
    );
}

function AppWithRouter() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

function App() {
    return (
        <AuthProvider>
            <CharacterProvider>
                <AppWithRouter />
            </CharacterProvider>
        </AuthProvider>
    );
}

export default App;