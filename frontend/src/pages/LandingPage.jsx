import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  Truck, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Hospital, 
  QrCode,
  Zap,
  Radio,
  ChevronRight
} from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="bg-slate-950 text-white min-h-screen">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-24">
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Top Tag */}
          <div className="flex justify-center mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 text-xs font-semibold shadow-md">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>DYNAMIC EMERGENCY CORRIDOR MOBILITY</span>
            </div>
          </div>

          {/* Main Title & Headline */}
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Clear the road <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-400">before</span> the ambulance arrives.
            </h1>
            <p className="mt-4 text-sm sm:text-base lg:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
              CorridorX connects ambulance GPS routing and roadside traffic warnings to create a dynamically cleared path directly to pre-registered hospitals.
            </p>

            {/* Direct Dual Action CTAs: Consumer vs Driver */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                to="/customer/request"
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-red-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <ShieldAlert className="w-5 h-5" />
                <span>Book Ambulance Now</span>
                <ChevronRight className="w-4 h-4" />
              </Link>

              <Link
                to="/ambulance"
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm sm:text-base border border-slate-700 transition-all hover:scale-105 active:scale-95"
              >
                <Truck className="w-5 h-5 text-blue-400" />
                <span>Ambulance Driver Login</span>
              </Link>
            </div>
          </div>

          {/* Sequential Corridor Diagram: How It Works */}
          <div className="mt-14 max-w-4xl mx-auto bg-slate-900/90 rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-2xl">
            <div className="text-center mb-5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                DYNAMIC GREEN WAVE PROPAGATION
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white mt-2">
                Preparing Intersections In Real Time
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              
              {/* Step 1 */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center mb-2">
                  <Truck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-bold">DISPATCH</span>
                <h4 className="text-xs font-bold text-white mt-0.5">Ambulance Moving</h4>
                <p className="text-[11px] text-slate-400 mt-1">Live GPS speed 60 km/h</p>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-950 p-4 rounded-2xl border-2 border-red-500 shadow-lg shadow-red-500/20 text-center flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center mb-2 shadow">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <span className="text-[10px] font-mono text-red-400 font-black animate-pulse">ACTIVE NOW</span>
                <h4 className="text-xs font-bold text-white mt-0.5">Junction Clearing</h4>
                <p className="text-[11px] text-red-200 mt-1">Right lane locked clear</p>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/60 text-center flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center mb-2">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-amber-400 font-bold">PREPARING</span>
                <h4 className="text-xs font-bold text-white mt-0.5">Next Signal Alert</h4>
                <p className="text-[11px] text-slate-400 mt-1">Traffic instructed to merge left</p>
              </div>

              {/* Step 4 */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/60 text-center flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-2">
                  <Hospital className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">DESTINATION</span>
                <h4 className="text-xs font-bold text-white mt-0.5">Hospital Arrival</h4>
                <p className="text-[11px] text-slate-400 mt-1">Pre-registered Trauma Bay</p>
              </div>

            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 text-center">
              <p className="text-xs font-medium text-slate-400 italic">
                “No stuck sirens. Traffic clears before the ambulance reaches the intersection.”
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Simplified 2 User Roles Overview (Uber/Ola Style) */}
      <section className="py-12 bg-slate-900/60 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Consumer Card */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-500 flex items-center justify-center mb-4">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono text-red-400 font-bold uppercase">FOR PATIENTS & FAMILIES</span>
                <h3 className="text-lg font-bold text-white mt-1">Fast Emergency Booking</h3>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                  Request an ALS, BLS, or Cardiac ambulance in seconds. Select a pre-registered hospital right away or decide after entering the vehicle.
                </p>
              </div>
              <div className="mt-6">
                <Link
                  to="/customer/request"
                  className="inline-flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300"
                >
                  <span>Request Emergency Ride</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Ambulance Driver Card */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-500 flex items-center justify-center mb-4">
                  <Truck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono text-blue-400 font-bold uppercase">FOR AMBULANCE DRIVERS</span>
                <h3 className="text-lg font-bold text-white mt-1">Driver Cockpit & GPS</h3>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                  Accept emergency trips, broadcast live location, and navigate through green-lit corridor junctions directly to hospital bays.
                </p>
              </div>
              <div className="mt-6">
                <Link
                  to="/ambulance"
                  className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300"
                >
                  <span>Open Driver Cockpit</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>

          {/* Quick QR Decal Scan */}
          <div className="mt-6 bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Near an ambulance right now?</h4>
                <p className="text-[11px] text-slate-400">Scan the vehicle QR decal to book instantly without creating an account.</p>
              </div>
            </div>
            <Link
              to="/qr-emergency"
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors"
            >
              Scan Decal
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
};
