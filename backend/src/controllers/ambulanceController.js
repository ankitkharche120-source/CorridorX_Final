const db = require('../db');
const dispatchService = require('../services/dispatchService');
const { ambulanceProvider, isLiveFleetConnected } = require('../services/ambulanceProvider');

exports.getNearbyAmbulances = async (req, res) => {
  try {
    if (!req.query.lat || !req.query.lng) {
      return res.status(400).json({
        success: false,
        message: 'Selected pickup coordinates (lat, lng) are required to generate local ambulances.'
      });
    }

    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const emergencyType = req.query.emergency_type || '';
    const radius = parseFloat(req.query.radius) || 25;

    // Use dynamic India-wide ambulance provider
    const ambulances = await ambulanceProvider.getNearbyAmbulances(lat, lng, radius, emergencyType);

    return res.status(200).json({
      success: true,
      count: ambulances.length,
      userLocation: { lat, lng },
      isLiveFleetConnected,
      fleetType: isLiveFleetConnected ? 'EXTERNAL_REAL_FLEET' : 'DEMO_DYNAMIC_FLEET',
      ambulances
    });
  } catch (err) {
    console.error('[Ambulance Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve ambulances.' });
  }
};

exports.getAmbulanceById = async (req, res) => {
  try {
    const amb = db.ambulances.findById(req.params.id);
    if (!amb) {
      return res.status(404).json({ success: false, message: 'Ambulance not found.' });
    }
    return res.status(200).json({ success: true, ambulance: amb });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.updateAmbulanceStatus = async (req, res) => {
  try {
    const { status, latitude, longitude } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (latitude !== undefined) updates.latitude = parseFloat(latitude);
    if (longitude !== undefined) updates.longitude = parseFloat(longitude);

    const updated = db.ambulances.update(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Ambulance not found.' });
    }

    db.logAudit('AMBULANCE', req.params.id, 'STATUS_UPDATE', req.user ? req.user.id : 'DRIVER', updates);

    // Realtime notification
    const io = req.app.get('io');
    if (io) {
      io.to('control-center').emit('ambulance:statusUpdated', { ambulanceId: req.params.id, ...updates });
    }

    return res.status(200).json({ success: true, ambulance: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update ambulance status.' });
  }
};
