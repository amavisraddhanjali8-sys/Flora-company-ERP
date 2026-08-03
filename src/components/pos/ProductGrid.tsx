import React, { useState } from 'react';
import { Search, Filter, Plus, LayoutGrid, List, PackagePlus, Edit2, Trash2 } from 'lucide-react';
import { Category, FinishedProduct, Supplier, Material } from '../../types';
import { FLORA_EVENT_TYPES } from '../../constants';
import { cn, formatCurrency } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ProductModal from '../products/ProductModal';
import ConfirmModal from '../layout/ConfirmModal';
import { translations, Language } from '../../i18n';

interface ProductGridProps {
  products: FinishedProduct[];
  onAddToCart: (product: FinishedProduct) => void;
  onUpdateProducts: (products: FinishedProduct[]) => void;
  materials: Material[];
  suppliers: Supplier[];
  language: Language;
  categories: Category[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function ProductGrid({ 
  products, 
  onAddToCart, 
  onUpdateProducts, 
  materials,
  suppliers, 
  language, 
  categories,
  searchQuery,
  setSearchQuery
}: ProductGridProps) {
  const t = translations[language];
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [selectedEvent, setSelectedEvent] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<FinishedProduct | null>(null);

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    
    let matchesEvent = true;
    if (selectedEvent !== 'All') {
      const evLower = selectedEvent.toLowerCase();
      matchesEvent = (p.occasion && p.occasion.toLowerCase().includes(evLower)) ||
        (p.keywords && p.keywords.some(k => k.toLowerCase().includes(evLower))) ||
        (p.description && p.description.toLowerCase().includes(evLower));
    }

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(searchLower) || 
      p.id.toLowerCase().includes(searchLower) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchLower));
    
    return matchesCategory && matchesEvent && matchesSearch;
  });

  const handleSaveProduct = (product: FinishedProduct) => {
    if (editingProduct) {
      onUpdateProducts(products.map(p => p.id === product.id ? product : p));
    } else {
      onUpdateProducts([...products, product]);
    }
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    setProductToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      onUpdateProducts(products.filter(p => p.id !== productToDelete));
      setProductToDelete(null);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: FinishedProduct) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
      {/* Header */}
      <div className="p-4 space-y-4 bg-white border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900">Finished Goods</h1>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={t.search}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === 'grid' ? "bg-white shadow-sm text-primary" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === 'list' ? "bg-white shadow-sm text-primary" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <List size={16} />
              </button>
            </div>
            <button 
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
            >
              <PackagePlus size={16} />
              {t.save}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 flex-1">
            {['All', ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                  activeCategory === cat
                    ? "bg-primary text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {t[cat.toLowerCase() as keyof typeof t] || cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Event Filter:</span>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
            >
              <option value="All">All Event Types</option>
              {FLORA_EVENT_TYPES.map(ev => (
                <option key={ev} value={ev}>{ev}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid/List View */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 max-w-md mx-auto my-8 space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl mx-auto flex items-center justify-center">
              <PackagePlus size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">No Goods Found</h3>
              <p className="text-xs text-gray-500">
                {searchQuery || activeCategory !== 'All' 
                  ? 'No products match your active search or category filter.' 
                  : 'Your product catalog is currently empty. Click below to add your first product.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {(searchQuery || activeCategory !== 'All') && (
                <button
                  onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={openAddModal}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <PackagePlus size={16} />
                <span>Add Product</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={product.id}
                  className="group bg-white rounded-2xl border border-gray-200 hover:border-primary hover:shadow-xl hover:shadow-primary/10 transition-all text-left flex flex-col h-full relative overflow-hidden"
                >
                  <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEditModal(product); }}
                      className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-xl text-gray-400 hover:text-primary transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }}
                      className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-xl text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <button 
                    onClick={() => onAddToCart(product)}
                    className="w-full text-left flex flex-col h-full p-2 focus:outline-none"
                  >
                    <div className="aspect-square rounded-xl bg-gray-50 mb-3 overflow-hidden relative w-full">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary/40 font-bold text-2xl bg-primary/5">
                          {product.name[0]}
                        </div>
                      )}
                      {product.isService && (
                        <span className="absolute bottom-2 right-2 bg-blue-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                          {t.service}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                    </div>
                    <div className="flex-1 px-1">
                      <h3 className="font-bold text-gray-900 text-xs line-clamp-2 mb-1 group-hover:text-primary transition-colors leading-tight">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[10px] text-gray-400 font-medium">{product.category}</span>
                        <span className="w-1 h-1 bg-gray-200 rounded-full" />
                        <span className={cn(
                          "text-[10px] font-bold",
                          (product.isService || product.stock > product.minStock) ? "text-green-500" : "text-red-500"
                        )}>
                          {product.isService ? t.unlimited : product.stock <= product.minStock ? `${t.lowStock}: ${product.stock}` : `${product.stock} ${t.inStock}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50 px-1">
                      <span className="font-black text-primary text-sm">{formatCurrency(product.price)}</span>
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all group-active:scale-90 shadow-sm">
                        <Plus size={16} />
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">{t.product}</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">{t.category}</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">{t.price}</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">{t.stock}</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden">
                          <img src={product.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{product.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{product.category}</td>
                    <td className="px-4 py-3 text-xs font-bold text-primary">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        (product.isService || product.stock > product.minStock) ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                      )}>
                        {product.isService ? t.unlimited : product.stock} {product.stock <= product.minStock && !product.isService && `(${t.low})`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => onAddToCart(product)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                        <button 
                          onClick={() => openEditModal(product)}
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
        categories={categories.filter(c => c !== 'All')}
        availableMaterials={materials}
      />

      <ConfirmModal 
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        type="danger"
        language={language}
      />
    </div>
  );
}
