const bcrypt = require('bcryptjs');

const generateSeedData = () => {
  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('corridorx123', salt);

  return {
    users: [
      {
        id: 'USER-01',
        name: 'Rahul Sharma',
        phone: '+91 98765 43210',
        email: 'rahul.sharma@example.com',
        password_hash: defaultPasswordHash,
        role: 'CUSTOMER',
        createdAt: new Date().toISOString()
      },
      {
        id: 'USER-02',
        name: 'Rajesh Shinde (Pilot)',
        phone: '+91 98220 14892',
        email: 'rajesh.pilot@ems-pune.gov.in',
        password_hash: defaultPasswordHash,
        role: 'AMBULANCE',
        createdAt: new Date().toISOString()
      },
      {
        id: 'USER-03',
        name: 'Dr. Sameer Joshi (Trauma Chief)',
        phone: '+91 20 4015 1000',
        email: 'trauma.chief@dmh.org',
        password_hash: defaultPasswordHash,
        role: 'HOSPITAL',
        createdAt: new Date().toISOString()
      },
      {
        id: 'USER-04',
        name: 'Pune Traffic Control Operator',
        phone: '+91 20 2612 2000',
        email: 'control@punetrafficpolice.gov.in',
        password_hash: defaultPasswordHash,
        role: 'ADMIN',
        createdAt: new Date().toISOString()
      }
    ],

    ambulances: [
      {
        id: 'AMB-102',
        vehicle_number: 'MH 12 QX 4521',
        driver_name: 'Rajesh Shinde',
        phone: '+91 98220 14892',
        rating: 4.9,
        type: 'ALS (Advanced Cardiac ICU)',
        equipment_json: JSON.stringify(['Ventilator', 'Defibrillator', 'Multi-para Monitor', 'Oxygen Cylinder', 'Spine Board']),
        latitude: 18.5085,
        longitude: 73.8180,
        address: 'Near Nal Stop Flyover, Karve Road, Pune',
        status: 'AVAILABLE',
        qr_token: 'CORRIDORX-QR-AMB-102',
        operator_agency: 'Pune Emergency Medical Services (EMS)'
      },
      {
        id: 'AMB-205',
        vehicle_number: 'MH 12 RN 8812',
        driver_name: 'Amit Deshmukh',
        phone: '+91 98901 55432',
        rating: 4.8,
        type: 'Trauma & Neonatal Ready',
        equipment_json: JSON.stringify(['Oxygen Support', 'Suction Machine', 'AED', 'Trauma Kit']),
        latitude: 18.5145,
        longitude: 73.8340,
        address: 'Deccan Gymkhana Bus Station, Pune',
        status: 'AVAILABLE',
        qr_token: 'CORRIDORX-QR-AMB-205',
        operator_agency: 'Sanjeevani Red Cross Fleet'
      },
      {
        id: 'AMB-309',
        vehicle_number: 'MH 14 TC 1009',
        driver_name: 'Suresh Patil',
        phone: '+91 97654 32109',
        rating: 4.7,
        type: 'BLS (Basic Life Support)',
        equipment_json: JSON.stringify(['Oxygen', 'Basic Stretcher', 'First Aid Trauma Pack']),
        latitude: 18.4980,
        longitude: 73.8050,
        address: 'Kothrud Stand, Paud Road, Pune',
        status: 'AVAILABLE',
        qr_token: 'CORRIDORX-QR-AMB-309',
        operator_agency: 'Apex Quick Care Mobility'
      },
      {
        id: 'AMB-412',
        vehicle_number: 'MH 12 AB 9988',
        driver_name: 'Vikas Kadam',
        phone: '+91 98234 66711',
        rating: 5.0,
        type: 'Cardiac Specialist Ambulance',
        equipment_json: JSON.stringify(['ECG Telemetry', 'Syringe Pumps', 'Intubation Kit', 'Ventilator']),
        latitude: 18.5204,
        longitude: 73.8567,
        address: 'Shivajinagar Station, Pune',
        status: 'AVAILABLE',
        qr_token: 'CORRIDORX-QR-AMB-412',
        operator_agency: 'Sahyadri Health Link'
      }
    ],

    hospitals: [
      {
        id: 'HOSP-01',
        name: 'Deenanath Mangeshkar Hospital & Research Center',
        address: 'Erandwane, Near Mhatre Bridge, Pune 411004',
        latitude: 18.5020,
        longitude: 73.8290,
        helpline: '+91 20 4015 1000',
        icu_beds: 8,
        trauma_lead: 'Dr. Sameer Joshi (Trauma Chief)',
        status: 'READY & ACCEPTING',
        specialties: ['Trauma Center', 'Cardiac ICU', 'Stroke Unit', 'Neuro Surgery', 'Burn Unit']
      },
      {
        id: 'HOSP-02',
        name: 'Sahyadri Super Speciality Hospital',
        address: 'Plot No. 30 C, Karve Rd, Deccan Gymkhana, Pune 411004',
        latitude: 18.5132,
        longitude: 73.8378,
        helpline: '+91 20 6721 3000',
        icu_beds: 5,
        trauma_lead: 'Dr. Ananya Kulkarni',
        status: 'READY & ACCEPTING',
        specialties: ['Comprehensive Stroke Center', 'Interventional Cardiology', 'Ortho Trauma']
      },
      {
        id: 'HOSP-03',
        name: 'MAI Mangeshkar Hospital',
        address: 'Survey No. 11/1, Mumbai Bangalore Highway, Warje, Pune 411058',
        latitude: 18.4835,
        longitude: 73.7990,
        helpline: '+91 20 4054 1000',
        icu_beds: 11,
        trauma_lead: 'Dr. Milind Gadgil',
        status: 'READY & ACCEPTING',
        specialties: ['Emergency ICU', 'Polytrauma', 'Emergency Dialysis']
      },
      {
        id: 'HOSP-04',
        name: 'Ruby Hall Clinic',
        address: '40 Sassoon Road, Sangamvadi, Pune 411001',
        latitude: 18.5310,
        longitude: 73.8745,
        helpline: '+91 20 6645 5100',
        icu_beds: 14,
        trauma_lead: 'Dr. Pradeep Sharma',
        status: 'HIGH TRAFFIC - 4 BEDS OPEN',
        specialties: ['Level 1 Trauma', 'Comprehensive Burn Unit', 'Transplant Critical Care']
      },
      {
        id: 'HOSP-05',
        name: 'Poona Hospital & Research Centre',
        address: '27, Ganeshmala, Sadashiv Peth, Pune 411030',
        latitude: 18.5115,
        longitude: 73.8480,
        helpline: '+91 20 2433 1707',
        icu_beds: 6,
        trauma_lead: 'Dr. Snehal Vaidya',
        status: 'READY & ACCEPTING',
        specialties: ['General Trauma', 'Cardiac Resuscitation', 'Surgical Emergency']
      }
    ],

    routeNodes: [
      {
        id: 'NODE-01',
        trip_id: 'TRIP-CX-8841',
        sequence: 1,
        name: 'Karve Road / Kothrud Stand Junction',
        latitude: 18.5065,
        longitude: 73.8118,
        status: 'ACTIVE',
        traffic_density: 'HEAVY (Peak Congestion)',
        large_board_id: 'BOARD-L-01',
        small_board_id: 'BOARD-S-01'
      },
      {
        id: 'NODE-02',
        trip_id: 'TRIP-CX-8841',
        sequence: 2,
        name: 'Nal Stop Flyover & Metro Gantry',
        latitude: 18.5088,
        longitude: 73.8208,
        status: 'PREPARING',
        traffic_density: 'CRITICAL (Bumper to Bumper)',
        large_board_id: 'BOARD-L-02',
        small_board_id: 'BOARD-S-02'
      },
      {
        id: 'NODE-03',
        trip_id: 'TRIP-CX-8841',
        sequence: 3,
        name: 'Mhatre Bridge River Cross Intersection',
        latitude: 18.5062,
        longitude: 73.8258,
        status: 'STANDBY',
        traffic_density: 'MODERATE (Signal Phase Sync)',
        large_board_id: 'BOARD-L-03',
        small_board_id: 'BOARD-S-03'
      },
      {
        id: 'NODE-04',
        trip_id: 'TRIP-CX-8841',
        sequence: 4,
        name: 'Erandwane DP Road Emergency Feeder',
        latitude: 18.5036,
        longitude: 73.8275,
        status: 'STANDBY',
        traffic_density: 'RESTRICTED (Hospital Zone)',
        large_board_id: 'BOARD-L-04',
        small_board_id: 'BOARD-S-04'
      },
      {
        id: 'NODE-05',
        trip_id: 'TRIP-CX-8841',
        sequence: 5,
        name: 'Deenanath Mangeshkar Hospital Trauma Bay',
        latitude: 18.5020,
        longitude: 73.8290,
        status: 'STANDBY',
        traffic_density: 'PRIORITY CLEAR',
        large_board_id: 'BOARD-L-05',
        small_board_id: 'BOARD-S-05'
      }
    ],

    digitalBoards: [
      {
        id: 'BOARD-L-01',
        node_id: 'NODE-01',
        board_name: 'Gantry Board 01 (Large)',
        intersection_name: 'Karve Road / Kothrud Stand',
        type: 'LARGE_INTERSECTION',
        status: 'ACTIVE',
        lane_allocation: 'LANE 1 (RIGHT CORRIDOR)',
        latitude: 18.5065,
        longitude: 73.8118,
        current_messages: {
          line1: '🚨 EMERGENCY CORRIDOR ACTIVE',
          line2: 'KEEP RIGHT LANE COMPLETELY CLEAR NOW',
          line3: 'AMBULANCE INCOMING — STOP CROSS TRAFFIC',
          arrow: 'STRAIGHT_FAST'
        }
      },
      {
        id: 'BOARD-S-01',
        node_id: 'NODE-01',
        board_name: 'Roadside Matrix 01 (Small)',
        intersection_name: 'Karve Road Mid-Block Marker',
        type: 'SMALL_ROADSIDE',
        status: 'ACTIVE',
        lane_allocation: 'MEDIAN POST',
        latitude: 18.5069,
        longitude: 73.8110,
        current_messages: {
          line1: 'MOVE LEFT NOW ➔',
          line2: 'AMBULANCE 20 SEC',
          arrow: 'RIGHT'
        }
      },
      {
        id: 'BOARD-L-02',
        node_id: 'NODE-02',
        board_name: 'Gantry Board 02 (Large)',
        intersection_name: 'Nal Stop Double Flyover Gantry',
        type: 'LARGE_INTERSECTION',
        status: 'PREPARING',
        lane_allocation: 'FLYOVER LOWER BAY - LANE 2',
        latitude: 18.5088,
        longitude: 73.8208,
        current_messages: {
          line1: '⚠ AMBULANCE INCOMING VIA KARVE RD',
          line2: 'PREPARE TO HOLD EASTBOUND SIGNAL',
          line3: 'ARRIVAL ETA: 1 MIN 45 SEC',
          arrow: 'STRAIGHT'
        }
      },
      {
        id: 'BOARD-S-02',
        node_id: 'NODE-02',
        board_name: 'Roadside Matrix 02 (Small)',
        intersection_name: 'Nal Stop Approach Pillar',
        type: 'SMALL_ROADSIDE',
        status: 'PREPARING',
        lane_allocation: 'FLYOVER PILLAR 14',
        latitude: 18.5082,
        longitude: 73.8185,
        current_messages: {
          line1: 'AMBULANCE INCOMING',
          line2: 'STAY IN LEFT LANE',
          arrow: 'LEFT_STAY'
        }
      },
      {
        id: 'BOARD-L-03',
        node_id: 'NODE-03',
        board_name: 'Gantry Board 03 (Large)',
        intersection_name: 'Mhatre Bridge Signal Crossing',
        type: 'LARGE_INTERSECTION',
        status: 'STANDBY',
        lane_allocation: 'BRIDGE APPROACH - FAST LANE',
        latitude: 18.5062,
        longitude: 73.8258,
        current_messages: {
          line1: 'MHATRE BRIDGE RIVER ROUTE',
          line2: 'CORRIDORX SMART TRANSIT ACTIVE',
          line3: 'CAUTION: WET ROADWAYS AT NIGHT',
          arrow: 'NONE'
        }
      },
      {
        id: 'BOARD-S-03',
        node_id: 'NODE-03',
        board_name: 'Roadside Matrix 03 (Small)',
        intersection_name: 'Mhatre Bridge Entry Post',
        type: 'SMALL_ROADSIDE',
        status: 'STANDBY',
        lane_allocation: 'ROADSIDE BOLLARD',
        latitude: 18.5055,
        longitude: 73.8262,
        current_messages: {
          line1: 'MHATRE BRIDGE',
          line2: 'SMOOTH TRAFFIC',
          arrow: 'NONE'
        }
      }
    ],

    trips: [
      {
        id: 'TRIP-CX-8841',
        request_id: 'REQ-9921',
        ambulance_id: 'AMB-102',
        hospital_id: 'HOSP-01',
        patient_name: 'Rahul Sharma',
        contact: '+91 98765 43210',
        emergency_type: 'Chest Pain / Acute STEMI',
        pickup_address: 'Paud Road, Near Kothrud Stand, Pune',
        pickup_lat: 18.5074,
        pickup_lng: 73.8065,
        status: 'EN_ROUTE',
        started_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
        completed_at: null,
        eta_seconds: 280,
        distance_km: 2.1,
        speed_kmh: 58,
        current_junction: 'Nal Stop Flyover',
        notes: 'Severe chest tightness radiating to left arm. Conscious.'
      },
      {
        id: 'TRIP-CX-8839',
        request_id: 'REQ-9918',
        ambulance_id: 'AMB-205',
        hospital_id: 'HOSP-04',
        patient_name: 'Priya Joshi',
        contact: '+91 98223 99881',
        emergency_type: 'Road Traffic Accident (Polytrauma)',
        pickup_address: 'Shivajinagar Signal, Pune',
        pickup_lat: 18.5204,
        pickup_lng: 73.8567,
        status: 'EN_ROUTE',
        started_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
        completed_at: null,
        eta_seconds: 140,
        distance_km: 1.2,
        speed_kmh: 52,
        current_junction: 'Sassoon Gantry',
        notes: 'Polytrauma, blood loss stabilized by EMT.'
      }
    ]
  };
};

module.exports = { generateSeedData };
