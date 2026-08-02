import React, { useState, useRef } from 'react';
import { 
  Plus, Trash2, FileText, Send, Printer, Download, User, Save, History, 
  Search, X, Package, Check, Landmark, FileDown, Receipt, ShoppingBag, 
  UserPlus, ExternalLink, AlertCircle, RefreshCw, CreditCard, Mail, Phone, 
  MapPin, Upload, Filter, Eye, DollarSign
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { FINISHED_PRODUCTS, MOCK_CLIENTS, INITIAL_SETTINGS, INITIAL_TERMS } from '../../constants';
import { Quotation, CartItem, Client, FinishedProduct, CompanySettings, Invoice, Transaction, Order } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import QuotationPrintView from './QuotationPrintView';
import ConfirmModal from '../layout/ConfirmModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { handleHtml2CanvasClone } from '../../lib/pdf-utils';
import PrintPortal from '../layout/PrintPortal';
import { useNotifications } from '../../context/NotificationContext';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { translations, Language } from '../../i18n';

interface QuotationSystemProps {
  companySettings: CompanySettings;
  onUpdateSettings?: (settings: CompanySettings) => void;
  quotations: Quotation[];
  onUpdateQuotations: (quotations: Quotation[]) => void;
  onConvertToInvoice?: (quotation: Quotation) => void;
  onConvertToOrder?: (quotation: Quotation) => void;
  onAddAuditLog?: (action: string, details: string, category: any, type?: any) => void;
  language?: Language;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clients: Client[];
  onUpdateClients?: (clients: Client[]) => void;
  selectedClient?: Client | null;
  onSelectClient?: (client: Client | null) => void;
  onNavigateToCustomerPortal?: (client?: Client | null) => void;
  invoices?: Invoice[];
  transactions?: Transaction[];
  orders?: Order[];
  finishedProducts: FinishedProduct[];
}

export default function QuotationSystem({ 
  companySettings, 
  onUpdateSettings, 
  quotations, 
  onUpdateQuotations,
  onConvertToInvoice,
  onConvertToOrder,
  onAddAuditLog,
  language = 'en',
  searchQuery,
  setSearchQuery,
  clients,
  onUpdateClients,
  selectedClient: propSelectedClient,
  onSelectClient,
  onNavigateToCustomerPortal,
  invoices = [],
  transactions = [],
  orders = [],
  finishedProducts
}: QuotationSystemProps) {
  const t = translations[language];
  const { addNotification } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [items, setItems] = useState<CartItem[]>([]);
  const [localSelectedClient, setLocalSelectedClient] = useState<Client | null>(propSelectedClient || null);

  // Sync propSelectedClient if provided
  const selectedClient = propSelectedClient !== undefined ? propSelectedClient : localSelectedClient;
  const setSelectedClient = (client: Client | null) => {
    setLocalSelectedClient(client);
    onSelectClient?.(client);
  };

  const [quoteNumber, setQuoteNumber] = useState(`Q${Math.floor(100000 + Math.random() * 900000)}`);
  const [showPrintPortal, setShowPrintPortal] = useState(false);
  const [view, setView] = useState<'builder' | 'history'>('builder');
  
  // Modals
  const [isProductPortalOpen, setIsProductPortalOpen] = useState(false);
  const [isSelectClientModalOpen, setIsSelectClientModalOpen] = useState(false);
  const [isRegisterClientOpen, setIsRegisterClientOpen] = useState(false);
  const [isCustomerDetailModalOpen, setIsCustomerDetailModalOpen] = useState(false);
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  
  const [clientSearch, setClientSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [terms, setTerms] = useState<string[]>(companySettings.terms.map(t => t.text));
  const [selectedBankId, setSelectedBankId] = useState<string>(companySettings.bankDetails[0]?.id || '');
  const [newTerm, setNewTerm] = useState('');
  const [taxRate, setTaxRate] = useState(companySettings.defaultTaxRate);
  const [discountRate, setDiscountRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [freight, setFreight] = useState(0);
  const [otherChargesList, setOtherChargesList] = useState<{ id: string; description: string; amount: number; }[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [advancePercentage, setAdvancePercentage] = useState<number>(30);
  const [attachments, setAttachments] = useState<string[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  // Registration Form State
  const [regFormData, setRegFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    creditLimit: 50000,
    isBlacklisted: false,
    notes: '',
    image: ''
  });
  const regFileInputRef = useRef<HTMLInputElement>(null);

  // Custom Item Form State
  const [customItem, setCustomItem] = useState({
    name: '',
    price: 0,
    quantity: 1,
    category: 'Custom Service'
  });

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.city?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const filteredQuotations = quotations.filter(q => 
    q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
    q.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addItem = (product: FinishedProduct) => {
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      setItems(items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { ...product, quantity: 1 } as CartItem]);
    }
  };

  const addCustomItem = () => {
    if (!customItem.name.trim()) {
      addNotification({
        title: 'Validation Error',
        message: 'Please enter custom item name',
        type: 'error',
        category: 'sales'
      });
      return;
    }

    const newItem: CartItem = {
      id: `custom-${Date.now()}`,
      name: customItem.name,
      price: Number(customItem.price) || 0,
      quantity: Number(customItem.quantity) || 1,
      category: customItem.category || 'Custom Service',
      description: 'Custom quotation item',
      stock: 9999,
      minStock: 0,
      costPrice: Number(customItem.price) || 0
    };

    setItems([...items, newItem]);
    setCustomItem({ name: '', price: 0, quantity: 1, category: 'Custom Service' });
    setIsCustomItemModalOpen(false);
    addNotification({
      title: 'Item Added',
      message: `Custom item "${newItem.name}" added to quotation.`,
      type: 'success',
      category: 'sales'
    });
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const addTerm = () => {
    if (!newTerm.trim()) return;
    const updatedTerms = [...terms, newTerm];
    setTerms(updatedTerms);
    setNewTerm('');
  };

  const saveTermGlobally = (termText: string) => {
    if (onUpdateSettings) {
      const newTermObj = { id: Date.now().toString(), text: termText };
      onUpdateSettings({
        ...companySettings,
        terms: [...companySettings.terms, newTermObj]
      });
      addNotification({
        title: 'Settings Updated',
        message: 'Term saved to company defaults!',
        type: 'success',
        category: 'system'
      });
    }
  };

  const removeTerm = (index: number) => {
    setTerms(terms.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const calculatedDiscount = discountRate > 0 ? (subtotal * (discountRate / 100)) : discount;
  const taxableAmount = Math.max(0, subtotal - calculatedDiscount);
  const tax = taxableAmount * (taxRate / 100);
  const otherChargesTotal = otherChargesList.reduce((sum, charge) => sum + charge.amount, 0);
  const total = taxableAmount + tax + freight + otherChargesTotal;

  const currentQuotation: Quotation = {
    id: Date.now().toString(),
    quoteNumber,
    clientId: selectedClient?.id || 'GUEST',
    clientName: selectedClient?.name || 'Guest Customer',
    date: new Date().toLocaleDateString(),
    items,
    subtotal,
    tax,
    taxRate,
    discount: calculatedDiscount,
    discountRate,
    freight,
    otherCharges: otherChargesTotal,
    otherChargesList,
    total,
    status: 'Draft',
    terms,
    bankId: selectedBankId,
    advancePercentage,
    attachments
  };

  const handleRegImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRegFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterClient = () => {
    if (!regFormData.name.trim()) {
      addNotification({
        title: 'Validation Error',
        message: 'Client name is required',
        type: 'error',
        category: 'clients'
      });
      return;
    }

    const newClient: Client = {
      id: `c-${Date.now()}`,
      name: regFormData.name,
      email: regFormData.email || 'N/A',
      phone: regFormData.phone || 'N/A',
      address: regFormData.address || 'N/A',
      city: regFormData.city || 'N/A',
      creditLimit: Number(regFormData.creditLimit) || 0,
      isBlacklisted: regFormData.isBlacklisted,
      notes: regFormData.notes || '',
      image: regFormData.image || ''
    };

    if (onUpdateClients) {
      onUpdateClients([...clients, newClient]);
    }
    
    setSelectedClient(newClient);
    onAddAuditLog?.('Customer Registered', `New customer "${newClient.name}" created and selected in Quotation Portal`, 'clients', 'success');
    addNotification({
      title: 'Customer Registered',
      message: `Customer "${newClient.name}" successfully added & selected for quotation.`,
      type: 'success',
      category: 'clients'
    });

    setIsRegisterClientOpen(false);
    setIsSelectClientModalOpen(false);
    setRegFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      creditLimit: 50000,
      isBlacklisted: false,
      notes: '',
      image: ''
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachments(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!selectedClient) {
      addNotification({
        title: 'Validation Error',
        message: 'Please select or register a client first',
        type: 'error',
        category: 'system'
      });
      return;
    }
    if (items.length === 0) {
      addNotification({
        title: 'Validation Error',
        message: 'Please add at least one item to the quotation',
        type: 'error',
        category: 'system'
      });
      return;
    }
    onUpdateQuotations([...quotations, currentQuotation]);
    onAddAuditLog?.('Quotation Created', `Quotation #${currentQuotation.quoteNumber} created for ${selectedClient.name}`, 'sales', 'success');
    addNotification({
      title: 'Quotation Saved',
      message: 'Quotation saved successfully!',
      type: 'success',
      category: 'sales'
    });
    setItems([]);
    setQuoteNumber(`Q${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleDeleteQuote = (id: string) => {
    setQuoteToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (quoteToDelete) {
      const updated = quotations.filter(q => q.id !== quoteToDelete);
      onUpdateQuotations(updated);
      onAddAuditLog?.('Quotation Deleted', `Deleted quotation ID: ${quoteToDelete}`, 'sales', 'danger');
      addNotification({
        title: 'Quotation Deleted',
        message: 'Quotation was successfully removed.',
        type: 'info',
        category: 'sales'
      });
      setQuoteToDelete(null);
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPDF(true);
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: handleHtml2CanvasClone
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Quotation_${quoteNumber}.pdf`);
      addNotification({
        title: 'PDF Exported',
        message: `Quotation #${quoteNumber} downloaded as PDF`,
        type: 'success',
        category: 'sales'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      addNotification({
        title: 'Export Failed',
        message: 'Failed to generate PDF document.',
        type: 'error',
        category: 'system'
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleExportDOCX = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: companySettings.name, bold: true, size: 32 }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `QUOTATION #${quoteNumber}`, bold: true, size: 24, color: "0052CC" }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: `Date: ${new Date().toLocaleDateString()}` }),
          new Paragraph({ text: `Client: ${selectedClient?.name || 'Guest'}` }),
          new Paragraph({ text: `Email: ${selectedClient?.email || 'N/A'}` }),
          new Paragraph({ text: `Phone: ${selectedClient?.phone || 'N/A'}` }),
          new Paragraph({ text: " " }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Item", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Qty", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Price", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true })] })] }),
                ]
              }),
              ...items.map(item => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(item.name)] }),
                  new TableCell({ children: [new Paragraph(item.quantity.toString())] }),
                  new TableCell({ children: [new Paragraph(formatCurrency(item.price))] }),
                  new TableCell({ children: [new Paragraph(formatCurrency(item.price * item.quantity))] }),
                ]
              }))
            ]
          }),
          new Paragraph({ text: " " }),
          new Paragraph({ children: [new TextRun({ text: `Subtotal: ${formatCurrency(subtotal)}`, bold: true })] }),
          new Paragraph({ children: [new TextRun({ text: `Discount: -${formatCurrency(calculatedDiscount)}` })] }),
          new Paragraph({ children: [new TextRun({ text: `Tax (${taxRate}%): ${formatCurrency(tax)}` })] }),
          new Paragraph({ children: [new TextRun({ text: `Freight: ${formatCurrency(freight)}` })] }),
          new Paragraph({ children: [new TextRun({ text: `Grand Total: ${formatCurrency(total)}`, bold: true, size: 28, color: "0052CC" })] }),
          new Paragraph({ text: " " }),
          new Paragraph({ children: [new TextRun({ text: "Terms & Conditions:", bold: true })] }),
          ...terms.map(t => new Paragraph({ text: `• ${t}` })),
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Quotation_${quoteNumber}.docx`);
    addNotification({
      title: 'DOCX Exported',
      message: 'Quotation downloaded in Word format.',
      type: 'success',
      category: 'sales'
    });
  };

  const handleExportCSV = () => {
    const headers = ['Item Name', 'Category', 'Quantity', 'Unit Price', 'Total'];
    const rows = items.map(i => [
      `"${i.name}"`,
      `"${i.category || 'General'}"`,
      i.quantity,
      i.price,
      i.price * i.quantity
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Quotation_${quoteNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPortalProducts = finishedProducts.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.id.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Client stats calculation
  const getClientQuotesCount = (clientId: string) => quotations.filter(q => q.clientId === clientId).length;
  const getClientOrdersCount = (clientId: string) => orders.filter(o => o.clientId === clientId).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{t.quotationPortal || "Quotation Portal"}</h1>
            <p className="text-xs text-gray-500">Create, manage, and convert custom proposals into orders & invoices</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-gray-100 p-1 rounded-xl flex">
            <button 
              onClick={() => setView('builder')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                view === 'builder' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <FileText size={14} />
              Quotation Builder
            </button>
            <button 
              onClick={() => setView('history')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                view === 'history' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <History size={14} />
              History ({quotations.length})
            </button>
          </div>

          {view === 'builder' && (
            <button 
              onClick={() => setShowPrintPortal(true)}
              disabled={items.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              <Printer size={14} />
              Print Preview
            </button>
          )}
        </div>
      </div>

      {/* Main View Switcher */}
      {view === 'history' ? (
        /* History View */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search by quote # or client name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
              />
            </div>
            
            {quotations.length > 0 && (
              <button 
                onClick={() => setIsClearConfirmOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 size={14} />
                Clear History
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 uppercase">Quote #</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 uppercase">Client</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 uppercase">Date</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 uppercase">Items</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 uppercase">Total Amount</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-gray-400 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredQuotations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      No quotation records found
                    </td>
                  </tr>
                ) : (
                  filteredQuotations.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-primary">{q.quoteNumber}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{q.clientName}</td>
                      <td className="px-6 py-4 text-gray-500">{q.date}</td>
                      <td className="px-6 py-4 text-gray-500">{q.items.length} items</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(q.total)}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          q.status === 'Draft' && "bg-gray-100 text-gray-700",
                          q.status === 'Sent' && "bg-blue-100 text-blue-700",
                          q.status === 'Approved' && "bg-emerald-100 text-emerald-700",
                          q.status === 'Rejected' && "bg-red-100 text-red-700"
                        )}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {onConvertToOrder && (
                            <button 
                              onClick={() => onConvertToOrder(q)}
                              className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg font-bold text-[10px] transition-all flex items-center gap-1"
                              title="Convert to Managed Order"
                            >
                              <ShoppingBag size={12} />
                              Order
                            </button>
                          )}
                          {onConvertToInvoice && (
                            <button 
                              onClick={() => onConvertToInvoice(q)}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg font-bold text-[10px] transition-all flex items-center gap-1"
                              title="Convert to Invoice"
                            >
                              <Receipt size={12} />
                              Invoice
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteQuote(q.id)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Builder View */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Controls */}
          <div className="md:col-span-1 space-y-4">
            {/* ENHANCED CLIENT SELECTION & PROFILE CARD */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <User size={14} className="text-primary" />
                  Client Selection
                </h3>
                {selectedClient && (
                  <button 
                    onClick={() => setIsSelectClientModalOpen(true)}
                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <RefreshCw size={10} />
                    Change
                  </button>
                )}
              </div>

              {selectedClient ? (
                /* Selected Client Display Card */
                <div className="p-3 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent rounded-xl border border-primary/20 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden shrink-0">
                        {selectedClient.image ? (
                          <img src={selectedClient.image} alt={selectedClient.name} className="w-full h-full object-cover" />
                        ) : (
                          selectedClient.name.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 leading-tight">{selectedClient.name}</h4>
                        <p className="text-[10px] text-gray-500">{selectedClient.city || 'Standard Client'}</p>
                      </div>
                    </div>
                    {selectedClient.isBlacklisted && (
                      <span className="text-[8px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                        Blacklisted
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 pt-1 text-[10px] text-gray-600 border-t border-primary/10">
                    <div className="flex items-center gap-1.5">
                      <Mail size={11} className="text-gray-400 shrink-0" />
                      <span className="truncate">{selectedClient.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone size={11} className="text-gray-400 shrink-0" />
                      <span>{selectedClient.phone}</span>
                    </div>
                    {selectedClient.address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={11} className="text-gray-400 shrink-0" />
                        <span className="truncate">{selectedClient.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-primary/10 text-[10px]">
                    <span className="text-gray-500">Credit Limit:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(selectedClient.creditLimit || 0)}</span>
                  </div>

                  {/* Actions for Selected Client */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button 
                      onClick={() => setIsCustomerDetailModalOpen(true)}
                      className="py-1 px-2 bg-white border border-gray-200 text-gray-700 hover:border-primary hover:text-primary rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                    >
                      <Eye size={12} />
                      Profile
                    </button>
                    {onNavigateToCustomerPortal && (
                      <button 
                        onClick={() => onNavigateToCustomerPortal(selectedClient)}
                        className="py-1 px-2 bg-primary text-white hover:bg-primary/90 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all shadow-sm"
                      >
                        <ExternalLink size={12} />
                        Customer Portal
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Empty Client Selection State */
                <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 text-center space-y-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">No Client Selected</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Select an existing client or register a new customer profile.</p>
                  </div>
                  <div className="space-y-1.5">
                    <button 
                      onClick={() => setIsSelectClientModalOpen(true)}
                      className="w-full py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Search size={13} />
                      Select Existing Client
                    </button>
                    <button 
                      onClick={() => setIsRegisterClientOpen(true)}
                      className="w-full py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5"
                    >
                      <UserPlus size={13} />
                      + Register New Customer
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* PRODUCT CATALOG & CUSTOM ITEM ACCELERATOR */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <Package size={14} className="text-primary" />
                  Product & Custom Items
                </h3>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => setIsProductPortalOpen(true)}
                  className="w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Search size={14} className="text-gray-400" />
                    Open Product Catalog
                  </span>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {finishedProducts.length} items
                  </span>
                </button>

                <button 
                  onClick={() => setIsCustomItemModalOpen(true)}
                  className="w-full py-2 px-3 bg-amber-50/60 hover:bg-amber-100/60 border border-amber-200/60 rounded-xl text-xs font-bold text-amber-800 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Plus size={14} className="text-amber-600" />
                    Add Custom Non-Catalog Item
                  </span>
                  <span className="text-[9px] bg-amber-200/60 text-amber-900 px-1.5 py-0.5 rounded uppercase font-bold">
                    Custom
                  </span>
                </button>
              </div>
            </div>

            {/* Advance Payment Requirement Preset */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <Landmark size={14} className="text-primary" />
                Advance Payment Requirement
              </h3>
              <div className="grid grid-cols-4 gap-1.5">
                {[10, 30, 50, 100].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setAdvancePercentage(pct)}
                    className={cn(
                      "py-1.5 rounded-lg text-xs font-bold transition-all border",
                      advancePercentage === pct 
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    )}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-500">
                Required Advance: <span className="font-bold text-gray-900">{formatCurrency(total * (advancePercentage / 100))}</span>
              </p>
            </div>

            {/* Payment Bank Details */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <Landmark size={14} className="text-primary" />
                Bank Details for Payment
              </h3>
              <select 
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-primary"
              >
                {companySettings.bankDetails.map(bank => (
                  <option key={bank.id} value={bank.id}>
                    {bank.bankName} - {bank.accountNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* Quotation Terms Manager */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <FileText size={14} className="text-primary" />
                Terms & Conditions
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {terms.map((term, index) => (
                  <div key={index} className="flex items-start gap-2 p-1.5 bg-gray-50 rounded-lg text-[10px]">
                    <span className="flex-1 text-gray-700">{term}</span>
                    <button 
                      onClick={() => removeTerm(index)} 
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-1">
                <input 
                  type="text"
                  placeholder="Add custom term..."
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTerm()}
                  className="flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[10px] focus:outline-none focus:border-primary"
                />
                <button 
                  onClick={addTerm}
                  className="px-2.5 py-1 bg-primary text-white rounded-lg text-[10px] font-bold hover:bg-primary/90"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Quotation Document Builder Sheet */}
          <div className="md:col-span-3 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              {/* Document Header Controls */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Quote Reference #</label>
                    <input 
                      type="text" 
                      value={quoteNumber}
                      onChange={(e) => setQuoteNumber(e.target.value)}
                      className="text-sm font-bold text-primary bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleExportDOCX}
                    disabled={items.length === 0}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <FileDown size={14} />
                    Word (DOCX)
                  </button>
                  <button 
                    onClick={handleExportCSV}
                    disabled={items.length === 0}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <FileDown size={14} />
                    Excel (CSV)
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={items.length === 0}
                    className="px-4 py-1.5 bg-primary text-white hover:bg-primary/90 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-primary/20 disabled:opacity-50"
                  >
                    <Save size={14} />
                    Save Quotation
                  </button>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Line Items</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsCustomItemModalOpen(true)}
                      className="text-xs text-amber-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Custom Item
                    </button>
                    <span className="text-gray-300">|</span>
                    <button 
                      onClick={() => setIsProductPortalOpen(true)}
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Catalog Items
                    </button>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase">
                      <tr>
                        <th className="px-4 py-3">Item Description</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Unit Price</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                            No items added to quotation yet. Click catalog or custom item to add.
                          </td>
                        </tr>
                      ) : (
                        items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {item.name}
                              {item.id.startsWith('custom-') && (
                                <span className="ml-2 text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase font-bold">
                                  Custom
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-500">{item.category || 'Standard'}</td>
                            <td className="px-4 py-3 text-center">
                              <input 
                                type="number" 
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = Math.max(1, parseInt(e.target.value) || 1);
                                  setItems(items.map((it, idx) => idx === index ? { ...it, quantity: val } : it));
                                }}
                                className="w-14 px-1.5 py-0.5 border border-gray-200 rounded text-center text-xs font-bold focus:outline-none focus:border-primary bg-white"
                              />
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-gray-700">{formatCurrency(item.price)}</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</td>
                            <td className="px-4 py-3 text-center">
                              <button 
                                onClick={() => removeItem(index)}
                                className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Attachments & Calculations Footer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                {/* Attachments Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 uppercase">Drawings & Attachments</h4>
                  <div className="border border-dashed border-gray-200 rounded-xl p-3 bg-gray-50/50 space-y-2">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      multiple 
                      className="hidden" 
                      accept="image/*,.pdf"
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                    >
                      <Upload size={14} />
                      Attach Designs / Drawing Files
                    </button>

                    {attachments.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        {attachments.map((att, idx) => (
                          <div key={idx} className="relative group aspect-square bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <img src={att} alt="Attachment" className="w-full h-full object-cover" />
                            <button 
                              onClick={() => removeAttachment(idx)}
                              className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Calculation Table */}
                <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(subtotal)}</span>
                  </div>

                  <div className="flex justify-between items-center text-gray-600">
                    <span>Discount Rate (%):</span>
                    <input 
                      type="number"
                      min="0"
                      max="100"
                      value={discountRate}
                      onChange={(e) => {
                        setDiscountRate(Number(e.target.value));
                        if (Number(e.target.value) > 0) setDiscount(0);
                      }}
                      className="w-20 px-2 py-0.5 bg-white border border-gray-200 rounded text-right font-bold focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex justify-between items-center text-gray-600">
                    <span>Fixed Discount:</span>
                    <input 
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => {
                        setDiscount(Number(e.target.value));
                        if (Number(e.target.value) > 0) setDiscountRate(0);
                      }}
                      className="w-20 px-2 py-0.5 bg-white border border-gray-200 rounded text-right font-bold focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex justify-between items-center text-gray-600">
                    <span>Tax Rate (%):</span>
                    <input 
                      type="number"
                      min="0"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-20 px-2 py-0.5 bg-white border border-gray-200 rounded text-right font-bold focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex justify-between items-center text-gray-600">
                    <span>Freight / Shipping:</span>
                    <input 
                      type="number"
                      min="0"
                      value={freight}
                      onChange={(e) => setFreight(Number(e.target.value))}
                      className="w-20 px-2 py-0.5 bg-white border border-gray-200 rounded text-right font-bold focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="pt-2 border-t border-gray-200 flex justify-between items-center font-bold text-sm text-gray-900">
                    <span>Grand Total:</span>
                    <span className="text-primary text-base font-extrabold">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SELECT CLIENT MODAL */}
      <AnimatePresence>
        {isSelectClientModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-bold">
                    <User size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Select Customer</h2>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Choose client profile for quotation</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSelectClientModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search & Actions Bar */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search by customer name, phone, email, city..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <button 
                  onClick={() => {
                    setIsSelectClientModalOpen(false);
                    setIsRegisterClientOpen(true);
                  }}
                  className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  <UserPlus size={14} />
                  + New Customer
                </button>
              </div>

              {/* Clients List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[50vh]">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <User size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-bold">No customers found</p>
                    <p className="text-[10px] mt-1">Try another search term or click "+ New Customer" above.</p>
                  </div>
                ) : (
                  filteredClients.map((client) => {
                    const isSelected = selectedClient?.id === client.id;
                    const quotesCount = getClientQuotesCount(client.id);

                    return (
                      <div 
                        key={client.id}
                        onClick={() => {
                          setSelectedClient(client);
                          setIsSelectClientModalOpen(false);
                          addNotification({
                            title: 'Client Selected',
                            message: `Quotation updated for ${client.name}`,
                            type: 'info',
                            category: 'clients'
                          });
                        }}
                        className={cn(
                          "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group",
                          isSelected 
                            ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" 
                            : "border-gray-100 hover:border-primary/40 hover:bg-gray-50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 text-gray-700 font-bold rounded-full flex items-center justify-center overflow-hidden shrink-0">
                            {client.image ? (
                              <img src={client.image} alt={client.name} className="w-full h-full object-cover" />
                            ) : (
                              client.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors">
                                {client.name}
                              </h4>
                              {client.isBlacklisted && (
                                <span className="text-[8px] font-black bg-red-100 text-red-600 px-1 rounded uppercase tracking-wider">
                                  Blacklisted
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500">{client.email} • {client.phone}</p>
                            <p className="text-[10px] text-gray-400">{client.address}, {client.city}</p>
                          </div>
                        </div>

                        <div className="text-right space-y-1 shrink-0">
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full block">
                            {quotesCount} Quotes
                          </span>
                          <span className="text-xs font-bold text-gray-900 block">
                            Limit: {formatCurrency(client.creditLimit || 0)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REGISTER CLIENT MODAL */}
      <AnimatePresence>
        {isRegisterClientOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Register New Customer</h2>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Add customer details & associate with quote</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsRegisterClientOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Photo Upload */}
                <div className="flex justify-center mb-2">
                  <div className="relative group">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 overflow-hidden border-2 border-gray-100 group-hover:border-emerald-500 transition-all">
                      {regFormData.image ? (
                        <img src={regFormData.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User size={32} />
                      )}
                    </div>
                    <button 
                      onClick={() => regFileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-1.5 bg-emerald-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                      <Upload size={12} />
                    </button>
                    <input 
                      type="file" 
                      ref={regFileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleRegImageUpload} 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Full Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Acme Corporation / John Doe"
                    value={regFormData.name}
                    onChange={(e) => setRegFormData({ ...regFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="client@company.com"
                      value={regFormData.email}
                      onChange={(e) => setRegFormData({ ...regFormData, email: e.target.value })}
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</label>
                    <input 
                      type="text" 
                      placeholder="+94 77 123 4567"
                      value={regFormData.phone}
                      onChange={(e) => setRegFormData({ ...regFormData, phone: e.target.value })}
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Address</label>
                    <input 
                      type="text" 
                      placeholder="Street address..."
                      value={regFormData.address}
                      onChange={(e) => setRegFormData({ ...regFormData, address: e.target.value })}
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">City / Region</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Colombo"
                      value={regFormData.city}
                      onChange={(e) => setRegFormData({ ...regFormData, city: e.target.value })}
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Credit Limit (LKR)</label>
                  <input 
                    type="number" 
                    value={regFormData.creditLimit}
                    onChange={(e) => setRegFormData({ ...regFormData, creditLimit: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <button 
                  onClick={() => setIsRegisterClientOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRegisterClient}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20"
                >
                  Save & Select Customer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOMER DETAIL DRAWER MODAL */}
      <AnimatePresence>
        {isCustomerDetailModalOpen && selectedClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm overflow-hidden">
                    {selectedClient.image ? (
                      <img src={selectedClient.image} alt={selectedClient.name} className="w-full h-full object-cover" />
                    ) : (
                      selectedClient.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">{selectedClient.name}</h2>
                    <p className="text-[10px] text-gray-500">{selectedClient.email} • {selectedClient.phone}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCustomerDetailModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Total Quotes</p>
                    <p className="text-base font-extrabold text-primary">{getClientQuotesCount(selectedClient.id)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Total Orders</p>
                    <p className="text-base font-extrabold text-emerald-600">{getClientOrdersCount(selectedClient.id)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Credit Limit</p>
                    <p className="text-base font-extrabold text-gray-900">{formatCurrency(selectedClient.creditLimit || 0)}</p>
                  </div>
                </div>

                {/* Info List */}
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-gray-500">Address:</span>
                    <span className="font-medium text-gray-900">{selectedClient.address || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-gray-500">City:</span>
                    <span className="font-medium text-gray-900">{selectedClient.city || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-gray-500">Blacklist Status:</span>
                    <span className={cn("font-bold", selectedClient.isBlacklisted ? "text-red-600" : "text-emerald-600")}>
                      {selectedClient.isBlacklisted ? 'Blacklisted' : 'Clear'}
                    </span>
                  </div>
                </div>

                {/* Quotation History for Client */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase">Quotations for this Client</h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {quotations.filter(q => q.clientId === selectedClient.id).length === 0 ? (
                      <p className="text-xs text-gray-400 italic py-2">No previous quotations for this client</p>
                    ) : (
                      quotations.filter(q => q.clientId === selectedClient.id).map(q => (
                        <div key={q.id} className="p-2 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-primary">{q.quoteNumber}</span>
                            <span className="text-[10px] text-gray-400 ml-2">{q.date}</span>
                          </div>
                          <span className="font-bold text-gray-900">{formatCurrency(q.total)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <button 
                  onClick={() => setIsCustomerDetailModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
                {onNavigateToCustomerPortal && (
                  <button 
                    onClick={() => {
                      setIsCustomerDetailModalOpen(false);
                      onNavigateToCustomerPortal(selectedClient);
                    }}
                    className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
                  >
                    <ExternalLink size={14} />
                    Open Customer Portal
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD CUSTOM ITEM MODAL */}
      <AnimatePresence>
        {isCustomItemModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-amber-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-600 text-white rounded-lg flex items-center justify-center font-bold">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Add Custom Non-Catalog Item</h2>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">For custom services, alterations & special jobs</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCustomItemModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Item Description / Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Custom Embroidered Blazer Alteration"
                    value={customItem.name}
                    onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Unit Price (LKR) *</label>
                    <input 
                      type="number" 
                      min="0"
                      value={customItem.price}
                      onChange={(e) => setCustomItem({ ...customItem, price: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Quantity *</label>
                    <input 
                      type="number" 
                      min="1"
                      value={customItem.quantity}
                      onChange={(e) => setCustomItem({ ...customItem, quantity: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Category</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Custom Service / Alteration"
                    value={customItem.category}
                    onChange={(e) => setCustomItem({ ...customItem, category: e.target.value })}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <button 
                  onClick={() => setIsCustomItemModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={addCustomItem}
                  className="px-6 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-all shadow-md shadow-amber-600/20"
                >
                  Add Custom Item
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Portal Catalog Modal */}
      <AnimatePresence>
        {isProductPortalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                    <Search size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Product Portal Catalog</h2>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Select finished products to include in proposal</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsProductPortalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search catalog by product name, category or ID..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {filteredPortalProducts.map((product) => {
                  const cartItem = items.find(i => i.id === product.id);
                  return (
                    <button 
                      key={product.id}
                      onClick={() => addItem(product)}
                      className={cn(
                        "p-3 rounded-xl border transition-all text-left group relative",
                        cartItem 
                          ? "border-primary bg-primary/5 ring-1 ring-primary" 
                          : "border-gray-100 bg-white hover:border-primary/30 hover:shadow-md"
                      )}
                    >
                      <div className="aspect-square bg-gray-50 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                        ) : (
                          <Package size={24} className="text-gray-300" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-gray-900 truncate">{product.name}</p>
                      <p className="text-[10px] text-gray-400 mb-1">{product.category}</p>
                      <p className="text-xs font-bold text-primary">{formatCurrency(product.price)}</p>
                      
                      {cartItem && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">
                          {cartItem.quantity}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  <span className="font-bold text-gray-900">{items.length}</span> items in quotation
                </div>
                <button 
                  onClick={() => setIsProductPortalOpen(false)}
                  className="px-6 py-2 bg-primary text-white rounded-xl font-bold text-xs shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                  Done Selecting
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Portal */}
      <PrintPortal
        isOpen={showPrintPortal}
        onClose={() => setShowPrintPortal(false)}
        title="Quotation Document"
        subtitle={`Quotation #${quoteNumber}`}
        onDownload={handleDownloadPDF}
        isGeneratingPDF={isGeneratingPDF}
      >
        <div ref={printRef} className="bg-white">
          <QuotationPrintView 
            quotation={currentQuotation} 
            settings={companySettings} 
          />
        </div>
      </PrintPortal>

      <ConfirmModal 
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Quotation"
        message="Are you sure you want to delete this quotation? This action cannot be undone."
        type="danger"
        language={language}
      />

      <ConfirmModal 
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={() => {
          onUpdateQuotations([]);
          onAddAuditLog?.('Quotation History Cleared', 'All quotation history records removed', 'sales', 'warning');
        }}
        title="Clear History"
        message={t.confirmDelete || "Are you sure you want to clear all quotation history? This action cannot be undone."}
        type="danger"
        language={language}
      />
    </div>
  );
}
