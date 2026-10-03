const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const googleGeocodingService = {
  async reverseGeocode(lat, lng) {
    if (!lat || !lng) throw new Error('Latitude and Longitude are required');
    const response = await fetch(`${BACKEND_URL}/api/location/reverse-geocode?lat=${lat}&lng=${lng}`);
    if (!response.ok) {
      throw new Error(`Reverse geocode failed with status ${response.status}`);
    }
    const data = await response.json();
    if (!data.success || !data.location) {
      throw new Error(data.message || 'Reverse geocoding failed');
    }
    return data.location;
  },

  async autocomplete(input, userLoc = null) {
    if (!input || !input.trim()) return [];
    let url = `${BACKEND_URL}/api/location/autocomplete?input=${encodeURIComponent(input)}`;
    if (userLoc?.lat && userLoc?.lng) {
      url += `&lat=${userLoc.lat}&lng=${userLoc.lng}`;
    }
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return data.suggestions || [];
  },

  async getPlaceDetails(placeId) {
    if (!placeId) throw new Error('placeId is required');
    const response = await fetch(`${BACKEND_URL}/api/location/place-details?placeId=${encodeURIComponent(placeId)}`);
    if (!response.ok) {
      throw new Error(`Place details failed with status ${response.status}`);
    }
    const data = await response.json();
    return data.place;
  }
};

export default googleGeocodingService;
