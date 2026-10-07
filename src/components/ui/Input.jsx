import React from 'react';

export const Input = React.forwardRef(({
  label,
  error,
  helperText,
  startIcon,
  endIcon,
  className = '',
  id,
  type = 'text',
  disabled = false,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {startIcon && (
          <span className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none shrink-0" aria-hidden="true">
            {startIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={`
            w-full rounded-xl bg-slate-100 dark:bg-slate-800/80
            text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500
            border transition-all duration-150 text-sm outline-none
            ${startIcon ? 'pl-10' : 'pl-3.5'}
            ${endIcon ? 'pr-10' : 'pr-3.5'}
            py-2.5 min-h-[42px]
            ${error
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-slate-200 dark:border-slate-700 focus:border-[#db2777] focus:ring-2 focus:ring-pink-500/20'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-200/50 dark:bg-slate-900/50' : ''}
            ${className}
          `}
          {...props}
        />
        {endIcon && (
          <span className="absolute right-3.5 text-slate-400 dark:text-slate-500 shrink-0">
            {endIcon}
          </span>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-red-500 font-medium">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${inputId}-helper`} className="text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
