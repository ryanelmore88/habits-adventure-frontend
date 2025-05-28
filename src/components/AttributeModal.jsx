// src/components/AttributeModal.jsx
import React, { useState } from 'react';
import { fetchHabitCompletions } from '../api/habitApi';

const AttributeModal = ({
                            attributeName,
                            base,
                            bonus,
                            habitBonus,
                            habits,
                            onClose,
                            onCompleteHabit,
                            onAddHabit,
                            onDeleteHabit
                        }) => {
    const [isAddingHabit, setIsAddingHabit] = useState(false);
    const [newHabitDescription, setNewHabitDescription] = useState('');
    // Track which habit (by id) is expanded to show completions

    const [expandedHabitId, setExpandedHabitId] = useState(null);
    // Map habit id -> list of completions
    const [habitCompletions, setHabitCompletions] = useState({});

    const handleAddHabitClick = () => {
        setIsAddingHabit(true);
    };

    const handleHabitSubmit = (e) => {
        e.preventDefault();
        onAddHabit(attributeName, newHabitDescription);
        setNewHabitDescription('');
        setIsAddingHabit(false);
    };

    const toggleShowCompletions = async (habitId) => {
        if (expandedHabitId === habitId) {
            // If already expanded, collapse it
            setExpandedHabitId(null);
        } else {
            // Expand this habit
            setExpandedHabitId(habitId);
            // If completions haven't been fetched yet, fetch them
            if (!habitCompletions[habitId]) {
                const completions = await fetchHabitCompletions(habitId);
                setHabitCompletions(prev => ({ ...prev, [habitId]: completions }));
            }
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-button" onClick={onClose}>X</button>
                <h2>{attributeName.toUpperCase()} Details</h2>
                <p>Base Score: {base}</p>
                <p>Total Bonus: {bonus}</p>
                <p>Habit Bonus: {habitBonus}</p>
                <h3>Associated Habits</h3>
                {habits && habits.length > 0 ? (
                    habits.map(habit => (
                        <div key={habit.habit_id} className="habit-item">
                            <p>{habit.habit_name}</p>
                            <button onClick={() => onCompleteHabit(habit.habit_id)}>
                                Mark Complete
                            </button>
                            <button onClick={() => onDeleteHabit(habit.habit_id)} style={{marginLeft: '8px'}}>
                                Delete Habit
                            </button>

                            <button onClick={() => toggleShowCompletions(habit.habit_id)} style={{ marginLeft: '8px' }}>
                                {expandedHabitId === habit.habit_id ? 'Hide Past Completions' : 'Show Past Completions'}
                            </button>
                            {expandedHabitId === habit.habit_id && habitCompletions[habit.habit_id] && (
                                <div className="completions-list">
                                    {habitCompletions[habit.habit_id].length > 0 ? (
                                        habitCompletions[habit.habit_id].map((completion, index) => (
                                            <div key={index} className="completion-item">
                                                <p>Date: {completion.completion_date}</p>
                                                <p>Status: {completion.completed ? 'Completed' : 'Incomplete'}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No past completions found.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p>No habits found for this attribute.</p>
                )}
                <hr />
                {isAddingHabit ? (
                    <form onSubmit={handleHabitSubmit} className="habit-form">
                        <label>
                            Habit Description:
                            <input
                                type="text"
                                value={newHabitDescription}
                                onChange={(e) => setNewHabitDescription(e.target.value)}
                                required
                            />
                        </label>
                        <button type="submit">Submit Habit</button>
                    </form>
                ) : (
                    <button onClick={handleAddHabitClick}>Add Habit</button>
                )}
            </div>
        </div>
    );
};

export default AttributeModal;
