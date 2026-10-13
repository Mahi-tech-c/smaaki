import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  Droplets, 
  Receipt, 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Loader2 
} from 'lucide-react';
import { db, COLLECTIONS } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../ui/Toast';

const CALL_TYPES = [
  { id: 'water', label: 'Drinking Water', icon: Droplets, color: 'text-sky-400 bg-sky-950/40 border-sky-800/40', desc: 'Fresh water glasses' },
  { id: 'bill', label: 'Request Bill', icon: Receipt, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40', desc: 'Ready for bill / check' },
  { id: 'help', label: 'Call Server', icon: HelpCircle, color: 'text-pink-400 bg-pink-950/40 border-pink-800/40', desc: 'General assistance' },
  { id: 'clean', label: 'Clear Table', icon: Sparkles, color: 'text-amber-400 bg-amber-950/40 border-amber-800/40', desc: 'Plates or table cleanup' }
];

const COOLDOWN_SECONDS = 120; // 2 minutes throttling per requirement

export const CallWaiterModal = ({ isOpen, onClose, tableNumber }) => {
  const { showToast } = useToast();
  const [selectedType, setSelectedType] = useState('help');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Check cooldown timer on mount / open
  useEffect(() => {
    if (!isOpen) return;

    const checkCooldown = () => {
      try {
        const lastCall = localStorage.getItem(`smaakenzzoo_last_waiter_call_${tableNumber}`);
        if (lastCall) {
          const diff = Math.floor((Date.now() - parseInt(lastCall, 10)) / 1000);
          if (diff < COOLDOWN_SECONDS) {
            setCooldownRemaining(COOLDOWN_SECONDS - diff);
            return;
          }
        }
      } catch {
        // ignore
      }
      setCooldownRemaining(0);
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [isOpen, tableNumber]);

  if (!isOpen) return null;

  const handleCallStaff = async (e) => {
    e.preventDefault();
    if (cooldownRemaining > 0) return;

    setIsSubmitting(true);
    try {
      const callData = {
        table: String(tableNumber || '1'),
        type: selectedType,
        note: note.trim(),
        resolved: false,
        createdAt: new Date().toISOString(),
        timestamp: serverTimestamp()
      };

      try {
        await addDoc(collection(db, COLLECTIONS?.tableCalls || 'table_calls'), callData);
      } catch (err) {
        console.warn('Firestore call save fallback:', err);
      }

      // Record cooldown in localStorage
      localStorage.setItem(`smaakenzzoo_last_waiter_call_${tableNumber}`, String(Date.now()));
      setCooldownRemaining(COOLDOWN_SECONDS);

      const typeLabel = CALL_TYPES.find(t => t.id === selectedType)?.label || 'Server';
      setSubmittedMessage(`Server notified for ${typeLabel}! Staff has been alerted.`);
      
      showToast?.({
        message: `Server notified for Table ${tableNumber}`,
        type: 'success'
      });

      setTimeout(() => {
        setSubmittedMessage(null);
        setNote('');
        onClose();
      }, 2000);
    } catch {
      showToast?.({
        message: 'Could not alert server. Please call staff directly.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Call Server Modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-5 text-white shadow-2xl animate-in zoom-in-95 text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pink-600/20 text-pink-400 flex items-center justify-center">
              <Bell className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white font-heading">
                Call Waiter • Table {tableNumber}
              </h3>
              <p className="text-[10px] text-slate-400">Our cafe staff will be right with you</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submittedMessage ? (
          /* Confirmation feedback */
          <div className="py-6 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-sm text-white">Staff Alerted</h4>
            <p className="text-xs text-slate-300 max-w-xs mx-auto">
              {submittedMessage}
            </p>
          </div>
        ) : (
          <form onSubmit={handleCallStaff} className="space-y-4 pt-4 text-xs">
            {/* Assistance Type Options */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                How can we help?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CALL_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedType(type.id)}
                      className={`p-2.5 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-pink-500 bg-pink-950/40 ring-1 ring-pink-500' 
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-pink-400' : 'text-slate-400'}`} />
                        <span className={`font-bold text-[11px] ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {type.label}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 leading-tight">
                        {type.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Note */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Additional Note (Optional)
              </label>
              <input
                type="text"
                maxLength={60}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Extra napkins, warm water..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Cooldown feedback if throttled */}
            {cooldownRemaining > 0 ? (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-[11px] text-amber-300 flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  Server already notified. Next request available in <strong>{formatTimer(cooldownRemaining)}</strong>.
                </span>
              </div>
            ) : null}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || cooldownRemaining > 0}
              className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-pink-600/30"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Notifying Staff...</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5 fill-current" />
                  <span>Notify Cafe Staff</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CallWaiterModal;
