import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const AccordionItem = ({
  title,
  subtitle,
  children,
  isOpen: controlledIsOpen,
  defaultOpen = false,
  onToggle,
  id,
  className = '',
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isExpanded = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const contentId = id ? `${id}-content` : undefined;
  const buttonId = id ? `${id}-button` : undefined;

  const handleToggle = () => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(!internalIsOpen);
    }
    onToggle?.(!isExpanded);
  };

  return (
    <div className={`border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors ${className}`}>
      <button
        id={buttonId}
        type="button"
        aria-expanded={isExpanded}
        aria-controls={contentId}
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 text-left bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/70 transition-colors select-none"
      >
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isExpanded ? 'rotate-180 text-pink-500' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isExpanded && (
        <div
          id={contentId}
          role="region"
          aria-labelledby={buttonId}
          className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-150"
        >
          {children}
        </div>
      )}
    </div>
  );
};

export const Accordion = ({ children, className = '' }) => {
  return (
    <div className={`flex flex-col gap-2.5 w-full ${className}`}>
      {children}
    </div>
  );
};

export default Accordion;
