import { useState } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { useNavigate } from 'react-router-dom';

export default function CharacterSwitcher() {
    const { selectedCharacter, clearCharacter } = useCharacter();
    const [showMenu, setShowMenu] = useState(false);
    const navigate = useNavigate();

    if (!selectedCharacter) {
        return (
            <button
                className="character-switcher no-character"
                onClick={() => navigate('/characters')}
            >
                Select Character
            </button>
        );
    }

    const handleSwitchCharacter = () => {
        clearCharacter();
        navigate('/characters');
        setShowMenu(false);
    };

    return (
        <div className="character-switcher">
            <button
                className="current-character"
                onClick={() => setShowMenu(!showMenu)}
            >
                <span className="character-name">{selectedCharacter.name}</span>
                <span className="character-level">Lv. {selectedCharacter.level}</span>
                <span className="dropdown-arrow">▼</span>
            </button>

            {showMenu && (
                <div className="character-menu">
                    <div className="character-info">
                        <h4>{selectedCharacter.name}</h4>
                        <p>Level {selectedCharacter.level}</p>
                        <p>HP: {selectedCharacter.current_hp}/{selectedCharacter.max_hp}</p>
                        <p>XP: {selectedCharacter.current_xp}</p>
                    </div>
                    <div className="menu-actions">
                        <button onClick={() => {
                            navigate('/character');
                            setShowMenu(false);
                        }}>
                            View Character
                        </button>
                        <button onClick={handleSwitchCharacter}>
                            Switch Character
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}