import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Send, 
  FileText, 
  Truck, 
  PackageCheck, 
  Receipt, 
  Download, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Upload, 
  Eye, 
  DollarSign, 
  FileCheck, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ExternalLink,
  Printer,
  X,
  Lock,
  Tag,
  ShieldCheck,
  Percent,
  FileSpreadsheet,
  Briefcase
} from 'lucide-react';
import { 
  Supplier, 
  RFQ, 
  SupplierQuotation, 
  ProcurementOrder, 
  Invoice, 
  UserProfile, 
  CompanySettings 
} from '../../types';
import { cn, formatCurrency } from '../../lib/utils';
import { useNotifications } from '../../context/NotificationContext';

interface SupplierPortalProps {
  currentUser: UserProfile;
  suppliers: Supplier[];
  rfqs: RFQ[];
  quotations: SupplierQuotation[];
  procurementOrders: ProcurementOrder[];
  invoices: Invoice[];
  companySettings: CompanySettings;
  onUpdateQuotations: (quotations: SupplierQuotation[]) => void;
  onUpdateRfqs: (rfqs: RFQ[]) => void;
  onUpdateProcurementOrders: (orders: ProcurementOrder[]) => void;
  onUpdateInvoices: (invoices: Invoice[]) => void;
  onAddAuditLog?: (action: string, details: string, category: any, type?: any) => void;
}

type PortalTab = 'rfqs' | 'quotations' | 'orders' | 'dispatch' | 'grn' | 'invoices';

export default function SupplierPortal({
  currentUser,
  suppliers,
  rfqs,
  quotations,
  procurementOrders,
  invoices,
  companySettings,
  onUpdateQuotations,
  onUpdateRfqs,
  onUpdateProcurementOrders,
  onUpdateInvoices,
  onAddAuditLog
}: SupplierPortalProps) {
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<PortalTab>('rfqs');
  const [searchQuery, setSearchQuery] = useState('');

  // Active supplier context (either logged in supplier or selected for preview)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(() => {
    // Try matching current user companyName or email with suppliers list
    const matched = suppliers.find(s => 
      (currentUser.companyName && s.name.toLowerCase().includes(currentUser.companyName.toLowerCase())) ||
      (currentUser.email && s.email.toLowerCase() === currentUser.email.toLowerCase())
    );
    return matched ? matched.id : suppliers[0]?.id || 'sup-1';
  });

  const currentSupplier = useMemo(() => {
    return suppliers.find(s => s.id === selectedSupplierId) || suppliers[0] || {
      id: 'sup-demo',
      name: currentUser.companyName || 'GreenLeaf Botanical Wholesale',
      contactPerson: currentUser.name || 'Vendor Representative',
      email: currentUser.email || 'vendor@supplier.com',
      phone: currentUser.phone || '+1 800 555 0199',
      address: currentUser.address || 'Industrial Zone 4, Sector B',
      category: 'Botanicals & Supplies',
      paymentTerms: 'Net 30',
      rating: 4.8,
      status: 'Active',
      currentBalance: 0
    };
  }, [suppliers, selectedSupplierId, currentUser]);

  // Modals state
  const [selectedRfqForQuote, setSelectedRfqForQuote] = useState<RFQ | null>(null);
  const [isSubmitQuoteOpen, setIsSubmitQuoteOpen] = useState(false);
  const [quoteFormData, setQuoteFormData] = useState<{
    items: { materialId?: string; name: string; quantity: number; unitPrice: number; unit: string; leadTime: string; notes: string }[];
    discount: number;
    discountType: 'amount' | 'percent';
    freight: number;
    otherCharges: number;
    validUntil: string;
    notes: string;
    attachmentsUrl: string;
  }>({
    items: [],
    discount: 0,
    discountType: 'amount',
    freight: 0,
    otherCharges: 0,
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    attachmentsUrl: ''
  });

  // PO Print/Download Modal State
  const [selectedPoForDownload, setSelectedPoForDownload] = useState<ProcurementOrder | null>(null);

  // Dispatch Goods Modal State
  const [selectedPoForDispatch, setSelectedPoForDispatch] = useState<ProcurementOrder | null>(null);
  const [dispatchFormData, setDispatchFormData] = useState({
    courierOrDriver: '',
    vehiclePlate: '',
    trackingNumber: '',
    waybillNumber: '',
    estimatedArrival: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    attachmentUrl: '',
    dispatchedItems: [] as { name: string; quantity: number }[]
  });

  // Share Reference / Document Modal State
  const [selectedPoForDocument, setSelectedPoForDocument] = useState<ProcurementOrder | null>(null);
  const [documentFormData, setDocumentFormData] = useState({
    title: '',
    documentType: 'Proof of Delivery' as const,
    fileUrl: '',
    notes: ''
  });

  // Invoice Creation Modal State
  const [selectedPoForInvoice, setSelectedPoForInvoice] = useState<ProcurementOrder | null>(null);
  const [invoiceFormData, setInvoiceFormData] = useState({
    supplierInvoiceNumber: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    taxId: currentSupplier?.taxId || 'TAX-SUP-9981',
    bankName: 'Global Commercial Bank',
    accountNumber: '8839-2049-1102',
    swiftCode: 'GCBUS33',
    accountHolder: currentSupplier?.name || 'Supplier Account',
    notes: 'Thank you for your business. Payment due within specified terms.'
  });

  // Invoice Download / View Modal
  const [selectedInvoiceForDownload, setSelectedInvoiceForDownload] = useState<Invoice | null>(null);

  // Filtered data for this supplier
  const supplierRfqs = useMemo(() => {
    return rfqs.filter(r => 
      !r.suppliers || 
      r.suppliers.length === 0 || 
      r.suppliers.includes(currentSupplier.id) || 
      r.suppliers.includes('sup-demo') ||
      r.notes?.toLowerCase().includes(currentSupplier.name.toLowerCase()) ||
      r.notes?.toLowerCase().includes(currentUser.email.toLowerCase()) ||
      r.status === 'Sent' || 
      r.status === 'Completed'
    );
  }, [rfqs, currentSupplier, currentUser]);

  const myQuotations = useMemo(() => {
    return quotations.filter(q => 
      q.supplierId === currentSupplier.id || 
      q.supplierName.toLowerCase() === currentSupplier.name.toLowerCase() ||
      q.supplierId === 'sup-demo'
    );
  }, [quotations, currentSupplier]);

  const myOrders = useMemo(() => {
    return procurementOrders.filter(p => 
      p.supplierId === currentSupplier.id || 
      p.supplierName.toLowerCase() === currentSupplier.name.toLowerCase() ||
      p.supplierId === 'sup-demo'
    );
  }, [procurementOrders, currentSupplier]);

  const myInvoices = useMemo(() => {
    return invoices.filter(i => 
      i.supplierId === currentSupplier.id || 
      i.clientName.toLowerCase() === currentSupplier.name.toLowerCase() ||
      i.supplierId === 'sup-demo' ||
      i.isSupplierInvoice
    );
  }, [invoices, currentSupplier]);

  // Handlers
  const handleOpenSubmitQuote = (rfq: RFQ) => {
    setSelectedRfqForQuote(rfq);
    setQuoteFormData({
      items: rfq.items.map(it => ({
        materialId: it.materialId,
        name: it.name,
        quantity: it.quantity,
        unitPrice: 0,
        unit: it.unit || 'pcs',
        leadTime: '3-5 business days',
        notes: ''
      })),
      discount: 0,
      discountType: 'amount',
      freight: 50,
      otherCharges: 0,
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Standard delivery terms apply.',
      attachmentsUrl: ''
    });
    setIsSubmitQuoteOpen(true);
  };

  const handleSubmitQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfqForQuote) return;

    const itemsTotal = quoteFormData.items.reduce((sum, item) => sum + (item.quantity * (Number(item.unitPrice) || 0)), 0);
    const discountVal = quoteFormData.discountType === 'percent' 
      ? (itemsTotal * (Number(quoteFormData.discount) || 0) / 100) 
      : Number(quoteFormData.discount) || 0;
    
    const freightVal = Number(quoteFormData.freight) || 0;
    const otherVal = Number(quoteFormData.otherCharges) || 0;
    const taxVal = Math.round((itemsTotal - discountVal) * 0.05); // 5% default tax
    const grandTotal = Math.max(0, itemsTotal - discountVal + freightVal + otherVal + taxVal);

    const newQuote: SupplierQuotation = {
      id: `sq-portal-${Date.now()}`,
      rfqId: selectedRfqForQuote.id,
      rfqNumber: selectedRfqForQuote.rfqNumber,
      supplierId: currentSupplier.id,
      supplierName: currentSupplier.name,
      quotationNumber: `SQ-${Date.now().toString().slice(-5)}`,
      date: new Date().toISOString(),
      validUntil: quoteFormData.validUntil,
      items: quoteFormData.items.map(i => ({
        materialId: i.materialId,
        name: i.name,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice) || 0,
        unit: i.unit,
        total: i.quantity * (Number(i.unitPrice) || 0),
        isAvailable: true,
        leadTime: i.leadTime
      })),
      subtotal: itemsTotal,
      discount: discountVal,
      freight: freightVal,
      otherCharges: otherVal,
      tax: taxVal,
      total: grandTotal,
      status: 'Pending',
      notes: quoteFormData.notes,
      attachments: quoteFormData.attachmentsUrl ? [quoteFormData.attachmentsUrl] : []
    };

    onUpdateQuotations([newQuote, ...quotations]);
    
    // Update RFQ status to show quotation received
    onUpdateRfqs(rfqs.map(r => r.id === selectedRfqForQuote.id ? { ...r, status: 'Completed' } : r));

    onAddAuditLog?.('Quotation Submitted', `Supplier ${currentSupplier.name} submitted quotation ${newQuote.quotationNumber}`, 'suppliers', 'success');

    addNotification({
      title: 'Quotation Submitted Successfully',
      message: `Your quotation ${newQuote.quotationNumber} (${formatCurrency(grandTotal)}) has been sent to the procurement team for review.`,
      type: 'success',
      category: 'inventory'
    });

    setIsSubmitQuoteOpen(false);
    setSelectedRfqForQuote(null);
  };

  const handleOpenDispatch = (po: ProcurementOrder) => {
    setSelectedPoForDispatch(po);
    setDispatchFormData({
      courierOrDriver: 'FastFreight Express Driver',
      vehiclePlate: 'TRK-9812',
      trackingNumber: `TRK-${Date.now().toString().slice(-6)}`,
      waybillNumber: `WB-${Date.now().toString().slice(-5)}`,
      estimatedArrival: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'All items packed according to botanical transit guidelines.',
      attachmentUrl: '',
      dispatchedItems: po.items.map(it => ({ name: it.name, quantity: it.quantity }))
    });
  };

  const handleSubmitDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoForDispatch) return;

    const updatedPo: ProcurementOrder = {
      ...selectedPoForDispatch,
      status: 'Sent',
      dispatchInfo: {
        dispatchedDate: new Date().toISOString(),
        estimatedArrival: dispatchFormData.estimatedArrival,
        courierOrDriver: dispatchFormData.courierOrDriver,
        vehiclePlate: dispatchFormData.vehiclePlate,
        trackingNumber: dispatchFormData.trackingNumber,
        waybillNumber: dispatchFormData.waybillNumber,
        dispatchedItems: dispatchFormData.dispatchedItems,
        notes: dispatchFormData.notes,
        attachmentUrl: dispatchFormData.attachmentUrl
      }
    };

    onUpdateProcurementOrders(procurementOrders.map(p => p.id === selectedPoForDispatch.id ? updatedPo : p));

    onAddAuditLog?.('Goods Dispatched', `Supplier ${currentSupplier.name} dispatched PO ${updatedPo.poNumber}`, 'suppliers', 'info');

    addNotification({
      title: 'Dispatch Confirmed',
      message: `Shipment for PO ${updatedPo.poNumber} has been logged. Waybill #${dispatchFormData.waybillNumber}.`,
      type: 'success',
      category: 'inventory'
    });

    setSelectedPoForDispatch(null);
  };

  const handleShareDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoForDocument) return;

    const newDoc = {
      id: `doc-${Date.now()}`,
      title: documentFormData.title || 'Delivery Reference Document',
      documentType: documentFormData.documentType,
      fileUrl: documentFormData.fileUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=60',
      notes: documentFormData.notes,
      uploadedAt: new Date().toISOString()
    };

    const existingDocs = selectedPoForDocument.supplierDocuments || [];
    const updatedPo: ProcurementOrder = {
      ...selectedPoForDocument,
      supplierDocuments: [newDoc, ...existingDocs]
    };

    onUpdateProcurementOrders(procurementOrders.map(p => p.id === selectedPoForDocument.id ? updatedPo : p));

    onAddAuditLog?.('Document Uploaded', `Supplier shared document for PO ${updatedPo.poNumber}`, 'suppliers', 'info');

    addNotification({
      title: 'Document Shared',
      message: `Document "${newDoc.title}" attached to PO ${updatedPo.poNumber}.`,
      type: 'success',
      category: 'system'
    });

    setSelectedPoForDocument(null);
  };

  const handleGenerateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoForInvoice) return;

    const po = selectedPoForInvoice;
    const invNumber = invoiceFormData.supplierInvoiceNumber || `INV-SUP-${Date.now().toString().slice(-5)}`;

    const cartItems = po.items.map((it, idx) => ({
      id: `item-${idx}-${Date.now()}`,
      name: it.name,
      price: it.unitPrice,
      quantity: it.quantity,
      category: 'Flowers' as const,
      stock: 100,
      minStock: 10,
      costPrice: it.unitPrice
    }));

    const newInvoice: Invoice = {
      id: `inv-sup-${Date.now()}`,
      invoiceNumber: invNumber,
      poId: po.id,
      poNumber: po.poNumber,
      isSupplierInvoice: true,
      type: 'Supplier',
      supplierId: currentSupplier.id,
      supplierName: currentSupplier.name,
      clientId: currentSupplier.id,
      clientName: currentSupplier.name,
      date: new Date().toISOString(),
      dueDate: invoiceFormData.dueDate,
      items: cartItems,
      subtotal: po.subtotal,
      discount: po.discount,
      discountRate: 0,
      tax: po.tax,
      taxRate: 5,
      freight: po.freight,
      otherCharges: po.otherCharges,
      total: po.total,
      status: 'Sent',
      amountPaid: 0,
      balance: po.total,
      terms: ['Net 30 Days', 'Bank Transfer Required'],
      notes: `${invoiceFormData.notes} | Bank: ${invoiceFormData.bankName}, Acc: ${invoiceFormData.accountNumber}, SWIFT: ${invoiceFormData.swiftCode}`
    };

    onUpdateInvoices([newInvoice, ...invoices]);

    onAddAuditLog?.('Supplier Invoice Issued', `Supplier ${currentSupplier.name} generated invoice ${newInvoice.invoiceNumber}`, 'accounting', 'success');

    addNotification({
      title: 'Supplier Invoice Generated',
      message: `Invoice ${newInvoice.invoiceNumber} for ${formatCurrency(newInvoice.total)} generated successfully.`,
      type: 'success',
      category: 'accounting'
    });

    setSelectedPoForInvoice(null);
  };

  const isRoleLocked = currentUser.role === 'Supplier' || currentUser.role === 'Outsourced Partner';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Partner Identity Header */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300 shadow-inner">
              {currentUser.role === 'Outsourced Partner' ? <Briefcase size={28} /> : <Building2 size={28} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">{currentSupplier.name}</h1>
                <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-200 border border-rose-400/30">
                  {currentUser.role === 'Outsourced Partner' ? 'Outsourced Service Partner' : 'Certified Supplier'}
                </span>
              </div>
              <p className="text-xs text-rose-200/80 mt-1 flex items-center gap-4">
                <span className="flex items-center gap-1"><User size={13} /> {currentSupplier.contactPerson}</span>
                <span className="flex items-center gap-1"><Mail size={13} /> {currentSupplier.email}</span>
                <span className="flex items-center gap-1"><Phone size={13} /> {currentSupplier.phone}</span>
              </p>
            </div>
          </div>

          {/* Supplier Selector for Admin / Testing Mode */}
          {!isRoleLocked && (
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 flex items-center gap-3">
              <span className="text-xs font-bold text-rose-100 flex items-center gap-1">
                <Eye size={14} /> Active Partner View:
              </span>
              <select
                value={selectedSupplierId}
                onChange={e => setSelectedSupplierId(e.target.value)}
                className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-rose-400/30 focus:outline-none cursor-pointer"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                ))}
              </select>
            </div>
          )}

          {isRoleLocked && (
            <div className="bg-rose-500/20 border border-rose-400/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-rose-200 flex items-center gap-1.5">
              <Lock size={13} /> Locked Portal Access
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <p className="text-[10px] font-bold text-rose-200 uppercase tracking-wider">Active RFQs</p>
            <p className="text-xl font-black mt-1">{supplierRfqs.length}</p>
          </div>
          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <p className="text-[10px] font-bold text-rose-200 uppercase tracking-wider">Submitted Quotes</p>
            <p className="text-xl font-black mt-1 text-amber-300">{myQuotations.length}</p>
          </div>
          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <p className="text-[10px] font-bold text-rose-200 uppercase tracking-wider">Awarded POs</p>
            <p className="text-xl font-black mt-1 text-emerald-300">{myOrders.length}</p>
          </div>
          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <p className="text-[10px] font-bold text-rose-200 uppercase tracking-wider">Invoices Issued</p>
            <p className="text-xl font-black mt-1 text-purple-300">{myInvoices.length}</p>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('rfqs')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === 'rfqs' ? "bg-rose-600 text-white shadow-md shadow-rose-600/20" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            )}
          >
            <Send size={15} /> Company RFQs ({supplierRfqs.length})
          </button>
          <button
            onClick={() => setActiveTab('quotations')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === 'quotations' ? "bg-rose-600 text-white shadow-md shadow-rose-600/20" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            )}
          >
            <FileText size={15} /> My Quotations ({myQuotations.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === 'orders' ? "bg-rose-600 text-white shadow-md shadow-rose-600/20" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            )}
          >
            <FileCheck size={15} /> Awarded POs ({myOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('dispatch')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === 'dispatch' ? "bg-rose-600 text-white shadow-md shadow-rose-600/20" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            )}
          >
            <Truck size={15} /> Dispatch & Shipping
          </button>
          <button
            onClick={() => setActiveTab('grn')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === 'grn' ? "bg-rose-600 text-white shadow-md shadow-rose-600/20" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            )}
          >
            <PackageCheck size={15} /> Goods Received & Discrepancies
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === 'invoices' ? "bg-rose-600 text-white shadow-md shadow-rose-600/20" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            )}
          >
            <Receipt size={15} /> Invoices & Billing ({myInvoices.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search RFQs, POs, Invoices..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-rose-500 shadow-2xs"
          />
        </div>
      </div>

      {/* TAB 1: COMPANY RFQs */}
      {activeTab === 'rfqs' && (
        <div className="space-y-4">
          <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-rose-950">Company Requests for Quotations (RFQs)</h3>
              <p className="text-xs text-rose-700/80">Review requested materials/services, offer itemized pricing, apply discounts & shipping costs.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supplierRfqs
              .filter(r => r.rfqNumber.toLowerCase().includes(searchQuery.toLowerCase()) || r.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())))
              .map(rfq => {
                const existingQuote = myQuotations.find(q => q.rfqId === rfq.id);
                return (
                  <div key={rfq.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs hover:shadow-md transition-all space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-gray-900">{rfq.rfqNumber}</span>
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            rfq.status === 'Sent' ? "bg-blue-100 text-blue-800 border border-blue-200" :
                            rfq.status === 'Completed' ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                            "bg-gray-100 text-gray-700"
                          )}>
                            {rfq.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-3">
                          <span className="flex items-center gap-1"><Calendar size={12} /> Issued: {new Date(rfq.date).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1 text-rose-600 font-bold"><Clock size={12} /> Deadline: {rfq.deadline}</span>
                        </p>
                      </div>

                      {existingQuote ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1">
                          <CheckCircle2 size={13} /> Quote Submitted
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenSubmitQuote(rfq)}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5"
                        >
                          <Send size={13} /> Submit Quotation
                        </button>
                      )}
                    </div>

                    {/* Line Items Table */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200/80">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Requested Line Items ({rfq.items.length})</p>
                      <div className="space-y-1.5">
                        {rfq.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-200/50 last:border-0">
                            <span className="font-semibold text-gray-800">{it.name}</span>
                            <span className="font-bold text-gray-600">{it.quantity} {it.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {rfq.notes && (
                      <p className="text-xs text-gray-500 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                        <strong className="text-amber-800">Company Note:</strong> {rfq.notes}
                      </p>
                    )}
                  </div>
                );
              })}

            {supplierRfqs.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-gray-200">
                <Send size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-bold text-gray-600">No Active RFQs Found</p>
                <p className="text-xs text-gray-400">There are currently no open requests for quotations from the company.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY QUOTATIONS */}
      {activeTab === 'quotations' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Submitted Quotations</h3>
              <span className="text-xs font-bold text-gray-500">{myQuotations.length} total quotes</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">Quote #</th>
                    <th className="p-3.5">RFQ Ref</th>
                    <th className="p-3.5">Date Submitted</th>
                    <th className="p-3.5">Items Total</th>
                    <th className="p-3.5">Discount</th>
                    <th className="p-3.5">Freight</th>
                    <th className="p-3.5">Grand Total</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium text-gray-800">
                  {myQuotations.map(q => (
                    <tr key={q.id} className="hover:bg-gray-50/50">
                      <td className="p-3.5 font-bold text-rose-600">{q.quotationNumber}</td>
                      <td className="p-3.5 text-gray-600">{q.rfqNumber || 'Direct Quote'}</td>
                      <td className="p-3.5">{new Date(q.date).toLocaleDateString()}</td>
                      <td className="p-3.5 font-bold">{formatCurrency(q.subtotal, companySettings.currency)}</td>
                      <td className="p-3.5 text-emerald-600 font-bold">-{formatCurrency(q.discount, companySettings.currency)}</td>
                      <td className="p-3.5 font-semibold">{formatCurrency(q.freight, companySettings.currency)}</td>
                      <td className="p-3.5 font-black text-gray-900">{formatCurrency(q.total, companySettings.currency)}</td>
                      <td className="p-3.5">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                          q.status === 'Accepted' ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                          q.status === 'Rejected' ? "bg-rose-100 text-rose-800 border border-rose-300" :
                          "bg-amber-100 text-amber-800 border border-amber-300"
                        )}>
                          {q.status === 'Accepted' ? 'Awarded' : q.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {myQuotations.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400 font-medium">
                        No quotations submitted yet. Click "Submit Quotation" on an active RFQ to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AWARDED PURCHASE ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myOrders
              .filter(po => po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(po => (
                <div key={po.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-gray-900">{po.poNumber}</span>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          po.status === 'Sent' ? "bg-blue-100 text-blue-800 border border-blue-200" :
                          po.status === 'Received' ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                          "bg-amber-100 text-amber-800 border border-amber-200"
                        )}>
                          {po.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                        <span>Issued: {new Date(po.date).toLocaleDateString()}</span>
                        {po.deliveryDate && <span className="font-bold text-slate-700">Due: {po.deliveryDate}</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedPoForDownload(po)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
                        title="View and Download Purchase Order"
                      >
                        <Download size={13} /> Download PO
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs space-y-2">
                    <div className="flex justify-between items-center text-gray-500 font-bold uppercase text-[10px]">
                      <span>Item Description</span>
                      <span>Qty x Price</span>
                    </div>
                    {po.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center font-medium">
                        <span>{it.name}</span>
                        <span className="font-bold text-gray-800">{it.quantity} x {formatCurrency(it.unitPrice, companySettings.currency)}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-200 flex justify-between items-center font-black text-sm text-gray-900">
                      <span>Total Order Amount:</span>
                      <span className="text-rose-600">{formatCurrency(po.total, companySettings.currency)}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => handleOpenDispatch(po)}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5"
                    >
                      <Truck size={13} /> Dispatch Shipment
                    </button>

                    <button
                      onClick={() => {
                        setSelectedPoForInvoice(po);
                        setInvoiceFormData(prev => ({
                          ...prev,
                          supplierInvoiceNumber: `INV-SUP-${po.poNumber.replace('PO-', '')}`
                        }));
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                    >
                      <Receipt size={13} /> Issue Invoice
                    </button>
                  </div>
                </div>
              ))}

            {myOrders.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-gray-200">
                <FileCheck size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-bold text-gray-600">No Awarded POs Yet</p>
                <p className="text-xs text-gray-400">Once the company approves your quotation, official Purchase Orders will appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DISPATCH & SHIPPING */}
      {activeTab === 'dispatch' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Truck size={16} className="text-rose-600" /> Dispatched Shipments & Waybills
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="p-3">PO #</th>
                    <th className="p-3">Tracking / Waybill</th>
                    <th className="p-3">Driver / Transport</th>
                    <th className="p-3">Dispatch Date</th>
                    <th className="p-3">ETA</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium text-gray-800">
                  {myOrders.filter(p => p.dispatchInfo).map(po => (
                    <tr key={po.id} className="hover:bg-gray-50/50">
                      <td className="p-3 font-bold text-rose-600">{po.poNumber}</td>
                      <td className="p-3 font-bold">{po.dispatchInfo?.trackingNumber || po.dispatchInfo?.waybillNumber || 'N/A'}</td>
                      <td className="p-3">{po.dispatchInfo?.courierOrDriver} ({po.dispatchInfo?.vehiclePlate || 'N/A'})</td>
                      <td className="p-3">{po.dispatchInfo?.dispatchedDate ? new Date(po.dispatchInfo.dispatchedDate).toLocaleDateString() : 'N/A'}</td>
                      <td className="p-3 font-semibold text-rose-700">{po.dispatchInfo?.estimatedArrival || 'Pending'}</td>
                      <td className="p-3">
                        <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                          In Transit
                        </span>
                      </td>
                    </tr>
                  ))}

                  {myOrders.filter(p => p.dispatchInfo).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400 font-medium">
                        No shipments dispatched yet. Select an awarded PO under "Awarded POs" and click "Dispatch Shipment".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GOODS RECEIVED & DISCREPANCIES */}
      {activeTab === 'grn' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <PackageCheck size={16} className="text-emerald-600" /> Warehouse Receiving Reports (GRNs)
                </h3>
                <p className="text-xs text-gray-500">Review warehouse receiving quantities, quality inspection notes, and share POD / reference documents.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {myOrders.map(po => {
                const totalOrdered = po.items.reduce((s, i) => s + i.quantity, 0);
                const totalReceived = po.items.reduce((s, i) => s + (i.receivedQuantity || 0), 0);
                const hasDiscrepancy = totalReceived > 0 && totalReceived < totalOrdered;

                return (
                  <div key={po.id} className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 text-sm">{po.poNumber}</span>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          po.status === 'Received' ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                          hasDiscrepancy ? "bg-rose-100 text-rose-800 border border-rose-300" :
                          "bg-amber-100 text-amber-800 border border-amber-300"
                        )}>
                          {po.status === 'Received' ? 'Fully Received' : hasDiscrepancy ? 'Deficit / Shortage' : 'Awaiting Warehouse Receipt'}
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedPoForDocument(po)}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
                      >
                        <Upload size={13} /> Share Reference / Document
                      </button>
                    </div>

                    {/* Breakdown per line item */}
                    <div className="bg-white rounded-xl p-3 border border-gray-200 text-xs space-y-2">
                      <div className="grid grid-cols-4 font-bold text-gray-500 text-[10px] uppercase border-b border-gray-100 pb-1">
                        <span>Item Name</span>
                        <span>Ordered Qty</span>
                        <span>Received Qty</span>
                        <span>Status</span>
                      </div>
                      {po.items.map((it, idx) => (
                        <div key={idx} className="grid grid-cols-4 items-center">
                          <span className="font-semibold text-gray-800">{it.name}</span>
                          <span>{it.quantity} {it.unit || 'pcs'}</span>
                          <span className={cn("font-bold", (it.receivedQuantity || 0) < it.quantity ? "text-rose-600" : "text-emerald-600")}>
                            {it.receivedQuantity || 0} {it.unit || 'pcs'}
                          </span>
                          <span>
                            {(it.receivedQuantity || 0) >= it.quantity ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1"><CheckCircle2 size={12} /> Passed</span>
                            ) : (
                              <span className="text-rose-600 font-bold flex items-center gap-1"><AlertTriangle size={12} /> Shortfall</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Shared Supplier Documents */}
                    {po.supplierDocuments && po.supplierDocuments.length > 0 && (
                      <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 text-xs space-y-1">
                        <p className="font-bold text-blue-900 text-[11px]">Shared Proof & Reference Documents ({po.supplierDocuments.length})</p>
                        {po.supplierDocuments.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between text-blue-800 py-0.5">
                            <span className="font-semibold flex items-center gap-1"><FileText size={12} /> {doc.title} ({doc.documentType})</span>
                            <span className="text-[10px] text-blue-600">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: INVOICES & BILLING */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Generated Supplier Invoices</h3>
              <span className="text-xs font-bold text-gray-500">{myInvoices.length} total invoices</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">Invoice #</th>
                    <th className="p-3.5">PO Ref</th>
                    <th className="p-3.5">Issue Date</th>
                    <th className="p-3.5">Due Date</th>
                    <th className="p-3.5">Total Amount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium text-gray-800">
                  {myInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50/50">
                      <td className="p-3.5 font-bold text-emerald-600">{inv.invoiceNumber}</td>
                      <td className="p-3.5 text-gray-600">{inv.poNumber || 'Direct PO'}</td>
                      <td className="p-3.5">{new Date(inv.date).toLocaleDateString()}</td>
                      <td className="p-3.5 text-rose-700 font-semibold">{inv.dueDate}</td>
                      <td className="p-3.5 font-black text-gray-900">{formatCurrency(inv.total, companySettings.currency)}</td>
                      <td className="p-3.5">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                          inv.status === 'Paid' ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                          "bg-amber-100 text-amber-800 border border-amber-300"
                        )}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedInvoiceForDownload(inv)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-xl transition-all inline-flex items-center gap-1"
                        >
                          <Download size={13} /> Print / Download
                        </button>
                      </td>
                    </tr>
                  ))}

                  {myInvoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400 font-medium">
                        No invoices generated yet. Select an awarded PO under "Awarded POs" and click "Issue Invoice".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: SUBMIT QUOTATION MODAL */}
      {isSubmitQuoteOpen && selectedRfqForQuote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-gray-100 my-8">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-lg font-black text-gray-900">Submit Quotation & Offer Pricing</h3>
                <p className="text-xs text-gray-500">RFQ Ref: {selectedRfqForQuote.rfqNumber} • Issued by Company</p>
              </div>
              <button onClick={() => setIsSubmitQuoteOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitQuotation} className="space-y-4 text-xs">
              {/* Line Items Offer Price Input */}
              <div className="space-y-3">
                <label className="font-bold text-gray-700 block uppercase text-[10px] tracking-wider">Itemized Pricing Offers *</label>
                {quoteFormData.items.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-2xl border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{item.name}</span>
                      <span className="font-bold text-gray-600">Qty Needed: {item.quantity} {item.unit}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500">Offer Unit Price ({companySettings.currency}) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.unitPrice || ''}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...quoteFormData.items];
                            updated[idx].unitPrice = val;
                            setQuoteFormData({ ...quoteFormData, items: updated });
                          }}
                          placeholder="e.g. 15.50"
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl font-bold focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-500">Delivery Lead Time</label>
                        <input
                          type="text"
                          value={item.leadTime}
                          onChange={e => {
                            const updated = [...quoteFormData.items];
                            updated[idx].leadTime = e.target.value;
                            setQuoteFormData({ ...quoteFormData, items: updated });
                          }}
                          placeholder="e.g. 3-5 business days"
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl font-medium focus:border-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Discounts & Additional Costs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Special Discount Offer</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="0.01"
                      value={quoteFormData.discount || ''}
                      onChange={e => setQuoteFormData({ ...quoteFormData, discount: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                    />
                    <select
                      value={quoteFormData.discountType}
                      onChange={e => setQuoteFormData({ ...quoteFormData, discountType: e.target.value as any })}
                      className="bg-gray-100 border border-gray-200 rounded-xl font-bold text-xs px-2 cursor-pointer"
                    >
                      <option value="amount">{companySettings.currency}</option>
                      <option value="percent">%</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Transportation / Freight ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={quoteFormData.freight || ''}
                    onChange={e => setQuoteFormData({ ...quoteFormData, freight: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Other Costs / Duties ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={quoteFormData.otherCharges || ''}
                    onChange={e => setQuoteFormData({ ...quoteFormData, otherCharges: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 10"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Quote Validity & Terms */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Quote Valid Until *</label>
                  <input
                    type="date"
                    required
                    value={quoteFormData.validUntil}
                    onChange={e => setQuoteFormData({ ...quoteFormData, validUntil: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Reference Attachment / Spec Link</label>
                  <input
                    type="text"
                    value={quoteFormData.attachmentsUrl}
                    onChange={e => setQuoteFormData({ ...quoteFormData, attachmentsUrl: e.target.value })}
                    placeholder="https://catalog.vendor.com/specs.pdf"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Supplier Notes & Terms</label>
                <textarea
                  rows={2}
                  value={quoteFormData.notes}
                  onChange={e => setQuoteFormData({ ...quoteFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitQuoteOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-rose-600/20"
                >
                  Send Quotation to Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DISPATCH SHIPMENT MODAL */}
      {selectedPoForDispatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-base font-black text-gray-900">Log Shipment Dispatch</h3>
                <p className="text-xs text-gray-500">PO Ref: {selectedPoForDispatch.poNumber}</p>
              </div>
              <button onClick={() => setSelectedPoForDispatch(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitDispatch} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Courier / Driver Name *</label>
                  <input
                    type="text"
                    required
                    value={dispatchFormData.courierOrDriver}
                    onChange={e => setDispatchFormData({ ...dispatchFormData, courierOrDriver: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Vehicle Plate Number</label>
                  <input
                    type="text"
                    value={dispatchFormData.vehiclePlate}
                    onChange={e => setDispatchFormData({ ...dispatchFormData, vehiclePlate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tracking Number *</label>
                  <input
                    type="text"
                    required
                    value={dispatchFormData.trackingNumber}
                    onChange={e => setDispatchFormData({ ...dispatchFormData, trackingNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Waybill Number *</label>
                  <input
                    type="text"
                    required
                    value={dispatchFormData.waybillNumber}
                    onChange={e => setDispatchFormData({ ...dispatchFormData, waybillNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Estimated Arrival Date *</label>
                <input
                  type="date"
                  required
                  value={dispatchFormData.estimatedArrival}
                  onChange={e => setDispatchFormData({ ...dispatchFormData, estimatedArrival: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Dispatch Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={dispatchFormData.notes}
                  onChange={e => setDispatchFormData({ ...dispatchFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPoForDispatch(null)}
                  className="px-4 py-2 rounded-xl font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl shadow-md shadow-rose-600/20"
                >
                  Confirm Goods Dispatched
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SHARE REFERENCE DOCUMENT MODAL */}
      {selectedPoForDocument && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-base font-black text-gray-900">Share Reference / Proof Document</h3>
                <p className="text-xs text-gray-500">Attach POD, signed receipt, or discrepancy note for {selectedPoForDocument.poNumber}</p>
              </div>
              <button onClick={() => setSelectedPoForDocument(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleShareDocument} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={documentFormData.title}
                  onChange={e => setDocumentFormData({ ...documentFormData, title: e.target.value })}
                  placeholder="e.g. Signed Driver Waybill Receipt"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Document Category *</label>
                <select
                  value={documentFormData.documentType}
                  onChange={e => setDocumentFormData({ ...documentFormData, documentType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold cursor-pointer"
                >
                  <option value="Proof of Delivery">Proof of Delivery (POD)</option>
                  <option value="Waybill">Waybill / Dispatch Slip</option>
                  <option value="Test Certificate">Quality Test Certificate</option>
                  <option value="Discrepancy Note">Discrepancy / Shortage Statement</option>
                  <option value="Other">Other Reference File</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Document URL / Reference Link</label>
                <input
                  type="text"
                  value={documentFormData.fileUrl}
                  onChange={e => setDocumentFormData({ ...documentFormData, fileUrl: e.target.value })}
                  placeholder="https://storage.supplier.com/pod-receipt.pdf"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Notes & Explanation</label>
                <textarea
                  rows={2}
                  value={documentFormData.notes}
                  onChange={e => setDocumentFormData({ ...documentFormData, notes: e.target.value })}
                  placeholder="Provide details about the document or clarify quantity received..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPoForDocument(null)}
                  className="px-4 py-2 rounded-xl font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl"
                >
                  Share Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ISSUE INVOICE MODAL */}
      {selectedPoForInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-base font-black text-gray-900">Generate Official Supplier Invoice</h3>
                <p className="text-xs text-gray-500">For PO #{selectedPoForInvoice.poNumber} • Total: {formatCurrency(selectedPoForInvoice.total, companySettings.currency)}</p>
              </div>
              <button onClick={() => setSelectedPoForInvoice(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGenerateInvoice} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Supplier Invoice # *</label>
                  <input
                    type="text"
                    required
                    value={invoiceFormData.supplierInvoiceNumber}
                    onChange={e => setInvoiceFormData({ ...invoiceFormData, supplierInvoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Payment Due Date *</label>
                  <input
                    type="date"
                    required
                    value={invoiceFormData.dueDate}
                    onChange={e => setInvoiceFormData({ ...invoiceFormData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Supplier Tax ID / VAT Number</label>
                <input
                  type="text"
                  value={invoiceFormData.taxId}
                  onChange={e => setInvoiceFormData({ ...invoiceFormData, taxId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                />
              </div>

              {/* Bank Details for Wire Transfer */}
              <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 space-y-2">
                <p className="font-bold text-emerald-900 text-[11px] uppercase tracking-wider">Bank Payment Remittance Info</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-emerald-800">Bank Name</label>
                    <input
                      type="text"
                      value={invoiceFormData.bankName}
                      onChange={e => setInvoiceFormData({ ...invoiceFormData, bankName: e.target.value })}
                      className="w-full px-2.5 py-1 bg-white border border-emerald-200 rounded-xl font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-emerald-800">Account Number</label>
                    <input
                      type="text"
                      value={invoiceFormData.accountNumber}
                      onChange={e => setInvoiceFormData({ ...invoiceFormData, accountNumber: e.target.value })}
                      className="w-full px-2.5 py-1 bg-white border border-emerald-200 rounded-xl font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPoForInvoice(null)}
                  className="px-4 py-2 rounded-xl font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-md shadow-emerald-600/20"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: PRINT / DOWNLOAD PURCHASE ORDER */}
      {selectedPoForDownload && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 space-y-6 shadow-2xl border border-gray-100 my-8">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  PO
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Purchase Order: {selectedPoForDownload.poNumber}</h3>
                  <p className="text-xs text-gray-500">Official Procurement Document</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                >
                  <Printer size={14} /> Print / Save PDF
                </button>
                <button onClick={() => setSelectedPoForDownload(null)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="space-y-6 text-xs text-gray-800">
              <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                <div>
                  <h4 className="font-black text-gray-900 text-sm uppercase">{companySettings.name}</h4>
                  <p className="text-gray-500">{companySettings.address}</p>
                  <p className="text-gray-500">Email: {companySettings.email} | Tel: {companySettings.phones[0]}</p>
                  <p className="text-gray-500">Tax ID: {companySettings.taxId || 'TAX-881920'}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-[10px] uppercase">
                    Status: {selectedPoForDownload.status}
                  </span>
                  <p className="mt-2 font-bold">PO Date: {new Date(selectedPoForDownload.date).toLocaleDateString()}</p>
                  <p className="text-gray-500">Due Date: {selectedPoForDownload.deliveryDate || 'Standard'}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vendor / Supplier</p>
                  <p className="font-black text-sm text-gray-900 mt-1">{selectedPoForDownload.supplierName}</p>
                  <p className="text-gray-600">{currentSupplier.address}</p>
                  <p className="text-gray-600">{currentSupplier.email} | {currentSupplier.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ship To Destination</p>
                  <p className="font-black text-sm text-gray-900 mt-1">{companySettings.name} Central Depot</p>
                  <p className="text-gray-600">Receiving Bay #3, Botanical Logistics Park</p>
                  <p className="text-gray-600">Attention: Receiving Manager</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 font-medium">
                    {selectedPoForDownload.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-bold text-gray-400">{idx + 1}</td>
                        <td className="p-3 font-bold text-gray-900">{it.name}</td>
                        <td className="p-3 text-center font-bold">{it.quantity} {it.unit || 'pcs'}</td>
                        <td className="p-3 text-right">{formatCurrency(it.unitPrice, companySettings.currency)}</td>
                        <td className="p-3 text-right font-black">{formatCurrency(it.total, companySettings.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal:</span>
                    <span className="font-bold">{formatCurrency(selectedPoForDownload.subtotal, companySettings.currency)}</span>
                  </div>
                  {selectedPoForDownload.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span className="font-bold">-{formatCurrency(selectedPoForDownload.discount, companySettings.currency)}</span>
                    </div>
                  )}
                  {selectedPoForDownload.freight > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Freight/Shipping:</span>
                      <span className="font-bold">{formatCurrency(selectedPoForDownload.freight, companySettings.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-300 font-black text-sm text-gray-900">
                    <span>Total PO Value:</span>
                    <span className="text-rose-600">{formatCurrency(selectedPoForDownload.total, companySettings.currency)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 flex justify-between items-end text-gray-400 text-[10px]">
                <div>
                  <p className="font-bold text-gray-700">Authorized Officer Signature</p>
                  <div className="h-10 border-b border-gray-300 w-48 mt-1" />
                  <p className="mt-1">Flora Procurement Dept</p>
                </div>
                <div className="text-right">
                  <p>Computer Generated PO Document</p>
                  <p>Flora Operations Suite • {new Date().toISOString().split('T')[0]}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: PRINT / DOWNLOAD INVOICE */}
      {selectedInvoiceForDownload && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 space-y-6 shadow-2xl border border-gray-100 my-8">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  INV
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Supplier Invoice: {selectedInvoiceForDownload.invoiceNumber}</h3>
                  <p className="text-xs text-gray-500">Billing Document issued to {companySettings.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Printer size={14} /> Print / Save PDF
                </button>
                <button onClick={() => setSelectedInvoiceForDownload(null)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Invoice Body */}
            <div className="space-y-6 text-xs text-gray-800">
              <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                <div>
                  <h4 className="font-black text-emerald-900 text-sm uppercase">{currentSupplier.name}</h4>
                  <p className="text-gray-500">{currentSupplier.address}</p>
                  <p className="text-gray-500">Email: {currentSupplier.email} | Phone: {currentSupplier.phone}</p>
                  <p className="text-gray-500">Tax ID: {currentSupplier.taxId || 'TAX-SUP-9981'}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full text-[10px] uppercase">
                    Status: {selectedInvoiceForDownload.status}
                  </span>
                  <p className="mt-2 font-bold">Invoice Date: {new Date(selectedInvoiceForDownload.date).toLocaleDateString()}</p>
                  <p className="text-rose-600 font-bold">Due Date: {selectedInvoiceForDownload.dueDate}</p>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Item Name</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 font-medium">
                    {selectedInvoiceForDownload.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-bold text-gray-900">{it.name}</td>
                        <td className="p-3 text-center font-bold">{it.quantity}</td>
                        <td className="p-3 text-right">{formatCurrency(it.price, companySettings.currency)}</td>
                        <td className="p-3 text-right font-black">{formatCurrency(it.price * it.quantity, companySettings.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Invoice Totals & Remittance */}
              <div className="grid grid-cols-2 gap-4 items-start">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-gray-600 text-[11px] space-y-1">
                  <p className="font-bold text-gray-900 uppercase text-[10px]">Remittance Bank Details</p>
                  <p>{selectedInvoiceForDownload.notes}</p>
                </div>

                <div className="space-y-1.5 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 text-right">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal:</span>
                    <span className="font-bold">{formatCurrency(selectedInvoiceForDownload.subtotal, companySettings.currency)}</span>
                  </div>
                  {selectedInvoiceForDownload.freight > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Freight:</span>
                      <span className="font-bold">{formatCurrency(selectedInvoiceForDownload.freight, companySettings.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-emerald-200 font-black text-sm text-gray-900">
                    <span>Total Due:</span>
                    <span className="text-emerald-700">{formatCurrency(selectedInvoiceForDownload.total, companySettings.currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
