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
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export const ControlCenterPage = () => {
  const { 
    emergencyRequest, 
    selectedHospital, 
    selectedAmbulance, 
    tripStage,
    tripStatus, 
    corridorStatus,
    distanceToPickup,
    etaToPickup,
    distanceToHospital,
    etaToHospital,
    distanceRemainingKm, 
    etaMinutes,
    currentSpeedKmh,
    nodes,
    resetDemo
  } = useEmergency();

  const isPickupPhase = tripStage === 'PICKUP_STAGE';
  const isArrivedHospital = tripStatus === 'ARRIVED_AT_HOSPITAL' || tripStatus === 'COMPLETED';
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
                  CENTRAL TRAFFIC & DISPATCH CONSOLE
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
              <span className={`w-2 h-2 rounded-full ${
                isArrivedHospital 
                  ? 'bg-emerald-500' 
                  : (isPickupPhase ? 'bg-blue-400' : 'bg-red-500 animate-ping')
              }`} />
              <span className="text-slate-400">PHASE:</span>
              <span className="text-white font-bold">
                {isArrivedHospital && 'COMPLETED'}
                {!isArrivedHospital && isPickupPhase && (tripStatus === 'ARRIVED_AT_PICKUP' ? 'AT PICKUP' : 'DISPATCH TO PICKUP')}
                {!isArrivedHospital && !isPickupPhase && 'HOSPITAL CORRIDOR'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-red-400" />
              <span className="text-slate-400">{isPickupPhase ? 'PICKUP ETA:' : 'HOSP ETA:'}</span>
              <span className="text-white font-bold">{isArrivedHospital ? '0 min' : `~${etaMinutes} min`}</span>
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
            
            {/* Live Incident Status (Section 18) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                  ACTIVE RESPONSE TELEMETRY
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                  isPickupPhase 
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  {isPickupPhase ? 'STAGE 1: TO PICKUP' : 'STAGE 2: TO HOSPITAL'}
                </span>
              </div>

              {/* Patient Location */}
              <div className={`p-3 rounded-2xl border text-xs space-y-1 ${
                isPickupPhase ? 'bg-slate-950 border-blue-500/50' : 'bg-slate-950/70 border-slate-800'
              }`}>
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span className="uppercase text-[10px] font-bold">
                    Pickup Location {isPickupPhase && '• ACTIVE DISPATCH DESTINATION'}
                  </span>
                </div>
                <p className="text-white font-bold truncate">
                  {emergencyRequest.pickupLocation}
                </p>
                <p className="font-mono text-[11px] text-slate-400">
                  ETA to Pickup: <strong className="text-white">~{etaToPickup} min</strong> ({distanceToPickup} km)
                </p>
              </div>

              {/* Destination Hospital */}
              <div className={`p-3 rounded-2xl border text-xs space-y-1 ${
                !isPickupPhase ? 'bg-slate-950 border-emerald-500/50' : 'bg-slate-950/70 border-slate-800'
              }`}>
                <div className="flex items-center gap-2 text-slate-400">
                  <Hospital className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="uppercase text-[10px] font-bold">
                    Receiving Medical Center {!isPickupPhase && '• ACTIVE CORRIDOR DESTINATION'}
                  </span>
                </div>
                <p className="text-white font-bold truncate">
                  {selectedHospital?.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  Hospital ETA: <strong className="text-white">~{etaToHospital} min</strong> ({distanceToHospital} km)
                </p>
              </div>

              {/* Ambulance Info */}
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-xs space-y-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <Truck className="w-3.5 h-3.5 text-blue-400" />
                  <span className="uppercase text-[10px] font-bold">Assigned Emergency Unit</span>
                </div>
                <p className="text-white font-bold">
                  {selectedAmbulance?.name || 'ALS Cardiac Unit 101'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Pilot: {selectedAmbulance?.driverName} • {selectedAmbulance?.vehicleNumber}
                </p>
              </div>

              {/* Traffic Corridor Pre-emption Status (Section 18) */}
              <div className={`rounded-2xl p-3.5 text-xs space-y-1.5 border ${
                isArrivedHospital
                  ? 'bg-emerald-950/30 border-emerald-500/40'
                  : (!isPickupPhase ? 'bg-red-950/30 border-red-500/40' : 'bg-slate-950 border-slate-800')
              }`}>
                <div className={`flex items-center gap-2 font-mono font-bold text-[10px] uppercase ${
                  isArrivedHospital 
                    ? 'text-emerald-400' 
                    : (!isPickupPhase ? 'text-red-400' : 'text-slate-400')
                }`}>
                  {isArrivedHospital ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : !isPickupPhase ? (
                    <Radio className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-500" />
                  )}
                  <span>
                    {isArrivedHospital && 'CORRIDOR RELEASED'}
                    {!isArrivedHospital && !isPickupPhase && 'GREEN WAVE ENGINE ACTIVE'}
                    {isPickupPhase && 'CORRIDOR IN STANDBY'}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  {isArrivedHospital && 'Patient delivered safely to trauma bay. All traffic signals normalized.'}
                  {!isArrivedHospital && !isPickupPhase && (
                    activeNodesCount > 0 
                      ? `${activeNodesCount} signal junctions actively clearing emergency lane.`
                      : 'Emergency lane pre-emption active.'
                  )}
                  {isPickupPhase && 'Corridor is on standby while ambulance navigates to patient pickup.'}
                </p>
              </div>

              {/* Reset Demo Button */}
              <button
                onClick={resetDemo}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset Demo State</span>
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ControlCenterPage;
