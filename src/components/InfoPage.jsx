import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Coffee, MapPin, Clock, Phone, Mail, MessageCircle, Heart, ShieldCheck } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import Button from './ui/Button';

export const InfoPage = ({ pageKey = 'about' }) => {
  const { settings } = useContext(AppContext);

  const phone = settings.phone || '[PHONE]';
  const whatsapp = settings.whatsapp || '[WHATSAPP_NUMBER]';
  const email = settings.email || '[EMAIL]';
  const address = settings.address || 'Artisanal Cafe, Warangal, Telangana';
  const hours = settings.operatingHours || '11:00 AM to 11:00 PM daily';
  const fssaiNumber = settings.fssaiNumber || '[FSSAI_NUMBER]';
  const gstNumber = settings.gstNumber || '[GST_NUMBER_IF_ANY]';

  const pages = {
    about: {
      title: 'About Smaakenzzoo',
      subtitle: 'Flourishing Hearts, Blooming Dreams',
      content: (
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <p>
            Welcome to <strong>Smaakenzzoo</strong>, Warangal&apos;s beloved artisanal cafe where culinary passion meets cozy moments. Born from a love for authentic Spanish churros, golden Belgian waffles, rich specialty coffees, and savory gourmet bites, our cafe was crafted to be your joyful hangout.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
              <h4 className="font-bold text-white text-base mb-1 flex items-center gap-2">
                <Coffee className="w-5 h-5 text-pink-400" /> Artisanal Quality
              </h4>
              <p className="text-xs text-slate-400">
                Freshly prepared made-to-order dishes using premium ingredients with zero compromises.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
              <h4 className="font-bold text-white text-base mb-1 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-400" /> Vibrant Atmosphere
              </h4>
              <p className="text-xs text-slate-400">
                A warm sanctuary for friends, dates, and celebrations accompanied by upbeat cafe vibes.
              </p>
            </div>
          </div>
          <p>
            Every recipe is tested and curated to bring a smile to your face. Whether it&apos;s our signature Cinnamon Sugar Churros dipped in warm chocolate or our hearty Gourmet Pizzas, there is always something to fall in love with.
          </p>
        </div>
      )
    },
    contact: {
      title: 'Contact & Location',
      subtitle: 'We’d love to hear from you or welcome you in person',
      content: (
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-pink-400" /> Address
              </h4>
              <p className="text-xs text-slate-300">{address}</p>
              {settings.mapsUrl && settings.mapsUrl !== '[GOOGLE_MAPS_URL]' && (
                <a
                  href={settings.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-pink-400 font-bold text-xs inline-block hover:underline"
                >
                  View on Google Maps →
                </a>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-pink-400" /> Operating Hours
              </h4>
              <p className="text-xs text-slate-300">{hours}</p>
              <p className="text-[11px] text-emerald-400 font-semibold">Open 7 days a week</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Phone className="w-4 h-4 text-pink-400" /> Telephone
              </h4>
              <p className="text-xs text-slate-300">
                <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="hover:text-white">
                  {phone}
                </a>
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" /> WhatsApp
              </h4>
              <p className="text-xs text-slate-300">
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white"
                >
                  {whatsapp}
                </a>
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Mail className="w-4 h-4 text-pink-400" /> Email Support
              </h4>
              <p className="text-xs text-slate-300">
                <a href={`mailto:${email}`} className="hover:text-white">
                  {email}
                </a>
              </p>
            </div>
          </div>
        </div>
      )
    },
    gallery: {
      title: 'Cafe Gallery',
      subtitle: 'Snapshots of handcrafted culinary delight',
      content: (
        <div className="space-y-4 text-sm text-slate-300">
          <p>
            Experience the culinary artistry of Smaakenzzoo through our signature creations. Visit us to taste the magic fresh from the kitchen!
          </p>
          <div className="pt-4 flex justify-center">
            <Link to="/menu">
              <Button variant="primary" size="md">
                Browse Menu with Photos
              </Button>
            </Link>
          </div>
        </div>
      )
    },
    privacy: {
      title: 'Privacy Policy',
      subtitle: 'Your privacy and security are our priority',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            At Smaakenzzoo, we value your trust. We collect only the information necessary to fulfill your cafe orders (such as table number, name, contact number, and order preferences).
          </p>
          <p>
            Your data is never sold or shared with unauthorized third parties. Payment transactions are processed directly through secure, authorized gateways.
          </p>
        </div>
      )
    },
    terms: {
      title: 'Terms of Service',
      subtitle: 'Standard cafe dining and ordering guidelines',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            1. All items are prepared fresh to order. Standard preparation time is between 15 to 25 minutes during peak hours.
          </p>
          <p>
            2. Prices, taxes, and promotional offers are subject to change and are verified at checkout.
          </p>
          <p>
            3. Regulatory Registration: FSSAI Lic #{fssaiNumber} {gstNumber ? `• GSTIN: ${gstNumber}` : ''}.
          </p>
        </div>
      )
    },
    refunds: {
      title: 'Refunds & Cancellations',
      subtitle: 'Our fair customer satisfaction guarantee',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Because our artisanal treats and drinks are freshly prepared upon receipt of order, cancellations can only be accommodated before food preparation begins.
          </p>
          <p>
            If there is any issue with your dish or delivery, please notify our cafe staff immediately or message us on WhatsApp with your Order ID for prompt resolution or replacement.
          </p>
        </div>
      )
    }
  };

  const page = pages[pageKey] || pages.about;

  return (
    <div className="min-h-[70vh] bg-[#0f1117] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <header className="border-b border-slate-800 pb-6 mb-8">
          <span className="text-pink-500 text-xs font-bold uppercase tracking-widest block mb-1">
            Smaakenzzoo
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            {page.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 italic">
            {page.subtitle}
          </p>
        </header>

        <main>{page.content}</main>
      </div>
    </div>
  );
};

export default InfoPage;
