import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Package, DollarSign, Tag, Upload, Plus, Trash2, Flower2, Calendar, UserCheck, Palette, Hash, Sparkles, BookOpen, Warehouse, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Barcode from 'react-barcode';
import { FinishedProduct, Category, Material } from '../../types';
import { DEFAULT_FALLBACK_MATERIALS, FLORA_CATEGORIES, FLORA_EVENT_TYPES } from '../../constants';
import { cn } from '../../lib/utils';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: FinishedProduct) => void;
  product?: FinishedProduct | null;
  categories: Category[];
  availableMaterials: Material[];
}

export default function ProductModal({ isOpen, onClose, onSave, product, categories, availableMaterials }: ProductModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<FinishedProduct>>({
    name: '',
    price: 0,
    costPrice: 0,
    category: (categories && categories.length > 0) ? categories[0] : FLORA_CATEGORIES[0],
    stock: 10,
    minStock: 2,
    barcode: '',
    image: '',
    flowerType: 'Roses',
    occasion: FLORA_EVENT_TYPES[0],
    color: 'Red',
    recipient: 'For Her',
    careGuide: '',
    keywords: [],
    materials: []
  });

  const [keywordsInput, setKeywordsInput] = useState<string>('');
  const [imageInputMode, setImageInputMode] = useState<'file' | 'url'>('file');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData(product);
      setKeywordsInput((product.keywords || []).join(', '));
      if (product.image && product.image.startsWith('http')) {
        setImageInputMode('url');
      }
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'Active',
        price: 0,
        costPrice: 0,
        category: categories[0] || 'Bouquets',
        stock: 10,
        minStock: 2,
        barcode: '',
        image: '',
        flowerType: 'Roses',
        occasion: 'Anniversary',
        color: 'Red',
        recipient: 'For Her',
        careGuide: 'Keep away from direct heat and water regularly.',
        keywords: ['fresh', 'roses', 'gift', 'luxury'],
        materials: []
      });
      setKeywordsInput('fresh, roses, gift, luxury');
      setImageInputMode('file');
    }
  }, [product, isOpen, categories]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData(prev => ({ ...prev, image: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getEffectiveMaterials = () => {
    return (availableMaterials && availableMaterials.length > 0) ? availableMaterials : DEFAULT_FALLBACK_MATERIALS;
  };

  const addMaterial = () => {
    const matList = getEffectiveMaterials();
    const firstMat = matList[0];
    const newBOM = [
      ...(formData.materials || []),
      { materialId: firstMat.id, quantity: 1, unit: firstMat.unit || 'Units' }
    ];
    setFormData(prev => ({ ...prev, materials: newBOM }));
  };

  const removeMaterial = (index: number) => {
    const newBOM = (formData.materials || []).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, materials: newBOM }));
  };

  const updateMaterial = (index: number, field: string, value: any) => {
    const matList = getEffectiveMaterials();
    const newBOM = [...(formData.materials || [])];
    if (field === 'materialId') {
      const selected = matList.find(m => m.id === value);
      newBOM[index] = { ...newBOM[index], materialId: value, unit: selected?.unit || 'Units' };
    } else {
      newBOM[index] = { ...newBOM[index], [field]: value };
    }
    setFormData(prev => ({ ...prev, materials: newBOM }));
  };

  // Auto-calculate cost based on materials
  useEffect(() => {
    const matList = getEffectiveMaterials();
    const currentMaterials = formData.materials || [];
    if (currentMaterials.length > 0) {
      const totalCost = currentMaterials.reduce((acc, item) => {
        const material = matList.find(m => m.id === item.materialId);
        return acc + (material?.costPerUnit || 0) * (item.quantity || 0);
      }, 0);
      setFormData(prev => ({ ...prev, costPrice: Number(totalCost.toFixed(2)) }));
    }
  }, [formData.materials, availableMaterials]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) return;
    
    // Process keywords array from comma-separated input
    const processedKeywords = keywordsInput
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const finalProduct: FinishedProduct = {
      id: product?.id || `FP${Math.floor(1000 + Math.random() * 9000)}`,
      name: formData.name!,
      description: formData.description || '',
      status: formData.status || 'Active',
      price: Number(formData.price) || 0,
      originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
      discountPercent: formData.discountPercent ? Number(formData.discountPercent) : undefined,
      costPrice: Number(formData.costPrice) || 0,
      category: formData.category as Category,
      stock: Number(formData.stock) >= 0 ? Number(formData.stock) : 0,
      minStock: Number(formData.minStock) || 0,
      barcode: formData.barcode || product?.id || `FP${Math.floor(1000 + Math.random() * 9000)}`,
      image: formData.image || '',
      size: formData.size,
      color: formData.color || 'Mixed',
      flowerType: formData.flowerType || 'Roses',
      occasion: formData.occasion || 'All Occasions',
      recipient: formData.recipient || 'For Her',
      keywords: processedKeywords,
      careGuide: formData.careGuide || '',
      materials: formData.materials || []
    };
    
    onSave(finalProduct);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="product-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
        >
          <motion.div
            key="product-modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[2rem] w-full max-w-5xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col md:flex-row my-6 max-h-[92vh]"
          >
            {/* Left Column: Image & Pricing */}
            <div className="w-full md:w-1/3 bg-slate-50/80 p-6 border-r border-slate-200/80 flex flex-col gap-6 overflow-y-auto">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-r from-sky-500 via-indigo-500 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                  <Package size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">{product ? 'Edit Product' : 'New Product'}</h2>
                  <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">Product Catalog & Storefront ERP</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <Upload size={10} /> Product Image
                    </label>

                    {/* Mode Toggle */}
                    <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[9px] font-bold text-slate-600">
                      <button
                        type="button"
                        onClick={() => setImageInputMode('file')}
                        className={cn("px-2 py-0.5 rounded-md transition-all", imageInputMode === 'file' ? "bg-white text-slate-900 shadow-2xs" : "hover:text-slate-900")}
                      >
                        File Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageInputMode('url')}
                        className={cn("px-2 py-0.5 rounded-md transition-all", imageInputMode === 'url' ? "bg-white text-slate-900 shadow-2xs" : "hover:text-slate-900")}
                      >
                        Web URL
                      </button>
                    </div>
                  </div>

                  {imageInputMode === 'file' ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={cn(
                        "aspect-square bg-white border-2 border-dashed rounded-[1.8rem] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all overflow-hidden group shadow-2xs relative",
                        isDragging ? "border-sky-500 bg-sky-50" : "border-sky-200 hover:border-sky-400 hover:bg-sky-50/40"
                      )}
                    >
                      {formData.image ? (
                        <>
                          <img src={formData.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1"
                              title="Remove image"
                            >
                              <Trash2 size={14} /> Clear Image
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <Upload size={30} className="text-sky-500 group-hover:scale-110 transition-transform mx-auto mb-2" />
                          <span className="text-xs font-bold text-slate-700 block">Drag & drop or click to upload</span>
                          <span className="text-[10px] text-slate-400 mt-1 block">JPG, PNG, WebP supported</span>
                          <span className="text-[9px] text-sky-600 font-semibold mt-2 inline-block bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                            No default image added
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="url"
                          value={formData.image || ''}
                          onChange={e => setFormData({ ...formData, image: e.target.value })}
                          placeholder="Paste image URL (https://...)"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-sky-500 bg-white"
                        />
                      </div>
                      {formData.image ? (
                        <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group">
                          <img src={formData.image} alt="URL Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-lg shadow-md hover:bg-rose-700"
                            title="Clear image URL"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">Enter a direct image link above for instant preview.</p>
                      )}
                    </div>
                  )}

                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>

                {/* Stock Level Inputs (crucial for setting 0 stock) */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                    <Warehouse size={12} className="text-indigo-600" /> ERP Inventory Stock Setup
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase">
                        Current Stock ({formData.stock === 0 ? 'Out of Stock' : 'In Stock'})
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stock !== undefined ? formData.stock : 10}
                        onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                        className={cn(
                          "w-full px-3.5 py-2 border rounded-xl text-xs font-black focus:outline-none transition-all",
                          formData.stock === 0 
                            ? "bg-rose-50 border-rose-300 text-rose-700" 
                            : "bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500"
                        )}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase">Min Stock Alert</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.minStock !== undefined ? formData.minStock : 2}
                        onChange={e => setFormData({ ...formData, minStock: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 transition-all"
                      />
                    </div>
                  </div>
                  {formData.stock === 0 && (
                    <p className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                      ⚠️ Note: Setting stock to 0 will highlight this item as Out of Stock in storefront catalog.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pricing Strategy & Offers</label>
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-500 uppercase tracking-tight">Est. Production Cost</span>
                      <span className="font-black text-indigo-700">${(formData.costPrice || 0).toFixed(2)}</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <DollarSign size={10} /> Regular Retail Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.originalPrice || formData.price || 0}
                        onChange={e => {
                          const orig = Number(e.target.value);
                          const pct = formData.discountPercent || 0;
                          const newSelling = pct > 0 ? Math.round(orig * (1 - pct / 100)) : orig;
                          setFormData({ ...formData, originalPrice: orig, price: newSelling });
                        }}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 transition-all"
                      />
                    </div>

                    {/* Admin Discount Offer Selector */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-purple-700 uppercase tracking-widest flex items-center gap-1">
                          <Tag size={10} /> Storefront Offer Discount (%)
                        </label>
                        {formData.discountPercent ? (
                          <span className="text-[10px] font-extrabold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md">
                            {formData.discountPercent}% OFF
                          </span>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-5 gap-1">
                        {[0, 10, 20, 30, 50].map(pct => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => {
                              const basePrice = formData.originalPrice || formData.price || 0;
                              if (pct === 0) {
                                setFormData({
                                  ...formData,
                                  discountPercent: 0,
                                  price: basePrice,
                                  originalPrice: undefined
                                });
                              } else {
                                const reduced = Math.round(basePrice * (1 - pct / 100));
                                setFormData({
                                  ...formData,
                                  originalPrice: basePrice,
                                  discountPercent: pct,
                                  price: reduced
                                });
                              }
                            }}
                            className={cn(
                              "py-1.5 text-[10px] font-black rounded-lg border transition-all",
                              (formData.discountPercent || 0) === pct
                                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-xs"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            )}
                          >
                            {pct === 0 ? 'None' : `${pct}%`}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-1 pt-1">
                        <label className="text-[9px] font-extrabold text-pink-700 uppercase tracking-wider block">
                          Final Customer Price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={e => {
                            const newSelling = Number(e.target.value);
                            const orig = formData.originalPrice || newSelling;
                            const pct = orig > newSelling ? Math.round(((orig - newSelling) / orig) * 100) : 0;
                            setFormData({
                              ...formData,
                              price: newSelling,
                              originalPrice: orig > newSelling ? orig : undefined,
                              discountPercent: pct
                            });
                          }}
                          className="w-full px-4 py-2 bg-pink-50/60 border border-pink-300 rounded-xl text-xs font-black text-pink-900 focus:outline-none focus:border-pink-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Form Sections & Filtering Keywords */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col max-h-[92vh]">
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 no-scrollbar">
                
                {/* Basic Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                      <Tag size={11} className="text-sky-600" /> Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 transition-all"
                      placeholder="e.g. Royal Red Velvet Rose Bouquet"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                      <Package size={11} className="text-indigo-600" /> Primary Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value as Category })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 transition-all appearance-none"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Barcode & Scanning Code Section */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                      <QrCode size={13} className="text-sky-600" /> Barcode / SKU Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, barcode: `FLR-${Math.floor(100000 + Math.random() * 900000)}` })}
                      className="text-[10px] font-black text-sky-600 hover:underline flex items-center gap-1"
                    >
                      <Sparkles size={11} /> Auto-Generate Barcode
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={formData.barcode || ''}
                      onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                      className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500"
                      placeholder="e.g. FLR-839210"
                    />
                    {formData.barcode && (
                      <div className="bg-white p-1 rounded-lg border border-slate-200 shrink-0">
                        <Barcode value={formData.barcode} width={1} height={25} fontSize={9} />
                      </div>
                    )}
                  </div>
                </div>

                {/* STOREFRONT FILTER KEYWORDS SECTION */}
                <div className="p-5 bg-gradient-to-r from-sky-50/70 via-indigo-50/50 to-pink-50/70 rounded-2xl border border-sky-100 space-y-4">
                  <div className="flex items-center gap-2 border-b border-sky-200/60 pb-2">
                    <Sparkles size={16} className="text-pink-600" />
                    <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Storefront Search & Filtering Attributes</h3>
                      <p className="text-[10px] text-slate-500 font-extrabold">These filtering keywords allow customers to search and filter this product in the store front</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Flower / Specimen Type */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                        <Flower2 size={10} className="text-pink-600" /> Flower / Plant Type
                      </label>
                      <select
                        value={formData.flowerType || 'Roses'}
                        onChange={e => setFormData({ ...formData, flowerType: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-sky-500 transition-all"
                      >
                        <option value="Roses">Roses</option>
                        <option value="Orchids">Orchids</option>
                        <option value="Hydrangeas">Hydrangeas</option>
                        <option value="Tulips">Tulips</option>
                        <option value="Lilies">Lilies</option>
                        <option value="Preserved Flora">Preserved Flora</option>
                        <option value="Live Plants">Live Plants</option>
                        <option value="Succulents">Succulents</option>
                        <option value="Mixed">Mixed Bouquet</option>
                      </select>
                    </div>

                    {/* Occasion / Event Type */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                        <Calendar size={10} className="text-indigo-600" /> Event Type / Occasion
                      </label>
                      <select
                        value={formData.occasion || FLORA_EVENT_TYPES[0]}
                        onChange={e => setFormData({ ...formData, occasion: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-sky-500 transition-all"
                      >
                        {FLORA_EVENT_TYPES.map(ev => (
                          <option key={ev} value={ev}>{ev}</option>
                        ))}
                      </select>
                    </div>

                    {/* Color Palette */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                        <Palette size={10} className="text-sky-600" /> Color Palette
                      </label>
                      <select
                        value={formData.color || 'Red'}
                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-sky-500 transition-all"
                      >
                        <option value="Red">Red</option>
                        <option value="Pink">Pink</option>
                        <option value="White">White</option>
                        <option value="Blue">Blue</option>
                        <option value="Yellow">Yellow</option>
                        <option value="Purple">Purple</option>
                        <option value="Green">Green</option>
                        <option value="Mixed">Mixed</option>
                      </select>
                    </div>

                    {/* Recipient */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                        <UserCheck size={10} className="text-emerald-600" /> Recipient
                      </label>
                      <select
                        value={formData.recipient || 'For Her'}
                        onChange={e => setFormData({ ...formData, recipient: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-sky-500 transition-all"
                      >
                        <option value="For Her">For Her</option>
                        <option value="For Him">For Him</option>
                        <option value="Corporate Gifts">Corporate Gifts</option>
                        <option value="Family">Family</option>
                        <option value="Friends">Friends</option>
                      </select>
                    </div>
                  </div>

                  {/* Search Keywords Tag Input */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                      <Hash size={11} className="text-pink-600" /> Search Bar & Filter Tag Keywords (Comma Separated)
                    </label>
                    <input
                      type="text"
                      value={keywordsInput}
                      onChange={e => setKeywordsInput(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-sky-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 transition-all"
                      placeholder="e.g. fresh, luxury, romantic, red roses, bouquet, gift"
                    />
                    <p className="text-[9px] text-slate-500 font-extrabold">
                      Example: <span className="text-slate-700 italic">fresh, acoustic, moss, vertical, corporate, luxury</span>
                    </p>
                  </div>
                </div>

                {/* Description & Care Guide */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Product Description</label>
                    <textarea
                      rows={3}
                      value={formData.description || ''}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 transition-all"
                      placeholder="Enter compelling storefront product description..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                      <BookOpen size={10} className="text-emerald-600" /> Plant / Floral Care Guide
                    </label>
                    <textarea
                      rows={3}
                      value={formData.careGuide || ''}
                      onChange={e => setFormData({ ...formData, careGuide: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 transition-all"
                      placeholder="e.g. Trim stems at 45° angle, place in fresh cool water, avoid direct sunlight..."
                    />
                  </div>
                </div>

                {/* BOM Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Bill of Materials (BOM & Raw Material Breakdown)</label>
                    <button
                      type="button"
                      onClick={addMaterial}
                      className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                    >
                      <Plus size={14} /> Add Material Component
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {formData.materials?.map((bomItem, index) => {
                      const matList = getEffectiveMaterials();
                      const material = matList.find(m => m.id === bomItem.materialId);
                      return (
                        <div key={index} className="flex gap-2 items-end p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex-1 space-y-1">
                            <label className="text-[8px] font-black text-slate-500 uppercase">Material Resource</label>
                            <select
                              value={bomItem.materialId}
                              onChange={e => updateMaterial(index, 'materialId', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500 transition-all cursor-pointer"
                            >
                              {matList.map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.type}) — ${m.costPerUnit.toFixed(2)}/{m.unit}</option>
                              ))}
                            </select>
                          </div>
                          <div className="w-24 space-y-1">
                            <label className="text-[8px] font-black text-slate-500 uppercase">Qty ({bomItem.unit || material?.unit || 'Units'})</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={bomItem.quantity}
                              onChange={e => updateMaterial(index, 'quantity', Math.max(0, Number(e.target.value)))}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 text-center focus:outline-none focus:border-sky-500"
                            />
                          </div>
                          <div className="w-24 space-y-1">
                            <label className="text-[8px] font-black text-slate-500 uppercase text-center block">Subtotal</label>
                            <div className="h-[34px] flex items-center justify-center text-xs font-black text-slate-800 bg-white border border-slate-200 rounded-lg">
                              ${((material?.costPerUnit || 0) * (bomItem.quantity || 0)).toFixed(2)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMaterial(index)}
                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Remove material component"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                    {(!formData.materials || formData.materials.length === 0) && (
                      <div className="p-4 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase italic">No assembly materials assigned yet. Click "Add Material Component" above to build the BOM.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-slate-200 flex gap-4 bg-slate-50/80 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-white border border-slate-300 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-600 via-indigo-600 to-pink-600 hover:from-sky-700 hover:to-pink-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  {product ? 'Update Master Record' : 'Create Product Entry'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

