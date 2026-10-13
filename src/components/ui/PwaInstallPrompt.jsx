import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles, Smartphone } from 'lucide-react';
import { soundManager } from '../../utils/sound';

export const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;

    // Check if user dismissed prompt recently (within 24 hours)
    try {
      const dismissedUntil = localStorage.getItem('smaakenzzoo_pwa_dismissed_until');
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        return;
      }
    } catch {
      // ignore
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after a gentle 3-second delay so customer isn't bombarded on landing
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    soundManager.playTapSound();
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    soundManager.playTapSound();
    setIsVisible(false);
    // Dismiss for 24 hours
    try {
      localStorage.setItem('smaakenzzoo_pwa_dismissed_until', String(Date.now() + 24 * 60 * 60 * 1000));
    } catch {
      // ignore
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#131722]/95 backdrop-blur-md border border-pink-500/30 rounded-3xl p-4 shadow-2xl shadow-pink-900/30 text-white flex items-center justify-between gap-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-pink-600/30">
            <Smartphone className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-sm text-white tracking-tight truncate">Install Smaakenzzoo</h4>
              <span className="px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[9px] font-black uppercase tracking-wider border border-pink-500/30">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              Faster 1-tap ordering, offline menu & live tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="py-2 px-3.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-pink-600/30 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Install</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Dismiss app install banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PwaInstallPrompt;
