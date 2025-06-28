// File: src/pages/CharacterCreatePage.jsx
// New character creation page with form

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCharacter } from '../contexts/CharacterContext';
import { characterApi } from '../api/characterApi';
import '../styles/CharacterCreatePage.css';

export default function CharacterCreatePage() {
    const navigate = useNavigate();
    const { loadCharacters } = useCharacter();

    const [formData, setFormData] = useState({
        name: '',
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'name' ? value : parseInt(value, 10)
        }));
    };

    // Calculate attribute bonus (D&D style)
    const getAttributeBonus = (score) => {
        return Math.floor((score - 10) / 2);
    };

    // Calculate total attribute points used
    const getTotalPoints = () => {
        return Object.values(formData).filter(val => typeof val === 'number').reduce((sum, val) => sum + val, 0);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('Character name is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await characterApi.createCharacter(formData);

            if (response.status === 'success') {
                // Refresh the character list
                await loadCharacters();
                // Navigate back to character picker
                navigate('/characters');
            } else {
                setError('Failed to create character');
            }
        } catch (err) {
            console.error('Character creation error:', err);
            setError(err.response?.data?.detail || 'Failed to create character');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="character-create-page">
            <div className="create-container">
                <header className="create-header">
                    <h1>Create Your Character</h1>
                    <p>Build your adventurer and start your journey!</p>
                </header>

                <form onSubmit={handleSubmit} className="character-form">
                    {/* Character Name */}
                    <div className="form-section">
                        <h3>Character Details</h3>
                        <div className="form-group">
                            <label htmlFor="name">Character Name *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your character's name"
                                required
                                maxLength={50}
                            />
                        </div>
                    </div>

                    {/* Attributes */}
                    <div className="form-section">
                        <h3>Attributes</h3>
                        <p className="section-description">
                            Distribute your attribute points (8-18 each). Total points: {getTotalPoints()}
                        </p>

                        <div className="attributes-grid">
                            {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map(attr => (
                                <div key={attr} className="attribute-group">
                                    <label htmlFor={attr}>
                                        {attr.charAt(0).toUpperCase() + attr.slice(1)}
                                    </label>
                                    <div className="attribute-input-container">
                                        <input
                                            type="range"
                                            id={attr}
                                            name={attr}
                                            min="8"
                                            max="18"
                                            value={formData[attr]}
                                            onChange={handleChange}
                                            className="attribute-slider"
                                        />
                                        <div className="attribute-display">
                                            <span className="score">{formData[attr]}</span>
                                            <span className="bonus">
                                                ({getAttributeBonus(formData[attr]) >= 0 ? '+' : ''}{getAttributeBonus(formData[attr])})
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={() => navigate('/characters')}
                            className="cancel-button"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="create-button"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Character'}
                        </button>
                    </div>
                </form>

                {/* Character Preview */}
                <div className="character-preview">
                    <h3>Character Preview</h3>
                    <div className="preview-card">
                        <h4>{formData.name || 'Unnamed Character'}</h4>
                        <div className="preview-attributes">
                            {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map(attr => (
                                <div key={attr} className="preview-attribute">
                                    <span className="attr-name">{attr.slice(0, 3).toUpperCase()}</span>
                                    <span className="attr-value">{formData[attr]}</span>
                                </div>
                            ))}
                        </div>
                        <div className="preview-stats">
                            <div className="stat">
                                <span>HP: {10 + getAttributeBonus(formData.constitution)}</span>
                            </div>
                            <div className="stat">
                                <span>Level: 1</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}