import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Plus, Pencil, Trash2, UtensilsCrossed, X } from 'lucide-react';
import { toast } from 'sonner';

interface MenuManagementScreenProps {
  onBack: () => void;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
}

const categories = ['Appetizers', 'Main Courses', 'Desserts', 'Beverages', 'Combos', 'Other'];

const demoItems: MenuItem[] = [
  { id: 1, name: 'Chicken Shawarma', description: 'Grilled chicken wrapped with garlic sauce and fresh vegetables', price: 25, category: 'Main Courses' },
  { id: 2, name: 'Smash Burger', description: 'Double beef patties with cheddar cheese and special sauce', price: 35, category: 'Main Courses' },
  { id: 3, name: 'Kunafa Dessert', description: 'Traditional kunafa with cream cheese and pistachio', price: 18, category: 'Desserts' },
  { id: 4, name: 'Fresh Lemonade', description: 'Freshly squeezed lemonade with mint', price: 12, category: 'Beverages' },
];

export const MenuManagementScreen = ({ onBack }: MenuManagementScreenProps) => {
  const [items, setItems] = useState<MenuItem[]>(demoItems);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '', category: 'Main Courses' });

  const handleSave = () => {
    if (!newItem.name.trim()) { toast.error('Dish name is required'); return; }
    if (editingItem) {
      setItems(items.map(i => i.id === editingItem.id ? { ...i, name: newItem.name, description: newItem.description, price: Number(newItem.price) || 0, category: newItem.category } : i));
      toast.success('Item updated ✓');
    } else {
      setItems([...items, { id: Date.now(), name: newItem.name, description: newItem.description, price: Number(newItem.price) || 0, category: newItem.category }]);
      toast.success('Item added ✓');
    }
    setNewItem({ name: '', description: '', price: '', category: 'Main Courses' });
    setShowAddForm(false);
    setEditingItem(null);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setNewItem({ name: item.name, description: item.description, price: String(item.price), category: item.category });
    setShowAddForm(true);
  };

  const handleDelete = (id: number) => {
    setItems(items.filter(i => i.id !== id));
    toast.success('Item removed');
  };

  const inputClass = "w-full h-[50px] rounded-2xl bg-card border border-border px-4 text-[14px] text-foreground focus:border-primary focus:outline-none";

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
          <h1 className="text-[20px] font-bold text-foreground">Menu Items</h1>
        </div>

        {/* Menu items list */}
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-card rounded-2xl border border-border-light p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-[16px] font-bold text-foreground">{item.name}</h3>
                  <p className="text-[13px] text-muted-foreground mt-0.5">{item.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[14px] font-semibold text-brand-blue">SAR {item.price}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-soft text-purple">{item.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button onClick={() => handleEdit(item)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                    <Pencil size={14} className="text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 rounded-xl hover:bg-red-soft transition-colors">
                    <Trash2 size={14} className="text-red-accent" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add item button */}
        <button onClick={() => { setShowAddForm(true); setEditingItem(null); setNewItem({ name: '', description: '', price: '', category: 'Main Courses' }); }}
          className="w-full h-[52px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[14px] shadow-btn btn-press mt-5 flex items-center justify-center gap-2">
          <Plus size={18} /> Add Item
        </button>
      </div>

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowAddForm(false); setEditingItem(null); }} className="fixed inset-0 bg-foreground/30 z-40" />
            <motion.div initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }} className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-xl max-w-[430px] mx-auto max-h-[85vh] overflow-y-auto">
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[16px] font-bold text-foreground">{editingItem ? 'Edit Item' : 'Add Menu Item'}</h3>
                  <button onClick={() => { setShowAddForm(false); setEditingItem(null); }}><X size={20} className="text-muted-foreground" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[13px] font-semibold text-foreground mb-1.5 block">Dish Name *</label>
                    <input className={inputClass} placeholder="e.g., Chicken Shawarma" value={newItem.name} onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[13px] font-semibold text-foreground mb-1.5 block">Description</label>
                    <textarea className="w-full min-h-[64px] rounded-2xl bg-card border border-border p-4 text-[14px] focus:border-primary focus:outline-none resize-none" placeholder="Describe the dish..." value={newItem.description} onChange={e => setNewItem(n => ({ ...n, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[13px] font-semibold text-foreground mb-1.5 block">Price (SAR)</label>
                    <input type="number" className={inputClass} placeholder="25" value={newItem.price} onChange={e => setNewItem(n => ({ ...n, price: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[13px] font-semibold text-foreground mb-1.5 block">Category</label>
                    <select className={inputClass} value={newItem.category} onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))}>
                      {categories.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <button onClick={handleSave} className="w-full h-[52px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[14px] shadow-btn btn-press">
                    {editingItem ? 'Update Item' : 'Save Item'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
