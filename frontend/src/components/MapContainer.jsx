import React, { useEffect, useState } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { useEmergency, NEUTRAL_INDIA_CENTER, NEUTRAL_INDIA_ZOOM } from '../context/EmergencyContext';
import { 
  getGoogleMapsApiKey, 
  hasValidGoogleMapsKey, 
  GMP_ATTRIBUTION_ID, 
  tacticalDarkMapStyles 
} from '../services/googleMapsService';
import { mockEmergencyPathWaypoints } from '../data/mockRouteNodes';
import { Navigation, Radio, MapPin, Hospital, Layers, AlertCircle, Compass, ShieldCheck } from 'lucide-react';

// Leaflet recenter helper
const LeafletRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
};

export const MapContainer = ({ height = "100%", interactive = true, showHospitalMarkers = true }) => {
  const { 
    currentCoords, 
    nodes, 
    selectedAmbulance, 
    selectedHospital, 
    nearbyHospitals = [],
    selectHospitalById,
    emergencyRequest,
    isSimulating,
    currentSpeedKmh,
    simulationIndex,
    operatingMode,
    toggleOperatingMode,
    mapEngine,
    setMapEngine,
    liveLocation,
    activeWaypoints,
    calculatedRoute
  } = useEmergency();

  const hasGKey = hasValidGoogleMapsKey();
  const apiKey = getGoogleMapsApiKey();

  // Active center coordinates (Priority: selected pickup -> live GPS -> neutral India)
  const activeCenter = emergencyRequest?.pickupCoords
    ? emergencyRequest.pickupCoords
    : ((operatingMode === 'REAL' && liveLocation.location) 
        ? liveLocation.location 
        : (currentCoords || NEUTRAL_INDIA_CENTER));

  const defaultZoom = emergencyRequest?.pickupCoords ? 14 : (liveLocation.location ? 14 : NEUTRAL_INDIA_ZOOM);

  // -------------------------------------------------------------
  // Leaflet Custom Icons
  // -------------------------------------------------------------
  const ambulanceIcon = L.divIcon({
    className: 'custom-amb-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
        <div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: rgba(239, 68, 68, 0.35); animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 36px; height: 36px; border-radius: 9999px; background: #dc2626; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.7); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v9c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <path d="M9 17h6"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
        <div style="margin-top: 4px; background: #0f172a; color: #f87171; border: 1px solid #dc2626; padding: 2px 6px; border-radius: 6px; font-size: 10px; font-weight: 800; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.6); font-family: monospace;">
          ${selectedAmbulance?.id || 'AMB-102'} • ${currentSpeedKmh} KM/H
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });

  const realGpsUserIcon = L.divIcon({
    className: 'custom-real-gps-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
        <div style="position: absolute; width: 40px; height: 40px; border-radius: 9999px; background: rgba(59, 130, 246, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 28px; height: 28px; border-radius: 9999px; background: #2563eb; border: 2.5px solid #ffffff; box-shadow: 0 0 12px rgba(59, 130, 246, 0.8); display: flex; align-items: center; justify-content: center; color: white;">
          <div style="width: 10px; height: 10px; border-radius: 9999px; background: white;"></div>
        </div>
        <div style="margin-top: 4px; background: #0f172a; color: #60a5fa; border: 1px solid #3b82f6; padding: 2px 6px; border-radius: 6px; font-size: 9.5px; font-weight: 800; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.6);">
          YOUR REAL GPS (±${Math.round(liveLocation.accuracy || 10)}m)
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  const pickupIcon = L.divIcon({
    className: 'custom-pickup-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="width: 32px; height: 32px; border-radius: 9999px; background: #2563eb; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.5);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div style="margin-top: 2px; background: #1e293b; color: #93c5fd; border: 1px solid #3b82f6; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; white-space: nowrap;">
          PICKUP POINT
        </div>
      </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42]
  });

  const hospitalIcon = L.divIcon({
    className: 'custom-hosp-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="width: 34px; height: 34px; border-radius: 10px; background: #059669; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.6);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 6v12M6 12h12"/>
          </svg>
        </div>
        <div style="margin-top: 2px; background: #064e3b; color: #6ee7b7; border: 1px solid #10b981; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800; white-space: nowrap;">
          TRAUMA BAY DESTINATION
        </div>
      </div>
    `,
    iconSize: [34, 44],
    iconAnchor: [17, 44]
  });

  const getNodeIcon = (node) => {
    let bgColor = '#475569';
    let borderColor = '#64748b';
    let badgeText = 'STANDBY';
    let pulseHtml = '';

    if (node.status === 'ACTIVE') {
      bgColor = '#ef4444';
      borderColor = '#ffffff';
      badgeText = 'CORRIDOR ACTIVE';
      pulseHtml = '<div style="position: absolute; inset: -6px; border-radius: 9999px; background: rgba(239, 68, 68, 0.5); animation: ping 1s infinite;"></div>';
    } else if (node.status === 'PREPARING') {
      bgColor = '#f59e0b';
      borderColor = '#ffffff';
      badgeText = 'PREPARING TRAFFIC';
      pulseHtml = '<div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(245, 158, 11, 0.4); animation: pulse 1.5s infinite;"></div>';
    } else if (node.status === 'PASSED') {
      bgColor = '#10b981';
      borderColor = '#ffffff';
      badgeText = 'PASSED (NORMAL)';
    }

    return L.divIcon({
      className: `node-marker-${node.id}`,
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
          ${pulseHtml}
          <div style="position: relative; width: 26px; height: 26px; border-radius: 9999px; background: ${bgColor}; border: 2px solid ${borderColor}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 11px; box-shadow: 0 2px 8px rgba(0,0,0,0.5);">
            J${node.sequence}
          </div>
          <div style="margin-top: 3px; background: #0f172a; color: ${node.status === 'ACTIVE' ? '#f87171' : (node.status === 'PREPARING' ? '#fde047' : '#94a3b8')}; border: 1px solid #334155; padding: 1px 5px; border-radius: 4px; font-size: 8.5px; font-weight: 800; white-space: nowrap;">
            ${node.name.split('/')[0].trim()} • ${badgeText}
          </div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  };

  // Dynamic route waypoints adapting to any Indian city
  const waypoints = (activeWaypoints && activeWaypoints.length > 0) ? activeWaypoints : mockEmergencyPathWaypoints;
  const fullPathCoords = waypoints.map(p => [p.lat, p.lng]);
  const completedCoords = fullPathCoords.slice(0, Math.min(simulationIndex + 1, fullPathCoords.length));
  const remainingCoords = fullPathCoords.slice(simulationIndex);

  const pickupPoint = emergencyRequest?.pickupCoords || waypoints[0];
  const hospitalPoint = (selectedHospital?.latitude && selectedHospital?.longitude)
    ? { lat: selectedHospital.latitude, lng: selectedHospital.longitude }
    : waypoints[waypoints.length - 1];

  return (
    <div style={{ height }} className="w-full relative overflow-hidden rounded-3xl border border-slate-800 shadow-2xl bg-slate-950 flex flex-col">
      
      {/* Top Telemetry & Mode Controller Strip */}
      <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-10 text-xs">
        
        {/* Operating Mode Indicator */}
        <div className="flex items-center gap-2">
          {operatingMode === 'REAL' ? (
            <button
              onClick={toggleOperatingMode}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold hover:bg-emerald-500/30 transition-colors"
              title="Click to switch to offline simulation mode"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>REAL MODE (LIVE GPS)</span>
            </button>
          ) : (
            <button
              onClick={toggleOperatingMode}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold hover:bg-amber-500/30 transition-colors"
              title="Click to switch to live GPS mode"
            >
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span>DEMO MODE (PUNE CORRIDOR)</span>
            </button>
          )}

          {liveLocation.isWatching && (
            <span className="text-[11px] text-slate-400 hidden sm:inline font-mono">
              GPS: ±{Math.round(liveLocation.accuracy || 0)}m • {liveLocation.accuracyQuality}
            </span>
          )}
        </div>

        {/* Map Engine Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 rounded-xl p-0.5 border border-slate-800 text-[11px]">
            <button
              onClick={() => setMapEngine('google')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                mapEngine === 'google' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              title={hasGKey ? "Google Maps Platform (Advanced Markers)" : "Google Maps Key required in .env"}
            >
              Google Maps {hasGKey ? '✓' : ''}
            </button>
            <button
              onClick={() => setMapEngine('leaflet')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                mapEngine === 'leaflet' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              OpenStreetMap
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Canvas */}
      <div className="flex-1 w-full h-full relative">
        {mapEngine === 'google' && hasGKey ? (
          /* Google Maps Platform (React @vis.gl/react-google-maps) */
          <APIProvider apiKey={apiKey}>
            <GoogleMap
              style={{ width: '100%', height: '100%' }}
              defaultCenter={activeCenter}
              defaultZoom={14}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={[GMP_ATTRIBUTION_ID]}
              disableDefaultUI={!interactive}
            >
              {/* Real Customer GPS Advanced Marker */}
              {liveLocation.location && (
                <AdvancedMarker position={liveLocation.location} title="Your Live Location">
                  <div className="relative flex flex-col items-center">
                    <div className="absolute w-10 h-10 rounded-full bg-blue-500/40 animate-ping"></div>
                    <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                    </div>
                    <span className="mt-1 px-1.5 py-0.5 rounded bg-slate-900 text-blue-400 border border-blue-500 text-[9px] font-bold font-mono">
                      YOU (±{Math.round(liveLocation.accuracy || 10)}m)
                    </span>
                  </div>
                </AdvancedMarker>
              )}

              {/* Moving Ambulance Advanced Marker */}
              <AdvancedMarker position={currentCoords} title={selectedAmbulance?.name}>
                <div className="relative flex flex-col items-center">
                  <div className="absolute w-11 h-11 rounded-full bg-red-500/35 animate-ping"></div>
                  <div className="w-9 h-9 rounded-full bg-red-600 border-2 border-white shadow-xl flex items-center justify-center text-white">
                    <Navigation className="w-5 h-5 fill-current" />
                  </div>
                  <span className="mt-1 px-1.5 py-0.5 rounded bg-slate-950 text-red-400 border border-red-500 text-[9px] font-mono font-extrabold">
                    {selectedAmbulance?.id || 'AMB-102'} • {currentSpeedKmh} KM/H
                  </span>
                </div>
              </AdvancedMarker>

              {/* Pickup Advanced Marker */}
              {pickupPoint && (
                <AdvancedMarker position={pickupPoint} title="Emergency Pickup Location">
                  <Pin background="#2563eb" borderColor="#ffffff" glyphColor="#ffffff" scale={1.1}>
                    <MapPin className="w-4 h-4 text-white" />
                  </Pin>
                </AdvancedMarker>
              )}

              {/* Hospital Advanced Marker */}
              {hospitalPoint && (
                <AdvancedMarker 
                  position={hospitalPoint}
                  title={selectedHospital?.name || 'Emergency Trauma Center'}
                >
                  <Pin background="#059669" borderColor="#ffffff" glyphColor="#ffffff" scale={1.2}>
                    <Hospital className="w-4 h-4 text-white" />
                  </Pin>
                </AdvancedMarker>
              )}

              {/* Corridor Signal Nodes */}
              {nodes.map(node => (
                <AdvancedMarker 
                  key={node.id} 
                  position={{ lat: node.location.lat, lng: node.location.lng }}
                  title={node.name}
                >
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono border shadow-lg ${
                    node.status === 'ACTIVE' 
                      ? 'bg-red-600 text-white border-white animate-pulse' 
                      : (node.status === 'PREPARING' ? 'bg-amber-500 text-slate-950 border-amber-300' : 'bg-slate-800 text-slate-400 border-slate-700')
                  }`}>
                    J{node.sequence}: {node.status}
                  </div>
                </AdvancedMarker>
              ))}
            </GoogleMap>
          </APIProvider>
        ) : (
          /* Leaflet High-Contrast Fallback Engine */
          <LeafletMap
            center={[activeCenter.lat, activeCenter.lng]}
            zoom={14}
            scrollWheelZoom={interactive}
            dragging={interactive}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <LeafletRecenter center={activeCenter} />

            {/* Traveled and Planned Polyline */}
            <Polyline
              positions={fullPathCoords}
              pathOptions={{ color: '#334155', weight: 8, opacity: 0.7, lineCap: 'round' }}
            />
            {completedCoords.length > 1 && (
              <Polyline
                positions={completedCoords}
                pathOptions={{ color: '#10b981', weight: 6, opacity: 0.9, lineCap: 'round' }}
              />
            )}
            {remainingCoords.length > 1 && (
              <Polyline
                positions={remainingCoords}
                pathOptions={{ 
                  color: '#ef4444', 
                  weight: 6, 
                  opacity: 0.9, 
                  dashArray: '10, 8',
                  lineCap: 'round' 
                }}
              />
            )}

            {/* Real Customer GPS Marker */}
            {liveLocation.location && (
              <Marker position={[liveLocation.location.lat, liveLocation.location.lng]} icon={realGpsUserIcon}>
                <Popup>
                  <div className="p-1">
                    <p className="text-xs font-bold text-blue-400">YOUR REAL DEVICE LOCATION</p>
                    <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                      Lat: {liveLocation.location.lat.toFixed(5)}, Lng: {liveLocation.location.lng.toFixed(5)}
                    </p>
                    <p className="text-[10px] text-slate-400">Accuracy: ±{Math.round(liveLocation.accuracy || 10)} meters</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Pickup Marker */}
            {pickupPoint && (
              <Marker position={[pickupPoint.lat, pickupPoint.lng]} icon={pickupIcon}>
                <Popup>
                  <div className="p-1">
                    <p className="text-xs font-bold text-blue-400">PATIENT PICKUP</p>
                    <p className="text-xs text-slate-200 mt-1">{emergencyRequest?.pickupLocation}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {pickupPoint.lat.toFixed(5)}, {pickupPoint.lng.toFixed(5)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* All Nearby Hospital Markers */}
            {showHospitalMarkers && nearbyHospitals.map((hosp) => {
              const isSelected = selectedHospital?.id === hosp.id;
              if (isSelected) return null; // Rendered as selected destination below
              const hLat = hosp.latitude || hosp.location?.lat;
              const hLng = hosp.longitude || hosp.location?.lng;
              if (!hLat || !hLng) return null;

              const hospitalPinIcon = L.divIcon({
                className: `hosp-marker-${hosp.id}`,
                html: `
                  <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer;">
                    <div style="width: 26px; height: 26px; border-radius: 8px; background: #065f46; border: 2px solid #34d399; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.6);">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M12 6v12M6 12h12"/>
                      </svg>
                    </div>
                    <div style="margin-top: 2px; background: #064e3b; color: #a7f3d0; border: 1px solid #059669; padding: 1px 4px; border-radius: 4px; font-size: 8.5px; font-weight: 700; white-space: nowrap; max-width: 120px; overflow: hidden; text-overflow: ellipsis;">
                      ${hosp.name.split(',')[0]}
                    </div>
                  </div>
                `,
                iconSize: [26, 36],
                iconAnchor: [13, 36]
              });

              return (
                <Marker key={hosp.id} position={[hLat, hLng]} icon={hospitalPinIcon}>
                  <Popup>
                    <div className="p-1 max-w-[220px]">
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase">
                        <span>Nearby Hospital</span>
                        {hosp.distanceKm && <span>• {hosp.distanceKm} km</span>}
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1">{hosp.name}</h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">{hosp.address}</p>
                      <button
                        onClick={() => selectHospitalById && selectHospitalById(hosp.id)}
                        className="mt-2 w-full py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] shadow transition-colors"
                      >
                        SELECT THIS HOSPITAL
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Hospital Destination Marker */}
            {hospitalPoint && (
              <Marker 
                position={[hospitalPoint.lat, hospitalPoint.lng]} 
                icon={hospitalIcon}
              >
                <Popup>
                  <div className="p-1">
                    <p className="text-xs font-bold text-emerald-400">EMERGENCY DESTINATION</p>
                    <p className="text-xs text-white font-semibold mt-0.5">{selectedHospital?.name}</p>
                    <p className="text-[11px] text-slate-300">{selectedHospital?.address}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Corridor Junction Nodes */}
            {nodes.map(node => (
              <Marker 
                key={node.id} 
                position={[node.location.lat, node.location.lng]} 
                icon={getNodeIcon(node)}
              >
                <Popup>
                  <div className="p-1 max-w-[200px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-800 text-red-400 border border-slate-700">
                        JUNCTION {node.sequence}
                      </span>
                      <span className={`text-[10px] font-bold ${
                        node.status === 'ACTIVE' ? 'text-red-400' : (node.status === 'PREPARING' ? 'text-amber-400' : 'text-slate-400')
                      }`}>
                        {node.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white mt-1.5">{node.name}</h4>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Live Moving Ambulance Marker */}
            <Marker position={[currentCoords.lat, currentCoords.lng]} icon={ambulanceIcon} zIndexOffset={1000}>
              <Popup>
                <div className="p-1">
                  <div className="flex items-center gap-1.5 text-red-400 font-extrabold text-xs">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    ACTIVE AMBULANCE EN ROUTE
                  </div>
                  <p className="text-xs font-bold text-white mt-1">{selectedAmbulance?.name}</p>
                  <p className="text-[11px] text-slate-300">Reg: {selectedAmbulance?.vehicleNumber}</p>
                </div>
              </Popup>
            </Marker>
          </LeafletMap>
        )}

        {/* Floating Signal Status Key */}
        <div className="absolute top-4 right-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-2.5 rounded-2xl shadow-xl text-xs space-y-1.5 pointer-events-auto hidden sm:block">
          <div className="font-bold text-[10px] text-slate-400 tracking-wider uppercase mb-1 flex items-center justify-between gap-2">
            <span>Corridor Signals</span>
            <span className="font-mono text-emerald-400">V2X SYNC</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-slate-200 font-medium text-[11px]">Junction Active (Preempted Green)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-slate-200 font-medium text-[11px]">Junction Preparing (Warning Lights)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-200 font-medium text-[11px]">Junction Passed (Normal Cycle)</span>
          </div>
        </div>

      </div>

      {/* Section 25: Mandatory Data Source Status Bar */}
      <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 text-[10px] font-mono flex flex-wrap items-center justify-between gap-2 text-slate-400">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-slate-300 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            MAP: <strong className="text-white">{mapEngine === 'google' ? 'GOOGLE MAPS' : 'LEAFLET/OSM'}</strong>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${liveLocation.location ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            GPS: <strong className={liveLocation.location ? 'text-emerald-400' : 'text-amber-400'}>{liveLocation.location ? 'LIVE (±' + Math.round(liveLocation.accuracy || 10) + 'm)' : 'STANDBY'}</strong>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            HOSPITALS: <strong className="text-emerald-400">LIVE DATA ({nearbyHospitals.length})</strong>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            ROUTE: <strong className="text-emerald-400">{calculatedRoute ? 'LIVE ROAD ROUTE' : 'LIVE COMPUTE'}</strong>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            AMBULANCE: <strong className="text-amber-400">DEMO FLEET</strong>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            CORRIDOR: <strong className="text-amber-400">SIMULATION ENGINE</strong>
          </span>
        </div>
        <div className="text-slate-500 hidden md:block">
          CORRIDORX NATIONAL EMS
        </div>
      </div>

    </div>
  );
};

export default MapContainer;
