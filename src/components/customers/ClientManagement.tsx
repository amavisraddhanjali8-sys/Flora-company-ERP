import React, { useState, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, User, Upload, AlertCircle, Receipt, X, DollarSign, FileText, ArrowRight } from 'lucide-react';
import { Client, Transaction, Invoice, Quotation } from '../../types';
import { MOCK_CLIENTS } from '../../constants';
import { useNotifications } from '../../context/NotificationContext';
import { cn, formatCurrency } from '../../lib/utils';
import { Language, translations } from '../../i18n';
import ConfirmModal from '../layout/ConfirmModal';

interface ClientManagementProps {
  clients: Client[];
  onUpdateClients: (clients: Client[]) => void;
  onUpdateTransactions?: (transactions: Transaction[]) => void;
  onAddAuditLog?: (action: string, details: string, category: any, type?: any) => void;
  transactions?: Transaction[];
  invoices?: Invoice[];
  quotations?: Quotation[];
  selectedClient?: Client | null;
  onSelectClient?: (client: Client | null) => void;
  onNavigateToQuotation?: (client: Client) => void;
  language?: Language;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function ClientManagement({ 
  clients, 
  onUpdateClients, 
  onUpdateTransactions,
  onAddAuditLog, 
  transactions = [], 
  invoices = [],
  quotations = [],
  selectedClient,
  onSelectClient,
  onNavigateToQuotation,
  language = 'en',
  searchQuery,
  setSearchQuery
}: ClientManagementProps) {
  const t = translations[language];
  const { addNotification } = useNotifications();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [selectedClientForPayment, setSelectedClientForPayment] = useState<Client | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredClients = clients.filter(c => {
    const searchLower = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(searchLower) || 
           c.email.toLowerCase().includes(searchLower) ||
           c.phone.toLowerCase().includes(searchLower) ||
           c.city.toLowerCase().includes(searchLower) ||
           c.address.toLowerCase().includes(searchLower) ||
           c.id.toLowerCase().includes(searchLower);
  });

  const [formData, setFormData] = useState<Omit<Client, 'id'>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    image: '',
    creditLimit: 0,
    isBlacklisted: false,
    notes: ''
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (editingClient) {
      onUpdateClients(clients.map(c => c.id === editingClient.id ? { ...formData, id: c.id } : c));
      onAddAuditLog?.('Client Updated', `Client updated: ${formData.name}`, 'clients');
      addNotification({
        title: 'Client Updated',
        message: `${formData.name}'s information has been updated successfully.`,
        type: 'success',
        category: 'system'
      });
    } else {
      onUpdateClients([...clients, { ...formData, id: Date.now().toString() }]);
      onAddAuditLog?.('Client Added', `New client added: ${formData.name}`, 'clients', 'success');
      addNotification({
        title: 'Client Added',
        message: `${formData.name} has been added to the client database.`,
        type: 'success',
        category: 'system'
      });
    }
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData({ 
      name: '', 
      email: '', 
      phone: '', 
      address: '', 
      city: '', 
      image: '',
      creditLimit: 0,
      isBlacklisted: false,
      notes: ''
    });
  };

  const startEdit = (client: Client) => {
    setEditingClient(client);
    setFormData(client);
    setIsModalOpen(true);
  };

  const deleteClient = (id: string) => {
    const client = clients.find(c => c.id === id);
    if (!client) return;

    // Check for outstanding balance in transactions
    const clientTransactions = transactions.filter(t => t.clientId === id);
    const transactionBalance = clientTransactions.reduce((acc, t) => {
      // Ignore transactions linked to invoices to avoid double counting with invoiceBalance
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

    // Check for outstanding balance in invoices
    const clientInvoices = invoices.filter(inv => inv.clientId === id);
    const invoiceBalance = clientInvoices.reduce((acc, inv) => acc + (inv.balance || 0), 0);

    const totalCredit = transactionBalance + invoiceBalance;

    if (Math.abs(totalCredit) > 0.01) {
      addNotification({
        title: t.cannotDeleteClient,
        message: `${client.name} ${t.settleBalanceFirst} (${formatCurrency(totalCredit)})`,
        type: 'error',
        category: 'system'
      });
      return;
    }

    setClientToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!clientToDelete) return;
    const client = clients.find(c => c.id === clientToDelete);
    if (!client) return;

    onUpdateClients(clients.filter(c => c.id !== clientToDelete));
    onAddAuditLog?.('Client Deleted', `Client removed: ${client.name}`, 'clients', 'warning');
    addNotification({
      title: t.delete,
      message: `${client.name} has been removed.`,
      type: 'warning',
      category: 'system'
    });
    setIsDeleteConfirmOpen(false);
    setClientToDelete(null);
  };

  const calculateClientBalance = (clientId: string) => {
    const clientTransactions = transactions.filter(t => t.clientId === clientId);
    const transactionBalance = clientTransactions.reduce((acc, t) => {
      // Ignore transactions linked to invoices to avoid double counting with invoiceBalance
      if (t.referenceId && invoices.some(inv => inv.id === t.referenceId)) {
        return acc;
      }

      const amount = t.amount || 0;
      const paid = t.amountPaid || 0;

      if (t.type === 'Sale') {
        return acc + (amount - paid);
      } else if (t.type === 'Income') {
        // If it's a direct income (payment), it reduces the debt
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

  const handleRecordPayment = () => {
    if (!selectedClientForPayment || !paymentAmount) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    const paymentTransaction: Transaction = {
      id: 'PAY' + Date.now(),
      type: 'Income',
      category: 'Client Payment',
      amount: amount,
      date: new Date().toISOString(),
      description: `Credit Payment from ${selectedClientForPayment.name}`,
      paymentMethod: paymentMethod,
      status: 'Completed',
      clientId: selectedClientForPayment.id,
      clientName: selectedClientForPayment.name
    };

    if (onUpdateTransactions) {
      onUpdateTransactions([paymentTransaction, ...transactions]);
      onAddAuditLog?.('Payment Recorded', `Payment of ${formatCurrency(amount)} recorded for ${selectedClientForPayment.name}`, 'clients', 'success');
      addNotification({
        title: 'Payment Recorded',
        message: `Payment of ${formatCurrency(amount)} has been recorded for ${selectedClientForPayment.name}.`,
        type: 'success',
        category: 'system'
      });
      setIsPaymentModalOpen(false);
      setSelectedClientForPayment(null);
      setPaymentAmount('');
    } else {
      addNotification({
        title: 'Error',
        message: 'Transaction update function not available.',
        type: 'error',
        category: 'system'
      });
    }
  };

  return (
    <div className="flex-1 bg-gray-50 p-3 sm:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">{t.clientManagement}</h1>
            <p className="text-xs text-gray-500 font-medium">Manage client accounts, credit limits, and quotations</p>
          </div>
          <button 
            onClick={() => {
              setEditingClient(null);
              setFormData({ name: '', email: '', phone: '', address: '', city: '', image: '', creditLimit: 0, isBlacklisted: false, notes: '' });
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90 transition-all shadow-sm w-full sm:w-auto shrink-0 cursor-pointer"
          >
            <Plus size={16} />
            {t.addNewClient}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder={t.searchClients}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="text-[11px] text-gray-500 font-medium self-end sm:self-center">
              Showing <span className="font-bold text-gray-900">{filteredClients.length}</span> clients
            </div>
          </div>

          {/* Mobile Card List View */}
          <div className="block md:hidden divide-y divide-gray-100">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs font-medium">
                No client profiles found matching "{searchQuery}"
              </div>
            ) : (
              filteredClients.map((client) => {
                const clientQuotes = quotations.filter(q => q.clientId === client.id);
                const isSelected = selectedClient?.id === client.id;
                const totalCredit = calculateClientBalance(client.id);
                const hasBadDebt = invoices.some(inv => inv.clientId === client.id && inv.isBadDebt);

                return (
                  <div key={client.id} className={cn("p-4 space-y-3 transition-colors", isSelected ? "bg-primary/5" : "hover:bg-gray-50/50")}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 overflow-hidden shrink-0 border border-gray-200">
                          {client.image ? (
                            <img src={client.image} alt={client.name} className="w-full h-full object-cover" />
                          ) : (
                            <User size={18} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-gray-900 text-sm">{client.name}</span>
                            {isSelected && (
                              <span className="text-[8px] font-extrabold bg-primary text-white px-1.5 py-0.5 rounded-full">ACTIVE</span>
                            )}
                            {client.isBlacklisted && (
                              <span className="text-[8px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase tracking-wider">BLACKLISTED</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{client.city || 'No location set'}</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={cn(
                          "text-xs font-black",
                          totalCredit > 0.01 ? "text-red-500" : totalCredit < -0.01 ? "text-green-500" : "text-gray-400"
                        )}>
                          {formatCurrency(totalCredit)}
                        </div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase">Balance</div>
                      </div>
                    </div>

                    <div className="bg-gray-50/80 p-2.5 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="text-gray-400 text-[10px] font-bold uppercase">Contact:</span>
                        <span className="font-medium truncate max-w-[200px]">{client.email || 'No email'}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="text-gray-400 text-[10px] font-bold uppercase">Phone:</span>
                        <a href={`tel:${client.phone}`} className="font-medium text-primary hover:underline">{client.phone || 'N/A'}</a>
                      </div>
                      {client.address && (
                        <div className="flex items-center justify-between text-gray-600">
                          <span className="text-gray-400 text-[10px] font-bold uppercase">Address:</span>
                          <span className="font-medium truncate max-w-[200px] text-right">{client.address}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-gray-600 pt-1 border-t border-gray-200/60">
                        <span className="text-gray-400 text-[10px] font-bold uppercase">Quotations:</span>
                        <span className="font-bold text-gray-800">{clientQuotes.length} quotes</span>
                      </div>
                    </div>

                    {(totalCredit > (client.creditLimit || 0) && totalCredit > 0.01) && (
                      <div className="bg-amber-50 text-amber-800 border border-amber-200/80 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
                        <AlertCircle size={12} className="text-amber-600 shrink-0" />
                        <span>Credit Over Limit (Max: {formatCurrency(client.creditLimit)})</span>
                      </div>
                    )}

                    {hasBadDebt && (
                      <div className="bg-red-50 text-red-700 border border-red-200/80 px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 animate-pulse">
                        <AlertCircle size={12} className="text-red-600 shrink-0" />
                        <span>BAD DEBT WARNING ON ACCOUNT</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      {onNavigateToQuotation && (
                        <button 
                          onClick={() => {
                            onSelectClient?.(client);
                            onNavigateToQuotation(client);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          <FileText size={13} />
                          <span>Create Quote</span>
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setSelectedClientForPayment(client);
                          setPaymentAmount('');
                          setIsPaymentModalOpen(true);
                        }}
                        className="p-2 text-gray-600 bg-gray-100 hover:bg-green-50 hover:text-green-600 rounded-xl transition-all cursor-pointer"
                        title="Record Payment"
                      >
                        <Receipt size={15} />
                      </button>
                      <button 
                        onClick={() => startEdit(client)}
                        className="p-2 text-gray-600 bg-gray-100 hover:bg-primary/10 hover:text-primary rounded-xl transition-all cursor-pointer"
                        title="Edit Client"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button 
                        onClick={() => deleteClient(client.id)}
                        className="p-2 text-gray-600 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all cursor-pointer"
                        title="Delete Client"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto w-full max-w-full">
            <table className="w-full text-left min-w-[720px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">{t.name}</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Contact</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Address</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Quotations</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Credit Balance</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClients.map((client) => {
                  const clientQuotes = quotations.filter(q => q.clientId === client.id);
                  const isSelected = selectedClient?.id === client.id;

                  return (
                    <tr key={client.id} className={cn("transition-colors", isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-gray-50")}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 overflow-hidden shrink-0">
                            {client.image ? (
                              <img src={client.image} alt={client.name} className="w-full h-full object-cover" />
                            ) : (
                              <User size={16} />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-900 text-xs">{client.name}</span>
                              {isSelected && (
                                <span className="text-[8px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full">ACTIVE</span>
                              )}
                            </div>
                            {client.isBlacklisted && (
                              <span className="text-[8px] font-black bg-red-100 text-red-600 px-1 rounded uppercase tracking-widest w-fit mt-0.5">BLACKLISTED</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[11px] text-gray-600">{client.email}</div>
                        <div className="text-[10px] text-gray-400">{client.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[11px] text-gray-600 truncate max-w-xs">{client.address}</div>
                        <div className="text-[10px] text-gray-400">{client.city}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-700">{clientQuotes.length}</span>
                          <span className="text-[10px] text-gray-400">quotes</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const totalCredit = calculateClientBalance(client.id);
                          const hasBadDebt = invoices.some(inv => inv.clientId === client.id && inv.isBadDebt);
                          
                          return (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-xs font-bold",
                                  totalCredit > 0.01 ? "text-red-500" : totalCredit < -0.01 ? "text-green-500" : "text-gray-400"
                                )}>
                                  {formatCurrency(totalCredit)}
                                </span>
                                {(totalCredit > (client.creditLimit || 0) && totalCredit > 0.01) && (
                                  <span className="text-[8px] font-black bg-amber-100 text-amber-600 px-1 rounded uppercase tracking-widest">OVER LIMIT</span>
                                )}
                              </div>
                              {hasBadDebt && (
                                <div className="flex items-center gap-1 text-red-600 animate-pulse">
                                  <AlertCircle size={10} />
                                  <span className="text-[8px] font-black uppercase tracking-widest">BAD DEBT ALERT</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {onNavigateToQuotation && (
                            <button 
                              onClick={() => {
                                onSelectClient?.(client);
                                onNavigateToQuotation(client);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                              title="Create Quotation for Client in Quotation Portal"
                            >
                              <FileText size={13} />
                              <span>Create Quote</span>
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setSelectedClientForPayment(client);
                              setPaymentAmount('');
                              setIsPaymentModalOpen(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors cursor-pointer"
                            title="Record Payment"
                          >
                            <Receipt size={14} />
                          </button>
                          <button 
                            onClick={() => startEdit(client)}
                            className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded transition-colors cursor-pointer"
                            title="Edit Client"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => deleteClient(client.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Delete Client"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl my-auto max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h2 className="text-sm sm:text-base font-bold text-gray-900">{editingClient ? 'Edit Client Profile' : 'Add New Client'}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditingClient(null); setFormData({ name: '', email: '', phone: '', address: '', city: '', image: '', creditLimit: 0, isBlacklisted: false, notes: '' }); }} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer">
                <Plus className="rotate-45" size={20} />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div className="flex justify-center mb-2">
                <div className="relative group">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 overflow-hidden border-2 border-gray-100 group-hover:border-primary transition-all">
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User size={28} />
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Upload size={12} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                  placeholder="Client name"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Email</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Phone</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                    placeholder="+123..."
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Address</label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                  placeholder="Street address"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">City/State/Zip</label>
                <input 
                  type="text" 
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                  placeholder="City, region"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Credit Limit ($)</label>
                  <input 
                    type="number" 
                    value={formData.creditLimit}
                    onChange={e => setFormData({...formData, creditLimit: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex items-center sm:items-end pb-1.5 pt-2 sm:pt-0">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={formData.isBlacklisted}
                      onChange={e => setFormData({...formData, isBlacklisted: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-[10px] font-bold text-gray-500 uppercase group-hover:text-red-500 transition-colors">Blacklist Client</span>
                  </label>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Notes / Internal Comments</label>
                <textarea 
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary min-h-[60px]"
                  placeholder="Internal notes about this client..."
                />
              </div>
              <button 
                onClick={handleSave}
                className="w-full py-2.5 sm:py-3 bg-primary text-white rounded-xl font-bold text-xs shadow-md shadow-primary/20 hover:bg-primary/90 transition-all mt-2 cursor-pointer"
              >
                Save Client Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedClientForPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300 my-auto max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 shrink-0">
                  <Receipt size={22} />
                </div>
                <div className="overflow-hidden">
                  <h2 className="text-base sm:text-lg font-black text-gray-900 uppercase tracking-tight">Record Payment</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest truncate">{selectedClientForPayment.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3.5 flex items-start gap-3">
                <AlertCircle className="text-amber-500 mt-0.5 shrink-0" size={16} />
                <div>
                  <p className="text-[10px] font-bold text-amber-900 uppercase tracking-tight">Current Outstanding Balance</p>
                  <p className="text-base sm:text-lg font-black text-amber-600">{formatCurrency(calculateClientBalance(selectedClientForPayment.id))}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="number" 
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Cash', 'Card', 'Bank'].map(method => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={cn(
                          "py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border-2 cursor-pointer",
                          paymentMethod === method 
                            ? "bg-primary/10 border-primary text-primary" 
                            : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100"
                        )}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 py-2.5 sm:py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRecordPayment}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                  className="flex-1 py-2.5 sm:py-3 bg-primary text-white rounded-xl font-bold text-xs shadow-md shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:shadow-none cursor-pointer"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => { setIsDeleteConfirmOpen(false); setClientToDelete(null); }}
        onConfirm={confirmDelete}
        title={t.confirmDelete}
        message={`${t.confirmDelete} ${clients.find(c => c.id === clientToDelete)?.name}?`}
        type="danger"
      />
    </div>
  );
}
