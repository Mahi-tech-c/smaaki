import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Undo2 } from 'lucide-react';

const ToastContext = createContext({
  showToast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
  dismiss: () => {}
});

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({
    message,
    type = 'success',
    duration = 4000,
    action, // { label: 'Undo', onClick: () => {} }
  }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type, action };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }

    return id;
  }, [dismiss]);

  const success = useCallback((message, options = {}) => {
    return showToast({ message, type: 'success', ...options });
  }, [showToast]);

  const error = useCallback((message, options = {}) => {
    return showToast({ message, type: 'error', ...options });
  }, [showToast]);

  const info = useCallback((message, options = {}) => {
    return showToast({ message, type: 'info', ...options });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, dismiss }}>
      {children}
      {/* Toast floating container */}
      <div
        aria-live="assertive"
        className="fixed bottom-20 left-1/2 -translate-x-1/2 md:bottom-6 md:right-6 md:left-auto md:translate-x-0 z-[60] flex flex-col gap-2 pointer-events-none w-[92vw] max-w-sm"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white shadow-xl backdrop-blur-md border border-slate-700/50 animate-in fade-in slide-in-from-bottom-3 duration-200"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0" />}
              <span className="text-xs sm:text-sm font-medium truncate leading-tight">
                {toast.message}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action.onClick?.();
                    dismiss(toast.id);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 active:scale-95 transition-all"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>{toast.action.label || 'Undo'}</span>
                </button>
              )}
              <button
                type="button"
                aria-label="Dismiss toast"
                onClick={() => dismiss(toast.id)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

export default ToastProvider;
