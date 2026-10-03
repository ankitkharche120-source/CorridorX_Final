import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEmergency } from '../context/EmergencyContext';
import { LocationPicker } from '../components/LocationPicker';
import { 
  ShieldAlert, 
  MapPin, 
  User, 
  Phone, 
  AlertCircle, 
  Navigation, 
  ArrowRight,
  Info,
  Clock
} from 'lucide-react';

export const EmergencyRequestPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { emergencyRequest, submitEmergencyRequest } = useEmergency();

  const preselectedCategory = location.state?.selectedCategory || 'Chest Pain';

  const [selectedPickup, setSelectedPickup] = useState({
    latitude: emergencyRequest.pickupCoords?.latitude || emergencyRequest.pickupCoords?.lat || 20.5937,
    longitude: emergencyRequest.pickupCoords?.longitude || emergencyRequest.pickupCoords?.lng || 78.9629,
    formattedAddress: emergencyRequest.pickupLocation || 'Select emergency location',
    shortTitle: emergencyRequest.pickupLocation?.split(',')[0] || 'Selected Location',
    source: emergencyRequest.source || 'INITIAL'
  });

  const [formData, setFormData] = useState({
    patientName: emergencyRequest.patientName || 'Rahul Sharma',
    contactNumber: emergencyRequest.contactNumber || '+91 98765 43210',
    emergencyType: preselectedCategory,
    pickupLocation: emergencyRequest.pickupLocation || '',
    pickupCoords: emergencyRequest.pickupCoords || null,
    notes: emergencyRequest.notes || 'Conscious, severe acute discomfort'
  });

  React.useEffect(() => {
    if (emergencyRequest.pickupCoords?.lat && emergencyRequest.pickupCoords?.lng) {
      setSelectedPickup({
        latitude: emergencyRequest.pickupCoords.lat,
        longitude: emergencyRequest.pickupCoords.lng,
        formattedAddress: emergencyRequest.pickupLocation || 'Live GPS Location',
        shortTitle: emergencyRequest.pickupLocation?.split(',')[0] || 'Live Location',
        source: emergencyRequest.source || 'LIVE_GPS'
      });
      setFormData(prev => ({
        ...prev,
        pickupLocation: emergencyRequest.pickupLocation || prev.pickupLocation,
        pickupCoords: emergencyRequest.pickupCoords
      }));
    }
  }, [emergencyRequest.pickupCoords?.lat, emergencyRequest.pickupCoords?.lng, emergencyRequest.pickupLocation]);

  const emergencyTypes = [
    'Accident / Polytrauma',
    'Chest Pain / Cardiac',
    'Stroke / Paralysis',
    'Breathing Difficulty / Asthma',
    'Severe Trauma / Bleeding',
    'Severe Burn Injury',
    'Pediatric Emergency',
    'Other Acute Medical Condition'
  ];

  const handleLocationChange = (loc) => {
    setSelectedPickup(loc);
    setFormData(prev => ({
      ...prev,
      pickupLocation: loc.formattedAddress,
      pickupCoords: { lat: loc.latitude, lng: loc.longitude }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitEmergencyRequest({
      ...formData,
      pickupLocation: selectedPickup.formattedAddress,
      pickupCoords: { lat: selectedPickup.latitude, lng: selectedPickup.longitude },
      source: selectedPickup.source
    });
    navigate('/customer/ambulances');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Top Breadcrumb / Progress */}
        <div className="flex items-center justify-between mb-6 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-[10px]">
              1
            </span>
            <span className="text-slate-900 font-bold">Emergency Details</span>
          </div>
          <div className="h-0.5 w-12 bg-slate-100" />
          <div className="flex items-center gap-2 text-slate-600">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Select Ambulance</span>
          </div>
          <div className="h-0.5 w-12 bg-slate-100" />
          <div className="flex items-center gap-2 text-slate-600">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px]">
              3
            </span>
            <span>Hospital</span>
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-white  border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl">
          
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Emergency Dispatch Request
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Provide essential patient information to prepare traffic corridor & clinical triage.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Patient Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Patient Name / Attendant Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-red-500 rounded-xl text-sm text-slate-900 placeholder-slate-600 focus:outline-none focus: focus: transition-colors"
                />
              </div>
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Contact Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-red-500 rounded-xl text-sm text-slate-900 placeholder-slate-600 focus:outline-none focus: focus: transition-colors"
                />
              </div>
            </div>

            {/* Emergency / Injury Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Emergency / Injury Type
              </label>
              <div className="relative">
                <select
                  value={formData.emergencyType}
                  onChange={(e) => setFormData({ ...formData, emergencyType: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-red-500 rounded-xl text-sm text-slate-900 focus:outline-none focus: focus: transition-colors appearance-none cursor-pointer"
                >
                  {emergencyTypes.map((type, i) => (
                    <option key={i} value={type} className="bg-white text-slate-900">
                      {type}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-600">
                  ▼
                </div>
              </div>
            </div>

            {/* Location Picker (GPS, India-wide Search, Interactive Map Pin, Manual) */}
            <div className="pt-1">
              <LocationPicker
                value={selectedPickup}
                onChange={handleLocationChange}
                onConfirm={(loc) => {
                  handleLocationChange(loc);
                  handleSubmit({ preventDefault: () => {} });
                }}
                label="Emergency Pickup Location"
              />
            </div>

            {/* Additional Information */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Additional Clinical Notes / Symptoms
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Mention consciousness, breathing status, severe blood loss, allergies..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-red-500 rounded-xl text-sm text-slate-900 placeholder-slate-600 focus:outline-none focus: focus: transition-colors"
              />
            </div>

            {/* Golden Hour Reminder Banner */}
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2.5 text-xs text-amber-300">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Clinical Golden Hour:</strong> CorridorX activates roadside signals immediately to ensure transport within 60 minutes.
              </span>
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-sm transition-all hover:scale-[1.01] active:scale-98"
              >
                <span>Find Nearby Ambulances</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};


