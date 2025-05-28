import React from 'react';

const Attribute = ({name, base, habit_points, bonus}) => (
    <div className="attribute">
        <strong>{name.charAt(0).toUpperCase() + name.slice(1)}</strong>
        <span>Base: {base}</span>
        <span>Habit Points: {habit_points}</span>
        <span>Bonus: {bonus >= 0 ? `+${bonus}` : bonus}</span>
    </div>
);

export default Attribute;