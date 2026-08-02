import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart as PieChartIcon, 
  Download, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  LineChart as LineChartIcon,
  Package,
  History,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  FileText,
  Table as TableIcon,
  ChevronRight,
  Printer,
  Building2,
  Phone,
  Mail,
  Globe,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  Cell,
  PieChart,
  Pie,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { MOCK_TRANSACTIONS, PRODUCTS } from '../../constants';
import { formatCurrency } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { CompanySettings, Transaction, LedgerAccount, LedgerEntry } from '../../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { handleHtml2CanvasClone, exportHtmlElementToPdf } from '../../lib/pdf-utils';

import PrintPortal from '../layout/PrintPortal';
import ConfirmModal from '../layout/ConfirmModal';
import AccountingReportModal from './AccountingReportModal';
import { useNotifications } from '../../context/NotificationContext';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, Header, Footer } from 'docx';
import { saveAs } from 'file-saver';

import { translations, Language } from '../../i18n';

interface AccountingSystemProps {
  companySettings: CompanySettings;
  transactions: Transaction[];
  onUpdateTransactions: (transactions: Transaction[]) => void;
  onAddAuditLog?: (action: string, details: string, category: any, type?: any) => void;
  language?: Language;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  ledgerAccounts: LedgerAccount[];
  ledgerEntries: LedgerEntry[];
  onUpdateLedgerAccounts: (accounts: LedgerAccount[]) => void;
  onUpdateLedgerEntries: (entries: LedgerEntry[]) => void;
}

type AccountingTab = 'dashboard' | 'journals' | 'ledger' | 'statements' | 'accounts';

export default function AccountingSystem({ 
  companySettings, 
  transactions, 
  onUpdateTransactions, 
  onAddAuditLog, 
  language = 'en',
  searchQuery,
  setSearchQuery,
  ledgerAccounts,
  ledgerEntries,
  onUpdateLedgerAccounts,
  onUpdateLedgerEntries
}: AccountingSystemProps) {
  const t = translations[language];
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<AccountingTab>('dashboard');
  const [reportType, setReportType] = useState<'financial' | 'inventory' | 'sales' | 'forecasting'>('financial');
  
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isManagementReportOpen, setIsManagementReportOpen] = useState(false);
  const [showPrintPortal, setShowPrintPortal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingAccount, setEditingAccount] = useState<LedgerAccount | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const reportRef = React.useRef<HTMLDivElement>(null);

  // Financial Data
  const totalIncome = ledgerAccounts.filter(a => a.type === 'Revenue').reduce((sum, a) => sum + a.balance, 0);
  const totalExpenses = ledgerAccounts.filter(a => a.type === 'Expense').reduce((sum, a) => sum + a.balance, 0);
  const netProfit = totalIncome - totalExpenses;
  const cashOnHand = ledgerAccounts.find(a => a.id === 'acc-cash')?.balance || 0;
  const bankBalance = ledgerAccounts.find(a => a.id === 'acc-bank')?.balance || 0;
  const totalCash = cashOnHand + bankBalance;
  const totalAR = ledgerAccounts.filter(a => a.id === 'acc-ar' || a.id.startsWith('acc-client-')).reduce((sum, a) => sum + a.balance, 0);
  const totalAP = ledgerAccounts.filter(a => a.id === 'acc-ap' || a.id.startsWith('acc-supplier-')).reduce((sum, a) => sum + a.balance, 0);

  // Dynamic Monthly Data for Charts
  const monthlyData = useMemo(() => {
    const last6Months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({
        name: d.toLocaleString('default', { month: 'short' }),
        month: d.getMonth(),
        year: d.getFullYear(),
        income: 0,
        expense: 0
      });
    }

    ledgerEntries.forEach(entry => {
      const entryDate = new Date(entry.date);
      const monthIdx = last6Months.findIndex(m => m.month === entryDate.getMonth() && m.year === entryDate.getFullYear());
      
      if (monthIdx !== -1) {
        const account = ledgerAccounts.find(a => a.id === entry.accountId);
        if (account) {
          if (account.type === 'Revenue') {
            last6Months[monthIdx].income += (entry.credit - entry.debit);
          } else if (account.type === 'Expense') {
            last6Months[monthIdx].expense += (entry.debit - entry.credit);
          }
        }
      }
    });

    return last6Months;
  }, [ledgerEntries, ledgerAccounts]);

  // Dynamic Category Data for Charts
  const categoryData = useMemo(() => {
    const expensesByAccount: Record<string, number> = {};
    
    ledgerEntries.forEach(entry => {
      const account = ledgerAccounts.find(a => a.id === entry.accountId);
      if (account && account.type === 'Expense') {
        const amount = entry.debit - entry.credit;
        if (amount > 0) {
          expensesByAccount[account.name] = (expensesByAccount[account.name] || 0) + amount;
        }
      }
    });

    const colors = ['#2563eb', '#3b82f6', '#10b981', '#8b5cf6', '#f43f5e', '#64748b'];
    return Object.entries(expensesByAccount)
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [ledgerEntries, ledgerAccounts]);

  const performanceSummary = useMemo(() => {
    const highestIncomeMonth = [...monthlyData].sort((a, b) => b.income - a.income)[0];
    const highestExpenseMonth = [...monthlyData].sort((a, b) => b.expense - a.expense)[0];
    
    if (!highestIncomeMonth || (highestIncomeMonth.income === 0 && highestIncomeMonth.expense === 0)) {
      return "No significant financial activity recorded in the last 6 months.";
    }

    return `The monthly performance analysis shows the financial trends over the last 6 months. 
            The highest income was recorded in ${highestIncomeMonth.name} at ${formatCurrency(highestIncomeMonth.income)}, 
            while expenses peaked in ${highestExpenseMonth.name} at ${formatCurrency(highestExpenseMonth.expense)}.`;
  }, [monthlyData]);

  const handleExport = (format: 'pdf' | 'csv' | 'download-pdf') => {
    if (format === 'csv') {
      let data: any[] = [];
      let headers: string[] = [];
      let filename = `accounting_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
      
      let csvMetadata = `${companySettings.name}\n`;
      csvMetadata += `${companySettings.address}\n`;
      csvMetadata += `Phone: ${companySettings.phones?.join(', ') || 'N/A'}\n`;
      csvMetadata += `Report: ${activeTab.toUpperCase()}\n`;
      csvMetadata += `Generated: ${new Date().toLocaleString()}\n\n`;

      if (activeTab === 'journals' || activeTab === 'dashboard') {
        data = ledgerEntries;
        headers = ['Date', 'Description', 'Account', 'Debit', 'Credit'];
        const rows = data.map(e => {
          const account = ledgerAccounts.find(a => a.id === e.accountId);
          return [
            e.date,
            `"${e.description.replace(/"/g, '""')}"`,
            account?.name || 'Unknown',
            e.debit,
            e.credit
          ];
        });
        const csvContent = csvMetadata + [headers, ...rows].map(e => e.join(",")).join("\n");
        downloadCSV(csvContent, filename);
      } else if (activeTab === 'accounts') {
        data = ledgerAccounts;
        headers = ['Code', 'Name', 'Type', 'Balance', 'Description'];
        const rows = data.map(a => [
          a.code,
          `"${a.name.replace(/"/g, '""')}"`,
          a.type,
          a.balance,
          `"${(a.description || '').replace(/"/g, '""')}"`
        ]);
        const csvContent = csvMetadata + [headers, ...rows].map(e => e.join(",")).join("\n");
        downloadCSV(csvContent, filename);
      } else if (activeTab === 'ledger') {
        headers = ['Account Code', 'Account Name', 'Date', 'Description', 'Debit', 'Credit'];
        const rows: any[] = [];
        ledgerAccounts.forEach(acc => {
          const accEntries = ledgerEntries.filter(e => e.accountId === acc.id);
          accEntries.forEach(e => {
            rows.push([
              acc.code,
              `"${acc.name.replace(/"/g, '""')}"`,
              e.date,
              `"${e.description.replace(/"/g, '""')}"`,
              e.debit,
              e.credit
            ]);
          });
        });
        const csvContent = csvMetadata + [headers, ...rows].map(e => e.join(",")).join("\n");
        downloadCSV(csvContent, filename);
      } else if (activeTab === 'statements') {
        headers = ['Statement Type', 'Category', 'Description', 'Amount'];
        const rows: any[] = [];
        
        // Profit & Loss
        rows.push(['Profit & Loss', 'Revenue', 'Sales Revenue', totalIncome]);
        rows.push(['Profit & Loss', 'Expenses', 'Cost of Goods Sold', totalExpenses * 0.7]);
        rows.push(['Profit & Loss', 'Expenses', 'Operating Expenses', totalExpenses * 0.3]);
        rows.push(['Profit & Loss', 'Summary', 'Net Income', netProfit]);
        
        rows.push([]); // Empty row
        
        // Balance Sheet
        rows.push(['Balance Sheet', 'Assets', 'Cash & Bank', 125400]);
        rows.push(['Balance Sheet', 'Assets', 'Inventory', 45800]);
        rows.push(['Balance Sheet', 'Liabilities', 'Accounts Payable', 12500]);
        rows.push(['Balance Sheet', 'Equity', "Owner's Equity", 158700]);
        
        const csvContent = csvMetadata + [headers, ...rows].map(e => e.join(",")).join("\n");
        downloadCSV(csvContent, filename);
      }
    } else if (format === 'pdf') {
      setShowPrintPortal(true);
    } else if (format === 'download-pdf') {
      handleGeneratePDF(false);
    }
  };

  const handleGeneratePDF = async (isPreview: boolean = false) => {
    if (!reportRef.current) return;
    setIsGeneratingPDF(true);
    try {
      const docTitle = `Accounting Report - ${activeTab.toUpperCase()}`;
      const filename = `accounting_report_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`;

      await exportHtmlElementToPdf({
        element: reportRef.current,
        documentTitle: docTitle,
        companyName: companySettings.name,
        filename
      });

      onAddAuditLog?.('Report Downloaded', `Financial report exported as PDF (${activeTab})`, 'accounting', 'info');
      addNotification({
        title: 'PDF Export Complete',
        message: `Accounting ${activeTab.toUpperCase()} report downloaded successfully.`,
        type: 'success',
        category: 'accounting'
      });
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

  const handleDownloadDOCX = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPDF(true);
    
    try {
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: 720, // 0.5 inch
                right: 720,
                bottom: 720,
                left: 720,
              },
            },
          },
          headers: {
            default: new Header({
              children: [
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "2563eb" },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                  },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 60, type: WidthType.PERCENTAGE },
                          borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "2563eb" } },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: companySettings.name, bold: true, size: 24 }),
                              ],
                            }),
                            new Paragraph({
                              children: [
                                new TextRun({ text: companySettings.address, size: 16, color: "666666" }),
                              ],
                            }),
                          ],
                        }),
                        new TableCell({
                          width: { size: 40, type: WidthType.PERCENTAGE },
                          borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "2563eb" } },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "ACCOUNTING REPORT", bold: true, size: 20, color: "2563eb" }),
                              ],
                              alignment: AlignmentType.RIGHT,
                            }),
                            new Paragraph({
                              children: [
                                new TextRun({ text: `Type: ${activeTab.toUpperCase()}`, size: 14, color: "999999" }),
                              ],
                              alignment: AlignmentType.RIGHT,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: `© ${new Date().getFullYear()} ${companySettings.name} - Confidential`, size: 14, color: "999999" }),
                    new TextRun({ text: "\tPage ", size: 14, color: "999999" }),
                    new TextRun({ children: ["PAGE_NUMBER"], size: 14, color: "999999" }),
                    new TextRun({ text: " of ", size: 14, color: "999999" }),
                    new TextRun({ children: ["NUM_PAGES"], size: 14, color: "999999" }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
          },
          children: [
            new Paragraph({ text: "" }),
            // Summary Stats
            new Paragraph({
              children: [new TextRun({ text: "FINANCIAL SUMMARY", bold: true, size: 24, color: "111827" })],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Total Income: `, bold: true }),
                new TextRun({ text: formatCurrency(totalIncome) }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Total Expenses: `, bold: true }),
                new TextRun({ text: formatCurrency(totalExpenses) }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Net Profit: `, bold: true }),
                new TextRun({ text: formatCurrency(netProfit), color: netProfit >= 0 ? "10b981" : "ef4444" }),
              ],
            }),
            new Paragraph({ text: "" }),
            
            // Table based on active tab
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: activeTab === 'accounts' ? [
                new TableRow({
                  children: [
                    new TableCell({ shading: { fill: "f9fafb" }, children: [new Paragraph({ children: [new TextRun({ text: "Code", bold: true })] })] }),
                    new TableCell({ shading: { fill: "f9fafb" }, children: [new Paragraph({ children: [new TextRun({ text: "Account Name", bold: true })] })] }),
                    new TableCell({ shading: { fill: "f9fafb" }, children: [new Paragraph({ children: [new TextRun({ text: "Type", bold: true })] })] }),
                    new TableCell({ shading: { fill: "f9fafb" }, children: [new Paragraph({ children: [new TextRun({ text: "Balance", bold: true })] })] }),
                  ],
                }),
                ...ledgerAccounts.map(acc => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(acc.code)] }),
                    new TableCell({ children: [new Paragraph(acc.name)] }),
                    new TableCell({ children: [new Paragraph(acc.type)] }),
                    new TableCell({ children: [new Paragraph(formatCurrency(acc.balance))] }),
                  ],
                })),
              ] : activeTab === 'ledger' ? [
                new TableRow({
                  children: [
                    new TableCell({ shading: { fill: "f9fafb" }, children: [new Paragraph({ children: [new TextRun({ text: "Account", bold: true })] })] }),
                    new TableCell({ shading: { fill: "f9fafb" }, children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true })] })] }),
                    new TableCell({ shading: { fill: "f9fafb" }, children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true })] })] }),
                    new TableCell({ shading: { fill: "f9fafb" }, children: [new Paragraph({ children: [new TextRun({ text: "Debit", bold: true })] })] }),
                    new TableCell({ shading: { fill: "f9fafb" }, children: [new Paragraph({ children: [new TextRun({ text: "Credit", bold: true })] })] }),
                  ],
                }),
                ...ledgerAccounts.flatMap(acc => 
                  ledgerEntries.filter(e => e.accountId === acc.id).map(e => new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(acc.name)] }),
                      new TableCell({ children: [new Paragraph(new Date(e.date).toLocaleDateString())] }),
                      new TableCell({ children: [new Paragraph(e.description)] }),
                      new TableCell({ children: [new Paragraph(e.debit > 0 ? formatCurrency(e.debit) : "0")] }),
                      new TableCell({ children: [new Paragraph(e.credit > 0 ? formatCurrency(e.credit) : "0")] }),
                    ],
                  }))
                ),
              ] : [
                new TableRow({
                  children: [
                    new TableCell({ shading: { fill: "f9fafb" }, children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true })] })] }),
                    new TableCell({ shading: { fill: "f9fafb" }, children: [new Paragraph({ children: [new TextRun({ text: "Account", bold: true })] })] }),
                    new TableCell({ shading: { fill: "f9fafb" }, children: [new Paragraph({ children: [new TextRun({ text: "Debit", bold: true })] })] }),
                    new TableCell({ shading: { fill: "f9fafb" }, children: [new Paragraph({ children: [new TextRun({ text: "Credit", bold: true })] })] }),
                    new TableCell({ shading: { fill: "f9fafb" }, children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true })] })] }),
                  ],
                }),
                ...filteredEntries.map(e => {
                  const account = ledgerAccounts.find(a => a.id === e.accountId);
                  return new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(e.description)] }),
                      new TableCell({ children: [new Paragraph(account?.name || 'Unknown')] }),
                      new TableCell({ children: [new Paragraph(formatCurrency(e.debit))] }),
                      new TableCell({ children: [new Paragraph(formatCurrency(e.credit))] }),
                      new TableCell({ children: [new Paragraph(new Date(e.date).toLocaleDateString())] }),
                    ],
                  });
                }),
              ],
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `accounting_report_${activeTab}_${new Date().toISOString().split('T')[0]}.docx`);
      onAddAuditLog?.('Report Downloaded', `Financial report downloaded as DOCX`, 'accounting');
    } catch (error) {
      console.error('Error generating DOCX:', error);
      addNotification({
        title: 'DOCX Error',
        message: 'Failed to generate DOCX document.',
        type: 'error',
        category: 'system'
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadPDF = async () => {
    handleGeneratePDF(false);
  };


  const handleExportAll = () => {
    const filename = `full_accounting_report_${new Date().toISOString().split('T')[0]}.csv`;
    let csvContent = "";
    
    csvContent += `${companySettings.name}\n`;
    csvContent += `${companySettings.address}\n`;
    csvContent += `Phone: ${companySettings.phones.join(', ')}\n`;
    csvContent += `Report: FULL ACCOUNTING REPORT\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

    // Transactions
    csvContent += "TRANSACTIONS\n";
    csvContent += "Date,Description,Type,Category,Amount,Status\n";
    transactions.forEach(t => {
      csvContent += `${t.date},"${t.description.replace(/"/g, '""')}",${t.type},${t.category},${t.amount},${t.status}\n`;
    });
    csvContent += "\n\n";

    // Accounts
    csvContent += "CHART OF ACCOUNTS\n";
    csvContent += "Code,Name,Type,Balance,Description\n";
    ledgerAccounts.forEach(a => {
      csvContent += `${a.code},"${a.name.replace(/"/g, '""')}",${a.type},${a.balance},"${(a.description || '').replace(/"/g, '""')}"\n`;
    });
    csvContent += "\n\n";

    // Financial Summary
    csvContent += "FINANCIAL SUMMARY\n";
    csvContent += "Metric,Value\n";
    csvContent += `Total Income,${totalIncome}\n`;
    csvContent += `Total Expenses,${totalExpenses}\n`;
    csvContent += `Net Profit,${netProfit}\n`;

    downloadCSV(csvContent, filename);
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDelete = (id: string) => {
    setTransactionToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      const entryToDelete = ledgerEntries.find(e => e.id === transactionToDelete);
      if (entryToDelete) {
        // Reverse the balance impact
        const updatedAccounts = ledgerAccounts.map(a => {
          if (a.id === entryToDelete.accountId) {
            const newBalance = a.type === 'Asset' || a.type === 'Expense'
              ? a.balance - entryToDelete.debit + entryToDelete.credit
              : a.balance - entryToDelete.credit + entryToDelete.debit;
            return { ...a, balance: newBalance };
          }
          return a;
        });
        onUpdateLedgerAccounts(updatedAccounts);
        onUpdateLedgerEntries(ledgerEntries.filter(e => e.id !== transactionToDelete));
        onAddAuditLog?.('Ledger Entry Deleted', `Entry ID: ${transactionToDelete} removed`, 'accounting', 'warning');
      }
      setTransactionToDelete(null);
    }
  };

  const handleSaveAccount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const accountData: LedgerAccount = {
      id: editingAccount?.id || `acc-${Date.now()}`,
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      type: formData.get('type') as any,
      balance: Number(formData.get('balance')) || 0,
      description: formData.get('description') as string,
    };

    if (editingAccount) {
      onUpdateLedgerAccounts(ledgerAccounts.map(a => a.id === editingAccount.id ? accountData : a));
    } else {
      onUpdateLedgerAccounts([...ledgerAccounts, accountData]);
    }
    setIsAccountModalOpen(false);
    setEditingAccount(null);
  };

  const handleSaveTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    const type = formData.get('type') as string;
    const category = formData.get('category') as string;
    const date = formData.get('date') as string;
    const description = formData.get('description') as string;

    // Find the account
    const account = ledgerAccounts.find(a => a.name === category);
    if (!account) {
      addNotification({
        title: 'Account Not Found',
        message: `Could not find account: ${category}`,
        type: 'error',
        category: 'accounting'
      });
      return;
    }

    const newEntry: LedgerEntry = {
      id: `ent-${Date.now()}`,
      accountId: account.id,
      accountName: account.name,
      date,
      description,
      debit: (type === 'Expense' || type === 'Purchase') ? amount : 0,
      credit: (type === 'Income' || type === 'Sale') ? amount : 0,
      referenceId: 'Manual Entry'
    };

    onUpdateLedgerEntries([newEntry, ...ledgerEntries]);
    
    // Update account balance
    const updatedAccounts = ledgerAccounts.map(a => {
      if (a.id === account.id) {
        const newBalance = a.type === 'Asset' || a.type === 'Expense' 
          ? a.balance + newEntry.debit - newEntry.credit
          : a.balance + newEntry.credit - newEntry.debit;
        return { ...a, balance: newBalance };
      }
      return a;
    });
    onUpdateLedgerAccounts(updatedAccounts);

    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const filteredEntries = useMemo(() => {
    return ledgerEntries
      .map(e => {
        // Find associated transaction to determine type and status
        const transaction = transactions.find(t => t.id === e.referenceId || t.referenceId === e.referenceId);
        
        // Fallback type determination from description if transaction not found
        let entryType = transaction?.type;
        if (!entryType) {
          const desc = e.description.toLowerCase();
          if (desc.includes('sale') || desc.includes('invoice')) entryType = 'Sale';
          else if (desc.includes('expense')) entryType = 'Expense';
          else if (desc.includes('purchase') || desc.includes('stock')) entryType = 'Purchase';
          else if (desc.includes('income') || desc.includes('payment')) entryType = 'Income';
        }

        // Fallback status determination
        const entryStatus = transaction?.status || 'Completed';

        return { ...e, calculatedType: entryType, calculatedStatus: entryStatus };
      })
      .filter(e => {
        const searchLower = searchQuery.toLowerCase();
        const account = ledgerAccounts.find(a => a.id === e.accountId);
        const matchesSearch = e.description.toLowerCase().includes(searchLower) ||
                             (account?.name || '').toLowerCase().includes(searchLower) ||
                             e.id.toLowerCase().includes(searchLower);
        
        const entryDate = new Date(e.date);
        const matchesStartDate = !startDate || entryDate >= new Date(startDate);
        const matchesEndDate = !endDate || entryDate <= new Date(endDate + 'T23:59:59');
        
        const matchesType = filterType === 'All' || e.calculatedType === filterType;
        const matchesStatus = filterStatus === 'All' || e.calculatedStatus === filterStatus;
        
        return matchesSearch && matchesStartDate && matchesEndDate && matchesType && matchesStatus;
      });
  }, [ledgerEntries, transactions, searchQuery, ledgerAccounts, startDate, endDate, filterType, filterStatus]);

  return (
    <div className="flex-1 bg-gray-50 p-4 overflow-y-auto print:p-0 print:bg-white">
      <div ref={reportRef} data-print-root className="max-w-7xl mx-auto space-y-6 print:space-y-0 print:max-w-none print:p-[20mm]">
        
        {/* Print Header (Visible only when printing or in PDF) */}
        <div className="hidden print:block border-b-2 border-primary pb-6 mb-8 w-full">
          <div className="grid grid-cols-[1fr_auto] gap-8 items-start">
            <div className="flex gap-6 items-start">
              {companySettings.logo && (
                <div className="w-24 h-24 flex-shrink-0">
                  <img 
                    src={companySettings.logo} 
                    alt="Logo" 
                    className="w-full h-full object-contain" 
                    referrerPolicy="no-referrer" 
                    style={{ width: '96px', height: '96px' }}
                  />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-black text-gray-900 uppercase mb-1 leading-tight">{companySettings.name}</h1>
                <p className="text-[10px] font-bold text-gray-500 uppercase max-w-md leading-normal">{companySettings.address}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4">
                  {companySettings.phones.map((p, i) => (
                    <span key={i} className="text-[9px] font-bold text-gray-400 flex items-center gap-1.5">
                      <Phone size={10} className="text-primary" /> {p}
                    </span>
                  ))}
                  {companySettings.email && (
                    <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1.5">
                      <Mail size={10} className="text-primary" /> {companySettings.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right min-w-[200px]">
              <h2 className="text-lg font-black text-primary uppercase tracking-widest mb-2">Formal Accounting Report</h2>
              <div className="space-y-1 border-t border-gray-100 pt-2">
                <div className="flex justify-between gap-4">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Document Type:</span>
                  <span className="text-[9px] font-black text-gray-900 uppercase">{activeTab}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Generated:</span>
                  <span className="text-[9px] font-black text-gray-900 uppercase">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Currency:</span>
                  <span className="text-[9px] font-black text-gray-900 uppercase">{companySettings.currency}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Summary Section (Visible in print/PDF) */}
        <div className="hidden print:block mb-8 border-b border-gray-100 pb-8 w-full">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="w-1/3 pr-3">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Revenue</p>
                  <p className="text-xl font-black text-green-600">{formatCurrency(totalIncome)}</p>
                  <p className="text-[8px] text-gray-400 mt-1 uppercase font-bold">Total sales and income</p>
                </div>
              </td>
              <td className="w-1/3 px-3">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Expenses</p>
                  <p className="text-xl font-black text-red-600">{formatCurrency(totalExpenses)}</p>
                  <p className="text-[8px] text-gray-400 mt-1 uppercase font-bold">Total costs and purchases</p>
                </div>
              </td>
              <td className="w-1/3 pl-3">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Net Profit/Loss</p>
                  <p className={cn("text-xl font-black", netProfit >= 0 ? "text-primary" : "text-red-600")}>{formatCurrency(netProfit)}</p>
                  <p className="text-[8px] text-gray-400 mt-1 uppercase font-bold">Bottom line performance</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Accounting Portal</h1>
            <p className="text-xs text-gray-500">Manage journals, ledgers, and financial statements</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsManagementReportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Export print-friendly monthly management review report"
            >
              <FileText size={14} /> PDF Export
            </button>
            <button 
              onClick={() => { setEditingAccount(null); setIsAccountModalOpen(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all"
            >
              <Plus size={14} />
              New Account
            </button>
            <button 
              onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={14} />
              New Transaction
            </button>
            {transactions?.length > 0 && (
              <button 
                onClick={() => setIsClearConfirmOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all"
              >
                <Trash2 size={14} />
                Clear All
              </button>
            )}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                <Download size={14} />
                Export
              </button>
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button 
                  onClick={() => setIsManagementReportOpen(true)}
                  className="w-full px-4 py-2 text-left text-[10px] font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-b border-gray-100"
                >
                  <FileText size={12} /> Monthly Review PDF Report
                </button>
                <button 
                  onClick={() => handleExport('download-pdf')} 
                  disabled={isGeneratingPDF}
                  className="w-full px-4 py-2 text-left text-[10px] font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingPDF ? <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <FileText size={12} />}
                  {isGeneratingPDF ? 'Generating...' : 'Preview & Download PDF'}
                </button>
                <button 
                  onClick={handleDownloadDOCX} 
                  disabled={isGeneratingPDF}
                  className="w-full px-4 py-2 text-left text-[10px] font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingPDF ? <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <Download size={12} />}
                  {isGeneratingPDF ? 'Generating...' : 'Download DOCX'}
                </button>
                <button onClick={() => handleExport('pdf')} className="w-full px-4 py-2 text-left text-[10px] font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                  <Printer size={12} /> Print Document
                </button>
                <button onClick={() => handleExport('csv')} className="w-full px-4 py-2 text-left text-[10px] font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                  <TableIcon size={12} /> CSV (Current Tab)
                </button>
                <button onClick={handleExportAll} className="w-full px-4 py-2 text-left text-[10px] font-bold text-primary hover:bg-primary/5 flex items-center gap-2 border-t border-gray-50">
                  <Download size={12} /> Full Report (CSV)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-6 border-b border-gray-200 print:hidden">
          {(['dashboard', 'journals', 'ledger', 'statements', 'accounts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-2 text-xs font-bold uppercase tracking-wider transition-all relative",
                activeTab === tab ? "text-primary" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="activeAccountingTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6 print:space-y-12">
            {/* Stats Grid (Print version uses table for stability) */}
            <div className="hidden print:block mb-8 w-full">
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  {[
                    { label: 'Total Income', value: totalIncome, icon: TrendingUp, color: 'bg-green-500' },
                    { label: 'Total Expenses', value: totalExpenses, icon: TrendingDown, color: 'bg-red-500' },
                    { label: 'Net Profit', value: netProfit, icon: DollarSign, color: 'bg-primary' },
                    { label: 'Cash on Hand', value: cashOnHand, icon: History, color: 'bg-blue-500' },
                  ].map((stat, i) => (
                    <td key={i} className={cn("w-1/4", i === 0 ? "pr-2" : i === 3 ? "pl-2" : "px-2")}>
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center text-white mb-2`}>
                          <stat.icon size={16} />
                        </div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{stat.label}</p>
                        <h3 className="text-base font-bold text-gray-900">{formatCurrency(stat.value)}</h3>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 print:hidden">
              {[
                { label: 'Total Income', value: totalIncome, icon: TrendingUp, color: 'bg-green-500' },
                { label: 'Total Expenses', value: totalExpenses, icon: TrendingDown, color: 'bg-red-500' },
                { label: 'Net Profit', value: netProfit, icon: DollarSign, color: 'bg-primary' },
                { label: 'Total Cash', value: totalCash, icon: History, color: 'bg-blue-500' },
                { label: 'Receivables', value: totalAR, icon: ArrowUpRight, color: 'bg-indigo-500' },
                { label: 'Payables', value: totalAP, icon: ArrowDownRight, color: 'bg-rose-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                  <div className={`w-9 h-9 ${stat.color} rounded-xl flex items-center justify-center text-white shadow-md mb-3`}>
                    <stat.icon size={18} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{stat.label}</p>
                  <h3 className="text-lg font-bold text-gray-900">{formatCurrency(stat.value)}</h3>
                </div>
              ))}
            </div>

            {/* Charts Grid (Print version uses table for stability) */}
            <div className="hidden print:block w-full">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="w-2/3 pr-6 align-top">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <BarChart3 size={16} className="text-primary" />
                        Monthly Performance Analysis
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={monthlyData}>
                            <defs>
                              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={5} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                            <Tooltip />
                            <Area type="monotone" dataKey="income" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                            <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fillOpacity={0} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Performance Summary</p>
                        <p className="text-xs text-gray-700 leading-relaxed font-medium">
                          {performanceSummary}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="w-1/3 pl-6 align-top">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <PieChartIcon size={16} className="text-primary" />
                        Expense Distribution
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-6 space-y-2">
                        {categoryData.map((cat, i) => (
                          <div key={i} className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-gray-500 uppercase">{cat.name}</span>
                            <span className="text-gray-900">{formatCurrency(cat.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <BarChart3 size={16} className="text-primary" />
                  Monthly Performance Analysis
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={5} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                      <Tooltip />
                      <Area type="monotone" dataKey="income" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                      <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fillOpacity={0} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <PieChartIcon size={16} className="text-primary" />
                  Expense Distribution
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'journals' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 print:hidden">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text"
                  placeholder="Search journals..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 focus:outline-none focus:border-primary transition-all"
                >
                  <option value="All">All Types</option>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                  <option value="Sale">Sale</option>
                  <option value="Purchase">Purchase</option>
                </select>
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 focus:outline-none focus:border-primary transition-all"
                >
                  <option value="All">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1">
                  <Calendar size={14} className="text-gray-400" />
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-[10px] font-bold focus:outline-none"
                  />
                  <span className="text-gray-300">-</span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-[10px] font-bold focus:outline-none"
                  />
                </div>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('All');
                    setFilterStatus('All');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Clear Filters"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Date</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Description</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Account</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Type</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Debit</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEntries.map((e) => {
                    const account = ledgerAccounts.find(a => a.id === e.accountId);
                    return (
                      <tr key={e.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-4 py-3 text-[10px] text-gray-500">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-bold text-gray-700">{e.description}</p>
                          <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest">Ref: {e.referenceId}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[9px] font-bold uppercase tracking-wider">{account?.name || 'Unknown'}</span>
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            const entryType = e.calculatedType;
                            const typeColors: Record<string, string> = {
                              'Sale': 'bg-green-50 text-green-600 border-green-100',
                              'Income': 'bg-blue-50 text-blue-600 border-blue-100',
                              'Expense': 'bg-red-50 text-red-600 border-red-100',
                              'Purchase': 'bg-blue-50 text-blue-600 border-blue-100'
                            };
                            
                            return (
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border",
                                typeColors[entryType || ''] || 'bg-gray-50 text-gray-500 border-gray-100'
                              )}>
                                {entryType || 'Other'}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            const status = e.calculatedStatus;
                            const statusColors: Record<string, string> = {
                              'Completed': 'bg-green-50 text-green-600',
                              'Pending': 'bg-yellow-50 text-yellow-600',
                              'Cancelled': 'bg-red-50 text-red-600',
                              'Refunded': 'bg-purple-50 text-purple-600'
                            };
                            
                            return (
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider",
                                statusColors[status] || 'bg-gray-50 text-gray-500'
                              )}>
                                {status}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-right text-red-500">
                          {e.debit > 0 ? formatCurrency(e.debit) : '-'}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-right text-green-500">
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

        {activeTab === 'ledger' && (
          <div className="space-y-8 print:space-y-12">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between print:hidden">
              <div className="flex-1 relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text"
                  placeholder="Search accounts..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setActiveTab('ledger');
                    setShowPrintPortal(true);
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 flex items-center gap-2 hover:bg-gray-50"
                >
                  <Printer size={14} /> Print Ledger
                </button>
              </div>
            </div>

            {/* Stats Grid (Print version uses table for stability) */}
            <div className="hidden print:block mb-8 w-full">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    {[
                    { label: 'Total Assets', value: ledgerAccounts.filter(a => a.type === 'Asset').reduce((sum, a) => sum + a.balance, 0), icon: Building2, color: 'bg-blue-50' },
                    { label: 'Liabilities', value: ledgerAccounts.filter(a => a.type === 'Liability').reduce((sum, a) => sum + a.balance, 0), icon: TrendingDown, color: 'bg-red-50' },
                    { label: 'Revenue', value: totalIncome, icon: TrendingUp, color: 'bg-green-50' },
                    { label: 'Expenses', value: totalExpenses, icon: DollarSign, color: 'bg-blue-50' },
                  ].map((stat, i) => (
                    <td key={i} className={cn("w-1/4", i === 0 ? "pr-2" : i === 3 ? "pl-2" : "px-2")}>
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", stat.color)}>
                            <stat.icon size={16} />
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                        </div>
                        <p className="text-lg font-black text-gray-900">{formatCurrency(stat.value)}</p>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm print:border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center print:bg-transparent">
                    <Building2 size={16} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Assets</p>
                </div>
                <p className="text-lg font-black text-gray-900">{formatCurrency(ledgerAccounts.filter(a => a.type === 'Asset').reduce((sum, a) => sum + a.balance, 0))}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm print:border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center print:bg-transparent">
                    <TrendingDown size={16} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Liabilities</p>
                </div>
                <p className="text-lg font-black text-gray-900">{formatCurrency(ledgerAccounts.filter(a => a.type === 'Liability').reduce((sum, a) => sum + a.balance, 0))}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm print:border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center print:bg-transparent">
                    <TrendingUp size={16} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue</p>
                </div>
                <p className="text-lg font-black text-gray-900">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm print:border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center print:bg-transparent">
                    <DollarSign size={16} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expenses</p>
                </div>
                <p className="text-lg font-black text-gray-900">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>

            <div className="space-y-8 print:space-y-12">
              {ledgerAccounts.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.code.includes(searchQuery)).map((account) => {
                const accountEntries = ledgerEntries.filter(e => e.accountId === account.id);
                const totalDebit = accountEntries.reduce((sum, e) => sum + e.debit, 0);
                const totalCredit = accountEntries.reduce((sum, e) => sum + e.credit, 0);

                return (
                  <div key={account.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col group hover:border-primary/30 transition-all break-inside-avoid print:border-gray-100 print:shadow-none">
                    <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center print:bg-gray-50/50">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg text-[10px] font-black print:border-gray-300">{account.code}</span>
                          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{account.name}</h3>
                        </div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{account.type} Account Details</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Current Balance</p>
                        <p className={cn("text-lg font-black", account.balance >= 0 ? "text-green-600" : "text-red-600")}>
                          {formatCurrency(Math.abs(account.balance))}
                        </p>
                      </div>
                    </div>
                    <div className="flex-1">
                      <table className="w-full text-left">
                        <thead className="bg-white border-b border-gray-100">
                          <tr>
                            <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                            <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                            <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Debit</th>
                            <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Credit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {accountEntries.map(e => (
                            <tr key={e.id} className="text-xs hover:bg-gray-50/50 transition-colors group/row">
                              <td className="px-6 py-4 text-gray-500 font-medium">{new Date(e.date).toLocaleDateString()}</td>
                              <td className="px-6 py-4 font-bold text-gray-700">{e.description}</td>
                              <td className="px-6 py-4 text-right text-red-600 font-black">
                                {e.debit > 0 ? formatCurrency(e.debit) : '-'}
                              </td>
                              <td className="px-6 py-4 text-right text-green-600 font-black">
                                {e.credit > 0 ? formatCurrency(e.credit) : '-'}
                              </td>
                            </tr>
                          ))}
                          {accountEntries.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-6 py-16 text-center text-xs text-gray-400 italic font-medium">No transactions recorded for this account in the selected period.</td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot className="bg-gray-50/50 border-t border-gray-100">
                          <tr>
                            <td colSpan={2} className="px-6 py-4 text-[10px] font-black text-gray-900 uppercase">Total for {account.name}</td>
                            <td className="px-6 py-4 text-right text-xs font-black text-red-600">{formatCurrency(totalDebit)}</td>
                            <td className="px-6 py-4 text-right text-xs font-black text-green-600">{formatCurrency(totalCredit)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Code</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Balance</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ledgerAccounts.filter(a => 
                  a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  a.code.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-black">{account.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{account.name}</p>
                      <p className="text-[10px] text-gray-400">{account.description || 'No description'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        account.type === 'Asset' ? "bg-blue-100 text-blue-600" :
                        account.type === 'Liability' ? "bg-amber-100 text-amber-600" :
                        account.type === 'Equity' ? "bg-purple-100 text-purple-600" :
                        account.type === 'Revenue' ? "bg-green-100 text-green-600" :
                        "bg-red-100 text-red-600"
                      )}>
                        {account.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm font-bold text-gray-900">
                      {formatCurrency(account.balance)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => { setEditingAccount(account); setIsAccountModalOpen(true); }}
                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'statements' && (
          <div className="w-full">
            {/* Print version uses table for stability */}
            <div className="hidden print:block w-full">
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="w-1/2 pr-4 align-top">
                    {/* Profit & Loss */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8 break-inside-avoid">
                      <div className="text-center space-y-1">
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Profit & Loss Statement</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">For the period ended {new Date().toLocaleDateString()}</p>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/10 pb-1">Revenue</h4>
                          {ledgerAccounts.filter(a => a.type === 'Revenue').map(a => (
                            <div key={a.id} className="flex justify-between text-xs font-bold text-gray-700">
                              <span>{a.name}</span>
                              <span>{formatCurrency(a.balance)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-xs font-bold text-gray-900 border-t border-gray-100 pt-2">
                            <span>Total Revenue</span>
                            <span>{formatCurrency(totalIncome)}</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest border-b border-red-500/10 pb-1">Expenses</h4>
                          {ledgerAccounts.filter(a => a.type === 'Expense').map(a => (
                            <div key={a.id} className="flex justify-between text-xs font-bold text-gray-700">
                              <span>{a.name}</span>
                              <span>{formatCurrency(a.balance)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-xs font-bold text-gray-900 border-t border-gray-100 pt-2">
                            <span>Total Expenses</span>
                            <span>{formatCurrency(totalExpenses)}</span>
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
                          <span className="text-sm font-black text-primary uppercase">Net Income</span>
                          <span className="text-xl font-black text-primary">{formatCurrency(netProfit)}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="w-1/2 pl-4 align-top">
                    {/* Balance Sheet */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8 break-inside-avoid">
                      <div className="text-center space-y-1">
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Balance Sheet</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">As of {new Date().toLocaleDateString()}</p>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-b border-blue-500/10 pb-1">Assets</h4>
                          {ledgerAccounts.filter(a => a.type === 'Asset').map(a => (
                            <div key={a.id} className="flex justify-between text-xs font-bold text-gray-700">
                              <span>{a.name}</span>
                              <span>{formatCurrency(a.balance)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-xs font-bold text-gray-900 border-t border-gray-100 pt-2">
                            <span>Total Assets</span>
                            <span>{formatCurrency(ledgerAccounts.filter(a => a.type === 'Asset').reduce((sum, a) => sum + a.balance, 0))}</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest border-b border-amber-500/10 pb-1">Liabilities & Equity</h4>
                          {ledgerAccounts.filter(a => a.type === 'Liability').map(a => (
                            <div key={a.id} className="flex justify-between text-xs font-bold text-gray-700">
                              <span>{a.name}</span>
                              <span>{formatCurrency(a.balance)}</span>
                            </div>
                          ))}
                          {ledgerAccounts.filter(a => a.type === 'Equity').map(a => (
                            <div key={a.id} className="flex justify-between text-xs font-bold text-gray-700">
                              <span>{a.name}</span>
                              <span>{formatCurrency(a.balance)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-xs font-bold text-gray-900 border-t border-gray-100 pt-2">
                            <span>Total Liabilities & Equity</span>
                            <span>{formatCurrency(ledgerAccounts.filter(a => a.type === 'Liability' || a.type === 'Equity').reduce((sum, a) => sum + a.balance, 0))}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:hidden">
            {/* Profit & Loss */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-8 break-inside-avoid print:border-gray-100 print:shadow-none">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Profit & Loss Statement</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">For the period ended {new Date().toLocaleDateString()}</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/10 pb-1">Revenue</h4>
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>Sales Revenue</span>
                    <span>{formatCurrency(totalIncome)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-900 border-t border-gray-100 pt-2">
                    <span>Total Revenue</span>
                    <span>{formatCurrency(totalIncome)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest border-b border-red-500/10 pb-1">Expenses</h4>
                  {ledgerAccounts.filter(a => a.type === 'Expense').map(a => (
                    <div key={a.id} className="flex justify-between text-xs font-bold text-gray-700">
                      <span>{a.name}</span>
                      <span>{formatCurrency(a.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-bold text-gray-900 border-t border-gray-100 pt-2">
                    <span>Total Expenses</span>
                    <span>{formatCurrency(totalExpenses)}</span>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-2xl flex justify-between items-center print:bg-gray-50">
                  <span className="text-sm font-black text-primary uppercase">Net Income</span>
                  <span className="text-xl font-black text-primary">{formatCurrency(netProfit)}</span>
                </div>
              </div>
            </div>

            {/* Balance Sheet */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-8 break-inside-avoid print:border-gray-100 print:shadow-none">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Balance Sheet</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">As of {new Date().toLocaleDateString()}</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-b border-blue-500/10 pb-1">Assets</h4>
                  {ledgerAccounts.filter(a => a.type === 'Asset').map(a => (
                    <div key={a.id} className="flex justify-between text-xs font-bold text-gray-700">
                      <span>{a.name}</span>
                      <span>{formatCurrency(a.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-bold text-gray-900 border-t border-gray-100 pt-2">
                    <span>Total Assets</span>
                    <span>{formatCurrency(ledgerAccounts.filter(a => a.type === 'Asset').reduce((sum, a) => sum + a.balance, 0))}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest border-b border-amber-500/10 pb-1">Liabilities & Equity</h4>
                  {ledgerAccounts.filter(a => a.type === 'Liability').map(a => (
                    <div key={a.id} className="flex justify-between text-xs font-bold text-gray-700">
                      <span>{a.name}</span>
                      <span>{formatCurrency(a.balance)}</span>
                    </div>
                  ))}
                  {ledgerAccounts.filter(a => a.type === 'Equity').map(a => (
                    <div key={a.id} className="flex justify-between text-xs font-bold text-gray-700">
                      <span>{a.name}</span>
                      <span>{formatCurrency(a.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-bold text-gray-900 border-t border-gray-100 pt-2">
                    <span>Total Liabilities & Equity</span>
                    <span>{formatCurrency(ledgerAccounts.filter(a => a.type === 'Liability' || a.type === 'Equity').reduce((sum, a) => sum + a.balance, 0))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        {/* Report Footer */}
        <div className="hidden print:block border-t border-gray-200 pt-8 mt-12 w-full">
          <table className="w-full border-collapse mb-12">
            <tbody>
              <tr>
                <td className="w-1/3 pr-6">
                  <p className="text-[9px] font-black text-gray-900 uppercase tracking-widest mb-12">Prepared By</p>
                  <div className="w-full border-b border-gray-400"></div>
                  <p className="text-[8px] text-gray-400 mt-1 uppercase font-bold">Accountant / Manager</p>
                </td>
                <td className="w-1/3 px-6">
                  <p className="text-[9px] font-black text-gray-900 uppercase tracking-widest mb-12">Verified By</p>
                  <div className="w-full border-b border-gray-400"></div>
                  <p className="text-[8px] text-gray-400 mt-1 uppercase font-bold">Internal Auditor</p>
                </td>
                <td className="w-1/3 pl-6">
                  <p className="text-[9px] font-black text-gray-900 uppercase tracking-widest mb-12 text-right">Authorized Signature</p>
                  <div className="w-full border-b border-gray-400 ml-auto"></div>
                  <p className="text-[8px] text-gray-400 mt-1 uppercase font-bold text-right">Director / CEO</p>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div className="flex justify-between items-center border-t border-gray-100 pt-4 text-[8px] font-bold text-gray-400 uppercase tracking-widest">
            <div>© {new Date().getFullYear()} {companySettings.name} - {companySettings.address}</div>
            <div className="flex gap-4">
              <span>Report ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
              <span>Generated: {new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>


      {/* Account Modal */}
      <AnimatePresence>
        {isAccountModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{editingAccount ? 'Edit Account' : 'New Account'}</h2>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Chart of Accounts Entry</p>
                  </div>
                </div>
                <button onClick={() => setIsAccountModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveAccount} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Account Code</label>
                    <input 
                      type="text"
                      name="code"
                      required
                      defaultValue={editingAccount?.code || ''}
                      placeholder="e.g. 1000"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Type</label>
                    <select 
                      name="type"
                      required
                      defaultValue={editingAccount?.type || 'Asset'}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="Asset">Asset</option>
                      <option value="Liability">Liability</option>
                      <option value="Equity">Equity</option>
                      <option value="Revenue">Revenue</option>
                      <option value="Expense">Expense</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Account Name</label>
                  <input 
                    type="text"
                    name="name"
                    required
                    defaultValue={editingAccount?.name || ''}
                    placeholder="e.g. Petty Cash"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Initial Balance</label>
                  <input 
                    type="number"
                    name="balance"
                    step="0.01"
                    defaultValue={editingAccount?.balance || ''}
                    placeholder="0.00"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Description</label>
                  <textarea 
                    name="description"
                    rows={2}
                    defaultValue={editingAccount?.description || ''}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setIsAccountModalOpen(false); setEditingAccount(null); }}
                    className="flex-1 px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                  >
                    {editingAccount ? 'Update Account' : 'Create Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</h2>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Journal Entry Details</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveTransaction} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Type</label>
                    <select 
                      name="type"
                      defaultValue={editingTransaction?.type || 'Income'}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="Income">Income</option>
                      <option value="Expense">Expense</option>
                      <option value="Sale">Sale</option>
                      <option value="Purchase">Purchase</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Date</label>
                    <input 
                      type="date"
                      name="date"
                      defaultValue={editingTransaction?.date || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Description</label>
                  <input 
                    type="text"
                    name="description"
                    required
                    defaultValue={editingTransaction?.description || ''}
                    placeholder="e.g. Office Supplies"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Account / Category</label>
                    <select 
                      name="category"
                      required
                      defaultValue={editingTransaction?.category || ''}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="" disabled>Select Account</option>
                      {ledgerAccounts.map(acc => (
                        <option key={acc.id} value={acc.name}>{acc.name} ({acc.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Amount</label>
                    <input 
                      type="number"
                      name="amount"
                      required
                      step="0.01"
                      defaultValue={editingTransaction?.amount || ''}
                      placeholder="0.00"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                  >
                    {editingTransaction ? 'Update Entry' : 'Save Entry'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Print Portal */}
      <PrintPortal
        isOpen={showPrintPortal}
        onClose={() => setShowPrintPortal(false)}
        title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`}
        subtitle={`${companySettings.name} - ${new Date().toLocaleDateString()}`}
        onDownload={() => handleGeneratePDF(false)}
        isGeneratingPDF={isGeneratingPDF}
      >
        <div ref={reportRef} className="bg-white p-8" data-print-root>
          {/* Re-render the active tab content for printing */}
          <div className="mb-8 border-b-2 border-primary pb-4">
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{activeTab} Report</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{companySettings.name}</p>
          </div>
          
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Summary */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Income', value: totalIncome },
                  { label: 'Total Expenses', value: totalExpenses },
                  { label: 'Net Profit', value: netProfit },
                  { label: 'Cash on Hand', value: ledgerAccounts.find(a => a.id === 'acc-cash')?.balance || 0 },
                ].map((stat, i) => (
                  <div key={i} className="p-4 border border-gray-100 rounded-xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                    <h3 className="text-lg font-bold text-gray-900">{formatCurrency(stat.value)}</h3>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'journals' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="py-2 text-[10px] font-bold text-gray-400 uppercase">Date</th>
                  <th className="py-2 text-[10px] font-bold text-gray-400 uppercase">Description</th>
                  <th className="py-2 text-[10px] font-bold text-gray-400 uppercase text-right">Debit</th>
                  <th className="py-2 text-[10px] font-bold text-gray-400 uppercase text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((e) => {
                  const account = ledgerAccounts.find(a => a.id === e.accountId);
                  return (
                    <tr key={e.id} className="border-b border-gray-100">
                      <td className="py-2 text-[10px] text-gray-500">{new Date(e.date).toLocaleDateString()}</td>
                      <td className="py-2">
                        <p className="text-xs font-bold text-gray-700">{e.description}</p>
                        <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest">{account?.name || 'Unknown'}</p>
                      </td>
                      <td className="py-2 text-xs font-bold text-right">
                        {e.debit > 0 ? formatCurrency(e.debit) : '-'}
                      </td>
                      <td className="py-2 text-xs font-bold text-right">
                        {e.credit > 0 ? formatCurrency(e.credit) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'ledger' && (
            <div className="space-y-8">
              {ledgerAccounts.map(acc => {
                const accEntries = ledgerEntries.filter(e => e.accountId === acc.id);
                if (accEntries.length === 0) return null;
                return (
                  <div key={acc.id} className="space-y-2">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-1">
                      {acc.code} - {acc.name}
                    </h3>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="py-1 text-[9px] font-bold text-gray-400 uppercase">Date</th>
                          <th className="py-1 text-[9px] font-bold text-gray-400 uppercase">Description</th>
                          <th className="py-1 text-[9px] font-bold text-gray-400 uppercase text-right">Debit</th>
                          <th className="py-1 text-[9px] font-bold text-gray-400 uppercase text-right">Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accEntries.map(e => (
                          <tr key={e.id} className="border-b border-gray-50">
                            <td className="py-1 text-[9px] text-gray-500">{new Date(e.date).toLocaleDateString()}</td>
                            <td className="py-1 text-[9px] text-gray-700">{e.description}</td>
                            <td className="py-1 text-[9px] font-bold text-right">
                              {e.debit > 0 ? formatCurrency(e.debit) : '-'}
                            </td>
                            <td className="py-1 text-[9px] font-bold text-right">
                              {e.credit > 0 ? formatCurrency(e.credit) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'statements' && (
            <div className="space-y-12">
              {/* Profit & Loss */}
              <div>
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-4 border-b-2 border-gray-200 pb-2">Profit & Loss Statement</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue</p>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-700">Sales Revenue</span>
                      <span className="text-xs font-bold text-gray-900">{formatCurrency(totalIncome)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expenses</p>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-700">Cost of Goods Sold</span>
                      <span className="text-xs font-bold text-gray-900">{formatCurrency(totalExpenses * 0.7)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-700">Operating Expenses</span>
                      <span className="text-xs font-bold text-gray-900">{formatCurrency(totalExpenses * 0.3)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-4 bg-gray-50 px-4 rounded-xl">
                    <span className="text-sm font-black text-gray-900 uppercase tracking-tight">Net Profit</span>
                    <span className={cn("text-sm font-black", netProfit >= 0 ? "text-green-600" : "text-red-600")}>
                      {formatCurrency(netProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </PrintPortal>

      <ConfirmModal 
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction record? This action cannot be undone."
        type="danger"
        language={language}
      />

      <ConfirmModal 
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={() => {
          onUpdateTransactions([]);
          onUpdateLedgerEntries([]);
          onUpdateLedgerAccounts(ledgerAccounts.map(acc => ({ ...acc, balance: 0 })));
          onAddAuditLog?.('Accounting History Cleared', 'All transaction records removed', 'accounting', 'warning');
          setIsClearConfirmOpen(false);
          addNotification({
            title: 'History Cleared',
            message: 'All accounting records and balances have been reset.',
            type: 'success'
          });
        }}
        title="Clear History"
        message="Are you sure you want to clear all transaction history? This will reset your journals, ledgers, and account balances. This action cannot be undone."
        type="danger"
        language={language}
      />

      {/* MONTHLY MANAGEMENT REVIEW REPORT MODAL */}
      <AccountingReportModal
        isOpen={isManagementReportOpen}
        onClose={() => setIsManagementReportOpen(false)}
        companySettings={companySettings}
        transactions={transactions}
        ledgerAccounts={ledgerAccounts}
        ledgerEntries={ledgerEntries}
        onAddAuditLog={onAddAuditLog}
      />
    </div>
  );
}
