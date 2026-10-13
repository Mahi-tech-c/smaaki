import React, { useState, useEffect, useMemo, useContext } from 'react';
import { 
  Clock, 
  Utensils, 
  ChefHat, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search, 
  ArrowRight, 
  Phone, 
  User, 
  Flame, 
  Sparkles, 
  RefreshCw, 
  ShoppingBag,
  Bike,
  Check,
  Receipt,
  FileText
} from 'lucide-react';
import { db, COLLECTIONS } from '../../firebase';
import { collection, query, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { formatCurrency } from '../../utils/helpers';
import { AppContext } from '../../context/AppContext';
import { soundManager } from '../../utils/sound';

const STATUS_COLUMNS = [
  { id: 'Received', label: 'New Orders', icon: Flame, color: 'border-pink-500 text-pink-600 bg-pink-50/50' },
  { id: 'Preparing', label: 'Preparing', icon: ChefHat, color: 'border-amber-500 text-amber-600 bg-amber-50/50' },
  { id: 'Ready', label: 'Ready to Serve', icon: Sparkles, color: 'border-blue-500 text-blue-600 bg-blue-50/50' },
  { id: 'Completed', label: 'Completed', icon: CheckCircle2, color: 'border-emerald-500 text-emerald-600 bg-emerald-50/50' }
];

export const AdminKDS = () => {
  const { settings } = useContext(AppContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'dine-in' | 'takeaway' | 'delivery'
  const [updatingId, setUpdatingId] = useState(null);

  // Live Firestore Orders Listener
  useEffect(() => {
    setLoading(true);
    let unsubscribe = () => {};
    try {
      const ordersRef = collection(db, COLLECTIONS?.orders || 'orders');
      const q = query(ordersRef);
      unsubscribe = onSnapshot(q, (snapshot) => {
        const orderList = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));

        // Sort descending by creation date
        orderList.sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });

        setOrders(orderList);
        setLoading(false);
      }, (err) => {
        console.warn('KDS orders listener err:', err);
        setLoading(false);
      });
    } catch (e) {
      console.warn('KDS listener setup failed:', e);
      setLoading(false);
    }
    return () => unsubscribe();
  }, []);

  // Update Order Status Handler
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      soundManager.playTapSound();
      const orderRef = doc(db, COLLECTIONS?.orders || 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...(newStatus === 'Completed' ? { completedAt: serverTimestamp() } : {}),
        ...(newStatus === 'Preparing' ? { startedCookingAt: serverTimestamp() } : {}),
        ...(newStatus === 'Ready' ? { markedReadyAt: serverTimestamp() } : {})
      });
    } catch (err) {
      console.error('Failed to update order status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Toggle Payment Status
  const handleTogglePayment = async (orderId, currentPaymentStatus) => {
    try {
      setUpdatingId(orderId);
      soundManager.playTapSound();
      const orderRef = doc(db, COLLECTIONS?.orders || 'orders', orderId);
      const nextStatus = currentPaymentStatus === 'PAID' ? 'PENDING' : 'PAID';
      await updateDoc(orderRef, {
        paymentStatus: nextStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Failed to toggle payment status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Thermal Receipt / KOT Bill Printer Generator
  const handlePrintReceipt = (order, isKOT = false) => {
    soundManager.playTapSound();
    const currency = settings?.currencySymbol || '₹';
    const restName = settings?.restaurantName || 'Smaakenzzoo';
    const address = settings?.address || 'Shop #4, Near NIT Main Gate, Kazipet Road, Hanamkonda, Warangal, Telangana 506004';
    const phone = settings?.phone || '+91 91212 34567';
    const fssai = settings?.fssaiNumber || '23624028000123';
    const gstNo = settings?.gstNumber || '36AABCU9603R1ZM';

    const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : new Date().toLocaleString('en-IN');
    const items = order.items || [];

    const itemsHtml = items.map(item => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; font-family: monospace;">
        <div style="flex: 1; padding-right: 8px;">
          <span style="font-weight: 700;">${item.quantity}x</span>
          <span style="font-weight: 600;"> ${item.name}</span>
          ${item.selectedOption ? `<div style="font-size: 11px; color: #444; margin-left: 18px;">Variant: ${item.selectedOption.name}</div>` : ''}
          ${Array.isArray(item.selectedAddons) && item.selectedAddons.length > 0 ? `
            <div style="font-size: 11px; color: #555; margin-left: 18px;">
              + ${item.selectedAddons.map(a => a.name).join(', ')}
            </div>
          ` : ''}
          ${item.specialInstructions ? `
            <div style="font-size: 11px; color: #b91c1c; margin-left: 18px; font-style: italic;">
              Note: ${item.specialInstructions}
            </div>
          ` : ''}
        </div>
        ${!isKOT ? `
          <div style="font-weight: 700; white-space: nowrap;">
            ${currency}${item.lineTotal || (item.price * item.quantity)}
          </div>
        ` : ''}
      </div>
    `).join('');

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${isKOT ? 'KOT' : 'BILL'} - ${order.orderId}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body {
              font-family: 'Courier New', Courier, monospace, system-ui;
              width: 76mm;
              margin: 0 auto;
              padding: 10px 4px;
              color: #000;
              background: #fff;
              font-size: 12px;
              line-height: 1.3;
            }
            .center { text-align: center; }
            .bold { font-weight: 800; }
            .border-top { border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; }
            .border-bottom { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
            .double-bottom { border-bottom: 3px double #000; padding-bottom: 6px; margin-bottom: 6px; }
            .flex-row { display: flex; justify-content: space-between; }
            .pill { display: inline-block; padding: 2px 8px; border: 1px solid #000; font-weight: 800; font-size: 14px; margin: 4px 0; }
          </style>
        </head>
        <body>
          <div class="center">
            <h2 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 1px;">${restName.toUpperCase()}</h2>
            <div style="font-size: 11px; margin-top: 2px;">Artisanal Cafe & Roastery</div>
            <div style="font-size: 10px; margin-top: 3px;">${address}</div>
            <div style="font-size: 10px;">Tel: ${phone}</div>
            <div style="font-size: 10px; margin-top: 2px;">FSSAI: ${fssai} | GSTIN: ${gstNo}</div>
            
            <div style="margin: 8px 0;">
              <span class="pill">${isKOT ? '*** KITCHEN ORDER TICKET (KOT) ***' : 'TAX INVOICE / CASH BILL'}</span>
            </div>
          </div>

          <div class="border-top border-bottom" style="font-size: 11px;">
            <div class="flex-row">
              <span><b>Order ID:</b> #${order.orderId}</span>
              <span><b>Type:</b> ${(order.orderType || 'Dine-In').toUpperCase()}</span>
            </div>
            ${order.tableNumber ? `
              <div class="flex-row" style="font-size: 13px; margin: 2px 0;">
                <span class="bold">TABLE NUMBER:</span>
                <span class="bold" style="font-size: 15px;">TABLE ${order.tableNumber}</span>
              </div>
            ` : ''}
            <div class="flex-row">
              <span><b>Date:</b> ${orderDate}</span>
            </div>
            ${order.customerName ? `
              <div class="flex-row">
                <span><b>Customer:</b> ${order.customerName}</span>
                <span>${order.customerPhone || ''}</span>
              </div>
            ` : ''}
          </div>

          <div style="margin: 8px 0;">
            <div class="flex-row bold border-bottom" style="font-size: 11px;">
              <span>QTY & ITEM DESCRIPTION</span>
              ${!isKOT ? `<span>AMOUNT</span>` : ''}
            </div>
            ${itemsHtml}
          </div>

          ${order.orderNotes ? `
            <div class="border-top border-bottom" style="font-size: 11px; font-weight: bold; background: #eee; padding: 4px;">
              SPECIAL COOKING INSTRUCTIONS: ${order.orderNotes}
            </div>
          ` : ''}

          ${!isKOT ? `
            <div class="border-top" style="font-size: 12px; line-height: 1.4;">
              <div class="flex-row">
                <span>Items Subtotal:</span>
                <span>${currency}${(order.subtotal || 0).toFixed(2)}</span>
              </div>
              ${order.packagingFee > 0 ? `
                <div class="flex-row">
                  <span>Packaging Charges:</span>
                  <span>${currency}${(order.packagingFee || 0).toFixed(2)}</span>
                </div>
              ` : ''}
              ${order.deliveryFee > 0 ? `
                <div class="flex-row">
                  <span>Delivery Charges:</span>
                  <span>${currency}${(order.deliveryFee || 0).toFixed(2)}</span>
                </div>
              ` : ''}
              ${order.discountAmount > 0 ? `
                <div class="flex-row" style="font-weight: bold;">
                  <span>Discount (${order.couponCode || 'PROMO'}):</span>
                  <span>-${currency}${(order.discountAmount || 0).toFixed(2)}</span>
                </div>
              ` : ''}
              <div class="flex-row">
                <span>GST (5% SGST 2.5% + CGST 2.5%):</span>
                <span>${currency}${(order.gstAmount || 0).toFixed(2)}</span>
              </div>
              
              <div class="flex-row bold double-bottom" style="font-size: 16px; margin-top: 4px; padding-top: 4px; border-top: 1px dashed #000;">
                <span>GRAND TOTAL:</span>
                <span>${currency}${(order.grandTotal || 0).toFixed(2)}</span>
              </div>

              <div class="flex-row bold" style="font-size: 11px; margin-top: 4px;">
                <span>PAYMENT STATUS:</span>
                <span>${(order.paymentStatus || 'PENDING').toUpperCase()} (${(order.paymentMethod || 'COUNTER').toUpperCase()})</span>
              </div>
            </div>

            <div class="center border-top" style="margin-top: 10px; font-size: 11px;">
              <p style="margin: 3px 0; font-weight: bold;">Thank You for Visiting Smaakenzzoo!</p>
              <p style="margin: 2px 0;">Flourishing Hearts, Blooming Dreams 🌸</p>
              <p style="margin: 2px 0; font-size: 9px;">Goods once sold will not be taken back. Keep bill for tax records.</p>
            </div>
          ` : `
            <div class="center border-top" style="margin-top: 10px; font-size: 11px;">
              <p style="margin: 2px 0; font-weight: bold;">--- END OF KITCHEN TICKET ---</p>
            </div>
          `}
          
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    const printWin = window.open('', '_blank', 'width=450,height=600');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printHtml);
      printWin.document.close();
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Type filter
      if (filterType !== 'all') {
        const orderType = (o.orderType || '').toLowerCase();
        if (filterType === 'dine-in' && !orderType.includes('dine')) return false;
        if (filterType === 'takeaway' && !orderType.includes('takeaway')) return false;
        if (filterType === 'delivery' && !orderType.includes('delivery')) return false;
      }
      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const idMatch = String(o.orderId || o.id || '').toLowerCase().includes(term);
        const nameMatch = String(o.customerName || '').toLowerCase().includes(term);
        const phoneMatch = String(o.customerPhone || '').toLowerCase().includes(term);
        const tableMatch = String(o.tableNumber || '').toLowerCase().includes(term);
        return idMatch || nameMatch || phoneMatch || tableMatch;
      }
      return true;
    });
  }, [orders, filterType, searchTerm]);

  // Metric counts
  const metrics = useMemo(() => {
    const received = orders.filter(o => !o.status || o.status.toLowerCase() === 'received' || o.status.toLowerCase() === 'pending').length;
    const preparing = orders.filter(o => (o.status || '').toLowerCase() === 'preparing').length;
    const ready = orders.filter(o => (o.status || '').toLowerCase() === 'ready').length;
    const activeTotal = received + preparing + ready;
    const todayRevenue = orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((acc, curr) => acc + (Number(curr.grandTotal) || 0), 0);

    return { received, preparing, ready, activeTotal, todayRevenue };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 bg-white rounded-3xl border border-pink-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active in Kitchen</span>
            <span className="text-2xl sm:text-3xl font-black text-pink-900 font-mono">{metrics.activeTotal}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-pink-100/60 text-pink-600 flex items-center justify-center font-bold">
            <ChefHat size={24} />
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-3xl border border-pink-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">New Orders</span>
            <span className="text-2xl sm:text-3xl font-black text-pink-600 font-mono">{metrics.received}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold animate-pulse">
            <Flame size={24} />
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-3xl border border-pink-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Ready to Plate</span>
            <span className="text-2xl sm:text-3xl font-black text-blue-600 font-mono">{metrics.ready}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Sparkles size={24} />
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-3xl border border-pink-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Bookings</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
              {formatCurrency(metrics.todayRevenue, settings?.currencySymbol || '₹')}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Receipt size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-pink-100 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300" size={18} />
          <input 
            type="text" 
            placeholder="Search by ID, Table, Customer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-pink-50/50 border border-pink-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-pink-900 placeholder:text-pink-300 text-sm font-semibold"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-pink-600 font-bold animate-pulse">
              <RefreshCw size={13} className="animate-spin" />
              <span className="hidden sm:inline">Syncing Orders...</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'dine-in', label: '🍽️ Dine-In' },
              { id: 'takeaway', label: '🛍️ Takeaway' },
              { id: 'delivery', label: '🛵 Delivery' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filterType === f.id
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {STATUS_COLUMNS.map(col => {
          const Icon = col.icon;
          const colOrders = filteredOrders.filter(o => {
            const st = (o.status || 'Received').toLowerCase();
            if (col.id === 'Received') return st === 'received' || st === 'pending';
            if (col.id === 'Preparing') return st === 'preparing';
            if (col.id === 'Ready') return st === 'ready';
            if (col.id === 'Completed') return st === 'completed' || st === 'served';
            return false;
          });

          return (
            <div key={col.id} className="flex flex-col bg-slate-50/70 rounded-3xl p-4 border border-slate-200/80 shadow-sm">
              {/* Lane Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-xl border ${col.color}`}>
                    <Icon size={16} />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-800">{col.label}</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white border border-slate-200 text-slate-700 shadow-2xs">
                  {colOrders.length}
                </span>
              </div>

              {/* Lane Order Cards */}
              <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                {colOrders.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 italic">
                    No orders in {col.label.toLowerCase()}
                  </div>
                ) : (
                  colOrders.map(order => (
                    <div 
                      key={order.id} 
                      className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative space-y-3"
                    >
                      {/* Order Header: ID, Table / Type, Time */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-slate-900 font-mono">
                              #{order.orderId || order.id?.slice(0, 7)}
                            </span>
                            {order.tableNumber && (
                              <span className="px-2 py-0.5 rounded-md bg-pink-100 text-pink-700 font-black text-[11px] border border-pink-200">
                                T-{order.tableNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Clock size={12} />
                            {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </p>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          order.orderType === 'dine-in' ? 'bg-amber-100 text-amber-800' :
                          order.orderType === 'takeaway' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {order.orderType || 'Dine-In'}
                        </span>
                      </div>

                      {/* Items List */}
                      <div className="space-y-1.5 py-2 border-y border-slate-100 text-xs">
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="flex items-start justify-between gap-2">
                            <div className="flex-1 text-slate-800">
                              <span className="font-extrabold text-pink-600 font-mono">{item.quantity}x</span>
                              <span className="font-semibold ml-1.5">{item.name}</span>
                              {item.selectedOption && (
                                <span className="text-[10px] text-slate-400 block ml-6">
                                  ({item.selectedOption.name})
                                </span>
                              )}
                              {Array.isArray(item.selectedAddons) && item.selectedAddons.length > 0 && (
                                <span className="text-[10px] text-pink-500 block ml-6">
                                  + {item.selectedAddons.map(a => a.name).join(', ')}
                                </span>
                              )}
                              {item.specialInstructions && (
                                <span className="text-[10px] text-red-600 italic block ml-6 font-medium">
                                  "{item.specialInstructions}"
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 font-mono shrink-0">
                              {formatCurrency(item.lineTotal || (item.price * item.quantity), settings?.currencySymbol || '₹')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Special Cooking Note for Order */}
                      {order.orderNotes && (
                        <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] font-medium">
                          <span className="font-bold">Chef Note:</span> {order.orderNotes}
                        </div>
                      )}

                      {/* Customer Info & Grand Total */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div>
                          {order.customerName && (
                            <span className="text-slate-700 font-bold block">{order.customerName}</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleTogglePayment(order.id, order.paymentStatus)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                              order.paymentStatus === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                            }`}
                            title="Click to toggle payment status"
                          >
                            {order.paymentStatus === 'PAID' ? '✓ PAID' : '⚠ UNPAID'}
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Grand Total</span>
                          <span className="font-extrabold text-slate-900 font-mono text-sm">
                            {formatCurrency(order.grandTotal, settings?.currencySymbol || '₹')}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons: Advance, Print Bill, Print KOT, Cancel */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                        {/* Print KOT */}
                        <button
                          type="button"
                          onClick={() => handlePrintReceipt(order, true)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                          title="Print Kitchen Order Ticket (KOT)"
                        >
                          <FileText size={14} />
                        </button>

                        {/* Print Full Customer Bill */}
                        <button
                          type="button"
                          onClick={() => handlePrintReceipt(order, false)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                          title="Print Customer Bill Receipt"
                        >
                          <Printer size={14} />
                        </button>

                        {/* Status Transition Action Button */}
                        {col.id === 'Received' && (
                          <button
                            type="button"
                            disabled={updatingId === order.id}
                            onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                            className="flex-1 py-2 px-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <span>Start Cooking</span>
                            <ArrowRight size={14} />
                          </button>
                        )}

                        {col.id === 'Preparing' && (
                          <button
                            type="button"
                            disabled={updatingId === order.id}
                            onClick={() => handleUpdateStatus(order.id, 'Ready')}
                            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <span>Mark Ready</span>
                            <Sparkles size={14} />
                          </button>
                        )}

                        {col.id === 'Ready' && (
                          <button
                            type="button"
                            disabled={updatingId === order.id}
                            onClick={() => handleUpdateStatus(order.id, 'Completed')}
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <span>Complete</span>
                            <Check size={14} />
                          </button>
                        )}

                        {col.id === 'Completed' && (
                          <div className="flex-1 text-center py-1.5 text-[11px] font-bold text-emerald-600 flex items-center justify-center gap-1">
                            <CheckCircle2 size={13} /> Settled
                          </div>
                        )}

                        {/* Cancel Button */}
                        {col.id !== 'Completed' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to cancel order #${order.orderId}?`)) {
                                handleUpdateStatus(order.id, 'Cancelled');
                              }
                            }}
                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                            title="Cancel Order"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminKDS;
