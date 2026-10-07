import React, { useContext, useState, useMemo } from 'react';
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  Tag, 
  ArrowRight, 
  Plus, 
  Minus, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  Info,
  Check
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/helpers';
import { recalculateOrderTotals, validateCoupon, PROMO_CODES } from '../../utils/pricing';
import { DietaryMarker } from '../ui';
import { CheckoutModal } from './CheckoutModal';
import { useToast } from '../ui/Toast';

export const CartDrawer = () => {
  const { 
    cart, 
    updateCartQuantity, 
    removeFromCart, 
    clearCart, 
    cartItemCount,
    isCartOpen, 
    setIsCartOpen,
    settings,
    menuItems,
    offers,
    addToCart
  } = useContext(AppContext);

  const { showToast } = useToast();

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponFeedback, setCouponFeedback] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Recalculate bill using the pure recalculation engine
  const bill = useMemo(() => {
    return recalculateOrderTotals({
      cartItems: cart,
      menuCatalog: menuItems || [],
      couponCode: appliedCoupon,
      orderType: 'dine-in', // Default estimate in cart; user chooses exact type in checkout
      settings: settings || {},
      activeOffers: offers || []
    });
  }, [cart, menuItems, appliedCoupon, settings, offers]);

  // Suggested promo chips
  const suggestedPromos = Object.values(PROMO_CODES);

  // Companion upsell items (3-4 popular accompaniments not yet in cart)
  const upsellItems = useMemo(() => {
    if (!Array.isArray(menuItems) || menuItems.length === 0) return [];
    const cartItemIds = new Set(cart.map(c => String(c.id)));
    return menuItems
      .filter(item => !cartItemIds.has(String(item.id)) && item.inStock !== false)
      .slice(0, 4);
  }, [menuItems, cart]);

  const handleApplyCoupon = (codeToApply) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) return;

    const validation = validateCoupon(code, bill.itemTotal, offers || []);
    if (validation.valid) {
      setAppliedCoupon(code);
      setCouponFeedback({ success: true, message: validation.message, discount: validation.discount });
      setCouponInput('');
      showToast?.({
        message: `Coupon applied: ${code} (-₹${validation.discount})`,
        type: 'success'
      });
    } else {
      setCouponFeedback({ success: false, message: validation.message });
      showToast?.({
        message: validation.message,
        type: 'error'
      });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon('');
    setCouponFeedback(null);
    showToast?.({
      message: 'Coupon removed',
      type: 'info'
    });
  };

  const handleOrderSuccess = () => {
    clearCart();
    setAppliedCoupon('');
    setCouponFeedback(null);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsCartOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer Panel */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="Your Bag"
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-slate-950 text-slate-100 shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col border-l border-slate-800 ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-600/20 text-pink-400 rounded-2xl border border-pink-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white font-heading tracking-tight">Your Bag</h2>
              <p className="text-xs font-semibold text-slate-400">
                {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} selected
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button 
                type="button"
                onClick={clearCart}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Clear entire cart"
                aria-label="Clear bag"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button 
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar">
          {cart.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
              <div className="w-20 h-20 rounded-3xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <ShoppingBag className="w-9 h-9 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white font-heading">Your bag is empty</h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Pick something delicious from our menu to start your artisanal dining experience.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="mt-2 px-6 py-2.5 rounded-full bg-pink-600 hover:bg-pink-500 active:scale-95 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-pink-600/30 cursor-pointer"
              >
                Explore Menu
              </button>
            </div>
          ) : (
            <>
              {/* Item List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 pb-1">
                  <span>Ordered Items</span>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="text-pink-400 hover:text-pink-300 font-bold transition-colors cursor-pointer"
                  >
                    + Add more items
                  </button>
                </div>

                {cart.map((item) => {
                  const lineTotal = (Number(item.price) || 0) * item.quantity;
                  return (
                    <div 
                      key={item.cartId} 
                      className="flex gap-3 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800/80 items-start hover:border-slate-700 transition-colors"
                    >
                      {/* Thumbnail with Dietary Marker */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-800">
                        <img 
                          src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300'} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                        />
                        <div className="absolute top-1 left-1 bg-black/60 rounded-sm p-0.5 backdrop-blur-xs">
                          <DietaryMarker type={item.veg || 'veg'} size={14} />
                        </div>
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-bold text-white text-sm truncate leading-snug">
                            {item.baseName || item.name}
                          </h4>
                          <button 
                            type="button"
                            onClick={() => removeFromCart(item.cartId)}
                            className="text-slate-500 hover:text-red-400 transition-colors p-1 -mr-1"
                            title="Remove item"
                            aria-label={`Remove ${item.name}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Variant Tag */}
                        {item.option && (
                          <span className="inline-block px-2 py-0.5 mt-1 rounded bg-slate-800 text-[10px] font-semibold text-pink-300">
                            {item.option}
                          </span>
                        )}

                        {/* Add-ons list */}
                        {Array.isArray(item.selectedAddOns) && item.selectedAddOns.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.selectedAddOns.map((addon) => (
                              <span 
                                key={addon.id || addon.name} 
                                className="text-[10px] px-1.5 py-0.5 rounded bg-pink-950/40 text-pink-300 border border-pink-900/30 font-medium"
                              >
                                + {addon.name} ({formatCurrency(addon.price, settings?.currencySymbol || '₹')})
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Spice & Instructions */}
                        {item.spiceLevel && (
                          <span className="text-[10px] text-amber-400 font-semibold block mt-0.5">
                            Spice: {item.spiceLevel}
                          </span>
                        )}
                        {item.specialInstructions && (
                          <p className="text-[11px] text-slate-400 italic mt-0.5 line-clamp-1">
                            Note: "{item.specialInstructions}"
                          </p>
                        )}

                        {/* Price & Stepper Row */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60">
                          <span className="font-black text-sm text-pink-400">
                            {formatCurrency(lineTotal, settings?.currencySymbol || '₹')}
                          </span>

                          {/* Stepper */}
                          <div className="flex items-center gap-2 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
                            <button 
                              type="button"
                              onClick={() => updateCartQuantity(item.cartId, -1)}
                              className="w-5 h-5 flex items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-bold text-xs w-5 text-center text-white">
                              {item.quantity}
                            </span>
                            <button 
                              type="button"
                              onClick={() => updateCartQuantity(item.cartId, 1)}
                              className="w-5 h-5 flex items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Upsell Row: "Complete your order" */}
              {upsellItems.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    <span>Complete your order</span>
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
                    {upsellItems.map((comp) => (
                      <div 
                        key={comp.id}
                        className="w-36 shrink-0 bg-slate-900/80 rounded-2xl p-2.5 border border-slate-800 flex flex-col justify-between"
                      >
                        <div className="w-full h-20 rounded-xl overflow-hidden bg-slate-800 mb-2 relative">
                          <img 
                            src={comp.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300'} 
                            alt={comp.name} 
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute top-1 left-1 bg-black/60 rounded-sm p-0.5">
                            <DietaryMarker type={comp.veg || 'veg'} size={12} />
                          </div>
                        </div>
                        <h5 className="text-[11px] font-bold text-white truncate leading-tight mb-1">
                          {comp.name}
                        </h5>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-[11px] font-black text-pink-400">
                            {formatCurrency(comp.price, settings?.currencySymbol || '₹')}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(comp)}
                            className="p-1 px-2 rounded-lg bg-pink-600/30 hover:bg-pink-600 text-pink-300 hover:text-white text-[10px] font-bold transition-all flex items-center gap-0.5 cursor-pointer"
                            aria-label={`Add ${comp.name} to order`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Promo Code / Coupon Section */}
              <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                    <Tag className="w-3.5 h-3.5 text-pink-400" />
                    <span>Offers & Promo Codes</span>
                  </div>
                  {appliedCoupon && (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {!appliedCoupon ? (
                  <>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="Enter coupon (e.g. WELCOME50)"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleApplyCoupon();
                        }}
                        className="flex-1 px-3 py-2 text-xs uppercase bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        disabled={!couponInput.trim()}
                        className="px-4 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>

                    {/* Quick suggestion chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {suggestedPromos.map((promo) => (
                        <button
                          key={promo.code}
                          type="button"
                          onClick={() => handleApplyCoupon(promo.code)}
                          className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-pink-900/30 border border-slate-700/60 hover:border-pink-500/40 text-[10px] font-mono font-bold text-slate-300 hover:text-pink-300 transition-colors cursor-pointer"
                        >
                          {promo.code}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                      <div>
                        <span className="font-mono font-black text-emerald-400">{appliedCoupon}</span>
                        <p className="text-[10px] text-slate-400">
                          {couponFeedback?.message || 'Discount applied'}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-400">
                      -₹{bill.discount}
                    </span>
                  </div>
                )}

                {couponFeedback && !appliedCoupon && !couponFeedback.success && (
                  <div className="flex items-center gap-1.5 text-[11px] text-red-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{couponFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* Pure Recalculated Bill Breakdown */}
              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Bill Details</h4>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Item Total</span>
                    <span className="font-medium text-white">
                      {formatCurrency(bill.itemTotal, settings?.currencySymbol || '₹')}
                    </span>
                  </div>

                  {bill.discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Coupon Discount ({appliedCoupon})</span>
                      <span className="font-bold">
                        -{formatCurrency(bill.discount, settings?.currencySymbol || '₹')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-300">
                    <span className="flex items-center gap-1">
                      <span>GST (5%)</span>
                      <span className="text-[10px] text-slate-500">
                        ({bill.isTaxInclusive ? 'Inclusive' : 'Added'})
                      </span>
                    </span>
                    <span className="font-medium text-white">
                      {bill.isTaxInclusive 
                        ? 'Incl.' 
                        : formatCurrency(bill.gst, settings?.currencySymbol || '₹')}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                      To Pay
                    </span>
                    {bill.discount > 0 && (
                      <span className="text-[11px] font-semibold text-emerald-400">
                        You save ₹{bill.discount}
                      </span>
                    )}
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-white font-heading tracking-tight">
                    {formatCurrency(bill.grandTotal, settings?.currencySymbol || '₹')}
                  </span>
                </div>
              </div>

              {/* Wait Time & Cancellation Policy Note */}
              <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/60 text-[11px] text-slate-400 flex items-start gap-2 leading-relaxed">
                <Clock className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-slate-300">Freshly prepared to order.</strong> Minimum wait time 15-20 minutes. Orders cannot be cancelled once preparation begins.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Proceed to Checkout CTA */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md shrink-0">
            <button 
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full flex items-center justify-between py-3.5 px-5 bg-pink-600 hover:bg-pink-500 active:scale-98 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl shadow-pink-600/30 transition-all cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <div className="flex items-center gap-2">
                <span>{formatCurrency(bill.grandTotal, settings?.currencySymbol || '₹')}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        menuCatalog={menuItems || []}
        settings={settings || {}}
        activeOffers={offers || []}
        appliedCoupon={appliedCoupon}
        onOrderSuccess={handleOrderSuccess}
      />
    </>
  );
};

export default CartDrawer;
