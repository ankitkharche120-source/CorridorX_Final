# CorridorX — System Architecture & Codebase Audit

> Comprehensive architectural specification, codebase inventory, data flows, and migration blueprint for transforming the CorridorX prototype into a production-grade, real-time emergency transit mobility platform.

---

## 1. Executive Summary & Purpose

**CorridorX** is a mission-critical emergency mobility operating system engineered to eliminate urban transit latency during the **Golden Hour** (the first 60 minutes after trauma or acute cardiovascular events). 

The platform synchronizes four interconnected operational roles:
1. **Customer / Caller / Attendant:** Urgent triage, real GPS capture, hospital selection, and transparent live ambulance tracking.
2. **Ambulance Pilot & EMS Crew:** Tactical Computer-Aided Dispatch (CAD) terminal, turn-by-turn routing, real GPS telemetry broadcasting, and patient handoff.
3. **Hospital Trauma Bay:** Real-time incoming casualty alerts, live ETA countdown, and bed/ICU/ventilator capacity management.
4. **Municipal Traffic & Control Center:** Global situational awareness, automated traffic signal preemption (dynamic green wave), and roadside digital LED board control.

---

## 2. Codebase Inventory & Current State Audit

### 2.1 Repository Structure
```
corridorx/
├── backend/
│   ├── data/
│   │   └── database.json            # Persistent JSON database
│   ├── src/
│   │   ├── config/
│   │   │   └── index.js             # Environment configuration
│   │   ├── controllers/
│   │   │   ├── ambulanceController.js
│   │   │   ├── authController.js
│   │   │   ├── boardController.js
│   │   │   ├── hospitalController.js
│   │   │   └── tripController.js
│   │   ├── db/
│   │   │   ├── index.js             # Generic DB collection wrapper (SQLite/JSON)
│   │   │   └── seedData.js          # Seed dataset (users, ambulances, hospitals, nodes, boards)
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT validation middleware
│   │   ├── routes/
│   │   │   ├── ambulanceRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── boardRoutes.js
│   │   │   ├── hospitalRoutes.js
│   │   │   └── tripRoutes.js
│   │   ├── socket/
│   │   │   └── corridorEngine.js    # Socket.IO telemetry & corridor handover engine
│   │   └── server.js                # Express & HTTP server entrypoint (Port 5000)
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CorridorTimeline.jsx # Visual corridor junction progression bar
│   │   │   ├── DigitalBoardCard.jsx # Roadside LED warning display component
│   │   │   ├── Footer.jsx           # Platform footer
│   │   │   ├── MapContainer.jsx     # Leaflet map container with custom SVG icons
│   │   │   ├── Navbar.jsx           # Role-adaptive header (Customer vs Ambulance)
│   │   │   ├── OlaRideDrawer.jsx    # Consumer bottom sheet ride tracking HUD
│   │   │   └── SimulationController.jsx # Demo playback & speed control bar
│   │   ├── context/
│   │   │   └── EmergencyContext.jsx # Central state provider (Auth, Trips, Simulation, Telemetry)
│   │   ├── data/
│   │   │   ├── mockAmbulances.js
│   │   │   ├── mockDigitalBoards.js
│   │   │   ├── mockHospitals.js
│   │   │   ├── mockRouteNodes.js
│   │   │   └── mockTrips.js
│   │   ├── pages/
│   │   │   ├── ActiveEmergencyPage.jsx        # Consumer live ride tracker
│   │   │   ├── AmbulanceOperatorDashboard.jsx # Driver tactical CAD terminal
│   │   │   ├── AvailableAmbulancesPage.jsx    # Nearby ambulance selection
│   │   │   ├── CustomerDashboard.jsx          # Consumer overview & quick request
│   │   │   ├── EmergencyRequestPage.jsx       # 4-step emergency triage request
│   │   │   ├── HospitalSelectionPage.jsx      # Pre-registered hospital cards
│   │   │   ├── LandingPage.jsx                # Marketing & hero overview
│   │   │   ├── LoginPage.jsx                  # Dual-portal authentication
│   │   │   └── QREmergencyPage.jsx            # Instant bystander QR triage
│   │   ├── App.jsx                  # React Router routes
│   │   ├── index.css                # Tailwind CSS direct imports
│   │   └── main.jsx                 # Vite React root
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── CorridorX_SRS_Document.md
│   └── Backend_Integration_Prompt.md
├── push_to_github.bat
└── README.md
```

### 2.2 Existing Features & Strengths
* **Complete UI/UX Design System:** Premium dark-mode interface with clinical clarity, custom SVG map markers, dynamic status pills, and responsive layout.
* **Separated Portals:** Distinct Customer Booking/Tracking Flow and Ambulance Driver CAD Cockpit.
* **Backend Foundation:** Express REST endpoints with JWT authentication, seed data, and a working Socket.IO corridor engine broadcasting on port 5000.
* **Pre-registered Hospital Directory:** Full specifications for 5 major tertiary hospital centers in Pune with bed counts and helplines.
* **Corridor Sequence Engine:** Haversine distance-based logic calculating node states (`STANDBY` -> `PREPARING` -> `ACTIVE` -> `PASSED`) and linked roadside message boards.

### 2.3 Identified Architecture Gaps for Real-World Mode
1. **Google Maps Platform:** Map currently relies on Leaflet + OpenStreetMap with hardcoded waypoints; needs Google Maps JavaScript API, Google Places (New) for hospital search, Google Routes (traffic-aware) for live ETA, and Google Roads (Snap to Roads).
2. **Real Client GPS:** Consumer and driver locations currently default to simulated coordinates; needs `navigator.geolocation.watchPosition` hook with permission management, accuracy checks, and stale GPS detection.
3. **Frontend-to-Backend Socket Integration:** Frontend previously held state purely in React Context; needs `socket.io-client` subscribing to real-time rooms (`trip:{id}`, `ambulance:{id}`, `hospital:{id}`, `control-center`).
4. **Hospital & Control Center Panels:** Need dedicated views for hospital staff (trauma bay capacity toggles) and municipal traffic operators.
5. **Real Mode vs. Demo Mode Isolation:** Must maintain strict separation so real GPS and APIs run in `REAL MODE` while keeping offline pitch demonstrations functional in `DEMO MODE`.

---

## 3. Real-Time Data Flow & Socket Room Architecture

```
[Customer Client]              [Ambulance Client]            [Traffic / Boards / Hospital]
       |                               |                                     |
       |--- POST /api/trips/request -->|                                     |
       |    (trip created: IDLE)       |                                     |
       |                               |                                     |
       |<==== socket room trip:{id} ===|                                     |
       |                               |<--- join:trip & accept trip ------- |
       |                               |                                     |
       |                               |=== ambulance:telemetry (GPS) ======>|
       |                               |    (lat, lng, speed, heading)       |
       |                               |                                     v
       |<=== trip:locationUpdated =====+============================= [Backend Engine]
       |<=== trip:etaUpdated ==========+                              |
       |                               |<=== corridor:node-update ====v (Nodes & Boards)
       |                               |<=== hospital:pre-alert =====>v (Trauma Teams)
```

---

## 4. Database Schema Specification (SQLite / PostgreSQL Ready)

* **`users`**: `id`, `name`, `phone`, `email`, `password_hash`, `role` (`CUSTOMER` | `AMBULANCE` | `HOSPITAL` | `ADMIN`), `created_at`
* **`customers`**: `id`, `user_id`, `emergency_contact`, `medical_notes`
* **`ambulances`**: `id`, `vehicle_number`, `driver_name`, `driver_id`, `phone`, `type`, `equipment_json`, `status` (`AVAILABLE` | `DISPATCHED` | `OFF_DUTY`), `latitude`, `longitude`, `heading`, `speed_kmh`, `qr_token`
* **`hospitals`**: `id`, `google_place_id`, `name`, `address`, `latitude`, `longitude`, `helpline`, `receiving_status` (`READY` | `BUSY` | `CLOSED`), `trauma_status`, `icu_status`, `ventilator_status`, `icu_beds_available`
* **`trips`**: `id`, `customer_id`, `ambulance_id`, `hospital_id`, `emergency_type`, `pickup_address`, `pickup_lat`, `pickup_lng`, `dest_lat`, `dest_lng`, `status` (`REQUESTED` | `SEARCHING` | `ASSIGNED` | `ACCEPTED` | `EN_ROUTE_PICKUP` | `PATIENT_ONBOARD` | `EN_ROUTE_HOSPITAL` | `ARRIVED_HOSPITAL` | `COMPLETED` | `CANCELLED`), `route_polyline`, `distance_meters`, `eta_seconds`, `started_at`, `accepted_at`, `arrived_hospital_at`, `completed_at`
* **`corridor_nodes`**: `id`, `trip_id`, `sequence`, `name`, `latitude`, `longitude`, `status` (`STANDBY` | `PREPARING` | `ACTIVE` | `PASSED`), `traffic_density`, `large_board_id`, `small_board_id`
* **`digital_boards`**: `id`, `node_id`, `board_name`, `intersection_name`, `type`, `status`, `lane_allocation`, `latitude`, `longitude`, `message_line1`, `message_line2`, `message_line3`
* **`notifications`**: `id`, `recipient_id`, `channel` (`BROWSER` | `FCM` | `WHATSAPP` | `SMS`), `title`, `body`, `sent_at`, `status`
* **`audit_logs`**: `id`, `entity_type`, `entity_id`, `action`, `actor_id`, `metadata_json`, `created_at`

---

## 5. Phased Implementation Roadmap

* **Phase A:** Google Maps Platform integration + real GPS hook (`useLiveLocation`).
* **Phase B:** Enhanced backend API routes + database schema expansion.
* **Phase C:** Socket.IO client-server integration & bidirectional real-time rooms.
* **Phase D:** Real ambulance GPS tracking with intelligent server-side throttling & jump rejection.
* **Phase E:** Google Routes API (traffic-aware) + Google Places API (New) for real hospital discovery.
* **Phase F:** Dynamic Corridor Engine with configurable distance thresholds (`500m`/`200m`/`50m`).
* **Phase G:** Hospital Real-Time Panel & trauma status management.
* **Phase H:** QR Emergency Decal Flow (`/qr-emergency/:ambulanceId`).
* **Phase I:** Notification service adapters (Browser, FCM, WhatsApp).
* **Phase J:** External Traffic Signal & Digital Road Board hardware abstraction adapters.
* **Phase K:** Production deployment configs, health checks (`GET /api/health`), and comprehensive documentation.
