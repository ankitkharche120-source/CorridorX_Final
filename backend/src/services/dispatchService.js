const db = require('../db');

// Haversine distance calculator
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(1);
};

class DispatchService {
  /**
   * Find available, on-duty ambulances near patient pickup coordinates
   */
  findAvailableAmbulances(pickupLat, pickupLng, emergencyType = '') {
    const allAmbulances = db.ambulances.find();
    
    // Filter by available or on-duty status
    const available = allAmbulances.filter(amb => 
      amb.status === 'AVAILABLE' || amb.status === 'ONLINE'
    );

    return this.rankAmbulances(available.length > 0 ? available : allAmbulances, { lat: pickupLat, lng: pickupLng }, emergencyType);
  }

  /**
   * Rank ambulances by estimated response time and clinical capability match
   */
  rankAmbulances(ambulances, pickupCoords, emergencyType = '') {
    const isCardiacOrTrauma = emergencyType.toLowerCase().includes('cardiac') || 
                              emergencyType.toLowerCase().includes('stemi') || 
                              emergencyType.toLowerCase().includes('trauma');

    return ambulances.map(amb => {
      const distanceKm = calculateDistanceKm(
        pickupCoords.lat, pickupCoords.lng,
        amb.latitude, amb.longitude
      );

      // Estimate travel time in urban traffic (assuming 40 km/h average)
      const baseEtaMinutes = Math.max(2, Math.round((distanceKm / 40) * 60));

      // Capability score bonus
      let capabilityBonus = 0;
      if (isCardiacOrTrauma && amb.type.includes('ALS')) capabilityBonus += 2;
      if (amb.rating >= 4.8) capabilityBonus += 1;

      return {
        ...amb,
        distanceKm,
        etaMinutes: Math.max(1, baseEtaMinutes),
        suitabilityScore: (10 - distanceKm * 0.8) + capabilityBonus
      };
    }).sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  }

  /**
   * Dispatch chosen ambulance to trip
   */
  dispatchAmbulance(tripId, ambulanceId) {
    const trip = db.trips.findById(tripId);
    const ambulance = db.ambulances.findById(ambulanceId);

    if (!trip || !ambulance) {
      throw new Error('Trip or Ambulance not found.');
    }

    db.trips.update(tripId, {
      ambulanceId,
      ambulance_id: ambulanceId,
      status: 'ASSIGNED',
      acceptedAt: new Date().toISOString()
    });

    db.ambulances.update(ambulanceId, {
      status: 'DISPATCHED'
    });

    db.recordTripTransition(tripId, trip.status, 'ASSIGNED', { ambulanceId });

    return { trip, ambulance };
  }
}

module.exports = new DispatchService();
