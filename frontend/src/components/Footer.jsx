import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center font-black text-white text-xs">
              CX
            </div>
            <span className="font-extrabold text-white text-base tracking-tight">
              CORRIDOR<span className="text-red-500">X</span>
            </span>
            <span className="text-slate-500 text-xs ml-2">Dynamic Emergency Ambulance Mobility</span>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <Link to="/customer/request" className="hover:text-red-400 transition-colors">Book Ambulance</Link>
            <Link to="/customer/emergency" className="hover:text-red-400 transition-colors">Live Track</Link>
            <Link to="/ambulance" className="hover:text-blue-400 transition-colors">Driver App</Link>
            <Link to="/qr-emergency" className="hover:text-white transition-colors">QR Scan</Link>
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>

          {/* Attribution */}
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <span>Built with</span>
            <HeartPulse className="w-3.5 h-3.5 text-red-500" />
            <span>for Emergency Healthcare</span>
          </div>

        </div>
      </div>
    </footer>
  );
};
