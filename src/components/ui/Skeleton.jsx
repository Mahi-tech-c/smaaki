import React from 'react';

/**
 * Base Skeleton Loader with Shimmer Wave
 */
export const Skeleton = ({
  className = '',
  variant = 'rectangular', // 'rectangular' | 'circular' | 'rounded' | 'text'
  width,
  height,
  style = {},
  ...props
}) => {
  const variantClasses = {
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded-md h-4'
  };

  return (
    <div
      aria-hidden="true"
      className={`
        bg-slate-200/80 dark:bg-slate-800/80 animate-shimmer
        ${variantClasses[variant] || 'rounded-xl'}
        ${className}
      `}
      style={{
        width,
        height,
        ...style
      }}
      {...props}
    />
  );
};

/**
 * Skeleton placeholder for Menu Cards (Mobile List & Desktop Grid)
 */
export const MenuCardSkeleton = ({ viewMode = 'list' }) => {
  if (viewMode === 'list') {
    return (
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm gap-4">
        {/* Left: Text & Info */}
        <div className="flex-1 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Skeleton variant="rounded" className="w-5 h-5 rounded" />
            <Skeleton variant="rounded" className="w-20 h-4 rounded-full" />
          </div>
          <Skeleton variant="rounded" className="w-3/4 h-5 rounded-md" />
          <Skeleton variant="rounded" className="w-24 h-4 rounded-md" />
          <Skeleton variant="rounded" className="w-full h-3 rounded-md" />
          <Skeleton variant="rounded" className="w-2/3 h-3 rounded-md" />
        </div>

        {/* Right: Image & Action */}
        <div className="relative shrink-0 flex flex-col items-center">
          <Skeleton variant="rounded" className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl" />
          <div className="absolute -bottom-2">
            <Skeleton variant="rounded" className="w-20 h-8 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // Grid view skeleton
  return (
    <div className="flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <Skeleton variant="rectangular" className="w-full h-44" />
      <div className="p-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <Skeleton variant="rounded" className="w-5 h-5 rounded" />
          <Skeleton variant="rounded" className="w-16 h-4 rounded-full" />
        </div>
        <Skeleton variant="rounded" className="w-4/5 h-5 rounded-md" />
        <Skeleton variant="rounded" className="w-full h-3 rounded-md" />
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Skeleton variant="rounded" className="w-20 h-5 rounded-md" />
          <Skeleton variant="rounded" className="w-20 h-8 rounded-full" />
        </div>
      </div>
    </div>
  );
};

/**
 * Image skeleton with subtle blur/shimmer
 */
export const ImageSkeleton = ({ className = 'w-full h-full' }) => {
  return (
    <div className={`relative overflow-hidden bg-slate-200 dark:bg-slate-800 ${className}`}>
      <Skeleton className="w-full h-full" />
    </div>
  );
};

/**
 * Generic List Skeleton for category items, cart rows, etc.
 */
export const ListSkeleton = ({ count = 3, className = '' }) => {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <MenuCardSkeleton key={i} />
      ))}
    </div>
  );
};

export default Skeleton;
