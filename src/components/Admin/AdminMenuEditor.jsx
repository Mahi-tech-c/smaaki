import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { Save, Image as ImageIcon, FileText, Clock, Info, AlertCircle, List, Sparkles } from 'lucide-react';

const AdminMenuEditor = () => {
  const { settings, updateSettings, setIsCatModalOpen } = useContext(AppContext);
  const [formData, setFormData] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await updateSettings(formData);
    setIsSaving(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Main Column: Visual Settings */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-pink-100 shadow-sm">
            <h3 className="text-xl font-black text-pink-900 mb-6 flex items-center gap-2">
              <Sparkles className="text-pink-500" /> Page Appearance
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-pink-900 uppercase tracking-wider">Menu Page Title</label>
                <input 
                  value={formData.menuTitle || ''} 
                  onChange={e => setFormData({ ...formData, menuTitle: e.target.value })}
                  placeholder="e.g. Our Delicious Menu"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-pink-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-pink-900 uppercase tracking-wider">Menu Tagline</label>
                <input 
                  value={formData.menuTagline || ''} 
                  onChange={e => setFormData({ ...formData, menuTagline: e.target.value })}
                  placeholder="e.g. Freshly prepared just for you"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-pink-500 transition-all"
                />
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <label className="text-xs font-black text-pink-900 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon size={14} /> Menu Banner Image URL
              </label>
              <input 
                value={formData.menuBanner || ''} 
                onChange={e => setFormData({ ...formData, menuBanner: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-pink-500 transition-all"
              />
              {formData.menuBanner && (
                <div className="mt-4 rounded-2xl overflow-hidden h-32 border border-pink-100">
                  <img src={formData.menuBanner} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            
            <div className="mt-8 pt-8 border-t border-pink-50">
              <button 
                type="submit"
                disabled={isSaving}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all shadow-lg ${
                  isSaving ? 'bg-pink-100 text-pink-400' : 'bg-pink-600 text-white hover:bg-pink-700 active:scale-95'
                }`}
              >
                <Save size={20} />
                {isSaving ? 'Saving Changes...' : 'Save Menu Page Appearance'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-pink-100 shadow-sm">
            <h3 className="text-xl font-black text-pink-900 mb-6 flex items-center gap-2">
              <List className="text-pink-500" /> Category Management
            </h3>
            <p className="text-sm text-pink-600 mb-6">Organize how your food categories appear on the menu page. You can drag and drop to reorder them.</p>
            <button 
              type="button"
              onClick={() => setIsCatModalOpen(true)}
              className="flex items-center gap-2 px-6 py-4 bg-pink-50 text-pink-700 rounded-2xl font-bold hover:bg-pink-100 transition-all border border-pink-100"
            >
              <List size={20} /> Open Category Manager
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};

export default AdminMenuEditor;
