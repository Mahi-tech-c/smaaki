import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// ============================================================================
// DEDICATED FIREBASE CONFIGURATION FOR SMAAKII PROJECT
// Completely separate Firebase project - zero connection to old project
// ============================================================================

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCRDau16vthNF-fVO5VMJP_Kj8nHd3S9nU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smaakii.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smaakii",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smaakii.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "835337319858",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:835337319858:web:5970e32e8b847d1cf560ab",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-WPD2NYWVFB"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Dedicated Collections for smaakii
export const COLLECTIONS = {
  categories: 'categories',
  menuItems: 'menuItems',
  offers: 'offers',
  settings: 'settings',
  featured: 'featured',
  adminRoles: 'admin_roles'
};
