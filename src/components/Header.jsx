import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Coffee, 
  ShoppingBag, 
  User, 
  Clock, 
  Sun, 
  Moon, 
  Search, 
  MapPin, 
  Phone, 
  X,
  Compass,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { getKolkataStatus } from '../utils/operatingHours';
import { useScrollDirection } from '../hooks/useScrollDirection';

export const Header = () => {
  const { settings, cartItemCount, setIsCartOpen, offers } = useContext(AppContext);
  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const { scrollDirection } = useScrollDirection();

  // Status calculation for Asia/Kolkata
  const [liveStatus, setLiveStatus] = useState(() => getKolkataStatus(settings));
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [orderIdInput, setOrderIdInput] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);

  // Update status every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveStatus(getKolkataStatus(settings));
    }, 60000);
    return () => clearInterval(timer);
  }, [settings]);

  // Check if active offers exist
  const hasActiveOffers = Array.isArray(offers) && offers.some(o => o.isActive !== false);

  const navLinks = [
    { to: '/menu', label: 'Menu' },
    ...(hasActiveOffers ? [{ to: '/offers', label: 'Offers' }] : []),
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!orderIdInput.trim()) return;
    const cleanId = orderIdInput.trim().toUpperCase();
    
    // Check localStorage for past orders or recent orders
    let foundOrder = null;
    try {
      const orders = JSON.parse(localStorage.getItem('smaakenzzoo_recent_orders') || '[]');
      foundOrder = orders.find(o => String(o.id).toUpperCase().includes(cleanId) || String(o.orderId).toUpperCase().includes(cleanId));
    } catch {
      foundOrder = null;
    }

    if (foundOrder) {
      setTrackingResult({
        found: true,
        id: foundOrder.orderId || foundOrder.id,
        status: foundOrder.status || 'Received',
        estimatedMinutes: foundOrder.estimatedMinutes || 20,
        itemsCount: foundOrder.items?.length || 1,
        time: foundOrder.createdAt ? new Date(foundOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
      });
    } else {
      setTrackingResult({
        found: false,
        id: cleanId,
        message: 'No live order matching this ID yet. For live assistance, tap our WhatsApp support button.'
      });
    }
  };

  return (
    <>
      {/* Sticky, 100% OPAQUE Header (Zero text bleed-through) */}
      <header className="sticky top-0 z-40 w-full bg-[#0f1117] text-white border-b border-slate-800 shadow-md select-none transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 gap-3">
            
            {/* Brand Logo & Title */}
            <Link to="/" className="flex items-center gap-3 shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded-xl p-1">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-600 to-pink-800 text-white flex items-center justify-center shadow-md shadow-pink-600/30 group-hover:scale-105 transition-transform">
                {settings.logo ? (
                  <img src={settings.logo} alt="Smaakenzzoo Logo" className="w-6 h-6 object-contain" />
                ) : (
                  <Coffee className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white group-hover:text-pink-400 transition-colors">
                  Smaakenzzoo
                </span>
                <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase leading-none">
                  Artisanal Cafe
                </span>
              </div>
            </Link>

            {/* Live Open / Closed Status Badge (Asia/Kolkata Time) */}
            <div 
              className={`hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                liveStatus.isOpen
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80'
                  : 'bg-rose-950/60 text-rose-400 border-rose-800/80'
              }`}
              title={`Asia/Kolkata: ${liveStatus.detailText}`}
            >
              <span className="relative flex h-2 w-2">
                {liveStatus.isOpen && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${liveStatus.isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              </span>
              <span>{liveStatus.statusText}</span>
              <span className="text-[10px] opacity-75 hidden md:inline">• {liveStatus.detailText}</span>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-1 rounded-full border border-slate-800 text-xs font-semibold">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-4 py-1.5 rounded-full transition-all duration-150 ${
                      isActive
                        ? 'bg-pink-600 text-white shadow-sm font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {/* Track Order Link */}
              <button
                type="button"
                onClick={() => setIsTrackModalOpen(true)}
                className="px-4 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-150 cursor-pointer"
              >
                Track Order
              </button>
            </nav>

            {/* Action Tools (Right) */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Track Order Mobile Icon */}
              <button
                type="button"
                onClick={() => setIsTrackModalOpen(true)}
                className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                title="Track Order"
                aria-label="Track Order"
              >
                <Compass className="w-5 h-5" />
              </button>

              {/* Theme Toggle (Dark / Light) */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-300" />
                )}
              </button>

              {/* Account / Login Icon */}
              <Link
                to="/account"
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                title="Customer Account"
                aria-label="Customer Account"
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Live Cart Trigger Button */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 px-3.5 py-2 bg-pink-600 hover:bg-pink-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-600/30 transition-all cursor-pointer"
                title="View Bag"
                aria-label="View Shopping Bag"
              >
                <ShoppingBag className="w-4 h-4 text-white" />
                <span className="hidden sm:inline">Bag</span>
                {cartItemCount > 0 && (
                  <span className="bg-white text-pink-600 text-[10px] font-black rounded-full px-1.5 py-0.2 shadow-sm">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar (Auto-hiding on scroll-down, returning on scroll-up) */}
        <div 
          className={`lg:hidden border-t border-slate-800 bg-[#0f1117] transition-all duration-200 overflow-hidden ${
            scrollDirection === 'down' ? 'max-h-0 py-0 opacity-0' : 'max-h-12 py-2 opacity-100'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs font-semibold overflow-x-auto no-scrollbar gap-2">
            <div className="flex items-center gap-1 shrink-0">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      isActive ? 'bg-pink-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Open/Closed Status pill */}
            <div className="sm:hidden flex items-center gap-1.5 text-[11px] font-medium text-slate-400 shrink-0">
              <span className={`inline-block w-2 h-2 rounded-full ${liveStatus.isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span>{liveStatus.statusText}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Track Order Modal */}
      {isTrackModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTrackModalOpen(false);
          }}
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white relative animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsTrackModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-pink-600/20 text-pink-400 flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Track Your Order</h3>
                <p className="text-xs text-slate-400">Enter your Table or Order Number</p>
              </div>
            </div>

            <form onSubmit={handleTrackSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="e.g. SMK-104 or Table 4"
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500 text-sm font-semibold"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-pink-600 hover:bg-pink-700 active:scale-98 text-white rounded-2xl font-bold text-sm shadow-md shadow-pink-600/30 transition-all cursor-pointer"
              >
                Track Live Status
              </button>
            </form>

            {trackingResult && (
              <div className="mt-5 p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs space-y-2 animate-in fade-in duration-150">
                {trackingResult.found ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Order Active
                      </span>
                      <span className="text-slate-400">Placed at {trackingResult.time}</span>
                    </div>
                    <p className="font-semibold text-slate-200">
                      Status: <span className="text-pink-400 font-bold">{trackingResult.status}</span>
                    </p>
                    <p className="text-slate-400">
                      Estimated Prep Time: ~{trackingResult.estimatedMinutes} mins
                    </p>
                  </>
                ) : (
                  <div className="flex items-start gap-2.5 text-slate-300">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{trackingResult.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
