const db = require('../db');

exports.getAllHospitals = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || 18.5074;
    const lng = parseFloat(req.query.lng) || 73.8065;

    const hospitals = db.hospitals.find();

    const formatted = hospitals.map(hosp => {
      // Calculate distance from caller's coordinates
      const R = 6371;
      const dLat = (hosp.latitude - lat) * (Math.PI / 180);
      const dLon = (hosp.longitude - lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat * (Math.PI / 180)) * Math.cos(hosp.latitude * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = +(R * c).toFixed(1);
      const etaMinutes = Math.max(3, Math.round(distanceKm * 2.1));

      return {
        ...hosp,
        distanceKm,
        etaMinutes
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);

    return res.status(200).json({ success: true, count: formatted.length, hospitals: formatted });
  } catch (err) {
    console.error('[Hospital Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve hospitals.' });
  }
};

exports.getHospitalById = async (req, res) => {
  try {
    const hosp = db.hospitals.findById(req.params.id);
    if (!hosp) {
      return res.status(404).json({ success: false, message: 'Hospital not found.' });
    }
    return res.status(200).json({ success: true, hospital: hosp });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.updateHospitalBeds = async (req, res) => {
  try {
    const { icu_beds, status } = req.body;
    const updates = {};
    if (icu_beds !== undefined) updates.icu_beds = icu_beds;
    if (status) updates.status = status;

    const updated = db.hospitals.update(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Hospital not found.' });
    }
    return res.status(200).json({ success: true, hospital: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error updating hospital.' });
  }
};
