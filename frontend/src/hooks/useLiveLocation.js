import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to track real device GPS coordinates with production-grade
 * error handling, accuracy scoring, and stale position detection.
 *
 * @param {Object} options
 * @param {boolean} options.enabled - Whether geolocation tracking is actively listening
 * @param {boolean} options.highAccuracy - Request GPS/GLONASS precision instead of cellular/WiFi
 * @param {number} options.timeoutMs - Timeout before triggering a location error
 * @param {number} options.maximumAgeMs - Cache duration of previous location
 * @param {number} options.staleThresholdMs - Time after which last fix is marked stale
 */
export const useLiveLocation = ({
  enabled = true,
  highAccuracy = true,
  timeoutMs = 15000,
  maximumAgeMs = 3000,
  staleThresholdMs = 10000
} = {}) => {
  const [location, setLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null); // in meters
  const [heading, setHeading] = useState(null); // degrees relative to true north
  const [speed, setSpeed] = useState(null); // m/s or converted to km/h
  const [timestamp, setTimestamp] = useState(null);
  const [isWatching, setIsWatching] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'granted' | 'denied' | 'prompt'
  const [error, setError] = useState(null);

  const watchIdRef = useRef(null);
  const staleCheckIntervalRef = useRef(null);

  // Determine accuracy category
  const getAccuracyQuality = (acc) => {
    if (acc === null || acc === undefined) return 'UNKNOWN';
    if (acc <= 15) return 'HIGH'; // GPS lock
    if (acc <= 45) return 'MEDIUM'; // WiFi / Cell assisted
    return 'POOR'; // Broad cell tower radius
  };

  // Process Geolocation success callback
  const handleSuccess = useCallback((pos) => {
    const coords = pos.coords;
    const now = Date.now();

    setLocation({
      lat: coords.latitude,
      lng: coords.longitude
    });
    setAccuracy(coords.accuracy);
    setHeading(coords.heading);
    setSpeed(coords.speed !== null && coords.speed >= 0 ? +(coords.speed * 3.6).toFixed(1) : 0); // convert m/s to km/h
    setTimestamp(pos.timestamp || now);
    setError(null);
    setIsStale(false);
  }, []);

  // Process Geolocation failure callback
  const handleError = useCallback((err) => {
    let errorCode = 'UNKNOWN_ERROR';
    let errorMessage = 'An unknown GPS error occurred.';

    switch (err.code) {
      case 1: // PERMISSION_DENIED
        errorCode = 'PERMISSION_DENIED';
        errorMessage = 'GPS Location permission was denied. Please allow location access in your browser settings.';
        setPermissionStatus('denied');
        break;
      case 2: // POSITION_UNAVAILABLE
        errorCode = 'POSITION_UNAVAILABLE';
        errorMessage = 'GPS signal is currently unavailable. Ensure device location is enabled.';
        break;
      case 3: // TIMEOUT
        errorCode = 'TIMEOUT';
        errorMessage = 'Location request timed out. Checking for refreshed satellite fix...';
        break;
      default:
        errorMessage = err.message || errorMessage;
    }

    setError({
      code: errorCode,
      message: errorMessage,
      originalError: err
    });
  }, []);

  // Request one-off instant position
  const requestCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 'NOT_SUPPORTED',
        message: 'Geolocation is not supported by your browser.'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: highAccuracy,
      timeout: timeoutMs,
      maximumAge: maximumAgeMs
    });
  }, [handleSuccess, handleError, highAccuracy, timeoutMs, maximumAgeMs]);

  // Start watching position
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 'NOT_SUPPORTED',
        message: 'Geolocation is not supported by your browser.'
      });
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    // Check permissions API if available
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((status) => {
        setPermissionStatus(status.state);
        status.onchange = () => {
          setPermissionStatus(status.state);
        };
      }).catch(() => {
        // Permissions API unsupported on some browsers, ignore
      });
    }

    try {
      const id = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        {
          enableHighAccuracy: highAccuracy,
          timeout: timeoutMs,
          maximumAge: maximumAgeMs
        }
      );
      watchIdRef.current = id;
      setIsWatching(true);
    } catch (e) {
      setError({
        code: 'WATCH_FAILED',
        message: 'Could not initiate GPS listener: ' + e.message
      });
    }
  }, [handleSuccess, handleError, highAccuracy, timeoutMs, maximumAgeMs]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  }, []);

  // Watch lifecycle
  useEffect(() => {
    if (enabled) {
      startWatching();
    } else {
      stopWatching();
    }

    return () => {
      stopWatching();
    };
  }, [enabled, startWatching, stopWatching]);

  // Check for stale coordinates every 4 seconds
  useEffect(() => {
    staleCheckIntervalRef.current = setInterval(() => {
      if (timestamp && (Date.now() - timestamp > staleThresholdMs)) {
        setIsStale(true);
      }
    }, 4000);

    return () => {
      clearInterval(staleCheckIntervalRef.current);
    };
  }, [timestamp, staleThresholdMs]);

  return {
    location,
    latitude: location?.lat || null,
    longitude: location?.lng || null,
    accuracy,
    accuracyQuality: getAccuracyQuality(accuracy),
    heading,
    speed, // in km/h
    timestamp,
    isWatching,
    isStale,
    permissionStatus,
    error,
    requestCurrentPosition,
    startWatching,
    stopWatching
  };
};

export default useLiveLocation;
