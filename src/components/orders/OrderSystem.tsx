import React, { useState, useRef } from 'react';
import { Search, Eye, Trash2, Download, Printer, User, ShoppingBag, Receipt, Calendar, Truck, CheckCircle2, Clock, Ban, Briefcase, FileText, ShoppingCart, ExternalLink } from 'lucide-react';
import { Order, OrderStatus, CompanySettings, RFQ, SupplierQuotation, ProcurementOrder } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';
import { translations, Language } from '../../i18n';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../../context/NotificationContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PrintPortal from '../layout/PrintPortal';
import Barcode from 'react-barcode';

import { handleHtml2CanvasClone } from '../../lib/pdf-utils';

interface OrderSystemProps {
  orders: Order[];
  onDeleteOrder: (id: string) => void;
  onClearOrders?: () => void;
  onUpdateOrders: (orders: Order[]) => void;
  companySettings: CompanySettings;
  language?: Language;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  rfqs?: RFQ[];
  quotations?: SupplierQuotation[];
  procurementOrders?: ProcurementOrder[];
  onNavigateToProcurement?: (tab?: string) => void;
  onCreateRfqForOrder?: (orderId: string) => void;
}

export default function OrderSystem({ 
  orders, 
  onDeleteOrder, 
  onClearOrders, 
  onUpdateOrders,
  companySettings, 
  language = 'en',
  searchQuery,
  setSearchQuery,
  rfqs = [],
  quotations = [],
  procurementOrders = [],
  onNavigateToProcurement,
  onCreateRfqForOrder
}: OrderSystemProps) {
  const t = translations[language];
  const { addNotification } = useNotifications();
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPrintPortal, setShowPrintPortal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const orderRef = useRef<HTMLDivElement>(null);

  const statusColors: Record<OrderStatus, string> = {
    'Pending': 'bg-yellow-50 text-yellow-600 border-yellow-100',
    'Confirmed': 'bg-blue-50 text-blue-600 border-blue-100',
    'Processing': 'bg-purple-50 text-purple-600 border-purple-100',
    'Ready': 'bg-indigo-50 text-indigo-600 border-indigo-100',
    'Shipped': 'bg-orange-50 text-orange-600 border-orange-100',
    'Delivered': 'bg-green-50 text-green-600 border-green-100',
    'Cancelled': 'bg-red-50 text-red-600 border-red-100',
  };

  const statusIcons: Record<OrderStatus, any> = {
    'Pending': Clock,
    'Confirmed': User,
    'Processing': ShoppingBag,
    'Ready': CheckCircle2,
    'Shipped': Truck,
    'Delivered': CheckCircle2,
    'Cancelled': Ban,
  };

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    onUpdateOrders(updatedOrders);
    addNotification({
      title: 'Status Updated',
      message: `Order status changed to ${newStatus}`,
      type: 'success',
      category: 'sales'
    });
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  const handleDownloadPDF = async () => {
    if (!orderRef.current || !selectedOrder) return;
    setIsGeneratingPDF(true);
    try {
      const element = orderRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          handleHtml2CanvasClone(clonedDoc);
        }
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(canvas);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(canvas, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`order_${selectedOrder.orderNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      addNotification({
        title: 'PDF Error',
        message: 'Failed to generate PDF.',
        type: 'error',
        category: 'system'
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchLower) ||
                         order.clientName.toLowerCase().includes(searchLower);
    
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    
    const orderDate = new Date(order.date);
    const matchesStartDate = !startDate || orderDate >= new Date(startDate);
    const matchesEndDate = !endDate || orderDate <= new Date(endDate + 'T23:59:59');
    
    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex-1 bg-gray-50 p-3 sm:p-4 overflow-y-auto lg:overflow-hidden flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Order Management</h1>
          <p className="text-xs text-gray-500">Track and manage clothing orders and lifecycles</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by order # or client..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 focus:outline-none focus:border-primary transition-all shrink-0"
          >
            <option value="All">All Status</option>
            {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row gap-4">
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto overflow-y-auto flex-1 w-full">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-2 text-[10px] font-bold text-gray-400">Order #</th>
                  <th className="px-6 py-2 text-[10px] font-bold text-gray-400">Client</th>
                  <th className="px-6 py-2 text-[10px] font-bold text-gray-400">Linked Sourcing / RFQ</th>
                  <th className="px-6 py-2 text-[10px] font-bold text-gray-400">Date</th>
                  <th className="px-6 py-2 text-[10px] font-bold text-gray-400">Total</th>
                  <th className="px-6 py-2 text-[10px] font-bold text-gray-400 text-center">Status</th>
                  <th className="px-6 py-2 text-[10px] font-bold text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic text-xs">No orders found</td></tr>
                ) : (
                  filteredOrders.map((order, index) => {
                    const linkedRfqList = rfqs.filter(r => r.orderId === order.id || r.orderNumber === order.orderNumber);
                    const linkedPoList = procurementOrders.filter(p => p.orderId === order.id || p.orderNumber === order.orderNumber);
                    const hasPoDeficit = linkedPoList.some(p => p.status === 'Partial');
                    const deficitRfqList = linkedRfqList.filter(r => r.isDeficitRfq);

                    return (
                      <tr 
                        key={order.id ? `${order.id}-${index}` : `order-${index}`} 
                        className={cn("hover:bg-gray-50 transition-colors cursor-pointer", selectedOrder?.id === order.id && "bg-primary/5")}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <td className="px-6 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className={cn("px-1.5 py-0.5 rounded text-[8px] font-black text-white tracking-widest", order.type === 'Direct' ? 'bg-blue-500' : 'bg-purple-500')}>
                              {order.type.charAt(0)}
                            </div>
                            <span className="font-mono text-[10px] font-bold text-gray-700">{order.orderNumber}</span>
                          </div>
                        </td>
                        <td className="px-6 py-2.5">
                          <span className="text-[11px] font-bold text-gray-900">{order.clientName}</span>
                        </td>
                        <td className="px-6 py-2.5" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {linkedRfqList.length > 0 && !hasPoDeficit && (
                              <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded font-mono">
                                {linkedRfqList[0].rfqNumber}
                              </span>
                            )}
                            {linkedPoList.length > 0 && (
                              <span className={cn(
                                "text-[9px] font-bold border px-1.5 py-0.5 rounded font-mono",
                                hasPoDeficit ? "text-amber-800 bg-amber-50 border-amber-200" : "text-emerald-700 bg-emerald-50 border-emerald-100"
                              )}>
                                {linkedPoList[0].poNumber} {hasPoDeficit ? '(Partial)' : ''}
                              </span>
                            )}
                            {deficitRfqList.length > 0 && (
                              <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded font-mono" title="Deficit RFQ active">
                                ⚡ {deficitRfqList[0].rfqNumber}
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onCreateRfqForOrder) {
                                  onCreateRfqForOrder(order.id);
                                } else if (onNavigateToProcurement) {
                                  onNavigateToProcurement('rfq');
                                }
                              }}
                              className="text-[9px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-1.5 py-0.5 rounded flex items-center gap-0.5"
                              title="Create RFQ for this Order"
                            >
                              + RFQ
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-2.5 text-[10px] text-gray-500">{new Date(order.date).toLocaleDateString()}</td>
                        <td className="px-6 py-2.5 text-[11px] font-bold text-primary">{formatCurrency(order.total)}</td>
                        <td className="px-6 py-2.5 text-center">
                          <span className={cn("px-2 py-0.5 text-[8px] font-bold rounded-full border", statusColors[order.status])}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 text-right">
                          <div className="flex justify-end gap-2 text-gray-400">
                            <Eye size={12} className="hover:text-primary transition-colors" />
                            <Trash2 size={12} className="hover:text-red-500 transition-colors" onClick={(e) => { e.stopPropagation(); onDeleteOrder(order.id); }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {selectedOrder && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="w-96 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 tracking-tighter">Order details</h3>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">×</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex justify-between items-start">
                   <div>
                     <p className="text-[10px] font-bold text-gray-400 leading-none mb-1">Customer</p>
                     <p className="text-sm font-black text-gray-900 leading-tight">{selectedOrder.clientName}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] font-bold text-gray-400 leading-none mb-1">Type</p>
                     <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full", selectedOrder.type === 'Direct' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600')}>
                       {selectedOrder.type}
                     </span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-[9px] font-bold text-gray-400">Advance payment</p>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(selectedOrder.advancePayment)}</p>
                  </div>
                  <div className="text-right border-l border-gray-200 pl-3">
                    <p className="text-[9px] font-bold text-gray-400">Balance due</p>
                    <p className="text-sm font-bold text-red-600">{formatCurrency(selectedOrder.balance)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 flex items-center gap-2">
                    <ShoppingBag size={10} /> Items ordered
                  </p>
                  <div className="space-y-1.5">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <span className="text-[8px] font-black bg-white border px-1 py-0.5 rounded text-gray-500">Q: {item.quantity}</span>
                            {item.size && <span className="text-[8px] font-black bg-white border px-1 py-0.5 rounded text-gray-500">S: {item.size}</span>}
                            {item.color && <span className="text-[8px] font-black bg-white border px-1 py-0.5 rounded text-gray-500">C: {item.color}</span>}
                          </div>
                        </div>
                        <span className="text-xs font-black text-gray-700 ml-2">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-400">Total value</span>
                    <span className="text-primary font-black text-base">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>

                {/* Linked Procurement Documents (RFQs, Supplier Quotes, POs) */}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                      <Briefcase size={12} className="text-indigo-600" /> Linked Procurement & Sourcing
                    </p>
                    {onNavigateToProcurement && (
                      <button 
                        onClick={() => onNavigateToProcurement('rfq')}
                        className="text-[9px] text-primary font-bold hover:underline flex items-center gap-0.5"
                      >
                        Portal <ExternalLink size={10} />
                      </button>
                    )}
                  </div>

                  {(() => {
                    const linkedRfqs = rfqs.filter(r => r.orderId === selectedOrder.id || r.orderNumber === selectedOrder.orderNumber);
                    const linkedQuotes = quotations.filter(q => q.orderId === selectedOrder.id || q.orderNumber === selectedOrder.orderNumber);
                    const linkedPos = procurementOrders.filter(p => p.orderId === selectedOrder.id || p.orderNumber === selectedOrder.orderNumber);

                    const totalCount = linkedRfqs.length + linkedQuotes.length + linkedPos.length;

                    if (totalCount === 0) {
                      return (
                        <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-center space-y-1">
                          <p className="text-[10px] text-gray-400">No linked RFQs or POs for this order.</p>
                          <button 
                            onClick={() => {
                              if (onCreateRfqForOrder) {
                                onCreateRfqForOrder(selectedOrder.id);
                              } else if (onNavigateToProcurement) {
                                onNavigateToProcurement('rfq');
                              }
                            }}
                            className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 hover:bg-indigo-100"
                          >
                            + Create RFQ for Order
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-1.5 text-[9px]">
                        {/* RFQs */}
                        {linkedRfqs.map(r => (
                          <div key={r.id} className="flex justify-between items-center p-1.5 bg-blue-50/60 rounded border border-blue-100">
                            <span className="font-bold text-blue-900 font-mono">RFQ: {r.rfqNumber}</span>
                            <span className="font-semibold text-blue-700">{r.status}</span>
                          </div>
                        ))}
                        {/* Supplier Quotes */}
                        {linkedQuotes.map(q => (
                          <div key={q.id} className="flex justify-between items-center p-1.5 bg-amber-50/60 rounded border border-amber-100">
                            <span className="font-bold text-amber-900 font-mono">Quote: {q.quotationNumber || q.id} ({q.supplierName})</span>
                            <span className="font-bold text-amber-800">{formatCurrency(q.total)}</span>
                          </div>
                        ))}
                        {/* POs */}
                        {linkedPos.map(p => (
                          <div key={p.id} className="flex justify-between items-center p-1.5 bg-emerald-50/60 rounded border border-emerald-100">
                            <span className="font-bold text-emerald-900 font-mono">PO: {p.poNumber} ({p.supplierName})</span>
                            <span className="font-bold text-emerald-800">{formatCurrency(p.total)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 flex items-center gap-2">
                    <Clock size={10} /> Update status
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.keys(statusColors).map(s => {
                      const Icon = statusIcons[s as OrderStatus];
                      return (
                        <button 
                          key={s}
                          onClick={() => handleUpdateStatus(selectedOrder.id, s as OrderStatus)}
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[9px] font-bold transition-all border text-left",
                            selectedOrder.status === s ? statusColors[s as OrderStatus] : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"
                          )}
                        >
                          <Icon size={10} />
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-gray-50 border-t border-gray-100 flex gap-2">
                 <button 
                    onClick={() => setShowPrintPortal(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white border border-gray-200 rounded-lg text-[9px] font-black text-gray-600 hover:bg-gray-100 transition-all shadow-sm"
                  >
                    <Printer size={12} /> Preview
                  </button>
                  <button 
                    onClick={handleDownloadPDF}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary text-white rounded-lg text-[9px] font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                  >
                    <Download size={12} /> Export
                  </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PrintPortal
        isOpen={showPrintPortal}
        onClose={() => setShowPrintPortal(false)}
        title="Order Confirmation"
        subtitle={`Order ${selectedOrder?.orderNumber}`}
        onDownload={handleDownloadPDF}
        isGeneratingPDF={isGeneratingPDF}
      >
        <div ref={orderRef} className="bg-white p-12 max-w-[600px] mx-auto border shadow-2xl" data-print-root>
          <div className="flex justify-between items-start mb-12 pb-6 border-b-2 border-primary">
            <div>
              <h1 className="text-3xl font-black text-primary uppercase tracking-tighter leading-none">{companySettings.name}</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-3 leading-relaxed max-w-[200px]">{companySettings.address}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">Order Confirmation</h2>
              <div className="bg-primary/5 px-3 py-1 rounded mt-2 inline-block">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{selectedOrder?.orderNumber}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mb-12">
            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer Information</p>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                   <p className="text-sm font-black text-gray-900 uppercase">{selectedOrder?.clientName}</p>
                   <p className="text-[10px] text-gray-500 font-bold mt-1">Order Status: <span className="text-primary">{selectedOrder?.status}</span></p>
                </div>
              </div>
            </div>
            <div className="text-right space-y-4">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Transaction Details</p>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 inline-block min-w-[180px]">
                  <div className="flex justify-between gap-4 text-[10px] font-bold">
                    <span className="text-gray-400 uppercase">Date:</span>
                    <span className="text-gray-900">{selectedOrder ? new Date(selectedOrder.date).toLocaleDateString() : ''}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-[10px] font-bold mt-1">
                    <span className="text-gray-400 uppercase">Workflow:</span>
                    <span className="text-gray-900">{selectedOrder?.type} Process</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Line Items</p>
          <table className="w-full mb-12 border-separate border-spacing-y-2">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-100">
                <th className="text-left text-[9px] font-black uppercase p-4 rounded-l-xl">Description</th>
                <th className="text-center text-[9px] font-black uppercase p-4">Qty</th>
                <th className="text-right text-[9px] font-black uppercase p-4">Price</th>
                <th className="text-right text-[9px] font-black uppercase p-4 rounded-r-xl">Total</th>
              </tr>
            </thead>
            <tbody>
              {selectedOrder?.items.map((item, i) => (
                <tr key={i} className="bg-white border hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 border-b border-gray-50 first:rounded-l-xl">
                    <p className="text-xs font-black text-gray-900">{item.name}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest border px-1.5 py-0.5 rounded">{item.size}</span>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest border px-1.5 py-0.5 rounded">{item.color}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center text-xs font-bold border-b border-gray-50 font-mono italic">{item.quantity}</td>
                  <td className="p-4 text-right text-xs font-bold border-b border-gray-50 font-mono italic">{formatCurrency(item.price)}</td>
                  <td className="p-4 text-right text-xs font-black border-b border-gray-50 last:rounded-r-xl text-primary">{formatCurrency(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bg-gray-900 p-8 rounded-[2rem] flex flex-col gap-3 mb-12 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl" />
             <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full -ml-16 -mb-16 blur-3xl" />
            
            <div className="flex justify-between text-[11px] font-bold relative z-10">
              <span className="text-gray-400 uppercase tracking-[0.2em]">Merchandise Total</span>
              <span className="text-white font-mono">{formatCurrency(selectedOrder?.total || 0)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold relative z-10">
              <span className="text-green-400/80 uppercase tracking-[0.2em]">Advance Processed</span>
              <span className="text-green-400 font-mono">-{formatCurrency(selectedOrder?.advancePayment || 0)}</span>
            </div>
            <div className="flex justify-between text-xl font-black border-t border-white/10 pt-4 mt-2 relative z-10">
              <span className="text-primary uppercase tracking-tighter italic">Balance Due</span>
              <span className="text-white font-mono">{formatCurrency(selectedOrder?.balance || 0)}</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
             <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
               {selectedOrder && (
                 <Barcode value={selectedOrder.orderNumber} width={1.5} height={60} fontSize={12} fontOptions="bold" />
               )}
             </div>
             <div className="text-center space-y-1">
               <p className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em]">Authorized Document</p>
               <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Valid for internal auditing and delivery verification</p>
             </div>
          </div>
        </div>
      </PrintPortal>
    </div>
  );
}

