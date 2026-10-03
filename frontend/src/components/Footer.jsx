import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 text-slate-600 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img 
              src="/logo.jpg" 
              alt="CorridorX Logo" 
              className="h-10 w-auto object-contain rounded-lg bg-slate-100 p-1"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                POWERED BY CORRIDOR<span className="text-red-500">X</span>
              </span>
              <span className="text-slate-500 text-[10px] uppercase tracking-wider">Dynamic Emergency Ambulance Mobility</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <Link to="/customer/request" className="hover:text-red-400 transition-colors">Book Ambulance</Link>
            <Link to="/customer/emergency" className="hover:text-red-400 transition-colors">Live Track</Link>
            <Link to="/ambulance" className="hover:text-blue-400 transition-colors">Driver App</Link>
            <Link to="/qr-emergency" className="hover:text-slate-900 transition-colors">QR Scan</Link>
            <Link to="/login" className="hover:text-slate-900 transition-colors">Sign In</Link>
          </div>

          {/* Attribution & Copyright */}
          <div className="flex flex-col items-end gap-1">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <span>Built with</span>
              <HeartPulse className="w-3.5 h-3.5 text-red-500" />
              <span>for Emergency Healthcare</span>
            </div>
            <span className="text-[10px] text-slate-600 mt-1">
              &copy; {new Date().getFullYear()} CorridorX. All rights reserved.
            </span>
          </div>

        </div>
      </div>
    </footer>
  );
};


