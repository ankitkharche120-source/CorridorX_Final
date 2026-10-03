import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { hasValidGoogleMapsKey } from '../services/googleMapsService';
import { socketService } from '../services/socketService';
import { DEMO_CONFIG } from '../data/demoConfig';
import { mockAmbulances } from '../data/mockAmbulances';
import { mockHospitals } from '../data/mockHospitals';
import { mockRouteNodes, mockEmergencyPathWaypoints } from '../data/mockRouteNodes';
import { mockDigitalBoards } from '../data/mockDigitalBoards';
import { mockTrips } from '../data/mockTrips';

const EmergencyContext = createContext();

export const EmergencyProvider = ({ children }) => {
  // Operating Mode: 'DEMO' as reliable default
  const [operatingMode, setOperatingMode] = useState('DEMO');
  const [mapEngine, setMapEngine] = useState(hasValidGoogleMapsKey() ? 'google' : 'leaflet');

  // Device GPS Hook (kept available without forcing reliance on it)
  const liveLocation = useLiveLocation({
    enabled: operatingMode === 'REAL',
    highAccuracy: true
  });

  // Authentication State: Session-persisted
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(sessionStorage.getItem('corridorx_auth'));
  });

  // Roles: 'CUSTOMER' | 'AMBULANCE' | 'HOSPITAL' | 'CONTROL_CENTER'
  const [currentUserRole, setCurrentUserRole] = useState(() => {
    return sessionStorage.getItem('corridorx_role') || 'CUSTOMER';
  });

  // User Profile Data
  const [userName, setUserName] = useState(() => sessionStorage.getItem('corridorx_user_name') || DEMO_CONFIG.patient.name);
  const [userPhone, setUserPhone] = useState(() => sessionStorage.getItem('corridorx_user_phone') || DEMO_CONFIG.patient.phone);

  // Driver state
  const [driverLocationMode, setDriverLocationMode] = useState('DEMO');
  const [driverDutyStatus, setDriverDutyStatus] = useState('ONLINE');
  const [activeDriver, setActiveDriver] = useState({
    id: DEMO_CONFIG.ambulance.id,
    name: DEMO_CONFIG.ambulance.driverName,
    phone: DEMO_CONFIG.ambulance.driverPhone,
    vehicleNumber: DEMO_CONFIG.ambulance.vehicleNumber,
    rating: DEMO_CONFIG.ambulance.driverRating,
    agency: DEMO_CONFIG.ambulance.operatorAgency
  });

  // Emergency Request State — Default to DEMO_CONFIG (Karvenagar, Pune)
  const [emergencyRequest, setEmergencyRequest] = useState({
    patientName: DEMO_CONFIG.patient.name,
    contactNumber: DEMO_CONFIG.patient.phone,
    emergencyType: DEMO_CONFIG.patient.emergencyType,
    pickupLocation: DEMO_CONFIG.pickup.name,
    pickupCoords: { lat: DEMO_CONFIG.pickup.lat, lng: DEMO_CONFIG.pickup.lng },
    shortTitle: DEMO_CONFIG.pickup.shortTitle,
    notes: 'Severe acute cardiac emergency. Demo corridor pre-emption test.',
    source: 'DEMO_STABLE'
  });

  // Ambulances & Hospitals from stable demo datasets
  const [availableAmbulances, setAvailableAmbulances] = useState(mockAmbulances);
  const [selectedAmbulance, setSelectedAmbulance] = useState(mockAmbulances[0]);

  const [nearbyHospitals, setNearbyHospitals] = useState(mockHospitals);
  const [selectedHospital, setSelectedHospital] = useState(mockHospitals[0]);
  const [hospitalSelectionDeferred, setHospitalSelectionDeferred] = useState(false);

  // Trip and Corridor Status: 'IDLE' | 'REQUESTED' | 'ASSIGNED' | 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED'
  const [tripStatus, setTripStatus] = useState('IDLE');
  const [tripId, setTripId] = useState('TRIP-CX-8841');

  // Corridor Waypoints, Nodes & Digital Boards
  const [activeWaypoints, setActiveWaypoints] = useState(mockEmergencyPathWaypoints);
  const [nodes, setNodes] = useState(mockRouteNodes);
  const [boards, setBoards] = useState(mockDigitalBoards);

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
  const activeCenter = emergencyRequest?.pickupCoords || { lat: DEMO_CONFIG.pickup.lat, lng: DEMO_CONFIG.pickup.lng };

  // Current moving ambulance position along demo waypoints
  const currentCoords = activeWaypoints[simulationIndex] || activeWaypoints[0];

  // Route metrics
  const totalWaypoints = activeWaypoints.length;
  const remainingWaypoints = Math.max(0, totalWaypoints - 1 - simulationIndex);
  const simDistanceKm = Math.max(0, +((remainingWaypoints * 0.22).toFixed(1)));
  const simEtaMinutes = Math.max(1, Math.ceil(simDistanceKm * 1.5));
  const simEtaSeconds = simDistanceKm === 0 ? 0 : simEtaMinutes * 60 - (simulationIndex % 4) * 12;

  const distanceRemainingKm = (operatingMode === 'REAL' && realDistanceRemainingKm !== null)
    ? realDistanceRemainingKm
    : simDistanceKm;

  const etaMinutes = (operatingMode === 'REAL' && realEtaMinutes !== null)
    ? realEtaMinutes
    : simEtaMinutes;

  const etaSeconds = (operatingMode === 'REAL' && realEtaSeconds !== null)
    ? realEtaSeconds
    : simEtaSeconds;

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

  // Synchronize Nodes and Digital Boards based on ambulance location
  const updateCorridorStateForPosition = (currIndex) => {
    const ambPos = activeWaypoints[currIndex];
    if (!ambPos) return;

    const nodeWaypointMap = {
      'NODE-01': 3,
      'NODE-02': 7,
      'NODE-03': 10,
      'NODE-04': 12,
      'NODE-05': 14
    };

    const updatedNodes = nodes.map(node => {
      const nodeWaypoint = nodeWaypointMap[node.id] ?? 0;
      const distance = calculateDistanceMeters(
        ambPos.lat, ambPos.lng,
        node.location.lat, node.location.lng
      );

      let status = 'STANDBY';
      if (currIndex > nodeWaypoint) {
        status = 'PASSED';
      } else if (distance <= 350 || currIndex === nodeWaypoint) {
        status = 'ACTIVE';
      } else if (distance <= 1100 || (nodeWaypoint - currIndex) <= 3) {
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

    // Update roadside digital boards matching corridor nodes
    setBoards(prevBoards => {
      return prevBoards.map(board => {
        const matchingNode = updatedNodes.find(n => n.id === board.nodeId);
        const boardStatus = matchingNode ? matchingNode.status : 'STANDBY';
        return {
          ...board,
          status: boardStatus
        };
      });
    });
  };

  // Run simulation loop
  useEffect(() => {
    if (isSimulating && activeWaypoints.length > 0) {
      simulationTimerRef.current = setInterval(() => {
        setSimulationIndex(prev => {
          if (prev < activeWaypoints.length - 1) {
            const nextIdx = prev + 1;
            updateCorridorStateForPosition(nextIdx);
            setCurrentSpeedKmh(Math.floor(48 + Math.random() * 18));
            return nextIdx;
          } else {
            setIsSimulating(false);
            setTripStatus('ARRIVED');
            setCurrentSpeedKmh(0);
            return prev;
          }
        });
      }, 1900 / simulationSpeedMultiplier);
    } else {
      clearInterval(simulationTimerRef.current);
    }

    return () => clearInterval(simulationTimerRef.current);
  }, [isSimulating, simulationSpeedMultiplier, activeWaypoints.length]);

  useEffect(() => {
    updateCorridorStateForPosition(simulationIndex);
  }, [simulationIndex]);

  // Set Custom Emergency Location (Keeps search support, falls back cleanly without breaking demo)
  const setCustomLocation = async (loc) => {
    if (!loc) return;
    const lat = loc.lat ?? loc.latitude ?? DEMO_CONFIG.pickup.lat;
    const lng = loc.lng ?? loc.longitude ?? DEMO_CONFIG.pickup.lng;
    const address = loc.formattedAddress || loc.address || loc.name || DEMO_CONFIG.pickup.name;
    const shortTitle = loc.shortTitle || loc.name || address.split(',')[0];

    setEmergencyRequest(prev => ({
      ...prev,
      pickupLocation: address,
      pickupCoords: { lat, lng },
      shortTitle,
      source: loc.source || 'SEARCH'
    }));
  };

  // Auth Handlers
  const loginAsCustomer = (name = DEMO_CONFIG.patient.name, phone = DEMO_CONFIG.patient.phone, emergency = DEMO_CONFIG.patient.emergencyType) => {
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
      emergencyType: emergency,
      pickupLocation: DEMO_CONFIG.pickup.name,
      pickupCoords: { lat: DEMO_CONFIG.pickup.lat, lng: DEMO_CONFIG.pickup.lng },
      shortTitle: DEMO_CONFIG.pickup.shortTitle
    }));
    // Reset to stable demo hospitals and ambulances
    setNearbyHospitals(mockHospitals);
    setSelectedHospital(mockHospitals[0]);
    setAvailableAmbulances(mockAmbulances);
    setSelectedAmbulance(mockAmbulances[0]);
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

  const loginAsHospital = (hospId = DEMO_CONFIG.hospital.id) => {
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

  const startSimulation = () => {
    if (tripStatus === 'ARRIVED') {
      setSimulationIndex(0);
      setTripStatus('EN_ROUTE');
    }
    setIsSimulating(true);
  };

  const pauseSimulation = () => setIsSimulating(false);

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
    setSimulationIndex(activeWaypoints.length - 1);
    updateCorridorStateForPosition(activeWaypoints.length - 1);
  };

  const chooseHospital = (hosp) => {
    setSelectedHospital(hosp);
    setHospitalSelectionDeferred(false);
    setTripStatus('HOSPITAL_SELECTED');
  };

  const chooseAmbulance = (amb) => {
    setSelectedAmbulance(amb);
    setTripStatus('AMBULANCE_SELECTED');
  };

  const deferHospitalSelection = () => {
    setHospitalSelectionDeferred(true);
    setTripStatus('AMBULANCE_SELECTED');
  };

  const submitEmergencyRequest = (data) => {
    setEmergencyRequest(prev => ({ ...prev, ...data }));
    setTripStatus('REQUESTED');
  };

  return (
    <EmergencyContext.Provider
      value={{
        isAuthenticated,
        currentUserRole,
        setCurrentUserRole,
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
        submitEmergencyRequest,
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
        deferHospitalSelection,
        calculatedRoute: {
          distanceKm: selectedHospital?.distanceKm || 2.8,
          etaMinutes: selectedHospital?.etaMinutes || 6,
          summary: 'Karvenagar → Nal Stop Flyover → Erandwane DP Road'
        },
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
        setMapEngine,
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
