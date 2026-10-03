/**
 * TrafficSignalProvider
 *
 * IMPORTANT: Google Maps Platform does NOT control traffic signals.
 * Physical green wave preemption requires integration with municipal SCATS,
 * SCOOT, NTCIP 1202, or city ITMS controller APIs.
 *
 * This adapter interface provides:
 * 1. MockTrafficSignalProvider: Used for pitch demonstrations, testing, and simulation mode.
 * 2. ExternalTrafficSignalProvider: Used for real municipal hardware APIs when valid credentials exist.
 */

class MockTrafficSignalProvider {
  constructor() {
    this.signalStates = new Map();
  }

  async prepareIntersection(intersectionId, approachBearing = 0) {
    this.signalStates.set(intersectionId, {
      phase: 'PREPARING_CLEARANCE',
      heldGreen: false,
      timestamp: new Date().toISOString(),
      mode: 'SIMULATION'
    });
    return { success: true, mode: 'SIMULATION', intersectionId, state: 'PREPARING' };
  }

  async activateEmergencyPhase(intersectionId, priorityDirection = 'NORTH') {
    this.signalStates.set(intersectionId, {
      phase: 'EMERGENCY_GREEN_PREEMPTION',
      heldGreen: true,
      direction: priorityDirection,
      timestamp: new Date().toISOString(),
      mode: 'SIMULATION'
    });
    return { success: true, mode: 'SIMULATION', intersectionId, state: 'ACTIVE_GREEN' };
  }

  async releaseIntersection(intersectionId) {
    this.signalStates.set(intersectionId, {
      phase: 'NORMAL_CYCLE_RESTORED',
      heldGreen: false,
      timestamp: new Date().toISOString(),
      mode: 'SIMULATION'
    });
    return { success: true, mode: 'SIMULATION', intersectionId, state: 'RELEASED' };
  }

  async getIntersectionStatus(intersectionId) {
    return this.signalStates.get(intersectionId) || {
      phase: 'NORMAL_CYCLE',
      heldGreen: false,
      mode: 'SIMULATION'
    };
  }
}

class ExternalTrafficSignalProvider {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async prepareIntersection(intersectionId, approachBearing = 0) {
    try {
      const res = await fetch(`${this.apiUrl}/v1/signals/${intersectionId}/prepare`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approachBearing, priorityTier: 1 })
      });
      return await res.json();
    } catch (e) {
      console.warn(`[Traffic Signal Provider] Hardware API call failed for ${intersectionId}:`, e.message);
      return { success: false, error: e.message, mode: 'EXTERNAL_FAILED' };
    }
  }

  async activateEmergencyPhase(intersectionId, priorityDirection = 'NORTH') {
    try {
      const res = await fetch(`${this.apiUrl}/v1/signals/${intersectionId}/preempt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ priorityDirection, holdSeconds: 90 })
      });
      return await res.json();
    } catch (e) {
      console.warn(`[Traffic Signal Provider] Preemption failed for ${intersectionId}:`, e.message);
      return { success: false, error: e.message, mode: 'EXTERNAL_FAILED' };
    }
  }

  async releaseIntersection(intersectionId) {
    try {
      const res = await fetch(`${this.apiUrl}/v1/signals/${intersectionId}/release`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message, mode: 'EXTERNAL_FAILED' };
    }
  }

  async getIntersectionStatus(intersectionId) {
    try {
      const res = await fetch(`${this.apiUrl}/v1/signals/${intersectionId}/status`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return await res.json();
    } catch (e) {
      return { status: 'UNKNOWN', mode: 'EXTERNAL_FAILED' };
    }
  }
}

// Factory instantiation based on environment variables
const hasExternalSignalApi = Boolean(
  process.env.TRAFFIC_SIGNAL_API_URL && 
  process.env.TRAFFIC_SIGNAL_API_KEY && 
  !process.env.TRAFFIC_SIGNAL_API_KEY.includes('Your')
);

const trafficSignalProvider = hasExternalSignalApi
  ? new ExternalTrafficSignalProvider(process.env.TRAFFIC_SIGNAL_API_URL, process.env.TRAFFIC_SIGNAL_API_KEY)
  : new MockTrafficSignalProvider();

module.exports = {
  trafficSignalProvider,
  MockTrafficSignalProvider,
  ExternalTrafficSignalProvider,
  isLiveHardwareActive: hasExternalSignalApi
};
