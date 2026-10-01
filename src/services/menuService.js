import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch, 
  deleteField,
  getDocs
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import { menuItems as defaultMenuItems } from '../data/menu';

// ============================================================================
// POPULATE NEW FIREBASE PROJECT WITH BASE DATA
// Automatically initializes the new Firebase project's database using the 
// menu dataset, without connecting to or touching the old Firebase project.
// ============================================================================
export const syncMenuDataToNewFirebase = async () => {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.categories));
    if (!snap.empty) {
      return; // Already initialized in this Firebase project!
    }

    const batch = writeBatch(db);
    
    // Create categories from defaultMenuItems
    const categoryNames = Array.from(new Set(defaultMenuItems.map(i => i.category)));
    categoryNames.forEach((name, idx) => {
      const catId = (idx + 1).toString();
      const catRef = doc(db, COLLECTIONS.categories, catId);
      batch.set(catRef, { id: idx + 1, name, orderIndex: idx + 1 });
    });

    // Populate menu items
    defaultMenuItems.forEach((item, idx) => {
      const itemRef = doc(db, COLLECTIONS.menuItems, item.id.toString());
      batch.set(itemRef, {
        ...item,
        orderIndex: idx + 1
      });
    });

    await batch.commit();
    console.log("Successfully initialized new Firebase database with all menu items & departments!");
  } catch (err) {
    console.warn("Could not sync to new Firebase database:", err);
  }
};

// ========================
// MENU ITEMS
// ========================
export const addMenuItemApi = async (item) => {
  const id = Date.now();
  const newItem = { ...item, id, orderIndex: id };
  await setDoc(doc(db, COLLECTIONS.menuItems, id.toString()), newItem);
  return newItem;
};

export const updateMenuItemApi = async (id, updatedFields) => {
  await updateDoc(doc(db, COLLECTIONS.menuItems, id.toString()), updatedFields);
};

export const deleteMenuItemApi = async (id) => {
  if (!id) return;
  await deleteDoc(doc(db, COLLECTIONS.menuItems, id.toString()));
};

export const reorderMenuItemApi = async (id, newOrderIndex) => {
  await updateDoc(doc(db, COLLECTIONS.menuItems, id.toString()), { orderIndex: newOrderIndex });
};

export const swapMenuItemsApi = async (item1, item2) => {
  const batch = writeBatch(db);
  let order1 = item1.orderIndex !== undefined ? Number(item1.orderIndex) : Number(item1.id);
  let order2 = item2.orderIndex !== undefined ? Number(item2.orderIndex) : Number(item2.id);
  if (order1 === order2) order1 = order1 + 1;

  const doc1Ref = doc(db, COLLECTIONS.menuItems, item1.id.toString());
  const doc2Ref = doc(db, COLLECTIONS.menuItems, item2.id.toString());
  batch.update(doc1Ref, { orderIndex: order2 });
  batch.update(doc2Ref, { orderIndex: order1 });
  await batch.commit();
};

export const cleanupMenuPricesApi = async (menuItems) => {
  const batch = writeBatch(db);
  const itemsToFix = menuItems.filter(item => item.originalPrice);

  itemsToFix.forEach(item => {
    const docRef = doc(db, COLLECTIONS.menuItems, item.id.toString());
    batch.update(docRef, { 
      price: item.originalPrice,
      originalPrice: deleteField() 
    });
  });

  await batch.commit();
};

// ========================
// CATEGORIES
// ========================
export const addCategoryApi = async (catName) => {
  const id = Date.now();
  const newCat = { name: catName, id, orderIndex: id };
  await setDoc(doc(db, COLLECTIONS.categories, id.toString()), newCat);
  return newCat;
};

export const updateCategoryCascadeApi = async (id, updatedFields, categories, menuItems, offers) => {
  const batch = writeBatch(db);
  const catRef = doc(db, COLLECTIONS.categories, id.toString());
  batch.update(catRef, updatedFields);

  if (updatedFields.name) {
    const oldCat = categories.find(c => c.id === id);
    const oldName = oldCat ? oldCat.name : null;

    if (oldName && oldName !== updatedFields.name) {
      menuItems.forEach(item => {
        if (item.category === oldName) {
          const itemRef = doc(db, COLLECTIONS.menuItems, item.id.toString());
          batch.update(itemRef, { category: updatedFields.name });
        }
      });

      offers.forEach(offer => {
        let needsUpdate = false;
        const updateData = {};

        if (offer.category === oldName) {
          updateData.category = updatedFields.name;
          needsUpdate = true;
        }

        if (offer.categories && offer.categories.includes(oldName)) {
          updateData.categories = offer.categories.map(c => c === oldName ? updatedFields.name : c);
          needsUpdate = true;
        }

        if (needsUpdate) {
          const offerRef = doc(db, COLLECTIONS.offers, offer.id.toString());
          batch.update(offerRef, updateData);
        }
      });
    }
  }
  await batch.commit();
};

export const deleteCategoryApi = async (id) => {
  if (!id) return;
  await deleteDoc(doc(db, COLLECTIONS.categories, id.toString()));
};

export const reorderCategoryApi = async (id, newOrderIndex, catName) => {
  const docRef = doc(db, COLLECTIONS.categories, id.toString());
  const updateData = { orderIndex: newOrderIndex };
  if (catName) updateData.name = catName;
  await setDoc(docRef, updateData, { merge: true });
};

// ========================
// OFFERS
// ========================
export const addOfferApi = async (offer) => {
  const id = Date.now();
  const newOffer = { ...offer, id, orderIndex: id };
  await setDoc(doc(db, COLLECTIONS.offers, id.toString()), newOffer);
  return newOffer;
};

export const updateOfferApi = async (id, updatedFields) => {
  await updateDoc(doc(db, COLLECTIONS.offers, id.toString()), updatedFields);
};

export const deleteOfferApi = async (id) => {
  if (!id) return;
  await deleteDoc(doc(db, COLLECTIONS.offers, id.toString()));
};

export const reorderOfferApi = async (id, newOrderIndex) => {
  await updateDoc(doc(db, COLLECTIONS.offers, id.toString()), { orderIndex: newOrderIndex });
};

// ========================
// FEATURED ITEMS
// ========================
export const addFeaturedApi = async (item) => {
  const docRef = doc(collection(db, COLLECTIONS.featured));
  const newItem = { ...item, orderIndex: Date.now() };
  await setDoc(docRef, newItem);
  return newItem;
};

export const updateFeaturedApi = async (id, data) => {
  await updateDoc(doc(db, COLLECTIONS.featured, id.toString()), data);
};

export const deleteFeaturedApi = async (id) => {
  await deleteDoc(doc(db, COLLECTIONS.featured, id.toString()));
};

export const reorderFeaturedApi = async (id, newOrderIndex) => {
  await updateDoc(doc(db, COLLECTIONS.featured, id.toString()), { orderIndex: newOrderIndex });
};

// ========================
// SETTINGS
// ========================
export const updateSettingsApi = async (newSettings) => {
  await setDoc(doc(db, COLLECTIONS.settings, 'restaurant'), newSettings, { merge: true });
};
