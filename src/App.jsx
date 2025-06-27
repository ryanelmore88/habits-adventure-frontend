// File: frontend/src/App.jsx
// Complete App.jsx with authentication

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CharacterProvider } from './contexts/CharacterContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import NavBar from './components/Common/NavBar';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import CharacterPage from './pages/CharacterPage';
import HabitsPage from './pages/HabitsPage';
import AdventurePage from './pages/AdventurePage';
import './styles/App.css';

function App() {
    return (
        <Router>
            <AuthProvider>
                <CharacterProvider>
                    <div className="App">
                        <NavBar />
                        <Routes>
                            {/* Public routes */}
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />

                            {/* Protected routes */}
                            <Route path="/characters" element={
                                <ProtectedRoute>
                                    <CharacterPage />
                                </ProtectedRoute>
                            } />
                            <Route path="/habits" element={
                                <ProtectedRoute>
                                    <HabitsPage />
                                </ProtectedRoute>
                            } />
                            <Route path="/adventure" element={
                                <ProtectedRoute>
                                    <AdventurePage />
                                </ProtectedRoute>
                            } />

                            {/* Default redirect */}
                            <Route path="/" element={<Navigate to="/characters" replace />} />
                        </Routes>
                    </div>
                </CharacterProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;