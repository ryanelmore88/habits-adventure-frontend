// File: src/App.jsx
// Updated to replace "Habits & Adventure" header with CharacterStatusWithImage

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { CharacterProvider, useCharacter } from './contexts/CharacterContext';
import CharacterPicker from './components/CharacterPicker';
import CharacterSwitcher from './components/CharacterSwitcher';
import CharacterStatusWithImage from './components/Character/CharacterStatusWithImage';
import CharacterSheet from './components/Character/CharacterSheet.jsx'
import HabitsPage from './pages/HabitsPage';
import AdventurePage from './pages/AdventurePage';
import './styles/App.css';

// Component that requires character selection
function ProtectedRoute({ children }) {
    const { isCharacterSelected } = useCharacter();

    if (!isCharacterSelected) {
        return <Navigate to="/characters" replace />;
    }

    return children;
}

// Header Character Status Component - Now the main header
function HeaderCharacterStatus() {
    const { selectedCharacter, isCharacterSelected } = useCharacter();

    // Only show if character is selected
    if (!isCharacterSelected || !selectedCharacter) {
        return null;
    }

    return (
        <CharacterStatusWithImage
            character={selectedCharacter}
            className="header-character-status full-width-header"
        />
    );
}

// Navigation component
function Navigation() {
    const [activeTab, setActiveTab] = useState(window.location.pathname.split('/')[1] || 'character');

    const navItems = [
        { id: 'character', label: 'Character', path: '/character', icon: '👤' },
        { id: 'habits', label: 'Habits', path: '/habits', icon: '✅' },
        { id: 'equipment', label: 'Equipment', path: '/equipment', icon: '⚔️' },
        { id: 'adventure', label: 'Adventure', path: '/adventure', icon: '🗺️' }
    ];

    const handleNavClick = (item) => {
        setActiveTab(item.id);
        window.history.pushState(null, '', item.path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    return (
        <nav className="bottom-navigation">
            <div className="nav-container">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => handleNavClick(item)}
                    >
                        <div className="nav-icon">{item.icon}</div>
                        <div className="nav-label">{item.label}</div>
                    </button>
                ))}
            </div>
        </nav>
    );
}

// Main App component
function AppContent() {
    return (
        <div className="app">
            {/* Full-width Character Status Header */}
            <HeaderCharacterStatus />

            {/* Main Content Area */}
            <main className="main-content">
                <Routes>
                    {/* Character selection route */}
                    <Route path="/characters" element={<CharacterPicker />} />

                    {/* Protected routes that require character selection */}
                    <Route path="/character" element={
                        <ProtectedRoute>
                            <CharacterSheet />
                        </ProtectedRoute>
                    } />

                    <Route path="/habits" element={
                        <ProtectedRoute>
                            <HabitsPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/equipment" element={
                        <ProtectedRoute>
                            <div className="placeholder-page">
                                <h1>Equipment</h1>
                                <p>Equipment management coming soon!</p>
                                <div className="placeholder-content">
                                    <div className="equipment-slot">
                                        <div className="slot-icon">⚔️</div>
                                        <div className="slot-label">Weapon</div>
                                    </div>
                                    <div className="equipment-slot">
                                        <div className="slot-icon">🛡️</div>
                                        <div className="slot-label">Shield</div>
                                    </div>
                                    <div className="equipment-slot">
                                        <div className="slot-icon">👕</div>
                                        <div className="slot-label">Armor</div>
                                    </div>
                                    <div className="equipment-slot">
                                        <div className="slot-icon">💍</div>
                                        <div className="slot-label">Ring</div>
                                    </div>
                                </div>
                            </div>
                        </ProtectedRoute>
                    } />

                    <Route path="/adventure" element={
                        <ProtectedRoute>
                            <AdventurePage />
                        </ProtectedRoute>
                    } />

                    {/* Redirect root to character picker */}
                    <Route path="/" element={<Navigate to="/characters" replace />} />

                    {/* Catch all route */}
                    <Route path="*" element={<Navigate to="/characters" replace />} />
                </Routes>
            </main>

            {/* Bottom Navigation - only show when character is selected */}
            <ProtectedRouteNavigation />
        </div>
    );
}

// Navigation that only shows when character is selected
function ProtectedRouteNavigation() {
    const { isCharacterSelected } = useCharacter();

    if (!isCharacterSelected) {
        return null;
    }

    return <Navigation />;
}

// Root App component with providers
function App() {
    return (
        <CharacterProvider>
            <Router>
                <AppContent />
                {/* Dice container for 3D dice */}
                <div id="dice-box" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 9999
                }}></div>
            </Router>
        </CharacterProvider>
    );
}

export default App;