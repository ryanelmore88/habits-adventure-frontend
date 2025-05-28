// src/api/habitApi.js
import {BACKEND_URL} from "../config.js";
import {B} from "@3d-dice/dice-box/dist/Dice.js";
const API_BASE = import.meta.env.VITE_API_URL;
console.log("API_BASE: ", API_BASE);
console.log("Backend URL: ", BACKEND_URL);

export const createHabit = async (habitData) => {
    try {
        const response = await fetch(`${API_BASE}/api/habit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(habitData),
        });
        if (!response.ok) {
            throw new Error("Failed to create habit");
        }
        const data = await response.json();
        return data.data; // Assuming the backend returns { "status": "success", "data": { ... } }
    } catch (error) {
        console.error("Error creating habit:", error);
        throw error;
    }
};

export const fetchHabitsForAttribute = async (characterId, attribute) => {
    try {
        const response = await fetch(`${API_BASE}/api/habit?character_id=${characterId}&attribute=${attribute}`);
        if (!response.ok) throw new Error("Failed to fetch habits");
        const data = await response.json();
        return data.data; // assuming your API returns { status: "success", data: [...] }
    } catch (error) {
        console.error("Error fetching habits:", error);
        return [];
    }
};

export const deleteHabit = async (habitId) => {
        try {
            const response = await fetch(`${API_BASE}/api/habit/${habitId}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete habit");
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error deleting habit:", error);
            throw error;
        }
};

export const fetchHabitCompletions = async (habitId) => {
    try {
        const response = await fetch(`${API_BASE}/api/habit/${habitId}/completions`);
        if (!response.ok) throw new Error("Failed to fetch habit completions");
        const data = await response.json();
        return data.data; // Adjust if your backend returns a different structure
    } catch (error) {
        console.error("Error fetching habit completions:", error);
        return [];
    }
};

export const fetchHabitsForDate = async (characterId) => {
    try {
        const response = await fetch(
            `${API_BASE}/api/character/${characterId}/habits`
        );
        if (!response.ok) {
            throw new Error("Failed to fetch daily completions");
        }
        const data = await response.json();

        return data.data; // Assuming the backend returns { "status": "success", "data": [ ... ] }
    } catch (error) {
        console.error("Error fetching daily completions:", error);
        return [];
    }
};

export const fetchHabitsForWeek = async (characterId) => {
    try {
        const response = await fetch(
            `${API_BASE}/api/character/${characterId}/habits`
        );
        if (!response.ok) {
            throw new Error("Failed to fetch daily completions");
        }
        const data = await response.json();

        return data.data; // Assuming the backend returns { "status": "success", "data": [ ... ] }
    } catch (error) {
        console.error("Error fetching daily completions:", error);
        return [];
    }
};