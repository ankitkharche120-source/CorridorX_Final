const geocodingService = require('../services/googleGeocodingService');

exports.reverseGeocode = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude query parameters are required.' });
    }

    const result = await geocodingService.reverseGeocode(lat, lng);
    return res.status(200).json({ success: true, location: result });
  } catch (err) {
    console.error('[Location Controller] Reverse geocode error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reverse geocode location.' });
  }
};

exports.autocomplete = async (req, res) => {
  try {
    const { input, lat, lng } = req.query;
    if (!input || input.trim().length === 0) {
      return res.status(200).json({ success: true, suggestions: [] });
    }

    const userLoc = (lat && lng) ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;
    const suggestions = await geocodingService.autocomplete(input, userLoc);
    return res.status(200).json({ success: true, count: suggestions.length, suggestions });
  } catch (err) {
    console.error('[Location Controller] Autocomplete error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch location suggestions.' });
  }
};

exports.getPlaceDetails = async (req, res) => {
  try {
    const { placeId } = req.query;
    if (!placeId) {
      return res.status(400).json({ success: false, message: 'placeId query parameter is required.' });
    }

    const details = await geocodingService.getPlaceDetails(placeId);
    return res.status(200).json({ success: true, place: details });
  } catch (err) {
    console.error('[Location Controller] Place details error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch place details.' });
  }
};
