import React, { useState } from 'react';
import { 
  X, Package, Hammer, ShoppingCart, AlertTriangle, CheckCircle2, 
  DollarSign, Truck, Layers, Building2, ArrowRight, ShieldCheck, Factory
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FinishedProduct, Material, Supplier, Transaction } from '../../types';
import { cn, formatCurrency } from '../../lib/utils';
import { useNotifications } from '../../context/NotificationContext';

interface FinalProductOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: FinishedProduct | null;
  products: FinishedProduct[];
  materials: Material[];
  suppliers: Supplier[];
  onUpdateProducts: (products: FinishedProduct[]) => void;
  onUpdateMaterials: (materials: Material[]) => void;
  onQuickCreateRfq?: (itemData: { 
    type: 'Material' | 'Product'; 
    id: string; 
    name: string; 
    quantity: number; 
    unit: string; 
    supplier?: string; 
    specs?: string; 
    items?: any[] 
  }) => void;
  onUpdateTransactions?: (transaction: Transaction) => void;
  onAddAuditLog?: (action: string, details: string, category: any, type?: any) => void;
}

export default function FinalProductOrderModal({
  isOpen,
  onClose,
  product: initialProduct,
  products,
  materials,
  suppliers,
  onUpdateProducts,
  onUpdateMaterials,
  onQuickCreateRfq,
  onUpdateTransactions,
  onAddAuditLog
}: FinalProductOrderModalProps) {
  const { addNotification } = useNotifications();
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProduct?.id || products[0]?.id || '');
  const [orderPathway, setOrderPathway] = useState<'production' | 'direct_procurement'>('production');
  const [quantity, setQuantity] = useState<number>(10);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [customDirectPrice, setCustomDirectPrice] = useState<number>(initialProduct?.costPrice || 0);
  const [laborOverheadPerUnit, setLaborOverheadPerUnit] = useState<number>(5.00);
  const [shippingEstimate, setShippingEstimate] = useState<number>(25.00);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [urgency, setUrgency] = useState<'Standard' | 'Urgent' | 'Express'>('Standard');

  // Keep track of active product
  const activeProduct = products.find(p => p.id === selectedProductId) || initialProduct || products[0];

  React.useEffect(() => {
    if (initialProduct) {
      setSelectedProductId(initialProduct.id);
      setCustomDirectPrice(initialProduct.costPrice || 0);
    }
  }, [initialProduct]);

  React.useEffect(() => {
    if (activeProduct) {
      setCustomDirectPrice(activeProduct.costPrice || 0);
    }
  }, [selectedProductId]);

  if (!isOpen || !activeProduct) return null;

  // --- PATHWAY A: PRODUCTION COST CALCULATIONS ---
  // Calculate BOM material cost per unit
  const bomDetails = (activeProduct.materials || []).map(b => {
    const mat = materials.find(m => m.id === b.materialId);
    const unitCost = mat?.costPerUnit || 0;
    const requiredTotal = b.quantity * quantity;
    const currentStock = mat?.stock || 0;
    const isSufficient = currentStock >= requiredTotal;
    const deficit = Math.max(0, requiredTotal - currentStock);

    return {
      materialId: b.materialId,
      name: mat?.name || b.materialId,
      unit: mat?.unit || 'pc',
      qtyPerProduct: b.quantity,
      unitCost,
      bomCostForOne: b.quantity * unitCost,
      requiredTotal,
      currentStock,
      isSufficient,
      deficit
    };
  });

  const bomMaterialCostPerUnit = bomDetails.reduce((sum, item) => sum + item.bomCostForOne, 0);
  const totalProductionCostPerUnit = bomMaterialCostPerUnit + laborOverheadPerUnit;
  const grandTotalProductionCost = totalProductionCostPerUnit * quantity;

  // Check overall material availability for production
  const hasMaterialDeficit = bomDetails.some(item => !item.isSufficient);

  // --- PATHWAY B: DIRECT ORDER COSTS CALCULATIONS ---
  const directOrderSubtotal = customDirectPrice * quantity;
  const grandTotalDirectOrderCost = directOrderSubtotal + shippingEstimate;

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  // --- HANDLERS ---
  const handleExecuteProductionOrder = () => {
    if (hasMaterialDeficit) {
      addNotification({
        title: 'Material Deficit Detected',
        message: 'Insufficient raw materials in stock for this production order size.',
        type: 'warning',
        category: 'inventory'
      });
      return;
    }

    // Deduct BOM materials from inventory
    const updatedMaterials = materials.map(mat => {
      const bomMatch = bomDetails.find(b => b.materialId === mat.id);
      if (bomMatch) {
        return {
          ...mat,
          stock: Math.max(0, mat.stock - bomMatch.requiredTotal)
        };
      }
      return mat;
    });

    onUpdateMaterials(updatedMaterials);

    // Increase product finished stock
    const updatedProducts = products.map(p => {
      if (p.id === activeProduct.id) {
        return {
          ...p,
          stock: p.stock + quantity
        };
      }
      return p;
    });

    onUpdateProducts(updatedProducts);

    // Record Accounting Entry / Transaction
    if (onUpdateTransactions) {
      const newTransaction: Transaction = {
        id: `TX-PROD-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'Expense',
        category: 'Production Cost',
        amount: grandTotalProductionCost,
        paymentMethod: 'Internal Transfer',
        description: `Internal Production Order for ${quantity}x ${activeProduct.name} (BOM: $${bomMaterialCostPerUnit.toFixed(2)}/unit, Overhead: $${laborOverheadPerUnit.toFixed(2)}/unit)`,
        referenceId: activeProduct.id
      };
      onUpdateTransactions(newTransaction);
    }

    onAddAuditLog?.(
      'Production Order Executed',
      `Internal production order completed for ${quantity} units of ${activeProduct.name}. Total Production Cost: $${grandTotalProductionCost.toFixed(2)}`,
      'inventory',
      'success'
    );

    addNotification({
      title: 'Production Order Executed',
      message: `Successfully produced ${quantity}x ${activeProduct.name}! Materials consumed & finished stock increased.`,
      type: 'success',
      category: 'inventory'
    });

    onClose();
  };

  const handleOrderDeficitMaterialsRFQ = () => {
    const deficitItems = bomDetails
      .filter(item => item.deficit > 0)
      .map(item => ({
        materialId: item.materialId,
        name: item.name,
        quantity: item.deficit,
        unit: item.unit,
        specs: `Required for production order of ${quantity}x ${activeProduct.name}`
      }));

    if (deficitItems.length > 0 && onQuickCreateRfq) {
      onQuickCreateRfq({
        type: 'Material',
        id: activeProduct.id,
        name: `Production Materials for ${activeProduct.name}`,
        quantity: quantity,
        unit: 'pcs',
        items: deficitItems
      });

      addNotification({
        title: 'Deficit Materials RFQ Created',
        message: `Routed ${deficitItems.length} raw material requirement(s) to Procurement RFQs!`,
        type: 'info',
        category: 'procurement'
      });
      onClose();
    }
  };

  const handleCreateDirectProcurementRFQ = () => {
    if (onQuickCreateRfq) {
      onQuickCreateRfq({
        type: 'Product',
        id: activeProduct.id,
        name: activeProduct.name,
        quantity,
        unit: 'pcs',
        supplier: selectedSupplier?.name,
        specs: `Direct Finished Product Procurement Order: Qty ${quantity}, Unit Cost $${customDirectPrice.toFixed(2)}, Urgency: ${urgency}. Notes: ${orderNotes || 'Direct finished goods order'}`
      });

      onAddAuditLog?.(
        'Direct Product RFQ Initiated',
        `Direct purchase RFQ created for ${quantity} units of ${activeProduct.name} at $${customDirectPrice.toFixed(2)}/unit from ${selectedSupplier?.name || 'Supplier'}`,
        'procurement',
        'info'
      );

      addNotification({
        title: 'Procurement RFQ Dispatched',
        message: `Direct finished product order sent to Procurement system for ${quantity}x ${activeProduct.name}.`,
        type: 'success',
        category: 'procurement'
      });
      onClose();
    }
  };

  const handleDirectInstantReceipt = () => {
    // Directly add stock and record expense
    const updatedProducts = products.map(p => {
      if (p.id === activeProduct.id) {
        return {
          ...p,
          stock: p.stock + quantity
        };
      }
      return p;
    });

    onUpdateProducts(updatedProducts);

    if (onUpdateTransactions) {
      const newTransaction: Transaction = {
        id: `TX-PO-DIR-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'Expense',
        category: 'Finished Product Purchase',
        amount: grandTotalDirectOrderCost,
        paymentMethod: 'Bank Transfer',
        description: `Direct Supplier Purchase of ${quantity}x ${activeProduct.name} from ${selectedSupplier?.name || 'Vendor'}`,
        supplierId: selectedSupplier?.id,
        supplierName: selectedSupplier?.name,
        referenceId: activeProduct.id
      };
      onUpdateTransactions(newTransaction);
    }

    onAddAuditLog?.(
      'Direct Product Purchased & Received',
      `Instant direct product order completed: ${quantity} units of ${activeProduct.name} received. Total Direct Cost: $${grandTotalDirectOrderCost.toFixed(2)}`,
      'inventory',
      'success'
    );

    addNotification({
      title: 'Finished Goods Received',
      message: `Directly added ${quantity}x ${activeProduct.name} to inventory stock!`,
      type: 'success',
      category: 'inventory'
    });

    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        key="final-order-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      >
        <motion.div 
          key="final-order-modal"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-gray-900 to-indigo-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
                <Package size={22} className="text-indigo-300" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight">Order Finished Product</h3>
                <p className="text-xs text-indigo-200 font-medium">
                  Select fulfillment pathway: Internal Production vs. Direct Supplier Order
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 text-xs">
            {/* Target Product Picker & Overview */}
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-gray-200 shrink-0 flex items-center justify-center p-0.5 shadow-xs">
                  {activeProduct.image ? (
                    <img 
                      src={activeProduct.image} 
                      alt={activeProduct.name} 
                      className="w-full h-full object-cover rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Package size={20} className="text-gray-400" />
                  )}
                </div>
                <div className="space-y-0.5 flex-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Selected Product</label>
                  <select 
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full font-extrabold text-sm text-gray-900 bg-white border border-gray-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (SKU: {p.id}) - Stock: {p.stock} pcs
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 text-right bg-white px-3 py-2 rounded-lg border border-gray-200 w-full sm:w-auto justify-between sm:justify-end">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Current Stock</span>
                  <span className={cn(
                    "font-black text-sm",
                    activeProduct.stock <= activeProduct.minStock ? "text-rose-600" : "text-emerald-700"
                  )}>
                    {activeProduct.stock} units
                  </span>
                </div>
                <div className="border-l border-gray-100 pl-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Selling Price</span>
                  <span className="font-mono font-bold text-gray-900">${(activeProduct.price || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Quantity & Urgency Input */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-gray-200">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Order Quantity (Units) *
                </label>
                <input 
                  type="number" 
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-black font-mono text-sm text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Urgency Level
                </label>
                <select 
                  value={urgency}
                  onChange={(e: any) => setUrgency(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-bold text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Standard">Standard Delivery</option>
                  <option value="Urgent">Urgent Priority</option>
                  <option value="Express">Express Air Freight</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Order Notes / Tag
                </label>
                <input 
                  type="text" 
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Batch #2026-B, Customer order"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-medium text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* FULFILLMENT PATHWAY SELECTOR TABS */}
            <div className="space-y-3">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block">
                Select Procurement / Cost Pathway
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pathway 1 Button */}
                <button
                  type="button"
                  onClick={() => setOrderPathway('production')}
                  className={cn(
                    "p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer",
                    orderPathway === 'production' 
                      ? "bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs" 
                      : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    orderPathway === 'production' ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
                  )}>
                    <Factory size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-gray-900">Internal Production</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">BOM Cost</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Assemble product in-house using raw materials stock & BOM calculations.
                    </p>
                  </div>
                </button>

                {/* Pathway 2 Button */}
                <button
                  type="button"
                  onClick={() => setOrderPathway('direct_procurement')}
                  className={cn(
                    "p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer",
                    orderPathway === 'direct_procurement' 
                      ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs" 
                      : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    orderPathway === 'direct_procurement' ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"
                  )}>
                    <Building2 size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-gray-900">Direct Supplier Order</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">Order Cost</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Buy finished items directly from vendor via Procurement RFQ / PO.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* PATHWAY A CONTENT: PRODUCTION COST & BOM MATERIAL CHECK */}
            {orderPathway === 'production' && (
              <div className="bg-indigo-50/40 rounded-xl p-4 border border-indigo-100 space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                  <h4 className="font-extrabold text-xs text-indigo-950 flex items-center gap-1.5">
                    <Hammer size={15} className="text-indigo-600" />
                    Internal Manufacturing Breakdown & Raw Material Stock Check
                  </h4>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                    {bomDetails.length} Raw Material(s) Required
                  </span>
                </div>

                {/* BOM Items Table */}
                <div className="bg-white rounded-lg border border-indigo-100 overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-indigo-50/70 text-indigo-900 font-bold uppercase text-[9px]">
                      <tr>
                        <th className="p-2.5">Raw Material</th>
                        <th className="p-2.5">BOM / Unit</th>
                        <th className="p-2.5">Total Req.</th>
                        <th className="p-2.5">Current Stock</th>
                        <th className="p-2.5">Unit Cost</th>
                        <th className="p-2.5 text-right">Stock Availability</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-50 font-medium">
                      {bomDetails.map((b, idx) => (
                        <tr key={idx} className="hover:bg-indigo-50/30">
                          <td className="p-2.5 font-bold text-gray-900">{b.name}</td>
                          <td className="p-2.5 font-mono text-gray-600">{b.qtyPerProduct} {b.unit}</td>
                          <td className="p-2.5 font-mono font-bold text-indigo-900">{b.requiredTotal} {b.unit}</td>
                          <td className="p-2.5 font-mono text-gray-700">{b.currentStock} {b.unit}</td>
                          <td className="p-2.5 font-mono text-gray-600">${b.unitCost.toFixed(2)}</td>
                          <td className="p-2.5 text-right">
                            {b.isSufficient ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 size={12} /> Stock Available
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                <AlertTriangle size={12} /> Short by {b.deficit} {b.unit}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {bomDetails.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-400 italic">
                            No BOM materials configured for this product. You can add labor overhead below.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Cost Inputs & Totals */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block mb-1">
                      Labor & Assembly Overhead / Unit ($)
                    </label>
                    <input 
                      type="number"
                      step="0.5"
                      min={0}
                      value={laborOverheadPerUnit}
                      onChange={(e) => setLaborOverheadPerUnit(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg font-bold font-mono text-xs text-indigo-950 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-indigo-200 space-y-1 text-right">
                    <div className="flex justify-between text-indigo-800">
                      <span>Raw Material Cost / Unit:</span>
                      <span className="font-mono font-bold">${bomMaterialCostPerUnit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-indigo-800">
                      <span>Total Production Cost / Unit:</span>
                      <span className="font-mono font-extrabold text-indigo-900">${totalProductionCostPerUnit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-indigo-950 pt-1 border-t border-indigo-100 font-black text-sm">
                      <span>Grand Production Cost ({quantity} units):</span>
                      <span className="font-mono text-indigo-700">${grandTotalProductionCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Deficit Alert Banner */}
                {hasMaterialDeficit && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-amber-900">
                      <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                      <p className="text-[11px] font-semibold">
                        Some raw materials are out of stock for this batch size. You can route the missing items directly to Procurement RFQs!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOrderDeficitMaterialsRFQ}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <ShoppingCart size={13} /> Quick Procurement RFQ
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* PATHWAY B CONTENT: DIRECT SUPPLIER PURCHASE & ORDER DIRECT COSTS */}
            {orderPathway === 'direct_procurement' && (
              <div className="bg-emerald-50/40 rounded-xl p-4 border border-emerald-100 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <h4 className="font-extrabold text-xs text-emerald-950 flex items-center gap-1.5">
                    <Building2 size={15} className="text-emerald-600" />
                    Finished Product Direct Purchase (Procurement Integration)
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    Vendor Sourcing
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block mb-1">
                      Target Preferred Supplier *
                    </label>
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg font-bold text-xs text-gray-900 focus:outline-none focus:border-emerald-500"
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.category || 'General Vendor'}) - ⭐ {s.rating || 5}/5
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block mb-1">
                      Direct Purchase Price / Unit ($) *
                    </label>
                    <input 
                      type="number"
                      step="0.1"
                      min={0}
                      value={customDirectPrice}
                      onChange={(e) => setCustomDirectPrice(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg font-black font-mono text-xs text-emerald-950 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Direct Order Cost Summary */}
                <div className="bg-white p-3 rounded-lg border border-emerald-200 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Shipping / Freight Estimate ($)</label>
                      <input 
                        type="number"
                        min={0}
                        value={shippingEstimate}
                        onChange={(e) => setShippingEstimate(Math.max(0, Number(e.target.value)))}
                        className="w-full mt-0.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-md font-mono text-xs font-bold"
                      />
                    </div>
                    <div className="flex flex-col justify-end text-right space-y-1">
                      <div className="flex justify-between text-gray-600">
                        <span>Direct Subtotal ({quantity} units):</span>
                        <span className="font-mono font-bold">${directOrderSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-950 font-black text-sm pt-1 border-t border-gray-100">
                        <span>Total Direct Order Cost:</span>
                        <span className="font-mono text-emerald-700">${grandTotalDirectOrderCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-emerald-100 text-[11px] text-gray-600 space-y-1">
                  <span className="font-bold text-emerald-900 block">ℹ️ Procurement Order Option:</span>
                  <p>
                    Dispatching this order creates an RFQ / Purchase Order in the Procurement System under finished product sourcing. You can also receive stock directly if already delivered.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-gray-500 font-semibold">
              Total Order Items: <span className="font-black text-gray-900">{quantity} units</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>

              {orderPathway === 'production' ? (
                <button
                  type="button"
                  onClick={handleExecuteProductionOrder}
                  disabled={hasMaterialDeficit}
                  className={cn(
                    "flex-1 sm:flex-initial px-5 py-2 rounded-xl font-extrabold text-xs text-white shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                    hasMaterialDeficit 
                      ? "bg-gray-400 cursor-not-allowed opacity-75" 
                      : "bg-indigo-600 hover:bg-indigo-700"
                  )}
                >
                  <Factory size={15} /> Execute Production (${grandTotalProductionCost.toFixed(2)})
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCreateDirectProcurementRFQ}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ShoppingCart size={15} /> Dispatch RFQ to Procurement
                  </button>
                  <button
                    type="button"
                    onClick={handleDirectInstantReceipt}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle2 size={15} /> Direct Receive (${grandTotalDirectOrderCost.toFixed(2)})
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
