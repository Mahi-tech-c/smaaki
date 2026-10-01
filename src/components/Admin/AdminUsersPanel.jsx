import React, { useState, useEffect } from 'react';
import { db, COLLECTIONS } from '../../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Shield, UserCheck, UserX, Trash2, Loader2, Clock, Crown } from 'lucide-react';

const AdminUsersPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores UID of user being acted upon

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.adminRoles));
      const usersData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (err) {
      console.error("Error fetching admin users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (uid, newStatus) => {
    setActionLoading(uid);
    try {
      const userRef = doc(db, COLLECTIONS.adminRoles, uid);
      await updateDoc(userRef, { status: newStatus });
      setUsers(users.map(u => u.id === uid ? { ...u, status: newStatus } : u));
    } catch (err) {
      console.error("Error updating user status:", err);
      alert("Failed to update user status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (uid) => {
    if (!window.confirm("Are you sure you want to completely remove this user request?")) return;
    
    setActionLoading(uid);
    try {
      await deleteDoc(doc(db, COLLECTIONS.adminRoles, uid));
      setUsers(users.filter(u => u.id !== uid));
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user record.");
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-pink-600 animate-spin" />
      </div>
    );
  }

  const superadmins = users.filter(u => u.status === 'superadmin');
  const approved = users.filter(u => u.status === 'approved');
  const pending = users.filter(u => u.status === 'pending');

  const UserCard = ({ user, type }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-pink-100 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          type === 'super' ? 'bg-amber-100 text-amber-600' :
          type === 'approved' ? 'bg-green-100 text-green-600' :
          'bg-yellow-100 text-yellow-600'
        }`}>
          {type === 'super' ? <Crown size={24} /> : type === 'approved' ? <Shield size={24} /> : <Clock size={24} />}
        </div>
        <div>
          <p className="font-black text-pink-900 text-lg">{user.email}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {type === 'super' ? 'Master Admin' : type === 'approved' ? 'Approved Admin' : 'Pending Request'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {actionLoading === user.id ? (
          <Loader2 className="w-6 h-6 animate-spin text-pink-600" />
        ) : (
          <>
            {type === 'pending' && (
              <button onClick={() => handleUpdateStatus(user.id, 'approved')} className="p-3 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl transition-colors" title="Approve">
                <UserCheck size={20} />
              </button>
            )}
            {type === 'approved' && (
              <button onClick={() => handleUpdateStatus(user.id, 'pending')} className="p-3 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded-xl transition-colors" title="Revoke Access">
                <UserX size={20} />
              </button>
            )}
            {type !== 'super' && (
              <button onClick={() => handleDeleteUser(user.id)} className="p-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors" title="Delete Request">
                <Trash2 size={20} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      <div className="bg-gradient-to-r from-pink-600 to-pink-500 rounded-[2.5rem] p-8 text-white shadow-xl shadow-pink-200 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-widest mb-2">Team Management</h2>
          <p className="text-pink-100 font-medium">Approve or revoke access to the admin dashboard.</p>
        </div>
        <div className="hidden md:flex w-16 h-16 bg-white/20 rounded-2xl items-center justify-center backdrop-blur-md">
          <Shield size={32} className="text-white" />
        </div>
      </div>

      <div className="space-y-6">
        {pending.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-pink-900 uppercase tracking-widest border-b border-pink-100 pb-2">Pending Requests ({pending.length})</h3>
            <div className="grid gap-4">
              {pending.map(u => <UserCard key={u.id} user={u} type="pending" />)}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-sm font-black text-pink-900 uppercase tracking-widest border-b border-pink-100 pb-2">Master Administrator</h3>
          <div className="grid gap-4">
            {superadmins.map(u => <UserCard key={u.id} user={u} type="super" />)}
          </div>
        </div>

        {approved.length > 0 && (
          <div className="space-y-4 mt-8">
            <h3 className="text-sm font-black text-pink-900 uppercase tracking-widest border-b border-pink-100 pb-2">Approved Admins ({approved.length})</h3>
            <div className="grid gap-4">
              {approved.map(u => <UserCard key={u.id} user={u} type="approved" />)}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminUsersPanel;
