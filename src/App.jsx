import React, { useContext, useEffect } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { AppProvider, AppContext } from './context/AppContext';
import { Camera, MessageCircle, Share2, Clock, MapPin } from 'lucide-react';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MenuSection from './components/MenuSection';
import OffersSection from './components/OffersSection';
import FeaturedSection from './components/FeaturedSection';
import BlossomBackground from './components/BlossomBackground';
import CartDrawer from './components/Customer/CartDrawer';

const AdminAuth = React.lazy(() => import('./components/Admin/AdminAuth'));
const AdminLogin = React.lazy(() => import('./components/Admin/AdminLogin'));
const AdminDashboard = React.lazy(() => import('./components/Admin/AdminDashboard'));

const AdminFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-pink-50/20">
    <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
  </div>
);

const AppContent = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const { settings } = useContext(AppContext);

  // Apply Settings
  useEffect(() => {
    // Meta Tags (Title, Description, Verification)
    if (settings.metaTitle) document.title = settings.metaTitle;
    
    let descMeta = document.querySelector("meta[name='description']");
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.name = 'description';
      document.head.appendChild(descMeta);
    }
    descMeta.content = settings.metaDescription || '';

    if (settings.siteVerification) {
      let verifyMeta = document.querySelector("meta[name='google-site-verification']");
      if (!verifyMeta) {
        verifyMeta = document.createElement('meta');
        verifyMeta.name = 'google-site-verification';
        document.head.appendChild(verifyMeta);
      }
      verifyMeta.content = settings.siteVerification;
    }

    // Favicon
    if (settings.favicon) {
      const link = document.querySelector("link[rel~='icon']");
      if (link) link.href = settings.favicon;
    }

    // Dynamic Color
    if (settings.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
    }
  }, [settings]);

  return (
    <div className="min-h-[100dvh] selection:bg-pink-200 flex flex-col relative">

      {/* Background blossoms (hidden on /menu for clean e-commerce feel) */}
      {!isAdminPath && location.pathname !== '/menu' && <BlossomBackground />}

      {/* Navbar (hidden in admin pages) */}
      {!isAdminPath && <Navbar />}

      <main className={`flex-grow relative z-10 ${isAdminPath ? '' : 'pt-0'}`}>
        <div key={location.key} className="page-enter">
          <Routes>

            {/* Main Pages */}
            <Route path="/" element={<><Hero /><FeaturedSection /></>} />
            <Route path="/menu" element={<MenuSection />} />
            <Route path="/offers" element={<OffersSection />} />

            {/* Admin Pages (Lazy Loaded) */}
            <Route 
              path="/admin/login" 
              element={
                <React.Suspense fallback={<AdminFallback />}>
                  <AdminLogin />
                </React.Suspense>
              } 
            />

            <Route 
              element={
                <React.Suspense fallback={<AdminFallback />}>
                  <AdminAuth />
                </React.Suspense>
              }
            >
              <Route 
                path="/admin/dashboard" 
                element={
                  <React.Suspense fallback={<AdminFallback />}>
                    <AdminDashboard />
                  </React.Suspense>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <React.Suspense fallback={<AdminFallback />}>
                    <AdminDashboard />
                  </React.Suspense>
                } 
              />
            </Route>

          </Routes>
        </div>
      </main>

      {/* Interactive Cart Drawer for Customers */}
      {!isAdminPath && <CartDrawer />}

      {/* Floating WhatsApp Button */}
      {settings.whatsapp && !isAdminPath && (
        <a 
          href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-8 right-8 z-[45] px-6 py-4 bg-[#25D366] text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 group flex items-center gap-3 active:scale-95"
          aria-label="Order on WhatsApp"
        >
          <MessageCircle size={28} className="relative z-10 fill-current" />
          <span className="font-black uppercase tracking-widest text-[11px] relative z-10 whitespace-nowrap">
            Order Now
          </span>
          {/* Pulse Effect */}
          <div className="absolute inset-0 rounded-full animate-ping bg-[#25D366]/40 -z-10"></div>
        </a>
      )}

      {/* Footer (hidden in admin pages) */}
      {!isAdminPath && (
        <footer className="relative z-10 bg-pink-900/80 backdrop-blur-sm py-16 border-t border-pink-700/40 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h3 
              className="font-black mb-2 uppercase tracking-tighter"
              style={{ color: settings.restaurantNameColor ?? '#ffffff', fontSize: `${settings.restaurantNameSize ?? 30}px` }}
            >
              {settings.restaurantName}
            </h3>
            <p 
              className="font-medium italic mb-8"
              style={{ color: settings.taglineColor ?? '#fbcfe8', fontSize: `${settings.taglineSize ?? 16}px` }}
            >
              {settings.tagline || 'Handcrafted with love. 🌸'}
            </p>
            <div className="flex flex-col items-center gap-4 mb-10">
              {settings.openingHours && (
                <div 
                  className="flex items-center gap-2 font-bold opacity-80"
                  style={{ color: settings.openingHoursColor ?? '#fbcfe8', fontSize: `${settings.openingHoursSize ?? 14}px` }}
                >
                  <Clock size={16} /> {settings.openingHours}
                </div>
              )}
              {settings.address && (
                <a 
                  href={settings.mapsUrl || '#'} 
                  target={settings.mapsUrl ? "_blank" : "_self"}
                  rel="noreferrer"
                  className={`flex items-center gap-2 font-medium opacity-80 max-w-md mx-auto ${settings.mapsUrl ? 'hover:opacity-100 hover:scale-105 transition-all cursor-pointer' : ''}`}
                  style={{ color: settings.addressColor ?? '#fbcfe8', fontSize: `${settings.addressSize ?? 14}px` }}
                  onClick={(e) => {
                    if (!settings.mapsUrl) e.preventDefault();
                  }}
                >
                  <MapPin size={16} className="flex-shrink-0" /> {settings.address}
                </a>
              )}
            </div>

            <div className="flex justify-center gap-6 mb-10">
              {settings.instagram && (
                <a 
                  href={settings.instagram.startsWith('http') ? settings.instagram : `https://instagram.com/${settings.instagram}`} 
                  target="_blank" rel="noreferrer" 
                  className="p-3 bg-white/10 rounded-full text-white hover:bg-pink-600 transition-all hover:scale-110"
                >
                  <Camera size={24} />
                </a>
              )}
              {settings.facebook && (
                <a 
                  href={settings.facebook.startsWith('http') ? settings.facebook : `https://facebook.com/${settings.facebook}`} 
                  target="_blank" rel="noreferrer" 
                  className="p-3 bg-white/10 rounded-full text-white hover:bg-pink-600 transition-all hover:scale-110"
                >
                  <MessageCircle size={24} />
                </a>
              )}
              {settings.twitter && (
                <a 
                  href={settings.twitter.startsWith('http') ? settings.twitter : `https://x.com/${settings.twitter}`} 
                  target="_blank" rel="noreferrer" 
                  className="p-3 bg-white/10 rounded-full text-white hover:bg-pink-600 transition-all hover:scale-110"
                >
                  <Share2 size={24} />
                </a>
              )}
            </div>

            <div className="flex justify-center flex-wrap gap-8 border-t border-pink-700/30 pt-8">
              <Link 
                to="/" 
                className="font-bold hover:text-white transition-colors"
                style={{ color: settings.navHomeLabelColor, fontSize: `${settings.navHomeLabelSize ?? 12}px` }}
              >
                {settings.navHomeLabel ?? 'Home'}
              </Link>
              <Link 
                to="/menu" 
                className="font-bold hover:text-white transition-colors"
                style={{ color: settings.navMenuLabelColor, fontSize: `${settings.navMenuLabelSize ?? 12}px` }}
              >
                {settings.navMenuLabel ?? 'Menu'}
              </Link>
              <Link 
                to="/offers" 
                className="font-bold hover:text-white transition-colors"
                style={{ color: settings.navOffersLabelColor, fontSize: `${settings.navOffersLabelSize ?? 12}px` }}
              >
                {settings.navOffersLabel ?? 'Offers'}
              </Link>
            </div>
            
            <p 
              className="font-black uppercase tracking-widest mt-12 opacity-50"
              style={{ color: settings.copyrightTextColor ?? '#be185d', fontSize: `${settings.copyrightTextSize ?? 10}px` }}
            >
              {settings.copyrightText || `© ${new Date().getFullYear()} ${settings.restaurantName}. All rights reserved.`}
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;