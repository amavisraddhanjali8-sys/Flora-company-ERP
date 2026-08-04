/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import ProductGrid from './components/pos/ProductGrid';
import Cart from './components/pos/Cart';
import CheckoutModal from './components/pos/CheckoutModal';
import QuotationSystem from './components/quotation/QuotationSystem';
import AccountingSystem from './components/accounting/AccountingSystem';
import Settings from './components/settings/Settings';
import ClientManagement from './components/customers/ClientManagement';
import MaterialManagement from './components/inventory/MaterialManagement';
import ProductCatalog from './components/products/ProductCatalog';
import OrderSystem from './components/orders/OrderSystem';
import ProcurementSystem from './components/procurement/ProcurementSystem';
import LogisticsSystem from './components/logistics/LogisticsSystem';
import { Material, FinishedProduct, CartItem, Client, CompanySettings, Transaction, Quotation, Invoice, Expense, Supplier, AuditLog, LedgerAccount, LedgerEntry, JournalEntry, Order, RFQ, SupplierQuotation, ProcurementOrder, UserProfile, UserRole } from './types';
import { FINISHED_PRODUCTS, MATERIALS, MOCK_CLIENTS, INITIAL_SETTINGS, MOCK_TRANSACTIONS, MOCK_SUPPLIERS, MOCK_AUDIT_LOGS, INITIAL_ACCOUNTS, MOCK_USERS, FLORA_CATEGORIES, INITIAL_RFQS, INITIAL_SUPPLIER_QUOTATIONS, INITIAL_PROCUREMENT_ORDERS } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { Barcode, AlertCircle, CheckCircle2, FileText, Receipt, DollarSign, Truck, Printer, X, ArrowLeft, Flower2, ShieldCheck, Store, LogOut, User, Key } from 'lucide-react';
import ChangePasswordModal from './components/auth/ChangePasswordModal';
import MfaSecurityModal from './components/auth/MfaSecurityModal';
import { cn, formatCurrency } from './lib/utils';
import InvoiceSystem from './components/invoice/InvoiceSystem';
import ExpenseSystem from './components/expense/ExpenseSystem';
import SupplierManagement from './components/suppliers/SupplierManagement';
import SupplierPortal from './components/suppliers/SupplierPortal';
import { translations, Language } from './i18n';
import VirtualKeyboard from './components/layout/VirtualKeyboard';
import Lobby from './components/layout/Lobby';
import { useNotifications } from './context/NotificationContext';
import { usePersistentState } from './hooks/usePersistentState';
import SystemAuditLog from './components/layout/SystemAuditLog';
import ConfirmModal from './components/layout/ConfirmModal';
import { canAccessTab, ROLE_CONFIGS } from './lib/rbac';
import AuthScreen from './components/auth/AuthScreen';
import UserManagementPortal from './components/auth/UserManagementPortal';
import AccessRestricted from './components/common/AccessRestricted';
import BarcodeHubModal from './components/common/BarcodeHubModal';
import ShopStorefront from './components/storefront/ShopStorefront';
import { createJwtSessionToken, parseJwtSessionToken } from './lib/jwtSession';

const TAB_TITLES: Record<string, string> = {
  'pos': 'Create Order',
  'order-management': 'Order System',
  'quotation': 'Quotations',
  'invoices': 'Invoices',
  'expenses': 'Expenses',
  'accounting': 'Accounting & Ledger',
  'products': 'Product Catalog',
  'inventory': 'Botanical & Material Stock',
  'suppliers': 'Suppliers Management',
  'customers': 'Clients Directory',
  'procurement': 'Procurement Portal',
  'logistics': 'Logistics & Dispatch',
  'settings': 'Company Settings',
  'audit': 'Activity & Audit Trail',
  'users': 'User Management'
};

const GUEST_USER: UserProfile = {
  id: 'guest',
  name: 'Guest Visitor',
  email: 'guest@verdantflora.com',
  role: 'Client',
  status: 'Active',
  companyName: 'Guest',
  createdAt: new Date().toISOString()
};

export default function App() {
  const { addNotification } = useNotifications();
  const [users, setUsers] = usePersistentState<UserProfile[]>('flora_users_v2', MOCK_USERS);
  const [currentUser, setCurrentUser] = usePersistentState<UserProfile>('flora_current_user_v2', GUEST_USER);
  const [isAuthScreenOpen, setIsAuthScreenOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isMfaSecurityOpen, setIsMfaSecurityOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');
  const [activeTab, setActiveTab] = useState('storefront');

  const [language, setLanguage] = useState<Language>('en');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const t = translations[language];
  
  const [finishedProducts, setFinishedProducts] = usePersistentState<FinishedProduct[]>('flora_finished_products_v2', FINISHED_PRODUCTS);
  const [materials, setMaterials] = usePersistentState<Material[]>('flora_materials_v2', MATERIALS);
  const [categories, setCategories] = usePersistentState<string[]>('flora_categories_v2', FLORA_CATEGORIES);
  const [clients, setClients] = usePersistentState<Client[]>('flora_clients_v2', MOCK_CLIENTS);
  const [suppliers, setSuppliers] = usePersistentState<Supplier[]>('flora_suppliers_v2', MOCK_SUPPLIERS);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = usePersistentState<Order[]>('flora_orders_v2', []);
  const [rfqs, setRfqs] = usePersistentState<RFQ[]>('flora_rfqs_v2', INITIAL_RFQS);
  const [initialRfqOrderId, setInitialRfqOrderId] = useState<string | null>(null);
  const [initialRfqItem, setInitialRfqItem] = useState<{
    type: 'Material' | 'Product' | 'Service' | 'Support';
    id?: string;
    name: string;
    quantity: number;
    unit: string;
    supplier?: string;
    specs?: string;
    items?: { materialId?: string; name: string; quantity: number; unit: string; specs?: string }[];
  } | null>(null);
  const [supplierQuotations, setSupplierQuotations] = usePersistentState<SupplierQuotation[]>('flora_supplier_quotations_v2', INITIAL_SUPPLIER_QUOTATIONS);
  const [procurementOrders, setProcurementOrders] = usePersistentState<ProcurementOrder[]>('flora_procurement_orders_v2', INITIAL_PROCUREMENT_ORDERS);
  const [transactions, setTransactions] = usePersistentState<Transaction[]>('flora_transactions_v2', MOCK_TRANSACTIONS);
  const [quotations, setQuotations] = usePersistentState<Quotation[]>('flora_quotations_v2', []);
  const [invoices, setInvoices] = usePersistentState<Invoice[]>('flora_invoices_v2', []);
  const [expenses, setExpenses] = usePersistentState<Expense[]>('flora_expenses_v2', []);
  const [ledgerAccounts, setLedgerAccounts] = usePersistentState<LedgerAccount[]>('flora_ledger_accounts_v2', INITIAL_ACCOUNTS);
  const [ledgerEntries, setLedgerEntries] = usePersistentState<LedgerEntry[]>('flora_ledger_entries_v2', []);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPrinterSettingsOpen, setIsPrinterSettingsOpen] = useState(false);
  const [revisingOrderId, setRevisingOrderId] = useState<string | null>(null);
  const notifiedLowStock = useRef<Set<string>>(new Set());
  const [checkoutDetails, setCheckoutDetails] = useState<{
    subtotal: number;
    tax: number;
    taxRate: number;
    discount: number;
    discountRate: number;
    freight: number;
    otherCharges: number;
    otherChargesList: { id: string; description: string; amount: number; }[];
    total: number;
  } | null>(null);
  const [companySettings, setCompanySettings] = usePersistentState<CompanySettings>('flora_company_settings_v2', INITIAL_SETTINGS);
  const [auditLogs, setAuditLogs] = usePersistentState<AuditLog[]>('flora_audit_logs_v2', MOCK_AUDIT_LOGS);
  const [orderToRevise, setOrderToRevise] = useState<Transaction | null>(null);
  const [orderToDeleteId, setOrderToDeleteId] = useState<string | null>(null);
  const [isClearOrdersConfirmOpen, setIsClearOrdersConfirmOpen] = useState(false);
  const lastFocusedElement = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const addAuditLog = (action: string, details: string, category: AuditLog['category'], type: AuditLog['type'] = 'info') => {
    const newLog: AuditLog = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      details,
      category,
      type,
      date: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser.id === updatedUser.id) {
      if (updatedUser.status === 'Deactivated' || updatedUser.status === 'Rejected') {
        handleLogout();
      } else {
        setCurrentUser(updatedUser);
      }
    }
  };

  const handleDeleteUserAccount = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    if (currentUser.role !== 'Super Admin') {
      addNotification({
        title: 'Action Denied',
        message: 'Only Super Admins can delete or deactivate user accounts.',
        type: 'error',
        category: 'system'
      });
      return;
    }

    if (targetUser.role === 'Super Admin') {
      const activeAdmins = users.filter(u => u.role === 'Super Admin' && u.status === 'Active');
      if (activeAdmins.length <= 1) {
        addNotification({
          title: 'Cannot Delete Last Active Admin',
          message: 'At least one active Super Admin account must remain in the system.',
          type: 'error',
          category: 'system'
        });
        return;
      }
    }

    setUsers(prev => prev.filter(u => u.id !== userId));
    addAuditLog('User Account Deleted', `Super Admin ${currentUser.name} deleted user account ${targetUser.name} (${targetUser.email})`, 'system', 'warning');
    addNotification({
      title: 'User Account Deleted',
      message: `Account for ${targetUser.name} has been permanently deleted.`,
      type: 'info',
      category: 'system'
    });

    if (currentUser.id === userId) {
      handleLogout();
    }
  };

  const handleAddUser = (newUser: Omit<UserProfile, 'id' | 'createdAt'>) => {
    const created: UserProfile = {
      ...newUser,
      id: `u-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, created]);
    addAuditLog('User Added', `Created user account for ${created.name} (${created.role})`, 'system', 'info');
  };

  const handleRegisterUser = (newUser: Omit<UserProfile, 'id' | 'createdAt'>) => {
    const created: UserProfile = {
      ...newUser,
      id: `u-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, created]);
    addAuditLog('User Self-Registration', `Registration requested by ${created.name} (${created.role})`, 'system', 'info');
    
    addNotification({
      title: 'New Account Approval Request',
      message: `${created.name} (${created.email}) registered as ${created.role}. Action Required: Super Admin must review & approve user in User Management.`,
      type: 'warning',
      category: 'system'
    });
  };

  const handleLoginSuccess = (user: UserProfile) => {
    // Sync user into system state if auto-created or new, or update existing user state
    setUsers(prev => {
      const exists = prev.some(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
      if (exists) {
        return prev.map(u => (u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()) ? user : u);
      }
      return [...prev, user];
    });
    handleSwitchUser(user);
    setIsAuthScreenOpen(false);
  };

  // Automated Email Link Verification Handling (When account holder clicks link in email)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('verify_token') || params.get('verificationToken') || params.get('token');
    const verifyCode = params.get('verify_code') || params.get('code');
    const targetEmail = params.get('email');

    if (verifyToken || (verifyCode && targetEmail)) {
      const foundUser = users.find(u => 
        (verifyToken && u.emailVerificationToken === verifyToken) ||
        (targetEmail && u.email.toLowerCase() === targetEmail.toLowerCase() && (u.emailVerificationToken === verifyToken || u.emailOtpCode === verifyCode)) ||
        (targetEmail && u.email.toLowerCase() === targetEmail.toLowerCase())
      );

      if (foundUser) {
        const verifiedUser: UserProfile = {
          ...foundUser,
          emailVerified: true,
          status: (foundUser.status as string) === 'Pending Verification' || foundUser.status === 'Pending Approval' ? 'Active' : foundUser.status,
          emailVerificationToken: undefined,
          emailOtpCode: undefined
        };

        setUsers(prev => prev.map(u => u.id === verifiedUser.id ? verifiedUser : u));

        // Create JWT session and log in user
        const sessionToken = createJwtSessionToken(verifiedUser);
        localStorage.setItem('flora_session_token', sessionToken);
        setCurrentUser({
          ...verifiedUser,
          sessionToken
        });

        addNotification({
          title: '🎉 Email Verified Successfully!',
          message: `Your account (${verifiedUser.email}) has been verified and activated. Welcome to Flora & Verdant!`,
          type: 'success',
          category: 'system'
        });

        // Clean query parameters from URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Synchronize & Re-hydrate JWT session state across page reloads & system user updates
  useEffect(() => {
    if (!currentUser || currentUser.id === 'guest') {
      localStorage.removeItem('flora_session_token');
      return;
    }

    const storedToken = localStorage.getItem('flora_session_token');
    const matchedUser = users.find(u => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase());

    if (!matchedUser) {
      // Account deleted or removed
      handleLogout();
      return;
    }

    if (matchedUser.status === 'Deactivated' || matchedUser.status === 'Rejected') {
      // Account inactive or deactivated
      handleLogout();
      return;
    }

    // Ensure session token exists and is valid
    let token = storedToken;
    const parsedToken = token ? parseJwtSessionToken(token) : null;
    if (!token || !parsedToken || parsedToken.sub !== matchedUser.id) {
      token = createJwtSessionToken(matchedUser);
      localStorage.setItem('flora_session_token', token);
    }

    // Sync any updated properties from matchedUser to currentUser
    if (
      matchedUser.role !== currentUser.role ||
      matchedUser.status !== currentUser.status ||
      matchedUser.emailVerified !== currentUser.emailVerified ||
      matchedUser.password !== currentUser.password ||
      matchedUser.name !== currentUser.name ||
      currentUser.sessionToken !== token
    ) {
      setCurrentUser({
        ...matchedUser,
        sessionToken: token
      });
    }
  }, [users, currentUser.id]);

  const handleSwitchUser = (user: UserProfile) => {
    const sessionToken = createJwtSessionToken(user);
    localStorage.setItem('flora_session_token', sessionToken);
    const userWithSession: UserProfile = {
      ...user,
      sessionToken
    };

    setCurrentUser(userWithSession);
    if (user.mustChangePassword) {
      setIsChangePasswordOpen(true);
    }
    if (!canAccessTab(user.role, activeTab, user.customAllowedTabs)) {
      const def = ROLE_CONFIGS[user.role]?.defaultTab || 'lobby';
      setActiveTab(def);
    }
    addNotification({
      title: 'Switched Active User Role',
      message: `Logged in as ${user.name} (${user.role}).`,
      type: 'info',
      category: 'system'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('flora_session_token');
    setCurrentUser(GUEST_USER);
    setActiveTab('storefront');
    addNotification({
      title: 'Logged Out',
      message: 'You have been logged out successfully. You are now browsing as a Guest.',
      type: 'info',
      category: 'system'
    });
  };

  const handlePlaceCustomerOrder = (orderData: Partial<Order>, cartItems: any[]) => {
    const totalVal = orderData.total || 0;
    const subtotalVal = orderData.subtotal || totalVal;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: orderData.orderNumber || `SO-WEB-${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'Direct',
      status: 'Pending',
      clientId: currentUser.id,
      clientName: currentUser.name,
      date: new Date().toISOString(),
      items: orderData.items || [],
      subtotal: subtotalVal,
      tax: 0,
      taxRate: 0,
      discount: 0,
      discountRate: 0,
      freight: 0,
      otherCharges: 0,
      total: totalVal,
      advancePayment: 0,
      balance: totalVal,
      paymentMethod: orderData.paymentMethod || 'Credit Card / Online'
    };

    setOrders(prev => [newOrder, ...prev]);
    addAuditLog(
      'E-Commerce Web Order Submitted',
      `Web customer ${currentUser.name} placed direct order #${newOrder.orderNumber} for total ${formatCurrency(newOrder.total)}`,
      'sales',
      'info'
    );

    addNotification({
      title: 'New Web E-Commerce Order Request',
      message: `Customer ${currentUser.name} submitted web order #${newOrder.orderNumber} (${formatCurrency(newOrder.total)}). Status: Pending Sales Review.`,
      type: 'info',
      category: 'sales'
    });
  };


  const recordAccountingEntry = (
    description: string,
    debits: { accountId: string; amount: number }[],
    credits: { accountId: string; amount: number }[],
    referenceId?: string
  ) => {
    const date = new Date().toISOString();
    const journalId = `JE-${Date.now()}`;
    
    const newEntries: LedgerEntry[] = [];
    
    // Process Debits
    debits.forEach(d => {
      const account = ledgerAccounts.find(a => a.id === d.accountId);
      if (account) {
        newEntries.push({
          id: `LE-${Math.random().toString(36).substr(2, 9)}`,
          date,
          accountId: account.id,
          accountName: account.name,
          description,
          debit: d.amount,
          credit: 0,
          referenceId,
          transactionId: journalId
        });
      }
    });

    // Process Credits
    credits.forEach(c => {
      const account = ledgerAccounts.find(a => a.id === c.accountId);
      if (account) {
        newEntries.push({
          id: `LE-${Math.random().toString(36).substr(2, 9)}`,
          date,
          accountId: account.id,
          accountName: account.name,
          description,
          debit: 0,
          credit: c.amount,
          referenceId,
          transactionId: journalId
        });
      }
    });

    setLedgerEntries(prev => [...newEntries, ...prev]);
    
    // Update Account Balances
    setLedgerAccounts(prev => prev.map(acc => {
      const accDebits = debits.filter(d => d.accountId === acc.id).reduce((sum, d) => sum + d.amount, 0);
      const accCredits = credits.filter(c => c.accountId === acc.id).reduce((sum, c) => sum + c.amount, 0);
      
      let newBalance = acc.balance;
      // Asset/Expense: Debit increases, Credit decreases
      if (acc.type === 'Asset' || acc.type === 'Expense') {
        newBalance += (accDebits - accCredits);
      } 
      // Liability/Equity/Revenue: Credit increases, Debit decreases
      else {
        newBalance += (accCredits - accDebits);
      }
      
      return { ...acc, balance: newBalance };
    }));
  };

  // Keyboard logic
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        lastFocusedElement.current = target as HTMLInputElement | HTMLTextAreaElement;
      }
    };

    const handleBlur = (e: FocusEvent) => {
      // We don't clear lastFocusedElement on blur immediately 
      // because the keyboard needs it to know where to type.
    };

    window.addEventListener('focus', handleFocus, true);
    window.addEventListener('blur', handleBlur, true);
    return () => {
      window.removeEventListener('focus', handleFocus, true);
      window.removeEventListener('blur', handleBlur, true);
    };
  }, []);

  // Inventory Low Stock Notifications
  useEffect(() => {
    // Check materials
    materials.forEach(material => {
      if (material.type !== 'Service' && material.type !== 'Support' && material.stock <= material.minStock && !notifiedLowStock.current.has(material.id)) {
        addNotification({
          title: 'Low Material Alert',
          message: `${material.name} is low on stock (${material.stock} ${material.unit} left). Min threshold: ${material.minStock}.`,
          type: 'warning',
          category: 'inventory'
        });
        notifiedLowStock.current.add(material.id);
      }
    });

    // Check finished products
    finishedProducts.forEach(product => {
      if (product.stock <= product.minStock && !notifiedLowStock.current.has(product.id)) {
        addNotification({
          title: 'Low Stock Alert',
          message: `${product.name} is low on stock (${product.stock} left). Minimum threshold is ${product.minStock}.`,
          type: 'warning',
          category: 'inventory'
        });
        notifiedLowStock.current.add(product.id);
      }
    });
  }, [materials, finishedProducts]);

  // Barcode Scanner State
  const [scannerStatus, setScannerStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [isBarcodeHubOpen, setIsBarcodeHubOpen] = useState(false);
  const [scannerMessage, setScannerMessage] = useState<string | null>(null);
  const [printerSettings, setPrinterSettings] = useState({
    receiptPrinter: 'System Default',
    reportPrinter: 'System Default',
    isConnected: true,
    isDrawerConnected: true
  });
  const barcodeBuffer = useRef<string>('');
  const lastCharTime = useRef<number>(0);

  const triggerCashDrawer = () => {
    if (printerSettings.isDrawerConnected) {
      addNotification({
        title: 'Cash Drawer Opened',
        message: 'The cash drawer has been triggered and is now open.',
        type: 'success',
        category: 'hardware'
      });
      addAuditLog('Cash Drawer Opened', 'Manual or automatic trigger', 'system');
      
      // Simulated sound
      try {
        if ('speechSynthesis' in window && window.speechSynthesis) {
          const msg = new SpeechSynthesisUtterance('Drawer opened');
          msg.rate = 1.5;
          window.speechSynthesis.speak(msg);
        }
      } catch (err) {
        // Ignore speech synthesis error
      }
      return true;
    } else {
      addNotification({
        title: 'Drawer Error',
        message: 'Cash drawer is not connected or offline.',
        type: 'error',
        category: 'hardware'
      });
      return false;
    }
  };

  // Bad Debt Monitoring
  useEffect(() => {
    const checkBadDebt = () => {
      const today = new Date();
      let badDebtFound = false;
      
      const updatedInvoices = invoices.map(inv => {
        if (inv.status === 'Overdue' && !inv.isBadDebt) {
          const dueDate = new Date(inv.dueDate);
          const diffTime = Math.abs(today.getTime() - dueDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // If more than 90 days overdue, mark as bad debt
          if (diffDays > 90) {
            badDebtFound = true;
            addNotification({
              title: 'Bad Debt Detected',
              message: `Invoice ${inv.invoiceNumber} for ${inv.clientName} is over 90 days overdue. Marking as potential bad debt.`,
              type: 'error',
              category: 'accounting'
            });
            
            // Record accounting entry for bad debt
            // Debit Bad Debt Expense, Credit Accounts Receivable
            recordAccountingEntry(
              `Bad Debt Provision: ${inv.invoiceNumber}`,
              [{ accountId: 'acc-expenses', amount: inv.balance }], // Simplified: using general expenses if bad debt account not found
              [{ accountId: 'acc-bank', amount: inv.balance }], // Simplified: reducing bank/cash expectation
              inv.id
            );
            
            return { ...inv, isBadDebt: true };
          }
        }
        return inv;
      });
      
      if (badDebtFound) {
        setInvoices(updatedInvoices);
      }
    };
    
    const interval = setInterval(checkBadDebt, 60000); // Check every minute for demo
    return () => clearInterval(interval);
  }, [invoices]);

  const prevActiveTabRef = useRef<string>(activeTab);

  // Scanner Ready Notification only when transitioning into ERP Back Office
  useEffect(() => {
    if (prevActiveTabRef.current === 'storefront' && activeTab !== 'storefront') {
      setScannerStatus('idle');
      addNotification({
        title: 'Scanner Ready',
        message: 'Barcode Scanner System is now active and ready to scan.',
        type: 'info',
        category: 'system'
      });
      
      try {
        if ('speechSynthesis' in window && window.speechSynthesis) {
          const msg = new SpeechSynthesisUtterance('Barcode scanner system is ready');
          msg.rate = 1.1;
          msg.pitch = 1;
          window.speechSynthesis.speak(msg);
        }
      } catch (err) {
        // Ignore speech synthesis error
      }

      setTimeout(() => setScannerMessage(null), 3000);
    }
    prevActiveTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea unless it's the barcode scanner
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      // If user is typing in an input, we ignore the global barcode scanner
      // BUT if it's the barcode input in Cart.tsx, it handles its own logic
      if (isInput) {
        barcodeBuffer.current = '';
        return;
      }
      
      const currentTime = Date.now();
      const timeDiff = currentTime - lastCharTime.current;
      lastCharTime.current = currentTime;

      // Most scanners send characters very quickly (usually < 50ms)
      // If it's slow, it's likely a human typing, so we clear the buffer
      if (timeDiff > 50) {
        barcodeBuffer.current = '';
      }

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 0) {
          e.preventDefault();
          processBarcode(barcodeBuffer.current);
          barcodeBuffer.current = '';
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [finishedProducts]);

  const processBarcode = (code: string) => {
    if (!code) return;
    const cleanCode = code.trim();
    
    // 1. Check Finished Products Catalog
    const product = finishedProducts.find(p => (p.barcode && p.barcode === cleanCode) || p.id === cleanCode);
    if (product) {
      if (!product.isService && product.stock <= 0) {
        setScannerStatus('error');
        addNotification({
          title: 'Out of Stock',
          message: `${product.name} is out of stock. Cannot add to cart.`,
          type: 'error',
          category: 'inventory'
        });
        return;
      }

      const existingItem = cartItems.find(item => item.id === product.id);
      if (existingItem) {
        updateQuantity(product.id, 1);
      } else {
        addToCart(product);
      }
      
      setScannerStatus('connected');
      addNotification({
        title: 'Product Scanned',
        message: `Scanned ${product.name} ($${product.price}). Added to cart.`,
        type: 'success',
        category: 'sales'
      });

      try {
        if ('speechSynthesis' in window && window.speechSynthesis) {
          const msg = new SpeechSynthesisUtterance(`${product.name} added`);
          msg.rate = 1.4;
          window.speechSynthesis.speak(msg);
        }
      } catch (err) {}

      setTimeout(() => setScannerStatus('idle'), 2000);
      return;
    }

    // 2. Check Botanical / Material Stock
    const material = materials.find(m => (m.barcode && m.barcode === cleanCode) || m.id === cleanCode);
    if (material) {
      setScannerStatus('connected');
      addNotification({
        title: 'Material Identified',
        message: `Scanned resource: ${material.name} (${material.type}). Stock: ${material.stock} ${material.unit}.`,
        type: 'info',
        category: 'inventory'
      });

      try {
        if ('speechSynthesis' in window && window.speechSynthesis) {
          const msg = new SpeechSynthesisUtterance(`${material.name} identified`);
          msg.rate = 1.4;
          window.speechSynthesis.speak(msg);
        }
      } catch (err) {}

      setActiveTab('inventory');
      setTimeout(() => setScannerStatus('idle'), 2000);
      return;
    }

    // 3. Check Sales / Installation Orders
    const order = orders.find(o => o.id === cleanCode || o.orderNumber === cleanCode);
    if (order) {
      setScannerStatus('connected');
      addNotification({
        title: 'Sales Order Identified',
        message: `Scanned Order #${order.orderNumber || order.id} for ${order.clientName} ($${order.total}).`,
        type: 'info',
        category: 'sales'
      });

      try {
        if ('speechSynthesis' in window && window.speechSynthesis) {
          const msg = new SpeechSynthesisUtterance(`Order ${order.orderNumber || order.id} identified`);
          msg.rate = 1.4;
          window.speechSynthesis.speak(msg);
        }
      } catch (err) {}

      setActiveTab('orders');
      setTimeout(() => setScannerStatus('idle'), 2000);
      return;
    }

    // 4. Check Procurement Orders
    const po = procurementOrders.find(p => p.id === cleanCode || p.poNumber === cleanCode);
    if (po) {
      setScannerStatus('connected');
      addNotification({
        title: 'Procurement Order Identified',
        message: `Scanned Procurement PO #${po.poNumber || po.id} from ${po.supplierName}.`,
        type: 'info',
        category: 'procurement'
      });

      try {
        if ('speechSynthesis' in window && window.speechSynthesis) {
          const msg = new SpeechSynthesisUtterance(`Procurement Order identified`);
          msg.rate = 1.4;
          window.speechSynthesis.speak(msg);
        }
      } catch (err) {}

      setActiveTab('procurement');
      setTimeout(() => setScannerStatus('idle'), 2000);
      return;
    }

    // Barcode not recognized
    setScannerStatus('error');
    addNotification({
      title: 'Scan Error',
      message: `Barcode not found in system: ${cleanCode}.`,
      type: 'error',
      category: 'system'
    });
    
    try {
      if ('speechSynthesis' in window && window.speechSynthesis) {
        const msg = new SpeechSynthesisUtterance(`Barcode not found`);
        msg.rate = 1.2;
        window.speechSynthesis.speak(msg);
      }
    } catch (err) {}

    setTimeout(() => setScannerStatus('idle'), 3000);
  };

  const addToCart = (product: FinishedProduct) => {
    if (product.stock <= 0) {
      addNotification({
        title: 'Out of Stock',
        message: `${product.name} is currently out of stock.`,
        type: 'error',
        category: 'inventory'
      });
      return;
    }

    const existing = cartItems.find(item => item.id === product.id);
    if (existing) {
      if (!product.isService && existing.quantity >= product.stock) {
        addNotification({
          title: 'Stock Limit Reached',
          message: `Cannot add more ${product.name}. Only ${product.stock} available.`,
          type: 'warning',
          category: 'inventory'
        });
        return;
      }
      setCartItems(prev => prev.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCartItems(prev => [...prev, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    const product = finishedProducts.find(p => p.id === id);
    const item = cartItems.find(i => i.id === id);
    
    if (!item) return;

    const newQty = Math.max(1, item.quantity + delta);
    if (delta > 0 && product && newQty > product.stock) {
      addNotification({
        title: 'Stock Limit Reached',
        message: `Only ${product.stock} units of ${product.name} available.`,
        type: 'warning',
        category: 'inventory'
      });
      return;
    }

    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: newQty } : item
    ));
  };

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
    setSelectedClient(null);
    setRevisingOrderId(null);
  };

  const handleReviseOrder = (order: Transaction) => {
    if (cartItems.length > 0) {
      setOrderToRevise(order);
      return;
    }
    
    executeReviseOrder(order);
  };

  const executeReviseOrder = (order: Transaction) => {
    setCartItems(order.items || []);
    setRevisingOrderId(order.id);
    setActiveTab('pos');
    addNotification({
      title: 'Revising Order',
      message: `Order #${order.id.slice(-6).toUpperCase()} loaded into cart for revision.`,
      type: 'info',
      category: 'sales'
    });
  };

  const handleCompleteOrder = (order: Order) => {
    setOrders(prev => [...prev, order]);
    
    // If it's a direct order, record the advance payment transaction
    if (order.type === 'Direct' && order.advancePayment > 0) {
      const advanceTransaction: Transaction = {
        id: `TR-${Date.now()}`,
        type: 'Income',
        category: 'Advance Payment',
        amount: order.advancePayment,
        date: order.advancePaymentDate || new Date().toISOString(),
        description: `Advance payment for Direct Order #${order.orderNumber}`,
        paymentMethod: order.paymentMethod,
        clientId: order.clientId,
        clientName: order.clientName,
        referenceId: order.id,
        status: 'Completed'
      };
      setTransactions(prev => [advanceTransaction, ...prev]);

      // Accounting Entry for Advance Payment
      recordAccountingEntry(
        `Advance Payment for Order #${order.orderNumber}`,
        [{ accountId: 'acc-cash', amount: order.advancePayment }], // Assuming cash for simplicity
        [{ accountId: 'acc-liabilities', amount: order.advancePayment }], // Unearned revenue
        order.id
      );
    }

    addAuditLog('Order Created', `Order #${order.orderNumber} created for ${order.clientName}`, 'sales', 'success');
    addNotification({
      title: 'Order Created',
      message: `Order #${order.orderNumber} has been added to the system.`,
      type: 'success',
      category: 'sales'
    });
    clearCart();
  };

  const handleUpdateOrders = (updatedOrders: Order[]) => {
    setOrders(updatedOrders);
  };

  const handleDeleteOrder = (id: string) => {
    setOrderToDeleteId(id);
  };

  const executeDeleteOrder = (id: string) => {
    const orderToDelete = orders.find(o => o.id === id);
    if (orderToDelete) {
      // Restore stock if it was reduced
      if (orderToDelete.stockReduced && orderToDelete.items) {
        setFinishedProducts(prevProducts => prevProducts.map(product => {
          const itemInOrder = orderToDelete.items?.find(item => item.id === product.id);
          if (itemInOrder) {
            return {
              ...product,
              stock: product.stock + itemInOrder.quantity
            };
          }
          return product;
        }));
      }

      // Remove from orders and transactions
      setOrders(prev => prev.filter(o => o.id !== id));
      setTransactions(prev => prev.filter(t => t.referenceId !== id));
      
      // Remove Ledger Entries for the deleted order
      const entriesToRemove = ledgerEntries.filter(le => le.referenceId === id);
      setLedgerEntries(prev => prev.filter(le => le.referenceId !== id));

      // Update Account Balances (Reverse the entries)
      setLedgerAccounts(prev => prev.map(acc => {
        const accEntriesToRemove = entriesToRemove.filter(e => e.accountId === acc.id);
        if (accEntriesToRemove.length === 0) return acc;

        const totalDebit = accEntriesToRemove.reduce((sum, e) => sum + e.debit, 0);
        const totalCredit = accEntriesToRemove.reduce((sum, e) => sum + e.credit, 0);

        let newBalance = acc.balance;
        // Asset/Expense: Debit increases, Credit decreases -> Reverse: Debit decreases, Credit increases
        if (acc.type === 'Asset' || acc.type === 'Expense') {
          newBalance -= (totalDebit - totalCredit);
        } 
        // Liability/Equity/Revenue: Credit increases, Debit decreases -> Reverse: Credit decreases, Debit increases
        else {
          newBalance -= (totalCredit - totalDebit);
        }
        return { ...acc, balance: newBalance };
      }));

      addAuditLog('Order Deleted', `Order #${id.substring(0, 8)} deleted and stock restored`, 'sales', 'warning');
      addNotification({
        title: 'Order Deleted',
        message: `Order #${id.substring(0, 8)} has been deleted and stock restored.`,
        type: 'success',
        category: 'sales'
      });
    }
  };

  const handleUpdateInvoices = (newInvoices: Invoice[]) => {
    // Find what changed to adjust stock
    newInvoices.forEach(newInv => {
      const oldInv = invoices.find(i => i.id === newInv.id);
      
      // Case 1: Existing invoice was edited
      if (oldInv) {
        // If items changed and stock was already reduced, we need to adjust
        if (oldInv.stockReduced && JSON.stringify(oldInv.items) !== JSON.stringify(newInv.items)) {
          // Restore old stock
          if (oldInv.items) {
            setFinishedProducts(prevProducts => prevProducts.map(product => {
              const itemInOrder = oldInv.items.find(item => item.id === product.id);
              if (itemInOrder) {
                return { ...product, stock: product.stock + itemInOrder.quantity };
              }
              return product;
            }));
          }
          // Reduce new stock
          if (newInv.items) {
            setFinishedProducts(prevProducts => prevProducts.map(product => {
              const itemInOrder = newInv.items.find(item => item.id === product.id);
              if (itemInOrder) {
                return { ...product, stock: Math.max(0, product.stock - itemInOrder.quantity) };
              }
              return product;
            }));
          }
        }

        // Remove old ledger entries to re-record based on new state
        setLedgerEntries(prev => prev.filter(le => le.referenceId !== newInv.id));

        // If status changed from Paid to something else (except Cancelled which is handled below)
        if (oldInv.status === 'Paid' && newInv.status !== 'Paid' && newInv.status !== 'Cancelled' && oldInv.stockReduced) {
          if (oldInv.items) {
            setFinishedProducts(prevProducts => prevProducts.map(product => {
              const itemInOrder = oldInv.items.find(item => item.id === product.id);
              if (itemInOrder) {
                return { ...product, stock: product.stock + itemInOrder.quantity };
              }
              return product;
            }));
          }
          newInv.stockReduced = false;
        }

        // If status changed to Paid and stock wasn't reduced
        if (newInv.status === 'Paid' && !oldInv.stockReduced) {
          if (newInv.items) {
            setFinishedProducts(prevProducts => prevProducts.map(product => {
              const itemInOrder = newInv.items.find(item => item.id === product.id);
              if (itemInOrder) {
                return { ...product, stock: Math.max(0, product.stock - itemInOrder.quantity) };
              }
              return product;
            }));
          }
          newInv.stockReduced = true;
        }
        
        // If status changed to Cancelled and stock WAS reduced
        if (newInv.status === 'Cancelled' && oldInv.stockReduced) {
          if (newInv.items) {
            setFinishedProducts(prevProducts => prevProducts.map(product => {
              const itemInOrder = newInv.items.find(item => item.id === product.id);
              if (itemInOrder) {
                return { ...product, stock: product.stock + itemInOrder.quantity };
              }
              return product;
            }));
          }
          newInv.stockReduced = false;
          // Remove related transactions
          setTransactions(prev => prev.filter(t => t.referenceId !== newInv.id));
        }

        // Re-record accounting entries for the updated invoice (if not cancelled)
        if (newInv.status !== 'Cancelled') {
          const isSupplier = newInv.isSupplierInvoice || newInv.type === 'Supplier';

          if (isSupplier) {
            if (newInv.status === 'Paid') {
              recordAccountingEntry(
                `Supplier Bill #${newInv.invoiceNumber} Paid`,
                [{ accountId: 'acc-ap', amount: newInv.total }],
                [{ accountId: 'acc-cash', amount: newInv.total }],
                newInv.id
              );
            } else {
              recordAccountingEntry(
                `Supplier Bill #${newInv.invoiceNumber} Approved (AP)`,
                [{ accountId: 'acc-inventory', amount: newInv.total }],
                [{ accountId: 'acc-ap', amount: newInv.total }],
                newInv.id
              );
            }
          } else {
            if (newInv.status === 'Paid') {
              recordAccountingEntry(
                `Invoice #${newInv.invoiceNumber} Paid Sale`,
                [{ accountId: 'acc-cash', amount: newInv.total }],
                [{ accountId: 'acc-sales', amount: newInv.total }],
                newInv.id
              );
            } else {
              recordAccountingEntry(
                `Invoice #${newInv.invoiceNumber} Credit Sale`,
                [{ accountId: newInv.clientId ? `acc-client-${newInv.clientId}` : 'acc-ar', amount: newInv.total }],
                [{ accountId: 'acc-sales', amount: newInv.total }],
                newInv.id
              );
            }

            // Re-record COGS for customer invoice
            const cogs = (newInv.items || []).reduce((sum, item) => sum + ((item.costPrice || 0) * item.quantity), 0);
            if (cogs > 0) {
              recordAccountingEntry(
                `COGS for Invoice #${newInv.invoiceNumber}`,
                [{ accountId: 'acc-cogs', amount: cogs }],
                [{ accountId: 'acc-inventory', amount: cogs }],
                newInv.id
              );
            }
          }
        }
      } else {
        // Case 2: New invoice created
        const isSupplier = newInv.isSupplierInvoice || newInv.type === 'Supplier';

        if (isSupplier) {
          if (newInv.status === 'Paid') {
            recordAccountingEntry(
              `Supplier Bill #${newInv.invoiceNumber} Paid`,
              [{ accountId: 'acc-ap', amount: newInv.total }],
              [{ accountId: 'acc-cash', amount: newInv.total }],
              newInv.id
            );
          } else {
            recordAccountingEntry(
              `Supplier Bill #${newInv.invoiceNumber} Approved (AP)`,
              [{ accountId: 'acc-inventory', amount: newInv.total }],
              [{ accountId: 'acc-ap', amount: newInv.total }],
              newInv.id
            );
          }
        } else {
          if (newInv.status === 'Paid') {
            if (newInv.items) {
              setFinishedProducts(prevProducts => prevProducts.map(product => {
                const itemInOrder = newInv.items.find(item => item.id === product.id);
                if (itemInOrder) {
                  return { ...product, stock: Math.max(0, product.stock - itemInOrder.quantity) };
                }
                return product;
              }));
            }
            newInv.stockReduced = true;

            recordAccountingEntry(
              `Invoice #${newInv.invoiceNumber} Paid`,
              [{ accountId: 'acc-cash', amount: newInv.total }],
              [{ accountId: 'acc-sales', amount: newInv.total }],
              newInv.id
            );
          } else if (newInv.status === 'Sent' || newInv.status === 'Draft' || newInv.status === 'Overdue' || newInv.status === 'Approved') {
            recordAccountingEntry(
              `Invoice #${newInv.invoiceNumber} Credit Sale`,
              [{ accountId: newInv.clientId ? `acc-client-${newInv.clientId}` : 'acc-ar', amount: newInv.total }],
              [{ accountId: 'acc-sales', amount: newInv.total }],
              newInv.id
            );
          }

          const cogs = (newInv.items || []).reduce((sum, item) => sum + ((item.costPrice || 0) * item.quantity), 0);
          if (cogs > 0) {
            recordAccountingEntry(
              `COGS for Invoice #${newInv.invoiceNumber}`,
              [{ accountId: 'acc-cogs', amount: cogs }],
              [{ accountId: 'acc-inventory', amount: cogs }],
              newInv.id
            );
          }
        }
      }
    });

    // Handle deletions
    invoices.forEach(oldInv => {
      const stillExists = newInvoices.find(i => i.id === oldInv.id);
      if (!stillExists) {
        if (oldInv.stockReduced && oldInv.items) {
          setFinishedProducts(prevProducts => prevProducts.map(product => {
            const itemInOrder = oldInv.items.find(item => item.id === product.id);
            if (itemInOrder) {
              return { ...product, stock: product.stock + itemInOrder.quantity };
            }
            return product;
          }));
        }
        // Remove related transactions
        setTransactions(prev => prev.filter(t => t.referenceId !== oldInv.id));
        
        // Remove Ledger Entries for the deleted invoice
        const entriesToRemove = ledgerEntries.filter(le => le.referenceId === oldInv.id);
        setLedgerEntries(prev => prev.filter(le => le.referenceId !== oldInv.id));

        // Update Account Balances (Reverse the entries)
        setLedgerAccounts(prev => prev.map(acc => {
          const accEntriesToRemove = entriesToRemove.filter(e => e.accountId === acc.id);
          if (accEntriesToRemove.length === 0) return acc;

          const totalDebit = accEntriesToRemove.reduce((sum, e) => sum + e.debit, 0);
          const totalCredit = accEntriesToRemove.reduce((sum, e) => sum + e.credit, 0);

          let newBalance = acc.balance;
          if (acc.type === 'Asset' || acc.type === 'Expense') {
            newBalance -= (totalDebit - totalCredit);
          } else {
            newBalance -= (totalCredit - totalDebit);
          }
          return { ...acc, balance: newBalance };
        }));
      }
    });

    setInvoices(newInvoices);
    addAuditLog('Invoices Updated', `Batch update of ${newInvoices.length} invoices`, 'sales');
  };

  const executeClearOrders = () => {
    // Restore stock for all orders that had stock reduced
    orders.forEach(order => {
      if (order.stockReduced && order.items) {
        setFinishedProducts(prevProducts => prevProducts.map(product => {
          const itemInOrder = order.items?.find(item => item.id === product.id);
          if (itemInOrder) {
            return {
              ...product,
              stock: product.stock + itemInOrder.quantity
            };
          }
          return product;
        }));
      }
    });

    setOrders([]);
    addAuditLog('Order History Cleared', 'All orders cleared and stock restored', 'sales', 'warning');
    addNotification({
      title: 'History Cleared',
      message: 'All order history has been cleared and stock restored.',
      type: 'success',
      category: 'sales'
    });
    // We don't clear transactions here as they are accounting records
  };

  const handleUpdateQuotations = (newQuotations: Quotation[]) => {
    setQuotations(newQuotations);
    addAuditLog('Quotations Updated', `Batch update of ${newQuotations.length} quotations`, 'sales');
    
    // Sync with invoices if they are linked to a quotation
    setInvoices(prevInvoices => prevInvoices.map(inv => {
      if (inv.quotationId) {
        const quote = newQuotations.find(q => q.id === inv.quotationId);
        if (quote) {
          return {
            ...inv,
            items: quote.items,
            subtotal: quote.subtotal,
            tax: quote.tax,
            taxRate: quote.taxRate,
            discount: quote.discount,
            discountRate: quote.discountRate,
            freight: quote.freight,
            otherCharges: quote.otherCharges,
            otherChargesList: quote.otherChargesList,
            total: quote.total,
            balance: Math.max(0, quote.total - inv.amountPaid),
            terms: quote.terms,
            bankId: quote.bankId
          };
        }
      }
      return inv;
    }));
  };

  useEffect(() => {
    // Ensure all clients and suppliers have ledger accounts
    setLedgerAccounts(prev => {
      const newAccounts: LedgerAccount[] = [];
      
      clients.forEach(client => {
        const accountId = `acc-client-${client.id}`;
        if (!prev.find(a => a.id === accountId)) {
          newAccounts.push({
            id: accountId,
            code: `1200-${client.id.slice(-4)}`,
            name: `AR: ${client.name}`,
            type: 'Asset',
            balance: 0,
            isSystem: false
          });
        }
      });

      suppliers.forEach(supplier => {
        const accountId = `acc-supplier-${supplier.id}`;
        if (!prev.find(a => a.id === accountId)) {
          newAccounts.push({
            id: accountId,
            code: `2000-${supplier.id.slice(-4)}`,
            name: `AP: ${supplier.name}`,
            type: 'Liability',
            balance: 0,
            isSystem: false
          });
        }
      });

      if (newAccounts.length > 0) {
        // We can't call addAuditLog inside setLedgerAccounts because it's a side effect
        // But we can return the new state
        return [...prev, ...newAccounts];
      }
      return prev;
    });
  }, [clients, suppliers]);

  const handleUpdateProducts = (newProducts: FinishedProduct[]) => {
    setFinishedProducts(newProducts);
    addAuditLog('Inventory Updated', `Batch update of ${newProducts.length} products`, 'inventory');
  };

  const handleUpdateClients = (newClients: Client[]) => {
    setClients(newClients);
    if (selectedClient && !newClients.find(c => c.id === selectedClient.id)) {
      setSelectedClient(null);
    }
  };

  const handleUpdateSuppliers = (newSuppliers: Supplier[]) => {
    setSuppliers(newSuppliers);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0) * 1.05;

  if (activeTab === 'storefront') {
    return (
      <div className="min-h-screen w-full bg-slate-50 overflow-auto relative font-sans">
        <ShopStorefront
          products={finishedProducts}
          currentUser={currentUser}
          companySettings={companySettings}
          onOpenAuthScreen={(mode) => {
            setAuthInitialMode(mode || 'login');
            setIsAuthScreenOpen(true);
          }}
          onPlaceCustomerOrder={handlePlaceCustomerOrder}
          onLogout={handleLogout}
          onNavigateToERP={(targetTab) => {
            const isGuest = !currentUser || currentUser.id === 'guest' || currentUser.email?.includes('guest');
            if (isGuest) {
              addNotification({
                title: 'ERP Access Restricted',
                message: 'Access Denied: The ERP Back-Office Portal is restricted to authorized internal staff. Please sign in with a staff account.',
                type: 'error',
                category: 'system'
              });
              setIsAuthScreenOpen(true);
              return;
            }
            if (currentUser.role === 'Client') {
              addNotification({
                title: 'ERP Access Restricted for Customers',
                message: 'Access Denied: Your account is registered as a Customer (Client). The ERP Back-Office is for internal staff and Administrators only.',
                type: 'warning',
                category: 'system'
              });
              return;
            }
            if (currentUser.status === 'Pending Approval') {
              addNotification({
                title: 'Staff Approval Required',
                message: 'Your staff account is currently pending Admin review. ERP access will be activated upon approval.',
                type: 'warning',
                category: 'system'
              });
              return;
            }
            setActiveTab(targetTab || 'lobby');
          }}
        />

        <AuthScreen 
          isOpen={isAuthScreenOpen}
          onClose={() => setIsAuthScreenOpen(false)}
          users={users}
          initialMode={authInitialMode}
          onLoginSuccess={handleLoginSuccess}
          onRegisterUser={(newUser) => {
            handleRegisterUser(newUser);
          }}
          onUpdateUser={handleUpdateUser}
          language={language}
        />

        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          currentUser={currentUser}
          onClose={() => setIsChangePasswordOpen(false)}
          onUpdateUser={handleUpdateUser}
          isFirstLoginPrompt={!!currentUser.mustChangePassword}
        />

        <MfaSecurityModal
          isOpen={isMfaSecurityOpen}
          currentUser={currentUser}
          onClose={() => setIsMfaSecurityOpen(false)}
          onUpdateUser={handleUpdateUser}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-sky-50 via-indigo-50/30 to-pink-50 overflow-hidden font-sans">
      <header className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between shadow-md border-b border-slate-800 shrink-0 z-30">
        <div className="flex items-center gap-4">
          {activeTab !== 'lobby' && (
            <button
              onClick={() => {
                setActiveTab('lobby');
                setSearchQuery('');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl transition-all border border-slate-700/60 active:scale-95 shadow-sm"
            >
              <ArrowLeft size={14} />
              <span>Dashboard</span>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-pink-500 p-0.5 shadow-sm">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-sky-400">
                <Flower2 size={17} />
              </div>
            </div>
            <div>
              <div className="text-sm font-black tracking-tight flex items-center gap-2">
                <span>{companySettings.name}</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2.5 py-0.5 rounded-md border border-sky-400/30 uppercase tracking-widest font-extrabold">
                  {activeTab === 'lobby' ? 'Command Center' : (TAB_TITLES[activeTab] || activeTab)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentUser.id !== 'guest' ? (
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="font-bold text-slate-200">{currentUser.name}</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-1.5 py-0.5 rounded uppercase border border-emerald-500/30">
                {currentUser.role}
              </span>
              <button
                onClick={() => setIsChangePasswordOpen(true)}
                className="ml-1 px-2.5 py-1 bg-purple-500/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-lg font-extrabold text-[10px] transition-all border border-purple-500/30 flex items-center gap-1 active:scale-95 shadow-2xs"
                title="Change Password (Account Owner Self-Service)"
              >
                <Key size={12} />
                <span>Password</span>
              </button>
              <button
                onClick={() => setIsMfaSecurityOpen(true)}
                className="ml-1 px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg font-extrabold text-[10px] transition-all border border-emerald-500/30 flex items-center gap-1 active:scale-95 shadow-2xs"
                title="MFA Security & Authenticator Settings"
              >
                <ShieldCheck size={12} />
                <span>MFA Security</span>
              </button>
              <button
                onClick={handleLogout}
                className="ml-1 px-2.5 py-1 bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg font-extrabold text-[10px] transition-all border border-rose-500/30 flex items-center gap-1 active:scale-95 shadow-2xs"
                title="Log Out & Clear Active Session"
              >
                <LogOut size={12} />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthScreenOpen(true)}
              className="hidden sm:flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <User size={14} />
              <span>Staff / Client Sign In</span>
            </button>
          )}

          <button
            onClick={() => setIsBarcodeHubOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 border border-emerald-500/30"
            title="Open Barcode Studio & Thermal Label Generator"
          >
            <Barcode size={14} />
            <span className="hidden sm:inline">Barcode Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('storefront')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            <Store size={14} />
            <span>Web Storefront</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col min-w-0 min-h-0 relative overflow-hidden">
        
        {!canAccessTab(currentUser.role, activeTab, currentUser.customAllowedTabs) ? (
          <AccessRestricted 
            currentUser={currentUser}
            tabId={activeTab}
            onReturnToAllowedTab={() => setActiveTab(ROLE_CONFIGS[currentUser.role]?.defaultTab || 'pos')}
            onOpenAuthScreen={() => setIsAuthScreenOpen(true)}
          />
        ) : (
          <>
        
        {activeTab === 'lobby' && (
          <Lobby 
            companySettings={companySettings} 
            setActiveTab={setActiveTab} 
            lowStockCount={finishedProducts.filter(p => p.stock <= p.minStock).length + materials.filter(m => m.type !== 'Service' && m.type !== 'Support' && m.stock <= m.minStock).length}
            language={language}
            currentUser={currentUser}
          />
        )}
        
        {activeTab === 'pos' && (
          <div className="flex flex-1 overflow-hidden">
            <ProductGrid 
              products={finishedProducts}
              onAddToCart={addToCart} 
              onUpdateProducts={(newProducts) => setFinishedProducts(newProducts as FinishedProduct[])}
              materials={materials}
              suppliers={suppliers}
              language={language}
              categories={categories}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
            <Cart 
              items={cartItems} 
              selectedClient={selectedClient}
              clients={clients}
              products={finishedProducts}
              scannerStatus={scannerStatus}
              companySettings={companySettings}
              language={language}
              revisingOrderId={revisingOrderId}
              onAddToCart={addToCart}
              onSelectClient={setSelectedClient}
              onUpdateClients={handleUpdateClients}
              updateQuantity={updateQuantity} 
              removeItem={removeItem}
              onTriggerDrawer={triggerCashDrawer}
              onCheckout={(details) => {
                setCheckoutDetails(details);
                setIsCheckoutOpen(true);
              }}
            />
          </div>
        )}

        {activeTab === 'quotation' && (
          <QuotationSystem 
            companySettings={companySettings} 
            onUpdateSettings={setCompanySettings}
            quotations={quotations}
            onUpdateQuotations={handleUpdateQuotations}
            onAddAuditLog={addAuditLog}
            clients={clients}
            onUpdateClients={handleUpdateClients}
            selectedClient={selectedClient}
            onSelectClient={setSelectedClient}
            onNavigateToCustomerPortal={(client) => {
              if (client) setSelectedClient(client);
              setActiveTab('customers');
            }}
            invoices={invoices}
            transactions={transactions}
            orders={orders}
            finishedProducts={finishedProducts}
            onConvertToOrder={(quote) => {
              const existingOrder = orders.find(o => o.quotationId === quote.id);
              if (existingOrder) {
                addNotification({
                  title: 'Order Already Exists',
                  message: `An order (${existingOrder.orderNumber}) already exists for this quotation.`,
                  type: 'warning',
                  category: 'sales'
                });
                setActiveTab('order-management');
                return;
              }
              const advanceAmount = quote.advancePercentage ? (quote.total * (quote.advancePercentage / 100)) : 0;
              const newOrder: Order = {
                id: Date.now().toString(),
                orderNumber: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
                type: 'Quotation',
                status: 'Confirmed',
                clientId: quote.clientId,
                clientName: quote.clientName,
                date: new Date().toISOString(),
                items: quote.items,
                subtotal: quote.subtotal,
                tax: quote.tax,
                taxRate: quote.taxRate,
                discount: quote.discount,
                discountRate: quote.discountRate,
                freight: quote.freight,
                otherCharges: quote.otherCharges,
                otherChargesList: quote.otherChargesList,
                total: quote.total,
                advancePayment: advanceAmount,
                balance: quote.total - advanceAmount,
                paymentMethod: 'Credit',
                quotationId: quote.id
              };
              setOrders([newOrder, ...orders]);
              setActiveTab('order-management');
              addNotification({
                title: 'Order Created',
                message: `Quotation ${quote.quoteNumber} converted to Managed Order.`,
                type: 'success',
                category: 'sales'
              });
            }}
            onConvertToInvoice={(quote) => {
              const existingInvoice = invoices.find(inv => inv.quotationId === quote.id);
              if (existingInvoice) {
                addNotification({
                  title: 'Invoice Exists',
                  message: `An invoice (${existingInvoice.invoiceNumber}) already exists for this quotation.`,
                  type: 'warning',
                  category: 'sales'
                });
                setActiveTab('invoices');
                return;
              }
              const newInvoice: Invoice = {
                id: Date.now().toString(),
                invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
                quotationId: quote.id,
                quotationNumber: quote.quoteNumber,
                clientId: quote.clientId,
                clientName: quote.clientName,
                date: new Date().toISOString(),
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                items: quote.items,
                subtotal: quote.subtotal,
                tax: quote.tax,
                taxRate: quote.taxRate,
                discount: quote.discount,
                discountRate: quote.discountRate,
                freight: quote.freight,
                otherCharges: quote.otherCharges,
                otherChargesList: quote.otherChargesList,
                total: quote.total,
                status: 'Draft',
                amountPaid: 0,
                balance: quote.total,
                terms: quote.terms,
                bankId: quote.bankId
              };
              setInvoices([newInvoice, ...invoices]);
              setActiveTab('invoices');
            }}
            language={language}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        {activeTab === 'invoices' && (
          <InvoiceSystem 
            companySettings={companySettings}
            invoices={invoices}
            onUpdateInvoices={handleUpdateInvoices}
            onUpdateTransactions={(newTrans) => {
              setTransactions(prev => [newTrans, ...prev]);
              // Record Accounting Entry for Invoice Payment
              if (newTrans.type === 'Sale' || newTrans.type === 'Income') {
                const clientAcc = newTrans.clientId ? `acc-client-${newTrans.clientId}` : 'acc-ar';
                recordAccountingEntry(
                  `Invoice Payment: ${newTrans.description}`,
                  [{ accountId: 'acc-cash', amount: newTrans.amount }],
                  [{ accountId: clientAcc, amount: newTrans.amount }],
                  newTrans.referenceId
                );
              }
            }}
            onAddAuditLog={addAuditLog}
            language={language}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        {activeTab === 'expenses' && (
          <ExpenseSystem 
            expenses={expenses}
            onUpdateExpenses={setExpenses}
            onUpdateTransactions={(newTrans) => {
              setTransactions(prev => [newTrans, ...prev]);
              // Record Accounting Entry for Expense
              const expenseAccountMap: Record<string, string> = {
                'Rent': 'acc-rent',
                'Utilities': 'acc-utilities',
                'Salaries': 'acc-salaries',
                'Marketing': 'acc-marketing',
                'Inventory Purchase': 'acc-inventory', // If it's a direct purchase
              };
              const debitAcc = expenseAccountMap[newTrans.category] || 'acc-other-expense';
              const creditAcc = newTrans.paymentMethod === 'Cash' ? 'acc-cash' : 
                               newTrans.paymentMethod === 'Bank' ? 'acc-bank' : 
                               newTrans.supplierId ? `acc-supplier-${newTrans.supplierId}` : 'acc-ap';
              
              recordAccountingEntry(
                newTrans.description,
                [{ accountId: debitAcc, amount: newTrans.amount }],
                [{ accountId: creditAcc, amount: newTrans.amount }],
                newTrans.id
              );
            }}
            companySettings={companySettings}
            suppliers={suppliers}
            onAddAuditLog={addAuditLog}
            language={language}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        {activeTab === 'accounting' && (
          <AccountingSystem 
            companySettings={companySettings} 
            transactions={transactions}
            onUpdateTransactions={setTransactions}
            ledgerAccounts={ledgerAccounts}
            ledgerEntries={ledgerEntries}
            onUpdateLedgerAccounts={setLedgerAccounts}
            onUpdateLedgerEntries={setLedgerEntries}
            onAddAuditLog={addAuditLog}
            language={language}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        {activeTab === 'settings' && (
          <Settings 
            settings={companySettings} 
            onUpdateSettings={setCompanySettings} 
            allData={{
              finishedProducts,
              materials,
              orders,
              transactions,
              quotations,
              invoices,
              expenses,
              clients,
              suppliers
            }}
            language={language}
          />
        )}
        {activeTab === 'customers' && (
          <ClientManagement 
            clients={clients} 
            onUpdateClients={handleUpdateClients} 
            onUpdateTransactions={(newTransactions) => {
              setTransactions(newTransactions);
              // Record accounting entries for client payments
              const latestPayment = newTransactions[0];
              if (latestPayment && latestPayment.type === 'Income' && latestPayment.category === 'Client Payment') {
                const clientAcc = latestPayment.clientId ? `acc-client-${latestPayment.clientId}` : 'acc-ar';
                recordAccountingEntry(
                  `Client Payment: ${latestPayment.clientName}`,
                  [{ accountId: 'acc-cash', amount: latestPayment.amount }],
                  [{ accountId: clientAcc, amount: latestPayment.amount }],
                  latestPayment.id
                );
              }
            }}
            onAddAuditLog={addAuditLog}
            transactions={transactions}
            invoices={invoices}
            quotations={quotations}
            selectedClient={selectedClient}
            onSelectClient={setSelectedClient}
            onNavigateToQuotation={(client) => {
              setSelectedClient(client);
              setActiveTab('quotation');
            }}
            language={language}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        {activeTab === 'procurement' && (
          <ProcurementSystem
            materials={materials}
            finishedProducts={finishedProducts}
            suppliers={suppliers}
            orders={orders}
            rfqs={rfqs}
            quotations={supplierQuotations}
            procurementOrders={procurementOrders}
            transactions={transactions}
            expenses={expenses}
            invoices={invoices}
            onUpdateMaterials={setMaterials}
            onUpdateFinishedProducts={(prods) => setFinishedProducts(prods as FinishedProduct[])}
            onUpdateSuppliers={setSuppliers}
            onUpdateRfqs={setRfqs}
            onUpdateQuotations={setSupplierQuotations}
            onUpdateProcurementOrders={setProcurementOrders}
            onUpdateTransactions={setTransactions}
            onUpdateExpenses={setExpenses}
            onUpdateInvoices={handleUpdateInvoices}
            onAddAuditLog={addAuditLog}
            companySettings={companySettings}
            language={language}
            initialRfqOrderId={initialRfqOrderId}
            onClearInitialRfqOrderId={() => setInitialRfqOrderId(null)}
            initialRfqItem={initialRfqItem}
            onClearInitialRfqItem={() => setInitialRfqItem(null)}
          />
        )}
        {activeTab === 'logistics' && (
          <LogisticsSystem
            orders={orders}
            onUpdateOrders={setOrders}
            procurementOrders={procurementOrders}
            onUpdateProcurementOrders={setProcurementOrders}
            materials={materials}
            onUpdateMaterials={setMaterials}
            finishedProducts={finishedProducts}
            onUpdateFinishedProducts={(prods) => setFinishedProducts(prods as FinishedProduct[])}
            suppliers={suppliers}
            onUpdateSuppliers={setSuppliers}
            clients={clients}
            invoices={invoices}
            onUpdateInvoices={handleUpdateInvoices}
            transactions={transactions}
            onUpdateTransactions={setTransactions}
            onAddAuditLog={addAuditLog}
            companySettings={companySettings}
            language={language}
          />
        )}
        {activeTab === 'inventory' && (
          <MaterialManagement 
            materials={materials} 
            onUpdateMaterials={setMaterials} 
            onNavigateToProcurement={() => setActiveTab('procurement')}
            onQuickCreateRfq={(itemData) => {
              setInitialRfqItem(itemData);
              setActiveTab('procurement');
              addAuditLog('Quick RFQ Created', `Shortage RFQ initialized for ${itemData.name}`, 'inventory', 'info');
            }}
            onUpdateTransactions={(newTrans) => {
              setTransactions(prev => [newTrans, ...prev]);
              if (newTrans.type === 'Purchase') {
                const supplierAcc = newTrans.supplierId ? `acc-supplier-${newTrans.supplierId}` : 'acc-cash';
                recordAccountingEntry(
                  `Stock Purchase: ${newTrans.description}`,
                  [{ accountId: 'acc-inventory', amount: newTrans.amount }],
                  [{ accountId: supplierAcc, amount: newTrans.amount }],
                  newTrans.id
                );
              }
            }}
            suppliers={suppliers}
            onAddAuditLog={addAuditLog}
            categories={categories}
            onUpdateCategories={setCategories}
            language={language}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        {activeTab === 'products' && (
          <ProductCatalog
            products={finishedProducts}
            materials={materials}
            suppliers={suppliers}
            onAddProduct={(p) => setFinishedProducts([p, ...finishedProducts])}
            onUpdateProduct={(p) => setFinishedProducts(finishedProducts.map(fp => fp.id === p.id ? p : fp))}
            onDeleteProduct={(id) => setFinishedProducts(finishedProducts.filter(fp => fp.id !== id))}
            onUpdateProducts={(prods) => setFinishedProducts(prods as FinishedProduct[])}
            onUpdateMaterials={setMaterials}
            onUpdateTransactions={(newTrans) => setTransactions(prev => [newTrans, ...prev])}
            onAddAuditLog={addAuditLog}
            onQuickCreateRfq={(itemData) => {
              setInitialRfqItem(itemData);
              setActiveTab('procurement');
              addAuditLog('Quick RFQ Created', `Product replenishment RFQ initialized for ${itemData.name}`, 'inventory', 'info');
            }}
            language={language}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        {activeTab === 'supplier-portal' && (
          <SupplierPortal 
            currentUser={currentUser}
            suppliers={suppliers}
            rfqs={rfqs}
            quotations={supplierQuotations}
            procurementOrders={procurementOrders}
            invoices={invoices}
            companySettings={companySettings}
            onUpdateQuotations={setSupplierQuotations}
            onUpdateRfqs={setRfqs}
            onUpdateProcurementOrders={setProcurementOrders}
            onUpdateInvoices={setInvoices}
            onAddAuditLog={addAuditLog}
          />
        )}

        {activeTab === 'suppliers' && (
          <SupplierManagement 
            suppliers={suppliers} 
            onUpdateSuppliers={handleUpdateSuppliers} 
            onUpdateTransactions={(newTransactions) => {
              setTransactions(newTransactions);
              // Record accounting entries for supplier payments
              const latestPayment = newTransactions[0];
              if (latestPayment && latestPayment.type === 'Expense' && latestPayment.category === 'Supplier Payment') {
                const supplierAcc = latestPayment.supplierId ? `acc-supplier-${latestPayment.supplierId}` : 'acc-ap';
                recordAccountingEntry(
                  `Supplier Payment: ${latestPayment.supplierName}`,
                  [{ accountId: supplierAcc, amount: latestPayment.amount }],
                  [{ accountId: 'acc-cash', amount: latestPayment.amount }],
                  latestPayment.id
                );
              }
            }}
            onAddAuditLog={addAuditLog}
            transactions={transactions}
            procurementOrders={procurementOrders}
            language={language}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {activeTab === 'order-management' && (
          <OrderSystem 
            orders={orders} 
            onDeleteOrder={handleDeleteOrder} 
            onUpdateOrders={handleUpdateOrders}
            companySettings={companySettings}
            language={language}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            rfqs={rfqs}
            quotations={supplierQuotations}
            procurementOrders={procurementOrders}
            onNavigateToProcurement={(tab) => setActiveTab('procurement')}
            onCreateRfqForOrder={(orderId) => {
              setInitialRfqOrderId(orderId);
              setActiveTab('procurement');
            }}
          />
        )}

        {activeTab === 'audit' && (
          <SystemAuditLog 
            logs={auditLogs} 
            onClearLogs={() => setAuditLogs([])} 
            language={language}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {activeTab === 'user-management' && (
          <UserManagementPortal 
            users={users}
            currentUser={currentUser}
            onUpdateUser={handleUpdateUser}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUserAccount}
          />
        )}
        
        {['reports'].includes(activeTab) && (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">🚧</span>
            </div>
            <h2 className="text-xl font-bold text-gray-600 capitalize">{activeTab} Module</h2>
            <p>This module is currently under development.</p>
          </div>
        )}
        </>
        )}


        <CheckoutModal 
          isOpen={isCheckoutOpen}
          onClose={() => {
            setIsCheckoutOpen(false);
            setCheckoutDetails(null);
          }}
          total={checkoutDetails?.total || 0}
          details={checkoutDetails}
          items={cartItems}
          onComplete={handleCompleteOrder}
          companySettings={companySettings}
          clients={clients}
          transactions={transactions}
          invoices={invoices}
          onAddClient={(client) => setClients(prev => [...prev, client])}
          onTriggerDrawer={triggerCashDrawer}
        />

        <AnimatePresence>
          {isPrinterSettingsOpen && (
            <motion.div
              key="printer-settings-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            >
              <motion.div
                key="printer-settings-card"
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-white/20"
              >
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                      <Printer size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Printer Settings</h2>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Configure multiple printers</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsPrinterSettingsOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Receipt Printer (POS)</label>
                      <select 
                        value={printerSettings.receiptPrinter}
                        onChange={(e) => setPrinterSettings(prev => ({ ...prev, receiptPrinter: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                      >
                        <option>System Default</option>
                        <option>Thermal Receipt Printer (80mm)</option>
                        <option>Network Printer 01</option>
                        <option>Bluetooth Printer</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Report Printer (Accounting)</label>
                      <select 
                        value={printerSettings.reportPrinter}
                        onChange={(e) => setPrinterSettings(prev => ({ ...prev, reportPrinter: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                      >
                        <option>System Default</option>
                        <option>Office Laser Jet (A4)</option>
                        <option>PDF Export</option>
                        <option>Network Printer 02</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        printerSettings.isConnected ? "bg-green-500 animate-pulse" : "bg-gray-300"
                      )} />
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        {printerSettings.isConnected ? "Printers Connected" : "Printers Offline"}
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        setPrinterSettings(prev => ({ ...prev, isConnected: true }));
                        addNotification({
                          title: 'Printers Connected',
                          message: 'All configured printers are now online and ready.',
                          type: 'success',
                          category: 'system'
                        });
                      }}
                      className="px-4 py-2 bg-white border border-primary/20 text-primary rounded-xl text-[10px] font-black uppercase hover:bg-primary hover:text-white transition-all"
                    >
                      Connect All
                    </button>
                  </div>

                  <button 
                    onClick={() => setIsPrinterSettingsOpen(false)}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-gray-900/20 hover:bg-gray-800 transition-all"
                  >
                    Save Configuration
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barcode Scanner Toast Feedback */}
        <AnimatePresence>
          {scannerMessage && (
            <motion.div
              key="scanner-toast"
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 50, x: '-50%' }}
              className={cn(
                "fixed bottom-8 left-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md",
                scannerStatus === 'connected' ? "bg-green-500/90 text-white border-green-400" : "bg-red-500/90 text-white border-red-400"
              )}
            >
              {scannerStatus === 'connected' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                  {scannerStatus === 'connected' ? 'Barcode Scanned' : 'Scanner Error'}
                </span>
                <span className="text-sm font-bold">{scannerMessage}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <VirtualKeyboard
          isOpen={isKeyboardOpen}
          onClose={() => setIsKeyboardOpen(false)}
          language={language}
          onLanguageToggle={() => setLanguage(language === 'en' ? 'si' : 'en')}
          onInput={(char) => {
            const activeElement = lastFocusedElement.current || document.activeElement as HTMLInputElement | HTMLTextAreaElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
              const start = activeElement.selectionStart || 0;
              const end = activeElement.selectionEnd || 0;
              const value = activeElement.value;
              const newValue = value.substring(0, start) + char + value.substring(end);
              
              // Use native setter to trigger React state update
              const setter = Object.getOwnPropertyDescriptor(
                activeElement instanceof HTMLTextAreaElement 
                  ? window.HTMLTextAreaElement.prototype 
                  : window.HTMLInputElement.prototype, 
                'value'
              )?.set;
              
              if (setter) {
                setter.call(activeElement, newValue);
                activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                
                // Restore cursor position
                const newPos = start + char.length;
                activeElement.setSelectionRange(newPos, newPos);
                // Ensure it stays focused
                activeElement.focus();
              }
            }
          }}
          onDelete={() => {
            const activeElement = lastFocusedElement.current || document.activeElement as HTMLInputElement | HTMLTextAreaElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
              const start = activeElement.selectionStart || 0;
              const end = activeElement.selectionEnd || 0;
              const value = activeElement.value;
              let newValue = value;
              let newPos = start;

              if (start === end) {
                if (start > 0) {
                  newValue = value.substring(0, start - 1) + value.substring(end);
                  newPos = start - 1;
                }
              } else {
                newValue = value.substring(0, start) + value.substring(end);
                newPos = start;
              }

              // Use native setter to trigger React state update
              const setter = Object.getOwnPropertyDescriptor(
                activeElement instanceof HTMLTextAreaElement 
                  ? window.HTMLTextAreaElement.prototype 
                  : window.HTMLInputElement.prototype, 
                'value'
              )?.set;

              if (setter) {
                setter.call(activeElement, newValue);
                activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                
                // Restore cursor position
                activeElement.setSelectionRange(newPos, newPos);
                // Ensure it stays focused
                activeElement.focus();
              }
            }
          }}
          onEnter={() => {
            const activeElement = lastFocusedElement.current || document.activeElement as HTMLInputElement | HTMLTextAreaElement;
            if (activeElement) {
              activeElement.blur();
            }
            setIsKeyboardOpen(false);
          }}
        />

        <ConfirmModal
          isOpen={!!orderToRevise}
          onClose={() => setOrderToRevise(null)}
          onConfirm={() => {
            if (orderToRevise) {
              executeReviseOrder(orderToRevise);
              setOrderToRevise(null);
            }
          }}
          title="Clear Cart & Revise?"
          message="You have items in your cart. Revising this order will clear your current cart. Continue?"
          confirmText="Yes, Clear & Revise"
          cancelText="Cancel"
          type="warning"
        />

        <ConfirmModal
          isOpen={!!orderToDeleteId}
          onClose={() => setOrderToDeleteId(null)}
          onConfirm={() => {
            if (orderToDeleteId) {
              executeDeleteOrder(orderToDeleteId);
              setOrderToDeleteId(null);
            }
          }}
          title="Delete Order?"
          message="Are you sure you want to delete this order? This will restore the stock and remove the transaction from accounting."
          confirmText="Delete Order"
          cancelText="Cancel"
          type="danger"
        />

        <ConfirmModal
          isOpen={isClearOrdersConfirmOpen}
          onClose={() => setIsClearOrdersConfirmOpen(false)}
          onConfirm={() => {
            executeClearOrders();
            setIsClearOrdersConfirmOpen(false);
          }}
          title="Clear All Orders?"
          message="Are you sure you want to clear all order history? This will restore stock for all completed orders. This action cannot be undone."
          confirmText="Clear All"
          cancelText="Cancel"
          type="danger"
        />

        <AuthScreen 
          isOpen={isAuthScreenOpen}
          onClose={() => setIsAuthScreenOpen(false)}
          users={users}
          initialMode={authInitialMode}
          onLoginSuccess={handleLoginSuccess}
          onRegisterUser={(newUser) => {
            handleRegisterUser(newUser);
          }}
          onUpdateUser={handleUpdateUser}
          language={language}
        />

        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          currentUser={currentUser}
          onClose={() => setIsChangePasswordOpen(false)}
          onUpdateUser={handleUpdateUser}
          isFirstLoginPrompt={!!currentUser.mustChangePassword}
        />

        <MfaSecurityModal
          isOpen={isMfaSecurityOpen}
          currentUser={currentUser}
          onClose={() => setIsMfaSecurityOpen(false)}
          onUpdateUser={handleUpdateUser}
        />

        <BarcodeHubModal
          isOpen={isBarcodeHubOpen}
          onClose={() => setIsBarcodeHubOpen(false)}
          products={finishedProducts}
          materials={materials}
          orders={orders}
          procurementOrders={procurementOrders}
          onUpdateProduct={(updatedProd) => {
            setFinishedProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p));
            addAuditLog('Barcode Updated', `Updated barcode for product ${updatedProd.name} (${updatedProd.barcode})`, 'inventory');
          }}
          onUpdateMaterial={(updatedMat) => {
            setMaterials(prev => prev.map(m => m.id === updatedMat.id ? updatedMat : m));
            addAuditLog('Barcode Updated', `Updated barcode for material ${updatedMat.name} (${updatedMat.barcode})`, 'inventory');
          }}
          onAddToCart={addToCart}
        />
      </main>
    </div>
  );

}

