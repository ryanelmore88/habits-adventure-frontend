// src/components/HabitsPage.jsx
import React, { useState, useEffect } from 'react';
import DayActivity from '../components/DailyView.jsx';
import WeekActivity from './WeekView.jsx';
import { fetchHabitsForDate, fetchHabitsForWeek } from '../api/habitApi.js';
import '../styles/HabitsPage.css';
import {Link} from "react-router-dom";
import NavBar from "../components/Common/NavBar.jsx";

const HabitsPage = ({ character }) => {
    const [viewMode, setViewMode] = useState('daily'); // "daily" or "weekly"
    const [dailyHabits, setDailyHabits] = useState([]);
    const [weeklyHabits, setWeeklyHabits] = useState([]);

    // Current date in "YYYY-MM-DD" format for the daily view.
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

    // Generate an array of 7 date strings for the weekly view.
    const [weekDates, setWeekDates] = useState([]);

    const handleToggleCompletion = (habitId, day, completed) => {
        console.log("Toggling completion:", habitId, day, completed);
        // Implement your API call to update the completion status.
    };

    // Fetch daily habits when character or currentDate changes.
    useEffect(() => {
        if (character) {
            fetchHabitsForDate(character.id, currentDate)
                .then((data) => setDailyHabits(data))
                .catch((err) => console.error("Error fetching daily habits:", err));
        }
    }, [character, currentDate]);

    // Compute week dates and fetch weekly habits.
    useEffect(() => {
        const startDate = new Date(currentDate);
        const weekDatesArray = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startDate);
            day.setDate(day.getDate() + i);
            weekDatesArray.push(day.toISOString().split('T')[0]);
        }
        setWeekDates(weekDatesArray);

        if (character) {
            fetchHabitsForWeek(character.id, weekDatesArray)
                .then((data) => setWeeklyHabits(data))
                .catch((err) => console.error("Error fetching weekly habits:", err));
        }
    }, [character, currentDate]);

    return (
        <div className="habits-page">
            <h1>Habits</h1>
            <div className="view-toggle">
                <button onClick={() => setViewMode('daily')} className={viewMode === 'daily' ? 'active' : ''}>Daily
                    View
                </button>
                <button onClick={() => setViewMode('weekly')} className={viewMode === 'weekly' ? 'active' : ''}>Weekly
                    View
                </button>
            </div>
            {viewMode === 'daily' ? (
                <DayActivity
                    date={new Date().toISOString().split("T")[0]}
                    onToggleCompletion={handleToggleCompletion}
                />
            ) : (
                <WeekActivity onToggleCompletion={handleToggleCompletion}/>
            )}
        </div>
    );
};

export default HabitsPage;
