import React, { useRef, useState } from 'react';
import { 
  X, Printer, Download, FileText, TrendingUp, TrendingDown, DollarSign, 
  ArrowUpRight, ArrowDownRight, Building2, Calendar, Scale, CheckCircle2, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportHtmlElementToPdf } from '../../lib/pdf-utils';
import { CompanySettings, Transaction, LedgerAccount, LedgerEntry } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';
import { useNotifications } from '../../context/NotificationContext';

interface AccountingReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  companySettings: CompanySettings;
  transactions: Transaction[];
  ledgerAccounts: LedgerAccount[];
  ledgerEntries: LedgerEntry[];
  onAddAuditLog?: (action: string, details: string, category: any, type?: any) => void;
  initialReportType?: 'management' | 'journal' | 'statements' | 'accounts' | 'audit-package';
}

type ModalReportType = 'management' | 'journal' | 'statements' | 'accounts' | 'audit-package';

export default function AccountingReportModal({
  isOpen,
  onClose,
  companySettings,
  transactions,
  ledgerAccounts,
  ledgerEntries,
  onAddAuditLog,
  initialReportType = 'management'
}: AccountingReportModalProps) {
  const { addNotification } = useNotifications();
  const reportRef = useRef<HTMLDivElement>(null);
  const [reportCategory, setReportCategory] = useState<ModalReportType>(initialReportType);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  if (!isOpen) return null;

  // Financial Calculations
  const totalIncome = ledgerEntries.reduce((sum, entry) => {
    const account = ledgerAccounts.find(a => a.id === entry.accountId);
    if (account?.type === 'Revenue') {
      return sum + (entry.credit - entry.debit);
    }
    return sum;
  }, 0);

  const totalExpenses = ledgerEntries.reduce((sum, entry) => {
    const account = ledgerAccounts.find(a => a.id === entry.accountId);
    if (account?.type === 'Expense') {
      return sum + (entry.debit - entry.credit);
    }
    return sum;
  }, 0);

  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0';

  // Accounts Balance Summary by Type
  const assetAccounts = ledgerAccounts.filter(a => a.type === 'Asset');
  const liabilityAccounts = ledgerAccounts.filter(a => a.type === 'Liability');
  const equityAccounts = ledgerAccounts.filter(a => a.type === 'Equity');

  const totalAssets = assetAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalEquity = equityAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  const getReportTitle = () => {
    switch (reportCategory) {
      case 'management': return 'Monthly Management Review & Executive Report';
      case 'journal': return 'General Journal Audit Entry Register';
      case 'statements': return 'Financial Statements (P&L & Balance Sheet)';
      case 'accounts': return 'Chart of Accounts Directory';
      case 'audit-package': return 'Full Financial Audit Package';
      default: return 'Financial Accounting Report';
    }
  };

  // PDF Export using custom margin and page-aware slicer
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPDF(true);
    try {
      const docTitle = getReportTitle();
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `${companySettings.name.replace(/\s+/g, '_')}_${reportCategory.toUpperCase()}_Report_${dateStr}.pdf`;

      await exportHtmlElementToPdf({
        element: reportRef.current,
        documentTitle: docTitle,
        companyName: companySettings.name,
        filename
      });

      onAddAuditLog?.('PDF Export', `Exported ${docTitle} to PDF file`, 'accounting', 'info');
      addNotification({
        title: 'PDF Export Complete',
        message: `${docTitle} has been downloaded successfully as a formatted PDF file.`,
        type: 'success',
        category: 'accounting'
      });
    } catch (error) {
      console.error('PDF Export Error:', error);
      addNotification({
        title: 'Export Failed',
        message: 'Failed to generate PDF document. Please try the Print option.',
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-4 overflow-y-auto print:p-0 print:bg-white print:static print:z-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden print:max-w-none print:max-h-none print:shadow-none print:border-none print:rounded-none"
        >
          {/* Top Action Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 bg-gray-900 text-white border-b border-gray-800 gap-4 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/20 text-primary rounded-xl flex items-center justify-center font-black">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight">{getReportTitle()}</h3>
                <p className="text-[10px] text-gray-400 font-bold">Official formatted PDF export & print portal</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-gray-700 cursor-pointer"
              >
                <Printer size={14} /> Print Document
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
                    <Download size={14} /> Export PDF File
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

          {/* Report Selection Tabs (Hidden in Print) */}
          <div className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 border-b border-gray-200 overflow-x-auto print:hidden">
            {[
              { id: 'management', label: 'Executive Review', icon: FileText },
              { id: 'statements', label: 'Financial Statements', icon: Scale },
              { id: 'journal', label: 'General Journal', icon: Layers },
              { id: 'accounts', label: 'Chart of Accounts', icon: Building2 },
              { id: 'audit-package', label: 'Full Audit Package', icon: CheckCircle2 }
            ].map((t) => {
              const Icon = t.icon;
              const isActive = reportCategory === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setReportCategory(t.id as ModalReportType)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                    isActive 
                      ? "bg-white text-primary shadow-sm border border-gray-200" 
                      : "text-gray-600 hover:bg-gray-200/60"
                  )}
                >
                  <Icon size={14} className={isActive ? "text-primary" : "text-gray-400"} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Printable Document Body */}
          <div className="p-6 md:p-8 overflow-y-auto space-y-8 bg-white print:p-0 print:overflow-visible" ref={reportRef}>
            
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
                  Accounting PDF Report
                </div>
                <h2 className="text-xs font-black text-gray-900 uppercase tracking-tight">{getReportTitle()}</h2>
                <div className="space-y-0.5 mt-2 text-[10px] font-bold text-gray-500">
                  <p className="flex justify-between gap-2"><span>Date Generated:</span> <span className="text-gray-900">{new Date().toLocaleDateString()}</span></p>
                  <p className="flex justify-between gap-2"><span>Currency:</span> <span className="text-gray-900">{companySettings.currency}</span></p>
                  <p className="flex justify-between gap-2"><span>Profit Margin:</span> <span className="text-emerald-600 font-black">{profitMargin}%</span></p>
                </div>
              </div>
            </div>

            {/* 2. Key KPI Overview (For Management, Statements, Audit Package) */}
            {(reportCategory === 'management' || reportCategory === 'statements' || reportCategory === 'audit-package') && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
                  <div className="flex items-center justify-between text-emerald-600 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider">Total Revenue</span>
                    <ArrowUpRight size={18} />
                  </div>
                  <h3 className="text-lg font-black text-emerald-950">{formatCurrency(totalIncome)}</h3>
                  <p className="text-[9px] text-emerald-700 font-bold mt-0.5">Gross Revenue & Sales</p>
                </div>

                <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-100">
                  <div className="flex items-center justify-between text-rose-600 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider">Total Expenses</span>
                    <ArrowDownRight size={18} />
                  </div>
                  <h3 className="text-lg font-black text-rose-950">{formatCurrency(totalExpenses)}</h3>
                  <p className="text-[9px] text-rose-700 font-bold mt-0.5">Cost of Goods & Operations</p>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between text-gray-400 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider">Net Operating Profit</span>
                    <DollarSign size={18} className="text-primary" />
                  </div>
                  <h3 className={cn("text-lg font-black", netProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                    {formatCurrency(netProfit)}
                  </h3>
                  <p className="text-[9px] text-gray-500 font-bold mt-0.5">Bottom Line Margin</p>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between text-gray-400 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider">Total Assets</span>
                    <Scale size={18} className="text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-black text-gray-900">{formatCurrency(totalAssets)}</h3>
                  <p className="text-[9px] text-gray-500 font-bold mt-0.5">Cash, Inventory, & Bank</p>
                </div>
              </div>
            )}

            {/* 3. Financial Statements Content */}
            {(reportCategory === 'management' || reportCategory === 'statements' || reportCategory === 'audit-package') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Income Statement */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h4 className="text-xs font-black uppercase text-gray-900 flex items-center gap-2">
                      <TrendingUp size={14} className="text-emerald-600" />
                      Income Statement (Profit & Loss)
                    </h4>
                    <span className="text-[10px] font-bold text-gray-400">P&L Summary</span>
                  </div>

                  <div className="space-y-2 text-xs font-bold">
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-600">Gross Sales Revenue</span>
                      <span className="text-emerald-600 font-black">{formatCurrency(totalIncome)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-600">Cost of Goods Sold (COGS)</span>
                      <span className="text-rose-600 font-black">-{formatCurrency(totalExpenses * 0.65)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-600">Operating Expenses & Procurement</span>
                      <span className="text-rose-600 font-black">-{formatCurrency(totalExpenses * 0.35)}</span>
                    </div>
                    <div className="flex justify-between py-2 bg-gray-50 px-2 rounded-lg font-black">
                      <span className="text-gray-900">Net Profit Before Taxes</span>
                      <span className={netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}>
                        {formatCurrency(netProfit)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Balance Sheet Highlights */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h4 className="text-xs font-black uppercase text-gray-900 flex items-center gap-2">
                      <Scale size={14} className="text-indigo-600" />
                      Balance Sheet Position
                    </h4>
                    <span className="text-[10px] font-bold text-gray-400">Equity & Reserves</span>
                  </div>

                  <div className="space-y-2 text-xs font-bold">
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-600">Total Asset Holdings</span>
                      <span className="text-indigo-600 font-black">{formatCurrency(totalAssets)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-600">Current Liabilities (Payables)</span>
                      <span className="text-rose-600 font-black">{formatCurrency(totalLiabilities)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-600">Owner's Equity & Reserves</span>
                      <span className="text-emerald-600 font-black">{formatCurrency(totalEquity)}</span>
                    </div>
                    <div className="flex justify-between py-2 bg-gray-50 px-2 rounded-lg font-black">
                      <span className="text-gray-900">Working Capital Buffer</span>
                      <span className="text-primary">{formatCurrency(totalAssets - totalLiabilities)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Chart of Accounts Table (For Accounts, Management, Audit Package) */}
            {(reportCategory === 'management' || reportCategory === 'accounts' || reportCategory === 'audit-package') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-gray-900 tracking-wider flex items-center gap-1.5">
                    <Building2 size={14} className="text-primary" />
                    Ledger Accounts Directory ({ledgerAccounts.length} Accounts)
                  </h4>
                  <span className="text-[10px] font-bold text-gray-400">Account Balances</span>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase font-black text-gray-500">
                      <tr>
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-3">Account Name</th>
                        <th className="py-2.5 px-3">Account Type</th>
                        <th className="py-2.5 px-3 text-right">Current Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
                      {ledgerAccounts.map((acc) => (
                        <tr key={acc.id} className="hover:bg-gray-50/50">
                          <td className="py-2 px-3 font-mono font-bold text-primary">{acc.code}</td>
                          <td className="py-2 px-3 font-bold">{acc.name}</td>
                          <td className="py-2 px-3 text-gray-500 text-[11px]">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-black uppercase",
                              acc.type === 'Asset' ? "bg-blue-100 text-blue-700" :
                              acc.type === 'Revenue' ? "bg-emerald-100 text-emerald-700" :
                              acc.type === 'Expense' ? "bg-rose-100 text-rose-700" : "bg-purple-100 text-purple-700"
                            )}>
                              {acc.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-black">{formatCurrency(acc.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. General Journal Entries Table (For Journal, Audit Package) */}
            {(reportCategory === 'journal' || reportCategory === 'audit-package') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-gray-900 tracking-wider flex items-center gap-1.5">
                    <Layers size={14} className="text-primary" />
                    General Journal Entry Register ({ledgerEntries.length} Transactions)
                  </h4>
                  <span className="text-[10px] font-bold text-gray-400">Itemized Debits & Credits</span>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase font-black text-gray-500">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Description / Ref</th>
                        <th className="py-2.5 px-3">Account</th>
                        <th className="py-2.5 px-3 text-right">Debit</th>
                        <th className="py-2.5 px-3 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
                      {ledgerEntries.map((e) => {
                        const account = ledgerAccounts.find(a => a.id === e.accountId);
                        return (
                          <tr key={e.id} className="hover:bg-gray-50/50">
                            <td className="py-2 px-3 text-gray-500 font-medium">{new Date(e.date).toLocaleDateString()}</td>
                            <td className="py-2 px-3">
                              <p className="font-bold text-gray-800">{e.description}</p>
                              <p className="text-[9px] text-gray-400 uppercase font-mono">Ref: {e.referenceId}</p>
                            </td>
                            <td className="py-2 px-3 font-bold text-gray-600">{account?.name || 'Unknown'}</td>
                            <td className="py-2 px-3 text-right font-black text-rose-600">
                              {e.debit > 0 ? formatCurrency(e.debit) : '-'}
                            </td>
                            <td className="py-2 px-3 text-right font-black text-emerald-600">
                              {e.credit > 0 ? formatCurrency(e.credit) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. Formal Management Approval Signatures */}
            <div className="pt-8 border-t border-gray-200 grid grid-cols-2 gap-8 text-xs font-bold text-gray-600">
              <div>
                <p className="text-gray-400 uppercase text-[9px] font-black tracking-wider mb-6">Prepared By (Chief Accountant)</p>
                <div className="border-b border-gray-300 w-48 mb-1" />
                <p className="text-gray-900 font-bold">Signature & Date</p>
              </div>

              <div className="text-right">
                <p className="text-gray-400 uppercase text-[9px] font-black tracking-wider mb-6">Reviewed & Approved By (CFO / Director)</p>
                <div className="border-b border-gray-300 w-48 ml-auto mb-1" />
                <p className="text-gray-900 font-bold">Official Approval Stamp</p>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

