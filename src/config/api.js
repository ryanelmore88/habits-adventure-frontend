// Create new file: src/config/api.js
// Environment variables with fallbacks
const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    timeout: 10000,
    retries: 3,
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
    appName: import.meta.env.VITE_APP_NAME || 'Habits Adventure'
};

// Debug logging in development
if (API_CONFIG.debugMode) {
    console.log('API Configuration:', API_CONFIG);
    console.log('All VITE env vars:', import.meta.env);
}

export default API_CONFIG;