import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { CharacterProvider, useCharacter } from './contexts/CharacterContext';
import CharacterPicker from './components/CharacterPicker';
import CharacterSwitcher from './components/CharacterSwitcher';


import CharacterPage from './pages/CharacterPage';
import HabitsPage from './pages/HabitsPage.jsx';
import AdventurePage from './pages/AdventurePage.jsx';
// import EquipmentPage from './pages/EquipmentPage'; // Uncomment when you create this

// Component that requires character selection
function ProtectedRoute({ children }) {
    const { isCharacterSelected } = useCharacter();

    if (!isCharacterSelected) {
        return <Navigate to="/characters" replace />;
    }

    return children;
}

// Navigation component
function Navigation() {
    const [activeTab, setActiveTab] = useState('character');

    const navItems = [
        { id: 'character', label: 'Character', path: '/character' },
        { id: 'habits', label: 'Habits', path: '/habits' },
        { id: 'equipment', label: 'Equipment', path: '/equipment' },
        { id: 'adventure', label: 'Adventure', path: '/adventure' }
    ];

    return (
        <nav className="bottom-navigation">
            <div className="nav-container">
                {navItems.map((item) => (
                    <a
                        key={item.id}
                        href={item.path}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={(e) => {
                            e.preventDefault();
                            setActiveTab(item.id);
                            window.location.href = item.path;
                        }}
                    >
            <span className="nav-icon">
              {item.id === 'character' && '👤'}
                {item.id === 'habits' && '✅'}
                {item.id === 'equipment' && '⚔️'}
                {item.id === 'adventure' && '🗺️'}
            </span>
                        <span className="nav-label">{item.label}</span>
                    </a>
                ))}
            </div>
        </nav>
    );
}

// Main App component
function AppContent() {
    return (
        <div className="app">
            {/* Top Header with Character Switcher */}
            <header className="app-header">
                <div className="header-content">
                    <h1 className="app-title">Habits & Adventure</h1>
                    <CharacterSwitcher />
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
                            <CharacterPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/habits" element={
                        <ProtectedRoute>
                            <HabitsPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/equipment" element={
                        <ProtectedRoute>
                            {/* <EquipmentPage /> */}
                            <div className="placeholder-page">
                                <h1>Equipment</h1>
                                <p>Equipment management coming soon!</p>
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
            </Router>
        </CharacterProvider>
    );
}

export default App;