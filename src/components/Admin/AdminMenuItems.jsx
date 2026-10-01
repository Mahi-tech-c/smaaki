import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Plus, Search, Edit2, Trash2, LayoutGrid, QrCode, GripVertical, List, ChevronDown, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import AdminCategories from './AdminCategories';

const AdminMenuItems = ({ onAdd, onEdit, onDelete, onGetQr }) => {
  const { menuItems, categories: dbCategories, reorderItem, reorderCategory, updateItem } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState({});

  const managedCategories = dbCategories.map(cat => cat.name);
  const categoriesInItems = [...new Set(menuItems.map(item => item.category).filter(Boolean))];
  const unmanagedCategories = categoriesInItems.filter(cat => !managedCategories.includes(cat));
  
  // The actual category list for the view
  const categoryList = activeCategory === 'All' 
    ? [...dbCategories, ...unmanagedCategories.map(name => ({ id: name, name, isUnmanaged: true }))]
    : dbCategories.filter(c => c.name === activeCategory).length > 0
      ? dbCategories.filter(c => c.name === activeCategory)
      : [{ id: activeCategory, name: activeCategory, isUnmanaged: true }];

  const onDragEnd = async (result) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'CATEGORY') {
      const items = Array.from(categoryList);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      let newOrderIndex;
      const destIndex = destination.index;
      if (items.length === 1) {
        newOrderIndex = Number(reorderedItem.orderIndex || Date.now());
      } else if (destIndex === 0) {
        newOrderIndex = Number(items[1].orderIndex || items[1].id) - 1000;
      } else if (destIndex === items.length - 1) {
        newOrderIndex = Number(items[items.length - 2].orderIndex || items[items.length - 2].id) + 1000;
      } else {
        const prevOrder = Number(items[destIndex - 1].orderIndex || items[destIndex - 1].id);
        const nextOrder = Number(items[destIndex + 1].orderIndex || items[destIndex + 1].id);
        newOrderIndex = (prevOrder + nextOrder) / 2;
      }
      await reorderCategory(reorderedItem.id, newOrderIndex, reorderedItem.name);
    } else {
      // ITEM Reordering
      const sourceCat = source.droppableId.replace('items-', '');
      const destCat = destination.droppableId.replace('items-', '');
      
      const destItems = menuItems.filter(item => item.category === destCat);
      const sourceItems = menuItems.filter(item => item.category === sourceCat);
      const [reorderedItem] = sourceItems.splice(source.index, 1);
      
      // If moving to a new category, update the category first
      if (sourceCat !== destCat) {
        reorderedItem.category = destCat;
      }
      
      destItems.splice(destination.index, 0, reorderedItem);

      let newOrderIndex;
      const destIndex = destination.index;
      if (destItems.length === 1) {
        newOrderIndex = Number(reorderedItem.orderIndex || Date.now());
      } else if (destIndex === 0) {
        newOrderIndex = Number(destItems[1].orderIndex || destItems[1].id) - 1000;
      } else if (destIndex === destItems.length - 1) {
        newOrderIndex = Number(destItems[destItems.length - 2].orderIndex || destItems[destItems.length - 2].id) + 1000;
      } else {
        const prevOrder = Number(destItems[destIndex - 1].orderIndex || destItems[destIndex - 1].id);
        const nextOrder = Number(destItems[destIndex + 1].orderIndex || destItems[destIndex + 1].id);
        newOrderIndex = (prevOrder + nextOrder) / 2;
      }

      const updateData = { orderIndex: newOrderIndex };
      if (sourceCat !== destCat) updateData.category = destCat;
      await updateItem(reorderedItem.id, updateData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Modal */}
      <AdminCategories isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} />

      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-pink-100 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300" size={18} />
          <input 
            type="text" 
            placeholder="Search items..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-pink-50/50 border border-pink-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-pink-900 placeholder:text-pink-300 text-sm"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select 
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="px-4 py-3 bg-white border border-pink-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-pink-900 shadow-inner flex-1 md:flex-none text-sm font-semibold"
          >
            <option value="All">All Categories (Grouped)</option>
            {dbCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
            {unmanagedCategories.map(cat => <option key={cat} value={cat}>{cat} (Unmanaged)</option>)}
          </select>
          
          <button onClick={() => setIsCatModalOpen(true)} className="flex items-center gap-2 px-4 py-3 bg-pink-100 text-pink-700 rounded-2xl font-bold hover:bg-pink-200 transition-all border border-pink-200 text-sm">
            <List size={18} /> Categories
          </button>
          <button onClick={onAdd} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-2xl font-bold hover:bg-pink-700 transition-all shadow-lg shadow-pink-200 text-sm">
            <Plus size={18} /> Add Item
          </button>
        </div>
      </div>

      {/* Nested Drag and Drop View */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="categories-root" type="CATEGORY">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
              {categoryList.map((category, catIndex) => {
                const itemsInCategory = menuItems.filter(item => 
                  item.category === category.name && 
                  (searchTerm === '' || item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                );

                if (activeCategory === 'All' && itemsInCategory.length === 0 && category.isUnmanaged) return null;

                return (
                  <Draggable key={category.id} draggableId={`cat-${category.id}`} index={catIndex} isDragDisabled={activeCategory !== 'All'}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.draggableProps}
                        className={`bg-white rounded-3xl border border-pink-100 shadow-sm overflow-hidden transition-all ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-pink-500/20' : ''}`}
                      >
                        {/* Category Header */}
                        <div className="bg-pink-50/50 px-6 py-4 flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div {...provided.dragHandleProps} className="text-pink-300 hover:text-pink-600 transition-colors cursor-grab active:cursor-grabbing p-1">
                              <GripVertical size={20} />
                            </div>
                            <h3 className="text-lg font-black text-pink-900 uppercase tracking-tight flex items-center gap-3">
                              {category.name}
                              <span className="text-xs font-bold px-2 py-0.5 bg-white text-pink-400 rounded-lg border border-pink-100">
                                {itemsInCategory.length}
                              </span>
                            </h3>
                          </div>
                          <button 
                            onClick={() => setCollapsedCats(prev => ({ ...prev, [category.name]: !prev[category.name] }))}
                            className="p-2 hover:bg-white rounded-xl text-pink-400 transition-colors"
                          >
                            {collapsedCats[category.name] ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                          </button>
                        </div>

                        {/* Items List within Category */}
                        {!collapsedCats[category.name] && (
                          <Droppable droppableId={`items-${category.name}`} type="ITEM">
                            {(provided) => (
                              <div {...provided.droppableProps} ref={provided.innerRef} className="divide-y divide-pink-50">
                                {itemsInCategory.map((item, itemIndex) => (
                                  <Draggable key={item.id} draggableId={`item-${item.id}`} index={itemIndex}>
                                    {(provided, snapshot) => (
                                      <div 
                                        ref={provided.innerRef} 
                                        {...provided.draggableProps}
                                        className={`p-4 flex items-center gap-4 hover:bg-pink-50/30 transition-colors group ${snapshot.isDragging ? 'bg-pink-50 shadow-inner' : ''}`}
                                      >
                                        <div {...provided.dragHandleProps} className="text-pink-200 hover:text-pink-400 p-1 cursor-grab active:cursor-grabbing">
                                          <GripVertical size={16} />
                                        </div>
                                        
                                        <img src={item.image} className="w-12 h-12 rounded-xl object-cover shadow-sm bg-pink-50" />
                                        
                                        <div className="flex-1 min-w-0">
                                          <div className="font-bold text-pink-900 text-sm flex items-center gap-2 truncate">
                                            <span>{item.name}</span>
                                            {item.isAvailable === false && (
                                              <span className="text-[10px] text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-black uppercase">
                                                Out of Stock
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-xs text-pink-500 font-bold mt-0.5">
                                            ₹{item.price || (item.options?.[0]?.price) || '0.00'}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          {/* Quick Toggle Stock status */}
                                          <button
                                            onClick={() => updateItem(item.id, { isAvailable: item.isAvailable === false ? true : false })}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                                              item.isAvailable === false
                                                ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                                : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                            }`}
                                            title="Click to toggle availability"
                                          >
                                            {item.isAvailable === false ? (
                                              <>
                                                <XCircle size={14} /> Sold Out
                                              </>
                                            ) : (
                                              <>
                                                <CheckCircle2 size={14} /> In Stock
                                              </>
                                            )}
                                          </button>

                                          <button 
                                            onClick={() => onEdit(item)} 
                                            className="p-2 text-pink-600 hover:bg-pink-100 rounded-xl transition-all"
                                            title="Edit Item"
                                          >
                                            <Edit2 size={16} />
                                          </button>
                                          
                                          <button 
                                            onClick={() => onDelete(item)} 
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            title="Delete Item"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                                {itemsInCategory.length === 0 && (
                                  <div className="p-12 text-center text-pink-300 italic text-sm">No items in this category.</div>
                                )}
                              </div>
                            )}
                          </Droppable>
                        )}
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default AdminMenuItems;
