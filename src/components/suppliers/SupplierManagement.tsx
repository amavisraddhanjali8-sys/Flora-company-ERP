import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  X, 
  Save,
  Truck,
  Tag
} from 'lucide-react';
import { Supplier, Transaction, ProcurementOrder } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../../context/NotificationContext';
import { cn, formatCurrency } from '../../lib/utils';
import { Language, translations } from '../../i18n';
import ConfirmModal from '../layout/ConfirmModal';

interface SupplierManagementProps {
  suppliers: Supplier[];
  onUpdateSuppliers: (suppliers: Supplier[]) => void;
  onUpdateTransactions?: (transactions: Transaction[]) => void;
  onAddAuditLog?: (action: string, details: string, category: any, type?: any) => void;
  transactions?: Transaction[];
  procurementOrders?: ProcurementOrder[];
  language?: Language;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function SupplierManagement({ 
  suppliers, 
  onUpdateSuppliers, 
  onUpdateTransactions,
  onAddAuditLog, 
  transactions = [], 
  procurementOrders = [],
  language = 'en',
  searchQuery,
  setSearchQuery
}: SupplierManagementProps) {
  const t = translations[language];
  const { addNotification } = useNotifications();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState<Supplier | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const handleRecordPayment = () => {
    if (!selectedSupplierForPayment || !paymentAmount) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    const paymentTransaction: Transaction = {
      id: 'PAY-SUP-' + Date.now(),
      type: 'Expense',
      category: 'Supplier Payment',
      amount: amount,
      date: new Date().toISOString(),
      description: `Payment to Supplier: ${selectedSupplierForPayment.name}`,
      paymentMethod: paymentMethod,
      status: 'Completed',
      supplierId: selectedSupplierForPayment.id,
      supplierName: selectedSupplierForPayment.name
    };

    if (onUpdateTransactions) {
      onUpdateTransactions([paymentTransaction, ...transactions]);
      onAddAuditLog?.('Payment Recorded', `Payment of ${formatCurrency(amount)} recorded for ${selectedSupplierForPayment.name}`, 'suppliers', 'success');
      addNotification({
        title: 'Payment Recorded',
        message: `Payment of ${formatCurrency(amount)} has been recorded for ${selectedSupplierForPayment.name}.`,
        type: 'success',
        category: 'system'
      });
      setIsPaymentModalOpen(false);
      setSelectedSupplierForPayment(null);
      setPaymentAmount('');
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    const searchLower = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(searchLower) || 
           s.contactPerson.toLowerCase().includes(searchLower) ||
           s.category.toLowerCase().includes(searchLower) ||
           s.email.toLowerCase().includes(searchLower) ||
           s.phone.toLowerCase().includes(searchLower) ||
           s.id.toLowerCase().includes(searchLower);
  });

  const handleSaveSupplier = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const supplierData: Supplier = {
      id: editingSupplier?.id || Date.now().toString(),
      name: formData.get('name') as string,
      contactPerson: formData.get('contactPerson') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      category: formData.get('category') as string,
      taxId: formData.get('taxId') as string,
    };

    if (editingSupplier) {
      onUpdateSuppliers(suppliers.map(s => s.id === editingSupplier.id ? supplierData : s));
      onAddAuditLog?.('Supplier Updated', `Supplier updated: ${supplierData.name}`, 'suppliers');
      addNotification({
        title: 'Supplier Updated',
        message: `${supplierData.name} details have been updated.`,
        type: 'success',
        category: 'system'
      });
    } else {
      onUpdateSuppliers([supplierData, ...suppliers]);
      onAddAuditLog?.('Supplier Added', `New supplier added: ${supplierData.name}`, 'suppliers', 'success');
      addNotification({
        title: 'Supplier Added',
        message: `${supplierData.name} has been added to your vendors.`,
        type: 'success',
        category: 'system'
      });
    }

    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleDeleteSupplier = (id: string) => {
    const supplier = suppliers.find(s => s.id === id);
    if (!supplier) return;

    // Check 1: Direct supplier current balance recorded
    const currentBalance = supplier.currentBalance || 0;

    // Check 2: Outstanding payables from transaction ledger
    const supplierTransactions = transactions.filter(t => t.supplierId === id);
    const totalPayable = supplierTransactions.reduce((acc, t) => {
      const amount = t.amount || 0;
      const paid = t.amountPaid || 0;

      if (t.type === 'Purchase') {
        return acc + (amount - paid);
      } else if (t.type === 'Expense') {
        return acc - amount;
      } else if (t.type === 'Income') {
        return acc + amount;
      }
      return acc;
    }, 0);

    // Check 3: Outstanding/Unpaid procurement orders & outsourced service contracts
    const supplierPOs = (procurementOrders || []).filter(
      p => p.supplierId === id || (p.supplierName && p.supplierName.toLowerCase() === supplier.name.toLowerCase())
    );
    const unpaidPOs = supplierPOs.filter(p => p.paymentStatus !== 'Paid');
    const totalPoUnpaid = unpaidPOs.reduce((sum, p) => sum + (p.total - (p.paidAmount || 0)), 0);

    const maxOutstanding = Math.max(currentBalance, Math.abs(totalPayable), totalPoUnpaid);

    if (maxOutstanding > 0.01) {
      addNotification({
        title: 'Cannot Delete Supplier Account',
        message: `${supplier.name} has unpaid credits / outstanding balance of ${formatCurrency(maxOutstanding)}. All supplier unpaid credits and pending contracts must be fully cleared before this supplier account can be deleted.`,
        type: 'error',
        category: 'system'
      });
      return;
    }

    setSupplierToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!supplierToDelete) return;
    const supplier = suppliers.find(s => s.id === supplierToDelete);
    if (!supplier) return;

    onUpdateSuppliers(suppliers.filter(s => s.id !== supplierToDelete));
    onAddAuditLog?.('Supplier Deleted', `Supplier removed: ${supplier.name}`, 'suppliers', 'warning');
    addNotification({
      title: t.delete,
      message: `${supplier.name} ${t.deletedSuccessfully}`,
      type: 'warning',
      category: 'system'
    });
    setIsDeleteConfirmOpen(false);
    setSupplierToDelete(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{t.supplierManagement}</h2>
          <p className="text-xs text-gray-500 font-medium">{t.manageVendors}</p>
        </div>
        <button 
          onClick={() => { setEditingSupplier(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
        >
          <Plus size={16} /> {t.addNewSupplier}
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder={t.searchSuppliers}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map(supplier => (
          <motion.div 
            layout
            key={supplier.id}
            className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group"
          >
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                  <Truck size={24} />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setSelectedSupplierForPayment(supplier); setIsPaymentModalOpen(true); }}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                    title="Record Payment"
                  >
                    <Save size={16} />
                  </button>
                  <button 
                    onClick={() => { setEditingSupplier(supplier); setIsModalOpen(true); }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteSupplier(supplier.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">{supplier.name}</h3>
                <div className="flex items-center gap-1.5 text-primary font-bold mt-1">
                  <Tag size={12} />
                  <span className="text-[10px] uppercase tracking-widest">{supplier.category}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-3 text-gray-600">
                  <User size={14} className="text-gray-400" />
                  <span className="text-xs font-medium">{supplier.contactPerson}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail size={14} className="text-gray-400" />
                  <span className="text-xs font-medium">{supplier.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone size={14} className="text-gray-400" />
                  <span className="text-xs font-medium">{supplier.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="text-xs font-medium line-clamp-1">{supplier.address}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
          <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Truck size={32} />
          </div>
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">No Suppliers Found</h3>
          <p className="text-sm text-gray-500 font-medium">Try adjusting your search or add a new supplier</p>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSaveSupplier}>
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                      <Truck size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                        {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">Enter supplier information below</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Company Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        name="name"
                        required
                        defaultValue={editingSupplier?.name}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                        placeholder="e.g. TechSupply Ltd"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Person</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        name="contactPerson"
                        required
                        defaultValue={editingSupplier?.contactPerson}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                        placeholder="e.g. Michael Chen"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                          name="email"
                          type="email"
                          required
                          defaultValue={editingSupplier?.email}
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                          placeholder="sales@tech.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                          name="phone"
                          required
                          defaultValue={editingSupplier?.phone}
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                          placeholder="+94..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                      <input 
                        name="category"
                        required
                        defaultValue={editingSupplier?.category}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                        placeholder="e.g. Accessories"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tax ID (Optional)</label>
                      <input 
                        name="taxId"
                        defaultValue={editingSupplier?.taxId}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                        placeholder="VAT-123..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3 text-gray-400" size={16} />
                      <textarea 
                        name="address"
                        required
                        defaultValue={editingSupplier?.address}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all h-24"
                        placeholder="Full business address..."
                      />
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-gray-50/50 border-t border-gray-100">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all"
                  >
                    {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentModalOpen(false)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-primary/5 to-transparent">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Record Payment</h2>
                  <p className="text-sm font-bold text-gray-500 mt-1">Paying: {selectedSupplierForPayment?.name}</p>
                </div>
                <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="p-3 hover:bg-gray-100 rounded-2xl transition-colors text-gray-400 hover:text-gray-900"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Amount</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</div>
                    <input 
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-lg font-black focus:outline-none focus:border-primary transition-all"
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Cash', 'Bank Transfer', 'Card', 'Cheque'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={cn(
                          "py-3 px-4 rounded-2xl text-sm font-bold transition-all border-2",
                          paymentMethod === method 
                            ? "bg-primary border-primary text-white shadow-lg shadow-primary/25" 
                            : "bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-200"
                        )}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleRecordPayment}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  Confirm Payment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => { setIsDeleteConfirmOpen(false); setSupplierToDelete(null); }}
        onConfirm={confirmDelete}
        title={t.confirmDelete}
        message={`${t.confirmDelete} ${suppliers.find(s => s.id === supplierToDelete)?.name}?`}
        type="danger"
      />
    </div>
  );
}
