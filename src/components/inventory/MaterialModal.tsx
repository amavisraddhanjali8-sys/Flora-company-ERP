import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Package, DollarSign, Tag, Truck, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Material, Category, Supplier, MaterialType } from '../../types';
import { cn } from '../../lib/utils';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (material: Material) => void;
  product?: Material | null;
  suppliers: Supplier[];
  categories: Category[];
}

export default function MaterialModal({ isOpen, onClose, onSave, product, suppliers, categories }: MaterialModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Material>>({
    name: '',
    type: 'Fabric',
    unit: 'Meters',
    costPerUnit: 0,
    category: categories[0] || 'Fabric',
    stock: 0,
    minStock: 5,
    supplier: '',
    image: ''
  });

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'Fabric',
        unit: 'Meters',
        costPerUnit: 0,
        category: categories[0] || 'Fabric',
        stock: 0,
        minStock: 5,
        supplier: '',
        image: ''
      });
    }
  }, [product, isOpen, categories]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) return;
    
    const finalMaterial: Material = {
      id: product?.id || `M${Math.floor(1000 + Math.random() * 9000)}`,
      name: formData.name!,
      description: formData.description || '',
      type: (formData.type as MaterialType) || 'Fabric',
      unit: formData.unit || 'Units',
      costPerUnit: Number(formData.costPerUnit) || 0,
      category: formData.category as Category,
      stock: (formData.type === 'Service' || formData.type === 'Support') ? 0 : (Number(formData.stock) || 0),
      minStock: (formData.type === 'Service' || formData.type === 'Support') ? 0 : (Number(formData.minStock) || 0),
      supplier: formData.supplier || '',
      image: formData.image || `https://picsum.photos/seed/${formData.name}/200`
    };
    
    onSave(finalMaterial);
    onClose();
  };

  const materialTypes: MaterialType[] = ['Fabric', 'Accessory', 'Service', 'Support'];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-[2rem] w-full max-w-3xl overflow-hidden shadow-2xl border border-white/20"
          >
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30">
                  <Package size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{product ? 'Edit Resource' : 'Add Production Resource'}</h2>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em]">Material & Infrastructure Management</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[75vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left Column: Image & Type */}
                <div className="md:col-span-5 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resource Image</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all overflow-hidden group relative shadow-inner"
                    >
                      {formData.image ? (
                        <>
                          <img src={formData.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
                            <Upload size={24} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Change Image</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-300 group-hover:text-primary transition-all group-hover:scale-110">
                            <Upload size={28} />
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Click to upload</p>
                            <p className="text-[8px] text-gray-300 mt-1">JPG, PNG or GIF</p>
                          </div>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resource Type</label>
                    <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-xl">
                      {materialTypes.map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, type })}
                          className={cn(
                            "py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                            formData.type === type 
                              ? "bg-primary text-white shadow-md"
                              : "text-gray-400 hover:text-gray-600"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Detailed Info */}
                <div className="md:col-span-7 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <Tag size={10} /> Resource Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary focus:bg-white transition-all shadow-inner"
                        placeholder="e.g. Preserved Emerald Moss"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unit of Measure</label>
                      <input
                        type="text"
                        required
                        value={formData.unit}
                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary focus:bg-white transition-all shadow-inner"
                        placeholder="Meters, Kgs, Hours..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value as Category })}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary focus:bg-white transition-all shadow-inner appearance-none"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary focus:bg-white transition-all shadow-inner min-h-[80px]"
                      placeholder="Technical specification..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <DollarSign size={10} /> Cost per Unit
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.costPerUnit}
                        onChange={e => setFormData({ ...formData, costPerUnit: Number(e.target.value) })}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary focus:bg-white transition-all shadow-inner"
                      />
                    </div>
                    {(formData.type !== 'Service' && formData.type !== 'Support') && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Initial Inventory</label>
                        <input
                          type="number"
                          value={formData.stock}
                          onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                          className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary focus:bg-white transition-all shadow-inner"
                        />
                      </div>
                    )}
                  </div>

                  {(formData.type !== 'Service' && formData.type !== 'Support') && (
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Min Stock Alert</label>
                       <input
                         type="number"
                         value={formData.minStock}
                         onChange={e => setFormData({ ...formData, minStock: Number(e.target.value) })}
                         className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary focus:bg-white transition-all shadow-inner"
                       />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <Truck size={10} /> Vendor
                        </label>
                        <select
                          value={formData.supplier}
                          onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                          className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary focus:bg-white transition-all shadow-inner appearance-none"
                        >
                          <option value="">Select Vendor</option>
                          {suppliers.map(s => (
                            <option key={s.id} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                   </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-200 hover:text-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-8 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-3"
                >
                  <Save size={18} />
                  {product ? 'Update Resource' : 'Save Resource'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
