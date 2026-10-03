import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { MapContainer } from '../components/MapContainer';
import { CorridorTimeline } from '../components/CorridorTimeline';
import { SimulationController } from '../components/SimulationController';
import { 
  Activity, 
  Radio, 
  Truck, 
  Hospital, 
  MapPin, 
  Clock, 
  Gauge, 
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export const ControlCenterPage = () => {
  const { 
    emergencyRequest, 
    selectedHospital, 
    selectedAmbulance, 
    tripStatus, 
    distanceRemainingKm, 
    etaMinutes,
    currentSpeedKmh,
    nodes
  } = useEmergency();

  const activeNodesCount = nodes.filter(n => n.status === 'ACTIVE' || n.status === 'PREPARING').length;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      
      {/* Control Center HUD Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase">
                  NATIONAL TRAFFIC & DISPATCH CONSOLE
                </span>
                <span className="text-xs text-slate-400">STATUS: <strong className="text-emerald-400">OPERATIONAL</strong></span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white mt-0.5">
                Dynamic Emergency Corridor Control Center
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-slate-400">TRIP:</span>
              <span className="text-white font-bold">{tripStatus}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-red-400" />
              <span className="text-slate-400">ETA:</span>
              <span className="text-white font-bold">~{etaMinutes} min</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <Gauge className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400">SPEED:</span>
              <span className="text-white font-bold">{currentSpeedKmh} KM/H</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Map & Telemetry Details */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-5">
        
        {/* Dynamic Corridor Nodes Timeline */}
        <CorridorTimeline />

        {/* Map & Corridor Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[560px]">
          
          {/* Map Column (8 / 12) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex-1 min-h-[460px] relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
              <MapContainer height="100%" interactive={true} />
            </div>

            <SimulationController />
          </div>

          {/* Control Telemetry Column (4 / 12) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            
            {/* Live Incident Status */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                  ACTIVE CORRIDOR TELEMETRY
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  REAL ROADS
                </span>
              </div>

              {/* Patient Location */}
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-xs space-y-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  <span className="uppercase text-[10px] font-bold">Origin / Pickup Location</span>
                </div>
                <p className="text-white font-bold truncate">
                  {emergencyRequest.pickupLocation || 'No active location selected yet'}
                </p>
                {emergencyRequest.pickupCoords && (
                  <p className="font-mono text-[11px] text-slate-400">
                    {emergencyRequest.pickupCoords.lat.toFixed(4)}, {emergencyRequest.pickupCoords.lng.toFixed(4)}
                  </p>
                )}
              </div>

              {/* Destination Hospital */}
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-xs space-y-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <Hospital className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="uppercase text-[10px] font-bold">Receiving Medical Center</span>
                </div>
                <p className="text-white font-bold truncate">
                  {selectedHospital?.name || 'Awaiting hospital assignment'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {selectedHospital?.address || 'India-wide emergency directory'}
                </p>
              </div>

              {/* Ambulance Info */}
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-xs space-y-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <Truck className="w-3.5 h-3.5 text-blue-400" />
                  <span className="uppercase text-[10px] font-bold">Assigned Emergency Unit</span>
                </div>
                <p className="text-white font-bold">
                  {selectedAmbulance?.name || 'ALS Cardiac Unit 102'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Pilot: {selectedAmbulance?.driver_name || selectedAmbulance?.driverName || 'Rajesh Shinde'} • {selectedAmbulance?.vehicle_number || selectedAmbulance?.vehicleNumber || 'IND-EMS-102'}
                </p>
              </div>

              {/* Traffic Corridor Pre-emption Status */}
              <div className="bg-red-950/30 border border-red-500/40 rounded-2xl p-3.5 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-red-400 font-mono font-bold text-[10px] uppercase">
                  <Radio className="w-3.5 h-3.5 animate-spin" />
                  <span>SIMULATED GREEN WAVE ENGINE</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  {activeNodesCount > 0 
                    ? `${activeNodesCount} signal junctions actively clearing emergency lane.`
                    : 'Corridor in standby. Awaiting dispatch activation.'}
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ControlCenterPage;
