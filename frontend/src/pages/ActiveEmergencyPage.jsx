import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { MapContainer } from '../components/MapContainer';
import { CorridorTimeline } from '../components/CorridorTimeline';
import { SimulationController } from '../components/SimulationController';
import { OlaRideDrawer } from '../components/OlaRideDrawer';
import { LocationPicker } from '../components/LocationPicker';
import { 
  ShieldAlert, 
  Radio, 
  Clock, 
  Gauge, 
  Truck, 
  Hospital,
  MapPin,
  Crosshair,
  Compass,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ActiveEmergencyPage = () => {
  const { 
    selectedAmbulance, 
    selectedHospital, 
    emergencyRequest, 
    tripStatus, 
    distanceRemainingKm, 
    etaMinutes, 
    etaSeconds,
    setCustomLocation,
    recenterToGps,
    liveLocation
  } = useEmergency();

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const formattedEta = () => {
    const mins = Math.floor(etaSeconds / 60);
    const secs = etaSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLocationConfirmed = (locationData) => {
    setCustomLocation({
      lat: locationData.latitude,
      lng: locationData.longitude,
      address: locationData.formattedAddress,
      name: locationData.shortTitle
    });
    setIsLocationModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      
      {/* High-Impact Top Emergency HUD Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Trip & Destination Summary */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-red-600 text-white font-mono text-xs font-black shadow-md shadow-red-600/30">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>DYNAMIC GREEN WAVE</span>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300">
              <span>AMBULANCE: <strong className="text-white">{selectedAmbulance?.id || 'AMB-102'}</strong></span>
              <span className="text-slate-600">•</span>
              <span>PATIENT: <strong className="text-white">{emergencyRequest.patientName}</strong></span>
              <span className="text-slate-600">•</span>
              <span>HOSPITAL: <strong className="text-emerald-400">{selectedHospital?.name || 'Pre-registered Hospital'}</strong></span>
            </div>
          </div>

          {/* Quick Real-Time Telemetry Counters */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-red-400" />
              <span className="text-slate-400">ETA:</span>
              <span className="text-white font-bold">{formattedEta()}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <Gauge className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400">DIST:</span>
              <span className="text-white font-bold">{distanceRemainingKm} km</span>
            </div>
          </div>

        </div>
      </div>

      {/* Dynamic India-Wide Location Switcher Banner */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 flex-1 min-w-[280px]">
            <MapPin className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-slate-400">Pickup Area:</span>
            <span className="font-semibold text-white truncate max-w-md">
              {emergencyRequest.pickupLocation || 'Live Emergency Origin'}
            </span>
            <span className="font-mono text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {emergencyRequest.pickupCoords?.lat?.toFixed(4)}, {emergencyRequest.pickupCoords?.lng?.toFixed(4)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={recenterToGps}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
              title="Detect real device GPS"
            >
              <Crosshair className="w-3.5 h-3.5 text-blue-400" />
              <span>Use My GPS</span>
            </button>

            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white font-semibold shadow-md shadow-red-600/20 transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Change Area / Pick on Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal for Location Picker */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-bold text-white">Select Any Location in India</h3>
              </div>
              <button 
                onClick={() => setIsLocationModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <LocationPicker
              label="Search city/area, click map, or detect GPS"
              value={{
                latitude: emergencyRequest.pickupCoords?.lat || 18.5175,
                longitude: emergencyRequest.pickupCoords?.lng || 73.8401,
                formattedAddress: emergencyRequest.pickupLocation || 'Emergency Location'
              }}
              onConfirm={handleLocationConfirmed}
            />
          </div>
        </div>
      )}

      {/* Main Split Layout: Leaflet Map (Left/Center) + Ola Ride Drawer (Right) */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-5">
        
        {/* Top Corridor Handover Visualization */}
        <CorridorTimeline />

        {/* Map & Ola Ride Drawer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[560px]">
          
          {/* Map Column (Occupies 8 of 12 columns on desktop) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            
            {/* The Map itself */}
            <div className="flex-1 min-h-[440px] sm:min-h-[500px] relative">
              <MapContainer height="100%" interactive={true} />
            </div>

            {/* Simulation Controller HUD Bar below map */}
            <SimulationController />

          </div>

          {/* Right Column: Ola/Uber Ride Drawer (4 of 12 columns on desktop) */}
          <div className="lg:col-span-4 flex flex-col">
            <OlaRideDrawer />
          </div>

        </div>

      </div>

    </div>
  );
};
