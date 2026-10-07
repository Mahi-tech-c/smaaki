import React, { useContext } from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/helpers';

export const StickyCartBar = () => {
  const { cart, cartItemCount, cartTotal, setIsCartOpen, settings } = useContext(AppContext);

  if (!Array.isArray(cart) || cart.length === 0) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none animate-in slide-in-from-bottom duration-250"
    >
      <div className="max-w-xl mx-auto pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="w-full py-3.5 px-5 rounded-2xl bg-pink-600 hover:bg-pink-700 active:scale-98 text-white font-black text-sm shadow-2xl shadow-pink-600/40 flex items-center justify-between transition-all cursor-pointer border border-pink-400/30"
          aria-label="View shopping bag"
        >
          {/* Left: Count & Total */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div className="text-left leading-tight">
              <span className="text-[11px] font-bold uppercase tracking-wider text-pink-200 block">
                {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} in Bag
              </span>
              <span className="text-base font-black tracking-tight text-white">
                {formatCurrency(cartTotal, settings?.currencySymbol || '₹')}
              </span>
            </div>
          </div>

          {/* Right: CTA Arrow */}
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
            <span>View Bag</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default StickyCartBar;
