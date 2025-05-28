import React from 'react';

const Header = ({ character }) => {
    return (
        <div className="header">
            <h2>{character.name}</h2>
            <div className="header-details">
                <div className="detail-box">
                    <span>Armor</span>
                    <strong>{character.armorClass || 16}</strong>
                </div>
                <div className="detail-box">
                    <span>Initiative</span>
                    <strong>+{character.initiative || 5}</strong>
                </div>
                <div className="detail-box">
                    <span>Hit Points</span>
                    <strong>{character.hp || 120}/120</strong>
                </div>
            </div>
        </div>
    );
};

export default Header;