import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  ArrowLeft, 
  Search, 
  ShoppingBag, 
  X, 
  Sparkles, 
  SlidersHorizontal,
  ArrowUpDown,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMenuFilter } from '../hooks/useMenuFilter';
import ProductCard from './Customer/ProductCard';
import QuickViewModal from './Customer/QuickViewModal';
import { formatCurrency } from '../utils/helpers';
import { getCategoryEmoji } from '../constants/categories';

const MenuSection = () => {
  const { 
    menuItems, 
    categories, 
    settings, 
    cart,
    addToCart, 
    updateCartQuantity,
    setIsCartOpen, 
    cartItemCount,
    cartTotal 
  } = useContext(AppContext);

  const [quickViewItem, setQuickViewItem] = useState(null);
  const [sortBy, setSortBy] = useState('recommended');

  const {
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    dietFilter,
    setDietFilter,
    availableOnly,
    setAvailableOnly,
    allCategories,
    categoryCounts,
    filteredItems
  } = useMenuFilter(menuItems, categories);

  // Sorting
  const sortedItems = useMemo(() => {
    const list = [...filteredItems];
    if (sortBy === 'price-asc') {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [filteredItems, sortBy]);

  // Grouped items by category for structured catalog shelves
  const itemsByGroup = useMemo(() => {
    if (activeCategory !== 'All') return null;

    const groups = {};
    allCategories.forEach(cat => {
      if (cat === 'All') return;
      const itemsInCat = sortedItems.filter(i => i.category === cat);
      if (itemsInCat.length > 0) {
        groups[cat] = itemsInCat;
      }
    });
    return groups;
  }, [activeCategory, allCategories, sortedItems]);

  return (
    <div className="min-h-screen bg-[#fbfbfd] pt-16 pb-36 text-[#1d1d1f]">
      {/* Quick View Modal */}
      <QuickViewModal 
        item={quickViewItem}
        onClose={() => setQuickViewItem(null)}
        settings={settings}
        cart={cart}
        onAddToCart={addToCart}
        onUpdateCartQuantity={updateCartQuantity}
      />

      {/* Hero Header Stage - Minimalist Apple/Google typography */}
      <section className="border-b border-gray-200/60 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-md text-[11px] font-semibold text-gray-700 tracking-wider uppercase">
                <Zap size={12} className="text-amber-500 fill-amber-500" />
                Live Kitchen Selection
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-950 tracking-tight">
                {settings.menuTitle || 'The Collection'}
              </h1>
              <p className="text-sm sm:text-base text-gray-500 font-normal max-w-xl">
                {settings.menuTagline || 'Artisanal recipes prepared fresh to order using finest grade ingredients.'}
              </p>
            </div>

            {/* Live Trust Metrics */}
            <div className="flex items-center gap-6 text-xs text-gray-500 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
              <div>
                <div className="text-lg font-black text-gray-950">{sortedItems.length}</div>
                <div className="text-[11px] uppercase tracking-wider text-gray-400">Handcrafted Items</div>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div>
                <div className="text-lg font-black text-gray-950">{allCategories.length - 1}</div>
                <div className="text-[11px] uppercase tracking-wider text-gray-400">Categories</div>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div>
                <div className="text-lg font-black text-emerald-600">Fresh</div>
                <div className="text-[11px] uppercase tracking-wider text-gray-400">Made to order</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Filter & Search Command Center */}
      <div className="sticky top-16 z-30 apple-header shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Search Input - Clean Apple Style */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input 
                type="text"
                placeholder="Search by item, flavor, or ingredient..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-gray-100 hover:bg-gray-150 focus:bg-white border border-transparent focus:border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-950/10 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 rounded-md"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort & Dietary Controls */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end overflow-x-auto no-scrollbar">
              {/* Dietary Filter Segmented Control */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setDietFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    dietFilter === 'all' 
                      ? 'bg-white text-gray-950 shadow-xs font-bold' 
                      : 'text-gray-600 hover:text-gray-950'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDietFilter('veg')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                    dietFilter === 'veg' 
                      ? 'bg-white text-emerald-800 shadow-xs font-bold' 
                      : 'text-emerald-700 hover:text-emerald-950'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Veg
                </button>
                <button
                  onClick={() => setDietFilter('non-veg')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                    dietFilter === 'non-veg' 
                      ? 'bg-white text-amber-900 shadow-xs font-bold' 
                      : 'text-amber-800 hover:text-amber-950'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-700"></span> Non-Veg
                </button>
              </div>

              {/* In-Stock Toggle */}
              <button
                onClick={() => setAvailableOnly(!availableOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                  availableOnly 
                    ? 'bg-gray-950 text-white border-gray-950 shadow-xs' 
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                In Stock
              </button>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 shrink-0">
                <ArrowUpDown size={12} className="text-gray-400" />
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-transparent font-bold text-gray-800 focus:outline-none cursor-pointer pr-1 text-xs"
                >
                  <option value="recommended">Curated</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Catalog Arena: Left Hierarchy Tree + Right Structured Showcase */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Left Category Index (Microsoft / Apple Style clean menu list) */}
          <aside className="w-full lg:w-64 shrink-0 bg-white rounded-2xl border border-gray-200/80 p-3 lg:sticky lg:top-36 shadow-xs">
            <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400">Departments</span>
              <span className="text-[11px] font-bold text-gray-500">{allCategories.length - 1} options</span>
            </div>

            <div className="flex lg:flex-col overflow-x-auto lg:overflow-y-auto no-scrollbar max-h-[calc(100vh-14rem)] gap-1 pt-2 custom-scrollbar">
              {allCategories.map(cat => {
                const count = categoryCounts[cat] || 0;
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      window.scrollTo({ top: 180, behavior: 'smooth' });
                    }}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 whitespace-nowrap lg:whitespace-normal text-left ${
                      isActive 
                        ? 'bg-gray-950 text-white font-bold shadow-xs' 
                        : 'text-gray-600 hover:bg-gray-100/70 hover:text-gray-950'
                    }`}
                  >
                    <span className="truncate mr-2 flex items-center gap-1.5">
                      {cat !== 'All' && (
                        <span aria-hidden="true" className="shrink-0 text-sm">
                          {getCategoryEmoji(cat)}
                        </span>
                      )}
                      <span>{cat}</span>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Product Grid Area */}
          <main className="flex-1 w-full min-w-0">
            {menuItems.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center border border-gray-200/80 shadow-xs flex flex-col items-center justify-center">
                <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mb-3">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Clean Slate: Project Starts from Zero</h3>
                <p className="text-xs text-gray-500 mb-4 max-w-sm">This is an independent project with no old data. Add your own departments, products, and prices from the Admin Portal.</p>
                <Link
                  to="/admin"
                  className="px-5 py-2.5 bg-gray-950 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-black transition-colors"
                >
                  Go to Admin Portal
                </Link>
              </div>
            ) : sortedItems.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center border border-gray-200/80 shadow-xs flex flex-col items-center justify-center">
                <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mb-3">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">No items found</h3>
                <p className="text-xs text-gray-500 mb-4">Try searching with different terms or adjust your dietary filter.</p>
                <button
                  onClick={() => {
                    setActiveCategory('All');
                    setSearchQuery('');
                    setDietFilter('all');
                    setAvailableOnly(false);
                  }}
                  className="px-5 py-2 bg-gray-950 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-black transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : itemsByGroup ? (
              // Structured Departmental Sections
              <div className="space-y-12">
                {Object.entries(itemsByGroup).map(([categoryName, items]) => (
                  <section key={categoryName} className="space-y-4">
                    {/* Shelf Banner */}
                    <div className="flex items-center justify-between border-b border-gray-200/80 pb-3">
                      <div>
                        <h2 className="text-xl font-extrabold text-gray-950 tracking-tight">
                          {categoryName}
                        </h2>
                        <span className="text-xs text-gray-400 font-medium">
                          {items.length} options curated in this department
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveCategory(categoryName)}
                        className="text-xs font-bold text-gray-700 hover:text-black flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
                      >
                        <span>View All</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    {/* Product Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                      {items.map(item => (
                        <ProductCard
                          key={item.id}
                          item={item}
                          settings={settings}
                          cart={cart}
                          onAddToCart={addToCart}
                          onUpdateCartQuantity={updateCartQuantity}
                          onOpenQuickView={setQuickViewItem}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              // Single Selected Category View
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200/80 pb-3">
                  <div>
                    <h2 className="text-2xl font-extrabold text-gray-950 tracking-tight">
                      {activeCategory}
                    </h2>
                    <span className="text-xs text-gray-500 font-medium">
                      Showing {sortedItems.length} items
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {sortedItems.map(item => (
                    <ProductCard
                      key={item.id}
                      item={item}
                      settings={settings}
                      cart={cart}
                      onAddToCart={addToCart}
                      onUpdateCartQuantity={updateCartQuantity}
                      onOpenQuickView={setQuickViewItem}
                    />
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Floating Order Command Bar */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-8 sm:w-96 z-40 animate-in slide-in-from-bottom-6 duration-300">
          <div className="bg-gray-950 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-gray-800 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white text-gray-950 flex items-center justify-center font-black text-xs">
                {cartItemCount}
              </div>
              <div>
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Active Order</div>
                <div className="text-base font-extrabold text-white">
                  {formatCurrency(cartTotal, settings.currencySymbol || '₹')}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-emerald-950/40"
            >
              <span>Review Order</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuSection;
