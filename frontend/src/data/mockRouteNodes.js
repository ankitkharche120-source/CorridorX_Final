export const mockRouteNodes = [
  {
    id: 'NODE-01',
    name: 'Karve Road / Kothrud Stand Junction',
    sequence: 1,
    type: 'LARGE_INTERSECTION',
    description: 'Major arterial 4-way intersection with Karve Statue Signal',
    location: {
      lat: 18.5065,
      lng: 73.8118
    },
    distanceFromStartMeters: 450,
    largeBoardId: 'BOARD-L-01',
    smallBoardId: 'BOARD-S-01',
    normalState: 'STANDBY',
    trafficDensity: 'HEAVY (Peak Congestion)'
  },
  {
    id: 'NODE-02',
    name: 'Nal Stop Flyover & Metro Gantry',
    sequence: 2,
    type: 'HIGHWAY_AND_METRO_JUNCTION',
    description: 'High-density double-decker flyover choke point',
    location: {
      lat: 18.5088,
      lng: 73.8208
    },
    distanceFromStartMeters: 1450,
    largeBoardId: 'BOARD-L-02',
    smallBoardId: 'BOARD-S-02',
    normalState: 'STANDBY',
    trafficDensity: 'CRITICAL (Bumper to Bumper)'
  },
  {
    id: 'NODE-03',
    name: 'Mhatre Bridge River Cross Intersection',
    sequence: 3,
    type: 'LARGE_INTERSECTION',
    description: 'Mutha river bank junction heading to Erandwane',
    location: {
      lat: 18.5062,
      lng: 73.8258
    },
    distanceFromStartMeters: 2150,
    largeBoardId: 'BOARD-L-03',
    smallBoardId: 'BOARD-S-03',
    normalState: 'STANDBY',
    trafficDensity: 'MODERATE (Signal Phase Sync)'
  },
  {
    id: 'NODE-04',
    name: 'Erandwane DP Road Emergency Feeder',
    sequence: 4,
    type: 'FEEDER_ROAD_SPLIT',
    description: 'Immediate access feeder lane towards Hospital Trauma Gate',
    location: {
      lat: 18.5036,
      lng: 73.8275
    },
    distanceFromStartMeters: 2650,
    largeBoardId: 'BOARD-L-04',
    smallBoardId: 'BOARD-S-04',
    normalState: 'STANDBY',
    trafficDensity: 'RESTRICTED (Hospital Zone)'
  },
  {
    id: 'NODE-05',
    name: 'Deenanath Mangeshkar Hospital Trauma Bay',
    sequence: 5,
    type: 'HOSPITAL_ARRIVAL_BAY',
    description: 'Emergency Gate and Ambulance Arrival Ramp',
    location: {
      lat: 18.5020,
      lng: 73.8290
    },
    distanceFromStartMeters: 3100,
    largeBoardId: 'BOARD-L-05',
    smallBoardId: 'BOARD-S-05',
    normalState: 'STANDBY',
    trafficDensity: 'PRIORITY CLEAR'
  }
];

// High-resolution interpolation waypoints between Pickup and Destination
export const mockEmergencyPathWaypoints = [
  { lat: 18.5074, lng: 73.8065, step: 0, label: 'Patient Pickup Point (Paud Rd, Kothrud)' },
  { lat: 18.5071, lng: 73.8082, step: 1 },
  { lat: 18.5068, lng: 73.8100, step: 2 },
  { lat: 18.5065, lng: 73.8118, step: 3, label: 'Junction 1: Karve Statue' },
  { lat: 18.5072, lng: 73.8145, step: 4 },
  { lat: 18.5078, lng: 73.8172, step: 5 },
  { lat: 18.5084, lng: 73.8195, step: 6 },
  { lat: 18.5088, lng: 73.8208, step: 7, label: 'Junction 2: Nal Stop Flyover' },
  { lat: 18.5082, lng: 73.8225, step: 8 },
  { lat: 18.5073, lng: 73.8242, step: 9 },
  { lat: 18.5062, lng: 73.8258, step: 10, label: 'Junction 3: Mhatre Bridge' },
  { lat: 18.5050, lng: 73.8268, step: 11 },
  { lat: 18.5036, lng: 73.8275, step: 12, label: 'Junction 4: Erandwane Feeder' },
  { lat: 18.5028, lng: 73.8282, step: 13 },
  { lat: 18.5020, lng: 73.8290, step: 14, label: 'Deenanath Mangeshkar Hospital' }
];
