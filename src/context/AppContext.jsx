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

const defaultCategories = Array.from(new Set(defaultMenuItems.map(i => i.category))).map((catName, idx) => ({
  id: idx + 1,
  name: catName,
  orderIndex: idx + 1
}));

export { DEFAULT_SETTINGS };
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [menuItems, setMenuItems] = useState(defaultMenuItems);
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [featured, setFeatured] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

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

  const addToCart = useCallback((item, selectedOption = null) => {
    const cartItemId = selectedOption ? `${item.id}-${selectedOption.title}` : String(item.id);
    const price = selectedOption ? Number(selectedOption.price) : Number(item.price);
    const title = selectedOption ? `${item.name} (${selectedOption.title})` : item.name;

    setCart(prev => {
      const existing = prev.find(i => i.cartId === cartItemId);
      if (existing) {
        return prev.map(i => i.cartId === cartItemId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        cartId: cartItemId,
        id: item.id,
        name: title,
        baseName: item.name,
        price,
        image: item.image,
        quantity: 1,
        option: selectedOption ? selectedOption.title : null
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

  // CRUD with Instant Optimistic UI Updates
  const addItem = useCallback(async (item) => {
    const tempId = Date.now();
    const optimisticItem = { ...item, id: tempId, orderIndex: tempId };
    setMenuItems(prev => [...prev, optimisticItem]);
    return await addMenuItemApi(item);
  }, []);

  const updateItem = useCallback(async (id, fields) => {
    setMenuItems(prev => prev.map(it => String(it.id) === String(id) ? { ...it, ...fields } : it));
    await updateMenuItemApi(id, fields);
  }, []);

  const deleteItem = useCallback(async (id) => {
    setMenuItems(prev => prev.filter(it => String(it.id) !== String(id)));
    await deleteMenuItemApi(id);
  }, []);

  const reorderItem = useCallback(async (id, newIndex) => {
    setMenuItems(prev => {
      const items = [...prev];
      const index = items.findIndex(i => String(i.id) === String(id));
      if (index === -1) return prev;
      const [moved] = items.splice(index, 1);
      items.splice(newIndex, 0, moved);
      return items;
    });
    await reorderMenuItemApi(id, newIndex);
  }, []);

  const swapItems = useCallback(async (i1, i2) => swapMenuItemsApi(i1, i2), []);
  const cleanupMenuPrices = useCallback(async () => cleanupMenuPricesApi(menuItems), [menuItems]);

  const addCategory = useCallback(async (name) => {
    const tempId = Date.now();
    const optimisticCat = { id: tempId, name, orderIndex: tempId };
    setCategories(prev => [...prev, optimisticCat]);
    return await addCategoryApi(name);
  }, []);

  const updateCategory = useCallback(async (id, fields) => {
    setCategories(prev => prev.map(c => String(c.id) === String(id) ? { ...c, ...fields } : c));
    await updateCategoryCascadeApi(id, fields, categories, menuItems, offers);
  }, [categories, menuItems, offers]);

  const deleteCategory = useCallback(async (id) => {
    setCategories(prev => prev.filter(c => String(c.id) !== String(id)));
    await deleteCategoryApi(id);
  }, []);

  const reorderCategory = useCallback(async (id, newIndex, name) => reorderCategoryApi(id, newIndex, name), []);

  const addOffer = useCallback(async (offer) => {
    const tempId = Date.now();
    const optimisticOffer = { ...offer, id: tempId, orderIndex: tempId };
    setOffers(prev => [...prev, optimisticOffer]);
    return await addOfferApi(offer);
  }, []);

  const updateOffer = useCallback(async (id, fields) => {
    setOffers(prev => prev.map(o => String(o.id) === String(id) ? { ...o, ...fields } : o));
    await updateOfferApi(id, fields);
  }, []);

  const deleteOffer = useCallback(async (id) => {
    setOffers(prev => prev.filter(o => String(o.id) !== String(id)));
    await deleteOfferApi(id);
  }, []);

  const reorderOffer = useCallback(async (id, newIndex) => reorderOfferApi(id, newIndex), []);

  const addFeatured = useCallback(async (item) => {
    const tempId = Date.now().toString();
    const optimisticFeatured = { ...item, id: tempId, orderIndex: Date.now() };
    setFeatured(prev => [...prev, optimisticFeatured]);
    return await addFeaturedApi(item);
  }, []);

  const updateFeatured = useCallback(async (id, data) => {
    setFeatured(prev => prev.map(f => String(f.id) === String(id) ? { ...f, ...data } : f));
    await updateFeaturedApi(id, data);
  }, []);

  const deleteFeatured = useCallback(async (id) => {
    setFeatured(prev => prev.filter(f => String(f.id) !== String(id)));
    await deleteFeaturedApi(id);
  }, []);

  const reorderFeatured = useCallback(async (id, newIndex) => reorderFeaturedApi(id, newIndex), []);

  const updateSettings = useCallback(async (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    await updateSettingsApi(newSettings);
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
      setIsCartOpen
    }}>
      {children}
    </AppContext.Provider>
  );
};
