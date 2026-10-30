import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import { DEFAULT_SETTINGS } from '../constants/settings';
import {
  addMenuItemApi,
  updateMenuItemApi,
  deleteMenuItemApi,
  reorderMenuItemApi,
  swapMenuItemsApi,
  cleanupMenuPricesApi,
  addCategoryApi,
  updateCategoryCascadeApi,
  deleteCategoryApi,
  reorderCategoryApi,
  addOfferApi,
  updateOfferApi,
  deleteOfferApi,
  reorderOfferApi,
  addFeaturedApi,
  updateFeaturedApi,
  deleteFeaturedApi,
  reorderFeaturedApi,
  updateSettingsApi,
  syncMenuDataToNewFirebase
} from '../services/menuService';
import { menuItems as defaultMenuItems } from '../data/menu';
import { getCategoryEmoji, CANONICAL_CATEGORIES } from '../constants/categories';

const defaultCategories = CANONICAL_CATEGORIES.length > 0
  ? CANONICAL_CATEGORIES
  : Array.from(new Set(defaultMenuItems.map(i => i.category))).map((catName, idx) => ({
      id: idx + 1,
      name: catName,
      emoji: getCategoryEmoji(catName),
      orderIndex: idx + 1
    }));

// Local Storage Persistence Keys
const LS_KEYS = {
  settings: 'smaakii_custom_settings',
  categories: 'smaakii_custom_categories',
  menuItems: 'smaakii_custom_menu_items',
  offers: 'smaakii_custom_offers',
  featured: 'smaakii_custom_featured',
};

const getStoredItem = (key, fallback) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};

const setStoredItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[LocalStorage] Failed to cache ${key}:`, e);
  }
};

export { DEFAULT_SETTINGS };
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [menuItems, setMenuItems] = useState(() => getStoredItem(LS_KEYS.menuItems, defaultMenuItems));
  const [offers, setOffers] = useState(() => getStoredItem(LS_KEYS.offers, []));
  const [categories, setCategories] = useState(() => getStoredItem(LS_KEYS.categories, defaultCategories));
  const [settings, setSettings] = useState(() => {
    const cached = getStoredItem(LS_KEYS.settings, null);
    return cached ? { ...DEFAULT_SETTINGS, ...cached } : DEFAULT_SETTINGS;
  });
  const [featured, setFeatured] = useState(() => getStoredItem(LS_KEYS.featured, []));
  const [isLoaded, setIsLoaded] = useState(false);

  // Table State for QR Dine-in Experience
  const [currentTable, setCurrentTableState] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTable = urlParams.get('table');
      if (urlTable) return urlTable;
      return sessionStorage.getItem('smaakenzzoo_table') || localStorage.getItem('smaakenzzoo_table') || null;
    } catch {
      return null;
    }
  });

  // Helper to read active table orders in the last 2 hours
  const getActiveTableOrderFromStorage = useCallback((table) => {
    if (!table) return null;
    try {
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      const recentOrders = JSON.parse(localStorage.getItem('smaakenzzoo_recent_orders') || '[]');
      const tableOrders = recentOrders.filter(o => 
        String(o.tableNumber) === String(table) && 
        new Date(o.createdAt).getTime() > twoHoursAgo
      );

      if (tableOrders.length > 0) {
        const totalBill = tableOrders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);
        return {
          ...tableOrders[0],
          grandTotal: totalBill,
          orderCount: tableOrders.length,
          orders: tableOrders
        };
      }
    } catch {
      // ignore
    }
    return null;
  }, []);

  // Active orders for this table in the last 2 hours
  const [activeTableOrder, setActiveTableOrder] = useState(() => {
    return getActiveTableOrderFromStorage(currentTable);
  });

  const setCurrentTable = useCallback((table) => {
    const clean = table ? String(table).trim() : null;
    setCurrentTableState(clean);
    setActiveTableOrder(getActiveTableOrderFromStorage(clean));
    try {
      if (clean) {
        sessionStorage.setItem('smaakenzzoo_table', clean);
        localStorage.setItem('smaakenzzoo_table', clean);
      } else {
        sessionStorage.removeItem('smaakenzzoo_table');
        localStorage.removeItem('smaakenzzoo_table');
      }
    } catch {
      // storage error fallback
    }
  }, [getActiveTableOrderFromStorage]);

  const clearTable = useCallback(() => {
    setCurrentTableState(null);
    setActiveTableOrder(null);
    try {
      sessionStorage.removeItem('smaakenzzoo_table');
      localStorage.removeItem('smaakenzzoo_table');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTableOrder(getActiveTableOrderFromStorage(currentTable));
    }, 10000);
    return () => clearInterval(interval);
  }, [currentTable, getActiveTableOrderFromStorage]);

  // Cart State for interactive customer experience
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('smaakenzoo_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('smaakenzoo_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Could not save cart:', e);
    }
  }, [cart]);

  const addToCart = useCallback((item, selectedOption = null, quantity = 1, extraPrice = 0) => {
    const variant = item.selectedVariant || (selectedOption && typeof selectedOption === 'object' ? selectedOption : null);
    const variantTitle = variant?.title || variant?.name || (typeof selectedOption === 'string' ? selectedOption : null);
    const addOns = Array.isArray(item.selectedAddOns) ? item.selectedAddOns : [];
    const spice = item.spiceLevel || null;
    const instructions = (item.specialInstructions || '').trim();
    const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);

    // Compute unique cart identifier for this configuration
    let cartItemId = String(item.id);
    if (variantTitle) cartItemId += `-${variantTitle}`;
    if (addOns.length > 0) {
      const addonKey = addOns.map(a => a.id || a.name).sort().join('_');
      cartItemId += `-${addonKey}`;
    }
    if (spice) cartItemId += `-${spice}`;
    if (instructions) cartItemId += `-${instructions.slice(0, 10)}`;

    const basePrice = variant?.price !== undefined ? Number(variant.price) : Number(item.price) || 0;
    const addOnsSum = addOns.reduce((sum, a) => sum + (Number(a.price) || 0), 0) + (Number(extraPrice) || 0);
    const unitPrice = basePrice + addOnsSum;
    const title = variantTitle ? `${item.name} (${variantTitle})` : item.name;

    setCart(prev => {
      const existing = prev.find(i => i.cartId === cartItemId);
      if (existing) {
        return prev.map(i => i.cartId === cartItemId ? { ...i, quantity: i.quantity + qtyToAdd } : i);
      }
      return [...prev, {
        cartId: cartItemId,
        id: item.id,
        name: title,
        baseName: item.name,
        price: unitPrice,
        basePrice,
        image: item.image,
        quantity: qtyToAdd,
        option: variantTitle,
        selectedVariant: variant,
        selectedAddOns: addOns,
        spiceLevel: spice,
        specialInstructions: instructions,
        category: item.category,
        veg: item.veg
      }];
    });
    setIsCartOpen(true);
  }, []);

  const updateCartQuantity = useCallback((cartId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.cartId === cartId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  }, []);

  const removeFromCart = useCallback((cartId) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Real-time Firestore Listeners
  useEffect(() => {
    const loadedStatus = {
      categories: false,
      menuItems: false,
      offers: false,
      settings: false,
      featured: false
    };

    const checkAllLoaded = () => {
      if (Object.values(loadedStatus).every(status => status === true)) {
        setIsLoaded(true);
        if (window.hideSplashScreen) {
          window.hideSplashScreen();
        }
      }
    };

    const fastHideTimeout = setTimeout(() => {
      if (window.hideSplashScreen) window.hideSplashScreen();
    }, 4000);

    // Initialize new Firebase project database with menu data
    syncMenuDataToNewFirebase();

    let currentCategories = categories;

    // Categories Listener (Dedicated to this project)
    const unsubCategories = onSnapshot(collection(db, COLLECTIONS.categories), (snapshot) => {
      if (!snapshot.empty) {
        const cats = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        cats.sort((a, b) => {
          const orderA = a.orderIndex !== undefined ? Number(a.orderIndex) : Number(a.id);
          const orderB = b.orderIndex !== undefined ? Number(b.orderIndex) : Number(b.id);
          return orderA - orderB;
        });
        currentCategories = cats;
        setCategories(cats);
      }
      loadedStatus.categories = true;
      checkAllLoaded();
      refreshMenuSort();
    }, (err) => {
      console.error(err);
      loadedStatus.categories = true;
      checkAllLoaded();
    });

    let lastMenuSnapshot = null;
    const refreshMenuSort = (snapshot) => {
      const querySnapshot = snapshot || lastMenuSnapshot;
      if (!querySnapshot) return;

      if (!querySnapshot.empty) {
        const items = querySnapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        items.sort((a, b) => {
          const catA = currentCategories.find(c => c.name === a.category);
          const catB = currentCategories.find(c => c.name === b.category);
          const catOrderA = catA ? (catA.orderIndex || 0) : 9999999999999;
          const catOrderB = catB ? (catB.orderIndex || 0) : 9999999999999;
          if (catOrderA !== catOrderB) return catOrderA - catOrderB;
          const orderA = a.orderIndex !== undefined ? Number(a.orderIndex) : Number(a.id);
          const orderB = b.orderIndex !== undefined ? Number(b.orderIndex) : Number(b.id);
          if (orderA !== orderB) return orderA - orderB;
          return String(a.id).localeCompare(String(b.id));
        });

        setMenuItems(items);
      }
      if (!loadedStatus.menuItems) {
        loadedStatus.menuItems = true;
        checkAllLoaded();
      }
    };

    const unsubMenu = onSnapshot(collection(db, COLLECTIONS.menuItems), (snapshot) => {
      lastMenuSnapshot = snapshot;
      refreshMenuSort(snapshot);
    }, (err) => {
      console.error(err);
      loadedStatus.menuItems = true;
      checkAllLoaded();
    });

    const unsubOffers = onSnapshot(collection(db, COLLECTIONS.offers), (snapshot) => {
      const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      items.sort((a, b) => {
        const orderA = a.orderIndex !== undefined ? Number(a.orderIndex) : Number(a.id);
        const orderB = b.orderIndex !== undefined ? Number(b.orderIndex) : Number(b.id);
        if (orderA !== orderB) return orderA - orderB;
        return String(a.id).localeCompare(String(b.id));
      });
      setOffers(items);
      loadedStatus.offers = true;
      checkAllLoaded();
    }, (err) => {
      console.error(err);
      loadedStatus.offers = true;
      checkAllLoaded();
    });

    const unsubSettings = onSnapshot(doc(db, COLLECTIONS.settings, "restaurant"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const mergedData = { ...DEFAULT_SETTINGS };
        Object.keys(mergedData).forEach(key => {
          if (data[key] !== undefined) {
            mergedData[key] = data[key];
          }
        });
        setSettings(mergedData);
      } else {
        setSettings(prev => ({ ...DEFAULT_SETTINGS, ...prev }));
      }
      loadedStatus.settings = true;
      checkAllLoaded();
    }, (err) => {
      console.error(err);
      loadedStatus.settings = true;
      checkAllLoaded();
    });

    const unsubFeatured = onSnapshot(collection(db, COLLECTIONS.featured), (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => {
        const orderA = a.orderIndex !== undefined ? Number(a.orderIndex) : Number(a.id || 0);
        const orderB = b.orderIndex !== undefined ? Number(b.orderIndex) : Number(b.id || 0);
        return orderA - orderB;
      });
      setFeatured(items);
      loadedStatus.featured = true;
      checkAllLoaded();
    }, (err) => {
      console.error(err);
      loadedStatus.featured = true;
      checkAllLoaded();
    });

    return () => {
      unsubMenu();
      unsubOffers();
      unsubCategories();
      unsubSettings();
      unsubFeatured();
      clearTimeout(fastHideTimeout);
    };
  }, []);

  // CRUD with Instant Optimistic UI Updates & Offline-Resilient Local Storage Sync
  const addItem = useCallback(async (item) => {
    const tempId = Date.now();
    const optimisticItem = { ...item, id: tempId, orderIndex: tempId };
    setMenuItems(prev => {
      const updated = [...prev, optimisticItem];
      setStoredItem(LS_KEYS.menuItems, updated);
      return updated;
    });
    return await addMenuItemApi(item).catch(err => console.warn('[addItem] Firestore offline:', err));
  }, []);

  const updateItem = useCallback(async (id, fields) => {
    setMenuItems(prev => {
      const updated = prev.map(it => String(it.id) === String(id) ? { ...it, ...fields } : it);
      setStoredItem(LS_KEYS.menuItems, updated);
      return updated;
    });
    await updateMenuItemApi(id, fields).catch(err => console.warn('[updateItem] Firestore offline:', err));
  }, []);

  const deleteItem = useCallback(async (id) => {
    setMenuItems(prev => {
      const updated = prev.filter(it => String(it.id) !== String(id));
      setStoredItem(LS_KEYS.menuItems, updated);
      return updated;
    });
    await deleteMenuItemApi(id).catch(err => console.warn('[deleteItem] Firestore offline:', err));
  }, []);

  const reorderItem = useCallback(async (id, newIndex) => {
    setMenuItems(prev => {
      const items = [...prev];
      const index = items.findIndex(i => String(i.id) === String(id));
      if (index === -1) return prev;
      const [moved] = items.splice(index, 1);
      items.splice(newIndex, 0, moved);
      setStoredItem(LS_KEYS.menuItems, items);
      return items;
    });
    await reorderMenuItemApi(id, newIndex).catch(err => console.warn('[reorderItem] Firestore offline:', err));
  }, []);

  const swapItems = useCallback(async (i1, i2) => swapMenuItemsApi(i1, i2).catch(() => {}), []);
  const cleanupMenuPrices = useCallback(async () => cleanupMenuPricesApi(menuItems).catch(() => {}), [menuItems]);

  const addCategory = useCallback(async (name) => {
    const tempId = Date.now();
    const optimisticCat = { id: tempId, name, orderIndex: tempId, emoji: getCategoryEmoji(name) };
    setCategories(prev => {
      const updated = [...prev, optimisticCat];
      setStoredItem(LS_KEYS.categories, updated);
      return updated;
    });
    return await addCategoryApi(name).catch(err => console.warn('[addCategory] Firestore offline:', err));
  }, []);

  const updateCategory = useCallback(async (id, fields) => {
    setCategories(prev => {
      const updated = prev.map(c => String(c.id) === String(id) ? { ...c, ...fields } : c);
      setStoredItem(LS_KEYS.categories, updated);
      return updated;
    });
    await updateCategoryCascadeApi(id, fields, categories, menuItems, offers).catch(err => console.warn('[updateCategory] Firestore offline:', err));
  }, [categories, menuItems, offers]);

  const deleteCategory = useCallback(async (id) => {
    setCategories(prev => {
      const updated = prev.filter(c => String(c.id) !== String(id));
      setStoredItem(LS_KEYS.categories, updated);
      return updated;
    });
    await deleteCategoryApi(id).catch(err => console.warn('[deleteCategory] Firestore offline:', err));
  }, []);

  const reorderCategory = useCallback(async (id, newIndex, name) => {
    setCategories(prev => {
      const items = [...prev];
      const index = items.findIndex(c => String(c.id) === String(id));
      if (index === -1) return prev;
      const [moved] = items.splice(index, 1);
      items.splice(newIndex, 0, moved);
      setStoredItem(LS_KEYS.categories, items);
      return items;
    });
    return reorderCategoryApi(id, newIndex, name).catch(err => console.warn('[reorderCategory] Firestore offline:', err));
  }, []);

  const addOffer = useCallback(async (offer) => {
    const tempId = Date.now();
    const optimisticOffer = { ...offer, id: tempId, orderIndex: tempId };
    setOffers(prev => {
      const updated = [...prev, optimisticOffer];
      setStoredItem(LS_KEYS.offers, updated);
      return updated;
    });
    return await addOfferApi(offer).catch(err => console.warn('[addOffer] Firestore offline:', err));
  }, []);

  const updateOffer = useCallback(async (id, fields) => {
    setOffers(prev => {
      const updated = prev.map(o => String(o.id) === String(id) ? { ...o, ...fields } : o);
      setStoredItem(LS_KEYS.offers, updated);
      return updated;
    });
    await updateOfferApi(id, fields).catch(err => console.warn('[updateOffer] Firestore offline:', err));
  }, []);

  const deleteOffer = useCallback(async (id) => {
    setOffers(prev => {
      const updated = prev.filter(o => String(o.id) !== String(id));
      setStoredItem(LS_KEYS.offers, updated);
      return updated;
    });
    await deleteOfferApi(id).catch(err => console.warn('[deleteOffer] Firestore offline:', err));
  }, []);

  const reorderOffer = useCallback(async (id, newIndex) => {
    setOffers(prev => {
      const items = [...prev];
      const index = items.findIndex(o => String(o.id) === String(id));
      if (index === -1) return prev;
      const [moved] = items.splice(index, 1);
      items.splice(newIndex, 0, moved);
      setStoredItem(LS_KEYS.offers, items);
      return items;
    });
    return reorderOfferApi(id, newIndex).catch(err => console.warn('[reorderOffer] Firestore offline:', err));
  }, []);

  const addFeatured = useCallback(async (item) => {
    const tempId = Date.now().toString();
    const optimisticFeatured = { ...item, id: tempId, orderIndex: Date.now() };
    setFeatured(prev => {
      const updated = [...prev, optimisticFeatured];
      setStoredItem(LS_KEYS.featured, updated);
      return updated;
    });
    return await addFeaturedApi(item).catch(err => console.warn('[addFeatured] Firestore offline:', err));
  }, []);

  const updateFeatured = useCallback(async (id, data) => {
    setFeatured(prev => {
      const updated = prev.map(f => String(f.id) === String(id) ? { ...f, ...data } : f);
      setStoredItem(LS_KEYS.featured, updated);
      return updated;
    });
    await updateFeaturedApi(id, data).catch(err => console.warn('[updateFeatured] Firestore offline:', err));
  }, []);

  const deleteFeatured = useCallback(async (id) => {
    setFeatured(prev => {
      const updated = prev.filter(f => String(f.id) !== String(id));
      setStoredItem(LS_KEYS.featured, updated);
      return updated;
    });
    await deleteFeaturedApi(id).catch(err => console.warn('[deleteFeatured] Firestore offline:', err));
  }, []);

  const reorderFeatured = useCallback(async (id, newIndex) => {
    setFeatured(prev => {
      const items = [...prev];
      const index = items.findIndex(f => String(f.id) === String(id));
      if (index === -1) return prev;
      const [moved] = items.splice(index, 1);
      items.splice(newIndex, 0, moved);
      setStoredItem(LS_KEYS.featured, items);
      return items;
    });
    return reorderFeaturedApi(id, newIndex).catch(err => console.warn('[reorderFeatured] Firestore offline:', err));
  }, []);

  const updateSettings = useCallback(async (newSettings) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      setStoredItem(LS_KEYS.settings, updated);
      return updated;
    });
    await updateSettingsApi(newSettings).catch(err => console.warn('[updateSettings] Firestore offline:', err));
  }, []);

  const resetMenu = useCallback(() => console.warn("Reset skipped in database mode."), []);

  return (
    <AppContext.Provider value={{
      menuItems,
      addItem,
      updateItem,
      deleteItem,
      reorderItem,
      swapItems,
      offers,
      addOffer,
      updateOffer,
      deleteOffer,
      reorderOffer,
      cleanupMenuPrices,
      settings,
      updateSettings,
      featured,
      addFeatured,
      updateFeatured,
      deleteFeatured,
      reorderFeatured,
      categories,
      addCategory,
      updateCategory,
      deleteCategory,
      reorderCategory,
      resetMenu,
      isLoaded,
      // Cart & Ordering
      cart,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      cartTotal,
      cartItemCount,
      isCartOpen,
      setIsCartOpen,
      // Dine-in Table State
      currentTable,
      setCurrentTable,
      clearTable,
      activeTableOrder
    }}>
      {children}
    </AppContext.Provider>
  );
};
