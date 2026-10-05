# CorridorX — Dynamic Emergency Mobility Platform
> **"Clear the road before the ambulance arrives."**

CorridorX is a full-stack, real-time emergency transit mobility operating system engineered to save lives during the critical **Golden Hour**. 

Unlike conventional navigation applications that merely observe traffic congestion, CorridorX creates an **on-demand, automated dynamic green corridor** that preempts upcoming traffic signals and synchronizes roadside Variable Message Signs (VMS) ahead of the ambulance—cutting emergency transit times by **up to 60%**.

---

## 📚 Architectural & Setup Documentation

* 🗺️ [**Google Maps Platform Integration Guide**](file:///C:/Users/shrey/.gemini/antigravity/scratch/corridorx/GOOGLE_MAPS_SETUP.md) — Provisioning, dual-key architecture, Places (New), Routes, and Roads API setup.
* ⚙️ [**Environment Setup Guide**](file:///C:/Users/shrey/.gemini/antigravity/scratch/corridorx/ENVIRONMENT_SETUP.md) — Local development, `.env.example`, ports, and prerequisites.
* 📡 [**Real-Time WebSocket Architecture**](file:///C:/Users/shrey/.gemini/antigravity/scratch/corridorx/REALTIME_ARCHITECTURE.md) — Socket.IO rooms, events, and telemetry schemas.
* 🔌 [**REST API Documentation**](file:///C:/Users/shrey/.gemini/antigravity/scratch/corridorx/API_DOCUMENTATION.md) — Complete endpoint reference with request/response schemas.
* 🚀 [**Production Deployment Guide**](file:///C:/Users/shrey/.gemini/antigravity/scratch/corridorx/DEPLOYMENT.md) — Vercel frontend and Render/Railway backend deployment.
* 🏗️ [**System Architecture & Codebase Audit**](file:///C:/Users/shrey/.gemini/antigravity/scratch/corridorx/CORRIDORX_ARCHITECTURE.md) — Full repository inventory and data flows.

---

## ⚡ Core Platform Capabilities

1. **Dual Operating Modes (Real Mode vs Demo Mode):**
   * **`🔴 REAL MODE`:** Uses real browser/device GPS (`navigator.geolocation.watchPosition()`), Google Maps Platform, Google Routes API (traffic-aware), real hospital search via Google Places (New), and live Socket.IO telemetry streaming.
   * **`⚡ DEMO MODE`:** Replays the real-world Karve Road, Pune emergency corridor simulation with the interactive **Eureka! Judge Control Bar** for pitch demonstrations.
2. **Dual-Engine Mapping Canvas:**
   * **Google Maps Platform:** Powered by `@vis.gl/react-google-maps` with modern `AdvancedMarkerElement` and tactical dark styling.
   * **OpenStreetMap / Leaflet:** Zero-config fallback engine if no Google API key is supplied.
3. **Four Interconnected Operational Portals:**
   * **Consumer / Attendant Portal (`/customer/*`):** 4-step emergency triage, live ride tracking HUD, ETA countdown, and green-wave clearance indicator.
   * **Ambulance Driver CAD Cockpit (`/ambulance`):** Tactical dispatch terminal with trip acceptance, live speedometer, GPS telemetry broadcasting, and hospital arrival confirmation.
   * **Hospital Trauma Bay Dashboard (`/hospital`):** Live incoming casualty manifest with real-time patient vitals, ETA countdown, and capacity management (Emergency Desk, Trauma Bay, ICU Beds, Ventilators).
   * **Rapid QR Emergency Decal Flow (`/qr-emergency/:ambulanceId`):** Zero-app bystander boarding by scanning external vehicle decals.
4. **Dynamic Corridor Preemption Engine:**
   * Configurable distance thresholds (`PREPARING_DISTANCE=500m`, `ACTIVE_DISTANCE=200m`, `PASSED_DISTANCE=50m`).
   * Modular hardware adapters for municipal traffic signal controllers (NTCIP/SCATS) and roadside LED variable message displays (VMS).

---

## 📁 Repository Structure

```text
CorridorX/
├── frontend/                     # React 18 + Vite + Tailwind CSS + Google Maps
│   ├── src/
│   │   ├── components/           # Dual-engine Map, Corridor timeline, Simulation controller
│   │   ├── context/              # EmergencyContext (Real GPS, Telemetry, Socket.IO)
│   │   ├── hooks/                # useLiveLocation (Real device GPS tracking)
│   │   ├── pages/                # Consumer, Driver, Hospital, QR Scan, Login
│   │   └── services/             # googleMaps, googlePlaces, googleRoutes, googleRoads, socketService
│   └── package.json
│
├── backend/                      # Node.js + Express + Socket.IO + Persistent DB
│   ├── src/
│   │   ├── adapters/             # TrafficSignalProvider & RoadsideBoardProvider
│   │   ├── controllers/          # Ambulance, Hospital, Route, Trip, Auth, Board
│   │   ├── db/                   # Persistent JSON/SQLite store with audit logging
│   │   ├── routes/               # Modular Express API endpoints
│   │   ├── services/             # DispatchService, NotificationService, RouteController
│   │   └── socket/               # corridorEngine.js (WebSockets on Port 5000)
│   └── package.json
│
├── .env.example                  # Environment variable reference template
├── GOOGLE_MAPS_SETUP.md          # Google Cloud setup documentation
├── ENVIRONMENT_SETUP.md          # Local developer setup guide
├── REALTIME_ARCHITECTURE.md      # WebSocket rooms & events specification
├── API_DOCUMENTATION.md          # REST API endpoint reference
├── DEPLOYMENT.md                 # Production deployment instructions
├── CORRIDORX_ARCHITECTURE.md     # Codebase audit & data model specification
└── README.md
```

---

## 🚀 Quick Start

### 1. Start Backend Server
```bash
cd backend
npm install
npm run dev
```
*Backend runs on **`http://localhost:5000`** (Health check: `http://localhost:5000/health`).*

### 2. Start Frontend Application
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on **`http://localhost:5173`**.*

---

## 🏥 Testing End-to-End Emergency Flow

1. Open [http://localhost:5173/login](http://localhost:5173/login).
2. Choose **Consumer / Patient** to create an emergency request or view the live ride tracker.
3. Switch to **Ambulance Driver** or open [http://localhost:5173/ambulance](http://localhost:5173/ambulance) to inspect the pilot's tactical CAD cockpit.
4. Open [http://localhost:5173/hospital](http://localhost:5173/hospital) to observe incoming casualties and toggle trauma readiness.
5. Scan an ambulance QR decal via [http://localhost:5173/qr-emergency/AMB-102](http://localhost:5173/qr-emergency/AMB-102).


## CorriodrX 
U can access corriodrX: corridor-x-final.vercel.app
