// File: src/components/AttributeModal.jsx
// Updated to notify parent when habits are modified (for streak recalculation)

import { useState, useEffect } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { habitApi, markHabitComplete, deleteHabit } from '../api/habitApi';
import '../styles/AttributeModal.css';

const AttributeModal = ({
                            attributeName,
                            base,
                            bonus,
                            onClose,
                            onHabitsChanged // NEW: Callback to notify parent of habit changes
                        }) => {
    const { selectedCharacter, refreshCharacter } = useCharacter();
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAddingHabit, setIsAddingHabit] = useState(false);
    const [newHabitName, setNewHabitName] = useState('');
    const [newHabitDescription, setNewHabitDescription] = useState('');
    const [deletingHabitId, setDeletingHabitId] = useState(null);

    // Calculate attribute bonus D&D style
    const baseBonus = Math.floor((base - 10) / 2);
    const habitBonus = bonus - baseBonus;

    useEffect(() => {
        if (selectedCharacter?.id && attributeName) {
            loadHabits();
        }
    }, [selectedCharacter?.id, attributeName]);

    const loadHabits = async () => {
        try {
            setLoading(true);
            setError('');

            // Use the correct API function to get all habits for character
            const response = await habitApi.getHabits(selectedCharacter.id);
            const allHabits = response.data || response || [];

            // Filter habits by the selected attribute
            const attributeHabits = allHabits.filter(habit =>
                habit.attribute && habit.attribute.toLowerCase() === attributeName.toLowerCase()
            );

            setHabits(attributeHabits);
        } catch (err) {
            console.error('Error loading habits:', err);
            setError('Failed to load habits');
            setHabits([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateHabit = async () => {
        if (!newHabitName.trim()) {
            setError('Habit name is required');
            return;
        }

        try {
            setLoading(true);
            setError('');

            await habitApi.createHabit({
                character_id: selectedCharacter.id,
                habit_name: newHabitName.trim(),
                attribute: attributeName.toLowerCase(),
                description: newHabitDescription.trim()
            });

            // Reload habits and refresh character
            await loadHabits();
            await refreshCharacter();

            // Notify parent that habits changed (for streak recalculation)
            if (onHabitsChanged) {
                onHabitsChanged();
            }

            // Reset form
            setNewHabitName('');
            setNewHabitDescription('');
            setIsAddingHabit(false);
        } catch (err) {
            console.error('Error creating habit:', err);
            setError('Failed to create habit: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleMarkComplete = async (habitId) => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];

            await markHabitComplete(habitId, today, true);

            // Refresh character data to update attribute bonuses
            await refreshCharacter();

            // Reload habits to show any changes
            await loadHabits();

            // Notify parent that habits changed (for streak recalculation)
            if (onHabitsChanged) {
                onHabitsChanged();
            }

            setError(''); // Clear any previous errors
        } catch (err) {
            console.error('Error marking habit complete:', err);
            setError('Failed to mark habit complete: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteHabit = async (habitId) => {
        if (!window.confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
            return;
        }

        try {
            setDeletingHabitId(habitId);
            setError('');

            await deleteHabit(habitId);

            // Reload habits and refresh character
            await loadHabits();
            await refreshCharacter();

            // Notify parent that habits changed (for streak recalculation)
            if (onHabitsChanged) {
                onHabitsChanged();
            }
        } catch (err) {
            console.error('Error deleting habit:', err);
            setError('Failed to delete habit: ' + (err.response?.data?.detail || err.message));
        } finally {
            setDeletingHabitId(null);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{attributeName.charAt(0).toUpperCase() + attributeName.slice(1)} Details</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="attribute-details">
                    <div className="attribute-stat">
                        <label>Base Score:</label>
                        <span>{base}</span>
                    </div>
                    <div className="attribute-stat">
                        <label>Base Bonus:</label>
                        <span>{baseBonus >= 0 ? `+${baseBonus}` : baseBonus}</span>
                    </div>
                    <div className="attribute-stat">
                        <label>Habit Bonus:</label>
                        <span>{habitBonus >= 0 ? `+${habitBonus}` : habitBonus}</span>
                    </div>
                    <div className="attribute-stat total">
                        <label>Total Bonus:</label>
                        <span>{bonus >= 0 ? `+${bonus}` : bonus}</span>
                    </div>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="habits-section">
                    <h3>Habits for {attributeName.charAt(0).toUpperCase() + attributeName.slice(1)}</h3>

                    {loading && !isAddingHabit && (
                        <div className="loading-message">Loading habits...</div>
                    )}

                    <div className="habits-list">
                        {habits.length > 0 ? (
                            habits.map((habit) => (
                                <div key={habit.habit_id || habit.id} className="habit-item">
                                    <div className="habit-info">
                                        <h4>{habit.habit_name || habit.name}</h4>
                                        {habit.description && (
                                            <p className="habit-description">{habit.description}</p>
                                        )}
                                    </div>
                                    <div className="habit-actions">
                                        <button
                                            onClick={() => handleMarkComplete(habit.habit_id || habit.id)}
                                            className="complete-btn"
                                            disabled={loading}
                                        >
                                            Complete Today
                                        </button>
                                        <button
                                            onClick={() => handleDeleteHabit(habit.habit_id || habit.id)}
                                            className="delete-btn"
                                            disabled={deletingHabitId === (habit.habit_id || habit.id)}
                                        >
                                            {deletingHabitId === (habit.habit_id || habit.id) ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : !loading && (
                            <p className="no-habits">No habits for this attribute yet. Create your first one!</p>
                        )}
                    </div>
                </div>

                <div className="add-habit-section">
                    {!isAddingHabit ? (
                        <button
                            onClick={() => setIsAddingHabit(true)}
                            className="add-habit-btn"
                            disabled={loading}
                        >
                            + Add New Habit
                        </button>
                    ) : (
                        <div className="habit-form">
                            <h4>Create New {attributeName.charAt(0).toUpperCase() + attributeName.slice(1)} Habit</h4>
                            <div className="form-group">
                                <label>Habit Name *</label>
                                <input
                                    type="text"
                                    value={newHabitName}
                                    onChange={(e) => setNewHabitName(e.target.value)}
                                    placeholder="e.g., Push-ups, Reading, Meditation"
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label>Description (optional)</label>
                                <textarea
                                    value={newHabitDescription}
                                    onChange={(e) => setNewHabitDescription(e.target.value)}
                                    placeholder="Describe your habit..."
                                    rows={3}
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-actions">
                                <button
                                    onClick={handleCreateHabit}
                                    disabled={loading || !newHabitName.trim()}
                                    className="save-btn"
                                >
                                    {loading ? 'Creating...' : 'Create Habit'}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsAddingHabit(false);
                                        setNewHabitName('');
                                        setNewHabitDescription('');
                                        setError('');
                                    }}
                                    className="cancel-btn"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttributeModal;