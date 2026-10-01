import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { Plus, Search, Edit2, Trash2, Sparkles, X, GripVertical, Image as ImageIcon, UploadCloud, Loader, Save, Star } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const AdminFeatured = () => {
  const { menuItems, featured, addFeatured, updateFeatured, deleteFeatured, reorderFeatured } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Form State
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image: '',
    itemId: '',
    badge: 'CHEF\'S SPECIAL',
    isActive: true
  });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        title: editingItem.title || '',
        subtitle: editingItem.subtitle || '',
        image: editingItem.image || '',
        itemId: editingItem.itemId || '',
        badge: editingItem.badge || 'CHEF\'S SPECIAL',
        isActive: editingItem.isActive !== undefined ? editingItem.isActive : true
      });
    } else {
      setFormData({
        title: '',
        subtitle: '',
        image: '',
        itemId: '',
        badge: 'CHEF\'S SPECIAL',
        isActive: true
      });
    }
  }, [editingItem, isFormOpen]);

  const filteredFeatured = featured.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    const items = Array.from(filteredFeatured);
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

    await reorderFeatured(reorderedItem.id, newOrderIndex);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingItem) {
      await updateFeatured(editingItem.id, formData);
    } else {
      await addFeatured(formData);
    }
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, image: reader.result }));
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-white/60 backdrop-blur-sm p-6 rounded-3xl border border-pink-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400" size={20} />
          <input 
            type="text" 
            placeholder="Search featured items..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-pink-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-pink-900 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button 
          onClick={() => { setEditingItem(null); setIsFormOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-100"
        >
          <Plus size={20} />
          Add Featured
        </button>
      </div>

      {/* Featured Items Grid */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="featured-list" direction="vertical">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredFeatured.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.draggableProps}
                      className={`bg-white rounded-3xl overflow-hidden border border-pink-100 shadow-lg shadow-pink-50 group flex flex-col ${snapshot.isDragging ? 'shadow-2xl ring-4 ring-pink-50' : ''}`}
                    >
                      <div className="h-48 relative overflow-hidden">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div {...provided.dragHandleProps} className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-md rounded-xl text-white cursor-grab active:cursor-grabbing">
                          <GripVertical size={20} />
                        </div>
                        <div className="absolute top-4 right-4 flex gap-2">
                          <button onClick={() => { setEditingItem(item); setIsFormOpen(true); }} className="p-2 bg-white text-pink-600 rounded-xl shadow-lg hover:scale-110 transition-transform"><Edit2 size={16} /></button>
                          <button onClick={() => setItemToDelete(item)} className="p-2 bg-white text-red-500 rounded-xl shadow-lg hover:scale-110 transition-transform"><Trash2 size={16} /></button>
                        </div>
                        <div className="absolute bottom-4 left-6">
                          <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-[10px] font-black tracking-widest uppercase">{item.badge}</span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-black text-pink-900 uppercase tracking-tight mb-1">{item.title}</h3>
                        <p className="text-pink-400 text-sm font-medium line-clamp-1">{item.subtitle}</p>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-pink-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-pink-100 relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-amber-500 px-8 py-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Sparkles size={24} />
                <h3 className="text-xl font-black uppercase tracking-widest">{editingItem ? 'Edit Featured' : 'New Featured'}</h3>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleSave} className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-pink-900 uppercase tracking-wider">Main Title</label>
                  <input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g. Chef's Secret Burger" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 font-bold transition-all" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-pink-900 uppercase tracking-wider">Subtitle / Highlight</label>
                  <input value={formData.subtitle} onChange={(e) => setFormData({...formData, subtitle: e.target.value})} placeholder="e.g. Double patty with melted Brie" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 font-bold transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-pink-900 uppercase tracking-wider">Badge Text</label>
                    <input value={formData.badge} onChange={(e) => setFormData({...formData, badge: e.target.value})} placeholder="e.g. LIMITED TIME" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 font-bold transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-pink-900 uppercase tracking-wider">Link to Item</label>
                    <select value={formData.itemId} onChange={(e) => setFormData({...formData, itemId: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 font-bold transition-all">
                      <option value="">No Link</option>
                      {menuItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-pink-50">
                  <label className="text-xs font-black text-pink-900 uppercase tracking-wider">Featured Image</label>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="w-full sm:w-48 h-32 rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50 flex items-center justify-center relative overflow-hidden group shadow-inner">
                      {formData.image ? (
                        <>
                          <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setFormData({...formData, image: ''})} className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold">Remove</button>
                        </>
                      ) : <ImageIcon size={32} className="text-pink-200" />}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex gap-2">
                        <input type="file" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-pink-200 text-pink-600 rounded-xl font-bold hover:bg-pink-50 transition-all text-sm shadow-sm"><UploadCloud size={18} /> Upload</button>
                      </div>
                      <input type="text" placeholder="Or paste image URL..." value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} className="w-full p-3 bg-pink-50/50 border border-pink-100 rounded-xl text-xs font-medium focus:outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isUploading} className={`w-full py-5 ${isUploading ? 'bg-amber-400' : 'bg-amber-500 hover:bg-amber-600'} text-white rounded-3xl font-black uppercase tracking-widest transition-all shadow-xl shadow-amber-100 flex items-center justify-center gap-3`}>
                {isUploading ? <Loader className="animate-spin" /> : <Star />}
                {isUploading ? 'Processing...' : editingItem ? 'Update Feature' : 'Launch Feature'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-pink-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl border border-pink-100">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 className="text-red-500" size={40} /></div>
            <h3 className="text-2xl font-black text-pink-900 mb-2 uppercase tracking-tight">Remove Feature?</h3>
            <p className="text-gray-500 font-medium mb-8">This will remove <span className="font-bold">"{itemToDelete.title}"</span> from the featured list.</p>
            <div className="flex gap-4">
              <button onClick={() => setItemToDelete(null)} className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-black uppercase text-xs tracking-widest text-gray-400 hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={async () => { await deleteFeatured(itemToDelete.id); setItemToDelete(null); }} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-200 hover:bg-red-600 transition-all">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeatured;
