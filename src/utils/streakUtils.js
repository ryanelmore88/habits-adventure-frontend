// File: src/utils/streakUtils.js
// Utility functions for calculating habit streaks

import { getLocalTodayDate } from './dateUtils';

/**
 * Calculate consecutive days streak from habit completion data
 * @param {Array} habits - Array of habits with completion data
 * @returns {number} - Number of consecutive days with at least one habit completion
 */
export const calculateStreak = (habits) => {
    if (!Array.isArray(habits) || habits.length === 0) {
        return 0;
    }

    // Collect all unique completion dates from all habits
    const allCompletionDates = new Set();

    habits.forEach(habit => {
        const completions = habit.completions || [];
        completions.forEach(date => {
            // Ensure date is in YYYY-MM-DD format
            if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                allCompletionDates.add(date);
            }
        });
    });

    // Convert to sorted array (newest first)
    const sortedDates = Array.from(allCompletionDates).sort((a, b) => b.localeCompare(a));

    if (sortedDates.length === 0) {
        return 0;
    }

    const today = getLocalTodayDate();
    let streak = 0;
    let checkDate = today;

    // Start from today and work backwards
    while (true) {
        if (sortedDates.includes(checkDate)) {
            streak++;
            // Move to previous day
            const date = new Date(checkDate);
            date.setDate(date.getDate() - 1);
            checkDate = date.toISOString().split('T')[0];
        } else {
            // If this is the first day we're checking (today), allow it
            // This handles the case where user hasn't completed anything today yet
            // but has an ongoing streak from previous days
            if (checkDate === today) {
                // Move to yesterday and continue checking
                const date = new Date(checkDate);
                date.setDate(date.getDate() - 1);
                checkDate = date.toISOString().split('T')[0];
                continue;
            } else {
                // Streak is broken
                break;
            }
        }
    }

    return streak;
};

/**
 * Get streak status message based on streak count
 * @param {number} streak - Current streak count
 * @returns {string} - Motivational message
 */
export const getStreakMessage = (streak) => {
    if (streak === 0) {
        return "Start your streak today!";
    } else if (streak === 1) {
        return "Great start! Keep it going!";
    } else if (streak < 7) {
        return `${streak} days strong! 💪`;
    } else if (streak < 30) {
        return `Amazing ${streak}-day streak! 🔥`;
    } else if (streak < 100) {
        return `Incredible ${streak}-day streak! 🌟`;
    } else {
        return `Legendary ${streak}-day streak! 👑`;
    }
};

/**
 * Calculate streak including today (for real-time updates)
 * @param {Array} habits - Array of habits with completion data
 * @param {Array} todayCompletions - Array of habit IDs completed today (optional)
 * @returns {number} - Current streak including any completions made today
 */
export const calculateCurrentStreak = (habits, todayCompletions = []) => {
    const baseStreak = calculateStreak(habits);
    const today = getLocalTodayDate();

    // Check if user has completed any habits today
    const hasCompletionToday = habits.some(habit => {
        const completions = habit.completions || [];
        return completions.includes(today) || todayCompletions.includes(habit.habit_id);
    });

    // If base streak calculation included today, return as-is
    // If not, but user has completions today, add 1 to the streak
    const allCompletionDates = new Set();
    habits.forEach(habit => {
        const completions = habit.completions || [];
        completions.forEach(date => {
            if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                allCompletionDates.add(date);
            }
        });
    });

    const todayIncludedInBase = allCompletionDates.has(today);

    if (!todayIncludedInBase && hasCompletionToday) {
        return baseStreak + 1;
    }

    return baseStreak;
};