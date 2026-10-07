import React from 'react';

export const Switch = ({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  id,
  className = '',
  ...props
}) => {
  const switchId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`inline-flex items-center justify-between gap-3 ${className}`}>
      {(label || description) && (
        <div className="flex flex-col text-left cursor-pointer" onClick={handleToggle}>
          {label && (
            <label htmlFor={switchId} className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
              {label}
            </label>
          )}
          {description && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {description}
            </span>
          )}
        </div>
      )}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out outline-none
          focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2
          ${checked ? 'bg-[#db2777]' : 'bg-slate-300 dark:bg-slate-700'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        {...props}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0
            transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
};

export default Switch;
