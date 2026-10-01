import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { X, Minus, Plus, ShoppingBag, Send, Trash2, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const CartDrawer = () => {
  const { 
    cart, 
    updateCartQuantity, 
    removeFromCart, 
    clearCart, 
    cartTotal, 
    cartItemCount,
    isCartOpen, 
    setIsCartOpen,
    settings 
  } = useContext(AppContext);

  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [orderSent, setOrderSent] = useState(false);

  const handleWhatsAppOrder = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const lines = [
      `*New Order from ${settings.restaurantName || 'Cafe'}* 🌸`,
      customerName ? `*Customer:* ${customerName}` : null,
      tableNumber ? `*Table/Takeaway:* ${tableNumber}` : null,
      `--------------------------------`,
      ...cart.map(item => `• ${item.quantity}x ${item.name} - ${settings.currencySymbol || '₹'}${((Number(item.price) || 0) * item.quantity).toFixed(2)}`),
      `--------------------------------`,
      `*Total:* ${settings.currencySymbol || '₹'}${cartTotal.toFixed(2)}`,
      notes ? `*Special Instructions:* ${notes}` : null,
      `\nSent via Digital Menu`
    ].filter(Boolean);

    const message = lines.join('\n');
    const waNumber = (settings.whatsapp || '').replace(/\D/g, '');
    const url = waNumber 
      ? `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
    setOrderSent(true);
    setTimeout(() => {
      setOrderSent(false);
      clearCart();
      setIsCartOpen(false);
    }, 2000);
  };

  return (
    <>
      {/* Backdrop */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity animate-in fade-in"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[440px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-neutral-950 text-white rounded-xl shadow-xs">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-950 tracking-tight">Your Order</h2>
              <p className="text-xs font-medium text-gray-400">{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} selected</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button 
                onClick={clearCart}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-xl transition-colors"
                title="Clear Cart"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button 
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="Close cart"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {orderSent ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Order Sent via WhatsApp!</h3>
              <p className="text-sm text-gray-500">Your order details have been shared directly with the cafe.</p>
            </div>
          ) : cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-300 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                <ShoppingBag size={30} className="text-gray-300" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Your bag is empty</h3>
              <p className="text-xs text-gray-500 max-w-xs">
                Explore our handcrafted dishes and health-conscious selection to start your order!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div 
                  key={item.cartId} 
                  className="flex gap-3 bg-gray-50/80 p-3 rounded-2xl border border-gray-200/60 items-center"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img 
                      src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300'} 
                      alt={item.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="font-bold text-gray-950 text-sm truncate">{item.name}</h4>
                      <button 
                        onClick={() => removeFromCart(item.cartId)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="text-gray-900 font-bold text-xs mt-0.5">
                      {formatCurrency(item.price, settings.currencySymbol || '₹')}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <button 
                        onClick={() => updateCartQuantity(item.cartId, -1)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg bg-white text-gray-700 shadow-2xs border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-bold text-xs w-6 text-center text-gray-950">{item.quantity}</span>
                      <button 
                        onClick={() => updateCartQuantity(item.cartId, 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg bg-white text-gray-700 shadow-2xs border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                      <span className="ml-auto font-black text-xs text-gray-950">
                        {formatCurrency(item.price * item.quantity, settings.currencySymbol || '₹')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / Order Form */}
        {cart.length > 0 && !orderSent && (
          <div className="border-t border-gray-100 p-5 bg-white space-y-4">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text"
                  placeholder="Your Name (optional)"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-950/10 focus:border-gray-400 focus:outline-none"
                />
                <input 
                  type="text"
                  placeholder="Table No / Takeaway"
                  value={tableNumber}
                  onChange={e => setTableNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-950/10 focus:border-gray-400 focus:outline-none"
                />
              </div>
              <input 
                type="text"
                placeholder="Notes (e.g. less sweet, extra napkins)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-950/10 focus:border-gray-400 focus:outline-none"
              />
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Amount:</span>
              <span className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
                {formatCurrency(cartTotal, settings.currencySymbol || '₹')}
              </span>
            </div>

            <button 
              onClick={handleWhatsAppOrder}
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1fb355] text-white py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm active:scale-[0.98] transition-all"
            >
              <Send size={15} />
              Send Order via WhatsApp
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
