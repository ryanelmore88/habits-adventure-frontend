// src/components/EquipmentPage.jsx
import React from 'react';

const EquipmentPage = ({ character }) => {
    return (
        <div style={{ padding: '20px', color: '#eee' }}>
            <h2>Equipment Page</h2>
            {character ? (
                <p>Display equipment for character {character.name} here.</p>
            ) : (
                <p>Loading character data...</p>
            )}
        </div>
    );
};

export default EquipmentPage;
