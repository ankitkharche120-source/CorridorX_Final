import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { 
  Phone, 
  ShieldCheck, 
  MapPin, 
  Hospital, 
  Star, 
  HeartPulse, 
  Radio, 
  CheckCircle2, 
  RotateCcw,
  UserCheck,
  ArrowRight,
  Clock,
  Gauge
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const OlaRideDrawer = () => {
  const navigate = useNavigate();
  const { 
    selectedAmbulance, 
    selectedHospital, 
    emergencyRequest, 
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
    handlePatientPickedUp,
    startHospitalJourney,
    resetDemo
  } = useEmergency();

  const isPickupPhase = tripStage === 'PICKUP_STAGE';
  const isArrivedPickup = tripStatus === 'ARRIVED_AT_PICKUP';
  const isPatientOnboard = tripStatus === 'PATIENT_ONBOARD';
  const isHospitalPhase = tripStage === 'HOSPITAL_STAGE';
  const isArrivedHospital = tripStatus === 'ARRIVED_AT_HOSPITAL' || tripStatus === 'COMPLETED';

  const activeNode = (isHospitalPhase && !isArrivedHospital)
    ? (nodes.find(n => n.status === 'ACTIVE') || nodes.find(n => n.status === 'PREPARING'))
    : null;

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 shadow-2xl text-white flex flex-col justify-between">
      
      <div>
        {/* Top Status Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isArrivedHospital 
                  ? 'bg-emerald-400' 
                  : (isArrivedPickup ? 'bg-amber-400' : 'animate-ping bg-red-400')
              }`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isArrivedHospital ? 'bg-emerald-500' : (isArrivedPickup ? 'bg-amber-500' : 'bg-red-500')
              }`} />
            </span>
            <span className={`text-xs font-black tracking-wider uppercase ${
              isArrivedHospital 
                ? 'text-emerald-400' 
                : (isArrivedPickup ? 'text-amber-400' : (isPickupPhase ? 'text-blue-400' : 'text-red-400'))
            }`}>
              {isArrivedHospital && 'ARRIVED AT HOSPITAL'}
              {isHospitalPhase && !isArrivedHospital && 'EN ROUTE TO HOSPITAL'}
              {isPatientOnboard && 'PATIENT ONBOARD'}
              {isArrivedPickup && 'AMBULANCE AT PICKUP'}
              {tripStatus === 'EN_ROUTE_TO_PICKUP' && 'AMBULANCE EN ROUTE TO YOU'}
              {tripStatus === 'AVAILABLE' && 'AMBULANCE READY'}
              {tripStatus === 'ASSIGNED' && 'AMBULANCE ASSIGNED'}
            </span>
          </div>

          <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
            isHospitalPhase && !isArrivedHospital
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {isArrivedHospital && 'CORRIDOR RELEASED'}
              {isHospitalPhase && !isArrivedHospital && 'GREEN WAVE ACTIVE'}
              {isPatientOnboard && 'CORRIDOR PREPARING'}
              {isPickupPhase && 'CORRIDOR STANDBY'}
            </span>
          </div>
        </div>

        {/* Vehicle & Pilot Card */}
        <div className="mt-4 bg-slate-950/80 rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 p-2.5 flex items-center justify-center text-white shadow-lg shadow-red-500/30 shrink-0">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v9c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <path d="M9 17h6"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  {selectedAmbulance?.name || 'ALS Cardiac Unit 101'}
                </h4>
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{selectedAmbulance?.driverRating || 4.9}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[11px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {selectedAmbulance?.vehicleNumber || 'MH 12 AB 1011'}
                </span>
                <span className="text-xs text-slate-400">
                  Pilot: <strong className="text-slate-200">{selectedAmbulance?.driverName || 'Vikram Jadhav'}</strong>
                </span>
              </div>
            </div>
          </div>

          <a
            href={`tel:${selectedAmbulance?.driverPhone || '+919822011011'}`}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 flex items-center justify-center transition-colors border border-slate-700 shrink-0"
            title="Call Ambulance Driver"
          >
            <Phone className="w-4 h-4" />
          </a>
        </div>

        {/* SECTION 8: Prominent Card when Ambulance Reaches Pickup */}
        {isArrivedPickup && (
          <div className="mt-3.5 bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/80 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <h4 className="text-sm font-extrabold text-white">AMBULANCE ARRIVED</h4>
                <p className="text-xs text-amber-300">Pickup location reached • Unit {selectedAmbulance?.id}</p>
              </div>
            </div>
            <button
              onClick={handlePatientPickedUp}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <UserCheck className="w-4 h-4" />
              <span>PATIENT PICKED UP</span>
            </button>
          </div>
        )}

        {/* SECTION 9: Prominent Card when Patient is Onboard */}
        {isPatientOnboard && (
          <div className="mt-3.5 bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/80 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <UserCheck className="w-5 h-5 shrink-0" />
              <div>
                <h4 className="text-sm font-extrabold text-white">PATIENT ONBOARD</h4>
                <p className="text-xs text-slate-300">Destination: <strong className="text-white">{selectedHospital?.name}</strong></p>
              </div>
            </div>
            <button
              onClick={startHospitalJourney}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
            >
              <span>START HOSPITAL JOURNEY</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Contextual Metric Tile: ETA & Distance (Section 12, 13 & 14) */}
        {!isArrivedPickup && !isPatientOnboard && !isArrivedHospital && (
          <div className="mt-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between font-mono">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                {isPickupPhase ? 'ETA TO PICKUP' : 'ETA TO HOSPITAL'}
              </p>
              <p className="text-xl font-black text-white mt-0.5">
                ~{isPickupPhase ? etaToPickup : etaToHospital} min
              </p>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                {isPickupPhase ? 'DIST TO PICKUP' : 'DIST TO HOSPITAL'}
              </p>
              <p className="text-xl font-black text-slate-200 mt-0.5">
                {isPickupPhase ? distanceToPickup : distanceToHospital} km
              </p>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">CORRIDOR</p>
              <p className={`text-xs font-bold mt-1.5 ${isHospitalPhase ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                {isHospitalPhase ? 'ACTIVE' : 'STANDBY'}
              </p>
            </div>
          </div>
        )}

        {/* Roadside Sign Pre-emption Alert: Only active during Stage 2 */}
        {isHospitalPhase && !isArrivedHospital && activeNode && (
          <div className="mt-3.5 bg-slate-950/80 border border-red-500/40 rounded-xl p-3">
            <div className="flex items-center gap-2 text-red-400 text-[10px] font-mono font-bold uppercase">
              <Radio className="w-3.5 h-3.5 animate-spin text-red-500" />
              <span>ROADSIDE WARNING SIGN PRE-EMPTION</span>
            </div>
            <p className="text-xs font-bold text-white mt-1">
              At {activeNode.name.split('/')[0]}: <span className="text-amber-300">"EMERGENCY CORRIDOR ACTIVE — CLEAR PATH"</span>
            </p>
          </div>
        )}

        {/* Arrival Confirmed at Hospital */}
        {isArrivedHospital && (
          <div className="mt-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">HOSPITAL ARRIVAL CONFIRMED</span>
              <p className="text-xs text-slate-200 mt-0.5">Patient delivered safely to trauma bay. All corridor signals normalized.</p>
            </div>
          </div>
        )}

        {/* Trip Destination & Patient Info */}
        <div className="mt-3.5 space-y-2.5">
          {/* Pickup Point */}
          <div className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs ${
            isPickupPhase ? 'bg-slate-950 border-blue-500/40' : 'bg-slate-950/40 border-slate-800/80'
          }`}>
            <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Pickup Location {isPickupPhase && '• ACTIVE TARGET'}
              </span>
              <p className="text-slate-200 font-medium">{emergencyRequest.pickupLocation}</p>
            </div>
          </div>

          {/* Hospital Destination */}
          <div className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs ${
            isHospitalPhase ? 'bg-slate-950 border-emerald-500/40' : 'bg-slate-950/40 border-slate-800/80'
          }`}>
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Hospital className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Hospital Destination {isHospitalPhase && '• ACTIVE CORRIDOR TARGET'}
              </span>
              {selectedHospital ? (
                <>
                  <p className="text-white font-bold">{selectedHospital.name}</p>
                  <p className="text-[11px] text-emerald-400 font-medium mt-0.5">
                    Emergency Department Available
                  </p>
                </>
              ) : (
                <p className="text-amber-400 font-medium italic">Hospital selected en route</p>
              )}
            </div>
          </div>

          {/* Patient Emergency Pill */}
          <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-red-500" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Emergency</span>
                <p className="text-slate-100 font-bold">{emergencyRequest.emergencyType}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Patient</span>
              <p className="text-slate-200 font-semibold">{emergencyRequest.patientName}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Actions: Arrival Screen Option vs Ongoing */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
        {isArrivedHospital ? (
          <button
            onClick={() => {
              resetDemo();
              navigate('/customer');
            }}
            className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>NEW EMERGENCY REQUEST</span>
          </button>
        ) : (
          <>
            <Link
              to="/ambulance"
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center border border-slate-700 transition-colors"
            >
              Driver Cockpit
            </Link>
            <Link
              to="/customer"
              className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold text-center shadow-lg shadow-red-600/30 transition-colors"
            >
              Back to Dashboard
            </Link>
          </>
        )}
      </div>

    </div>
  );
};

export default OlaRideDrawer;
