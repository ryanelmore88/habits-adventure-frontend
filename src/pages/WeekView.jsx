import React, { useEffect, useState } from 'react';
import { useCharacter } from '../contexts/CharacterContext.jsx';
import { fetchHabitsForWeek } from '../api/habitApi.js';
import attributeIcons from '../icons/attributeIcons.js';
import '../styles/DailyView.css'; // reuse existing styles

const getCurrentWeekDates = () => {
    const today = new Date();
    const day = today.getDay(); // 0 (Sun) to 6 (Sat)
    const start = new Date(today);
    start.setDate(today.getDate() - day); // Go to previous Sunday

    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
    });
};

const WeekView = ({ onToggleCompletion }) => {
    const { characterId } = useCharacter();
    const [habits, setHabits] = useState([]);
    const weekDates = getCurrentWeekDates();

    useEffect(() => {
        if (!characterId) return;

        const loadHabits = async () => {
            try {
                const data = await fetchHabitsForWeek(characterId); // Assumes API includes completions per day
                console.log('Weekly habits fetched:', data);
                setHabits(data || []);
            } catch (error) {
                console.error('Error fetching weekly habits:', error);
                setHabits([]);
            }
        };

        loadHabits();
    }, [characterId]);

    return (
        <div className="daily-view">
            <h2>Weekly Habit Tracker</h2>
            <div className="habit-list-column">
                <div className="habit-row header">
                    <div className="habit-info">Habit</div>
                    <div className="habit-days">
                        {weekDates.map((date) => (
                            <span key={date} className="day-label">
                {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
                        ))}
                    </div>
                </div>

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
                            <div className="habit-days">
                                {weekDates.map((date) => {
                                    const completedDates = habit.completions || [];
                                    const isComplete = completedDates.includes(date);
                                    return (
                                        <input
                                            key={`${habit.habit_id}-${date}`}
                                            type="checkbox"
                                            checked={isComplete}
                                            onChange={(e) =>
                                                onToggleCompletion(habit.habit_id, date, e.target.checked)
                                            }
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WeekView;
