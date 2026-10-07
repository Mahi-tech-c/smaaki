import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  CheckCircle2, 
  ShoppingBag, 
  Phone, 
  User, 
  MapPin, 
  Clock, 
  QrCode, 
  ArrowRight, 
  AlertCircle, 
  CreditCard, 
  Banknote,
  Send,
  Loader2
} from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { recalculateOrderTotals } from '../../utils/pricing';
import { buildUpiUri, getUpiAppLinks } from '../../utils/payment';
import { useToast } from '../ui/Toast';
import { db, COLLECTIONS } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const CheckoutModal = ({
  isOpen,
  onClose,
  cart = [],
  menuCatalog = [],
  settings = {},
  activeOffers = [],
  appliedCoupon = '',
  onOrderSuccess
}) => {
  const { showToast } = useToast();

  // Read table from query params (e.g. ?table=4 from QR scan)
  const initialTable = useMemo(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('table') || '';
    } catch {
      return '';
    }
  }, []);

  // Form State
  const [orderType, setOrderType] = useState(initialTable ? 'dine-in' : 'dine-in'); // 'dine-in' | 'takeaway' | 'delivery'
  const [tableNumber, setTableNumber] = useState(initialTable);
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('smaakenzzoo_name') || '');
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('smaakenzzoo_phone') || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('18:00');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'cash' | 'card'

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [qrTimer, setQrTimer] = useState(600); // 10 minutes timer for QR
  const [formError, setFormError] = useState('');

  // Auto countdown for UPI QR
  useEffect(() => {
    if (!isOpen || paymentMethod !== 'upi') return;
    const interval = setInterval(() => {
      setQrTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, paymentMethod]);

  // Pure recalculation of bill
  const bill = useMemo(() => {
    return recalculateOrderTotals({
      cartItems: cart,
      menuCatalog,
      couponCode: appliedCoupon,
      orderType,
      settings,
      activeOffers
    });
  }, [cart, menuCatalog, appliedCoupon, orderType, settings, activeOffers]);

  if (!isOpen) return null;

  // Format QR timer as MM:SS
  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const upiId = settings.upiId || 'smaakenzzoo@upi';
  const orderIdPreview = `SMK-${Math.floor(100000 + Math.random() * 900000)}`;
  const upiUri = buildUpiUri({
    upiId,
    merchantName: settings.restaurantName || 'Smaakenzzoo Cafe',
    amount: bill.grandTotal,
    orderId: orderIdPreview
  });
  const upiLinks = getUpiAppLinks(upiUri);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!customerName.trim()) {
      setFormError('Please enter your name');
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setFormError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    if (orderType === 'dine-in' && !tableNumber.trim()) {
      setFormError('Please specify your Table Number for Dine-in service');
      return;
    }
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setFormError('Please provide your complete delivery address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save details in local storage for convenience
      localStorage.setItem('smaakenzzoo_name', customerName.trim());
      localStorage.setItem('smaakenzzoo_phone', cleanPhone);

      const newOrder = {
        orderId: orderIdPreview,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        orderType,
        tableNumber: orderType === 'dine-in' ? tableNumber.trim() : null,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : null,
        isScheduled,
        scheduledTime: isScheduled ? scheduledTime : null,
        orderNotes: orderNotes.trim(),
        paymentMethod,
        paymentStatus: paymentMethod === 'upi' ? 'Paid (UPI)' : 'Pay at Counter',
        items: bill.verifiedItems,
        itemCount: bill.itemCount,
        itemTotal: bill.itemTotal,
        discount: bill.discount,
        discountCode: bill.discountCode,
        gst: bill.gst,
        gstRate: bill.gstRate,
        isTaxInclusive: bill.isTaxInclusive,
        packingCharge: bill.packingCharge,
        deliveryFee: bill.deliveryFee,
        grandTotal: bill.grandTotal,
        status: 'Received',
        createdAt: new Date().toISOString()
      };

      // 1. Try to save to Firestore
      try {
        await addDoc(collection(db, COLLECTIONS?.ORDERS || 'orders'), {
          ...newOrder,
          serverTimestamp: serverTimestamp()
        });
      } catch (err) {
        console.warn('Firestore order save fallback to local:', err);
      }

      // 2. Save in recent orders in localStorage for live tracking
      const recent = JSON.parse(localStorage.getItem('smaakenzzoo_recent_orders') || '[]');
      recent.unshift(newOrder);
      localStorage.setItem('smaakenzzoo_recent_orders', JSON.stringify(recent.slice(0, 10)));

      // 3. Optional WhatsApp notification
      if (settings.whatsapp) {
        const waNumber = settings.whatsapp.replace(/\D/g, '');
        const waMsg = `*New Order Placed: #${newOrder.orderId}*\n*Customer:* ${newOrder.customerName} (${newOrder.customerPhone})\n*Type:* ${orderType.toUpperCase()} ${orderType === 'dine-in' ? `(Table ${tableNumber})` : ''}\n*Items:* ${bill.itemCount} items\n*Total:* ₹${bill.grandTotal}\n*Payment:* ${newOrder.paymentStatus}`;
        const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMsg)}`;
        window.open(waUrl, '_blank');
      }

      showToast?.({
        message: `Order #${newOrder.orderId} placed successfully! 🌸`,
        type: 'success'
      });

      setCompletedOrder(newOrder);
      onOrderSuccess?.();
    } catch {
      setFormError('Failed to place order. Please try again or pay at counter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !completedOrder) onClose();
      }}
    >
      <div 
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 text-white max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-250 text-left"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-lg font-bold">
              {completedOrder ? 'Order Confirmed! 🌸' : 'Checkout & Payment'}
            </h3>
            <p className="text-xs text-slate-400">
              {completedOrder ? `Order #${completedOrder.orderId}` : `${bill.itemCount} delicious items in bag`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto space-y-5 custom-scrollbar py-3 flex-1">
          {completedOrder ? (
            /* Order Success View */
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-black text-white font-heading">
                  Thank You, {completedOrder.customerName}!
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Your artisanal treats are being freshly prepared in our kitchen.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Order ID:</span>
                  <span className="font-bold text-pink-400">#{completedOrder.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Order Type:</span>
                  <span className="font-bold text-white uppercase">{completedOrder.orderType}</span>
                </div>
                {completedOrder.tableNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Table Number:</span>
                    <span className="font-bold text-emerald-400">Table {completedOrder.tableNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Status:</span>
                  <span className="font-bold text-white">{completedOrder.paymentStatus}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-700 font-bold text-sm">
                  <span>Grand Total:</span>
                  <span className="text-emerald-400">{formatCurrency(completedOrder.grandTotal, settings?.currencySymbol || '₹')}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 italic">
                Average wait time is 15-20 minutes. You can track this order anytime from the top bar!
              </p>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                Back to Cafe Menu
              </button>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handleSubmitOrder} className="space-y-5">
              {formError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Order Type Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  Service Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'dine-in', label: 'Dine-In', icon: '🍽️' },
                    { id: 'takeaway', label: 'Takeaway', icon: '🛍️' },
                    { id: 'delivery', label: 'Delivery', icon: '🛵' }
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setOrderType(type.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                        orderType === type.id
                          ? 'border-pink-500 bg-pink-500/15 text-white'
                          : 'border-slate-800 bg-slate-850 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-base">{type.icon}</span>
                      <span>{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Number (if Dine-in) */}
              {orderType === 'dine-in' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    Table Number <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g. 4 or Table 4"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-pink-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    Your food will be served warm directly to this table.
                  </p>
                </div>
              )}

              {/* Delivery Address (if Delivery) */}
              {orderType === 'delivery' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    Delivery Address <span className="text-pink-400">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="House/Flat number, Street, Landmark, Warangal"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-500 resize-none"
                  />
                </div>
              )}

              {/* 2. Customer Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    Your Name <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    Phone (10 Digits) <span className="text-pink-400">*</span>
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 bg-slate-800 border border-r-0 border-slate-700 rounded-l-xl text-xs text-slate-400 font-bold">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full px-3.5 py-2.5 rounded-r-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              </div>

              {/* Special Dining Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  Cooking / Dining Note
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Less spicy, serve drinks first..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Schedule for Later */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 bg-slate-900 border-slate-700"
                  />
                  <Clock className="w-3.5 h-3.5 text-pink-400" />
                  <span>Schedule for Later Today</span>
                </label>
                {isScheduled && (
                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Target Time:</span>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                )}
              </div>

              {/* 3. Verified Bill Breakdown */}
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] block border-b border-slate-700/80 pb-1.5">
                  Verified Bill Breakdown
                </span>
                <div className="flex justify-between text-slate-300">
                  <span>Item Total ({bill.itemCount} items):</span>
                  <span>{formatCurrency(bill.itemTotal, settings?.currencySymbol || '₹')}</span>
                </div>
                {bill.discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Coupon Discount ({bill.discountCode}):</span>
                    <span>-{formatCurrency(bill.discount, settings?.currencySymbol || '₹')}</span>
                  </div>
                )}
                {bill.packingCharge > 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Packaging Charge:</span>
                    <span>+{formatCurrency(bill.packingCharge, settings?.currencySymbol || '₹')}</span>
                  </div>
                )}
                {bill.deliveryFee > 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Delivery Fee:</span>
                    <span>+{formatCurrency(bill.deliveryFee, settings?.currencySymbol || '₹')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>GST ({bill.gstRate}% {bill.isTaxInclusive ? 'included' : 'added'}):</span>
                  <span>{formatCurrency(bill.gst, settings?.currencySymbol || '₹')}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-700 font-extrabold text-sm text-white">
                  <span>Grand Total:</span>
                  <span className="text-emerald-400">{formatCurrency(bill.grandTotal, settings?.currencySymbol || '₹')}</span>
                </div>
              </div>

              {/* 4. Payment Method Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  Choose Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      paymentMethod === 'upi'
                        ? 'border-pink-500 bg-pink-500/15 text-white'
                        : 'border-slate-800 bg-slate-850 text-slate-400'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-pink-400" />
                    <span>UPI (Instant)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      paymentMethod === 'cash'
                        ? 'border-pink-500 bg-pink-500/15 text-white'
                        : 'border-slate-800 bg-slate-850 text-slate-400'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-400" />
                    <span>Pay at Counter</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      paymentMethod === 'card'
                        ? 'border-pink-500 bg-pink-500/15 text-white'
                        : 'border-slate-800 bg-slate-850 text-slate-400'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-sky-400" />
                    <span>Card / POS</span>
                  </button>
                </div>
              </div>

              {/* Mobile UPI Direct Apps (if UPI selected) */}
              {paymentMethod === 'upi' && (
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">Pay via UPI Apps (Mobile)</span>
                    <span className="text-[10px] text-pink-400 font-bold tabular-nums">
                      QR Expires in {formatTimer(qrTimer)}
                    </span>
                  </div>

                  {/* 1-Tap UPI Intent Apps on Mobile */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {upiLinks.map((app, i) => (
                      <a
                        key={i}
                        href={app.scheme}
                        className={`p-2 rounded-xl text-center text-[11px] font-black uppercase tracking-wider transition-transform active:scale-95 shadow-sm block ${app.color}`}
                      >
                        {app.name}
                      </a>
                    ))}
                  </div>

                  <p className="text-[10px] text-slate-400">
                    UPI ID: <strong className="text-slate-300">{upiId}</strong>
                  </p>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-5 rounded-2xl bg-pink-600 hover:bg-pink-700 active:scale-98 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-pink-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Place Order • {formatCurrency(bill.grandTotal, settings?.currencySymbol || '₹')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
