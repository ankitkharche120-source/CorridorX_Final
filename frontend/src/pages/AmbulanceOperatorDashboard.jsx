import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { MapContainer } from '../components/MapContainer';
import { CorridorTimeline } from '../components/CorridorTimeline';
import { 
  Truck, 
  MapPin, 
  Hospital, 
  Radio, 
  CheckCircle2, 
  Phone, 
  Play, 
  Pause,
  RefreshCw
} from 'lucide-react';

export const AmbulanceOperatorDashboard = () => {
  const { 
    selectedAmbulance, 
    selectedHospital, 
    emergencyRequest, 
    tripStatus, 
    handleArrival, 
    isSimulating, 
    startSimulation, 
    pauseSimulation,
    stepForwardSimulation,
    currentSpeedKmh,
    distanceRemainingKm,
    etaMinutes
  } = useEmergency();

  const [hasAccepted, setHasAccepted] = useState(true);

  return (
    <div className="min-h-screen bg-slate-950 text-white py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* Driver Cockpit Header */}
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  AMBULANCE PILOT COCKPIT
                </span>
                <span className="text-xs text-slate-400">ID: <strong className="text-white">{selectedAmbulance?.id}</strong></span>
              </div>
              <h1 className="text-xl font-black text-white mt-0.5">
                {selectedAmbulance?.name}
              </h1>
              <p className="text-xs text-slate-400">
                Pilot: <strong className="text-slate-200">{selectedAmbulance?.driverName}</strong> • Vehicle: <strong className="text-slate-200">{selectedAmbulance?.vehicleNumber}</strong>
              </p>
            </div>
          </div>

          {/* Cockpit Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {!hasAccepted ? (
              <button
                onClick={() => setHasAccepted(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 transition-all"
              >
                ACCEPT EMERGENCY TRIP
              </button>
            ) : (
              <>
                {isSimulating ? (
                  <button
                    onClick={pauseSimulation}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg transition-all"
                  >
                    <Pause className="w-4 h-4" />
                    <span>PAUSE JOURNEY</span>
                  </button>
                ) : (
                  <button
                    onClick={startSimulation}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>START JOURNEY</span>
                  </button>
                )}

                <button
                  onClick={stepForwardSimulation}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-colors"
                  title="Simulate Next Coordinate"
                >
                  <RefreshCw className="w-4 h-4 text-blue-400" />
                </button>

                <button
                  onClick={handleArrival}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg shadow-red-600/30 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ARRIVED AT HOSPITAL</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dynamic Corridor Sequence Bar */}
        <CorridorTimeline />

        {/* Split Grid: Live Map + Assignment Manifest */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[500px]">
          
          {/* Map Column (8/12) */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            <div className="flex-1 min-h-[460px]">
              <MapContainer height="100%" interactive={true} />
            </div>

            {/* In-cockpit Telemetry Status */}
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Radio className="w-4 h-4 text-red-500 animate-spin" />
                <div>
                  <span className="text-[10px] font-mono text-red-400 font-bold uppercase">TRAFFIC LIGHT OVERRIDE ACTIVE</span>
                  <p className="text-slate-200 font-medium">Upcoming signals and roadside warning boards synced</p>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-sm font-black text-emerald-400">{currentSpeedKmh} KM/H</span>
              </div>
            </div>
          </div>

          {/* Assignment Manifest Column (4/12) */}
          <div className="lg:col-span-4 bg-slate-900 rounded-3xl p-5 border border-slate-800 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Emergency Manifest
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                PRIORITY 1
              </span>
            </div>

            {/* Patient Info */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Patient:</span>
                <strong className="text-white">{emergencyRequest.patientName}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Contact:</span>
                <span className="font-mono text-blue-400">{emergencyRequest.contactNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Emergency:</span>
                <span className="text-red-400 font-bold">{emergencyRequest.emergencyType}</span>
              </div>
              {emergencyRequest.notes && (
                <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-400">
                  Notes: <span className="text-slate-200">{emergencyRequest.notes}</span>
                </div>
              )}
            </div>

            {/* Pickup & Pre-registered Destination */}
            <div className="space-y-2.5 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Pickup Location</span>
                  <p className="text-slate-200 font-medium">{emergencyRequest.pickupLocation}</p>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <Hospital className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Pre-registered Hospital</span>
                  <p className="text-white font-bold">{selectedHospital?.name}</p>
                  <p className="text-[11px] text-emerald-400 mt-0.5">
                    Trauma Bay Ready • Helpline: {selectedHospital?.emergencyHelpline}
                  </p>
                </div>
              </div>
            </div>

            {/* ETA Countdown Tile */}
            <div className="bg-red-950/40 border border-red-500/50 rounded-2xl p-4 text-center">
              <span className="text-[10px] font-mono font-black text-red-400 uppercase tracking-widest block">
                CORRIDOR ETA TO DESTINATION
              </span>
              <div className="text-3xl font-mono font-black text-white mt-1">
                {etaMinutes} min <span className="text-sm font-semibold text-slate-400">({distanceRemainingKm} km)</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Signals green-lit along Karve Road Corridor.
              </p>
            </div>

            {/* Pilot Cockpit Terminal Info */}
            <div className="pt-2 text-center text-xs text-slate-500 font-mono">
              CAD Tactical Terminal • Unit {selectedAmbulance?.id || 'AMB-102'}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
