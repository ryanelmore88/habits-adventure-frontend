# Habits Adventure - New Developer Guide & Missing Documentation

## Quick Start for New Developers

### Prerequisites Installation Guide

#### macOS
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python 3.10+
brew install python@3.10

# Install Node.js 16+
brew install node

# Install Docker Desktop
brew install --cask docker
```

#### Windows
```powershell
# Install Python from python.org
# Install Node.js from nodejs.org
# Install Docker Desktop from docker.com

# Verify installations
python --version
node --version
docker --version
```

#### Linux (Ubuntu/Debian)
```bash
# Update package list
sudo apt update

# Install Python 3.10+
sudo apt install python3.10 python3.10-venv python3-pip

# Install Node.js 16+
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
sudo apt-get install docker.io docker-compose
sudo usermod -aG docker $USER
```

---

## Complete Environment Setup

### Backend Environment Variables

Create multiple environment files for different scenarios:

#### `.env` (Default Development)
```bash
# Database Configuration
ENVIRONMENT=development
NEPTUNE_ENDPOINT=localhost
NEPTUNE_PORT=8182
NEPTUNE_USE_SSL=false

# CORS Configuration - NEVER use * in production
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000

# Application Settings
APP_NAME=Habits Adventure Backend
DEBUG=true
LOG_LEVEL=DEBUG
ENABLE_DEBUG_ENDPOINTS=true

# Optional: If using remote development
# NEPTUNE_ENDPOINT=your-dev-neptune.amazonaws.com
# NEPTUNE_USE_SSL=true
```

#### `.env.production` (Production)
```bash
ENVIRONMENT=production
NEPTUNE_ENDPOINT=your-neptune-endpoint.amazonaws.com
NEPTUNE_PORT=8182
NEPTUNE_USE_SSL=true

# Production domains only
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

APP_NAME=Habits Adventure Backend
DEBUG=false
LOG_LEVEL=INFO
ENABLE_DEBUG_ENDPOINTS=false
```

### Frontend Environment Variables

#### `.env` (Default)
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=Habits Adventure

# Feature Flags
VITE_ENABLE_DICE=true
VITE_DEBUG_MODE=true
```

#### `.env.production`
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_NAME=Habits Adventure
VITE_ENABLE_DICE=true
VITE_DEBUG_MODE=false
```

---

## Project Structure Details

### Backend File Responsibilities

```
backend/
├── app/
│   ├── __init__.py          # Makes app a Python package
│   ├── main.py              # FastAPI app initialization, CORS, middleware
│   ├── neptune_client.py    # Database connection singleton
│   │
│   ├── models/              # Business logic layer
│   │   ├── __init__.py
│   │   ├── Attribute.py     # D&D attribute calculations
│   │   ├── character.py     # Character CRUD operations
│   │   ├── habit.py         # Habit management logic
│   │   └── completion.py    # Completion tracking logic
│   │
│   └── routers/             # HTTP endpoints layer
│       ├── __init__.py
│       ├── character.py     # /api/character/* endpoints
│       ├── habit.py         # /api/habit/* endpoints
│       ├── completion.py    # /api/completion/* endpoints
│       └── adventure.py     # /api/adventure/* endpoints
│
├── tests/                   # Test files (to be added)
├── requirements.txt         # Production dependencies
├── requirements-dev.txt     # Development dependencies (to be created)
└── .env                     # Environment variables (git ignored)
```

### Frontend File Organization

```
frontend/
├── src/
│   ├── api/                 # API communication layer
│   │   ├── apiClient.js     # Base API configuration
│   │   ├── characterApi.js  # Character-specific API calls
│   │   └── habitApi.js      # Habit-specific API calls
│   │
│   ├── components/          # Reusable UI components
│   │   ├── Character/       # Character-related components
│   │   │   ├── Character.js         # Character class with game logic
│   │   │   ├── CharacterCard.jsx    # Character display card
│   │   │   ├── CharacterSheet.jsx   # Full character sheet
│   │   │   └── CharacterImageUpload.jsx
│   │   │
│   │   ├── Common/          # Shared components
│   │   │   ├── Modal.jsx
│   │   │   ├── NavBar.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   │
│   │   ├── dice/            # Dice rolling system
│   │   │   └── DiceBox.js   # 3D dice configuration
│   │   │
│   │   └── Habit/           # Habit components
│   │       └── HabitModal.jsx
│   │
│   ├── contexts/            # React Context for state management
│   │   └── CharacterContext.jsx
│   │
│   ├── hooks/               # Custom React hooks
│   │   └── useCombat.js     # Combat logic hook
│   │
│   ├── pages/               # Top-level route components
│   │   ├── AdventurePage.jsx
│   │   ├── CharacterPage.jsx
│   │   └── HabitsPage.jsx
│   │
│   ├── styles/              # CSS files
│   │   ├── App.css          # Global styles
│   │   ├── CharacterPage.css
│   │   ├── HabitsPage.css
│   │   └── CombatArea.css
│   │
│   ├── utils/               # Utility functions
│   │   ├── dateUtils.js     # Date handling functions
│   │   └── combatEngine.js  # Combat calculations
│   │
│   ├── config.js            # App configuration (remove hardcoded IPs!)
│   ├── App.jsx              # Main app component with routing
│   └── main.jsx             # React app entry point
│
├── public/
│   └── assets/dice-box/     # 3D dice assets (copied from node_modules)
│
├── .env                     # Environment variables
├── vite.config.js           # Vite configuration
└── package.json             # Dependencies and scripts
```

---

## Code Patterns & Conventions

### Backend Patterns

#### 1. Router Pattern (FastAPI)
```python
# backend/app/routers/example.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(tags=["example"])

class ExampleRequest(BaseModel):
    field: str
    
@router.post("/api/example")
def create_example(request: ExampleRequest):
    try:
        # Call business logic from models
        result = create_example_in_db(request.field)
        return {"status": "success", "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

#### 2. Model Pattern (Business Logic)
```python
# backend/app/models/example.py
from app.neptune_client import run_query

def create_example_in_db(field: str):
    # Input validation
    if not field or not field.strip():
        raise ValueError("Field cannot be empty")
    
    # Build Gremlin query
    query = f"g.addV('Example').property('field', '{field}')"
    
    # Execute query
    result = run_query(query)
    
    return result
```

#### 3. Gremlin Query Patterns
```python
# Common patterns for graph queries

# Create vertex with properties
f"g.addV('Label').property('id', '{id}').property('name', '{name}')"

# Find vertex by property
f"g.V().hasLabel('Label').has('property', '{value}')"

# Create edge between vertices
f"g.V().has('id', '{from_id}').addE('relationship').to(V().has('id', '{to_id}'))"

# Traverse relationships
f"g.V().has('id', '{id}').out('relationship').valueMap()"
```

### Frontend Patterns

#### 1. API Call Pattern
```javascript
// src/api/exampleApi.js
export const createExample = async (data) => {
    // Input validation
    if (!data.field) {
        throw new Error('Field is required');
    }
    
    try {
        const response = await apiCall('/api/example', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        return response.data;
    } catch (error) {
        handleApiError(error, 'Create example');
    }
};
```

#### 2. React Component Pattern
```jsx
// src/components/Example.jsx
import { useState, useEffect } from 'react';
import { createExample } from '../api/exampleApi';

export default function Example() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const handleSubmit = async (data) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await createExample(data);
            // Handle success
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    
    return (
        <div className="example-component">
            {/* Component content */}
        </div>
    );
}
```

#### 3. Context Hook Pattern
```jsx
// Using the CharacterContext
import { useCharacter } from '../contexts/CharacterContext';

function MyComponent() {
    const { 
        selectedCharacter, 
        refreshCharacter,
        loading,
        error 
    } = useCharacter();
    
    // Use character data
}
```

---

## Common Development Issues & Solutions

### Issue 1: CORS Errors
**Symptom**: "Access to fetch at 'http://localhost:8000' from origin 'http://localhost:5173' has been blocked by CORS policy"

**Solution**:
1. Check backend `.env` file includes your frontend URL in `ALLOWED_ORIGINS`
2. Never use `*` for ALLOWED_ORIGINS
3. Restart the backend server after changing environment variables

### Issue 2: Database Connection Errors
**Symptom**: "Database connection failed" or "ConnectionError"

**Solution**:
```bash
# Check if Gremlin server is running
docker ps

# If not running, start it
docker run -d --name gremlin-server -p 8182:8182 tinkerpop/gremlin-server

# Test connection
docker run -it --rm --link gremlin-server:gremlin-server tinkerpop/gremlin-console
```

### Issue 3: Character Image Upload Fails
**Symptom**: "Image file too large" or "Invalid image data"

**Solution**:
1. Check image size (max 5MB)
2. Ensure image is properly base64 encoded
3. Verify Pillow is installed: `pip install Pillow`

### Issue 4: Habit Completions Not Showing
**Symptom**: Checkboxes not reflecting completion status

**Solution**:
1. Check date format (must be YYYY-MM-DD)
2. Verify timezone handling in `dateUtils.js`
3. Check console for completion map keys
4. Ensure habit IDs match between frontend and backend

### Issue 5: Dice Assets Not Loading
**Symptom**: 3D dice not appearing or console errors about missing assets

**Solution**:
```bash
# Re-copy dice assets
rm -rf public/assets/dice-box
mkdir -p public/assets/dice-box
cp -R node_modules/@3d-dice/dice-box/dist/assets/* public/assets/dice-box/
```

---

## Testing Strategy (Currently Missing)

### Backend Testing Setup

Create `backend/requirements-dev.txt`:
```txt
pytest>=7.0.0
pytest-asyncio>=0.21.0
pytest-cov>=4.0.0
httpx>=0.24.0
```

Create `backend/tests/test_character.py`:
```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_character():
    response = client.post("/api/character", json={
        "name": "Test Hero",
        "strength": 10,
        "dexterity": 10,
        "constitution": 10,
        "intelligence": 10,
        "wisdom": 10,
        "charisma": 10
    })
    assert response.status_code == 200
    assert response.json()["status"] == "success"
```

### Frontend Testing Setup

Add to `package.json`:
```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "vitest": "^1.0.0"
  },
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

---

## Deployment Considerations

### Backend Deployment Checklist
- [ ] Set `ENVIRONMENT=production` in environment
- [ ] Update `NEPTUNE_ENDPOINT` to production database
- [ ] Set `NEPTUNE_USE_SSL=true`
- [ ] Update `ALLOWED_ORIGINS` to production domains only
- [ ] Set `DEBUG=false`
- [ ] Disable debug endpoints
- [ ] Use strong secret keys (when authentication is added)
- [ ] Set up proper logging
- [ ] Configure health checks

### Frontend Deployment Checklist
- [ ] Update `VITE_API_BASE_URL` to production API
- [ ] Set `VITE_DEBUG_MODE=false`
- [ ] Run production build: `npm run build`
- [ ] Test production build locally: `npm run preview`
- [ ] Configure CDN for static assets
- [ ] Set up proper error tracking
- [ ] Configure analytics (if needed)

### Database Migration Strategy
Currently missing - need to implement:
1. Version tracking for graph schema
2. Migration scripts for schema changes
3. Backup procedures before migrations
4. Rollback procedures

---

## Security Considerations (Currently Missing)

### Authentication & Authorization
**Status**: Not implemented yet

Recommended approach:
1. Add JWT authentication to FastAPI
2. Implement user registration/login endpoints
3. Add authentication middleware
4. Update frontend to handle auth tokens
5. Protect character endpoints by user

### Data Validation Improvements
1. Add rate limiting to prevent abuse
2. Implement request size limits
3. Add input sanitization for Gremlin queries
4. Validate image uploads more thoroughly

### Environment Security
1. Never commit `.env` files
2. Use secrets management in production
3. Rotate database credentials regularly
4. Monitor for suspicious activity

---

## Performance Optimization Tips

### Backend Optimizations
1. **Database Queries**:
   - Add indexes on frequently queried properties
   - Use batch operations for multiple updates
   - Implement query result caching

2. **API Response Time**:
   - Add Redis for caching
   - Implement pagination for list endpoints
   - Use async operations where possible

### Frontend Optimizations
1. **Bundle Size**:
   - Lazy load route components
   - Optimize images before upload
   - Use production builds of dependencies

2. **State Management**:
   - Memoize expensive calculations
   - Debounce API calls
   - Implement optimistic updates

---

## Debugging Tools & Techniques

### Backend Debugging

1. **Enable detailed logging**:
```python
# In main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

2. **Use the debug endpoints** (development only):
- `GET /debug/env` - Check environment configuration
- `GET /debug/cors` - Test CORS settings

3. **Gremlin Console for direct queries**:
```bash
docker exec -it gremlin-server /opt/gremlin-server/bin/gremlin.sh
```

### Frontend Debugging

1. **React Developer Tools**: Essential browser extension
2. **Network tab**: Monitor API calls and responses
3. **Console logging**: Already configured when `VITE_DEBUG_MODE=true`
4. **Component state inspection**: Use React DevTools

---

## Contributing Guidelines

### Git Workflow
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes following code patterns
3. Test thoroughly (when tests are implemented)
4. Commit with meaningful messages
5. Push and create pull request

### Code Style
- Python: Follow PEP 8
- JavaScript: Use ESLint configuration
- React: Functional components with hooks
- CSS: Component-scoped styles

### Pull Request Checklist
- [ ] Code follows project patterns
- [ ] No hardcoded values (use environment variables)
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] Documentation updated if needed
- [ ] No console.log statements in production code

---

## Next Steps for the Project

### High Priority
1. **Add Authentication System**
2. **Implement Automated Tests**
3. **Create Database Migration System**
4. **Add Input Sanitization**
5. **Remove Hardcoded IP from config.js**

### Medium Priority
1. **Add Equipment System**
2. **Implement Quest/Adventure System**
3. **Add Character Leveling**
4. **Create Admin Dashboard**
5. **Add Data Export/Import**

### Nice to Have
1. **Mobile App Version**
2. **Social Features**
3. **Achievement System**
4. **Character Marketplace**
5. **API Rate Limiting**

---

## Resources for New Developers

### Learning Resources
- [[FastAPI Documentation](https://fastapi.tiangolo.com/)](https://fastapi.tiangolo.com/)
- [[Gremlin Query Language](https://tinkerpop.apache.org/docs/current/reference/#graph-traversal-steps)](https://tinkerpop.apache.org/docs/current/reference/#graph-traversal-steps)
- [[React Hooks Guide](https://react.dev/reference/react)](https://react.dev/reference/react)
- [[Vite Documentation](https://vitejs.dev/guide/)](https://vitejs.dev/guide/)

### Project-Specific Resources
- Graph database concepts for RPG systems
- D&D 5e attribute system
- Habit tracking best practices
- Gamification principles

### Useful Commands Reference
```bash
# Backend
cd backend
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev

# Database
docker run -d --name gremlin-server -p 8182:8182 tinkerpop/gremlin-server

# Full restart
docker restart gremlin-server
cd backend && uvicorn app.main:app --reload &
cd frontend && npm run dev
```# Habits Adventure - New Developer Guide & Missing Documentation

## Quick Start for New Developers

### Prerequisites Installation Guide

#### macOS
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python 3.10+
brew install python@3.10

# Install Node.js 16+
brew install node

# Install Docker Desktop
brew install --cask docker
```

#### Windows
```powershell
# Install Python from python.org
# Install Node.js from nodejs.org
# Install Docker Desktop from docker.com

# Verify installations
python --version
node --version
docker --version
```

#### Linux (Ubuntu/Debian)
```bash
# Update package list
sudo apt update

# Install Python 3.10+
sudo apt install python3.10 python3.10-venv python3-pip

# Install Node.js 16+
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
sudo apt-get install docker.io docker-compose
sudo usermod -aG docker $USER
```

---

## Complete Environment Setup

### Backend Environment Variables

Create multiple environment files for different scenarios:

#### `.env` (Default Development)
```bash
# Database Configuration
ENVIRONMENT=development
NEPTUNE_ENDPOINT=localhost
NEPTUNE_PORT=8182
NEPTUNE_USE_SSL=false

# CORS Configuration - NEVER use * in production
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000

# Application Settings
APP_NAME=Habits Adventure Backend
DEBUG=true
LOG_LEVEL=DEBUG
ENABLE_DEBUG_ENDPOINTS=true

# Optional: If using remote development
# NEPTUNE_ENDPOINT=your-dev-neptune.amazonaws.com
# NEPTUNE_USE_SSL=true
```

#### `.env.production` (Production)
```bash
ENVIRONMENT=production
NEPTUNE_ENDPOINT=your-neptune-endpoint.amazonaws.com
NEPTUNE_PORT=8182
NEPTUNE_USE_SSL=true

# Production domains only
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

APP_NAME=Habits Adventure Backend
DEBUG=false
LOG_LEVEL=INFO
ENABLE_DEBUG_ENDPOINTS=false
```

### Frontend Environment Variables

#### `.env` (Default)
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=Habits Adventure

# Feature Flags
VITE_ENABLE_DICE=true
VITE_DEBUG_MODE=true
```

#### `.env.production`
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_NAME=Habits Adventure
VITE_ENABLE_DICE=true
VITE_DEBUG_MODE=false
```

---

## Project Structure Details

### Backend File Responsibilities

```
backend/
├── app/
│   ├── __init__.py          # Makes app a Python package
│   ├── main.py              # FastAPI app initialization, CORS, middleware
│   ├── neptune_client.py    # Database connection singleton
│   │
│   ├── models/              # Business logic layer
│   │   ├── __init__.py
│   │   ├── Attribute.py     # D&D attribute calculations
│   │   ├── character.py     # Character CRUD operations
│   │   ├── habit.py         # Habit management logic
│   │   └── completion.py    # Completion tracking logic
│   │
│   └── routers/             # HTTP endpoints layer
│       ├── __init__.py
│       ├── character.py     # /api/character/* endpoints
│       ├── habit.py         # /api/habit/* endpoints
│       ├── completion.py    # /api/completion/* endpoints
│       └── adventure.py     # /api/adventure/* endpoints
│
├── tests/                   # Test files (to be added)
├── requirements.txt         # Production dependencies
├── requirements-dev.txt     # Development dependencies (to be created)
└── .env                     # Environment variables (git ignored)
```

### Frontend File Organization

```
frontend/
├── src/
│   ├── api/                 # API communication layer
│   │   ├── apiClient.js     # Base API configuration
│   │   ├── characterApi.js  # Character-specific API calls
│   │   └── habitApi.js      # Habit-specific API calls
│   │
│   ├── components/          # Reusable UI components
│   │   ├── Character/       # Character-related components
│   │   │   ├── Character.js         # Character class with game logic
│   │   │   ├── CharacterCard.jsx    # Character display card
│   │   │   ├── CharacterSheet.jsx   # Full character sheet
│   │   │   └── CharacterImageUpload.jsx
│   │   │
│   │   ├── Common/          # Shared components
│   │   │   ├── Modal.jsx
│   │   │   ├── NavBar.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   │
│   │   ├── dice/            # Dice rolling system
│   │   │   └── DiceBox.js   # 3D dice configuration
│   │   │
│   │   └── Habit/           # Habit components
│   │       └── HabitModal.jsx
│   │
│   ├── contexts/            # React Context for state management
│   │   └── CharacterContext.jsx
│   │
│   ├── hooks/               # Custom React hooks
│   │   └── useCombat.js     # Combat logic hook
│   │
│   ├── pages/               # Top-level route components
│   │   ├── AdventurePage.jsx
│   │   ├── CharacterPage.jsx
│   │   └── HabitsPage.jsx
│   │
│   ├── styles/              # CSS files
│   │   ├── App.css          # Global styles
│   │   ├── CharacterPage.css
│   │   ├── HabitsPage.css
│   │   └── CombatArea.css
│   │
│   ├── utils/               # Utility functions
│   │   ├── dateUtils.js     # Date handling functions
│   │   └── combatEngine.js  # Combat calculations
│   │
│   ├── config.js            # App configuration (remove hardcoded IPs!)
│   ├── App.jsx              # Main app component with routing
│   └── main.jsx             # React app entry point
│
├── public/
│   └── assets/dice-box/     # 3D dice assets (copied from node_modules)
│
├── .env                     # Environment variables
├── vite.config.js           # Vite configuration
└── package.json             # Dependencies and scripts
```

---

## Code Patterns & Conventions

### Backend Patterns

#### 1. Router Pattern (FastAPI)
```python
# backend/app/routers/example.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(tags=["example"])

class ExampleRequest(BaseModel):
    field: str
    
@router.post("/api/example")
def create_example(request: ExampleRequest):
    try:
        # Call business logic from models
        result = create_example_in_db(request.field)
        return {"status": "success", "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

#### 2. Model Pattern (Business Logic)
```python
# backend/app/models/example.py
from app.neptune_client import run_query

def create_example_in_db(field: str):
    # Input validation
    if not field or not field.strip():
        raise ValueError("Field cannot be empty")
    
    # Build Gremlin query
    query = f"g.addV('Example').property('field', '{field}')"
    
    # Execute query
    result = run_query(query)
    
    return result
```

#### 3. Gremlin Query Patterns
```python
# Common patterns for graph queries

# Create vertex with properties
f"g.addV('Label').property('id', '{id}').property('name', '{name}')"

# Find vertex by property
f"g.V().hasLabel('Label').has('property', '{value}')"

# Create edge between vertices
f"g.V().has('id', '{from_id}').addE('relationship').to(V().has('id', '{to_id}'))"

# Traverse relationships
f"g.V().has('id', '{id}').out('relationship').valueMap()"
```

### Frontend Patterns

#### 1. API Call Pattern
```javascript
// src/api/exampleApi.js
export const createExample = async (data) => {
    // Input validation
    if (!data.field) {
        throw new Error('Field is required');
    }
    
    try {
        const response = await apiCall('/api/example', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        return response.data;
    } catch (error) {
        handleApiError(error, 'Create example');
    }
};
```

#### 2. React Component Pattern
```jsx
// src/components/Example.jsx
import { useState, useEffect } from 'react';
import { createExample } from '../api/exampleApi';

export default function Example() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const handleSubmit = async (data) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await createExample(data);
            // Handle success
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    
    return (
        <div className="example-component">
            {/* Component content */}
        </div>
    );
}
```

#### 3. Context Hook Pattern
```jsx
// Using the CharacterContext
import { useCharacter } from '../contexts/CharacterContext';

function MyComponent() {
    const { 
        selectedCharacter, 
        refreshCharacter,
        loading,
        error 
    } = useCharacter();
    
    // Use character data
}
```

---

## Common Development Issues & Solutions

### Issue 1: CORS Errors
**Symptom**: "Access to fetch at 'http://localhost:8000' from origin 'http://localhost:5173' has been blocked by CORS policy"

**Solution**:
1. Check backend `.env` file includes your frontend URL in `ALLOWED_ORIGINS`
2. Never use `*` for ALLOWED_ORIGINS
3. Restart the backend server after changing environment variables

### Issue 2: Database Connection Errors
**Symptom**: "Database connection failed" or "ConnectionError"

**Solution**:
```bash
# Check if Gremlin server is running
docker ps

# If not running, start it
docker run -d --name gremlin-server -p 8182:8182 tinkerpop/gremlin-server

# Test connection
docker run -it --rm --link gremlin-server:gremlin-server tinkerpop/gremlin-console
```

### Issue 3: Character Image Upload Fails
**Symptom**: "Image file too large" or "Invalid image data"

**Solution**:
1. Check image size (max 5MB)
2. Ensure image is properly base64 encoded
3. Verify Pillow is installed: `pip install Pillow`

### Issue 4: Habit Completions Not Showing
**Symptom**: Checkboxes not reflecting completion status

**Solution**:
1. Check date format (must be YYYY-MM-DD)
2. Verify timezone handling in `dateUtils.js`
3. Check console for completion map keys
4. Ensure habit IDs match between frontend and backend

### Issue 5: Dice Assets Not Loading
**Symptom**: 3D dice not appearing or console errors about missing assets

**Solution**:
```bash
# Re-copy dice assets
rm -rf public/assets/dice-box
mkdir -p public/assets/dice-box
cp -R node_modules/@3d-dice/dice-box/dist/assets/* public/assets/dice-box/
```

---

## Testing Strategy (Currently Missing)

### Backend Testing Setup

Create `backend/requirements-dev.txt`:
```txt
pytest>=7.0.0
pytest-asyncio>=0.21.0
pytest-cov>=4.0.0
httpx>=0.24.0
```

Create `backend/tests/test_character.py`:
```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_character():
    response = client.post("/api/character", json={
        "name": "Test Hero",
        "strength": 10,
        "dexterity": 10,
        "constitution": 10,
        "intelligence": 10,
        "wisdom": 10,
        "charisma": 10
    })
    assert response.status_code == 200
    assert response.json()["status"] == "success"
```

### Frontend Testing Setup

Add to `package.json`:
```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "vitest": "^1.0.0"
  },
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

---

## Deployment Considerations

### Backend Deployment Checklist
- [ ] Set `ENVIRONMENT=production` in environment
- [ ] Update `NEPTUNE_ENDPOINT` to production database
- [ ] Set `NEPTUNE_USE_SSL=true`
- [ ] Update `ALLOWED_ORIGINS` to production domains only
- [ ] Set `DEBUG=false`
- [ ] Disable debug endpoints
- [ ] Use strong secret keys (when authentication is added)
- [ ] Set up proper logging
- [ ] Configure health checks

### Frontend Deployment Checklist
- [ ] Update `VITE_API_BASE_URL` to production API
- [ ] Set `VITE_DEBUG_MODE=false`
- [ ] Run production build: `npm run build`
- [ ] Test production build locally: `npm run preview`
- [ ] Configure CDN for static assets
- [ ] Set up proper error tracking
- [ ] Configure analytics (if needed)

### Database Migration Strategy
Currently missing - need to implement:
1. Version tracking for graph schema
2. Migration scripts for schema changes
3. Backup procedures before migrations
4. Rollback procedures

---

## Security Considerations (Currently Missing)

### Authentication & Authorization
**Status**: Not implemented yet

Recommended approach:
1. Add JWT authentication to FastAPI
2. Implement user registration/login endpoints
3. Add authentication middleware
4. Update frontend to handle auth tokens
5. Protect character endpoints by user

### Data Validation Improvements
1. Add rate limiting to prevent abuse
2. Implement request size limits
3. Add input sanitization for Gremlin queries
4. Validate image uploads more thoroughly

### Environment Security
1. Never commit `.env` files
2. Use secrets management in production
3. Rotate database credentials regularly
4. Monitor for suspicious activity

---

## Performance Optimization Tips

### Backend Optimizations
1. **Database Queries**:
   - Add indexes on frequently queried properties
   - Use batch operations for multiple updates
   - Implement query result caching

2. **API Response Time**:
   - Add Redis for caching
   - Implement pagination for list endpoints
   - Use async operations where possible

### Frontend Optimizations
1. **Bundle Size**:
   - Lazy load route components
   - Optimize images before upload
   - Use production builds of dependencies

2. **State Management**:
   - Memoize expensive calculations
   - Debounce API calls
   - Implement optimistic updates

---

## Debugging Tools & Techniques

### Backend Debugging

1. **Enable detailed logging**:
```python
# In main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

2. **Use the debug endpoints** (development only):
- `GET /debug/env` - Check environment configuration
- `GET /debug/cors` - Test CORS settings

3. **Gremlin Console for direct queries**:
```bash
docker exec -it gremlin-server /opt/gremlin-server/bin/gremlin.sh
```

### Frontend Debugging

1. **React Developer Tools**: Essential browser extension
2. **Network tab**: Monitor API calls and responses
3. **Console logging**: Already configured when `VITE_DEBUG_MODE=true`
4. **Component state inspection**: Use React DevTools

---

## Contributing Guidelines

### Git Workflow
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes following code patterns
3. Test thoroughly (when tests are implemented)
4. Commit with meaningful messages
5. Push and create pull request

### Code Style
- Python: Follow PEP 8
- JavaScript: Use ESLint configuration
- React: Functional components with hooks
- CSS: Component-scoped styles

### Pull Request Checklist
- [ ] Code follows project patterns
- [ ] No hardcoded values (use environment variables)
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] Documentation updated if needed
- [ ] No console.log statements in production code

---

## Next Steps for the Project

### High Priority
1. **Add Authentication System**
2. **Implement Automated Tests**
3. **Create Database Migration System**
4. **Add Input Sanitization**
5. **Remove Hardcoded IP from config.js**

### Medium Priority
1. **Add Equipment System**
2. **Implement Quest/Adventure System**
3. **Add Character Leveling**
4. **Create Admin Dashboard**
5. **Add Data Export/Import**

### Nice to Have
1. **Mobile App Version**
2. **Social Features**
3. **Achievement System**
4. **Character Marketplace**
5. **API Rate Limiting**

---

## Resources for New Developers

### Learning Resources
- [[FastAPI Documentation](https://fastapi.tiangolo.com/)](https://fastapi.tiangolo.com/)
- [[Gremlin Query Language](https://tinkerpop.apache.org/docs/current/reference/#graph-traversal-steps)](https://tinkerpop.apache.org/docs/current/reference/#graph-traversal-steps)
- [[React Hooks Guide](https://react.dev/reference/react)](https://react.dev/reference/react)
- [[Vite Documentation](https://vitejs.dev/guide/)](https://vitejs.dev/guide/)

### Project-Specific Resources
- Graph database concepts for RPG systems
- D&D 5e attribute system
- Habit tracking best practices
- Gamification principles

### Useful Commands Reference
```bash
# Backend
cd backend
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev

# Database
docker run -d --name gremlin-server -p 8182:8182 tinkerpop/gremlin-server

# Full restart
docker restart gremlin-server
cd backend && uvicorn app.main:app --reload &
cd frontend && npm run dev
```# Habits Adventure - New Developer Guide & Missing Documentation

## Quick Start for New Developers

### Prerequisites Installation Guide

#### macOS
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python 3.10+
brew install python@3.10

# Install Node.js 16+
brew install node

# Install Docker Desktop
brew install --cask docker
```

#### Windows
```powershell
# Install Python from python.org
# Install Node.js from nodejs.org
# Install Docker Desktop from docker.com

# Verify installations
python --version
node --version
docker --version
```

#### Linux (Ubuntu/Debian)
```bash
# Update package list
sudo apt update

# Install Python 3.10+
sudo apt install python3.10 python3.10-venv python3-pip

# Install Node.js 16+
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
sudo apt-get install docker.io docker-compose
sudo usermod -aG docker $USER
```

---

## Complete Environment Setup

### Backend Environment Variables

Create multiple environment files for different scenarios:

#### `.env` (Default Development)
```bash
# Database Configuration
ENVIRONMENT=development
NEPTUNE_ENDPOINT=localhost
NEPTUNE_PORT=8182
NEPTUNE_USE_SSL=false

# CORS Configuration - NEVER use * in production
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000

# Application Settings
APP_NAME=Habits Adventure Backend
DEBUG=true
LOG_LEVEL=DEBUG
ENABLE_DEBUG_ENDPOINTS=true

# Optional: If using remote development
# NEPTUNE_ENDPOINT=your-dev-neptune.amazonaws.com
# NEPTUNE_USE_SSL=true
```

#### `.env.production` (Production)
```bash
ENVIRONMENT=production
NEPTUNE_ENDPOINT=your-neptune-endpoint.amazonaws.com
NEPTUNE_PORT=8182
NEPTUNE_USE_SSL=true

# Production domains only
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

APP_NAME=Habits Adventure Backend
DEBUG=false
LOG_LEVEL=INFO
ENABLE_DEBUG_ENDPOINTS=false
```

### Frontend Environment Variables

#### `.env` (Default)
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=Habits Adventure

# Feature Flags
VITE_ENABLE_DICE=true
VITE_DEBUG_MODE=true
```

#### `.env.production`
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_NAME=Habits Adventure
VITE_ENABLE_DICE=true
VITE_DEBUG_MODE=false
```

---

## Project Structure Details

### Backend File Responsibilities

```
backend/
├── app/
│   ├── __init__.py          # Makes app a Python package
│   ├── main.py              # FastAPI app initialization, CORS, middleware
│   ├── neptune_client.py    # Database connection singleton
│   │
│   ├── models/              # Business logic layer
│   │   ├── __init__.py
│   │   ├── Attribute.py     # D&D attribute calculations
│   │   ├── character.py     # Character CRUD operations
│   │   ├── habit.py         # Habit management logic
│   │   └── completion.py    # Completion tracking logic
│   │
│   └── routers/             # HTTP endpoints layer
│       ├── __init__.py
│       ├── character.py     # /api/character/* endpoints
│       ├── habit.py         # /api/habit/* endpoints
│       ├── completion.py    # /api/completion/* endpoints
│       └── adventure.py     # /api/adventure/* endpoints
│
├── tests/                   # Test files (to be added)
├── requirements.txt         # Production dependencies
├── requirements-dev.txt     # Development dependencies (to be created)
└── .env                     # Environment variables (git ignored)
```

### Frontend File Organization

```
frontend/
├── src/
│   ├── api/                 # API communication layer
│   │   ├── apiClient.js     # Base API configuration
│   │   ├── characterApi.js  # Character-specific API calls
│   │   └── habitApi.js      # Habit-specific API calls
│   │
│   ├── components/          # Reusable UI components
│   │   ├── Character/       # Character-related components
│   │   │   ├── Character.js         # Character class with game logic
│   │   │   ├── CharacterCard.jsx    # Character display card
│   │   │   ├── CharacterSheet.jsx   # Full character sheet
│   │   │   └── CharacterImageUpload.jsx
│   │   │
│   │   ├── Common/          # Shared components
│   │   │   ├── Modal.jsx
│   │   │   ├── NavBar.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   │
│   │   ├── dice/            # Dice rolling system
│   │   │   └── DiceBox.js   # 3D dice configuration
│   │   │
│   │   └── Habit/           # Habit components
│   │       └── HabitModal.jsx
│   │
│   ├── contexts/            # React Context for state management
│   │   └── CharacterContext.jsx
│   │
│   ├── hooks/               # Custom React hooks
│   │   └── useCombat.js     # Combat logic hook
│   │
│   ├── pages/               # Top-level route components
│   │   ├── AdventurePage.jsx
│   │   ├── CharacterPage.jsx
│   │   └── HabitsPage.jsx
│   │
│   ├── styles/              # CSS files
│   │   ├── App.css          # Global styles
│   │   ├── CharacterPage.css
│   │   ├── HabitsPage.css
│   │   └── CombatArea.css
│   │
│   ├── utils/               # Utility functions
│   │   ├── dateUtils.js     # Date handling functions
│   │   └── combatEngine.js  # Combat calculations
│   │
│   ├── config.js            # App configuration (remove hardcoded IPs!)
│   ├── App.jsx              # Main app component with routing
│   └── main.jsx             # React app entry point
│
├── public/
│   └── assets/dice-box/     # 3D dice assets (copied from node_modules)
│
├── .env                     # Environment variables
├── vite.config.js           # Vite configuration
└── package.json             # Dependencies and scripts
```

---

## Code Patterns & Conventions

### Backend Patterns

#### 1. Router Pattern (FastAPI)
```python
# backend/app/routers/example.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(tags=["example"])

class ExampleRequest(BaseModel):
    field: str
    
@router.post("/api/example")
def create_example(request: ExampleRequest):
    try:
        # Call business logic from models
        result = create_example_in_db(request.field)
        return {"status": "success", "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

#### 2. Model Pattern (Business Logic)
```python
# backend/app/models/example.py
from app.neptune_client import run_query

def create_example_in_db(field: str):
    # Input validation
    if not field or not field.strip():
        raise ValueError("Field cannot be empty")
    
    # Build Gremlin query
    query = f"g.addV('Example').property('field', '{field}')"
    
    # Execute query
    result = run_query(query)
    
    return result
```

#### 3. Gremlin Query Patterns
```python
# Common patterns for graph queries

# Create vertex with properties
f"g.addV('Label').property('id', '{id}').property('name', '{name}')"

# Find vertex by property
f"g.V().hasLabel('Label').has('property', '{value}')"

# Create edge between vertices
f"g.V().has('id', '{from_id}').addE('relationship').to(V().has('id', '{to_id}'))"

# Traverse relationships
f"g.V().has('id', '{id}').out('relationship').valueMap()"
```

### Frontend Patterns

#### 1. API Call Pattern
```javascript
// src/api/exampleApi.js
export const createExample = async (data) => {
    // Input validation
    if (!data.field) {
        throw new Error('Field is required');
    }
    
    try {
        const response = await apiCall('/api/example', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        return response.data;
    } catch (error) {
        handleApiError(error, 'Create example');
    }
};
```

#### 2. React Component Pattern
```jsx
// src/components/Example.jsx
import { useState, useEffect } from 'react';
import { createExample } from '../api/exampleApi';

export default function Example() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const handleSubmit = async (data) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await createExample(data);
            // Handle success
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    
    return (
        <div className="example-component">
            {/* Component content */}
        </div>
    );
}
```

#### 3. Context Hook Pattern
```jsx
// Using the CharacterContext
import { useCharacter } from '../contexts/CharacterContext';

function MyComponent() {
    const { 
        selectedCharacter, 
        refreshCharacter,
        loading,
        error 
    } = useCharacter();
    
    // Use character data
}
```

---

## Common Development Issues & Solutions

### Issue 1: CORS Errors
**Symptom**: "Access to fetch at 'http://localhost:8000' from origin 'http://localhost:5173' has been blocked by CORS policy"

**Solution**:
1. Check backend `.env` file includes your frontend URL in `ALLOWED_ORIGINS`
2. Never use `*` for ALLOWED_ORIGINS
3. Restart the backend server after changing environment variables

### Issue 2: Database Connection Errors
**Symptom**: "Database connection failed" or "ConnectionError"

**Solution**:
```bash
# Check if Gremlin server is running
docker ps

# If not running, start it
docker run -d --name gremlin-server -p 8182:8182 tinkerpop/gremlin-server

# Test connection
docker run -it --rm --link gremlin-server:gremlin-server tinkerpop/gremlin-console
```

### Issue 3: Character Image Upload Fails
**Symptom**: "Image file too large" or "Invalid image data"

**Solution**:
1. Check image size (max 5MB)
2. Ensure image is properly base64 encoded
3. Verify Pillow is installed: `pip install Pillow`

### Issue 4: Habit Completions Not Showing
**Symptom**: Checkboxes not reflecting completion status

**Solution**:
1. Check date format (must be YYYY-MM-DD)
2. Verify timezone handling in `dateUtils.js`
3. Check console for completion map keys
4. Ensure habit IDs match between frontend and backend

### Issue 5: Dice Assets Not Loading
**Symptom**: 3D dice not appearing or console errors about missing assets

**Solution**:
```bash
# Re-copy dice assets
rm -rf public/assets/dice-box
mkdir -p public/assets/dice-box
cp -R node_modules/@3d-dice/dice-box/dist/assets/* public/assets/dice-box/
```

---

## Testing Strategy (Currently Missing)

### Backend Testing Setup

Create `backend/requirements-dev.txt`:
```txt
pytest>=7.0.0
pytest-asyncio>=0.21.0
pytest-cov>=4.0.0
httpx>=0.24.0
```

Create `backend/tests/test_character.py`:
```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_character():
    response = client.post("/api/character", json={
        "name": "Test Hero",
        "strength": 10,
        "dexterity": 10,
        "constitution": 10,
        "intelligence": 10,
        "wisdom": 10,
        "charisma": 10
    })
    assert response.status_code == 200
    assert response.json()["status"] == "success"
```

### Frontend Testing Setup

Add to `package.json`:
```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "vitest": "^1.0.0"
  },
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

---

## Deployment Considerations

### Backend Deployment Checklist
- [ ] Set `ENVIRONMENT=production` in environment
- [ ] Update `NEPTUNE_ENDPOINT` to production database
- [ ] Set `NEPTUNE_USE_SSL=true`
- [ ] Update `ALLOWED_ORIGINS` to production domains only
- [ ] Set `DEBUG=false`
- [ ] Disable debug endpoints
- [ ] Use strong secret keys (when authentication is added)
- [ ] Set up proper logging
- [ ] Configure health checks

### Frontend Deployment Checklist
- [ ] Update `VITE_API_BASE_URL` to production API
- [ ] Set `VITE_DEBUG_MODE=false`
- [ ] Run production build: `npm run build`
- [ ] Test production build locally: `npm run preview`
- [ ] Configure CDN for static assets
- [ ] Set up proper error tracking
- [ ] Configure analytics (if needed)

### Database Migration Strategy
Currently missing - need to implement:
1. Version tracking for graph schema
2. Migration scripts for schema changes
3. Backup procedures before migrations
4. Rollback procedures

---

## Security Considerations (Currently Missing)

### Authentication & Authorization
**Status**: Not implemented yet

Recommended approach:
1. Add JWT authentication to FastAPI
2. Implement user registration/login endpoints
3. Add authentication middleware
4. Update frontend to handle auth tokens
5. Protect character endpoints by user

### Data Validation Improvements
1. Add rate limiting to prevent abuse
2. Implement request size limits
3. Add input sanitization for Gremlin queries
4. Validate image uploads more thoroughly

### Environment Security
1. Never commit `.env` files
2. Use secrets management in production
3. Rotate database credentials regularly
4. Monitor for suspicious activity

---

## Performance Optimization Tips

### Backend Optimizations
1. **Database Queries**:
   - Add indexes on frequently queried properties
   - Use batch operations for multiple updates
   - Implement query result caching

2. **API Response Time**:
   - Add Redis for caching
   - Implement pagination for list endpoints
   - Use async operations where possible

### Frontend Optimizations
1. **Bundle Size**:
   - Lazy load route components
   - Optimize images before upload
   - Use production builds of dependencies

2. **State Management**:
   - Memoize expensive calculations
   - Debounce API calls
   - Implement optimistic updates

---

## Debugging Tools & Techniques

### Backend Debugging

1. **Enable detailed logging**:
```python
# In main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

2. **Use the debug endpoints** (development only):
- `GET /debug/env` - Check environment configuration
- `GET /debug/cors` - Test CORS settings

3. **Gremlin Console for direct queries**:
```bash
docker exec -it gremlin-server /opt/gremlin-server/bin/gremlin.sh
```

### Frontend Debugging

1. **React Developer Tools**: Essential browser extension
2. **Network tab**: Monitor API calls and responses
3. **Console logging**: Already configured when `VITE_DEBUG_MODE=true`
4. **Component state inspection**: Use React DevTools

---

## Contributing Guidelines

### Git Workflow
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes following code patterns
3. Test thoroughly (when tests are implemented)
4. Commit with meaningful messages
5. Push and create pull request

### Code Style
- Python: Follow PEP 8
- JavaScript: Use ESLint configuration
- React: Functional components with hooks
- CSS: Component-scoped styles

### Pull Request Checklist
- [ ] Code follows project patterns
- [ ] No hardcoded values (use environment variables)
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] Documentation updated if needed
- [ ] No console.log statements in production code

---

## Next Steps for the Project

### High Priority
1. **Add Authentication System**
2. **Implement Automated Tests**
3. **Create Database Migration System**
4. **Add Input Sanitization**
5. **Remove Hardcoded IP from config.js**

### Medium Priority
1. **Add Equipment System**
2. **Implement Quest/Adventure System**
3. **Add Character Leveling**
4. **Create Admin Dashboard**
5. **Add Data Export/Import**

### Nice to Have
1. **Mobile App Version**
2. **Social Features**
3. **Achievement System**
4. **Character Marketplace**
5. **API Rate Limiting**

---

## Resources for New Developers

### Learning Resources
- [[FastAPI Documentation](https://fastapi.tiangolo.com/)](https://fastapi.tiangolo.com/)
- [[Gremlin Query Language](https://tinkerpop.apache.org/docs/current/reference/#graph-traversal-steps)](https://tinkerpop.apache.org/docs/current/reference/#graph-traversal-steps)
- [[React Hooks Guide](https://react.dev/reference/react)](https://react.dev/reference/react)
- [[Vite Documentation](https://vitejs.dev/guide/)](https://vitejs.dev/guide/)

### Project-Specific Resources
- Graph database concepts for RPG systems
- D&D 5e attribute system
- Habit tracking best practices
- Gamification principles

### Useful Commands Reference
```bash
# Backend
cd backend
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev

# Database
docker run -d --name gremlin-server -p 8182:8182 tinkerpop/gremlin-server

# Full restart
docker restart gremlin-server
cd backend && uvicorn app.main:app --reload &
cd frontend && npm run dev
```