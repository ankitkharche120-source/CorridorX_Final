# CorridorX — Dynamic Emergency Corridor Network
> **"Clear the road before the ambulance arrives."**

CorridorX is an intelligent emergency mobility and dynamic roadside traffic coordination platform designed to save lives during the critical clinical **Golden Hour (first 60 minutes)**.

Unlike conventional navigation applications that simply show traffic congestion, **CorridorX actively prepares and clears traffic ahead of the ambulance before the vehicle reaches the intersection**.

---

## 📁 Repository Structure

```text
CorridorX/
├── frontend/               # React + Vite + Tailwind CSS + Leaflet Maps
│   ├── src/
│   │   ├── components/     # Ola/Uber ride drawer, Corridor timeline, Simulation controller
│   │   ├── pages/          # Consumer booking, Driver cockpit, Live tracking, QR scan
│   │   ├── context/        # Live corridor simulation engine & state store
│   │   └── data/           # Pre-registered ambulances, hospitals & junction nodes
│   └── package.json
│
├── backend/                # Node.js + Express + Socket.IO API
│   ├── src/
│   │   ├── controllers/    # Ambulances, Hospitals, Trips, Roadside boards
│   │   ├── socket/         # Real-time telemetry & corridor green-wave broadcast
│   │   └── db/             # Persistent storage seeded with Pune corridor data
│   └── package.json
│
├── docs/                   # Software Requirements Specification (SRS)
│   ├── CorridorX_SRS_Document.md
│   └── Backend_Integration_Prompt.md
│
├── push_to_github.bat      # 1-Click auto push script
└── README.md
```

---

## 🚀 Quick Start

### 1. Run Frontend (React App)
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 2. Run Backend (Node.js API & Socket.IO)
```bash
cd backend
npm install
npm start
```
Server runs on **`http://localhost:5000`** with WebSocket on port 5000.

---

## ⚡ Core Features

1. **Only 2 Roles:** 
   - **Consumer / Patient:** Emergency SOS dispatch, live ride tracking, green wave clearance.
   - **Ambulance Driver:** Accept trips, broadcast telemetry, navigate cleared corridor signals.
2. **Pre-Registered Hospitals:** Deenanath Mangeshkar, MAI Mangeshkar, Ruby Hall, Sahyadri, Poona Hospital with real-time ICU bed readiness.
3. **Dynamic Corridor Handover:** Junctions progressively transition through `STANDBY` $\rightarrow$ `PREPARING` $\rightarrow$ `ACTIVE` $\rightarrow$ `PASSED` as the ambulance moves.
4. **Roadside Signage Pre-emption:** Displays alerts to oncoming traffic (e.g., *"AMBULANCE APPROACHING — KEEP RIGHT CLEAR"*).
5. **Zero-App QR Decal Scan:** Bystanders can scan the ambulance's physical QR sticker to book instantly with zero account friction.
