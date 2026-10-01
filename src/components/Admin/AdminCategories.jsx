import React, { useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppContext } from '../../context/AppContext';
import { Plus, Edit2, Trash2, X, GripVertical, Save } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const AdminCategories = ({ isOpen, onClose }) => {
  const { categories, addCategory, updateCategory, deleteCategory, reorderCategory } = useContext(AppContext);
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  if (!isOpen) return null;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await addCategory(newCatName.trim());
    setNewCatName('');
  };

  const handleUpdate = async (id) => {
    if (!editingName.trim()) return;
    await updateCategory(id, { name: editingName.trim() });
    setEditingId(null);
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    let newOrderIndex;
    const destIndex = result.destination.index;
    
    if (items.length === 1) {
      newOrderIndex = Number(reorderedItem.orderIndex || reorderedItem.id);
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
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-pink-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 border border-pink-100 relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
          <X size={20} />
        </button>
        
        <h3 className="text-2xl font-bold text-pink-900 mb-6">Manage Categories</h3>

        {/* Add Category Form */}
        <form onSubmit={handleAdd} className="flex gap-2 mb-8">
          <input 
            type="text" 
            placeholder="New category name..."
            className="flex-1 p-3 bg-pink-50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
          />
          <button 
            type="submit"
            className="p-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-all shadow-lg shadow-pink-200"
          >
            <Plus size={20} />
          </button>
        </form>

        {/* Categories List */}
        <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="categories-list">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {categories.map((cat, index) => (
                    <Draggable key={cat.id} draggableId={cat.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-3 p-3 bg-white border rounded-2xl transition-all ${
                            snapshot.isDragging ? 'border-pink-500 shadow-lg ring-2 ring-pink-500/20' : 'border-pink-50 hover:border-pink-100'
                          }`}
                        >
                          <div {...provided.dragHandleProps} className="text-pink-200 hover:text-pink-400 cursor-grab active:cursor-grabbing">
                            <GripVertical size={18} />
                          </div>
                          
                          <div className="flex-1">
                            {editingId === cat.id ? (
                              <div className="flex gap-2">
                                <input 
                                  autoFocus
                                  className="flex-1 text-sm font-bold text-pink-900 bg-pink-50 px-2 py-1 rounded-lg focus:outline-none"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleUpdate(cat.id)}
                                />
                                <button onClick={() => handleUpdate(cat.id)} className="text-green-500 hover:bg-green-50 p-1 rounded-lg transition-colors"><Save size={16} /></button>
                              </div>
                            ) : (
                              <span className="text-sm font-bold text-pink-900 uppercase tracking-tight">{cat.name}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 lg:opacity-100 transition-opacity">
                            <button 
                              onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }}
                              className="p-1.5 text-pink-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => deleteCategory(cat.id)}
                              className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
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
        </div>

        <p className="text-[10px] text-pink-400 mt-6 text-center italic">Drag handles to reorder categories in the public menu.</p>
      </div>
    </div>,
    document.body
  );
};

export default AdminCategories;
