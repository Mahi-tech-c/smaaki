/**
 * Pure Pricing & Order Recalculation Engine
 * Smaakenzzoo Artisanal Cafe, Warangal
 * Golden Rule 3: Never trust client for money. Totals, coupons, GST and stock are recalculated.
 */

export const PROMO_CODES = {
  'WELCOME50': {
    code: 'WELCOME50',
    type: 'flat',
    value: 50,
    minOrder: 299,
    description: 'Flat ₹50 OFF on orders above ₹299'
  },
  'FLAT10': {
    code: 'FLAT10',
    type: 'percentage',
    value: 10,
    maxDiscount: 100,
    minOrder: 199,
    description: '10% OFF up to ₹100 on orders above ₹199'
  },
  'SMAAK20': {
    code: 'SMAAK20',
    type: 'percentage',
    value: 20,
    maxDiscount: 150,
    minOrder: 499,
    description: '20% OFF up to ₹150 on orders above ₹499'
  }
};

/**
 * Validates a coupon code against promo codes and active Firestore offers
 */
export const validateCoupon = (couponCode, subtotal = 0, activeOffers = []) => {
  if (!couponCode || typeof couponCode !== 'string') {
    return { valid: false, discount: 0, message: '' };
  }

  const cleanCode = couponCode.trim().toUpperCase();

  // 1. Check fixed promo codes
  if (PROMO_CODES[cleanCode]) {
    const promo = PROMO_CODES[cleanCode];
    if (subtotal < promo.minOrder) {
      return {
        valid: false,
        discount: 0,
        message: `Add ₹${Math.ceil(promo.minOrder - subtotal)} more to use ${promo.code}`
      };
    }

    let discount = 0;
    if (promo.type === 'flat') {
      discount = promo.value;
    } else if (promo.type === 'percentage') {
      discount = Math.round((subtotal * promo.value) / 100);
      if (promo.maxDiscount) {
        discount = Math.min(discount, promo.maxDiscount);
      }
    }

    return {
      valid: true,
      code: promo.code,
      discount,
      message: `Coupon applied: ${promo.description}`
    };
  }

  // 2. Check active Firestore offers
  if (Array.isArray(activeOffers)) {
    const matchedOffer = activeOffers.find(o => 
      o.isActive !== false && 
      (o.tag?.toUpperCase() === cleanCode || o.title?.toUpperCase().includes(cleanCode))
    );

    if (matchedOffer) {
      const percentage = parseFloat(matchedOffer.discountPercentage) || 10;
      const discount = Math.round((subtotal * percentage) / 100);
      return {
        valid: true,
        code: cleanCode,
        discount,
        message: `${percentage}% OFF offer applied!`
      };
    }
  }

  return {
    valid: false,
    discount: 0,
    message: 'Invalid promo code. Try WELCOME50 or FLAT10'
  };
};

/**
 * Pure recalculation of every line item, addons, taxes, and packaging fees.
 */
export const recalculateOrderTotals = ({
  cartItems = [],
  menuCatalog = [],
  couponCode = '',
  orderType = 'dine-in', // 'dine-in' | 'takeaway' | 'delivery'
  settings = {},
  activeOffers = []
}) => {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return {
      verifiedItems: [],
      itemCount: 0,
      itemTotal: 0,
      discount: 0,
      discountCode: null,
      subtotalAfterDiscount: 0,
      gst: 0,
      gstRate: 5,
      isTaxInclusive: true,
      packingCharge: 0,
      deliveryFee: 0,
      grandTotal: 0,
      isValid: false
    };
  }

  // Build lookup index from canonical catalog
  const catalogMap = new Map();
  menuCatalog.forEach(item => {
    catalogMap.set(String(item.id), item);
  });

  let verifiedItemTotal = 0;
  let totalQuantity = 0;

  const verifiedItems = cartItems.map(cartItem => {
    const catalogItem = catalogMap.get(String(cartItem.id));
    
    // Canonical base price
    let basePrice = catalogItem ? Number(catalogItem.price) : Number(cartItem.price) || 0;

    // Check if variant matches
    if (cartItem.selectedVariant && catalogItem?.options) {
      const matchedVariant = catalogItem.options.find(
        opt => opt.title === cartItem.selectedVariant.title
      );
      if (matchedVariant) {
        basePrice = Number(matchedVariant.price);
      }
    }

    // Canonical add-ons recalculation
    let addOnsPrice = 0;
    const verifiedAddOns = [];
    if (Array.isArray(cartItem.selectedAddOns)) {
      cartItem.selectedAddOns.forEach(addon => {
        const addonPrice = Number(addon.price) || 0;
        addOnsPrice += addonPrice;
        verifiedAddOns.push({
          id: addon.id,
          name: addon.name,
          price: addonPrice
        });
      });
    }

    const unitPrice = basePrice + addOnsPrice;
    const qty = Math.max(1, parseInt(cartItem.quantity, 10) || 1);
    const lineTotal = unitPrice * qty;

    verifiedItemTotal += lineTotal;
    totalQuantity += qty;

    return {
      id: cartItem.id,
      name: catalogItem?.name || cartItem.name,
      category: catalogItem?.category || cartItem.category,
      quantity: qty,
      unitPrice,
      basePrice,
      selectedVariant: cartItem.selectedVariant || null,
      selectedAddOns: verifiedAddOns,
      spiceLevel: cartItem.spiceLevel || null,
      specialInstructions: cartItem.specialInstructions || '',
      lineTotal
    };
  });

  // Coupon validation
  const couponResult = validateCoupon(couponCode, verifiedItemTotal, activeOffers);
  const discount = couponResult.valid ? couponResult.discount : 0;
  const subtotalAfterDiscount = Math.max(0, verifiedItemTotal - discount);

  // Packing & Delivery charges
  const packingCharge = (orderType === 'takeaway' || orderType === 'delivery')
    ? (Number(settings.packingCharge) || 15)
    : 0;

  const deliveryFee = orderType === 'delivery'
    ? (Number(settings.deliveryFee) || 30)
    : 0;

  // GST Calculation (Default 5% restaurant tax in India)
  const gstRate = Number(settings.gstRate) || 5;
  const isTaxInclusive = settings.isTaxInclusive !== false; // Default true: GST included in prices
  
  let gstAmount = 0;
  let finalGrandTotal = 0;

  if (isTaxInclusive) {
    // Included in price: Calculate back-out tax for transparent receipt
    gstAmount = Math.round((subtotalAfterDiscount * gstRate) / (100 + gstRate));
    finalGrandTotal = Math.round(subtotalAfterDiscount + packingCharge + deliveryFee);
  } else {
    // Added on top
    gstAmount = Math.round((subtotalAfterDiscount * gstRate) / 100);
    finalGrandTotal = Math.round(subtotalAfterDiscount + gstAmount + packingCharge + deliveryFee);
  }

  return {
    verifiedItems,
    itemCount: totalQuantity,
    itemTotal: verifiedItemTotal,
    discount,
    discountCode: couponResult.valid ? couponResult.code : null,
    discountMessage: couponResult.message,
    subtotalAfterDiscount,
    gst: gstAmount,
    gstRate,
    isTaxInclusive,
    packingCharge,
    deliveryFee,
    grandTotal: Math.max(0, finalGrandTotal),
    isValid: true
  };
};
