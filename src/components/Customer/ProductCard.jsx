import React, { useState } from 'react';
import { Plus, Minus, Check, ChevronDown, Eye } from 'lucide-react';
import { formatCurrency, sanitizeDescription } from '../../utils/helpers';
import { FALLBACK_FOOD_IMAGE } from '../../constants/settings';

const ProductCard = ({ 
  item, 
  settings, 
  cart, 
  onAddToCart, 
  onUpdateCartQuantity,
  onOpenQuickView 
}) => {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isVariantDropdownOpen, setIsVariantDropdownOpen] = useState(false);

  const hasVariants = item.options && item.options.length > 0;
  const currentVariant = hasVariants ? item.options[selectedVariantIndex] : null;
  const activePrice = currentVariant ? currentVariant.price : item.price;
  const activeCartId = currentVariant ? `${item.id}-${currentVariant.title}` : String(item.id);

  // Cart status
  const cartEntry = (cart || []).find(c => c.cartId === activeCartId);
  const inCartQty = cartEntry ? cartEntry.quantity : 0;

  // Food classification
  const isNonVeg = /chicken|egg|fish|meat|wings|keivs|kievs|bacon|bbq/i.test(
    `${item.name} ${item.category} ${item.description || ''}`
  );

  const cleanDescription = sanitizeDescription(item.description);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/70 hover:border-gray-300 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group relative">
      
      {/* Product Image Stage */}
      <div 
        className="relative aspect-[4/3] w-full bg-neutral-100 overflow-hidden cursor-pointer select-none"
        onClick={() => onOpenQuickView && onOpenQuickView(item)}
      >
        <img 
          src={item.image || FALLBACK_FOOD_IMAGE} 
          alt={item.name}
          loading="lazy"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onError={(e) => {
            e.currentTarget.src = FALLBACK_FOOD_IMAGE;
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out select-none" 
        />

        {/* Soft vignette and Quick Look Badge (visible on hover or focus) */}
        <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
          <span className="bg-white/95 text-gray-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <Eye size={13} /> Quick Look
          </span>
        </div>

        {/* Dietary Certification Symbol */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md p-1 rounded-md shadow-xs border border-gray-200/60">
          <span 
            className={`w-3.5 h-3.5 border-1.5 flex items-center justify-center rounded-xs ${
              isNonVeg ? 'border-amber-700' : 'border-emerald-700'
            }`}
            title={isNonVeg ? 'Non-Vegetarian' : 'Vegetarian'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isNonVeg ? 'bg-amber-700' : 'bg-emerald-700'}`}></span>
          </span>
        </div>

        {/* Availability / Tag Badge */}
        {item.isAvailable === false ? (
          <div className="absolute top-3 right-3 bg-neutral-900/90 backdrop-blur-xs text-neutral-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
            Sold Out
          </div>
        ) : hasVariants ? (
          <div className="absolute bottom-2.5 left-3 bg-white/90 backdrop-blur-md text-gray-800 border border-gray-200/60 px-2 py-0.5 rounded-md text-[10px] font-bold">
            {item.options.length} Sizes
          </div>
        ) : null}
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Header Row: Category & Clean Macro Highlight */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {item.category}
            </span>
            {(item.protein || item.calories) && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                {item.protein && (
                  <span className="font-bold text-emerald-700">
                    {item.protein} Protein
                  </span>
                )}
                {item.protein && item.calories && (
                  <span className="text-gray-300">•</span>
                )}
                {item.calories && (
                  <span>{item.calories}</span>
                )}
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 
            className="font-bold text-sm sm:text-base text-gray-950 line-clamp-1 group-hover:text-black transition-colors cursor-pointer"
            onClick={() => onOpenQuickView && onOpenQuickView(item)}
            title={item.name}
          >
            {item.name}
          </h3>

          {/* Clean Description */}
          {cleanDescription && (
            <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed font-normal">
              {cleanDescription}
            </p>
          )}
        </div>

        {/* Variant Dropdown Selector */}
        {hasVariants && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsVariantDropdownOpen(!isVariantDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 rounded-xl text-xs font-semibold text-gray-800 transition-colors"
            >
              <span className="truncate">{currentVariant.title}</span>
              <div className="flex items-center gap-1.5 shrink-0 font-bold ml-1.5 text-gray-950">
                <span>{formatCurrency(currentVariant.price, settings.currencySymbol || '₹')}</span>
                <ChevronDown size={13} className={`text-gray-400 transition-transform ${isVariantDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Dropdown Options */}
            {isVariantDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsVariantDropdownOpen(false)}></div>
                <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white border border-gray-200 shadow-2xl rounded-xl z-40 overflow-hidden divide-y divide-gray-100 animate-in fade-in duration-100">
                  {item.options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedVariantIndex(idx);
                        setIsVariantDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-xs transition-colors ${
                        idx === selectedVariantIndex 
                          ? 'bg-neutral-900 text-white font-bold' 
                          : 'text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        {idx === selectedVariantIndex && <Check size={12} className="text-emerald-400 shrink-0" />}
                        {opt.title}
                      </span>
                      <span className="font-extrabold shrink-0 ml-2">
                        {formatCurrency(opt.price, settings.currencySymbol || '₹')}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Pricing & Executive Action */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider block">Price</span>
            <span className="text-base sm:text-lg font-black text-gray-950 tracking-tight">
              {formatCurrency(activePrice, settings.currencySymbol || '₹')}
            </span>
          </div>

          {/* Minimalist Action Controls */}
          {item.isAvailable === false ? (
            <span className="px-3 py-1.5 bg-gray-100 text-gray-400 font-semibold text-xs rounded-xl uppercase tracking-wider">
              Unavailable
            </span>
          ) : inCartQty > 0 ? (
            <div className="flex items-center bg-gray-950 text-white rounded-xl shadow-xs overflow-hidden h-9">
              <button
                onClick={() => onUpdateCartQuantity(activeCartId, -1)}
                className="px-3 h-full hover:bg-black active:scale-95 transition-all text-white font-bold flex items-center justify-center"
                aria-label="Decrease quantity"
              >
                <Minus size={13} />
              </button>
              <span className="px-2 text-xs font-bold select-none min-w-[24px] text-center">
                {inCartQty}
              </span>
              <button
                onClick={() => onUpdateCartQuantity(activeCartId, 1)}
                className="px-3 h-full hover:bg-black active:scale-95 transition-all text-white font-bold flex items-center justify-center"
                aria-label="Increase quantity"
              >
                <Plus size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart(item, currentVariant)}
              className="px-4 py-2 bg-gray-950 hover:bg-black text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-xs hover:shadow-md active:scale-95 flex items-center gap-1.5 group/btn"
            >
              <Plus size={14} className="text-gray-400 group-hover/btn:text-white transition-colors" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
