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

    // Generate week dates starting from SUNDAY (fixed)
    const getWeekDates = (startDate) => {
        const start = new Date(startDate);
        const day = start.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // Calculate days to subtract to get to Sunday
        const daysToSunday = day; // If today is Sunday (0), subtract 0. If Monday (1), subtract 1, etc.
        const sunday = new Date(start);
        sunday.setDate(start.getDate() - daysToSunday);

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(sunday);
            date.setDate(sunday.getDate() + i);
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

            const habitData = await fetchHabitsForDate(selectedCharacter.id, selectedDate);

            // Enhanced habits with completion tracking
            const habitsWithCompletions = (habitData || []).map(habit => ({
                ...habit,
                // Initialize completions array if not present
                completions: habit.completions || [],
                // Check if completed for selected date
                completed: habit.completions?.includes(selectedDate) || false
            }));

            setHabits(habitsWithCompletions);
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

            // Optimistically update UI first
            setHabits(prevHabits =>
                prevHabits.map(habit => {
                    if (habit.habit_id === habitId) {
                        const updatedCompletions = completed
                            ? [...(habit.completions || []), date].filter((d, i, arr) => arr.indexOf(d) === i) // Add and dedupe
                            : (habit.completions || []).filter(d => d !== date); // Remove

                        return {
                            ...habit,
                            completions: updatedCompletions,
                            completed: viewMode === 'daily' ? completed : habit.completed
                        };
                    }
                    return habit;
                })
            );

            // Then update backend
            await markHabitComplete(habitId, date, completed);

            // Refresh character data to update bonuses
            await refreshCharacter();

            // Optionally reload habits to ensure sync (but UI should already be correct)
            // await loadHabits();
        } catch (err) {
            console.error('Error updating habit completion:', err);
            setError('Failed to update habit completion');

            // Revert optimistic update on error
            await loadHabits();
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

    // Helper to check if habit is completed for a specific date
    const isHabitCompletedForDate = (habit, date) => {
        return habit.completions?.includes(date) || false;
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
                                            checked={isHabitCompletedForDate(habit, selectedDate)}
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
                    <h2>Weekly Habit Tracker (Sunday - Saturday)</h2>

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
                                                checked={isHabitCompletedForDate(habit, date)}
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
        </div>
    );
};

export default HabitsPage;