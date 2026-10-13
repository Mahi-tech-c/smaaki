/**
 * Pricing Engine Unit Tests — Smaakenzzoo Artisanal Cafe, Warangal
 * 
 * Tests for: validateCoupon, recalculateOrderTotals (Golden Rule 3 — never trust client)
 * Runner: Vitest (npm run test)
 */

import { describe, it, expect } from 'vitest';
import {
  PROMO_CODES,
  validateCoupon,
  recalculateOrderTotals
} from './pricing.js';

// ─── Sample Catalogue (canonical, server side) ──────────────────────────────

const CATALOGUE = [
  { id: '1',  name: 'Cold Brew',       category: 'Coffees',  price: 199, prepMinutes: 5  },
  { id: '2',  name: 'Belgian Waffle',  category: 'Waffles',  price: 299, prepMinutes: 12 },
  { id: '3',  name: 'Smash Burger',    category: 'Burgers',  price: 349, prepMinutes: 15 },
  {
    id: '4',
    name: 'Craft Shake',
    category: 'Milkshakes',
    price: 249,
    prepMinutes: 8,
    options: [
      { title: 'Small',  price: 199 },
      { title: 'Large',  price: 299 }
    ]
  }
];

const ADDONS = [
  { id: 'a1', name: 'Extra Espresso Shot', price: 40 },
  { id: 'a2', name: 'Whipped Cream',       price: 30 }
];

// ─── validateCoupon ──────────────────────────────────────────────────────────

describe('validateCoupon', () => {

  // Null / empty inputs
  it('returns invalid for null coupon code', () => {
    const r = validateCoupon(null, 500);
    expect(r.valid).toBe(false);
    expect(r.discount).toBe(0);
  });

  it('returns invalid for empty string', () => {
    const r = validateCoupon('', 500);
    expect(r.valid).toBe(false);
  });

  it('returns invalid for non-string input (number)', () => {
    const r = validateCoupon(12345, 500);
    expect(r.valid).toBe(false);
  });

  // Flat promo: WELCOME50 (₹50 flat, min ₹299)
  it('WELCOME50 is valid above minOrder — gives ₹50 flat off', () => {
    const r = validateCoupon('WELCOME50', 500);
    expect(r.valid).toBe(true);
    expect(r.discount).toBe(50);
    expect(r.code).toBe('WELCOME50');
  });

  it('WELCOME50 is case-insensitive', () => {
    const r = validateCoupon('welcome50', 500);
    expect(r.valid).toBe(true);
    expect(r.discount).toBe(50);
  });

  it('WELCOME50 with leading/trailing whitespace is trimmed', () => {
    const r = validateCoupon('  WELCOME50  ', 500);
    expect(r.valid).toBe(true);
    expect(r.discount).toBe(50);
  });

  it('WELCOME50 fails below ₹299 minOrder', () => {
    const r = validateCoupon('WELCOME50', 200);
    expect(r.valid).toBe(false);
    expect(r.discount).toBe(0);
    expect(r.message).toContain('₹');
  });

  it('WELCOME50 at exact minOrder boundary (₹299) is valid', () => {
    const r = validateCoupon('WELCOME50', 299);
    expect(r.valid).toBe(true);
    expect(r.discount).toBe(50);
  });

  // Percentage promo: FLAT10 (10%, max ₹100, min ₹199)
  it('FLAT10 gives 10% on ₹500 = ₹50', () => {
    const r = validateCoupon('FLAT10', 500);
    expect(r.valid).toBe(true);
    expect(r.discount).toBe(50);
  });

  it('FLAT10 caps at ₹100 on ₹1200 order (10% = ₹120 → capped at ₹100)', () => {
    const r = validateCoupon('FLAT10', 1200);
    expect(r.valid).toBe(true);
    expect(r.discount).toBe(100);
  });

  it('FLAT10 fails below ₹199 minOrder', () => {
    const r = validateCoupon('FLAT10', 150);
    expect(r.valid).toBe(false);
  });

  // Percentage promo: SMAAK20 (20%, max ₹150, min ₹499)
  it('SMAAK20 gives 20% on ₹600 = ₹120', () => {
    const r = validateCoupon('SMAAK20', 600);
    expect(r.valid).toBe(true);
    expect(r.discount).toBe(120);
  });

  it('SMAAK20 caps at ₹150 on ₹900 order (20% = ₹180 → capped at ₹150)', () => {
    const r = validateCoupon('SMAAK20', 900);
    expect(r.valid).toBe(true);
    expect(r.discount).toBe(150);
  });

  it('SMAAK20 fails below ₹499 minOrder', () => {
    const r = validateCoupon('SMAAK20', 300);
    expect(r.valid).toBe(false);
  });

  // Unknown code
  it('unknown promo code returns invalid', () => {
    const r = validateCoupon('FAKECODE', 1000);
    expect(r.valid).toBe(false);
    expect(r.discount).toBe(0);
  });

  // Active Firestore offer matching by tag
  it('matches an active Firestore offer by tag', () => {
    const activeOffers = [
      { isActive: true, tag: 'HAPPYHOUR', title: 'Happy Hour Deal', discountPercentage: '15' }
    ];
    const r = validateCoupon('HAPPYHOUR', 500, activeOffers);
    expect(r.valid).toBe(true);
    expect(r.discount).toBe(75); // 15% of 500
  });

  it('does not match an inactive Firestore offer', () => {
    const activeOffers = [
      { isActive: false, tag: 'INACTIVE10', title: 'Inactive Deal', discountPercentage: '10' }
    ];
    const r = validateCoupon('INACTIVE10', 500, activeOffers);
    expect(r.valid).toBe(false);
  });

  it('promo code takes precedence over Firestore offer with same code', () => {
    // WELCOME50 is a known promo code — should use flat ₹50, not offer %
    const activeOffers = [
      { isActive: true, tag: 'WELCOME50', title: 'Override Attempt', discountPercentage: '99' }
    ];
    const r = validateCoupon('WELCOME50', 500, activeOffers);
    expect(r.valid).toBe(true);
    expect(r.discount).toBe(50); // Fixed promo wins
  });
});

// ─── recalculateOrderTotals ──────────────────────────────────────────────────

describe('recalculateOrderTotals', () => {

  // Empty cart
  it('returns isValid=false and zero totals for empty cart', () => {
    const r = recalculateOrderTotals({ cartItems: [], menuCatalog: CATALOGUE });
    expect(r.isValid).toBe(false);
    expect(r.grandTotal).toBe(0);
    expect(r.itemCount).toBe(0);
  });

  // Basic single item — canonical price wins over client price
  it('uses catalogue price, ignores inflated client price', () => {
    const cartItems = [{ id: '1', price: 9999, quantity: 1 }]; // client claims ₹9999
    const r = recalculateOrderTotals({ cartItems, menuCatalog: CATALOGUE });
    expect(r.isValid).toBe(true);
    expect(r.itemTotal).toBe(199); // server catalogue price = ₹199
  });

  it('uses catalogue price, ignores deflated client price', () => {
    const cartItems = [{ id: '2', price: 1, quantity: 1 }]; // client claims ₹1
    const r = recalculateOrderTotals({ cartItems, menuCatalog: CATALOGUE });
    expect(r.itemTotal).toBe(299);
  });

  // Quantity
  it('multiplies unit price by quantity correctly', () => {
    const cartItems = [{ id: '1', price: 199, quantity: 3 }];
    const r = recalculateOrderTotals({ cartItems, menuCatalog: CATALOGUE });
    expect(r.itemTotal).toBe(597); // 199 × 3
    expect(r.itemCount).toBe(3);
  });

  it('defaults quantity to 1 when quantity is missing', () => {
    const cartItems = [{ id: '1', price: 199 }];
    const r = recalculateOrderTotals({ cartItems, menuCatalog: CATALOGUE });
    expect(r.itemCount).toBe(1);
  });

  it('clamps negative quantity to minimum 1', () => {
    const cartItems = [{ id: '1', price: 199, quantity: -5 }];
    const r = recalculateOrderTotals({ cartItems, menuCatalog: CATALOGUE });
    expect(r.itemCount).toBe(1);
    expect(r.itemTotal).toBe(199);
  });

  // Multiple items
  it('sums line totals across multiple items', () => {
    const cartItems = [
      { id: '1', quantity: 2 }, // 199 × 2 = 398
      { id: '2', quantity: 1 }, // 299 × 1 = 299
    ];
    const r = recalculateOrderTotals({ cartItems, menuCatalog: CATALOGUE });
    expect(r.itemTotal).toBe(697);
    expect(r.itemCount).toBe(3);
  });

  // Variant pricing
  it('uses variant price when selectedVariant matches catalogue option', () => {
    const cartItems = [{
      id: '4',
      quantity: 1,
      selectedVariant: { title: 'Large', price: 1 } // client gives wrong price; server overrides
    }];
    const r = recalculateOrderTotals({ cartItems, menuCatalog: CATALOGUE });
    expect(r.verifiedItems[0].basePrice).toBe(299); // Large variant from catalogue = ₹299
  });

  it('uses base item price when selectedVariant title does not match', () => {
    const cartItems = [{
      id: '4',
      quantity: 1,
      selectedVariant: { title: 'XL Special', price: 999 } // unknown variant
    }];
    const r = recalculateOrderTotals({ cartItems, menuCatalog: CATALOGUE });
    expect(r.verifiedItems[0].basePrice).toBe(249); // Falls back to base price
  });

  // Add-ons
  it('adds verified add-on prices to unit price', () => {
    const cartItems = [{
      id: '1',
      quantity: 1,
      selectedAddOns: [ADDONS[0]] // +₹40 espresso shot
    }];
    const r = recalculateOrderTotals({ cartItems, menuCatalog: CATALOGUE });
    expect(r.verifiedItems[0].unitPrice).toBe(239); // 199 + 40
    expect(r.itemTotal).toBe(239);
  });

  it('sums multiple add-ons correctly', () => {
    const cartItems = [{
      id: '1',
      quantity: 1,
      selectedAddOns: [ADDONS[0], ADDONS[1]] // +₹40 + ₹30 = ₹70
    }];
    const r = recalculateOrderTotals({ cartItems, menuCatalog: CATALOGUE });
    expect(r.verifiedItems[0].unitPrice).toBe(269); // 199 + 70
  });

  // Unknown item (not in catalogue)
  it('falls back to client price for item not in catalogue', () => {
    const cartItems = [{ id: 'UNKNOWN', price: 150, name: 'Mystery Item', quantity: 1 }];
    const r = recalculateOrderTotals({ cartItems, menuCatalog: CATALOGUE });
    expect(r.verifiedItems[0].basePrice).toBe(150);
    expect(r.itemTotal).toBe(150);
  });

  // Coupon application
  it('applies WELCOME50 flat discount to subtotal', () => {
    const cartItems = [{ id: '3', quantity: 1 }]; // ₹349
    const r = recalculateOrderTotals({
      cartItems,
      menuCatalog: CATALOGUE,
      couponCode: 'WELCOME50'
    });
    expect(r.discount).toBe(50);
    expect(r.subtotalAfterDiscount).toBe(299);
    expect(r.discountCode).toBe('WELCOME50');
  });

  it('does not apply coupon that fails minOrder check', () => {
    const cartItems = [{ id: '1', quantity: 1 }]; // ₹199 — below WELCOME50 minOrder of ₹299
    const r = recalculateOrderTotals({
      cartItems,
      menuCatalog: CATALOGUE,
      couponCode: 'WELCOME50'
    });
    expect(r.discount).toBe(0);
    expect(r.discountCode).toBe(null);
  });

  it('subtotalAfterDiscount never goes below zero', () => {
    // Artificially large discount via a crafted Firestore offer
    const activeOffers = [
      { isActive: true, tag: 'BIG', title: 'Overflow Test', discountPercentage: '200' }
    ];
    const cartItems = [{ id: '1', quantity: 1 }]; // ₹199
    const r = recalculateOrderTotals({
      cartItems,
      menuCatalog: CATALOGUE,
      couponCode: 'BIG',
      activeOffers
    });
    expect(r.subtotalAfterDiscount).toBeGreaterThanOrEqual(0);
  });

  // Order type fees
  it('dine-in has no packing or delivery charge', () => {
    const cartItems = [{ id: '1', quantity: 1 }];
    const r = recalculateOrderTotals({
      cartItems,
      menuCatalog: CATALOGUE,
      orderType: 'dine-in'
    });
    expect(r.packingCharge).toBe(0);
    expect(r.deliveryFee).toBe(0);
  });

  it('takeaway adds default packing charge (₹15)', () => {
    const cartItems = [{ id: '1', quantity: 1 }];
    const r = recalculateOrderTotals({
      cartItems,
      menuCatalog: CATALOGUE,
      orderType: 'takeaway'
    });
    expect(r.packingCharge).toBe(15);
    expect(r.deliveryFee).toBe(0);
  });

  it('delivery adds packing charge + delivery fee', () => {
    const cartItems = [{ id: '1', quantity: 1 }];
    const r = recalculateOrderTotals({
      cartItems,
      menuCatalog: CATALOGUE,
      orderType: 'delivery'
    });
    expect(r.packingCharge).toBe(15);
    expect(r.deliveryFee).toBe(30);
  });

  it('uses custom packingCharge and deliveryFee from settings', () => {
    const cartItems = [{ id: '1', quantity: 1 }];
    const r = recalculateOrderTotals({
      cartItems,
      menuCatalog: CATALOGUE,
      orderType: 'delivery',
      settings: { packingCharge: 20, deliveryFee: 50 }
    });
    expect(r.packingCharge).toBe(20);
    expect(r.deliveryFee).toBe(50);
  });

  // GST — tax-inclusive (default)
  it('GST is back-calculated from subtotal when tax-inclusive (default)', () => {
    const cartItems = [{ id: '1', quantity: 1 }]; // ₹199, dine-in, no coupon
    const r = recalculateOrderTotals({ cartItems, menuCatalog: CATALOGUE });
    // Tax-inclusive: GST = round(199 * 5 / 105) = round(9.476) = 9
    expect(r.isTaxInclusive).toBe(true);
    expect(r.gstRate).toBe(5);
    expect(r.gst).toBe(9);
    expect(r.grandTotal).toBe(199); // GST already included — total stays ₹199
  });

  // GST — tax-exclusive
  it('GST is added on top when isTaxInclusive=false', () => {
    const cartItems = [{ id: '1', quantity: 1 }]; // ₹199
    const r = recalculateOrderTotals({
      cartItems,
      menuCatalog: CATALOGUE,
      settings: { isTaxInclusive: false, gstRate: 5 }
    });
    expect(r.isTaxInclusive).toBe(false);
    // GST = round(199 * 5 / 100) = 10
    expect(r.gst).toBe(10);
    expect(r.grandTotal).toBe(209); // 199 + 10
  });

  it('uses custom gstRate from settings', () => {
    const cartItems = [{ id: '2', quantity: 1 }]; // ₹299
    const r = recalculateOrderTotals({
      cartItems,
      menuCatalog: CATALOGUE,
      settings: { isTaxInclusive: false, gstRate: 18 }
    });
    expect(r.gstRate).toBe(18);
    // GST = round(299 * 18 / 100) = round(53.82) = 54
    expect(r.gst).toBe(54);
  });

  // grandTotal is never negative
  it('grandTotal is always >= 0', () => {
    const cartItems = [{ id: '1', quantity: 1 }];
    const r = recalculateOrderTotals({
      cartItems,
      menuCatalog: CATALOGUE,
      couponCode: 'WELCOME50' // ₹50 off on ₹199? Fails minOrder → no discount, still ₹199
    });
    expect(r.grandTotal).toBeGreaterThanOrEqual(0);
  });

  // verifiedItems structure
  it('verifiedItems contain correct fields', () => {
    const cartItems = [{ id: '1', quantity: 2 }];
    const r = recalculateOrderTotals({ cartItems, menuCatalog: CATALOGUE });
    const item = r.verifiedItems[0];
    expect(item).toHaveProperty('id', '1');
    expect(item).toHaveProperty('name', 'Cold Brew');
    expect(item).toHaveProperty('quantity', 2);
    expect(item).toHaveProperty('unitPrice', 199);
    expect(item).toHaveProperty('lineTotal', 398);
    expect(item).toHaveProperty('prepMinutes', 5);
  });

  // Full integration scenario
  it('full order: 2 items + variant + add-on + FLAT10 + takeaway + 5% tax-inclusive', () => {
    const cartItems = [
      {
        id: '4',
        quantity: 1,
        selectedVariant: { title: 'Large', price: 1 }, // server overrides to ₹299
        selectedAddOns: [ADDONS[1]] // +₹30
      },
      {
        id: '3', // Smash Burger ₹349
        quantity: 1
      }
    ];
    // itemTotal = (299 + 30) + 349 = 678
    // FLAT10: 10% of 678 = 67.8 → rounded = 68
    // subtotalAfterDiscount = 678 - 68 = 610
    // packingCharge (takeaway) = 15, deliveryFee = 0
    // GST (inclusive, 5%): round(610 * 5 / 105) = round(29.05) = 29
    // grandTotal = 610 + 15 = 625
    const r = recalculateOrderTotals({
      cartItems,
      menuCatalog: CATALOGUE,
      couponCode: 'FLAT10',
      orderType: 'takeaway',
      settings: { isTaxInclusive: true, gstRate: 5 }
    });

    expect(r.isValid).toBe(true);
    expect(r.itemTotal).toBe(678);
    expect(r.discount).toBe(68);
    expect(r.subtotalAfterDiscount).toBe(610);
    expect(r.packingCharge).toBe(15);
    expect(r.deliveryFee).toBe(0);
    expect(r.gst).toBe(29);
    expect(r.grandTotal).toBe(625);
    expect(r.discountCode).toBe('FLAT10');
  });
});
