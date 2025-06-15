// src/utils/dateUtils.js

/**
 * Get today's date in YYYY-MM-DD format using local timezone
 * This prevents the "day behind" issue caused by UTC conversion
 */
export const getLocalTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Get a specific date in YYYY-MM-DD format using local timezone
 * @param {Date} date - The date object
 * @returns {string} Date in YYYY-MM-DD format
 */
export const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Check if a date string represents today
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean}
 */
export const isToday = (dateString) => {
    return dateString === getLocalTodayDate();
};

/**
 * Get current week dates starting from Monday, using local timezone
 * @param {string} startDate - Optional start date in YYYY-MM-DD format
 * @returns {string[]} Array of 7 dates in YYYY-MM-DD format
 */
export const getWeekDates = (startDate = null) => {
    const start = startDate ? new Date(startDate + 'T00:00:00') : new Date();
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(start.setDate(diff));

    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        return getLocalDateString(date);
    });
};

/**
 * Get current week dates starting from Sunday, using local timezone
 * @returns {string[]} Array of 7 dates in YYYY-MM-DD format
 */
export const getCurrentWeekDatesSundayStart = () => {
    const today = new Date();
    const day = today.getDay(); // 0 (Sun) to 6 (Sat)
    const start = new Date(today);
    start.setDate(today.getDate() - day); // Go to previous Sunday

    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        return getLocalDateString(date);
    });
};

/**
 * Format a date string for display
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00'); // Add time to prevent timezone issues
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Validate date string format
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean}
 */
export const isValidDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return false;
    const date = new Date(dateString + 'T00:00:00');
    return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
};