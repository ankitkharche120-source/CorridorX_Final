import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { hasValidGoogleMapsKey } from '../services/googleMapsService';
import { hospitalService } from '../services/hospitalService';
import { corridorService } from '../services/corridorService';
import { DEMO_CONFIG } from '../data/demoConfig';
import { mockHospitals } from '../data/mockHospitals';
import { mockRouteNodes, mockEmergencyPathWaypoints } from '../data/mockRouteNodes';
import { mockDigitalBoards } from '../data/mockDigitalBoards';
import { mockTrips } from '../data/mockTrips';

const EmergencyContext = createContext();

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
  const [userName, setUserName] = useState(() => sessionStorage.getItem('corridorx_user_name') || DEMO_CONFIG.patient.name);
  const [userPhone, setUserPhone] = useState(() => sessionStorage.getItem('corridorx_user_phone') || DEMO_CONFIG.patient.phone);

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

  // 2. Hospital
  const [selectedHospital, setSelectedHospital] = useState(mockHospitals[0]);
  const [nearbyHospitals, setNearbyHospitals] = useState(mockHospitals);
  const [hospitalSelectionDeferred, setHospitalSelectionDeferred] = useState(false);

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

  // Backward-compatible unified values that contextually point to current stage
  const distanceRemainingKm = tripStage === 'PICKUP_STAGE' ? distanceToPickup : distanceToHospital;
  const etaMinutes = tripStage === 'PICKUP_STAGE' ? etaToPickup : etaToHospital;
  const etaSeconds = etaMinutes * 60;

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
  const calculateRouteToPickup = async (amb, pickupLoc) => {
    if (!amb || !pickupLoc) return;
    const origin = { latitude: amb.lat, longitude: amb.lng };
    const destination = { latitude: pickupLoc.lat, longitude: pickupLoc.lng };

    try {
      const data = await corridorService.computeRoute(origin, destination);
      if (data.success && data.route) {
        const dist = +(data.route.distanceKm || amb.distanceKm || 1.2);
        const eta = Math.max(1, Math.round(data.route.etaMinutes || amb.etaMinutes || 4));
        setDistanceToPickupTotal(dist);
        setEtaToPickupTotal(eta);

        if (Array.isArray(data.route.pathPoints) && data.route.pathPoints.length >= 2) {
          const mapped = data.route.pathPoints.map(p => ({
            lat: p.latitude || p.lat,
            lng: p.longitude || p.lng
          }));
          // CRITICAL: Guarantee route endpoints match ambulance at start and EXACT pickupLocation at end
          mapped[0] = { lat: amb.lat, lng: amb.lng };
          mapped[mapped.length - 1] = { lat: pickupLoc.lat, lng: pickupLoc.lng };
          setPickupWaypoints(mapped);
          if (tripStage === 'PICKUP_STAGE') {
            setActiveWaypoints(mapped);
          }
          return;
        }
      }
    } catch (err) {
      console.warn('[EmergencyContext] Pickup route API fallback:', err);
    }

    // High fidelity fallback path (endpoints strictly guaranteed)
    const fallbackPath = generateInterpolatedWaypoints(amb, pickupLoc, 22);
    fallbackPath[0] = { lat: amb.lat, lng: amb.lng };
    fallbackPath[fallbackPath.length - 1] = { lat: pickupLoc.lat, lng: pickupLoc.lng };
    setPickupWaypoints(fallbackPath);
    setDistanceToPickupTotal(amb.distanceKm || 1.2);
    setEtaToPickupTotal(amb.etaMinutes || 4);
    if (tripStage === 'PICKUP_STAGE') {
      setActiveWaypoints(fallbackPath);
    }
  };

  // Calculate Route 2: Pickup -> Hospital (origin = activeTrip.pickupLocation)
  const calculateRouteToHospital = async (pickupLoc, hosp) => {
    if (!pickupLoc?.lat || !pickupLoc?.lng || !hosp) return;
    const hospLat = hosp.latitude || hosp.lat || 18.5020;
    const hospLng = hosp.longitude || hosp.lng || 73.8290;

    try {
      const data = await corridorService.computeRoute(
        { latitude: pickupLoc.lat, longitude: pickupLoc.lng },
        { latitude: hospLat, longitude: hospLng }
      );

      if (data.success && data.route) {
        const dist = +(data.route.distanceKm || hosp.distanceKm || 2.8);
        const eta = Math.max(1, Math.round(data.route.etaMinutes || hosp.etaMinutes || 6));
        setDistanceToHospitalTotal(dist);
        setEtaToHospitalTotal(eta);

        if (Array.isArray(data.route.pathPoints) && data.route.pathPoints.length >= 2) {
          const mappedWaypoints = data.route.pathPoints.map(p => ({
            lat: p.latitude || p.lat,
            lng: p.longitude || p.lng
          }));
          // CRITICAL: Guarantee origin is exact pickupLocation and destination is exact hospital coordinates
          mappedWaypoints[0] = { lat: pickupLoc.lat, lng: pickupLoc.lng };
          mappedWaypoints[mappedWaypoints.length - 1] = { lat: hospLat, lng: hospLng };
          setHospitalWaypoints(mappedWaypoints);
          const dynNodes = corridorService.generateCorridorNodesFromRoute(mappedWaypoints, hosp.name);
          setNodes(dynNodes);
          if (tripStage === 'HOSPITAL_STAGE') {
            setActiveWaypoints(mappedWaypoints);
          }
          return;
        }
      }
    } catch (err) {
      console.warn('[EmergencyContext] Hospital route API fallback:', err);
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
    const dynNodes = corridorService.generateCorridorNodesFromRoute(fallbackHospPath, hosp.name);
    setNodes(dynNodes);
    if (tripStage === 'HOSPITAL_STAGE') {
      setActiveWaypoints(fallbackHospPath);
    }
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

    // 2. Fetch or recalculate nearby hospitals for this location
    let targetHosp = mockHospitals[0];
    try {
      const res = await hospitalService.getNearbyHospitals(lat, lng, 12);
      if (res.hospitals && res.hospitals.length > 0) {
        setNearbyHospitals(res.hospitals);
        targetHosp = res.hospitals[0];
        setSelectedHospital(res.hospitals[0]);
      } else {
        const recomputed = mockHospitals.map(h => {
          const d = calculateDistanceMeters(lat, lng, h.location.lat, h.location.lng) / 1000;
          return {
            ...h,
            distanceKm: +d.toFixed(1),
            etaMinutes: Math.max(2, Math.round(d * 2.1))
          };
        }).sort((a, b) => a.distanceKm - b.distanceKm);

        setNearbyHospitals(recomputed);
        targetHosp = recomputed[0];
        setSelectedHospital(recomputed[0]);
      }
    } catch (err) {
      console.warn('[EmergencyContext] Hospital fetch failed:', err);
    }

    // 3. Compute both routes for the new pickup location (exact zero drift)
    await calculateRouteToPickup(newAmbulances[0], newPickup);
    await calculateRouteToHospital(newPickup, targetHosp);
  };

  // -------------------------------------------------------------
  // CORRIDOR STATE MACHINE FOR STAGE 2
  // -------------------------------------------------------------
  const updateCorridorStateForPosition = (currIndex, arrivedFlag = false) => {
    if (tripStage !== 'HOSPITAL_STAGE') {
      // While in pickup phase, corridor is STANDBY. No green wave active.
      setCorridorStatus('STANDBY');
      setNodes(prev => prev.map(n => ({ ...n, status: 'STANDBY' })));
      return;
    }

    if (!hospitalWaypoints || hospitalWaypoints.length === 0 || !nodes || nodes.length === 0) return;

    if (arrivedFlag || tripStatus === 'ARRIVED_AT_HOSPITAL') {
      setCorridorStatus('RELEASED');
      const allPassed = nodes.map(node => ({
        ...node,
        status: 'PASSED',
        currentDistanceMeters: 0
      }));
      setNodes(allPassed);
      setBoards(prev => prev.map(b => ({ ...b, status: 'PASSED' })));
      return;
    }

    setCorridorStatus('ACTIVE');
    const ambPos = hospitalWaypoints[currIndex];
    if (!ambPos) return;

    const totalWps = hospitalWaypoints.length;
    const step = Math.max(1, Math.floor(totalWps / nodes.length));

    const updatedNodes = nodes.map((node, idx) => {
      const nodeWpIndex = Math.min(step * (idx + 1), totalWps - 1);
      const distance = calculateDistanceMeters(ambPos.lat, ambPos.lng, node.location.lat, node.location.lng);

      let status = 'STANDBY';
      if (currIndex > nodeWpIndex) {
        status = 'PASSED';
      } else if (distance <= 350 || currIndex === nodeWpIndex) {
        status = 'ACTIVE';
      } else if (distance <= 1100 || (nodeWpIndex - currIndex) <= 3) {
        status = 'PREPARING';
      } else {
        status = 'STANDBY';
      }

      return {
        ...node,
        status,
        currentDistanceMeters: Math.round(distance)
      };
    });

    setNodes(updatedNodes);
    setBoards(prev => prev.map(board => {
      const matching = updatedNodes.find(n => n.id === board.nodeId);
      return {
        ...board,
        status: matching ? matching.status : 'STANDBY'
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
          // Driving along pickupWaypoints to patient
          setSimulationIndex(prev => {
            if (prev < pickupWaypoints.length - 1) {
              const nextIdx = prev + 1;
              setCurrentSpeedKmh(Math.floor(40 + Math.random() * 12));
              return nextIdx;
            } else {
              // Reached pickup location!
              setIsSimulating(false);
              setTripStatus('ARRIVED_AT_PICKUP');
              setCurrentSpeedKmh(0);
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

  // STAGE 1 START: Dispatch ambulance to pickup location
  const startPickupJourney = () => {
    setTripStage('PICKUP_STAGE');
    setTripStatus('EN_ROUTE_TO_PICKUP');
    setCorridorStatus('STANDBY'); // No corridor yet
    setActiveWaypoints(pickupWaypoints);
    setSimulationIndex(0);
    setCurrentSpeedKmh(45);
    setIsSimulating(true);
  };

  const startEmergencyJourney = startPickupJourney;

  // STAGE 1 -> STAGE 2 TRANSITION: Patient Picked Up
  const handlePatientPickedUp = () => {
    setTripStatus('PATIENT_ONBOARD');
    setCorridorStatus('PREPARING');
    setCurrentSpeedKmh(0);
  };

  // STAGE 2 START: Ambulance travels to hospital + CorridorX activates!
  const startHospitalJourney = () => {
    setTripStage('HOSPITAL_STAGE');
    setTripStatus('EN_ROUTE_TO_HOSPITAL');
    setCorridorStatus('ACTIVE');
    setActiveWaypoints(hospitalWaypoints);
    setSimulationIndex(0);
    setCurrentSpeedKmh(50);
    setIsSimulating(true);
    updateCorridorStateForPosition(0, false);
  };

  // Simulation Controls
  const startSimulation = () => {
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
    sessionStorage.removeItem('corridorx_user_phone');
    setIsAuthenticated(false);
  };

  const toggleDriverDuty = () => {
    setDriverDutyStatus(prev => prev === 'ONLINE' ? 'OFFLINE' : 'ONLINE');
  };

  const emergencyRequest = {
    patientName: userName,
    contactNumber: userPhone,
    emergencyType: 'Chest Pain / Acute Cardiac Emergency',
    pickupLocation: pickupLocation.address,
    pickupCoords: { lat: pickupLocation.lat, lng: pickupLocation.lng },
    shortTitle: pickupLocation.shortTitle,
    notes: 'Urgent emergency dispatch. Priority corridor will activate after patient boarding.'
  };

  // Consolidated activeTrip object - SINGLE SOURCE OF TRUTH
  const activeTrip = {
    pickupLocation: {
      lat: pickupLocation.lat,
      lng: pickupLocation.lng,
      address: pickupLocation.address,
      name: pickupLocation.name
    },
    pickup: pickupLocation,
    selectedHospital: {
      id: selectedHospital?.id,
      name: selectedHospital?.name,
      address: selectedHospital?.address,
      lat: selectedHospital?.latitude || selectedHospital?.lat || 18.5020,
      lng: selectedHospital?.longitude || selectedHospital?.lng || 73.8290,
      distanceKm: selectedHospital?.distanceKm,
      etaMinutes: selectedHospital?.etaMinutes
    },
    hospital: selectedHospital,
    ambulance: {
      ...selectedAmbulance,
      currentLocation: currentCoords
    },
    phase: tripStatus,
    tripStage,
    tripStatus,
    corridorStatus,
    availableAmbulances,
    pickupRoute: pickupWaypoints,
    hospitalRoute: hospitalWaypoints,
    activeRoute: activeWaypoints,
    // Stage-specific Metrics
    etaToPickup,
    distanceToPickup,
    etaToHospital,
    distanceToHospital,
    distanceRemainingKm,
    etaMinutes,
    etaSeconds,
    speedKmh: currentSpeedKmh,
    isArrivedAtPickup,
    isPatientOnboard: tripStatus === 'PATIENT_ONBOARD',
    isArrivedAtHospital,
    isCompleted: isArrivedAtHospital,
    isSimulating
  };

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
