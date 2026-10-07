import React from 'react';
import { X } from 'lucide-react';

export const Chip = ({
  children,
  selected = false,
  onClick,
  icon,
  removable = false,
  onRemove,
  disabled = false,
  className = '',
  ...props
}) => {
  const isClickable = Boolean(onClick) && !disabled;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
        transition-all duration-150 select-none whitespace-nowrap outline-none
        focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-1
        ${selected
          ? 'bg-[#db2777] text-white shadow-sm shadow-pink-500/20'
          : 'bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-black/10 dark:hover:bg-white/15'
        }
        ${isClickable ? 'cursor-pointer active:scale-95' : 'cursor-default'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
      {removable && onRemove && (
        <span
          role="button"
          tabIndex={0}
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(e);
          }}
          className="ml-0.5 p-0.5 rounded-full hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
        >
          <X className="w-3 h-3" />
        </span>
      )}
    </button>
  );
};

export default Chip;
