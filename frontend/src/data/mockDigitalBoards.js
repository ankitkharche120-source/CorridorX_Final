export const mockDigitalBoards = [
  {
    id: 'BOARD-L-01',
    name: 'Gantry Board 01 (Large)',
    intersectionName: 'Karve Road / Kothrud Stand',
    type: 'LARGE_INTERSECTION',
    nodeId: 'NODE-01',
    location: { lat: 18.5065, lng: 73.8118 },
    status: 'STANDBY', // 'NORMAL' | 'PREPARING' | 'ACTIVE' | 'PASSED'
    laneAllocation: 'LANE 1 (RIGHT CORRIDOR)',
    messages: {
      NORMAL: {
        line1: 'CORRIDORX TRAFFIC NETWORK',
        line2: 'DRIVE SAFELY • FOLLOW SPEED LIMIT 40 KM/H',
        line3: 'EMERGENCY LANE DEDICATED',
        arrow: 'NONE'
      },
      PREPARING: {
        line1: '⚠ AMBULANCE APPROACHING 900M',
        line2: 'MERGE LEFT • PREPARE TO CLEAR RIGHT LANE',
        line3: 'APPROACH ETA: 60 SECONDS',
        arrow: 'RIGHT_MERGE'
      },
      ACTIVE: {
        line1: '🚨 EMERGENCY CORRIDOR ACTIVE',
        line2: 'KEEP RIGHT LANE COMPLETELY CLEAR NOW',
        line3: 'AMBULANCE INCOMING — STOP CROSS TRAFFIC',
        arrow: 'STRAIGHT_FAST'
      },
      PASSED: {
        line1: '✔ AMBULANCE PASSED SAFELY',
        line2: 'RESUMING NORMAL TRAFFIC SIGNALS',
        line3: 'THANK YOU FOR CLEARING THE WAY',
        arrow: 'NORMAL'
      }
    }
  },
  {
    id: 'BOARD-S-01',
    name: 'Roadside Matrix 01 (Small)',
    intersectionName: 'Karve Road Mid-Block Marker',
    type: 'SMALL_ROADSIDE',
    nodeId: 'NODE-01',
    location: { lat: 18.5069, lng: 73.8110 },
    status: 'STANDBY',
    laneAllocation: 'MEDIAN POST',
    messages: {
      NORMAL: {
        line1: 'CORRIDORX SMART CITY',
        line2: 'GIVE WAY TO SIRENS',
        arrow: 'NONE'
      },
      PREPARING: {
        line1: 'AMBULANCE APPROACHING',
        line2: 'CLEAR RIGHT LANE',
        arrow: 'RIGHT'
      },
      ACTIVE: {
        line1: 'MOVE LEFT NOW ➔',
        line2: 'AMBULANCE 20 SEC',
        arrow: 'RIGHT'
      },
      PASSED: {
        line1: 'RESUME NORMAL FLOW',
        line2: 'THANK YOU',
        arrow: 'NONE'
      }
    }
  },
  {
    id: 'BOARD-L-02',
    name: 'Gantry Board 02 (Large)',
    intersectionName: 'Nal Stop Double Flyover Gantry',
    type: 'LARGE_INTERSECTION',
    nodeId: 'NODE-02',
    location: { lat: 18.5088, lng: 73.8208 },
    status: 'STANDBY',
    laneAllocation: 'FLYOVER LOWER BAY - LANE 2',
    messages: {
      NORMAL: {
        line1: 'PUNE TRAFFIC POLICE • CORRIDORX',
        line2: 'NAL STOP JUNCTION NORMAL FLOW',
        line3: 'AIR QUALITY INDEX: MODERATE (92)',
        arrow: 'NONE'
      },
      PREPARING: {
        line1: '⚠ AMBULANCE INCOMING VIA KARVE RD',
        line2: 'PREPARE TO HOLD EASTBOUND SIGNAL',
        line3: 'ARRIVAL ETA: 1 MIN 45 SEC',
        arrow: 'STRAIGHT'
      },
      ACTIVE: {
        line1: '🚨 PRIORITY 1 AMBULANCE CROSSING',
        line2: 'CROSS TRAFFIC FROM LAW COLLEGE RD STOPPED',
        line3: 'KEEP FLYOVER LEFT RAMP CLEAR',
        arrow: 'FORWARD'
      },
      PASSED: {
        line1: '✔ AMBULANCE CLEARED NAL STOP',
        line2: 'SIGNAL PHASE CYCLE RESTORED',
        line3: 'TRAFFIC DISPERSING NORMALLY',
        arrow: 'NORMAL'
      }
    }
  },
  {
    id: 'BOARD-S-02',
    name: 'Roadside Matrix 02 (Small)',
    intersectionName: 'Nal Stop Approach Pillar',
    type: 'SMALL_ROADSIDE',
    nodeId: 'NODE-02',
    location: { lat: 18.5082, lng: 73.8185 },
    status: 'STANDBY',
    laneAllocation: 'FLYOVER PILLAR 14',
    messages: {
      NORMAL: {
        line1: 'NAL STOP JUNCTION',
        line2: 'SPEED 30 KM/H',
        arrow: 'NONE'
      },
      PREPARING: {
        line1: 'AMBULANCE INCOMING',
        line2: 'STAY IN LEFT LANE',
        arrow: 'LEFT_STAY'
      },
      ACTIVE: {
        line1: 'KEEP RIGHT FREE',
        line2: 'EMERGENCY PASSING',
        arrow: 'RIGHT_CLEAR'
      },
      PASSED: {
        line1: 'FLOW RESTORED',
        line2: 'DRIVE SAFELY',
        arrow: 'NONE'
      }
    }
  },
  {
    id: 'BOARD-L-03',
    name: 'Gantry Board 03 (Large)',
    intersectionName: 'Mhatre Bridge Signal Crossing',
    type: 'LARGE_INTERSECTION',
    nodeId: 'NODE-03',
    location: { lat: 18.5062, lng: 73.8258 },
    status: 'STANDBY',
    laneAllocation: 'BRIDGE APPROACH - FAST LANE',
    messages: {
      NORMAL: {
        line1: 'MHATRE BRIDGE RIVER ROUTE',
        line2: 'CORRIDORX SMART TRANSIT ACTIVE',
        line3: 'CAUTION: WET ROADWAYS AT NIGHT',
        arrow: 'NONE'
      },
      PREPARING: {
        line1: '⚠ AMBULANCE HEADING TO ERANDWANE',
        line2: 'RIVER BRIDGE APPROACH PREPARING',
        line3: 'APPROACH ETA: 3 MIN 10 SEC',
        arrow: 'FORWARD_RIGHT'
      },
      ACTIVE: {
        line1: '🚨 CLEAR BRIDGE ACCESS CORRIDOR',
        line2: 'ALL VEHICLES YIELD TO AMBULANCE 102',
        line3: 'HOSPITAL ROUTE LOCKED GREEN',
        arrow: 'RIGHT'
      },
      PASSED: {
        line1: '✔ AMBULANCE ENTERED HOSPITAL ZONE',
        line2: 'MHATRE BRIDGE TRAFFIC RESUMED',
        line3: 'THANK YOU PUNE CITIZENS',
        arrow: 'NORMAL'
      }
    }
  },
  {
    id: 'BOARD-S-03',
    name: 'Roadside Matrix 03 (Small)',
    intersectionName: 'Mhatre Bridge Entry Post',
    type: 'SMALL_ROADSIDE',
    nodeId: 'NODE-03',
    location: { lat: 18.5055, lng: 73.8262 },
    status: 'STANDBY',
    laneAllocation: 'ROADSIDE BOLLARD',
    messages: {
      NORMAL: {
        line1: 'MHATRE BRIDGE',
        line2: 'SMOOTH TRAFFIC',
        arrow: 'NONE'
      },
      PREPARING: {
        line1: 'EMERGENCY INCOMING',
        line2: 'MERGE LEFT',
        arrow: 'LEFT'
      },
      ACTIVE: {
        line1: 'AMBULANCE ON BRIDGE',
        line2: 'DO NOT BLOCK',
        arrow: 'STRAIGHT'
      },
      PASSED: {
        line1: 'RESUME SPEED',
        line2: 'CORRIDOR CLEAR',
        arrow: 'NONE'
      }
    }
  },
  {
    id: 'BOARD-L-04',
    name: 'Gantry Board 04 (Large)',
    intersectionName: 'Erandwane DP Road Emergency Gate',
    type: 'LARGE_INTERSECTION',
    nodeId: 'NODE-04',
    location: { lat: 18.5036, lng: 73.8275 },
    status: 'STANDBY',
    laneAllocation: 'HOSPITAL CORRIDOR LANE',
    messages: {
      NORMAL: {
        line1: 'DEENANATH HOSPITAL APPROACH',
        line2: 'SILENCE ZONE • NO HONKING',
        line3: '24/7 TRAUMA CARE ACCESS',
        arrow: 'NONE'
      },
      PREPARING: {
        line1: '⚠ CRITICAL PATIENT INCOMING',
        line2: 'CLEARING DP ROAD FEEDER TO GATE 1',
        line3: 'ARRIVAL ETA: 90 SECONDS',
        arrow: 'STRAIGHT'
      },
      ACTIVE: {
        line1: '🚨 HOSPITAL RAMP PRIORITY ACTIVE',
        line2: 'ALL NON-EMERGENCY VEHICLES HALT',
        line3: 'TRAUMA BAY PREPPED FOR RESUSCITATION',
        arrow: 'STRAIGHT'
      },
      PASSED: {
        line1: '✔ PATIENT ARRIVED AT TRAUMA BAY',
        line2: 'CORRIDOR MISSION ACCOMPLISHED',
        line3: 'CORRIDORX SYSTEM STANDBY',
        arrow: 'CHECK'
      }
    }
  }
];
