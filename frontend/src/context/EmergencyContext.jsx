import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { hasValidGoogleMapsKey } from '../services/googleMapsService';
import { socketService } from '../services/socketService';
import { mockAmbulances } from '../data/mockAmbulances';
import { mockHospitals } from '../data/mockHospitals';
import { mockRouteNodes, mockEmergencyPathWaypoints } from '../data/mockRouteNodes';
import { mockDigitalBoards } from '../data/mockDigitalBoards';
import { mockTrips } from '../data/mockTrips';

const EmergencyContext = createContext();

export const EmergencyProvider = ({ children }) => {
  // Operating Mode: 'REAL' (Live GPS, Real APIs) vs 'DEMO' (Offline Pitch Simulation)
  const [operatingMode, setOperatingMode] = useState('REAL');
  const [mapEngine, setMapEngine] = useState(hasValidGoogleMapsKey() ? 'google' : 'leaflet');

  // Real Device GPS Hook
  const liveLocation = useLiveLocation({
    enabled: operatingMode === 'REAL',
    highAccuracy: true
  });

  // Authentication & Role State: 'CUSTOMER' | 'AMBULANCE'
  const [currentUserRole, setCurrentUserRole] = useState('CUSTOMER');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userName, setUserName] = useState('Rahul Sharma');
  const [userPhone, setUserPhone] = useState('+91 98765 43210');
  
  // Driver-specific state
  const [driverDutyStatus, setDriverDutyStatus] = useState('ONLINE'); // 'ONLINE' | 'BUSY' | 'OFFLINE'
  const [activeDriver, setActiveDriver] = useState({
    id: 'AMB-102',
    name: 'Rajesh Shinde',
    phone: '+91 98220 14892',
    vehicleNumber: 'MH 12 QX 4521',
    rating: 4.9,
    agency: 'Pune Emergency Medical Services (EMS)'
  });

  // Emergency Request Data (Consumer)
  const [emergencyRequest, setEmergencyRequest] = useState({
    patientName: 'Rahul Sharma',
    contactNumber: '+91 98765 43210',
    emergencyType: 'Chest Pain / Acute STEMI',
    pickupLocation: 'Paud Road, Near Kothrud Stand, Pune',
    pickupCoords: { lat: 18.5074, lng: 73.8065 },
    notes: 'Severe chest tightness radiating to left arm. Patient is conscious.',
    isGuestQR: false
  });

  // Selected Entities
  const [selectedAmbulance, setSelectedAmbulance] = useState(mockAmbulances[0]);
  const [selectedHospital, setSelectedHospital] = useState(mockHospitals[0]);
  const [hospitalSelectionDeferred, setHospitalSelectionDeferred] = useState(false);

  // Journey & Trip Status: 'IDLE' | 'REQUESTED' | 'ASSIGNED' | 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED'
  const [tripStatus, setTripStatus] = useState('EN_ROUTE');
  const [tripId, setTripId] = useState('TRIP-CX-8841');

  // Corridor & Digital Board Dynamic States
  const [nodes, setNodes] = useState(mockRouteNodes);
  const [boards, setBoards] = useState(mockDigitalBoards);
  const [activeWaypoints, setActiveWaypoints] = useState(mockEmergencyPathWaypoints);
  const [calculatedRoute, setCalculatedRoute] = useState(null);

  // Simulation Engine State
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeedMultiplier, setSimulationSpeedMultiplier] = useState(1);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(54);
  const [goldenHourMinutesRemaining, setGoldenHourMinutesRemaining] = useState(48);

  const simulationTimerRef = useRef(null);

  // Streamed coordinates received from backend Socket.IO
  const [realStreamedCoords, setRealStreamedCoords] = useState(null);
  const [realDistanceRemainingKm, setRealDistanceRemainingKm] = useState(null);
  const [realEtaMinutes, setRealEtaMinutes] = useState(null);
  const [realEtaSeconds, setRealEtaSeconds] = useState(null);

  // Current GPS coordinates of ambulance (Real Stream vs Local Driver GPS vs Simulation Waypoints)
  const currentCoords = (operatingMode === 'REAL')
    ? (currentUserRole === 'AMBULANCE' 
        ? (liveLocation.location || realStreamedCoords || activeWaypoints[0])
        : (realStreamedCoords || activeWaypoints[simulationIndex] || activeWaypoints[0]))
    : (activeWaypoints[simulationIndex] || activeWaypoints[0]);

  // Dynamically compute emergency corridor route and junctions anywhere in India
  useEffect(() => {
    const pLat = emergencyRequest.pickupCoords?.lat || 18.5175;
    const pLng = emergencyRequest.pickupCoords?.lng || 73.8401;
    const hLat = selectedHospital?.latitude || 18.5020;
    const hLng = selectedHospital?.longitude || 73.8290;

    const updateDynamicRouteAndNodes = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/routes/emergency-route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: { latitude: pLat, longitude: pLng },
            destination: { latitude: hLat, longitude: hLng }
          })
        });

        const data = await res.json();
        if (data.success && data.route) {
          setCalculatedRoute(data.route);

          let points = data.route.pathPoints;
          if (!points || points.length < 2) {
            points = [];
            for (let i = 0; i <= 14; i++) {
              const frac = i / 14;
              points.push({
                latitude: pLat + (hLat - pLat) * frac,
                longitude: pLng + (hLng - pLng) * frac
              });
            }
          }

          const waypoints = points.map(p => ({ lat: p.latitude, lng: p.longitude }));
          setActiveWaypoints(waypoints);

          // Dynamically situate 4 corridor junction nodes along this route in the active Indian city
          const step = Math.max(1, Math.floor(waypoints.length / 4));
          const dynamicNodes = [
            {
              id: 'NODE-01',
              sequence: 1,
              name: 'Corridor Primary Entry Junction',
              location: waypoints[Math.min(step, waypoints.length - 1)],
              status: 'ACTIVE',
              traffic_density: 'HEAVY (Peak Congestion)',
              large_board_id: 'BOARD-L-01',
              small_board_id: 'BOARD-S-01'
            },
            {
              id: 'NODE-02',
              sequence: 2,
              name: 'Central Express Corridor Intersection',
              location: waypoints[Math.min(step * 2, waypoints.length - 1)],
              status: 'PREPARING',
              traffic_density: 'CRITICAL (Bumper to Bumper)',
              large_board_id: 'BOARD-L-02',
              small_board_id: 'BOARD-S-02'
            },
            {
              id: 'NODE-03',
              sequence: 3,
              name: 'Hospital Arterial Crossing',
              location: waypoints[Math.min(step * 3, waypoints.length - 1)],
              status: 'STANDBY',
              traffic_density: 'MODERATE (Preempted)',
              large_board_id: 'BOARD-L-03',
              small_board_id: 'BOARD-S-03'
            },
            {
              id: 'NODE-04',
              sequence: 4,
              name: `${selectedHospital?.name || 'Trauma Bay'} Emergency Gate`,
              location: waypoints[waypoints.length - 1],
              status: 'STANDBY',
              traffic_density: 'CLEAR (Emergency Lane Reserved)',
              large_board_id: 'BOARD-L-04',
              small_board_id: 'BOARD-S-04'
            }
          ];

          setNodes(dynamicNodes);
        }
      } catch (err) {
        console.warn('Failed to calculate dynamic corridor route:', err);
      }
    };

    updateDynamicRouteAndNodes();
  }, [
    emergencyRequest.pickupCoords?.lat,
    emergencyRequest.pickupCoords?.lng,
    selectedHospital?.latitude,
    selectedHospital?.longitude,
    selectedHospital?.name
  ]);

  // Automatically update pickup coordinates with real GPS if in REAL mode for customer
  useEffect(() => {
    if (operatingMode === 'REAL' && currentUserRole === 'CUSTOMER' && liveLocation.location) {
      setEmergencyRequest(prev => {
        if (prev.pickupLocation.includes('Paud Road') || prev.pickupLocation.includes('Live Device GPS')) {
          return {
            ...prev,
            pickupLocation: `Live Device GPS (±${Math.round(liveLocation.accuracy || 10)}m)`,
            pickupCoords: liveLocation.location
          };
        }
        return prev;
      });
    }
  }, [operatingMode, currentUserRole, liveLocation.location, liveLocation.accuracy]);

  // Socket.IO Room Subscriptions & Event Handlers
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

    const unsubCorridor = socketService.onCorridorUpdate((data) => {
      if (data.nodes && Array.isArray(data.nodes)) {
        setNodes(data.nodes.map(n => ({
          ...n,
          location: { lat: n.latitude, lng: n.longitude },
          currentDistanceMeters: n.distanceMeters || 0
        })));
      }
      if (data.boards && Array.isArray(data.boards)) {
        setBoards(data.boards);
      }
    });

    return () => {
      unsubLocation();
      unsubEta();
      unsubStatus();
      unsubCorridor();
    };
  }, [tripId, selectedAmbulance?.id, selectedHospital?.id, operatingMode]);

  // Throttled Ambulance GPS Telemetry Broadcaster (For Driver in REAL MODE)
  const lastTelemetrySentRef = useRef(0);
  useEffect(() => {
    if (
      operatingMode === 'REAL' &&
      currentUserRole === 'AMBULANCE' &&
      driverDutyStatus === 'ONLINE' &&
      liveLocation.location
    ) {
      const now = Date.now();
      if (now - lastTelemetrySentRef.current >= 2500) {
        lastTelemetrySentRef.current = now;
        socketService.sendAmbulanceTelemetry({
          ambulanceId: selectedAmbulance?.id || 'AMB-102',
          tripId,
          latitude: liveLocation.location.lat,
          longitude: liveLocation.location.lng,
          accuracy: liveLocation.accuracy,
          heading: liveLocation.heading,
          speed: liveLocation.speed || currentSpeedKmh,
          timestamp: now
        });
      }
    }
  }, [
    operatingMode,
    currentUserRole,
    driverDutyStatus,
    liveLocation.location,
    liveLocation.speed,
    liveLocation.accuracy,
    tripId,
    selectedAmbulance?.id,
    currentSpeedKmh
  ]);

  // Route metrics (Simulation calculations vs Real calculations)
  const totalWaypoints = activeWaypoints.length;
  const remainingWaypoints = Math.max(0, totalWaypoints - 1 - simulationIndex);
  const simDistanceKm = Math.max(0, +((remainingWaypoints * 0.23).toFixed(1)));
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

  // Synchronize Nodes and Boards based on ambulance location
  const updateCorridorStateForPosition = (currIndex) => {
    const ambPos = activeWaypoints[currIndex];
    if (!ambPos) return;

    const total = activeWaypoints.length;
    const step = Math.max(1, Math.floor(total / 4));
    const nodeWaypointMap = {
      'NODE-01': step,
      'NODE-02': step * 2,
      'NODE-03': step * 3,
      'NODE-04': total - 1
    };

    const updatedNodes = nodes.map(node => {
      const nodeWaypoint = nodeWaypointMap[node.id] || 0;
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
    if (isSimulating) {
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
      }, 2000 / simulationSpeedMultiplier);
    } else {
      clearInterval(simulationTimerRef.current);
    }

    return () => clearInterval(simulationTimerRef.current);
  }, [isSimulating, simulationSpeedMultiplier]);

  useEffect(() => {
    updateCorridorStateForPosition(simulationIndex);
  }, [simulationIndex]);

  // Auth Functions
  const loginAsCustomer = (name, phone) => {
    setCurrentUserRole('CUSTOMER');
    setIsAuthenticated(true);
    setUserName(name || 'Rahul Sharma');
    setUserPhone(phone || '+91 98765 43210');
  };

  const loginAsDriver = (unitId) => {
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
    setIsAuthenticated(false);
  };

  const toggleDriverDuty = () => {
    setDriverDutyStatus(prev => prev === 'ONLINE' ? 'OFFLINE' : 'ONLINE');
  };

  // Journey Functions
  const startSimulation = () => {
    if (tripStatus === 'ARRIVED') {
      setSimulationIndex(0);
      setTripStatus('EN_ROUTE');
    }
    setIsSimulating(true);
  };

  const pauseSimulation = () => {
    setIsSimulating(false);
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setSimulationIndex(0);
    setTripStatus('EN_ROUTE');
    setCurrentSpeedKmh(54);
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

  const submitEmergencyRequest = (data) => {
    setEmergencyRequest(prev => ({ ...prev, ...data }));
    setTripStatus('REQUESTED');
  };

  const chooseAmbulance = (amb) => {
    setSelectedAmbulance(amb);
    setTripStatus('AMBULANCE_SELECTED');
  };

  const chooseHospital = (hosp) => {
    setSelectedHospital(hosp);
    setHospitalSelectionDeferred(false);
    setTripStatus('HOSPITAL_SELECTED');
  };

  const deferHospitalSelection = () => {
    setHospitalSelectionDeferred(true);
    setTripStatus('AMBULANCE_SELECTED');
  };

  const startEmergencyJourney = () => {
    setTripStatus('EN_ROUTE');
    setSimulationIndex(0);
    setIsSimulating(true);
  };

  const handleArrival = () => {
    setTripStatus('ARRIVED');
    setIsSimulating(false);
    setSimulationIndex(activeWaypoints.length - 1);
    updateCorridorStateForPosition(activeWaypoints.length - 1);
  };

  const createGuestQREmergency = (guestData) => {
    setEmergencyRequest({
      patientName: guestData.name || 'Emergency Patient (QR Handoff)',
      contactNumber: guestData.phone || '+91 99999 88888',
      emergencyType: guestData.injury || 'Acute Emergency Trauma',
      pickupLocation: 'Live Ambulance Location (On-board QR scan)',
      pickupCoords: { lat: 18.5074, lng: 73.8065 },
      notes: 'Instant boarding via Ambulance QR Sticker. WhatsApp Session linked.',
      isGuestQR: true
    });
    setTripStatus('EN_ROUTE');
    setSelectedAmbulance(mockAmbulances[0]);
    setIsSimulating(true);
  };

  return (
    <EmergencyContext.Provider
      value={{
        currentUserRole,
        setCurrentUserRole,
        isAuthenticated,
        loginAsCustomer,
        loginAsDriver,
        logout,
        operatingMode,
        setOperatingMode,
        toggleOperatingMode: () => setOperatingMode(prev => prev === 'REAL' ? 'DEMO' : 'REAL'),
        mapEngine,
        setMapEngine,
        liveLocation,
        userName,
        userPhone,
        driverDutyStatus,
        toggleDriverDuty,
        activeDriver,
        emergencyRequest,
        setEmergencyRequest,
        submitEmergencyRequest,
        selectedAmbulance,
        chooseAmbulance,
        selectedHospital,
        chooseHospital,
        hospitalSelectionDeferred,
        deferHospitalSelection,
        tripStatus,
        setTripStatus,
        tripId,
        nodes,
        boards,
        currentCoords,
        simulationIndex,
        isSimulating,
        startSimulation,
        pauseSimulation,
        resetSimulation,
        stepForwardSimulation,
        simulationSpeedMultiplier,
        setSimulationSpeedMultiplier,
        currentSpeedKmh,
        distanceRemainingKm,
        etaMinutes,
        etaSeconds,
        goldenHourMinutesRemaining,
        startEmergencyJourney,
        handleArrival,
        createGuestQREmergency,
        activeWaypoints,
        calculatedRoute,
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
