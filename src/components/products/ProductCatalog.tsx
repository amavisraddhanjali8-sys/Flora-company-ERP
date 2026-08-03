import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, Package, Filter, MoreHorizontal, Edit, 
  Trash2, AlertCircle, TrendingUp, TrendingDown,
  Layers, Hammer, ChevronRight, Eye, ShoppingCart, X, Factory, ArrowUpDown, RefreshCcw, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FinishedProduct, Category, Material, Supplier, Transaction } from '../../types';
import { FLORA_CATEGORIES, FLORA_EVENT_TYPES } from '../../constants';
import { cn } from '../../lib/utils';
import { translations, Language } from '../../i18n';
import ProductModal from './ProductModal';
import FinalProductOrderModal from './FinalProductOrderModal';

interface ProductCatalogProps {
  products: FinishedProduct[];
  materials: Material[];
  suppliers?: Supplier[];
  onAddProduct: (product: FinishedProduct) => void;
  onUpdateProduct: (product: FinishedProduct) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateProducts?: (products: FinishedProduct[]) => void;
  onUpdateMaterials?: (materials: Material[]) => void;
  onUpdateTransactions?: (transaction: Transaction) => void;
  onAddAuditLog?: (action: string, details: string, category: any, type?: any) => void;
  onQuickCreateRfq?: (itemData: { type: 'Material' | 'Product'; id: string; name: string; quantity: number; unit: string; supplier?: string; specs?: string; items?: any[] }) => void;
  language: Language;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function ProductCatalog({ 
  products, 
  materials,
  suppliers = [],
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  onUpdateProducts,
  onUpdateMaterials,
  onUpdateTransactions,
  onAddAuditLog,
  onQuickCreateRfq,
  language,
  searchQuery,
  setSearchQuery
}: ProductCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [eventFilter, setEventFilter] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [priceRangeFilter, setPriceRangeFilter] = useState<'all' | 'under_50' | '50_150' | '150_300' | 'over_300'>('all');
  const [marginFilter, setMarginFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'margin_desc'>('name_asc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [productToOrder, setProductToOrder] = useState<FinishedProduct | null>(null);
  const [editingProduct, setEditingProduct] = useState<FinishedProduct | null>(null);
  const [viewingBOM, setViewingBOM] = useState<string | null>(null);

  const categories: Category[] = FLORA_CATEGORIES;

  // Helper to compute profit margin percentage
  const getMargin = (p: FinishedProduct) => {
    if (!p.price || p.price === 0) return 0;
    return (((p.price - (p.costPrice || 0)) / p.price) * 100);
  };

  // Advanced Filtering & Multi-field Search
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Search across name, SKU id, category, BOM material names, description, keywords
      const searchLower = searchQuery.toLowerCase().trim();
      const bomMaterialNames = (p.materials || []).map(b => {
        const mat = materials.find(m => m.id === b.materialId);
        return mat ? mat.name.toLowerCase() : '';
      }).join(' ');

      const matchesSearch = !searchLower || 
        p.name.toLowerCase().includes(searchLower) ||
        p.id.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower)) ||
        (p.occasion && p.occasion.toLowerCase().includes(searchLower)) ||
        (p.flowerType && p.flowerType.toLowerCase().includes(searchLower)) ||
        bomMaterialNames.includes(searchLower);

      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;

      // Event Type / Occasion filter
      let matchesEvent = true;
      if (eventFilter !== 'All') {
        const evLower = eventFilter.toLowerCase();
        matchesEvent = (p.occasion && p.occasion.toLowerCase().includes(evLower)) ||
          (p.keywords && p.keywords.some(k => k.toLowerCase().includes(evLower))) ||
          (p.description && p.description.toLowerCase().includes(evLower)) ||
          (p.name && p.name.toLowerCase().includes(evLower));
      }

      // Stock filter
      let matchesStock = true;
      if (stockFilter === 'in_stock') matchesStock = p.stock > p.minStock;
      else if (stockFilter === 'low_stock') matchesStock = p.stock > 0 && p.stock <= p.minStock;
      else if (stockFilter === 'out_of_stock') matchesStock = p.stock === 0;

      // Price range filter
      let matchesPrice = true;
      const price = p.price || 0;
      if (priceRangeFilter === 'under_50') matchesPrice = price < 50;
      else if (priceRangeFilter === '50_150') matchesPrice = price >= 50 && price <= 150;
      else if (priceRangeFilter === '150_300') matchesPrice = price > 150 && price <= 300;
      else if (priceRangeFilter === 'over_300') matchesPrice = price > 300;

      // Margin filter
      let matchesMargin = true;
      const margin = getMargin(p);
      if (marginFilter === 'high') matchesMargin = margin >= 40;
      else if (marginFilter === 'medium') matchesMargin = margin >= 20 && margin < 40;
      else if (marginFilter === 'low') matchesMargin = margin < 20;

      return matchesSearch && matchesCategory && matchesEvent && matchesStock && matchesPrice && matchesMargin;
    }).sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'stock_asc') return a.stock - b.stock;
      if (sortBy === 'stock_desc') return b.stock - a.stock;
      if (sortBy === 'margin_desc') return getMargin(b) - getMargin(a);
      return 0;
    });
  }, [products, materials, searchQuery, selectedCategory, eventFilter, stockFilter, priceRangeFilter, marginFilter, sortBy]);

  const stats = {
    total: products.length,
    lowStock: products.filter(p => p.stock <= p.minStock).length,
    totalValue: products.reduce((acc, p) => acc + (p.price * p.stock), 0),
    avgMargin: products.length > 0 
      ? products.reduce((acc, p) => acc + getMargin(p), 0) / products.length 
      : 0
  };

  const activeFiltersCount = (selectedCategory !== 'All' ? 1 : 0) + 
    (eventFilter !== 'All' ? 1 : 0) +
    (stockFilter !== 'all' ? 1 : 0) + 
    (priceRangeFilter !== 'all' ? 1 : 0) + 
    (marginFilter !== 'all' ? 1 : 0) + 
    (searchQuery.trim() !== '' ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setEventFilter('All');
    setStockFilter('all');
    setPriceRangeFilter('all');
    setMarginFilter('all');
    setSearchQuery('');
    setSortBy('name_asc');
  };

  const handleEdit = (product: FinishedProduct) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product from the catalog?')) {
      onDeleteProduct(id);
    }
  };

  const handleOpenOrderModal = (product?: FinishedProduct) => {
    setProductToOrder(product || products[0] || null);
    setIsOrderModalOpen(true);
  };

  return (
    <div className="flex-1 bg-gray-50 p-4 lg:p-6 overflow-y-auto min-h-0">
      <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-700 pb-12">
        {/* Header & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary/30 ring-2 ring-primary/10">
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Product Portal & Catalog</h1>
              <p className="text-[10px] text-gray-500 font-bold flex items-center gap-2">
                Master finished goods database <ChevronRight size={10} className="text-primary" /> Production & Direct Procurement Ready
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Order Final Product Action Button */}
            <button
              onClick={() => handleOpenOrderModal()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
            >
              <Factory size={16} /> Order Final Product
            </button>

            <button
              onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
              className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-[11px] hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} /> Add Product
            </button>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Layers size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Catalog Size</p>
              <h3 className="text-lg font-black text-gray-900">{stats.total} items</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                stats.lowStock > 0 ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500"
              )}>
                <AlertCircle size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Low Stock Alerts</p>
                <h3 className="text-lg font-black text-gray-900">{stats.lowStock} items</h3>
              </div>
            </div>
            {stats.lowStock > 0 && onQuickCreateRfq && (
              <button
                onClick={() => {
                  const shortageProds = products
                    .filter(p => p.stock <= p.minStock)
                    .map(p => ({
                      materialId: p.id,
                      name: p.name,
                      quantity: Math.max(1, (p.minStock * 2) - p.stock),
                      unit: 'pcs',
                      specs: `Product deficit replenishment (SKU: ${p.id}, Stock: ${p.stock}, Min: ${p.minStock})`
                    }));
                  if (shortageProds.length > 0) {
                    onQuickCreateRfq({
                      type: 'Product',
                      id: shortageProds[0].materialId,
                      name: shortageProds[0].name,
                      quantity: shortageProds[0].quantity,
                      unit: 'pcs',
                      items: shortageProds
                    });
                  }
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer shrink-0"
              >
                <ShoppingCart size={11} />
                Quick RFQ ({stats.lowStock})
              </button>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Inventory Value</p>
              <h3 className="text-lg font-black text-gray-900">${stats.totalValue.toLocaleString()}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Avg. Profit Margin</p>
              <h3 className="text-lg font-black text-gray-900">{(stats.avgMargin || 0).toFixed(1)}%</h3>
            </div>
          </div>
        </div>

        {/* ENHANCED SEARCH BAR AND FILTERING FACILITIES */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
          {/* Main Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by Name, SKU, Category, BOM Materials, or Description..."
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Options Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
            {/* Category Select */}
            <div>
              <label className="text-[9px] font-extrabold text-gray-400 uppercase block mb-1">Primary Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
              >
                <option value="All">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Event Type / Occasion Select */}
            <div>
              <label className="text-[9px] font-extrabold text-gray-400 uppercase block mb-1">Event Type / Occasion</label>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-indigo-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Event Types</option>
                {FLORA_EVENT_TYPES.map(ev => (
                  <option key={ev} value={ev}>{ev}</option>
                ))}
              </select>
            </div>

            {/* Stock Status Select */}
            <div>
              <label className="text-[9px] font-extrabold text-gray-400 uppercase block mb-1">Stock Level</label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
              >
                <option value="all">All Stock Statuses</option>
                <option value="in_stock">In Stock (&gt; Min)</option>
                <option value="low_stock">Low Stock (≤ Min)</option>
                <option value="out_of_stock">Out of Stock (0)</option>
              </select>
            </div>

            {/* Price Range Select */}
            <div>
              <label className="text-[9px] font-extrabold text-gray-400 uppercase block mb-1">Price Range</label>
              <select
                value={priceRangeFilter}
                onChange={(e) => setPriceRangeFilter(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
              >
                <option value="all">All Prices</option>
                <option value="under_50">Under $50</option>
                <option value="50_150">$50 - $150</option>
                <option value="150_300">$150 - $300</option>
                <option value="over_300">Over $300</option>
              </select>
            </div>

            {/* Profit Margin Select */}
            <div>
              <label className="text-[9px] font-extrabold text-gray-400 uppercase block mb-1">Profit Margin</label>
              <select
                value={marginFilter}
                onChange={(e) => setMarginFilter(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
              >
                <option value="all">All Margins</option>
                <option value="high">High (&ge; 40%)</option>
                <option value="medium">Medium (20% - 40%)</option>
                <option value="low">Low (&lt; 20%)</option>
              </select>
            </div>

            {/* Sort By Select */}
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[9px] font-extrabold text-gray-400 uppercase block mb-1 flex items-center gap-1">
                <ArrowUpDown size={10} /> Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
              >
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="price_asc">Price (Low to High)</option>
                <option value="price_desc">Price (High to Low)</option>
                <option value="stock_asc">Stock (Low to High)</option>
                <option value="stock_desc">Stock (High to Low)</option>
                <option value="margin_desc">Margin (Highest First)</option>
              </select>
            </div>
          </div>

          {/* Filter Status Bar & Active Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-[11px]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-500">
                Showing <span className="font-black text-gray-900">{filteredProducts.length}</span> of {products.length} products
              </span>

              {/* Active Filter Chips */}
              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md font-bold text-[10px]">
                  Category: {selectedCategory}
                  <button onClick={() => setSelectedCategory('All')} className="hover:text-red-500"><X size={12} /></button>
                </span>
              )}
              {stockFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-md font-bold text-[10px]">
                  Stock: {stockFilter.replace('_', ' ')}
                  <button onClick={() => setStockFilter('all')} className="hover:text-red-500"><X size={12} /></button>
                </span>
              )}
              {priceRangeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-bold text-[10px]">
                  Price: {priceRangeFilter.replace('_', ' ')}
                  <button onClick={() => setPriceRangeFilter('all')} className="hover:text-red-500"><X size={12} /></button>
                </span>
              )}
              {marginFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-bold text-[10px]">
                  Margin: {marginFilter}
                  <button onClick={() => setMarginFilter('all')} className="hover:text-red-500"><X size={12} /></button>
                </span>
              )}
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer hover:underline"
              >
                <RefreshCcw size={12} /> Clear All Filters ({activeFiltersCount})
              </button>
            )}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto w-full max-w-full">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 w-16">Preview</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400">Details</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400">Production</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 text-center">Stock</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 text-right">Pricing</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl mx-auto flex items-center justify-center">
                        <Package size={24} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-gray-900">No Catalog Finished Goods Found</p>
                        <p className="text-xs text-gray-500">
                          {activeFiltersCount > 0 
                            ? 'No products match your current search or category filters.' 
                            : 'No finished products in your catalog yet. Click below to create your first item.'}
                        </p>
                      </div>
                      <div className="pt-1 flex items-center justify-center gap-2">
                        {activeFiltersCount > 0 && (
                          <button
                            onClick={clearAllFilters}
                            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                          >
                            Reset Filters
                          </button>
                        )}
                        <button
                          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
                          className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all"
                        >
                          Add Product
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.map((p) => {
                  const margin = getMargin(p);

                  return (
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-3">
                          <div className="w-10 h-10 bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm p-0.5">
                            <img 
                              src={p.image || `https://picsum.photos/seed/${p.name}/100`} 
                              alt={p.name} 
                              className="w-full h-full object-cover rounded-md"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </td>

                        <td className="px-6 py-3">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-black text-gray-900 group-hover:text-primary transition-colors">{p.name}</span>
                              <span className={cn(
                                "px-2 py-0.5 text-[8px] font-bold rounded-md",
                                p.status === 'Active' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                              )}>
                                {p.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded-md">SKU: {p.id}</span>
                              <span className="text-[9px] font-bold text-gray-400">{p.category}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <Hammer size={10} className="text-gray-400" />
                              <span className="text-[10px] font-bold text-gray-600">
                                {p.materials.length} Raw Materials
                              </span>
                            </div>
                            <button 
                              onClick={() => setViewingBOM(viewingBOM === p.id ? null : p.id)}
                              className="text-[9px] font-bold text-primary hover:underline flex items-center gap-1"
                            >
                              <Eye size={10} /> {viewingBOM === p.id ? 'Hide BOM' : 'View BOM'}
                            </button>
                          </div>
                        </td>

                        <td className="px-6 py-3">
                          <div className="text-center">
                            <div className={cn(
                              "inline-flex flex-col items-center p-1.5 rounded-xl min-w-[50px]",
                              p.stock <= p.minStock ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                            )}>
                              <span className="text-xs font-black">{p.stock}</span>
                              <span className="text-[8px] font-bold opacity-70">Units</span>
                            </div>
                            {p.stock <= p.minStock && (
                              <p className="text-[8px] font-bold text-red-500 mt-0.5">Low Stock Alert</p>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-3 text-right">
                          <div className="space-y-0.5">
                            <div className="text-xs font-black text-gray-900 flex items-center justify-end gap-1">
                              {p.originalPrice && p.originalPrice > p.price && (
                                <span className="text-[10px] text-gray-400 line-through font-bold">${p.originalPrice.toFixed(2)}</span>
                              )}
                              <span className={p.originalPrice && p.originalPrice > p.price ? "text-emerald-700 font-extrabold" : ""}>
                                ${(p.price || 0).toFixed(2)}
                              </span>
                            </div>
                            {p.discountPercent && p.discountPercent > 0 ? (
                              <div className="text-[9px] font-extrabold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md inline-block">
                                🔥 {p.discountPercent}% OFF OFFER
                              </div>
                            ) : null}
                            <div className="text-[9px] font-bold text-gray-400">
                              Cost: <span className="text-red-400">${(p.costPrice || 0).toFixed(2)}</span>
                            </div>
                            <div className={cn(
                              "text-[9px] font-bold",
                              margin >= 40 ? "text-emerald-600" : margin >= 20 ? "text-amber-600" : "text-rose-500"
                            )}>
                              Margin: {margin.toFixed(1)}%
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Offer Discount Button */}
                            <button
                              onClick={() => {
                                const inputPct = prompt(`Offer Admin Discount for ${p.name}\nEnter discount percentage (e.g. 10, 20, 25, 50) or 0 to remove discount:`, p.discountPercent ? String(p.discountPercent) : '20');
                                if (inputPct !== null) {
                                  const pct = Math.min(90, Math.max(0, Number(inputPct) || 0));
                                  const orig = p.originalPrice || p.price;
                                  if (pct === 0) {
                                    onUpdateProduct({
                                      ...p,
                                      price: orig,
                                      originalPrice: undefined,
                                      discountPercent: undefined
                                    });
                                    if (onAddAuditLog) onAddAuditLog('Discount Removed', `Removed promotional discount from ${p.name}`, 'products', 'info');
                                  } else {
                                    const reduced = Math.round(orig * (1 - pct / 100));
                                    onUpdateProduct({
                                      ...p,
                                      originalPrice: orig,
                                      price: reduced,
                                      discountPercent: pct
                                    });
                                    if (onAddAuditLog) onAddAuditLog('Promotional Discount Offered', `Admin offered ${pct}% discount on ${p.name}. Reduced price is $${reduced}`, 'products', 'info');
                                  }
                                }
                              }}
                              className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-extrabold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Offer promotional discount on storefront"
                            >
                              <Tag size={11} /> Offer Discount
                            </button>

                            {/* Order Product Action Button (Production vs Direct Procurement) */}
                            <button
                              onClick={() => handleOpenOrderModal(p)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-extrabold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Order product via Production or Direct Sourcing"
                            >
                              <Factory size={11} /> Order Product
                            </button>

                            <button 
                              onClick={() => handleEdit(p)}
                              className="p-1.5 text-primary hover:bg-primary/10 rounded-xl transition-all cursor-pointer"
                              title="Edit product details"
                            >
                              <Edit size={15} />
                            </button>
                            <button 
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* BOM Drawer */}
                      {viewingBOM === p.id && (
                        <tr className="bg-indigo-50/20 border-l-4 border-l-indigo-600">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="bg-white rounded-xl border border-indigo-100 p-4 shadow-xs">
                              <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                                <h4 className="text-[10px] font-black uppercase text-gray-900 tracking-wider flex items-center gap-2">
                                  <Hammer size={12} className="text-indigo-600" />
                                  Bill of Materials (BOM Breakdown for 1 Unit)
                                </h4>
                                <span className="text-[9px] font-bold text-gray-400 italic">Required for 1 unit assembly</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {p.materials.map((mItem, idx) => {
                                  const material = materials.find(m => m.id === mItem.materialId);
                                  return (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-white rounded border border-gray-100 flex items-center justify-center text-[8px] font-black text-indigo-600">
                                          {material?.category?.[0] || 'M'}
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-bold text-gray-900">{material?.name || mItem.materialId}</p>
                                          <p className="text-[8px] text-gray-400 font-bold uppercase">{material?.type || 'Material'}</p>
                                        </div>
                                      </div>
                                      <span className="text-[10px] font-black text-gray-700">{mItem.quantity} {material?.unit || 'pc'}</span>
                                    </div>
                                  );
                                })}
                                {p.materials.length === 0 && (
                                  <p className="text-[10px] text-gray-400 italic col-span-full">No production materials linked to this product.</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
        </div>
      </div>

      {/* Edit/Add Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(data) => {
          if (editingProduct) {
            onUpdateProduct(data);
          } else {
            onAddProduct(data);
          }
        }}
        product={editingProduct}
        categories={categories}
        availableMaterials={materials}
      />

      {/* Order Final Product Modal (Production Cost vs Direct Supplier Order) */}
      <FinalProductOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        product={productToOrder}
        products={products}
        materials={materials}
        suppliers={suppliers}
        onUpdateProducts={onUpdateProducts || (() => {})}
        onUpdateMaterials={onUpdateMaterials || (() => {})}
        onQuickCreateRfq={onQuickCreateRfq}
        onUpdateTransactions={onUpdateTransactions}
        onAddAuditLog={onAddAuditLog}
      />
    </div>
  );
}
