import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { Plus, Search, Edit2, Trash2, Gift, X, GripVertical, Image as ImageIcon, UploadCloud, Loader, Save, Tag, IndianRupee, RefreshCw, AlertCircle, AlignLeft, Calendar, History, Clock, ArrowRight, Percent, CheckSquare, Square } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const AdminOffers = () => {
  const { menuItems, offers, addOffer, updateOffer, deleteOffer, reorderOffer, categories: dbCategories, cleanupMenuPrices } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [offerToDelete, setOfferToDelete] = useState(null);

  const managedCategories = dbCategories.map(cat => cat.name);
  const categoriesInItems = [...new Set(menuItems.map(item => item.category).filter(Boolean))];
  const unmanagedCategories = categoriesInItems.filter(cat => !managedCategories.includes(cat));
  const allCategories = [...managedCategories, ...unmanagedCategories].sort();

  // Form State
  const fileInputRef = useRef(null);
  const [prevEditingOffer, setPrevEditingOffer] = useState(editingOffer);
  const [formData, setFormData] = useState(() => (editingOffer ? {
    title: editingOffer.title || '',
    description: editingOffer.description || '',
    image: editingOffer.image || '',
    tag: editingOffer.tag || '',
    categories: editingOffer.categories || (editingOffer.category ? [editingOffer.category] : []),
    discountPercentage: editingOffer.discountPercentage || '',
    startDate: editingOffer.startDate || '',
    endDate: editingOffer.endDate || '',
    itemPrices: editingOffer.itemPrices || {},
    isActive: editingOffer.isActive !== undefined ? editingOffer.isActive : true
  } : {
    title: '',
    description: '',
    image: '',
    tag: '',
    categories: [],
    discountPercentage: '',
    startDate: '',
    endDate: '',
    itemPrices: {},
    isActive: true
  }));
  const [isUploading, setIsUploading] = useState(false);

  if (editingOffer !== prevEditingOffer) {
    setPrevEditingOffer(editingOffer);
    setFormData(editingOffer ? {
      title: editingOffer.title || '',
      description: editingOffer.description || '',
      image: editingOffer.image || '',
      tag: editingOffer.tag || '',
      categories: editingOffer.categories || (editingOffer.category ? [editingOffer.category] : []),
      discountPercentage: editingOffer.discountPercentage || '',
      startDate: editingOffer.startDate || '',
      endDate: editingOffer.endDate || '',
      itemPrices: editingOffer.itemPrices || {},
      isActive: editingOffer.isActive !== undefined ? editingOffer.isActive : true
    } : {
      title: '',
      description: '',
      image: '',
      tag: '',
      categories: [],
      discountPercentage: '',
      startDate: '',
      endDate: '',
      itemPrices: {},
      isActive: true
    });
  }

  // Auto-calculate prices when categories or discount change
  useEffect(() => {
    if (isFormOpen) {
      const discount = parseFloat(formData.discountPercentage) || 0;
      const relevantItems = menuItems.filter(item => formData.categories.includes(item.category));
      
      setFormData(prev => {
        const newPrices = { ...prev.itemPrices };
        relevantItems.forEach(item => {
          // Only auto-fill if the price hasn't been manually set yet (or if resetting)
          if (!newPrices[item.id] || discount > 0) {
            const original = parseFloat(item.price) || 0;
            const discounted = discount > 0 ? Math.round(original * (1 - discount / 100)) : original;
            newPrices[item.id] = discounted.toString();
          }
        });
        return { ...prev, itemPrices: newPrices };
      });
    }
  }, [formData.categories, formData.discountPercentage, isFormOpen]);

  const filteredOffers = offers.filter(offer => 
    offer.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    offer.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    const items = Array.from(filteredOffers);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    let newOrderIndex;
    const destIndex = result.destination.index;
    
    if (items.length === 1) {
      newOrderIndex = Number(reorderedItem.orderIndex || Date.now());
    } else if (destIndex === 0) {
      newOrderIndex = Number(items[1].orderIndex || Date.now()) - 1000;
    } else if (destIndex === items.length - 1) {
      newOrderIndex = Number(items[items.length - 2].orderIndex || Date.now()) + 1000;
    } else {
      const prevOrder = Number(items[destIndex - 1].orderIndex || Date.now());
      const nextOrder = Number(items[destIndex + 1].orderIndex || Date.now());
      newOrderIndex = (prevOrder + nextOrder) / 2;
    }

    await reorderOffer(reorderedItem.id, newOrderIndex);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingOffer) {
      await updateOffer(editingOffer.id, formData);
    } else {
      await addOffer(formData);
    }
    setIsFormOpen(false);
    setEditingOffer(null);
  };

  const toggleCategory = (catName) => {
    setFormData(prev => {
      const cats = [...prev.categories];
      const index = cats.indexOf(catName);
      if (index > -1) cats.splice(index, 1);
      else cats.push(catName);
      return { ...prev, categories: cats };
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const MAX = 600;
      if (width > height) {
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
      } else {
        if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      const base64String = canvas.toDataURL('image/jpeg', 0.6);
      setFormData(prev => ({ ...prev, image: base64String }));
      setIsUploading(false);
    };
  };

  const handleBrowseOnline = () => {
    if (formData.title) {
      const query = encodeURIComponent(formData.title + ' restaurant offer banner');
      window.open(`https://www.google.com/search?tbm=isch&q=${query}`, '_blank');
    } else {
      alert("Please enter the Offer Title first.");
    }
  };

  const getOfferStatus = (offer) => {
    if (!offer.startDate || !offer.endDate) return { label: 'General', color: 'bg-gray-100 text-gray-600' };
    const now = new Date();
    const start = new Date(offer.startDate);
    const end = new Date(offer.endDate);
    
    if (now < start) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-600' };
    if (now > end) return { label: 'Expired', color: 'bg-red-100 text-red-600' };
    return { label: 'Active', color: 'bg-green-100 text-green-600 shadow-sm shadow-green-100' };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-white/60 backdrop-blur-sm p-6 rounded-3xl border border-purple-100 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
            <input 
              type="text" 
              placeholder="Search offers..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-purple-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-purple-900 transition-all shadow-inner font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => confirm("This will restore all menu items to their base prices. Continue?") && cleanupMenuPrices()}
            className="flex items-center gap-2 px-4 py-3 bg-orange-50 text-orange-600 rounded-2xl font-bold hover:bg-orange-100 transition-all border border-orange-100 text-xs uppercase tracking-wider"
            title="Fix main menu if prices were synced previously"
          >
            <History size={16} />
            Restore Menu Base Prices
          </button>
        </div>
        
        <button 
          onClick={() => { setEditingOffer(null); setIsFormOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
        >
          <Plus size={20} />
          Add New Offer
        </button>
      </div>

      {/* Offers List */}
      <div className="bg-white rounded-3xl shadow-xl shadow-purple-100/50 border border-purple-100 overflow-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-purple-600 text-white">
                  <th className="px-4 py-5 w-10"></th>
                  <th className="px-6 py-5 font-bold text-sm uppercase tracking-wider">Promotion</th>
                  <th className="px-6 py-5 font-bold text-sm uppercase tracking-wider text-center">Status / Duration</th>
                  <th className="px-6 py-5 font-bold text-sm uppercase tracking-wider text-center">Categories</th>
                  <th className="px-6 py-5 font-bold text-sm uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <Droppable droppableId="offers-list">
                {(provided) => (
                  <tbody {...provided.droppableProps} ref={provided.innerRef} className="divide-y divide-purple-50">
                    {filteredOffers.map((offer, index) => {
                      const status = getOfferStatus(offer);
                      const categories = offer.categories || (offer.category ? [offer.category] : []);

                      return (
                        <Draggable key={offer.id} draggableId={offer.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <tr 
                              ref={provided.innerRef} 
                              {...provided.draggableProps} 
                              className={`transition-colors group ${snapshot.isDragging ? 'bg-purple-50 shadow-lg' : 'hover:bg-purple-50/50'}`}
                            >
                              <td className="px-4 py-4">
                                <div {...provided.dragHandleProps} className="p-2 hover:bg-purple-100 rounded-lg cursor-grab active:cursor-grabbing text-purple-200 group-hover:text-purple-400 transition-colors">
                                  <GripVertical size={20} />
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-20 h-12 rounded-xl overflow-hidden bg-purple-100 border border-purple-200 shadow-sm relative">
                                    <img src={offer.image} alt="" className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                    <div className="font-black text-purple-900 uppercase text-sm tracking-tight">{offer.title}</div>
                                    <div className="text-[10px] font-bold text-purple-400 mt-0.5 bg-purple-50 px-2 py-0.5 rounded-full inline-block border border-purple-100">{offer.tag || 'PROMO'}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex flex-col items-center gap-1.5">
                                  <div className="flex items-center gap-1">
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${status.color}`}>
                                      {status.label}
                                    </span>
                                    {offer.discountPercentage && <span className="text-[10px] font-black text-pink-500 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100">{offer.discountPercentage}% OFF</span>}
                                  </div>
                                  {offer.startDate && (
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                      <Clock size={10} />
                                      {formatDate(offer.startDate)} - {formatDate(offer.endDate)}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {categories.length > 0 ? (
                                  <div className="flex flex-wrap justify-center gap-1 max-w-[200px] mx-auto">
                                    {categories.map(cat => (
                                      <span key={cat} className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">{cat}</span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-300 italic">No Target</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => { setEditingOffer(offer); setIsFormOpen(true); }} className="p-2 bg-white text-purple-600 hover:bg-purple-100 border border-purple-100 rounded-xl transition-all shadow-sm"><Edit2 size={18} /></button>
                                  <button onClick={() => setOfferToDelete(offer)} className="p-2 bg-white text-red-500 hover:bg-red-50 border border-red-100 rounded-xl transition-all shadow-sm"><Trash2 size={18} /></button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </tbody>
                )}
              </Droppable>
            </table>
          </div>
        </DragDropContext>
      </div>

      {/* Offer Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-purple-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-purple-100 relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-purple-600 px-8 py-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Gift size={24} />
                <h3 className="text-xl font-black uppercase tracking-widest">{editingOffer ? 'Edit Promotion' : 'New Special Offer'}</h3>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleSave} className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-2"><Tag size={14} /> Offer Title</label>
                  <input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g. Festive Discount" className="w-full p-4 bg-purple-50/50 border border-purple-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 text-purple-900 font-bold transition-all" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-2"><Percent size={14} /> Discount Percentage (%)</label>
                  <input type="number" value={formData.discountPercentage} onChange={(e) => setFormData({...formData, discountPercentage: e.target.value})} placeholder="e.g. 20" className="w-full p-4 bg-purple-50/50 border border-purple-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 text-purple-900 font-bold transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-2"><Calendar size={14} /> Start Date</label>
                  <input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="w-full p-4 bg-purple-50/50 border border-purple-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 text-purple-900 font-bold transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-2"><Calendar size={14} /> End Date</label>
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="w-full p-4 bg-purple-50/50 border border-purple-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 text-purple-900 font-bold transition-all" />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-3">
                  <label className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-2"><CheckSquare size={14} /> Target Categories</label>
                  <div className="flex flex-wrap gap-2 bg-purple-50/50 p-4 rounded-3xl border border-purple-100">
                    {allCategories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                          formData.categories.includes(cat)
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'bg-white border-purple-100 text-purple-400 hover:border-purple-300'
                        }`}
                      >
                        <span className="text-[10px] font-bold">{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Individual Pricing Table - Integrated into form */}
                {formData.categories.length > 0 && (
                  <div className="col-span-1 md:col-span-2 space-y-4 pt-4 border-t border-purple-50">
                     <label className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-2"><IndianRupee size={14} /> Offer Item Prices</label>
                     <div className="bg-purple-50/50 rounded-3xl border border-purple-100 overflow-hidden">
                       <table className="w-full text-left">
                         <thead className="bg-purple-100/50">
                           <tr className="text-[9px] font-black text-purple-400 uppercase tracking-widest">
                             <th className="py-3 px-4">Item</th>
                             <th className="py-3 px-4 text-right">Base Price</th>
                             <th className="py-3 px-4 text-right">Offer Price</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-purple-50">
                           {menuItems.filter(i => formData.categories.includes(i.category)).map(item => (
                             <tr key={item.id} className="text-sm">
                               <td className="py-3 px-4 font-bold text-purple-900">{item.name}</td>
                               <td className="py-3 px-4 text-right text-gray-400 font-medium">₹{item.price}</td>
                               <td className="py-3 px-4 text-right">
                                 <input 
                                   type="text"
                                   value={formData.itemPrices[item.id] || ''}
                                   onChange={(e) => setFormData({
                                     ...formData, 
                                     itemPrices: { ...formData.itemPrices, [item.id]: e.target.value }
                                   })}
                                   className="w-20 px-2 py-1 bg-white border border-purple-100 rounded-lg text-right font-black text-purple-600 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                 />
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                  </div>
                )}

                <div className="col-span-1 md:col-span-2 space-y-4 pt-4 border-t border-purple-50">
                  <label className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-2"><ImageIcon size={14} /> Promotion Image</label>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="w-full sm:w-48 h-32 rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50 flex items-center justify-center relative overflow-hidden group shadow-inner">
                      {formData.image ? (
                        <>
                          <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setFormData({...formData, image: ''})} className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold">Remove</button>
                        </>
                      ) : <ImageIcon size={32} className="text-purple-200" />}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex gap-2">
                        <input type="file" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-purple-200 text-purple-600 rounded-xl font-bold hover:bg-pink-50 transition-all text-sm shadow-sm"><UploadCloud size={18} /> Upload</button>
                        <button type="button" onClick={handleBrowseOnline} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-100 text-purple-700 rounded-xl font-bold hover:bg-purple-200 transition-all text-sm shadow-sm"><Search size={18} /> Search Online</button>
                      </div>
                      <input type="text" placeholder="Or paste image URL..." value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} className="w-full p-3 bg-purple-50/50 border border-purple-100 rounded-xl text-xs font-medium focus:outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-2 mb-2"><AlignLeft size={14} /> Offer Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Describe the promotion details..." className="w-full p-4 bg-purple-50/50 border border-purple-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 text-purple-900 font-bold placeholder:text-purple-200 h-32 resize-none" />
              </div>

              <button type="submit" disabled={isUploading} className={`w-full py-5 ${isUploading ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-3xl font-black uppercase tracking-widest transition-all shadow-xl shadow-purple-200 flex items-center justify-center gap-3`}>
                {isUploading ? <Loader className="animate-spin" /> : <Save />}
                {isUploading ? 'Compressing Image...' : editingOffer ? 'Update Promotion' : 'Launch Offer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {offerToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-purple-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl border border-purple-100">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 className="text-red-500" size={40} /></div>
            <h3 className="text-2xl font-black text-purple-900 mb-2 uppercase tracking-tight">Delete Offer?</h3>
            <p className="text-gray-500 font-medium mb-8">This will permanently remove the <span className="font-bold">"{offerToDelete.title}"</span> promotion.</p>
            <div className="flex gap-4">
              <button onClick={() => setOfferToDelete(null)} className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-black uppercase text-xs tracking-widest text-gray-400 hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={async () => { await deleteOffer(offerToDelete.id); setOfferToDelete(null); }} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-200 hover:bg-red-600 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOffers;
