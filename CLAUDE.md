# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
- `npm run dev` - Start development server on port 5173
- `npm run build` - Build production bundle
- `npm run lint` - Run ESLint for code quality
- `npm run preview` - Preview production build locally

### Dice Assets Management
- `npm run postinstall` - Copies 3D dice assets to public folder (runs automatically after npm install)
- If dice assets are missing: `cp -R node_modules/@3d-dice/dice-box/dist/assets public/assets/dice-box`

## Architecture Overview

### Technology Stack
- **Frontend**: React 19 with functional components and hooks
- **Build Tool**: Vite for fast development and builds
- **Routing**: React Router DOM v7 with protected routes
- **State Management**: React Context (AuthContext, CharacterContext)
- **Styling**: CSS modules and component-scoped styles
- **3D Dice**: @3d-dice packages for RPG dice functionality
- **HTTP Client**: Axios for API communication

### Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── Auth/            # Authentication components
│   ├── Character/       # Character management components  
│   ├── Habit/           # Habit tracking components
│   └── QuestAdventure/  # Adventure/quest components
├── contexts/            # React Context providers
│   ├── AuthContext.jsx # Authentication state
│   └── CharacterContext.jsx # Character state management
├── pages/               # Route-level page components
├── utils/               # Utility functions (date, combat, dice)
├── config/              # Configuration files
├── styles/              # CSS files
└── main.jsx            # App entry point
```

### Key Patterns

#### API Configuration
- Environment variables use VITE_ prefix (e.g., `VITE_API_BASE_URL`)
- API base URL configured in `src/config.js` and `src/config/api.js`
- Default backend URL: `http://localhost:8000`

#### Authentication Flow
- JWT-based authentication with AuthContext
- Protected routes require authentication
- Login/Register pages for unauthenticated users
- Character selection after authentication

#### Character Management
- Character selection via CharacterPicker component
- Character state managed by CharacterContext
- Character sheet with RPG attributes (D&D-style stats)
- Character images supported via base64 encoding

#### Habit Tracking Integration
- Habits linked to characters for RPG gamification
- Date-based completion tracking
- Streak calculations and rewards system
- Combat engine for habit-based character progression

#### Dice System
- 3D dice rendering using @3d-dice libraries
- Dice assets copied to public/assets/dice-box during build
- Dice notation parsing and pool utilities
- Integration with character actions and combat

## Development Guidelines

### Code Style
- Use functional components with hooks (no class components)
- Follow React naming conventions (PascalCase for components)
- ESLint configuration enforces React hooks rules and best practices
- No unused variables (except those starting with capital letters or underscores)

### State Management
- Use Context for app-wide state (auth, character selection)
- Local state with useState for component-specific data  
- Avoid prop drilling by using appropriate context providers

### Error Handling
- Implement loading states for async operations
- Display user-friendly error messages
- Use try-catch blocks for API calls and error boundaries for components

### API Integration
- Use axios for HTTP requests
- Configure base URLs via environment variables
- Handle authentication tokens in request headers
- Implement proper error handling and retry logic

## Common Development Tasks

### Adding New Pages
1. Create page component in `src/pages/`
2. Add route to `src/App.jsx` Routes configuration
3. Update NavBar component if navigation link needed
4. Follow existing authentication/character selection patterns

### Working with Characters
- Character data flows through CharacterContext
- Use `useCharacter()` hook to access character state
- Character operations should update context state
- Images are base64 encoded strings in character data

### Implementing New API Calls
- Follow patterns in `src/config/api.js`
- Use environment variables for configuration
- Implement proper error handling and loading states
- Update contexts when data changes affect app state

### Styling Guidelines  
- Use component-scoped CSS files
- Follow existing class naming patterns
- Responsive design considerations for mobile usage
- Maintain consistent color scheme and typography

## Environment Configuration

### Required Environment Variables
```
VITE_API_BASE_URL=http://localhost:8000  # Backend API URL
VITE_APP_NAME=Habits Adventure           # Application name
VITE_ENABLE_DICE=true                   # Enable 3D dice features
VITE_DEBUG_MODE=true                    # Development debugging
```

### Development vs Production
- Development uses `.env` file with localhost URLs
- Production uses `.env.production` with deployed API URLs
- Debug mode should be false in production
- API URLs must match deployed backend endpoints

## Key Dependencies

### Core React Ecosystem
- `react` and `react-dom` v19 - Latest React features
- `react-router-dom` v7 - Client-side routing with protected routes

### 3D Dice System
- `@3d-dice/dice-box` - 3D dice rendering engine
- `@3d-dice/dice-parser-interface` - Dice notation parsing
- `@3d-dice/dice-ui` - UI components for dice interactions

### Development Tools
- `vite` - Fast build tool and dev server
- `eslint` - Code quality and React-specific linting
- `vite-plugin-svgr` - SVG imports as React components

## Build and Deployment

### Local Development
- Run `npm install` to install dependencies (includes postinstall script for dice assets)
- Use `npm run dev` for development server with hot reload
- Server runs on `0.0.0.0:5173` (accessible from local network)

### Production Build
- `npm run build` creates optimized bundle in `dist/`
- Build includes dice asset copying and environment variable substitution
- Use `npm run preview` to test production build locally
- Docker support via multi-stage Dockerfile with nginx

### Docker Deployment
- Multi-stage build: Node.js for building, nginx for serving
- Configurable via build args for API URLs
- Health checks included for container orchestration
- Serves on port 80 with SPA routing support