import React, { useState, useEffect } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { socketService } from '../services/socketService';
import { 
  Hospital, 
  Activity, 
  Truck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Radio, 
  Bed, 
  Wind, 
  Phone, 
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const HospitalDashboardPage = () => {
  const { selectedHospital, selectedAmbulance, emergencyRequest, distanceRemainingKm, etaMinutes, etaSeconds } = useEmergency();

  // Hospital state
  const [hospitalData, setHospitalData] = useState({
    id: selectedHospital?.id || 'HOSP-01',
    name: selectedHospital?.name || 'Deenanath Mangeshkar Hospital & Research Center',
    address: selectedHospital?.address || 'Erandwane, Near Mhatre Bridge, Pune',
    helpline: selectedHospital?.helpline || '+91 20 4015 1000',
    receivingStatus: 'READY', // 'READY' | 'BUSY' | 'CLOSED'
    traumaStatus: 'AVAILABLE', // 'AVAILABLE' | 'LIMITED' | 'FULL'
    icuStatus: 'AVAILABLE',   // 'AVAILABLE' | 'LIMITED' | 'FULL'
    ventilatorStatus: 'AVAILABLE', // 'AVAILABLE' | 'LIMITED' | 'FULL'
    icuBeds: 8
  });

  const [incomingTrips, setIncomingTrips] = useState([
    {
      id: 'TRIP-CX-8841',
      ambulanceId: selectedAmbulance?.id || 'AMB-102',
      patientName: emergencyRequest.patientName || 'Rahul Sharma',
      emergencyType: emergencyRequest.emergencyType || 'Chest Pain / STEMI',
      etaMinutes: etaMinutes || 4,
      etaSeconds: etaSeconds || 240,
      distanceKm: distanceRemainingKm || 2.1,
      speedKmh: 58,
      status: 'EN_ROUTE_HOSPITAL',
      vitals: { hr: 112, spo2: 96, bp: '138/88' }
    }
  ]);

  const [savingStatus, setSavingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Subscribe to real-time hospital alerts over Socket.IO
  useEffect(() => {
    socketService.connect();
    socketService.joinHospital(hospitalData.id);

    const unsubAlert = socketService.onHospitalAlert((data) => {
      console.log('[Hospital Dashboard] Received emergency pre-alert:', data);
      setIncomingTrips(prev => {
        const existingIdx = prev.findIndex(t => t.id === data.tripId);
        const updated = {
          id: data.tripId || 'TRIP-INCOMING',
          ambulanceId: data.ambulanceId || 'AMB-102',
          patientName: data.patientName || 'Emergency Patient',
          emergencyType: data.emergencyType || 'Acute Emergency',
          etaMinutes: Math.ceil((data.etaSeconds || 300) / 60),
          etaSeconds: data.etaSeconds || 300,
          distanceKm: data.distanceKm || 2.5,
          speedKmh: data.speedKmh || 50,
          status: 'EN_ROUTE_HOSPITAL',
          vitals: data.vitals || { hr: 108, spo2: 97, bp: '132/84' }
        };

        if (existingIdx >= 0) {
          const copy = [...prev];
          copy[existingIdx] = updated;
          return copy;
        }
        return [updated, ...prev];
      });
    });

    const unsubEta = socketService.onTripEta((data) => {
      setIncomingTrips(prev => prev.map(t => {
        if (t.id === data.tripId) {
          return {
            ...t,
            distanceKm: data.distanceKm,
            etaMinutes: data.etaMinutes,
            etaSeconds: data.etaSeconds
          };
        }
        return t;
      }));
    });

    return () => {
      unsubAlert();
      unsubEta();
    };
  }, [hospitalData.id]);

  // Update capacity on backend & broadcast
  const handleUpdateStatus = async (field, value) => {
    const updated = { ...hospitalData, [field]: value };
    setHospitalData(updated);
    setSavingStatus(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/hospitals/${hospitalData.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiving_status: updated.receivingStatus,
          trauma_status: updated.traumaStatus,
          icu_status: updated.icuStatus,
          ventilator_status: updated.ventilatorStatus,
          icu_beds: updated.icuBeds
        })
      });

      if (response.ok) {
        setStatusMessage('Status updated & synced with central control.');
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.warn('Status save failed:', err);
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Hospital className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  TRAUMA BAY EMERGENCY PORTAL
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {hospitalData.id}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                {hospitalData.name}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">{hospitalData.address}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {statusMessage && (
              <span className="text-xs text-emerald-400 font-medium animate-pulse">{statusMessage}</span>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="font-mono text-slate-300">TELEMETRY LINK ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Operational Status Control Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Emergency Receiving Status */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Emergency Desk</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {['READY', 'BUSY', 'CLOSED'].map((val) => (
                <button
                  key={val}
                  onClick={() => handleUpdateStatus('receivingStatus', val)}
                  className={`py-1.5 rounded-lg font-bold transition-all text-[11px] ${
                    hospitalData.receivingStatus === val
                      ? (val === 'READY' ? 'bg-emerald-600 text-white' : (val === 'BUSY' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white'))
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Trauma Bay Capacity */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trauma Resuscitation</span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {['AVAILABLE', 'LIMITED', 'FULL'].map((val) => (
                <button
                  key={val}
                  onClick={() => handleUpdateStatus('traumaStatus', val)}
                  className={`py-1.5 rounded-lg font-bold transition-all text-[11px] ${
                    hospitalData.traumaStatus === val
                      ? (val === 'AVAILABLE' ? 'bg-emerald-600 text-white' : (val === 'LIMITED' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white'))
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* ICU Open Beds */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ICU Beds Ready</span>
              <Bed className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <button 
                onClick={() => handleUpdateStatus('icuBeds', Math.max(0, hospitalData.icuBeds - 1))}
                className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 font-bold hover:bg-slate-800"
              >-</button>
              <span className="text-xl font-mono font-black text-white">{hospitalData.icuBeds} BEDS</span>
              <button 
                onClick={() => handleUpdateStatus('icuBeds', hospitalData.icuBeds + 1)}
                className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 font-bold hover:bg-slate-800"
              >+</button>
            </div>
          </div>

          {/* Ventilators */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ventilator Support</span>
              <Wind className="w-4 h-4 text-purple-400" />
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {['AVAILABLE', 'LIMITED', 'FULL'].map((val) => (
                <button
                  key={val}
                  onClick={() => handleUpdateStatus('ventilatorStatus', val)}
                  className={`py-1.5 rounded-lg font-bold transition-all text-[11px] ${
                    hospitalData.ventilatorStatus === val
                      ? (val === 'AVAILABLE' ? 'bg-emerald-600 text-white' : (val === 'LIMITED' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white'))
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Incoming Casualties Manifest */}
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-red-500" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Incoming Ambulances & Casualties
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold">
              {incomingTrips.length} ACTIVE CASUALTY EN ROUTE
            </span>
          </div>

          <div className="space-y-3">
            {incomingTrips.map(trip => (
              <div 
                key={trip.id}
                className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
                    <Truck className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white">{trip.ambulanceId}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-600 text-white font-extrabold uppercase">
                        GREEN WAVE ACTIVE
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1">
                      Patient: <strong className="text-emerald-300">{trip.patientName}</strong>
                    </h3>
                    <p className="text-xs text-slate-300">
                      Diagnosis: <span className="text-red-400 font-semibold">{trip.emergencyType}</span>
                    </p>
                  </div>
                </div>

                {/* Vitals Telemetry */}
                <div className="flex items-center gap-3 text-xs bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block">HEART RATE</span>
                    <strong className="text-emerald-400 text-sm">{trip.vitals?.hr || 108} bpm</strong>
                  </div>
                  <div className="border-l border-slate-800 pl-3">
                    <span className="text-[10px] text-slate-400 block">SpO2</span>
                    <strong className="text-blue-400 text-sm">{trip.vitals?.spo2 || 97}%</strong>
                  </div>
                  <div className="border-l border-slate-800 pl-3">
                    <span className="text-[10px] text-slate-400 block">BP</span>
                    <strong className="text-purple-400 text-sm">{trip.vitals?.bp || '132/84'}</strong>
                  </div>
                </div>

                {/* Live ETA & Arrival Readiness */}
                <div className="text-right">
                  <div className="text-2xl font-mono font-black text-red-400">
                    {trip.etaMinutes} MIN
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {trip.distanceKm} km away • {trip.speedKmh} km/h
                  </span>
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Trauma Bay Assigned</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};

export default HospitalDashboardPage;
