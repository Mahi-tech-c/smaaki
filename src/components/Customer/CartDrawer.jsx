import React, { useContext, useState, useMemo, useEffect } from 'react';
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

  // Close drawer on Escape key
  useEffect(() => {
    if (!isCartOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isCheckoutOpen) {
        setIsCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, isCheckoutOpen, setIsCartOpen]);

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
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white text-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col border-l border-gray-200 ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 bg-white/95 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-50 text-pink-600 rounded-2xl border border-pink-100">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 font-heading tracking-tight">Your Bag</h2>
              <p className="text-xs font-semibold text-gray-500">
                {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} selected
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button 
                type="button"
                onClick={clearCart}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                title="Clear entire cart"
                aria-label="Clear bag"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button 
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar bg-gray-50/50">
          {cart.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
              <div className="w-20 h-20 rounded-3xl bg-pink-50 border border-pink-100 shadow-lg shadow-pink-500/10 flex items-center justify-center text-pink-500">
                <ShoppingBag className="w-9 h-9 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900 font-heading">Your bag is empty</h3>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
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
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500 pb-1">
                  <span>Ordered Items</span>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="text-pink-600 hover:text-pink-700 font-bold transition-colors cursor-pointer"
                  >
                    + Add more items
                  </button>
                </div>

                {cart.map((item) => {
                  const lineTotal = (Number(item.price) || 0) * item.quantity;
                  return (
                    <div 
                      key={item.cartId} 
                      className="flex gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 items-start hover:border-gray-300 transition-colors shadow-xs"
                    >
                      {/* Thumbnail with Dietary Marker */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                        <img 
                          src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300'} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                        />
                        <div className="absolute top-1 left-1 bg-white/80 rounded-sm p-0.5 backdrop-blur-xs shadow-xs">
                          <DietaryMarker type={item.veg || 'veg'} size={14} />
                        </div>
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-bold text-gray-900 text-sm truncate leading-snug">
                            {item.baseName || item.name}
                          </h4>
                          <button 
                            type="button"
                            onClick={() => removeFromCart(item.cartId)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1 -mr-1"
                            title="Remove item"
                            aria-label={`Remove ${item.name}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Variant Tag */}
                        {item.option && (
                          <span className="inline-block px-2 py-0.5 mt-1 rounded bg-pink-50 text-[10px] font-semibold text-pink-700 border border-pink-100">
                            {item.option}
                          </span>
                        )}

                        {/* Add-ons list */}
                        {Array.isArray(item.selectedAddOns) && item.selectedAddOns.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.selectedAddOns.map((addon) => (
                              <span 
                                key={addon.id || addon.name} 
                                className="text-[10px] px-1.5 py-0.5 rounded bg-pink-50 text-pink-700 border border-pink-100 font-medium"
                              >
                                + {addon.name} ({formatCurrency(addon.price, settings?.currencySymbol || '₹')})
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Spice & Instructions */}
                        {item.spiceLevel && (
                          <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
                            Spice: {item.spiceLevel}
                          </span>
                        )}
                        {item.specialInstructions && (
                          <p className="text-[11px] text-gray-500 italic mt-0.5 line-clamp-1">
                            Note: "{item.specialInstructions}"
                          </p>
                        )}

                        {/* Price & Stepper Row */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                          <span className="font-black text-sm text-pink-600">
                            {formatCurrency(lineTotal, settings?.currencySymbol || '₹')}
                          </span>

                          {/* Stepper */}
                          <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-xl border border-gray-200">
                            <button 
                              type="button"
                              onClick={() => updateCartQuantity(item.cartId, -1)}
                              className="w-6 h-6 flex items-center justify-center rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-bold text-xs w-5 text-center text-gray-900">
                              {item.quantity}
                            </span>
                            <button 
                              type="button"
                              onClick={() => updateCartQuantity(item.cartId, 1)}
                              className="w-6 h-6 flex items-center justify-center rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
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
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                    <span>Complete your order</span>
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
                    {upsellItems.map((comp) => (
                      <div 
                        key={comp.id}
                        className="w-36 shrink-0 bg-white rounded-2xl p-2.5 border border-gray-200 flex flex-col justify-between shadow-xs"
                      >
                        <div className="w-full h-20 rounded-xl overflow-hidden bg-gray-100 mb-2 relative">
                          <img 
                            src={comp.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300'} 
                            alt={comp.name} 
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute top-1 left-1 bg-white/80 rounded-sm p-0.5 shadow-xs">
                            <DietaryMarker type={comp.veg || 'veg'} size={12} />
                          </div>
                        </div>
                        <h5 className="text-[11px] font-bold text-gray-900 truncate leading-tight mb-1">
                          {comp.name}
                        </h5>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-[11px] font-black text-pink-600">
                            {formatCurrency(comp.price, settings?.currencySymbol || '₹')}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(comp)}
                            className="p-1 px-2 rounded-lg bg-pink-50 hover:bg-pink-600 text-pink-600 hover:text-white text-[10px] font-bold transition-all flex items-center gap-0.5 cursor-pointer border border-pink-200 hover:border-transparent"
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
              <div className="bg-white rounded-2xl p-3.5 border border-gray-200 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                    <Tag className="w-3.5 h-3.5 text-pink-500" />
                    <span>Offers & Promo Codes</span>
                  </div>
                  {appliedCoupon && (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors cursor-pointer"
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
                        className="flex-1 px-3 py-2 text-xs uppercase bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-pink-500 font-mono"
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
                          className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-pink-50 border border-gray-200 hover:border-pink-300 text-[10px] font-mono font-bold text-gray-700 hover:text-pink-600 transition-colors cursor-pointer shrink-0"
                        >
                          {promo.code}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                      <div>
                        <span className="font-mono font-black text-emerald-700">{appliedCoupon}</span>
                        <p className="text-[10px] text-gray-500">
                          {couponFeedback?.message || 'Discount applied'}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600">
                      -₹{bill.discount}
                    </span>
                  </div>
                )}

                {couponFeedback && !appliedCoupon && !couponFeedback.success && (
                  <div className="flex items-center gap-1.5 text-[11px] text-red-500">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{couponFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* Pure Recalculated Bill Breakdown */}
              <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-2.5 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Bill Details</h4>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Item Total</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(bill.itemTotal, settings?.currencySymbol || '₹')}
                    </span>
                  </div>

                  {bill.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Coupon Discount ({appliedCoupon})</span>
                      <span className="font-bold">
                        -{formatCurrency(bill.discount, settings?.currencySymbol || '₹')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600">
                    <span className="flex items-center gap-1">
                      <span>GST (5%)</span>
                      <span className="text-[10px] text-gray-400">
                        ({bill.isTaxInclusive ? 'Inclusive' : 'Added'})
                      </span>
                    </span>
                    <span className="font-medium text-gray-900">
                      {bill.isTaxInclusive 
                        ? 'Incl.' 
                        : formatCurrency(bill.gst, settings?.currencySymbol || '₹')}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-black uppercase tracking-wider text-gray-900 block">
                      To Pay
                    </span>
                    {bill.discount > 0 && (
                      <span className="text-[11px] font-semibold text-emerald-600">
                        You save ₹{bill.discount}
                      </span>
                    )}
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-gray-900 font-heading tracking-tight">
                    {formatCurrency(bill.grandTotal, settings?.currencySymbol || '₹')}
                  </span>
                </div>
              </div>

              {/* Wait Time & Cancellation Policy Note */}
              <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-800 flex items-start gap-2 leading-relaxed">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-amber-900">Freshly prepared to order.</strong> Minimum wait time 15-20 minutes. Orders cannot be cancelled once preparation begins.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Proceed to Checkout CTA */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-gray-200 bg-white/95 backdrop-blur-md shrink-0">
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
