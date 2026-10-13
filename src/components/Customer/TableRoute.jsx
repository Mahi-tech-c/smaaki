import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Utensils, AlertTriangle, ArrowRight, ShoppingBag, Loader2 } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../ui/Toast';

export const TableRoute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCurrentTable, clearTable, settings } = useContext(AppContext);
  const { showToast } = useToast();

  const maxTables = Number(settings?.maxTables) || 20;
  const numId = parseInt(id, 10);
  const isValid = !isNaN(numId) && numId >= 1 && numId <= maxTables;

  const [manualTable, setManualTable] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isValid) {
      setCurrentTable(String(numId));
      showToast?.({
        message: `Ordering for Table ${numId} 🍽️`,
        type: 'info'
      });
      // Seamlessly navigate to menu
      const timer = setTimeout(() => {
        navigate('/menu', { replace: true });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isValid, numId, navigate, setCurrentTable, showToast]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const parsed = parseInt(manualTable, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > maxTables) {
      setErrorMessage(`Please enter a valid table number between 1 and ${maxTables}`);
      return;
    }
    setCurrentTable(String(parsed));
    showToast?.({
      message: `Ordering for Table ${parsed} 🍽️`,
      type: 'info'
    });
    navigate('/menu', { replace: true });
  };

  const handleTakeaway = () => {
    clearTable();
    showToast?.({
      message: 'Ordering as Takeaway 🛍️',
      type: 'info'
    });
    navigate('/menu', { replace: true });
  };

  if (isValid) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-16 h-16 rounded-3xl bg-pink-600/20 text-pink-400 flex items-center justify-center border border-pink-500/30 animate-pulse mb-4">
          <Utensils className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black font-heading">
          Welcome to Table {numId}!
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Loading our artisanal menu for your table...
        </p>
        <div className="mt-4 flex items-center gap-2 text-pink-400 text-xs font-bold">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Opening Menu</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-left space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-lg font-black font-heading text-white">
            Table Number Not Found
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            "{id}" is not a recognized table. Our cafe currently has tables 1 to {maxTables}.
          </p>
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-3 pt-2">
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Enter Correct Table Number
            </label>
            <input
              type="number"
              min={1}
              max={maxTables}
              value={manualTable}
              onChange={(e) => setManualTable(e.target.value)}
              placeholder={`1 to ${maxTables}`}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-pink-500"
            />
            {errorMessage && (
              <p className="text-red-400 text-[11px] font-semibold mt-1">{errorMessage}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-pink-600/30"
          >
            <span>Proceed to Menu</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={handleTakeaway}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Order as Takeaway Instead</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableRoute;
