import React, { useState } from 'react';
import { X, Plus, Trash2, Search, ShoppingCart, Package, DollarSign, CreditCard, User, Barcode } from 'lucide-react';
import { Material, Supplier, Transaction, CartItem } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../../context/NotificationContext';

interface StockPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: Material[];
  suppliers: Supplier[];
  onCompletePurchase: (updatedMaterials: Material[], transaction: Transaction) => void;
}

interface PurchaseItem {
  materialId: string;
  name: string;
  quantity: number;
  costPrice: number;
  // Previously we had sellingPrice, but materials don't usually have a selling price directly
}

export default function StockPurchaseModal({ isOpen, onClose, materials, suppliers, onCompletePurchase }: StockPurchaseModalProps) {
  const { addNotification } = useNotifications();
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Credit'>('Cash');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addItem = (material: Material) => {
    if (purchaseItems.find(item => item.materialId === material.id)) {
      // Increment quantity if already exists
      setPurchaseItems(purchaseItems.map(item => 
        item.materialId === material.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setPurchaseItems([...purchaseItems, {
        materialId: material.id,
        name: material.name,
        quantity: 1,
        costPrice: material.costPerUnit
      }]);
    }
    setSearchQuery('');
    setBarcodeQuery('');
    setIsSearching(false);
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeQuery) return;
    const material = materials.find(m => m.id === barcodeQuery);
    if (material) {
      addItem(material);
      setBarcodeQuery('');
    } else {
      addNotification({
        title: 'Material Not Found',
        message: 'No material matches this ID.',
        type: 'error',
        category: 'inventory'
      });
    }
  };

  const removeItem = (materialId: string) => {
    setPurchaseItems(purchaseItems.filter(item => item.materialId !== materialId));
  };

  const updateItem = (materialId: string, field: keyof PurchaseItem, value: any) => {
    setPurchaseItems(purchaseItems.map(item => 
      item.materialId === materialId ? { ...item, [field]: value } : item
    ));
  };

  const totalCost = purchaseItems.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);

  const handleComplete = () => {
    if (purchaseItems.length === 0) {
      addNotification({
        title: 'Empty Purchase',
        message: 'Please add at least one material to the purchase.',
        type: 'warning',
        category: 'inventory'
      });
      return;
    }
    if (!selectedSupplier) {
      addNotification({
        title: 'Supplier Required',
        message: 'Please select a supplier for this purchase.',
        type: 'warning',
        category: 'inventory'
      });
      return;
    }

    const updatedMaterials = materials.map(m => {
      const purchaseItem = purchaseItems.find(item => item.materialId === m.id);
      if (purchaseItem) {
        return {
          ...m,
          stock: m.stock + purchaseItem.quantity,
          costPerUnit: purchaseItem.costPrice
        };
      }
      return m;
    });

    const transaction: Transaction = {
      id: 'PUR-' + Date.now(),
      type: 'Purchase',
      category: 'Stock Purchase',
      amount: totalCost,
      date: new Date().toISOString(),
      description: `Stock Purchase from ${suppliers.find(s => s.id === selectedSupplier)?.name || 'Supplier'}`,
      paymentMethod: paymentMethod,
      status: paymentMethod === 'Cash' ? 'Completed' : 'Pending',
      supplierId: selectedSupplier,
      supplierName: suppliers.find(s => s.id === selectedSupplier)?.name,
      items: purchaseItems.map(item => ({
        id: item.materialId,
        name: item.name,
        quantity: item.quantity,
        price: item.costPrice,
        category: materials.find(m => m.id === item.materialId)?.category || 'All'
      })) as any // Casting as any for transaction items which are specialized CartItems
    };

    onCompletePurchase(updatedMaterials, transaction);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSelectedSupplier('');
    setPaymentMethod('Cash');
    setPurchaseItems([]);
    setSearchQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Stock Purchase</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Add new stock to inventory</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 text-gray-400 hover:text-red-500 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Supplier</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all appearance-none"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('Cash')}
                  className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold border-2 transition-all ${
                    paymentMethod === 'Cash' 
                      ? 'bg-primary/5 border-primary text-primary' 
                      : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  <DollarSign size={18} />
                  Cash
                </button>
                <button
                  onClick={() => setPaymentMethod('Credit')}
                  className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold border-2 transition-all ${
                    paymentMethod === 'Credit' 
                      ? 'bg-primary/5 border-primary text-primary' 
                      : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  <CreditCard size={18} />
                  Credit
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <form onSubmit={handleBarcodeSubmit} className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary group-focus-within:scale-110 transition-transform">
                    <Barcode size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Scan or type barcode to add stock..."
                    className="w-full pl-12 pr-24 py-4 bg-primary/5 border-2 border-primary/10 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary focus:bg-white transition-all placeholder:text-primary/30"
                    value={barcodeQuery}
                    onChange={(e) => setBarcodeQuery(e.target.value)}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                      Add Item
                    </button>
                  </div>
                </form>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setIsSearching(!isSearching)}
                  className="flex items-center gap-2 px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-all border-2 border-transparent"
                >
                  <Search size={18} />
                  Browse Materials
                </button>
                
                <AnimatePresence>
                  {isSearching && (
                    <motion.div 
                      key="stock-search-popup"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-10 p-4 space-y-4"
                    >
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input 
                          autoFocus
                          type="text"
                          placeholder="Search materials..."
                          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-1 no-scrollbar">
                        {filteredMaterials.map(m => (
                          <button
                            key={m.id}
                            onClick={() => addItem(m)}
                            className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-all text-left"
                          >
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                              <Package size={14} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-900">{m.name}</p>
                              <p className="text-[10px] text-gray-400">Stock: {m.stock} {m.unit}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Material</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase w-24">Qty</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase w-32">Cost/Unit</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purchaseItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic text-xs">
                        No materials added to purchase.
                      </td>
                    </tr>
                  ) : (
                    purchaseItems.map((item) => (
                      <tr key={item.materialId} className="bg-white">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-900">{item.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">#{item.materialId}</p>
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.materialId, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:border-primary"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="number"
                            step="0.01"
                            value={item.costPrice}
                            onChange={(e) => updateItem(item.materialId, 'costPrice', parseFloat(e.target.value) || 0)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:border-primary"
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => removeItem(item.materialId)}
                            className="text-gray-400 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Purchase Value</span>
            <span className="text-2xl font-black text-primary">{formatCurrency(totalCost)}</span>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="px-8 py-4 border-2 border-gray-200 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleComplete}
              className="px-12 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all"
            >
              Complete Purchase
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
