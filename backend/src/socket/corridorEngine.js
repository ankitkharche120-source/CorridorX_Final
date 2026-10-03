const db = require('../db');

// Calculate distance in meters between two lat/lon points (Haversine)
const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

const setupCorridorEngine = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Room Subscription Handlers
    socket.on('join:trip', (tripId) => {
      socket.join(`trip:${tripId}`);
      console.log(`[Socket] ${socket.id} joined trip channel: trip:${tripId}`);
    });

    socket.on('join:hospital', (hospitalId) => {
      socket.join(`hospital:${hospitalId}`);
      console.log(`[Socket] ${socket.id} joined hospital channel: hospital:${hospitalId}`);
    });

    socket.on('join:boards', () => {
      socket.join('channel:boards');
      console.log(`[Socket] ${socket.id} joined digital boards channel`);
    });

    socket.on('join:control-center', () => {
      socket.join('channel:control-center');
      console.log(`[Socket] ${socket.id} joined municipal control center channel`);
    });

    /**
     * 1. AMBULANCE TELEMETRY HANDLER
     * Receives live GPS coordinate stream from ambulance unit
     */
    socket.on('ambulance:telemetry', (data) => {
      const {
        tripId = 'TRIP-CX-8841',
        ambulanceId = 'AMB-102',
        latitude,
        longitude,
        speedKmh = 54,
        waypointIndex = 0
      } = data;

      if (latitude === undefined || longitude === undefined) {
        return;
      }

      // 1. Update Ambulance Location in DB
      db.ambulances.update(ambulanceId, {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      });

      // 2. Fetch or update associated trip
      const trip = db.trips.findById(tripId) || db.trips.find()[0];
      if (trip) {
        db.trips.update(trip.id, {
          speed_kmh: speedKmh,
          pickup_lat: latitude,
          pickup_lng: longitude
        });
      }

      // 3. Process Dynamic Corridor Node Handover
      let nodes = db.routeNodes.find(n => n.trip_id === (trip ? trip.id : 'TRIP-CX-8841'));
      if (nodes.length === 0) {
        nodes = db.routeNodes.find();
      }

      const updatedNodes = nodes.map(node => {
        const distanceMeters = calculateDistanceMeters(
          latitude, longitude,
          node.latitude, node.longitude
        );

        let status = 'STANDBY';
        // Check if ambulance has passed this node sequence
        const nodeWaypointApprox = node.sequence * 3;
        if (waypointIndex > nodeWaypointApprox) {
          status = 'PASSED';
        } else if (distanceMeters <= 350 || waypointIndex === nodeWaypointApprox) {
          status = 'ACTIVE';
        } else if (distanceMeters <= 1100 || (nodeWaypointApprox - waypointIndex) <= 3) {
          status = 'PREPARING';
        } else {
          status = 'STANDBY';
        }

        db.routeNodes.update(node.id, { status });
        return {
          ...node,
          status,
          distanceMeters
        };
      });

      // 4. Update Digital Boards to reflect new node states
      const boards = db.digitalBoards.find();
      const updatedBoards = boards.map(board => {
        const linkedNode = updatedNodes.find(n => n.id === board.node_id);
        const nodeStatus = linkedNode ? linkedNode.status : 'STANDBY';

        db.digitalBoards.update(board.id, { status: nodeStatus });
        return {
          ...board,
          status: nodeStatus
        };
      });

      // 5. Broadcast corridor node updates
      io.emit('corridor:node-update', {
        tripId,
        ambulanceId,
        telemetry: { latitude, longitude, speedKmh, waypointIndex },
        nodes: updatedNodes,
        timestamp: new Date().toISOString()
      });

      // 6. Broadcast digital board states
      io.emit('boards:broadcast', {
        tripId,
        boards: updatedBoards,
        timestamp: new Date().toISOString()
      });

      // 7. Calculate remaining distance & ETA to hospital
      const hospital = trip && trip.hospital_id ? db.hospitals.findById(trip.hospital_id) : db.hospitals.find()[0];
      if (hospital) {
        const distanceToHospitalKm = +(calculateDistanceMeters(
          latitude, longitude,
          hospital.latitude, hospital.longitude
        ) / 1000).toFixed(1);

        const etaSeconds = Math.max(30, Math.round(distanceToHospitalKm * 90));

        // 8. Hospital Pre-Alert Broadcast
        io.emit('hospital:pre-alert', {
          tripId,
          hospitalId: hospital.id,
          ambulanceId,
          patientName: trip ? trip.patient_name : 'Emergency Patient',
          emergencyType: trip ? trip.emergency_type : 'Chest Pain / STEMI',
          distanceKm: distanceToHospitalKm,
          etaSeconds,
          speedKmh,
          status: 'AMBULANCE_APPROACHING',
          vitals: {
            heartRate: Math.floor(100 + Math.random() * 18),
            spo2: Math.floor(95 + Math.random() * 4),
            bloodPressure: '136/86',
            telemetrySync: true
          },
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = { setupCorridorEngine };
