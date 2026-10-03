const db = require('../db');
const dispatchService = require('../services/dispatchService');

exports.getNearbyAmbulances = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || 18.5074;
    const lng = parseFloat(req.query.lng) || 73.8065;
    const emergencyType = req.query.emergency_type || '';

    const rankedAmbulances = dispatchService.findAvailableAmbulances(lat, lng, emergencyType);

    const formatted = rankedAmbulances.map(amb => {
      let parsedEquipment = [];
      try {
        parsedEquipment = typeof amb.equipment_json === 'string' ? JSON.parse(amb.equipment_json) : amb.equipment_json;
      } catch (e) {
        parsedEquipment = ['Oxygen', 'Stretcher', 'AED'];
      }

      return {
        ...amb,
        equipment: parsedEquipment
      };
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      userLocation: { lat, lng },
      ambulances: formatted
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
