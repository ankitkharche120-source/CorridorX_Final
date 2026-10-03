const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const hospitalService = {
  async getNearbyHospitals(lat, lng, radiusKm = 10) {
    if (!lat || !lng) throw new Error('Latitude and Longitude are required');
    const radiusMeters = radiusKm * 1000;
    const response = await fetch(`${BACKEND_URL}/api/hospitals/nearby?lat=${lat}&lng=${lng}&radius=${radiusMeters}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch nearby hospitals: HTTP ${response.status}`);
    }
    const data = await response.json();
    return {
      success: data.success,
      count: data.count || 0,
      hospitals: data.places || data.results || data.hospitals || [],
      message: data.message
    };
  },

  async searchHospitalsByQuery(query, lat = null, lng = null) {
    if (!query || !query.trim()) return { success: true, count: 0, hospitals: [] };
    let url = `${BACKEND_URL}/api/hospitals/search?q=${encodeURIComponent(query)}`;
    if (lat && lng) {
      url += `&lat=${lat}&lng=${lng}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to search hospitals: HTTP ${response.status}`);
    }
    const data = await response.json();
    return {
      success: data.success,
      count: data.count || 0,
      hospitals: data.places || data.results || data.hospitals || []
    };
  },

  async getHospitalById(id) {
    const response = await fetch(`${BACKEND_URL}/api/hospitals/${id}`);
    if (!response.ok) throw new Error(`Hospital not found: HTTP ${response.status}`);
    const data = await response.json();
    return data.hospital;
  }
};

export default hospitalService;
