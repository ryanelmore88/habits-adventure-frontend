# Habits Adventure - Complete Application Tutorial

## Table of Contents
1. [Application Overview](#application-overview)
2. [Core Concepts](#core-concepts)
3. [User Journey](#user-journey)
4. [Technical Architecture](#technical-architecture)
5. [Character System](#character-system)
6. [Habit Tracking System](#habit-tracking-system)
7. [Combat & Adventure System](#combat--adventure-system)
8. [Dice System](#dice-system)
9. [Data Flow](#data-flow)
10. [API Integration](#api-integration)
11. [State Management](#state-management)
12. [Component Structure](#component-structure)

---

## Application Overview

**Habits Adventure** is a gamified habit tracking application that transforms daily habit completion into RPG-style character progression. Users create D&D-inspired characters and improve their abilities by consistently completing real-world habits. The application combines habit tracking with dice-based combat, character progression, and adventure mechanics.

### Key Features
- **Character Creation**: D&D-style character creation with six attributes
- **Habit Tracking**: Link real-world habits to character attributes
- **RPG Progression**: Character attributes improve as habits are completed
- **Dice-based Combat**: 3D dice rolling system for battles
- **Adventure System**: Multiple game modes including skirmishes and quests
- **Visual Progress**: Character images, health bars, and progression indicators

---

## Core Concepts

### 1. The Gamification Loop
```
Complete Habits → Gain Attribute Points → Stronger Dice Pools → Better Combat Performance → More Adventure Rewards
```

### 2. Character Attributes (D&D Style)
- **Strength**: Physical power and melee combat
- **Dexterity**: Agility and ranged combat
- **Constitution**: Health, endurance, and HP calculation
- **Intelligence**: Magic and problem-solving
- **Wisdom**: Perception and healing
- **Charisma**: Leadership and social interactions

### 3. Habit-to-Attribute Mapping
Users create habits that improve specific attributes:
- Exercise habits → Strength
- Yoga/stretching → Dexterity  
- Sleep/nutrition → Constitution
- Reading/learning → Intelligence
- Meditation/reflection → Wisdom
- Social activities → Charisma

### 4. Dice Progression System
Character attributes translate to combat dice based on a 20-level progression:
- Level 1: 1d4
- Level 2: 1d6
- Level 3: 1d8
- Level 4: 1d12
- Level 5+: Multiple dice combinations

---

## User Journey

### 1. Authentication & Onboarding
```jsx
// User flow: Login → Register → Character Selection
AuthContext manages authentication state
└── Login/Register pages handle JWT tokens
└── Automatic redirect to character selection after auth
```

**Key Components:**
- `LoginPage.jsx` - Email/password authentication
- `RegisterPage.jsx` - New user registration
- `AuthContext.jsx` - Manages authentication state and tokens

### 2. Character Management
```jsx
// Character flow: Selection → Creation → Management
CharacterPicker → CharacterCreatePage → CharacterPage
└── Character data stored in CharacterContext
└── Character class handles all calculations
```

**Character Selection Process:**
1. View available characters
2. Create new character if none exist
3. Select active character for gameplay
4. Character data flows to all other components

### 3. Daily Habit Tracking
```jsx
// Habit flow: View → Complete → Attribute Bonus
HabitsPage → Habit completion → Character attribute increase
└── Daily/Weekly view modes
└── Real-time completion tracking
└── Attribute bonuses applied immediately
```

**Habit Tracking Features:**
- Daily and weekly view modes
- Visual completion indicators
- Attribute icons showing which skills improve
- Historical tracking and streak management

### 4. Adventure & Combat
```jsx
// Adventure flow: Selection → Combat → Rewards
AdventurePage → CombatArea → Result Processing
└── Skirmish mode (quick battles)
└── Quest mode (story-driven adventures)
└── 3D dice rolling system
└── XP and loot rewards
```

---

## Technical Architecture

### Application Structure
```
App.jsx (Root component)
├── AuthProvider (Authentication context)
├── CharacterProvider (Character state management)
├── Router (React Router for navigation)
│   ├── LoginPage / RegisterPage (Unauthenticated)
│   └── Authenticated Routes
│       ├── CharacterPicker (Character selection)
│       ├── CharacterPage (Character management)
│       ├── HabitsPage (Habit tracking)
│       └── AdventurePage (Combat & adventures)
└── NavBar (Bottom navigation)
```

### Key Technologies
- **React 19**: Latest React with hooks and functional components
- **React Router v7**: Client-side routing with protected routes
- **Vite**: Fast build tool and development server
- **@3d-dice packages**: 3D dice rendering and physics
- **Axios**: HTTP client for API communication
- **CSS Modules**: Component-scoped styling

---

## Character System

### Character Data Model
```javascript
// Character class (Character.js)
class Character {
  constructor(characterData) {
    this.id = characterData.id;
    this.name = characterData.name;
    this.image_data = characterData.image_data; // Base64 image
    this.attributes = this.processAttributes(characterData.attributes);
    this.maxHp = this.calculateMaxHP();
    this.currentHp = characterData.current_hp || this.maxHp;
    this.level = characterData.level || 1;
    this.currentXp = characterData.current_xp || 0;
  }
}
```

### Attribute Processing
Each attribute contains:
```javascript
{
  base: 10,              // Base attribute score (D&D style)
  habitPoints: 0,        // Points gained from habit completion
  level: 1,              // Calculated level (1-20)
  diceProgression: [...], // Array of dice for this level
  diceNotation: "1d4",   // Human-readable dice string
  effectiveScore: 10,    // base + floor(habitPoints / 5)
  hpBonus: 0            // HP bonus (Constitution only)
}
```

### Level Calculation
```javascript
// Every 2 points above 10 = +1 level (up to level 20)
calculateAttributeLevel(baseScore, habitPoints) {
  const effectiveScore = baseScore + Math.floor(habitPoints / 5);
  
  if (effectiveScore >= 48) return 20; // Max level
  if (effectiveScore >= 46) return 19;
  // ... continuing down to level 1
  return Math.max(1, Math.floor((effectiveScore - 8) / 2));
}
```

### HP Calculation
```javascript
// Constitution determines HP bonus
calculateMaxHP() {
  const baseHP = 20; // All characters start with 20 HP
  const constitutionBonus = this.attributes.constitution.hpBonus || 0;
  return Math.max(1, baseHP + constitutionBonus);
}
```

### Combat Dice Pool
```javascript
// All attributes except Constitution contribute to combat dice
getCombatDicePool() {
  const combatAttributes = ['strength', 'dexterity', 'intelligence', 'wisdom', 'charisma'];
  // Combine dice from all combat attributes
  // Returns consolidated notation like "3d4 + 2d6 + 1d12"
}
```

---

## Habit Tracking System

### Habit Data Structure
```javascript
{
  habit_id: "unique_id",
  habit_name: "Daily Exercise",
  description: "30 minutes of physical activity",
  attribute: "strength",           // Which attribute this improves
  completions: ["2024-01-01", ...], // Array of completion dates
  character_id: "character_id"
}
```

### Daily Tracking Process
1. **Load Habits**: Fetch habits for selected character and date
2. **Build Completion Map**: Create lookup table for O(1) completion checks
3. **Render Interface**: Show habits with completion checkboxes
4. **Handle Completion**: Update backend and refresh character data
5. **Apply Bonuses**: Character attributes automatically recalculated

### Weekly View
```javascript
// Generate week dates starting from Monday
getWeekDates(startDate) {
  const start = startDate ? new Date(startDate + 'T00:00:00') : new Date();
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
  // Return array of 7 dates in YYYY-MM-DD format
}
```

### Date Handling
```javascript
// All dates use local timezone to prevent "day behind" issues
getLocalTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

### Completion State Management
```javascript
// Completion map structure: habitId_date -> boolean
const completionMap = {
  "habit1_2024-01-01": true,
  "habit1_2024-01-02": false,
  "habit2_2024-01-01": true
};

// Check completion status
const isHabitCompleted = (habitId, date) => {
  const key = `${habitId}_${date}`;
  return completions[key] === true;
};
```

---

## Combat & Adventure System

### Combat Engine
```javascript
class CombatEngine {
  // Core dice rolling with multiple die types
  rollDice(diceString) {
    // Handles complex notation: "3d4+2d6+1"
    const parts = diceString.split('+');
    let total = 0;
    for (const part of parts) {
      // Parse dice (NdX) or flat bonuses (N)
    }
    return total;
  }

  // Combine multiple dice pools into one
  combineDicePools(dicePools) {
    // Used for multi-enemy encounters
    // Combines ["2d4", "1d6", "3d4"] → "5d4+1d6"
  }

  // Execute combat round
  executeCombatRound(character, enemy) {
    const characterRoll = this.rollDice(character.dicePool);
    const enemyRoll = this.rollDice(enemy.dicePool);
    
    // Determine winner and calculate damage
    if (characterRoll > enemyRoll) {
      // Character wins
      damage = Math.max(1, characterRoll - enemyRoll);
      // Apply damage to enemy
    } else if (enemyRoll > characterRoll) {
      // Enemy wins
      damage = Math.max(1, enemyRoll - characterRoll);
      // Apply damage to character
    }
    // Return combat result
  }
}
```

### Adventure Modes

#### 1. Skirmish Mode
- **Quick battles** against individual monsters
- **Immediate rewards** (XP, loot)
- **Testing ground** for character abilities
- **Simple win/lose** mechanics

#### 2. Quest Mode
- **Multi-room adventures** with story elements
- **Player choices** affect outcomes
- **Progressive difficulty** through rooms
- **Narrative-driven** content

#### 3. Expedition Mode (Coming Soon)
- **Multi-session** adventures
- **Team-based** gameplay
- **Epic rewards** for completion
- **Persistent progress** across sessions

### Multi-Enemy Combat
```javascript
// useCombat hook supports combined enemy encounters
const startMultiCombat = (enemyTypes) => {
  // Create individual enemy instances
  const individualEnemies = enemyTypes.map((type, index) => 
    createEnemyInstance(type, index)
  );
  
  // Calculate combined stats
  const combinedEnemy = {
    name: "Goblin x2 + Orc", // Display name
    currentHp: 50,           // Total HP
    dicePool: "4d4+2d6",     // Combined dice pool
    xpReward: 125            // Total XP reward
  };
  
  // Combat proceeds against combined enemy
  // Damage is distributed to individual enemies (lowest HP first)
};
```

---

## Dice System

### 3D Dice Implementation
```javascript
// DiceBox.js - 3D dice configuration
import DiceBox from "@3d-dice/dice-box";

const baseConfig = {
  assetPath: "/assets/dice-box/",
  startingHeight: 8,
  throwForce: 6,
  spinForce: 5,
  scale: 6,              // Large dice for full-screen rolling
  gravity: 1,            // Dramatic physics
  friction: 0.8,
  restitution: 0.4
};

// Different colored dice for different entities
const CharacterDice = new DiceBox("#dice-box", {
  ...baseConfig,
  themeColor: "#0066ff"  // Blue dice for player
});

const OpponentDice = new DiceBox("#dice-box", {
  ...baseConfig,
  themeColor: "#ff0000"  // Red dice for enemies
});
```

### Dice Pool Utilities
```javascript
// dicePoolUtils.js - Dice calculation helpers

// Calculate character dice pool from attributes
calculateCharacterDicePool(character) {
  const diceAttributes = ['strength', 'dexterity', 'intelligence', 'wisdom', 'charisma'];
  let totalDice = 0;
  
  diceAttributes.forEach(attrName => {
    const attribute = character.attributes[attrName];
    if (attribute) {
      // Each attribute contributes 1d4 base + bonuses
      const baseDice = 1;
      const bonusDice = Math.floor(Math.max(0, attribute.base - 10) / 4);
      totalDice += baseDice + bonusDice;
    }
  });
  
  return {
    dicePool: `${totalDice}d4`,
    totalDice,
    description: `${totalDice} dice from attributes`
  };
}

// Consolidate dice notation
consolidateDiceNotation(diceNotation) {
  // "1d4 + 1d4 + 1d6 + 1d4" → "3d4 + 1d6"
  const diceMap = new Map();
  // Parse, count, and consolidate dice of same type
  // Return sorted by die size (largest first)
}
```

### Dice Rolling Integration
```javascript
// Combat flow with 3D dice
const handleDiceRoll = async (characterDicePool, enemyDicePool) => {
  // 1. Show full-screen dice box
  document.getElementById('dice-box').style.display = 'block';
  
  // 2. Roll character dice (blue)
  const characterResult = await CharacterDice.roll(characterDicePool);
  
  // 3. Roll enemy dice (red)  
  const enemyResult = await OpponentDice.roll(enemyDicePool);
  
  // 4. Calculate combat result
  const combatResult = {
    characterRoll: characterResult.total,
    enemyRoll: enemyResult.total,
    winner: characterResult.total > enemyResult.total ? 'character' : 'enemy',
    damage: Math.abs(characterResult.total - enemyResult.total)
  };
  
  // 5. Apply result to combat state
  executeRound(combatResult);
  
  // 6. Hide dice box after delay
  setTimeout(() => {
    CharacterDice.clear();
    OpponentDice.clear();
    document.getElementById('dice-box').style.display = 'none';
  }, 3000);
};
```

---

## Data Flow

### Authentication Flow
```
1. User enters credentials
2. AuthContext.login() calls authApi.login()
3. JWT tokens stored in localStorage
4. User state updated in AuthContext
5. App re-renders with authenticated routes
6. CharacterContext loads available characters
```

### Character Selection Flow
```
1. CharacterPicker displays available characters
2. User selects character
3. CharacterContext.selectCharacter() loads character data
4. Character class instance created with enhanced methods
5. Character data flows to all components via context
6. Selection persisted in localStorage
```

### Habit Completion Flow
```
1. User toggles habit completion checkbox
2. HabitsPage.handleToggleCompletion() called
3. API call to markHabitComplete()
4. Local completion state updated immediately (optimistic update)
5. CharacterContext.refreshCharacter() reloads character data
6. Character attributes recalculated with new habit points
7. UI updates with new attribute levels and dice pools
```

### Combat Flow
```
1. AdventurePage renders combat selection
2. User starts skirmish or quest
3. CombatArea component mounts with character data
4. useCombat hook initializes combat state
5. User selects enemy and starts combat
6. Each round: 3D dice roll → combat calculation → state update
7. Combat ends: XP/loot awarded → character refresh → return to adventure hub
```

---

## API Integration

### API Client Configuration
```javascript
// config/api.js
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 10000,
  retries: 3,
  debugMode: import.meta.env.VITE_DEBUG_MODE === 'true'
};
```

### Authenticated API Client
```javascript
// api/authApi.js
const authClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout
});

// Request interceptor to add auth token
authClient.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
authClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Handle token refresh or logout
    }
    return Promise.reject(error);
  }
);
```

### API Endpoints

#### Authentication
```javascript
// Login
POST /auth/login
Body: { email, password }
Response: { access_token, refresh_token, user }

// Register
POST /auth/register  
Body: { email, password, confirmPassword }
Response: { access_token, refresh_token, user }

// Get current user
GET /auth/me
Headers: { Authorization: "Bearer token" }
Response: { user }
```

#### Characters
```javascript
// Get user's characters
GET /character/user/characters
Response: { status: "success", data: [characters] }

// Get specific character
GET /character/{id}
Response: { status: "success", data: character }

// Create character
POST /character
Body: { name, attributes, image_data }
Response: { status: "success", data: character }
```

#### Habits
```javascript
// Get habits for character and date
GET /habit/character/{character_id}/date/{date}
Response: [{ habit_id, habit_name, attribute, completions: [...] }]

// Mark habit complete/incomplete
PUT /habit/{habit_id}/complete
Body: { date, completed: boolean }
Response: { status: "success" }
```

---

## State Management

### Context Architecture
```javascript
// App-level state management
App
├── AuthProvider (Authentication state)
│   ├── user: User | null
│   ├── isAuthenticated: boolean
│   ├── loading: boolean
│   └── methods: login, register, logout
│
└── CharacterProvider (Character state)
    ├── selectedCharacter: Character | null
    ├── availableCharacters: Character[]
    ├── isCharacterSelected: boolean
    ├── loading: boolean
    └── methods: selectCharacter, refreshCharacter, loadCharacters
```

### Character Context Features
```javascript
const CharacterContext = {
  // Character data
  selectedCharacter,        // Character with temporary HP if in combat
  originalCharacter,        // Character without temporary changes
  characterInstance,        // Access to Character class methods
  availableCharacters,      // All user's characters
  
  // State flags
  loading,                  // API operation in progress
  error,                    // Error message
  isCharacterSelected,      // Boolean flag
  isInCombat,              // Temporary HP is set
  
  // Actions
  selectCharacter(id),      // Load and set active character
  refreshCharacter(),       // Reload current character data
  clearCharacter(),         // Clear selection
  loadCharacters(),         // Load available characters
  
  // Combat support
  updateTemporaryHp(hp),    // Set temporary HP for combat
  clearTemporaryHp(),       // Clear temporary HP
  
  // Utility methods
  getCharacterDicePool(),   // Get combat dice information
  getCharacterSummary()     // Get character overview
};
```

### Local State in Components
```javascript
// Component-level state for UI concerns
const HabitsPage = () => {
  const [viewMode, setViewMode] = useState('daily');        // UI mode
  const [selectedDate, setSelectedDate] = useState(today);   // Selected date
  const [completions, setCompletions] = useState({});        // Completion cache
  const [loading, setLoading] = useState(false);            // Loading state
  
  // Global character state from context
  const { selectedCharacter, refreshCharacter } = useCharacter();
};
```

---

## Component Structure

### Page Components
```javascript
// Top-level route components
├── LoginPage.jsx           // Authentication form
├── RegisterPage.jsx        // Registration form
├── CharacterPage.jsx       // Character management and sheet
├── HabitsPage.jsx         // Habit tracking interface
└── AdventurePage.jsx      // Adventure hub and mode selection
```

### Character Components
```javascript
├── Character/
│   ├── Character.js           // Character class (business logic)
│   ├── CharacterCard.jsx      // Character selection card
│   ├── CharacterSheet.jsx     // Full character sheet display
│   ├── CharacterStatusWithImage.jsx // HP/status with image
│   ├── AttributeDisplay.jsx   // Individual attribute display
│   ├── CharacterImageUpload.jsx // Image upload component
│   └── CharacterPrompt.jsx    // Character creation form
```

### Habit Components
```javascript
├── Habit/
│   ├── HabitForm.jsx         // Create/edit habit form
│   └── HabitModel.jsx        // Habit display card
```

### Adventure Components
```javascript
├── QuestAdventure/
│   └── QuestAdventure.jsx    // Quest-based adventure system
├── CombatArea.jsx            // Main combat interface
├── CombatAreaWithPopUp.jsx   // Combat with result popups
└── dice/
    └── DiceBox.js           // 3D dice configuration
```

### Utility Components
```javascript
├── Common/
│   ├── NavBar.jsx           // Bottom navigation
│   └── Modal.jsx            // Reusable modal component
├── CharacterPicker.jsx      // Character selection screen
└── AttributeModal.jsx       // Attribute detail modal
```

### Component Patterns

#### Context Consumer Pattern
```javascript
const MyComponent = () => {
  const { selectedCharacter, loading, error } = useCharacter();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!selectedCharacter) return <NoCharacterMessage />;
  
  return <ComponentContent character={selectedCharacter} />;
};
```

#### Async Action Pattern
```javascript
const handleAsyncAction = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const result = await apiCall();
    
    // Update local state
    updateLocalState(result);
    
    // Refresh global state if needed
    await refreshCharacter();
    
  } catch (err) {
    console.error('Action failed:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

#### Optimistic Updates Pattern
```javascript
const handleOptimisticAction = async (id, newValue) => {
  // 1. Update UI immediately
  setLocalState(prev => ({ ...prev, [id]: newValue }));
  
  try {
    // 2. Send API request
    await apiCall(id, newValue);
    
    // 3. Refresh authoritative data
    await refreshData();
  } catch (err) {
    // 4. Revert on error
    setLocalState(prev => ({ ...prev, [id]: !newValue }));
    setError('Update failed');
  }
};
```

---

## Summary

The Habits Adventure application successfully combines habit tracking with RPG mechanics through a carefully designed architecture:

1. **Character-Centric Design**: Everything revolves around the character, which serves as the connection between real-world habits and game mechanics.

2. **Context-Driven State**: React contexts manage authentication and character state, providing clean separation of concerns.

3. **Progressive Enhancement**: Features build on each other - habits improve attributes, attributes improve dice pools, dice pools determine combat success.

4. **Real-Time Feedback**: Immediate visual feedback when habits are completed, with attribute bonuses applied instantly.

5. **Engaging Mechanics**: 3D dice rolling, combat scenarios, and adventure modes provide entertainment value that motivates habit completion.

6. **Scalable Architecture**: Clean separation between UI components, business logic, and API integration allows for easy feature expansion.

The application demonstrates how gamification can make habit tracking more engaging while maintaining the core functionality of progress tracking and personal improvement.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Analyze application architecture and components", "status": "completed", "activeForm": "Analyzing application architecture and components"}, {"content": "Examine key React contexts and state management", "status": "completed", "activeForm": "Examining key React contexts and state management"}, {"content": "Study habit tracking and character integration", "status": "completed", "activeForm": "Studying habit tracking and character integration"}, {"content": "Document dice system and combat mechanics", "status": "completed", "activeForm": "Documenting dice system and combat mechanics"}, {"content": "Create comprehensive tutorial document", "status": "completed", "activeForm": "Creating comprehensive tutorial document"}]