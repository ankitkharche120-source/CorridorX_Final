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

// Thresholds for Dynamic Corridor Handover (in meters)
const PREPARING_DISTANCE = parseInt(process.env.PREPARING_DISTANCE || '500', 10);
const ACTIVE_DISTANCE = parseInt(process.env.ACTIVE_DISTANCE || '200', 10);
const PASSED_DISTANCE = parseInt(process.env.PASSED_DISTANCE || '50', 10);

const setupCorridorEngine = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // ------------------------------------------------------------------
    // Room Subscriptions
    // ------------------------------------------------------------------
    socket.on('join:trip', (tripId) => {
      if (tripId) {
        socket.join(`trip:${tripId}`);
        console.log(`[Socket] ${socket.id} joined room: trip:${tripId}`);
      }
    });

    socket.on('join:ambulance', (ambulanceId) => {
      if (ambulanceId) {
        socket.join(`ambulance:${ambulanceId}`);
        console.log(`[Socket] ${socket.id} joined room: ambulance:${ambulanceId}`);
      }
    });

    socket.on('join:hospital', (hospitalId) => {
      if (hospitalId) {
        socket.join(`hospital:${hospitalId}`);
        console.log(`[Socket] ${socket.id} joined room: hospital:${hospitalId}`);
      }
    });

    socket.on('join:control-center', () => {
      socket.join('control-center');
      socket.join('channel:control-center');
      console.log(`[Socket] ${socket.id} joined room: control-center`);
    });

    // ------------------------------------------------------------------
    // Ambulance Real-Time Telemetry & Corridor Processing
    // ------------------------------------------------------------------
    socket.on('ambulance:telemetry', (data) => {
      const {
        ambulanceId = 'AMB-102',
        tripId = 'TRIP-CX-8841',
        latitude,
        longitude,
        accuracy = 10,
        heading = 0,
        speed = 54, // km/h
        timestamp = Date.now()
      } = data;

      if (latitude === undefined || longitude === undefined || isNaN(latitude) || isNaN(longitude)) {
        return;
      }

      const parsedLat = parseFloat(latitude);
      const parsedLng = parseFloat(longitude);

      // Validate sanity of coordinates
      if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
        console.warn(`[Socket Telemetry] Rejected invalid coordinate values: ${parsedLat}, ${parsedLng}`);
        return;
      }

      // Check last known location to reject impossible GPS teleport jumps (> 160 km/h)
      const ambulance = db.ambulances.findById(ambulanceId);
      if (ambulance && ambulance.latitude && ambulance.longitude && ambulance.last_telemetry_time) {
        const timeDiffSeconds = Math.max(1, (timestamp - ambulance.last_telemetry_time) / 1000);
        const distanceMovedMeters = calculateDistanceMeters(
          ambulance.latitude, ambulance.longitude,
          parsedLat, parsedLng
        );
        const calculatedSpeedKmh = (distanceMovedMeters / timeDiffSeconds) * 3.6;

        if (calculatedSpeedKmh > 180 && distanceMovedMeters > 300) {
          console.warn(`[Socket Telemetry] Rejected impossible GPS jump: ${distanceMovedMeters}m in ${timeDiffSeconds}s (${calculatedSpeedKmh.toFixed(0)} km/h)`);
          return;
        }
      }

      // 1. Update Ambulance Location in DB
      db.ambulances.update(ambulanceId, {
        latitude: parsedLat,
        longitude: parsedLng,
        heading,
        speed_kmh: speed,
        last_telemetry_time: timestamp
      });

      // 2. Persist Location History
      db.locations.insert({
        id: `LOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ambulance_id: ambulanceId,
        trip_id: tripId,
        latitude: parsedLat,
        longitude: parsedLng,
        accuracy,
        heading,
        speed_kmh: speed,
        timestamp: new Date(timestamp).toISOString()
      });

      // 3. Broadcast Location Update to Trip room and Control Center
      const locationPayload = {
        ambulanceId,
        tripId,
        latitude: parsedLat,
        longitude: parsedLng,
        accuracy,
        heading,
        speed,
        timestamp
      };

      io.to(`trip:${tripId}`).emit('trip:locationUpdated', locationPayload);
      io.to('control-center').emit('trip:locationUpdated', locationPayload);
      io.to('channel:control-center').emit('trip:locationUpdated', locationPayload);

      // 4. Calculate Distance & ETA to Destination Hospital
      const trip = db.trips.findById(tripId);
      const hospitalId = trip ? (trip.hospitalId || trip.hospital_id) : 'HOSP-01';
      const hospital = db.hospitals.findById(hospitalId) || db.hospitals.find()[0];

      if (hospital) {
        const distanceToHospitalMeters = calculateDistanceMeters(
          parsedLat, parsedLng,
          hospital.latitude, hospital.longitude
        );
        const distanceKm = +(distanceToHospitalMeters / 1000).toFixed(1);
        const etaSeconds = Math.max(15, Math.round((distanceKm / Math.max(25, speed)) * 3600));
        const etaMinutes = Math.max(1, Math.ceil(etaSeconds / 60));

        db.trips.update(tripId, {
          distanceMeters: distanceToHospitalMeters,
          etaSeconds
        });

        const etaPayload = {
          tripId,
          ambulanceId,
          distanceMeters: distanceToHospitalMeters,
          distanceKm,
          etaSeconds,
          etaMinutes,
          speedKmh: speed
        };

        io.to(`trip:${tripId}`).emit('trip:etaUpdated', etaPayload);
        io.to(`hospital:${hospital.id}`).emit('trip:etaUpdated', etaPayload);
        io.to('control-center').emit('trip:etaUpdated', etaPayload);
      }

      // 5. Dynamic Corridor Handover Calculation
      let nodes = db.corridor_nodes.find(n => n.trip_id === tripId);
      if (nodes.length === 0) {
        nodes = db.corridor_nodes.find(n => n.trip_id === 'TRIP-CX-8841');
      }

      let activeNodeCount = 0;
      const updatedNodes = nodes.map(node => {
        const dist = calculateDistanceMeters(parsedLat, parsedLng, node.latitude, node.longitude);
        const prevStatus = node.status;
        let newStatus = 'STANDBY';

        if (dist <= PASSED_DISTANCE && (speed > 15 || node.sequence < 3)) {
          newStatus = 'PASSED';
        } else if (dist <= ACTIVE_DISTANCE) {
          newStatus = 'ACTIVE';
          activeNodeCount++;
        } else if (dist <= PREPARING_DISTANCE) {
          newStatus = 'PREPARING';
        } else {
          newStatus = 'STANDBY';
        }

        if (newStatus !== prevStatus) {
          db.corridor_nodes.update(node.id, { status: newStatus });
          if (newStatus === 'ACTIVE') {
            io.to(`trip:${tripId}`).emit('corridor:nodeActive', { tripId, node: { ...node, status: newStatus } });
          } else if (newStatus === 'PREPARING') {
            io.to(`trip:${tripId}`).emit('corridor:nodePreparing', { tripId, node: { ...node, status: newStatus } });
          } else if (newStatus === 'PASSED') {
            io.to(`trip:${tripId}`).emit('corridor:nodePassed', { tripId, node: { ...node, status: newStatus } });
          }
        }

        return {
          ...node,
          status: newStatus,
          distanceMeters: dist
        };
      });

      // 6. Update Digital Message Boards
      const boards = db.digital_boards.find();
      const updatedBoards = boards.map(board => {
        const linkedNode = updatedNodes.find(n => n.id === board.node_id);
        const boardStatus = linkedNode ? linkedNode.status : 'STANDBY';
        
        let line1 = board.message_line1 || '🚨 EMERGENCY CORRIDOR';
        let line2 = 'MAINTAIN REGULAR FLOW';
        let line3 = 'LANE CLEARING STANDBY';

        if (boardStatus === 'ACTIVE') {
          line1 = '🚨 EMERGENCY AMBULANCE INCOMING';
          line2 = 'CLEAR RIGHT LANE IMMEDIATELY';
          line3 = `SPEED: ${speed} KM/H • SIGNAL HELD GREEN`;
        } else if (boardStatus === 'PREPARING') {
          line1 = '⚠️ APPROACHING EMERGENCY CORRIDOR';
          line2 = 'PREPARE TO MERGE LEFT';
          line3 = 'TRANSIT SIGNAL OVERRIDE IN 30s';
        }

        db.digital_boards.update(board.id, {
          status: boardStatus,
          message_line1: line1,
          message_line2: line2,
          message_line3: line3
        });

        const boardPayload = {
          id: board.id,
          node_id: board.node_id,
          status: boardStatus,
          message_line1: line1,
          message_line2: line2,
          message_line3: line3
        };

        io.to('control-center').emit('board:updated', boardPayload);
        return boardPayload;
      });

      // Broadcast complete corridor state
      io.to(`trip:${tripId}`).emit('corridor:node-update', {
        tripId,
        ambulanceId,
        nodes: updatedNodes,
        boards: updatedBoards,
        timestamp: new Date().toISOString()
      });
      io.to('control-center').emit('corridor:node-update', {
        tripId,
        ambulanceId,
        nodes: updatedNodes,
        boards: updatedBoards,
        timestamp: new Date().toISOString()
      });
    });

    // ------------------------------------------------------------------
    // Ambulance Duty Status Changes
    // ------------------------------------------------------------------
    socket.on('ambulance:status', ({ ambulanceId, status }) => {
      db.ambulances.update(ambulanceId, { status });
      io.to('control-center').emit('ambulance:statusUpdated', { ambulanceId, status });
    });

    // ------------------------------------------------------------------
    // Hospital Status Updates
    // ------------------------------------------------------------------
    socket.on('hospital:status', ({ hospitalId, receiving_status, trauma_status, icu_beds }) => {
      const updates = {};
      if (receiving_status) updates.receiving_status = receiving_status;
      if (trauma_status) updates.trauma_status = trauma_status;
      if (icu_beds !== undefined) updates.icu_beds = icu_beds;

      db.hospitals.update(hospitalId, updates);
      io.to('control-center').emit('hospital:statusUpdated', { hospitalId, ...updates });
      io.to(`hospital:${hospitalId}`).emit('hospital:statusUpdated', { hospitalId, ...updates });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = { setupCorridorEngine };
