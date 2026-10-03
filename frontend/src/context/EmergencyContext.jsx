import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { hasValidGoogleMapsKey } from '../services/googleMapsService';
import { socketService } from '../services/socketService';
import { hospitalService } from '../services/hospitalService';
import { ambulanceService } from '../services/ambulanceService';
import { corridorService } from '../services/corridorService';

const EmergencyContext = createContext();

// Neutral India Center (used when no user location or emergency pickup is active)
export const NEUTRAL_INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };
export const NEUTRAL_INDIA_ZOOM = 5;

export const EmergencyProvider = ({ children }) => {
  // Operating Mode: 'REAL' (Live GPS, Real APIs) vs 'DEMO'
  const [operatingMode, setOperatingMode] = useState('REAL');
  const [mapEngine, setMapEngine] = useState(hasValidGoogleMapsKey() ? 'google' : 'leaflet');

  // Real Device GPS Hook
  const liveLocation = useLiveLocation({
    enabled: operatingMode === 'REAL',
    highAccuracy: true
  });

  // Authentication State: Session-persisted for demo smoothness
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(sessionStorage.getItem('corridorx_auth'));
  });

  // Roles: 'CUSTOMER' | 'AMBULANCE' | 'HOSPITAL' | 'CONTROL_CENTER'
  const [currentUserRole, setCurrentUserRole] = useState(() => {
    return sessionStorage.getItem('corridorx_role') || 'CUSTOMER';
  });

  // User Profile Data (Section 2: Clearly labeled DEMO PROFILE)
  const [userName, setUserName] = useState(() => sessionStorage.getItem('corridorx_user_name') || 'Rahul Sharma');
  const [userPhone, setUserPhone] = useState(() => sessionStorage.getItem('corridorx_user_phone') || '9999999999');

  // Driver Location Mode: 'DEMO' | 'REAL_GPS'
  const [driverLocationMode, setDriverLocationMode] = useState('DEMO');
  const [driverDutyStatus, setDriverDutyStatus] = useState('ONLINE');
  const [activeDriver, setActiveDriver] = useState({
    id: 'AMB-102',
    name: 'Rajesh Shinde',
    phone: '+91 98220 14892',
    vehicleNumber: 'IND-EMS-102',
    rating: 4.9,
    agency: 'National Emergency Rapid Unit'
  });

  // Emergency Request State — NO hardcoded Karvenagar/Pune coordinates
  const [emergencyRequest, setEmergencyRequest] = useState({
    patientName: 'Rahul Sharma',
    contactNumber: '9999999999',
    emergencyType: 'Chest Pain / Acute Cardiac Emergency',
    pickupLocation: '',
    pickupCoords: null, // null until user clicks GPS, searches, or clicks map
    shortTitle: '',
    notes: 'Urgent emergency dispatch requested. Demo profile record.',
    source: null
  });

  // Nearby Available Ambulances (Generated dynamically around selected location)
  const [availableAmbulances, setAvailableAmbulances] = useState([]);
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);

  // Real Nearby Hospitals for selected location
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [hospitalSelectionDeferred, setHospitalSelectionDeferred] = useState(false);

  // Trip and Corridor Status: 'IDLE' | 'REQUESTED' | 'ASSIGNED' | 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED'
  const [tripStatus, setTripStatus] = useState('IDLE');
  const [tripId, setTripId] = useState('TRIP-CX-8841');

  // Real Route & Dynamic Corridor Waypoints
  const [calculatedRoute, setCalculatedRoute] = useState(null);
  const [activeWaypoints, setActiveWaypoints] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [boards, setBoards] = useState([]);

  // Simulation & Journey Metrics
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeedMultiplier, setSimulationSpeedMultiplier] = useState(1);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(48);
  const [goldenHourMinutesRemaining, setGoldenHourMinutesRemaining] = useState(52);

  const simulationTimerRef = useRef(null);

  // Streamed coordinates received from backend Socket.IO
  const [realStreamedCoords, setRealStreamedCoords] = useState(null);
  const [realDistanceRemainingKm, setRealDistanceRemainingKm] = useState(null);
  const [realEtaMinutes, setRealEtaMinutes] = useState(null);
  const [realEtaSeconds, setRealEtaSeconds] = useState(null);

  // Active Map Center
  // Priority: 1. Selected Emergency Pickup, 2. Live Device GPS, 3. Neutral India Center
  const activeCenter = emergencyRequest.pickupCoords
    ? emergencyRequest.pickupCoords
    : (liveLocation.location ? liveLocation.location : NEUTRAL_INDIA_CENTER);

  // Current moving ambulance position
  const currentCoords = (operatingMode === 'REAL' && currentUserRole === 'AMBULANCE' && driverLocationMode === 'REAL_GPS' && liveLocation.location)
    ? liveLocation.location
    : (activeWaypoints.length > 0
        ? (activeWaypoints[simulationIndex] || activeWaypoints[0])
        : (emergencyRequest.pickupCoords || NEUTRAL_INDIA_CENTER));

  // Dynamic remaining metrics
  const distanceRemainingKm = realDistanceRemainingKm !== null
    ? realDistanceRemainingKm
    : (calculatedRoute
        ? Math.max(0.1, +(calculatedRoute.distanceKm * (1 - (simulationIndex / Math.max(1, activeWaypoints.length - 1))))).toFixed(1)
        : 0);

  const etaMinutes = realEtaMinutes !== null
    ? realEtaMinutes
    : (calculatedRoute
        ? Math.max(1, Math.round(calculatedRoute.etaMinutes * (1 - (simulationIndex / Math.max(1, activeWaypoints.length - 1)))))
        : 0);

  const etaSeconds = realEtaSeconds !== null
    ? realEtaSeconds
    : etaMinutes * 60;

  // -------------------------------------------------------------
  // Dynamic Route & Corridor Re-computation on Location Changes
  // -------------------------------------------------------------
  const recomputeRouteAndCorridor = async (pickup, hosp) => {
    if (!pickup?.lat || !pickup?.lng || !hosp?.latitude || !hosp?.longitude) {
      return;
    }

    try {
      const data = await corridorService.computeRoute(
        { latitude: pickup.lat, longitude: pickup.lng },
        { latitude: hosp.latitude, longitude: hosp.longitude }
      );

      if (data.success && data.route) {
        setCalculatedRoute(data.route);

        let points = data.route.pathPoints;
        if (!points || points.length < 2) {
          points = [];
          for (let i = 0; i <= 14; i++) {
            const frac = i / 14;
            points.push({
              latitude: pickup.lat + (hosp.latitude - pickup.lat) * frac,
              longitude: pickup.lng + (hosp.longitude - pickup.lng) * frac
            });
          }
        }

        const waypoints = points.map(p => ({ lat: p.latitude, lng: p.longitude }));
        setActiveWaypoints(waypoints);
        setSimulationIndex(0);

        // Generate dynamic corridor nodes along the real road route
        const dynamicNodes = corridorService.generateCorridorNodesFromRoute(waypoints, hosp.name);
        setNodes(dynamicNodes);
      }
    } catch (err) {
      console.warn('[Corridor Engine] Route calculation error:', err);
    }
  };

  // -------------------------------------------------------------
  // Set Custom Emergency Location (Core Architecture - Section 3)
  // -------------------------------------------------------------
  const setCustomLocation = async (loc) => {
    if (!loc) return;
    const lat = loc.lat ?? loc.latitude;
    const lng = loc.lng ?? loc.longitude;
    if (!lat || !lng) return;

    const address = loc.formattedAddress || loc.address || loc.name || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    const shortTitle = loc.shortTitle || loc.name || address.split(',')[0];

    const updatedRequest = {
      ...emergencyRequest,
      pickupLocation: address,
      pickupCoords: { lat, lng },
      shortTitle,
      source: loc.source || 'USER_SELECTION'
    };
    setEmergencyRequest(updatedRequest);

    // 1. Fetch real nearby hospitals from the exact coordinates
    try {
      const hospData = await hospitalService.getNearbyHospitals(lat, lng, 10);
      setNearbyHospitals(hospData.hospitals);
      if (hospData.hospitals.length > 0) {
        const topHosp = hospData.hospitals[0];
        setSelectedHospital(topHosp);
        // 2. Compute real route to this hospital
        await recomputeRouteAndCorridor({ lat, lng }, topHosp);
      }
    } catch (hErr) {
      console.warn('[EmergencyContext] Failed to query hospitals for location:', hErr);
    }

    // 3. Generate location-aware demo ambulances around this area
    try {
      const ambData = await ambulanceService.getNearbyAmbulances(lat, lng, 25, emergencyRequest.emergencyType);
      setAvailableAmbulances(ambData.ambulances);
      if (ambData.ambulances.length > 0) {
        setSelectedAmbulance(ambData.ambulances[0]);
      }
    } catch (aErr) {
      console.warn('[EmergencyContext] Failed to generate local ambulances:', aErr);
    }
  };

  // Re-center to browser live GPS
  const recenterToGps = async () => {
    if (liveLocation.requestCurrentPosition) {
      liveLocation.requestCurrentPosition();
    }
    if (liveLocation.location?.lat && liveLocation.location?.lng) {
      await setCustomLocation({
        lat: liveLocation.location.lat,
        lng: liveLocation.location.lng,
        address: 'Live GPS Location',
        source: 'LIVE_DEVICE_GPS'
      });
    }
  };

  // Update corridor signal nodes status as ambulance moves along the route
  const updateCorridorStateForPosition = (currIndex) => {
    if (!activeWaypoints || activeWaypoints.length === 0 || !nodes || nodes.length === 0) return;

    const totalWaypoints = activeWaypoints.length;
    const step = Math.max(1, Math.floor(totalWaypoints / nodes.length));

    const updatedNodes = nodes.map((node, idx) => {
      const nodeWaypointIndex = Math.min(step * (idx + 1), totalWaypoints - 1);
      let status = 'STANDBY';

      if (currIndex > nodeWaypointIndex) {
        status = 'PASSED';
      } else if (currIndex === nodeWaypointIndex || Math.abs(currIndex - nodeWaypointIndex) <= 1) {
        status = 'ACTIVE';
      } else if (nodeWaypointIndex - currIndex <= 3) {
        status = 'PREPARING';
      } else {
        status = 'STANDBY';
      }

      return { ...node, status };
    });

    setNodes(updatedNodes);
  };

  // Simulation execution loop
  useEffect(() => {
    if (isSimulating && activeWaypoints.length > 0) {
      simulationTimerRef.current = setInterval(() => {
        setSimulationIndex(prev => {
          if (prev < activeWaypoints.length - 1) {
            const nextIdx = prev + 1;
            updateCorridorStateForPosition(nextIdx);
            setCurrentSpeedKmh(Math.floor(45 + Math.random() * 20));
            return nextIdx;
          } else {
            setIsSimulating(false);
            setTripStatus('ARRIVED');
            setCurrentSpeedKmh(0);
            return prev;
          }
        });
      }, 1800 / simulationSpeedMultiplier);
    } else {
      clearInterval(simulationTimerRef.current);
    }

    return () => clearInterval(simulationTimerRef.current);
  }, [isSimulating, simulationSpeedMultiplier, activeWaypoints.length]);

  // Socket.IO Room Subscriptions
  useEffect(() => {
    socketService.connect();
    if (tripId) socketService.joinTrip(tripId);
    if (selectedAmbulance?.id) socketService.joinAmbulance(selectedAmbulance.id);
    if (selectedHospital?.id) socketService.joinHospital(selectedHospital.id);

    const unsubLocation = socketService.onTripLocation((data) => {
      if (operatingMode === 'REAL' && data.latitude && data.longitude) {
        setRealStreamedCoords({ lat: data.latitude, lng: data.longitude });
        if (data.speed !== undefined) setCurrentSpeedKmh(data.speed);
      }
    });

    const unsubEta = socketService.onTripEta((data) => {
      if (operatingMode === 'REAL') {
        if (data.distanceKm !== undefined) setRealDistanceRemainingKm(data.distanceKm);
        if (data.etaMinutes !== undefined) setRealEtaMinutes(data.etaMinutes);
        if (data.etaSeconds !== undefined) setRealEtaSeconds(data.etaSeconds);
      }
    });

    const unsubStatus = socketService.onTripStatusChanged((data) => {
      if (data.status) setTripStatus(data.status);
    });

    return () => {
      unsubLocation();
      unsubEta();
      unsubStatus();
    };
  }, [tripId, selectedAmbulance?.id, selectedHospital?.id, operatingMode]);

  // Auth Handlers (Section 1)
  const loginAsCustomer = (name = 'Ankit Sharma', phone = '9999999999', emergency = 'Chest Pain / Acute Cardiac Emergency') => {
    sessionStorage.setItem('corridorx_auth', 'true');
    sessionStorage.setItem('corridorx_role', 'CUSTOMER');
    sessionStorage.setItem('corridorx_user_name', name);
    sessionStorage.setItem('corridorx_user_phone', phone);
    setCurrentUserRole('CUSTOMER');
    setIsAuthenticated(true);
    setUserName(name);
    setUserPhone(phone);
    setEmergencyRequest(prev => ({
      ...prev,
      patientName: name,
      contactNumber: phone,
      emergencyType: emergency
    }));
  };

  const loginAsDriver = (unitId = 'AMB-102') => {
    sessionStorage.setItem('corridorx_auth', 'true');
    sessionStorage.setItem('corridorx_role', 'AMBULANCE');
    setCurrentUserRole('AMBULANCE');
    setIsAuthenticated(true);
    setActiveDriver({
      id: unitId,
      name: 'Rajesh Shinde',
      phone: '+91 98220 14892',
      vehicleNumber: 'IND-EMS-102',
      rating: 4.9,
      agency: 'National Emergency Rapid Unit'
    });
  };

  const loginAsHospital = (hospId = 'HOSP-01') => {
    sessionStorage.setItem('corridorx_auth', 'true');
    sessionStorage.setItem('corridorx_role', 'HOSPITAL');
    setCurrentUserRole('HOSPITAL');
    setIsAuthenticated(true);
  };

  const loginAsControlCenter = () => {
    sessionStorage.setItem('corridorx_auth', 'true');
    sessionStorage.setItem('corridorx_role', 'CONTROL_CENTER');
    setCurrentUserRole('CONTROL_CENTER');
    setIsAuthenticated(true);
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

  // Journey Control Handlers
  const startEmergencyJourney = () => {
    setTripStatus('EN_ROUTE');
    setSimulationIndex(0);
    setIsSimulating(true);
  };

  const pauseSimulation = () => setIsSimulating(false);
  const startSimulation = () => setIsSimulating(true);

  const resetSimulation = () => {
    setIsSimulating(false);
    setSimulationIndex(0);
    setTripStatus('EN_ROUTE');
    setCurrentSpeedKmh(48);
    updateCorridorStateForPosition(0);
  };

  const stepForwardSimulation = () => {
    if (simulationIndex < activeWaypoints.length - 1) {
      const nextIdx = simulationIndex + 1;
      setSimulationIndex(nextIdx);
      updateCorridorStateForPosition(nextIdx);
      if (nextIdx === activeWaypoints.length - 1) {
        setTripStatus('ARRIVED');
        setCurrentSpeedKmh(0);
      }
    }
  };

  const handleArrival = () => {
    setTripStatus('ARRIVED');
    setIsSimulating(false);
    if (activeWaypoints.length > 0) {
      setSimulationIndex(activeWaypoints.length - 1);
      updateCorridorStateForPosition(activeWaypoints.length - 1);
    }
  };

  const chooseHospital = (hosp) => {
    setSelectedHospital(hosp);
    setHospitalSelectionDeferred(false);
    if (emergencyRequest.pickupCoords) {
      recomputeRouteAndCorridor(emergencyRequest.pickupCoords, hosp);
    }
  };

  const chooseAmbulance = (amb) => {
    setSelectedAmbulance(amb);
  };

  const deferHospitalSelection = () => {
    setHospitalSelectionDeferred(true);
  };

  return (
    <EmergencyContext.Provider
      value={{
        isAuthenticated,
        currentUserRole,
        loginAsCustomer,
        loginAsDriver,
        loginAsHospital,
        loginAsControlCenter,
        logout,
        userName,
        userPhone,
        driverLocationMode,
        setDriverLocationMode,
        driverDutyStatus,
        toggleDriverDuty,
        activeDriver,
        emergencyRequest,
        setEmergencyRequest,
        setCustomLocation,
        recenterToGps,
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
        deferHospitalSelection,
        calculatedRoute,
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
        simulationSpeedMultiplier,
        setSimulationSpeedMultiplier,
        currentSpeedKmh,
        distanceRemainingKm,
        etaMinutes,
        etaSeconds,
        goldenHourMinutesRemaining,
        operatingMode,
        setOperatingMode,
        mapEngine,
        setMapEngine
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
