# CorridorX Backend — Emergency Green Corridor Engine

Production-ready Node.js & Express API with real-time Socket.IO synchronization for **CorridorX: Dynamic Emergency Corridor Network**.

---

## 1. Quick Start

### Prerequisites
* Node.js v18+ or v20+

### Installation & Run
```bash
# Navigate to backend directory
cd C:\Users\shrey\.gemini\antigravity\scratch\corridorx\backend

# Install dependencies (Express, Socket.IO, JWT, bcryptjs, CORS)
npm install

# Start production server
npm start

# Or start in watch mode
npm run dev
```

The server will initialize the SQLite/JSON database at `./data/database.json` and start listening on port `5000`:
* Base API URL: `http://localhost:5000`
* Health Check: `http://localhost:5000/api/health`
* WebSocket: `ws://localhost:5000`

---

## 2. API Endpoints Reference

### Authentication (`/api/auth`)
* `POST /api/auth/register` — Register User (`name`, `phone`, `email`, `password`, `role: 'CUSTOMER' | 'AMBULANCE' | 'HOSPITAL' | 'ADMIN'`)
* `POST /api/auth/login` — Sign in with phone/email and password $\rightarrow$ returns JWT Token + Profile
* `GET /api/auth/me` — Get authenticated user details (Requires `Authorization: Bearer <token>`)

### Emergency Ambulance Fleet (`/api/ambulances`)
* `GET /api/ambulances/nearby?lat=18.5074&lng=73.8065&radius=15` — Find nearest ambulances sorted by distance and ETA
* `GET /api/ambulances/:id` — Get single ambulance specs, equipment list, and driver details
* `PATCH /api/ambulances/:id/status` — Update vehicle availability status and live GPS

### Hospitals & Trauma Bays (`/api/hospitals`)
* `GET /api/hospitals?lat=18.5074&lng=73.8065` — List hospitals with distance, ETA, ICU beds open, and trauma specialties
* `GET /api/hospitals/:id` — Get hospital emergency department profile
* `PATCH /api/hospitals/:id/beds` — Update ICU bed count or readiness status

### Emergency Trips & Corridors (`/api/trips`)
* `POST /api/trips/request` — Create emergency SOS request (`patient_name`, `contact`, `emergency_type`, `pickup_address`, `pickup_lat`, `pickup_lng`, `notes`)
* `POST /api/trips/:id/select-ambulance` — Assign ambulance unit to trip
* `POST /api/trips/:id/select-hospital` — Select hospital (can be called immediately or en route)
* `GET /api/trips/:id/corridor` — Fetch live corridor junction nodes and digital board statuses
* `POST /api/trips/qr-session` — Metro QR scan on ambulance decal for instant zero-registration booking
* `GET /api/trips/active` — List all active emergency trips for Municipal Command Center
* `GET /api/trips/:id` — Get trip details
* `PATCH /api/trips/:id/status` — Update trip status (`EN_ROUTE`, `ARRIVED`, `COMPLETED`)

### Roadside Digital Boards (`/api/boards`)
* `GET /api/boards/status` — Get live state of all large intersection gantries and roadside matrix displays
* `POST /api/boards/:id/override` — Municipal manual emergency lock on specific signage

---

## 3. Real-Time Socket.IO Telemetry Engine

Connect to WebSocket at `http://localhost:5000`.

### Client $\rightarrow$ Server Events:
1. `join:trip` — `(tripId)`: Subscribes client to trip updates.
2. `join:hospital` — `(hospitalId)`: Subscribes hospital trauma bay to incoming ambulance alerts.
3. `join:boards` — Subscribes to roadside LED sign changes.
4. `ambulance:telemetry` — Streamed by ambulance pilot:
   ```json
   {
     "tripId": "TRIP-CX-8841",
     "ambulanceId": "AMB-102",
     "latitude": 18.5085,
     "longitude": 73.8180,
     "speedKmh": 58,
     "waypointIndex": 4
   }
   ```

### Server $\rightarrow$ Client Broadcasts:
1. `corridor:node-update`: Broadcasts updated status of upcoming route nodes (`STANDBY`, `PREPARING`, `ACTIVE`, `PASSED`).
2. `boards:broadcast`: Broadcasts high-contrast LED matrix display text and directional arrow commands to roadside gantries.
3. `hospital:pre-alert`: Broadcasts live patient ETA, vitals (Heart rate, SpO2, MAP), and distance to trauma bay.

---

## 4. Default Seed Credentials (for Testing)

| Role | Identifier (Phone/Email) | Password |
|---|---|---|
| Customer / Patient | `+91 98765 43210` or `rahul.sharma@example.com` | `corridorx123` |
| Ambulance Pilot | `+91 98220 14892` or `rajesh.pilot@ems-pune.gov.in` | `corridorx123` |
| Hospital Trauma Chief | `+91 20 4015 1000` or `trauma.chief@dmh.org` | `corridorx123` |
| Traffic Control Center | `+91 20 2612 2000` or `control@punetrafficpolice.gov.in` | `corridorx123` |
