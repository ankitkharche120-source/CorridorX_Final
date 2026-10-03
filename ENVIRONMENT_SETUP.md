# CorridorX — Environment Setup & Local Development Guide

This guide walks you through setting up and running the full CorridorX real-time emergency transit mobility platform on your local machine.

---

## 1. Prerequisites

* **Node.js:** v18.0.0 or higher (v20+ recommended)
* **npm:** v9.0.0 or higher
* **Git:** Installed and configured in PATH
* **Browser:** Chrome, Edge, Brave, or Firefox with HTML5 Geolocation permission support

---

## 2. Quickstart (Under 2 Minutes)

### Step 1: Clone & Inspect Repository
```bash
git clone https://github.com/ankitkharche120-source/CorridorX.git
cd CorridorX
```

### Step 2: Configure Environment Variables
Copy `.env.example` into `backend/.env` and `frontend/.env`:
```bash
# In backend/
cp .env.example backend/.env

# In frontend/
cp .env.example frontend/.env
```

### Step 3: Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 4: Run the Development Servers
Open two terminal windows:

* **Terminal 1 (Backend API & Socket.IO Telemetry Engine on Port 5000):**
  ```bash
  cd backend
  npm run dev
  ```
  *Output confirms:*
  ```
  🚑 CorridorX Emergency Backend running on port 5000
  📡 WebSocket Engine active for real-time telemetry
  🌐 CORS enabled for: http://localhost:5173
  🏥 Health Check: http://localhost:5000/api/health
  ```

* **Terminal 2 (Frontend Client on Port 5173):**
  ```bash
  cd frontend
  npm run dev
  ```
  *Open your browser at:* [http://localhost:5173](http://localhost:5173)

---

## 3. Environment Variables Reference

| Variable | Required? | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `PORT` | Yes | `5000` | Port for Express REST API & Socket.IO server |
| `CLIENT_URL` | Yes | `http://localhost:5173` | Allowed CORS origin for browser client |
| `JWT_SECRET` | Yes | `corridorx_super_secret_jwt_key_2026_eureka` | Secret string for signing auth tokens |
| `DATABASE_URL` | Yes | `./data/database.json` | Path to persistent database file (SQLite / JSON) |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional | `AIzaSy...` | Client Maps JavaScript API key |
| `GOOGLE_ROUTES_API_KEY` | Optional | `AIzaSy...` | Server Routes API key for traffic-aware routing |
| `GOOGLE_PLACES_API_KEY` | Optional | `AIzaSy...` | Server Places API (New) key for hospital discovery |
| `GOOGLE_ROADS_API_KEY` | Optional | `AIzaSy...` | Server Roads API key for GPS road snapping |
| `WHATSAPP_ACCESS_TOKEN` | Optional | `EAA...` | Meta Graph API token for automated WhatsApp alerts |
| `PREPARING_DISTANCE` | Optional | `500` | Distance in meters to set corridor node to `PREPARING` |
| `ACTIVE_DISTANCE` | Optional | `200` | Distance in meters to set corridor node to `ACTIVE` (Green Wave) |
| `PASSED_DISTANCE` | Optional | `50` | Distance in meters to restore normal traffic cycle |

---

## 4. Operational Modes (Real vs Demo)

* **REAL MODE (`🔴 LIVE GPS ACTIVE`):**
  * Tracks live client GPS using `navigator.geolocation.watchPosition()`.
  * Streams real ambulance coordinates via Socket.IO to central server.
  * Dispatches real units from database.
  * Dynamically queries real hospitals via Google Places API (New).
  * Calculates real-time distance and ETA via Google Routes API.
* **DEMO MODE (`⚡ SIMULATION MODE`):**
  * Replays the high-density Karve Road, Pune emergency transit scenario (Kothrud Stand -> Nal Stop Flyover -> Mhatre Bridge -> Deenanath Mangeshkar Hospital Trauma Bay).
  * Features the **Eureka! Judge Control Bar** for play/pause, step forward, and speed multiplier control (1x to 4x).
  * Works 100% offline without external APIs or live GPS.
