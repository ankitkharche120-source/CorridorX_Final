const db = require('../db');

exports.requestTrip = async (req, res) => {
  try {
    const {
      patient_name,
      contact,
      emergency_type,
      pickup_address,
      pickup_lat = 18.5074,
      pickup_lng = 73.8065,
      notes = ''
    } = req.body;

    if (!patient_name || !contact || !emergency_type) {
      return res.status(400).json({
        success: false,
        message: 'Patient name, contact number, and emergency type are required.'
      });
    }

    const tripId = `TRIP-CX-${Date.now().toString().slice(-4)}`;
    const newTrip = {
      id: tripId,
      request_id: `REQ-${Date.now().toString().slice(-4)}`,
      ambulance_id: null,
      hospital_id: null,
      patient_name,
      contact,
      emergency_type,
      pickup_address: pickup_address || 'Paud Road, Near Kothrud Stand, Pune',
      pickup_lat: parseFloat(pickup_lat),
      pickup_lng: parseFloat(pickup_lng),
      status: 'REQUESTED',
      started_at: new Date().toISOString(),
      completed_at: null,
      eta_seconds: 360,
      distance_km: 3.5,
      speed_kmh: 0,
      current_junction: 'Pending Dispatch',
      notes
    };

    db.trips.insert(newTrip);

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

    const updatedTrip = db.trips.update(id, {
      ambulance_id: ambulance.id,
      status: 'ASSIGNED',
      speed_kmh: 45
    });

    db.ambulances.update(ambulance.id, { status: 'DISPATCHED' });

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

    const updatedTrip = db.trips.update(id, {
      hospital_id: hospital.id,
      status: 'EN_ROUTE',
      speed_kmh: 56,
      current_junction: 'Karve Road / Kothrud Stand Junction'
    });

    // Ensure route nodes are initialized for this trip
    const existingNodes = db.routeNodes.find(n => n.trip_id === id);
    if (existingNodes.length === 0) {
      const templateNodes = db.routeNodes.find(n => n.trip_id === 'TRIP-CX-8841');
      templateNodes.forEach((node, idx) => {
        db.routeNodes.insert({
          ...node,
          id: `NODE-${id.slice(-4)}-${idx + 1}`,
          trip_id: id,
          status: idx === 0 ? 'ACTIVE' : (idx === 1 ? 'PREPARING' : 'STANDBY')
        });
      });
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

    let nodes = db.routeNodes.find(n => n.trip_id === trip.id);
    if (nodes.length === 0) {
      nodes = db.routeNodes.find(n => n.trip_id === 'TRIP-CX-8841');
    }

    const boards = db.digitalBoards.find();
    const ambulance = trip.ambulance_id ? db.ambulances.findById(trip.ambulance_id) : null;
    const hospital = trip.hospital_id ? db.hospitals.findById(trip.hospital_id) : null;

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
      request_id: `REQ-QR-${Date.now().toString().slice(-4)}`,
      ambulance_id: ambulance ? ambulance.id : 'AMB-102',
      hospital_id: hospital ? hospital.id : 'HOSP-01',
      patient_name,
      contact: phone,
      emergency_type,
      pickup_address: ambulance ? ambulance.address : 'Paud Road, Pune',
      pickup_lat: ambulance ? ambulance.latitude : 18.5074,
      pickup_lng: ambulance ? ambulance.longitude : 73.8065,
      status: 'EN_ROUTE',
      started_at: new Date().toISOString(),
      completed_at: null,
      eta_seconds: 300,
      distance_km: 2.8,
      speed_kmh: 55,
      current_junction: 'Nal Stop Flyover',
      notes: 'Instant passenger boarding via ambulance QR decal. WhatsApp profile linked.'
    };

    db.trips.insert(newTrip);

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
    const activeTrips = db.trips.find(t => t.status !== 'COMPLETED');
    const enriched = activeTrips.map(trip => {
      const ambulance = trip.ambulance_id ? db.ambulances.findById(trip.ambulance_id) : null;
      const hospital = trip.hospital_id ? db.hospitals.findById(trip.hospital_id) : null;
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
    const ambulance = trip.ambulance_id ? db.ambulances.findById(trip.ambulance_id) : null;
    const hospital = trip.hospital_id ? db.hospitals.findById(trip.hospital_id) : null;

    return res.status(200).json({ success: true, trip, ambulance, hospital });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.updateTripStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED'
    const updates = { status };
    if (status === 'COMPLETED' || status === 'ARRIVED') {
      updates.completed_at = new Date().toISOString();
      updates.speed_kmh = 0;
      updates.distance_km = 0;
      updates.eta_seconds = 0;
    }

    const updated = db.trips.update(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }
    return res.status(200).json({ success: true, trip: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update trip status.' });
  }
};
