# CorridorX
**Patient Emergency Transport & Green Wave Dynamic Mobility Platform**

## 🚑 Project Overview
**CorridorX** is a cutting-edge emergency mobility platform designed to revolutionize the way emergency vehicles (such as ambulances) navigate through congested urban environments. The core mission of the platform is to reduce emergency response times and save lives by orchestrating a **"Green Wave"**—a synchronized system of preemptive traffic signal controls that clear a path for emergency vehicles in real-time.

The application serves as a comprehensive dashboard connecting patients in distress, ambulance operators, traffic control centers, and receiving hospitals into one unified, real-time tracking interface.

---

## ✨ Core Features & Modules

### 1. Dynamic Routing & Mapping
*   **Precision Road Snapping:** Utilizes high-fidelity **OSRM (Open Source Routing Machine)** and **Geoapify** mapping APIs to calculate exact, curve-for-curve road geometries.
*   **Dual-Redundancy Fallback:** Ensures 100% uptime by seamlessly switching between global mapping proxy servers (`routing.openstreetmap.de` and `router.project-osrm.org`) if one encounters heavy load or rate limits.
*   **Interactive Cartography:** Powered by **React-Leaflet** and standard **OpenStreetMap (OSM)** tiles, providing an ultra-smooth, lightweight, and beautiful visual map experience free from API-key locks.

### 2. "Green Wave" V2X Traffic Preemption (Simulation)
*   **Traffic Signal Nodes:** The system dynamically identifies traffic intersections (e.g., J-01, J-02) along the active emergency route.
*   **Predictive Signaling:** As the ambulance approaches an intersection, the system predicts the ETA and visually transitions the signal state (Active Preempted Green 🟢, Preparing Warning Phase 🟡, and Normalized ⚪) to clear traffic ahead of the vehicle.

### 3. Unified State & Simulation Engine
*   **React Context Architecture:** At the heart of the app is the `EmergencyContext.jsx`, serving as the "Single Source of Truth." It controls the entire state of an emergency from request, dispatch, and transit, all the way to hospital arrival.
*   **Animation Controller:** A robust simulation loop (`SimulationController.jsx`) orchestrates the movement of the ambulance marker across hundreds of calculated waypoints, updating the current speed, heading, and distance dynamically.

### 4. Multi-Persona Dashboards
*   **Customer / Patient Dashboard:** Allows users to set their pickup location using a Leaflet-powered `LocationPicker`, request an ambulance, and view the ETA.
*   **Ambulance Operator Dashboard:** Displays live navigation instructions, current speed, and upcoming preemption nodes for the driver.
*   **Hospital Dashboard (Trauma Center):** Allows receiving hospitals to see the exact real-time location of incoming patients, their ETA, and prepare the Trauma Bay in advance.
*   **Control Center:** The god's-eye view for city traffic dispatchers to monitor the Green Wave propagation across the city's infrastructure.

---

## 🛠️ Technology Stack

**Frontend Framework & UI**
*   **React 18** (Vite Build Tool)
*   **Tailwind CSS** for rapid, responsive, and highly-stylized modern UI design.
*   **Lucide-React** for clean, scalable SVG iconography.
*   **Clsx & Tailwind-Merge** for dynamic CSS class management.

**Mapping & Geospatial**
*   **React-Leaflet (v4) & Leaflet.js** for the core interactive map rendering.
*   **OSRM (Open Source Routing Machine)** for driving routes and waypoint interpolation.
*   **Geoapify** for Geocoding (Address to Coordinates) and Reverse Geocoding.

**Backend / Real-Time Communication (Prepared)**
*   **Socket.io-Client:** Integrated to support future real-time, bi-directional WebSocket communication between the live ambulances and the cloud server.

---

## 📂 Project Structure (Key Files)
*   `/src/components/MapContainer.jsx` - The beautiful Leaflet dashboard map rendering the route, ambulance, and hospital.
*   `/src/components/LocationPicker.jsx` - The interactive map for selecting the emergency pickup location.
*   `/src/context/EmergencyContext.jsx` - The global state engine controlling the logic, simulation, and stages of the emergency.
*   `/src/services/geoapifyService.js` - The complex API service bridging OSRM proxies and map coordinate decoding.
*   `/src/pages/CustomerDashboard.jsx` - The main layout tying the map and the UI overlays together.
*   `/vite.config.js` - Contains the crucial API proxies required to bypass browser ad-blockers and CORS restrictions for map routing.
