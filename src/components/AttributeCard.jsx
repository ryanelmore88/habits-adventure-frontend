// src/components/AttributeCard.jsx
import React from 'react';

const AttributeCard = ({ name, base, bonus, onClick }) => {
    return (
        <div className="attribute-card" onClick={() => onClick(name, base, bonus)}>
            <h4>{name.toUpperCase()}</h4>
            <div className="bonus">{bonus >= 0 ? `+${bonus}` : bonus}</div>
            <div className="base-score">{base}</div>
        </div>
    );
};

export default AttributeCard;
