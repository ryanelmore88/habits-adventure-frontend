// File: frontend/src/api/index.js
// Central export file for all APIs

export * from './authApi';
export * from './characterApi';
export * from './habitApi';
export * from './enemyApi';
export * from './adventureApi';

// Re-export the APIs as named exports
export { authApi } from './authApi';
export { characterApi } from './characterApi';
export { habitApi } from './habitApi';
export { enemyApi } from './enemyApi';
export { adventureApi } from './adventureApi';