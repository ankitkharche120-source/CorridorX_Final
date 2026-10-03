const db = require('../db');

// Calculate distance in km
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(1);
};

exports.getAllHospitals = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || 18.5074;
    const lng = parseFloat(req.query.lng) || 73.8065;

    const hospitals = db.hospitals.find();

    const formatted = hospitals.map(hosp => {
      const distanceKm = calculateDistanceKm(lat, lng, hosp.latitude, hosp.longitude);
      const etaMinutes = Math.max(3, Math.round(distanceKm * 2.1));

      return {
        ...hosp,
        distanceKm,
        etaMinutes,
        receivingStatus: hosp.receiving_status || 'READY',
        traumaStatus: hosp.trauma_status || 'AVAILABLE',
        icuStatus: hosp.icu_status || 'AVAILABLE',
        ventilatorStatus: hosp.ventilator_status || 'AVAILABLE'
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

/**
 * Search nearby hospitals using Google Places API (New) with fallback
 */
exports.searchNearbyPlaces = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || 18.5074;
    const lng = parseFloat(req.query.lng) || 73.8065;
    const radius = parseInt(req.query.radius, 10) || 5000;

    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

    if (apiKey && apiKey.trim().length > 10 && !apiKey.includes('YourGoogle')) {
      try {
        const placesResponse = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber'
          },
          body: JSON.stringify({
            includedTypes: ['hospital'],
            maxResultCount: 10,
            locationRestriction: {
              circle: {
                center: { latitude: lat, longitude: lng },
                radius
              }
            }
          })
        });

        if (placesResponse.ok) {
          const pData = await placesResponse.json();
          if (pData.places && pData.places.length > 0) {
            const places = pData.places.map(p => ({
              googlePlaceId: p.id,
              name: p.displayName?.text || 'Medical Center',
              address: p.formattedAddress || 'Pune, Maharashtra',
              latitude: p.location?.latitude,
              longitude: p.location?.longitude,
              phone: p.nationalPhoneNumber || '+91 20 Emergency Desk',
              distanceKm: calculateDistanceKm(lat, lng, p.location?.latitude, p.location?.longitude),
              source: 'GOOGLE_PLACES_API_NEW'
            }));
            return res.status(200).json({ success: true, count: places.length, places });
          }
        }
      } catch (gErr) {
        console.warn('[Places API New] Search failed, falling back to registered hospitals:', gErr.message);
      }
    }

    // Fallback to CorridorX pre-registered hospitals with real distance calculations
    const registeredHospitals = db.hospitals.find().map(h => ({
      googlePlaceId: `corridorx-${h.id}`,
      name: h.name,
      address: h.address,
      latitude: h.latitude,
      longitude: h.longitude,
      phone: h.helpline,
      distanceKm: calculateDistanceKm(lat, lng, h.latitude, h.longitude),
      source: 'CORRIDORX_REGISTERED_NETWORK'
    })).sort((a, b) => a.distanceKm - b.distanceKm);

    return res.status(200).json({ success: true, count: registeredHospitals.length, places: registeredHospitals });
  } catch (err) {
    console.error('[Nearby Places Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to search nearby hospitals.' });
  }
};

/**
 * Text search for hospitals by query
 */
exports.searchHospitalsByQuery = async (req, res) => {
  try {
    const query = req.query.q || '';
    const lat = parseFloat(req.query.lat) || 18.5074;
    const lng = parseFloat(req.query.lng) || 73.8065;

    const lowerQuery = query.toLowerCase();
    const results = db.hospitals.find(h => 
      h.name.toLowerCase().includes(lowerQuery) || 
      h.address.toLowerCase().includes(lowerQuery) ||
      (h.specialties && h.specialties.some(s => s.toLowerCase().includes(lowerQuery)))
    ).map(h => ({
      ...h,
      distanceKm: calculateDistanceKm(lat, lng, h.latitude, h.longitude)
    }));

    return res.status(200).json({ success: true, count: results.length, results });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Search failed.' });
  }
};

/**
 * Update Hospital Operational & Trauma Capacity (Phase 9 & 18)
 */
exports.updateHospitalBeds = async (req, res) => {
  try {
    const { 
      icu_beds, 
      receiving_status, 
      trauma_status, 
      icu_status, 
      ventilator_status, 
      status 
    } = req.body;

    const updates = {};
    if (icu_beds !== undefined) updates.icu_beds = parseInt(icu_beds, 10);
    if (receiving_status) updates.receiving_status = receiving_status; // 'READY' | 'BUSY' | 'CLOSED'
    if (trauma_status) updates.trauma_status = trauma_status;         // 'AVAILABLE' | 'LIMITED' | 'FULL'
    if (icu_status) updates.icu_status = icu_status;                   // 'AVAILABLE' | 'LIMITED' | 'FULL'
    if (ventilator_status) updates.ventilator_status = ventilator_status; // 'AVAILABLE' | 'LIMITED' | 'FULL'
    if (status) updates.status = status;

    const updated = db.hospitals.update(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Hospital not found.' });
    }

    db.logAudit('HOSPITAL', req.params.id, 'OPERATIONAL_STATUS_UPDATE', req.user ? req.user.id : 'HOSPITAL_STAFF', updates);

    // Broadcast over Socket.IO to Control Center and Hospital Room
    const io = req.app.get('io');
    if (io) {
      io.to('control-center').emit('hospital:statusUpdated', { hospitalId: req.params.id, ...updates });
      io.to(`hospital:${req.params.id}`).emit('hospital:statusUpdated', { hospitalId: req.params.id, ...updates });
    }

    return res.status(200).json({ success: true, hospital: updated });
  } catch (err) {
    console.error('[Update Hospital Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to update hospital status.' });
  }
};
