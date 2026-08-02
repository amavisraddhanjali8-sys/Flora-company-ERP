import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  MoreVertical, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileText,
  Mail,
  Share2,
  Trash2,
  Eye,
  ArrowLeft,
  Edit2,
  Save,
  User,
  Calendar,
  Landmark,
  Tag,
  Package
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { Invoice, CompanySettings, Transaction } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import InvoicePrintView from './InvoicePrintView';
import ConfirmModal from '../layout/ConfirmModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { handleHtml2CanvasClone } from '../../lib/pdf-utils';
import PrintPortal from '../layout/PrintPortal';
import { useNotifications } from '../../context/NotificationContext';

import { translations, Language } from '../../i18n';

interface InvoiceSystemProps {
  companySettings: CompanySettings;
  invoices: Invoice[];
  onUpdateInvoices: (invoices: Invoice[]) => void;
  onUpdateTransactions: (transaction: Transaction) => void;
  onAddAuditLog?: (action: string, details: string, category: any, type?: any) => void;
  language?: Language;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function InvoiceSystem({ 
  companySettings, 
  invoices, 
  onUpdateInvoices, 
  onUpdateTransactions,
  onAddAuditLog,
  language = 'en',
  searchQuery,
  setSearchQuery
}: InvoiceSystemProps) {
  const t = translations[language];
  const { addNotification } = useNotifications();
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState<Invoice | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [formItems, setFormItems] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPrintPortal, setShowPrintPortal] = useState(false);
  const [taxRate, setTaxRate] = useState(companySettings.defaultTaxRate);
  const [discountRate, setDiscountRate] = useState(0);
  const [freight, setFreight] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const printRef = useRef<HTMLDivElement>(null);

  const subtotal = formItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const discount = subtotal * (discountRate / 100);
  const taxableAmount = subtotal - discount;
  const tax = taxableAmount * (taxRate / 100);
  const total = taxableAmount + tax + freight + otherCharges;

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         inv.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleApproveInvoice = (invoice: Invoice) => {
    const updatedInvoice: Invoice = {
      ...invoice,
      status: 'Approved'
    };

    onUpdateInvoices(invoices.map(inv => inv.id === invoice.id ? updatedInvoice : inv));
    onAddAuditLog?.('Invoice Approved', `Invoice #${invoice.invoiceNumber} (${invoice.clientName}) approved and recorded in accounting portal`, 'sales', 'success');

    // Sync with Accounting Portal
    const isSupplier = invoice.type === 'Supplier' || invoice.isSupplierInvoice;
    const approvalTx: Transaction = {
      id: `TRX-INV-APP-${Date.now()}`,
      type: isSupplier ? 'Expense' : 'Sale',
      category: isSupplier ? 'Supplier Bill Approval' : 'Sales Invoice Approval',
      amount: invoice.total,
      date: new Date().toISOString(),
      description: `Invoice Approval #${invoice.invoiceNumber} - ${invoice.clientName}`,
      status: 'Completed',
      referenceId: invoice.id,
      clientId: isSupplier ? undefined : invoice.clientId,
      clientName: isSupplier ? undefined : invoice.clientName,
      supplierId: isSupplier ? invoice.clientId : undefined,
      supplierName: isSupplier ? invoice.clientName : undefined
    };

    onUpdateTransactions(approvalTx);

    showNotification('success', `Invoice #${invoice.invoiceNumber} approved and automatically posted to Accounting!`);

    if (selectedInvoice?.id === invoice.id) {
      setSelectedInvoice(updatedInvoice);
    }
  };

  const handleRecordPayment = () => {
    if (!selectedInvoice || paymentAmount <= 0) return;

    const isSupplier = selectedInvoice.type === 'Supplier' || selectedInvoice.isSupplierInvoice;
    const newPaid = selectedInvoice.amountPaid + paymentAmount;
    const newBalance = Math.max(0, selectedInvoice.balance - paymentAmount);
    const newStatus = newPaid >= selectedInvoice.total ? 'Paid' : selectedInvoice.status === 'Draft' ? 'Sent' : selectedInvoice.status;

    const updatedInvoice: Invoice = {
      ...selectedInvoice,
      amountPaid: newPaid,
      balance: newBalance,
      status: newStatus as any
    };

    onUpdateInvoices(invoices.map(inv => inv.id === selectedInvoice.id ? updatedInvoice : inv));
    onAddAuditLog?.('Payment Recorded', `Payment of ${formatCurrency(paymentAmount, companySettings.currency)} recorded for Invoice #${selectedInvoice.invoiceNumber}`, 'sales', 'success');
    
    // Sync with Accounting
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: isSupplier ? 'Expense' : 'Income',
      category: isSupplier ? 'Supplier Payment' : 'Sales Revenue',
      amount: paymentAmount,
      date: new Date().toISOString(),
      description: `Payment for Invoice ${selectedInvoice.invoiceNumber} - ${selectedInvoice.clientName}`,
      status: 'Completed',
      paymentMethod,
      referenceId: selectedInvoice.id,
      clientId: isSupplier ? undefined : selectedInvoice.clientId,
      clientName: isSupplier ? undefined : selectedInvoice.clientName,
      supplierId: isSupplier ? selectedInvoice.clientId : undefined,
      supplierName: isSupplier ? selectedInvoice.clientName : undefined
    };
    onUpdateTransactions(transaction);

    setSelectedInvoice(updatedInvoice);
    setIsPaymentModalOpen(false);
    setPaymentAmount(0);
    showNotification('success', 'Payment recorded successfully!');
  };

  const handleDeleteInvoice = (id: string) => {
    onUpdateInvoices(invoices.filter(inv => inv.id !== id));
    if (selectedInvoice?.id === id) {
      setView('list');
      setSelectedInvoice(null);
    }
    setDeleteConfirmation(null);
    showNotification('success', 'Invoice deleted successfully!');
  };

  const handleSaveInvoice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const invoiceData: Invoice = {
      id: editingInvoice?.id || Date.now().toString(),
      invoiceNumber: editingInvoice?.invoiceNumber || `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      clientName: formData.get('clientName') as string,
      clientId: formData.get('clientId') as string,
      date: formData.get('date') as string,
      dueDate: formData.get('dueDate') as string,
      items: formItems,
      subtotal: Number(formData.get('subtotal')),
      tax: Number(formData.get('tax')),
      taxRate: Number(formData.get('taxRate')),
      discount: Number(formData.get('discount')),
      discountRate: Number(formData.get('discountRate')),
      freight: Number(formData.get('freight')),
      otherCharges: Number(formData.get('otherCharges')),
      total: Number(formData.get('total')),
      status: (formData.get('status') as any) || 'Draft',
      amountPaid: editingInvoice?.amountPaid || 0,
      balance: Number(formData.get('total')) - (editingInvoice?.amountPaid || 0),
      bankId: formData.get('bankId') as string,
      terms: editingInvoice?.terms || []
    };

    if (editingInvoice) {
      onUpdateInvoices(invoices.map(inv => inv.id === editingInvoice.id ? invoiceData : inv));
      onAddAuditLog?.('Invoice Updated', `Invoice #${invoiceData.invoiceNumber} updated`, 'sales');
    } else {
      onUpdateInvoices([invoiceData, ...invoices]);
      onAddAuditLog?.('Invoice Created', `Invoice #${invoiceData.invoiceNumber} created for ${invoiceData.clientName}`, 'sales', 'success');
    }

    setIsFormModalOpen(false);
    setEditingInvoice(null);
    setFormItems([]);
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current || !selectedInvoice) return;
    setIsGeneratingPDF(true);
    try {
      const element = printRef.current;
      
      // Temporary style to ensure all elements are visible and formatted correctly for capture
      const originalStyle = element.style.cssText;
      element.style.width = '1024px'; // Fixed width for consistent capture
      element.style.padding = '40px';
      element.style.backgroundColor = '#ffffff';
      element.style.boxSizing = 'border-box';
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
        onclone: (clonedDoc) => {
          handleHtml2CanvasClone(clonedDoc);
          
          // Ensure the cloned element has the same fixed width
          const clonedElement = clonedDoc.querySelector('[data-print-root]') as HTMLElement || clonedDoc.body.firstChild as HTMLElement;
          if (clonedElement) {
            clonedElement.style.width = '1024px';
            clonedElement.style.padding = '40px';
            clonedElement.style.boxSizing = 'border-box';
          }

          // Fix any remaining oklab colors just in case
          const allElements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            if (el.style.color && (el.style.color.includes('oklab') || el.style.color.includes('oklch'))) {
              el.style.color = '#111827';
            }
            if (el.style.backgroundColor && (el.style.backgroundColor.includes('oklab') || el.style.backgroundColor.includes('oklch'))) {
              el.style.backgroundColor = 'transparent';
            }
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Add subsequent pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      pdf.save(`invoice_${selectedInvoice.invoiceNumber}.pdf`);
      
      // Restore original style
      element.style.cssText = originalStyle;
    } catch (error) {
      console.error('Error generating PDF:', error);
      addNotification({
        title: 'PDF Error',
        message: 'Failed to generate PDF. Please try the Print option instead.',
        type: 'error',
        category: 'system'
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'Overdue': return 'bg-red-100 text-red-700 border-red-200';
      case 'Sent': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
      {view === 'list' ? (
        <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">{t.invoicePortal}</h1>
              <p className="text-xs text-gray-500 font-medium">{t.manageInvoices}</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { 
                  setEditingInvoice(null); 
                  setFormItems([]);
                  setTaxRate(5);
                  setDiscountRate(0);
                  setFreight(0);
                  setOtherCharges(0);
                  setIsFormModalOpen(true); 
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                <Plus size={16} /> {t.createInvoice}
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text"
                  placeholder={t.searchInvoices}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-all w-64"
                />
              </div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-all font-bold text-gray-600"
              >
                <option value="All">{t.allStatus || 'All Status'}</option>
                <option value="Draft">{t.draft}</option>
                <option value="Sent">{t.sent}</option>
                <option value="Paid">{t.paid}</option>
                <option value="Overdue">{t.overdue}</option>
              </select>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: t.totalInvoiced, value: invoices.reduce((sum, inv) => sum + inv.total, 0), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: t.totalCollected, value: invoices.reduce((sum, inv) => sum + inv.amountPaid, 0), icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
              { label: t.pendingBalance, value: invoices.reduce((sum, inv) => sum + inv.balance, 0), icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: t.overdueAmount, value: invoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.balance, 0), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn("p-2 rounded-lg", stat.bg)}>
                    <stat.icon size={18} className={stat.color} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">{stat.label}</span>
                </div>
                <p className="text-lg font-black text-gray-900">{formatCurrency(stat.value)}</p>
              </div>
            ))}
          </div>

          {/* Invoice Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400">{t.invoiceNumber}</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400">{t.customer}</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400">{t.date}</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400">{t.total}</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400">{t.balance}</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400">{t.status}</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 text-right">{t.actions || 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-2">
                      <span className="text-sm font-black text-gray-900">{inv.invoiceNumber}</span>
                      {inv.quotationId && <p className="text-[8px] text-gray-400 font-bold uppercase">Ref: {inv.quotationId}</p>}
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-sm font-bold text-gray-700">{inv.clientName}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-xs text-gray-500 font-medium">{new Date(inv.date).toLocaleDateString()}</span>
                      <p className="text-[8px] text-red-400 font-bold uppercase">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-sm font-black text-gray-900">{formatCurrency(inv.total)}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={cn("text-sm font-black", inv.balance > 0 ? "text-blue-600" : "text-green-600")}>
                        {formatCurrency(inv.balance)}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-bold border", getStatusColor(inv.status))}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setSelectedInvoice(inv); setShowPrintPortal(true); }}
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                          title="Print Preview"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => { 
                            setEditingInvoice(inv); 
                            setFormItems(inv.items);
                            setTaxRate(inv.taxRate);
                            setDiscountRate(inv.discountRate || 0);
                            setFreight(inv.freight);
                            setOtherCharges(inv.otherCharges);
                            setIsFormModalOpen(true); 
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        {inv.status !== 'Approved' && inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                          <button 
                            onClick={() => handleApproveInvoice(inv)}
                            className="p-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all flex items-center gap-1 shrink-0"
                            title="Approve Invoice & Post to Accounting"
                          >
                            <CheckCircle2 size={14} /> Approve
                          </button>
                        )}
                        {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                          <button 
                            onClick={() => { setSelectedInvoice(inv); setIsPaymentModalOpen(true); }}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                            title="Record Payment"
                          >
                            <CreditCard size={16} />
                          </button>
                        )}
                        {inv.status !== 'Cancelled' && (
                          <button 
                            onClick={() => {
                              setInvoiceToCancel(inv);
                              setIsCancelConfirmOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Cancel Invoice"
                          >
                            <X size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => setDeleteConfirmation(inv.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <FileText size={48} strokeWidth={1} />
                        <p className="text-sm font-medium">No invoices found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Detail Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setView('list')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Invoice {selectedInvoice?.invoiceNumber}</h2>
                <p className="text-xs text-gray-500 font-medium">Viewing full invoice details</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowPrintPortal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                <Printer size={14} /> Print Preview
              </button>
              <button 
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {isGeneratingPDF ? <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <Download size={14} />}
                {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50">
                <Mail size={14} /> Email
              </button>
              {selectedInvoice?.status !== 'Approved' && selectedInvoice?.status !== 'Paid' && selectedInvoice?.status !== 'Cancelled' && (
                <button 
                  onClick={() => selectedInvoice && handleApproveInvoice(selectedInvoice)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle2 size={14} /> Approve & Post to Accounting
                </button>
              )}
              {selectedInvoice?.status !== 'Paid' && (
                <button 
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 shadow-lg shadow-primary/20"
                >
                  <CreditCard size={14} /> Record Payment
                </button>
              )}
              <button 
                onClick={() => { 
                  setEditingInvoice(selectedInvoice); 
                  setFormItems(selectedInvoice!.items);
                  setTaxRate(selectedInvoice!.taxRate);
                  setDiscountRate(selectedInvoice!.discountRate || 0);
                  setFreight(selectedInvoice!.freight);
                  setOtherCharges(selectedInvoice!.otherCharges);
                  setIsFormModalOpen(true); 
                }}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => setDeleteConfirmation(selectedInvoice!.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Detail Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-gray-100/50">
            <div className="max-w-[210mm] mx-auto">
              <div ref={printRef} data-print-root>
                {selectedInvoice && (
                  <InvoicePrintView invoice={selectedInvoice} settings={companySettings} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <motion.div
            key="invoice-payment-modal-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              key="invoice-payment-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              key="invoice-payment-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Record Payment</h3>
                  <p className="text-xs text-gray-500 font-medium">Record a payment for {selectedInvoice?.invoiceNumber}</p>
                </div>
                <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Current Balance</p>
                  <p className="text-2xl font-black text-primary">{formatCurrency(selectedInvoice?.balance || 0)}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">{companySettings.currency}</span>
                    <input 
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-lg font-black focus:outline-none focus:border-primary transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[0.25, 0.5, 1].map(ratio => (
                      <button 
                        key={ratio}
                        onClick={() => setPaymentAmount((selectedInvoice?.balance || 0) * ratio)}
                        className="flex-1 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-500 hover:border-primary hover:text-primary transition-all"
                      >
                        {ratio === 1 ? 'Full' : `${ratio * 100}%`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Cash', 'Bank Transfer', 'Card', 'Cheque'].map(method => (
                      <button 
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={cn(
                          "py-2.5 rounded-xl text-xs font-bold border transition-all",
                          paymentMethod === method 
                            ? "bg-primary text-white border-primary shadow-md" 
                            : "bg-white text-gray-600 border-gray-200 hover:border-primary/30"
                        )}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <button 
                  onClick={handleRecordPayment}
                  disabled={paymentAmount <= 0}
                  className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  Confirm Payment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invoice Form Modal */}
      <AnimatePresence>
        {isFormModalOpen && (
          <motion.div
            key="invoice-form-modal-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              key="invoice-form-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormModalOpen(false)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              key="invoice-form-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden my-8"
            >
              <form onSubmit={handleSaveInvoice}>
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                        {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        {editingInvoice ? `Modifying ${editingInvoice.invoiceNumber}` : 'Enter billing details below'}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIsFormModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto no-scrollbar">
                  {/* Client Info */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-primary font-bold border-b border-gray-100 pb-2">
                      <User size={16} />
                      <h4 className="text-[10px] uppercase tracking-widest">Client Information</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Client Name</label>
                        <input 
                          name="clientName"
                          required
                          defaultValue={editingInvoice?.clientName}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                          placeholder="e.g. John Doe"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Client ID</label>
                        <input 
                          name="clientId"
                          required
                          defaultValue={editingInvoice?.clientId}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                          placeholder="e.g. CUST-001"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dates & Status */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-primary font-bold border-b border-gray-100 pb-2">
                      <Calendar size={16} />
                      <h4 className="text-[10px] uppercase tracking-widest">Dates & Billing</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Invoice Date</label>
                        <input 
                          name="date"
                          type="date"
                          required
                          defaultValue={editingInvoice?.date || new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Due Date</label>
                        <input 
                          name="dueDate"
                          type="date"
                          required
                          defaultValue={editingInvoice?.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Item Management */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <Package size={16} />
                        <h4 className="text-[10px] uppercase tracking-widest">Invoice Items</h4>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setFormItems([...formItems, { id: Date.now().toString(), name: '', quantity: 1, price: 0, category: 'General' }])}
                        className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                      >
                        + Add Item
                      </button>
                    </div>
                    <div className="space-y-3">
                      {formItems.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-2xl border border-gray-100">
                          <div className="col-span-5 space-y-1">
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Item Name</label>
                            <input 
                              value={item.name}
                              onChange={e => setFormItems(formItems.map((it, i) => i === index ? { ...it, name: e.target.value } : it))}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-primary"
                              placeholder="Service or Product"
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Qty</label>
                            <input 
                              type="number"
                              value={item.quantity}
                              onChange={e => setFormItems(formItems.map((it, i) => i === index ? { ...it, quantity: Number(e.target.value) } : it))}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-primary"
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Price</label>
                            <input 
                              type="number"
                              value={item.price}
                              onChange={e => setFormItems(formItems.map((it, i) => i === index ? { ...it, price: Number(e.target.value) } : it))}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-primary"
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Total</label>
                            <div className="w-full px-3 py-2 bg-gray-100 border border-transparent rounded-xl text-xs font-black text-gray-400">
                              {((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                            </div>
                          </div>
                          <div className="col-span-1 flex justify-center pb-2">
                            <button 
                              type="button"
                              onClick={() => setFormItems(formItems.filter((_, i) => i !== index))}
                              className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {formItems.length === 0 && (
                        <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-3xl text-gray-400 text-xs font-medium">
                          No items added to this invoice yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financials */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center gap-2 text-primary font-bold border-b border-gray-100 pb-2">
                      <Tag size={16} />
                      <h4 className="text-[10px] uppercase tracking-widest">Financial Details</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subtotal</label>
                        <input 
                          name="subtotal"
                          type="number"
                          step="0.01"
                          readOnly
                          value={(subtotal || 0).toFixed(2)}
                          className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tax Rate (%)</label>
                        <input 
                          name="taxRate"
                          type="number"
                          step="0.1"
                          required
                          value={taxRate}
                          onChange={e => setTaxRate(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tax Amount</label>
                        <input 
                          name="tax"
                          type="number"
                          step="0.01"
                          readOnly
                          value={(tax || 0).toFixed(2)}
                          className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Discount Rate (%)</label>
                        <input 
                          name="discountRate"
                          type="number"
                          step="0.1"
                          value={discountRate}
                          onChange={e => setDiscountRate(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Discount Amount</label>
                        <input 
                          name="discount"
                          type="number"
                          step="0.01"
                          readOnly
                          value={(discount || 0).toFixed(2)}
                          className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Freight</label>
                        <input 
                          name="freight"
                          type="number"
                          step="0.01"
                          value={freight}
                          onChange={e => setFreight(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Other Charges</label>
                        <input 
                          name="otherCharges"
                          type="number"
                          step="0.01"
                          value={otherCharges}
                          onChange={e => setOtherCharges(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Grand Total</label>
                        <input 
                          name="total"
                          type="number"
                          step="0.01"
                          readOnly
                          value={(total || 0).toFixed(2)}
                          className="w-full px-4 py-3 bg-primary/5 border border-primary/20 rounded-2xl text-sm font-black text-primary focus:outline-none focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment & Status */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center gap-2 text-primary font-bold border-b border-gray-100 pb-2">
                      <Landmark size={16} />
                      <h4 className="text-[10px] uppercase tracking-widest">Payment & Status</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bank Account</label>
                        <select 
                          name="bankId"
                          required
                          defaultValue={editingInvoice?.bankId || companySettings.bankDetails[0]?.id}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all appearance-none"
                        >
                          {companySettings.bankDetails.map(bank => (
                            <option key={bank.id} value={bank.id}>{bank.bankName} - {bank.accountNumber}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
                        <select 
                          name="status"
                          required
                          defaultValue={editingInvoice?.status || 'Draft'}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all appearance-none"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Sent">Sent</option>
                          <option value="Paid">Paid</option>
                          <option value="Overdue">Overdue</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-gray-50 border-t border-gray-100">
                  <button 
                    type="submit"
                    className="w-full py-5 bg-primary text-white rounded-2xl text-sm font-black uppercase tracking-[0.2em] hover:bg-primary/90 shadow-2xl shadow-primary/30 transition-all"
                  >
                    {editingInvoice ? 'Update Invoice' : 'Save & Generate Invoice'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmation && (
          <motion.div
            key="invoice-delete-modal-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          >
            <motion.div 
              key="invoice-delete-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmation(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              key="invoice-delete-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">Delete Invoice?</h3>
              <p className="text-sm text-gray-500 font-medium mb-6">
                Are you sure you want to delete this invoice? This action cannot be undone and will not affect accounting entries.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteInvoice(deleteConfirmation)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 shadow-lg shadow-red-200 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            key="invoice-toast-notification"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "fixed bottom-8 left-1/2 -translate-x-1/2 z-[120] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border",
              notification.type === 'success' ? "bg-green-500 text-white border-green-400" : "bg-red-500 text-white border-red-400"
            )}
          >
            {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-bold tracking-tight">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print Portal */}
      <PrintPortal
        isOpen={showPrintPortal}
        onClose={() => setShowPrintPortal(false)}
        title="Invoice Document"
        subtitle={`Invoice #${selectedInvoice?.invoiceNumber}`}
        onDownload={handleDownloadPDF}
        isGeneratingPDF={isGeneratingPDF}
      >
        {selectedInvoice && (
          <div ref={printRef} className="bg-white">
            <InvoicePrintView 
              invoice={selectedInvoice} 
              settings={companySettings} 
            />
          </div>
        )}
      </PrintPortal>

      <ConfirmModal 
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={() => {
          if (invoiceToCancel) {
            onUpdateInvoices(invoices.map(i => i.id === invoiceToCancel.id ? { ...i, status: 'Cancelled' } : i));
            onAddAuditLog?.('Invoice Cancelled', `Invoice #${invoiceToCancel.invoiceNumber} cancelled`, 'sales', 'warning');
            addNotification({
              title: 'Invoice Cancelled',
              message: `Invoice #${invoiceToCancel.invoiceNumber} has been cancelled.`,
              type: 'warning',
              category: 'sales'
            });
            setInvoiceToCancel(null);
          }
        }}
        title="Cancel Invoice"
        message="Are you sure you want to cancel this invoice? This will restore any reduced stock and mark the invoice as cancelled."
        type="danger"
        language={language}
      />
    </div>
  );
}
