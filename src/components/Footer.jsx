import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { 
  Coffee, 
  MapPin, 
  Clock, 
  Phone, 
  MessageCircle, 
  Mail, 
  Navigation, 
  Heart
} from 'lucide-react';
import { AppContext } from '../context/AppContext';

const InstagramIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

export const Footer = () => {
  const { settings } = useContext(AppContext);
  const currentYear = new Date().getFullYear();

  const phone = settings.phone || '[PHONE]';
  const whatsapp = settings.whatsapp || '[WHATSAPP_NUMBER]';
  const email = settings.email || '[EMAIL]';
  const address = settings.address || 'Artisanal Cafe, Warangal, Telangana';
  const operatingHours = settings.operatingHours || '11:00 AM to 11:00 PM daily';
  const mapsUrl = settings.mapsUrl || '[GOOGLE_MAPS_URL]';
  const instagramUrl = settings.instagramUrl || settings.instagram || '[INSTAGRAM_URL]';
  const fssaiNumber = settings.fssaiNumber || '[FSSAI_NUMBER]';
  const gstNumber = settings.gstNumber || '[GST_NUMBER_IF_ANY]';

  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const cleanWhatsapp = whatsapp.replace(/\D/g, '');

  return (
    <footer className="relative z-20 bg-[#12151e] text-slate-300 border-t border-slate-800/90 pt-12 pb-24 md:pb-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          
          {/* Col 1: Brand & Identity */}
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-2xl bg-pink-600 text-white flex items-center justify-center shadow-md shadow-pink-600/30">
                <Coffee className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-pink-400 transition-colors">
                Smaakenzzoo
              </span>
            </Link>
            <p className="text-pink-400 font-semibold italic text-xs tracking-wide">
              Flourishing Hearts, Blooming Dreams
            </p>
            <p className="text-slate-400 text-xs leading-relaxed">
              Warangal&apos;s artisanal cafe destination for freshly spun churros, Belgian waffles, sizzling brownies, rich coffees, and gourmet pizzas.
            </p>
            {/* Regulatory Numbers */}
            <div className="pt-2 text-[11px] text-slate-400 space-y-1">
              <div><strong className="text-slate-300">FSSAI Lic:</strong> {fssaiNumber}</div>
              {gstNumber && <div><strong className="text-slate-300">GSTIN:</strong> {gstNumber}</div>}
            </div>
          </div>

          {/* Col 2: Cafe Operating Details */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider">
              Visit & Dine
            </h4>
            <div className="flex items-start gap-2.5 text-slate-300">
              <MapPin className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
              <span>{address}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <Clock className="w-4 h-4 text-pink-500 shrink-0" />
              <span>{operatingHours}</span>
            </div>
            {mapsUrl && mapsUrl !== '[GOOGLE_MAPS_URL]' ? (
              <a 
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-pink-400 hover:text-pink-300 font-bold transition-colors pt-1"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Get Directions on Google Maps</span>
              </a>
            ) : null}
          </div>

          {/* Col 3: Direct Cafe Contact */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider">
              Contact & Social
            </h4>
            {phone && phone !== '[PHONE]' && (
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-pink-500 shrink-0" />
                <a href={`tel:${cleanPhone}`} className="hover:text-white transition-colors">
                  {phone}
                </a>
              </div>
            )}
            {whatsapp && whatsapp !== '[WHATSAPP_NUMBER]' && (
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <a 
                  href={`https://wa.me/${cleanWhatsapp}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp Ordering
                </a>
              </div>
            )}
            {email && email !== '[EMAIL]' && (
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-pink-500 shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-white transition-colors truncate">
                  {email}
                </a>
              </div>
            )}
            {instagramUrl && instagramUrl !== '[INSTAGRAM_URL]' && (
              <div className="flex items-center gap-2.5">
                <InstagramIcon className="w-4 h-4 text-pink-400 shrink-0" />
                <a 
                  href={instagramUrl.startsWith('http') ? instagramUrl : `https://instagram.com/${instagramUrl.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Follow on Instagram
                </a>
              </div>
            )}
          </div>

          {/* Col 4: Quick Navigation & Legal */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider">
              Explore & Policies
            </h4>
            <ul className="space-y-1.5">
              <li>
                <Link to="/menu" className="hover:text-pink-400 transition-colors">Menu Catalog</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-pink-400 transition-colors">About Smaakenzzoo</Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-pink-400 transition-colors">Cafe Gallery</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-pink-400 transition-colors">Contact Us</Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-pink-400 transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-pink-400 transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link to="/refunds" className="hover:text-pink-400 transition-colors">Refunds & Cancellations</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Note */}
        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <p>
            © {currentYear} Smaakenzzoo Warangal. All Rights Reserved.
          </p>
          <p className="flex items-center gap-1">
            Handcrafted with <Heart className="w-3 h-3 text-pink-500 fill-pink-500" /> for food lovers in Telangana.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
