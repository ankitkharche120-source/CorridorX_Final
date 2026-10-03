import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { Play, Pause, RotateCcw, FastForward, Navigation, Gauge, Clock } from 'lucide-react';

export const SimulationController = () => {
  const {
    isSimulating,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    stepForwardSimulation,
    simulationSpeedMultiplier,
    setSimulationSpeedMultiplier,
    currentSpeedKmh,
    distanceRemainingKm,
    etaSeconds,
    tripStage,
    tripStatus
  } = useEmergency();

  const isPickupPhase = tripStage === 'PICKUP_STAGE';
  const isArrived = tripStatus === 'ARRIVED_AT_HOSPITAL' || tripStatus === 'COMPLETED' || tripStatus === 'ARRIVED';

  const formattedEta = () => {
    if (isArrived) return '00:00';
    const mins = Math.floor(etaSeconds / 60);
    const secs = etaSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-2xl text-white">
      {/* Simulation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center">
            <Navigation className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
              Corridor Telemetry & Simulator
            </h4>
            <p className="text-[11px] text-slate-400">
              Real-time Node Handover • Dynamic Preemption
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          {isSimulating ? (
            <button
              onClick={pauseSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/30"
              title="Pause Simulation"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>PAUSE</span>
            </button>
          ) : (
            <button
              onClick={startSimulation}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-600/30"
              title="Start / Resume Ambulance Journey"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {isArrived 
                  ? 'REPLAY' 
                  : (isPickupPhase ? 'DRIVE TO PICKUP' : 'START CORRIDOR')}
              </span>
            </button>
          )}

          <button
            onClick={stepForwardSimulation}
            disabled={isSimulating || isArrived}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 border border-slate-700 transition-all text-xs font-semibold"
            title="Step Forward 1 Waypoint"
          >
            <FastForward className="w-4 h-4" />
          </button>

          <button
            onClick={resetSimulation}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all text-xs font-semibold"
            title="Reset Current Leg"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed Multiplier */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[11px] font-bold">
            {[1, 2, 4].map((mult) => (
              <button
                key={mult}
                onClick={() => setSimulationSpeedMultiplier(mult)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  simulationSpeedMultiplier === mult
                    ? 'bg-slate-700 text-white font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mult}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Telemetry Metric Gauges */}
      <div className="grid grid-cols-3 gap-3 mt-3 pt-1">
        
        {/* Simulated Speed */}
        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
            <Gauge className="w-3.5 h-3.5 text-blue-400" />
            <span>Simulated Speed</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-mono font-black text-white">{currentSpeedKmh}</span>
            <span className="text-xs text-slate-400 font-semibold">km/h</span>
          </div>
        </div>

        {/* Distance Remaining */}
        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isPickupPhase ? 'Dist to Pickup' : 'Dist to Hospital'}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-mono font-black text-white">{distanceRemainingKm}</span>
            <span className="text-xs text-slate-400 font-semibold">km</span>
          </div>
        </div>

        {/* ETA */}
        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
            <Clock className="w-3.5 h-3.5 text-red-400" />
            <span>{isPickupPhase ? 'ETA to Pickup' : 'Hospital ETA'}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-mono font-black text-red-400">{formattedEta()}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SimulationController;
