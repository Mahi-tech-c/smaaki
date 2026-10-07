import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline && !showReconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center text-xs font-bold transition-all duration-300 shadow-md flex items-center justify-center gap-2 ${
        isOffline
          ? 'bg-amber-600 text-white'
          : 'bg-emerald-600 text-white'
      }`}
    >
      {isOffline ? (
        <>
          <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>You are offline. Showing cached cafe menu.</span>
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Back online! Live menu synchronized.</span>
        </>
      )}
    </div>
  );
};

export default OfflineBanner;
