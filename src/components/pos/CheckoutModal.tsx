import React, { useState, useRef } from 'react';
import { X, CheckCircle2, Printer, CreditCard, Banknote, Landmark, Smartphone, Download, Phone, Mail, Globe, FileText, Monitor, Settings, RefreshCw, ShoppingBag, User, Search, Plus } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../../context/NotificationContext';
import { CartItem, Transaction, CompanySettings, Client, Order, OrderType } from '../../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { handleHtml2CanvasClone } from '../../lib/pdf-utils';
import PrintPortal from '../layout/PrintPortal';
import Barcode from 'react-barcode';

const PAYMENT_METHODS = [
  { id: 'Cash', label: 'Cash', icon: Banknote, color: 'bg-green-500' },
  { id: 'Card', label: 'Card', icon: CreditCard, color: 'bg-blue-500' },
  { id: 'Bank Transfer', label: 'Bank', icon: Landmark, color: 'bg-purple-500' },
  { id: 'Mobile Pay', label: 'Mobile', icon: Smartphone, color: 'bg-blue-500' },
  { id: 'Credit', label: 'Credit', icon: User, color: 'bg-red-500' },
];

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  details: {
    subtotal: number;
    tax: number;
    taxRate: number;
    discount: number;
    discountRate: number;
    freight: number;
    otherCharges: number;
    otherChargesList: { id: string; description: string; amount: number; }[];
    total: number;
  } | null;
  items: CartItem[];
  onComplete: (order: Order) => void;
  companySettings: CompanySettings;
  clients: Client[];
  onAddClient: (client: Client) => void;
  onTriggerDrawer?: () => void;
  transactions?: Transaction[];
  invoices?: any[];
}

export default function CheckoutModal({ 
  isOpen, 
  onClose, 
  total, 
  details, 
  items, 
  onComplete, 
  companySettings,
  clients,
  onAddClient,
  onTriggerDrawer,
  transactions = [],
  invoices = [],
}: CheckoutModalProps) {
  const { addNotification } = useNotifications();
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', address: '' });
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState('Receipt Printer (80mm)');
  const [isPrinterConnecting, setIsPrinterConnecting] = useState(false);
  const [showPrintPortal, setShowPrintPortal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('Direct');
  const [advancePayment, setAdvancePayment] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const receiptRef = useRef<HTMLDivElement>(null);

  const finalTotal = details?.total || total;
  const advance = parseFloat(advancePayment) || 0;
  const balance = finalTotal - advance;
  const change = parseFloat(amountPaid) - total;

  const handleOpenDrawer = () => {
    setIsDrawerOpen(true);
    if (onTriggerDrawer) {
      onTriggerDrawer();
    } else {
      // Fallback simulation if prop not provided
      try {
        if ('speechSynthesis' in window && window.speechSynthesis) {
          const msg = new SpeechSynthesisUtterance('Cash drawer opened');
          window.speechSynthesis.speak(msg);
        }
      } catch (err) {
        // Ignore speech synthesis failures
      }
    }
    setTimeout(() => setIsDrawerOpen(false), 2000);
  };

  const handleConnectPrinter = () => {
    setIsPrinterConnecting(true);
    setTimeout(() => {
      setIsPrinterConnecting(false);
      addNotification({
        title: 'Printer Connected',
        message: `${selectedPrinter} connected successfully!`,
        type: 'success',
        category: 'system'
      });
    }, 1500);
  };

  const calculateClientBalance = (clientId: string) => {
    const clientTransactions = transactions.filter(t => t.clientId === clientId);
    const transactionBalance = clientTransactions.reduce((acc, t) => {
      if (t.referenceId && invoices.some(inv => inv.id === t.referenceId)) {
        return acc;
      }
      const amount = t.amount || 0;
      const paid = t.amountPaid || 0;
      if (t.type === 'Sale') {
        return acc + (amount - paid);
      } else if (t.type === 'Income') {
        return acc - amount;
      } else if (t.type === 'Expense') {
        return acc + amount;
      }
      return acc;
    }, 0);

    const clientInvoices = invoices.filter(inv => inv.clientId === clientId);
    const invoiceBalance = clientInvoices.reduce((acc, inv) => acc + (inv.balance || 0), 0);

    return transactionBalance + invoiceBalance;
  };

  const handleComplete = () => {
    if (!selectedClient) {
      addNotification({
        title: 'Customer Required',
        message: 'Please select or add a customer for direct orders.',
        type: 'error',
        category: 'sales'
      });
      return;
    }

    const order: Order = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      type: orderType,
      status: 'Pending',
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      date: new Date().toISOString(),
      items: [...items],
      subtotal: details?.subtotal || total,
      tax: details?.tax || 0,
      taxRate: details?.taxRate || 0,
      discount: details?.discount || 0,
      discountRate: details?.discountRate || 0,
      freight: details?.freight || 0,
      otherCharges: details?.otherCharges || 0,
      otherChargesList: details?.otherChargesList || [],
      total: finalTotal,
      advancePayment: advance,
      advancePaymentDate: advance > 0 ? new Date().toISOString() : undefined,
      balance: balance,
      paymentMethod: paymentMethod,
      expectedDeliveryDate: expectedDeliveryDate
    };

    setCompletedOrder(order);
    setIsSuccess(true);
  };

  const handleFinish = () => {
    if (completedOrder) {
      onComplete(completedOrder);
    }
    onClose();
    setIsSuccess(false);
    setAmountPaid('');
    setCompletedOrder(null);
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current || !completedOrder) return;
    setIsGeneratingPDF(true);
    try {
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          handleHtml2CanvasClone(clonedDoc);
        }
      });
      
      const pdf = new jsPDF('p', 'mm', [80, 200]); // Receipt size
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      // Use canvas directly for better compatibility and performance
      const imgProps = pdf.getImageProperties(canvas);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(canvas, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`receipt_${completedOrder.id.toUpperCase()}.pdf`);
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

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Browser print failed or blocked:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        className="bg-white md:rounded-[3rem] w-full h-full md:h-[95vh] md:max-h-[1000px] md:max-w-[1400px] overflow-hidden shadow-[0_32px_128px_-12px_rgba(0,0,0,0.5)] flex flex-col md:flex-row border border-white/20"
      >
        {/* Order Summary Side */}
        <div className="w-full md:w-[400px] bg-gray-50/50 p-8 border-r border-gray-100 hidden md:flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Order Summary</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{items.length} Items Selected</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
            {items.map(item => (
              <div key={item.id} className="flex justify-between gap-4 group">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded text-[9px] font-bold uppercase">x{item.quantity}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{formatCurrency(item.price)} each</span>
                  </div>
                </div>
                <p className="text-xs font-black text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 space-y-3">
            <div className="flex justify-between text-xs text-gray-500 font-medium">
              <span>Subtotal</span>
              <span className="text-gray-900">{formatCurrency(details?.subtotal || total / 1.05)}</span>
            </div>
            {details?.discount && details.discount > 0 && (
              <div className="flex justify-between text-xs text-red-500 font-bold">
                <span>Discount {details.discountRate > 0 ? `(${details.discountRate}%)` : ''}</span>
                <span>-{formatCurrency(details.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-500 font-medium">
              <span>Tax ({details?.taxRate || 5}%)</span>
              <span className="text-gray-900">{formatCurrency(details?.tax || total - (total / 1.05))}</span>
            </div>
            {details?.freight && details.freight > 0 && (
              <div className="flex justify-between text-xs text-gray-500 font-medium">
                <span>Freight</span>
                <span className="text-gray-900">{formatCurrency(details.freight)}</span>
              </div>
            )}
            {details?.otherChargesList && details.otherChargesList.length > 0 ? (
              details.otherChargesList.map((charge, i) => (
                <div key={i} className="flex justify-between text-xs text-gray-500 font-medium">
                  <span>{charge.description || 'Other Charge'}</span>
                  <span className="text-gray-900">{formatCurrency(charge.amount)}</span>
                </div>
              ))
            ) : (
              details?.otherCharges && details.otherCharges > 0 && (
                <div className="flex justify-between text-xs text-gray-500 font-medium">
                  <span>Other Charges</span>
                  <span className="text-gray-900">{formatCurrency(details.otherCharges)}</span>
                </div>
              )
            )}
            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-900">
              <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Total Payable</span>
              <span className="text-xl font-black text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Side */}
        <div className="flex-1 p-8 md:p-12 space-y-8 overflow-y-auto no-scrollbar relative">
          <div className="flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-sm z-10 pb-4 -mx-4 px-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-gray-900/20">
                <CreditCard size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Payment Portal</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Secure Transaction Terminal</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>
          
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-8">
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12 }}
                className="w-24 h-24 bg-green-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-green-500/30"
              >
                <CheckCircle2 size={48} />
              </motion.div>
              <div className="text-center space-y-2">
                <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Payment Successful</h3>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Order ID: #{completedOrder?.id.toUpperCase()}</p>
              </div>

              <div className="w-full max-w-sm bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <span className="text-xs font-bold text-gray-400 uppercase">Amount Paid</span>
                  <span className="text-xl font-black text-gray-900">{formatCurrency(completedOrder?.amountPaid || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase">Change Given</span>
                  <span className="text-xl font-black text-green-600">{formatCurrency(completedOrder?.change || 0)}</span>
                </div>
              </div>

              {/* Hidden Receipt for PDF/Print - Using absolute positioning instead of hidden to ensure html2canvas can capture it */}
              <div className="absolute -left-[9999px] top-0 pointer-events-none">
                <div ref={receiptRef} className="w-[80mm] p-6 bg-white text-black font-mono">
                  <div className="text-center space-y-1 mb-4 border-b border-dashed border-black pb-4">
                    {companySettings.logo && (
                      <img src={companySettings.logo} alt="Logo" className="w-16 h-16 mx-auto object-contain mb-2" referrerPolicy="no-referrer" />
                    )}
                    <h2 className="text-sm font-black uppercase tracking-tighter">{companySettings.name}</h2>
                    <p className="text-[8px] uppercase font-bold leading-tight">{companySettings.address}</p>
                    <div className="flex flex-wrap justify-center gap-x-2 text-[7px] font-bold">
                      {companySettings.phones.map((p, i) => <span key={i}>TEL: {p}</span>)}
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-2 text-[7px] font-bold uppercase">
                      <span>EMAIL: {companySettings.email}</span>
                      <span>WEB: {companySettings.website}</span>
                    </div>
                    {companySettings.taxId && (
                      <p className="text-[7px] font-black uppercase mt-1">TAX ID: {companySettings.taxId}</p>
                    )}
                  </div>
                  
                  <div className="border-t border-b border-dashed border-black py-2 mb-4 space-y-1">
                    <div className="flex justify-between text-[9px]">
                      <span>ORDER ID:</span>
                      <span>#{completedOrder?.id.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span>DATE:</span>
                      <span>{new Date().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span>PAYMENT:</span>
                      <span>{completedOrder?.paymentMethod}</span>
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                    {completedOrder?.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[9px]">
                        <span>{item.name} x{item.quantity}</span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-dashed border-black pt-2 space-y-1 mb-4">
                    <div className="flex justify-between text-[9px]">
                      <span>SUBTOTAL</span>
                      <span>{formatCurrency(completedOrder?.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span>TAX</span>
                      <span>{formatCurrency(completedOrder?.tax || 0)}</span>
                    </div>
                    {completedOrder?.discount && completedOrder.discount > 0 && (
                      <div className="flex justify-between text-[9px]">
                        <span>DISCOUNT</span>
                        <span>-{formatCurrency(completedOrder.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs font-black pt-1">
                      <span>TOTAL</span>
                      <span>{formatCurrency(completedOrder?.amount || 0)}</span>
                    </div>
                  </div>

                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <Barcode 
                        value={completedOrder?.id.toUpperCase() || '000000'} 
                        width={1} 
                        height={30} 
                        fontSize={8}
                        margin={0}
                      />
                    </div>
                    <p className="text-[8px] uppercase">Thank you for your visit!</p>
                    {companySettings.terms.length > 0 && (
                      <div className="pt-2 border-t border-dotted border-black">
                        <p className="text-[6px] uppercase font-bold text-gray-500">Terms & Conditions:</p>
                        {companySettings.terms.slice(0, 2).map((term, i) => (
                          <p key={i} className="text-[6px] leading-tight italic">- {term.text}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <button 
                  onClick={() => setShowPrintPortal(true)}
                  disabled={isGeneratingPDF}
                  className="flex items-center justify-center gap-3 py-4 bg-white border-2 border-gray-100 rounded-2xl text-sm font-black text-gray-700 hover:bg-gray-50 hover:border-gray-200 transition-all"
                >
                  <Printer size={18} />
                  PRINT PREVIEW
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="flex items-center justify-center gap-3 py-4 bg-primary text-white rounded-2xl text-sm font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                  {isGeneratingPDF ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={18} />}
                  PDF RECEIPT
                </button>
              </div>

              <div className="w-full max-w-sm p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor size={14} className="text-gray-400" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Printer Status</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-bold text-green-600 uppercase">Online</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <select 
                    value={selectedPrinter}
                    onChange={(e) => setSelectedPrinter(e.target.value)}
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-[10px] font-bold focus:outline-none focus:border-primary"
                  >
                    <option>Receipt Printer (80mm)</option>
                    <option>Office Printer (A4)</option>
                    <option>Label Printer</option>
                  </select>
                  <button 
                    onClick={handleConnectPrinter}
                    disabled={isPrinterConnecting}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-primary transition-all"
                  >
                    {isPrinterConnecting ? <RefreshCw size={14} className="animate-spin" /> : <Settings size={14} />}
                  </button>
                </div>
              </div>

              <button 
                onClick={handleFinish}
                className="w-full max-w-sm py-5 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                Finish & New Order
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <AnimatePresence>
                {isAddingClient && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-0 z-30 bg-white p-8 md:p-12 space-y-8 overflow-y-auto no-scrollbar"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                          <Plus size={24} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">New Customer</h2>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Register purchaser details</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsAddingClient(false)} 
                        className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                        <input
                          type="text"
                          value={newClient.name}
                          onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                          placeholder="Enter customer name"
                          className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                        <input
                          type="text"
                          value={newClient.phone}
                          onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                          placeholder="Enter phone number"
                          className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                        <input
                          type="email"
                          value={newClient.email}
                          onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                          placeholder="Enter email address"
                          className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Address</label>
                        <input
                          type="text"
                          value={newClient.address}
                          onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                          placeholder="Enter physical address"
                          className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={() => setIsAddingClient(false)}
                        className="flex-1 py-5 border-2 border-gray-100 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => {
                          if (!newClient.name || !newClient.phone) {
                            addNotification({
                              title: 'Validation Error',
                              message: 'Name and Phone are required',
                              type: 'error',
                              category: 'system'
                            });
                            return;
                          }
                          const client: Client = {
                            id: 'C' + Date.now(),
                            ...newClient,
                            city: ''
                          };
                          onAddClient(client);
                          setSelectedClient(client);
                          setIsAddingClient(false);
                          setNewClient({ name: '', phone: '', email: '', address: '' });
                        }}
                        className="flex-[2] py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all"
                      >
                        Save & Select Customer
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10 flex flex-col items-center justify-center text-center space-y-2">
                    <p className="text-primary/60 font-black uppercase text-[10px] tracking-[0.2em]">Order Total</p>
                    <h3 className="text-6xl font-black text-primary tracking-tighter">{formatCurrency(finalTotal)}</h3>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Order Details</label>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Advance Payment</span>
                         <input 
                           type="number"
                           value={advancePayment}
                           onChange={(e) => setAdvancePayment(e.target.value)}
                           placeholder="0.00"
                           className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-none focus:border-primary"
                         />
                       </div>
                       <div className="space-y-2">
                         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Balance Due</span>
                         <div className="w-full px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm font-black text-red-600">
                           {formatCurrency(balance)}
                         </div>
                       </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Expected Delivery Date</span>
                      <input 
                        type="date"
                        value={expectedDeliveryDate}
                        onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Selection</label>
                      <button 
                        onClick={() => setIsAddingClient(true)}
                        className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
                      >
                        <Plus size={12} />
                        Add New
                      </button>
                    </div>
                    
                    {selectedClient ? (
                      <div className="p-4 bg-primary/5 border-2 border-primary rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900">{selectedClient.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{selectedClient.phone}</p>
                            {(() => {
                              const balance = calculateClientBalance(selectedClient.id);
                              if (Math.abs(balance) > 0.01) {
                                return (
                                  <p className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest mt-1",
                                    balance > 0 ? "text-red-500" : "text-green-600"
                                  )}>
                                    Balance: {formatCurrency(balance)}
                                  </p>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedClient(null)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Search customer by name or phone..."
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                        />
                        {clientSearch && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 max-h-48 overflow-y-auto no-scrollbar">
                            {clients
                              .filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch))
                              .map(client => (
                                <button
                                  key={client.id}
                                  disabled={client.isBlacklisted}
                                  onClick={() => {
                                    if (client.isBlacklisted) return;
                                    setSelectedClient(client);
                                    setClientSearch('');
                                  }}
                                  className={cn(
                                    "w-full p-4 text-left flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0",
                                    client.isBlacklisted ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:bg-gray-50"
                                  )}
                                >
                                  <div className="w-8 h-8 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center">
                                    <User size={16} />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs font-bold text-gray-900">{client.name}</p>
                                      {client.isBlacklisted && (
                                        <span className="text-[7px] font-black bg-red-100 text-red-600 px-1 rounded uppercase tracking-widest">BLACKLISTED</span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-gray-400">{client.phone}</p>
                                  </div>
                                  {client.isBlacklisted && (
                                    <div className="text-[8px] font-bold text-red-500 italic">Blocked</div>
                                  )}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      {PAYMENT_METHODS.map((method) => {
                        const Icon = method.icon;
                        const isActive = paymentMethod === method.id;
                        return (
                          <button
                            key={method.id}
                            onClick={() => {
                              setPaymentMethod(method.id);
                              if (method.id === 'Credit') {
                                setAmountPaid('0');
                              } else if (method.id !== 'Cash') {
                                setAmountPaid(total.toString());
                              }
                            }}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all relative overflow-hidden group",
                              isActive 
                                ? "border-primary bg-primary/5 text-primary shadow-xl shadow-primary/10" 
                                : "border-gray-100 bg-white text-gray-400 hover:border-primary/30 hover:text-primary"
                            )}
                          >
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                              isActive ? method.color + " text-white shadow-lg" : "bg-gray-50 group-hover:bg-primary/10"
                            )}>
                              <Icon size={24} />
                            </div>
                            <div className="text-left">
                              <span className="text-[10px] font-black uppercase block leading-none mb-1">Pay with</span>
                              <span className="text-sm font-black uppercase block leading-none">{method.label}</span>
                            </div>
                            {isActive && (
                              <motion.div 
                                layoutId="active-indicator"
                                className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {paymentMethod === 'Cash' ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount Received</label>
                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-300 text-2xl">$</span>
                          <input
                            autoFocus
                            type="number"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-12 pr-6 py-6 bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] text-4xl font-black focus:outline-none focus:border-primary focus:bg-white transition-all placeholder:text-gray-200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'C'].map((num) => (
                          <button
                            key={num}
                            onClick={() => {
                              if (num === 'C') setAmountPaid('');
                              else setAmountPaid(prev => prev + num);
                            }}
                            className={cn(
                              "h-16 flex items-center justify-center rounded-2xl font-black text-xl transition-all border-2",
                              num === 'C' 
                                ? "bg-red-50 border-red-100 text-red-500 hover:bg-red-500 hover:text-white" 
                                : "bg-white border-gray-100 text-gray-700 hover:border-primary hover:text-primary hover:shadow-lg hover:shadow-primary/10"
                            )}
                          >
                            {num}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {[10, 20, 50, 100].map((val) => (
                          <button
                            key={val}
                            onClick={() => setAmountPaid(val.toString())}
                            className="py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black hover:bg-primary transition-colors"
                          >
                            ${val}
                          </button>
                        ))}
                      </div>
                      
                      <button 
                        onClick={handleOpenDrawer}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all",
                          isDrawerOpen ? "bg-green-500 text-white shadow-lg" : "bg-white border-2 border-gray-100 text-gray-400 hover:text-primary hover:border-primary"
                        )}
                      >
                        <ShoppingBag size={14} />
                        {isDrawerOpen ? "Drawer Open" : "Open Cash Drawer"}
                      </button>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 bg-gray-50 rounded-[2rem] border border-gray-100 text-center space-y-4">
                      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-primary shadow-xl shadow-primary/5">
                        <Landmark size={40} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Electronic Payment</h4>
                        <p className="text-xs text-gray-400 font-medium max-w-[200px] mx-auto">Please process the transaction on the external terminal</p>
                      </div>
                      <div className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Ready for Signal
                      </div>
                      
                      <button 
                        onClick={handleOpenDrawer}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
                          isDrawerOpen ? "bg-green-500 text-white shadow-lg" : "bg-white border border-gray-200 text-gray-400 hover:text-primary hover:border-primary"
                        )}
                      >
                        <ShoppingBag size={14} />
                        {isDrawerOpen ? "Drawer Open" : "Open Cash Drawer"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  {paymentMethod === 'Cash' && parseFloat(amountPaid) >= total && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="h-full px-8 bg-green-500 rounded-3xl flex flex-col justify-center shadow-xl shadow-green-500/20"
                    >
                      <span className="text-white/70 font-black uppercase text-[10px] tracking-widest">Change Due</span>
                      <span className="text-3xl font-black text-white tracking-tighter">{formatCurrency(change)}</span>
                    </motion.div>
                  )}
                </div>
                <div className="flex-[2] flex gap-4">
                  <button 
                    onClick={onClose}
                    className="flex-1 py-5 border-2 border-gray-100 text-gray-400 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-50 hover:text-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={
                      paymentMethod === 'Cash' 
                        ? (!amountPaid || parseFloat(amountPaid) < total) 
                        : paymentMethod === 'Credit' 
                          ? !selectedClient 
                          : false
                    }
                    onClick={handleComplete}
                    className="flex-[2] py-5 bg-primary text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Complete {paymentMethod} Sale
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Print Portal */}
      <PrintPortal
        isOpen={showPrintPortal}
        onClose={() => setShowPrintPortal(false)}
        title="Order Receipt"
        subtitle={`Order #${completedOrder?.id.toUpperCase()}`}
        onDownload={handleDownloadPDF}
        isGeneratingPDF={isGeneratingPDF}
      >
        <div ref={receiptRef} className="bg-white p-8 max-w-[400px] mx-auto" data-print-root>
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-xl font-black uppercase tracking-tighter">{companySettings.name}</h1>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest space-y-1">
              <p>{companySettings.address}</p>
              <p>Tel: {companySettings.phones[0]}</p>
              <p>{companySettings.email}</p>
            </div>
          </div>

          <div className="border-t border-b border-dashed border-gray-300 py-4 mb-6 space-y-1">
            <div className="flex justify-between text-[10px] font-bold uppercase">
              <span>Order ID:</span>
              <span>#{completedOrder?.id.toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase">
              <span>Date:</span>
              <span>{new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase">
              <span>Cashier:</span>
              <span>Admin</span>
            </div>
            {selectedClient && (
              <div className="flex justify-between text-[10px] font-bold uppercase text-primary">
                <span>Customer:</span>
                <span>{selectedClient.name}</span>
              </div>
            )}
          </div>

          <table className="w-full mb-6">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-[10px] font-bold uppercase py-2">Item</th>
                <th className="text-right text-[10px] font-bold uppercase py-2">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="py-2">
                    <p className="text-xs font-bold text-gray-800">{item.name}</p>
                    <p className="text-[9px] text-gray-400 font-medium">{item.quantity} x {formatCurrency(item.price)}</p>
                  </td>
                  <td className="py-2 text-right text-xs font-black text-gray-900">
                    {formatCurrency(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-2 border-t border-gray-200 pt-4 mb-8">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-gray-500 uppercase">Subtotal</span>
              <span>{formatCurrency(details?.subtotal || total / 1.05)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-gray-500 uppercase">Tax ({details?.taxRate || 5}%)</span>
              <span>{formatCurrency(details?.tax || total - (total / 1.05))}</span>
            </div>
            <div className="flex justify-between text-sm font-black pt-2 border-t-2 border-gray-900">
              <span className="uppercase tracking-widest">Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Barcode 
                value={completedOrder?.id.toUpperCase() || '000000'} 
                width={1} 
                height={40} 
                fontSize={10}
              />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest">Thank you for your visit!</p>
          </div>
        </div>
      </PrintPortal>
    </div>
  );
}
