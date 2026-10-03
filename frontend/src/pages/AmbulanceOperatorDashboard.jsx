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
  RefreshCw,
  UserCheck,
  ArrowRight
} from 'lucide-react';

export const AmbulanceOperatorDashboard = () => {
  const { 
    selectedAmbulance, 
    selectedHospital, 
    emergencyRequest, 
    tripStage,
    tripStatus, 
    corridorStatus,
    handleArrival, 
    handlePatientPickedUp,
    startHospitalJourney,
    startPickupJourney,
    isSimulating, 
    startSimulation, 
    pauseSimulation,
    stepForwardSimulation,
    currentSpeedKmh,
    distanceToPickup,
    etaToPickup,
    distanceToHospital,
    etaToHospital,
    distanceRemainingKm,
    etaMinutes,
    resetDemo
  } = useEmergency();

  const [hasAccepted, setHasAccepted] = useState(true);
  const isPickupPhase = tripStage === 'PICKUP_STAGE';
  const isArrivedPickup = tripStatus === 'ARRIVED_AT_PICKUP';
  const isPatientOnboard = tripStatus === 'PATIENT_ONBOARD';
  const isHospitalPhase = tripStage === 'HOSPITAL_STAGE';
  const isArrivedHospital = tripStatus === 'ARRIVED_AT_HOSPITAL' || tripStatus === 'COMPLETED';

  return (
    <div className="min-h-screen bg-slate-950 text-white py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* Driver Cockpit Header */}
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 border ${
              isPickupPhase 
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' 
                : 'bg-red-600/20 text-red-400 border-red-500/30'
            }`}>
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                  isPickupPhase 
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  {isPickupPhase ? 'STAGE 1: PILOT DISPATCH TO PICKUP' : 'STAGE 2: CORRIDORX EMERGENCY RUN'}
                </span>
                <span className="text-xs text-slate-400">UNIT: <strong className="text-white">{selectedAmbulance?.id}</strong></span>
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
            {isArrivedHospital ? (
              <>
                <span className="px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>MISSION COMPLETED</span>
                </span>
                <button
                  onClick={resetDemo}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                  <span>RESET TRIP</span>
                </button>
              </>
            ) : isArrivedPickup ? (
              <button
                onClick={handlePatientPickedUp}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition-all"
              >
                <UserCheck className="w-4 h-4" />
                <span>PATIENT PICKED UP</span>
              </button>
            ) : isPatientOnboard ? (
              <button
                onClick={startHospitalJourney}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg transition-all"
              >
                <span>START HOSPITAL JOURNEY</span>
                <ArrowRight className="w-4 h-4" />
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
                    <span>{isPickupPhase ? 'DRIVE TO PICKUP' : 'RESUME CORRIDOR'}</span>
                  </button>
                )}

                <button
                  onClick={stepForwardSimulation}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-colors"
                  title="Step Forward Waypoint"
                >
                  <RefreshCw className="w-4 h-4 text-blue-400" />
                </button>

                <button
                  onClick={handleArrival}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg shadow-red-600/30 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isPickupPhase ? 'REACHED PICKUP' : 'ARRIVED AT HOSPITAL'}</span>
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
                {isArrivedHospital ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">MISSION COMPLETED • CORRIDOR RELEASED</span>
                      <p className="text-slate-300 font-medium">All traffic signals restored to regular cycle</p>
                    </div>
                  </>
                ) : isHospitalPhase ? (
                  <>
                    <Radio className="w-4 h-4 text-red-500 animate-spin" />
                    <div>
                      <span className="text-[10px] font-mono text-red-400 font-bold uppercase">TRAFFIC LIGHT OVERRIDE ACTIVE</span>
                      <p className="text-slate-200 font-medium">Green wave priority clearing intersections to trauma bay</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                    <div>
                      <span className="text-[10px] font-mono text-blue-400 font-bold uppercase">DISPATCH PHASE • CORRIDOR STANDBY</span>
                      <p className="text-slate-300 font-medium">Traffic signals will preempt once patient is onboard</p>
                    </div>
                  </>
                )}
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
            </div>

            {/* Pickup & Pre-registered Destination */}
            <div className="space-y-2.5 text-xs">
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                isPickupPhase ? 'bg-slate-950 border-blue-500/50' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    Pickup Location {isPickupPhase && '• CURRENT TARGET'}
                  </span>
                  <p className="text-slate-200 font-medium">{emergencyRequest.pickupLocation}</p>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                isHospitalPhase ? 'bg-slate-950 border-emerald-500/50' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <Hospital className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    Receiving Hospital {isHospitalPhase && '• ACTIVE CORRIDOR DESTINATION'}
                  </span>
                  <p className="text-white font-bold">{selectedHospital?.name}</p>
                  <p className="text-[11px] text-emerald-400 mt-0.5">
                    Helpline: {selectedHospital?.emergencyHelpline || '+91 112'}
                  </p>
                </div>
              </div>
            </div>

            {/* ETA Countdown Tile (Section 19: Clearly reflects pickup vs hospital) */}
            <div className={`rounded-2xl p-4 text-center border ${
              isArrivedHospital
                ? 'bg-emerald-950/40 border-emerald-500/50'
                : (isPickupPhase ? 'bg-blue-950/40 border-blue-500/50' : 'bg-red-950/40 border-red-500/50')
            }`}>
              <span className={`text-[10px] font-mono font-black uppercase tracking-widest block ${
                isArrivedHospital 
                  ? 'text-emerald-400' 
                  : (isPickupPhase ? 'text-blue-400' : 'text-red-400')
              }`}>
                {isArrivedHospital && 'MISSION COMPLETED'}
                {!isArrivedHospital && isPickupPhase && 'ETA TO PATIENT PICKUP'}
                {!isArrivedHospital && !isPickupPhase && 'CORRIDOR ETA TO HOSPITAL'}
              </span>
              <div className="text-3xl font-mono font-black text-white mt-1">
                {isArrivedHospital && '0 min (0 km)'}
                {!isArrivedHospital && isPickupPhase && `~${etaToPickup} min (${distanceToPickup} km)`}
                {!isArrivedHospital && !isPickupPhase && `~${etaToHospital} min (${distanceToHospital} km)`}
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                {isPickupPhase 
                  ? 'Ambulance driving to patient location. Corridor activates upon patient boarding.' 
                  : 'Priority green wave traffic pre-emption engaged on road network.'}
              </p>
            </div>

            {/* Pilot Cockpit Terminal Info */}
            <div className="pt-2 text-center text-xs text-slate-500 font-mono">
              CAD Tactical Terminal • Unit {selectedAmbulance?.id || 'AMB-101'}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default AmbulanceOperatorDashboard;
