// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CharacterProvider } from './contexts/CharacterContext';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <CharacterProvider>
        <App />
    </CharacterProvider>
);
