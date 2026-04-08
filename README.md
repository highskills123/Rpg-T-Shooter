# Rpg T Shooter

A mobile-friendly, retro arcade-style top-down shooter built with React Native Expo. The game features earthy fantasy UI styling, 5 unlockable weapons, collectible power-ups, escalating enemy waves, and persistent MongoDB-backed high scores.

## Tech Stack

- Frontend: React Native with Expo SDK 54, `expo-router`, `expo-haptics`
- Backend: FastAPI (Python)
- Database: MongoDB for persistent high scores

## Core Features

- Top-down fixed-position shooter with auto-fire and touch-to-move controls
- 5 unlockable weapons: Plasma Blaster, Spread Shot, Laser Beam, Rocket Launcher, Chain Lightning
- Power-ups: Shield, Rapid Fire, Bomb
- Enemy roster: Scout, Fighter, Bomber, Elite, Boss
- Boss fight every 5 levels
- Full play, pause, resume, and game-over overlay flow
- Persistent 3-character high score system
- Haptic feedback on combat, damage, and reward events

## Repo Layout

```text
neon-space-shooter/
├── apps/
│   ├── mobile/   # Expo Router app
│   └── server/   # FastAPI service
├── tests/
├── package.json
└── .env.example
```

## Screens

- `/` main menu with title, play button, high scores, arsenal, and controls
- `/game` active gameplay screen with HUD plus ready, paused, and game-over overlays

## Environment

Create a `.env` file from `.env.example` to configure the API and database:

- `MONGODB_URI`: Mongo connection string for persistent scores
- `MONGODB_DB`: Mongo database name
- `PORT`: leaderboard API port
- `EXPO_PUBLIC_API_URL`: mobile app base URL for the FastAPI backend

If `MONGODB_URI` is not set, the backend falls back to a seeded in-memory scoreboard for local development.

## API Endpoints

- `GET /api/highscores` returns the top 10 scores
- `POST /api/highscores` saves a new score

## Local Setup

1. Install frontend dependencies:

```bash
npm install
```

2. Install backend dependencies:

```bash
python3 -m venv .venv
./.venv/bin/pip install -r apps/server/requirements.txt
```

3. Run the FastAPI backend:

```bash
cd apps/server
../../.venv/bin/uvicorn app.main:app --reload --port 3001
```

4. Run the Expo app:

```bash
cd apps/mobile
npx expo start
```

5. Run tests:

```bash
npm test
```
