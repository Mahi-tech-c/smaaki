import React, { useState, useContext, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AppContext } from '../../context/AppContext';
import { X, Save, Image as ImageIcon, IndianRupee, Tag, AlignLeft, UploadCloud, Search, Trash2, Loader, Plus, List } from 'lucide-react';
import { compressImageFile } from '../../utils/helpers';


const AdminItemForm = ({ isOpen, onClose, item }) => {
  const { addItem, updateItem, categories: dbCategories } = useContext(AppContext);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    image: '',
    options: [],
    isAvailable: true
  });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        price: item.price,
        category: item.category,
        description: item.description || '',
        image: item.image || '',
        options: item.options || [],
        isAvailable: item.isAvailable !== undefined ? item.isAvailable : true
      });
    } else {
      setFormData({
        name: '',
        price: '',
        category: '',
        description: '',
        image: '',
        options: [],
        isAvailable: true
      });
    }
  }, [item]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clean up empty options before saving
    const cleanedFormData = { ...formData };
    if (cleanedFormData.options) {
      cleanedFormData.options = cleanedFormData.options.filter(opt => opt.title.trim() !== '' && opt.price.trim() !== '');
    }

    if (item) {
      updateItem(item.id, cleanedFormData);
    } else {
      addItem(cleanedFormData);
    }
    onClose();
  };

  const handleAddOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...(prev.options || []), { title: '', price: '' }]
    }));
  };

  const handleRemoveOption = (index) => {
    setFormData(prev => {
      const newOptions = [...prev.options];
      newOptions.splice(index, 1);
      return { ...prev, options: newOptions };
    });
  };

  const handleOptionChange = (index, field, value) => {
    setFormData(prev => {
      const newOptions = [...prev.options];
      newOptions[index][field] = value;
      return { ...prev, options: newOptions };
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const base64String = await compressImageFile(file, 400, 0.6);
      setFormData(prev => ({ ...prev, image: base64String }));
    } catch (err) {
      console.error("Failed to compress image:", err);
      alert("Could not process this image. Please try a different photo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleBrowseOnline = () => {
    if (formData.name) {
      const query = encodeURIComponent(formData.name + ' food plate');
      window.open(`https://www.google.com/search?tbm=isch&q=${query}`, '_blank');
    } else {
      alert("Please enter the Item Name first to browse online for it.");
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-pink-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-pink-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-pink-600 px-6 py-4 flex items-center justify-between text-white">
          <h2 className="text-xl font-bold uppercase tracking-tight">{item ? 'Edit Menu Item' : 'Add New Item'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-pink-700 flex items-center gap-2">
                <Tag size={16} /> Name
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-pink-50/50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-pink-900 placeholder:text-pink-200"
                placeholder="e.g. Nutella Waffle"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            {/* Base Price */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-pink-700 flex items-center gap-2">
                <IndianRupee size={16} /> Base Price {formData.options?.length > 0 && '(Optional if variants added)'}
              </label>
              <input
                type="text"
                required={!formData.options || formData.options.length === 0}
                className="w-full px-4 py-3 bg-pink-50/50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-pink-900 placeholder:text-pink-200"
                placeholder="219.00"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-pink-700 flex items-center gap-2">
                <Tag size={16} /> Category
              </label>
              <input
                type="text"
                required
                list="dynamic-categories-list"
                className="w-full px-4 py-3 bg-pink-50/50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-pink-900 placeholder:text-pink-200"
                placeholder="Select or type..."
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              />
              <datalist id="dynamic-categories-list">
                {dbCategories.map(cat => (
                  <option key={cat.id} value={cat.name} />
                ))}
              </datalist>
            </div>

            {/* Availability */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-pink-700 flex items-center gap-2">
                <Tag size={16} /> Availability
              </label>
              <select
                className="w-full px-4 py-3 bg-pink-50/50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-pink-900 font-medium"
                value={formData.isAvailable ? 'available' : 'unavailable'}
                onChange={(e) => setFormData({...formData, isAvailable: e.target.value === 'available'})}
              >
                <option value="available">✅ Available</option>
                <option value="unavailable">❌ Not Available</option>
              </select>
            </div>

            {/* Price Variants / Options */}
            <div className="space-y-4 col-span-1 md:col-span-2 mt-2 border-t border-pink-100 pt-6">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-pink-700 flex items-center gap-2">
                  <List size={16} /> Price Variants / Options
                </label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="flex items-center gap-1 px-3 py-1.5 bg-pink-100 text-pink-700 rounded-lg text-xs font-bold hover:bg-pink-200 transition-colors"
                >
                  <Plus size={14} /> Add Option
                </button>
              </div>
              
              {formData.options && formData.options.length > 0 ? (
                <div className="space-y-3">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-3 bg-pink-50/50 p-3 rounded-xl border border-pink-100">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Variant Name (e.g. Medium)"
                          className="w-full px-3 py-2 bg-white border border-pink-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-pink-900 text-sm"
                          value={option.title}
                          onChange={(e) => handleOptionChange(index, 'title', e.target.value)}
                          required
                        />
                      </div>
                      <div className="w-32">
                        <div className="relative">
                          <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400" />
                          <input
                            type="text"
                            placeholder="Price"
                            className="w-full pl-8 pr-3 py-2 bg-white border border-pink-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-pink-900 text-sm"
                            value={option.price}
                            onChange={(e) => handleOptionChange(index, 'price', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove Variant"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-pink-400 italic">No variants added. Single base price will be used.</p>
              )}
            </div>

            {/* Image Selection Area */}
            <div className="space-y-4 col-span-1 md:col-span-2 mt-2 border-t border-pink-100 pt-6">
              <label className="text-sm font-bold text-pink-700 flex items-center gap-2">
                <ImageIcon size={16} /> Item Image
              </label>
              
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Preview Area */}
                <div className="w-48 h-48 rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50/50 flex flex-col items-center justify-center relative overflow-hidden flex-shrink-0">
                  {formData.image ? (
                    <>
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, image: ''})}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                        title="Remove Image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <div className="text-pink-300 flex flex-col items-center gap-2 px-4 text-center">
                       <ImageIcon size={32} opacity={0.5} className="mb-1" />
                       <span className="text-xs font-semibold">No Image Selected</span>
                    </div>
                  )}
                </div>

                {/* Controls Area */}
                <div className="flex-1 space-y-4 w-full">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Hidden file input */}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                    />
                    
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-pink-200 text-pink-600 rounded-xl font-bold hover:bg-pink-50 hover:border-pink-300 transition-all shadow-sm"
                    >
                      <UploadCloud size={18} />
                      Upload Photo
                    </button>

                    <button 
                      type="button"
                      onClick={handleBrowseOnline}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-pink-100 text-pink-700 rounded-xl font-bold hover:bg-pink-200 transition-all shadow-sm"
                    >
                      <Search size={18} />
                      Browse Online
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-pink-500 font-medium ml-1">Or paste image URL directly:</p>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-pink-50/50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-pink-900 placeholder:text-pink-300 text-sm"
                      placeholder="e.g. https://example.com/image.jpg"
                      value={formData.image}
                      onChange={(e) => setFormData({...formData, image: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-pink-700 flex items-center gap-2">
              <AlignLeft size={16} /> Description
            </label>
            <textarea
              rows="4"
              className="w-full px-4 py-3 bg-pink-50/50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-pink-900 placeholder:text-pink-200 resize-none"
              placeholder="Tell customers more about this item..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-pink-200 text-pink-600 rounded-xl font-bold hover:bg-pink-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className={`flex-[2] px-6 py-3 ${isUploading ? 'bg-pink-400 cursor-not-allowed' : 'bg-pink-600'} text-white rounded-xl font-bold hover:bg-pink-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-200`}
            >
              {isUploading ? <Loader size={20} className="animate-spin" /> : <Save size={20} />}
              {isUploading ? 'Uploading Image...' : (item ? 'Save Changes' : 'Create Item')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AdminItemForm;
