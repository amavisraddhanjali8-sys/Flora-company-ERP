import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Minus, Plus, UserPlus, Receipt, CreditCard, Banknote, X, User, Search, ShoppingBag, Barcode, HelpCircle, FileText } from 'lucide-react';
import { CartItem, Client, Product, CompanySettings } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ClientSelectionModal from './ClientSelectionModal';
import { translations, Language } from '../../i18n';
import InfoModal from '../layout/InfoModal';

interface CartProps {
  items: CartItem[];
  selectedClient: Client | null;
  clients: Client[];
  products: Product[];
  scannerStatus: 'idle' | 'connected' | 'error';
  onAddToCart: (product: Product) => void;
  onSelectClient: (client: Client | null) => void;
  onUpdateClients: (clients: Client[]) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  companySettings: CompanySettings;
  language: Language;
  revisingOrderId?: string | null;
  onTriggerDrawer?: () => void;
  onCheckout: (details: {
    subtotal: number;
    tax: number;
    taxRate: number;
    discount: number;
    discountRate: number;
    freight: number;
    otherCharges: number;
    otherChargesList: { id: string; description: string; amount: number; }[];
    total: number;
  }) => void;
}

export default function Cart({ 
  items, 
  selectedClient, 
  clients, 
  products,
  scannerStatus,
  onAddToCart,
  onSelectClient, 
  onUpdateClients,
  updateQuantity, 
  removeItem, 
  companySettings,
  language,
  revisingOrderId,
  onTriggerDrawer,
  onCheckout 
}: CartProps) {
  const t = translations[language];
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [taxRate, setTaxRate] = useState(companySettings.defaultTaxRate);
  const [discountRate, setDiscountRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [freight, setFreight] = useState(0);
  const [otherChargesList, setOtherChargesList] = useState<{ id: string; description: string; amount: number; }[]>([]);
  const [isOtherChargesOpen, setIsOtherChargesOpen] = useState(false);
  const quickAddRef = useRef<HTMLDivElement>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const calculatedDiscount = discountRate > 0 ? (subtotal * (discountRate / 100)) : discount;
  const taxableAmount = Math.max(0, subtotal - calculatedDiscount);
  const tax = taxableAmount * (taxRate / 100);
  const otherChargesTotal = otherChargesList.reduce((sum, charge) => sum + charge.amount, 0);
  const total = taxableAmount + tax + freight + otherChargesTotal;

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;
    
    const product = products.find(p => p.barcode === barcodeInput || p.id === barcodeInput);
    if (product) {
      onAddToCart(product);
      setBarcodeInput('');
      
      // Visual feedback
      if (barcodeInputRef.current) {
        barcodeInputRef.current.classList.add('ring-2', 'ring-green-500', 'bg-green-50');
        setTimeout(() => {
          barcodeInputRef.current?.classList.remove('ring-2', 'ring-green-500', 'bg-green-50');
        }, 500);
      }
    } else {
      // Error feedback
      if (barcodeInputRef.current) {
        barcodeInputRef.current.classList.add('ring-2', 'ring-red-500', 'bg-red-50');
        setTimeout(() => {
          barcodeInputRef.current?.classList.remove('ring-2', 'ring-red-500', 'bg-red-50');
        }, 500);
      }
      
      // Voice feedback
      try {
        if ('speechSynthesis' in window && window.speechSynthesis) {
          const msg = new SpeechSynthesisUtterance('Barcode not found');
          msg.rate = 1.2;
          window.speechSynthesis.speak(msg);
        }
      } catch (err) {
        // Ignore speech synthesis failures
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickAddRef.current && !quickAddRef.current.contains(event.target as Node)) {
        setIsQuickAddOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddClient = (client: Client) => {
    onUpdateClients([...clients, client]);
  };

  const filteredQuickProducts = products.filter(p => 
    p.name.toLowerCase().includes(quickSearch.toLowerCase()) ||
    p.id.toLowerCase().includes(quickSearch.toLowerCase()) ||
    (p.barcode && p.barcode.toLowerCase().includes(quickSearch.toLowerCase()))
  ).slice(0, 5);

  const handleAddOtherCharge = () => {
    setOtherChargesList([...otherChargesList, { id: Date.now().toString(), description: '', amount: 0 }]);
  };

  const handleUpdateOtherCharge = (id: string, field: 'description' | 'amount', value: string | number) => {
    setOtherChargesList(otherChargesList.map(charge => 
      charge.id === id ? { ...charge, [field]: value } : charge
    ));
  };

  const handleRemoveOtherCharge = (id: string) => {
    setOtherChargesList(otherChargesList.filter(charge => charge.id !== id));
  };

  return (
    <div className="w-full lg:w-96 bg-white border-l border-gray-200 flex flex-col h-full shadow-xl z-10">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <Receipt size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Direct Order</h2>
            {revisingOrderId && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[7px] font-black uppercase tracking-widest border border-amber-100">
                REVISING #{revisingOrderId.slice(-6).toUpperCase()}
              </div>
            )}
          </div>
        </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onTriggerDrawer}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border transition-all hover:bg-gray-100",
                scannerStatus === 'connected' ? "bg-green-50 text-green-600 border-green-100" :
                scannerStatus === 'error' ? "bg-red-50 text-red-600 border-red-100" :
                "bg-gray-50 text-gray-400 border-gray-100"
              )}
              title="Open Cash Drawer"
            >
              <Barcode size={10} className={cn(scannerStatus === 'connected' && "animate-pulse")} />
              <span>{t.scanner}</span>
            </button>
            <span className="text-[10px] font-bold text-gray-400 uppercase bg-white px-2 py-0.5 rounded border border-gray-100">
            {items.length} {t.items}
          </span>
        </div>
      </div>

      {/* Client Section */}
      <div className="p-3 border-b border-gray-100 bg-white space-y-3">
        {/* Quick Barcode Add */}
        <form onSubmit={handleBarcodeSubmit} className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary group-focus-within:scale-110 transition-transform">
            <Barcode size={14} />
          </div>
          <input 
            ref={barcodeInputRef}
            type="text" 
            placeholder={t.scanOrTypeBarcode}
            className="w-full pl-10 pr-20 py-2.5 bg-primary/5 border border-primary/20 rounded-xl text-xs font-bold focus:outline-none focus:border-primary focus:bg-white transition-all placeholder:text-primary/40"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button 
              type="submit"
              className="px-2 py-1 bg-primary text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all"
            >
              {t.add}
            </button>
          </div>
        </form>

        <div className="relative" ref={quickAddRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder={t.search}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:border-primary transition-all"
              value={quickSearch}
              onChange={(e) => {
                setQuickSearch(e.target.value);
                setIsQuickAddOpen(true);
              }}
              onFocus={() => setIsQuickAddOpen(true)}
            />
          </div>
          
          <div className="flex items-center justify-between mt-1 px-1">
            <p className="text-[9px] text-gray-400 italic">Scanner is active globally</p>
            <button 
              onClick={() => setIsInfoModalOpen(true)}
              className="text-[9px] font-bold text-primary hover:underline flex items-center gap-1"
            >
              <HelpCircle size={10} /> Scanner Not Working?
            </button>
          </div>

          <InfoModal 
            isOpen={isInfoModalOpen}
            onClose={() => setIsInfoModalOpen(false)}
            title="Barcode Scanner Help"
            message={`1. Simply scan any product barcode at any time.\n2. The system will automatically add it to your cart.\n3. If scanning fails, try clicking the status indicator in the top bar.`}
            language={language}
          />

          <AnimatePresence>
            {isQuickAddOpen && quickSearch.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                {filteredQuickProducts.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {filteredQuickProducts.map(product => (
                      <button
                        key={product.id}
                        onClick={() => {
                          onAddToCart(product);
                          setQuickSearch('');
                          setIsQuickAddOpen(false);
                        }}
                        className="w-full p-2 flex items-center gap-3 hover:bg-primary/5 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0">
                          {product.image ? (
                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary/30 font-bold text-[10px]">
                              {product.name[0]}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-gray-900 truncate">{product.name}</p>
                          <p className="text-[9px] text-primary font-bold">{formatCurrency(product.price)}</p>
                        </div>
                        <Plus size={14} className="text-primary" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-[10px] text-gray-400 italic">
                    No products found
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {selectedClient ? (
          <div className="flex items-center justify-between p-2 bg-primary/5 rounded-xl border border-primary/10 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <User size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{selectedClient.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{selectedClient.phone || selectedClient.email}</p>
              </div>
            </div>
            <button 
              onClick={() => onSelectClient(null)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsClientModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">{t.addCustomer}</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar bg-gray-50/30">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3 py-20"
            >
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Receipt size={40} className="opacity-20" />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t.emptyCart}</p>
                <p className="text-[10px] text-gray-400 mt-1">{t.selectProductsToStart}</p>
              </div>
            </motion.div>
          ) : (
            items.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                key={item.id}
                className="flex gap-3 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="w-14 h-14 rounded-xl bg-gray-50 shrink-0 overflow-hidden border border-gray-100 group-hover:scale-105 transition-transform">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary/30 font-bold text-sm">
                      {item.name[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-gray-900 truncate text-xs">{item.name}</h4>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-primary font-black">{formatCurrency(item.price)}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 hover:bg-white hover:shadow-sm rounded-md text-gray-500 transition-all"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center font-black text-xs text-gray-700">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 hover:bg-white hover:shadow-sm rounded-md text-gray-500 transition-all"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <p className="text-xs font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="shrink-0 border-t border-gray-100 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        {/* Scrollable Inputs Section */}
        <div className="p-3 space-y-3 overflow-y-auto max-h-[30vh] no-scrollbar">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">{t.taxRate} (%)</label>
              <input 
                type="number" 
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">{t.discountRate} (%)</label>
              <input 
                type="number" 
                value={discountRate}
                onChange={(e) => {
                  setDiscountRate(Number(e.target.value));
                  if (Number(e.target.value) > 0) setDiscount(0);
                }}
                className="w-full px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">{t.fixedDiscount}</label>
              <input 
                type="number" 
                value={discount}
                onChange={(e) => {
                  setDiscount(Number(e.target.value));
                  if (Number(e.target.value) > 0) setDiscountRate(0);
                }}
                className="w-full px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">{t.freight}</label>
              <input 
                type="number" 
                value={freight}
                onChange={(e) => setFreight(Number(e.target.value))}
                className="w-full px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-bold text-gray-400 uppercase">{t.otherCharges}</label>
              <button 
                onClick={handleAddOtherCharge}
                className="text-[9px] font-bold text-primary hover:underline flex items-center gap-1"
              >
                <Plus size={10} /> {t.addCharge}
              </button>
            </div>
            
            {otherChargesList.length > 0 && (
              <div className="space-y-2 max-h-24 overflow-y-auto pr-1 no-scrollbar">
                {otherChargesList.map((charge) => (
                  <div key={charge.id} className="flex gap-2 items-center">
                    <input 
                      type="text"
                      placeholder="Desc"
                      value={charge.description}
                      onChange={(e) => handleUpdateOtherCharge(charge.id, 'description', e.target.value)}
                      className="flex-1 px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] focus:outline-none focus:border-primary"
                    />
                    <input 
                      type="number"
                      placeholder="Amt"
                      value={charge.amount}
                      onChange={(e) => handleUpdateOtherCharge(charge.id, 'amount', Number(e.target.value))}
                      className="w-16 px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] focus:outline-none focus:border-primary"
                    />
                    <button 
                      onClick={() => handleRemoveOtherCharge(charge.id)}
                      className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Totals & Button Section */}
        <div className="p-3 bg-gray-50/50 border-t border-gray-100 space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-gray-500 text-[10px] font-bold uppercase tracking-wider">
              <span>{t.subtotal}</span>
              <span className="text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            {calculatedDiscount > 0 && (
              <div className="flex justify-between text-red-500 text-[10px] font-bold uppercase tracking-wider">
                <span>{t.discount} {discountRate > 0 ? `(${discountRate}%)` : ''}</span>
                <span>-{formatCurrency(calculatedDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500 text-[10px] font-bold uppercase tracking-wider">
              <span>{t.tax} ({taxRate}%)</span>
              <span className="text-gray-900">{formatCurrency(tax)}</span>
            </div>
            {(freight > 0 || otherChargesTotal > 0) && (
              <div className="flex justify-between text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                <span>{t.additionalCharges}</span>
                <span className="text-gray-900">{formatCurrency(freight + otherChargesTotal)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="text-xs font-black text-gray-900 uppercase">{t.total}</span>
              <span className="text-lg font-black text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="pt-1">
            <button 
              disabled={items.length === 0}
              onClick={() => onCheckout({
                subtotal,
                tax,
                taxRate,
                discount: calculatedDiscount,
                discountRate,
                freight,
                otherCharges: otherChargesTotal,
                otherChargesList,
                total
              })}
              className="w-full py-3 bg-primary text-white rounded-xl font-black text-xs shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <FileText size={16} />
              Process Direct Order
            </button>
          </div>
        </div>
      </div>

      <ClientSelectionModal 
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        clients={clients}
        onSelect={onSelectClient}
        onAddClient={handleAddClient}
      />
    </div>
  );
}
