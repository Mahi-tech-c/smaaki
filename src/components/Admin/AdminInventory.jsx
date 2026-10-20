import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';
import {
  Search, Package, CheckCircle2, XCircle, AlertTriangle,
  LayoutGrid, List, ChevronDown, ChevronUp
} from 'lucide-react';

// ── Toggle Switch ─────────────────────────────────────────────────────────────

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    } ${checked ? 'bg-emerald-500' : 'bg-red-400'}`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
);

// ── Checkbox ──────────────────────────────────────────────────────────────────

const Checkbox = ({ checked, onChange }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={onChange}
    className="w-4 h-4 rounded border-gray-300 text-pink-600 accent-pink-600 cursor-pointer"
  />
);

// ── Main Component ────────────────────────────────────────────────────────────

const AdminInventory = () => {
  const { menuItems, categories, updateMenuItem } = useContext(AppContext);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sort, setSort] = useState('status'); // 'name' | 'category' | 'status'
  const [sortDir, setSortDir] = useState('asc');
  const [selected, setSelected] = useState(new Set());
  const [updating, setUpdating] = useState(new Set());

  // ── Filter + Sort ───────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...(menuItems || [])];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i => i.name?.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q));
    }
    if (activeCategory !== 'all') {
      list = list.filter(i => i.category === activeCategory);
    }
    list.sort((a, b) => {
      let av, bv;
      if (sort === 'name') { av = a.name || ''; bv = b.name || ''; }
      else if (sort === 'category') { av = a.category || ''; bv = b.category || ''; }
      else {
        // out-of-stock first
        av = (a.isAvailable !== false && a.inStock !== false) ? 1 : 0;
        bv = (b.isAvailable !== false && b.inStock !== false) ? 1 : 0;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [menuItems, search, activeCategory, sort, sortDir]);

  const inStock = (menuItems || []).filter(i => i.isAvailable !== false && i.inStock !== false).length;
  const outOfStock = (menuItems || []).length - inStock;

  // ── Toggle Handler ──────────────────────────────────────────────────────────

  const handleToggle = async (item) => {
    const newVal = !(item.isAvailable !== false && item.inStock !== false);
    setUpdating(prev => new Set(prev).add(item.id));
    try {
      await updateMenuItem(item.id, { isAvailable: newVal, inStock: newVal });
    } finally {
      setUpdating(prev => { const s = new Set(prev); s.delete(item.id); return s; });
    }
  };

  // ── Bulk Actions ─────────────────────────────────────────────────────────────

  const handleBulkToggle = async (makeAvailable) => {
    const ids = [...selected];
    setUpdating(new Set(ids));
    try {
      await Promise.all(ids.map(id => updateMenuItem(id, { isAvailable: makeAvailable, inStock: makeAvailable })));
    } finally {
      setUpdating(new Set());
      setSelected(new Set());
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const allSelected = filtered.length > 0 && filtered.every(i => selected.has(i.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(i => i.id)));
  };

  const SortIcon = ({ field }) => sort === field
    ? (sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)
    : null;

  const handleSort = (field) => {
    if (sort === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(field); setSortDir('asc'); }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-gray-800">Inventory</h2>
        <p className="text-sm text-gray-400 mt-0.5">Toggle item availability in bulk or one by one</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-4 text-center">
          <p className="text-3xl font-extrabold text-gray-800">{(menuItems || []).length}</p>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">Total Items</p>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 text-center">
          <p className="text-3xl font-extrabold text-emerald-600">{inStock}</p>
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mt-1">In Stock</p>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-4 text-center">
          <p className="text-3xl font-extrabold text-red-500">{outOfStock}</p>
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mt-1">Out of Stock</p>
        </div>
      </div>

      {/* Search + Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
        </div>
        <select
          value={sort}
          onChange={e => handleSort(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-300 cursor-pointer"
        >
          <option value="status">Sort: Out of Stock First</option>
          <option value="name">Sort: Name</option>
          <option value="category">Sort: Category</option>
        </select>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', ...new Set((menuItems || []).map(i => i.category).filter(Boolean))].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              activeCategory === cat
                ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:border-pink-300'
            }`}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="bg-pink-50 border border-pink-200 rounded-2xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-bold text-pink-700">{selected.size} selected</span>
          <button
            onClick={() => handleBulkToggle(true)}
            className="px-4 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-colors"
          >
            ✓ Mark All IN STOCK
          </button>
          <button
            onClick={() => handleBulkToggle(false)}
            className="px-4 py-1.5 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 transition-colors"
          >
            ✗ Mark All OUT OF STOCK
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-gray-400 hover:text-gray-600">
            Clear
          </button>
        </div>
      )}

      {/* Table Header */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[2rem_2.5rem_1fr_6rem_5rem_6rem] gap-3 px-4 py-3 border-b border-pink-50 bg-pink-50/50">
          <Checkbox checked={allSelected} onChange={toggleAll} />
          <span />
          <button onClick={() => handleSort('name')} className="text-left flex items-center gap-1 text-xs font-extrabold text-gray-500 uppercase tracking-wider hover:text-pink-600">
            Item <SortIcon field="name" />
          </button>
          <button onClick={() => handleSort('category')} className="text-xs font-extrabold text-gray-500 uppercase tracking-wider text-left hover:text-pink-600 flex items-center gap-1">
            Category <SortIcon field="category" />
          </button>
          <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Price</span>
          <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider text-center">Available</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={36} className="mx-auto text-pink-200 mb-3" />
            <p className="text-sm text-gray-400">No items match your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-pink-50">
            {filtered.map(item => {
              const isAvailable = item.isAvailable !== false && item.inStock !== false;
              const isLowStock = typeof item.stockCount === 'number' && item.stockCount < 5 && item.stockCount >= 0;
              const isUpdating = updating.has(item.id);

              return (
                <div
                  key={item.id}
                  className={`grid grid-cols-[2rem_2.5rem_1fr_6rem_5rem_6rem] gap-3 px-4 py-3 items-center transition-colors ${
                    !isAvailable ? 'border-l-4 border-l-red-400 bg-red-50/30' : 'hover:bg-pink-50/20'
                  }`}
                >
                  <Checkbox checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} />

                  {/* Image / Emoji */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-pink-50 flex items-center justify-center shrink-0">
                    {item.image
                      ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      : <span className="text-xl">{item.emoji || '🍽️'}</span>
                    }
                  </div>

                  {/* Name */}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-700 truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.prepMinutes && (
                        <span className="text-[10px] text-gray-400">{item.prepMinutes}m prep</span>
                      )}
                      {isLowStock && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                          <AlertTriangle size={9} /> Low stock ({item.stockCount})
                        </span>
                      )}
                      {!isAvailable && (
                        <span className="text-[10px] font-bold text-red-500">Out of stock</span>
                      )}
                    </div>
                  </div>

                  {/* Category */}
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full truncate">
                    {item.category || '—'}
                  </span>

                  {/* Price */}
                  <span className="text-sm font-extrabold text-gray-700">₹{item.price}</span>

                  {/* Toggle */}
                  <div className="flex justify-center">
                    {isUpdating
                      ? <div className="w-11 h-6 rounded-full bg-gray-200 animate-pulse" />
                      : <Toggle checked={isAvailable} onChange={() => handleToggle(item)} />
                    }
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminInventory;
