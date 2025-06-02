import { useState } from 'react';
import { useCharacter } from '../../contexts/CharacterContext';
import AttributeModal from '..//AttributeModal';
import '../../styles/CharacterSheet.css';

const CharacterSheet = () => {
    const { selectedCharacter } = useCharacter();
    const [selectedAttribute, setSelectedAttribute] = useState(null);

    if (!selectedCharacter) {
        return (
            <div className="character-sheet-loading">
                <h2>No Character Selected</h2>
                <p>Please select a character to view their sheet.</p>
            </div>
        );
    }

    // Calculate attribute bonus D&D style
    const getAttributeBonus = (attribute) => {
        if (!attribute) return 0;
        const total = (attribute.base || 10) + (attribute.bonus || 0);
        return Math.floor((total - 10) / 2);
    };

    // Get total attribute value
    const getAttributeTotal = (attribute) => {
        if (!attribute) return 10;
        return (attribute.base || 10) + (attribute.bonus || 0);
    };

    const handleAttributeClick = (attributeName) => {
        const attribute = selectedCharacter.attributes[attributeName];
        if (attribute) {
            setSelectedAttribute({
                name: attributeName,
                base: attribute.base || 10,
                bonus: getAttributeBonus(attribute)
            });
        }
    };

    const handleCloseModal = () => {
        setSelectedAttribute(null);
    };

    return (
        <div className="character-sheet">
            {/* Character Header */}
            <div className="character-header">
                <h1>{selectedCharacter.name}</h1>
                <div className="character-stats">
                    <div className="stat">
                        <label>Level</label>
                        <span>{selectedCharacter.level || 1}</span>
                    </div>
                    <div className="stat">
                        <label>HP</label>
                        <span>{selectedCharacter.current_hp || 0}/{selectedCharacter.max_hp || 20}</span>
                    </div>
                    <div className="stat">
                        <label>XP</label>
                        <span>{selectedCharacter.current_xp || 0}</span>
                    </div>
                </div>
            </div>

            {/* Attributes Grid */}
            <div className="attributes-section">
                <h2>Attributes</h2>
                <div className="attributes-grid">
                    {selectedCharacter.attributes ? (
                        Object.entries(selectedCharacter.attributes).map(([name, attribute]) => {
                            const total = getAttributeTotal(attribute);
                            const bonus = getAttributeBonus(attribute);
                            const bonusText = bonus >= 0 ? `+${bonus}` : `${bonus}`;

                            return (
                                <div
                                    key={name}
                                    className="attribute-card"
                                    onClick={() => handleAttributeClick(name)}
                                >
                                    <h4>{name.charAt(0).toUpperCase() + name.slice(1)}</h4>
                                    <div className="attribute-bonus">{bonusText}</div>
                                    <div className="attribute-total">{total}</div>
                                    <div className="attribute-breakdown">
                                        <span>Base: {attribute.base || 10}</span>
                                        {(attribute.bonus || 0) !== 0 && (
                                            <span>Habit: +{attribute.bonus || 0}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="no-attributes">
                            <p>No attributes found for this character.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Combat Info */}
            <div className="combat-info">
                <h3>Combat Information</h3>
                <div className="combat-stats">
                    <div className="combat-stat">
                        <label>Best Attack Bonus</label>
                        <span>
                            {selectedCharacter.attributes ?
                                `+${Math.max(...Object.values(selectedCharacter.attributes).map(attr =>
                                    getAttributeBonus(attr)
                                ))}` :
                                '+0'
                            }
                        </span>
                    </div>
                    <div className="combat-stat">
                        <label>Dice Pool</label>
                        <span>1d20 + best bonus</span>
                    </div>
                </div>
            </div>

            {/* Attribute Modal */}
            {selectedAttribute && (
                <AttributeModal
                    attributeName={selectedAttribute.name}
                    base={selectedAttribute.base}
                    bonus={selectedAttribute.bonus}
                    onClose={handleCloseModal}
                />
            )}s
        </div>
    );
};

export default CharacterSheet;