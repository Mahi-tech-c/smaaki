import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
  side = 'right', // 'right' | 'left' | 'bottom'
  width = 'max-w-md',
  showClose = true,
  className = '',
}) => {
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sideClasses = {
    right: 'inset-y-0 right-0 w-full animate-in slide-in-from-right duration-250',
    left: 'inset-y-0 left-0 w-full animate-in slide-in-from-left duration-250',
    bottom: 'inset-x-0 bottom-0 w-full max-h-[92vh] rounded-t-3xl animate-in slide-in-from-bottom duration-250'
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'drawer-title' : undefined}
      className="fixed inset-0 z-[50] flex bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={drawerRef}
        tabIndex={-1}
        className={`
          fixed bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800
          shadow-2xl flex flex-col outline-none
          ${sideClasses[side]}
          ${side !== 'bottom' ? width : ''}
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          {title ? (
            <h2 id="drawer-title" className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
          ) : <span />}
          {showClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Drawer;
