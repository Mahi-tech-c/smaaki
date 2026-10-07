import React from 'react';

export const Textarea = React.forwardRef(({
  label,
  error,
  helperText,
  maxLength,
  showCount = false,
  value,
  defaultValue,
  rows = 3,
  className = '',
  id,
  disabled = false,
  onChange,
  ...props
}, ref) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');
  const currentValue = value !== undefined ? value : internalValue;
  const currentLength = typeof currentValue === 'string' ? currentValue.length : 0;
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const handleChange = (e) => {
    if (value === undefined) {
      setInternalValue(e.target.value);
    }
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      <div className="flex justify-between items-center">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        {showCount && maxLength && (
          <span className={`text-[11px] ${currentLength >= maxLength ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        onChange={handleChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
        className={`
          w-full rounded-xl bg-slate-100 dark:bg-slate-800/80
          text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500
          border transition-all duration-150 text-sm outline-none p-3.5 resize-none
          ${error
            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            : 'border-slate-200 dark:border-slate-700 focus:border-[#db2777] focus:ring-2 focus:ring-pink-500/20'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-200/50 dark:bg-slate-900/50' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p id={`${textareaId}-error`} className="text-xs text-red-500 font-medium">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${textareaId}-helper`} className="text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
