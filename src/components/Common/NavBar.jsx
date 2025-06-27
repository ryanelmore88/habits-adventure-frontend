// File: frontend/src/components/Common/NavBar.jsx
// Navigation bar with authentication status

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/NavBar.css';

const NavBar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">⚔️ Habits Adventure</Link>
            </div>

            {isAuthenticated ? (
                <>
                    <div className="navbar-links">
                        <Link to="/characters" className="nav-link">Characters</Link>
                        <Link to="/habits" className="nav-link">Habits</Link>
                        <Link to="/adventure" className="nav-link">Adventure</Link>
                    </div>

                    <div className="navbar-user">
                        <span className="user-email">{user?.email}</span>
                        {user?.is_premium && (
                            <span className="premium-badge">Premium</span>
                        )}
                        <button onClick={handleLogout} className="logout-btn">
                            Logout
                        </button>
                    </div>
                </>
            ) : (
                <div className="navbar-auth">
                    <Link to="/login" className="nav-link">Login</Link>
                    <Link to="/register" className="nav-link register-btn">
                        Start Adventure
                    </Link>
                </div>
            )}
        </nav>
    );
};

export default NavBar;