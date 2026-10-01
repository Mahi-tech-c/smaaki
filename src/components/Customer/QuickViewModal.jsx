import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Plus, Minus, ShoppingBag, Check, Camera, ShieldCheck, Sparkles, CheckCircle2, Copy, ExternalLink, QrCode } from 'lucide-react';
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
  // Top-level hook declarations (MUST run unconditionally on every render)
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [purchaseMode, setPurchaseMode] = useState('dish'); // 'dish' | 'license'
  const [licenseAdded, setLicenseAdded] = useState(false);

  // Dedicated Digital License Checkout State
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerCompany, setBuyerCompany] = useState('');
  const [licenseOrderSent, setLicenseOrderSent] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    setSelectedVariantIndex(0);
    setPurchaseMode('dish');
    setLicenseAdded(false);
    setLicenseOrderSent(false);
    setCopiedUpi(false);
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

  // If no item is selected, render nothing
  if (!item) return null;

  const hasVariants = Boolean(item.options && item.options.length > 0);
  const currentVariant = hasVariants ? item.options[selectedVariantIndex] : null;
  const activePrice = currentVariant ? currentVariant.price : item.price;
  const activeCartId = currentVariant ? `${item.id}-${currentVariant.title}` : String(item.id);

  const cartEntry = (cart || []).find(c => c.cartId === activeCartId);
  const inCartQty = cartEntry ? cartEntry.quantity : 0;
  const licensePrice = "99.00";
  const upiId = settings.upiId || '9032578532@ybl';
  const payeeName = settings.restaurantName || 'Smaakenzzoo';
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${licensePrice}&cu=INR&tn=${encodeURIComponent(`Image License #${item.id}`)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const isNonVeg = /chicken|egg|fish|meat|wings|keivs|kievs|bacon|bbq/i.test(
    `${item.name} ${item.category} ${item.description || ''}`
  );
  const cleanDescription = sanitizeDescription(item.description);

  // Dedicated Digital Image License Payment Handler (Completely separate from food cart)
  const handleBuyImageLicense = (e) => {
    e?.preventDefault();
    if (!buyerName.trim() && !buyerEmail.trim()) {
      alert('Please enter your name and email to receive the 4K high-res master file.');
      return;
    }

    const licenseRef = `LIC-${Date.now().toString().slice(-6)}`;
    const lines = [
      `📸 *COMMERCIAL PHOTO LICENSE ORDER* 📜`,
      `*Order Ref:* #${licenseRef}`,
      `----------------------------------------`,
      `• *Asset:* ${item.name}`,
      `• *Category:* ${item.category}`,
      `• *Resolution:* Ultra HD 4K (3840×2160, 300 DPI Master)`,
      `• *License Rights:* Commercial Royalty-Free Reproduction`,
      `• *License Fee:* ${settings.currencySymbol || '₹'}${licensePrice}`,
      `----------------------------------------`,
      `*Buyer / Licensee:* ${buyerName.trim() || 'Media Buyer'}`,
      buyerCompany.trim() ? `*Company / Agency:* ${buyerCompany.trim()}` : null,
      buyerEmail.trim() ? `*Deliver 4K Master To:* ${buyerEmail.trim()}` : null,
      `----------------------------------------`,
      `Please provide UPI / Payment QR code for instant license activation and uncompressed 4K master asset link.`
    ].filter(Boolean);

    const message = lines.join('\n');
    const waNumber = (settings.whatsapp || '').replace(/\D/g, '');
    const url = waNumber 
      ? `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
    setLicenseOrderSent(true);
    setTimeout(() => {
      setLicenseOrderSent(false);
    }, 5000);
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        // Only close if clicking directly on the backdrop container
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Modal Dialog Stage */}
      <div 
        className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[92dvh] sm:max-h-[90vh] z-10 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Image Header with Protected Assets */}
        <div 
          className="relative w-full h-48 xs:h-56 sm:h-64 bg-gray-100 overflow-hidden shrink-0 select-none"
          onContextMenu={(e) => e.preventDefault()}
        >
          <img 
            src={item.image || FALLBACK_FOOD_IMAGE} 
            alt={item.name} 
            onError={(e) => {
              e.currentTarget.src = FALLBACK_FOOD_IMAGE;
            }}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-full object-cover select-none pointer-events-none" 
          />

          {/* Close Modal Button */}
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 sm:w-9 sm:h-9 bg-white/95 hover:bg-white text-gray-900 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer z-20"
            aria-label="Close modal"
          >
            <X size={17} className="stroke-[2.5]" />
          </button>
          
          {/* Department / Category Pill */}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-gray-900 shadow-sm border border-gray-200">
            {item.category}
          </div>

          {/* Protected Digital Asset Tag */}
          <div className="absolute top-3 left-3 bg-gray-950/85 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5">
            <Camera size={12} className="text-emerald-400" />
            <span>Protected HD Asset</span>
          </div>

          {/* Watermark Protection Overlay */}
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-[9px] font-bold text-white/90 px-2 py-0.5 rounded-md pointer-events-none uppercase tracking-wider">
            © Smaakenzzoo
          </div>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Diet Status & Dual-Mode Switcher */}
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
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

            {/* Quick Switcher: Food Dish vs Buy Image License */}
            <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setPurchaseMode('dish')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  purchaseMode === 'dish'
                    ? 'bg-white text-gray-950 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                🍽️ Menu Item
              </button>
              <button
                type="button"
                onClick={() => setPurchaseMode('license')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  purchaseMode === 'license'
                    ? 'bg-gray-950 text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Camera size={13} className={purchaseMode === 'license' ? 'text-emerald-400' : ''} />
                <span>Buy Image</span>
              </button>
            </div>
          </div>

          {/* Product Title */}
          <h2 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight leading-tight">
            {item.name}
          </h2>

          {purchaseMode === 'dish' ? (
            /* ========================================= */
            /* MODE 1: DISH ORDERING & HEALTH PROFILE    */
            /* ========================================= */
            <div className="space-y-4">
              {/* Macronutrient Dashboard */}
              {(item.protein || item.calories || item.fitnessTag) && (
                <div className="bg-gray-950 text-white rounded-2xl p-4 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Nutritional Breakdown
                    </span>
                    {item.fitnessTag && (
                      <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {item.fitnessTag}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block mb-0.5">Protein</span>
                      <span className="text-base sm:text-lg font-black text-emerald-400">{item.protein || '--'}</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block mb-0.5">Calories</span>
                      <span className="text-base sm:text-lg font-black text-amber-300">{item.calories || '--'}</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block mb-0.5">Carbs</span>
                      <span className="text-base sm:text-lg font-black text-gray-200">{item.carbs || '--'}</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block mb-0.5">Fats</span>
                      <span className="text-base sm:text-lg font-black text-gray-200">{item.fats || '--'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Clean Description */}
              {cleanDescription && (
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-normal">
                    {cleanDescription}
                  </p>
                </div>
              )}

              {/* Portion Options Selector */}
              {hasVariants && (
                <div className="space-y-2 pt-1">
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
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-emerald-400 bg-emerald-400' : 'border-gray-300'}`}>
                              {isSelected && <Check size={10} className="text-gray-950 stroke-[3]" />}
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
            </div>
          ) : (
            /* ========================================= */
            /* MODE 2: COMMERCIAL IMAGE ASSET LICENSING  */
            /* ========================================= */
            <div className="space-y-4">
              {licenseOrderSent ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="font-bold text-emerald-950 text-sm">License Order Dispatched!</h3>
                  <p className="text-xs text-emerald-700 leading-relaxed max-w-sm mx-auto">
                    Your request for the 4K master asset of <strong>{item.name}</strong> has been shared. Payment details and download link will be delivered via WhatsApp and email.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-br from-gray-900 to-gray-950 text-white p-5 rounded-2xl border border-gray-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                          <Camera size={16} />
                        </div>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-gray-200">
                          Commercial Stock License
                        </span>
                      </div>
                      <span className="text-base font-black text-emerald-400">
                        {formatCurrency(licensePrice, settings.currencySymbol || '₹')}
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed">
                      Purchase the official commercial license to use this high-resolution culinary master photo for advertisements, social media campaigns, print menus, or website marketing.
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-800">
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <Check size={13} className="text-emerald-400 shrink-0" />
                        <span>Ultra HD 4K Master</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <Check size={13} className="text-emerald-400 shrink-0" />
                        <span>Commercial Rights</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <Check size={13} className="text-emerald-400 shrink-0" />
                        <span>Zero Watermark</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <Check size={13} className="text-emerald-400 shrink-0" />
                        <span>Digital Master Dispatch</span>
                      </div>
                    </div>
                  </div>

                  {/* Live UPI Payment Stage for 9032578532@ybl */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-black text-[10px]">
                          UPI
                        </div>
                        <div>
                          <span className="font-bold text-xs text-gray-900 block">Instant UPI Payment</span>
                          <span className="text-[10px] text-gray-400">PhonePe • Google Pay • Paytm • BHIM</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-gray-950 bg-gray-100 px-2 py-0.5 rounded-md">
                        {formatCurrency(licensePrice, settings.currencySymbol || '₹')}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                      {/* Scan QR */}
                      <div className="p-2 bg-white rounded-xl border border-gray-200 shadow-xs shrink-0 flex flex-col items-center">
                        <QRCodeCanvas 
                          value={upiUrl} 
                          size={110} 
                          level="M"
                        />
                        <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Scan to Pay</span>
                      </div>

                      {/* UPI ID Info & One-Click Actions */}
                      <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Official UPI ID</span>
                          <div className="inline-flex items-center gap-1.5 mt-0.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-900 select-all">
                            <span>{upiId}</span>
                            <button 
                              type="button" 
                              onClick={handleCopyUpi}
                              className="text-gray-400 hover:text-gray-700 ml-1 p-0.5 rounded cursor-pointer"
                              title="Copy UPI ID"
                            >
                              {copiedUpi ? <Check size={13} className="text-emerald-600 stroke-[3]" /> : <Copy size={13} />}
                            </button>
                          </div>
                          {copiedUpi && <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">UPI ID Copied to clipboard!</span>}
                        </div>

                        {/* Mobile Instant App Link */}
                        <a
                          href={upiUrl}
                          className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          <ExternalLink size={12} />
                          <span>Pay via UPI App (PhonePe / GPay)</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Dedicated Licensee / Delivery Form */}
                  <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-800 block mb-1">
                      Licensee & Digital Delivery Details:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input 
                        type="text"
                        placeholder="Your Name / Buyer *"
                        value={buyerName}
                        onChange={e => setBuyerName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-950/10 focus:outline-none"
                      />
                      <input 
                        type="email"
                        placeholder="Delivery Email (for 4K Link) *"
                        value={buyerEmail}
                        onChange={e => setBuyerEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-950/10 focus:outline-none"
                      />
                    </div>
                    <input 
                      type="text"
                      placeholder="Company / Agency Name (optional)"
                      value={buyerCompany}
                      onChange={e => setBuyerCompany(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-950/10 focus:outline-none"
                    />
                  </div>

                  {/* Licensed Delivery Notice (Preview Downloads Strictly Disabled) */}
                  <div className="flex items-start gap-3 p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs">
                    <div className="p-2 bg-gray-200/80 rounded-xl text-gray-700 shrink-0 mt-0.5">
                      <ShieldCheck size={16} />
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-bold text-gray-900 block">🔒 Protected Commercial Asset</span>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        Preview downloads are disabled to protect food styling copyright. High-res 4K master files are dispatched directly to your email & WhatsApp upon instant UPI confirmation.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* Modal Sticky Footer Stage */}
        <div className="p-3.5 sm:p-4 px-4 sm:px-6 border-t border-gray-100 bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider truncate">
              {purchaseMode === 'license' ? 'License Fee' : 'Total Price'}
            </div>
            <div className="text-lg sm:text-2xl font-black text-gray-950 tracking-tight truncate">
              {formatCurrency(
                purchaseMode === 'license' ? licensePrice : activePrice, 
                settings.currencySymbol || '₹'
              )}
            </div>
          </div>

          {purchaseMode === 'license' ? (
            /* Dedicated Digital License Direct Payment Button */
            <button
              type="button"
              onClick={handleBuyImageLicense}
              className="px-4 sm:px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shrink-0"
            >
              <Camera size={14} />
              <span className="hidden xs:inline">License & Pay</span>
              <span className="xs:hidden">Pay</span>
              <span>({formatCurrency(licensePrice, settings.currencySymbol || '₹')})</span>
            </button>
          ) : (
            /* Dish Menu Item Action Controls */
            item.isAvailable === false ? (
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
                className="px-5 sm:px-6 py-2.5 bg-gray-950 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <ShoppingBag size={14} />
                <span>Add to Cart</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};

export default QuickViewModal;
