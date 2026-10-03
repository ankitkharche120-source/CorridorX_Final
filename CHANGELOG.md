# CorridorX - Recent Changes Documentation

This document summarizes all the major improvements, fixes, and overhauls we made to the CorridorX platform during our recent pair-programming session.

### 🗺️ 1. Complete Mapping Engine Overhaul
*   **Replaced MapLibre with React-Leaflet:** Completely rebuilt the primary `MapContainer.jsx` dashboard map using `React-Leaflet` to provide a much more robust, polished, and beautiful mapping experience.
*   **Standardized Aesthetics:** Migrated the `LocationPicker.jsx` (used in the Emergency Request page) to `React-Leaflet` as well. This guarantees a 100% consistent visual experience across the entire platform.
*   **Removed API-Key Dependencies:** By moving to standard OpenStreetMap raster tiles, we eliminated all map tile loading issues and watermarks that occur without a commercial API key.
*   **Removed Dark Filters:** Removed a hidden CSS `invert` filter in `index.css` that was forcing the map tiles to look unnaturally dark, restoring the beautiful, classic OpenStreetMap color palette.
*   **Decluttered Interface:** Removed the traffic signal junction markers (J-01, J-02) from the map to provide a much cleaner, distraction-free view focusing entirely on the ambulance, the pickup location, and the hospital.

### 🛣️ 2. Route Snapping & Fallback System
*   **Road-Snapping Fix:** Fixed the issue where the blue emergency route line would occasionally ignore roads and draw a straight line over buildings.
*   **Dual-OSRM Redundancy:** Upgraded `geoapifyService.js` to utilize a robust fallback system using multiple free OSRM servers (`routing.openstreetmap.de` and `router.project-osrm.org`). If the primary routing server is busy, it automatically fails over to the secondary one seamlessly.

### 🐛 3. Critical Bug Fixes
*   **Vite Proxy Overlap Fix:** Resolved a bug in `vite.config.js` where internal proxy rules (`/api/osrm` and `/api/osrm2`) were overlapping and mangling the routing requests before they reached the mapping server, causing "Malformed URL" errors.
*   **Fatal `etaMin` ReferenceError:** Discovered and fixed a critical, silent code-crashing bug inside `geoapifyService.js` where an undefined variable (`etaMin`) was completely breaking the route calculation at the final millisecond, forcing the app to fall back to the straight line.
*   **Error Unmasking:** Removed generic error masking in the routing service so that if an API ever fails again, the exact cause is printed directly into the red error box on the map.

### 🕹️ 4. User Experience (UX) Enhancements
*   **Manual Map Control (No More Snapping):** Disconnected the map's camera system from the ambulance animation loop in `MapContainer.jsx`. The map now intelligently centers itself *only* when a new emergency starts, giving you 100% unrestricted manual control to pan and zoom around the city without the map constantly snapping back to the center.
