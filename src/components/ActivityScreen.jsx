// src/components/ActivityScreen.jsx
import React, { useState } from 'react';
import DayActivity from './DailyView.jsx';
import WeekActivity from '../pages/WeekView.jsx';

const ActivityScreen = ({ habits, weekHabits, date, daysOfWeek }) => {
    // mode can be "day" or "week"
    const [mode, setMode] = useState("day");

    const toggleMode = () => {
        setMode((prev) => (prev === "day" ? "week" : "day"));
    };

    const handleToggleCompletionDaily = (habit_id, completed) => {
        // call your API to mark completion for 'date'
    };

    const handleToggleCompletionWeekly = (habit_id, day, completed) => {
        // call your API to mark completion for 'day'
    };

    return (
        <div className="activity-screen">
            <button onClick={toggleMode}>
                {mode === "day" ? "Switch to Weekly View" : "Switch to Daily View"}
            </button>
            {mode === "day" ? (
                <DayActivity
                    date={date}
                    habits={habits}
                    onToggleCompletion={handleToggleCompletionDaily}
                />
            ) : (
                <WeekActivity
                    daysOfWeek={daysOfWeek}
                    habits={weekHabits}
                    onToggleCompletion={handleToggleCompletionWeekly}
                />
            )}
        </div>
    );
};

export default ActivityScreen;
