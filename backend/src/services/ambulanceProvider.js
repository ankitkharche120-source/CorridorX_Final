const db = require('../db');

// Haversine formula
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

class DemoAmbulanceProvider {
  /**
   * Generates or fetches ambulances situated dynamically relative to ANY arbitrary pickup point in India.
   */
  async getNearbyAmbulances(pickupLat, pickupLng, radiusKm = 15, emergencyType = '') {
    const lat = parseFloat(pickupLat);
    const lng = parseFloat(pickupLng);

    // Dynamic offsets around pickup location (roughly 1.2km to 3.5km away)
    // 0.01 deg lat is ~1.1km
    const demoFleetTemplates = [
      {
        idSuffix: '102',
        driverName: 'Rajesh Shinde',
        phone: '+91 98220 14892',
        vehicleNumber: 'IND-EMS-102',
        type: 'ALS (Advanced Cardiac ICU)',
        equipment: ['Ventilator', 'Defibrillator', 'Multi-para Monitor', 'Oxygen Cylinder', 'Spine Board'],
        rating: 4.9,
        latOffset: 0.009,
        lngOffset: 0.011,
        agency: 'CorridorX Dynamic Rapid Unit'
      },
      {
        idSuffix: '205',
        driverName: 'Amit Deshmukh',
        phone: '+91 98901 55432',
        vehicleNumber: 'IND-EMS-205',
        type: 'Trauma & Neonatal Ready',
        equipment: ['Oxygen Support', 'Suction Machine', 'AED', 'Trauma Kit'],
        rating: 4.8,
        latOffset: -0.012,
        lngOffset: 0.008,
        agency: 'National Red Cross Emergency Fleet'
      },
      {
        idSuffix: '309',
        driverName: 'Suresh Patil',
        phone: '+91 97654 32109',
        vehicleNumber: 'IND-EMS-309',
        type: 'BLS (Basic Life Support)',
        equipment: ['Oxygen', 'Basic Stretcher', 'First Aid Trauma Pack'],
        rating: 4.7,
        latOffset: 0.015,
        lngOffset: -0.014,
        agency: 'City Emergency Mobility Link'
      },
      {
        idSuffix: '412',
        driverName: 'Vikas Kadam',
        phone: '+91 98234 66711',
        vehicleNumber: 'IND-EMS-412',
        type: 'Cardiac Specialist Ambulance',
        equipment: ['ECG Telemetry', 'Syringe Pumps', 'Intubation Kit', 'Ventilator'],
        rating: 5.0,
        latOffset: -0.018,
        lngOffset: -0.016,
        agency: 'Apex Trauma Network'
      }
    ];

    const ambulances = demoFleetTemplates.map((template) => {
      const ambLat = +(lat + template.latOffset).toFixed(5);
      const ambLng = +(lng + template.lngOffset).toFixed(5);
      const distanceKm = calculateDistanceKm(lat, lng, ambLat, ambLng);
      // Realistic urban response time (avg 40 km/h)
      const etaMinutes = Math.max(2, Math.round((distanceKm / 40) * 60));

      const ambRecord = {
        id: `AMB-${template.idSuffix}`,
        vehicle_number: template.vehicleNumber,
        driver_name: template.driverName,
        phone: template.phone,
        rating: template.rating,
        type: template.type,
        equipment: template.equipment,
        latitude: ambLat,
        longitude: ambLng,
        distanceKm,
        etaMinutes,
        status: 'AVAILABLE',
        operator_agency: template.agency,
        qr_token: `CORRIDORX-QR-AMB-${template.idSuffix}`,
        isDemoFleet: true,
        fleetBadge: 'DEMO FLEET • Simulated for Demonstration',
        source: 'DEMO_AMBULANCE_PROVIDER'
      };

      // Upsert into local database so references work seamlessly
      db.ambulances.update(ambRecord.id, ambRecord) || db.ambulances.insert(ambRecord);

      return ambRecord;
    });

    return ambulances
      .filter(a => a.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  async getAmbulance(id) {
    return db.ambulances.findById(id);
  }

  async dispatchAmbulance(tripId, ambulanceId) {
    const ambulance = db.ambulances.findById(ambulanceId);
    if (ambulance) {
      db.ambulances.update(ambulanceId, { status: 'DISPATCHED' });
    }
    return ambulance;
  }
}

class ExternalAmbulanceProvider {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async getNearbyAmbulances(pickupLat, pickupLng, radiusKm = 15, emergencyType = '') {
    try {
      const res = await fetch(`${this.apiUrl}/v1/ambulances/nearby?lat=${pickupLat}&lng=${pickupLng}&radius=${radiusKm}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.ambulances)) {
          return data.ambulances.map(a => ({
            ...a,
            isDemoFleet: false,
            fleetBadge: 'REAL FLEET • LIVE GPS CONNECTED',
            source: 'EXTERNAL_AMBULANCE_API'
          }));
        }
      }
    } catch (err) {
      console.warn('[External Ambulance Provider] Error fetching live fleet, falling back to demo:', err.message);
    }

    // Fallback to Demo provider if external fails
    const fallback = new DemoAmbulanceProvider();
    return fallback.getNearbyAmbulances(pickupLat, pickupLng, radiusKm, emergencyType);
  }

  async getAmbulance(id) {
    try {
      const res = await fetch(`${this.apiUrl}/v1/ambulances/${id}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      if (res.ok) {
        const data = await res.json();
        return data.ambulance;
      }
    } catch (e) {
      // fallback
    }
    return db.ambulances.findById(id);
  }

  async dispatchAmbulance(tripId, ambulanceId) {
    try {
      await fetch(`${this.apiUrl}/v1/dispatch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tripId, ambulanceId })
      });
    } catch (e) {
      console.warn('External dispatch failed:', e.message);
    }
    return db.ambulances.findById(ambulanceId);
  }
}

// Instantiate based on environment
const hasExternalFleetApi = Boolean(
  process.env.AMBULANCE_FLEET_API_URL && 
  process.env.AMBULANCE_FLEET_API_KEY && 
  !process.env.AMBULANCE_FLEET_API_KEY.includes('Your')
);

const ambulanceProvider = hasExternalFleetApi
  ? new ExternalAmbulanceProvider(process.env.AMBULANCE_FLEET_API_URL, process.env.AMBULANCE_FLEET_API_KEY)
  : new DemoAmbulanceProvider();

module.exports = {
  ambulanceProvider,
  DemoAmbulanceProvider,
  ExternalAmbulanceProvider,
  isLiveFleetConnected: hasExternalFleetApi
};
