import React, { useRef, useEffect } from 'react';

export const Tabs = ({
  tabs = [], // [{ id, label, icon, badge }]
  activeTab,
  onChange,
  className = '',
  variant = 'pills', // 'pills' | 'underline'
}) => {
  const scrollRef = useRef(null);
  const activeTabRef = useRef(null);

  // Auto-scroll active tab into view smoothly
  useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const element = activeTabRef.current;

      const elementLeft = element.offsetLeft;
      const elementWidth = element.offsetWidth;
      const containerWidth = container.offsetWidth;

      container.scrollTo({
        left: elementLeft - containerWidth / 2 + elementWidth / 2,
        behavior: 'smooth',
      });
    }
  }, [activeTab]);

  const handleKeyDown = (e, index) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % tabs.length;
      onChange?.(tabs[nextIndex].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + tabs.length) % tabs.length;
      onChange?.(tabs[prevIndex].id);
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Scrollable container with hidden scrollbar */}
      <div
        ref={scrollRef}
        role="tablist"
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1"
      >
        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : null}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange?.(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`
                shrink-0 inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold
                transition-all duration-150 select-none outline-none rounded-full
                focus-visible:ring-2 focus-visible:ring-pink-500
                ${variant === 'pills' ? (
                  isActive
                    ? 'bg-[#db2777] text-white shadow-sm shadow-pink-500/25 scale-[1.02]'
                    : 'bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/15'
                ) : (
                  isActive
                    ? 'text-[#db2777] border-b-2 border-[#db2777] rounded-none'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-none'
                )}
              `}
            >
              {tab.icon && <span aria-hidden="true" className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-pink-500/10 text-pink-500'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right Edge Fade Indicator to signify scrollability */}
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-[#0f1117] to-transparent"
        aria-hidden="true"
      />
    </div>
  );
};

export default Tabs;
