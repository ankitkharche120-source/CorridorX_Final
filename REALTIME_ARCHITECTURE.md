# CorridorX — Real-Time WebSocket & Socket.IO Architecture

The real-time backbone of CorridorX is built on bi-directional Socket.IO WebSockets operating on port `5000`.

---

## 1. Socket Rooms

Clients subscribe to targeted rooms based on role and operational scope:

| Room Name | Target Audience | Purpose |
| :--- | :--- | :--- |
| `trip:{tripId}` | Patient, Assigned Pilot, Attendants | Scoped to a specific active emergency journey; receives vehicle GPS pings, signal handovers, and ETA updates. |
| `ambulance:{ambulanceId}` | Ambulance Pilot & Paramedic Crew | Dispatches incoming emergency call sheets directly to the assigned unit. |
| `hospital:{hospitalId}` | Hospital Trauma Bay & Emergency Desk | Receives real-time casualty pre-alerts, incoming ambulance distance, and ETA countdown. |
| `control-center` | Municipal Traffic Police & Admin CAD | Global visibility across all city-wide active corridors, signal overrides, and roadside LED displays. |

---

## 2. Event Specifications

### Client -> Server Emitters

#### `ambulance:telemetry`
Broadcasts real-time GPS coordinates from an on-duty ambulance.
```json
{
  "ambulanceId": "AMB-102",
  "tripId": "TRIP-CX-8841",
  "latitude": 18.5085,
  "longitude": 73.8180,
  "accuracy": 8,
  "heading": 85,
  "speed": 54,
  "timestamp": 1727940000000
}
```
* **Server-side validation:** Rejects invalid coordinates and impossible GPS jumps (> 180 km/h).

#### `ambulance:status`
Toggles pilot duty status (`AVAILABLE`, `ON_DUTY`, `OFF_DUTY`).

#### `hospital:status`
Updates operational capacity (Receiving Desk, Trauma, ICU, Ventilator).

---

### Server -> Client Broadcasts

#### `trip:locationUpdated`
* **Room:** `trip:{tripId}`, `control-center`
* **Payload:** `{ ambulanceId, tripId, latitude, longitude, accuracy, heading, speed, timestamp }`

#### `trip:etaUpdated`
* **Room:** `trip:{tripId}`, `hospital:{hospitalId}`, `control-center`
* **Payload:** `{ tripId, distanceMeters, distanceKm, etaSeconds, etaMinutes, speedKmh }`

#### `corridor:node-update`
* **Room:** `trip:{tripId}`, `control-center`
* **Payload:** Contains updated status for every junction node (`STANDBY`, `PREPARING`, `ACTIVE`, `PASSED`) and linked digital road boards.

#### `hospital:pre-alert`
* **Room:** `hospital:{hospitalId}`
* **Payload:** `{ tripId, ambulanceId, patientName, emergencyType, distanceKm, etaSeconds, vitals }`
