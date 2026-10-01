import { useState, useMemo } from 'react';

/**
 * Hook to handle menu filtering by category, search term, dietary preference, and availability.
 */
export const useMenuFilter = (items = [], categories = []) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState('all'); // 'all' | 'veg' | 'non-veg'
  const [availableOnly, setAvailableOnly] = useState(false);

  const managedCategories = categories.map(cat => cat.name);
  const categoriesInItems = [...new Set(items.map(item => item.category).filter(Boolean))];
  const unmanagedCategories = categoriesInItems.filter(cat => !managedCategories.includes(cat));

  const allCategories = useMemo(() => {
    return ['All', ...managedCategories, ...unmanagedCategories];
  }, [managedCategories, unmanagedCategories]);

  const categoryCounts = useMemo(() => {
    const counts = { All: items.length };
    items.forEach(item => {
      if (item.category) {
        counts[item.category] = (counts[item.category] || 0) + 1;
      }
    });
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Category check
      if (activeCategory !== 'All' && item.category !== activeCategory) {
        return false;
      }

      // Availability check
      if (availableOnly && item.isAvailable === false) {
        return false;
      }

      // Diet check
      if (dietFilter !== 'all') {
        const isNonVeg = /chicken|egg|fish|meat|wings|keivs|kievs|bacon|bbq/i.test(`${item.name} ${item.category} ${item.description || ''}`);
        if (dietFilter === 'veg' && isNonVeg) return false;
        if (dietFilter === 'non-veg' && !isNonVeg) return false;
      }

      // Search query check
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name?.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        const matchesCategory = item.category?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCategory) {
          return false;
        }
      }

      return true;
    });
  }, [items, activeCategory, searchQuery, dietFilter, availableOnly]);

  return {
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
  };
};
