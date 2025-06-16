// File: src/pages/CharacterPage.jsx
// Fixed import path for CharacterImageUpload component

import React, { useState, useEffect } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import CharacterImageUpload from '../components/Character/CharacterImageUpload'; // Fixed: added /Character/ to path
import '../styles/CharacterPage.css';

const CharacterPage = () => {
    const { selectedCharacter, refreshCharacter } = useCharacter();
    const [loading] = useState(false);
    const [error] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        description: ''
    });

    // Initialize edit form when character loads
    useEffect(() => {
        if (selectedCharacter) {
            setEditForm({
                name: selectedCharacter.name || '',
                description: selectedCharacter.description || ''
            });
        }
    }, [selectedCharacter]);

    // Calculate attribute bonuses (D&D style)
    const getAttributeBonus = (value) => {
        return Math.floor((value - 10) / 2);
    };

    // Get total attribute value (base + bonuses)
    const getAttributeTotal = (attribute) => {
        if (!attribute) return 10;
        return (attribute.base || 10) + (attribute.bonus || 0);
    };

    // Handle image update
    const handleImageUpdate = async (imageData) => {
        try {
            // Refresh character data to get updated image
            await refreshCharacter();
        } catch (error) {
            console.error('Failed to refresh character after image update:', error);
        }
    };

    // Handle character name/description update
    const handleUpdateCharacter = async (e) => {
        e.preventDefault();
        // Implementation for updating character details
        // This would need a new backend endpoint
        console.log('Character update not implemented yet');
        alert('Character update feature requires new backend endpoint!');
        setEditMode(false);
    };

    if (!selectedCharacter) {
        return (
            <div className="character-page error">
                <h1>No Character Selected</h1>
                <p>Please select a character to view their details.</p>
            </div>
        );
    }

    return (
        <div className="character-page">
            {/* Character Header with Image */}
            <div className="character-header">
                <div className="character-header-content">
                    {/* Character Image */}
                    <div className="character-image-section">
                        <CharacterImageUpload
                            character={selectedCharacter}
                            onImageUpdate={handleImageUpdate}
                            className="character-main-image"
                        />
                    </div>

                    {/* Character Info */}
                    <div className="character-info-section">
                        {editMode ? (
                            <form onSubmit={handleUpdateCharacter} className="edit-form">
                                <div className="form-group">
                                    <label>Character Name</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm(prev => ({...prev, name: e.target.value}))}
                                        placeholder="Enter character name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={editForm.description}
                                        onChange={(e) => setEditForm(prev => ({...prev, description: e.target.value}))}
                                        placeholder="Describe your character..."
                                        rows={3}
                                    />
                                </div>
                                <div className="form-actions">
                                    <button type="submit" disabled={loading} className="save-btn">
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditMode(false)}
                                        className="cancel-btn"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="character-display">
                                <h1>{selectedCharacter.name}</h1>
                                <p className="character-description">
                                    {selectedCharacter.description || 'No description yet.'}
                                </p>
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="edit-btn"
                                >
                                    ✏️ Edit Character
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {/* Attributes Grid */}
            <div className="attributes-grid">
                {selectedCharacter.attributes && Object.entries(selectedCharacter.attributes).map(([attrName, attr]) => {
                    const total = getAttributeTotal(attr);
                    const bonus = getAttributeBonus(total);

                    return (
                        <div key={attrName} className="attribute-card">
                            <div className="attribute-header">
                                <h3>{attrName.charAt(0).toUpperCase() + attrName.slice(1)}</h3>
                            </div>
                            <div className="attribute-content">
                                <div className="attribute-score">
                                    <span className="score-value">{total}</span>
                                    <span className="score-bonus">
                                        {bonus >= 0 ? `+${bonus}` : bonus}
                                    </span>
                                </div>
                                <div className="attribute-breakdown">
                                    <div className="breakdown-item">
                                        <span>Base:</span>
                                        <span>{attr.base || 10}</span>
                                    </div>
                                    <div className="breakdown-item">
                                        <span>Habit Bonus:</span>
                                        <span>+{attr.habit_points || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CharacterPage;