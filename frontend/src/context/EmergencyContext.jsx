import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { geoapifyService, hasGeoapifyKey } from '../services/geoapifyService';
import { hospitalService } from '../services/hospitalService';
import { corridorService } from '../services/corridorService';
import { DEMO_CONFIG } from '../data/demoConfig';
import { mockHospitals } from '../data/mockHospitals';
import { mockRouteNodes, mockEmergencyPathWaypoints } from '../data/mockRouteNodes';
import { mockDigitalBoards } from '../data/mockDigitalBoards';
import { mockTrips } from '../data/mockTrips';

const EmergencyContext = createContext();

const channel = new BroadcastChannel('corridorx_sync');

/**
 * Generate 3 deterministic demo ambulances relative to the pickup location anywhere in India
 * AMB-101: ~1.2 km away, ~4 min
 * AMB-102: ~1.8 km away, ~6 min
 * AMB-103: ~2.4 km away, ~8 min
 */
export const generateDemoAmbulances = (pickupLat, pickupLng) => {
  const baseLat = pickupLat || DEMO_CONFIG.pickup.lat;
  const baseLng = pickupLng || DEMO_CONFIG.pickup.lng;

  return [
    {
      id: 'AMB-101',
      name: 'ALS Mobile ICU 101',
      type: 'ALS Mobile ICU',
      vehicleNumber: 'MH 12 AB 1011',
      driverName: 'Vikram Jadhav',
      coPilotName: 'Rahul Kumar',
      driverPhone: '+91 98220 11011',
      driverRating: 4.9,
      distanceKm: 1.2,
      etaMinutes: 4,
      lat: +(baseLat + 0.0078).toFixed(6),
      lng: +(baseLng + 0.0068).toFixed(6),
      status: 'AVAILABLE',
      isDemoFleet: true,
      equipment: ['Cardiac Monitor', 'Transport Ventilator', 'Biphasic Defibrillator', 'Medical Oxygen']
    },
    {
      id: 'AMB-102',
      name: 'ALS Ambulance 102',
      type: 'ALS Ambulance',
      vehicleNumber: 'MH 12 QX 4521',
      driverName: 'Rajesh Shinde',
      coPilotName: 'Vikas Joshi',
      driverPhone: '+91 98220 14892',
      driverRating: 4.8,
      distanceKm: 1.8,
      etaMinutes: 6,
      lat: +(baseLat - 0.0112).toFixed(6),
      lng: +(baseLng + 0.0098).toFixed(6),
      status: 'AVAILABLE',
      isDemoFleet: true,
      equipment: ['Emergency Ventilator', 'Automated External Defibrillator', 'Oxygen Cylinder']
    },
    {
      id: 'AMB-103',
      name: 'BLS Basic Life Support 103',
      type: 'Basic Life Support',
      vehicleNumber: 'MH 12 TR 8832',
      driverName: 'Amit Deshmukh',
      coPilotName: 'Anil Pawar',
      driverPhone: '+91 98220 33103',
      driverRating: 4.7,
      distanceKm: 2.4,
      etaMinutes: 8,
      lat: +(baseLat + 0.0152).toFixed(6),
      lng: +(baseLng - 0.0128).toFixed(6),
      status: 'AVAILABLE',
      isDemoFleet: true,
      equipment: ['Continuous Oxygen Support', 'Trauma First Aid Kit', 'Spine Board Stretcher']
    }
  ];
};

/**
 * Generate regionally anchored nearby hospitals relative to any location across India
 * Supports real city hospitals for Pune, Mumbai, Delhi, Bengaluru, Chennai, Hyderabad, and generic Indian metros.
 */
export const generateCityHospitals = (lat, lng, address = '') => {
  const addrLower = (address || '').toLowerCase();
  
  let cityHospNames = [
    { name: 'Apex Trauma & Emergency Care Center', type: 'Level 1 Trauma' },
    { name: 'Super Speciality Medical Institute', type: 'Cardiac & Neuro Emergency' },
    { name: 'City Civil Hospital Emergency Wing', type: 'General Emergency' },
    { name: 'Metro Critical Care Trauma Bay', type: 'Multi-Speciality Emergency' }
  ];

  if (addrLower.includes('delhi') || (lat > 28 && lat < 29 && lng > 76.8 && lng < 77.5)) {
    cityHospNames = [
      { name: 'AIIMS Apex Trauma Center', type: 'Level 1 Trauma Center' },
      { name: 'Safdarjung Hospital Emergency Bay', type: 'Emergency Resuscitation' },
      { name: 'Max Super Speciality Emergency', type: 'Cardiac & Neuro Trauma' },
      { name: 'Sir Ganga Ram Hospital Trauma Wing', type: 'Multi-Speciality Emergency' }
    ];
  } else if (addrLower.includes('mumbai') || addrLower.includes('bandra') || (lat > 18.8 && lat < 19.3 && lng > 72.7 && lng < 73.1)) {
    cityHospNames = [
      { name: 'Lilavati Hospital & Research Centre', type: 'Cardiac & Polytrauma Emergency' },
      { name: 'Hinduja Healthcare Emergency Bay', type: 'Multi-Speciality Trauma' },
      { name: 'Kokilaben Dhirubhai Ambani Hospital', type: 'Level 1 Trauma & ICU' },
      { name: 'Nanavati Super Speciality Emergency', type: 'Critical Care Resuscitation' }
    ];
  } else if (addrLower.includes('bengaluru') || addrLower.includes('bangalore') || addrLower.includes('indiranagar') || (lat > 12.8 && lat < 13.2 && lng > 77.4 && lng < 77.8)) {
    cityHospNames = [
      { name: 'Manipal Hospital Emergency Department', type: 'Comprehensive Trauma Bay' },
      { name: 'Apollo Hospitals Emergency Care', type: 'Cardiac Resuscitation Center' },
      { name: 'Fortis Hospital Critical Care Wing', type: 'Level 1 Emergency Center' },
      { name: 'St. John’s Medical College Hospital', type: 'Trauma & Emergency Services' }
    ];
  } else if (addrLower.includes('chennai') || addrLower.includes('t nagar') || (lat > 12.9 && lat < 13.3 && lng > 80.1 && lng < 80.4)) {
    cityHospNames = [
      { name: 'Apollo Hospitals Greams Road Emergency', type: 'State Trauma Center' },
      { name: 'Kauvery Hospital Emergency Bay', type: 'Cardio-Pulmonary Trauma' },
      { name: 'Fortis Malar Emergency Department', type: 'Advanced Critical Care' },
      { name: 'MIOT International Trauma Center', type: 'Polytrauma & Emergency Wing' }
    ];
  } else if (addrLower.includes('hyderabad') || addrLower.includes('hitec') || (lat > 17.2 && lat < 17.6 && lng > 78.2 && lng < 78.6)) {
    cityHospNames = [
      { name: 'Apollo Health City Jubilee Hills', type: 'Level 1 Trauma Center' },
      { name: 'Yashoda Hospitals Emergency Wing', type: 'Critical Care & Resuscitation' },
      { name: 'Care Hospitals Hi-tech City Emergency', type: 'Cardiac & Neuro Trauma' },
      { name: 'KIMS Hospitals Emergency Bay', type: 'Polytrauma Center' }
    ];
  } else if (addrLower.includes('pune') || addrLower.includes('karvenagar') || addrLower.includes('kothrud') || (lat > 18.4 && lat < 18.7 && lng > 73.7 && lng < 74.0)) {
    cityHospNames = [
      { name: 'Deenanath Mangeshkar Hospital & Research Center', type: 'Advanced Trauma Bay' },
      { name: 'Sahyadri Super Speciality Hospital', type: 'Cardiac & Neuro Trauma' },
      { name: 'Ruby Hall Clinic Emergency Care', type: 'Multi-Speciality Critical Care' },
      { name: 'Poona Hospital & Research Centre', type: 'General Emergency Wing' }
    ];
  }

  const offsets = [
    { dLat: 0.0142, dLng: 0.0124, dist: 2.1, eta: 5 },
    { dLat: -0.0175, dLng: 0.0162, dist: 2.8, eta: 6 },
    { dLat: 0.0221, dLng: -0.0185, dist: 3.5, eta: 8 },
    { dLat: -0.0212, dLng: -0.0224, dist: 4.2, eta: 9 }
  ];

  return cityHospNames.map((item, idx) => {
    const off = offsets[idx % offsets.length];
    const hLat = +(lat + off.dLat).toFixed(6);
    const hLng = +(lng + off.dLng).toFixed(6);
    return {
      id: `HOSP-REG-${idx + 1}-${hLat}-${hLng}`,
      name: item.name,
      address: `${item.name}, ${address.split(',')[0] || 'District'}, India`,
      shortTitle: item.name.split(' ')[0] + ' ' + (item.name.split(' ')[1] || 'Hospital'),
      latitude: hLat,
      longitude: hLng,
      lat: hLat,
      lng: hLng,
      distanceKm: off.dist,
      etaMinutes: off.eta,
      specialty: item.type,
      emergencyContact: '+91 112',
      source: 'REGIONAL_TRAUMA_NETWORK'
    };
  });
};

/**
 * Generate smooth path coordinates between two locations with realistic curvature
 */
const generateInterpolatedWaypoints = (start, end, count = 22) => {
  if (!start || !end) return [];
  const sLat = start.lat ?? start.latitude;
  const sLng = start.lng ?? start.longitude;
  const eLat = end.lat ?? end.latitude;
  const eLng = end.lng ?? end.longitude;

  const points = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    // Slight sinusoidal lateral curve for road network feel
    const bend = Math.sin(t * Math.PI) * 0.0016;
    points.push({
      lat: +(sLat + (eLat - sLat) * t + bend).toFixed(6),
      lng: +(sLng + (eLng - sLng) * t + bend * 0.7).toFixed(6)
    });
  }
  return points;
};

// Haversine distance calculator
const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const EmergencyProvider = ({ children }) => {
  // Authentication State: Session-persisted
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(sessionStorage.getItem('corridorx_auth'));
  });

  // Roles: 'CUSTOMER' | 'AMBULANCE' | 'HOSPITAL' | 'CONTROL_CENTER'
  const [currentUserRole, setCurrentUserRole] = useState(() => {
    return sessionStorage.getItem('corridorx_role') || 'CUSTOMER';
  });

  // User Profile
  const [userName, setUserName] = useState(() => localStorage.getItem('corridorx_global_patient_name') || sessionStorage.getItem('corridorx_user_name') || DEMO_CONFIG.patient.name);
  const [userPhone, setUserPhone] = useState(() => sessionStorage.getItem('corridorx_user_phone') || DEMO_CONFIG.patient.phone);
  const [emergencyType, setEmergencyType] = useState('Chest Pain / Acute Cardiac Emergency');
  const [emergencyNotes, setEmergencyNotes] = useState('Urgent emergency dispatch. Priority corridor will activate after patient boarding.');

  // Driver state
  const [driverDutyStatus, setDriverDutyStatus] = useState('ONLINE');
  const [activeDriver, setActiveDriver] = useState({
    id: 'AMB-101',
    name: 'Vikram Jadhav',
    phone: '+91 98220 11011',
    vehicleNumber: 'MH 12 AB 1011',
    rating: 4.9,
    agency: 'CorridorX Emergency Medical Fleet'
  });

  // Real Device GPS (optional browser capability)
  const liveLocation = useLiveLocation({ enabled: true, highAccuracy: true });

  // -------------------------------------------------------------
  // TWO-STAGE TRIP STATE & LIFECYCLE
  // -------------------------------------------------------------
  // tripStage: 'PICKUP_STAGE' (Ambulance -> Pickup) | 'HOSPITAL_STAGE' (Pickup -> Hospital)
  const [tripStage, setTripStage] = useState('PICKUP_STAGE');

  // Explicit lifecycle states:
  // 'AVAILABLE' -> 'ASSIGNED' -> 'EN_ROUTE_TO_PICKUP' -> 'ARRIVED_AT_PICKUP' -> 'PATIENT_ONBOARD' -> 'EN_ROUTE_TO_HOSPITAL' -> 'ARRIVED_AT_HOSPITAL' (COMPLETED)
  const [tripStatus, setTripStatus] = useState('AVAILABLE');
  const [tripId, setTripId] = useState('TRIP-CX-8841');

  // Corridor Status: 'STANDBY' | 'AWAITING_PICKUP' | 'PREPARING' | 'ACTIVE' | 'RELEASED'
  const [corridorStatus, setCorridorStatus] = useState('STANDBY');

  // 1. Pickup Location
  const [pickup, setPickup] = useState({
    name: DEMO_CONFIG.pickup.name,
    address: DEMO_CONFIG.pickup.address,
    lat: DEMO_CONFIG.pickup.lat,
    lng: DEMO_CONFIG.pickup.lng,
    shortTitle: DEMO_CONFIG.pickup.shortTitle,
    source: 'DEFAULT_DEMO'
  });

  // 2. Hospital & Error States (Geoapify Integration - Section 6, 7 & 22)
  const [selectedHospital, setSelectedHospital] = useState(mockHospitals[0]);
  const [nearbyHospitals, setNearbyHospitals] = useState(mockHospitals);
  const [hospitalSelectionDeferred, setHospitalSelectionDeferred] = useState(false);
  const [isSearchingHospitals, setIsSearchingHospitals] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [hospitalError, setHospitalError] = useState(null);
  const [routeError, setRouteError] = useState(null);

  // 3. Demo Ambulances (3 relative units)
  const initialAmbulances = generateDemoAmbulances(DEMO_CONFIG.pickup.lat, DEMO_CONFIG.pickup.lng);
  const [availableAmbulances, setAvailableAmbulances] = useState(initialAmbulances);
  const [selectedAmbulance, setSelectedAmbulance] = useState(initialAmbulances[0]);

  // 4. Routes and Waypoints
  // Stage 1 Route: Ambulance -> Pickup
  const [pickupWaypoints, setPickupWaypoints] = useState(() => 
    generateInterpolatedWaypoints(
      { lat: initialAmbulances[0].lat, lng: initialAmbulances[0].lng },
      { lat: DEMO_CONFIG.pickup.lat, lng: DEMO_CONFIG.pickup.lng }
    )
  );
  const [distanceToPickupTotal, setDistanceToPickupTotal] = useState(initialAmbulances[0].distanceKm || 1.2);
  const [etaToPickupTotal, setEtaToPickupTotal] = useState(initialAmbulances[0].etaMinutes || 4);

  // Stage 2 Route: Pickup -> Hospital
  const [hospitalWaypoints, setHospitalWaypoints] = useState(mockEmergencyPathWaypoints);
  const [distanceToHospitalTotal, setDistanceToHospitalTotal] = useState(2.8);
  const [etaToHospitalTotal, setEtaToHospitalTotal] = useState(6);

  // Active Waypoints currently driving (switches between pickupWaypoints and hospitalWaypoints)
  const [activeWaypoints, setActiveWaypoints] = useState(pickupWaypoints);
  const [nodes, setNodes] = useState(mockRouteNodes);
  const [boards, setBoards] = useState(mockDigitalBoards);

  // 5. Simulation & Telemetry State
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeedMultiplier, setSimulationSpeedMultiplier] = useState(1);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);

  const simulationTimerRef = useRef(null);

  // -------------------------------------------------------------
  // SEPARATE & STRICT ETA / DISTANCE METRICS (Section 14)
  // -------------------------------------------------------------
  const isEnRouteToPickup = tripStatus === 'EN_ROUTE_TO_PICKUP';
  const isArrivedAtPickup = tripStatus === 'ARRIVED_AT_PICKUP' || tripStatus === 'PATIENT_ONBOARD';
  const isEnRouteToHospital = tripStatus === 'EN_ROUTE_TO_HOSPITAL';
  const isArrivedAtHospital = tripStatus === 'ARRIVED_AT_HOSPITAL' || tripStatus === 'COMPLETED' || tripStatus === 'ARRIVED';

  // Distance & ETA to Pickup
  const pickupTotalWps = pickupWaypoints.length;
  const pickupProgress = (tripStage === 'PICKUP_STAGE' && pickupTotalWps > 1) 
    ? Math.min(1, simulationIndex / (pickupTotalWps - 1)) 
    : (isArrivedAtPickup || tripStage === 'HOSPITAL_STAGE' ? 1 : 0);

  const distanceToPickup = (isArrivedAtPickup || tripStage === 'HOSPITAL_STAGE')
    ? 0
    : Math.max(0.1, +((distanceToPickupTotal * (1 - pickupProgress)).toFixed(1)));

  const etaToPickup = (isArrivedAtPickup || tripStage === 'HOSPITAL_STAGE')
    ? 0
    : Math.max(1, Math.round(etaToPickupTotal * (1 - pickupProgress)));

  // Distance & ETA to Hospital
  const hospitalTotalWps = hospitalWaypoints.length;
  const hospitalProgress = (tripStage === 'HOSPITAL_STAGE' && hospitalTotalWps > 1)
    ? Math.min(1, simulationIndex / (hospitalTotalWps - 1))
    : (isArrivedAtHospital ? 1 : 0);

  const distanceToHospital = isArrivedAtHospital
    ? 0
    : (tripStage === 'HOSPITAL_STAGE' 
        ? Math.max(0.1, +((distanceToHospitalTotal * (1 - hospitalProgress)).toFixed(1)))
        : distanceToHospitalTotal);

  const etaToHospital = isArrivedAtHospital
    ? 0
    : (tripStage === 'HOSPITAL_STAGE'
        ? Math.max(1, Math.round(etaToHospitalTotal * (1 - hospitalProgress)))
        : etaToHospitalTotal);

  // Backward-compatible unified values that contextually point to current stage (Zeroed on arrival)
  const distanceRemainingKm = isArrivedAtHospital ? 0 : (tripStage === 'PICKUP_STAGE' ? distanceToPickup : distanceToHospital);
  const etaMinutes = isArrivedAtHospital ? 0 : (tripStage === 'PICKUP_STAGE' ? etaToPickup : etaToHospital);
  const etaSeconds = isArrivedAtHospital ? 0 : etaMinutes * 60;

  // Single Source of Truth Pickup Location representation
  const pickupLocation = {
    lat: pickup.lat,
    lng: pickup.lng,
    address: pickup.address || pickup.name,
    name: pickup.name || pickup.address,
    shortTitle: pickup.shortTitle || (pickup.address || pickup.name).split(',')[0],
    source: pickup.source
  };

  // Current moving ambulance position
  const currentCoords = (() => {
    if (tripStage === 'PICKUP_STAGE') {
      if (isArrivedAtPickup || simulationIndex >= pickupWaypoints.length - 1) {
        return { lat: pickupLocation.lat, lng: pickupLocation.lng };
      }
      return pickupWaypoints[simulationIndex] || { lat: selectedAmbulance.lat, lng: selectedAmbulance.lng };
    } else {
      const hospLat = selectedHospital.latitude || selectedHospital.lat || 18.5020;
      const hospLng = selectedHospital.longitude || selectedHospital.lng || 73.8290;
      if (isArrivedAtHospital || simulationIndex >= hospitalWaypoints.length - 1) {
        return { lat: hospLat, lng: hospLng };
      }
      return hospitalWaypoints[simulationIndex] || { lat: pickupLocation.lat, lng: pickupLocation.lng };
    }
  })();

  // Active Map Center: Centered directly on single source of truth pickup
  const activeCenter = { lat: pickupLocation.lat, lng: pickupLocation.lng };

  // -------------------------------------------------------------
  // ROUTE CALCULATIONS FOR BOTH STAGES (STRICT ZERO-DRIFT ENDPOINTS)
  // -------------------------------------------------------------
  
  // Calculate Route 1: Ambulance -> Pickup (destination = activeTrip.pickupLocation)
  const calculateRouteToPickup = async (amb, pickupLoc, forceSet = false) => {
    if (!amb || !pickupLoc) return;
    setRouteError(null);
    const origin = { lat: amb.lat, lng: amb.lng };
    const destination = { lat: pickupLoc.lat, lng: pickupLoc.lng };

      try {
        const routeData = await geoapifyService.computeRoute(origin, destination);
        if (routeData && routeData.pathPoints && routeData.pathPoints.length >= 2) {
          setDistanceToPickupTotal(routeData.distanceKm);
          setEtaToPickupTotal(routeData.etaMinutes);
          setPickupWaypoints(routeData.pathPoints);
          const dynPickupNodes = corridorService.generateCorridorNodesFromRoute(
            routeData.pathPoints, 
            pickupLoc.shortTitle || pickupLoc.name || 'Patient Pickup', 
            1
          );
          if (forceSet || tripStage === 'PICKUP_STAGE') {
            setActiveWaypoints(routeData.pathPoints);
            setNodes(dynPickupNodes);
          }
          return;
        }
      } catch (err) {
      console.warn('[EmergencyContext] Pickup Geoapify route error:', err);
      setRouteError(`ROUTE CALCULATION FAILED: ${err.message || 'Ambulance to pickup route'}`);
    }

    // High fidelity fallback path (endpoints strictly guaranteed)
    const fallbackPath = generateInterpolatedWaypoints(amb, pickupLoc, 22);
    fallbackPath[0] = { lat: amb.lat, lng: amb.lng };
    fallbackPath[fallbackPath.length - 1] = { lat: pickupLoc.lat, lng: pickupLoc.lng };
    setPickupWaypoints(fallbackPath);
    setDistanceToPickupTotal(amb.distanceKm || 1.2);
    setEtaToPickupTotal(amb.etaMinutes || 4);
    const dynPickupNodes = corridorService.generateCorridorNodesFromRoute(
      fallbackPath, 
      pickupLoc.shortTitle || pickupLoc.name || 'Patient Pickup', 
      1
    );
    if (tripStage === 'PICKUP_STAGE') {
      setActiveWaypoints(fallbackPath);
      setNodes(dynPickupNodes);
    }
  };

  // Calculate Route 2: Pickup -> Hospital (origin = activeTrip.pickupLocation)
  const calculateRouteToHospital = async (pickupLoc, hosp) => {
    if (!pickupLoc?.lat || !pickupLoc?.lng || !hosp) return;
    const hospLat = hosp.latitude || hosp.lat || 18.5020;
    const hospLng = hosp.longitude || hosp.lng || 73.8290;
    setRouteError(null);

    try {
        const routeData = await geoapifyService.computeRoute(
          { lat: pickupLoc.lat, lng: pickupLoc.lng },
          { lat: hospLat, lng: hospLng }
        );

        if (routeData && routeData.pathPoints && routeData.pathPoints.length >= 2) {
          setDistanceToHospitalTotal(routeData.distanceKm);
          setEtaToHospitalTotal(routeData.etaMinutes);
          setHospitalWaypoints(routeData.pathPoints);
          const dynHospitalNodes = corridorService.generateCorridorNodesFromRoute(
            routeData.pathPoints, 
            hosp.name || 'Hospital Trauma Bay', 
            2
          );
          if (tripStage === 'HOSPITAL_STAGE') {
            setNodes(dynHospitalNodes);
            setActiveWaypoints(routeData.pathPoints);
          }
          return;
        }
    } catch (err) {
      console.warn('[EmergencyContext] Hospital Geoapify route error:', err);
      setRouteError(`ROUTE CALCULATION FAILED: ${err.message || 'Pickup to hospital route'}`);
    }

    const fallbackHospPath = generateInterpolatedWaypoints(
      { lat: pickupLoc.lat, lng: pickupLoc.lng },
      { lat: hospLat, lng: hospLng },
      25
    );
    fallbackHospPath[0] = { lat: pickupLoc.lat, lng: pickupLoc.lng };
    fallbackHospPath[fallbackHospPath.length - 1] = { lat: hospLat, lng: hospLng };
    setHospitalWaypoints(fallbackHospPath);
    setDistanceToHospitalTotal(hosp.distanceKm || 2.8);
    setEtaToHospitalTotal(hosp.etaMinutes || 6);
    const dynHospitalNodes = corridorService.generateCorridorNodesFromRoute(
      fallbackHospPath, 
      hosp.name || 'Hospital Trauma Bay', 
      2
    );
    if (tripStage === 'HOSPITAL_STAGE') {
      setNodes(dynHospitalNodes);
      setActiveWaypoints(fallbackHospPath);
    }
  };

  // Hospital search helper (clearing stale hospitals immediately)
  const fetchNearbyHospitals = async (lat, lng, address = '') => {
    setIsSearchingHospitals(true);
    setHospitalError(null);
    // SECTION 7: Clear previous hospitals immediately! Never retain hospitals from previous location
    setNearbyHospitals([]);
    setSelectedHospital(null);

    try {
      if (hasGeoapifyKey()) {
        const hospitals = await geoapifyService.searchNearbyHospitals(lat, lng, 12000);
        if (hospitals && hospitals.length > 0) {
          setNearbyHospitals(hospitals);
          setSelectedHospital(hospitals[0]);
          setIsSearchingHospitals(false);
          return hospitals[0];
        }
      }
    } catch (err) {
      console.warn('[EmergencyContext] Geoapify hospital search failed:', err);
      setHospitalError(`HOSPITAL SEARCH FAILED: ${err.message || 'Could not find hospitals'}`);
    }

    // Dynamic city-anchored regional trauma centers around the exact pickup location
    const localHospitals = generateCityHospitals(lat, lng, address);
    setNearbyHospitals(localHospitals);
    setSelectedHospital(localHospitals[0]);
    setIsSearchingHospitals(false);
    return localHospitals[0];
  };

  // -------------------------------------------------------------
  // SET LOCATION HANDLER (Search or GPS) - SINGLE SOURCE OF TRUTH
  // -------------------------------------------------------------
  const setCustomLocation = async (loc) => {
    if (!loc) return;
    const lat = +(loc.lat ?? loc.latitude ?? DEMO_CONFIG.pickup.lat);
    const lng = +(loc.lng ?? loc.longitude ?? DEMO_CONFIG.pickup.lng);
    const address = loc.formattedAddress || loc.address || loc.name || DEMO_CONFIG.pickup.name;
    const shortTitle = loc.shortTitle || loc.name || address.split(',')[0];

    const newPickup = {
      name: address,
      address,
      lat,
      lng,
      shortTitle,
      source: loc.source || 'USER_SEARCH'
    };
    setPickup(newPickup);
    setLocationError(null);

    // Stop existing simulation and reset state to Stage 1 Standby
    setIsSimulating(false);
    clearInterval(simulationTimerRef.current);
    setSimulationIndex(0);
    setCurrentSpeedKmh(0);
    setTripStage('PICKUP_STAGE');
    setTripStatus('AVAILABLE');
    setCorridorStatus('STANDBY');

    // 1. Generate 3 relative demo ambulances around this exact new pickup location
    const newAmbulances = generateDemoAmbulances(lat, lng);
    setAvailableAmbulances(newAmbulances);
    setSelectedAmbulance(newAmbulances[0]);

    // 2. Fetch or recalculate nearby hospitals for this location (immediate cache clear)
    const targetHosp = await fetchNearbyHospitals(lat, lng, address);

    // 3. Compute both routes for the new pickup location (exact zero drift)
    await calculateRouteToPickup(newAmbulances[0], newPickup);
    if (targetHosp) {
      await calculateRouteToHospital(newPickup, targetHosp);
    }
  };

  const retryHospitalSearch = () => {
    fetchNearbyHospitals(pickup.lat, pickup.lng, pickup.address || pickup.name);
  };

  const retryRouteCalculation = () => {
    setRouteError(null);
    calculateRouteToPickup(selectedAmbulance, pickup);
    if (selectedHospital) {
      calculateRouteToHospital(pickup, selectedHospital);
    }
  };

  // -------------------------------------------------------------
  // CORRIDOR STATE MACHINE FOR STAGE 2 (SMART-EVP ADAPTED)
  // States: UPCOMING -> PREPARING -> ACTIVE -> PASSED -> NORMALIZED
  // -------------------------------------------------------------
  // CORRIDOR STATE MACHINE (SMART-EVP ADAPTIVE JUNCTION ALGORITHM)
  // Evaluates Approach Bearing, Distance, Heading & ETA
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // CORRIDOR STATE MACHINE (SMART-EVP ADAPTIVE JUNCTION ALGORITHM)
  // Operates during BOTH Phase 1 (Ambulance -> Pickup) & Phase 2 (Pickup -> Hospital)
  // -------------------------------------------------------------
  const updateCorridorStateForPosition = (currIndex, arrivedFlag = false) => {
    if (!activeWaypoints || activeWaypoints.length === 0 || !nodes || nodes.length === 0) return;

    if (arrivedFlag && tripStage === 'HOSPITAL_STAGE') {
      // Reached final hospital trauma bay!
      setCorridorStatus('RELEASED');
      setCurrentSpeedKmh(0);
      const allNormalized = nodes.map(node => ({
        ...node,
        status: 'NORMALIZED',
        distanceFromAmbulance: 0,
        etaSeconds: 0
      }));
      setNodes(allNormalized);
      setBoards(prev => prev.map(b => ({ ...b, status: 'NORMALIZED' })));
      return;
    }

    if (arrivedFlag && tripStage === 'PICKUP_STAGE') {
      // Reached pickup location: do NOT release corridor, junctions normalize as passed
      setCorridorStatus('ACTIVE');
      setCurrentSpeedKmh(0);
      const ambPos = activeWaypoints[currIndex] || pickupLocation;
      const ambulanceTelemetry = {
        lat: ambPos.lat,
        lng: ambPos.lng,
        speedKmh: 0,
        heading: 0,
        currentIndex: currIndex,
        isArrivedAtHospital: false
      };
      const updatedNodes = corridorService.evaluateJunctionStates(nodes, ambulanceTelemetry, activeWaypoints);
      setNodes(updatedNodes);
      return;
    }

    // Active moving emergency corridor
    setCorridorStatus('ACTIVE');
    const ambPos = activeWaypoints[currIndex];
    if (!ambPos) return;

    // Calculate heading from current to next waypoint
    const nextWp = activeWaypoints[Math.min(currIndex + 1, activeWaypoints.length - 1)];
    const currentHeading = corridorService.calculateBearing(ambPos.lat, ambPos.lng, nextWp.lat, nextWp.lng);

    const ambulanceTelemetry = {
      lat: ambPos.lat,
      lng: ambPos.lng,
      speedKmh: currentSpeedKmh || (tripStage === 'PICKUP_STAGE' ? 44 : 50),
      heading: currentHeading,
      currentIndex: currIndex,
      isArrivedAtHospital: false
    };

    // Use Smart-EVP Adaptive Junction Algorithm against current active route
    const updatedNodes = corridorService.evaluateJunctionStates(nodes, ambulanceTelemetry, activeWaypoints);
    setNodes(updatedNodes);

    setBoards(prev => prev.map(board => {
      const matching = updatedNodes.find(n => n.id === board.nodeId || n.id === board.id);
      return {
        ...board,
        status: matching ? matching.status : 'UPCOMING'
      };
    }));
  };

  // -------------------------------------------------------------
  // SIMULATION EXECUTION LOOP (Handles Stage 1 then Stage 2)
  // -------------------------------------------------------------
  useEffect(() => {
    if (isSimulating) {
      simulationTimerRef.current = setInterval(() => {
        if (tripStage === 'PICKUP_STAGE') {
          // Driving along pickupWaypoints to patient with Corridor Active ahead of ambulance
          setSimulationIndex(prev => {
            if (prev < pickupWaypoints.length - 1) {
              const nextIdx = prev + 1;
              updateCorridorStateForPosition(nextIdx, false);
              setCurrentSpeedKmh(Math.floor(40 + Math.random() * 12));
              return nextIdx;
            } else {
              // Reached pickup location! Keep corridor ready for patient boarding
              setIsSimulating(false);
              setTripStatus('ARRIVED_AT_PICKUP');
              setCurrentSpeedKmh(0);
              updateCorridorStateForPosition(pickupWaypoints.length - 1, true);
              return prev;
            }
          });
        } else if (tripStage === 'HOSPITAL_STAGE') {
          // Driving along hospitalWaypoints with Corridor Active
          setSimulationIndex(prev => {
            if (prev < hospitalWaypoints.length - 1) {
              const nextIdx = prev + 1;
              updateCorridorStateForPosition(nextIdx, false);
              setCurrentSpeedKmh(Math.floor(48 + Math.random() * 14));
              return nextIdx;
            } else {
              // Reached hospital trauma bay!
              setIsSimulating(false);
              setTripStatus('ARRIVED_AT_HOSPITAL');
              setCorridorStatus('RELEASED');
              setCurrentSpeedKmh(0);
              updateCorridorStateForPosition(hospitalWaypoints.length - 1, true);
              return prev;
            }
          });
        }
      }, 1800 / simulationSpeedMultiplier);
    } else {
      clearInterval(simulationTimerRef.current);
    }

    return () => clearInterval(simulationTimerRef.current);
  }, [isSimulating, simulationSpeedMultiplier, tripStage, pickupWaypoints.length, hospitalWaypoints.length]);

  // -------------------------------------------------------------
  // AMBULANCE ASSIGNMENT ACTIONS (Section 4 & 5)
  // -------------------------------------------------------------
  
  // Manual selection
  const assignAmbulance = (amb) => {
    if (!amb) return;
    setSelectedAmbulance(amb);
    setActiveDriver({
      id: amb.id,
      name: amb.driverName,
      phone: amb.driverPhone,
      vehicleNumber: amb.vehicleNumber,
      rating: amb.driverRating,
      agency: amb.type
    });

    setAvailableAmbulances(prev => prev.map(a => ({
      ...a,
      status: a.id === amb.id ? 'ASSIGNED' : 'AVAILABLE'
    })));

    setTripStatus('ASSIGNED');
    calculateRouteToPickup(amb, pickup);
  };

  const chooseAmbulance = assignAmbulance;

  // Auto-assign nearest available ambulance
  const autoAssignNearestAmbulance = () => {
    const sorted = [...availableAmbulances].sort((a, b) => a.distanceKm - b.distanceKm);
    const nearest = sorted[0] || availableAmbulances[0];
    assignAmbulance(nearest);
  };

  // Hospital selection
  const chooseHospital = (hosp) => {
    setSelectedHospital(hosp);
    setHospitalSelectionDeferred(false);
    calculateRouteToHospital(pickup, hosp);
  };

  // -------------------------------------------------------------
  // STAGE TRANSITIONS & JOURNEY CONTROLS
  // -------------------------------------------------------------

  // STAGE 1 START: Dispatch ambulance to pickup location (CORRIDOR ACTIVATES IMMEDIATELY FOR AMBULANCE)
  const startPickupJourney = () => {
    channel.postMessage('START_PICKUP');
    startPickupJourneyLocal();
  };

  const startPickupJourneyLocal = () => {
    setTripStage('PICKUP_STAGE');
    setTripStatus('EN_ROUTE_TO_PICKUP');
    setCorridorStatus('ACTIVE'); // Active corridor created for the ambulance immediately!
    setActiveWaypoints(pickupWaypoints);
    setSimulationIndex(0);
    setCurrentSpeedKmh(45);
    setIsSimulating(true);
    // Initialize corridor junction evaluation for pickup route
    const dynPickupNodes = corridorService.generateCorridorNodesFromRoute(
      pickupWaypoints,
      pickup.shortTitle || pickup.name || 'Patient Pickup',
      1
    );
    setNodes(dynPickupNodes);
    updateCorridorStateForPosition(0, false);
  };

  const startEmergencyJourney = startPickupJourney;

  // STAGE 1 -> STAGE 2 TRANSITION: Patient Picked Up (CORRIDOR CONTINUES, DESTINATION BECOMES HOSPITAL)
  const handlePatientPickedUp = () => {
    channel.postMessage('PATIENT_PICKED_UP');
    handlePatientPickedUpLocal();
  };

  const handlePatientPickedUpLocal = () => {
    setTripStatus('PATIENT_ONBOARD');
    setCorridorStatus('ACTIVE'); // Corridor does NOT reset
    setCurrentSpeedKmh(0);
  };

  // STAGE 2 START: Ambulance travels to hospital + Corridor continues along hospital route
  const startHospitalJourney = () => {
    channel.postMessage('START_HOSPITAL');
    startHospitalJourneyLocal();
  };

  const startHospitalJourneyLocal = () => {
    setTripStage('HOSPITAL_STAGE');
    setTripStatus('EN_ROUTE_TO_HOSPITAL');
    setCorridorStatus('ACTIVE');
    setActiveWaypoints(hospitalWaypoints);
    setSimulationIndex(0);
    setCurrentSpeedKmh(50);
    setIsSimulating(true);
    // Generate Phase 2 hospital route junctions (J-05..J-08)
    const dynHospitalNodes = corridorService.generateCorridorNodesFromRoute(
      hospitalWaypoints,
      selectedHospital?.name || 'Hospital Trauma Bay',
      2
    );
    setNodes(dynHospitalNodes);
    updateCorridorStateForPosition(0, false);
  };

  // Simulation Controls
  const startSimulation = () => {
    channel.postMessage('START_SIM');
    startSimulationLocal();
  };
  
  const startSimulationLocal = () => {
    if (tripStatus === 'ARRIVED_AT_HOSPITAL') {
      startHospitalJourney();
      return;
    }
    if (tripStatus === 'ARRIVED_AT_PICKUP') {
      handlePatientPickedUp();
      return;
    }
    if (tripStatus === 'PATIENT_ONBOARD') {
      startHospitalJourney();
      return;
    }
    if (tripStatus === 'AVAILABLE' || tripStatus === 'ASSIGNED') {
      startPickupJourney();
      return;
    }
    setIsSimulating(true);
  };

  const pauseSimulation = () => {
    channel.postMessage('PAUSE_SIM');
    pauseSimulationLocal();
  };

  const pauseSimulationLocal = () => {
    setIsSimulating(false);
    setCurrentSpeedKmh(0);
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setSimulationIndex(0);
    if (tripStage === 'PICKUP_STAGE') {
      setTripStatus('EN_ROUTE_TO_PICKUP');
      setCurrentSpeedKmh(45);
    } else {
      setTripStatus('EN_ROUTE_TO_HOSPITAL');
      setCurrentSpeedKmh(50);
      updateCorridorStateForPosition(0, false);
    }
  };

  const stepForwardSimulation = () => {
    if (tripStage === 'PICKUP_STAGE') {
      if (simulationIndex < pickupWaypoints.length - 1) {
        const nextIdx = simulationIndex + 1;
        setSimulationIndex(nextIdx);
        setCurrentSpeedKmh(45);
        if (nextIdx === pickupWaypoints.length - 1) {
          setTripStatus('ARRIVED_AT_PICKUP');
          setCurrentSpeedKmh(0);
          setIsSimulating(false);
        }
      }
    } else {
      if (simulationIndex < hospitalWaypoints.length - 1) {
        const nextIdx = simulationIndex + 1;
        setSimulationIndex(nextIdx);
        setCurrentSpeedKmh(50);
        updateCorridorStateForPosition(nextIdx, false);
        if (nextIdx === hospitalWaypoints.length - 1) {
          setTripStatus('ARRIVED_AT_HOSPITAL');
          setCorridorStatus('RELEASED');
          setCurrentSpeedKmh(0);
          setIsSimulating(false);
          updateCorridorStateForPosition(nextIdx, true);
        }
      }
    }
  };

  const handleArrival = () => {
    if (tripStage === 'PICKUP_STAGE') {
      setTripStatus('ARRIVED_AT_PICKUP');
      setIsSimulating(false);
      setCurrentSpeedKmh(0);
      setSimulationIndex(pickupWaypoints.length - 1);
    } else {
      setTripStatus('ARRIVED_AT_HOSPITAL');
      setCorridorStatus('RELEASED');
      setIsSimulating(false);
      setCurrentSpeedKmh(0);
      setSimulationIndex(hospitalWaypoints.length - 1);
      updateCorridorStateForPosition(hospitalWaypoints.length - 1, true);
    }
  };

  // Section 21: Reset Demo cleanly back to initial state
  const resetDemo = () => {
    setIsSimulating(false);
    clearInterval(simulationTimerRef.current);
    setTripStage('PICKUP_STAGE');
    setTripStatus('AVAILABLE');
    setCorridorStatus('STANDBY');
    setSimulationIndex(0);
    setCurrentSpeedKmh(0);

    const defaultPickup = {
      name: DEMO_CONFIG.pickup.name,
      address: DEMO_CONFIG.pickup.address,
      lat: DEMO_CONFIG.pickup.lat,
      lng: DEMO_CONFIG.pickup.lng,
      shortTitle: DEMO_CONFIG.pickup.shortTitle,
      source: 'DEFAULT_DEMO'
    };
    setPickup(defaultPickup);

    const defaultAmbs = generateDemoAmbulances(DEMO_CONFIG.pickup.lat, DEMO_CONFIG.pickup.lng);
    setAvailableAmbulances(defaultAmbs);
    setSelectedAmbulance(defaultAmbs[0]);

    setSelectedHospital(mockHospitals[0]);
    setNearbyHospitals(mockHospitals);

    const defaultPickupWps = generateInterpolatedWaypoints(
      { lat: defaultAmbs[0].lat, lng: defaultAmbs[0].lng },
      { lat: defaultPickup.lat, lng: defaultPickup.lng }
    );
    setPickupWaypoints(defaultPickupWps);
    setActiveWaypoints(defaultPickupWps);
    setDistanceToPickupTotal(1.2);
    setEtaToPickupTotal(4);

    setHospitalWaypoints(mockEmergencyPathWaypoints);
    setDistanceToHospitalTotal(2.8);
    setEtaToHospitalTotal(6);

    setNodes(mockRouteNodes);
    setBoards(mockDigitalBoards);

    // Fetch accurate routes via OSRM to snap to road
    calculateRouteToPickup(defaultAmbs[0], defaultPickup, true);
    calculateRouteToHospital(defaultPickup, mockHospitals[0]);
  };

  // Initial calculation
  useEffect(() => {
    calculateRouteToPickup(selectedAmbulance, pickup);
    calculateRouteToHospital(pickup, selectedHospital);
  }, []);

  // Auth Handlers
  const loginAsCustomer = (name = DEMO_CONFIG.patient.name, phone = DEMO_CONFIG.patient.phone) => {
    sessionStorage.setItem('corridorx_auth', 'true');
    sessionStorage.setItem('corridorx_role', 'CUSTOMER');
    sessionStorage.setItem('corridorx_user_name', name);
    localStorage.setItem('corridorx_global_patient_name', name);
    sessionStorage.setItem('corridorx_user_phone', phone);
    setCurrentUserRole('CUSTOMER');
    setIsAuthenticated(true);
    setUserName(name);
    setUserPhone(phone);
    resetDemo();
  };

  const loginAsDriver = (unitId = 'AMB-101') => {
    sessionStorage.setItem('corridorx_auth', 'true');
    sessionStorage.setItem('corridorx_role', 'AMBULANCE');
    setCurrentUserRole('AMBULANCE');
    setIsAuthenticated(true);
    const amb = availableAmbulances.find(a => a.id === unitId) || availableAmbulances[0];
    assignAmbulance(amb);
  };

  const logout = () => {
    sessionStorage.removeItem('corridorx_auth');
    sessionStorage.removeItem('corridorx_role');
    sessionStorage.removeItem('corridorx_user_name');
    localStorage.removeItem('corridorx_global_patient_name');
    sessionStorage.removeItem('corridorx_user_phone');
    setIsAuthenticated(false);
  };

  const toggleDriverDuty = () => {
    setDriverDutyStatus(prev => prev === 'ONLINE' ? 'OFFLINE' : 'ONLINE');
  };

  const emergencyRequest = {
    patientName: userName,
    contactNumber: userPhone,
    emergencyType: emergencyType,
    pickupLocation: pickupLocation.address,
    pickupCoords: { lat: pickupLocation.lat, lng: pickupLocation.lng },
    shortTitle: pickupLocation.shortTitle,
    notes: emergencyNotes
  };

  const submitEmergencyRequest = (data) => {
    if (data.patientName) setUserName(data.patientName);
    if (data.patientPhone) setUserPhone(data.patientPhone);
    if (data.emergencyCategory) setEmergencyType(data.emergencyCategory);
    if (data.notes) setEmergencyNotes(data.notes);
    if (data.pickupLocation && data.pickupCoords) {
      setPickupLocation({
        lat: data.pickupCoords.lat,
        lng: data.pickupCoords.lng,
        address: data.pickupLocation,
        shortTitle: data.pickupLocation.split(',')[0],
        source: data.source || 'MANUAL'
      });
    }
  };

  // Route deviation detection (Smart-EVP Geofence concept)
  const deviationCheck = corridorService.checkRouteDeviation(currentCoords, activeWaypoints);
  const currentHeading = activeWaypoints.length > 1
    ? Math.round(corridorService.calculateBearing(
        currentCoords.lat,
        currentCoords.lng,
        (activeWaypoints[Math.min(simulationIndex + 1, activeWaypoints.length - 1)] || currentCoords).lat,
        (activeWaypoints[Math.min(simulationIndex + 1, activeWaypoints.length - 1)] || currentCoords).lng
      ))
    : 0;

  // Consolidated activeTrip object - SINGLE SOURCE OF TRUTH (Priority 1)
  const activeTrip = {
    tripId: tripId || 'TRIP-CX-8841',
    pickupLocation: {
      lat: pickupLocation.lat,
      lng: pickupLocation.lng,
      address: pickupLocation.address,
      name: pickupLocation.name
    },
    hospital: selectedHospital ? {
      ...selectedHospital,
      lat: selectedHospital.latitude || selectedHospital.lat,
      lng: selectedHospital.longitude || selectedHospital.lng
    } : null,
    selectedHospital: selectedHospital,
    selectedAmbulance: selectedAmbulance,
    ambulanceLocation: {
      lat: currentCoords.lat,
      lng: currentCoords.lng,
      speedKmh: isArrivedAtHospital ? 0 : currentSpeedKmh
    },
    ambulanceStatus: tripStatus,
    route: activeWaypoints,
    ETA: isArrivedAtHospital ? 0 : (tripStage === 'PICKUP_STAGE' ? etaToPickup : etaToHospital),
    distance: isArrivedAtHospital ? 0 : (tripStage === 'PICKUP_STAGE' ? distanceToPickup : distanceToHospital),
    tripPhase: tripStatus,
    corridorState: isArrivedAtHospital ? 'RELEASED' : (tripStage === 'HOSPITAL_STAGE' ? corridorStatus : 'STANDBY'),
    corridorNodes: nodes,
    routeDeviation: deviationCheck.status,
    isRouteDeviated: deviationCheck.isDeviated,
    deviationDistanceMeters: deviationCheck.minDistanceMeters,
    heading: currentHeading,
    corridor: isArrivedAtHospital ? 'RELEASED' : (tripStage === 'HOSPITAL_STAGE' ? corridorStatus : 'STANDBY'),
    junctions: nodes,
    // Supporting properties for backward compatibility
    pickup: pickupLocation,
    ambulance: {
      ...selectedAmbulance,
      currentLocation: currentCoords,
      heading: currentHeading,
      speedKmh: isArrivedAtHospital ? 0 : currentSpeedKmh
    },
    phase: tripStatus,
    tripStage,
    tripStatus,
    corridorStatus: isArrivedAtHospital ? 'RELEASED' : corridorStatus,
    availableAmbulances,
    pickupRoute: pickupWaypoints,
    hospitalRoute: hospitalWaypoints,
    activeRoute: activeWaypoints,
    etaToPickup: isArrivedAtPickup || tripStage === 'HOSPITAL_STAGE' ? 0 : etaToPickup,
    distanceToPickup: isArrivedAtPickup || tripStage === 'HOSPITAL_STAGE' ? 0 : distanceToPickup,
    etaToHospital: isArrivedAtHospital ? 0 : etaToHospital,
    distanceToHospital: isArrivedAtHospital ? 0 : distanceToHospital,
    distanceRemainingKm: isArrivedAtHospital ? 0 : distanceRemainingKm,
    etaMinutes: isArrivedAtHospital ? 0 : etaMinutes,
    etaSeconds: isArrivedAtHospital ? 0 : etaSeconds,
    speedKmh: isArrivedAtHospital ? 0 : currentSpeedKmh,
    isArrivedAtPickup,
    isPatientOnboard: tripStatus === 'PATIENT_ONBOARD',
    isArrivedAtHospital,
    isCompleted: isArrivedAtHospital,
    isSimulating
  };

  // Listen to BroadcastChannel for cross-tab sync!
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'corridorx_global_patient_name' && e.newValue) {
        setUserName(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const handleMessage = (e) => {
      const action = e.data;
      if (action === 'START_PICKUP') startPickupJourneyLocal();
      if (action === 'PATIENT_PICKED_UP') handlePatientPickedUpLocal();
      if (action === 'START_HOSPITAL') startHospitalJourneyLocal();
      if (action === 'START_SIM') startSimulationLocal();
      if (action === 'PAUSE_SIM') pauseSimulationLocal();
    };
    channel.addEventListener('message', handleMessage);
    return () => channel.removeEventListener('message', handleMessage);
  }, [
    pickupWaypoints, hospitalWaypoints, pickup, selectedHospital,
    startPickupJourneyLocal, handlePatientPickedUpLocal,
    startHospitalJourneyLocal, startSimulationLocal, pauseSimulationLocal
  ]);

  return (
    <EmergencyContext.Provider
      value={{
        activeTrip,
        tripStage,
        tripStatus,
        setTripStatus,
        corridorStatus,
        isAuthenticated,
        currentUserRole,
        loginAsCustomer,
        loginAsDriver,
        logout,
        userName,
        userPhone,
        driverDutyStatus,
        toggleDriverDuty,
        activeDriver,
        emergencyRequest,
        submitEmergencyRequest,
        pickupLocation,
        pickup,
        setCustomLocation,
        liveLocation,
        activeCenter,
        currentCoords,
        availableAmbulances,
        selectedAmbulance,
        assignAmbulance,
        chooseAmbulance,
        autoAssignNearestAmbulance,
        nearbyHospitals,
        setNearbyHospitals,
        selectedHospital,
        chooseHospital,
        hospitalSelectionDeferred,
        pickupWaypoints,
        hospitalWaypoints,
        activeWaypoints,
        nodes,
        boards,
        tripId,
        simulationIndex,
        isSimulating,
        startPickupJourney,
        startEmergencyJourney,
        handlePatientPickedUp,
        startHospitalJourney,
        startSimulation,
        pauseSimulation,
        resetSimulation,
        stepForwardSimulation,
        handleArrival,
        resetDemo,
        simulationSpeedMultiplier,
        setSimulationSpeedMultiplier,
        currentSpeedKmh,
        currentHeading,
        heading: currentHeading,
        routeDeviation: deviationCheck.status,
        isRouteDeviated: deviationCheck.isDeviated,
        deviationDistanceMeters: deviationCheck.minDistanceMeters,
        distanceToPickup,
        etaToPickup,
        distanceToHospital,
        etaToHospital,
        distanceRemainingKm,
        etaMinutes,
        etaSeconds,
        isArrivedAtPickup,
        isPatientOnboard: tripStatus === 'PATIENT_ONBOARD',
        isArrivedAtHospital,
        isArrived: isArrivedAtHospital,
        calculatedRoute: {
          distanceKm: distanceRemainingKm,
          etaMinutes: etaMinutes
        },
        locationError,
        hospitalError,
        routeError,
        isSearchingHospitals,
        retryHospitalSearch,
        retryRouteCalculation,
        hasGeoapifyKey: hasGeoapifyKey(),
        mockAmbulances: availableAmbulances,
        mockHospitals,
        mockTrips
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
};

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
};

export default EmergencyContext;


