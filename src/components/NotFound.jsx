import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, ArrowLeft, UtensilsCrossed } from 'lucide-react';
import Button from './ui/Button';

export const NotFound = () => {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4 py-16 bg-[#0f1117] text-white">
      <div className="w-20 h-20 rounded-3xl bg-pink-950/60 border border-pink-800/60 text-pink-500 flex items-center justify-center mb-6 shadow-xl shadow-pink-900/20">
        <UtensilsCrossed className="w-10 h-10" />
      </div>

      <span className="text-pink-500 text-xs font-bold uppercase tracking-widest mb-2">
        Error 404
      </span>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 font-heading">
        This Dish Isn&apos;t on Our Menu
      </h1>
      <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
        The page you are looking for might have been moved, removed, or never existed in our kitchen. Let&apos;s get you back to something delicious!
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to="/menu">
          <Button variant="primary" size="lg" leftIcon={<Coffee className="w-4 h-4" />}>
            Explore Full Menu
          </Button>
        </Link>
        <Link to="/">
          <Button variant="secondary" size="lg" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
