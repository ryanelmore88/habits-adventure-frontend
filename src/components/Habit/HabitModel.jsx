import React, { useState } from 'react';

const HabitModal = ({ onClose, onSubmit }) => {
    const [habitName, setHabitName] = useState('');
    const [attribute, setAttribute] = useState('');
    const [description, setDescription] = useState('');
    const [completeToday, setCompleteToday] = useState(false);

    const handleSubmit = () => {
        // For this example, we assume the current date will be used if completeToday is true.
        const completionDate = completeToday ? new Date().toISOString().split('T')[0] : null;
        onSubmit({ habitName, attribute, description, completionDate });
        onClose();
    };

    return (
        <div style={modalStyle.overlay}>
            <div style={modalStyle.content}>
                <h2>Add a Habit</h2>
                <div>
                    <label>
                        Habit Name:
                        <input
                            type="text"
                            value={habitName}
                            onChange={(e) => setHabitName(e.target.value)}
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Associated Attribute:
                        <input
                            type="text"
                            value={attribute}
                            onChange={(e) => setAttribute(e.target.value)}
                            placeholder="e.g., strength"
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Description:
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description"
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Mark Today as Complete:
                        <input
                            type="checkbox"
                            checked={completeToday}
                            onChange={(e) => setCompleteToday(e.target.checked)}
                        />
                    </label>
                </div>
                <div style={{ marginTop: '10px' }}>
                    <button onClick={handleSubmit}>Submit Habit</button>
                    <button onClick={onClose} style={{ marginLeft: '10px' }}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

const modalStyle = {
    overlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    content: {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '400px'
    }
};

export default HabitModal;
