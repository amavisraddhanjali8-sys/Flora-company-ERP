import React, { useState, useRef } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCcw,
  Edit2,
  Trash2,
  History,
  Filter,
  X,
  Barcode as BarcodeIcon,
  Download,
  ShoppingCart
} from 'lucide-react';
import { Material, InventoryMovement, Category, Supplier, Transaction } from '../../types';
import { MATERIALS, MOCK_INVENTORY_MOVEMENTS } from '../../constants';
import { cn, formatCurrency } from '../../lib/utils';
import MaterialModal from './MaterialModal'; // Replaced ProductModal with MaterialModal
import StockPurchaseModal from './StockPurchaseModal';
import Barcode from 'react-barcode';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { handleHtml2CanvasClone } from '../../lib/pdf-utils';
import { useNotifications } from '../../context/NotificationContext';
import { translations, Language } from '../../i18n';
import ConfirmModal from '../layout/ConfirmModal';

const DEFAULT_CATEGORIES: Category[] = ['Fabric', 'Accessories', 'Services', 'Support', 'Packaging'];

interface MaterialManagementProps {
  materials: Material[];
  onUpdateMaterials: (materials: Material[]) => void;
  onNavigateToProcurement?: () => void;
  onQuickCreateRfq?: (itemData: { type: 'Material' | 'Product'; id: string; name: string; quantity: number; unit: string; supplier?: string; specs?: string; items?: any[] }) => void;
  onUpdateTransactions: (transaction: Transaction) => void;
  suppliers: Supplier[];
  onAddAuditLog?: (action: string, details: string, category: any, type?: any) => void;
  categories: Category[];
  onUpdateCategories: (categories: Category[]) => void;
  language: Language;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function MaterialManagement({ 
  materials, 
  onUpdateMaterials, 
  onNavigateToProcurement,
  onQuickCreateRfq,
  onUpdateTransactions, 
  suppliers, 
  onAddAuditLog,
  categories,
  onUpdateCategories,
  language,
  searchQuery,
  setSearchQuery
}: MaterialManagementProps) {
  const { addNotification } = useNotifications();
  const t = translations[language];
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<string | null>(null);
  const [movementToDelete, setMovementToDelete] = useState<string | null>(null);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [movements, setMovements] = useState<InventoryMovement[]>(MOCK_INVENTORY_MOVEMENTS);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'in_stock'>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [costRangeFilter, setCostRangeFilter] = useState<'all' | 'under_10' | '10_50' | '50_100' | 'over_100'>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'cost_asc' | 'cost_desc' | 'stock_asc' | 'stock_desc' | 'supplier_asc'>('name_asc');

  const [view, setView] = useState<'stock' | 'history'>('stock');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [selectedBarcodeMaterial, setSelectedBarcodeMaterial] = useState<Material | null>(null);
  const barcodeRef = useRef<HTMLDivElement>(null);

  const filteredMaterials = (materials || []).filter(m => {
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch = !searchLower ||
                         m.name.toLowerCase().includes(searchLower) ||
                         m.id.toLowerCase().includes(searchLower) ||
                         m.category.toLowerCase().includes(searchLower) ||
                         m.type.toLowerCase().includes(searchLower) ||
                         (m.supplier && m.supplier.toLowerCase().includes(searchLower)) ||
                         (m.description && m.description.toLowerCase().includes(searchLower));

    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    const matchesResourceType = resourceTypeFilter === 'all' || m.type === resourceTypeFilter;

    let matchesStock = true;
    if (stockFilter === 'in_stock') matchesStock = m.type === 'Service' || m.type === 'Support' || m.stock > m.minStock;
    else if (stockFilter === 'low') matchesStock = m.type !== 'Service' && m.type !== 'Support' && m.stock <= m.minStock && m.stock > 0;
    else if (stockFilter === 'out') matchesStock = m.type !== 'Service' && m.type !== 'Support' && m.stock === 0;

    let matchesSupplier = true;
    if (supplierFilter !== 'all') matchesSupplier = m.supplier === supplierFilter;

    let matchesCost = true;
    const cost = m.costPerUnit || 0;
    if (costRangeFilter === 'under_10') matchesCost = cost < 10;
    else if (costRangeFilter === '10_50') matchesCost = cost >= 10 && cost <= 50;
    else if (costRangeFilter === '50_100') matchesCost = cost > 50 && cost <= 100;
    else if (costRangeFilter === 'over_100') matchesCost = cost > 100;

    return matchesSearch && matchesCategory && matchesResourceType && matchesStock && matchesSupplier && matchesCost;
  }).sort((a, b) => {
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
    if (sortBy === 'cost_asc') return a.costPerUnit - b.costPerUnit;
    if (sortBy === 'cost_desc') return b.costPerUnit - a.costPerUnit;
    if (sortBy === 'stock_asc') return a.stock - b.stock;
    if (sortBy === 'stock_desc') return b.stock - a.stock;
    if (sortBy === 'supplier_asc') return (a.supplier || '').localeCompare(b.supplier || '');
    return 0;
  });

  const activeFiltersCount = (selectedCategory !== 'All' ? 1 : 0) +
    (resourceTypeFilter !== 'all' ? 1 : 0) +
    (stockFilter !== 'all' ? 1 : 0) +
    (supplierFilter !== 'all' ? 1 : 0) +
    (costRangeFilter !== 'all' ? 1 : 0) +
    (searchQuery.trim() !== '' ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setResourceTypeFilter('all');
    setStockFilter('all');
    setSupplierFilter('all');
    setCostRangeFilter('all');
    setSearchQuery('');
    setSortBy('name_asc');
  };

  const handleSaveMaterial = (material: Material | any) => {
    if (editingMaterial) {
      onUpdateMaterials(materials.map(m => m.id === material.id ? material : m));
      onAddAuditLog?.('Material Updated', `Material updated: ${material.name}`, 'inventory');
    } else {
      onUpdateMaterials([...materials, material]);
      onAddAuditLog?.('Material Added', `New material added: ${material.name}`, 'inventory', 'success');
    }
    setEditingMaterial(null);
    setIsModalOpen(false);
  };

  const lowStockCount = materials.filter(m => m.type !== 'Service' && m.type !== 'Support' && m.stock <= m.minStock).length;
  const totalValue = materials.reduce((sum, m) => sum + (m.costPerUnit * m.stock), 0);

  return (
    <div className="flex-1 bg-gray-50 p-4 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Materials & Infrastructure</h1>
            <p className="text-xs text-gray-500">Manage fabrics, accessories, and production services</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setView(view === 'stock' ? 'history' : 'stock')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              <History size={14} />
              {view === 'stock' ? 'Movement History' : 'Resource Levels'}
            </button>
            <button 
              onClick={() => {
                if (onNavigateToProcurement) {
                  onNavigateToProcurement();
                } else {
                  setIsPurchaseModalOpen(true);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
            >
              <ShoppingCart size={14} />
              Procurement
            </button>
            <button 
              onClick={() => { setEditingMaterial(null); setIsModalOpen(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus size={14} />
              Add Resource
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-gray-400">Total resources</span>
              <Package size={14} className="text-blue-500" />
            </div>
            <div className="text-lg font-bold text-gray-900">{materials.length}</div>
            <p className="text-[10px] text-gray-500 mt-0.5">Materials and services</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-gray-400">Shortage alerts</span>
              <AlertTriangle size={14} className="text-amber-500" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-amber-600">{lowStockCount}</div>
                <p className="text-[10px] text-gray-500 mt-0.5">Items below threshold</p>
              </div>
              {lowStockCount > 0 && onQuickCreateRfq && (
                <button
                  onClick={() => {
                    const shortageItems = materials
                      .filter(m => m.type !== 'Service' && m.type !== 'Support' && m.stock <= m.minStock)
                      .map(m => ({
                        materialId: m.id,
                        name: m.name,
                        quantity: Math.max(1, (m.minStock * 2) - m.stock),
                        unit: m.unit,
                        specs: `Shortage replenishment (Stock: ${m.stock}, Min: ${m.minStock})`
                      }));
                    if (shortageItems.length > 0) {
                      onQuickCreateRfq({
                        type: 'Material',
                        id: shortageItems[0].materialId,
                        name: shortageItems[0].name,
                        quantity: shortageItems[0].quantity,
                        unit: shortageItems[0].unit,
                        items: shortageItems
                      });
                    }
                  }}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  <ShoppingCart size={11} />
                  Quick RFQ All ({lowStockCount})
                </button>
              )}
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-gray-400">Inventory value</span>
              <ArrowUpRight size={14} className="text-green-500" />
            </div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(totalValue)}</div>
            <p className="text-[10px] text-gray-500 mt-0.5">Total invested capital</p>
          </div>
        </div>

        {/* ENHANCED SEARCH AND FILTERING FACILITIES */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
          {/* Search Input Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search raw materials, fabrics, accessories, suppliers, SKUs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
            {/* Category Select */}
            <div>
              <label className="text-[9px] font-extrabold text-gray-400 uppercase block mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
              >
                <option value="All">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Type Select */}
            <div>
              <label className="text-[9px] font-extrabold text-gray-400 uppercase block mb-1">Resource Type</label>
              <select
                value={resourceTypeFilter}
                onChange={(e) => setResourceTypeFilter(e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
              >
                <option value="all">All Types</option>
                <option value="Fabric">Fabric</option>
                <option value="Accessory">Accessory</option>
                <option value="Service">Service</option>
                <option value="Support">Support</option>
              </select>
            </div>

            {/* Stock Level Select */}
            <div>
              <label className="text-[9px] font-extrabold text-gray-400 uppercase block mb-1">Stock Status</label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
              >
                <option value="all">All Levels</option>
                <option value="in_stock">In Stock (&gt; Min)</option>
                <option value="low">Low Stock (≤ Min)</option>
                <option value="out">Out of Stock (0)</option>
              </select>
            </div>

            {/* Supplier Select */}
            <div>
              <label className="text-[9px] font-extrabold text-gray-400 uppercase block mb-1">Preferred Supplier</label>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
              >
                <option value="all">All Suppliers</option>
                {Array.from(new Set(materials.map(m => m.supplier).filter(Boolean))).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Unit Cost Filter */}
            <div>
              <label className="text-[9px] font-extrabold text-gray-400 uppercase block mb-1">Cost / Unit</label>
              <select
                value={costRangeFilter}
                onChange={(e) => setCostRangeFilter(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
              >
                <option value="all">All Costs</option>
                <option value="under_10">Under $10</option>
                <option value="10_50">$10 - $50</option>
                <option value="50_100">$50 - $100</option>
                <option value="over_100">Over $100</option>
              </select>
            </div>

            {/* Sort By Select */}
            <div>
              <label className="text-[9px] font-extrabold text-gray-400 uppercase block mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
              >
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="cost_asc">Cost (Low to High)</option>
                <option value="cost_desc">Cost (High to Low)</option>
                <option value="stock_asc">Stock (Low to High)</option>
                <option value="stock_desc">Stock (High to Low)</option>
                <option value="supplier_asc">Supplier Name</option>
              </select>
            </div>
          </div>

          {/* Active Filter Badges & Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-[11px]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-500">
                Found <span className="font-black text-gray-900">{filteredMaterials.length}</span> of {materials.length} resources
              </span>

              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md font-bold text-[10px]">
                  Category: {selectedCategory}
                  <button onClick={() => setSelectedCategory('All')} className="hover:text-red-500"><X size={12} /></button>
                </span>
              )}
              {resourceTypeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md font-bold text-[10px]">
                  Type: {resourceTypeFilter}
                  <button onClick={() => setResourceTypeFilter('all')} className="hover:text-red-500"><X size={12} /></button>
                </span>
              )}
              {stockFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-bold text-[10px]">
                  Stock: {stockFilter}
                  <button onClick={() => setStockFilter('all')} className="hover:text-red-500"><X size={12} /></button>
                </span>
              )}
              {supplierFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 px-2 py-0.5 rounded-md font-bold text-[10px]">
                  Supplier: {supplierFilter}
                  <button onClick={() => setSupplierFilter('all')} className="hover:text-red-500"><X size={12} /></button>
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

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto w-full max-w-full">
          <table className="w-full text-left min-w-[640px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400">Resource</th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400">Type</th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400">Supply / Level</th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400 text-right">Cost / Unit</th>
                <th className="px-4 py-2 text-[10px] font-bold text-gray-400">Supplier</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl mx-auto flex items-center justify-center">
                        <Package size={24} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-gray-900">No Botanical & Material Stock Found</p>
                        <p className="text-xs text-gray-500">
                          {activeFiltersCount > 0 
                            ? 'No inventory materials match your search or filter criteria.' 
                            : 'No raw materials or flora stock logged yet.'}
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
                          onClick={() => { setEditingMaterial(null); setIsModalOpen(true); }}
                          className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all"
                        >
                          Add Material
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filteredMaterials.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white border border-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {material.image ? (
                          <img src={material.image} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="text-gray-300" size={14} />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{material.name}</p>
                        <p className="text-[9px] text-gray-400">{material.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-[8px] font-bold",
                      material.type === 'Fabric' ? "bg-blue-100 text-blue-600" :
                      material.type === 'Accessory' ? "bg-purple-100 text-purple-600" :
                      material.type === 'Service' ? "bg-orange-100 text-orange-600" :
                      "bg-gray-100 text-gray-600"
                    )}>
                      {material.type}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "text-xs font-black",
                          material.type !== 'Service' && material.stock <= material.minStock ? "text-amber-500" : "text-gray-900"
                        )}>
                          {material.type === 'Service' || material.type === 'Support' ? 'Available' : `${material.stock} ${material.unit}`}
                        </span>
                        {material.type !== 'Service' && material.stock <= material.minStock && (
                          <AlertTriangle size={11} className="text-amber-500" />
                        )}
                      </div>
                      {material.type !== 'Service' && (
                        <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all",
                              material.stock <= material.minStock ? "bg-amber-500" : "bg-green-500"
                            )}
                            style={{ width: `${Math.min(100, (material.stock / (material.minStock * 2)) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <p className="text-xs font-bold text-gray-900">{formatCurrency(material.costPerUnit)}</p>
                    <p className="text-[8px] text-gray-400 font-bold">per {material.unit}</p>
                  </td>
                  <td className="px-4 py-2 text-[11px] text-gray-500">{material.supplier || '-'}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {onQuickCreateRfq && material.type !== 'Service' && (
                        <button
                          onClick={() => {
                            const deficitQty = Math.max(1, (material.minStock * 2) - material.stock);
                            onQuickCreateRfq({
                              type: 'Material',
                              id: material.id,
                              name: material.name,
                              quantity: deficitQty,
                              unit: material.unit,
                              supplier: material.supplier,
                              specs: `Replenishment order for ${material.name} (Current: ${material.stock} ${material.unit}, Target: ${material.minStock * 2} ${material.unit})`
                            });
                          }}
                          className={cn(
                            "px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer",
                            material.stock <= material.minStock
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300"
                              : "bg-gray-100 text-gray-700 hover:bg-primary/10 hover:text-primary opacity-0 group-hover:opacity-100"
                          )}
                          title="Create RFQ in Procurement"
                        >
                          <ShoppingCart size={11} />
                          Quick RFQ
                        </button>
                      )}
                      <button 
                        onClick={() => { setEditingMaterial(material); setIsModalOpen(true); }}
                        className="p-1 px-2 text-gray-400 hover:text-primary transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <MaterialModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMaterial}
        product={editingMaterial as any}
        suppliers={suppliers}
        categories={categories}
      />

      <StockPurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        materials={materials as any}
        suppliers={suppliers}
        onCompletePurchase={(updatedMaterials, transaction) => {
          onUpdateMaterials(updatedMaterials as any);
          onUpdateTransactions(transaction);
        }}
      />

      <ConfirmModal
        isOpen={!!materialToDelete}
        onClose={() => setMaterialToDelete(null)}
        onConfirm={() => {
          if (materialToDelete) {
            onUpdateMaterials(materials.filter(m => m.id !== materialToDelete));
            setMaterialToDelete(null);
          }
        }}
        title={t.confirmDelete}
        message="Are you sure you want to delete this material?"
        type="danger"
      />
    </div>
  );
}
