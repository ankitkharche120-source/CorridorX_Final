# CorridorX - Implementation Checklist

This checklist tracks the requirements from the "Revised Product Requirements" PDF.

## 🔴 Phase 1: Patient Dashboard Corrections
- [x] 01 Remove Patient Picked Up / Patient Boarded action from CustomerDashboard.
- [x] 02 Remove patient-side arrival/boarding/hospital confirmation controls.
- [x] 03 Keep automatic status messages for ambulance arrival, boarding and hospital arrival.
- [x] 04 Add ambulance list/selection to patient flow.
- [x] 05 Add requested hospital selection to patient flow.

## 🟡 Phase 2: Ambulance Operator Dashboard Additions
- [x] 06 Add patient + emergency + pickup + hospital details to ambulance dashboard.
- [x] 07 Add driver Accept action.
- [x] 08 Add driver Reject action and rejection reason.
- [x] 09 Add driver arrival confirmation.
- [x] 10 Add driver Patient Boarded confirmation.
- [x] 11 Add driver hospital selection/change.
- [x] 12 Add driver hospital arrival/completion.

## 🟢 Phase 3: Core Architecture (Already Implemented)
- [x] 13 Use EmergencyContext as single source of truth.
- [x] 14 Ensure SimulationController updates that same state.
- [x] 15 Keep ambulance, pickup and hospital synchronized on map.
- [x] 16 Switch route from ambulance->pickup to pickup->hospital after boarding.
- [x] 17 Keep Green Wave active across both legs.
- [x] 18 Tie junction nodes to actual route geometry.
- [x] 19 Normalize Green Wave after hospital arrival.
- [x] 20 Do not replace current OSRM/Geoapify/Leaflet/OSM architecture unless separately requested.
