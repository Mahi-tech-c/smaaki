import React, { useContext, useState, useEffect } from 'react';
import { AppContext, DEFAULT_SETTINGS } from '../../context/AppContext';
import { Save, Home, Image as ImageIcon, Type, Sparkles, Gift, Layout, Clock, Palette, FileText as LucideFileText, X, ChevronDown } from 'lucide-react';
import { HexColorPicker } from "react-colorful";

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96, 120, 144];

// Reusable Field Component with Style Controls (Moved outside to prevent re-rendering focus loss)
const EditableField = ({ label, field, formData, handleChange, activeStyleField, setActiveStyleField, type = 'input', placeholder = '', icon: Icon, isDarkBg = false }) => {
  const isStyleOpen = activeStyleField === field;
  const colorField = `${field}Color`;
  const sizeField = `${field}Size`;

  return (
    <div className="space-y-2 relative">
      <div className="flex justify-between items-center">
        <label className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${isDarkBg ? 'text-pink-200' : 'text-pink-900'}`}>
          {Icon && <Icon size={14} />} {label}
        </label>
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveStyleField(isStyleOpen ? null : field);
          }}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
            isStyleOpen ? 'bg-pink-600 text-white shadow-lg shadow-pink-200 scale-105' : 'bg-gray-100 text-gray-400 hover:text-pink-600 hover:bg-pink-50'
          }`}
        >
          <Palette size={12} /> STYLE
        </button>
      </div>

      <div className="relative">
        {type === 'textarea' ? (
          <textarea 
            value={formData[field] ?? DEFAULT_SETTINGS[field]} 
            onChange={e => handleChange(field, e.target.value)}
            placeholder={placeholder}
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold h-24 resize-none focus:ring-2 focus:ring-pink-500 outline-none transition-all text-gray-900"
          />
        ) : (
          <input 
            value={formData[field] ?? DEFAULT_SETTINGS[field]} 
            onChange={e => handleChange(field, e.target.value)}
            placeholder={placeholder}
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-pink-500 outline-none transition-all text-gray-900"
          />
        )}

        {/* Style Popover */}
        {isStyleOpen && (
          <div 
            onClick={e => e.stopPropagation()}
            className="absolute right-0 top-0 z-40 mt-2 p-5 bg-white rounded-[2.5rem] border border-pink-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200 w-[280px]"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Palette size={14} className="text-pink-500" />
                <span className="text-[10px] font-black text-pink-900 uppercase tracking-widest">Text Styling</span>
              </div>
              <button onClick={() => setActiveStyleField(null)} className="p-1 hover:bg-pink-50 rounded-lg transition-colors">
                <X size={14} className="text-gray-400 hover:text-red-500" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Font Color</label>
                <div className="custom-color-picker">
                  <HexColorPicker 
                    color={formData[colorField] ?? DEFAULT_SETTINGS[colorField]} 
                    onChange={val => handleChange(colorField, val)} 
                  />
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-8 h-8 rounded-lg shadow-inner border border-white" style={{ backgroundColor: formData[colorField] ?? DEFAULT_SETTINGS[colorField] }} />
                  <input 
                    value={formData[colorField] ?? DEFAULT_SETTINGS[colorField]} 
                    onChange={e => handleChange(colorField, e.target.value)}
                    className="flex-1 bg-transparent text-xs font-mono font-bold text-gray-600 uppercase outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Font Size</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative group">
                    <select 
                      value={formData[sizeField] ?? DEFAULT_SETTINGS[sizeField]}
                      onChange={e => handleChange(sizeField, e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs appearance-none focus:ring-2 focus:ring-pink-500 outline-none cursor-pointer"
                    >
                      {FONT_SIZES.map(sz => (
                        <option key={sz} value={sz}>{sz} px</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <input 
                    type="number" 
                    value={formData[sizeField] ?? DEFAULT_SETTINGS[sizeField]} 
                    onChange={e => handleChange(sizeField, e.target.value)}
                    className="w-16 p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs text-center focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminHomeEditor = () => {
  const { settings, updateSettings } = useContext(AppContext);
  const [formData, setFormData] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [activeStyleField, setActiveStyleField] = useState(null);

  // Keep form in sync with settings updates from database
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(formData);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
    setIsSaving(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Left Column: Hero & Navigation */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 border border-pink-100 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-pink-900 mb-6 flex items-center gap-2">
              <Home className="text-pink-500" /> Hero Section (Home)
            </h3>
            
            <div className="space-y-4">
              <EditableField label="Hero Heading" field="heroTitle" icon={Type} placeholder="e.g. Welcome to" formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
              <EditableField label="Hero Description" field="heroDescription" type="textarea" icon={LucideFileText} formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />

              <div className="space-y-2 pt-2">
                <label className="text-xs font-black text-pink-900 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon size={14} /> Hero Banner URL
                </label>
                <input 
                  value={formData.homepageBanner || ''} 
                  onChange={e => handleChange('homepageBanner', e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                />
                {formData.homepageBanner && (
                  <div className="mt-4 rounded-2xl overflow-hidden h-40 border border-pink-100 relative group">
                    <img src={formData.homepageBanner} alt="Hero Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-pink-50 grid grid-cols-1 md:grid-cols-2 gap-6">
                <EditableField label='"Closed" Status Label' field="closedStatusText" formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
                <EditableField label='"View Menu" Button' field="viewMenuBtnText" formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
                <EditableField label='"Special Offers" Button' field="specialOffersBtnText" formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
                <EditableField label='"Browsing Only" Label' field="browsingOnlyBtnText" formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
              </div>

              <div className="pt-6 border-t border-pink-50">
                <label className="text-xs font-black text-pink-900 uppercase tracking-wider mb-4 block flex items-center gap-2">
                  <Layout size={14} /> Navigation Menu Labels
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <EditableField label="Home" field="navHomeLabel" minSize={8} maxSize={24} formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
                  <EditableField label="Menu" field="navMenuLabel" minSize={8} maxSize={24} formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
                  <EditableField label="Offers" field="navOffersLabel" minSize={8} maxSize={24} formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-pink-100 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-pink-900 mb-6 flex items-center gap-2">
              <Sparkles className="text-pink-500" /> Menu Page Appearance
            </h3>
            <div className="space-y-4">
              <EditableField label="Menu Page Title" field="menuTitle" formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
              <EditableField label="Menu Page Tagline" field="menuTagline" formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
              
              <div className="space-y-2 pt-2">
                <label className="text-xs font-black text-pink-900 uppercase tracking-wider">Menu Page Banner URL</label>
                <input 
                  value={formData.menuBanner || DEFAULT_SETTINGS.menuBanner} 
                  onChange={e => handleChange('menuBanner', e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Information & Offers */}
        <div className="space-y-8">
          <div className="bg-pink-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-pink-100 space-y-6">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-pink-200">
              <LucideFileText size={20} /> Important Information (Notes)
            </h3>
            
            <div className="space-y-6">
              <EditableField label="Note Section Heading" field="noteHeadingText" isDarkBg={true} formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EditableField label="Tax Note" field="taxNote" isDarkBg={true} formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
                <EditableField label="Availability Note" field="availabilityNote" isDarkBg={true} formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
              </div>
              <EditableField label="Wait Time Note" field="waitNote" type="textarea" isDarkBg={true} formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
              <EditableField label="Global Disclaimer" field="menuDisclaimer" type="textarea" isDarkBg={true} formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-pink-100 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-pink-900 mb-6 flex items-center gap-2">
              <Gift className="text-pink-500" /> Offers Page Content
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EditableField label="Page Title" field="offersTitle" formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
                <EditableField label="Top Badge (Subtitle)" field="offersSubtitle" formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
              </div>
              <EditableField label="Main Header" field="offersHeader" formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
              <EditableField label="Page Description" field="offersDescription" type="textarea" formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSaving}
            className={`w-full flex items-center justify-center gap-2 px-6 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl ${
              isSaving ? 'bg-pink-100 text-pink-400 cursor-wait' : 'bg-pink-600 text-white hover:bg-pink-700 hover:shadow-pink-500/25 active:scale-[0.98]'
            }`}
          >
            <Save size={20} />
            {isSaving ? 'Saving Changes...' : 'Save All Page Content'}
          </button>
        </div>

      </form>
    </div>
  );
};

const FileTextIcon = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
);

export default AdminHomeEditor;
