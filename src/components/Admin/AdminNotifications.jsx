import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppContext } from '../../context/AppContext';
import { db, COLLECTIONS } from '../../firebase';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  limit,
  where,
  Timestamp,
} from 'firebase/firestore';
import { formatCurrency } from '../../utils/helpers';
import {
  Power,
  Clock,
  Edit3,
  Save,
  X,
  Bell,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  Info,
  RefreshCw,
  BellRing,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const toDate = (val) => {
  if (!val) return null;
  if (val?.toDate) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'number') return new Date(val);
  if (typeof val === 'string') return new Date(val);
  return null;
};

const timeAgo = (date) => {
  if (!date) return '';
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const fmt24to12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 — Business Hours & Status Override
// ─────────────────────────────────────────────────────────────────────────────

const BusinessHoursSection = () => {
  const { settings, updateSettings } = useContext(AppContext);

  const [editingHours, setEditingHours] = useState(false);
  const [openTime,    setOpenTime]    = useState(settings.openTime            || '11:00');
  const [closeTime,   setCloseTime]   = useState(settings.closeTime           || '23:00');
  const [closedText,  setClosedText]  = useState(settings.closedStatusText    || 'Currently Closed');

  // Track which field is actively saving so buttons show spinners independently
  const [saving,        setSaving]        = useState(false);
  const [savingMsg,     setSavingMsg]     = useState(false);
  const [feedback,      setFeedback]      = useState(null); // 'ok' | 'err'

  // Keep local inputs in sync when Firestore pushes new settings
  useEffect(() => {
    setOpenTime(settings.openTime         || '11:00');
    setCloseTime(settings.closeTime       || '23:00');
    setClosedText(settings.closedStatusText || 'Currently Closed');
  }, [settings.openTime, settings.closeTime, settings.closedStatusText]);

  const flash = useCallback((type) => {
    setFeedback(type);
    setTimeout(() => setFeedback(null), 2500);
  }, []);

  // Toggle open/closed immediately
  const handleToggle = useCallback(async (value) => {
    setSaving(true);
    try {
      await updateSettings({ isOpen: value });
      flash('ok');
    } catch (err) {
      console.error('[AdminNotifications] toggle failed:', err);
      flash('err');
    } finally {
      setSaving(false);
    }
  }, [updateSettings, flash]);

  // Save the closure message only
  const handleSaveMsg = useCallback(async () => {
    setSavingMsg(true);
    try {
      await updateSettings({ closedStatusText: closedText });
      flash('ok');
    } catch (err) {
      console.error('[AdminNotifications] save message failed:', err);
      flash('err');
    } finally {
      setSavingMsg(false);
    }
  }, [updateSettings, closedText, flash]);

  // Save operating hours
  const handleSaveHours = useCallback(async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        openTime,
        closeTime,
        openingHours: `${fmt24to12(openTime)} – ${fmt24to12(closeTime)} daily`,
      });
      flash('ok');
      setEditingHours(false);
    } catch (err) {
      console.error('[AdminNotifications] save hours failed:', err);
      flash('err');
    } finally {
      setSaving(false);
    }
  }, [updateSettings, openTime, closeTime, flash]);

  const isOpen = settings.isOpen;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-pink-500 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Power size={20} className="text-white/80" />
          <div>
            <h2 className="text-white font-black text-base uppercase tracking-widest">
              Business Status
            </h2>
            <p className="text-pink-100 text-xs font-medium mt-0.5">
              Override open/close &amp; manage operating hours
            </p>
          </div>
        </div>
        {feedback && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
            feedback === 'ok' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {feedback === 'ok' ? <Check size={13} /> : <AlertCircle size={13} />}
            {feedback === 'ok' ? 'Saved!' : 'Error saving'}
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">

        {/* 1. Status indicator row */}
        <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100">
          <div className="flex items-center gap-4">
            <span className={`w-5 h-5 rounded-full flex-shrink-0 shadow-sm transition-colors ${
              isOpen ? 'bg-green-400 animate-pulse' : 'bg-gray-300'
            }`} />
            <div>
              <p className="font-black text-gray-900 text-sm">
                Restaurant is currently {isOpen ? 'OPEN' : 'CLOSED'}
              </p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                {isOpen
                  ? 'Customers can browse and place orders'
                  : 'Menu is visible but ordering is paused'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleToggle(!isOpen)}
            aria-label="Toggle restaurant status"
            className={`relative w-16 h-8 rounded-full transition-all duration-300 flex-shrink-0 cursor-pointer ${
              isOpen ? 'bg-green-500' : 'bg-gray-300'
            } ${saving ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
          >
            <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${
              isOpen ? 'right-1' : 'left-1'
            }`} />
          </button>
        </div>

        {/* 2. Quick action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={saving || !isOpen}
            onClick={() => handleToggle(false)}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all cursor-pointer bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Power size={15} />}
            Close Now
          </button>
          <button
            type="button"
            disabled={saving || isOpen}
            onClick={() => handleToggle(true)}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all cursor-pointer bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Open Now
          </button>
        </div>

        {/* 3. Closure message */}
        <div className="space-y-2">
          <label className="text-xs font-black text-pink-900 uppercase tracking-wider flex items-center gap-2">
            <AlertCircle size={13} /> Holiday / Closure Message
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={closedText}
              onChange={(e) => setClosedText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveMsg()}
              placeholder="e.g. Closed for Diwali — Back on 25th!"
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all"
            />
            <button
              type="button"
              disabled={savingMsg}
              onClick={handleSaveMsg}
              className="px-4 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {savingMsg ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 font-medium">
            Shown on the storefront banner when the restaurant is closed. Press Enter or click Save.
          </p>
        </div>

        {/* 4. Operating hours display */}
        <div className="p-4 bg-pink-50/60 rounded-xl border border-pink-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-pink-500" />
            <div>
              <p className="text-xs font-black text-pink-900 uppercase tracking-wider">Operating Hours</p>
              <p className="text-sm font-bold text-gray-700 mt-0.5">
                {fmt24to12(settings.openTime || '11:00')}
                <span className="mx-2 text-gray-300">→</span>
                {fmt24to12(settings.closeTime || '23:00')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditingHours((p) => !p)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black text-pink-600 hover:bg-pink-100 transition-colors cursor-pointer"
          >
            <Edit3 size={13} /> {editingHours ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {/* 5. Edit hours form */}
        {editingHours && (
          <form
            onSubmit={handleSaveHours}
            className="space-y-4 p-5 bg-white rounded-xl border border-pink-200 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <h4 className="text-xs font-black text-pink-900 uppercase tracking-wider flex items-center gap-2">
              <Edit3 size={13} /> Edit Operating Hours
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider">Opening Time</label>
                <input
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-pink-400"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider">Closing Time</label>
                <input
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-pink-400"
                  required
                />
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                The system auto-reads these times to determine live open/closed status.
                Customers see the restaurant as closed outside these hours unless you manually override above.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all disabled:opacity-60 cursor-pointer"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save Hours
              </button>
              <button
                type="button"
                onClick={() => setEditingHours(false)}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-sm transition-all cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Section 2 — Notification Feed
// ─────────────────────────────────────────────────────────────────────────────

const buildOrderNotifications = (doc) => {
  const data = doc.data();
  const id   = doc.id;
  const ts   = toDate(data.createdAt || data.timestamp);
  const notes = [];

  notes.push({
    id: `order-new-${id}`,
    type: 'new_order',
    orderId: id,
    tableNumber: data.tableNumber,
    total: data.grandTotal ?? data.total ?? 0,
    timestamp: ts,
    rawTs: ts?.getTime() ?? 0,
  });

  if (data.status && !['pending', 'confirmed', 'Pending', 'Confirmed'].includes(data.status)) {
    const updatedAt = toDate(data.updatedAt) || ts;
    notes.push({
      id: `order-status-${id}-${data.status}`,
      type: 'order_status',
      orderId: id,
      status: data.status,
      timestamp: updatedAt,
      rawTs: updatedAt?.getTime() ?? 0,
    });
  }
  return notes;
};

const buildCallNotification = (doc) => {
  const data = doc.data();
  const id   = doc.id;
  const ts   = toDate(data.calledAt || data.createdAt || data.timestamp);
  const notes = [{
    id: `call-${id}`,
    type: 'waiter_call',
    callId: id,
    tableNumber: data.tableNumber,
    timestamp: ts,
    rawTs: ts?.getTime() ?? 0,
  }];

  if (data.resolved || data.status === 'resolved') {
    const resolvedAt = toDate(data.resolvedAt) || ts;
    notes.push({
      id: `call-resolved-${id}`,
      type: 'waiter_resolved',
      callId: id,
      tableNumber: data.tableNumber,
      timestamp: resolvedAt,
      rawTs: resolvedAt?.getTime() ?? 0,
    });
  }
  return notes;
};

const TYPE_META = {
  new_order:      { emoji: '🍽️', dot: 'bg-pink-500',  bg: 'bg-pink-50',  border: 'border-pink-100',  labelFn: (n) => `New order received — Table ${n.tableNumber ?? '?'} — ${formatCurrency(n.total)}` },
  order_status:   { emoji: '✅', dot: 'bg-green-500', bg: 'bg-green-50', border: 'border-green-100', labelFn: (n) => `Order #${String(n.orderId).slice(-6)} marked as ${n.status}` },
  waiter_call:    { emoji: '🔔', dot: 'bg-amber-400', bg: 'bg-amber-50', border: 'border-amber-100', labelFn: (n) => `Table ${n.tableNumber ?? '?'} called for a waiter` },
  waiter_resolved:{ emoji: '✓',  dot: 'bg-gray-300',  bg: 'bg-gray-50',  border: 'border-gray-100',  labelFn: (n) => `Table ${n.tableNumber ?? '?'} waiter call resolved` },
};

const EmptyFeed = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center select-none">
    <svg className="w-24 h-24 mb-4 opacity-25" viewBox="0 0 120 120" fill="none">
      <ellipse cx="60" cy="52" rx="28" ry="26" fill="#db2777" />
      <path d="M32 74 Q60 87 88 74 L84 54 Q60 70 36 54Z" fill="#db2777" fillOpacity="0.6" />
      <circle cx="60" cy="28" r="5" fill="#db2777" />
      <circle cx="60" cy="86" r="7" fill="#db2777" fillOpacity="0.7" />
      <text x="76" y="38" fontSize="14" fill="#db2777" fontWeight="bold">z</text>
      <text x="84" y="26" fontSize="11" fill="#db2777" fontWeight="bold">z</text>
    </svg>
    <p className="font-black text-gray-300 text-sm uppercase tracking-widest">All quiet!</p>
    <p className="text-gray-300 text-xs mt-1 font-medium">No events in the last 24 hours</p>
  </div>
);

const NotificationFeed = () => {
  const [notifications, setNotifications] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('admin_dismissed_notifs') || '[]')); }
    catch { return new Set(); }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try { localStorage.setItem('admin_dismissed_notifs', JSON.stringify([...dismissed])); }
    catch { /* ignore */ }
  }, [dismissed]);

  useEffect(() => {
    const yesterday = Timestamp.fromDate(new Date(Date.now() - 24 * 3_600_000));
    let orderNotes = [], callNotes = [], ordersLoaded = false, callsLoaded = false;

    const merge = () => {
      if (!ordersLoaded || !callsLoaded) return;
      setNotifications([...orderNotes, ...callNotes].sort((a, b) => b.rawTs - a.rawTs));
      setLoading(false);
    };

    const ordersQ = query(
      collection(db, COLLECTIONS.orders),
      where('createdAt', '>=', yesterday),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const callsQ = query(
      collection(db, COLLECTIONS.tableCalls),
      where('calledAt', '>=', yesterday),
      orderBy('calledAt', 'desc'),
      limit(50)
    );

    const unsubOrders = onSnapshot(ordersQ,
      (snap) => { orderNotes = snap.docs.flatMap(buildOrderNotifications); ordersLoaded = true; merge(); },
      (err)  => { console.error('[Feed] orders:', err); ordersLoaded = true; merge(); }
    );
    const unsubCalls = onSnapshot(callsQ,
      (snap) => { callNotes = snap.docs.flatMap(buildCallNotification); callsLoaded = true; merge(); },
      (err)  => { console.error('[Feed] calls:', err); callsLoaded = true; merge(); }
    );

    return () => { unsubOrders(); unsubCalls(); };
  }, []);

  const dismiss  = useCallback((id) => setDismissed((p) => new Set([...p, id])), []);
  const clearAll = useCallback(() => setDismissed(new Set(notifications.map((n) => n.id))), [notifications]);

  const visible = notifications.filter((n) => !dismissed.has(n.id));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-pink-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell size={20} className="text-pink-600" />
            {visible.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-pink-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {visible.length > 99 ? '99+' : visible.length}
              </span>
            )}
          </div>
          <div>
            <h2 className="font-black text-gray-900 text-base uppercase tracking-widest">Activity Feed</h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Orders &amp; waiter calls · last 24 hours</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && <RefreshCw size={15} className="text-pink-400 animate-spin" />}
          {!loading && visible.length > 0 && (
            <button type="button" onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer">
              <Trash2 size={13} /> Clear All
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-9 h-9 bg-gray-100 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                  <div className="h-2.5 bg-gray-100 rounded-full w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyFeed />
        ) : (
          visible.map((notif) => {
            const meta = TYPE_META[notif.type];
            if (!meta) return null;
            return (
              <div key={notif.id}
                className={`flex items-start gap-3 px-5 py-4 group transition-colors hover:bg-gray-50/80 ${meta.bg}`}>
                <div className="relative flex-shrink-0 mt-0.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base border ${meta.bg} ${meta.border}`}>
                    {meta.emoji}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${meta.dot}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 leading-snug">{meta.labelFn(notif)}</p>
                  <p className="text-[11px] text-gray-400 font-medium mt-1">
                    {timeAgo(notif.timestamp)}
                    {notif.timestamp && (
                      <span className="ml-2 text-gray-300">
                        · {notif.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </p>
                </div>
                <button type="button" onClick={() => dismiss(notif.id)}
                  className="flex-shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                  <X size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {!loading && notifications.length > 0 && (
        <div className="px-6 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[11px] text-gray-400 font-medium">
            {notifications.length} event{notifications.length !== 1 ? 's' : ''} in the last 24h
            {dismissed.size > 0 && ` · ${dismissed.size} dismissed`}
          </p>
          {dismissed.size > 0 && (
            <button type="button" onClick={() => setDismissed(new Set())}
              className="text-[11px] font-black text-pink-500 hover:text-pink-700 transition-colors cursor-pointer">
              Restore dismissed
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Root export
// ─────────────────────────────────────────────────────────────────────────────

const AdminNotifications = () => (
  <div className="max-w-3xl space-y-6 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
        <BellRing size={20} className="text-pink-600" />
      </div>
      <div>
        <h1 className="text-xl font-black text-gray-900 uppercase tracking-widest">Notifications</h1>
        <p className="text-xs text-gray-400 font-medium">Business hours, status override &amp; live activity feed</p>
      </div>
    </div>
    <BusinessHoursSection />
    <NotificationFeed />
  </div>
);

export default AdminNotifications;
