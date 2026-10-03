# CorridorX — Backend Engineering Prompt
Use this prompt when building the backend services for CorridorX to plug directly into the frontend prototype.

```text
You are a senior backend engineer building the production API and real-time synchronization backend for "CorridorX" (an emergency ambulance mobility & dynamic traffic corridor management platform).

The frontend is already built in React + Vite + Tailwind CSS + Leaflet and expects the following REST endpoints and WebSocket (Socket.IO) events:

1. TECH STACK:
   - Node.js & Express.js
   - SQLite (for fast local prototype) or PostgreSQL with Prisma / Knex ORM
   - Socket.IO for real-time telemetry and digital board broadcasts
   - JWT authentication with roles: CUSTOMER, AMBULANCE, HOSPITAL, ADMIN

2. DATA MODELS:
   - User (id, name, phone, email, password_hash, role)
   - Ambulance (id, vehicle_number, driver_name, phone, rating, type, equipment_json, latitude, longitude, status, qr_token)
   - Hospital (id, name, address, latitude, longitude, helpline, icu_beds, trauma_lead, status)
   - Trip (id, request_id, ambulance_id, hospital_id, patient_name, contact, emergency_type, pickup_address, pickup_lat, pickup_lng, status, started_at, completed_at, eta_seconds, distance_km)
   - RouteNode (id, trip_id, sequence, name, latitude, longitude, status: STANDBY | PREPARING | ACTIVE | PASSED)
   - DigitalBoard (id, node_id, board_name, type: LARGE_INTERSECTION | SMALL_ROADSIDE, status, current_messages_json)

3. REQUIRED REST ENDPOINTS:
   - POST /api/auth/register & POST /api/auth/login
   - POST /api/trips/request (create emergency booking)
   - GET /api/ambulances/nearby?lat=...&lng=... (find nearest available fleet)
   - POST /api/trips/:id/select-ambulance
   - POST /api/trips/:id/select-hospital (can be called initially or en route)
   - GET /api/trips/:id/corridor (fetches live sequence of junctions and boards)
   - POST /api/trips/qr-session (metro QR instant booking from ambulance decal)
   - GET /api/boards/status (list all roadside signage statuses)
   - POST /api/boards/:id/override (municipal manual emergency lock)

4. REAL-TIME SOCKET.IO ENGINE:
   - ambulance:telemetry (ambulance streams GPS coordinates and instant speed)
   - corridor:node-update (server calculates distances to upcoming route nodes and broadcasts state changes: STANDBY -> PREPARING -> ACTIVE -> PASSED)
   - boards:broadcast (server transmits formatted high-contrast LED sign text to affected gantries)
   - hospital:pre-alert (pushes live patient vitals and ETA countdown to trauma bay)

Ensure clean CORS configuration with origin http://localhost:5173, seed realistic Pune corridor demo data, and include a README with setup commands.
```
