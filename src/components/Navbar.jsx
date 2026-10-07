import React, { useContext } from 'react';
import { Coffee, ShieldCheck, ShoppingBag, Sun, Moon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { settings, cartItemCount, setIsCartOpen } = useContext(AppContext);
  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();

  const navLinks = [
    { to: '/', label: settings.navHomeLabel || 'Home' },
    { to: '/menu', label: settings.navMenuLabel || 'Menu' },
    { to: '/offers', label: settings.navOffersLabel || 'Offers' },
  ];

  return (
    <nav className="fixed w-full z-40 apple-header transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Brand Identity - Minimalist & Prestigious */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gray-950 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
              {settings.logo ? (
                <img src={settings.logo} alt="Logo" className="w-5 h-5 object-contain" />
              ) : (
                <Coffee className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-gray-950 group-hover:text-black transition-colors">
                {settings.restaurantName || 'Smaakenzzoo'}
              </span>
              <span className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase">
                Artisanal Cafe
              </span>
            </div>
          </Link>

          {/* Center Navigation Links - Clean Apple-style pill highlights */}
          <div className="hidden md:flex items-center gap-1 bg-gray-100/80 p-1 rounded-full border border-gray-200/60 backdrop-blur-xs">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-gray-950 shadow-xs font-bold'
                      : 'text-gray-600 hover:text-gray-950 hover:bg-white/50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Action Tools - Order Drawer & Admin Access */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Nav Links fallback */}
            <div className="flex md:hidden items-center gap-1">
              <Link 
                to="/menu" 
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                  location.pathname === '/menu' ? 'bg-gray-950 text-white' : 'text-gray-700'
                }`}
              >
                Menu
              </Link>
              <Link 
                to="/offers" 
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                  location.pathname === '/offers' ? 'bg-gray-950 text-white' : 'text-gray-700'
                }`}
              >
                Offers
              </Link>
            </div>

            {/* Theme Toggle (Dark / Light) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              {isDark ? (
                <Sun size={17} className="text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon size={17} className="text-slate-700 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Cart Trigger Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3.5 py-2 bg-gray-950 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
              title="Review Order"
            >
              <ShoppingBag size={14} className="text-gray-300" />
              <span className="hidden sm:inline">Order</span>
              {cartItemCount > 0 ? (
                <span className="bg-emerald-500 text-white text-[10px] font-black rounded-full px-1.5 py-0.2">
                  {cartItemCount}
                </span>
              ) : null}
            </button>

            {/* Admin Console Access */}
            <Link
              to="/admin/login"
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              title="Executive Admin Portal"
            >
              <ShieldCheck size={18} />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
