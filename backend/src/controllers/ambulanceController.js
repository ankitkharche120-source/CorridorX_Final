const db = require('../db');

// Haversine formula to calculate distance in km
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(2);
};

exports.getNearbyAmbulances = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || 18.5074; // Default to Paud Road, Pune
    const lng = parseFloat(req.query.lng) || 73.8065;
    const radius = parseFloat(req.query.radius) || 15; // 15 km default search radius

    const ambulances = db.ambulances.find();

    const formatted = ambulances.map(amb => {
      const distance = getDistanceKm(lat, lng, amb.latitude, amb.longitude);
      const etaMinutes = Math.max(2, Math.round(distance * 2.2));
      let parsedEquipment = [];
      try {
        parsedEquipment = typeof amb.equipment_json === 'string' ? JSON.parse(amb.equipment_json) : amb.equipment_json;
      } catch (e) {
        parsedEquipment = ['Oxygen', 'Stretcher', 'AED'];
      }

      return {
        ...amb,
        distanceKm: distance,
        etaMinutes,
        equipment: parsedEquipment
      };
    })
    .filter(amb => amb.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm);

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
    if (latitude !== undefined) updates.latitude = latitude;
    if (longitude !== undefined) updates.longitude = longitude;

    const updated = db.ambulances.update(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Ambulance not found.' });
    }
    return res.status(200).json({ success: true, ambulance: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error updating status.' });
  }
};
