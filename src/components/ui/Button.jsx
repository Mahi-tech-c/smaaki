import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[#db2777] hover:bg-[#be185d] active:bg-[#9d174d] text-white shadow-sm hover:shadow-md hover:shadow-pink-500/20',
    secondary: 'border-2 border-[#db2777] text-[#db2777] hover:bg-[#db2777]/10 active:bg-[#db2777]/20 bg-transparent',
    ghost: 'text-inherit hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 bg-transparent',
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm hover:shadow-red-600/20',
    subtle: 'bg-pink-50 dark:bg-pink-950/40 text-[#db2777] hover:bg-pink-100 dark:hover:bg-pink-900/40'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[32px]',
    md: 'text-sm px-4 py-2 gap-2 min-h-[40px]',
    lg: 'text-base px-6 py-3 gap-2.5 min-h-[48px]',
    icon: 'p-2 w-10 h-10 min-h-[40px]'
  };

  const variantClass = variants[variant] || variants.primary;
  const sizeClass = sizes[size] || sizes.md;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading ? 'true' : undefined}
      className={`${baseStyles} ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
          {typeof children === 'string' ? <span>{children}</span> : children}
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0" aria-hidden="true">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0" aria-hidden="true">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
