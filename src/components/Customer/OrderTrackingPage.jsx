import React, { useState, useEffect, useMemo, useContext, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  Flame, 
  Utensils, 
  ShoppingBag, 
  Bike, 
  MessageCircle, 
  Phone, 
  ArrowRight, 
  Search, 
  AlertCircle, 
  RefreshCw, 
  Sparkles,
  ChevronRight,
  Receipt,
  MapPin,
  ExternalLink,
  Volume2,
  VolumeX
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/helpers';
import { soundManager } from '../../utils/sound';
import { DietaryMarker } from '../ui';
import { db, COLLECTIONS } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const ORDER_STEPS = [
  { id: 'Received', label: 'Order Received', desc: 'Sent to cafe kitchen' },
  { id: 'Preparing', label: 'Freshly Preparing', desc: 'Chefs are baking & crafting' },
  { id: 'Ready', label: 'Ready to Serve', desc: 'Plated warm & delicious' },
  { id: 'Served', label: 'Served / Dispatched', desc: 'Brought to table or dispatched' },
  { id: 'Completed', label: 'Completed', desc: 'Order settled' }
];

export const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { settings } = useContext(AppContext);

  const [searchInput, setSearchInput] = useState(orderId || '');
  const [activeOrder, setActiveOrder] = useState(() => {
    if (!orderId) return null;
    try {
      const cleanId = orderId.trim().toUpperCase();
      const localOrders = JSON.parse(localStorage.getItem('smaakenzzoo_recent_orders') || '[]');
      return localOrders.find(o => 
        String(o.orderId).toUpperCase() === cleanId || 
        String(o.id).toUpperCase() === cleanId
      ) || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => Boolean(orderId));
  const [recentOrders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('smaakenzzoo_recent_orders') || '[]');
    } catch {
      return [];
    }
  });
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [liveError, setLiveError] = useState(null);
  const [isMuted, setIsMuted] = useState(() => soundManager.isMuted);
  const lastStatusRef = useRef(null);

  // Sync state during render when orderId changes
  const [currentId, setCurrentId] = useState(orderId);
  if (orderId !== currentId) {
    setCurrentId(orderId);
    setLoading(Boolean(orderId));
    setLiveError(null);
    if (!orderId) {
      setActiveOrder(null);
    } else {
      try {
        const cleanId = orderId.trim().toUpperCase();
        const localOrders = JSON.parse(localStorage.getItem('smaakenzzoo_recent_orders') || '[]');
        const match = localOrders.find(o => 
          String(o.orderId).toUpperCase() === cleanId || 
          String(o.id).toUpperCase() === cleanId
        ) || null;
        setActiveOrder(match);
      } catch {
        setActiveOrder(null);
      }
    }
  }

  // Real-time Firestore Listener with fallback
  useEffect(() => {
    if (!orderId) {
      lastStatusRef.current = null;
      return;
    }

    const cleanId = orderId.trim().toUpperCase();

    // Attach initial status for reference
    try {
      const localOrders = JSON.parse(localStorage.getItem('smaakenzzoo_recent_orders') || '[]');
      const localMatch = localOrders.find(o => 
        String(o.orderId).toUpperCase() === cleanId || 
        String(o.id).toUpperCase() === cleanId
      );
      if (localMatch) {
        lastStatusRef.current = localMatch.status;
      }
    } catch {
      // ignore
    }

    // 2. Attach live Firestore listener
    let unsubscribe = () => {};
    try {
      const ordersRef = collection(db, COLLECTIONS?.orders || 'orders');
      const q = query(ordersRef, where('orderId', '==', cleanId));

      unsubscribe = onSnapshot(q, (snapshot) => {
        setLoading(false);
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          const nextOrder = { id: snapshot.docs[0].id, ...docData };
          if (lastStatusRef.current && lastStatusRef.current !== nextOrder.status) {
            soundManager.playOrderStatusUpdate();
          }
          lastStatusRef.current = nextOrder.status;
          setActiveOrder(nextOrder);
        } else {
          // If not in firestore, keep localMatch if present
          setActiveOrder(prev => prev || null);
        }
      }, (err) => {
        console.warn('Live order listener fallback:', err);
        setLiveError('Live sync offline; showing cached order status');
        setLoading(false);
      });
    } catch (err) {
      console.warn('Firestore query error:', err);
      setLoading(false);
    }

    return () => unsubscribe();
  }, [orderId]);

  // Live Preparation Countdown Timer calculation
  useEffect(() => {
    if (!activeOrder) return;

    // Determine total prep minutes from items or default 18
    const items = activeOrder.items || [];
    const maxPrepMinutes = items.length > 0 
      ? Math.max(...items.map(i => Number(i.prepMinutes) || 15))
      : 18;

    const createdAtMs = activeOrder.createdAt 
      ? new Date(activeOrder.createdAt).getTime() 
      : Date.now();

    const calculateRemaining = () => {
      const elapsedSeconds = Math.floor((Date.now() - createdAtMs) / 1000);
      const totalSeconds = maxPrepMinutes * 60;
      const left = totalSeconds - elapsedSeconds;
      setRemainingSeconds(left > 0 ? left : 0);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [activeOrder]);

  // Handle Search Submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    navigate(`/track/${searchInput.trim().toUpperCase()}`);
  };

  // Compute status step index
  const currentStepIndex = useMemo(() => {
    if (!activeOrder) return 0;
    const status = activeOrder.status || 'Received';
    if (status === 'Received') return 0;
    if (status === 'Preparing') return 1;
    if (status === 'Ready') return 2;
    if (status === 'Served' || status === 'Out for Delivery' || status === 'Dispatched') return 3;
    if (status === 'Completed' || status === 'Delivered') return 4;
    return 0;
  }, [activeOrder]);

  const formatTimer = (seconds) => {
    if (seconds === null || seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const cleanPhone = (settings.whatsapp || '').replace(/\D/g, '');
  const helpWhatsAppUrl = activeOrder 
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi Smaakenzzoo, I need assistance with my order #${activeOrder.orderId}`)}`
    : `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hi Smaakenzzoo, I have a question about my cafe order')}`;

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100 py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Top Header / Search */}
        <div className="bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-pink-400 uppercase tracking-wider block">
                Live Kitchen Dispatch
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white font-heading tracking-tight">
                Track Your Order
              </h1>
            </div>

            {/* Direct Menu CTA */}
            <Link
              to="/menu"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors"
            >
              <span>Browse Menu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Enter Order ID (e.g. SMK-123456)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-xs font-mono focus:outline-none focus:border-pink-500"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-pink-600/30"
            >
              Track
            </button>
          </form>

          {liveError && (
            <p className="text-[11px] text-amber-400 font-semibold">{liveError}</p>
          )}
        </div>

        {/* Order Tracking Body */}
        {loading ? (
          <div className="bg-slate-900/80 rounded-3xl p-12 border border-slate-800 text-center space-y-3 animate-pulse">
            <RefreshCw className="w-8 h-8 mx-auto text-pink-500 animate-spin" />
            <p className="text-sm font-bold text-slate-300">Fetching order details...</p>
          </div>
        ) : activeOrder ? (
          <div className="space-y-6">

            {/* Status Card & Stepper */}
            <div className="bg-slate-900/90 rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-xl space-y-6 animate-in fade-in">
              {/* Order Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white font-mono">
                      #{activeOrder.orderId}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-950 text-pink-300 border border-pink-800/40">
                      {activeOrder.orderType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Placed at {activeOrder.createdAt ? new Date(activeOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {activeOrder.tableNumber && (
                    <div className="px-3.5 py-1.5 rounded-2xl bg-pink-600/20 border border-pink-500/30 text-pink-300 text-xs font-bold flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5" />
                      <span>Table {activeOrder.tableNumber}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      soundManager.unlock();
                      const nextMute = soundManager.toggleMute();
                      setIsMuted(nextMute);
                    }}
                    className={`px-3 py-1.5 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      !isMuted
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                    title={isMuted ? "Audio muted (Click to enable audio alerts)" : "Audio alerts active (Click to mute)"}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />}
                    <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Audio Alerts'}</span>
                  </button>
                </div>
              </div>

              {/* ETA Countdown Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-slate-900 border border-pink-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-600/20 border border-pink-500/40 flex items-center justify-center text-pink-400 shrink-0">
                    <Flame className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white font-heading">
                      {currentStepIndex >= 2 ? 'Ready for You! 🌸' : 'Freshly Cooking in Kitchen'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {currentStepIndex >= 2 
                        ? 'Food is prepared & ready at the counter or table.'
                        : 'Chefs are carefully crafting your artisanal items.'}
                    </p>
                  </div>
                </div>

                {currentStepIndex < 2 && remainingSeconds !== null && (
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Estimated Cooking Time
                    </span>
                    <span className="text-2xl font-black text-pink-400 font-mono tracking-tight">
                      {formatTimer(remainingSeconds)}
                    </span>
                  </div>
                )}
              </div>

              {/* Visual Status Stepper */}
              <div className="py-2">
                <div className="relative flex items-center justify-between">
                  {/* Progress Line */}
                  <div className="absolute left-4 right-4 top-4 h-1 bg-slate-800 -z-0">
                    <div 
                      className="h-full bg-pink-500 transition-all duration-500"
                      style={{ width: `${(currentStepIndex / (ORDER_STEPS.length - 1)) * 100}%` }}
                    />
                  </div>

                  {ORDER_STEPS.map((step, idx) => {
                    const isDone = idx < currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    return (
                      <div key={step.id} className="relative z-10 flex flex-col items-center text-center">
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isDone 
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' 
                              : isCurrent 
                              ? 'bg-pink-600 text-white ring-4 ring-pink-500/30 animate-pulse' 
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span className={`text-[11px] font-bold mt-2 max-w-[70px] sm:max-w-none leading-tight ${
                          isCurrent ? 'text-pink-400 font-black' : isDone ? 'text-slate-200' : 'text-slate-500'
                        }`}>
                          {step.label}
                        </span>
                        <span className="text-[9px] text-slate-500 hidden sm:block mt-0.5">
                          {step.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Items & Bill Breakdown */}
            <div className="bg-slate-900/90 rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-xl space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Ordered Items ({activeOrder.itemCount || activeOrder.items?.length || 0})
              </h3>

              <div className="divide-y divide-slate-800/80">
                {Array.isArray(activeOrder.items) && activeOrder.items.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5">
                        <DietaryMarker type={item.veg || 'veg'} size={14} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white leading-snug">
                          {item.quantity}x {item.name}
                        </h4>
                        {item.selectedVariant && (
                          <span className="text-[10px] text-pink-300 font-semibold block mt-0.5">
                            Size: {item.selectedVariant.title || item.selectedVariant.name}
                          </span>
                        )}
                        {Array.isArray(item.selectedAddOns) && item.selectedAddOns.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.selectedAddOns.map((addon, aIdx) => (
                              <span key={aIdx} className="text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                + {addon.name}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.specialInstructions && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5">
                            Note: "{item.specialInstructions}"
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-white font-mono shrink-0">
                      {formatCurrency(item.lineTotal || (item.unitPrice * item.quantity), settings?.currencySymbol || '₹')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bill Details */}
              <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Item Total:</span>
                  <span className="text-white font-mono">{formatCurrency(activeOrder.itemTotal, settings?.currencySymbol || '₹')}</span>
                </div>
                {activeOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Coupon Savings ({activeOrder.discountCode}):</span>
                    <span className="font-bold font-mono">-{formatCurrency(activeOrder.discount, settings?.currencySymbol || '₹')}</span>
                  </div>
                )}
                {activeOrder.packingCharge > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Packaging Charge:</span>
                    <span className="text-white font-mono">+{formatCurrency(activeOrder.packingCharge, settings?.currencySymbol || '₹')}</span>
                  </div>
                )}
                {activeOrder.deliveryFee > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Delivery Fee:</span>
                    <span className="text-white font-mono">+{formatCurrency(activeOrder.deliveryFee, settings?.currencySymbol || '₹')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>GST (5%):</span>
                  <span>{formatCurrency(activeOrder.gst, settings?.currencySymbol || '₹')}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-black text-white">
                  <span>Grand Total:</span>
                  <span className="text-pink-400 font-mono text-base">
                    {formatCurrency(activeOrder.grandTotal, settings?.currencySymbol || '₹')}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <span>Payment Method:</span>
                  <span className="font-bold text-slate-300">{activeOrder.paymentStatus}</span>
                </div>
              </div>
            </div>

            {/* Assistance Section */}
            <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-left w-full sm:w-auto">
                <h4 className="font-bold text-white">Need help with this order?</h4>
                <p className="text-slate-400 text-[11px]">Reach our cafe counter directly on WhatsApp or Call</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={helpWhatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#25D366] hover:bg-[#1fb355] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Help</span>
                </a>
                {settings.phone && (
                  <a
                    href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}
                    className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-pink-400 border border-slate-700 transition-all"
                    title="Call Cafe"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

          </div>
        ) : (
          /* Empty / Search Fallback */
          <div className="space-y-6">
            <div className="bg-slate-900/80 rounded-3xl p-8 border border-slate-800 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-pink-600/20 text-pink-400 flex items-center justify-center mx-auto border border-pink-500/30">
                <Receipt className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">No Order Selected</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Enter your 6-digit order ID above or select from your recent orders below to view live kitchen cooking progress.
              </p>
            </div>

            {/* Recent Orders List */}
            {recentOrders.length > 0 && (
              <div className="bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recent Orders on this Device
                </h3>

                <div className="space-y-2.5">
                  {recentOrders.map((ro) => (
                    <div 
                      key={ro.orderId}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-pink-500/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-xs">
                            #{ro.orderId}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-800 text-pink-300">
                            {ro.status || 'Received'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {ro.itemCount || ro.items?.length || 1} items • {formatCurrency(ro.grandTotal, settings?.currencySymbol || '₹')}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(`/track/${ro.orderId}`)}
                        className="px-3.5 py-1.5 rounded-xl bg-pink-600/20 hover:bg-pink-600 text-pink-300 hover:text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <span>Track</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default OrderTrackingPage;
