import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Eye,
  EyeOff,
  Printer,
  XCircle,
  RefreshCw,
  ReceiptText,
  FilterX,
} from "lucide-react";
import { db, COLLECTIONS } from "../../firebase";
import { onSnapshot, collection, doc, updateDoc } from "firebase/firestore";
import { formatCurrency } from "../../utils/helpers";

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

const STATUS_META = {
  Received:   { label: "Received",   bg: "bg-pink-100",   text: "text-pink-700",   dot: "bg-pink-500"   },
  Preparing:  { label: "Preparing",  bg: "bg-amber-100",  text: "text-amber-700",  dot: "bg-amber-500"  },
  Ready:      { label: "Ready",      bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-500"   },
  Completed:  { label: "Completed",  bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500"  },
  Cancelled:  { label: "Cancelled",  bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500"    },
};

const FILTER_PILLS = [
  { id: "all",       label: "All"       },
  { id: "today",     label: "Today"     },
  { id: "week",      label: "This Week" },
  { id: "Dine-in",   label: "Dine-in"   },
  { id: "Takeaway",  label: "Takeaway"  },
  { id: "Delivery",  label: "Delivery"  },
  { id: "Received",  label: "Received"  },
  { id: "Preparing", label: "Preparing" },
  { id: "Ready",     label: "Ready"     },
  { id: "Completed", label: "Completed" },
  { id: "Cancelled", label: "Cancelled" },
];

const SORT_COLS = ["createdAt", "grandTotal", "status"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a short 6-char order ID fragment for display */
const shortId = (id = "") => id.slice(-6).toUpperCase();

/** Converts a Firestore Timestamp or JS Date / epoch to a JS Date */
const toDate = (val) => {
  if (!val) return new Date(0);
  if (val?.toDate) return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val);
};

/** Formats a Date object to "DD MMM, HH:MM" */
const fmtDateTime = (val) => {
  const d = toDate(val);
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
};

/** Midnight of today */
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Midnight of 7 days ago */
const startOfWeek = () => {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Colored status pill */
const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] ?? { label: status, bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
};

/** Payment badge */
const PaymentBadge = ({ status }) => {
  const paid = status === "Paid" || status === "paid";
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${paid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
      {paid ? "Paid" : "Unpaid"}
    </span>
  );
};

/** Copy-to-clipboard button */
const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={copy} title="Copy full ID" className="ml-1 text-gray-400 hover:text-pink-600 transition-colors">
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
};

/** Column header with sort toggle */
const SortHeader = ({ label, col, sortCol, sortDir, onSort }) => {
  const active = sortCol === col;
  return (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap group"
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={`transition-colors ${active ? "text-pink-600" : "text-gray-300 group-hover:text-gray-400"}`}>
          {active && sortDir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
      </span>
    </th>
  );
};

// ─── Thermal Bill Printer ─────────────────────────────────────────────────────
const printBill = (order) => {
  const items = order.verifiedItems ?? [];
  const itemRows = items.map(
    (it) =>
      `<tr>
        <td style="padding:2px 4px;font-size:12px;">${it.name}</td>
        <td style="padding:2px 4px;font-size:12px;text-align:center;">${it.quantity}</td>
        <td style="padding:2px 4px;font-size:12px;text-align:right;">₹${(it.price * it.quantity).toFixed(2)}</td>
      </tr>`
  ).join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>Bill – #${shortId(order.id)}</title>
      <style>
        @page { size: 80mm auto; margin: 4mm; }
        * { box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; width: 72mm; margin: 0 auto; color: #000; }
        h1 { text-align:center; font-size:16px; margin:4px 0 2px; }
        p.sub { text-align:center; font-size:10px; margin:0 0 6px; }
        hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
        table { width:100%; border-collapse:collapse; }
        th { font-size:11px; text-align:left; padding:2px 4px; border-bottom:1px solid #000; }
        th.r, td.r { text-align:right; }
        .total-row td { font-weight:bold; font-size:13px; padding-top:4px; }
        .foot { text-align:center; font-size:10px; margin-top:8px; }
      </style>
    </head>
    <body>
      <h1>Smaakenzzoo</h1>
      <p class="sub">Artisanal Cafe · Warangal, Telangana</p>
      <hr/>
      <table>
        <tr><td style="font-size:11px;">Order #</td><td class="r" style="font-size:11px;">${shortId(order.id)}</td></tr>
        <tr><td style="font-size:11px;">Date</td><td class="r" style="font-size:11px;">${fmtDateTime(order.createdAt)}</td></tr>
        <tr><td style="font-size:11px;">Type</td><td class="r" style="font-size:11px;">${order.orderType ?? "—"} ${order.tableNumber ? `· T${order.tableNumber}` : ""}</td></tr>
        ${order.customerName ? `<tr><td style="font-size:11px;">Customer</td><td class="r" style="font-size:11px;">${order.customerName}</td></tr>` : ""}
      </table>
      <hr/>
      <table>
        <tr><th>Item</th><th style="text-align:center;">Qty</th><th class="r">Amount</th></tr>
        ${itemRows}
      </table>
      <hr/>
      <table>
        ${order.discount  ? `<tr><td style="font-size:11px;">Discount</td><td class="r" style="font-size:11px;">-₹${Number(order.discount).toFixed(2)}</td></tr>` : ""}
        ${order.gst       ? `<tr><td style="font-size:11px;">GST</td><td class="r" style="font-size:11px;">+₹${Number(order.gst).toFixed(2)}</td></tr>` : ""}
        ${order.packingCharge ? `<tr><td style="font-size:11px;">Packing</td><td class="r" style="font-size:11px;">+₹${Number(order.packingCharge).toFixed(2)}</td></tr>` : ""}
        ${order.deliveryFee   ? `<tr><td style="font-size:11px;">Delivery</td><td class="r" style="font-size:11px;">+₹${Number(order.deliveryFee).toFixed(2)}</td></tr>` : ""}
        ${order.couponCode ? `<tr><td style="font-size:11px;">Coupon (${order.couponCode})</td><td class="r" style="font-size:11px;">Applied</td></tr>` : ""}
        <tr class="total-row"><td>Total</td><td class="r">₹${Number(order.grandTotal ?? 0).toFixed(2)}</td></tr>
        <tr><td style="font-size:11px;">Payment</td><td class="r" style="font-size:11px;">${order.paymentStatus ?? "—"}</td></tr>
      </table>
      <hr/>
      <div class="foot">Thank you for visiting Smaakenzzoo!<br/>Come back soon ☕</div>
    </body>
    </html>`;

  const win = window.open("", "_blank", "width=320,height=600");
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 400);
};

// ─── Cancel Confirm Dialog ────────────────────────────────────────────────────
const CancelDialog = ({ orderId, onClose, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-xl p-6 w-80 max-w-full">
      <h3 className="text-base font-semibold text-gray-800 mb-2">Cancel Order?</h3>
      <p className="text-sm text-gray-500 mb-5">
        Order <span className="font-mono font-bold text-pink-600">#{shortId(orderId)}</span> will be marked as{" "}
        <span className="font-semibold text-red-600">Cancelled</span>. This cannot be undone.
      </p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
        >
          Go Back
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition"
        >
          Yes, Cancel
        </button>
      </div>
    </div>
  </div>
);

// ─── Inline Expanded Row ──────────────────────────────────────────────────────
const ExpandedRow = ({ order, colSpan }) => {
  const items = order.verifiedItems ?? [];
  return (
    <tr className="bg-pink-50/40">
      <td colSpan={colSpan} className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Items list */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items Ordered</p>
            <div className="space-y-1">
              {items.length === 0 && (
                <p className="text-sm text-gray-400 italic">No item data available.</p>
              )}
              {items.map((it, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">
                    {it.name}
                    <span className="text-gray-400 ml-1">× {it.quantity}</span>
                  </span>
                  <span className="font-medium text-gray-800">
                    {formatCurrency(it.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>
            {order.specialInstructions && (
              <p className="mt-3 text-xs text-gray-500 italic">
                📝 {order.specialInstructions}
              </p>
            )}
          </div>

          {/* Order details + charges */}
          <div className="space-y-2">
            {order.customerName && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Customer</span>
                <span className="font-medium text-gray-800">{order.customerName}</span>
              </div>
            )}
            {order.couponCode && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Coupon</span>
                <span className="font-mono text-pink-600 font-semibold">{order.couponCode}</span>
              </div>
            )}
            {!!order.discount && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="text-green-600">− {formatCurrency(order.discount)}</span>
              </div>
            )}
            {!!order.gst && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">GST</span>
                <span className="text-gray-800">+ {formatCurrency(order.gst)}</span>
              </div>
            )}
            {!!order.packingCharge && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Packing Charge</span>
                <span className="text-gray-800">+ {formatCurrency(order.packingCharge)}</span>
              </div>
            )}
            {!!order.deliveryFee && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery Fee</span>
                <span className="text-gray-800">+ {formatCurrency(order.deliveryFee)}</span>
              </div>
            )}
            <div className="border-t border-pink-100 pt-2 flex justify-between text-sm font-bold">
              <span className="text-gray-700">Grand Total</span>
              <span className="text-pink-600">{formatCurrency(order.grandTotal ?? 0)}</span>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminOrderHistory() {
  const [allOrders, setAllOrders]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortCol, setSortCol]           = useState("createdAt");
  const [sortDir, setSortDir]           = useState("desc");
  const [page, setPage]                 = useState(1);
  const [expandedId, setExpandedId]     = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null); // order id to cancel
  const [cancelLoading, setCancelLoading] = useState(false);

  // ── Live Firestore subscription ──────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, COLLECTIONS.orders),
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAllOrders(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[AdminOrderHistory] Firestore error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ── Sort handler ─────────────────────────────────────────────────────────
  const handleSort = useCallback((col) => {
    setSortCol((prev) => {
      if (prev === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else setSortDir("desc");
      return col;
    });
    setPage(1);
  }, []);

  // ── Filter + search + sort ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    const today = startOfToday();
    const weekAgo = startOfWeek();
    const q = searchQuery.trim().toLowerCase();

    return allOrders
      .filter((o) => {
        // Date / type / status filters
        if (activeFilter === "today") {
          return toDate(o.createdAt) >= today;
        }
        if (activeFilter === "week") {
          return toDate(o.createdAt) >= weekAgo;
        }
        if (["Dine-in", "Takeaway", "Delivery"].includes(activeFilter)) {
          return o.orderType === activeFilter;
        }
        if (["Received", "Preparing", "Ready", "Completed", "Cancelled"].includes(activeFilter)) {
          return o.status === activeFilter;
        }
        return true; // "all"
      })
      .filter((o) => {
        if (!q) return true;
        const items = (o.verifiedItems ?? []).map((i) => i.name?.toLowerCase()).join(" ");
        return (
          o.id?.toLowerCase().includes(q) ||
          String(o.tableNumber ?? "").includes(q) ||
          (o.customerName ?? "").toLowerCase().includes(q) ||
          items.includes(q)
        );
      })
      .sort((a, b) => {
        let av, bv;
        if (sortCol === "createdAt") {
          av = toDate(a.createdAt).getTime();
          bv = toDate(b.createdAt).getTime();
        } else if (sortCol === "grandTotal") {
          av = Number(a.grandTotal ?? 0);
          bv = Number(b.grandTotal ?? 0);
        } else {
          av = (a.status ?? "").toLowerCase();
          bv = (b.status ?? "").toLowerCase();
        }
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
  }, [allOrders, activeFilter, searchQuery, sortCol, sortDir]);

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage    = Math.min(page, totalPages);
  const paginated   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Summary stats
  const totalRevenue = filtered
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + Number(o.grandTotal ?? 0), 0);

  // ── Cancel order ─────────────────────────────────────────────────────────
  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.orders, cancelTarget), { status: "Cancelled" });
    } catch (e) {
      console.error("[AdminOrderHistory] Cancel failed:", e);
    } finally {
      setCancelLoading(false);
      setCancelTarget(null);
    }
  };

  // ── Reset page on filter/search change ──────────────────────────────────
  useEffect(() => { setPage(1); }, [activeFilter, searchQuery]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Cancel dialog */}
      {cancelTarget && (
        <CancelDialog
          orderId={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={confirmCancel}
        />
      )}

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-pink-600 flex items-center justify-center shadow">
          <ReceiptText size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Order History</h1>
          <p className="text-sm text-gray-500">All orders · live updates</p>
        </div>
        {loading && (
          <RefreshCw size={16} className="ml-auto text-pink-500 animate-spin" />
        )}
      </div>

      {/* Search + Filter pills */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        {/* Search bar */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Order ID, Table, Customer or Item…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FilterX size={15} />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {FILTER_PILLS.map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(pill.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                activeFilter === pill.id
                  ? "bg-pink-600 text-white border-pink-600 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-pink-300 hover:text-pink-600"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 mb-4 px-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-gray-700">{filtered.length}</span>
          <span className="text-gray-500">orders found</span>
        </div>
        <div className="h-4 w-px bg-gray-200 hidden sm:block" />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Total Revenue (excl. cancelled):</span>
          <span className="font-bold text-pink-600">{formatCurrency(totalRevenue)}</span>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-pink-400" />
            Loading orders…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            No orders match your current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">
                    Order ID
                  </th>
                  <SortHeader label="Date / Time" col="createdAt" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Table / Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Items
                  </th>
                  <SortHeader label="Amount" col="grandTotal" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Payment
                  </th>
                  <SortHeader label="Status" col="status" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((order) => {
                  const isExpanded = expandedId === order.id;
                  const items = order.verifiedItems ?? [];
                  const itemSummary = items.length
                    ? items.slice(0, 2).map((i) => `${i.name} ×${i.quantity}`).join(", ") +
                      (items.length > 2 ? ` +${items.length - 2} more` : "")
                    : "—";
                  const isCancellable = !["Completed", "Cancelled"].includes(order.status);

                  return (
                    <>
                      <tr
                        key={order.id}
                        className={`hover:bg-gray-50/60 transition-colors ${isExpanded ? "bg-pink-50/30" : ""}`}
                      >
                        {/* Order ID */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-bold text-gray-700">
                            #{shortId(order.id)}
                          </span>
                          <CopyBtn text={order.id} />
                        </td>

                        {/* Date/Time */}
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {fmtDateTime(order.createdAt)}
                        </td>

                        {/* Table / Type */}
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <span className="font-medium">{order.orderType ?? "—"}</span>
                          {order.tableNumber && (
                            <span className="ml-1 text-xs text-gray-400">· T{order.tableNumber}</span>
                          )}
                        </td>

                        {/* Items summary */}
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-[180px] truncate" title={itemSummary}>
                          {itemSummary}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">
                          {formatCurrency(order.grandTotal ?? 0)}
                        </td>

                        {/* Payment status */}
                        <td className="px-4 py-3">
                          <PaymentBadge status={order.paymentStatus} />
                        </td>

                        {/* Order status */}
                        <td className="px-4 py-3">
                          <StatusBadge status={order.status} />
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {/* View details toggle */}
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : order.id)}
                              title={isExpanded ? "Collapse" : "View Details"}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-pink-600 hover:bg-pink-50 transition"
                            >
                              {isExpanded ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>

                            {/* Print bill */}
                            <button
                              onClick={() => printBill(order)}
                              title="Print Bill"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            >
                              <Printer size={15} />
                            </button>

                            {/* Cancel order */}
                            {isCancellable && (
                              <button
                                onClick={() => setCancelTarget(order.id)}
                                title="Cancel Order"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                              >
                                <XCircle size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Inline expanded details */}
                      {isExpanded && (
                        <ExpandedRow key={`${order.id}-expanded`} order={order} colSpan={8} />
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-pink-300 hover:text-pink-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
              </button>
              {/* Page number pills — show up to 5 around current */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 2)
                .reduce((acc, n, idx, arr) => {
                  if (idx > 0 && n - arr[idx - 1] > 1) acc.push("…");
                  acc.push(n);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "…" ? (
                    <span key={`ellipsis-${idx}`} className="text-xs text-gray-400 px-1">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${
                        item === safePage
                          ? "bg-pink-600 text-white shadow-sm"
                          : "border border-gray-200 text-gray-600 hover:border-pink-300 hover:text-pink-600"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-pink-300 hover:text-pink-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
