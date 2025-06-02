import React, { useEffect, useState } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { fetchHabitsForDate } from '../api/habitApi';
import attributeIcons from '../icons/attributeIcons';
import '../styles/DailyView.css'; // optional, see CSS below

const DailyView = ({ onToggleCompletion }) => {
    const { characterId } = useCharacter();
    const [habits, setHabits] = useState([]);
    const currentDate = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (!characterId) return;

        const loadHabits = async () => {
            try {
                const data = await fetchHabitsForDate(characterId, currentDate);
                console.log('Daily habits fetched:', data);
                setHabits(data || []);
            } catch (error) {
                console.error('Error fetching daily habits:', error);
                setHabits([]);
            }
        };

        loadHabits();
    }, [characterId, currentDate]);

    return (
        <div className="daily-view">
            <h2>Daily Habits for {currentDate}</h2>
            <div className="habit-list-column">
                {habits.map((habit) => {
                    const attr = habit.attribute || '';
                    const iconUrl = attributeIcons[attr.toLowerCase()];

                    return (
                        <div key={habit.habit_id} className="habit-row">
                            <div className="habit-info">
                                {iconUrl && (
                                    <img
                                        src={iconUrl}
                                        alt={`${attr} icon`}
                                        className="attribute-icon"
                                    />
                                )}
                                <span className="habit-name">
                  {habit.habit_name || habit.name || 'Unnamed Habit'}
                </span>
                            </div>
                            <div className="habit-toggle">
                                <input
                                    type="checkbox"
                                    checked={habit.completed || false}
                                    onChange={(e) =>
                                        onToggleCompletion(habit.habit_id, currentDate, e.target.checked)
                                    }
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DailyView;
