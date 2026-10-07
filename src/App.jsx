import React, { useContext, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider, AppContext } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';

import Header from './components/Header';
import Footer from './components/Footer';
import FloatingActions from './components/FloatingActions';
import SplashScreen from './components/SplashScreen';
import OfflineBanner from './components/OfflineBanner';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './components/NotFound';
import InfoPage from './components/InfoPage';

import Hero from './components/Hero';
import MenuSection from './components/MenuSection';
import OffersSection from './components/OffersSection';
import FeaturedSection from './components/FeaturedSection';
import BlossomBackground from './components/BlossomBackground';
import CartDrawer from './components/Customer/CartDrawer';
import StickyCartBar from './components/Customer/StickyCartBar';

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

  // Apply Settings & Meta Tags
  useEffect(() => {
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

    if (settings.favicon) {
      const link = document.querySelector("link[rel~='icon']");
      if (link) link.href = settings.favicon;
    }

    if (settings.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
    }
  }, [settings]);

  return (
    <div className="min-h-[100dvh] selection:bg-pink-500 selection:text-white flex flex-col relative bg-[#0f1117] text-slate-100">

      {/* Global First-Visit Splash Screen */}
      {!isAdminPath && <SplashScreen />}

      {/* Global Offline Network Status Banner */}
      <OfflineBanner />

      {/* Background blossoms (hidden on /menu for clean e-commerce feel) */}
      {!isAdminPath && location.pathname !== '/menu' && <BlossomBackground />}

      {/* Sticky, 100% Opaque Header (hidden in admin pages) */}
      {!isAdminPath && <Header />}

      <main className={`flex-grow relative z-10 ${isAdminPath ? '' : 'pt-0'}`}>
        <div key={location.key} className="page-enter">
          <Routes>
            {/* Main Public Pages */}
            <Route path="/" element={<><Hero /><FeaturedSection /></>} />
            <Route path="/menu" element={<MenuSection />} />
            <Route path="/offers" element={<OffersSection />} />

            {/* Informational & Legal Pages */}
            <Route path="/about" element={<InfoPage pageKey="about" />} />
            <Route path="/contact" element={<InfoPage pageKey="contact" />} />
            <Route path="/gallery" element={<InfoPage pageKey="gallery" />} />
            <Route path="/privacy" element={<InfoPage pageKey="privacy" />} />
            <Route path="/terms" element={<InfoPage pageKey="terms" />} />
            <Route path="/refunds" element={<InfoPage pageKey="refunds" />} />

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

            {/* 404 Catch-All Page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>

      {/* Sticky Bottom Cart Bar (Swiggy/Zomato style) */}
      {!isAdminPath && <StickyCartBar />}

      {/* Interactive Cart Drawer for Customers */}
      {!isAdminPath && <CartDrawer />}

      {/* Floating Actions on Mobile (WhatsApp & Phone, stacked without overlapping cart) */}
      {!isAdminPath && <FloatingActions />}

      {/* Solid Brand Footer (hidden in admin pages) */}
      {!isAdminPath && <Footer />}
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;