/**
 * Google Routes API Service
 * Calculates real-time, traffic-aware emergency navigation trajectories,
 * distance, duration, and decoded polylines.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const googleRoutesService = {
  /**
   * Compute traffic-aware emergency route from ambulance position to hospital destination.
   *
   * @param {Object} origin - { lat: number, lng: number }
   * @param {Object} destination - { lat: number, lng: number }
   * @param {Array} intermediates - Optional intermediate waypoints (e.g., patient pickup)
   * @returns {Promise<Object>} Route metrics including polyline, distanceMeters, durationSeconds, eta
   */
  async calculateEmergencyRoute(origin, destination, intermediates = []) {
    if (!origin || !destination) {
      throw new Error('Origin and Destination coordinates are required to compute emergency route.');
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/routes/emergency-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { latitude: origin.lat, longitude: origin.lng },
          destination: { latitude: destination.lat, longitude: destination.lng },
          intermediates: intermediates.map(pt => ({ latitude: pt.lat, longitude: pt.lng })),
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE_OPTIMAL'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.route) {
          return {
            distanceMeters: data.route.distanceMeters,
            distanceKm: +(data.route.distanceMeters / 1000).toFixed(1),
            durationSeconds: data.route.durationSeconds,
            etaMinutes: Math.max(1, Math.ceil(data.route.durationSeconds / 60)),
            encodedPolyline: data.route.encodedPolyline,
            waypoints: data.route.decodedWaypoints || [],
            source: 'GOOGLE_ROUTES_API'
          };
        }
      }
    } catch (err) {
      console.warn('[Routes API] Server-side computation failed, evaluating fallback calculation...', err);
    }

    // Direct mathematical fallback (Haversine + 1.25 urban curvature factor)
    const distanceMeters = this.calculateHaversineMeters(origin, destination) * 1.25;
    const distanceKm = +(distanceMeters / 1000).toFixed(1);
    // Average urban emergency speed with siren: 45 km/h
    const durationSeconds = Math.round((distanceKm / 45) * 3600);

    return {
      distanceMeters: Math.round(distanceMeters),
      distanceKm,
      durationSeconds,
      etaMinutes: Math.max(1, Math.ceil(durationSeconds / 60)),
      encodedPolyline: null,
      waypoints: [origin, destination],
      source: 'LOCAL_HAVERSINE_ESTIMATE'
    };
  },

  /**
   * Intelligently recalculate route only if deviation threshold exceeded (> 120m)
   * or significant duration difference detected.
   */
  shouldRecalculate(lastKnownLocation, currentLocation, lastCalcTime, thresholdMeters = 120, maxIntervalMs = 45000) {
    if (!lastKnownLocation || !currentLocation) return true;
    const timeDelta = Date.now() - (lastCalcTime || 0);
    if (timeDelta > maxIntervalMs) return true;

    const displacement = this.calculateHaversineMeters(lastKnownLocation, currentLocation);
    return displacement >= thresholdMeters;
  },

  /**
   * Helper Haversine distance calculator in meters
   */
  calculateHaversineMeters(pos1, pos2) {
    const R = 6371e3;
    const dLat = ((pos2.lat - pos1.lat) * Math.PI) / 180;
    const dLon = ((pos2.lng - pos1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pos1.lat * Math.PI) / 180) *
      Math.cos((pos2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
};

export default googleRoutesService;
