import React, { useRef, useState } from 'react';
import { 
  X, Printer, Download, FileText, CheckCircle2, AlertCircle, TrendingUp, 
  Package, ShoppingCart, Users, Building2, Calendar, ShieldCheck, DollarSign, Clock, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { handleHtml2CanvasClone } from '../../lib/pdf-utils';
import { Supplier, RFQ, ProcurementOrder, CompanySettings, Material, FinishedProduct } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';
import { useNotifications } from '../../context/NotificationContext';

interface ProcurementReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  companySettings: CompanySettings;
  suppliers: Supplier[];
  procurementOrders: ProcurementOrder[];
  rfqs: RFQ[];
  materials: Material[];
  finishedProducts?: FinishedProduct[];
  onAddAuditLog?: (action: string, details: string, category: any, type?: any) => void;
}

export default function ProcurementReportModal({
  isOpen,
  onClose,
  companySettings,
  suppliers,
  procurementOrders,
  rfqs,
  materials,
  finishedProducts = [],
  onAddAuditLog
}: ProcurementReportModalProps) {
  const { addNotification } = useNotifications();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('Current Month');

  if (!isOpen) return null;

  // Key Analytics Calculations
  const totalSpend = procurementOrders.reduce((sum, po) => sum + (po.total || 0), 0);
  const activeRfqsCount = rfqs.filter(r => r.status === 'Sent' || r.status === 'Draft').length;
  const completedOrdersCount = procurementOrders.filter(p => p.status === 'Received').length;
  const partialOrdersCount = procurementOrders.filter(p => p.status === 'Partial').length;
  const totalOutstandingPayable = suppliers.reduce((sum, s) => sum + (s.currentBalance || 0), 0);
  const lowStockMaterialsCount = materials.filter(m => m.stock <= m.minStock).length;
  const lowStockProductsCount = finishedProducts.filter(p => p.stock <= p.minStock).length;

  // Spend Category Breakdown
  const categorySpendMap: { [key: string]: number } = {
    'Material / Fabrics': 0,
    'Outsourced Services': 0,
    'Support & Accessories': 0
  };

  procurementOrders.forEach(po => {
    if (po.type === 'Service') {
      categorySpendMap['Outsourced Services'] += po.total;
    } else if (po.type === 'Support') {
      categorySpendMap['Support & Accessories'] += po.total;
    } else {
      categorySpendMap['Material / Fabrics'] += po.total;
    }
  });

  const categorySpendList = Object.keys(categorySpendMap).map(key => ({
    name: key,
    amount: categorySpendMap[key],
    percentage: totalSpend > 0 ? Math.round((categorySpendMap[key] / totalSpend) * 100) : 0
  }));

  // Top Suppliers by Spend
  const supplierSpendMap: { [supplierName: string]: { totalSpend: number; ordersCount: number; balance: number; rating: number } } = {};
  procurementOrders.forEach(po => {
    const name = po.supplierName || 'General Supplier';
    if (!supplierSpendMap[name]) {
      const supObj = suppliers.find(s => s.name === name || s.id === po.supplierId);
      supplierSpendMap[name] = {
        totalSpend: 0,
        ordersCount: 0,
        balance: supObj?.currentBalance || 0,
        rating: supObj?.rating || 4.5
      };
    }
    supplierSpendMap[name].totalSpend += po.total;
    supplierSpendMap[name].ordersCount += 1;
  });

  const topSuppliers = Object.keys(supplierSpendMap)
    .map(name => ({
      name,
      ...supplierSpendMap[name]
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 5);

  // PDF Generation via html2canvas & jsPDF
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPDF(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: handleHtml2CanvasClone
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const filename = `Procurement_Management_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      onAddAuditLog?.('PDF Export', 'Exported Procurement Monthly Management Review Report to PDF', 'procurement', 'info');
      addNotification({
        title: 'PDF Export Complete',
        message: 'Procurement Management Summary Report downloaded successfully.',
        type: 'success',
        category: 'procurement'
      });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      addNotification({
        title: 'Export Failed',
        message: 'Could not generate PDF document.',
        type: 'error',
        category: 'system'
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Browser print failed or blocked:', err);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="procurement-report-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-4 overflow-y-auto print:p-0 print:bg-white print:static print:z-auto"
      >
        <motion.div 
          key="procurement-report-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden print:max-w-none print:max-h-none print:shadow-none print:border-none print:rounded-none"
        >
          {/* Top Modal Controls (Hidden when printing) */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white border-b border-gray-800 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/20 text-primary rounded-xl flex items-center justify-center font-black">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight">Procurement Monthly Management Review Report</h3>
                <p className="text-[10px] text-gray-400 font-bold">Print-friendly executive dashboard summary for management evaluation</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-gray-700 cursor-pointer"
              >
                <Printer size={14} /> Print Report
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingPDF ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download size={14} /> Export PDF
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Printable Report Content Body */}
          <div className="p-6 md:p-8 overflow-y-auto space-y-6 bg-white print:p-0 print:overflow-visible" ref={reportRef}>
            
            {/* 1. Formal Document Header */}
            <div className="border-b-2 border-primary pb-5 flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {companySettings.logo && (
                  <img 
                    src={companySettings.logo} 
                    alt="Company Logo" 
                    className="w-16 h-16 object-contain rounded-lg border border-gray-100 p-1"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">{companySettings.name}</h1>
                  <p className="text-xs font-semibold text-gray-500 max-w-md">{companySettings.address}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-gray-400">
                    {companySettings.phones?.[0] && <span>Tel: {companySettings.phones[0]}</span>}
                    {companySettings.email && <span>Email: {companySettings.email}</span>}
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right bg-gray-50 p-3.5 rounded-xl border border-gray-100 min-w-[220px]">
                <div className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded text-[9px] font-black uppercase tracking-wider mb-1">
                  Executive Review
                </div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Procurement Summary</h2>
                <div className="space-y-0.5 mt-2 text-[10px] font-bold text-gray-500">
                  <p className="flex justify-between gap-2"><span>Report Period:</span> <span className="text-gray-900">{selectedMonth}</span></p>
                  <p className="flex justify-between gap-2"><span>Generated Date:</span> <span className="text-gray-900">{new Date().toLocaleDateString()}</span></p>
                  <p className="flex justify-between gap-2"><span>Currency:</span> <span className="text-gray-900">{companySettings.currency}</span></p>
                </div>
              </div>
            </div>

            {/* 2. Executive KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider">Total Spend</span>
                  <DollarSign size={16} className="text-primary" />
                </div>
                <h3 className="text-lg font-black text-gray-900">{formatCurrency(totalSpend)}</h3>
                <p className="text-[9px] text-gray-500 font-bold mt-0.5">Approved Purchase Orders</p>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider">Active RFQs</span>
                  <ShoppingCart size={16} className="text-indigo-600" />
                </div>
                <h3 className="text-lg font-black text-gray-900">{activeRfqsCount} Requests</h3>
                <p className="text-[9px] text-gray-500 font-bold mt-0.5">Quotations Pending / Sent</p>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider">Vendor Count</span>
                  <Users size={16} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-black text-gray-900">{suppliers.length} Suppliers</h3>
                <p className="text-[9px] text-gray-500 font-bold mt-0.5">{completedOrdersCount} Orders Completed</p>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider">Payables Liability</span>
                  <AlertCircle size={16} className="text-rose-500" />
                </div>
                <h3 className="text-lg font-black text-gray-900">{formatCurrency(totalOutstandingPayable)}</h3>
                <p className="text-[9px] text-gray-500 font-bold mt-0.5">Outstanding Vendor Balances</p>
              </div>
            </div>

            {/* 3. Dashboard Visualizations Summary Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Category Allocation */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-black uppercase text-gray-900 flex items-center gap-2">
                    <Layers size={14} className="text-primary" />
                    Category Spend Allocation
                  </h4>
                  <span className="text-[10px] font-bold text-gray-400">Share of Total</span>
                </div>
                
                <div className="space-y-2.5">
                  {categorySpendList.map((cat, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-700">{cat.name}</span>
                        <span className="text-gray-900 font-black">{formatCurrency(cat.amount)} ({cat.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            i === 0 ? "bg-primary" : i === 1 ? "bg-indigo-600" : "bg-emerald-500"
                          )} 
                          style={{ width: `${Math.max(5, cat.percentage)}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Vendors by Spend */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-black uppercase text-gray-900 flex items-center gap-2">
                    <Building2 size={14} className="text-indigo-600" />
                    Top Vendor Volume Breakdown
                  </h4>
                  <span className="text-[10px] font-bold text-gray-400">By Total Spend</span>
                </div>

                <div className="space-y-2">
                  {topSuppliers.map((sup, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-white border border-gray-200 rounded text-[10px] font-black flex items-center justify-center text-gray-600">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-gray-900">{sup.name}</p>
                          <p className="text-[9px] text-gray-400 font-bold">{sup.ordersCount} Purchase Orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-gray-900">{formatCurrency(sup.totalSpend)}</p>
                        <p className="text-[9px] text-emerald-600 font-bold">Rating: {sup.rating} ★</p>
                      </div>
                    </div>
                  ))}

                  {topSuppliers.length === 0 && (
                    <p className="text-xs text-gray-400 italic py-4 text-center">No vendor spend recorded for this period.</p>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Recent Purchase Orders Summary Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-gray-900 tracking-wider flex items-center gap-1.5">
                  <ShoppingCart size={14} className="text-primary" />
                  Key Purchase Orders Log ({procurementOrders.length})
                </h4>
                <span className="text-[10px] font-bold text-gray-400">Monthly Fulfillment Review</span>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase font-black text-gray-500">
                    <tr>
                      <th className="py-2.5 px-3">PO Number</th>
                      <th className="py-2.5 px-3">Supplier Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Total Amount</th>
                      <th className="py-2.5 px-3 text-center">Order Status</th>
                      <th className="py-2.5 px-3 text-center">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
                    {procurementOrders.slice(0, 8).map((po) => (
                      <tr key={po.id} className="hover:bg-gray-50/50">
                        <td className="py-2 px-3 font-mono font-bold text-primary">{po.poNumber}</td>
                        <td className="py-2 px-3 font-bold">{po.supplierName}</td>
                        <td className="py-2 px-3 text-gray-500 text-[11px]">{po.type || 'Material'}</td>
                        <td className="py-2 px-3 text-gray-500 text-[11px]">{new Date(po.date).toLocaleDateString()}</td>
                        <td className="py-2 px-3 text-right font-black">{formatCurrency(po.total)}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-black uppercase",
                            po.status === 'Received' ? "bg-emerald-100 text-emerald-700" :
                            po.status === 'Partial' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {po.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-black uppercase",
                            po.paymentStatus === 'Paid' ? "bg-emerald-100 text-emerald-700" :
                            po.paymentStatus === 'Partial' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                          )}>
                            {po.paymentStatus || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {procurementOrders.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-gray-400 italic">No purchase orders found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Inventory Replenishment & Critical Deficit Summary */}
            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-amber-900 flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-amber-600" />
                  Critical Inventory Shortage Summary
                </h4>
                <span className="text-[10px] font-bold text-amber-700">Action Required</span>
              </div>
              <p className="text-xs font-semibold text-amber-800">
                Currently, <span className="font-black text-amber-950">{lowStockMaterialsCount} raw materials</span> and <span className="font-black text-amber-950">{lowStockProductsCount} finished goods</span> are below minimum safety buffer levels. Auto-draft replenishment RFQs have been triggered for management review.
              </p>
            </div>

            {/* 6. Formal Sign-Off & Approval Block */}
            <div className="pt-6 border-t border-gray-200 grid grid-cols-2 gap-8 text-xs font-bold text-gray-600">
              <div>
                <p className="text-gray-400 uppercase text-[9px] font-black tracking-wider mb-6">Prepared By (Procurement Lead)</p>
                <div className="border-b border-gray-300 w-48 mb-1" />
                <p className="text-gray-900 font-bold">Signature & Date</p>
              </div>

              <div className="text-right">
                <p className="text-gray-400 uppercase text-[9px] font-black tracking-wider mb-6">Approved By (Executive Management / CFO)</p>
                <div className="border-b border-gray-300 w-48 ml-auto mb-1" />
                <p className="text-gray-900 font-bold">Authorized Approval Stamp</p>
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
