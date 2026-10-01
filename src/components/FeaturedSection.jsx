import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Sparkles, ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const FeaturedSection = () => {
  const { featured, settings } = useContext(AppContext);
  
  // Only show if there are active featured items
  const activeFeatured = featured?.filter(item => item.isActive !== false) || [];
  
  if (activeFeatured.length === 0) return null;

  return (
    <section className="py-24 relative overflow-hidden bg-white/30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-600 font-black text-[10px] uppercase tracking-[0.2em] mb-4 shadow-sm border border-amber-200">
            <Sparkles size={14} /> Recommended for you
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-pink-900 uppercase tracking-tighter mb-4">
            Today's <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600">Specials</span>
          </h2>
          <div className="w-24 h-1.5 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {activeFeatured.map((item, index) => (
            <div 
              key={item.id} 
              className="group bg-white rounded-[2.5rem] overflow-hidden border border-pink-100 shadow-xl shadow-pink-100/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image Area */}
              <div className="h-64 relative overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                
                {item.badge && (
                  <div className="absolute top-6 left-6 animate-pulse">
                    <span className="px-4 py-2 bg-amber-500 text-white rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg border border-amber-400">
                      {item.badge}
                    </span>
                  </div>
                )}
              </div>

              {/* Content Area */}
              <div className="p-8 flex flex-col flex-grow">
                <h3 className="text-2xl font-black text-pink-900 uppercase tracking-tight mb-2 group-hover:text-amber-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-pink-400 font-medium text-sm leading-relaxed mb-8 flex-grow">
                  {item.subtitle}
                </p>

                <div className="flex items-center gap-3 mt-auto">
                  {item.itemId ? (
                    <Link 
                      to="/menu"
                      className="flex-1 flex items-center justify-center gap-2 py-4 bg-pink-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-pink-100 hover:bg-pink-700 transition-all active:scale-95"
                    >
                      View in Menu <ArrowRight size={14} />
                    </Link>
                  ) : (
                    settings.whatsapp && (
                      <a 
                        href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello! I'm interested in the special: ${item.title}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#25D366] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-green-100 hover:bg-[#128C7E] transition-all active:scale-95"
                      >
                        <MessageCircle size={14} className="fill-current" /> Order via WhatsApp
                      </a>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;
