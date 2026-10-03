import React, { useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEmergency } from '../context/EmergencyContext';
import { mockEmergencyPathWaypoints } from '../data/mockRouteNodes';

// Helper component to smoothly center map on ambulance position
const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
};

export const MapContainer = ({ height = "100%", interactive = true }) => {
  const { 
    currentCoords, 
    nodes, 
    selectedAmbulance, 
    selectedHospital, 
    emergencyRequest,
    isSimulating,
    currentSpeedKmh,
    simulationIndex
  } = useEmergency();

  // Create Custom DivIcons so no external PNG assets fail to load
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

  // Build polyline coordinates
  const fullPathCoords = mockEmergencyPathWaypoints.map(p => [p.lat, p.lng]);
  const completedCoords = fullPathCoords.slice(0, simulationIndex + 1);
  const remainingCoords = fullPathCoords.slice(simulationIndex);

  return (
    <div style={{ height }} className="w-full relative overflow-hidden rounded-2xl border border-slate-800 shadow-2xl">
      <LeafletMap
        center={[currentCoords.lat, currentCoords.lng]}
        zoom={14}
        scrollWheelZoom={interactive}
        dragging={interactive}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapRecenter center={currentCoords} />

        {/* Full Planned Emergency Route (Muted Base) */}
        <Polyline
          positions={fullPathCoords}
          pathOptions={{ color: '#334155', weight: 8, opacity: 0.7, lineCap: 'round' }}
        />

        {/* Traveled Route Segment (Solid Emerald) */}
        {completedCoords.length > 1 && (
          <Polyline
            positions={completedCoords}
            pathOptions={{ color: '#10b981', weight: 6, opacity: 0.9, lineCap: 'round' }}
          />
        )}

        {/* Upcoming Prepared Dynamic Corridor (Glowing Red/Crimson) */}
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

        {/* Pickup Marker */}
        <Marker position={[mockEmergencyPathWaypoints[0].lat, mockEmergencyPathWaypoints[0].lng]} icon={pickupIcon}>
          <Popup>
            <div className="p-1">
              <p className="text-xs font-bold text-blue-400">PATIENT PICKUP</p>
              <p className="text-xs text-slate-200 mt-1">{emergencyRequest.pickupLocation}</p>
              <p className="text-[11px] text-slate-400">Patient: {emergencyRequest.patientName}</p>
            </div>
          </Popup>
        </Marker>

        {/* Hospital Destination Marker */}
        <Marker 
          position={[
            mockEmergencyPathWaypoints[mockEmergencyPathWaypoints.length - 1].lat, 
            mockEmergencyPathWaypoints[mockEmergencyPathWaypoints.length - 1].lng
          ]} 
          icon={hospitalIcon}
        >
          <Popup>
            <div className="p-1">
              <p className="text-xs font-bold text-emerald-400">EMERGENCY DESTINATION</p>
              <p className="text-xs text-white font-semibold mt-0.5">{selectedHospital?.name}</p>
              <p className="text-[11px] text-slate-300">{selectedHospital?.address}</p>
              <div className="mt-2 inline-block px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded">
                ICU BEDS: {selectedHospital?.icuBedsAvailable || 8} OPEN
              </div>
            </div>
          </Popup>
        </Marker>

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
                <p className="text-[11px] text-slate-300 mt-1">{node.description}</p>
                <div className="mt-2 pt-2 border-t border-slate-700 text-[10px] text-slate-400">
                  Traffic: <strong className="text-slate-200">{node.trafficDensity}</strong>
                </div>
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
              <p className="text-[11px] text-slate-300">Pilot: {selectedAmbulance?.driverName}</p>
              <div className="mt-2 flex items-center justify-between text-[11px] bg-slate-800 p-1.5 rounded border border-slate-700">
                <span className="text-slate-400">Speed:</span>
                <span className="font-mono font-bold text-emerald-400">{currentSpeedKmh} KM/H</span>
              </div>
            </div>
          </Popup>
        </Marker>

      </LeafletMap>

      {/* Floating Map Legend (Ola/Uber Minimalist Style) */}
      <div className="absolute top-4 right-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-2.5 rounded-xl shadow-xl text-xs space-y-1.5 pointer-events-auto">
        <div className="font-bold text-[11px] text-slate-400 tracking-wider uppercase mb-1">Corridor Signals</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-slate-200 font-medium">Junction Active (Clearing)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span className="text-slate-200 font-medium">Junction Preparing (Traffic Alert)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-slate-200 font-medium">Junction Passed (Normal)</span>
        </div>
      </div>
    </div>
  );
};
