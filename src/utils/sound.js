// Pure synthesized Web Audio API sound engine
// 100% offline, zero external audio asset dependencies, instantaneous response.

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.volume = 0.8;
    this.isUnlocked = false;

    // Load persisted preferences
    if (typeof window !== 'undefined') {
      try {
        const savedMute = localStorage.getItem('smaakenzzoo_sound_muted');
        if (savedMute !== null) {
          this.isMuted = savedMute === 'true';
        }
        const savedVol = localStorage.getItem('smaakenzzoo_sound_volume');
        if (savedVol !== null) {
          const v = parseFloat(savedVol);
          if (!isNaN(v) && v >= 0 && v <= 1) this.volume = v;
        }
      } catch {
        // Fallback to defaults if localStorage restricted
      }
    }
  }

  // Lazy initialize AudioContext on user gesture
  getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    if (this.audioCtx && this.audioCtx.state === 'running') {
      this.isUnlocked = true;
    }
    return this.audioCtx;
  }

  // Explicit user unlock trigger
  async unlock() {
    const ctx = this.getAudioContext();
    if (!ctx) return false;
    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      this.isUnlocked = ctx.state === 'running';
      // Play a very subtle 5ms click at near-zero volume to prime hardware
      if (this.isUnlocked) {
        this.playTone(880, 'sine', 0.05, 0.05);
      }
      return this.isUnlocked;
    } catch {
      return false;
    }
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    try {
      localStorage.setItem('smaakenzzoo_sound_muted', String(this.isMuted));
    } catch {
      // Ignore storage restrictions
    }
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  setVolume(vol) {
    const v = Math.max(0, Math.min(1, parseFloat(vol) || 0));
    this.volume = v;
    try {
      localStorage.setItem('smaakenzzoo_sound_volume', String(v));
    } catch {
      // Ignore storage restrictions
    }
  }

  // Helper tone player with custom envelope
  playTone(freq, type = 'sine', duration = 0.3, customVol = null, startTimeOffset = 0) {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const masterGain = ctx.createGain();
      const osc = ctx.createOscillator();

      const baseVol = customVol !== null ? customVol : this.volume;
      const now = ctx.currentTime + startTimeOffset;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      // Attack - Decay envelope
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.exponentialRampToValueAtTime(baseVol, now + 0.02);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Audio node failure fallback
    }
  }

  // 1. Kitchen Alert: Energetic triple-bell chime for incoming orders
  playNewOrderChime() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Harmonious bright triad: D5 (587Hz) -> A5 (880Hz) -> D6 (1175Hz) -> F#6 (1480Hz)
    const notes = [
      { f: 587.33, t: 0.0, d: 0.35, v: this.volume * 0.9 },
      { f: 880.00, t: 0.15, d: 0.40, v: this.volume * 1.0 },
      { f: 1174.66, t: 0.32, d: 0.55, v: this.volume * 0.95 },
      { f: 1479.98, t: 0.50, d: 0.70, v: this.volume * 0.85 }
    ];

    notes.forEach(n => {
      this.playTone(n.f, 'triangle', n.d, n.v, n.t);
      // Add slight sine warmth layer
      this.playTone(n.f / 2, 'sine', n.d * 0.7, n.v * 0.4, n.t);
    });
  }

  // 2. Waiter Service Bell: Crisp dual-ding (like classic counter bell)
  playWaiterBell() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Counter bell resonance (C6 1046.5Hz & G6 1567.98Hz)
    const strikes = [0.0, 0.22];
    strikes.forEach(strikeTime => {
      this.playTone(1046.50, 'sine', 0.6, this.volume * 0.8, strikeTime);
      this.playTone(2093.00, 'sine', 0.4, this.volume * 0.3, strikeTime);
      this.playTone(3135.96, 'triangle', 0.3, this.volume * 0.15, strikeTime);
    });
  }

  // 3. Customer Order Status Update: Warm uplifting progression
  playOrderStatusUpdate() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Upward cheerful arpeggio: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz)
    const notes = [
      { f: 523.25, t: 0.0, d: 0.25 },
      { f: 659.25, t: 0.12, d: 0.25 },
      { f: 783.99, t: 0.24, d: 0.35 },
      { f: 1046.50, t: 0.38, d: 0.60 }
    ];

    notes.forEach(n => {
      this.playTone(n.f, 'sine', n.d, this.volume * 0.7, n.t);
      this.playTone(n.f * 1.5, 'triangle', n.d * 0.5, this.volume * 0.25, n.t);
    });
  }

  // 4. Subtle UI interaction pop/tap
  playTapSound() {
    if (this.isMuted) return;
    this.playTone(440, 'sine', 0.08, this.volume * 0.2);
  }
}

// Global Singleton Instance
export const soundManager = new SoundEngine();

// Auto-register touch/click unlock on first browser interaction
if (typeof window !== 'undefined') {
  const handleFirstInteraction = () => {
    soundManager.unlock();
    ['click', 'touchstart', 'keydown'].forEach(evt => {
      window.removeEventListener(evt, handleFirstInteraction);
    });
  };
  ['click', 'touchstart', 'keydown'].forEach(evt => {
    window.addEventListener(evt, handleFirstInteraction, { passive: true, once: true });
  });
}
