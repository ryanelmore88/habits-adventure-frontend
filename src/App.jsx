// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { CharacterProvider, useCharacter } from './contexts/CharacterContext';
import CharacterPicker from './components/CharacterPicker';
import CharacterSwitcher from './components/CharacterSwitcher';
import CharacterStatusWithImage from './components/Character/CharacterStatusWithImage';
import CharacterSheet from './components/Character/CharacterSheet.jsx'
import HabitsPage from './pages/HabitsPage';
import AdventurePage from './pages/AdventurePage';

// Component that requires character selection
function ProtectedRoute({ children }) {
    const { isCharacterSelected } = useCharacter();

    if (!isCharacterSelected) {
        return <Navigate to="/characters" replace />;
    }

    return children;
}

// Header Character Status Component
function HeaderCharacterStatus() {
    const { selectedCharacter, isCharacterSelected } = useCharacter();

    if (!isCharacterSelected || !selectedCharacter) {
        return <CharacterSwitcher />;
    }

    return (
        <div className="header-character-section">
            <CharacterSwitcher />
            <CharacterStatusWithImage
                character={selectedCharacter}
                className="header-character-status compact"
            />
        </div>
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
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </button>
                ))}
            </div>

            <style jsx>{`
                .bottom-navigation {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: #1f2937;
                    border-top: 1px solid #374151;
                    z-index: 100;
                }

                .nav-container {
                    display: flex;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .nav-item {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 12px 8px;
                    background: none;
                    border: none;
                    color: #9ca3af;
                    cursor: pointer;
                    transition: color 0.2s ease;
                    text-decoration: none;
                }

                .nav-item:hover {
                    color: #a5b4fc;
                }

                .nav-item.active {
                    color: #3b82f6;
                }

                .nav-icon {
                    font-size: 1.2rem;
                    margin-bottom: 4px;
                }

                .nav-label {
                    font-size: 0.8rem;
                    font-weight: 500;
                }

                @media (max-width: 480px) {
                    .nav-label {
                        font-size: 0.7rem;
                    }
                    
                    .nav-item {
                        padding: 8px 4px;
                    }
                }
            `}</style>
        </nav>
    );
}

// Main App component
function AppContent() {
    return (
        <div className="app">
            {/* Top Header with Character Status */}
            <header className="app-header">
                <div className="header-content">
                    <h1 className="app-title">Habits & Adventure</h1>
                    <HeaderCharacterStatus />
                </div>
            </header>

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

            <style jsx>{`
                .app {
                    min-height: 100vh;
                    background: #111827;
                    color: #eee;
                    display: flex;
                    flex-direction: column;
                }

                .app-header {
                    background: #1f2937;
                    border-bottom: 1px solid #374151;
                    padding: 16px 20px;
                    position: sticky;
                    top: 0;
                    z-index: 50;
                }

                .header-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 20px;
                }

                .app-title {
                    margin: 0;
                    color: #a5b4fc;
                    font-size: 1.5rem;
                    font-weight: bold;
                    flex-shrink: 0;
                }

                .header-character-section {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    flex-shrink: 0;
                }

                .main-content {
                    flex: 1;
                    padding-bottom: 80px; /* Space for bottom navigation */
                }

                .placeholder-page {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    text-align: center;
                    color: #1f2937;
                }

                .placeholder-page h1 {
                    color: #a5b4fc;
                    margin-bottom: 16px;
                }

                .placeholder-page p {
                    color: #9ca3af;
                    margin-bottom: 32px;
                    font-size: 1.1rem;
                }

                .placeholder-content {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 20px;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .equipment-slot {
                    background: #1f2937;
                    border: 2px dashed #374151;
                    border-radius: 12px;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }

                .slot-icon {
                    font-size: 2rem;
                    opacity: 0.6;
                }

                .slot-label {
                    color: #9ca3af;
                    font-size: 0.9rem;
                    font-weight: 500;
                }

                @media (max-width: 768px) {
                    .header-content {
                        padding: 0 16px;
                        flex-direction: column;
                        gap: 12px;
                        align-items: stretch;
                    }

                    .app-title {
                        font-size: 1.2rem;
                        text-align: center;
                    }

                    .header-character-section {
                        justify-content: center;
                        flex-direction: column;
                        gap: 12px;
                    }

                    .main-content {
                        padding-bottom: 70px;
                    }
                }

                @media (max-width: 480px) {
                    .app-header {
                        padding: 12px 16px;
                    }
                }
            `}</style>
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