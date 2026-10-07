import React, { useState, useEffect } from 'react';
import { Coffee } from 'lucide-react';

const SPLASH_SESSION_KEY = 'smaakenzzoo_splash_shown';

export const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(() => {
    try {
      return !sessionStorage.getItem(SPLASH_SESSION_KEY);
    } catch {
      return false;
    }
  });
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    // Hard ceiling: max 1.5s (1200ms display + 250ms fade)
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 1100);

    const closeTimer = setTimeout(() => {
      setIsVisible(false);
      try {
        sessionStorage.setItem(SPLASH_SESSION_KEY, 'true');
      } catch (e) {
        console.warn('Storage error:', e);
      }
    }, 1350);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(closeTimer);
    };
  }, [isVisible]);

  const handleSkip = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem(SPLASH_SESSION_KEY, 'true');
    } catch (e) {
      console.warn('Storage error:', e);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-label="Welcome to Smaakenzzoo"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f1117] text-white select-none transition-opacity duration-250 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Brand Icon & Glow */}
      <div className="relative mb-5 animate-in zoom-in-75 duration-300">
        <div className="absolute inset-0 rounded-3xl bg-pink-600/30 blur-2xl transform scale-150" />
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-pink-700 via-pink-600 to-pink-500 flex items-center justify-center shadow-2xl shadow-pink-600/40 border border-pink-400/20">
          <Coffee className="w-10 h-10 text-white" />
        </div>
      </div>

      {/* Typography */}
      <div className="text-center px-4 space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-heading">
          Smaakenzzoo
        </h1>
        <p className="text-xs sm:text-sm font-medium text-pink-400 tracking-wider italic">
          Flourishing Hearts, Blooming Dreams
        </p>
        <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold pt-1">
          Artisanal Cafe • Warangal
        </p>
      </div>

      {/* Skip button */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute bottom-10 px-4 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold tracking-wider transition-colors"
      >
        Skip
      </button>
    </div>
  );
};

export default SplashScreen;
