import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'We encountered an issue while loading this content. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 max-w-sm mx-auto ${className}`}>
      <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center mb-4 shadow-sm border border-red-100 dark:border-red-900/30">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="secondary"
          size="md"
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
