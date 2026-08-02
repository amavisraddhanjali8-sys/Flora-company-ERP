import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Edit2, 
  DollarSign, 
  TrendingDown, 
  Calendar, 
  Tag, 
  Building2, 
  X, 
  Camera,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { Expense, Transaction, CompanySettings, Supplier } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

import { translations, Language } from '../../i18n';
import ConfirmModal from '../layout/ConfirmModal';

interface ExpenseSystemProps {
  expenses: Expense[];
  onUpdateExpenses: (expenses: Expense[]) => void;
  onUpdateTransactions: (transaction: Transaction) => void;
  companySettings: CompanySettings;
  suppliers: Supplier[];
  onAddAuditLog?: (action: string, details: string, category: any, type?: any) => void;
  language?: Language;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#f43f5e', '#eab308', '#06b6d4', '#6366f1', '#ec4899', '#94a3b8'];

export default function ExpenseSystem({ 
  expenses, 
  onUpdateExpenses, 
  onUpdateTransactions,
  companySettings,
  suppliers,
  onAddAuditLog,
  language = 'en',
  searchQuery,
  setSearchQuery
}: ExpenseSystemProps) {
  const t = translations[language];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  const expenseCategories = companySettings.expenseCategories || [];

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.vendor.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         exp.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || exp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  const categoryData = expenseCategories.map((cat, i) => ({
    name: cat,
    value: expenses.filter(exp => exp.category === cat).reduce((sum, exp) => sum + exp.amount, 0),
    color: COLORS[i % COLORS.length]
  })).filter(d => d.value > 0);

  const handleSaveExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const supplierId = formData.get('supplierId') as string;
    const supplier = suppliers.find(s => s.id === supplierId);

    const expenseData: Expense = {
      id: editingExpense?.id || Date.now().toString(),
      expenseNumber: editingExpense?.expenseNumber || `EXP-${Math.floor(100000 + Math.random() * 900000)}`,
      vendor: supplier ? supplier.name : formData.get('vendor') as string,
      category: formData.get('category') as string,
      amount: Number(formData.get('amount')),
      date: formData.get('date') as string,
      paymentMethod: formData.get('paymentMethod') as string,
      status: 'Paid',
      description: formData.get('description') as string,
      reference: formData.get('reference') as string,
      supplierId: supplierId || undefined,
      supplierName: supplier ? supplier.name : undefined
    };

    if (editingExpense) {
      onUpdateExpenses(expenses.map(exp => exp.id === editingExpense.id ? expenseData : exp));
      onAddAuditLog?.('Expense Updated', `Expense #${expenseData.expenseNumber} updated: ${expenseData.vendor}`, 'accounting');
    } else {
      onUpdateExpenses([expenseData, ...expenses]);
      onAddAuditLog?.('Expense Recorded', `New expense recorded: ${expenseData.vendor} - ${formatCurrency(expenseData.amount, companySettings.currency)}`, 'accounting', 'success');
      
      // Sync with Accounting
      const transaction: Transaction = {
        id: Date.now().toString(),
        type: 'Expense',
        category: expenseData.category,
        amount: expenseData.amount,
        date: expenseData.date,
        description: `Expense: ${expenseData.vendor} - ${expenseData.description}`,
        status: 'Completed',
        paymentMethod: expenseData.paymentMethod,
        supplierId: expenseData.supplierId,
        supplierName: expenseData.supplierName
      };
      onUpdateTransactions(transaction);
    }

    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenseToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (expenseToDelete) {
      onUpdateExpenses(expenses.filter(exp => exp.id !== expenseToDelete));
      onAddAuditLog?.('Expense Deleted', `Expense ID: ${expenseToDelete} removed`, 'accounting', 'warning');
      setExpenseToDelete(null);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Expense portal</h1>
            <p className="text-xs text-gray-500 font-medium">Track and manage business expenditures</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-all w-64"
              />
            </div>
            <button 
              onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
            >
              <Plus size={14} /> Record Expense
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Stats & Chart */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-50 rounded-xl">
                  <TrendingDown size={24} className="text-red-500" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400">Total expenses</p>
                  <p className="text-xl font-black text-gray-900">{formatCurrency(totalExpenses)}</p>
                </div>
              </div>
              <div className="h-32 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {categoryData.slice(0, 4).map((data, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: data.color }} />
                      <span className="text-[9px] font-bold text-gray-500">{data.name}</span>
                    </div>
                    <span className="text-[9px] font-black text-gray-900">{formatCurrency(data.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary p-4 rounded-xl shadow-xl shadow-primary/20 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-white font-bold text-xs mb-1">Budget status</h3>
                <p className="text-white/70 text-[9px] font-medium mb-3">Monthly limit: {formatCurrency(50000)}</p>
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mb-1.5">
                  <div 
                    className="h-full bg-white transition-all duration-500" 
                    style={{ width: `${Math.min(100, (totalExpenses / 50000) * 100)}%` }}
                  />
                </div>
                <p className="text-white text-[9px] font-black text-right">
                  {(((totalExpenses || 0) / 50000) * 100).toFixed(1)}% used
                </p>
              </div>
              <DollarSign className="absolute -right-2 -bottom-2 text-white/10 w-24 h-24" />
            </div>
          </div>

          {/* Right Column: Expense List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-xs font-black text-gray-900 tracking-tight">Recent expenditures</h3>
              <div className="flex gap-2">
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[9px] font-bold text-gray-600 focus:outline-none focus:border-primary"
                >
                  <option value="All">All categories</option>
                  {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {filteredExpenses.map((exp) => (
                <motion.div 
                  layout
                  key={exp.id}
                  className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                        <Tag size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-gray-900 tracking-tight">{exp.vendor}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                            <Calendar size={9} /> {new Date(exp.date).toLocaleDateString()}
                          </span>
                          <span className="text-[9px] font-bold text-primary flex items-center gap-1">
                            <Tag size={9} /> {exp.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="text-base font-black text-gray-900">{formatCurrency(exp.amount)}</p>
                        <p className="text-[8px] text-gray-400 font-bold">{exp.paymentMethod}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditingExpense(exp); setIsModalOpen(true); }}
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {exp.description && (
                    <p className="mt-2 text-[9px] text-gray-500 italic border-t border-gray-50 pt-2">
                      {exp.description}
                    </p>
                  )}
                </motion.div>
              ))}
              {filteredExpenses.length === 0 && (
                <div className="bg-white py-12 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <DollarSign size={48} strokeWidth={1} />
                  <p className="text-sm font-medium">No expenses recorded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Record Expense Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSaveExpense}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                      {editingExpense ? 'Edit Expense' : 'Record New Expense'}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">Enter expenditure details for accounting</p>
                  </div>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Supplier (Optional)</label>
                    <select 
                      name="supplierId"
                      defaultValue={editingExpense?.supplierId || ''}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all appearance-none"
                    >
                      <option value="">Select Supplier (or enter vendor below)</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vendor / Payee (if no supplier)</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        name="vendor"
                        defaultValue={editingExpense?.vendor}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                        placeholder="e.g. Electric Company, Office Supplies Ltd"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        name="amount"
                        type="number"
                        step="0.01"
                        required
                        defaultValue={editingExpense?.amount}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-black focus:outline-none focus:border-primary transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        name="date"
                        type="date"
                        required
                        defaultValue={editingExpense?.date || new Date().toISOString().split('T')[0]}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                    <select 
                      name="category"
                      required
                      defaultValue={editingExpense?.category || expenseCategories[0] || 'Other'}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all appearance-none"
                    >
                      {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</label>
                    <select 
                      name="paymentMethod"
                      required
                      defaultValue={editingExpense?.paymentMethod || 'Cash'}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all appearance-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Card">Card</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description / Notes</label>
                    <textarea 
                      name="description"
                      rows={2}
                      defaultValue={editingExpense?.description}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-primary transition-all resize-none"
                      placeholder="What was this expense for?"
                    />
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reference / Invoice #</label>
                    <input 
                      name="reference"
                      defaultValue={editingExpense?.reference}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                      placeholder="e.g. INV-12345"
                    />
                  </div>
                </div>
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all"
                  >
                    {editingExpense ? 'Update Expense' : 'Save Expenditure'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? This action cannot be undone."
        type="danger"
        language={language}
      />
    </div>
  );
}
