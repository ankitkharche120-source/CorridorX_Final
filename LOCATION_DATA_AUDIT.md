# CORRIDORX — LOCATION & DATA AUDIT

Generated: 2026-10-03
Scope: Complete repository audit of geographic coordinates, hardcoded fallback data, mock arrays, routing, and ambulance/hospital providers.

---

## 1. Executive Summary

A thorough repository-wide audit revealed that while certain UI components were updated to display pan-India search, several underlying backend controllers and frontend fallbacks still contained hardcoded coordinates (principally `18.5074, 73.8065` in Pune), hardcoded mock hospitals (including cross-country static arrays with Chennai/Delhi/Pune mixed in text searches), and non-standardized location structures.

This caused the failure described:
- User selected location: Bengaluru (or default Pune).
- Manual text search fallback returned a static national array featuring Apollo Hospitals Chennai.
- Distance was calculated either against a hardcoded coordinate or naive Haversine, causing an impossible "10 km / 10 min ETA" between Bengaluru and Chennai.

This document identifies all problem points and specifies the new behavior following the **Real Geography + Demo Fleet** architecture.

---

## 2. Findings by File & Component

### A. Backend: `backend/src/controllers/hospitalController.js`
* **Current Behavior:**
  * Line 18: `const lat = parseFloat(req.query.lat) || 18.5074;` (Fallback to Paud Rd, Pune).
  * Line 275-287: `nationalHospitals` array contains static entries across different states (AIIMS Delhi, Kokilaben Mumbai, Apollo Greams Rd Chennai, Ruby Hall Pune).
  * If Places API fails, it matched against this static array, returning Apollo Chennai regardless of whether the user is in Bengaluru or Delhi, leading to absurd distances.
* **Problem:** Inconsistent geographic data mixing cities across India with fake radius matches.
* **New Behavior:**
  * Zero static national fallback arrays.
  * Hospital searches must strictly query Google Places API (New) `searchNearby` centered on `pickup.latitude` and `pickup.longitude`.
  * If Google Places returns 0 results or fails, return empty array `{ count: 0, hospitals: [] }` with clear status, NEVER cross-state static mock data.

### B. Backend: `backend/src/controllers/tripController.js`
* **Current Behavior:**
  * Line 24: `pickup_lat = 18.5074, pickup_lng = 73.8065` default parameters.
  * Line 40: `destinationLatitude: hospital ? hospital.latitude : 18.5020`.
* **Problem:** Hardcodes trips to Erandwane / Karve Road Pune if latitude is omitted.
* **New Behavior:**
  * Strictly require `origin` and `destination` coordinates from request payload. Reject with HTTP 400 if coordinates are missing.

### C. Backend: `backend/src/controllers/routeController.js`
* **Current Behavior:**
  * Relies on Google Routes API, then falls back to OSRM, then urban mathematical fallback.
* **Problem:** Lacks explicit integration health status and diagnostics endpoint for Google Routes API / traffic models.
* **New Behavior:**
  * Enforce Google Routes API (TRAFFIC_AWARE / TRAFFIC_AWARE_OPTIMAL).
  * Surface diagnostics on `/api/integrations/health`.

### D. Frontend: `frontend/src/context/EmergencyContext.jsx`
* **Current Behavior:**
  * Contains multiple coordinate models (`pickupCoords`, `liveLocation`, `activeCenter`, `currentCoords`).
* **Problem:** Lack of a single standardized `Location` model.
* **New Behavior:**
  * Standardize on Section 3 `Location` model:
    ```ts
    {
      latitude: number,
      longitude: number,
      formattedAddress: string,
      placeId: string | null,
      source: "GPS" | "SEARCH" | "MAP_PIN" | "MANUAL",
      accuracy: number | null,
      timestamp: number
    }
    ```

### E. Frontend: `frontend/src/pages/AvailableAmbulancesPage.jsx`, `HospitalSelectionPage.jsx`, `EmergencyRequestPage.jsx`, `ActiveEmergencyPage.jsx`
* **Current Behavior:**
  * In several places: `latitude: emergencyRequest.pickupCoords?.lat || 18.5175`.
* **Problem:** Silently substitutes Pune coordinates whenever coordinates are unset or loading.
* **New Behavior:**
  * Completely remove `18.5175` / `73.8401` fallbacks.
  * When no location is selected, state is strictly `null` and map displays neutral India overview (`[20.5937, 78.9629]`, zoom 5).

### F. Frontend: `frontend/src/data/mockAmbulances.js`, `mockHospitals.js`, `mockRouteNodes.js`
* **Current Behavior:**
  * Static arrays centered around Karve Road, Paud Road, and Nal Stop in Pune.
* **Problem:** If imported directly into components, forces Pune data into view.
* **New Behavior:**
  * All demo ambulances must be generated dynamically relative to the active pickup location via `DemoAmbulanceProvider.generateNearbyDemoAmbulances({ latitude, longitude })`.
  * No static Pune arrays in active production flows.

---

## 3. Architecture Blueprint for Fix

1. **Location Model Standardization:** Single unified model used across Context, LocationPicker, and MapContainer.
2. **Backend API Health Endpoint:** `/api/integrations/health` reporting status of Google Maps, Places, Routes, Geocoding, and Database.
3. **Dynamic Demo Ambulance Generator:** Pure mathematical offset (0.5–5 km) based on the user's selected coordinates anywhere in India.
4. **Google Routes & Places Exclusivity:** Zero static hospital fallback arrays across states. Real Google Places searchNearby + real Google Routes traffic-aware routing.
