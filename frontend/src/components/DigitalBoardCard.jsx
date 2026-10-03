import React from 'react';
import { Radio, ArrowRight, ArrowLeft, ArrowUp, CheckCircle, AlertOctagon } from 'lucide-react';

export const DigitalBoardCard = ({ board }) => {
  const isLarge = board.type === 'LARGE_INTERSECTION';
  const status = board.status || 'NORMAL';
  const currentMsg = board.messages[status] || board.messages.NORMAL;

  // Visual cues based on status
  const getTheme = () => {
    switch (status) {
      case 'ACTIVE':
        return {
          border: 'border-red-500  ',
          ledColor: 'text-red-500 led-red',
          badgeBg: 'bg-red-600 text-white',
          beacon: 'bg-red-500 animate-ping',
          statusText: 'CORRIDOR ACTIVE (CLEAR LANE)'
        };
      case 'PREPARING':
        return {
          border: 'border-amber-500/80  ring-amber-500/40',
          ledColor: 'text-amber-400 led-amber',
          badgeBg: 'bg-amber-600 text-slate-950 font-black',
          beacon: 'bg-amber-400 animate-pulse',
          statusText: 'PRE-EMPTION WARNING (ETA ALERT)'
        };
      case 'PASSED':
        return {
          border: 'border-emerald-600/70',
          ledColor: 'text-emerald-400 led-green',
          badgeBg: 'bg-emerald-600 text-white',
          beacon: 'bg-emerald-500',
          statusText: 'AMBULANCE PASSED (NORMAL FLOW)'
        };
      default:
        return {
          border: 'border-slate-200',
          ledColor: 'text-amber-200/80',
          badgeBg: 'bg-slate-100 text-slate-700',
          beacon: 'bg-slate-600',
          statusText: 'CIVIC BROADCAST (STANDBY)'
        };
    }
  };

  const theme = getTheme();

  return (
    <div className={`bg-slate-50 rounded-2xl border p-4 shadow-2xl transition-all ${theme.border}`}>
      
      {/* Gantry Hardware Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${theme.beacon}`} />
          <span className="font-mono font-bold text-slate-800">{board.id}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-600 font-medium truncate max-w-[170px]">{board.intersectionName}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-600">
            {isLarge ? 'OVERHEAD GANTRY' : 'ROADSIDE LED'}
          </span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${theme.badgeBg}`}>
            {status}
          </span>
        </div>
      </div>

      {/* Physical LED Display Screen Container */}
      <div className="mt-3 led-matrix rounded-xl p-4 sm:p-5 flex flex-col justify-center items-center text-center relative overflow-hidden min-h-[140px]">
        
        {/* Amber / Red Strobe Lights on side */}
        {status === 'ACTIVE' && (
          <>
            <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-red-600 animate-ping" />
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-red-600 animate-ping" />
          </>
        )}

        {/* LED Text Lines */}
        <div className="space-y-1.5 w-full">
          <p className={`font-mono text-sm sm:text-base font-extrabold tracking-widest uppercase ${theme.ledColor}`}>
            {currentMsg.line1}
          </p>

          <p className={`font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-800`}>
            {currentMsg.line2}
          </p>

          {currentMsg.line3 && (
            <p className={`font-mono text-[11px] sm:text-xs font-semibold tracking-wide uppercase ${theme.ledColor}`}>
              {currentMsg.line3}
            </p>
          )}
        </div>

        {/* Directional Action Visual */}
        <div className="mt-3 flex items-center justify-center gap-3">
          {status === 'ACTIVE' && (
            <div className="flex items-center gap-2 bg-red-950/80 px-3 py-1 rounded-lg border border-red-500/60 text-red-400 font-mono text-xs font-black animate-pulse">
              <AlertOctagon className="w-4 h-4 text-red-500" />
              <span>DEDICATED EMERGENCY PATH</span>
              <ArrowRight className="w-4 h-4 text-red-500" />
            </div>
          )}
          {status === 'PREPARING' && (
            <div className="flex items-center gap-2 bg-amber-950/80 px-3 py-1 rounded-lg border border-amber-500/60 text-amber-300 font-mono text-xs font-bold">
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>TRAFFIC MOVE LEFT</span>
            </div>
          )}
          {status === 'PASSED' && (
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>SIGNALS RESTORED</span>
            </div>
          )}
        </div>

      </div>

      {/* Hardware Spec Footer */}
      <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span>Channel: {board.laneAllocation}</span>
        <span className="text-slate-600">{theme.statusText}</span>
      </div>

    </div>
  );
};


