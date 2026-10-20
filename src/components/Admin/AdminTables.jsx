import React, { useContext, useState, useEffect, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';
import { db, COLLECTIONS } from '../../firebase';
import { collection, onSnapshot, query, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Users, CheckCircle2, XCircle, Bell, LayoutGrid,
  Utensils, Clock, ChevronDown, ChevronUp, QrCode, X, Settings
} from 'lucide-react';

// ── Time Helpers ──────────────────────────────────────────────────────────────

const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
};

const elapsedMin = (iso) => {
  if (!iso) return 0;
  return Math.round((Date.now() - new Date(iso).getTime()) / 60000);
};

// ── Table Card ────────────────────────────────────────────────────────────────

const TableCard = ({ table, onResolveCall, onMarkClear }) => {
  const [expanded, setExpanded] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const statusBorder = table.hasWaiterCall
    ? 'border-amber-400 bg-amber-50'
    : table.isOccupied
    ? 'border-pink-400 bg-pink-50'
    : 'border-emerald-400 bg-emerald-50';

  const statusDot = table.hasWaiterCall
    ? 'bg-amber-400 animate-pulse'
    : table.isOccupied
    ? 'bg-pink-500'
    : 'bg-emerald-500';

  const statusText = table.hasWaiterCall
    ? 'Waiter Called'
    : table.isOccupied
    ? 'Occupied'
    : 'Vacant';

  const statusTextColor = table.hasWaiterCall
    ? 'text-amber-700'
    : table.isOccupied
    ? 'text-pink-700'
    : 'text-emerald-700';

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${statusBorder}`}>
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-2xl font-extrabold text-gray-800">Table {table.number}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${statusDot}`} />
              <span className={`text-xs font-bold ${statusTextColor}`}>{statusText}</span>
            </div>
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            title="View orders"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Occupied info */}
        {table.isOccupied && table.orders.length > 0 && (
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 flex items-center gap-1"><Utensils size={12} /> {table.orders.reduce((s, o) => s + (o.verifiedItems?.length || 0), 0)} items</span>
              <span className="font-extrabold text-gray-800">
                ₹{table.orders.reduce((s, o) => s + (Number(o.grandTotal) || 0), 0).toFixed(0)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <Clock size={11} />
              {elapsedMin(table.orders[table.orders.length - 1]?.createdAt)} min at table
            </div>
          </div>
        )}

        {/* Waiter call resolve */}
        {table.hasWaiterCall && (
          <button
            onClick={() => onResolveCall(table.callId)}
            className="w-full py-2 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition-colors mb-2 flex items-center justify-center gap-1.5"
          >
            <Bell size={13} /> Resolve Waiter Call
          </button>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {table.isOccupied && (
            <button
              onClick={() => onMarkClear(table.orders.map(o => o.id))}
              className="flex-1 py-1.5 text-xs font-bold text-pink-600 border border-pink-200 rounded-xl hover:bg-pink-50 transition-colors"
            >
              Mark Clear
            </button>
          )}
          <button
            onClick={() => setShowQr(v => !v)}
            className="flex-1 py-1.5 text-xs font-bold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
          >
            <QrCode size={12} /> QR
          </button>
        </div>
      </div>

      {/* QR Code */}
      {showQr && (
        <div className="border-t border-dashed border-pink-200 p-4 flex flex-col items-center gap-2 bg-pink-50/40">
          <QRCodeCanvas value={`${origin}/table/${table.number}`} size={100} fgColor="#db2777" bgColor="#ffffff" level="M" />
          <p className="text-[10px] text-gray-400">Scan → Table {table.number}</p>
        </div>
      )}

      {/* Expanded Orders */}
      {expanded && (
        <div className="border-t border-pink-100 bg-gray-50/60 p-4 space-y-3">
          {table.orders.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">No active orders</p>
          ) : table.orders.map(o => (
            <div key={o.id} className="bg-white rounded-xl border border-pink-100 p-3 text-xs space-y-1.5">
              <div className="flex justify-between font-bold text-gray-700">
                <span>#{o.id?.slice(-6).toUpperCase()}</span>
                <span>₹{Number(o.grandTotal).toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  o.status === 'Received' ? 'bg-pink-100 text-pink-700' :
                  o.status === 'Preparing' ? 'bg-amber-100 text-amber-700' :
                  o.status === 'Ready' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                }`}>{o.status}</span>
                <span className="text-gray-400">{timeAgo(o.createdAt)}</span>
              </div>
              <ul className="space-y-0.5 text-gray-500">
                {(o.verifiedItems || []).map((item, i) => (
                  <li key={i}>{item.quantity}× {item.name}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const AdminTables = () => {
  const { settings, updateSettings } = useContext(AppContext);
  const maxTables = Number(settings.maxTables) || 20;

  const [orders, setOrders] = useState([]);
  const [calls, setCalls] = useState([]);
  const [editingMax, setEditingMax] = useState(false);
  const [newMax, setNewMax] = useState(maxTables);
  const [saving, setSaving] = useState(false);

  // ── Firestore Listeners ────────────────────────────────────────────────────

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, COLLECTIONS?.orders || 'orders')),
      snap => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => {}
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, COLLECTIONS?.tableCalls || 'table_calls')),
      snap => setCalls(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => !c.resolved)),
      () => {}
    );
    return () => unsub();
  }, []);

  // ── Table Data Derivation ──────────────────────────────────────────────────

  const tableData = useMemo(() => {
    return Array.from({ length: maxTables }, (_, i) => {
      const num = i + 1;
      const activeOrders = orders.filter(o => {
        const s = (o.status || '').toLowerCase();
        return String(o.tableNumber) === String(num) && s !== 'completed' && s !== 'cancelled';
      });
      const call = calls.find(c => String(c.tableNumber) === String(num));
      return {
        number: num,
        orders: activeOrders,
        isOccupied: activeOrders.length > 0,
        hasWaiterCall: Boolean(call),
        callId: call?.id,
      };
    });
  }, [orders, calls, maxTables]);

  const occupied = tableData.filter(t => t.isOccupied).length;
  const vacant = tableData.length - occupied;
  const pendingCalls = calls.length;

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleResolveCall = async (callId) => {
    try {
      await updateDoc(doc(db, COLLECTIONS?.tableCalls || 'table_calls', callId), {
        resolved: true, resolvedAt: serverTimestamp()
      });
    } catch (e) { console.error(e); }
  };

  const handleMarkClear = async (orderIds) => {
    if (!window.confirm('Mark all active orders for this table as Completed?')) return;
    try {
      await Promise.all(orderIds.map(id =>
        updateDoc(doc(db, COLLECTIONS?.orders || 'orders', id), {
          status: 'Completed', completedAt: serverTimestamp()
        })
      ));
    } catch (e) { console.error(e); }
  };

  const handleSaveMaxTables = async () => {
    setSaving(true);
    try { await updateSettings({ maxTables: Number(newMax) || 20 }); setEditingMax(false); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800">Table Floor Plan</h2>
          <p className="text-sm text-gray-400 mt-0.5">Live table status — updates in real-time</p>
        </div>
        <button
          onClick={() => { setEditingMax(true); setNewMax(maxTables); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Settings size={15} /> Configure Tables
        </button>
      </div>

      {/* Max Tables Editor */}
      {editingMax && (
        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-5 flex items-center gap-4 flex-wrap">
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Tables</label>
            <input
              type="number"
              min={1}
              max={100}
              value={newMax}
              onChange={e => setNewMax(e.target.value)}
              className="mt-1 block w-32 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveMaxTables} disabled={saving} className="px-4 py-2 bg-pink-600 text-white text-sm font-bold rounded-xl hover:bg-pink-700 disabled:opacity-60 transition-colors">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditingMax(false)} className="px-4 py-2 border border-gray-200 text-sm font-bold rounded-xl hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Tables', value: tableData.length, color: 'text-gray-700' },
          { label: 'Occupied', value: occupied, color: 'text-pink-600' },
          { label: 'Vacant', value: vacant, color: 'text-emerald-600' },
          { label: 'Waiter Calls', value: pendingCalls, color: pendingCalls > 0 ? 'text-amber-600' : 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-pink-100 shadow-sm p-4 text-center">
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap text-xs font-semibold">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Vacant</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-pink-500" /> Occupied</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" /> Waiter Called</span>
      </div>

      {/* Table Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {tableData.map(table => (
          <TableCard
            key={table.number}
            table={table}
            onResolveCall={handleResolveCall}
            onMarkClear={handleMarkClear}
          />
        ))}
      </div>

    </div>
  );
};

export default AdminTables;
