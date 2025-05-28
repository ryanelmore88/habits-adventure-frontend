# Habits Adventure Frontend

A Vite + React application to interact with the Habits Adventure backend, display character sheets, track habits & completions, and roll tabletop‑style dice in 3D.

## Features

- Character sheet UI (attributes, bonuses)  
- Habit management per attribute  
- Day & week completion views  
- 3D dice rolling with physics via `@3d-dice/dice-box`  

---

## 📁 Project Structure

```
habits-adventure-frontend/
├── public/                    # Static assets (e.g. dice‑box assets)
│   └── assets/dice-box/
├── src/
│   ├── api/                   # HTTP client (characterApi, habitApi…)
│   ├── components/            # Reusable React components
│   ├── context/               # CharacterContext for global state
│   ├── dice/                  # DiceBox integration & helpers
│   ├── pages/                 # Top‑level route pages
│   ├── styles/                # CSS files
│   └── main.jsx               # App entry
├── .env                       # Vite environment variables
├── index.html
└── package.json
```

---

## 🛠 Prerequisites

- **Node.js v16+**  
- **npm** (or Yarn/Pnpm)  

---

## 🚀 Running Locally

1. **Clone & enter repo**  
   ```bash
   git clone https://github.com/your-username/habits-adventure-frontend.git
   cd habits-adventure-frontend
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```

3. **Copy dice‑box static assets**  
   ```bash
   mkdir -p public/assets/dice-box
   cp -R node_modules/@3d-dice/dice-box/dist/assets/* public/assets/dice-box/
   ```

4. **Configure environment**  
   Create a `.env` in the project root:
   ```properties
   VITE_API_BASE_URL=http://localhost:8000
   ```

5. **Start development server**  
   ```bash
   npm run dev
   ```
   Visit: `http://localhost:5173`

6. **Build for production**  
   ```bash
   npm run build
   ```
   Output in `dist/`.

---

## 🌐 Environment Variables

| Name                    | Description                              |
|-------------------------|------------------------------------------|
| `VITE_API_BASE_URL`     | Base URL of the backend API server       |

---

## 🔗 Useful Links

- [Vite Documentation](https://vitejs.dev/)  
- [React Documentation](https://reactjs.org/)  
- [3D‑Dice Dice‑Box](https://www.npmjs.com/package/@3d-dice/dice-box)  
