// Category emoji definitions & helpers
// Flourishing Hearts, Blooming Dreams - Smaakenzzoo Artisanal Cafe

export const CATEGORY_EMOJIS = {
  'Churros': '🥖',
  'Belgian Waffles': '🧇',
  'Bubble Waffles': '🫧',
  'Icecream Sundaes': '🍨',
  'Mini Pancakes': '🥞',
  'Brownie Sizzlers': '🍫',
  'Milkshakes': '🥛',
  'Coffees': '☕',
  'Mocktails': '🍹',
  'Pizza': '🍕',
  'Burgers': '🍔',
  'Sandwiches': '🥪',
  'Chicken Appetiser': '🍗',
  'Veg Snacks': '🥕',
  'French Fries': '🍟',
  'Ice Creams': '🍦',
  'Beverages': '🥤'
};

export const DEFAULT_CATEGORY_FALLBACK_EMOJI = '🍽️';

export const getCategoryEmoji = (categoryName) => {
  if (!categoryName) return DEFAULT_CATEGORY_FALLBACK_EMOJI;
  return CATEGORY_EMOJIS[categoryName] || DEFAULT_CATEGORY_FALLBACK_EMOJI;
};

// Canonical Category List
export const CANONICAL_CATEGORIES = [
  { id: 1, name: 'Churros', emoji: '🥖', orderIndex: 1 },
  { id: 2, name: 'Belgian Waffles', emoji: '🧇', orderIndex: 2 },
  { id: 3, name: 'Bubble Waffles', emoji: '🫧', orderIndex: 3 },
  { id: 4, name: 'Icecream Sundaes', emoji: '🍨', orderIndex: 4 },
  { id: 5, name: 'Mini Pancakes', emoji: '🥞', orderIndex: 5 },
  { id: 6, name: 'Brownie Sizzlers', emoji: '🍫', orderIndex: 6 },
  { id: 7, name: 'Milkshakes', emoji: '🥛', orderIndex: 7 },
  { id: 8, name: 'Coffees', emoji: '☕', orderIndex: 8 },
  { id: 9, name: 'Mocktails', emoji: '🍹', orderIndex: 9 },
  { id: 10, name: 'Pizza', emoji: '🍕', orderIndex: 10 },
  { id: 11, name: 'Burgers', emoji: '🍔', orderIndex: 11 },
  { id: 12, name: 'Sandwiches', emoji: '🥪', orderIndex: 12 },
  { id: 13, name: 'Chicken Appetiser', emoji: '🍗', orderIndex: 13 },
  { id: 14, name: 'Veg Snacks', emoji: '🥕', orderIndex: 14 },
  { id: 15, name: 'French Fries', emoji: '🍟', orderIndex: 15 },
  { id: 16, name: 'Ice Creams', emoji: '🍦', orderIndex: 16 },
  { id: 17, name: 'Beverages', emoji: '🥤', orderIndex: 17 }
];
