export const mockAmbulances = [
  {
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
    location: {
      lat: 18.5085,
      lng: 73.8180,
      address: 'Near Nal Stop Flyover, Karve Road, Pune'
    },
    status: 'AVAILABLE',
    qrToken: 'CORRIDORX-QR-AMB-102',
    operatorAgency: 'Pune Emergency Medical Services (EMS)'
  },
  {
    id: 'AMB-205',
    name: 'Critical Trauma Unit 205',
    vehicleNumber: 'MH 12 RN 8812',
    driverName: 'Amit Deshmukh',
    driverPhone: '+91 98901 55432',
    driverRating: 4.8,
    type: 'Trauma & Neonatal Ready',
    equipment: ['Oxygen Support', 'Suction Machine', 'AED', 'Trauma Kit'],
    distanceKm: 2.8,
    etaMinutes: 7,
    location: {
      lat: 18.5145,
      lng: 73.8340,
      address: 'Deccan Gymkhana Bus Station, Pune'
    },
    status: 'AVAILABLE',
    qrToken: 'CORRIDORX-QR-AMB-205',
    operatorAgency: 'Sanjeevani Red Cross Fleet'
  },
  {
    id: 'AMB-309',
    name: 'BLS Rapid Response 309',
    vehicleNumber: 'MH 14 TC 1009',
    driverName: 'Suresh Patil',
    driverPhone: '+91 97654 32109',
    driverRating: 4.7,
    type: 'BLS (Basic Life Support)',
    equipment: ['Oxygen', 'Basic Stretcher', 'First Aid Trauma Pack'],
    distanceKm: 3.5,
    etaMinutes: 9,
    location: {
      lat: 18.4980,
      lng: 73.8050,
      address: 'Kothrud Stand, Paud Road, Pune'
    },
    status: 'AVAILABLE',
    qrToken: 'CORRIDORX-QR-AMB-309',
    operatorAgency: 'Apex Quick Care Mobility'
  },
  {
    id: 'AMB-412',
    name: 'Sahyadri Mobile ICU 412',
    vehicleNumber: 'MH 12 AB 9988',
    driverName: 'Vikas Kadam',
    driverPhone: '+91 98234 66711',
    driverRating: 5.0,
    type: 'Cardiac Specialist Ambulance',
    equipment: ['ECG Telemetry', 'Syringe Pumps', 'Intubation Kit', 'Ventilator'],
    distanceKm: 4.2,
    etaMinutes: 11,
    location: {
      lat: 18.5204,
      lng: 73.8567,
      address: 'Shivajinagar Station, Pune'
    },
    status: 'AVAILABLE',
    qrToken: 'CORRIDORX-QR-AMB-412',
    operatorAgency: 'Sahyadri Health Link'
  }
];
