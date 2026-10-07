import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Minus, ShoppingBag, Check, ChevronDown } from 'lucide-react';
import { formatCurrency, sanitizeDescription } from '../../utils/helpers';
import { FALLBACK_FOOD_IMAGE } from '../../constants/settings';

const QuickViewModal = ({ 
  item, 
  onClose, 
  settings = {}, 
  cart = [], 
  onAddToCart, 
  onUpdateCartQuantity 
}) => {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isNutritionOpen, setIsNutritionOpen] = useState(false);

  useEffect(() => {
    setSelectedVariantIndex(0);
    setIsNutritionOpen(false);
  }, [item?.id]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (item) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [item]);

  if (!item) return null;

  const hasVariants = Boolean(item.options && item.options.length > 0);
  const currentVariant = hasVariants ? item.options[selectedVariantIndex] : null;
  const activePrice = currentVariant ? currentVariant.price : item.price;
  const activeCartId = currentVariant ? `${item.id}-${currentVariant.title}` : String(item.id);

  const cartEntry = (cart || []).find(c => c.cartId === activeCartId);
  const inCartQty = cartEntry ? cartEntry.quantity : 0;

  const isNonVeg = /chicken|egg|fish|meat|wings|keivs|kievs|bacon|bbq/i.test(
    `${item.name} ${item.category} ${item.description || ''}`
  );
  const cleanDescription = sanitizeDescription(item.description);

  // Check if beverage/water to hide nutrition completely
  const isBeverageOrWater = /water|coke|pepsi|sprite|thums|soda|soft drink|beverage/i.test(
    `${item.name} ${item.category}`
  );

  const hasNutrition = !isBeverageOrWater && Boolean(item.protein || item.calories || item.carbs || item.fats);

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[92dvh] sm:max-h-[90vh] z-10 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Image Header */}
        <div className="relative w-full h-52 xs:h-60 sm:h-68 bg-gray-100 overflow-hidden shrink-0">
          <img 
            src={item.image || FALLBACK_FOOD_IMAGE} 
            alt={item.name} 
            onError={(e) => {
              e.currentTarget.src = FALLBACK_FOOD_IMAGE;
            }}
            className="w-full h-full object-cover" 
          />

          {/* Close Button */}
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 sm:w-9 sm:h-9 bg-white/95 hover:bg-white text-gray-900 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer z-20"
            aria-label="Close"
          >
            <X size={17} className="stroke-[2.5]" />
          </button>
          
          {/* Department / Category Pill */}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-gray-900 shadow-sm border border-gray-200">
            {item.category}
          </div>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Veg / Non-Veg Indicator */}
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <span 
              className={`w-4 h-4 border-2 flex items-center justify-center rounded-sm ${
                isNonVeg ? 'border-amber-700' : 'border-emerald-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isNonVeg ? 'bg-amber-700' : 'bg-emerald-700'}`}></span>
            </span>
            <span className="text-xs font-bold text-gray-600">
              {isNonVeg ? 'Non-Vegetarian' : 'Vegetarian'}
            </span>
          </div>

          {/* Product Title */}
          <h2 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight leading-tight">
            {item.name}
          </h2>

          {/* Appetizing Description */}
          {cleanDescription && (
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-normal">
              {cleanDescription}
            </p>
          )}

          {/* Variant Selector */}
          {hasVariants && (
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-800 block">
                Select Option / Portion:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {item.options.map((opt, idx) => {
                  const isSelected = idx === selectedVariantIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedVariantIndex(idx)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all text-left cursor-pointer ${
                        isSelected 
                          ? 'border-gray-950 bg-gray-950 text-white shadow-xs' 
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-pink-500 bg-pink-500' : 'border-gray-300'}`}>
                          {isSelected && <Check size={10} className="text-white stroke-[3]" />}
                        </div>
                        <span className="truncate">{opt.title}</span>
                      </div>
                      <span className={`font-bold shrink-0 ml-2 ${isSelected ? 'text-white' : 'text-gray-950'}`}>
                        {formatCurrency(opt.price, settings.currencySymbol || '₹')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional Collapsed Nutrition Section (hidden for water/soft drinks) */}
          {hasNutrition && (
            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsNutritionOpen(!isNutritionOpen)}
                className="w-full flex items-center justify-between py-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
              >
                <span>Nutrition (approx.)</span>
                <ChevronDown 
                  size={14} 
                  className={`transition-transform duration-200 ${isNutritionOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isNutritionOpen && (
                <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-2">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Protein</span>
                    <span className="text-xs font-bold text-gray-800">{item.protein || '--'}</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-2">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Calories</span>
                    <span className="text-xs font-bold text-gray-800">{item.calories || '--'}</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-2">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Carbs</span>
                    <span className="text-xs font-bold text-gray-800">{item.carbs || '--'}</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-2">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Fats</span>
                    <span className="text-xs font-bold text-gray-800">{item.fats || '--'}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Sticky Footer */}
        <div className="p-3.5 sm:p-4 px-4 sm:px-6 border-t border-gray-100 bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider truncate">
              Price
            </div>
            <div className="text-lg sm:text-2xl font-black text-gray-950 tracking-tight truncate">
              {formatCurrency(activePrice, settings.currencySymbol || '₹')}
            </div>
          </div>

          {item.isAvailable === false ? (
            <div className="px-4 sm:px-5 py-2.5 bg-gray-100 text-gray-400 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0">
              Sold Out
            </div>
          ) : inCartQty > 0 ? (
            <div className="flex items-center bg-gray-950 text-white rounded-xl shadow-xs overflow-hidden h-10 shrink-0">
              <button
                type="button"
                onClick={() => onUpdateCartQuantity(activeCartId, -1)}
                className="px-3 sm:px-3.5 h-full hover:bg-black active:scale-95 transition-all text-white font-bold flex items-center justify-center cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span className="px-2.5 sm:px-3 text-xs font-bold min-w-[24px] text-center select-none">
                {inCartQty} in cart
              </span>
              <button
                type="button"
                onClick={() => onUpdateCartQuantity(activeCartId, 1)}
                className="px-3 sm:px-3.5 h-full hover:bg-black active:scale-95 transition-all text-white font-bold flex items-center justify-center cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAddToCart(item, currentVariant)}
              className="px-5 sm:px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <ShoppingBag size={14} />
              <span>Add to Cart</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};

export default QuickViewModal;
