import { useState, useEffect } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { createHabit, fetchHabitsForAttribute, markHabitComplete } from '../api/habitApi';
import '../styles/AttributeModal.css';

const AttributeModal = ({
                            attributeName,
                            base,
                            bonus,
                            onClose
                        }) => {
    const { selectedCharacter, refreshCharacter } = useCharacter();
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAddingHabit, setIsAddingHabit] = useState(false);
    const [newHabitName, setNewHabitName] = useState('');
    const [newHabitDescription, setNewHabitDescription] = useState('');

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
            const habitData = await fetchHabitsForAttribute(selectedCharacter.id, attributeName);
            setHabits(habitData || []);
        } catch (err) {
            console.error('Error loading habits:', err);
            setError('Failed to load habits');
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

            await createHabit({
                character_id: selectedCharacter.id,
                habit_name: newHabitName.trim(),
                attribute: attributeName.toLowerCase(),
                description: newHabitDescription.trim()
            });

            // Reload habits and refresh character
            await loadHabits();
            await refreshCharacter();

            // Reset form
            setNewHabitName('');
            setNewHabitDescription('');
            setIsAddingHabit(false);
        } catch (err) {
            console.error('Error creating habit:', err);
            setError('Failed to create habit: ' + err.message);
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

            alert('Habit marked as complete!');
        } catch (err) {
            console.error('Error marking habit complete:', err);
            setError('Failed to mark habit complete: ' + err.message);
        } finally {
            setLoading(false);
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
                    <h3>Habits for {attributeName}</h3>

                    {loading && <p>Loading...</p>}

                    {habits.length === 0 && !loading && (
                        <p>No habits created yet for this attribute.</p>
                    )}

                    <div className="habits-list">
                        {habits.map(habit => (
                            <div key={habit.habit_id} className="habit-item">
                                <div className="habit-info">
                                    <h4>{habit.habit_name}</h4>
                                    {habit.description && (
                                        <p className="habit-description">{habit.description}</p>
                                    )}
                                </div>
                                <div className="habit-actions">
                                    <button
                                        onClick={() => handleMarkComplete(habit.habit_id)}
                                        disabled={loading}
                                        className="complete-btn"
                                    >
                                        ✓ Mark Complete Today
                                    </button>
                                </div>
                            </div>
                        ))}
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
                            <h4>Create New Habit</h4>
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