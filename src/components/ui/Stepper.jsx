import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';

export const Stepper = ({
  value = 0,
  onChange,
  min = 0,
  max = 99,
  size = 'md',
  disabled = false,
  showTrashAtOne = false,
  ariaLabel = 'Quantity',
  className = '',
  ...props
}) => {
  const handleDecrement = (e) => {
    e.stopPropagation();
    if (!disabled && value > min && onChange) {
      onChange(value - 1);
    }
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (!disabled && value < max && onChange) {
      onChange(value + 1);
    }
  };

  const isMin = value <= min;
  const isMax = value >= max;

  const sizeClasses = {
    sm: {
      container: 'h-7 px-1 text-xs gap-1.5',
      btn: 'w-5 h-5 text-xs',
      icon: 'w-3 h-3',
      num: 'min-w-[18px]'
    },
    md: {
      container: 'h-9 px-1.5 text-sm gap-2',
      btn: 'w-6 h-6 text-sm',
      icon: 'w-3.5 h-3.5',
      num: 'min-w-[22px]'
    },
    lg: {
      container: 'h-11 px-2 text-base gap-3',
      btn: 'w-8 h-8 text-base',
      icon: 'w-4 h-4',
      num: 'min-w-[28px]'
    }
  };

  const conf = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`
        inline-flex items-center justify-between rounded-full
        bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900/50
        text-[#db2777] font-bold select-none shadow-sm
        ${conf.container}
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
        ${className}
      `}
      {...props}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || isMin}
        aria-label="Decrease quantity"
        className={`
          flex items-center justify-center rounded-full transition-transform active:scale-90
          hover:bg-pink-200/60 dark:hover:bg-pink-900/60 text-[#db2777] outline-none
          focus-visible:ring-2 focus-visible:ring-pink-500 disabled:opacity-30 disabled:cursor-not-allowed
          ${conf.btn}
        `}
      >
        {showTrashAtOne && value === 1 ? (
          <Trash2 className={`${conf.icon} text-red-500`} />
        ) : (
          <Minus className={conf.icon} />
        )}
      </button>

      <span
        aria-live="polite"
        className={`text-center font-extrabold tabular-nums ${conf.num}`}
      >
        {value}
      </span>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || isMax}
        aria-label="Increase quantity"
        className={`
          flex items-center justify-center rounded-full transition-transform active:scale-90
          hover:bg-pink-200/60 dark:hover:bg-pink-900/60 text-[#db2777] outline-none
          focus-visible:ring-2 focus-visible:ring-pink-500 disabled:opacity-30 disabled:cursor-not-allowed
          ${conf.btn}
        `}
      >
        <Plus className={conf.icon} />
      </button>
    </div>
  );
};

export default Stepper;
