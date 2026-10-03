const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const ambulanceService = {
  async getNearbyAmbulances(lat, lng, radiusKm = 25, emergencyType = '') {
    if (!lat || !lng) throw new Error('Selected pickup coordinates are required');
    const response = await fetch(
      `${BACKEND_URL}/api/ambulances/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}&emergency_type=${encodeURIComponent(emergencyType)}`
    );
    if (!response.ok) {
      throw new Error(`Failed to load nearby ambulances: HTTP ${response.status}`);
    }
    const data = await response.json();
    return {
      success: data.success,
      count: data.count || 0,
      ambulances: data.ambulances || [],
      fleetType: data.fleetType || 'DEMO_DYNAMIC_FLEET',
      isLiveFleetConnected: data.isLiveFleetConnected || false
    };
  }
};

export default ambulanceService;
