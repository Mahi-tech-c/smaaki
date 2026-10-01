import React, { useContext } from 'react';
import { ArrowRight, Gift, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Hero = () => {
  const { settings, isLoaded } = useContext(AppContext);

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center pt-20 overflow-hidden bg-transparent">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={settings.homepageBanner || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2000&auto=format&fit=crop"} 
          alt="Cafe Interior" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-light via-brand-light/40 to-transparent"></div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
        {!settings.isOpen && (
          <div 
            className="mb-8 px-6 py-3 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-200 animate-bounce flex items-center gap-3"
            style={{ 
              backgroundColor: settings.closedStatusTextColor === '#ffffff' ? '#dc2626' : settings.closedStatusTextColor,
              color: settings.closedStatusTextColor === '#ffffff' ? 'white' : '#ffffff',
              fontSize: `${settings.closedStatusTextSize || 14}px`
            }}
          >
            <Clock size={20} />
            {settings.closedStatusText || 'Currently Closed'}
          </div>
        )}

        <div 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 backdrop-blur-md mb-6 animate-fade-in-up"
          style={{ 
            color: settings.taglineColor, 
            fontSize: `${settings.taglineSize || 14}px` 
          }}
        >
          <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
          {settings.tagline || 'Experience the finest tastes'}
        </div>
        
        <h1 
          className="font-bold mb-6 tracking-tight"
          style={{ 
            color: settings.heroTitleColor, 
            fontSize: `clamp(2rem, 7vw, ${settings.heroTitleSize || 72}px)`,
            lineHeight: 1.1
          }}
        >
          {settings.heroTitle || 'Welcome to'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-dark">{settings.restaurantName}</span>
        </h1>
        
        <p 
          className="mb-10 max-w-2xl mx-auto font-light leading-relaxed"
          style={{ 
            color: settings.heroDescriptionColor, 
            fontSize: `${settings.heroDescriptionSize || 18}px` 
          }}
        >
          {settings.heroDescription || 'Discover a curated menu of premium smash burgers, artisanal coffee, and delightful sweet treats. Everything made fresh, just for you.'}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
          <Link 
            to="/menu" 
            className={`group flex items-center gap-2 px-8 py-4 rounded-full font-bold transition-all hover:shadow-lg active:scale-95 uppercase tracking-widest text-sm ${
              settings.isOpen ? 'shadow-brand/30' : 'bg-gray-400 text-white cursor-not-allowed'
            }`}
            style={{
              backgroundColor: settings.isOpen ? (settings.viewMenuBtnTextColor === '#ffffff' ? 'var(--primary-color)' : settings.viewMenuBtnTextColor) : undefined,
              color: settings.viewMenuBtnTextColor === '#ffffff' ? 'white' : 'white',
              fontSize: `${settings.viewMenuBtnTextSize || 14}px`
            }}
          >
            {settings.isOpen 
              ? (settings.viewMenuBtnText || 'View Menu') 
              : (settings.browsingOnlyBtnText || 'Browsing Only')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            to="/offers" 
            className="group flex items-center gap-2 bg-white/80 hover:bg-white px-8 py-4 rounded-full font-bold transition-all border border-brand-light hover:shadow-md active:scale-95 uppercase tracking-widest text-sm"
            style={{
              color: settings.specialOffersBtnTextColor,
              borderColor: settings.specialOffersBtnTextColor,
              fontSize: `${settings.specialOffersBtnTextSize || 14}px`
            }}
          >
            <Gift className="w-5 h-5" />
            {settings.specialOffersBtnText || 'Special Offers'}
          </Link>
        </div>


        {/* Important Note */}
        <div className="bg-white/50 backdrop-blur-md p-5 rounded-3xl border border-brand-light shadow-inner max-w-xl mx-auto text-left w-full text-brand-dark/90 text-sm animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <p 
            className="font-bold mb-3 flex items-center gap-2"
            style={{ 
              color: settings.noteHeadingTextColor,
              fontSize: `${settings.noteHeadingTextSize || 16}px`
            }}
          >
            <span className="text-xl">★</span> {settings.noteHeadingText || 'Note:'}
          </p>
          <ul className="space-y-2 list-none ml-2 font-medium">
            {settings.taxNote && (
              <li className="flex items-start gap-2" style={{ color: settings.taxNoteColor, fontSize: `${settings.taxNoteSize || 14}px` }}>
                <span className="text-brand mt-0.5">•</span>
                <span>{settings.taxNote}</span>
              </li>
            )}
            <li className="flex items-start gap-2" style={{ color: settings.menuDisclaimerColor, fontSize: `${settings.menuDisclaimerSize || 14}px` }}>
              <span className="text-brand mt-0.5">•</span> 
              <span>{settings.menuDisclaimer || 'Images are for reference only; actual items may look slightly different.'}</span>
            </li>
            <li className="flex items-start gap-2" style={{ color: settings.waitNoteColor, fontSize: `${settings.waitNoteSize || 14}px` }}>
              <span className="text-brand mt-0.5">•</span> 
              <span>{settings.waitNote || 'Minimum wait time is 15 minutes (we prepare your food fresh so it tastes its best).'}</span>
            </li>
            <li className="flex items-start gap-2" style={{ color: settings.availabilityNoteColor, fontSize: `${settings.availabilityNoteSize || 14}px` }}>
              <span className="text-brand mt-0.5">•</span> 
              <span>{settings.availabilityNote || 'Items are available based on stock and availability.'}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Hero;
