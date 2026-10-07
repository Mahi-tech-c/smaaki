import React from 'react';
import { ShoppingBag } from 'lucide-react';
import Button from './Button';

export const EmptyState = ({
  icon,
  title = 'Nothing here yet',
  message = 'Pick something delicious from our menu.',
  actionLabel,
  onAction,
  actionButton,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 max-w-sm mx-auto ${className}`}>
      <div className="w-16 h-16 rounded-full bg-pink-50 dark:bg-pink-950/40 text-[#db2777] flex items-center justify-center mb-4 shadow-sm border border-pink-100 dark:border-pink-900/30">
        {icon || <ShoppingBag className="w-8 h-8" />}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        {message}
      </p>
      {actionButton ? (
        actionButton
      ) : actionLabel && onAction ? (
        <Button onClick={onAction} variant="primary" size="md">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
};

export default EmptyState;
