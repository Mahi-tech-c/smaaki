import React from 'react';
import { Flame, Sparkles, Star, Award } from 'lucide-react';

/**
 * Standard Indian Dietary Marker (Square with circle inside, min 18px)
 * type: 'veg' | 'nonveg' | 'egg'
 */
export const DietaryMarker = ({ type = 'veg', size = 18, className = '' }) => {
  const isVeg = type === 'veg';
  const isEgg = type === 'egg';

  const borderColor = isVeg
    ? 'border-emerald-600 dark:border-emerald-500'
    : isEgg
    ? 'border-amber-500 dark:border-amber-400'
    : 'border-red-600 dark:border-red-500';

  const dotColor = isVeg
    ? 'bg-emerald-600 dark:bg-emerald-500'
    : isEgg
    ? 'bg-amber-500 dark:bg-amber-400'
    : 'bg-red-600 dark:bg-red-500';

  const label = isVeg ? 'Vegetarian' : isEgg ? 'Contains Egg' : 'Non-Vegetarian';

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center shrink-0 border-2 rounded-[4px] p-[2px] bg-transparent ${borderColor} ${className}`}
      style={{ width: `${Math.max(18, size)}px`, height: `${Math.max(18, size)}px` }}
    >
      <span className={`w-full h-full rounded-full ${dotColor}`} />
    </span>
  );
};

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
  ...props
}) => {
  const variants = {
    bestseller: 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30',
    new: 'bg-sky-500/15 text-sky-500 dark:text-sky-400 border border-sky-500/30',
    spicy: 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/30',
    musttry: 'bg-purple-500/15 text-purple-500 dark:text-purple-400 border border-purple-500/30',
    premium: 'bg-gradient-to-r from-amber-500/20 to-pink-500/20 text-amber-400 border border-amber-400/30',
    veg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
    nonveg: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30',
    egg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
    neutral: 'bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-transparent'
  };

  const sizes = {
    sm: 'text-[11px] font-semibold px-2 py-0.5 gap-1 rounded-full',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5 rounded-full'
  };

  const icons = {
    bestseller: <Star className="w-3 h-3 fill-current shrink-0" aria-hidden="true" />,
    new: <Sparkles className="w-3 h-3 shrink-0" aria-hidden="true" />,
    spicy: <Flame className="w-3 h-3 fill-current shrink-0" aria-hidden="true" />,
    musttry: <Award className="w-3 h-3 shrink-0" aria-hidden="true" />,
  };

  return (
    <span
      className={`inline-flex items-center select-none uppercase tracking-wider ${variants[variant] || variants.neutral} ${sizes[size] || sizes.sm} ${className}`}
      {...props}
    >
      {icons[variant] || null}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
