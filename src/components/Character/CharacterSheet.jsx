// File: src/components/Character/CharacterSheet.jsx
// Fixed AttributeModal props to prevent charAt error

import { useState } from 'react';
import { useCharacter } from '../../contexts/CharacterContext';
import CharacterImageUpload from './CharacterImageUpload';
import AttributeModal from '../AttributeModal';
import '../../styles/CharacterSheet.css';

const CharacterSheet = () => {
    const { selectedCharacter, refreshCharacter } = useCharacter();
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
                attributeName: attributeName, // Fixed: use attributeName instead of name
                base: attribute.base || 10,
                bonus: getAttributeBonus(attribute)
            });
        }
    };

    const handleCloseModal = () => {
        setSelectedAttribute(null);
    };

    // Handle image update
    const handleImageUpdate = async (imageData) => {
        try {
            // Refresh character data to get updated image
            await refreshCharacter();
        } catch (error) {
            console.error('Failed to refresh character after image update:', error);
        }
    };

    return (
        <div className="character-sheet">
            {/* Character Header with Image */}
            <div className="character-header">
                <div className="character-header-content">
                    {/* Character Image Section */}
                    <div className="character-image-section">
                        <CharacterImageUpload
                            character={selectedCharacter}
                            onImageUpdate={handleImageUpdate}
                            className="character-avatar-upload"
                        />
                    </div>

                    {/* Character Basic Info */}
                    <div className="character-info">
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
                                    <div className="attribute-total">({total})</div>
                                    <div className="attribute-breakdown">
                                        <div>Base: {attribute.base || 10}</div>
                                        <div>Habit: +{attribute.habit_points || 0}</div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="no-attributes">
                            <p>No attributes available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Attribute Modal - Fixed props */}
            {selectedAttribute && (
                <AttributeModal
                    attributeName={selectedAttribute.attributeName}
                    base={selectedAttribute.base}
                    bonus={selectedAttribute.bonus}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default CharacterSheet;