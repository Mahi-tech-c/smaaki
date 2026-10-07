import React, { useState, useId } from 'react';

export const Tooltip = ({
  content,
  children,
  position = 'top', // 'top' | 'bottom' | 'left' | 'right'
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      aria-describedby={isVisible ? tooltipId : undefined}
    >
      {children}
      {isVisible && content && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`
            absolute z-[60] px-2.5 py-1 text-xs font-medium text-white bg-slate-900/90
            rounded-lg shadow-lg whitespace-nowrap pointer-events-none backdrop-blur-sm
            animate-in fade-in duration-150 border border-slate-700/50
            ${positionClasses[position] || positionClasses.top}
          `}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
