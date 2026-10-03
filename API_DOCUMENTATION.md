# CorridorX — REST API Specification & Endpoint Documentation

The CorridorX central coordination engine exposes standard JSON REST endpoints on port `5000`.

**Base URL:** `http://localhost:5000/api`

---

## 1. System Health & Monitoring

### `GET /health`
* **Description:** Standard production uptime health check.
* **Response (200 OK):**
```json
{
  "status": "OK",
  "uptime": 124.5
}
```

### `GET /api/health`
* **Description:** Rich diagnostic health check with real-time operational metrics.
* **Response (200 OK):**
```json
{
  "status": "ONLINE",
  "service": "CorridorX Dynamic Emergency Mobility API",
  "uptimeSeconds": 124,
  "timestamp": "2026-10-03T06:55:00.000Z",
  "metrics": {
    "activeAmbulances": 4,
    "hospitalsOnline": 5,
    "activeTrips": 2,
    "digitalBoardsSync": 6
  }
}
```

---

## 2. Emergency Trips & Dispatch (`/api/trips`)

### `POST /api/trips/request`
* **Description:** Creates a new emergency trip request from a patient or attendant.
* **Request Body:**
```json
{
  "patient_name": "Rahul Sharma",
  "contact": "+91 98765 43210",
  "emergency_type": "Chest Pain / Acute STEMI",
  "pickup_address": "Paud Road, Kothrud Stand, Pune",
  "pickup_lat": 18.5074,
  "pickup_lng": 73.8065,
  "notes": "Severe chest pain radiating to left arm."
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Emergency request created successfully.",
  "trip": {
    "id": "TRIP-CX-8842",
    "status": "REQUESTED",
    "distanceMeters": 3500,
    "etaSeconds": 360
  }
}
```

### `POST /api/trips/:id/select-ambulance`
* **Description:** Assigns an ambulance unit to the emergency trip.
* **Request Body:**
```json
{
  "ambulance_id": "AMB-102"
}
```
* **Response (200 OK):** Emits `trip:assigned` over Socket.IO.

### `POST /api/trips/:id/select-hospital`
* **Description:** Locks the pre-registered destination hospital and initiates corridor preemption.
* **Request Body:**
```json
{
  "hospital_id": "HOSP-01"
}
```
* **Response (200 OK):** Emits `corridor:activated` and alerts hospital trauma bay.

### `PATCH /api/trips/:id/status`
* **Description:** Transitions trip lifecycle status.
* **Allowed Statuses:** `REQUESTED`, `SEARCHING`, `ASSIGNED`, `ACCEPTED`, `EN_ROUTE_PICKUP`, `PATIENT_ONBOARD`, `EN_ROUTE_HOSPITAL`, `ARRIVED_HOSPITAL`, `COMPLETED`, `CANCELLED`.
* **Request Body:**
```json
{
  "status": "ARRIVED_HOSPITAL"
}
```

---

## 3. Hospital Real-Time Systems (`/api/hospitals`)

### `GET /api/hospitals`
* **Description:** Returns all registered hospitals ranked by distance from caller coordinates.
* **Query Params:** `lat`, `lng`.

### `GET /api/hospitals/nearby-places`
* **Description:** Uses Google Places API (New) to discover nearby hospitals with real distance calculations.
* **Query Params:** `lat`, `lng`, `radius` (in meters).

### `PATCH /api/hospitals/:id/status`
* **Description:** Updates hospital receiving, trauma bay, ICU, and ventilator capacity.
* **Request Body:**
```json
{
  "receiving_status": "READY",
  "trauma_status": "AVAILABLE",
  "icu_status": "AVAILABLE",
  "ventilator_status": "AVAILABLE",
  "icu_beds": 8
}
```
* **Response (200 OK):** Broadcasts `hospital:statusUpdated` over Socket.IO.

---

## 4. Google Routes & Roads Proxy (`/api/routes`)

### `POST /api/routes/emergency-route`
* **Description:** Computes driving route using Google Routes API (`directions/v2:computeRoutes`) with traffic-aware optimization.
* **Request Body:**
```json
{
  "origin": { "latitude": 18.5085, "longitude": 73.8180 },
  "destination": { "latitude": 18.5020, "longitude": 73.8290 },
  "travelMode": "DRIVE",
  "routingPreference": "TRAFFIC_AWARE_OPTIMAL"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "source": "GOOGLE_ROUTES_API",
  "route": {
    "distanceMeters": 1749,
    "durationSeconds": 132,
    "encodedPolyline": "..."
  }
}
```

### `POST /api/routes/snap-to-roads`
* **Description:** Snaps raw GPS points to actual road centerline geometry using Google Roads API.
* **Request Body:**
```json
{
  "path": "18.5085,73.8180|18.5088,73.8208",
  "interpolate": true
}
```
