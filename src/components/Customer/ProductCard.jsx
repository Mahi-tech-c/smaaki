import React from 'react';
import { Plus, Minus, Bell, Eye, Flame, Star, Sparkles, Award } from 'lucide-react';
import { formatCurrency, sanitizeDescription } from '../../utils/helpers';
import { FALLBACK_FOOD_IMAGE } from '../../constants/settings';
import { DietaryMarker, Stepper } from '../ui';
import { getItemDietaryType, getItemBadges } from '../../utils/menuDataHelper';
import { useToast } from '../ui/Toast';

/**
 * Highlights matching search terms safely
 */
const HighlightMatch = ({ text = '', query = '' }) => {
  if (!query || !query.trim()) return <span>{text}</span>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-pink-500/30 text-pink-300 font-bold px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

export const ProductCard = ({ 
  item, 
  settings, 
  cart = [], 
  onAddToCart, 
  onUpdateCartQuantity,
  onOpenQuickView,
  viewMode = 'list', // 'list' (default) | 'grid'
  searchQuery = ''
}) => {
  const { showToast } = useToast();
  if (!item) return null;

  const hasVariants = Boolean(item.options && item.options.length > 0);
  const basePrice = item.price;
  const activeCartId = String(item.id);

  // Cart quantity check
  const cartEntry = cart.find(c => String(c.id) === String(item.id) || c.cartId === activeCartId);
  const inCartQty = cartEntry ? cartEntry.quantity : 0;

  // Metadata
  const dietaryType = getItemDietaryType(item);
  const badges = getItemBadges(item);
  const isAvailable = item.inStock !== false && item.isAvailable !== false;
  const cleanDescription = sanitizeDescription(item.description);

  const handleAddClick = (e) => {
    e.stopPropagation();
    if (!isAvailable) return;

    if (hasVariants) {
      // If it has variants, open sheet so user can choose size/variant
      onOpenQuickView?.(item);
    } else {
      onAddToCart?.(item);
      showToast?.({
        message: `Added ${item.name} to bag`,
        type: 'success',
        action: {
          label: 'Undo',
          onClick: () => onUpdateCartQuantity?.(activeCartId, -1)
        }
      });
    }
  };

  const handleNotifyMe = (e) => {
    e.stopPropagation();
    showToast?.({
      message: `We'll notify you when ${item.name} is back!`,
      type: 'info'
    });
  };

  // ─────────────────────────────────────────────────────────────
  // 1. MOBILE LIST LAYOUT (Default mobile-first Swiggy/Zomato card)
  // ─────────────────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <div 
        onClick={() => onOpenQuickView?.(item)}
        className={`
          flex items-start justify-between gap-3 sm:gap-4 p-4 rounded-2xl
          bg-slate-900/95 border border-slate-800/80 hover:border-slate-700
          transition-all duration-200 select-none group relative cursor-pointer
          ${!isAvailable ? 'opacity-65' : ''}
        `}
      >
        {/* Left: Food Info & Details */}
        <div className="flex-1 min-w-0 pr-1">
          {/* Header row: Dietary symbol & Badges */}
          <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
            <DietaryMarker type={dietaryType} size={18} />
            {badges.map((badge, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/25"
              >
                {badge === 'Bestseller' && <Star className="w-2.5 h-2.5 fill-current" />}
                {badge === 'Spicy' && <Flame className="w-2.5 h-2.5 fill-current" />}
                {badge === 'New' && <Sparkles className="w-2.5 h-2.5" />}
                {badge === 'Must Try' && <Award className="w-2.5 h-2.5" />}
                <span>{badge}</span>
              </span>
            ))}
          </div>

          {/* Name */}
          <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-pink-400 transition-colors leading-tight mb-1">
            <HighlightMatch text={item.name} query={searchQuery} />
          </h3>

          {/* Price (Strictly ₹259, never ₹259.00) */}
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-sm sm:text-base font-extrabold text-white">
              {formatCurrency(basePrice, settings?.currencySymbol || '₹')}
            </span>
            {hasVariants && (
              <span className="text-[10px] text-slate-400 font-medium">
                ({item.options.length} options)
              </span>
            )}
          </div>

          {/* Appetizing 2-Line Truncated Description */}
          {cleanDescription && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-normal">
              <HighlightMatch text={cleanDescription} query={searchQuery} />
            </p>
          )}
        </div>

        {/* Right: 96px Image with Overlapping Add Button */}
        <div className="relative shrink-0 flex flex-col items-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-800 shadow-sm relative">
            <img 
              src={item.image || FALLBACK_FOOD_IMAGE}
              alt={item.name}
              loading="lazy"
              decoding="async"
              width="112"
              height="112"
              onError={(e) => {
                e.currentTarget.src = FALLBACK_FOOD_IMAGE;
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Reference image watermark indicator */}
            <span className="absolute bottom-1 right-1 text-[8px] bg-black/60 text-slate-300 px-1 rounded backdrop-blur-xs pointer-events-none">
              Ref image
            </span>
          </div>

          {/* Overlapping Add Button / Stepper (Bottom Center) */}
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-10 w-[84px] flex justify-center">
            {!isAvailable ? (
              <button
                type="button"
                onClick={handleNotifyMe}
                className="w-full py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
              >
                <Bell className="w-3 h-3" /> Notify
              </button>
            ) : inCartQty > 0 ? (
              <div onClick={(e) => e.stopPropagation()} className="shadow-lg">
                <Stepper 
                  value={inCartQty} 
                  size="sm"
                  onChange={(newQty) => onUpdateCartQuantity?.(activeCartId, newQty - inCartQty)}
                  showTrashAtOne={true}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAddClick}
                className="w-full py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 shadow-md shadow-pink-600/30 transition-all border border-pink-500/40"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" /> ADD
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. GRID LAYOUT (Desktop & Grid View toggle)
  // ─────────────────────────────────────────────────────────────
  return (
    <div 
      onClick={() => onOpenQuickView?.(item)}
      className={`
        flex flex-col justify-between rounded-2xl bg-slate-900/95
        border border-slate-800/80 hover:border-slate-700 shadow-sm hover:shadow-xl
        transition-all duration-300 overflow-hidden group relative cursor-pointer select-none
        ${!isAvailable ? 'opacity-65' : ''}
      `}
    >
      {/* Top Image Area */}
      <div className="relative aspect-[4/3] w-full bg-slate-800 overflow-hidden">
        <img 
          src={item.image || FALLBACK_FOOD_IMAGE}
          alt={item.name}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_FOOD_IMAGE;
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Dietary Symbol (Top Left) */}
        <div className="absolute top-3 left-3 p-1 rounded-md bg-slate-900/90 backdrop-blur-sm border border-slate-800 shadow-sm">
          <DietaryMarker type={dietaryType} size={18} />
        </div>

        {/* Reference Image Tag */}
        <span className="absolute bottom-2 left-2 text-[9px] bg-black/60 text-slate-300 px-1.5 py-0.5 rounded backdrop-blur-xs pointer-events-none">
          Image for reference
        </span>

        {/* Quick View Hover Cue */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-white/95 text-slate-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all">
            <Eye className="w-3.5 h-3.5" /> Customize
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Badges */}
          <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
            {badges.map((badge, idx) => (
              <span
                key={idx}
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/25"
              >
                {badge}
              </span>
            ))}
          </div>

          {/* Title */}
          <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-pink-400 transition-colors line-clamp-1 mb-1">
            <HighlightMatch text={item.name} query={searchQuery} />
          </h3>

          {/* Description */}
          {cleanDescription && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-normal">
              <HighlightMatch text={cleanDescription} query={searchQuery} />
            </p>
          )}
        </div>

        {/* Bottom Bar: Price & Action */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-auto">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">Price</span>
            <span className="text-base font-extrabold text-white">
              {formatCurrency(basePrice, settings?.currencySymbol || '₹')}
            </span>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            {!isAvailable ? (
              <button
                type="button"
                onClick={handleNotifyMe}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Bell className="w-3.5 h-3.5" /> Sold Out
              </button>
            ) : inCartQty > 0 ? (
              <Stepper 
                value={inCartQty} 
                size="sm"
                onChange={(newQty) => onUpdateCartQuantity?.(activeCartId, newQty - inCartQty)}
                showTrashAtOne={true}
              />
            ) : (
              <button
                type="button"
                onClick={handleAddClick}
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-pink-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" /> ADD
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
