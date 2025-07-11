// src/pages/HabitsPage.jsx - Updated with proper date handling
import { useState, useEffect } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { fetchHabitsForDate, markHabitComplete } from '../api/habitApi';
import { getLocalTodayDate, getWeekDates, isToday, formatDate } from '../utils/dateUtils';
import attributeIcons from '../icons/attributeIcons';
import '../styles/HabitsPage.css';

const HabitsPage = () => {
    const { selectedCharacter, refreshCharacter } = useCharacter();
    const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'weekly'
    const [habits, setHabits] = useState([]);
    const [completions, setCompletions] = useState({}); // Store completion status
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Use local timezone instead of UTC
    const [selectedDate, setSelectedDate] = useState(getLocalTodayDate());

    // Use updated date utility
    const weekDates = getWeekDates(selectedDate);

    useEffect(() => {
        if (selectedCharacter?.id) {
            loadHabitsAndCompletions();
        }
    }, [selectedCharacter?.id, selectedDate, viewMode]);

    const loadHabitsAndCompletions = async () => {
        try {
            setLoading(true);
            setError('');

            // ✅ SIMPLIFIED: Just load habits (which includes completion data)
            const habitData = await fetchHabitsForDate(selectedCharacter.id, selectedDate);
            console.log('Raw habits data from API:', habitData);

            setHabits(habitData || []);

            // ✅ NEW: Build completion map from habits data instead of separate API calls
            const completionMap = {};

            if (habitData && Array.isArray(habitData)) {
                habitData.forEach((habit) => {
                    const habitId = habit.habit_id;
                    const completions = habit.completions || [];

                    console.log(`Processing habit ${habit.habit_name} (ID: ${habitId})`);
                    console.log(`Completions for this habit:`, completions);

                    // Mark each completion date as true for this habit
                    completions.forEach((date) => {
                        const key = `${habitId}_${date}`;
                        completionMap[key] = true;
                        console.log(`Added completion: ${key} = true`);
                    });
                });
            }

            console.log('Final completion map built from habits:', completionMap);
            console.log('All completion keys:', Object.keys(completionMap));
            setCompletions(completionMap);

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

            // Update local completion state immediately for visual feedback
            const key = `${habitId}_${date}`;
            setCompletions(prev => ({
                ...prev,
                [key]: completed
            }));

            // Refresh character data to update bonuses
            await refreshCharacter();

            // Reload habits to ensure consistency
            await loadHabitsAndCompletions();
        } catch (err) {
            console.error('Error updating habit completion:', err);
            setError('Failed to update habit completion');
        } finally {
            setLoading(false);
        }
    };

    const isHabitCompleted = (habitId, date) => {
        const key = `${habitId}_${date}`;
        return completions[key] === true;
    };

    const getAttributeIcon = (attribute) => {
        const iconUrl = attributeIcons[attribute?.toLowerCase()];
        return iconUrl ? (
            <img src={iconUrl} alt={`${attribute} icon`} className="attribute-icon" />
        ) : (
            <span className="attribute-text">{attribute?.slice(0, 3).toUpperCase()}</span>
        );
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
                            max={getLocalTodayDate()} // Use local timezone
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
                        {habits.map((habit) => {
                            const habitId = habit.habit_id || habit.id;
                            const isCompleted = isHabitCompleted(habitId, selectedDate);

                            return (
                                <div key={habitId} className="habit-item">
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
                                                checked={isCompleted}
                                                onChange={(e) =>
                                                    handleToggleCompletion(
                                                        habitId,
                                                        selectedDate,
                                                        e.target.checked
                                                    )
                                                }
                                                disabled={loading}
                                            />
                                            <span className="checkbox-custom"></span>
                                            <span className="checkbox-label">
                                                {isCompleted ? 'Completed' : 'Mark Complete'}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            );
                        })}
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
                                        {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                    <div className="day-date">
                                        {new Date(date + 'T00:00:00').getDate()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Habit Rows */}
                        {habits.map((habit) => {
                            const habitId = habit.habit_id || habit.id;

                            return (
                                <div key={habitId} className="habit-row">
                                    <div className="habit-info">
                                        {getAttributeIcon(habit.attribute)}
                                        <div className="habit-details">
                                            <h4>{habit.habit_name}</h4>
                                        </div>
                                    </div>
                                    {weekDates.map((date) => {
                                        const isCompleted = isHabitCompleted(habitId, date);

                                        return (
                                            <div key={`${habitId}-${date}`} className="day-cell">
                                                <label className="checkbox-container">
                                                    <input
                                                        type="checkbox"
                                                        checked={isCompleted}
                                                        onChange={(e) =>
                                                            handleToggleCompletion(
                                                                habitId,
                                                                date,
                                                                e.target.checked
                                                            )
                                                        }
                                                        disabled={loading}
                                                    />
                                                    <span className="checkbox-custom"></span>
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HabitsPage;