
const API_BASE = import.meta.env.VITE_API_URL;

export const fetchCharacter = async (characterId) => {
    try {
        console.log("API_BASE: " + API_BASE);
        const response = await fetch(`${API_BASE}/api/character/${characterId}`);
        if (!response.ok) throw new Error("Could not fetch character");
        const { data }= await response.json();
        return data;
        // return await response.json();
        // FastAPI returns { status: "...", data: { id, name, attributes } }
    } catch (error) {
        console.error(error);
    }
};

export const createHabit = async (habitData) => {
    try {
        const response = await fetch(`${API_BASE}/api/habit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(habitData)
        });
        if (!response.ok) throw new Error('Failed to create habit');
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error(error);
        return null;
    }
};

export async function createCharacter(payload) {
    const res = await fetch(`${API_BASE}/api/character`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create character");
    }
    return res.json();   // { status:"success", data:{ id, name, attributes… } }
}