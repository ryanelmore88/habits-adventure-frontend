// frontend/src/pages/CharacterPage.jsx

import { useState, useEffect } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { apiCall } from '../api/habitApi';

export default function CharacterPage() {
    const { selectedCharacter, refreshCharacter } = useCharacter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
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

    // Handle character name/description update
    const handleUpdateCharacter = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError(null);

            // Note: Your backend doesn't have a character update endpoint yet
            // This would need a new endpoint like PUT /api/character/{character_id}
            console.log('Character update endpoint not implemented yet:', editForm);

            alert('Character name/description update feature requires new backend endpoint!\n\nFor now, you can update attributes through habit completion.');
            setEditMode(false);

            /*
            // When you add the backend endpoint, uncomment this:
            const response = await apiCall(`/api/character/${selectedCharacter.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name: editForm.name.trim(),
                    description: editForm.description.trim()
                })
            });

            if (response.status === 'success') {
                await refreshCharacter();
                setEditMode(false);
            }
            */

        } catch (err) {
            console.error('Failed to update character:', err);
            setError('Failed to update character: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle form input changes
    const handleInputChange = (field, value) => {
        setEditForm(prev => ({
            ...prev,
            [field]: value
        }));
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
            {/* Character Header */}
            <div className="character-header">
                {editMode ? (
                    <form onSubmit={handleUpdateCharacter} className="edit-form">
                        <div className="form-group">
                            <label>Character Name</label>
                            <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Enter character name"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={editForm.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
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
                    <>
                        <div className="character-title">
                            <h1>{selectedCharacter.name}</h1>
                            <button
                                onClick={() => setEditMode(true)}
                                className="edit-btn"
                                title="Edit character"
                            >
                                ✏️
                            </button>
                        </div>
                        {selectedCharacter.description && (
                            <p className="character-description">{selectedCharacter.description}</p>
                        )}
                    </>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}
            </div>

            {/* Character Stats Overview */}
            <div className="character-stats-overview">
                <div className="stat-card">
                    <h3>Level</h3>
                    <div className="stat-value">{selectedCharacter.level || 1}</div>
                </div>
                <div className="stat-card">
                    <h3>Experience</h3>
                    <div className="stat-value">{selectedCharacter.current_xp || 0}</div>
                    <div className="stat-label">XP</div>
                </div>
                <div className="stat-card health">
                    <h3>Health</h3>
                    <div className="stat-value">
                        {selectedCharacter.current_hp || 0} / {selectedCharacter.max_hp || 20}
                    </div>
                    <div className="health-bar">
                        <div
                            className="health-fill"
                            style={{
                                width: `${((selectedCharacter.current_hp || 0) / (selectedCharacter.max_hp || 20)) * 100}%`
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Attributes Section */}
            <div className="attributes-section">
                <h2>Attributes</h2>
                <div className="attributes-grid">
                    {selectedCharacter.attributes ? (
                        Object.entries(selectedCharacter.attributes).map(([name, attribute]) => {
                            const total = getAttributeTotal(attribute);
                            const bonus = getAttributeBonus(total);
                            const bonusText = bonus >= 0 ? `+${bonus}` : `${bonus}`;

                            return (
                                <div key={name} className="attribute-card">
                                    <h4>{name.charAt(0).toUpperCase() + name.slice(1)}</h4>
                                    <div className="attribute-total">{total}</div>
                                    <div className="attribute-bonus">({bonusText})</div>
                                    <div className="attribute-breakdown">
                                        <span>Base: {attribute.base || 10}</span>
                                        {(attribute.bonus || 0) !== 0 && (
                                            <span>Bonus: +{attribute.bonus || 0}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="no-attributes">
                            <p>No attributes found for this character.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Combat Stats */}
            <div className="combat-section">
                <h2>Combat Information</h2>
                <div className="combat-stats">
                    <div className="combat-stat">
                        <label>Attack Bonus</label>
                        <span>
                            {selectedCharacter.attributes ?
                                `+${Math.max(...Object.values(selectedCharacter.attributes).map(attr =>
                                    getAttributeBonus(getAttributeTotal(attr))
                                ))}` :
                                '+0'
                            }
                        </span>
                        <small>Highest attribute bonus</small>
                    </div>
                    <div className="combat-stat">
                        <label>Health Points</label>
                        <span>{selectedCharacter.current_hp || 0} / {selectedCharacter.max_hp || 20}</span>
                        <small>Current / Maximum</small>
                    </div>
                </div>
            </div>

            {/* Inventory Section */}
            {selectedCharacter.inventory && Object.keys(selectedCharacter.inventory).length > 0 && (
                <div className="inventory-section">
                    <h2>Inventory</h2>
                    <div className="inventory-grid">
                        {Object.entries(selectedCharacter.inventory).map(([item, quantity]) => (
                            <div key={item} className="inventory-item">
                                <span className="item-name">{item}</span>
                                <span className="item-quantity">×{quantity}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Character Actions */}
            <div className="character-actions">
                <h2>Character Actions</h2>
                <div className="action-buttons">
                    <button
                        onClick={refreshCharacter}
                        disabled={loading}
                        className="refresh-btn"
                    >
                        {loading ? 'Refreshing...' : '🔄 Refresh Character'}
                    </button>

                    <button
                        onClick={async () => {
                            try {
                                setLoading(true);
                                // Note: Your backend doesn't have a rest endpoint yet
                                // This would need a new endpoint like POST /api/character/{character_id}/rest

                                alert('Rest & Recover feature requires new backend endpoint!\n\nThis would restore HP and provide healing benefits.');

                                /*
                                // When you add the backend endpoint, uncomment this:
                                const response = await apiCall(`/api/character/${selectedCharacter.id}/rest`, {
                                    method: 'POST'
                                });

                                if (response.status === 'success') {
                                    await refreshCharacter();
                                    alert('You rest and recover to full health!');
                                }
                                */
                            } catch (error) {
                                setError('Rest failed: ' + error.message);
                            } finally {
                                setLoading(false);
                            }
                        }}
                        className="rest-btn"
                        disabled={loading}
                    >
                        😴 Rest & Recover
                    </button>

                    <button
                        onClick={async () => {
                            try {
                                setLoading(true);
                                // Note: Your backend doesn't have a level up endpoint yet
                                // This would need a new endpoint like POST /api/character/{character_id}/levelup

                                alert('Level Up feature requires new backend endpoint!\n\nThis would allow spending XP to increase level and attributes.');

                                /*
                                // When you add the backend endpoint, uncomment this:
                                const response = await apiCall(`/api/character/${selectedCharacter.id}/levelup`, {
                                    method: 'POST',
                                    body: JSON.stringify({
                                        attribute_increases: {} // Player's choices
                                    })
                                });

                                if (response.status === 'success') {
                                    await refreshCharacter();
                                    alert('Level up successful!');
                                }
                                */
                            } catch (error) {
                                setError('Level up failed: ' + error.message);
                            } finally {
                                setLoading(false);
                            }
                        }}
                        className="levelup-btn"
                        disabled={(selectedCharacter.current_xp || 0) < 100 || loading}
                    >
                        ⬆️ Level Up
                        {(selectedCharacter.current_xp || 0) < 100 && (
                            <small>Need {100 - (selectedCharacter.current_xp || 0)} more XP</small>
                        )}
                    </button>
                </div>
            </div>

            {/* Debug Info (remove in production) */}
            <details className="debug-section">
                <summary>Debug Information</summary>
                <pre>{JSON.stringify(selectedCharacter, null, 2)}</pre>
            </details>
        </div>
    );
}