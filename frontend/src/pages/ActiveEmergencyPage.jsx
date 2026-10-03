import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { MapContainer } from '../components/MapContainer';
import { CorridorTimeline } from '../components/CorridorTimeline';
import { SimulationController } from '../components/SimulationController';
import { OlaRideDrawer } from '../components/OlaRideDrawer';
import { 
  ShieldAlert, 
  Radio, 
  Clock, 
  Gauge, 
  Truck, 
  Hospital
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
    etaSeconds
  } = useEmergency();

  const formattedEta = () => {
    const mins = Math.floor(etaSeconds / 60);
    const secs = etaSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
