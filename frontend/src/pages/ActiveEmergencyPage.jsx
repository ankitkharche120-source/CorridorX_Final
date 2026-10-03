import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { MapContainer } from '../components/MapContainer';
import { CorridorTimeline } from '../components/CorridorTimeline';
import { OlaRideDrawer } from '../components/OlaRideDrawer';
import { 
  ShieldAlert, 
  Clock, 
  Gauge, 
  Truck, 
  Hospital,
  MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ActiveEmergencyPage = () => {
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
    etaSeconds
  } = useEmergency();

  const isPickupPhase = tripStage === 'PICKUP_STAGE';
  const isArrived = tripStatus === 'ARRIVED_AT_HOSPITAL' || tripStatus === 'COMPLETED';

  const formattedEta = () => {
    const totalSecs = (isPickupPhase ? etaToPickup : etaToHospital) * 60;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      
      {/* Top Emergency HUD Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Left: Emergency Status & Unit ID */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isPickupPhase 
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' 
                : 'bg-red-600/20 text-red-500 border-red-500/30'
            }`}>
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                  isArrived 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : (isPickupPhase ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30')
                }`}>
                  {isArrived && 'ARRIVED AT DESTINATION • CORRIDOR RELEASED'}
                  {!isArrived && isPickupPhase && 'STAGE 1: AMBULANCE TO PICKUP • CORRIDOR STANDBY'}
                  {!isArrived && !isPickupPhase && 'STAGE 2: ACTIVE EMERGENCY CORRIDOR • GREEN WAVE ON'}
                </span>
                <span className="text-xs text-slate-600 font-mono">
                  UNIT: {selectedAmbulance?.id || 'AMB-101'}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                {isPickupPhase 
                  ? `Target: Pickup at ${emergencyRequest.pickupLocation}` 
                  : (selectedHospital?.name || 'Deenanath Mangeshkar Hospital')}
              </h1>
            </div>
          </div>

          {/* Right: Live Telemetry Numbers */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <Clock className={`w-4 h-4 ${isPickupPhase ? 'text-blue-400' : 'text-red-400'}`} />
              <span className="text-slate-600">
                {isPickupPhase ? 'ETA TO PICKUP:' : 'ETA TO HOSP:'}
              </span>
              <span className="text-slate-900 font-bold text-sm">{formattedEta()}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-600">DIST:</span>
              <span className="text-slate-900 font-bold text-sm">
                {isPickupPhase ? distanceToPickup : distanceToHospital} km
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Origin Location Sub-bar */}
      <div className="bg-slate-50 border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="text-slate-600">Patient Location:</span>
            <span className="font-semibold text-slate-900">
              {emergencyRequest.pickupLocation || 'Karvenagar, Pune'}
            </span>
          </div>

          <div className="text-[11px] font-mono text-emerald-400">
            {isPickupPhase 
              ? `Route 1: ${selectedAmbulance?.id} Base → ${emergencyRequest.pickupLocation}`
              : `Route 2: ${emergencyRequest.pickupLocation} → ${selectedHospital?.name}`}
          </div>
        </div>
      </div>

      {/* Main Split Layout: Map + Ride Drawer Grid */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-5">
        
        {/* Top Corridor Handover Visualization */}
        <CorridorTimeline />

        {/* Map & Ride Drawer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[560px]">
          
          {/* Map Column (Occupies 8 of 12 columns on desktop) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex-1 min-h-[460px] rounded-3xl overflow-hidden border border-slate-200 shadow-2xl relative">
              <MapContainer height="100%" interactive={true} />
            </div>
          </div>

          {/* Ride Details Drawer (Occupies 4 of 12 columns on desktop) */}
          <div className="lg:col-span-4 flex flex-col">
            <OlaRideDrawer />
          </div>

        </div>

      </div>
    </div>
  );
};

export default ActiveEmergencyPage;


