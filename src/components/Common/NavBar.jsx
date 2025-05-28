// src/components/NavBar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/NavBar.css';

const NavBar = () => {
    return (
        <nav className="bottom-nav">
            <Link to="/character">Character</Link>
            <Link to="/habits">Habits</Link>
            <Link to="/equipment">Equipment</Link>
            <Link to="/adventure">Adventure</Link>
            <Link to="/Dice">Dice</Link>
        </nav>
    );
};

export default NavBar;
