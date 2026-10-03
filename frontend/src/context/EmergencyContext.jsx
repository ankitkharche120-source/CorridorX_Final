import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { mockAmbulances } from '../data/mockAmbulances';
import { mockHospitals } from '../data/mockHospitals';
import { mockRouteNodes, mockEmergencyPathWaypoints } from '../data/mockRouteNodes';
import { mockDigitalBoards } from '../data/mockDigitalBoards';
import { mockTrips } from '../data/mockTrips';

const EmergencyContext = createContext();

export const EmergencyProvider = ({ children }) => {
  // User & Role State (Only 2 Roles: Consumer or Ambulance Driver)
  const [currentUserRole, setCurrentUserRole] = useState('CUSTOMER'); // 'CUSTOMER' | 'AMBULANCE'
  const [userName, setUserName] = useState('Rahul Sharma');
  const [userPhone, setUserPhone] = useState('+91 98765 43210');

  // Emergency Request Data
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

  // Journey & Trip Status
  // 'IDLE' | 'REQUESTED' | 'ASSIGNED' | 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED'
  const [tripStatus, setTripStatus] = useState('EN_ROUTE');
  const [tripId, setTripId] = useState('TRIP-CX-8841');

  // Corridor & Digital Board Dynamic States
  const [nodes, setNodes] = useState(mockRouteNodes);
  const [boards, setBoards] = useState(mockDigitalBoards);

  // Simulation Engine State
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeedMultiplier, setSimulationSpeedMultiplier] = useState(1);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(54);
  const [goldenHourMinutesRemaining, setGoldenHourMinutesRemaining] = useState(48);

  const simulationTimerRef = useRef(null);

  // Current GPS coordinates of ambulance
  const currentCoords = mockEmergencyPathWaypoints[simulationIndex] || mockEmergencyPathWaypoints[0];

  // Total route metrics
  const totalWaypoints = mockEmergencyPathWaypoints.length;
  const remainingWaypoints = totalWaypoints - 1 - simulationIndex;
  const distanceRemainingKm = Math.max(0, +( (remainingWaypoints * 0.23).toFixed(1) ));
  const etaMinutes = Math.max(1, Math.ceil(distanceRemainingKm * 1.5));
  const etaSeconds = distanceRemainingKm === 0 ? 0 : etaMinutes * 60 - (simulationIndex % 4) * 12;

  // Simple distance calculator in meters between two lat/lng points (Haversine)
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
    const ambPos = mockEmergencyPathWaypoints[currIndex];
    if (!ambPos) return;

    // Node waypoint mappings:
    // Node 1: waypoint 3
    // Node 2: waypoint 7
    // Node 3: waypoint 10
    // Node 4: waypoint 12
    // Node 5: waypoint 14
    const nodeWaypointMap = {
      'NODE-01': 3,
      'NODE-02': 7,
      'NODE-03': 10,
      'NODE-04': 12,
      'NODE-05': 14
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

    // Update corresponding Digital Boards
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
          if (prev < mockEmergencyPathWaypoints.length - 1) {
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

  // Initial trigger to configure corridor states
  useEffect(() => {
    updateCorridorStateForPosition(simulationIndex);
  }, [simulationIndex]);

  // Actions
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
    if (simulationIndex < mockEmergencyPathWaypoints.length - 1) {
      const nextIdx = simulationIndex + 1;
      setSimulationIndex(nextIdx);
      updateCorridorStateForPosition(nextIdx);
      if (nextIdx === mockEmergencyPathWaypoints.length - 1) {
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
    setSimulationIndex(mockEmergencyPathWaypoints.length - 1);
    updateCorridorStateForPosition(mockEmergencyPathWaypoints.length - 1);
  };

  const switchRole = (role) => {
    setCurrentUserRole(role);
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
        switchRole,
        userName,
        userPhone,
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
