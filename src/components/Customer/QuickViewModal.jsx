import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Plus, 
  Check, 
  ChevronDown, 
  ShoppingBag, 
  Flame, 
  Sparkles,
  Info
} from 'lucide-react';
import { formatCurrency, sanitizeDescription } from '../../utils/helpers';
import { FALLBACK_FOOD_IMAGE } from '../../constants/settings';
import { DietaryMarker, Stepper } from '../ui';
import { 
  getItemDietaryType, 
  getItemOptionGroups, 
  getItemAllergens, 
  getGoesWellWith 
} from '../../utils/menuDataHelper';
import { useToast } from '../ui/Toast';

const QuickViewModalContent = ({ 
  item, 
  onClose, 
  settings = {}, 
  menuItems = [],
  onAddToCart
}) => {
  const { showToast } = useToast();

  // 1. Variant selection
  const hasVariants = Boolean(item.options && item.options.length > 0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const currentVariant = hasVariants ? item.options[selectedVariantIndex] : null;

  // 2. Add-on selection
  const optionGroups = useMemo(() => getItemOptionGroups(item), [item]);
  const [selectedAddOns, setSelectedAddOns] = useState({}); // groupId -> array of optionIds

  // 3. Spice Level
  const isSavory = /pizza|burger|sandwich|snack|fries|appetiser|chicken/i.test(`${item.name} ${item.category}`);
  const [spiceLevel, setSpiceLevel] = useState(isSavory ? 'Medium' : null);

  // 4. Special Instructions (max 150 chars)
  const [specialInstructions, setSpecialInstructions] = useState('');

  // 5. Quantity
  const [quantity, setQuantity] = useState(1);

  // 6. Nutrition Collapsed state
  const [isNutritionOpen, setIsNutritionOpen] = useState(false);

  // Body scroll lock & Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  // Pricing calculation
  const basePrice = Number(currentVariant ? currentVariant.price : item.price) || 0;
  
  // Sum of selected add-on prices
  const addOnsTotal = useMemo(() => {
    let total = 0;
    optionGroups.forEach(group => {
      const chosenIds = selectedAddOns[group.id] || [];
      group.options.forEach(opt => {
        if (chosenIds.includes(opt.id)) {
          total += Number(opt.price) || 0;
        }
      });
    });
    return total;
  }, [optionGroups, selectedAddOns]);

  const unitPrice = basePrice + addOnsTotal;
  const grandTotal = unitPrice * quantity;

  // Toggle Add-on checkbox respecting min/max
  const handleToggleAddOn = (group, optionId) => {
    setSelectedAddOns(prev => {
      const currentList = prev[group.id] || [];
      if (currentList.includes(optionId)) {
        return {
          ...prev,
          [group.id]: currentList.filter(id => id !== optionId)
        };
      }
      // Check max limit
      const maxAllowed = group.max || 99;
      if (currentList.length >= maxAllowed) {
        // If max is 1, replace
        if (maxAllowed === 1) {
          return { ...prev, [group.id]: [optionId] };
        }
        showToast?.({ message: `Maximum ${maxAllowed} selections allowed for ${group.name}`, type: 'info' });
        return prev;
      }
      return {
        ...prev,
        [group.id]: [...currentList, optionId]
      };
    });
  };

  const handleAddToCart = () => {
    // Gather chosen add-ons details
    const chosenAddOnItems = [];
    optionGroups.forEach(group => {
      const chosenIds = selectedAddOns[group.id] || [];
      group.options.forEach(opt => {
        if (chosenIds.includes(opt.id)) {
          chosenAddOnItems.push({ id: opt.id, name: opt.name, price: opt.price });
        }
      });
    });

    const customizedItem = {
      ...item,
      selectedVariant: currentVariant,
      selectedAddOns: chosenAddOnItems,
      spiceLevel,
      specialInstructions: specialInstructions.trim()
    };

    onAddToCart?.(customizedItem, currentVariant, quantity, addOnsTotal);
    showToast?.({
      message: `Added ${quantity}x ${item.name} to bag`,
      type: 'success'
    });
    onClose();
  };

  const dietaryType = getItemDietaryType(item);
  const allergens = getItemAllergens(item);
  const companionItems = getGoesWellWith(item, menuItems);
  const cleanDescription = sanitizeDescription(item.description);

  const isBeverageOrWater = /water|coke|pepsi|sprite|thums|soda|soft drink|beverage/i.test(`${item.name} ${item.category}`);
  const hasNutrition = !isBeverageOrWater && Boolean(item.protein || item.calories || item.carbs || item.fats);

  const modalContent = (
    <div 
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full md:max-w-xl md:rounded-3xl rounded-t-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col max-h-[92vh] text-white animate-in slide-in-from-bottom duration-250 md:zoom-in-95 overflow-hidden"
      >
        {/* Mobile Pull Handle */}
        <div className="w-full flex justify-center pt-2.5 pb-1 md:hidden bg-slate-900">
          <div className="w-12 h-1 rounded-full bg-slate-700" />
        </div>

        {/* Header Bar */}
        <div className="relative aspect-[16/9] w-full bg-slate-800 shrink-0 overflow-hidden">
          <img 
            src={item.image || FALLBACK_FOOD_IMAGE}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = FALLBACK_FOOD_IMAGE; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-black transition-colors z-10"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Category & Reference badge */}
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-slate-900/90 text-[10px] font-bold uppercase tracking-wider text-slate-300 border border-slate-700">
              {item.category}
            </span>
            <span className="text-[9px] text-slate-400 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
              Image for reference
            </span>
          </div>
        </div>

        {/* Scrollable Customization Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar text-left">
          
          {/* Title & Dietary marker */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <DietaryMarker type={dietaryType} size={20} />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {dietaryType === 'veg' ? 'Vegetarian' : dietaryType === 'egg' ? 'Contains Egg' : 'Non-Vegetarian'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
              {item.name}
            </h2>
            {cleanDescription && (
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                {cleanDescription}
              </p>
            )}
          </div>

          {/* Allergen Notice */}
          {allergens.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5 pt-1">
              {allergens.map((alg, i) => (
                <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {alg}
                </span>
              ))}
            </div>
          )}

          {/* 1. Size / Variant Selector (Radio) */}
          {hasVariants && (
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Choose Portion / Size <span className="text-pink-400">*</span>
                </span>
                <span className="text-[10px] text-pink-400 font-bold uppercase">Required</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {item.options.map((opt, idx) => {
                  const isSelected = idx === selectedVariantIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedVariantIndex(idx)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-pink-500 bg-pink-500/10 text-white' 
                          : 'border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-pink-500 bg-pink-500' : 'border-slate-600'
                        }`}>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span>{opt.title}</span>
                      </div>
                      <span className="font-extrabold text-white">
                        {formatCurrency(opt.price, settings?.currencySymbol || '₹')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Add-on Groups (Checkboxes) */}
          {optionGroups.map((group) => {
            const chosen = selectedAddOns[group.id] || [];
            return (
              <div key={group.id} className="space-y-2.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {group.name}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Optional • Select up to {group.max || 3}
                    </p>
                  </div>
                  {chosen.length > 0 && (
                    <span className="text-[10px] font-bold text-emerald-400">
                      {chosen.length} selected
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {group.options.map((opt) => {
                    const isChecked = chosen.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleToggleAddOn(group, opt.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          isChecked
                            ? 'border-pink-500 bg-pink-500/10 text-white'
                            : 'border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            isChecked ? 'border-pink-500 bg-pink-500' : 'border-slate-600'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 text-white stroke-[3]" />}
                          </div>
                          <span>{opt.name}</span>
                        </div>
                        <span className="font-bold text-pink-400">
                          +{formatCurrency(opt.price, settings?.currencySymbol || '₹')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 3. Spice Level (For Savory items) */}
          {isSavory && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Spice Preference
              </span>
              <div className="grid grid-cols-3 gap-2">
                {['Mild', 'Medium', 'Spicy 🔥'].map((level) => {
                  const isSelected = spiceLevel === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSpiceLevel(level)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                        isSelected 
                          ? 'border-pink-500 bg-pink-500 text-white' 
                          : 'border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Special Cooking Instructions */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <div className="flex justify-between items-center">
              <label htmlFor="special-inst" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Special Instructions
              </label>
              <span className={`text-[10px] ${specialInstructions.length >= 150 ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                {specialInstructions.length}/150
              </span>
            </div>
            <textarea
              id="special-inst"
              rows={2}
              maxLength={150}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Less ice, extra dip warm, crispier crust..."
              className="w-full rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 p-3 text-xs outline-none focus:border-pink-500 transition-colors resize-none"
            />
          </div>

          {/* 5. Collapsed Nutrition Accordion */}
          {hasNutrition && (
            <div className="border border-slate-800 rounded-xl overflow-hidden pt-1">
              <button
                type="button"
                onClick={() => setIsNutritionOpen(!isNutritionOpen)}
                className="w-full flex items-center justify-between p-3 bg-slate-850 hover:bg-slate-800 text-xs font-semibold text-slate-300"
              >
                <span>Nutrition (approx.)</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isNutritionOpen ? 'rotate-180 text-pink-500' : ''}`} />
              </button>
              {isNutritionOpen && (
                <div className="p-3 bg-slate-900 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  {item.calories && <div className="p-2 bg-slate-800 rounded-lg"><strong>{item.calories}</strong> <span className="text-[10px] text-slate-400 block">Kcal</span></div>}
                  {item.protein && <div className="p-2 bg-slate-800 rounded-lg"><strong>{item.protein}</strong> <span className="text-[10px] text-slate-400 block">Protein</span></div>}
                  {item.carbs && <div className="p-2 bg-slate-800 rounded-lg"><strong>{item.carbs}</strong> <span className="text-[10px] text-slate-400 block">Carbs</span></div>}
                  {item.fats && <div className="p-2 bg-slate-800 rounded-lg"><strong>{item.fats}</strong> <span className="text-[10px] text-slate-400 block">Fats</span></div>}
                </div>
              )}
            </div>
          )}

          {/* 6. Goes Well With Upsell Suggestions */}
          {companionItems.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-400 block">
                Goes Well With 🌟
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {companionItems.map((comp) => (
                  <div key={comp.id} className="p-2.5 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{comp.name}</p>
                      <p className="text-[11px] font-extrabold text-pink-400">
                        {formatCurrency(comp.price, settings?.currencySymbol || '₹')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onAddToCart?.(comp);
                        showToast?.({ message: `Added ${comp.name} to bag`, type: 'success' });
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-pink-600 text-white text-[10px] font-black uppercase transition-colors shrink-0"
                    >
                      + ADD
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer: Quantity Stepper + Live Calculated Add-to-Cart Button */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <Stepper 
            value={quantity}
            size="md"
            min={1}
            max={20}
            onChange={(newVal) => setQuantity(newVal)}
          />

          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 py-3 px-5 rounded-2xl bg-pink-600 hover:bg-pink-700 active:scale-98 text-white font-black text-sm uppercase tracking-wider flex items-center justify-between shadow-lg shadow-pink-600/30 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4" /> Add to Cart
            </span>
            <span className="font-extrabold tracking-tight">
              {formatCurrency(grandTotal, settings?.currencySymbol || '₹')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};

export const QuickViewModal = (props) => {
  if (!props.item) return null;
  return <QuickViewModalContent key={props.item.id} {...props} />;
};

export default QuickViewModal;
