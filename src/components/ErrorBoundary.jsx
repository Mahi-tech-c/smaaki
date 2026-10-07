import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0f1117] text-white text-center">
          <div className="w-16 h-16 rounded-full bg-red-950/60 border border-red-800 text-red-400 flex items-center justify-center mb-5 shadow-xl">
            <AlertCircle className="w-8 h-8" />
          </div>

          <span className="text-red-400 text-xs font-bold uppercase tracking-widest mb-2">
            Something went wrong
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            We Hit a Kitchen Hiccup
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
            An unexpected error occurred while preparing this page. Don&apos;t worry, your cart is safely preserved. Please reload to continue.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Page</span>
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Go to Home</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
