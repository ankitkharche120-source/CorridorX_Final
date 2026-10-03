import React, { useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEmergency } from '../context/EmergencyContext';
import { DEMO_CONFIG } from '../data/demoConfig';

// Component to handle map camera changes
const MapUpdater = ({ lat, lng, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], zoom, {
        duration: 1.2
      });
    }
  }, [lat, lng, map, zoom]);
  return null;
};

export const MapContainer = ({ height = "100%", interactive = true, showHospitalMarkers = true, theme = "light" }) => {
  const { 
    activeTrip,
    currentCoords, 
    nodes, 
    selectedAmbulance, 
    availableAmbulances = [],
    selectedHospital, 
    isSimulating,
    currentSpeedKmh,
    currentHeading,
    isRouteDeviated,
    simulationIndex,
    tripStage,
    tripStatus,
    corridorStatus,
    activeWaypoints,
    routeError
  } = useEmergency();

  // Single Source of Truth
  const pickupLocation = activeTrip?.pickupLocation || { 
    lat: DEMO_CONFIG.pickup.lat, 
    lng: DEMO_CONFIG.pickup.lng, 
    address: DEMO_CONFIG.pickup.name 
  };

  const hospitalPoint = {
    lat: selectedHospital?.latitude || selectedHospital?.lat || 18.5020,
    lng: selectedHospital?.longitude || selectedHospital?.lng || 73.8290
  };

  const isPickupStage = tripStage === 'PICKUP_STAGE';
  const isArrived = tripStatus === 'ARRIVED_AT_HOSPITAL' || tripStatus === 'COMPLETED';

  // Routes
  const waypoints = activeWaypoints || [];
  const fullCoords = waypoints.map(p => [p.lat, p.lng]); // Leaflet uses [lat, lng]
  const completedCoords = fullCoords.slice(0, Math.min(simulationIndex + 1, fullCoords.length));
  const remainingCoords = fullCoords.slice(simulationIndex);

  // Icons
  const pickupIcon = L.divIcon({
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; width: 120px;">
        <div style="width: 36px; height: 36px; border-radius: 9999px; background: #2563eb; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.65);">
          <span style="font-size: 20px; line-height: 1;">📍</span>
        </div>
        <div style="margin-top: 3px; background: #1e3a8a; color: #ffffff; border: 1.5px solid #60a5fa; padding: 2px 7px; border-radius: 6px; font-size: 9.5px; font-weight: 800; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
          PATIENT PICKUP
        </div>
      </div>
    `,
    className: '',
    iconSize: [120, 60],
    iconAnchor: [60, 60] // Bottom center
  });

  const hospitalIcon = L.divIcon({
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; width: 120px;">
        <div style="width: 38px; height: 38px; border-radius: 12px; background: #059669; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.75);">
          <span style="font-size: 22px; line-height: 1;">🏥</span>
        </div>
        <div style="margin-top: 3px; background: #064e3b; color: #ffffff; border: 1.5px solid #34d399; padding: 2px 7px; border-radius: 6px; font-size: 9.5px; font-weight: 800; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
          TRAUMA BAY
        </div>
      </div>
    `,
    className: '',
    iconSize: [120, 60],
    iconAnchor: [60, 60]
  });

  const ambulanceIcon = L.divIcon({
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; width: 120px;">
        <div style="position: absolute; top: 0; width: 48px; height: 48px; border-radius: 9999px; background: rgba(220, 38, 38, 0.35); animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 40px; height: 40px; border-radius: 9999px; background: #dc2626; border: 2.5px solid #ffffff; box-shadow: 0 4px 16px rgba(220, 38, 38, 0.85); display: flex; align-items: center; justify-content: center; color: white; margin-top: 4px;">
          <span style="font-size: 22px; line-height: 1;">🚑</span>
        </div>
        <div style="margin-top: 3px; background: #111827; color: #fca5a5; border: 1.5px solid #ef4444; padding: 2px 7px; border-radius: 6px; font-size: 10px; font-weight: 800; white-space: nowrap; font-family: monospace; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">
          ${selectedAmbulance?.id || 'AMB-101'} • ${currentSpeedKmh} KM/H
        </div>
      </div>
    `,
    className: '',
    iconSize: [120, 70],
    iconAnchor: [60, 35]
  });

  const createNodeIcon = (node) => {
    const isAct = node.status === 'ACTIVE';
    const isPrep = node.status === 'PREPARING';
    const isNorm = node.status === 'NORMALIZED';
    const isPass = node.status === 'PASSED';

    const signalColor = isAct ? '#ef4444' : (isPrep ? '#f59e0b' : (isNorm || isPass ? '#10b981' : '#64748b'));
    const pulse = isAct ? '<div style="position: absolute; top: 0; width: 40px; height: 40px; border-radius: 9999px; background: rgba(239,68,68,0.5); animation: ping 1.2s infinite;"></div>' : '';

    return L.divIcon({
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; width: 120px;">
          ${pulse}
          <div style="position: relative; width: 30px; height: 30px; border-radius: 9999px; background: #ffffff; border: 2.5px solid ${signalColor}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.25); margin-top: 5px;">
            <span style="font-size: 15px; line-height: 1;">🚦</span>
          </div>
          <div style="margin-top: 2px; background: #ffffff; color: ${signalColor}; border: 1.5px solid ${signalColor}; padding: 1.5px 5px; border-radius: 5px; font-size: 9px; font-weight: 800; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
            ${node.id || 'J-00'} • ${node.status}
          </div>
        </div>
      `,
      className: '',
      iconSize: [120, 60],
      iconAnchor: [60, 30]
    });
  };

  const createAvailableAmbIcon = (amb) => {
    return L.divIcon({
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; width: 120px;">
          <div style="width: 28px; height: 28px; border-radius: 9999px; background: #0284c7; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.6); display: flex; align-items: center; justify-content: center; color: white;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v9c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <path d="M9 17h6"/>
              <circle cx="17" cy="17" r="2"/>
            </svg>
          </div>
          <div style="margin-top: 2px; background: #0f172a; color: #38bdf8; border: 1px solid #0284c7; padding: 1px 5px; border-radius: 4px; font-size: 8.5px; font-weight: 800; white-space: nowrap;">
            ${amb.id} • AVAILABLE (DEMO)
          </div>
        </div>
      `,
      className: '',
      iconSize: [120, 50],
      iconAnchor: [60, 25]
    });
  };

  return (
    <div style={{ height }} className="w-full relative overflow-hidden rounded-3xl border border-slate-200/80 shadow-xl bg-slate-50 flex flex-col">
      {/* Header (same as before) */}
      <div className="bg-slate-100  px-4 py-2.5 border-b border-slate-200 flex items-center justify-between z-[400] text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${!isArrived && corridorStatus === 'ACTIVE' ? 'bg-red-500 animate-ping' : (isArrived ? 'bg-emerald-500' : 'bg-blue-600')}`} />
          <span className="font-sans font-bold text-slate-800 text-[12px]">
            {isArrived 
              ? 'DESTINATION REACHED • CORRIDOR RELEASED • SIGNALS NORMALIZED' 
              : (tripStage === 'PICKUP_STAGE'
                  ? (tripStatus === 'ARRIVED_AT_PICKUP' ? 'PICKUP REACHED • PATIENT BOARDING • CORRIDOR ACTIVE' : 'EMERGENCY CORRIDOR • GREEN WAVE TO PICKUP')
                  : 'EMERGENCY CORRIDOR • GREEN WAVE TO HOSPITAL')}
          </span>
          {isRouteDeviated ? (
            <span className="ml-2 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 font-mono font-bold text-[10px] flex items-center gap-1">
              ⚠️ ROUTE DEVIATION
            </span>
          ) : (
            <span className="hidden sm:inline-flex ml-2 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-semibold text-[10px]">
              ON ROUTE
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-600">
          {currentHeading > 0 && (
            <span className="hidden md:inline-block text-slate-500">
              HDG: <strong className="text-slate-800">{currentHeading}°</strong>
            </span>
          )}
          <span>
            Speed: <strong className="text-slate-900 font-black">{isArrived ? 0 : currentSpeedKmh} km/h</strong>
            <span className="ml-2 text-slate-600 font-mono text-[9px] bg-slate-100 px-1 rounded border border-slate-200">
              PTS: {waypoints.length}
            </span>
          </span>
        </div>
      </div>

      {routeError && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] bg-red-600/90 text-white p-4 rounded-xl shadow-2xl font-bold border-2 border-red-400 text-center max-w-md">
          ⚠️ ROUTING ERROR:<br/>
          <span className="font-mono text-xs">{routeError}</span>
        </div>
      )}

      <div className="flex-1 w-full h-full relative z-0">
        <LeafletMap 
          center={[pickupLocation.lat, pickupLocation.lng]} 
          zoom={14} 
          zoomControl={interactive}
          dragging={interactive}
          scrollWheelZoom={interactive}
          className="w-full h-full"
        >
          {/* TileLayer using standard OpenStreetMap tiles */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
          />

          <MapUpdater lat={pickupLocation.lat} lng={pickupLocation.lng} zoom={14} />

          {/* Route Background Layer */}
          <Polyline positions={fullCoords} pathOptions={{ color: '#1e3a8a', weight: 9, opacity: 0.8, lineCap: 'round', lineJoin: 'round' }} />
          
          {/* Route Completed Layer */}
          <Polyline positions={completedCoords} pathOptions={{ color: '#059669', weight: 6, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }} />
          
          {/* Route Remaining Layer */}
          <Polyline positions={remainingCoords} pathOptions={{ color: '#2563eb', weight: 6, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }} />

          {/* Pickup Marker */}
          <Marker position={[pickupLocation.lat, pickupLocation.lng]} icon={pickupIcon}>
            <Popup>
              <div style={{ padding: '4px', fontFamily: 'sans-serif' }}>
                <strong style={{ color: '#2563eb', fontSize: '11.5px' }}>📍 PATIENT PICKUP LOCATION</strong>
                <p style={{ margin: '2px 0 0 0', color: '#1e293b', fontSize: '11px' }}>{pickupLocation.address || pickupLocation.name}</p>
                <small style={{ color: '#64748b', fontFamily: 'monospace' }}>{pickupLocation.lat.toFixed(5)}, {pickupLocation.lng.toFixed(5)}</small>
              </div>
            </Popup>
          </Marker>

          {/* Hospital Marker */}
          <Marker position={[hospitalPoint.lat, hospitalPoint.lng]} icon={hospitalIcon} />

          {/* Ambulance Marker */}
          <Marker position={[currentCoords.lat, currentCoords.lng]} icon={ambulanceIcon} zIndexOffset={1000} />

          {/* Node Markers (Hidden per user request) */}
          {/* nodes?.map(node => (
            <Marker key={node.id || Math.random()} position={[node.location?.lat || node.lat, node.location?.lng || node.lng]} icon={createNodeIcon(node)} />
          )) */}

          {/* Available Ambulances */}
          {isPickupStage && availableAmbulances.filter(a => a.id !== selectedAmbulance?.id).map(amb => (
            <Marker key={amb.id} position={[amb.lat, amb.lng]} icon={createAvailableAmbIcon(amb)} />
          ))}

        </LeafletMap>
      </div>

      {/* Floating Corridor Status Key */}
      {corridorStatus === 'ACTIVE' && !isArrived && (
        <div className="absolute top-14 right-4 z-[400] bg-slate-100  border border-slate-200/90 p-2.5 rounded-2xl shadow-xl text-xs space-y-1.5 pointer-events-auto hidden sm:block">
          <div className="font-bold text-[10px] text-slate-600 tracking-wider uppercase mb-1 flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
            <span>Signal Preemption</span>
            <span className="font-mono text-emerald-600 font-bold">V2X WAVE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-slate-800 font-medium text-[11px]">ACTIVE (Preempted Green)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-slate-800 font-medium text-[11px]">PREPARING (Warning Phase)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-800 font-medium text-[11px]">PASSED / NORMALIZED</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapContainer;


