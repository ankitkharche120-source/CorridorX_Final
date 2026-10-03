import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    'nav.consumer': 'CONSUMER APP',
    'nav.pilot': 'PILOT COCKPIT',
    'nav.emergency_request': 'Emergency Request',
    'nav.live_track': 'Ambulance Live Track',
    'nav.dispatch_cockpit': 'Dispatch Cockpit',
    'nav.sign_out': 'Sign Out',
    'nav.duty': 'DUTY',
    
    'dash.title': 'Emergency Ambulance Dispatch',
    'dash.subtitle': 'CorridorX Dynamic Emergency Mobility Platform',
    'dash.search_placeholder': 'Search any location in India...',
    'dash.use_gps': 'Use Current Location',
    'dash.nearby_hospitals': 'Nearby Hospitals',
    'dash.available_ambulances': 'Available Ambulances',
    'dash.dispatch': 'DISPATCH AMBULANCE',
    
    'pilot.title': 'Incoming Emergency Request',
    'pilot.accept': 'ACCEPT EMERGENCY ROUTE',
    'pilot.drive': 'DRIVE TO PICKUP',
    'pilot.manifest': 'EMERGENCY MANIFEST'
  },
  hi: {
    'nav.consumer': 'उपभोक्ता ऐप',
    'nav.pilot': 'पायलट कॉकपिट',
    'nav.emergency_request': 'आपातकालीन अनुरोध',
    'nav.live_track': 'एम्बुलेंस लाइव ट्रैक',
    'nav.dispatch_cockpit': 'डिस्पैच कॉकपिट',
    'nav.sign_out': 'लॉग आउट',
    'nav.duty': 'ड्यूटी',
    
    'dash.title': 'आपातकालीन एम्बुलेंस प्रेषण',
    'dash.subtitle': 'कॉरिडोरएक्स डायनेमिक आपातकालीन मोबिलिटी प्लेटफॉर्म',
    'dash.search_placeholder': 'भारत में कोई भी स्थान खोजें...',
    'dash.use_gps': 'वर्तमान स्थान का उपयोग करें',
    'dash.nearby_hospitals': 'आसपास के अस्पताल',
    'dash.available_ambulances': 'उपलब्ध एम्बुलेंस',
    'dash.dispatch': 'पिकअप के लिए एम्बुलेंस भेजें',

    'pilot.title': 'आगामी आपातकालीन अनुरोध',
    'pilot.accept': 'आपातकालीन मार्ग स्वीकार करें',
    'pilot.drive': 'पिकअप के लिए ड्राइव करें',
    'pilot.manifest': 'आपातकालीन मेनिफेस्ट'
  },
  mr: {
    'nav.consumer': 'ग्राहक ॲप',
    'nav.pilot': 'पायलट कॉकपिट',
    'nav.emergency_request': 'आणीबाणी विनंती',
    'nav.live_track': 'रुग्णवाहिका थेट ट्रॅक',
    'nav.dispatch_cockpit': 'डिस्पॅच कॉकपिट',
    'nav.sign_out': 'साइन आउट',
    'nav.duty': 'कर्तव्य',
    
    'dash.title': 'आणीबाणी रुग्णवाहिका पाठवणे',
    'dash.subtitle': 'कॉरिडोरएक्स डायनॅमिक इमर्जन्सी मोबिलिटी प्लॅटफॉर्म',
    'dash.search_placeholder': 'भारतातील कोणतेही ठिकाण शोधा...',
    'dash.use_gps': 'सध्याचे स्थान वापरा',
    'dash.nearby_hospitals': 'जवळपासची रुग्णालये',
    'dash.available_ambulances': 'उपलब्ध रुग्णवाहिका',
    'dash.dispatch': 'पिकअपसाठी रुग्णवाहिका पाठवा',

    'pilot.title': 'आगामी आणीबाणी विनंती',
    'pilot.accept': 'आणीबाणी मार्ग स्वीकारा',
    'pilot.drive': 'पिकअपसाठी ड्राइव्ह करा',
    'pilot.manifest': 'आणीबाणी मॅनिफेस्ट'
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('corridorx_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('corridorx_lang', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);


