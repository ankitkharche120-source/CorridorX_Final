import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { CheckCircle2, AlertTriangle, Radio, ShieldCheck, ArrowRight, Zap } from 'lucide-react';

export const CorridorTimeline = () => {
  const { nodes, isSimulating, tripStage, tripStatus, corridorStatus } = useEmergency();

  const isPickupPhase = tripStage === 'PICKUP_STAGE';

  return (
    <div className="bg-white  border border-slate-200 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg border bg-red-500/10 text-red-400 border-red-500/20">
            <Zap className={`w-4 h-4 ${isSimulating ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              {isPickupPhase ? 'Emergency Corridor Active • Dispatch to Patient' : 'Emergency Corridor Active • Transit to Trauma Bay'}
            </h3>
            <p className="text-[11px] text-slate-600">
              {isPickupPhase 
                ? 'Traffic signals clearing intersections ahead of ambulance towards pickup point' 
                : 'Roadside Traffic Lights & LED Gantry Pre-emption Active towards Hospital'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
            {isPickupPhase ? `PHASE 1: ${nodes.filter(n => n.status === 'PASSED' || n.status === 'NORMALIZED').length}/${nodes.length} Cleared` : `PHASE 2: ${nodes.filter(n => n.status === 'PASSED' || n.status === 'NORMALIZED').length}/${nodes.length} Cleared`}
          </span>
        </div>
      </div>

      {/* Corridor Visual Nodes Sequence */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
        {nodes.map((node, index) => {
          const isNormalized = node.status === 'NORMALIZED';
          const isPassed = node.status === 'PASSED';
          const isActive = node.status === 'ACTIVE';
          const isPreparing = node.status === 'PREPARING';
          const isUpcoming = node.status === 'UPCOMING' || node.status === 'STANDBY';

          return (
            <div
              key={node.id}
              className={`relative rounded-xl p-3 border transition-all duration-300 flex flex-col justify-between ${
                isActive
                  ? 'bg-red-950/40 border-red-500 shadow-lg shadow-sm  '
                  : isPreparing
                  ? 'bg-amber-950/30 border-amber-500/80 shadow-md shadow-amber-500/10'
                  : isPassed
                  ? 'bg-emerald-950/30 border-emerald-500/70'
                  : isNormalized
                  ? 'bg-emerald-950/20 border-emerald-600/40 opacity-80'
                  : 'bg-slate-50 border-slate-200/80 opacity-60'
              }`}
            >
              {/* Top Row: Junction number & status pill */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                  J-0{node.sequence}
                </span>

                {isActive && (
                  <span className="flex items-center gap-1 text-[10px] font-black text-red-400 uppercase tracking-wider animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                    ACTIVE
                  </span>
                )}
                {isPreparing && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    PREPARE
                  </span>
                )}
                {isPassed && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    PASSED
                  </span>
                )}
                {isNormalized && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    NORMALIZED
                  </span>
                )}
                {isUpcoming && (
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    UPCOMING
                  </span>
                )}
              </div>

              {/* Node Title */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                  {node.name.split('/')[0].trim()}
                </h4>
                <p className="text-[10px] text-slate-600 mt-0.5 line-clamp-1">
                  {(node.type || 'TRAFFIC_SIGNAL_JUNCTION').replace(/_/g, ' ')}
                </p>
              </div>

              {/* Dynamic Status Action Description */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[10px] font-medium">
                {isActive && (
                  <p className="text-red-300 font-bold flex items-center gap-1">
                    <Radio className="w-3 h-3 text-red-400 animate-spin" />
                    Clearing Traffic Now
                  </p>
                )}
                {isPreparing && (
                  <p className="text-amber-300 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    Warning Road Users
                  </p>
                )}
                {isPassed && (
                  <p className="text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Intersection Cleared
                  </p>
                )}
                {isNormalized && (
                  <p className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Signals Normalized
                  </p>
                )}
                {isUpcoming && (
                  <p className="text-slate-500">
                    Awaiting Pre-trigger
                  </p>
                )}
              </div>

              {/* Arrow Connector on desktop */}
              {index < nodes.length - 1 && (
                <div className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-600">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};


