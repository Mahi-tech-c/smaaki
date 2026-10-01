import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, Gift, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const OffersSection = () => {
  const { offers, menuItems, settings } = useContext(AppContext);
  const safeOffers = offers || [];
  const safeMenuItems = menuItems || [];

  return (
    <div className="min-h-[100dvh] bg-pink-50/30 pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="p-2 hover:bg-pink-50 rounded-xl text-pink-600 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 
            className="font-bold flex items-center gap-2"
            style={{ 
              color: settings.offersTitleColor, 
              fontSize: `${settings.offersTitleSize || 20}px` 
            }}
          >
            <Gift size={24} />
            {settings.offersTitle || 'Special Offers'}
          </h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-100 rounded-full font-bold uppercase tracking-widest mb-4"
            style={{ 
              color: settings.offersSubtitleColor, 
              fontSize: `${settings.offersSubtitleSize || 12}px` 
            }}
          >
            <Sparkles size={16} />
            {settings.offersSubtitle || 'Exclusive Deals'}
          </div>
          <h2 
            className="font-extrabold mb-4 tracking-tight"
            style={{ 
              color: settings.offersHeaderColor, 
              fontSize: `${settings.offersHeaderSize || 36}px` 
            }}
          >{settings.offersHeader || 'Savor More for Less'}</h2>
          <p 
            className="max-w-lg mx-auto"
            style={{ 
              color: settings.offersDescriptionColor, 
              fontSize: `${settings.offersDescriptionSize || 18}px` 
            }}
          >{settings.offersDescription || 'Explore our latest promotions and seasonal specials crafted just for you.'}</p>
        </div>

        {safeOffers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-pink-100 shadow-sm">
            <div className="text-pink-200 mb-4 flex justify-center"><Gift size={64} /></div>
            <p className="text-pink-400 font-bold text-lg">New offers coming soon!</p>
            <p className="text-pink-300 text-sm">Stay tuned for amazing deals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {safeOffers
              .filter(offer => {
                if (!offer.endDate) return true;
                return new Date(offer.endDate) >= new Date();
              })
              .map((offer) => {
              const offerCategories = offer?.categories || (offer?.category ? [offer.category] : []);
              const relevantItems = safeMenuItems.filter(item => item && offerCategories.includes(item.category)).slice(0, 4);

              return (
                <div key={offer.id} className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-pink-100/50 border border-pink-100 group hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  <div className="h-56 relative overflow-hidden">
                    <img src={offer.image} alt={offer.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    {offer.tag && (
                      <div className="absolute top-4 left-4 px-4 py-1.5 bg-white/90 backdrop-blur-md text-pink-900 rounded-full text-xs font-black uppercase tracking-tighter shadow-sm border border-pink-100">
                        {offer.tag}
                      </div>
                    )}
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="text-2xl font-black text-pink-900 mb-2 uppercase tracking-tight">{offer.title}</h3>
                    <p className="text-pink-600/80 text-sm leading-relaxed mb-6 line-clamp-2">{offer.description}</p>
                    
                    {relevantItems.length > 0 && (
                      <div className="space-y-4 mb-2">
                        <p className="text-[10px] font-black text-pink-300 uppercase tracking-widest border-b border-pink-50 pb-2">Promotion Items</p>
                        {relevantItems.map(item => {
                          const offerPrice = offer.itemPrices?.[item.id] || item.price;
                          const hasOffer = offerPrice !== item.price;

                          return (
                            <div key={item.id} className="flex items-center justify-between group/item">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-pink-50 border border-pink-100 flex-shrink-0">
                                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                                </div>
                                <span className="text-sm font-bold text-pink-900 truncate pr-2">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {hasOffer && <span className="text-[10px] font-bold text-pink-200 line-through">₹{item.price}</span>}
                                <span className="text-sm font-black text-pink-600">₹{offerPrice}</span>
                              </div>
                            </div>
                          );
                        })}
                        {offerCategories.length > 0 && (
                          <p className="text-[10px] font-bold text-pink-400 italic bg-pink-50/50 p-2 rounded-lg border border-pink-100/50 text-center">
                            Valid on {offerCategories.join(', ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default OffersSection;
