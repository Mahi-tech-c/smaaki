import { addOnOptionGroups } from '../data/menu';

/**
 * Normalizes item dietary type: 'veg' | 'egg' | 'nonveg'
 */
export const getItemDietaryType = (item) => {
  if (item?.veg === 'veg' || item?.veg === 'egg' || item?.veg === 'nonveg') {
    return item.veg;
  }
  const text = `${item?.name || ''} ${item?.category || ''} ${item?.description || ''}`.toLowerCase();
  if (/chicken|wings|kievs|keivs|meat|fish|bacon|bbq chicken/.test(text)) {
    return 'nonveg';
  }
  if (/egg|omelette/.test(text)) {
    return 'egg';
  }
  return 'veg';
};

/**
 * Resolves option groups applicable to an item
 */
export const getItemOptionGroups = (item) => {
  if (item?.optionGroups && Array.isArray(item.optionGroups) && item.optionGroups.length > 0) {
    return item.optionGroups;
  }

  const category = (item?.category || '').toLowerCase();
  const groups = [];

  if (category.includes('churros') && addOnOptionGroups.churros) {
    groups.push(addOnOptionGroups.churros);
  } else if (category.includes('waffle') && addOnOptionGroups.waffles) {
    groups.push(addOnOptionGroups.waffles);
  } else if (category.includes('pizza') && addOnOptionGroups.pizza) {
    groups.push(addOnOptionGroups.pizza);
  } else if ((category.includes('snack') || category.includes('fries') || category.includes('chicken appetiser')) && addOnOptionGroups.snacks) {
    groups.push(addOnOptionGroups.snacks);
  }

  return groups;
};

/**
 * Infers badges from item properties and name
 */
export const getItemBadges = (item) => {
  if (Array.isArray(item?.badges) && item.badges.length > 0) {
    return item.badges;
  }

  const badges = [];
  const name = (item?.name || '').toLowerCase();
  const category = (item?.category || '').toLowerCase();

  if (item?.isBestseller || name.includes('classic') || name.includes('signature') || item?.id === 1 || item?.id === 10) {
    badges.push('Bestseller');
  }
  if (item?.isNew || name.includes('sizzler') || category.includes('bubble waffle')) {
    badges.push('New');
  }
  if (name.includes('peri peri') || name.includes('spicy') || name.includes('hot')) {
    badges.push('Spicy');
  }
  if (name.includes('belgian') || name.includes('premium') || name.includes('nutella')) {
    badges.push('Must Try');
  }

  return badges;
};

/**
 * Infers allergens from item category and name
 */
export const getItemAllergens = (item) => {
  if (Array.isArray(item?.allergens) && item.allergens.length > 0) {
    return item.allergens;
  }

  const allergens = [];
  const text = `${item?.name || ''} ${item?.category || ''} ${item?.description || ''}`.toLowerCase();

  if (/churros|waffle|pancake|pizza|burger|sandwich|brownie/.test(text)) {
    allergens.push('Contains gluten');
  }
  if (/cheese|milkshake|ice cream|chocolate|butter|sundae|cream/.test(text)) {
    allergens.push('Contains dairy');
  }
  if (/almond|nut|walnut|hazelnut|pistachio|peanut|rocher/.test(text)) {
    allergens.push('Contains nuts');
  }
  if (/egg|omelette/.test(text)) {
    allergens.push('Contains egg');
  }

  return allergens;
};

/**
 * Suggests "Goes well with" items for an item
 */
export const getGoesWellWith = (item, allItems = []) => {
  const cat = (item?.category || '').toLowerCase();
  if (!allItems || allItems.length === 0) return [];

  if (cat.includes('churros') || cat.includes('waffle')) {
    return allItems.filter(i => (i.category || '').toLowerCase().includes('coffee') || (i.category || '').toLowerCase().includes('ice cream')).slice(0, 3);
  }
  if (cat.includes('pizza') || cat.includes('burger') || cat.includes('sandwich')) {
    return allItems.filter(i => (i.category || '').toLowerCase().includes('fries') || (i.category || '').toLowerCase().includes('beverages') || (i.category || '').toLowerCase().includes('mocktails')).slice(0, 3);
  }
  return allItems.filter(i => (i.category || '').toLowerCase().includes('churros') || (i.category || '').toLowerCase().includes('beverages')).slice(0, 3);
};
