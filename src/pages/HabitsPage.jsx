import { useState, useEffect } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { fetchHabitsForDate, markHabitComplete } from '../api/habitApi';
import attributeIcons from '../icons/attributeIcons';

const HabitsPage = () => {
    const { selectedCharacter, refreshCharacter } = useCharacter();
    const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'weekly'
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Generate week dates starting from Monday
    const getWeekDates = (startDate) => {
        const start = new Date(startDate);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
        const monday = new Date(start.setDate(diff));

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            return date.toISOString().split('T')[0];
        });
    };

    const weekDates = getWeekDates(selectedDate);

    useEffect(() => {
        if (selectedCharacter?.id) {
            loadHabits();
        }
    }, [selectedCharacter?.id, selectedDate, viewMode]);

    const loadHabits = async () => {
        try {
            setLoading(true);
            setError('');

            // For now, we'll get all habits and simulate completion status
            const habitData = await fetchHabitsForDate(selectedCharacter.id, selectedDate);
            setHabits(habitData || []);
        } catch (err) {
            console.error('Error loading habits:', err);
            setError('Failed to load habits');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleCompletion = async (habitId, date, completed) => {
        try {
            setLoading(true);
            await markHabitComplete(habitId, date, completed);

            // Refresh character data to update bonuses
            await refreshCharacter();

            // Reload habits to update UI
            await loadHabits();
        } catch (err) {
            console.error('Error updating habit completion:', err);
            setError('Failed to update habit completion');
        } finally {
            setLoading(false);
        }
    };

    const getAttributeIcon = (attribute) => {
        const iconUrl = attributeIcons[attribute?.toLowerCase()];
        return iconUrl ? (
            <img src={iconUrl} alt={`${attribute} icon`} className="attribute-icon" />
        ) : (
            <span className="attribute-text">{attribute?.slice(0, 3).toUpperCase()}</span>
        );
    };

    const isToday = (date) => {
        return date === new Date().toISOString().split('T')[0];
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    if (!selectedCharacter) {
        return (
            <div className="habits-page-loading">
                <h1>No Character Selected</h1>
                <p>Please select a character to view their habits.</p>
            </div>
        );
    }

    return (
        <div className="habits-page">
            <div className="habits-header">
                <h1>Habit Tracker</h1>
                <p>Track your daily habits to improve your character's abilities</p>
            </div>

            {/* View Toggle */}
            <div className="view-controls">
                <div className="view-toggle">
                    <button
                        className={viewMode === 'daily' ? 'active' : ''}
                        onClick={() => setViewMode('daily')}
                    >
                        Daily View
                    </button>
                    <button
                        className={viewMode === 'weekly' ? 'active' : ''}
                        onClick={() => setViewMode('weekly')}
                    >
                        Weekly View
                    </button>
                </div>

                {/* Date Selector for Daily View */}
                {viewMode === 'daily' && (
                    <div className="date-selector">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                )}
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {loading && (
                <div className="loading-message">
                    Loading habits...
                </div>
            )}

            {/* Daily View */}
            {viewMode === 'daily' && (
                <div className="daily-view">
                    <h2>
                        Habits for {formatDate(selectedDate)}
                        {isToday(selectedDate) && <span className="today-badge">Today</span>}
                    </h2>

                    {habits.length === 0 && !loading && (
                        <div className="no-habits">
                            <p>No habits found for this character.</p>
                            <p>Click on attribute cards in the Character page to create habits.</p>
                        </div>
                    )}

                    <div className="habits-list">
                        {habits.map((habit) => (
                            <div key={habit.habit_id} className="habit-item">
                                <div className="habit-info">
                                    {getAttributeIcon(habit.attribute)}
                                    <div className="habit-details">
                                        <h4>{habit.habit_name}</h4>
                                        {habit.description && (
                                            <p className="habit-description">{habit.description}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="habit-toggle">
                                    <label className="checkbox-container">
                                        <input
                                            type="checkbox"
                                            checked={habit.completed || false}
                                            onChange={(e) =>
                                                handleToggleCompletion(
                                                    habit.habit_id,
                                                    selectedDate,
                                                    e.target.checked
                                                )
                                            }
                                            disabled={loading}
                                        />
                                        <span className="checkbox-custom"></span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Weekly View */}
            {viewMode === 'weekly' && (
                <div className="weekly-view">
                    <h2>Weekly Habit Tracker</h2>

                    {habits.length === 0 && !loading && (
                        <div className="no-habits">
                            <p>No habits found for this character.</p>
                            <p>Click on attribute cards in the Character page to create habits.</p>
                        </div>
                    )}

                    <div className="weekly-grid">
                        {/* Header */}
                        <div className="weekly-header">
                            <div className="habit-name-header">Habit</div>
                            {weekDates.map((date) => (
                                <div key={date} className={`day-header ${isToday(date) ? 'today' : ''}`}>
                                    <div className="day-name">
                                        {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                    <div className="day-date">
                                        {new Date(date).getDate()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Habit Rows */}
                        {habits.map((habit) => (
                            <div key={habit.habit_id} className="habit-row">
                                <div className="habit-info">
                                    {getAttributeIcon(habit.attribute)}
                                    <div className="habit-details">
                                        <h4>{habit.habit_name}</h4>
                                    </div>
                                </div>
                                {weekDates.map((date) => (
                                    <div key={`${habit.habit_id}-${date}`} className="day-cell">
                                        <label className="checkbox-container">
                                            <input
                                                type="checkbox"
                                                checked={habit.completions?.includes(date) || false}
                                                onChange={(e) =>
                                                    handleToggleCompletion(
                                                        habit.habit_id,
                                                        date,
                                                        e.target.checked
                                                    )
                                                }
                                                disabled={loading}
                                            />
                                            <span className="checkbox-custom"></span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style jsx>{`
                .habits-page {
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 20px;
                    color: #eee;
                }

                .habits-page-loading {
                    text-align: center;
                    padding: 60px 20px;
                    color: #eee;
                }

                .habits-header {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .habits-header h1 {
                    margin: 0 0 8px 0;
                    color: #a5b4fc;
                    font-size: 2rem;
                }

                .habits-header p {
                    margin: 0;
                    color: #9ca3af;
                }

                .view-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .view-toggle {
                    display: flex;
                    background: #374151;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .view-toggle button {
                    background: transparent;
                    border: none;
                    color: #9ca3af;
                    padding: 12px 24px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .view-toggle button.active {
                    background: #3b82f6;
                    color: white;
                }

                .view-toggle button:hover:not(.active) {
                    background: #4b5563;
                    color: #eee;
                }

                .date-selector input {
                    background: #374151;
                    border: 1px solid #4b5563;
                    border-radius: 6px;
                    color: #eee;
                    padding: 8px 12px;
                    font-size: 1rem;
                }

                .error-message {
                    background: #dc2626;
                    color: white;
                    padding: 12px;
                    border-radius: 6px;
                    margin-bottom: 16px;
                }

                .loading-message {
                    text-align: center;
                    color: #9ca3af;
                    padding: 20px;
                }

                .daily-view, .weekly-view {
                    background: #1f2937;
                    border-radius: 12px;
                    padding: 24px;
                }

                .daily-view h2, .weekly-view h2 {
                    margin: 0 0 20px 0;
                    color: #a5b4fc;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .today-badge {
                    background: #10b981;
                    color: white;
                    font-size: 0.8rem;
                    padding: 4px 8px;
                    border-radius: 12px;
                }

                .no-habits {
                    text-align: center;
                    color: #6b7280;
                    padding: 40px 20px;
                }

                .habits-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .habit-item, .habit-row {
                    background: #374151;
                    border-radius: 8px;
                    padding: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                }

                .habit-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                }

                .attribute-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                }

                .attribute-text {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    background: #4b5563;
                    border-radius: 50%;
                    font-size: 0.7rem;
                    font-weight: bold;
                    color: #eee;
                }

                .habit-details h4 {
                    margin: 0 0 4px 0;
                    color: #eee;
                }

                .habit-description {
                    margin: 0;
                    color: #9ca3af;
                    font-size: 0.9rem;
                }

                .checkbox-container {
                    position: relative;
                    cursor: pointer;
                    user-select: none;
                }

                .checkbox-container input {
                    position: absolute;
                    opacity: 0;
                    cursor: pointer;
                }

                .checkbox-custom {
                    position: relative;
                    display: inline-block;
                    width: 24px;
                    height: 24px;
                    background: #1f2937;
                    border: 2px solid #4b5563;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                }

                .checkbox-container input:checked + .checkbox-custom {
                    background: #10b981;
                    border-color: #10b981;
                }

                .checkbox-container input:checked + .checkbox-custom::after {
                    content: '✓';
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    color: white;
                    font-weight: bold;
                    font-size: 14px;
                }

                .checkbox-container:hover .checkbox-custom {
                    border-color: #6b7280;
                }

                /* Weekly View Styles */
                .weekly-grid {
                    display: grid;
                    grid-template-columns: 200px repeat(7, 1fr);
                    gap: 1px;
                    background: #4b5563;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .weekly-header {
                    display: contents;
                }

                .habit-name-header {
                    background: #374151;
                    padding: 16px;
                    font-weight: bold;
                    color: #a5b4fc;
                }

                .day-header {
                    background: #374151;
                    padding: 12px 8px;
                    text-align: center;
                    font-size: 0.9rem;
                }

                .day-header.today {
                    background: #10b981;
                    color: white;
                }

                .day-name {
                    font-weight: bold;
                    margin-bottom: 2px;
                }

                .day-date {
                    color: #9ca3af;
                    font-size: 0.8rem;
                }

                .day-header.today .day-date {
                    color: rgba(255, 255, 255, 0.8);
                }

                .habit-row {
                    display: contents;
                }

                .habit-row .habit-info {
                    background: #1f2937;
                    padding: 16px;
                    border-radius: 0;
                }

                .day-cell {
                    background: #1f2937;
                    padding: 16px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                @media (max-width: 768px) {
                    .view-controls {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .weekly-grid {
                        grid-template-columns: 150px repeat(7, 1fr);
                        font-size: 0.8rem;
                    }

                    .habit-name-header,
                    .habit-row .habit-info {
                        padding: 12px;
                    }

                    .day-header,
                    .day-cell {
                        padding: 8px;
                    }
                }
            `}</style>
        </div>
    );
};

export default HabitsPage;