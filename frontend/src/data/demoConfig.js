/**
 * Centralized Demo Configuration for CorridorX (Karvenagar, Pune Demo)
 * Single Source of Truth for the reliable, consistent demo environment.
 */
export const DEMO_CONFIG = {
  city: 'Pune',
  area: 'Karvenagar / Kothrud',

  // 1. Patient Pickup Location (Karvenagar / Paud Rd, Kothrud Stand, Pune)
  pickup: {
    name: 'Karvenagar, Pune',
    address: 'Karvenagar, Near Rajaram Bridge & DP Road, Pune 411052',
    lat: 18.5074,
    lng: 73.8065,
    shortTitle: 'Karvenagar, Pune'
  },

  // 2. Primary Demo Hospital (Deenanath Mangeshkar Hospital, Erandwane, Pune)
  hospital: {
    id: 'HOSP-01',
    name: 'Deenanath Mangeshkar Hospital & Research Center',
    category: 'Tertiary Care & Level 1 Trauma',
    address: 'Erandwane, Near Mhatre Bridge, Pune 411004',
    lat: 18.5020,
    lng: 73.8290,
    distanceKm: 2.8,
    etaMinutes: 6,
    icuBedsAvailable: 8,
    emergencyDepartmentStatus: 'READY & ACCEPTING',
    emergencyHelpline: '+91 20 4015 1000',
    specialties: ['Trauma Center', 'Cardiac ICU', 'Stroke Unit', 'Neuro Surgery', 'Burn Unit'],
    traumaTeamLead: 'Dr. Sameer Joshi (Trauma Chief)',
    color: '#EF4444'
  },

  // 3. Primary Demo Ambulance (ALS Unit 102)
  ambulance: {
    id: 'AMB-102',
    name: 'ALS Advanced Life Support 102',
    vehicleNumber: 'MH 12 QX 4521',
    driverName: 'Rajesh Shinde',
    driverPhone: '+91 98220 14892',
    driverRating: 4.9,
    type: 'ALS (Advanced Cardiac ICU)',
    equipment: ['Ventilator', 'Defibrillator', 'Multi-para Monitor', 'Oxygen Cylinder', 'Spine Board'],
    distanceKm: 1.4,
    etaMinutes: 4,
    lat: 18.5085,
    lng: 73.8180,
    address: 'Near Nal Stop Flyover, Karve Road, Pune',
    status: 'AVAILABLE',
    operatorAgency: 'Pune Emergency Medical Services (EMS)'
  },

  // 4. Default Patient Profile
  patient: {
    name: 'Rahul Sharma',
    phone: '9999999999',
    emergencyType: 'Chest Pain / Acute Cardiac Emergency'
  }
};
