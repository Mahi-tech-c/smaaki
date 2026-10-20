import React, { useState, useEffect, useMemo } from 'react';
import { db, COLLECTIONS } from '../../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { TrendingUp, ShoppingBag, IndianRupee, BarChart2, Clock, Users, Flame, CheckCircle2, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

// ── Helpers ──────────────────────────────────────────────────────────────────

const now = () => new Date();

const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };

const timeAgo = (iso) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff/60)}m ago`;
  if (diff < 86400) return `${Math.round(diff/3600)}h ago`;
  return `${Math.round(diff/86400)}d ago`;
};

const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 11); // 11–23

const STATUS_COLORS = {
  Received: 'bg-pink-100 text-pink-700',
  Preparing: 'bg-amber-100 text-amber-700',
  Ready: 'bg-blue-100 text-blue-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-red-100 text-red-700',
};

// ── KPI Card ─────────────────────────────────────────────────────────────────

const KpiCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-5 flex items-start gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-2xl font-extrabold text-gray-800 truncate">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── 7-Day SVG Bar Chart ───────────────────────────────────────────────────────

const BarChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.revenue), 1);
  const chartH = 140;
  const barW = 32;
  const gap = 16;
  const totalW = data.length * (barW + gap) - gap;

  return (
    <div className="overflow-x-auto">
      <svg width={totalW + 40} height={chartH + 56} className="mx-auto">
        {data.map((d, i) => {
          const barH = Math.max(4, (d.revenue / max) * chartH);
          const x = i * (barW + gap) + 20;
          const y = chartH - barH + 4;
          return (
            <g key={i}>
              {/* Bar */}
              <rect x={x} y={y} width={barW} height={barH} rx={6} fill={d.revenue > 0 ? '#db2777' : '#fce7f3'} />
              {/* Value label */}
              {d.revenue > 0 && (
                <text x={x + barW/2} y={y - 6} textAnchor="middle" fontSize={9} fontWeight="700" fill="#db2777">
                  ₹{d.revenue >= 1000 ? `${(d.revenue/1000).toFixed(1)}k` : d.revenue}
                </text>
              )}
              {/* Day label */}
              <text x={x + barW/2} y={chartH + 22} textAnchor="middle" fontSize={11} fontWeight="600" fill="#6b7280">
                {d.label}
              </text>
              {/* Order count */}
              <text x={x + barW/2} y={chartH + 38} textAnchor="middle" fontSize={9} fill="#9ca3af">
                {d.count} orders
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const AdminAnalytics = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, COLLECTIONS?.orders || 'orders'));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  // ── Derived Data ────────────────────────────────────────────────────────────

  const { todayRevenue, todayOrders, weekRevenue, monthRevenue, weekOrders, monthOrders } = useMemo(() => {
    const today = startOfDay(now());
    const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 6);
    const monthAgo = new Date(today); monthAgo.setDate(today.getDate() - 29);

    let tRev = 0, tOrd = 0, wRev = 0, wOrd = 0, mRev = 0, mOrd = 0;
    orders.forEach(o => {
      if (o.status === 'Cancelled') return;
      const d = new Date(o.createdAt || 0);
      const amt = Number(o.grandTotal) || 0;
      if (d >= today)       { tRev += amt; tOrd++; }
      if (d >= weekAgo)     { wRev += amt; wOrd++; }
      if (d >= monthAgo)    { mRev += amt; mOrd++; }
    });
    return { todayRevenue: tRev, todayOrders: tOrd, weekRevenue: wRev, weekOrders: wOrd, monthRevenue: mRev, monthOrders: mOrd };
  }, [orders]);

  // 7-day bar chart data
  const sevenDayData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = startOfDay(now());
      d.setDate(d.getDate() - (6 - i));
      return { date: d, label: DAY_LABELS[d.getDay()], revenue: 0, count: 0 };
    });
    orders.forEach(o => {
      if (o.status === 'Cancelled') return;
      const d = startOfDay(new Date(o.createdAt || 0));
      const slot = days.find(s => s.date.getTime() === d.getTime());
      if (slot) { slot.revenue += Number(o.grandTotal) || 0; slot.count++; }
    });
    return days;
  }, [orders]);

  // Top 5 items by quantity
  const topItems = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      if (o.status === 'Cancelled') return;
      (o.verifiedItems || []).forEach(item => {
        if (!map[item.name]) map[item.name] = { name: item.name, qty: 0, revenue: 0 };
        map[item.name].qty += Number(item.quantity) || 1;
        map[item.name].revenue += Number(item.lineTotal) || 0;
      });
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [orders]);

  // Order type breakdown
  const typeBreakdown = useMemo(() => {
    const counts = { 'dine-in': 0, takeaway: 0, delivery: 0 };
    orders.forEach(o => {
      if (o.status === 'Cancelled') return;
      const t = (o.orderType || 'dine-in').toLowerCase();
      if (counts[t] !== undefined) counts[t]++;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts).map(([type, count]) => ({
      type,
      count,
      pct: Math.round((count / total) * 100),
      color: type === 'dine-in' ? 'bg-pink-500' : type === 'takeaway' ? 'bg-amber-500' : 'bg-blue-500',
      label: type.charAt(0).toUpperCase() + type.slice(1)
    }));
  }, [orders]);

  // Hourly heatmap (last 30 days, orders per hour 11–23)
  const hourlyData = useMemo(() => {
    const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30);
    const counts = {};
    HOURS.forEach(h => { counts[h] = 0; });
    orders.forEach(o => {
      if (o.status === 'Cancelled') return;
      const d = new Date(o.createdAt || 0);
      if (d < thirtyAgo) return;
      const h = d.getHours();
      if (counts[h] !== undefined) counts[h]++;
    });
    const max = Math.max(...Object.values(counts), 1);
    return HOURS.map(h => ({ hour: h, count: counts[h], intensity: counts[h] / max }));
  }, [orders]);

  // Recent activity — last 10 orders
  const recentOrders = useMemo(() =>
    [...orders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 10),
    [orders]
  );

  // ── Loading Skeleton ────────────────────────────────────────────────────────

  if (loading) return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-pink-50 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-pink-50 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-48 bg-pink-50 rounded-2xl" />
        <div className="h-48 bg-pink-50 rounded-2xl" />
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800">Analytics</h2>
          <p className="text-sm text-gray-400 mt-0.5">Live business overview — updates in real-time</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={IndianRupee} label="Today's Revenue" value={formatCurrency(todayRevenue)} sub={`${todayOrders} orders`} color="bg-pink-600" />
        <KpiCard icon={ShoppingBag} label="Today's Orders" value={todayOrders} sub="live count" color="bg-amber-500" />
        <KpiCard icon={TrendingUp} label="This Week" value={formatCurrency(weekRevenue)} sub={`${weekOrders} orders`} color="bg-purple-600" />
        <KpiCard icon={BarChart2} label="This Month" value={formatCurrency(monthRevenue)} sub={`${monthOrders} orders`} color="bg-blue-600" />
      </div>

      {/* 7-Day Revenue Chart */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
        <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider mb-4">7-Day Revenue</h3>
        <BarChart data={sevenDayData} />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top 5 Items */}
        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
          <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Flame size={15} className="text-pink-500" /> Top Selling Items
          </h3>
          {topItems.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No order data yet</p>
          ) : (
            <div className="space-y-3">
              {topItems.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 text-xs font-extrabold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-700 truncate">{item.name}</span>
                      <span className="text-xs text-gray-400 shrink-0 ml-2">{item.qty} sold</span>
                    </div>
                    <div className="h-1.5 bg-pink-50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-pink-500 rounded-full transition-all"
                        style={{ width: `${topItems[0].qty > 0 ? (item.qty / topItems[0].qty) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-500 shrink-0">{formatCurrency(item.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Type Breakdown */}
        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
          <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users size={15} className="text-pink-500" /> Order Types
          </h3>
          {/* Segmented bar */}
          <div className="h-6 rounded-full overflow-hidden flex mb-4">
            {typeBreakdown.map(t => (
              <div key={t.type} className={`${t.color} transition-all`} style={{ width: `${t.pct}%` }} />
            ))}
          </div>
          <div className="space-y-3">
            {typeBreakdown.map(t => (
              <div key={t.type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${t.color}`} />
                  <span className="text-sm font-semibold text-gray-700">{t.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-800">{t.count}</span>
                  <span className="text-xs text-gray-400 ml-1.5">{t.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hourly Heatmap */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
        <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-2">
          <Clock size={15} className="text-pink-500" /> Hourly Traffic Heatmap
        </h3>
        <p className="text-xs text-gray-400 mb-4">Based on last 30 days of orders. Darker = busier.</p>
        <div className="flex gap-2 flex-wrap">
          {hourlyData.map(({ hour, count, intensity }) => {
            const bg = intensity === 0 ? '#fdf2f8' : `rgba(219,39,119,${0.1 + intensity * 0.85})`;
            const textColor = intensity > 0.5 ? '#fff' : '#be185d';
            return (
              <div
                key={hour}
                title={`${hour}:00 — ${count} orders`}
                style={{ backgroundColor: bg, color: textColor }}
                className="w-14 h-14 rounded-xl flex flex-col items-center justify-center text-center cursor-default transition-all"
              >
                <span className="text-[11px] font-bold">{hour > 12 ? `${hour-12}pm` : hour === 12 ? '12pm' : `${hour}am`}</span>
                <span className="text-[10px] font-semibold opacity-80">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
        <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <RefreshCw size={15} className="text-pink-500" /> Recent Orders
        </h3>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No orders yet</p>
        ) : (
          <div className="divide-y divide-pink-50">
            {recentOrders.map(o => (
              <div key={o.id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle2 size={16} className="text-pink-300 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-700">
                      #{o.id?.slice(-6).toUpperCase()}
                      {o.tableNumber && <span className="ml-1.5 text-gray-400">· Table {o.tableNumber}</span>}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {(o.verifiedItems || []).slice(0, 2).map(i => i.name).join(', ')}
                      {(o.verifiedItems || []).length > 2 && ` +${o.verifiedItems.length - 2} more`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
                    {o.status}
                  </span>
                  <span className="text-sm font-extrabold text-gray-700">{formatCurrency(o.grandTotal)}</span>
                  <span className="text-[11px] text-gray-400">{timeAgo(o.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminAnalytics;
