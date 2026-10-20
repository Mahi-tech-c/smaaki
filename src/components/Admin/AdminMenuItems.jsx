import React, { useContext, useState, useMemo, useCallback } from 'react';
import { AppContext } from '../../context/AppContext';
import {
  Plus, Search, Edit2, Trash2, List, ChevronDown, ChevronRight,
  CheckCircle2, XCircle, Filter, SlidersHorizontal, LayoutGrid,
  LayoutList, Tag, Star, Flame, Leaf, TrendingUp, Package,
  AlertTriangle, Eye, EyeOff, GripVertical, ArrowUpDown,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import AdminCategories from './AdminCategories';
import { soundManager } from '../../utils/sound';
import { formatCurrency } from '../../utils/helpers';

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'default',    label: 'Default Order' },
  { value: 'name_asc',   label: 'Name A → Z'   },
  { value: 'name_desc',  label: 'Name Z → A'   },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'stock_out',  label: 'Sold-out first' },
];

const getItemPrice = (item) =>
  Number(item.price || item.options?.[0]?.price || 0);

// ─── Veg/Non-veg dot indicator (FSSAI style) ─────────────────────────────────
const VegDot = ({ veg }) => (
  <span
    className={`inline-flex items-center justify-center w-4 h-4 rounded-sm border ${
      veg === false
        ? 'border-red-500'
        : 'border-green-600'
    }`}
  >
    <span className={`w-2 h-2 rounded-full ${veg === false ? 'bg-red-500' : 'bg-green-600'}`} />
  </span>
);

// ─── Stock badge ──────────────────────────────────────────────────────────────
const StockBadge = ({ item }) => {
  const out = item.isAvailable === false || item.inStock === false;
  return out ? (
    <span className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-red-600 text-white text-[9px] font-black rounded uppercase tracking-wider shadow-md">
      Sold Out
    </span>
  ) : null;
};

// ─── Instamart-style product card ─────────────────────────────────────────────
const ProductCard = ({ item, onEdit, onDelete, updateItem, dragHandle, isDragging }) => {
  const isSoldOut = item.isAvailable === false || item.inStock === false;
  const price = getItemPrice(item);
  const hasOptions = Array.isArray(item.options) && item.options.length > 0;

  const handleToggleStock = useCallback(() => {
    soundManager.playTapSound();
    const nextVal = isSoldOut;          // toggle: if currently sold-out → make available
    updateItem(item.id, { isAvailable: nextVal, inStock: nextVal });
  }, [isSoldOut, item.id, updateItem]);

  return (
    <div
      className={`relative bg-white rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden group
        ${isDragging
          ? 'shadow-2xl ring-2 ring-pink-400 scale-[1.02] z-50'
          : 'shadow-sm border-gray-100 hover:shadow-md hover:border-pink-200'
        }
        ${isSoldOut ? 'opacity-70' : ''}
      `}
    >
      {/* Drag handle — top-left ghost icon */}
      {dragHandle && (
        <div
          {...dragHandle}
          className="absolute top-2 right-2 z-20 p-1 rounded-lg bg-white/80 text-gray-300 hover:text-pink-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        >
          <GripVertical size={14} />
        </div>
      )}

      {/* ══ IMAGE — tall portrait, ~70 % of card ══ */}
      <div
        className="relative w-full overflow-hidden flex-shrink-0 bg-gray-50"
        style={{ aspectRatio: '1 / 1.25' }}
      >
        <StockBadge item={item} />

        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.08] ${
              isSoldOut ? 'grayscale' : ''
            }`}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 gap-2">
            <Package size={46} className="text-pink-200" />
            <span className="text-[9px] font-black text-pink-200 uppercase tracking-[0.15em]">No Photo</span>
          </div>
        )}

        {/* FSSAI veg dot — pinned bottom-left inside image */}
        <div className="absolute bottom-2 left-2 z-20 p-[3px] bg-white/90 rounded-sm shadow">
          <VegDot veg={item.veg} />
        </div>

        {/* Gradient scrim at bottom so content strip reads cleanly */}
        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

        {/* Hover overlay — Edit / Delete */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 z-20">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="p-3 bg-white text-pink-600 rounded-full shadow-xl hover:scale-110 hover:bg-pink-50 transition-all cursor-pointer"
            title="Edit item"
          >
            <Edit2 size={17} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="p-3 bg-white text-red-500 rounded-full shadow-xl hover:scale-110 hover:bg-red-50 transition-all cursor-pointer"
            title="Delete item"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      {/* ══ CONTENT STRIP — compact, ~30 % of card ══ */}
      <div className="flex flex-col px-3 pt-2 pb-2.5 gap-1.5 bg-white">
        {/* Name — 1 line, truncated */}
        <p className="text-[11px] font-bold text-gray-900 leading-tight truncate" title={item.name}>
          {item.name}
        </p>

        {/* Price + size count */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black text-gray-900 tracking-tight">
            {formatCurrency(price)}
          </span>
          {hasOptions && (
            <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full leading-none">
              +{item.options.length - 1}
            </span>
          )}
        </div>

        {/* Stock toggle pill */}
        <button
          type="button"
          onClick={handleToggleStock}
          className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
            isSoldOut
              ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
              : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
          }`}
        >
          {isSoldOut ? <XCircle size={10} /> : <CheckCircle2 size={10} />}
          {isSoldOut ? 'Mark Available' : 'In Stock'}
        </button>
      </div>
    </div>
  );
};

// ─── Category section header ──────────────────────────────────────────────────
const CategoryHeader = ({ category, count, collapsed, onToggle, dragHandle, isDragging }) => (
  <div
    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
      isDragging ? 'bg-pink-50' : 'bg-white hover:bg-gray-50/60'
    } border border-gray-100 shadow-sm`}
  >
    <div className="flex items-center gap-3">
      {dragHandle && (
        <div {...dragHandle} className="text-gray-200 hover:text-pink-400 cursor-grab active:cursor-grabbing p-0.5">
          <GripVertical size={16} />
        </div>
      )}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-sm shadow-pink-200">
        <span className="text-white text-xs font-black uppercase">{category.name?.[0]}</span>
      </div>
      <div>
        <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider">{category.name}</h3>
        <p className="text-[11px] text-gray-400 font-medium">{count} item{count !== 1 ? 's' : ''}</p>
      </div>
    </div>
    <button
      type="button"
      onClick={onToggle}
      className="p-2 hover:bg-pink-50 rounded-lg text-gray-400 hover:text-pink-600 transition-colors cursor-pointer"
    >
      {collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
    </button>
  </div>
);

// ─── Stats bar (Flipkart-style summary chips) ─────────────────────────────────
const StatsBar = ({ menuItems }) => {
  const total   = menuItems.length;
  const inStock = menuItems.filter((i) => i.isAvailable !== false && i.inStock !== false).length;
  const veg     = menuItems.filter((i) => i.veg !== false).length;
  const soldOut = total - inStock;

  return (
    <div className="flex flex-wrap gap-2">
      {[
        { icon: Package,      label: 'Total Items',  value: total,   color: 'bg-blue-50   text-blue-700   border-blue-100'   },
        { icon: CheckCircle2, label: 'In Stock',     value: inStock, color: 'bg-green-50  text-green-700  border-green-100'  },
        { icon: Leaf,         label: 'Veg',          value: veg,     color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
        { icon: AlertTriangle,label: 'Sold Out',     value: soldOut, color: 'bg-red-50    text-red-600    border-red-100'    },
      ].map(({ icon: Icon, label, value, color }) => (
        <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${color}`}>
          <Icon size={13} />
          <span>{value} {label}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const AdminMenuItems = ({ onAdd, onEdit, onDelete }) => {
  const { menuItems, categories: dbCategories, reorderCategory, updateItem } = useContext(AppContext);

  const [searchTerm,     setSearchTerm]     = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [collapsedCats,  setCollapsedCats]  = useState({});
  const [sortBy,         setSortBy]         = useState('default');
  const [showFilters,    setShowFilters]     = useState(false);
  const [viewMode,       setViewMode]       = useState('grid'); // 'grid' | 'list'
  const [filterVeg,      setFilterVeg]      = useState('all'); // 'all' | 'veg' | 'nonveg'
  const [filterStock,    setFilterStock]    = useState('all'); // 'all' | 'in' | 'out'

  const managedCategories   = dbCategories.map((c) => c.name);
  const categoriesInItems   = [...new Set(menuItems.map((i) => i.category).filter(Boolean))];
  const unmanagedCategories = categoriesInItems.filter((c) => !managedCategories.includes(c));

  const categoryList = useMemo(() => {
    if (activeCategory !== 'All')
      return dbCategories.filter((c) => c.name === activeCategory).length > 0
        ? dbCategories.filter((c) => c.name === activeCategory)
        : [{ id: activeCategory, name: activeCategory, isUnmanaged: true }];
    return [
      ...dbCategories,
      ...unmanagedCategories.map((name) => ({ id: name, name, isUnmanaged: true })),
    ];
  }, [dbCategories, unmanagedCategories, activeCategory]);

  // Filter + sort items
  const filteredItems = useMemo(() => {
    let items = [...menuItems];

    // Text search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      items = items.filter(
        (i) =>
          i.name?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q) ||
          String(i.price).includes(q)
      );
    }

    // Veg filter
    if (filterVeg === 'veg')    items = items.filter((i) => i.veg !== false);
    if (filterVeg === 'nonveg') items = items.filter((i) => i.veg === false);

    // Stock filter
    if (filterStock === 'in')  items = items.filter((i) => i.isAvailable !== false && i.inStock !== false);
    if (filterStock === 'out') items = items.filter((i) => i.isAvailable === false || i.inStock === false);

    // Sort
    switch (sortBy) {
      case 'name_asc':   items.sort((a, b) => a.name?.localeCompare(b.name)); break;
      case 'name_desc':  items.sort((a, b) => b.name?.localeCompare(a.name)); break;
      case 'price_asc':  items.sort((a, b) => getItemPrice(a) - getItemPrice(b)); break;
      case 'price_desc': items.sort((a, b) => getItemPrice(b) - getItemPrice(a)); break;
      case 'stock_out':  items.sort((a, b) => {
        const aOut = a.isAvailable === false || a.inStock === false ? 0 : 1;
        const bOut = b.isAvailable === false || b.inStock === false ? 0 : 1;
        return aOut - bOut;
      }); break;
      default: break;
    }
    return items;
  }, [menuItems, searchTerm, filterVeg, filterStock, sortBy]);

  // Drag-and-drop handlers (same logic as before, unchanged)
  const onDragEnd = useCallback(async (result) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'CATEGORY') {
      const items   = Array.from(categoryList);
      const [moved] = items.splice(source.index, 1);
      items.splice(destination.index, 0, moved);

      const destIndex = destination.index;
      let newOrderIndex;
      if (items.length === 1)          newOrderIndex = Number(moved.orderIndex || Date.now());
      else if (destIndex === 0)        newOrderIndex = Number(items[1].orderIndex || items[1].id) - 1000;
      else if (destIndex === items.length - 1) newOrderIndex = Number(items[items.length - 2].orderIndex || items[items.length - 2].id) + 1000;
      else {
        const prev = Number(items[destIndex - 1].orderIndex || items[destIndex - 1].id);
        const next = Number(items[destIndex + 1].orderIndex || items[destIndex + 1].id);
        newOrderIndex = (prev + next) / 2;
      }
      await reorderCategory(moved.id, newOrderIndex, moved.name);
    } else {
      const sourceCat = source.droppableId.replace('items-', '');
      const destCat   = destination.droppableId.replace('items-', '');
      const sourceItems = filteredItems.filter((i) => i.category === sourceCat);
      const destItems   = filteredItems.filter((i) => i.category === destCat);
      const [moved]     = sourceItems.splice(source.index, 1);
      if (sourceCat !== destCat) moved.category = destCat;
      destItems.splice(destination.index, 0, moved);

      const destIndex = destination.index;
      let newOrderIndex;
      if (destItems.length === 1)          newOrderIndex = Number(moved.orderIndex || Date.now());
      else if (destIndex === 0)            newOrderIndex = Number(destItems[1].orderIndex || destItems[1].id) - 1000;
      else if (destIndex === destItems.length - 1) newOrderIndex = Number(destItems[destItems.length - 2].orderIndex || destItems[destItems.length - 2].id) + 1000;
      else {
        const prev = Number(destItems[destIndex - 1].orderIndex || destItems[destIndex - 1].id);
        const next = Number(destItems[destIndex + 1].orderIndex || destItems[destIndex + 1].id);
        newOrderIndex = (prev + next) / 2;
      }
      const updateData = { orderIndex: newOrderIndex };
      if (sourceCat !== destCat) updateData.category = destCat;
      await updateItem(moved.id, updateData);
    }
  }, [categoryList, filteredItems, reorderCategory, updateItem]);

  const activeFilters =
    (filterVeg !== 'all' ? 1 : 0) +
    (filterStock !== 'all' ? 1 : 0) +
    (sortBy !== 'default' ? 1 : 0);

  return (
    <div className="space-y-5 pb-16">
      <AdminCategories isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} />

      {/* ── Top bar ── */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-4 space-y-3">
        {/* Row 1: search + view toggle + add */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-300" size={16} />
            <input
              type="text"
              placeholder="Search items, categories, prices…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm font-medium text-gray-800 placeholder:text-gray-300"
            />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* View toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutList size={16} />
              </button>
            </div>

            {/* Filters toggle */}
            <button
              type="button"
              onClick={() => setShowFilters((p) => !p)}
              className={`relative flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                showFilters || activeFilters > 0
                  ? 'bg-pink-50 text-pink-600 border-pink-200'
                  : 'bg-gray-50 text-gray-600 border-gray-100 hover:border-pink-200'
              }`}
            >
              <SlidersHorizontal size={15} />
              Filters
              {activeFilters > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-pink-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </button>

            {/* Category manager */}
            <button
              type="button"
              onClick={() => setIsCatModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 hover:bg-pink-50 border border-gray-100 hover:border-pink-200 text-gray-600 hover:text-pink-600 rounded-xl font-bold text-sm transition-all cursor-pointer"
            >
              <List size={15} /> <span className="hidden sm:inline">Categories</span>
            </button>

            {/* Add item */}
            <button
              type="button"
              onClick={onAdd}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-black text-sm transition-all shadow-md shadow-pink-200 cursor-pointer"
            >
              <Plus size={16} /> Add Item
            </button>
          </div>
        </div>

        {/* Row 2: Filters bar (collapsible) */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Category filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Category</span>
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="pl-2 pr-6 py-1.5 bg-white border border-gray-100 rounded-lg text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-400 cursor-pointer appearance-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239ca3af\' stroke-width=\'2\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
              >
                <option value="All">All</option>
                {dbCategories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                {unmanagedCategories.map((c) => <option key={c} value={c}>{c} (unmanaged)</option>)}
              </select>
            </div>

            {/* Veg filter */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              {[['all','All'],['veg','🌿 Veg'],['nonveg','🍗 Non-veg']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setFilterVeg(v)}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-black transition-all cursor-pointer ${
                    filterVeg === v ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >{l}</button>
              ))}
            </div>

            {/* Stock filter */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              {[['all','All Stock'],['in','✅ In Stock'],['out','❌ Sold Out']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setFilterStock(v)}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-black transition-all cursor-pointer ${
                    filterStock === v ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >{l}</button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1.5 ml-auto">
              <ArrowUpDown size={13} className="text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-2 pr-6 py-1.5 bg-white border border-gray-100 rounded-lg text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-400 cursor-pointer appearance-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239ca3af\' stroke-width=\'2\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Clear all filters */}
            {activeFilters > 0 && (
              <button type="button"
                onClick={() => { setFilterVeg('all'); setFilterStock('all'); setSortBy('default'); setActiveCategory('All'); }}
                className="text-[11px] font-black text-pink-500 hover:text-pink-700 transition-colors cursor-pointer underline underline-offset-2"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Stats summary row */}
        <div className="pt-1">
          <StatsBar menuItems={filteredItems} />
        </div>
      </div>

      {/* ── Drag-drop product grid / list ── */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="categories-root" type="CATEGORY">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-5">
              {categoryList.map((category, catIndex) => {
                const itemsInCategory = filteredItems.filter((i) => i.category === category.name);
                if (activeCategory === 'All' && itemsInCategory.length === 0 && category.isUnmanaged) return null;

                return (
                  <Draggable
                    key={category.id}
                    draggableId={`cat-${category.id}`}
                    index={catIndex}
                    isDragDisabled={activeCategory !== 'All' || sortBy !== 'default'}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="space-y-3"
                      >
                        {/* Category header */}
                        <CategoryHeader
                          category={category}
                          count={itemsInCategory.length}
                          collapsed={!!collapsedCats[category.name]}
                          onToggle={() =>
                            setCollapsedCats((p) => ({ ...p, [category.name]: !p[category.name] }))
                          }
                          dragHandle={provided.dragHandleProps}
                          isDragging={snapshot.isDragging}
                        />

                        {/* Items grid / list */}
                        {!collapsedCats[category.name] && (
                          <Droppable droppableId={`items-${category.name}`} type="ITEM" direction={viewMode === 'grid' ? 'horizontal' : 'vertical'}>
                            {(provided, dropSnapshot) => (
                              <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className={`
                                  min-h-[80px] rounded-2xl transition-colors duration-150
                                  ${dropSnapshot.isDraggingOver ? 'bg-pink-50/60 ring-2 ring-pink-300 ring-dashed' : ''}
                                  ${viewMode === 'grid'
                                    ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
                                    : 'flex flex-col gap-2'
                                  }
                                `}
                              >
                                {itemsInCategory.map((item, itemIndex) => (
                                  <Draggable
                                    key={item.id}
                                    draggableId={`item-${item.id}`}
                                    index={itemIndex}
                                    isDragDisabled={sortBy !== 'default'}
                                  >
                                    {(provided, snap) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                      >
                                        {viewMode === 'grid' ? (
                                          <ProductCard
                                            item={item}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            updateItem={updateItem}
                                            dragHandle={provided.dragHandleProps}
                                            isDragging={snap.isDragging}
                                          />
                                        ) : (
                                          /* ── List row (Flipkart PLP row style) ── */
                                          <div className={`flex items-center gap-3 p-3 bg-white rounded-xl border transition-all group
                                            ${snap.isDragging ? 'shadow-lg ring-2 ring-pink-300 scale-[1.01]' : 'border-gray-100 shadow-sm hover:shadow-md hover:border-pink-100'}
                                          `}>
                                            {/* Drag handle */}
                                            <div {...provided.dragHandleProps}
                                              className="text-gray-200 hover:text-pink-400 cursor-grab active:cursor-grabbing p-1 flex-shrink-0">
                                              <GripVertical size={15} />
                                            </div>

                                            {/* Thumbnail */}
                                            <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50">
                                              {(item.isAvailable === false || item.inStock === false) && (
                                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
                                                  <span className="text-[8px] text-white font-black">OUT</span>
                                                </div>
                                              )}
                                              {item.image
                                                ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                : <div className="w-full h-full flex items-center justify-center"><Package size={22} className="text-pink-200" /></div>
                                              }
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-1.5">
                                                <VegDot veg={item.veg} />
                                                <p className="font-bold text-sm text-gray-900 truncate">{item.name}</p>
                                              </div>
                                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                <span className="text-[10px] text-pink-500 font-bold bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
                                                  {item.category}
                                                </span>
                                                <span className="text-sm font-black text-gray-900">{formatCurrency(getItemPrice(item))}</span>
                                                {Array.isArray(item.options) && item.options.length > 1 && (
                                                  <span className="text-[10px] text-gray-400">+{item.options.length - 1} sizes</span>
                                                )}
                                              </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                              {/* Stock toggle */}
                                              {(() => {
                                                const out = item.isAvailable === false || item.inStock === false;
                                                return (
                                                  <button type="button"
                                                    onClick={() => { soundManager.playTapSound(); updateItem(item.id, { isAvailable: out, inStock: out }); }}
                                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-black border transition-all cursor-pointer ${
                                                      out ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' : 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
                                                    }`}
                                                  >
                                                    {out ? <XCircle size={11} /> : <CheckCircle2 size={11} />}
                                                    <span className="hidden sm:inline">{out ? 'Sold Out' : 'In Stock'}</span>
                                                  </button>
                                                );
                                              })()}
                                              <button type="button" onClick={() => onEdit(item)}
                                                className="p-2 text-pink-600 hover:bg-pink-50 rounded-lg transition-all cursor-pointer" title="Edit">
                                                <Edit2 size={15} />
                                              </button>
                                              <button type="button" onClick={() => onDelete(item)}
                                                className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all cursor-pointer" title="Delete">
                                                <Trash2 size={15} />
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}

                                {itemsInCategory.length === 0 && (
                                  <div className="col-span-full flex flex-col items-center justify-center py-10 text-gray-300 gap-2">
                                    <Package size={32} />
                                    <p className="text-xs font-bold">No items match your filters</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </Droppable>
                        )}
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default AdminMenuItems;
