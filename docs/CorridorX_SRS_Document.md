# CorridorX — Software Requirements Specification (SRS)
## MVP Prototype for Eureka! Road to Enterprise 2026
### Emergency Ambulance Dispatch, Hospital Routing & Dynamic Corridor Management
**Version:** 1.0 | Prototype Scope | 45-Hour Development Target

---

## 1. Executive Summary & Product Overview
CorridorX is an intelligent emergency mobility and dynamic roadside traffic coordination platform designed to save lives during the critical clinical **Golden Hour (first 60 minutes)**. 

Unlike conventional navigation applications (such as Google Maps or generic ride-hailing services) that simply display routes and traffic congestion, **CorridorX actively prepares and clears traffic ahead of the ambulance before the vehicle arrives at the intersection**.

### The Core Paradigm:
$$\text{Standard Emergency Dispatch: } \text{Ambulance stuck in traffic} \rightarrow \text{Siren blares at red light} \rightarrow \text{Gridlock at junction}$$
$$\text{CorridorX Active Dynamic Wave: } \text{Ambulance En Route} \rightarrow \text{Junction } N \text{ warned in advance} \rightarrow \text{Traffic merges left} \rightarrow \text{Green wave cleared}$$

---

## 2. Objectives
1. **Rapid Patient Request:** Allow patients, attendants, or bystanders to request nearest equipped ambulances (ALS, BLS, Cardiac Mobile ICU).
2. **Flexible Hospital Selection:** Permit destination selection either during initial booking or en route after on-board paramedic assessment.
3. **Successive Junction Handover:** Progressively transition roadside intersection nodes through `STANDBY` $\rightarrow$ `PREPARING` $\rightarrow$ `ACTIVE` $\rightarrow$ `PASSED`.
4. **Roadside LED Signage Synchronization:** Broadcast clear, high-contrast instructions to drivers via large intersection gantries and roadside median displays.
5. **Zero-App QR Onboarding:** Metro-style QR decals on ambulances enable bystanders to initiate immediate booking via lightweight web/WhatsApp handoff.
6. **Clinical Pre-Alerts:** Stream vitals, ETA countdowns, and trauma triage notes to hospital emergency departments before arrival.

---

## 3. System Architecture & Scope (45-Hour Prototype)

| Layer | MVP Prototype Implementation | Production Target (Post-Eureka) |
|---|---|---|
| **Frontend UI** | React 18, Vite, Tailwind CSS, Lucide Icons, React Router | React Native Mobile App / Progressive Web App |
| **Maps & Routing** | Leaflet, OpenStreetMap, Simulated GPS Waypoint Engine | Mapbox / Google Maps Fleet Engine & Traffic APIs |
| **Corridor Logic** | Distance-based node state machine (`STANDBY`, `PREPARING`, `ACTIVE`, `PASSED`) | Municipal ATCS (Automated Traffic Control System) Integration |
| **Roadside Signage** | High-fidelity SVG/CSS LED Matrix & Gantry Simulators | MQTT / LoRaWAN / Cellular-V2X IoT Display Gateways |
| **Authentication** | Role-based simulated auth (Customer, Ambulance, Hospital, Admin) | JWT, OAuth2 & Phone OTP (Twilio / Firebase Auth) |
| **Rapid QR Flow** | Ambulance QR Decal scan $\rightarrow$ Demo session generator | WhatsApp Business Cloud API automated webhook |
| **Database** | Structured Mock Data Services (Ready for Node.js / SQLite / PostgreSQL) | PostgreSQL + PostGIS (Geospatial querying) + Redis |

---

## 4. User Roles & Capabilities
* **Customer / Patient / Attendant:** Quick SOS dispatch, clinical triage category, nearby ambulance selector, live journey tracker with corridor clearance indicators.
* **Ambulance Operator (Pilot):** Mobile cockpit, dispatch acceptance, real-time telemetry broadcaster, hospital route navigation, manual arrival trigger.
* **Hospital Emergency Department:** Trauma Bay monitor, incoming patient summary, real-time ETA countdown, ICU bed reservation, trauma team pre-assembly.
* **CorridorX Municipal Control Center:** City-wide command dashboard, active corridor monitoring, traffic gantry override, emergency fleet density map.

---

## 5. Functional Requirements (FR) Matrix
* **FR-01 (Authentication):** Role selection login for Customer, Ambulance, Hospital, and Municipal Admin.
* **FR-02 (Emergency Request):** Input form capturing patient name, contact number, emergency type, pickup location, and clinical notes.
* **FR-03 (Ambulance Selection):** Card-based comparison of nearby vehicles displaying registration, driver rating, equipment tags, and ETA.
* **FR-04 (Deferred Hospital Selection):** Support for *"Select Hospital Later"* to enable boarding prior to final facility determination.
* **FR-05 (Dynamic Corridor Propagation):** Automated calculation of vehicle distance to upcoming intersections:
  * $\text{Distance} > 1100\text{ m} \implies \text{STANDBY}$
  * $350\text{ m} < \text{Distance} \le 1100\text{ m} \implies \text{PREPARING}$
  * $\text{Distance} \le 350\text{ m} \implies \text{ACTIVE}$
  * $\text{Passed node} \implies \text{PASSED (Signals restored)}$
* **FR-06 (LED Board Control):** Dynamic rendering of overhead gantry boards and roadside matrix units with arrow directives and lane clearance alerts.
* **FR-07 (QR Rapid Access):** Decal scan flow generating lightweight guest sessions without upfront registration friction.

---

## 6. Verification & Demo Acceptance Criteria (Eureka! 2026)
1. Judges can follow a complete end-to-end journey from SOS dispatch $\rightarrow$ ambulance selection $\rightarrow$ hospital confirmation $\rightarrow$ green wave corridor tracking.
2. The corridor map visually demonstrates successive traffic junction nodes transitioning ahead of the moving vehicle.
3. Roadside LED displays immediately update their simulated messages and directional arrows in sync with the vehicle's progress.
4. Interactive simulation controls (Play, Pause, Step Forward, Speed Multipliers, Reset) allow hands-on evaluation during presentation judging.
