const db = require('../db');

// Valid trip lifecycle statuses
const VALID_STATUSES = [
  'REQUESTED',
  'SEARCHING',
  'ASSIGNED',
  'ACCEPTED',
  'EN_ROUTE_PICKUP',
  'PATIENT_ONBOARD',
  'EN_ROUTE_HOSPITAL',
  'ARRIVED_HOSPITAL',
  'COMPLETED',
  'CANCELLED'
];

exports.requestTrip = async (req, res) => {
  try {
    const {
      patient_name,
      contact,
      emergency_type,
      pickup_address,
      pickup_lat,
      pickup_lng,
      destination_lat,
      destination_lng,
      notes = ''
    } = req.body;

    if (!patient_name || !contact || !emergency_type) {
      return res.status(400).json({
        success: false,
        message: 'Patient name, contact number, and emergency type are required.'
      });
    }

    if (!pickup_lat || !pickup_lng) {
      return res.status(400).json({
        success: false,
        message: 'Pickup latitude and longitude are required.'
      });
    }

    const tripId = `TRIP-CX-${Date.now().toString().slice(-4)}`;
    const newTrip = {
      id: tripId,
      customerId: req.user ? req.user.id : `CUST-${Date.now().toString().slice(-4)}`,
      ambulanceId: null,
      hospitalId: null,
      emergencyType: emergency_type,
      patient_name,
      contact,
      pickup_address: pickup_address || `Coordinates (${parseFloat(pickup_lat).toFixed(4)}, ${parseFloat(pickup_lng).toFixed(4)})`,
      pickupLatitude: parseFloat(pickup_lat),
      pickupLongitude: parseFloat(pickup_lng),
      destinationLatitude: destination_lat ? parseFloat(destination_lat) : null,
      destinationLongitude: destination_lng ? parseFloat(destination_lng) : null,
      status: 'REQUESTED',
      routePolyline: null,
      distanceMeters: 3500,
      etaSeconds: 360,
      startedAt: new Date().toISOString(),
      acceptedAt: null,
      arrivedPickupAt: null,
      arrivedHospitalAt: null,
      completedAt: null,
      notes
    };

    db.trips.insert(newTrip);
    db.recordTripTransition(tripId, 'NONE', 'REQUESTED', { patient_name, emergency_type });

    // Notify control center and available ambulances via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to('channel:control-center').emit('trip:created', { trip: newTrip });
      io.emit('trip:created', { trip: newTrip });
    }

    return res.status(201).json({
      success: true,
      message: 'Emergency request created successfully.',
      trip: newTrip
    });
  } catch (err) {
    console.error('[Trip Request Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to create emergency request.' });
  }
};

exports.selectAmbulance = async (req, res) => {
  try {
    const { id } = req.params;
    const { ambulance_id } = req.body;

    if (!ambulance_id) {
      return res.status(400).json({ success: false, message: 'ambulance_id is required.' });
    }

    const ambulance = db.ambulances.findById(ambulance_id);
    if (!ambulance) {
      return res.status(404).json({ success: false, message: 'Ambulance not found.' });
    }

    const trip = db.trips.findById(id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    const oldStatus = trip.status;
    const updatedTrip = db.trips.update(id, {
      ambulanceId: ambulance.id,
      ambulance_id: ambulance.id,
      status: 'ASSIGNED',
      acceptedAt: new Date().toISOString()
    });

    db.ambulances.update(ambulance.id, { status: 'DISPATCHED' });
    db.recordTripTransition(id, oldStatus, 'ASSIGNED', { ambulance_id: ambulance.id });

    const io = req.app.get('io');
    if (io) {
      io.to(`trip:${id}`).emit('trip:assigned', { tripId: id, ambulance });
      io.to(`ambulance:${ambulance.id}`).emit('trip:assigned', { trip: updatedTrip });
      io.to('channel:control-center').emit('trip:assigned', { tripId: id, ambulanceId: ambulance.id });
    }

    return res.status(200).json({
      success: true,
      message: `Ambulance ${ambulance.id} assigned to emergency trip.`,
      trip: updatedTrip,
      ambulance
    });
  } catch (err) {
    console.error('[Select Ambulance Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to assign ambulance.' });
  }
};

exports.selectHospital = async (req, res) => {
  try {
    const { id } = req.params;
    const { hospital_id } = req.body;

    if (!hospital_id) {
      return res.status(400).json({ success: false, message: 'hospital_id is required.' });
    }

    const hospital = db.hospitals.findById(hospital_id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found.' });
    }

    const trip = db.trips.findById(id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    const oldStatus = trip.status;
    const updatedTrip = db.trips.update(id, {
      hospitalId: hospital.id,
      hospital_id: hospital.id,
      destinationLatitude: hospital.latitude,
      destinationLongitude: hospital.longitude,
      status: 'EN_ROUTE_HOSPITAL'
    });

    db.recordTripTransition(id, oldStatus, 'EN_ROUTE_HOSPITAL', { hospital_id: hospital.id });

    // Initialize corridor nodes for this trip
    const existingNodes = db.corridor_nodes.find(n => n.trip_id === id);
    if (existingNodes.length === 0) {
      const templateNodes = db.corridor_nodes.find(n => n.trip_id === 'TRIP-CX-8841');
      templateNodes.forEach((node, idx) => {
        db.corridor_nodes.insert({
          ...node,
          id: `NODE-${id.slice(-4)}-${idx + 1}`,
          trip_id: id,
          status: idx === 0 ? 'ACTIVE' : (idx === 1 ? 'PREPARING' : 'STANDBY')
        });
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`trip:${id}`).emit('trip:statusChanged', { tripId: id, status: 'EN_ROUTE_HOSPITAL', hospital });
      io.to(`hospital:${hospital.id}`).emit('hospital:incoming-casualty', { trip: updatedTrip, hospital });
      io.to('channel:control-center').emit('corridor:activated', { tripId: id, hospitalId: hospital.id });
    }

    return res.status(200).json({
      success: true,
      message: `Hospital ${hospital.name} locked as destination. Corridor activated.`,
      trip: updatedTrip,
      hospital
    });
  } catch (err) {
    console.error('[Select Hospital Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to set hospital destination.' });
  }
};

exports.getTripCorridor = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = db.trips.findById(id) || db.trips.find()[0];
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    let nodes = db.corridor_nodes.find(n => n.trip_id === trip.id);
    if (nodes.length === 0) {
      nodes = db.corridor_nodes.find(n => n.trip_id === 'TRIP-CX-8841');
    }

    const boards = db.digital_boards.find();
    const ambulance = (trip.ambulanceId || trip.ambulance_id) ? db.ambulances.findById(trip.ambulanceId || trip.ambulance_id) : null;
    const hospital = (trip.hospitalId || trip.hospital_id) ? db.hospitals.findById(trip.hospitalId || trip.hospital_id) : null;

    return res.status(200).json({
      success: true,
      trip,
      ambulance,
      hospital,
      nodes,
      boards
    });
  } catch (err) {
    console.error('[Corridor Fetch Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve corridor status.' });
  }
};

exports.createQRSession = async (req, res) => {
  try {
    const {
      qr_token,
      ambulance_id = 'AMB-102',
      patient_name = 'Guest QR Patient',
      phone = '+91 99999 88888',
      emergency_type = 'Emergency Trauma',
      hospital_id = 'HOSP-01'
    } = req.body;

    const ambulance = (qr_token ? db.ambulances.findOne(a => a.qr_token === qr_token) : null) || db.ambulances.findById(ambulance_id);
    const hospital = db.hospitals.findById(hospital_id) || db.hospitals.find()[0];

    const tripId = `TRIP-QR-${Date.now().toString().slice(-4)}`;
    const newTrip = {
      id: tripId,
      customerId: `GUEST-QR-${Date.now().toString().slice(-4)}`,
      ambulanceId: ambulance ? ambulance.id : 'AMB-102',
      hospitalId: hospital ? hospital.id : 'HOSP-01',
      patient_name,
      contact: phone,
      emergencyType: emergency_type,
      pickup_address: ambulance ? ambulance.address : 'Paud Road, Pune',
      pickupLatitude: ambulance ? ambulance.latitude : 18.5074,
      pickupLongitude: ambulance ? ambulance.longitude : 73.8065,
      destinationLatitude: hospital ? hospital.latitude : 18.5020,
      destinationLongitude: hospital ? hospital.longitude : 73.8290,
      status: 'EN_ROUTE_HOSPITAL',
      routePolyline: null,
      distanceMeters: 2800,
      etaSeconds: 300,
      startedAt: new Date().toISOString(),
      acceptedAt: new Date().toISOString(),
      arrivedPickupAt: new Date().toISOString(),
      arrivedHospitalAt: null,
      completedAt: null,
      notes: 'Instant passenger boarding via ambulance QR decal.'
    };

    db.trips.insert(newTrip);
    db.recordTripTransition(tripId, 'NONE', 'EN_ROUTE_HOSPITAL', { source: 'QR_STICKER_SCAN' });

    return res.status(201).json({
      success: true,
      message: 'Temporary emergency session created via QR scan.',
      session: {
        sessionId: `QR-SESS-${Date.now()}`,
        trip: newTrip,
        ambulance,
        hospital,
        whatsappHandoffUrl: `https://wa.me/919822014892?text=Emergency%20Trip%20Started%20${tripId}`
      }
    });
  } catch (err) {
    console.error('[QR Session Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to create QR emergency session.' });
  }
};

exports.getActiveTrips = async (req, res) => {
  try {
    const activeTrips = db.trips.find(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
    const enriched = activeTrips.map(trip => {
      const ambulance = (trip.ambulanceId || trip.ambulance_id) ? db.ambulances.findById(trip.ambulanceId || trip.ambulance_id) : null;
      const hospital = (trip.hospitalId || trip.hospital_id) ? db.hospitals.findById(trip.hospitalId || trip.hospital_id) : null;
      return {
        ...trip,
        ambulance,
        hospital
      };
    });

    return res.status(200).json({
      success: true,
      count: enriched.length,
      trips: enriched
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve active trips.' });
  }
};

exports.getTripById = async (req, res) => {
  try {
    const trip = db.trips.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }
    const ambulance = (trip.ambulanceId || trip.ambulance_id) ? db.ambulances.findById(trip.ambulanceId || trip.ambulance_id) : null;
    const hospital = (trip.hospitalId || trip.hospital_id) ? db.hospitals.findById(trip.hospitalId || trip.hospital_id) : null;

    return res.status(200).json({ success: true, trip, ambulance, hospital });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.updateTripStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const tripId = req.params.id;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status '${status}'. Must be one of: ${VALID_STATUSES.join(', ')}` 
      });
    }

    const trip = db.trips.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    const oldStatus = trip.status;
    const updates = { status };

    if (status === 'ACCEPTED') {
      updates.acceptedAt = new Date().toISOString();
    } else if (status === 'EN_ROUTE_PICKUP') {
      updates.startedAt = updates.startedAt || new Date().toISOString();
    } else if (status === 'PATIENT_ONBOARD') {
      updates.arrivedPickupAt = new Date().toISOString();
    } else if (status === 'ARRIVED_HOSPITAL' || status === 'ARRIVED') {
      updates.arrivedHospitalAt = new Date().toISOString();
      updates.distanceMeters = 0;
      updates.etaSeconds = 0;
    } else if (status === 'COMPLETED') {
      updates.completedAt = new Date().toISOString();
      updates.distanceMeters = 0;
      updates.etaSeconds = 0;
    }

    const updated = db.trips.update(tripId, updates);
    db.recordTripTransition(tripId, oldStatus, status, { actorId: req.user ? req.user.id : 'SYSTEM' });

    // Real-time notification over Socket.IO rooms
    const io = req.app.get('io');
    if (io) {
      io.to(`trip:${tripId}`).emit('trip:statusChanged', { tripId, fromStatus: oldStatus, status });
      io.to('channel:control-center').emit('trip:statusChanged', { tripId, fromStatus: oldStatus, status });
      if (updated.hospitalId || updated.hospital_id) {
        io.to(`hospital:${updated.hospitalId || updated.hospital_id}`).emit('trip:statusChanged', { tripId, status });
      }
    }

    return res.status(200).json({ success: true, trip: updated });
  } catch (err) {
    console.error('[Update Trip Status Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to update trip status.' });
  }
};
