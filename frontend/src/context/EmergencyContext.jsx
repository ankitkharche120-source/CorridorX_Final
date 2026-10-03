import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { hasValidGoogleMapsKey } from '../services/googleMapsService';
import { socketService } from '../services/socketService';
import { hospitalService } from '../services/hospitalService';
import { ambulanceService } from '../services/ambulanceService';
import { corridorService } from '../services/corridorService';
import { DEMO_CONFIG } from '../data/demoConfig';
import { mockAmbulances } from '../data/mockAmbulances';
import { mockHospitals } from '../data/mockHospitals';
import { mockRouteNodes, mockEmergencyPathWaypoints } from '../data/mockRouteNodes';
import { mockDigitalBoards } from '../data/mockDigitalBoards';
import { mockTrips } from '../data/mockTrips';

const EmergencyContext = createContext();

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
    id: DEMO_CONFIG.ambulance.id,
    name: DEMO_CONFIG.ambulance.driverName,
    phone: DEMO_CONFIG.ambulance.driverPhone,
    vehicleNumber: DEMO_CONFIG.ambulance.vehicleNumber,
    rating: DEMO_CONFIG.ambulance.driverRating,
    agency: DEMO_CONFIG.ambulance.operatorAgency
  });

  // Real Device GPS (optional browser capability)
  const liveLocation = useLiveLocation({ enabled: true, highAccuracy: true });

  // -------------------------------------------------------------
  // SINGLE SOURCE OF TRUTH: activeTrip
  // -------------------------------------------------------------
  // Trip status lifecycle: 'IDLE' | 'REQUESTED' | 'DISPATCHED' | 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED'
  const [tripStatus, setTripStatus] = useState('IDLE');
  const [tripId, setTripId] = useState('TRIP-CX-8841');

  // 1. Pickup
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

  // 3. Ambulance
  const [selectedAmbulance, setSelectedAmbulance] = useState(mockAmbulances[0]);
  const [availableAmbulances, setAvailableAmbulances] = useState(mockAmbulances);

  // 4. Route & Corridor Waypoints
  const [activeWaypoints, setActiveWaypoints] = useState(mockEmergencyPathWaypoints);
  const [nodes, setNodes] = useState(mockRouteNodes);
  const [boards, setBoards] = useState(mockDigitalBoards);

  // 5. Total Route Metrics (Base calculated by route engine)
  const [routeDistanceTotalKm, setRouteDistanceTotalKm] = useState(2.8);
  const [routeEtaTotalMinutes, setRouteEtaTotalMinutes] = useState(6);

  // 6. Simulation & Telemetry State
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeedMultiplier, setSimulationSpeedMultiplier] = useState(1);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0); // 0 until moving

  const simulationTimerRef = useRef(null);

  // -------------------------------------------------------------
  // DERIVED CONSISTENT TRIP METRICS (Used across ALL screens)
  // -------------------------------------------------------------
  const isArrived = tripStatus === 'ARRIVED' || tripStatus === 'COMPLETED';
  const totalWaypoints = activeWaypoints.length;
  const progressRatio = totalWaypoints > 1 ? Math.min(1, simulationIndex / (totalWaypoints - 1)) : 0;

  // Single truth for Distance Remaining
  const distanceRemainingKm = isArrived
    ? 0
    : Math.max(0.1, +((routeDistanceTotalKm * (1 - progressRatio)).toFixed(1)));

  // Single truth for ETA Minutes
  const etaMinutes = isArrived
    ? 0
    : Math.max(1, Math.round(routeEtaTotalMinutes * (1 - progressRatio)));

  // Single truth for ETA Seconds
  const etaSeconds = isArrived ? 0 : etaMinutes * 60;

  // Current moving ambulance position
  const currentCoords = isArrived
    ? (activeWaypoints[activeWaypoints.length - 1] || { lat: selectedHospital.latitude, lng: selectedHospital.longitude })
    : (activeWaypoints[simulationIndex] || activeWaypoints[0]);

  // Active Map Center
  const activeCenter = pickup?.lat && pickup?.lng
    ? { lat: pickup.lat, lng: pickup.lng }
    : { lat: DEMO_CONFIG.pickup.lat, lng: DEMO_CONFIG.pickup.lng };

  // Helper Haversine distance calculator
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

  // -------------------------------------------------------------
  // RECALCULATE ROUTE & CORRIDOR BETWEEN PICKUP AND HOSPITAL
  // -------------------------------------------------------------
  const calculateAndApplyRoute = async (pickupLoc, hosp) => {
    if (!pickupLoc?.lat || !pickupLoc?.lng || !hosp) return;
    const hospLat = hosp.latitude || hosp.lat || 18.5020;
    const hospLng = hosp.longitude || hosp.lng || 73.8290;

    try {
      const data = await corridorService.computeRoute(
        { latitude: pickupLoc.lat, longitude: pickupLoc.lng },
        { latitude: hospLat, longitude: hospLng }
      );

      if (data.success && data.route) {
        const dist = +(data.route.distanceKm || 2.8);
        const eta = Math.max(1, Math.round(data.route.etaMinutes || 6));
        setRouteDistanceTotalKm(dist);
        setRouteEtaTotalMinutes(eta);

        if (Array.isArray(data.route.pathPoints) && data.route.pathPoints.length >= 2) {
          const mappedWaypoints = data.route.pathPoints.map(p => ({
            lat: p.latitude || p.lat,
            lng: p.longitude || p.lng
          }));
          setActiveWaypoints(mappedWaypoints);
          const dynNodes = corridorService.generateCorridorNodesFromRoute(mappedWaypoints, hosp.name);
          setNodes(dynNodes);
        }
      }
    } catch (err) {
      // Clean fallback using demo route if offline
      const dist = hosp.distanceKm || 2.8;
      const eta = hosp.etaMinutes || 6;
      setRouteDistanceTotalKm(dist);
      setRouteEtaTotalMinutes(eta);
      setActiveWaypoints(mockEmergencyPathWaypoints);
      setNodes(mockRouteNodes);
    }
  };

  // -------------------------------------------------------------
  // SET LOCATION HANDLER (Search or GPS)
  // -------------------------------------------------------------
  const setCustomLocation = async (loc) => {
    if (!loc) return;
    const lat = loc.lat ?? loc.latitude ?? DEMO_CONFIG.pickup.lat;
    const lng = loc.lng ?? loc.longitude ?? DEMO_CONFIG.pickup.lng;
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

    // 1. Fetch genuine nearby hospitals for this exact location
    try {
      const res = await hospitalService.getNearbyHospitals(lat, lng, 12);
      if (res.hospitals && res.hospitals.length > 0) {
        setNearbyHospitals(res.hospitals);
        setSelectedHospital(res.hospitals[0]);
        await calculateAndApplyRoute(newPickup, res.hospitals[0]);
      } else {
        // Keep consistent local hospitals with accurate distance calculation
        const recomputedMock = mockHospitals.map(h => {
          const d = calculateDistanceMeters(lat, lng, h.location.lat, h.location.lng) / 1000;
          return {
            ...h,
            distanceKm: +d.toFixed(1),
            etaMinutes: Math.max(2, Math.round(d * 2.1))
          };
        }).sort((a, b) => a.distanceKm - b.distanceKm);

        setNearbyHospitals(recomputedMock);
        setSelectedHospital(recomputedMock[0]);
        await calculateAndApplyRoute(newPickup, recomputedMock[0]);
      }
    } catch (err) {
      console.warn('[EmergencyContext] Hospital fetch failed:', err);
    }

    // 2. Position demo ambulance near this location
    try {
      const ambRes = await ambulanceService.getNearbyAmbulances(lat, lng, 20);
      if (ambRes.ambulances && ambRes.ambulances.length > 0) {
        setAvailableAmbulances(ambRes.ambulances);
        setSelectedAmbulance(ambRes.ambulances[0]);
      }
    } catch (aErr) {
      console.warn('[EmergencyContext] Ambulance fetch failed:', aErr);
    }
  };

  // -------------------------------------------------------------
  // CORRIDOR STATE MACHINE (Section 16, 17, 18, 19)
  // -------------------------------------------------------------
  const updateCorridorStateForPosition = (currIndex, arrivedFlag = false) => {
    if (!activeWaypoints || activeWaypoints.length === 0 || !nodes || nodes.length === 0) return;

    // SECTION 16: If arrived, ALL nodes must normalize to PASSED/NORMALIZED immediately!
    if (arrivedFlag || tripStatus === 'ARRIVED') {
      const allPassedNodes = nodes.map(node => ({
        ...node,
        status: 'PASSED',
        currentDistanceMeters: 0
      }));
      setNodes(allPassedNodes);

      setBoards(prevBoards => prevBoards.map(board => ({
        ...board,
        status: 'PASSED'
      })));
      return;
    }

    const ambPos = activeWaypoints[currIndex];
    if (!ambPos) return;

    const totalWps = activeWaypoints.length;
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

    setBoards(prevBoards => prevBoards.map(board => {
      const matching = updatedNodes.find(n => n.id === board.nodeId);
      return {
        ...board,
        status: matching ? matching.status : 'STANDBY'
      };
    }));
  };

  // -------------------------------------------------------------
  // SIMULATION EXECUTION LOOP
  // -------------------------------------------------------------
  useEffect(() => {
    if (isSimulating && activeWaypoints.length > 0) {
      simulationTimerRef.current = setInterval(() => {
        setSimulationIndex(prev => {
          if (prev < activeWaypoints.length - 1) {
            const nextIdx = prev + 1;
            updateCorridorStateForPosition(nextIdx, false);
            setCurrentSpeedKmh(Math.floor(45 + Math.random() * 15));
            return nextIdx;
          } else {
            // ARRIVAL AT HOSPITAL (Section 16)
            setIsSimulating(false);
            setTripStatus('ARRIVED');
            setCurrentSpeedKmh(0);
            updateCorridorStateForPosition(activeWaypoints.length - 1, true);
            return prev;
          }
        });
      }, 1900 / simulationSpeedMultiplier);
    } else {
      clearInterval(simulationTimerRef.current);
    }

    return () => clearInterval(simulationTimerRef.current);
  }, [isSimulating, simulationSpeedMultiplier, activeWaypoints.length]);

  // -------------------------------------------------------------
  // ACTIONS & CONTROLS
  // -------------------------------------------------------------
  const chooseHospital = (hosp) => {
    setSelectedHospital(hosp);
    setHospitalSelectionDeferred(false);
    calculateAndApplyRoute(pickup, hosp);
  };

  const chooseAmbulance = (amb) => {
    setSelectedAmbulance(amb);
  };

  const startEmergencyJourney = () => {
    setTripStatus('EN_ROUTE');
    setSimulationIndex(0);
    setCurrentSpeedKmh(48);
    setIsSimulating(true);
    updateCorridorStateForPosition(0, false);
  };

  const startSimulation = () => {
    if (tripStatus === 'ARRIVED') {
      setSimulationIndex(0);
      setTripStatus('EN_ROUTE');
      setCurrentSpeedKmh(48);
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
    setTripStatus('EN_ROUTE');
    setCurrentSpeedKmh(48);
    updateCorridorStateForPosition(0, false);
  };

  const stepForwardSimulation = () => {
    if (simulationIndex < activeWaypoints.length - 1) {
      const nextIdx = simulationIndex + 1;
      setSimulationIndex(nextIdx);
      setCurrentSpeedKmh(50);
      updateCorridorStateForPosition(nextIdx, false);
      if (nextIdx === activeWaypoints.length - 1) {
        setTripStatus('ARRIVED');
        setCurrentSpeedKmh(0);
        updateCorridorStateForPosition(nextIdx, true);
      }
    }
  };

  const handleArrival = () => {
    setTripStatus('ARRIVED');
    setIsSimulating(false);
    setCurrentSpeedKmh(0);
    setSimulationIndex(activeWaypoints.length - 1);
    updateCorridorStateForPosition(activeWaypoints.length - 1, true);
  };

  // Section 32: Reset entire demo cleanly back to Karvenagar
  const resetDemo = () => {
    setIsSimulating(false);
    clearInterval(simulationTimerRef.current);
    setTripStatus('IDLE');
    setSimulationIndex(0);
    setCurrentSpeedKmh(0);
    setPickup({
      name: DEMO_CONFIG.pickup.name,
      address: DEMO_CONFIG.pickup.address,
      lat: DEMO_CONFIG.pickup.lat,
      lng: DEMO_CONFIG.pickup.lng,
      shortTitle: DEMO_CONFIG.pickup.shortTitle,
      source: 'DEFAULT_DEMO'
    });
    setSelectedHospital(mockHospitals[0]);
    setNearbyHospitals(mockHospitals);
    setSelectedAmbulance(mockAmbulances[0]);
    setActiveWaypoints(mockEmergencyPathWaypoints);
    setNodes(mockRouteNodes);
    setBoards(mockDigitalBoards);
    setRouteDistanceTotalKm(2.8);
    setRouteEtaTotalMinutes(6);
  };

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

  const loginAsDriver = (unitId = DEMO_CONFIG.ambulance.id) => {
    sessionStorage.setItem('corridorx_auth', 'true');
    sessionStorage.setItem('corridorx_role', 'AMBULANCE');
    setCurrentUserRole('AMBULANCE');
    setIsAuthenticated(true);
    const amb = mockAmbulances.find(a => a.id === unitId) || mockAmbulances[0];
    setSelectedAmbulance(amb);
    setActiveDriver({
      id: amb.id,
      name: amb.driverName,
      phone: amb.driverPhone,
      vehicleNumber: amb.vehicleNumber,
      rating: amb.driverRating,
      agency: amb.operatorAgency
    });
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

  // Backward-compatible emergencyRequest adapter
  const emergencyRequest = {
    patientName: userName,
    contactNumber: userPhone,
    emergencyType: 'Chest Pain / Acute Cardiac Emergency',
    pickupLocation: pickup.name,
    pickupCoords: { lat: pickup.lat, lng: pickup.lng },
    shortTitle: pickup.shortTitle,
    notes: 'Urgent emergency dispatch. Priority corridor active.'
  };

  // Consolidated activeTrip object (Section 2)
  const activeTrip = {
    pickup,
    hospital: selectedHospital,
    ambulance: selectedAmbulance,
    distanceTotalKm: routeDistanceTotalKm,
    distanceRemainingKm,
    etaMinutes,
    etaSeconds,
    speedKmh: currentSpeedKmh,
    status: tripStatus,
    isArrived,
    isSimulating
  };

  return (
    <EmergencyContext.Provider
      value={{
        activeTrip,
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
        pickup,
        setCustomLocation,
        liveLocation,
        activeCenter,
        currentCoords,
        availableAmbulances,
        selectedAmbulance,
        chooseAmbulance,
        nearbyHospitals,
        setNearbyHospitals,
        selectedHospital,
        chooseHospital,
        hospitalSelectionDeferred,
        activeWaypoints,
        nodes,
        boards,
        tripStatus,
        setTripStatus,
        tripId,
        simulationIndex,
        isSimulating,
        startEmergencyJourney,
        startSimulation,
        pauseSimulation,
        resetSimulation,
        stepForwardSimulation,
        handleArrival,
        resetDemo,
        simulationSpeedMultiplier,
        setSimulationSpeedMultiplier,
        currentSpeedKmh,
        distanceRemainingKm,
        etaMinutes,
        etaSeconds,
        routeDistanceTotalKm,
        routeEtaTotalMinutes,
        calculatedRoute: {
          distanceKm: routeDistanceTotalKm,
          etaMinutes: routeEtaTotalMinutes
        },
        mockAmbulances,
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
