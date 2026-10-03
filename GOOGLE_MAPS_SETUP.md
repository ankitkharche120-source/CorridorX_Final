# Google Maps Platform Integration Guide — CorridorX

This document provides exact, step-by-step instructions for provisioning, configuring, and testing Google Maps Platform APIs within the CorridorX platform.

---

## 1. Required Google Cloud APIs

To enable full real-world functionality in **REAL MODE**, activate the following APIs in the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/overview):

| API Service | Purpose in CorridorX | Where Used |
| :--- | :--- | :--- |
| **Maps JavaScript API** | Interactive dark tactical map canvas, vector rendering, custom `AdvancedMarkerElement` | Frontend (`@vis.gl/react-google-maps`) |
| **Places API (New)** | Real hospital & trauma center discovery, nearby search, place details | Backend (`/api/hospitals/nearby-places`) & Frontend |
| **Routes API** | Traffic-aware driving route computation, optimal ETA, polyline decoding | Backend (`/api/routes/emergency-route`) |
| **Roads API** | "Snap to Roads" interpolation for GPS drift correction along arterial streets | Backend (`/api/routes/snap-to-roads`) |
| **Geocoding API** *(Optional)* | Reverse geocoding of GPS coordinates to human-readable street addresses | Client / Server Geocoding |

---

## 2. API Key Configuration & Security

CorridorX uses a **dual-key architecture** to protect your cloud billing and prevent credential leaks:

### A. Client-Side Browser Key (`VITE_GOOGLE_MAPS_API_KEY`)
* **File:** `frontend/.env` (or project root `.env`)
* **Exposed to:** Web browser
* **Recommended Restrictions:**
  * **Application Restriction:** *Websites (HTTP referrers)*
    * `http://localhost:5173/*`
    * `http://127.0.0.1:5173/*`
    * `https://your-production-domain.com/*`
  * **API Restrictions:** Restrict strictly to **Maps JavaScript API**.

### B. Server-Side Protected Keys (`GOOGLE_*_API_KEY`)
* **File:** `backend/.env`
* **Exposed to:** Node.js backend only (NEVER bundled into browser JS)
* **Recommended Restrictions:**
  * **Application Restriction:** *IP addresses* (your server/VPC static IP)
  * **API Restrictions:** Restrict to **Routes API**, **Places API (New)**, and **Roads API**.

---

## 3. Environment Variable Setup

Add the keys to your environment files:

```bash
# In frontend/.env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyYourPublicMapsJavascriptApiKey
VITE_BACKEND_URL=http://localhost:5000

# In backend/.env
GOOGLE_MAPS_API_KEY=AIzaSyYourServerSideApiKey
GOOGLE_ROUTES_API_KEY=AIzaSyYourServerSideApiKey
GOOGLE_PLACES_API_KEY=AIzaSyYourServerSideApiKey
GOOGLE_ROADS_API_KEY=AIzaSyYourServerSideApiKey
```

---

## 4. Fallback Architecture (Zero-Crash Guarantee)

If no Google Maps API Key is provided:
1. CorridorX automatically switches the map canvas to the **Leaflet / OpenStreetMap** high-contrast vector engine.
2. Hospital search automatically queries the **CorridorX Pre-Registered Hospital Network** with real Haversine distance calculations.
3. Emergency routes compute via the **Local Urban Routing Engine** (incorporating urban road curvature factors).
4. A prominent badge on the map displays `OpenStreetMap Engine` vs `Google Maps Platform`.

The application will **never crash** or display a broken gray error screen if an API key is missing or quota is exceeded.
