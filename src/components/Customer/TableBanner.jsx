import React, { useContext, useState } from 'react';
import { Utensils, Bell, ChevronRight, X, Check, Clock, RefreshCw } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/helpers';
import CallWaiterModal from './CallWaiterModal';

export const TableBanner = () => {
  const { 
    currentTable, 
    setCurrentTable, 
    clearTable, 
    activeTableOrder, 
    settings,
    setIsCartOpen 
  } = useContext(AppContext);

  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [newTableInput, setNewTableInput] = useState('');
  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState(false);
  const [inputError, setInputError] = useState('');

  if (!currentTable) return null;

  const maxTables = Number(settings?.maxTables) || 20;

  const handleSaveNewTable = (e) => {
    e.preventDefault();
    setInputError('');
    const num = parseInt(newTableInput, 10);
    if (isNaN(num) || num < 1 || num > maxTables) {
      setInputError(`Please enter a valid table number between 1 and ${maxTables}`);
      return;
    }
    setCurrentTable(String(num));
    setIsChangeModalOpen(false);
    setNewTableInput('');
  };

  const handleSwitchToTakeaway = () => {
    clearTable();
    setIsChangeModalOpen(false);
  };

  return (
    <>
      {/* Persistent Subtle Top Banner */}
      <aside 
        aria-label="Table status"
        className="bg-slate-900/95 border-b border-pink-500/20 text-white backdrop-blur-md sticky top-[57px] sm:top-[65px] z-30 px-3 sm:px-4 py-2 transition-all shadow-sm"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs">
          {/* Table ID & Tap to change */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-pink-600/20 border border-pink-500/30 flex items-center justify-center shrink-0 text-pink-400">
              <Utensils className="w-3.5 h-3.5" />
            </div>
            <button
              type="button"
              onClick={() => {
                setNewTableInput(currentTable);
                setIsChangeModalOpen(true);
              }}
              className="group flex items-center gap-1.5 text-left font-bold text-slate-200 hover:text-pink-300 transition-colors cursor-pointer truncate"
              title="Click to change table"
            >
              <span>Ordering for <strong className="text-pink-400 font-black">Table {currentTable}</strong></span>
              <span className="text-[10px] text-slate-400 group-hover:text-pink-300 underline font-normal hidden sm:inline">
                (Tap to change)
              </span>
              <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-pink-300 shrink-0" />
            </button>
          </div>

          {/* Active Order Summary (if exists within last 2 hours) */}
          {activeTableOrder && (
            <div className="hidden md:flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[11px] text-emerald-300">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>
                Active Bill: <strong className="font-black text-white">{formatCurrency(activeTableOrder.grandTotal, settings?.currencySymbol || '₹')}</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="underline text-emerald-200 hover:text-white font-bold ml-1 cursor-pointer"
              >
                + Add items
              </button>
            </div>
          )}

          {/* Actions: Call Waiter Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsCallWaiterOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-pink-600/20 hover:bg-pink-600 border border-pink-500/30 text-pink-300 hover:text-white font-bold transition-all text-[11px] active:scale-95 cursor-pointer shadow-xs"
            >
              <Bell className="w-3 h-3 fill-current" />
              <span>Call Waiter</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Change Table Modal */}
      {isChangeModalOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsChangeModalOpen(false);
          }}
        >
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-5 text-white shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Change Dine-in Table</h3>
              <button
                type="button"
                onClick={() => setIsChangeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewTable} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">
                  Table Number (1 to {maxTables})
                </label>
                <input
                  type="number"
                  min={1}
                  max={maxTables}
                  value={newTableInput}
                  onChange={(e) => setNewTableInput(e.target.value)}
                  placeholder={`e.g. 4`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-pink-500"
                  autoFocus
                />
                {inputError && (
                  <p className="text-red-400 text-[11px] mt-1 font-semibold">{inputError}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 font-bold text-white transition-all cursor-pointer shadow-md shadow-pink-600/30"
                >
                  Update Table
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToTakeaway}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
                >
                  Switch to Takeaway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Call Waiter Modal */}
      <CallWaiterModal 
        isOpen={isCallWaiterOpen} 
        onClose={() => setIsCallWaiterOpen(false)} 
        tableNumber={currentTable}
      />
    </>
  );
};

export default TableBanner;
