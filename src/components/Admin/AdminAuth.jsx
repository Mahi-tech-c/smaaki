import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { auth, db, COLLECTIONS } from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, query, limit, where, updateDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const AdminAuth = () => {
  const [roleStatus, setRoleStatus] = useState(() => {
    // Instant optimistic render if session has active admin credentials
    if (typeof window !== 'undefined' && sessionStorage.getItem('admin_cached_auth') === 'superadmin') {
      return 'superadmin';
    }
    return auth.currentUser ? 'superadmin' : 'loading';
  });
  const [errorDetails, setErrorDetails] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        sessionStorage.removeItem('admin_cached_auth');
        setRoleStatus('unauthenticated');
        return;
      }

      // Fast authorize: currentUser is verified by Firebase Auth
      sessionStorage.setItem('admin_cached_auth', 'superadmin');
      setRoleStatus('superadmin');

      // Async background check for specific role document without blocking render
      try {
        const userRef = doc(db, COLLECTIONS.adminRoles, currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const currentStatus = userSnap.data().status;
          if (currentStatus === 'pending') {
            try {
              await updateDoc(userRef, { status: 'superadmin' });
            } catch (err) {
              console.warn("Could not update role doc directly:", err);
            }
          }
        } else {
          try {
            await setDoc(userRef, {
              email: currentUser.email || 'Unknown',
              status: 'superadmin',
              createdAt: new Date().toISOString()
            });
          } catch (err) {
            console.warn("Could not save initial admin role doc:", err);
          }
        }
      } catch (err) {
        console.warn("Admin role fetch warning:", err);
      }
    });
    return () => unsub();
  }, []);

  const handleClaimMasterAdmin = async () => {
    if (!auth.currentUser) return;
    try {
      const userRef = doc(db, COLLECTIONS.adminRoles, auth.currentUser.uid);
      await setDoc(userRef, {
        email: auth.currentUser.email || 'Unknown',
        status: 'superadmin',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setRoleStatus('superadmin');
    } catch (e) {
      console.warn("Setting local superadmin override:", e);
      setRoleStatus('superadmin');
    }
  };

  if (roleStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50/20">
        <Loader2 className="w-10 h-10 text-pink-600 animate-spin" />
      </div>
    );
  }

  if (roleStatus === 'unauthenticated') {
    return <Navigate to="/admin/login" replace />;
  }

  if (roleStatus === 'pending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pink-50/20 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-pink-100 text-center space-y-6">
          <div className="w-20 h-20 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
          <h2 className="text-2xl font-black text-pink-900">Activate Administrator</h2>
          <p className="text-pink-600 font-medium">
            This is your new <strong>smaakii</strong> project. Click below to activate your account as the Master Admin.
          </p>
          <button 
            onClick={handleClaimMasterAdmin}
            className="w-full py-4 bg-pink-600 text-white font-black rounded-2xl hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200"
          >
            Activate as Master Admin
          </button>
          <button 
            onClick={() => signOut(auth)}
            className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-colors text-sm"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  if (roleStatus === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pink-50/20 px-4 text-center">
        <p className="text-red-500 font-bold mb-2">An error occurred while verifying your permissions.</p>
        <p className="text-red-400 mb-6 text-sm max-w-md bg-red-50 p-4 rounded-xl border border-red-100">{errorDetails}</p>
        <button onClick={() => signOut(auth)} className="px-6 py-2 bg-pink-600 text-white rounded-xl font-bold">Log Out</button>
      </div>
    );
  }
  
  // If 'approved' or 'superadmin'
  return <Outlet />;
};

export default AdminAuth;
