// src/components/CharacterSheet.jsx
import React, { useState } from 'react';
import {BACKEND_URL} from "../../config.js";
import Header from '../Common/Header.jsx';
import AttributeCard from '../AttributeCard.jsx';
import AttributeModal from '../AttributeModal.jsx';
import { createHabit, fetchHabitsForAttribute, deleteHabit } from '../../api/habitApi.js';
import CharacterCard from './CharacterCard.jsx';

const CharacterSheet = ({ character }) => {
    const [selectedAttribute, setSelectedAttribute] = useState(null);
    const [habits, setHabits] = useState(character ? character.habits || [] : []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!character) return <div>Loading...</div>;

    // When an attribute is clicked, open the modal with its details.
    const handleAttributeClick = (name, base, bonus) => {
        const baseBonus = Math.floor((base - 10) / 2);
        const habitBonus = bonus - baseBonus;
        setSelectedAttribute({ name, base, bonus, habitBonus });
        // Optionally, fetch habits for that attribute immediately.
        fetchHabitsForAttribute(character.id, name).then(setHabits);
    };

    // Close the modal
    const handleCloseModal = () => setSelectedAttribute(null);

    // Handler for adding a new habit.
    const handleAddHabit = async (attributeName, description) => {
        if (!description.trim()) {
            setError('Habit description cannot be empty');
            return;
        }

        setLoading(true);
        setError('');

        const habitData = {
            character_id: character.id,
            habit_name: description,
            attribute: attributeName,
            description: description,
        };

        try {
            const habitData = {
                character_id: character.id,
                habit_name: description.trim(),
                attribute: attributeName,
                description: description.trim(),
            };

            await createHabit(habitData);
            const updatedHabits = await fetchHabitsForAttribute(character.id, attributeName);
            setHabits(updatedHabits);
            setSelectedAttribute(null);
        } catch (error) {
            setError(error.message || 'Failed to add habit');
            console.error("Error adding habit:", error);
        } finally {
            setLoading(false);
        }
    };

    // Handler for marking a habit as complete.
    const handleCompleteHabit = async (habitId) => {
        // Calculate today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split("T")[0];
        console.log("Marking habit complete for habitId:", habitId, "on", today);
        try {
            const response = await fetch(`${BACKEND_URL}/habit/completion`, {
                method: "POST", // Make sure your backend endpoint is defined as POST
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    habit_id: habitId,
                    character_id: character.id,
                    completion_date: today,
                    completed: true,
                }),
            });
            if (!response.ok) {
                throw new Error("Failed to mark habit complete");
            }
            const data = await response.json();
            console.log("Habit completion updated:", data);
            // Refresh the habit list after updating
            const updatedHabits = await fetchHabitsForAttribute(character.id, selectedAttribute.name);
            setHabits(updatedHabits);
        } catch (error) {
            console.error("Error marking habit complete:", error);
        }
    };

    const handleDeleteHabit = async (habitId) => {
        try {
            const response = await fetch(`${BACKEND_URL}/habit/${habitId}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete habit");
            console.log("Habit deleted:", habitId);
            const updatedHabits = await fetchHabitsForAttribute(character.id, selectedAttribute.name);
            setHabits(updatedHabits);
        } catch (error) {
            console.error("Error deleting habit:", error);
        }
    };

    // Filter habits associated with the selected attribute.
    const habitsForAttribute = selectedAttribute
        ? (habits || []).filter(
            habit => habit.attribute.toLowerCase() === selectedAttribute.name.toLowerCase()
        )
        : [];


    return (
        <div className="character-sheet">
            {/* Show the character card at the top */}
            <CharacterCard characterName={character ? character.name : "Unnamed Character"} />

            {/* Only render attributes if character data exists */}
            {character && (
                <div className="attributes-grid">
                    {Object.entries(character.attributes).map(([key, attr]) => (
                        <AttributeCard
                            key={key}
                            name={key}
                            base={attr.base}
                            bonus={attr.bonus}
                            onClick={handleAttributeClick}
                        />
                    ))}
                </div>
            )}

            {/* Render the modal if an attribute is selected */}
            {selectedAttribute && (
                <AttributeModal
                    attributeName={selectedAttribute.name}
                    base={selectedAttribute.base}
                    bonus={selectedAttribute.bonus}
                    habitBonus={selectedAttribute.habitBonus}
                    habits={habitsForAttribute}
                    onClose={handleCloseModal}
                    onCompleteHabit={handleCompleteHabit}
                    onAddHabit={handleAddHabit}
                    onDeleteHabit={handleDeleteHabit}
                />
            )}
        </div>
    );
};

export default CharacterSheet;
