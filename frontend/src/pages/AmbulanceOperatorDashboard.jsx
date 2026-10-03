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
  ArrowRight,
  ShieldAlert
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
    currentHeading,
    routeDeviation,
    isRouteDeviated,
    nodes = [],
    distanceToPickup,
    etaToPickup,
    distanceToHospital,
    etaToHospital,
    distanceRemainingKm,
    etaMinutes,
    resetDemo
  } = useEmergency();

  const [hasAccepted, setHasAccepted] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  const isPickupPhase = tripStage === 'PICKUP_STAGE';
  const isArrivedPickup = tripStatus === 'ARRIVED_AT_PICKUP';
  const isPatientOnboard = tripStatus === 'PATIENT_ONBOARD';
  const isHospitalPhase = tripStage === 'HOSPITAL_STAGE';
  const isArrivedHospital = tripStatus === 'ARRIVED_AT_HOSPITAL' || tripStatus === 'COMPLETED';

  // Handle Acceptance
  const handleAccept = () => {
    setHasAccepted(true);
  };

  // Handle Rejection
  const handleReject = () => {
    alert(`Request Rejected: ${rejectReason || 'No reason provided'}. Returning to dispatch...`);
    setShowRejectModal(false);
    resetDemo();
  };

  if (!hasAccepted) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-6 relative">
          
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-wider text-red-400">Incoming Emergency Request</h2>
            <p className="text-sm text-slate-600">Unit {selectedAmbulance?.id || 'AMB-101'} has been requested for an emergency.</p>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs text-slate-600 uppercase font-bold tracking-wider">Patient</span>
              <strong className="text-sm">{emergencyRequest.patientName}</strong>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs text-slate-600 uppercase font-bold tracking-wider">Emergency</span>
              <strong className="text-sm text-red-400">{emergencyRequest.emergencyType}</strong>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs text-slate-600 uppercase font-bold tracking-wider">Pickup</span>
              <strong className="text-sm text-right max-w-[200px] truncate">{emergencyRequest.pickupLocation}</strong>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs text-slate-600 uppercase font-bold tracking-wider">Hospital</span>
              <strong className="text-sm text-emerald-400 text-right max-w-[200px] truncate">{selectedHospital?.name || 'To be decided'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-600 uppercase font-bold tracking-wider">Route</div>
              <div className="text-right">
                <div className="text-sm font-bold">{distanceToPickup} km to pickup</div>
                <div className="text-xs text-slate-600">ETA: {etaToPickup} min</div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              onClick={() => setShowRejectModal(true)}
              className="flex-1 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-300 transition-colors"
            >
              REJECT
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              ACCEPT
            </button>
          </div>

          {showRejectModal && (
            <div className="absolute inset-0 bg-white  rounded-3xl p-6 z-50 flex flex-col justify-center border border-slate-300">
              <h3 className="text-lg font-black text-slate-900 mb-4 uppercase">Reject Emergency Request</h3>
              <p className="text-sm text-slate-600 mb-6">Please provide a reason for rejecting this assignment:</p>
              
              <div className="space-y-3 mb-6">
                {['Already assigned', 'Vehicle unavailable', 'Driver unavailable', 'Ambulance/equipment unsuitable', 'Other'].map(reason => (
                  <label key={reason} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                    <input 
                      type="radio" 
                      name="rejectReason" 
                      value={reason}
                      checked={rejectReason === reason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-4 h-4 text-red-500 bg-slate-50 border-slate-300 focus: focus:ring-offset-slate-900"
                    />
                    <span className="text-sm text-slate-800 font-medium">{reason}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
                    rejectReason ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  CONFIRM REJECTION
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* Driver Cockpit Header */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                <span className="text-xs text-slate-600">UNIT: <strong className="text-slate-900">{selectedAmbulance?.id}</strong></span>
              </div>
              <h1 className="text-xl font-black text-slate-900 mt-0.5">
                {selectedAmbulance?.name}
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Pilot: <strong className="text-slate-800">{selectedAmbulance?.driverName}</strong>
                {selectedAmbulance?.coPilotName && (
                  <> | Co-Pilot: <strong className="text-slate-800">{selectedAmbulance.coPilotName}</strong></>
                )}
                <br />
                Vehicle: <strong className="text-slate-800">{selectedAmbulance?.vehicleNumber}</strong>
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition-all"
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
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold text-xs shadow-lg transition-all"
                  >
                    <Pause className="w-4 h-4" />
                    <span>PAUSE JOURNEY</span>
                  </button>
                ) : (
                  <button
                    onClick={startSimulation}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-sm transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{isPickupPhase ? 'DRIVE TO PICKUP' : 'RESUME CORRIDOR'}</span>
                  </button>
                )}

                <button
                  onClick={stepForwardSimulation}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-colors"
                  title="Step Forward Waypoint"
                >
                  <RefreshCw className="w-4 h-4 text-blue-400" />
                </button>

                <button
                  onClick={handleArrival}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg shadow-sm transition-all"
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
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                {isArrivedHospital ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">MISSION COMPLETED • CORRIDOR RELEASED</span>
                      <p className="text-slate-700 font-medium">All traffic signals restored to regular cycle</p>
                    </div>
                  </>
                ) : isHospitalPhase ? (
                  <>
                    <Radio className="w-5 h-5 text-red-500 animate-spin" />
                    <div>
                      <span className="text-[10px] font-mono text-red-400 font-bold uppercase">TRAFFIC LIGHT OVERRIDE ACTIVE</span>
                      <p className="text-slate-800 font-medium">
                        {nodes.find(n => n.status === 'ACTIVE')
                          ? `CURRENT: ${nodes.find(n => n.status === 'ACTIVE')?.id} (ACTIVE GREEN)`
                          : `APPROACHING: ${nodes.find(n => n.status === 'PREPARING')?.id || 'NEXT JUNCTION'} (PREPARING)`}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Radio className="w-5 h-5 text-blue-400 animate-spin" />
                    <div>
                      <span className="text-[10px] font-mono text-blue-400 font-bold uppercase">CORRIDOR ACTIVE • DISPATCH TO PATIENT</span>
                      <p className="text-slate-800 font-medium">
                        {nodes.find(n => n.status === 'ACTIVE')
                          ? `CURRENT: ${nodes.find(n => n.status === 'ACTIVE')?.id} (ACTIVE GREEN WAVE)`
                          : `APPROACHING: ${nodes.find(n => n.status === 'PREPARING')?.id || 'NEXT JUNCTION'} (PREPARING)`}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Smart-EVP Telemetry Metrics */}
              <div className="flex items-center gap-3 font-mono text-xs">
                {/* Route Deviation Indicator */}
                <div className={`px-2.5 py-1 rounded-lg border font-bold text-[11px] flex items-center gap-1.5 ${
                  isRouteDeviated 
                    ? 'bg-amber-950/40 text-amber-300 border-amber-500/50' 
                    : 'bg-slate-50 text-emerald-400 border-slate-200'
                }`}>
                  <span>{isRouteDeviated ? '⚠️ ROUTE DEVIATION' : '✓ ON ROUTE'}</span>
                </div>

                {/* Heading */}
                <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                  HDG: <strong className="text-slate-900">{currentHeading}°</strong>
                </div>

                {/* Speed */}
                <div className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-sm font-black text-emerald-400">{currentSpeedKmh} KM/H</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assignment Manifest Column (4/12) */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Emergency Manifest
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                PRIORITY 1
              </span>
            </div>

            {/* Patient Info */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Patient:</span>
                <strong className="text-slate-900">{emergencyRequest.patientName}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Contact:</span>
                <span className="font-mono text-blue-400">{emergencyRequest.contactNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Emergency:</span>
                <span className="text-red-400 font-bold">{emergencyRequest.emergencyType}</span>
              </div>
            </div>

            {/* Pickup & Pre-registered Destination */}
            <div className="space-y-2.5 text-xs">
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                isPickupPhase ? 'bg-slate-50 border-blue-500/50' : 'bg-slate-50 border-slate-200'
              }`}>
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    Pickup Location {isPickupPhase && '• CURRENT TARGET'}
                  </span>
                  <p className="text-slate-800 font-medium">{emergencyRequest.pickupLocation}</p>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                isHospitalPhase ? 'bg-slate-50 border-emerald-500/50' : 'bg-slate-50 border-slate-200'
              }`}>
                <Hospital className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    Receiving Hospital {isHospitalPhase && '• ACTIVE CORRIDOR DESTINATION'}
                  </span>
                  <p className="text-slate-900 font-bold">{selectedHospital?.name}</p>
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
              <div className="text-3xl font-mono font-black text-slate-900 mt-1">
                {isArrivedHospital && '0 min (0 km)'}
                {!isArrivedHospital && isPickupPhase && `~${etaToPickup} min (${distanceToPickup} km)`}
                {!isArrivedHospital && !isPickupPhase && `~${etaToHospital} min (${distanceToHospital} km)`}
              </div>
              <p className="text-[11px] text-slate-700 mt-1">
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


