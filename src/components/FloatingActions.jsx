import React, { useContext } from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { AppContext } from '../context/AppContext';

export const FloatingActions = () => {
  const { settings, cartItemCount } = useContext(AppContext);

  const phone = settings.phone || '';
  const whatsapp = settings.whatsapp || '';

  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const cleanWhatsapp = whatsapp.replace(/\D/g, '');

  const hasPhone = cleanPhone && cleanPhone !== '[PHONE]';
  const hasWhatsapp = cleanWhatsapp && cleanWhatsapp !== '[WHATSAPP_NUMBER]';

  if (!hasPhone && !hasWhatsapp) return null;

  // Stacks above the sticky cart bar if items are in cart
  const bottomOffsetClass = cartItemCount > 0 ? 'bottom-20' : 'bottom-6';

  return (
    <div 
      className={`fixed ${bottomOffsetClass} right-4 z-30 flex flex-col items-center gap-2.5 transition-all duration-300 md:hidden pointer-events-auto`}
      aria-label="Quick Actions"
    >
      {/* Call Button */}
      {hasPhone && (
        <a
          href={`tel:${cleanPhone}`}
          className="w-11 h-11 rounded-full bg-slate-900 border border-slate-700 text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-pink-500"
          aria-label="Call Smaakenzzoo Cafe"
          title="Call Cafe"
        >
          <Phone className="w-5 h-5 text-pink-400" />
        </a>
      )}

      {/* WhatsApp Button */}
      {hasWhatsapp && (
        <a
          href={`https://wa.me/${cleanWhatsapp}?text=Hi%20Smaakenzzoo%2C%20I%20would%20like%20to%20place%20an%20order`}
          target="_blank"
          rel="noreferrer"
          className="relative w-12 h-12 rounded-full bg-[#25D366] text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
          aria-label="Chat with Smaakenzzoo on WhatsApp"
          title="Order on WhatsApp"
        >
          <MessageCircle className="w-6 h-6 fill-current" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
        </a>
      )}
    </div>
  );
};

export default FloatingActions;
