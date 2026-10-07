import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  SlidersHorizontal, 
  ArrowUpDown, 
  LayoutList, 
  LayoutGrid, 
  Sparkles, 
  Utensils, 
  BookOpen, 
  Star,
  Flame,
  ChevronRight
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import ProductCard from './Customer/ProductCard';
import QuickViewModal from './Customer/QuickViewModal';
import { formatCurrency } from '../utils/helpers';
import { getCategoryEmoji } from '../constants/categories';
import { getItemDietaryType, getItemBadges } from '../utils/menuDataHelper';

export const MenuSection = () => {
  const { 
    menuItems, 
    categories, 
    settings, 
    cart, 
    addToCart, 
    updateCartQuantity 
  } = useContext(AppContext);

  // Modal item state
  const [quickViewItem, setQuickViewItem] = useState(null);

  // Search state with debounce
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Filters state
  const [dietFilter, setDietFilter] = useState('all'); // 'all' | 'veg' | 'egg' | 'nonveg'
  const [inStockOnly, setInStockOnly] = useState(false);
  const [under200Only, setUnder200Only] = useState(false);
  const [bestsellersOnly, setBestsellersOnly] = useState(false);
  const [sortBy, setSortBy] = useState('recommended'); // 'recommended' | 'price-asc' | 'price-desc' | 'name'
  const [viewMode, setViewMode] = useState('list'); // 'list' (default) | 'grid'

  // Scroll spy & Category navigation
  const [activeCategory, setActiveCategory] = useState('');
  const [isCategoryIndexOpen, setIsCategoryIndexOpen] = useState(false);
  const tabsScrollRef = useRef(null);
  const activeTabRef = useRef(null);
  const isUserClicking = useRef(false);

  // Unique sorted categories
  const categoryNames = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.map(c => c.name);
    }
    return Array.from(new Set(menuItems.map(i => i.category))).filter(Boolean);
  }, [categories, menuItems]);

  // Spotlight filtered lists
  const bestsellersList = useMemo(() => {
    return menuItems.filter(i => {
      const badges = getItemBadges(i);
      return badges.includes('Bestseller') || i.isBestseller;
    }).slice(0, 8);
  }, [menuItems]);

  const newPicksList = useMemo(() => {
    return menuItems.filter(i => {
      const badges = getItemBadges(i);
      return badges.includes('New') || i.isNew;
    }).slice(0, 8);
  }, [menuItems]);

  // Main filtered items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      // 1. Search Query
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const matchesName = (item.name || '').toLowerCase().includes(query);
        const matchesDesc = (item.description || '').toLowerCase().includes(query);
        const matchesCat = (item.category || '').toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }

      // 2. Dietary Filter
      const dType = getItemDietaryType(item);
      if (dietFilter === 'veg' && dType !== 'veg') return false;
      if (dietFilter === 'nonveg' && dType !== 'nonveg') return false;
      if (dietFilter === 'egg' && dType !== 'egg') return false;

      // 3. In Stock Filter
      if (inStockOnly && (item.inStock === false || item.isAvailable === false)) {
        return false;
      }

      // 4. Under ₹200 Filter
      if (under200Only && Number(item.price) > 200) {
        return false;
      }

      // 5. Bestsellers Filter
      if (bestsellersOnly) {
        const badges = getItemBadges(item);
        if (!badges.includes('Bestseller') && !item.isBestseller) return false;
      }

      return true;
    });
  }, [menuItems, debouncedSearch, dietFilter, inStockOnly, under200Only, bestsellersOnly]);

  // Sort items
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

  // Group sorted items by category for continuous display
  const itemsByCategory = useMemo(() => {
    const map = {};
    categoryNames.forEach(cat => {
      const itemsInCat = sortedItems.filter(i => i.category === cat);
      if (itemsInCat.length > 0) {
        map[cat] = itemsInCat;
      }
    });
    return map;
  }, [categoryNames, sortedItems]);

  const activeDisplayCategories = Object.keys(itemsByCategory);
  const currentActiveCategory = activeCategory || (activeDisplayCategories[0] || '');

  // Auto-scroll active category tab into view
  useEffect(() => {
    if (activeTabRef.current && tabsScrollRef.current) {
      const container = tabsScrollRef.current;
      const element = activeTabRef.current;
      const elementLeft = element.offsetLeft;
      const elementWidth = element.offsetWidth;
      const containerWidth = container.offsetWidth;

      container.scrollTo({
        left: elementLeft - containerWidth / 2 + elementWidth / 2,
        behavior: 'smooth'
      });
    }
  }, [currentActiveCategory]);

  // Scroll-spy observer for continuous menu sections
  useEffect(() => {
    if (activeDisplayCategories.length === 0) return;

    const handleScroll = () => {
      if (isUserClicking.current) return;
      const scrollPosition = window.scrollY + 180;

      for (const cat of activeDisplayCategories) {
        const sectionId = `category-${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveCategory(cat);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeDisplayCategories]);

  // Jump to category on tab click
  const scrollToCategory = (cat) => {
    setActiveCategory(cat);
    isUserClicking.current = true;
    const sectionId = `category-${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const el = document.getElementById(sectionId);
    if (el) {
      const topOffset = el.offsetTop - 140;
      window.scrollTo({
        top: topOffset > 0 ? topOffset : 0,
        behavior: 'smooth'
      });
    }
    setTimeout(() => {
      isUserClicking.current = false;
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-white pt-2 pb-32">
      {/* Quick View Customization Sheet */}
      <QuickViewModal 
        item={quickViewItem}
        onClose={() => setQuickViewItem(null)}
        settings={settings}
        menuItems={menuItems}
        onAddToCart={addToCart}
        onUpdateCartQuantity={updateCartQuantity}
      />

      {/* Top Search & Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Input with Clear Button */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for churros, waffles, burgers, pizza..."
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-pink-500 transition-colors shadow-sm"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setDebouncedSearch('');
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Controls */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {/* Single Veg Toggle (Swiggy / Zomato Green Style) */}
            <button
              type="button"
              onClick={() => setDietFilter(dietFilter === 'veg' ? 'all' : 'veg')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                dietFilter === 'veg'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-slate-850'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span>Veg Only</span>
            </button>

            {/* Non-Veg Toggle (Label NEVER wraps!) */}
            <button
              type="button"
              onClick={() => setDietFilter(dietFilter === 'nonveg' ? 'all' : 'nonveg')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                dietFilter === 'nonveg'
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                  : 'bg-slate-900 border border-slate-800 text-red-400 hover:bg-slate-850'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              <span className="whitespace-nowrap">Non-Veg</span>
            </button>

            {/* Under ₹200 Toggle */}
            <button
              type="button"
              onClick={() => setUnder200Only(!under200Only)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                under200Only
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
            >
              Under ₹200
            </button>

            {/* In Stock Toggle */}
            <button
              type="button"
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                inStockOnly
                  ? 'bg-slate-100 text-slate-950 font-black'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
            >
              In Stock
            </button>

            {/* Price Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-bold text-white focus:outline-none cursor-pointer pr-1 text-xs"
              >
                <option value="recommended" className="bg-slate-900">Curated</option>
                <option value="price-asc" className="bg-slate-900">Price: Low to High</option>
                <option value="price-desc" className="bg-slate-900">Price: High to Low</option>
                <option value="name" className="bg-slate-900">Name (A-Z)</option>
              </select>
            </div>

            {/* View Mode Toggle (List vs Grid) */}
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white shrink-0 cursor-pointer"
              aria-label={`Switch to ${viewMode === 'list' ? 'grid' : 'list'} view`}
              title={`Switch to ${viewMode === 'list' ? 'grid' : 'list'} view`}
            >
              {viewMode === 'list' ? <LayoutGrid className="w-4 h-4" /> : <LayoutList className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Spotlight Top Carousel: "Bestsellers" (Only if not searching) */}
      {!debouncedSearch && bestsellersList.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1 rounded-lg bg-amber-500/15 text-amber-400">
              <Star className="w-4 h-4 fill-current" />
            </span>
            <h3 className="font-extrabold text-base tracking-tight text-white font-heading">
              Bestsellers in Warangal
            </h3>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {bestsellersList.map((item) => (
              <div 
                key={item.id}
                onClick={() => setQuickViewItem(item)}
                className="w-40 sm:w-48 shrink-0 rounded-2xl bg-slate-900 border border-slate-800 p-2.5 hover:border-pink-500/40 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-800 mb-2">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover" 
                    loading="lazy" 
                  />
                  <div className="absolute top-1.5 left-1.5 p-0.5 rounded bg-black/60">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 block" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white truncate">{item.name}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-extrabold text-xs text-pink-400">
                      {formatCurrency(item.price, settings?.currencySymbol || '₹')}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickViewItem(item);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-[10px] font-black uppercase"
                    >
                      ADD
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Spotlight Top Carousel: "New & Trending" (Only if not searching) */}
      {!debouncedSearch && newPicksList.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1 rounded-lg bg-sky-500/15 text-sky-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="font-extrabold text-base tracking-tight text-white font-heading">
              New Creations
            </h3>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {newPicksList.map((item) => (
              <div 
                key={item.id}
                onClick={() => setQuickViewItem(item)}
                className="w-40 sm:w-48 shrink-0 rounded-2xl bg-slate-900 border border-slate-800 p-2.5 hover:border-pink-500/40 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-800 mb-2">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover" 
                    loading="lazy" 
                  />
                  <div className="absolute top-1.5 left-1.5 p-0.5 rounded bg-black/60">
                    <span className="w-2 h-2 rounded-full bg-sky-400 block" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white truncate">{item.name}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-extrabold text-xs text-pink-400">
                      {formatCurrency(item.price, settings?.currencySymbol || '₹')}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickViewItem(item);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-[10px] font-black uppercase"
                    >
                      ADD
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sticky Category Scroll-Spy Chips Bar */}
      <nav 
        aria-label="Menu categories"
        className="sticky top-16 z-30 w-full bg-[#0f1117] border-y border-slate-800 shadow-md py-2 transition-all"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div
            ref={tabsScrollRef}
            role="tablist"
            className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 pr-8"
          >
            {activeDisplayCategories.map((cat) => {
              const isActive = currentActiveCategory === cat;
              const emoji = getCategoryEmoji(cat);
              const count = itemsByCategory[cat]?.length || 0;

              return (
                <button
                  key={cat}
                  ref={isActive ? activeTabRef : null}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => scrollToCategory(cat)}
                  className={`
                    shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold
                    transition-all select-none outline-none cursor-pointer
                    ${isActive
                      ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30 scale-[1.02]'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white'
                    }
                  `}
                >
                  <span aria-hidden="true" className="shrink-0 text-sm">{emoji}</span>
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right edge fade gradient so cut-off tabs are visually scrollable */}
          <div 
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0f1117] to-transparent" 
            aria-hidden="true"
          />
        </div>
      </nav>

      {/* Main Continuous Menu Sections */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {activeDisplayCategories.length === 0 ? (
          /* Empty search/filter results */
          <div className="py-20 text-center flex flex-col items-center justify-center max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center mb-4">
              <Utensils className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No items found</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              We couldn&apos;t find any recipes matching your current search or filters. Try searching for something else or clear filters!
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setDebouncedSearch('');
                setDietFilter('all');
                setInStockOnly(false);
                setUnder200Only(false);
                setBestsellersOnly(false);
              }}
              className="px-5 py-2.5 rounded-full bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          /* Continuous category shelves */
          <div className="space-y-12">
            {activeDisplayCategories.map((cat) => {
              const catItems = itemsByCategory[cat] || [];
              const emoji = getCategoryEmoji(cat);
              const sectionId = `category-${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

              return (
                <section key={cat} id={sectionId} className="scroll-mt-36">
                  {/* Category Shelf Header */}
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span aria-hidden="true" className="text-2xl">{emoji}</span>
                      <h2 className="text-lg sm:text-xl font-black text-white font-heading">
                        {cat}
                      </h2>
                      <span className="text-xs text-slate-500 font-bold">
                        ({catItems.length})
                      </span>
                    </div>
                  </div>

                  {/* Items Layout (List or Grid) */}
                  <div className={
                    viewMode === 'list'
                      ? 'grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4'
                      : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4'
                  }>
                    {catItems.map((item) => (
                      <ProductCard
                        key={item.id}
                        item={item}
                        settings={settings}
                        cart={cart}
                        onAddToCart={addToCart}
                        onUpdateCartQuantity={updateCartQuantity}
                        onOpenQuickView={setQuickViewItem}
                        viewMode={viewMode}
                        searchQuery={debouncedSearch}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating "Menu" Category Index Button (Swiggy / Zomato style) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsCategoryIndexOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900/95 hover:bg-black text-white font-black text-xs uppercase tracking-wider shadow-2xl border border-slate-700 backdrop-blur-md active:scale-95 transition-all cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-pink-500" />
          <span>MENU</span>
          <span className="text-[10px] text-slate-400 font-bold">
            ({activeDisplayCategories.length})
          </span>
        </button>
      </div>

      {/* Category Index Bottom Sheet Modal */}
      {isCategoryIndexOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCategoryIndexOpen(false);
          }}
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 text-white max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-250">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-pink-500" />
                <h3 className="font-bold text-base">Menu Categories</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryIndexOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto space-y-1.5 custom-scrollbar py-2 flex-1">
              {activeDisplayCategories.map((cat) => {
                const emoji = getCategoryEmoji(cat);
                const count = itemsByCategory[cat]?.length || 0;
                const isActive = currentActiveCategory === cat;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      scrollToCategory(cat);
                      setIsCategoryIndexOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-pink-600 text-white font-bold' 
                        : 'bg-slate-850 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span aria-hidden="true" className="text-base">{emoji}</span>
                      <span>{cat}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-[11px] font-bold">{count}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuSection;
