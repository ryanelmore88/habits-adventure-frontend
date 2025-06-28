// File: src/components/Common/NavBar.jsx
// Updated NavBar for bottom navigation with mobile-first design

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCharacter } from '../../contexts/CharacterContext';
import '../../styles/NavBar.css';

const NavBar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const { isCharacterSelected } = useCharacter();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Don't show nav if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    // Navigation items for bottom nav
    const navItems = [
        {
            path: '/characters',
            icon: '👤',
            label: 'Characters',
            requiresCharacter: false
        },
        {
            path: '/habits',
            icon: '📋',
            label: 'Habits',
            requiresCharacter: true
        },
        {
            path: '/adventure',
            icon: '⚔️',
            label: 'Adventure',
            requiresCharacter: true
        },
        {
            path: '/character',
            icon: '📊',
            label: 'Sheet',
            requiresCharacter: true
        }
    ];

    // Filter items based on character selection
    const filteredNavItems = navItems.filter(item =>
        !item.requiresCharacter || isCharacterSelected
    );

    return (
        <nav className="bottom-navbar">
            <div className="bottom-nav-container">
                {/* Main Navigation Items */}
                <div className="bottom-nav-main">
                    {filteredNavItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`bottom-nav-item ${
                                location.pathname === item.path ? 'active' : ''
                            }`}
                        >
                            <span className="nav-item-icon">{item.icon}</span>
                            <span className="nav-item-label">{item.label}</span>
                        </Link>
                    ))}
                </div>

                {/* User Menu */}
                <div className="bottom-nav-user">
                    <div className="user-menu">
                        <div className="user-info">
                            <span className="user-email-short">
                                {user?.email?.split('@')[0] || 'User'}
                            </span>
                            {user?.is_premium && (
                                <span className="premium-indicator">✨</span>
                            )}
                        </div>
                        <button onClick={handleLogout} className="logout-btn-bottom">
                            <span className="nav-item-icon">🚪</span>
                            <span className="nav-item-label">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default NavBar;