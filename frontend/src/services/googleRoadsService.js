/**
 * Google Roads API Service
 * Snaps raw noisy GPS coordinates to geometry of actual road centerlines.
 *
 * NOTE: Requests are throttled and batched so the Roads API is not called
 * on every single raw GPS coordinate ping.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

class GoogleRoadsService {
  constructor() {
    this.lastCallTimestamp = 0;
    this.minIntervalMs = 5000; // minimum 5s throttle between snap requests
    this.pendingPoints = [];
  }

  /**
   * Snap a trajectory of raw GPS coordinates to nearest road centerline
   *
   * @param {Array<{lat: number, lng: number}>} points
   * @param {boolean} interpolate - Whether to generate intermediate points along road curves
   * @returns {Promise<Array<{lat: number, lng: number}>>}
   */
  async snapToRoads(points, interpolate = true) {
    if (!Array.isArray(points) || points.length === 0) return points;

    const now = Date.now();
    if (now - this.lastCallTimestamp < this.minIntervalMs && points.length < 5) {
      // Return raw points if within throttle window for small batches
      return points;
    }

    try {
      this.lastCallTimestamp = now;
      const response = await fetch(`${BACKEND_URL}/api/routes/snap-to-roads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: points.map(pt => `${pt.lat},${pt.lng}`).join('|'),
          interpolate
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.snappedPoints)) {
          return data.snappedPoints.map(sp => ({
            lat: sp.location.latitude,
            lng: sp.location.longitude,
            originalIndex: sp.originalIndex,
            placeId: sp.placeId
          }));
        }
      }
    } catch (err) {
      console.warn('[Roads API] Snap to roads proxy failed, returning raw GPS coordinates:', err);
    }

    return points;
  }
}

export const googleRoadsService = new GoogleRoadsService();
export default googleRoadsService;
