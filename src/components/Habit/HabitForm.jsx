// src/components/HabitForm.jsx
import React, { useState } from 'react';

const HabitForm = ({ onSubmit }) => {
    const [habitName, setHabitName] = useState('');
    const [attribute, setAttribute] = useState('');
    const [completed, setCompleted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ habitName, attribute, completed });
        // Reset the form fields after submission
        setHabitName('');
        setAttribute('');
        setCompleted(false);
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label>
                Habit Name:
                <input
                    type="text"
                    value={habitName}
                    onChange={(e) => setHabitName(e.target.value)}
                    required
                />
            </label>
            <label>
                Related Attribute:
                <select value={attribute} onChange={(e) => setAttribute(e.target.value)} required>
                    <option value="">Select an attribute</option>
                    <option value="strength">Strength</option>
                    <option value="dexterity">Dexterity</option>
                    <option value="constitution">Constitution</option>
                    <option value="intelligence">Intelligence</option>
                    <option value="wisdom">Wisdom</option>
                    <option value="charisma">Charisma</option>
                </select>
            </label>
            <label>
                Mark today as complete:
                <input
                    type="checkbox"
                    checked={completed}
                    onChange={(e) => setCompleted(e.target.checked)}
                />
            </label>
            <button type="submit">Save Habit</button>
        </form>
    );
};

export default HabitForm;
