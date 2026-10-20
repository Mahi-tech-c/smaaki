import { useState, useEffect, useCallback } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { formatCurrency } from "../../utils/helpers";
import {
  Plus,
  Tag,
  Copy,
  Check,
  Pencil,
  Trash2,
  X,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Ticket,
  TrendingUp,
  Users,
  Calendar,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
const isExpired = (coupon) => {
  if (!coupon.validUntil) return false;
  return new Date(coupon.validUntil) < new Date();
};

const statusBadge = (coupon) => {
  if (isExpired(coupon))
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
        Expired
      </span>
    );
  if (coupon.isActive)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-600">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
        Active
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
      Inactive
    </span>
  );
};

const EMPTY_FORM = {
  code: "",
  type: "flat",       // "flat" | "percentage"
  value: "",
  maxDiscount: "",
  minOrder: "",
  description: "",
  validFrom: "",
  validUntil: "",
  maxUses: "",
  isActive: true,
};

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */
export default function AdminCoupons() {
  const [coupons, setCoupons]       = useState([]);
  const [usageMap, setUsageMap]     = useState({}); // { couponCode: { count, totalDiscount } }
  const [loading, setLoading]       = useState(true);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = new, else coupon object

  // Form
  const [form, setForm]             = useState(EMPTY_FORM);
  const [errors, setErrors]         = useState({});
  const [saving, setSaving]         = useState(false);

  // Copy feedback: stores coupon code string
  const [copiedCode, setCopiedCode] = useState(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  /* ── Live coupon subscription ── */
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "coupons"),
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sort: active first, then by code
        data.sort((a, b) => {
          if (a.isActive !== b.isActive) return b.isActive ? 1 : -1;
          return a.code.localeCompare(b.code);
        });
        setCoupons(data);
        setLoading(false);
        // Refresh usage stats whenever coupons change
        fetchUsageStats(data.map((c) => c.code));
      },
      (err) => {
        console.error("AdminCoupons snapshot error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  /* ── Fetch usage stats from orders ── */
  const fetchUsageStats = useCallback(async (codes) => {
    if (!codes.length) return;
    try {
      const q = query(
        collection(db, "orders"),
        where("couponCode", "in", codes.slice(0, 10)) // Firestore 'in' limit = 10
      );
      const snap = await getDocs(q);
      const map = {};
      snap.forEach((d) => {
        const { couponCode, discountAmount = 0 } = d.data();
        if (!map[couponCode]) map[couponCode] = { count: 0, totalDiscount: 0 };
        map[couponCode].count += 1;
        map[couponCode].totalDiscount += Number(discountAmount) || 0;
      });
      setUsageMap(map);
    } catch (e) {
      console.error("Usage stats fetch error:", e);
    }
  }, []);

  /* ── Open drawer ── */
  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (coupon) => {
    setEditTarget(coupon);
    setForm({
      code:        coupon.code        || "",
      type:        coupon.type        || "flat",
      value:       coupon.value       != null ? String(coupon.value) : "",
      maxDiscount: coupon.maxDiscount != null ? String(coupon.maxDiscount) : "",
      minOrder:    coupon.minOrder    != null ? String(coupon.minOrder) : "",
      description: coupon.description || "",
      validFrom:   coupon.validFrom   || "",
      validUntil:  coupon.validUntil  || "",
      maxUses:     coupon.maxUses     != null ? String(coupon.maxUses) : "",
      isActive:    coupon.isActive    ?? true,
    });
    setErrors({});
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (saving) return;
    setDrawerOpen(false);
    setEditTarget(null);
  };

  /* ── Form field handler ── */
  const handleField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!form.code.trim()) {
      e.code = "Code is required.";
    } else if (!/^[A-Z0-9]{4,20}$/.test(form.code)) {
      e.code = "4–20 uppercase alphanumeric characters only.";
    }
    if (!form.value || isNaN(Number(form.value)) || Number(form.value) <= 0) {
      e.value = "Enter a valid positive value.";
    }
    if (form.type === "percentage") {
      if (Number(form.value) > 100) e.value = "Percentage cannot exceed 100.";
      if (form.maxDiscount && (isNaN(Number(form.maxDiscount)) || Number(form.maxDiscount) <= 0))
        e.maxDiscount = "Enter a valid max discount amount.";
    }
    if (form.minOrder && (isNaN(Number(form.minOrder)) || Number(form.minOrder) < 0)) {
      e.minOrder = "Enter a valid min order amount.";
    }
    if (form.maxUses && (isNaN(Number(form.maxUses)) || Number(form.maxUses) < 0)) {
      e.maxUses = "Enter 0 for unlimited or a positive number.";
    }
    if (form.validFrom && form.validUntil && form.validFrom > form.validUntil) {
      e.validUntil = "Valid Until must be after Valid From.";
    }
    return e;
  };

  /* ── Save ── */
  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const payload = {
        code:        form.code.trim(),
        type:        form.type,
        value:       Number(form.value),
        maxDiscount: form.type === "percentage" && form.maxDiscount ? Number(form.maxDiscount) : null,
        minOrder:    form.minOrder ? Number(form.minOrder) : 0,
        description: form.description.trim(),
        validFrom:   form.validFrom  || null,
        validUntil:  form.validUntil || null,
        maxUses:     form.maxUses ? Number(form.maxUses) : 0,
        isActive:    form.isActive,
        updatedAt:   serverTimestamp(),
      };

      if (editTarget) {
        await updateDoc(doc(db, "coupons", editTarget.id), payload);
      } else {
        await addDoc(collection(db, "coupons"), {
          ...payload,
          usageCount: 0,
          createdAt: serverTimestamp(),
        });
      }
      closeDrawer();
    } catch (err) {
      console.error("Save coupon error:", err);
    } finally {
      setSaving(false);
    }
  };

  /* ── Toggle active ── */
  const toggleActive = async (coupon) => {
    try {
      await updateDoc(doc(db, "coupons", coupon.id), {
        isActive: !coupon.isActive,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Toggle active error:", err);
    }
  };

  /* ── Delete ── */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "coupons", deleteTarget.id));
    } catch (err) {
      console.error("Delete coupon error:", err);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  /* ── Copy to clipboard ── */
  const copyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  /* ─────────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-pink-600" />
            Coupons
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage discount coupons for your customers
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-xl text-sm font-semibold hover:bg-pink-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Coupon
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && coupons.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <Ticket className="w-14 h-14 mb-3 opacity-30" />
          <p className="text-lg font-medium">No coupons yet</p>
          <p className="text-sm">Click "Add Coupon" to create your first discount code.</p>
        </div>
      )}

      {/* ── Coupon Grid ── */}
      {!loading && coupons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {coupons.map((coupon) => {
            const stats  = usageMap[coupon.code] || { count: 0, totalDiscount: 0 };
            const expired = isExpired(coupon);

            return (
              <div
                key={coupon.id}
                className={`bg-white rounded-2xl shadow-sm border flex flex-col transition-opacity ${
                  (!coupon.isActive || expired) ? "opacity-70" : "opacity-100"
                } ${expired ? "border-red-200" : "border-gray-100"}`}
              >
                {/* Card top strip */}
                <div
                  className={`rounded-t-2xl px-5 py-4 flex items-start justify-between ${
                    expired
                      ? "bg-red-50"
                      : coupon.isActive
                      ? "bg-pink-50"
                      : "bg-gray-50"
                  }`}
                >
                  <div>
                    {/* Code + copy */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-extrabold text-xl text-gray-800 tracking-widest">
                        {coupon.code}
                      </span>
                      <button
                        onClick={() => copyCode(coupon.code)}
                        title="Copy code"
                        className="p-1 rounded-lg hover:bg-white/60 transition-colors"
                      >
                        {copiedCode === coupon.code ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400 hover:text-pink-600" />
                        )}
                      </button>
                    </div>
                    {/* Value badge */}
                    <span
                      className={`inline-block text-sm font-bold px-2.5 py-0.5 rounded-full ${
                        expired
                          ? "bg-red-100 text-red-600"
                          : "bg-pink-100 text-pink-700"
                      }`}
                    >
                      {coupon.type === "flat"
                        ? `${formatCurrency(coupon.value)} OFF`
                        : `${coupon.value}% OFF`}
                    </span>
                  </div>
                  {/* Status badge */}
                  {statusBadge(coupon)}
                </div>

                {/* Card body */}
                <div className="px-5 py-4 flex-1 space-y-2.5">
                  {/* Description */}
                  {coupon.description && (
                    <p className="text-sm text-gray-600">{coupon.description}</p>
                  )}

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>Min Order</span>
                    <span className="font-medium text-gray-700">
                      {coupon.minOrder ? formatCurrency(coupon.minOrder) : "None"}
                    </span>

                    {coupon.type === "percentage" && coupon.maxDiscount && (
                      <>
                        <span>Max Discount</span>
                        <span className="font-medium text-gray-700">
                          {formatCurrency(coupon.maxDiscount)}
                        </span>
                      </>
                    )}

                    <span>Max Uses</span>
                    <span className="font-medium text-gray-700">
                      {coupon.maxUses ? coupon.maxUses : "Unlimited"}
                    </span>

                    {coupon.validFrom && (
                      <>
                        <span>Valid From</span>
                        <span className="font-medium text-gray-700">
                          {new Date(coupon.validFrom).toLocaleDateString()}
                        </span>
                      </>
                    )}
                    {coupon.validUntil && (
                      <>
                        <span>Valid Until</span>
                        <span
                          className={`font-medium ${
                            expired ? "text-red-500" : "text-gray-700"
                          }`}
                        >
                          {new Date(coupon.validUntil).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Usage stats */}
                  <div className="flex items-center gap-4 pt-1 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Users className="w-3.5 h-3.5 text-pink-400" />
                      <span>
                        <span className="font-semibold text-gray-700">{stats.count}</span>{" "}
                        uses
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <TrendingUp className="w-3.5 h-3.5 text-pink-400" />
                      <span>
                        <span className="font-semibold text-gray-700">
                          {formatCurrency(stats.totalDiscount)}
                        </span>{" "}
                        given
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card footer */}
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                  {/* Active toggle */}
                  <button
                    onClick={() => !expired && toggleActive(coupon)}
                    title={expired ? "Expired coupons cannot be toggled" : "Toggle active"}
                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                      expired
                        ? "text-gray-300 cursor-not-allowed"
                        : coupon.isActive
                        ? "text-pink-600 hover:text-pink-700"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    disabled={expired}
                  >
                    {coupon.isActive ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                    {coupon.isActive ? "Enabled" : "Disabled"}
                  </button>

                  {/* Edit / Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(coupon)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                      title="Edit coupon"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(coupon)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          Slide-in Drawer
      ══════════════════════════════════════════════════════════ */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeDrawer}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-pink-600" />
            <h2 className="text-lg font-bold text-gray-800">
              {editTarget ? "Edit Coupon" : "New Coupon"}
            </h2>
          </div>
          <button
            onClick={closeDrawer}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Coupon Code */}
          <FormField label="Coupon Code *" error={errors.code}>
            <input
              type="text"
              value={form.code}
              onChange={(e) =>
                handleField("code", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
              placeholder="e.g. SAVE20"
              maxLength={20}
              disabled={!!editTarget} // code shouldn't change once created
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-pink-300 transition ${
                errors.code ? "border-red-400" : "border-gray-200"
              } ${editTarget ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "bg-white"}`}
            />
            {editTarget && (
              <p className="text-xs text-gray-400 mt-1">
                Coupon code cannot be changed after creation.
              </p>
            )}
          </FormField>

          {/* Type */}
          <FormField label="Discount Type *" error={errors.type}>
            <div className="flex gap-3">
              {["flat", "percentage"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleField("type", t)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                    form.type === t
                      ? "bg-pink-600 text-white border-pink-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-pink-300"
                  }`}
                >
                  {t === "flat" ? "Flat Amount (₹)" : "Percentage (%)"}
                </button>
              ))}
            </div>
          </FormField>

          {/* Value */}
          <FormField
            label={`Value * ${form.type === "flat" ? "(₹)" : "(%)"}`}
            error={errors.value}
          >
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                {form.type === "flat" ? "₹" : "%"}
              </span>
              <input
                type="number"
                min="0"
                max={form.type === "percentage" ? 100 : undefined}
                value={form.value}
                onChange={(e) => handleField("value", e.target.value)}
                placeholder={form.type === "flat" ? "50" : "10"}
                className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 transition ${
                  errors.value ? "border-red-400" : "border-gray-200"
                }`}
              />
            </div>
          </FormField>

          {/* Max Discount (percentage only) */}
          {form.type === "percentage" && (
            <FormField label="Max Discount Amount (₹) — optional" error={errors.maxDiscount}>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  value={form.maxDiscount}
                  onChange={(e) => handleField("maxDiscount", e.target.value)}
                  placeholder="e.g. 100"
                  className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 transition ${
                    errors.maxDiscount ? "border-red-400" : "border-gray-200"
                  }`}
                />
              </div>
            </FormField>
          )}

          {/* Min Order */}
          <FormField label="Min Order Amount (₹) — optional" error={errors.minOrder}>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
              <input
                type="number"
                min="0"
                value={form.minOrder}
                onChange={(e) => handleField("minOrder", e.target.value)}
                placeholder="e.g. 200"
                className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 transition ${
                  errors.minOrder ? "border-red-400" : "border-gray-200"
                }`}
              />
            </div>
          </FormField>

          {/* Description */}
          <FormField label="Description (shown to customers)" error={errors.description}>
            <textarea
              value={form.description}
              onChange={(e) => handleField("description", e.target.value)}
              placeholder="e.g. Get 20% off on orders above ₹200"
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 transition resize-none"
            />
          </FormField>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Valid From" error={errors.validFrom}>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={form.validFrom}
                  onChange={(e) => handleField("validFrom", e.target.value)}
                  className="w-full pl-9 pr-2 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                />
              </div>
            </FormField>
            <FormField label="Valid Until" error={errors.validUntil}>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => handleField("validUntil", e.target.value)}
                  min={form.validFrom || undefined}
                  className={`w-full pl-9 pr-2 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 transition ${
                    errors.validUntil ? "border-red-400" : "border-gray-200"
                  }`}
                />
              </div>
            </FormField>
          </div>

          {/* Max Uses */}
          <FormField label="Max Uses (0 = unlimited)" error={errors.maxUses}>
            <input
              type="number"
              min="0"
              value={form.maxUses}
              onChange={(e) => handleField("maxUses", e.target.value)}
              placeholder="0"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 transition ${
                errors.maxUses ? "border-red-400" : "border-gray-200"
              }`}
            />
          </FormField>

          {/* Is Active */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Active</p>
              <p className="text-xs text-gray-400">Customers can apply this coupon</p>
            </div>
            <button
              type="button"
              onClick={() => handleField("isActive", !form.isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                form.isActive ? "bg-pink-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  form.isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Drawer footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={closeDrawer}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-pink-600 text-white text-sm font-semibold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            {saving ? "Saving…" : editTarget ? "Update Coupon" : "Create Coupon"}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          Delete Confirmation Dialog
      ══════════════════════════════════════════════════════════ */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Delete Coupon?</h3>
                <p className="text-xs text-gray-500">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to delete coupon{" "}
              <span className="font-mono font-bold text-gray-800">{deleteTarget.code}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deleting ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Small helper: form field wrapper with label + error message
───────────────────────────────────────────────────────────── */
function FormField({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
