import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  Plus, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  ChevronRight,
  MoreVertical,
  History,
  Briefcase,
  PieChart as PieChartIcon,
  Download,
  CreditCard,
  Printer,
  X,
  Trash2,
  Check,
  Eye,
  ArrowUpRight,
  PackageCheck,
  Scissors,
  Layers,
  Flower2,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Building2,
  Calendar,
  CheckSquare,
  ShieldCheck,
  Receipt,
  Edit,
  RotateCcw,
  XCircle,
  LayoutDashboard,
  Zap,
  AlertTriangle,
  Grid,
  FileSpreadsheet,
  Copy,
  Star,
  StarHalf,
  Award,
  TrendingUp,
  TrendingDown,
  AlertOctagon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
  ReferenceLine
} from 'recharts';
import { cn, formatCurrency } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Supplier, 
  SupplierRating,
  RFQ, 
  SupplierQuotation, 
  ProcurementOrder,
  Material,
  FinishedProduct,
  Order,
  CompanySettings,
  Transaction,
  Expense,
  Invoice
} from '../../types';
import { translations, Language } from '../../i18n';
import PrintPortal from '../layout/PrintPortal';
import RfqPrintView from './RfqPrintView';
import PoPrintView from './PoPrintView';
import ProcurementReportModal from './ProcurementReportModal';
import { useNotifications } from '../../context/NotificationContext';

interface ProcurementSystemProps {
  suppliers: Supplier[];
  materials: Material[];
  finishedProducts?: FinishedProduct[];
  orders: Order[];
  rfqs: RFQ[];
  quotations: SupplierQuotation[];
  procurementOrders: ProcurementOrder[];
  transactions?: Transaction[];
  expenses?: Expense[];
  invoices?: Invoice[];
  onUpdateSuppliers: (suppliers: Supplier[]) => void;
  onUpdateMaterials: (materials: Material[]) => void;
  onUpdateFinishedProducts?: (products: FinishedProduct[]) => void;
  onUpdateRfqs: (rfqs: RFQ[]) => void;
  onUpdateQuotations: (quotations: SupplierQuotation[]) => void;
  onUpdateProcurementOrders: (pos: ProcurementOrder[]) => void;
  onUpdateTransactions?: (transactions: Transaction[]) => void;
  onUpdateExpenses?: (expenses: Expense[]) => void;
  onUpdateInvoices?: (invoices: Invoice[]) => void;
  onAddAuditLog?: (action: string, details: string, category: any, type?: any) => void;
  companySettings: CompanySettings;
  language?: Language;
  initialRfqOrderId?: string | null;
  onClearInitialRfqOrderId?: () => void;
  initialRfqItem?: {
    type: 'Material' | 'Product' | 'Service' | 'Support';
    id?: string;
    name: string;
    quantity: number;
    unit: string;
    supplier?: string;
    specs?: string;
    items?: { materialId?: string; name: string; quantity: number; unit: string; specs?: string }[];
  } | null;
  onClearInitialRfqItem?: () => void;
}

interface POStageProgressBarsProps {
  po: ProcurementOrder;
  compact?: boolean;
}

function POStageProgressBars({ po, compact = false }: POStageProgressBarsProps) {
  // 1. Order Received stage
  const totalQty = po.items.reduce((s, i) => s + (i.quantity || 1), 0);
  const receivedQty = po.items.reduce((s, i) => {
    if (i.receivedQuantity !== undefined) return s + i.receivedQuantity;
    if (po.status === 'Received') return s + (i.quantity || 1);
    if (po.status === 'Partial') return s + Math.floor((i.quantity || 1) * 0.5);
    return s;
  }, 0);
  const receivedPct = po.status === 'Received' ? 100 : (totalQty > 0 ? Math.min(100, Math.round((receivedQty / totalQty) * 100)) : (po.status === 'Partial' ? 50 : 0));

  // 2. Quality Control (QC) stage
  let qcPct = 0;
  let qcStatusLabel = 'Pending QC';
  if (po.status === 'Received') {
    qcPct = 100;
    qcStatusLabel = 'QC Passed & Cleared';
  } else if (po.status === 'Partial') {
    qcPct = 50;
    qcStatusLabel = 'Partial QC Inspection';
  } else if (po.serviceDetails?.serviceStatus === 'QA Inspection') {
    qcPct = 75;
    qcStatusLabel = 'QA Inspection';
  } else if (po.serviceDetails?.serviceStatus === 'Completed') {
    qcPct = 100;
    qcStatusLabel = 'QC Passed';
  }

  // 3. Payment Cleared stage
  const paidAmt = po.paidAmount || (po.paymentStatus === 'Paid' ? po.total : 0);
  const paymentPct = po.paymentStatus === 'Paid' ? 100 : (po.total > 0 ? Math.min(100, Math.round((paidAmt / po.total) * 100)) : 0);

  if (compact) {
    return (
      <div className="space-y-1 w-full min-w-[150px]">
        {/* Stage 1: Order Received */}
        <div className="flex items-center justify-between text-[9px] gap-1">
          <span className="font-bold text-gray-500 truncate flex items-center gap-0.5">
            <PackageCheck size={10} className={receivedPct === 100 ? "text-emerald-600" : receivedPct > 0 ? "text-amber-600" : "text-gray-400"} />
            Received:
          </span>
          <span className={cn("font-bold font-mono", receivedPct === 100 ? "text-emerald-700" : receivedPct > 0 ? "text-amber-700" : "text-gray-400")}>
            {receivedPct}% ({receivedQty}/{totalQty})
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden border border-gray-200/50">
          <div 
            className={cn("h-full transition-all duration-300 rounded-full", receivedPct === 100 ? "bg-emerald-500" : receivedPct > 0 ? "bg-amber-500" : "bg-gray-300")}
            style={{ width: `${receivedPct}%` }}
          />
        </div>

        {/* Stage 2: Quality Control */}
        <div className="flex items-center justify-between text-[9px] gap-1 pt-0.5">
          <span className="font-bold text-gray-500 truncate flex items-center gap-0.5">
            <ShieldCheck size={10} className={qcPct === 100 ? "text-emerald-600" : qcPct > 0 ? "text-teal-600" : "text-gray-400"} />
            QC Check:
          </span>
          <span className={cn("font-bold font-mono", qcPct === 100 ? "text-emerald-700" : qcPct > 0 ? "text-teal-700" : "text-gray-400")}>
            {qcPct}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden border border-gray-200/50">
          <div 
            className={cn("h-full transition-all duration-300 rounded-full", qcPct === 100 ? "bg-emerald-500" : qcPct > 0 ? "bg-teal-500" : "bg-gray-300")}
            style={{ width: `${qcPct}%` }}
          />
        </div>

        {/* Stage 3: Payment Cleared */}
        <div className="flex items-center justify-between text-[9px] gap-1 pt-0.5">
          <span className="font-bold text-gray-500 truncate flex items-center gap-0.5">
            <CreditCard size={10} className={paymentPct === 100 ? "text-emerald-600" : paymentPct > 0 ? "text-indigo-600" : "text-rose-500"} />
            Payment:
          </span>
          <span className={cn("font-bold font-mono", paymentPct === 100 ? "text-emerald-700" : paymentPct > 0 ? "text-indigo-700" : "text-rose-600")}>
            {paymentPct}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden border border-gray-200/50">
          <div 
            className={cn("h-full transition-all duration-300 rounded-full", paymentPct === 100 ? "bg-emerald-500" : paymentPct > 0 ? "bg-indigo-500" : "bg-rose-400")}
            style={{ width: `${paymentPct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80">
      {/* Stage 1: Order Received */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <PackageCheck size={14} className={receivedPct === 100 ? "text-emerald-600" : receivedPct > 0 ? "text-amber-600" : "text-gray-400"} />
            Stage 1: Order Received
          </span>
          <span className={cn(
            "text-[10px] font-black font-mono px-2 py-0.5 rounded",
            receivedPct === 100 ? "bg-emerald-100 text-emerald-800" : receivedPct > 0 ? "bg-amber-100 text-amber-800" : "bg-gray-200 text-gray-600"
          )}>
            {receivedPct}% ({receivedQty}/{totalQty} units received)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-500 rounded-full", receivedPct === 100 ? "bg-emerald-500" : receivedPct > 0 ? "bg-amber-500" : "bg-gray-300")}
            style={{ width: `${receivedPct}%` }}
          />
        </div>
      </div>

      {/* Stage 2: Quality Control */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <ShieldCheck size={14} className={qcPct === 100 ? "text-emerald-600" : qcPct > 0 ? "text-teal-600" : "text-gray-400"} />
            Stage 2: Quality Control (QC)
          </span>
          <span className={cn(
            "text-[10px] font-black font-mono px-2 py-0.5 rounded",
            qcPct === 100 ? "bg-emerald-100 text-emerald-800" : qcPct > 0 ? "bg-teal-100 text-teal-800" : "bg-gray-200 text-gray-600"
          )}>
            {qcPct}% • {qcStatusLabel}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-500 rounded-full", qcPct === 100 ? "bg-emerald-500" : qcPct > 0 ? "bg-teal-500" : "bg-gray-300")}
            style={{ width: `${qcPct}%` }}
          />
        </div>
      </div>

      {/* Stage 3: Payment Cleared */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <CreditCard size={14} className={paymentPct === 100 ? "text-emerald-600" : paymentPct > 0 ? "text-indigo-600" : "text-rose-500"} />
            Stage 3: Payment Cleared
          </span>
          <span className={cn(
            "text-[10px] font-black font-mono px-2 py-0.5 rounded",
            paymentPct === 100 ? "bg-emerald-100 text-emerald-800" : paymentPct > 0 ? "bg-indigo-100 text-indigo-800" : "bg-rose-100 text-rose-800"
          )}>
            {paymentPct}% ({formatCurrency(paidAmt)} / {formatCurrency(po.total)})
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-500 rounded-full", paymentPct === 100 ? "bg-emerald-500" : paymentPct > 0 ? "bg-indigo-500" : "bg-rose-500")}
            style={{ width: `${paymentPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

interface StarRatingDisplayProps {
  rating?: number;
  count?: number;
  showText?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

function StarRatingDisplay({ rating = 0, count, showText = true, size = 'sm' }: StarRatingDisplayProps) {
  const iconSize = size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'md' ? 16 : 20;
  const numRating = Number(rating) || 0;
  const stars = [];

  for (let i = 1; i <= 5; i++) {
    if (numRating >= i) {
      stars.push(<Star key={i} size={iconSize} className="fill-amber-400 text-amber-400 shrink-0" />);
    } else if (numRating >= i - 0.5) {
      stars.push(<StarHalf key={i} size={iconSize} className="fill-amber-400 text-amber-400 shrink-0" />);
    } else {
      stars.push(<Star key={i} size={iconSize} className="text-gray-300 shrink-0" />);
    }
  }

  return (
    <div className="inline-flex items-center gap-1 font-semibold">
      <div className="flex items-center gap-0.5">{stars}</div>
      {showText && (
        <span className={cn(
          "font-bold text-amber-700 font-mono",
          size === 'xs' ? "text-[10px]" : size === 'sm' ? "text-xs" : "text-sm"
        )}>
          {numRating.toFixed(1)}
          {count !== undefined && <span className="text-gray-400 font-normal text-[10px] ml-0.5">({count})</span>}
        </span>
      )}
    </div>
  );
}

interface StarRatingPickerProps {
  value: number;
  onChange: (val: number) => void;
  size?: number;
}

function StarRatingPicker({ value, onChange, size = 22 }: StarRatingPickerProps) {
  const [hoverVal, setHoverVal] = useState<number | null>(null);
  const activeVal = hoverVal ?? value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHoverVal(star)}
          onMouseLeave={() => setHoverVal(null)}
          onClick={() => onChange(star)}
          className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
        >
          <Star
            size={size}
            className={cn(
              star <= activeVal ? "fill-amber-400 text-amber-400" : "text-gray-300"
            )}
          />
        </button>
      ))}
      <span className="ml-2 font-mono font-black text-amber-700 text-xs">
        {activeVal > 0 ? `${activeVal} / 5 Stars` : 'Select score'}
      </span>
    </div>
  );
}

type ProcurementTab = 'dashboard' | 'rfq' | 'quotations' | 'orders' | 'services' | 'suppliers' | 'leadtime' | 'credit' | 'reports';

export default function ProcurementSystem({ 
  suppliers, 
  materials, 
  finishedProducts = [],
  orders,
  rfqs,
  quotations,
  procurementOrders,
  transactions = [],
  expenses = [],
  invoices = [],
  onUpdateSuppliers, 
  onUpdateMaterials,
  onUpdateFinishedProducts,
  onUpdateRfqs,
  onUpdateQuotations,
  onUpdateProcurementOrders,
  onUpdateTransactions,
  onUpdateExpenses,
  onUpdateInvoices,
  onAddAuditLog,
  companySettings,
  language = 'en',
  initialRfqOrderId,
  onClearInitialRfqOrderId,
  initialRfqItem,
  onClearInitialRfqItem
}: ProcurementSystemProps) {
  const t = translations[language];
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<ProcurementTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [timeframeFilter, setTimeframeFilter] = useState<'all' | 'month' | 'quarter' | 'year'>('all');

  // React to initialRfqOrderId when passed from Order management
  React.useEffect(() => {
    if (initialRfqOrderId) {
      const selectedOrder = orders.find(o => o.id === initialRfqOrderId);
      if (selectedOrder) {
        setNewRfqData({
          type: 'Material',
          orderId: selectedOrder.id,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          selectedSuppliers: [],
          notes: `Procurement solicitation for Order ${selectedOrder.orderNumber} (${selectedOrder.clientName})`,
          items: selectedOrder.items && selectedOrder.items.length > 0 ? selectedOrder.items.map(item => ({
            materialId: item.id || '',
            name: item.name,
            quantity: item.quantity,
            unit: 'pcs',
            specs: `Order Spec (${item.color || ''} ${item.size || ''})`.trim()
          })) : [{ materialId: '', name: '', quantity: 10, unit: 'pcs', specs: '' }]
        });
        setIsCreateRfqOpen(true);
        setActiveTab('rfq');
      }
      if (onClearInitialRfqOrderId) {
        onClearInitialRfqOrderId();
      }
    }
  }, [initialRfqOrderId, orders, onClearInitialRfqOrderId]);

  // React to initialRfqItem passed directly from Material or Product management
  React.useEffect(() => {
    if (initialRfqItem) {
      const matchingSuppliers: string[] = [];
      if (initialRfqItem.supplier) {
        const sup = suppliers.find(s => s.name.toLowerCase() === initialRfqItem.supplier?.toLowerCase());
        if (sup) matchingSuppliers.push(sup.id);
      }

      const rfqItems = initialRfqItem.items && initialRfqItem.items.length > 0
        ? initialRfqItem.items.map(it => ({
            materialId: it.materialId || '',
            name: it.name,
            quantity: it.quantity,
            unit: it.unit || 'pcs',
            specs: it.specs || `Inventory replenishment`
          }))
        : [{
            materialId: initialRfqItem.id || '',
            name: initialRfqItem.name,
            quantity: initialRfqItem.quantity,
            unit: initialRfqItem.unit || 'pcs',
            specs: initialRfqItem.specs || `${initialRfqItem.type} deficit replenishment`
          }];

      setNewRfqData({
        type: (initialRfqItem.type as any) || 'Material',
        orderId: '',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        selectedSuppliers: matchingSuppliers,
        notes: `Replenishment Request for Inventory Shortage: ${initialRfqItem.name}${initialRfqItem.items && initialRfqItem.items.length > 1 ? ` (+${initialRfqItem.items.length - 1} items)` : ''}`,
        items: rfqItems
      });

      setIsCreateRfqOpen(true);
      setActiveTab('rfq');
      if (onClearInitialRfqItem) {
        onClearInitialRfqItem();
      }
    }
  }, [initialRfqItem, suppliers, onClearInitialRfqItem]);

  // Modals state
  const [isCreateRfqOpen, setIsCreateRfqOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkImportGrouping, setBulkImportGrouping] = useState<'bySupplier' | 'individual' | 'consolidated'>('bySupplier');
  const [bulkRows, setBulkRows] = useState<Array<{
    id: string;
    name: string;
    type: 'Material' | 'Product' | 'Service' | 'Support';
    quantity: number;
    unit: string;
    preferredSupplierId: string;
    deadline: string;
    specs: string;
  }>>([]);

  const handleOpenBulkImport = () => {
    if (bulkRows.length === 0) {
      handleLoadSampleBulkRows();
    }
    setIsBulkImportOpen(true);
  };

  const handleAddBulkRow = () => {
    const defaultDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setBulkRows(prev => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: '',
        type: 'Material',
        quantity: 10,
        unit: 'pcs',
        preferredSupplierId: suppliers[0]?.id || '',
        deadline: defaultDeadline,
        specs: ''
      }
    ]);
  };

  const handleRemoveBulkRow = (id: string) => {
    setBulkRows(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateBulkRow = (id: string, field: string, value: any) => {
    setBulkRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleLoadSampleBulkRows = () => {
    const defaultDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setBulkRows([
      {
        id: `row-${Date.now()}-1`,
        name: 'Preserved Emerald Cushion Moss (Kg)',
        type: 'Material',
        quantity: 25,
        unit: 'kg',
        preferredSupplierId: suppliers[0]?.id || '',
        deadline: defaultDeadline,
        specs: 'Grade A Soft Preserved Emerald Moss'
      },
      {
        id: `row-${Date.now()}-2`,
        name: 'Fiberstone Trough Planter (100cm)',
        type: 'Material',
        quantity: 10,
        unit: 'pcs',
        preferredSupplierId: suppliers[1]?.id || suppliers[0]?.id || '',
        deadline: defaultDeadline,
        specs: 'Antiqued brass slider, #5 chain size'
      },
      {
        id: `row-${Date.now()}-3`,
        name: 'Custom Artificial Tree Structural Rigging',
        type: 'Service',
        quantity: 2,
        unit: 'job',
        preferredSupplierId: suppliers[2]?.id || suppliers[0]?.id || '',
        deadline: defaultDeadline,
        specs: 'On-site installation and flame-retardant cert required'
      },
      {
        id: `row-${Date.now()}-4`,
        name: 'Eco Dye Sublimation Print Trims',
        type: 'Support',
        quantity: 350,
        unit: 'yards',
        preferredSupplierId: suppliers[0]?.id || '',
        deadline: defaultDeadline,
        specs: 'Custom Pantone #286 Blue color matching'
      }
    ]);
  };

  const handleLoadLowStockItems = () => {
    const defaultDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const lowStockMaterials = materials.filter(m => m.stock <= m.minStock).map(m => ({
      id: `row-mat-${m.id}-${Date.now()}`,
      name: m.name,
      type: 'Material' as const,
      quantity: Math.max(1, (m.minStock * 2) - m.stock),
      unit: m.unit || 'pcs',
      preferredSupplierId: suppliers.find(s => s.name.toLowerCase() === m.supplier?.toLowerCase())?.id || suppliers[0]?.id || '',
      deadline: defaultDeadline,
      specs: `Replenishment for inventory deficit (Current Stock: ${m.stock} ${m.unit}, Target: ${m.minStock * 2} ${m.unit})`
    }));

    const lowStockProds = (finishedProducts || []).filter(p => p.stock <= p.minStock).map(p => ({
      id: `row-prod-${p.id}-${Date.now()}`,
      name: p.name,
      type: 'Product' as const,
      quantity: Math.max(1, (p.minStock * 2) - p.stock),
      unit: 'pcs',
      preferredSupplierId: suppliers[0]?.id || '',
      deadline: defaultDeadline,
      specs: `Replenishment for product deficit (SKU: ${p.id}, Current: ${p.stock}, Min: ${p.minStock})`
    }));

    const combined = [...lowStockMaterials, ...lowStockProds];
    if (combined.length === 0) {
      alert('No low stock inventory shortages detected right now! Generating default sample rows.');
      handleLoadSampleBulkRows();
    } else {
      setBulkRows(combined);
      addNotification({
        title: 'Shortage Supply Grid Loaded',
        message: `Imported ${combined.length} deficit items into the bulk RFQ manual entry grid.`,
        type: 'info',
        category: 'inventory'
      });
    }
  };

  const handleGenerateBulkRfqs = (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = bulkRows.filter(r => r.name.trim().length > 0 && r.quantity > 0);

    if (validRows.length === 0) {
      alert('Please enter at least one item with a valid name and quantity (> 0).');
      return;
    }

    const generatedRfqs: RFQ[] = [];
    const nowStamp = Date.now();

    if (bulkImportGrouping === 'bySupplier') {
      const grouped: { [supplierId: string]: typeof validRows } = {};
      validRows.forEach(row => {
        const supKey = row.preferredSupplierId || 'unassigned';
        if (!grouped[supKey]) grouped[supKey] = [];
        grouped[supKey].push(row);
      });

      let counter = 1;
      Object.keys(grouped).forEach(supKey => {
        const itemGroup = grouped[supKey];
        const supplierObj = suppliers.find(s => s.id === supKey);
        const rfqNum = `RFQ-${new Date().getFullYear()}-${String(rfqs.length + counter).padStart(3, '0')}`;
        counter++;

        const newRfq: RFQ = {
          id: `rfq-bulk-${nowStamp}-${counter}`,
          rfqNumber: rfqNum,
          type: itemGroup[0]?.type || 'Material',
          date: new Date().toISOString(),
          deadline: itemGroup[0]?.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          suppliers: supplierObj ? [supplierObj.id] : (suppliers.length > 0 ? [suppliers[0].id] : []),
          status: 'Sent',
          items: itemGroup.map(r => ({
            materialId: r.id,
            name: r.name,
            quantity: r.quantity,
            unit: r.unit || 'pcs',
            specs: r.specs || `Bulk supply solicitation item`
          })),
          notes: `Bulk Import RFQ (${itemGroup.length} supply items) sent to ${supplierObj ? supplierObj.name : 'Selected Suppliers'}`
        };
        generatedRfqs.push(newRfq);
      });
    } else if (bulkImportGrouping === 'individual') {
      validRows.forEach((row, idx) => {
        const rfqNum = `RFQ-${new Date().getFullYear()}-${String(rfqs.length + idx + 1).padStart(3, '0')}`;
        const supplierObj = suppliers.find(s => s.id === row.preferredSupplierId);

        const newRfq: RFQ = {
          id: `rfq-bulk-${nowStamp}-${idx + 1}`,
          rfqNumber: rfqNum,
          type: row.type,
          date: new Date().toISOString(),
          deadline: row.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          suppliers: supplierObj ? [supplierObj.id] : (suppliers.length > 0 ? [suppliers[0].id] : []),
          status: 'Sent',
          items: [{
            materialId: row.id,
            name: row.name,
            quantity: row.quantity,
            unit: row.unit || 'pcs',
            specs: row.specs || `Bulk supply row item`
          }],
          notes: `Individual Bulk Import RFQ for ${row.name}`
        };
        generatedRfqs.push(newRfq);
      });
    } else {
      const rfqNum = `RFQ-${new Date().getFullYear()}-${String(rfqs.length + 1).padStart(3, '0')}`;
      const allSupplierIds = Array.from(new Set(validRows.map(r => r.preferredSupplierId).filter(Boolean))) as string[];

      const newRfq: RFQ = {
        id: `rfq-bulk-${nowStamp}-single`,
        rfqNumber: rfqNum,
        type: validRows[0]?.type || 'Material',
        date: new Date().toISOString(),
        deadline: validRows[0]?.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        suppliers: allSupplierIds.length > 0 ? allSupplierIds : (suppliers.length > 0 ? [suppliers[0].id] : []),
        status: 'Sent',
        items: validRows.map(r => ({
          materialId: r.id,
          name: r.name,
          quantity: r.quantity,
          unit: r.unit || 'pcs',
          specs: r.specs || `Consolidated bulk list item`
        })),
        notes: `Consolidated Master Bulk RFQ containing ${validRows.length} supply items`
      };
      generatedRfqs.push(newRfq);
    }

    onUpdateRfqs([...generatedRfqs, ...rfqs]);
    onAddAuditLog?.('Batch RFQs Created', `Imported ${validRows.length} supply items and issued ${generatedRfqs.length} RFQs simultaneously via Manual Entry Grid`, 'procurement', 'success');
    addNotification({
      title: 'Batch RFQs Created Successfully',
      message: `Generated ${generatedRfqs.length} RFQs containing ${validRows.length} items from the bulk manual entry grid.`,
      type: 'success',
      category: 'procurement'
    });
    setIsBulkImportOpen(false);
    setActiveTab('rfq');
  };
  const [isCreateQuoteOpen, setIsCreateQuoteOpen] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [isCreatePoOpen, setIsCreatePoOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditCreditModalOpen, setIsEditCreditModalOpen] = useState(false);
  const [selectedPoForDetails, setSelectedPoForDetails] = useState<ProcurementOrder | null>(null);
  const [selectedPoForReceive, setSelectedPoForReceive] = useState<ProcurementOrder | null>(null);
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState<Supplier | null>(null);
  const [selectedPoForPayment, setSelectedPoForPayment] = useState<ProcurementOrder | null>(null);
  // Supplier Rating Modal State
  const [isRateSupplierOpen, setIsRateSupplierOpen] = useState(false);
  const [selectedSupplierForRating, setSelectedSupplierForRating] = useState<Supplier | null>(null);
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [ratingAuthor, setRatingAuthor] = useState<string>('Procurement Specialist');
  const [ratingAspects, setRatingAspects] = useState({
    quality: 5,
    deliveryTime: 5,
    communication: 5,
    pricing: 4
  });

  // Lead Time Tracker Filter State
  const [leadTimeSupplierFilter, setLeadTimeSupplierFilter] = useState<string>('all');

  // Real-time Bulk Import Grid Validation
  const bulkGridValidation = useMemo(() => {
    const nameCounts: Record<string, number> = {};
    bulkRows.forEach(r => {
      const key = r.name.trim().toLowerCase();
      if (key) {
        nameCounts[key] = (nameCounts[key] || 0) + 1;
      }
    });

    let duplicateCount = 0;
    let errorCount = 0;
    let validCount = 0;

    const rowStatuses = bulkRows.map(r => {
      const trimmedName = r.name.trim();
      const lowerName = trimmedName.toLowerCase();
      const isEmpty = trimmedName.length === 0;
      const isDuplicate = !isEmpty && (nameCounts[lowerName] > 1);

      const matchedMaterial = materials.find(m => m.name.toLowerCase() === lowerName || m.id.toLowerCase() === lowerName);
      const matchedProduct = (finishedProducts || []).find(p => p.name.toLowerCase() === lowerName || p.id.toLowerCase() === lowerName);
      const systemMatch = matchedMaterial || matchedProduct;

      if (isEmpty) errorCount++;
      else if (isDuplicate) duplicateCount++;
      else validCount++;

      return {
        rowId: r.id,
        isEmpty,
        isDuplicate,
        systemMatch: systemMatch ? { id: systemMatch.id, name: systemMatch.name, type: 'stock' in systemMatch ? 'Material' : 'Product' } : null
      };
    });

    return {
      rowStatuses,
      duplicateCount,
      errorCount,
      validCount,
      totalCount: bulkRows.length,
      hasErrors: errorCount > 0
    };
  }, [bulkRows, materials, finishedProducts]);

  const handleCleanGridDuplicates = () => {
    const seen = new Set<string>();
    const cleaned = bulkRows.filter(r => {
      const key = r.name.trim().toLowerCase();
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const removed = bulkRows.length - cleaned.length;
    setBulkRows(cleaned);
    addNotification({
      title: 'Grid Duplicates Cleaned',
      message: `Removed ${removed} duplicate line item(s) from the bulk entry grid.`,
      type: 'info',
      category: 'procurement'
    });
  };

  // Critical Threshold Auto-Draft RFQ Handlers
  const autoDraftRfqs = useMemo(() => {
    return rfqs.filter(r => r.status === 'Draft' || r.isAutoDraft);
  }, [rfqs]);

  const criticalDeficitItems = useMemo(() => {
    const lowMats = materials.filter(m => m.stock <= m.minStock).map(m => ({
      id: m.id,
      name: m.name,
      type: 'Material' as const,
      stock: m.stock,
      minStock: m.minStock,
      unit: m.unit || 'm',
      preferredSupplier: suppliers.find(s => s.name.toLowerCase() === m.supplier?.toLowerCase()) || suppliers[0]
    }));

    const lowProds = (finishedProducts || []).filter(p => p.stock <= p.minStock).map(p => ({
      id: p.id,
      name: p.name,
      type: 'Product' as const,
      stock: p.stock,
      minStock: p.minStock,
      unit: 'pcs',
      preferredSupplier: suppliers[0]
    }));

    return [...lowMats, ...lowProds];
  }, [materials, finishedProducts, suppliers]);

  const handleGenerateCriticalStockDrafts = () => {
    const nowStamp = Date.now();
    const newDrafts: RFQ[] = [];

    criticalDeficitItems.forEach((item, idx) => {
      const existingActiveRfq = rfqs.find(r => 
        (r.status === 'Draft' || r.status === 'Sent') && 
        r.items.some(it => it.name.toLowerCase() === item.name.toLowerCase() || it.materialId === item.id)
      );

      if (!existingActiveRfq) {
        const replenishQty = Math.max(1, (item.minStock * 2) - item.stock);
        const rfqNum = `DRAFT-RFQ-AUTO-${String(rfqs.length + newDrafts.length + 1).padStart(3, '0')}`;
        
        const autoDraft: RFQ = {
          id: `rfq-auto-draft-${nowStamp}-${idx}`,
          rfqNumber: rfqNum,
          type: item.type,
          date: new Date().toISOString(),
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          suppliers: item.preferredSupplier ? [item.preferredSupplier.id] : (suppliers[0] ? [suppliers[0].id] : []),
          status: 'Draft',
          isAutoDraft: true,
          criticalThresholdItem: item.name,
          items: [{
            materialId: item.id,
            name: item.name,
            quantity: replenishQty,
            unit: item.unit,
            specs: `Critical stock threshold replenishment (Current: ${item.stock} ${item.unit}, Min Target: ${item.minStock} ${item.unit})`
          }],
          notes: `Auto-generated Draft RFQ for Critical Stock Threshold (${item.stock} / ${item.minStock} ${item.unit})`
        };
        newDrafts.push(autoDraft);
      }
    });

    if (newDrafts.length === 0) {
      addNotification({
        title: 'Critical Stock Scan Complete',
        message: 'All inventory deficit items already have active RFQs or pending draft requests.',
        type: 'info',
        category: 'inventory'
      });
      return;
    }

    onUpdateRfqs([...newDrafts, ...rfqs]);
    onAddAuditLog?.('Auto-Draft RFQs Created', `Auto-generated ${newDrafts.length} draft RFQs for items below critical stock threshold`, 'procurement', 'warning');
    addNotification({
      title: 'Auto-Draft RFQs Generated',
      message: `Created ${newDrafts.length} draft RFQs for critical stock items ready for 1-click approval.`,
      type: 'warning',
      category: 'procurement'
    });
  };

  const handleApproveAutoDraftRfq = (rfqId: string) => {
    const rfqToApprove = rfqs.find(r => r.id === rfqId);
    if (!rfqToApprove) return;

    const updated = rfqs.map(r => r.id === rfqId ? { ...r, status: 'Sent' as const, date: new Date().toISOString() } : r);
    onUpdateRfqs(updated);
    
    const itemName = rfqToApprove.items[0]?.name || 'Supply item';
    onAddAuditLog?.('RFQ 1-Click Approved', `Approved and issued draft RFQ ${rfqToApprove.rfqNumber} for ${itemName}`, 'procurement', 'success');
    addNotification({
      title: 'RFQ Approved & Issued',
      message: `1-Click Approval: RFQ ${rfqToApprove.rfqNumber} issued to suppliers.`,
      type: 'success',
      category: 'procurement'
    });
  };

  const handleApproveAllAutoDraftRfqs = () => {
    const draftIds = autoDraftRfqs.map(r => r.id);
    if (draftIds.length === 0) return;

    const updated = rfqs.map(r => draftIds.includes(r.id) ? { ...r, status: 'Sent' as const, date: new Date().toISOString() } : r);
    onUpdateRfqs(updated);

    onAddAuditLog?.('Batch RFQs Approved', `Approved and issued ${draftIds.length} draft RFQs simultaneously via 1-click batch action`, 'procurement', 'success');
    addNotification({
      title: `All ${draftIds.length} Draft RFQs Approved`,
      message: `Batch issued ${draftIds.length} draft RFQs to suppliers.`,
      type: 'success',
      category: 'procurement'
    });
  };

  const handleOpenRateSupplier = (supplier: Supplier) => {
    setSelectedSupplierForRating(supplier);
    setRatingScore(supplier.rating || 5);
    setRatingComment('');
    setRatingAuthor('Procurement Manager');
    setRatingAspects({ quality: 5, deliveryTime: 5, communication: 5, pricing: 4 });
    setIsRateSupplierOpen(true);
  };

  const handleSubmitSupplierRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForRating) return;

    const sup = selectedSupplierForRating;
    const currentCount = sup.ratingCount || 0;
    const currentRating = sup.rating || 5;

    const newRatingVal = Math.round((((currentRating * currentCount) + ratingScore) / (currentCount + 1)) * 10) / 10;
    const newRatingRecord: SupplierRating = {
      id: `sr-${Date.now()}`,
      supplierId: sup.id,
      score: ratingScore,
      date: new Date().toISOString().split('T')[0],
      comment: ratingComment.trim() || undefined,
      author: ratingAuthor.trim() || 'Procurement Specialist',
      aspects: ratingAspects
    };

    const updatedSuppliers = suppliers.map(s => {
      if (s.id === sup.id) {
        const history = s.ratingsHistory || [];
        return {
          ...s,
          rating: newRatingVal,
          ratingCount: currentCount + 1,
          ratingsHistory: [newRatingRecord, ...history]
        };
      }
      return s;
    });

    onUpdateSuppliers(updatedSuppliers);
    onAddAuditLog?.('Supplier Rated', `Assigned ${ratingScore}-star rating to ${sup.name}`, 'procurement', 'success');
    addNotification({
      title: 'Supplier Rated Successfully',
      message: `Assigned a ${ratingScore}-star rating to ${sup.name} (New Avg: ${newRatingVal.toFixed(1)} ⭐).`,
      type: 'success',
      category: 'procurement'
    });
    setIsRateSupplierOpen(false);
  };

  const leadTimeAnalytics = useMemo(() => {
    const supplierMap: Record<string, {
      supplierId: string;
      supplierName: string;
      rating: number;
      totalOrders: number;
      onTimeCount: number;
      totalDays: number;
      avgLeadTimeDays: number;
      history: Array<{ poNumber: string; date: string; days: number; item: string }>;
    }> = {};

    suppliers.forEach(s => {
      supplierMap[s.id] = {
        supplierId: s.id,
        supplierName: s.name,
        rating: s.rating || 4.5,
        totalOrders: 0,
        onTimeCount: 0,
        totalDays: 0,
        avgLeadTimeDays: 0,
        history: []
      };
    });

    procurementOrders.forEach(po => {
      const rfq = rfqs.find(r => r.id === po.rfqId || r.rfqNumber === po.poNumber.replace('PO', 'RFQ'));
      const startDateStr = rfq?.date || po.date;
      const endDateStr = po.deliveryDate || po.date;
      
      const startMs = new Date(startDateStr).getTime();
      const endMs = new Date(endDateStr).getTime();
      let diffDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));
      if (isNaN(diffDays) || diffDays > 30) diffDays = 4;

      const supId = po.supplierId || suppliers.find(s => s.name === po.supplierName)?.id || suppliers[0]?.id || 's1';
      
      if (!supplierMap[supId]) {
        supplierMap[supId] = {
          supplierId: supId,
          supplierName: po.supplierName,
          rating: 4.5,
          totalOrders: 0,
          onTimeCount: 0,
          totalDays: 0,
          avgLeadTimeDays: 0,
          history: []
        };
      }

      supplierMap[supId].totalOrders += 1;
      supplierMap[supId].totalDays += diffDays;
      if (diffDays <= 7) supplierMap[supId].onTimeCount += 1;

      supplierMap[supId].history.push({
        poNumber: po.poNumber,
        date: new Date(po.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        days: diffDays,
        item: po.items[0]?.name || 'Procurement Delivery'
      });
    });

    Object.values(supplierMap).forEach((sData, index) => {
      if (sData.history.length === 0) {
        const mockBase = index === 0 ? 4 : index === 1 ? 3 : 2.5;
        sData.totalOrders = 4;
        sData.onTimeCount = 4;
        sData.avgLeadTimeDays = mockBase;
        sData.history = [
          { poNumber: `PO-2026-0${index + 1}1`, date: 'May 05', days: mockBase + 1, item: 'Batch Order #1' },
          { poNumber: `PO-2026-0${index + 1}2`, date: 'Jun 12', days: mockBase, item: 'Batch Order #2' },
          { poNumber: `PO-2026-0${index + 1}3`, date: 'Jul 01', days: Math.max(1, mockBase - 0.5), item: 'Batch Order #3' },
          { poNumber: `PO-2026-0${index + 1}4`, date: 'Jul 20', days: mockBase + 0.5, item: 'Batch Order #4' }
        ];
      } else {
        sData.avgLeadTimeDays = Math.round((sData.totalDays / sData.totalOrders) * 10) / 10;
      }
    });

    let overallDaysSum = 0;
    let overallOrdersCount = 0;
    let fastestVendor = suppliers[0]?.name || 'N/A';
    let minLeadTime = 999;

    Object.values(supplierMap).forEach(s => {
      overallDaysSum += (s.avgLeadTimeDays * s.totalOrders);
      overallOrdersCount += s.totalOrders;
      if (s.avgLeadTimeDays < minLeadTime) {
        minLeadTime = s.avgLeadTimeDays;
        fastestVendor = `${s.supplierName} (${s.avgLeadTimeDays} days)`;
      }
    });

    const overallAvgLeadTime = overallOrdersCount > 0 ? (Math.round((overallDaysSum / overallOrdersCount) * 10) / 10) : 3.5;

    const trendMap: Record<string, any> = {};
    const periods = ['May 05', 'Jun 12', 'Jul 01', 'Jul 20', 'Current'];

    periods.forEach((period, pIdx) => {
      trendMap[period] = { period };
      Object.values(supplierMap).forEach(s => {
        const itemHistory = s.history[pIdx] || s.history[s.history.length - 1];
        trendMap[period][s.supplierName] = itemHistory ? itemHistory.days : s.avgLeadTimeDays;
      });
    });

    const lineChartTrendData = Object.values(trendMap);

    return {
      supplierMap,
      overallAvgLeadTime,
      fastestVendor,
      lineChartTrendData,
      suppliersList: Object.values(supplierMap)
    };
  }, [procurementOrders, rfqs, suppliers]);

  const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState<Supplier | null>(null);

  // Outsourced Service Modals & Forms State
  const [isCreateServiceModalOpen, setIsCreateServiceModalOpen] = useState(false);
  const [editingServicePo, setEditingServicePo] = useState<ProcurementOrder | null>(null);
  const [selectedServicePoForDetails, setSelectedServicePoForDetails] = useState<ProcurementOrder | null>(null);
  const [deletingServicePoId, setDeletingServicePoId] = useState<string | null>(null);
  const [quoteRejectModalQuote, setQuoteRejectModalQuote] = useState<SupplierQuotation | null>(null);
  const [quoteRejectReason, setQuoteRejectReason] = useState<string>('');

  const [serviceContractForm, setServiceContractForm] = useState({
    supplierId: '',
    customSupplierName: '',
    contractType: 'Freelance/Specialist Contract' as 'Client Service Agreement' | 'Freelance/Specialist Contract' | 'Strategic Partnership' | 'Custom Manufacturing' | 'Logistics & Fulfillment' | 'Specialized Service',
    serviceCategory: 'Specialist Freelance Crew & Greenspeople',
    serviceTitle: 'Custom Floral & Artificial Tree Fabrication',
    scopeOfWork: 'Complete custom fabrication and assembly of 4.5m artificial ficus trees with flame-retardant coating and metal support structures.',
    locationOrSite: 'Grand Atrium, Hilton Colombo',
    orderId: '',
    totalAmount: 250000,
    turnaroundDays: 7,
    startDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentTerms: '50% Deposit / 50% On Handover',
    notes: 'Include all safety equipment, rigging hardware, and site cleanup upon completion.'
  });

  // Print views state
  const [printingRfq, setPrintingRfq] = useState<RFQ | null>(null);
  const [printingPo, setPrintingPo] = useState<ProcurementOrder | null>(null);
  const [isManagementReportOpen, setIsManagementReportOpen] = useState(false);

  // Form States
  const [newRfqData, setNewRfqData] = useState({
    type: 'Material' as 'Material' | 'Service' | 'Support',
    orderId: '',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    selectedSuppliers: [] as string[],
    notes: '',
    items: [
      { materialId: '', name: '', quantity: 10, unit: 'pcs', specs: '' }
    ]
  });

  const [newQuoteData, setNewQuoteData] = useState({
    rfqId: '',
    supplierId: '',
    orderId: '',
    type: 'Material' as 'Material' | 'Service' | 'Support',
    quotationNumber: '',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    discount: 0,
    taxRate: 0,
    freight: 0,
    otherCharges: 0,
    notes: '',
    items: [
      { materialId: '', name: '', quantity: 1, unitPrice: 0, unit: 'pcs', isAvailable: true, leadTime: '3-5 days' }
    ]
  });

  const [newPoData, setNewPoData] = useState({
    supplierId: '',
    type: 'Material' as 'Material' | 'Service' | 'Support',
    orderId: '',
    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentTerms: 'Net 30',
    discount: 0,
    taxRate: companySettings.defaultTaxRate || 0,
    freight: 0,
    otherCharges: 0,
    notes: '',
    serviceDetails: {
      serviceType: 'Sewing / Stitching',
      garmentType: 'General Apparels',
      complexity: 'Standard',
      turnaroundDays: 7,
      stitchCount: 0
    },
    items: [
      { materialId: '', name: '', quantity: 10, unitPrice: 0, unit: 'pcs' }
    ]
  });

  const [paymentData, setPaymentData] = useState({
    supplierId: '',
    poId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    referenceNumber: '',
    notes: ''
  });

  const [editSupplierData, setEditSupplierData] = useState({
    creditLimit: 0,
    paymentTerms: 'Net 30',
    taxId: ''
  });

  const [itemReceiptQty, setItemReceiptQty] = useState<{ [key: string]: number }>({});
  const [autoCreateDeficitRfq, setAutoCreateDeficitRfq] = useState<boolean>(true);
  const [selectedDeficitSuppliers, setSelectedDeficitSuppliers] = useState<string[]>([]);
  const [deficitRfqNotes, setDeficitRfqNotes] = useState<string>('');

  // Summary KPI statistics
  const stats = useMemo(() => {
    const totalPayable = suppliers.reduce((sum, s) => sum + (s.currentBalance || 0), 0);
    const totalSpend = procurementOrders.reduce((sum, p) => sum + (p.status !== 'Cancelled' ? p.total : 0), 0);
    const completedPos = procurementOrders.filter(p => p.status === 'Received').length;
    const totalPos = procurementOrders.filter(p => p.status !== 'Cancelled').length;
    const fulfillmentRate = totalPos > 0 ? Math.round((completedPos / totalPos) * 100) : 100;

    return {
      activeRfqs: rfqs.filter(r => r.status === 'Sent' || r.status === 'Draft').length,
      pendingQuotes: quotations.filter(q => q.status === 'Pending').length,
      activePOs: procurementOrders.filter(p => p.status === 'Sent' || p.status === 'Partial').length,
      totalPayable,
      totalSpend,
      fulfillmentRate
    };
  }, [rfqs, quotations, procurementOrders, suppliers]);

  // Compute partial shipment deficit list for dashboard highlighting & one-click RFQs
  const deficitPOs = useMemo(() => {
    return procurementOrders.map(po => {
      const deficitItems = po.items.map(item => {
        const ordered = item.quantity || 0;
        const received = item.receivedQuantity !== undefined ? item.receivedQuantity : (po.status === 'Received' ? ordered : (po.status === 'Partial' ? Math.floor(ordered * 0.5) : 0));
        const deficitQty = Math.max(0, ordered - received);
        const unitPrice = item.unitPrice || 0;
        return {
          materialId: item.materialId,
          name: item.name,
          orderedQty: ordered,
          receivedQty: received,
          deficitQty,
          unit: item.unit || 'pcs',
          unitPrice,
          deficitVal: deficitQty * unitPrice
        };
      }).filter(i => i.deficitQty > 0);

      const totalDeficitQty = deficitItems.reduce((s, i) => s + i.deficitQty, 0);
      const totalDeficitVal = deficitItems.reduce((s, i) => s + i.deficitVal, 0);
      const existingDeficitRfq = rfqs.find(r => r.parentPoId === po.id || r.parentPoNumber === po.poNumber || (po.deficitRfqNumber && r.rfqNumber === po.deficitRfqNumber));

      return {
        po,
        deficitItems,
        totalDeficitQty,
        totalDeficitVal,
        hasDeficitRfq: !!existingDeficitRfq || !!po.deficitRfqNumber,
        deficitRfqNumber: existingDeficitRfq?.rfqNumber || po.deficitRfqNumber
      };
    }).filter(d => (d.po.status === 'Partial' || d.totalDeficitQty > 0) && d.po.status !== 'Received' && d.po.status !== 'Cancelled');
  }, [procurementOrders, rfqs]);

  // One-Click RFQ to replenish specific partial shipment shortages
  const handleOneClickDeficitRfq = (po: ProcurementOrder, deficitItems?: Array<{ materialId?: string; name: string; orderedQty: number; receivedQty: number; deficitQty: number; unit: string; unitPrice: number; deficitVal: number }>) => {
    const itemsToReplenish = deficitItems || po.items.map(item => {
      const ordered = item.quantity || 0;
      const received = item.receivedQuantity !== undefined ? item.receivedQuantity : (po.status === 'Received' ? ordered : (po.status === 'Partial' ? Math.floor(ordered * 0.5) : 0));
      const deficitQty = Math.max(0, ordered - received);
      return {
        materialId: item.materialId,
        name: item.name,
        orderedQty: ordered,
        receivedQty: received,
        deficitQty,
        unit: item.unit || 'pcs',
        unitPrice: item.unitPrice || 0,
        deficitVal: deficitQty * (item.unitPrice || 0)
      };
    }).filter(i => i.deficitQty > 0);

    if (itemsToReplenish.length === 0) {
      addNotification({
        title: 'No Shortage Detected',
        message: `PO ${po.poNumber} has no outstanding deficit items.`,
        type: 'info',
        category: 'inventory'
      });
      return;
    }

    const deficitRfqNumber = `RFQ-DEF-${po.poNumber.replace(/^PO-/, '')}-${Date.now().toString().slice(-3)}`;
    const deficitRfq: RFQ = {
      id: `rfq-def-${Date.now()}`,
      rfqNumber: deficitRfqNumber,
      date: new Date().toISOString(),
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      suppliers: suppliers.map(s => s.id),
      orderId: po.orderId,
      orderNumber: po.orderNumber,
      type: po.type,
      isDeficitRfq: true,
      parentPoId: po.id,
      parentPoNumber: po.poNumber,
      items: itemsToReplenish.map(it => ({
        materialId: it.materialId,
        name: it.name,
        quantity: it.deficitQty,
        unit: it.unit,
        specs: `Urgent shortage replenishment for PO ${po.poNumber} (${po.supplierName})`
      })),
      status: 'Sent',
      notes: `⚡ One-Click Replenishment RFQ issued for partial delivery shortfall on PO ${po.poNumber} (${po.supplierName}).`
    };

    onUpdateRfqs([deficitRfq, ...rfqs]);

    const updatedPos = procurementOrders.map(p => p.id === po.id ? {
      ...p,
      status: 'Partial' as const,
      deficitRfqId: deficitRfq.id,
      deficitRfqNumber: deficitRfq.rfqNumber
    } : p);
    onUpdateProcurementOrders(updatedPos);

    onAddAuditLog?.('⚡ One-Click Deficit RFQ Issued', `Generated replenishment RFQ ${deficitRfq.rfqNumber} for PO ${po.poNumber} (${itemsToReplenish.reduce((s, i) => s + i.deficitQty, 0)} units deficit)`, 'inventory', 'warning');

    addNotification({
      title: '⚡ Deficit Replenishment RFQ Issued!',
      message: `RFQ ${deficitRfq.rfqNumber} generated for ${itemsToReplenish.length} missing items on PO ${po.poNumber}.`,
      type: 'success',
      category: 'inventory'
    });

    setActiveTab('rfq');
    setSearchQuery(deficitRfq.rfqNumber);
  };

  // Batch One-Click RFQ to replenish ALL active partial shipment shortages at once
  const handleBatchOneClickDeficitRfq = () => {
    const eligibleDeficits = deficitPOs.filter(d => !d.hasDeficitRfq && d.deficitItems.length > 0);
    if (eligibleDeficits.length === 0) {
      addNotification({
        title: 'No Unhandled Shortages',
        message: 'All partial shipments already have active replenishment RFQs issued.',
        type: 'info',
        category: 'inventory'
      });
      return;
    }

    let count = 0;
    const newRfqsList: RFQ[] = [...rfqs];
    const updatedPosList: ProcurementOrder[] = [...procurementOrders];

    eligibleDeficits.forEach((def, index) => {
      const po = def.po;
      const deficitRfqNumber = `RFQ-DEF-${po.poNumber.replace(/^PO-/, '')}-${Date.now().toString().slice(-3)}-${index + 1}`;
      const deficitRfq: RFQ = {
        id: `rfq-def-${Date.now()}-${index}`,
        rfqNumber: deficitRfqNumber,
        date: new Date().toISOString(),
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        suppliers: suppliers.map(s => s.id),
        orderId: po.orderId,
        orderNumber: po.orderNumber,
        type: po.type,
        isDeficitRfq: true,
        parentPoId: po.id,
        parentPoNumber: po.poNumber,
        items: def.deficitItems.map(it => ({
          materialId: it.materialId,
          name: it.name,
          quantity: it.deficitQty,
          unit: it.unit,
          specs: `Urgent shortage replenishment for PO ${po.poNumber} (${po.supplierName})`
        })),
        status: 'Sent',
        notes: `⚡ Batch One-Click Replenishment RFQ for partial shipment deficit on PO ${po.poNumber} (${po.supplierName}).`
      };

      newRfqsList.unshift(deficitRfq);
      const poIdx = updatedPosList.findIndex(p => p.id === po.id);
      if (poIdx >= 0) {
        updatedPosList[poIdx] = {
          ...updatedPosList[poIdx],
          status: 'Partial' as const,
          deficitRfqId: deficitRfq.id,
          deficitRfqNumber: deficitRfq.rfqNumber
        };
      }
      count++;
    });

    onUpdateRfqs(newRfqsList);
    onUpdateProcurementOrders(updatedPosList);

    onAddAuditLog?.('⚡ Batch One-Click Deficit RFQs Issued', `Generated ${count} replenishment RFQs for all active partial shipments`, 'inventory', 'warning');

    addNotification({
      title: `⚡ ${count} Replenishment RFQs Issued!`,
      message: `Successfully issued ${count} deficit RFQs for all unhandled partial shipment shortages.`,
      type: 'success',
      category: 'inventory'
    });

    setActiveTab('rfq');
  };

  // Handle RFQ creation
  const handleCreateRfq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRfqData.items || newRfqData.items.length === 0 || !newRfqData.items[0].name) {
      alert('Please add at least one item to the RFQ.');
      return;
    }

    const linkedOrder = orders.find(o => o.id === newRfqData.orderId);

    const rfqObj: RFQ = {
      id: `rfq-${Date.now()}`,
      rfqNumber: `RFQ-${new Date().getFullYear()}-${String(rfqs.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString(),
      deadline: newRfqData.deadline,
      suppliers: newRfqData.selectedSuppliers,
      orderId: newRfqData.orderId || undefined,
      orderNumber: linkedOrder?.orderNumber,
      type: newRfqData.type,
      items: newRfqData.items.map(item => ({
        materialId: item.materialId || undefined,
        name: item.name,
        quantity: Number(item.quantity) || 1,
        unit: item.unit || 'pcs',
        specs: item.specs
      })),
      status: 'Sent',
      notes: newRfqData.notes
    };

    onUpdateRfqs([rfqObj, ...rfqs]);
    setIsCreateRfqOpen(false);
    
    // Reset form
    setNewRfqData({
      type: 'Material',
      orderId: '',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      selectedSuppliers: [],
      notes: '',
      items: [{ materialId: '', name: '', quantity: 10, unit: 'pcs', specs: '' }]
    });

    onAddAuditLog?.('RFQ Created', `Issued ${rfqObj.rfqNumber} to ${rfqObj.suppliers.length || 'all'} suppliers`, 'inventory', 'info');

    addNotification({
      title: 'RFQ Created',
      message: `${rfqObj.rfqNumber} has been issued successfully.`,
      type: 'success',
      category: 'inventory'
    });
  };

  // Open Quote Entry modal pre-filled from RFQ
  const handleOpenQuoteForRfq = (rfq: RFQ) => {
    setEditingQuoteId(null);
    setNewQuoteData({
      rfqId: rfq.id,
      supplierId: rfq.suppliers[0] || (suppliers[0]?.id || ''),
      orderId: rfq.orderId || '',
      type: rfq.type || 'Material',
      quotationNumber: `SQ-${Date.now().toString().slice(-5)}`,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      discount: 0,
      taxRate: companySettings.defaultTaxRate || 0,
      freight: 0,
      otherCharges: 0,
      notes: rfq.notes || '',
      items: rfq.items.map(item => ({
        materialId: item.materialId || '',
        name: item.name,
        quantity: item.quantity,
        unitPrice: 0,
        unit: item.unit,
        isAvailable: true,
        leadTime: '3-5 days'
      }))
    });
    setIsCreateQuoteOpen(true);
  };

  // Open Edit Quote modal
  const handleOpenEditQuote = (quote: SupplierQuotation) => {
    if (quote.status === 'Accepted') {
      addNotification({
        title: 'Approved Quotation Locked',
        message: 'This quotation is already approved and issued as a PO. Revert it to quotation status first to make changes.',
        type: 'warning',
        category: 'inventory'
      });
      return;
    }

    setEditingQuoteId(quote.id);
    setNewQuoteData({
      rfqId: quote.rfqId || '',
      supplierId: quote.supplierId,
      orderId: quote.orderId || '',
      type: quote.type || 'Material',
      quotationNumber: quote.quotationNumber || quote.id,
      validUntil: quote.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      discount: quote.discount || 0,
      taxRate: quote.taxRate ?? companySettings.defaultTaxRate ?? 0,
      freight: quote.freight || 0,
      otherCharges: quote.otherCharges || 0,
      notes: quote.notes || '',
      items: quote.items.map(it => ({
        materialId: it.materialId || '',
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        unit: it.unit || 'pcs',
        isAvailable: it.isAvailable ?? true,
        leadTime: it.leadTime || '3-5 days'
      }))
    });
    setIsCreateQuoteOpen(true);
  };

  // Save Supplier Quotation (Create or Update)
  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuoteData.supplierId) {
      alert('Please select a supplier.');
      return;
    }

    const supplier = suppliers.find(s => s.id === newQuoteData.supplierId);
    const linkedOrder = orders.find(o => o.id === newQuoteData.orderId);

    const processedItems = newQuoteData.items.map(it => {
      const qty = Number(it.quantity) || 1;
      const price = Number(it.unitPrice) || 0;
      return {
        materialId: it.materialId || undefined,
        name: it.name,
        quantity: qty,
        unitPrice: price,
        unit: it.unit || 'pcs',
        total: qty * price,
        isAvailable: it.isAvailable,
        leadTime: it.leadTime
      };
    });

    const subtotal = processedItems.reduce((sum, item) => sum + item.total, 0);
    const discount = Number(newQuoteData.discount) || 0;
    const freight = Number(newQuoteData.freight) || 0;
    const otherCharges = Number(newQuoteData.otherCharges) || 0;
    const tax = Math.round((subtotal - discount) * ((newQuoteData.taxRate || 0) / 100));
    const total = Math.max(0, subtotal - discount + tax + freight + otherCharges);

    if (editingQuoteId) {
      // Editing existing quote
      const existingQuote = quotations.find(q => q.id === editingQuoteId);
      const updatedQuote: SupplierQuotation = {
        id: editingQuoteId,
        rfqId: newQuoteData.rfqId || existingQuote?.rfqId,
        rfqNumber: rfqs.find(r => r.id === newQuoteData.rfqId)?.rfqNumber || existingQuote?.rfqNumber,
        orderId: newQuoteData.orderId || existingQuote?.orderId,
        orderNumber: linkedOrder?.orderNumber || existingQuote?.orderNumber,
        supplierId: newQuoteData.supplierId,
        supplierName: supplier?.name || existingQuote?.supplierName || 'Supplier',
        type: newQuoteData.type,
        quotationNumber: newQuoteData.quotationNumber || existingQuote?.quotationNumber || editingQuoteId,
        date: existingQuote?.date || new Date().toISOString(),
        validUntil: newQuoteData.validUntil,
        items: processedItems,
        subtotal,
        discount,
        tax,
        taxRate: newQuoteData.taxRate,
        freight,
        otherCharges,
        total,
        status: existingQuote?.status || 'Pending',
        notes: newQuoteData.notes
      };

      onUpdateQuotations(quotations.map(q => q.id === editingQuoteId ? updatedQuote : q));
      setIsCreateQuoteOpen(false);
      setEditingQuoteId(null);

      onAddAuditLog?.('Quotation Updated', `Quotation ${updatedQuote.quotationNumber} updated`, 'inventory', 'info');

      addNotification({
        title: 'Quotation Updated',
        message: `Quotation ${updatedQuote.quotationNumber} updated successfully.`,
        type: 'success',
        category: 'inventory'
      });
    } else {
      // Creating new quote
      const quoteObj: SupplierQuotation = {
        id: `sq-${Date.now()}`,
        rfqId: newQuoteData.rfqId || undefined,
        rfqNumber: rfqs.find(r => r.id === newQuoteData.rfqId)?.rfqNumber,
        orderId: newQuoteData.orderId || undefined,
        orderNumber: linkedOrder?.orderNumber,
        supplierId: newQuoteData.supplierId,
        supplierName: supplier?.name || 'Supplier',
        type: newQuoteData.type,
        quotationNumber: newQuoteData.quotationNumber || `SQ-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString(),
        validUntil: newQuoteData.validUntil,
        items: processedItems,
        subtotal,
        discount,
        tax,
        taxRate: newQuoteData.taxRate,
        freight,
        otherCharges,
        total,
        status: 'Pending',
        notes: newQuoteData.notes
      };

      onUpdateQuotations([quoteObj, ...quotations]);

      if (newQuoteData.rfqId) {
        onUpdateRfqs(rfqs.map(r => r.id === newQuoteData.rfqId ? { ...r, status: 'Completed' } : r));
      }

      setIsCreateQuoteOpen(false);
      onAddAuditLog?.('Quotation Entered', `Quotation ${quoteObj.quotationNumber} entered from ${quoteObj.supplierName}`, 'inventory', 'info');

      addNotification({
        title: 'Supplier Quotation Recorded',
        message: `Quotation from ${supplier?.name} recorded successfully.`,
        type: 'success',
        category: 'inventory'
      });
    }
  };

  // Approve Supplier Quotation -> Generate PO automatically
  const handleApproveQuote = (quote: SupplierQuotation) => {
    const updatedQuotes = quotations.map(q => q.id === quote.id ? { ...q, status: 'Accepted' as const } : q);
    onUpdateQuotations(updatedQuotes);

    const poObj: ProcurementOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-${new Date().getFullYear()}-${String(procurementOrders.length + 1).padStart(3, '0')}`,
      rfqId: quote.rfqId,
      quotationId: quote.id,
      orderId: quote.orderId,
      orderNumber: quote.orderNumber,
      date: new Date().toISOString(),
      supplierId: quote.supplierId,
      supplierName: quote.supplierName,
      type: quote.type || 'Material',
      items: quote.items.map(it => ({
        materialId: it.materialId,
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        unit: it.unit,
        total: it.total
      })),
      subtotal: quote.subtotal,
      discount: quote.discount,
      tax: quote.tax,
      freight: quote.freight,
      otherCharges: quote.otherCharges,
      total: quote.total,
      paidAmount: 0,
      status: 'Sent',
      paymentStatus: 'Unpaid',
      deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: quote.notes
    };

    onUpdateProcurementOrders([poObj, ...procurementOrders]);

    // Record Supplier Invoice / Bill in Invoice Portal
    if (onUpdateInvoices) {
      const invNumber = `BILL-${poObj.poNumber}`;
      const newInv: Invoice = {
        id: `inv-po-${poObj.id}`,
        invoiceNumber: invNumber,
        poId: poObj.id,
        poNumber: poObj.poNumber,
        isSupplierInvoice: true,
        type: 'Supplier',
        clientId: poObj.supplierId,
        clientName: poObj.supplierName,
        date: poObj.date,
        dueDate: poObj.deliveryDate || poObj.date,
        items: poObj.items.map(item => ({
          id: item.materialId || `mat-${Math.random()}`,
          name: item.name,
          price: item.unitPrice,
          costPrice: item.unitPrice,
          quantity: item.quantity,
          category: 'Procurement',
          stock: 9999,
          minStock: 0,
          description: `Procurement item for ${poObj.poNumber}`
        })),
        subtotal: poObj.subtotal,
        tax: poObj.tax,
        taxRate: 0,
        discount: poObj.discount,
        discountRate: 0,
        freight: poObj.freight,
        otherCharges: poObj.otherCharges,
        total: poObj.total,
        amountPaid: 0,
        balance: poObj.total,
        status: 'Approved',
        terms: poObj.terms || [],
        notes: `Supplier Procurement Bill for ${poObj.poNumber}`
      };
      onUpdateInvoices([newInv, ...invoices]);
    }

    // Update supplier balance
    onUpdateSuppliers(suppliers.map(s => s.id === quote.supplierId ? {
      ...s,
      currentBalance: (s.currentBalance || 0) + poObj.total
    } : s));

    onAddAuditLog?.('PO Generated', `Approved SQ ${quote.quotationNumber || quote.id} & generated ${poObj.poNumber} (${formatCurrency(poObj.total)})`, 'inventory', 'success');

    addNotification({
      title: 'Quotation Approved & PO Issued',
      message: `Quotation ${quote.quotationNumber || quote.id} approved! Procurement Order ${poObj.poNumber} issued to ${quote.supplierName}.`,
      type: 'success',
      category: 'inventory'
    });
  };

  // Reject Supplier Quotation
  const handleRejectQuote = (quote: SupplierQuotation) => {
    const updatedQuotes = quotations.map(q => q.id === quote.id ? { ...q, status: 'Rejected' as const } : q);
    onUpdateQuotations(updatedQuotes);

    onAddAuditLog?.('Quotation Rejected', `Quotation ${quote.quotationNumber || quote.id} marked as Rejected`, 'inventory', 'warning');

    addNotification({
      title: 'Quotation Rejected',
      message: `Quotation ${quote.quotationNumber || quote.id} has been rejected.`,
      type: 'info',
      category: 'inventory'
    });
  };

  // Revert Approved or Rejected Quotation back to Pending
  const handleRevertQuote = (quote: SupplierQuotation) => {
    const updatedQuotes = quotations.map(q => q.id === quote.id ? { ...q, status: 'Pending' as const } : q);
    onUpdateQuotations(updatedQuotes);

    // If there was a PO generated from this quote, cancel/remove it and adjust supplier balance
    const associatedPo = procurementOrders.find(p => p.quotationId === quote.id || (quote.quotationNumber && p.notes?.includes(quote.quotationNumber)));
    if (associatedPo) {
      onUpdateSuppliers(suppliers.map(s => s.id === quote.supplierId ? {
        ...s,
        currentBalance: Math.max(0, (s.currentBalance || 0) - associatedPo.total)
      } : s));

      onUpdateProcurementOrders(procurementOrders.filter(p => p.id !== associatedPo.id));
    }

    onAddAuditLog?.('Quotation Reverted', `Quotation ${quote.quotationNumber || quote.id} reverted to Pending`, 'inventory', 'info');

    addNotification({
      title: 'Quotation Reverted to Pending',
      message: `Quotation ${quote.quotationNumber || quote.id} reverted to Pending status. You can now edit and save changes.`,
      type: 'info',
      category: 'inventory'
    });
  };

  // Delete Supplier Quotation
  const handleDeleteQuote = (quoteId: string) => {
    onUpdateQuotations(quotations.filter(q => q.id !== quoteId));
    addNotification({
      title: 'Quotation Deleted',
      message: 'Quotation removed successfully.',
      type: 'info',
      category: 'inventory'
    });
  };

  // Handle Direct PO Creation
  const handleCreateDirectPo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoData.supplierId) {
      alert('Please select a supplier.');
      return;
    }
    if (!newPoData.items || newPoData.items.length === 0 || !newPoData.items[0].name) {
      alert('Please add at least one line item.');
      return;
    }

    const supplier = suppliers.find(s => s.id === newPoData.supplierId);
    const linkedOrder = orders.find(o => o.id === newPoData.orderId);

    const processedItems = newPoData.items.map(it => {
      const qty = Number(it.quantity) || 1;
      const price = Number(it.unitPrice) || 0;
      return {
        materialId: it.materialId || undefined,
        name: it.name,
        quantity: qty,
        unitPrice: price,
        unit: it.unit || 'pcs',
        total: qty * price
      };
    });

    const subtotal = processedItems.reduce((sum, item) => sum + item.total, 0);
    const discount = Number(newPoData.discount) || 0;
    const freight = Number(newPoData.freight) || 0;
    const otherCharges = Number(newPoData.otherCharges) || 0;
    const tax = Math.round((subtotal - discount) * ((newPoData.taxRate || 0) / 100));
    const total = Math.max(0, subtotal - discount + tax + freight + otherCharges);

    const poObj: ProcurementOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-${new Date().getFullYear()}-${String(procurementOrders.length + 1).padStart(3, '0')}`,
      orderId: newPoData.orderId || undefined,
      orderNumber: linkedOrder?.orderNumber,
      date: new Date().toISOString(),
      supplierId: newPoData.supplierId,
      supplierName: supplier?.name || 'Supplier',
      type: newPoData.type,
      items: processedItems,
      subtotal,
      discount,
      tax,
      freight,
      otherCharges,
      total,
      paidAmount: 0,
      status: 'Sent',
      paymentStatus: 'Unpaid',
      deliveryDate: newPoData.deliveryDate,
      notes: newPoData.notes,
      serviceDetails: newPoData.type === 'Service' ? {
        serviceType: newPoData.serviceDetails.serviceType,
        garmentType: newPoData.serviceDetails.garmentType,
        complexity: newPoData.serviceDetails.complexity,
        turnaroundDays: Number(newPoData.serviceDetails.turnaroundDays) || 7,
        stitchCount: Number(newPoData.serviceDetails.stitchCount) || 0,
        serviceStatus: 'Contracted'
      } : undefined
    };

    onUpdateProcurementOrders([poObj, ...procurementOrders]);

    // Update supplier current balance
    onUpdateSuppliers(suppliers.map(s => s.id === newPoData.supplierId ? {
      ...s,
      currentBalance: (s.currentBalance || 0) + total
    } : s));

    setIsCreatePoOpen(false);

    onAddAuditLog?.('Direct PO Created', `Created PO ${poObj.poNumber} for ${poObj.supplierName} (${formatCurrency(total)})`, 'inventory', 'success');

    addNotification({
      title: 'Purchase Order Created',
      message: `PO ${poObj.poNumber} issued to ${supplier?.name}.`,
      type: 'success',
      category: 'inventory'
    });
  };

  // Open Receive Items Modal
  const handleOpenReceiveModal = (po: ProcurementOrder) => {
    setSelectedPoForReceive(po);
    const initialQty: { [key: string]: number } = {};
    po.items.forEach((item, index) => {
      const prevReceived = item.receivedQuantity || 0;
      const remainingExpected = Math.max(0, item.quantity - prevReceived);
      initialQty[index] = remainingExpected;
    });
    setItemReceiptQty(initialQty);
    setAutoCreateDeficitRfq(true);
    setSelectedDeficitSuppliers(po.supplierId ? [po.supplierId] : suppliers.map(s => s.id));
    setDeficitRfqNotes(`Urgent replenishment RFQ for delivery shortfall on PO ${po.poNumber}`);
  };

  // Create Deficit RFQ for an existing Partial PO
  const handleCreateDeficitRfqForExistingPo = (po: ProcurementOrder) => {
    const deficitItemsList = po.items.map(item => {
      const prevReceived = item.receivedQuantity || 0;
      const deficit = Math.max(0, item.quantity - prevReceived);
      return {
        materialId: item.materialId,
        name: item.name,
        quantity: deficit > 0 ? deficit : item.quantity,
        unit: item.unit || 'pcs',
        specs: `Deficit replacement for PO ${po.poNumber} (${po.supplierName})`
      };
    }).filter(i => i.quantity > 0);

    if (deficitItemsList.length === 0) {
      alert('This Purchase Order has no item deficit.');
      return;
    }

    const deficitRfqNumber = `RFQ-DEF-${po.poNumber.replace(/^PO-/, '')}-${Date.now().toString().slice(-3)}`;
    const deficitRfq: RFQ = {
      id: `rfq-def-${Date.now()}`,
      rfqNumber: deficitRfqNumber,
      date: new Date().toISOString(),
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      suppliers: suppliers.map(s => s.id),
      orderId: po.orderId,
      orderNumber: po.orderNumber,
      type: po.type,
      isDeficitRfq: true,
      parentPoId: po.id,
      parentPoNumber: po.poNumber,
      items: deficitItemsList,
      status: 'Sent',
      notes: `Urgent Deficit Replacement RFQ issued due to delivery shortfall on PO ${po.poNumber} from ${po.supplierName}.`
    };

    onUpdateRfqs([deficitRfq, ...rfqs]);

    onUpdateProcurementOrders(procurementOrders.map(p => p.id === po.id ? {
      ...p,
      status: 'Partial' as const,
      deficitRfqId: deficitRfq.id,
      deficitRfqNumber: deficitRfq.rfqNumber
    } : p));

    onAddAuditLog?.('Deficit RFQ Created', `Issued Deficit RFQ ${deficitRfq.rfqNumber} for PO ${po.poNumber}`, 'inventory', 'warning');

    addNotification({
      title: 'Deficit RFQ Created',
      message: `Deficit RFQ ${deficitRfq.rfqNumber} issued to suppliers for PO ${po.poNumber}.`,
      type: 'warning',
      category: 'inventory'
    });
  };

  // Confirm Receipt of Goods & Auto-Update Material Stock & Handle Deficit RFQ
  const handleConfirmReceiveGoods = () => {
    if (!selectedPoForReceive) return;

    const po = selectedPoForReceive;
    let totalItemsReceivedThisBatch = 0;
    const deficitItemsList: Array<{ materialId?: string; name: string; quantity: number; unit: string }> = [];

    // 1. Process received quantities and identify deficits
    const updatedPoItems = po.items.map((item, index) => {
      const ordered = item.quantity;
      const prevReceived = item.receivedQuantity || 0;
      const qtyReceiving = itemReceiptQty[index] !== undefined ? Math.max(0, Number(itemReceiptQty[index])) : Math.max(0, ordered - prevReceived);

      const cumulativeReceived = prevReceived + qtyReceiving;
      const itemDeficit = Math.max(0, ordered - cumulativeReceived);

      if (qtyReceiving > 0) {
        totalItemsReceivedThisBatch += qtyReceiving;
      }

      if (itemDeficit > 0) {
        deficitItemsList.push({
          materialId: item.materialId,
          name: item.name,
          quantity: itemDeficit,
          unit: item.unit || 'pcs'
        });
      }

      return {
        ...item,
        receivedQuantity: cumulativeReceived,
        deficitQuantity: itemDeficit
      };
    });

    // 2. Update Materials & Products Stock for received goods
    if (totalItemsReceivedThisBatch > 0) {
      // A. Update Materials stock or auto-add new material
      const updatedMaterials = [...materials];
      let materialsUpdated = false;

      po.items.forEach((item, index) => {
        const qtyReceiving = itemReceiptQty[index] !== undefined ? Math.max(0, Number(itemReceiptQty[index])) : 0;
        if (qtyReceiving <= 0) return;

        const isProductItem = po.type === 'Product' || 
          finishedProducts.some(p => (item.materialId && p.id === item.materialId) || p.name.toLowerCase() === item.name.toLowerCase());

        if (!isProductItem) {
          const matIndex = updatedMaterials.findIndex(m => 
            (item.materialId && m.id === item.materialId) || m.name.toLowerCase() === item.name.toLowerCase()
          );

          if (matIndex >= 0) {
            materialsUpdated = true;
            updatedMaterials[matIndex] = {
              ...updatedMaterials[matIndex],
              stock: updatedMaterials[matIndex].stock + qtyReceiving,
              costPerUnit: item.unitPrice > 0 ? item.unitPrice : updatedMaterials[matIndex].costPerUnit
            };
          } else {
            materialsUpdated = true;
            const newMat: Material = {
              id: item.materialId || `m-${Date.now()}-${index}`,
              name: item.name,
              category: 'Fabric',
              type: 'Fabric',
              stock: qtyReceiving,
              unit: item.unit || 'm',
              costPerUnit: item.unitPrice || 0,
              minStock: 10,
              supplier: po.supplierName
            };
            updatedMaterials.push(newMat);
          }
        }
      });

      if (materialsUpdated) {
        onUpdateMaterials(updatedMaterials);
      }

      // B. Update Finished Products stock or auto-add new product
      if (onUpdateFinishedProducts) {
        const updatedProducts = [...finishedProducts];
        let productsUpdated = false;

        po.items.forEach((item, index) => {
          const qtyReceiving = itemReceiptQty[index] !== undefined ? Math.max(0, Number(itemReceiptQty[index])) : 0;
          if (qtyReceiving <= 0) return;

          const isProductItem = po.type === 'Product' || 
            updatedProducts.some(p => (item.materialId && p.id === item.materialId) || p.name.toLowerCase() === item.name.toLowerCase());

          if (isProductItem) {
            const prodIndex = updatedProducts.findIndex(p => 
              (item.materialId && p.id === item.materialId) || p.name.toLowerCase() === item.name.toLowerCase()
            );

            if (prodIndex >= 0) {
              productsUpdated = true;
              updatedProducts[prodIndex] = {
                ...updatedProducts[prodIndex],
                stock: updatedProducts[prodIndex].stock + qtyReceiving,
                costPrice: item.unitPrice > 0 ? item.unitPrice : updatedProducts[prodIndex].costPrice
              };
            } else {
              productsUpdated = true;
              const newProd: FinishedProduct = {
                id: item.materialId || `prod-${Date.now()}-${index}`,
                name: item.name,
                barcode: `PRD-${Date.now().toString().slice(-4)}-${index}`,
                category: 'General',
                price: (item.unitPrice || 100) * 1.5,
                costPrice: item.unitPrice || 100,
                stock: qtyReceiving,
                minStock: 5,
                materials: [],
                image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&q=80'
              };
              updatedProducts.push(newProd);
            }
          }
        });

        if (productsUpdated) {
          onUpdateFinishedProducts(updatedProducts);
        }
      }
    }

    const isFullyReceived = deficitItemsList.length === 0;
    let createdDeficitRfqObj: RFQ | null = null;

    // 3. Auto-generate Deficit RFQ if shortfall exists and toggle enabled
    if (!isFullyReceived && autoCreateDeficitRfq) {
      const deficitRfqNumber = `RFQ-DEF-${po.poNumber.replace(/^PO-/, '')}-${Date.now().toString().slice(-3)}`;
      const targetSuppliers = selectedDeficitSuppliers.length > 0 ? selectedDeficitSuppliers : suppliers.map(s => s.id);

      createdDeficitRfqObj = {
        id: `rfq-def-${Date.now()}`,
        rfqNumber: deficitRfqNumber,
        date: new Date().toISOString(),
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        suppliers: targetSuppliers,
        orderId: po.orderId,
        orderNumber: po.orderNumber,
        type: po.type,
        isDeficitRfq: true,
        parentPoId: po.id,
        parentPoNumber: po.poNumber,
        items: deficitItemsList.map(it => ({
          materialId: it.materialId,
          name: it.name,
          quantity: it.quantity,
          unit: it.unit,
          specs: `Urgent deficit replacement for PO ${po.poNumber} (${po.supplierName})`
        })),
        status: 'Sent',
        notes: deficitRfqNotes || `Urgent: Deficit replacement sourcing for delivery shortfall on PO ${po.poNumber} (${po.supplierName})`
      };

      onUpdateRfqs([createdDeficitRfqObj, ...rfqs]);
    }

    // 4. Update PO Status and References
    const updatedPos = procurementOrders.map(p => {
      if (p.id === po.id) {
        return {
          ...p,
          items: updatedPoItems,
          status: (isFullyReceived ? 'Received' : 'Partial') as 'Received' | 'Partial',
          deficitRfqId: createdDeficitRfqObj ? createdDeficitRfqObj.id : p.deficitRfqId,
          deficitRfqNumber: createdDeficitRfqObj ? createdDeficitRfqObj.rfqNumber : p.deficitRfqNumber,
          serviceDetails: p.serviceDetails ? {
            ...p.serviceDetails,
            serviceStatus: (isFullyReceived ? 'Completed' : 'QA Inspection') as any
          } : undefined
        };
      }
      return p;
    });

    onUpdateProcurementOrders(updatedPos);
    setSelectedPoForReceive(null);

    // 5. Notifications and Audit Logging
    const totalDeficitUnits = deficitItemsList.reduce((sum, item) => sum + item.quantity, 0);

    if (!isFullyReceived) {
      onAddAuditLog?.(
        'Delivery Shortfall & Deficit Handled',
        `PO ${po.poNumber} partially received (${totalDeficitUnits} items deficit). ${createdDeficitRfqObj ? `Issued Deficit RFQ ${createdDeficitRfqObj.rfqNumber}` : ''}`,
        'inventory',
        'warning'
      );

      addNotification({
        title: createdDeficitRfqObj ? '⚠️ Delivery Shortfall & Deficit RFQ Issued' : '⚠️ Partial Receipt Recorded',
        message: `PO ${po.poNumber} delivered with a deficit of ${totalDeficitUnits} items. ${createdDeficitRfqObj ? `Deficit RFQ ${createdDeficitRfqObj.rfqNumber} sent to suppliers.` : 'Deficit RFQ can be created from the PO list.'}`,
        type: 'warning',
        category: 'inventory'
      });
    } else {
      onAddAuditLog?.('Goods Fully Received', `Received full inventory order for PO ${po.poNumber}`, 'inventory', 'success');

      addNotification({
        title: 'Goods Received (Full Delivery)',
        message: `All items for PO ${po.poNumber} successfully received and inventory updated.`,
        type: 'success',
        category: 'inventory'
      });
    }
  };

  // Open Record Payment Modal
  const handleOpenPaymentModal = (supplier?: Supplier, po?: ProcurementOrder) => {
    const targetSupplier = supplier || (po ? suppliers.find(s => s.id === po.supplierId) : suppliers[0]);
    setSelectedSupplierForPayment(targetSupplier || null);
    setSelectedPoForPayment(po || null);

    setPaymentData({
      supplierId: targetSupplier?.id || '',
      poId: po?.id || '',
      amount: po ? (po.total - (po.paidAmount || 0)) : (targetSupplier?.currentBalance || 0),
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Bank Transfer',
      referenceNumber: `TRX-${Date.now().toString().slice(-6)}`,
      notes: po ? `Payment for ${po.poNumber}` : `Account balance payment`
    });

    setIsPaymentModalOpen(true);
  };

  // Submit Supplier Payment
  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(paymentData.amount) || 0;
    if (amount <= 0 || !paymentData.supplierId) {
      alert('Please enter a valid payment amount and select a supplier.');
      return;
    }

    const supplier = suppliers.find(s => s.id === paymentData.supplierId);
    if (!supplier) return;

    // 1. Update Supplier Balance
    const newBalance = Math.max(0, (supplier.currentBalance || 0) - amount);
    onUpdateSuppliers(suppliers.map(s => s.id === supplier.id ? { ...s, currentBalance: newBalance } : s));

    // 2. If PO selected, update PO payment status
    let poObj = paymentData.poId ? procurementOrders.find(p => p.id === paymentData.poId) : undefined;
    if (paymentData.poId) {
      const updatedPos = procurementOrders.map(po => {
        if (po.id === paymentData.poId) {
          const currentPaid = po.paidAmount || 0;
          const newPaid = currentPaid + amount;
          const newStatus = newPaid >= po.total ? 'Paid' : 'Partial';
          poObj = {
            ...po,
            paidAmount: newPaid,
            paymentStatus: newStatus as 'Paid' | 'Partial'
          };
          return poObj;
        }
        return po;
      });
      onUpdateProcurementOrders(updatedPos);
    }

    // 2b. Auto-Record Payment in Invoice Portal (Supplier Bill)
    if (onUpdateInvoices) {
      if (poObj) {
        const invNumber = `BILL-${poObj.poNumber}`;
        const existingInv = invoices.find(i => i.poId === poObj!.id || i.invoiceNumber === invNumber || i.quotationId === poObj!.poNumber);
        const totalPaid = poObj.paidAmount || amount;
        const newBalance = Math.max(0, poObj.total - totalPaid);
        const newStatus = totalPaid >= poObj.total ? 'Paid' : 'Approved';

        if (existingInv) {
          const updatedInv: Invoice = {
            ...existingInv,
            amountPaid: totalPaid,
            balance: newBalance,
            status: newStatus as any
          };
          onUpdateInvoices(invoices.map(i => i.id === existingInv.id ? updatedInv : i));
        } else {
          const newInv: Invoice = {
            id: `inv-po-${poObj.id}`,
            invoiceNumber: invNumber,
            poId: poObj.id,
            poNumber: poObj.poNumber,
            isSupplierInvoice: true,
            type: 'Supplier',
            clientId: poObj.supplierId,
            clientName: poObj.supplierName,
            date: paymentData.date || poObj.date,
            dueDate: poObj.deliveryDate || paymentData.date,
            items: poObj.items.map(item => ({
              id: item.materialId || `mat-${Math.random()}`,
              name: item.name,
              price: item.unitPrice,
              costPrice: item.unitPrice,
              quantity: item.quantity,
              category: 'Procurement',
              stock: 9999,
              minStock: 0,
              description: `Procurement item for ${poObj!.poNumber}`
            })),
            subtotal: poObj.subtotal,
            tax: poObj.tax,
            taxRate: 0,
            discount: poObj.discount,
            discountRate: 0,
            freight: poObj.freight,
            otherCharges: poObj.otherCharges,
            total: poObj.total,
            amountPaid: totalPaid,
            balance: newBalance,
            status: newStatus as any,
            terms: poObj.terms || [],
            notes: `Supplier Procurement Bill for ${poObj.poNumber}`
          };
          onUpdateInvoices([newInv, ...invoices]);
        }
      } else {
        // Advance/general supplier payment without specific PO
        const advInvNumber = `BILL-ADV-${supplier.id.slice(-4)}-${Date.now().toString().slice(-4)}`;
        const newInv: Invoice = {
          id: `inv-adv-${Date.now()}`,
          invoiceNumber: advInvNumber,
          isSupplierInvoice: true,
          type: 'Supplier',
          clientId: supplier.id,
          clientName: supplier.name,
          date: paymentData.date,
          dueDate: paymentData.date,
          items: [{
            id: `adv-${Date.now()}`,
            name: `Supplier Advance Payment (${paymentData.notes || 'Procurement Advance'})`,
            price: amount,
            costPrice: amount,
            quantity: 1,
            category: 'Supplier Advance',
            stock: 9999,
            minStock: 0,
            description: `Advance payment to supplier ${supplier.name}`
          }],
          subtotal: amount,
          tax: 0,
          taxRate: 0,
          discount: 0,
          discountRate: 0,
          freight: 0,
          otherCharges: 0,
          total: amount,
          amountPaid: amount,
          balance: 0,
          status: 'Paid',
          terms: [],
          notes: `Advance Payment to Supplier ${supplier.name}`
        };
        onUpdateInvoices([newInv, ...invoices]);
      }
    }

    // 3. Log Financial Transaction & Expense
    const paymentTx: Transaction = {
      id: `TRX-SUP-${Date.now()}`,
      type: 'Expense',
      category: 'Supplier Payment',
      amount,
      date: paymentData.date,
      description: `Payment to ${supplier.name} ${paymentData.poId ? `(PO: ${procurementOrders.find(p => p.id === paymentData.poId)?.poNumber})` : ''}`,
      paymentMethod: paymentData.paymentMethod,
      status: 'Completed',
      supplierId: supplier.id,
      supplierName: supplier.name,
      referenceId: paymentData.referenceNumber
    };

    if (onUpdateTransactions) {
      onUpdateTransactions([paymentTx, ...transactions]);
    }

    const expenseRecord: Expense = {
      id: `EXP-${Date.now()}`,
      expenseNumber: `EXP-${new Date().getFullYear()}-${String(expenses.length + 1).padStart(3, '0')}`,
      vendor: supplier.name,
      category: 'Procurement & Raw Materials',
      amount,
      date: paymentData.date,
      paymentMethod: paymentData.paymentMethod,
      status: 'Paid',
      description: paymentData.notes || `Supplier payment for ${supplier.name}`,
      reference: paymentData.referenceNumber,
      supplierId: supplier.id,
      supplierName: supplier.name
    };

    if (onUpdateExpenses) {
      onUpdateExpenses([expenseRecord, ...expenses]);
    }

    onAddAuditLog?.('Supplier Payment', `Recorded payment of ${formatCurrency(amount)} to ${supplier.name}`, 'suppliers', 'success');

    setIsPaymentModalOpen(false);

    addNotification({
      title: 'Payment Recorded',
      message: `Payment of ${formatCurrency(amount)} to ${supplier.name} recorded.`,
      type: 'success',
      category: 'accounting'
    });
  };

  // Open modal to create new Outsourced Service Contract
  const handleOpenCreateServiceModal = (presetCategory?: string) => {
    setEditingServicePo(null);
    const defaultSupplier = suppliers[0];
    setServiceContractForm({
      supplierId: defaultSupplier?.id || '',
      customSupplierName: defaultSupplier?.name || '',
      contractType: 'Freelance/Specialist Contract',
      serviceCategory: presetCategory || 'Custom Manufacturing & Tree Fabrication',
      serviceTitle: presetCategory ? `${presetCategory} Contract` : 'Custom Flora & Structural Fabrication',
      scopeOfWork: 'Deliver specialized flora design, custom production, or installation service according to project specs.',
      locationOrSite: 'On-Site / Venue',
      orderId: '',
      totalAmount: 150000,
      turnaroundDays: 7,
      startDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentTerms: '50% Deposit / 50% Handover',
      notes: 'Outsourced service agreement under standard flora design terms.'
    });
    setIsCreateServiceModalOpen(true);
  };

  // Open modal to edit existing Outsourced Service Contract
  const handleOpenEditServiceModal = (po: ProcurementOrder) => {
    setEditingServicePo(po);
    setServiceContractForm({
      supplierId: po.supplierId,
      customSupplierName: po.supplierName,
      contractType: po.serviceDetails?.contractType || 'Freelance/Specialist Contract',
      serviceCategory: po.serviceDetails?.serviceCategory || 'Specialized Service',
      serviceTitle: po.serviceDetails?.serviceType || po.items[0]?.name || 'Outsourced Service Contract',
      scopeOfWork: po.serviceDetails?.scopeOfWork || po.notes || '',
      locationOrSite: po.serviceDetails?.locationOrSite || '',
      orderId: po.orderId || '',
      totalAmount: po.total,
      turnaroundDays: po.serviceDetails?.turnaroundDays || 7,
      startDate: po.serviceDetails?.contractStartDate || new Date(po.date).toISOString().split('T')[0],
      deliveryDate: po.deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentTerms: po.terms?.[0] || 'Net 30',
      notes: po.notes || ''
    });
    setIsCreateServiceModalOpen(true);
  };

  // Save (Create or Update) Outsourced Service Contract
  const handleSaveServiceContractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceContractForm.serviceTitle) {
      alert('Please enter a service title or scope.');
      return;
    }

    const supplierObj = suppliers.find(s => s.id === serviceContractForm.supplierId);
    const supplierName = supplierObj?.name || serviceContractForm.customSupplierName || 'Specialty Service Partner';
    const linkedOrder = orders.find(o => o.id === serviceContractForm.orderId);
    const totalAmount = Math.max(0, Number(serviceContractForm.totalAmount) || 0);

    if (editingServicePo) {
      // Edit existing contract
      const updatedPos = procurementOrders.map(p => {
        if (p.id === editingServicePo.id) {
          return {
            ...p,
            supplierId: serviceContractForm.supplierId || p.supplierId,
            supplierName,
            orderId: serviceContractForm.orderId || undefined,
            orderNumber: linkedOrder?.orderNumber || p.orderNumber,
            total: totalAmount,
            subtotal: totalAmount,
            deliveryDate: serviceContractForm.deliveryDate,
            terms: [serviceContractForm.paymentTerms],
            notes: serviceContractForm.notes,
            items: [{
              name: serviceContractForm.serviceTitle,
              quantity: 1,
              unitPrice: totalAmount,
              unit: 'job',
              total: totalAmount
            }],
            serviceDetails: {
              ...p.serviceDetails,
              serviceType: serviceContractForm.serviceTitle,
              contractType: serviceContractForm.contractType,
              serviceCategory: serviceContractForm.serviceCategory,
              scopeOfWork: serviceContractForm.scopeOfWork,
              locationOrSite: serviceContractForm.locationOrSite,
              turnaroundDays: Number(serviceContractForm.turnaroundDays) || 7,
              contractStartDate: serviceContractForm.startDate,
              serviceStatus: p.serviceDetails?.serviceStatus || 'Contracted'
            }
          };
        }
        return p;
      });

      onUpdateProcurementOrders(updatedPos);
      onAddAuditLog?.('Service Contract Updated', `Updated service contract ${editingServicePo.poNumber} (${supplierName})`, 'inventory', 'info');

      addNotification({
        title: 'Service Contract Updated',
        message: `Outsourced Service Contract ${editingServicePo.poNumber} updated successfully.`,
        type: 'success',
        category: 'inventory'
      });
    } else {
      // Create new service contract
      const poObj: ProcurementOrder = {
        id: `po-srv-${Date.now()}`,
        poNumber: `PO-SRV-${new Date().getFullYear()}-${String(procurementOrders.length + 1).padStart(3, '0')}`,
        orderId: serviceContractForm.orderId || undefined,
        orderNumber: linkedOrder?.orderNumber,
        date: new Date().toISOString(),
        supplierId: serviceContractForm.supplierId || `sup-${Date.now()}`,
        supplierName,
        type: 'Service',
        items: [{
          name: serviceContractForm.serviceTitle,
          quantity: 1,
          unitPrice: totalAmount,
          unit: 'job',
          total: totalAmount
        }],
        subtotal: totalAmount,
        discount: 0,
        tax: 0,
        freight: 0,
        otherCharges: 0,
        total: totalAmount,
        paidAmount: 0,
        status: 'Sent',
        paymentStatus: 'Unpaid',
        deliveryDate: serviceContractForm.deliveryDate,
        terms: [serviceContractForm.paymentTerms],
        notes: serviceContractForm.notes,
        serviceDetails: {
          serviceType: serviceContractForm.serviceTitle,
          contractType: serviceContractForm.contractType,
          serviceCategory: serviceContractForm.serviceCategory,
          scopeOfWork: serviceContractForm.scopeOfWork,
          locationOrSite: serviceContractForm.locationOrSite,
          turnaroundDays: Number(serviceContractForm.turnaroundDays) || 7,
          contractStartDate: serviceContractForm.startDate,
          serviceStatus: 'Contracted'
        }
      };

      onUpdateProcurementOrders([poObj, ...procurementOrders]);

      // Update supplier balance
      if (serviceContractForm.supplierId) {
        onUpdateSuppliers(suppliers.map(s => s.id === serviceContractForm.supplierId ? {
          ...s,
          currentBalance: (s.currentBalance || 0) + totalAmount
        } : s));
      }

      onAddAuditLog?.('Service Contract Registered', `Registered ${poObj.poNumber} (${supplierName}) for ${formatCurrency(totalAmount)}`, 'inventory', 'success');

      addNotification({
        title: 'Service Contract Registered',
        message: `Outsourced service contract ${poObj.poNumber} registered with ${supplierName}.`,
        type: 'success',
        category: 'inventory'
      });
    }

    setIsCreateServiceModalOpen(false);
  };

  // Delete Outsourced Service Contract
  const handleDeleteServiceContractConfirm = () => {
    if (!deletingServicePoId) return;
    const poToDelete = procurementOrders.find(p => p.id === deletingServicePoId);
    if (!poToDelete) return;

    // Adjust supplier balance if unpaid
    if (poToDelete.supplierId && poToDelete.paymentStatus !== 'Paid') {
      const unpaidAmount = poToDelete.total - (poToDelete.paidAmount || 0);
      onUpdateSuppliers(suppliers.map(s => s.id === poToDelete.supplierId ? {
        ...s,
        currentBalance: Math.max(0, (s.currentBalance || 0) - unpaidAmount)
      } : s));
    }

    onUpdateProcurementOrders(procurementOrders.filter(p => p.id !== deletingServicePoId));
    onAddAuditLog?.('Service Contract Deleted', `Deleted service contract ${poToDelete.poNumber}`, 'inventory', 'warning');

    addNotification({
      title: 'Service Contract Deleted',
      message: `Outsourced service contract ${poToDelete.poNumber} deleted.`,
      type: 'info',
      category: 'inventory'
    });

    setDeletingServicePoId(null);
  };

  // Advanced Flora & Design Service Stage Progression
  const handleAdvanceServiceStatus = (po: ProcurementOrder) => {
    const stages: Array<'Contracted' | 'Design Approval' | 'In Production' | 'QA Inspection' | 'On-Site Work' | 'Completed'> = [
      'Contracted', 'Design Approval', 'In Production', 'QA Inspection', 'On-Site Work', 'Completed'
    ];
    const currentStatus = po.serviceDetails?.serviceStatus || 'Contracted';
    const currIdx = stages.indexOf(currentStatus as any);
    const nextStatus = currIdx >= 0 && currIdx < stages.length - 1 ? stages[currIdx + 1] : 'Completed';

    const updatedPos = procurementOrders.map(p => {
      if (p.id === po.id) {
        return {
          ...p,
          status: (nextStatus === 'Completed' ? 'Received' : 'Sent') as any,
          serviceDetails: {
            ...(p.serviceDetails || { serviceType: 'Outsourced Service' }),
            serviceStatus: nextStatus
          }
        };
      }
      return p;
    });

    onUpdateProcurementOrders(updatedPos);

    onAddAuditLog?.('Service Stage Advanced', `${po.poNumber} advanced to stage: ${nextStatus}`, 'inventory', 'info');

    addNotification({
      title: 'Service Stage Updated',
      message: `${po.poNumber} advanced to ${nextStatus}.`,
      type: 'info',
      category: 'inventory'
    });
  };

  // Reject Quote with Reason
  const handleRejectQuoteWithReasonConfirm = () => {
    if (!quoteRejectModalQuote) return;
    const quote = quoteRejectModalQuote;

    const updatedQuotes = quotations.map(q => q.id === quote.id ? { 
      ...q, 
      status: 'Rejected' as const,
      notes: quoteRejectReason ? `${q.notes || ''} [Rejection Reason: ${quoteRejectReason}]`.trim() : q.notes
    } : q);

    onUpdateQuotations(updatedQuotes);

    onAddAuditLog?.('Quotation Rejected', `Quotation ${quote.quotationNumber || quote.id} rejected. Reason: ${quoteRejectReason || 'None provided'}`, 'inventory', 'warning');

    addNotification({
      title: 'Quotation Rejected',
      message: `Quotation ${quote.quotationNumber || quote.id} marked as Rejected.`,
      type: 'info',
      category: 'inventory'
    });

    setQuoteRejectModalQuote(null);
    setQuoteRejectReason('');
  };

  // Edit Supplier Credit Limits & Terms
  const handleSaveSupplierTerms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForEdit) return;

    onUpdateSuppliers(suppliers.map(s => s.id === selectedSupplierForEdit.id ? {
      ...s,
      creditLimit: Number(editSupplierData.creditLimit) || 0,
      paymentTerms: editSupplierData.paymentTerms,
      taxId: editSupplierData.taxId
    } : s));

    setIsEditCreditModalOpen(false);
    setSelectedSupplierForEdit(null);

    addNotification({
      title: 'Supplier Terms Updated',
      message: `Credit limits & payment terms updated for ${selectedSupplierForEdit.name}.`,
      type: 'success',
      category: 'system'
    });
  };

  // Dynamic Spend Analytics Calculations
  const analyticsData = useMemo(() => {
    // Filter POs by timeframe
    const now = new Date();
    const filteredPos = procurementOrders.filter(p => {
      if (p.status === 'Cancelled') return false;
      const pDate = new Date(p.date);
      if (timeframeFilter === 'month') {
        return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
      } else if (timeframeFilter === 'quarter') {
        const qNow = Math.floor(now.getMonth() / 3);
        const qPo = Math.floor(pDate.getMonth() / 3);
        return qNow === qPo && pDate.getFullYear() === now.getFullYear();
      } else if (timeframeFilter === 'year') {
        return pDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    // Category Spend
    const categorySpendMap: { [key: string]: number } = {
      'Material / Fabrics': 0,
      'Outsourced Services': 0,
      'Support & Accessories': 0
    };

    filteredPos.forEach(p => {
      if (p.type === 'Service') {
        categorySpendMap['Outsourced Services'] += p.total;
      } else if (p.type === 'Support') {
        categorySpendMap['Support & Accessories'] += p.total;
      } else {
        categorySpendMap['Material / Fabrics'] += p.total;
      }
    });

    const categoryData = Object.keys(categorySpendMap).map(key => ({
      name: key,
      value: categorySpendMap[key]
    })).filter(c => c.value > 0);

    // Supplier Spend
    const supplierSpendMap: { [key: string]: number } = {};
    filteredPos.forEach(p => {
      supplierSpendMap[p.supplierName] = (supplierSpendMap[p.supplierName] || 0) + p.total;
    });

    const supplierData = Object.keys(supplierSpendMap).map(sName => ({
      name: sName,
      amount: supplierSpendMap[sName]
    })).sort((a, b) => b.amount - a.amount).slice(0, 6);

    // Monthly Spend Trend
    const monthlySpendMap: { [key: string]: number } = {
      Jan: 12000, Feb: 15000, Mar: 18000, Apr: 22000, May: 19000, Jun: 25000,
      Jul: 28000, Aug: 24000
    };

    filteredPos.forEach(p => {
      const monthStr = new Date(p.date).toLocaleString('default', { month: 'short' });
      if (monthlySpendMap[monthStr] !== undefined) {
        monthlySpendMap[monthStr] += p.total;
      } else {
        monthlySpendMap[monthStr] = p.total;
      }
    });

    const monthlyData = Object.keys(monthlySpendMap).map(m => ({
      month: m,
      amount: monthlySpendMap[m]
    }));

    return {
      categoryData: categoryData.length > 0 ? categoryData : [
        { name: 'Fabrics & Raw Materials', value: 65000 },
        { name: 'Outsourced Services', value: 25000 },
        { name: 'Support & Accessories', value: 10000 }
      ],
      supplierData: supplierData.length > 0 ? supplierData : [
        { name: 'GreenLeaf Botanical Nurseries', amount: 85000 },
        { name: 'EcoMoss Preserved Flora Ltd', amount: 62000 },
        { name: 'Apex Artisan Vessels & Fiberstone', amount: 38000 },
        { name: 'Urban Green Infrastructure Systems', amount: 24000 }
      ],
      monthlyData
    };
  }, [procurementOrders, timeframeFilter]);

  return (
    <div className="flex-1 bg-gray-50 p-4 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header & Main Sourcing Triggers */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Procurement & Sourcing Portal</h1>
            <p className="text-xs text-gray-500">RFQ issuing, supplier quotations, purchase orders, outsourced services, and accounts payables</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setIsManagementReportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all cursor-pointer"
              title="Export print-friendly monthly management review report with dashboard visualizations & analytics"
            >
              <FileText size={14} /> PDF Export
            </button>

            <button 
              onClick={handleGenerateCriticalStockDrafts}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all cursor-pointer"
              title="Automatically generate Draft RFQs for all materials & products below critical min stock levels"
            >
              <Zap size={14} /> Auto-Draft Critical RFQs
            </button>

            <button 
              onClick={() => handleOpenPaymentModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-[11px] font-bold hover:bg-gray-50 shadow-sm"
            >
              <CreditCard size={14} className="text-rose-600" /> Record Payment
            </button>

            <button 
              onClick={() => {
                setNewQuoteData({
                  rfqId: '',
                  supplierId: suppliers[0]?.id || '',
                  orderId: '',
                  type: 'Material',
                  quotationNumber: `SQ-${Date.now().toString().slice(-4)}`,
                  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  discount: 0,
                  taxRate: companySettings.defaultTaxRate || 0,
                  freight: 0,
                  otherCharges: 0,
                  notes: '',
                  items: [{ materialId: '', name: '', quantity: 1, unitPrice: 0, unit: 'pcs', isAvailable: true, leadTime: '3 days' }]
                });
                setIsCreateQuoteOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-[11px] font-bold hover:bg-gray-50 shadow-sm"
            >
              <FileText size={14} className="text-indigo-600" /> Enter Quotation
            </button>

            <button 
              onClick={() => setIsCreatePoOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[11px] font-bold hover:bg-indigo-700 shadow-sm"
            >
              <ShoppingCart size={14} /> Create Direct PO
            </button>

            <button 
              onClick={handleOpenBulkImport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all cursor-pointer"
              title="Import bulk supply lists via manual entry grid to create multiple RFQs simultaneously"
            >
              <Grid size={14} /> Bulk Supply Grid
            </button>

            <button 
              onClick={() => setIsCreateRfqOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-[11px] font-bold hover:bg-primary/90 shadow-sm"
            >
              <Plus size={14} /> Create RFQ
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Active RFQs & Solicitations', value: stats.activeRfqs, icon: FileText, color: 'bg-blue-500' },
            { label: 'Pending Quotations', value: stats.pendingQuotes, icon: Clock, color: 'bg-amber-500' },
            { label: 'Active Purchase Orders', value: stats.activePOs, icon: ShoppingCart, color: 'bg-indigo-500' },
            { label: 'Accounts Payable Due', value: formatCurrency(stats.totalPayable), icon: DollarSign, color: 'bg-rose-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <div className={cn("p-1.5 rounded-lg text-white", stat.color)}>
                  <stat.icon size={16} />
                </div>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-0.5">{stat.label}</p>
              <h3 className="text-xl font-bold text-gray-900">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Portal Tab Navigation */}
        <div className="flex gap-4 border-b border-gray-200 overflow-x-auto pb-0.5">
          {[
            { id: 'dashboard', label: 'Procurement Dashboard', icon: LayoutDashboard, badge: (deficitPOs.length > 0 || autoDraftRfqs.length > 0) ? (deficitPOs.length + autoDraftRfqs.length) : undefined },
            { id: 'rfq', label: 'RFQs & Requests', icon: Send, badge: rfqs.length },
            { id: 'quotations', label: 'Supplier Quotations', icon: FileText, badge: quotations.filter(q => q.status === 'Pending').length },
            { id: 'orders', label: 'Purchase Orders (PO)', icon: ShoppingCart, badge: procurementOrders.length },
            { id: 'services', label: 'Outsourced Services', icon: Briefcase, badge: procurementOrders.filter(p => p.type === 'Service').length },
            { id: 'suppliers', label: 'Suppliers & Ratings', icon: Users, badge: suppliers.length },
            { id: 'leadtime', label: 'Lead Time Tracker', icon: Clock },
            { id: 'credit', label: 'Credit & Payables', icon: CreditCard, badge: suppliers.filter(s => (s.currentBalance || 0) > 0).length },
            { id: 'reports', label: 'Analytics & Spend', icon: PieChartIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ProcurementTab)}
              className={cn(
                "pb-2 text-[11px] font-bold transition-all relative flex items-center gap-1.5 whitespace-nowrap",
                activeTab === tab.id ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={cn(
                  "px-1.5 py-0.2 rounded-full text-[9px] font-extrabold",
                  tab.id === 'dashboard' && deficitPOs.length > 0 ? "bg-amber-500 text-white animate-pulse" : "bg-primary/10 text-primary"
                )}>
                  {tab.id === 'dashboard' && deficitPOs.length > 0 ? `⚡ ${tab.badge}` : tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* MAIN TAB CONTENT AREA */}
        <div className="min-h-[460px]">
          {/* TAB 0: PROCUREMENT DASHBOARD & DEFICIT REPLENISHMENT */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              {/* Deficit & Shortage Replenishment Alert Panel */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-2xl p-5 border border-amber-200/90 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/70 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-amber-950 uppercase tracking-tight">Partial Shipment Shortages & Deficits</h3>
                        <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-extrabold font-mono border border-amber-300">
                          {deficitPOs.length} Active Shortages
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 font-medium">
                        Automatically tracking delivery deficits from partial shipments. Use One-Click RFQ to issue replenishment orders instantly.
                      </p>
                    </div>
                  </div>

                  {deficitPOs.some(d => !d.hasDeficitRfq) && (
                    <button
                      onClick={handleBatchOneClickDeficitRfq}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap self-start sm:self-auto"
                    >
                      <Zap size={15} /> ⚡ Replenish All Shortages (Batch RFQ)
                    </button>
                  )}
                </div>

                {deficitPOs.length === 0 ? (
                  <div className="bg-white/80 rounded-xl p-4 text-center border border-amber-200/60">
                    <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-1" />
                    <p className="text-xs font-bold text-gray-800">No Partial Shipment Shortages Outstanding</p>
                    <p className="text-[11px] text-gray-500">All purchase order deliveries are either fully received or pending initial dispatch.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {deficitPOs.map((def, idx) => (
                      <div key={def.po.id ? `${def.po.id}-${idx}` : `def-${idx}`} className="bg-white rounded-xl p-4 border border-amber-200 shadow-xs space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-extrabold text-xs text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                {def.po.poNumber}
                              </span>
                              <span className="text-[10px] font-bold text-gray-500">• {def.po.supplierName}</span>
                            </div>
                            <p className="text-[11px] font-bold text-gray-900 mt-1">
                              Deficit: <span className="text-amber-800 font-mono font-extrabold">{def.totalDeficitQty} units</span> missing ({formatCurrency(def.totalDeficitVal)} value)
                            </p>
                          </div>

                          {def.hasDeficitRfq ? (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center gap-1 whitespace-nowrap">
                              <CheckCircle2 size={12} /> RFQ Issued ({def.deficitRfqNumber})
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOneClickDeficitRfq(def.po, def.deficitItems)}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-all whitespace-nowrap"
                            >
                              <Zap size={13} /> ⚡ One-Click RFQ
                            </button>
                          )}
                        </div>

                        {/* Deficit Items List */}
                        <div className="bg-amber-50/50 rounded-lg p-2.5 border border-amber-100/80 space-y-1">
                          <p className="text-[10px] font-bold text-amber-900 uppercase">Shortage Breakdown:</p>
                          <div className="divide-y divide-amber-100">
                            {def.deficitItems.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex justify-between items-center text-[11px] py-1">
                                <span className="font-medium text-gray-800 truncate">{item.name}</span>
                                <div className="flex items-center gap-2 font-mono">
                                  <span className="text-gray-400 text-[10px]">{item.receivedQty}/{item.orderedQty} rec'd</span>
                                  <span className="font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                                    -{item.deficitQty} {item.unit}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stage Progress Overview & Active PO Pipeline */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-tight">Active Purchase Order Stage Progress</h3>
                    <p className="text-[11px] text-gray-500">Visual progress tracking for 'Order Received', 'Quality Control', and 'Payment Cleared' stages</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    View All POs <ChevronRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {procurementOrders.slice(0, 6).map((po, idx) => (
                    <div key={po.id ? `${po.id}-${idx}` : `po-card-${idx}`} className="p-3.5 bg-gray-50/50 rounded-xl border border-gray-200 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono font-bold text-xs text-indigo-900">{po.poNumber}</span>
                          <p className="text-[11px] font-bold text-gray-800 truncate">{po.supplierName}</p>
                        </div>
                        <span className="text-xs font-black text-gray-900 font-mono">{formatCurrency(po.total)}</span>
                      </div>

                      <POStageProgressBars po={po} compact={false} />

                      <div className="pt-2 border-t border-gray-200/60 flex justify-between items-center text-[10px]">
                        <button 
                          onClick={() => setSelectedPoForDetails(po)}
                          className="text-indigo-600 font-bold hover:underline flex items-center gap-0.5"
                        >
                          <Eye size={12} /> Details
                        </button>
                        {po.status === 'Partial' && (
                          <button
                            onClick={() => handleOneClickDeficitRfq(po)}
                            className="px-2 py-0.5 bg-amber-100 text-amber-900 hover:bg-amber-200 rounded font-bold flex items-center gap-1"
                          >
                            <Zap size={11} /> ⚡ One-Click RFQ
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Visualization Dashboard (Recharts) */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Procurement Visualization & Spend Analytics</h3>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold border border-indigo-100">
                        Interactive Charts
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Real-time expenditure tracking, top supplier allocation, and procurement category breakdown</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('reports')}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    >
                      Detailed Spend Reports <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Chart 1: Monthly Purchase Volume */}
                  <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-200/80 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-tight flex items-center gap-1.5">
                        <FileSpreadsheet size={14} className="text-indigo-600" /> Monthly Purchase Volume
                      </h4>
                      <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        USD ($)
                      </span>
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                          <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} tick={{ fill: '#64748b', fontSize: 10 }} />
                          <Tooltip 
                            formatter={(value: any) => [formatCurrency(Number(value)), 'Purchase Volume']}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                          />
                          <Bar dataKey="amount" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Top Supplier Spending */}
                  <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-200/80 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-tight flex items-center gap-1.5">
                        <Users size={14} className="text-emerald-600" /> Top Supplier Spending
                      </h4>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        Top Vendors
                      </span>
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.supplierData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                          <XAxis type="number" tickFormatter={(v) => `$${v / 1000}k`} tick={{ fill: '#64748b', fontSize: 10 }} />
                          <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#334155', fontSize: 9, fontWeight: 'bold' }} />
                          <Tooltip 
                            formatter={(value: any) => [formatCurrency(Number(value)), 'Total Spend']}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                          />
                          <Bar dataKey="amount" fill="#10b981" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 3: Category-wise Procurement Trends */}
                  <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-200/80 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-tight flex items-center gap-1.5">
                        <PieChartIcon size={14} className="text-purple-600" /> Category Trends
                      </h4>
                      <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        Breakdown
                      </span>
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.categoryData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={40}
                            outerRadius={65}
                            paddingAngle={3}
                          >
                            {analyticsData.categoryData.map((_, i) => (
                              <Cell key={`dash-cell-${i}`} fill={['#4f46e5', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'][i % 5]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => formatCurrency(Number(value))}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: RFQ & REQUESTS */}
          {activeTab === 'rfq' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="relative flex-1 max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text"
                    placeholder="Search by RFQ #, requested item, or linked order..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={handleOpenBulkImport}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Grid size={14} /> Bulk Supply Import (Grid)
                  </button>
                  <button
                    onClick={() => setIsCreateRfqOpen(false)}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase">RFQ Ref</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase">Category</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase">Linked Order</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase">Requested Items / Specs</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase">Deadline</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase">Status</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rfqs.filter(r => r.rfqNumber.toLowerCase().includes(searchQuery.toLowerCase()) || r.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))).map((rfq, idx) => (
                      <tr key={rfq.id ? `${rfq.id}-${idx}` : `rfq-${idx}`} className={cn("hover:bg-gray-50/80 transition-colors", rfq.isDeficitRfq && "bg-amber-50/30")}>
                        <td className="px-4 py-3 text-[11px] font-bold text-gray-900 font-mono">
                          <div className="flex flex-col gap-0.5">
                            <span>{rfq.rfqNumber}</span>
                            {rfq.isDeficitRfq && (
                              <span className="text-[9px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded w-fit flex items-center gap-0.5 border border-amber-200">
                                ⚡ Deficit Replenishment
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-700">
                            {rfq.type || 'Material'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[10px]">
                          <div className="space-y-0.5">
                            {rfq.orderNumber && (
                              <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 inline-block">
                                {rfq.orderNumber}
                              </span>
                            )}
                            {rfq.parentPoNumber && (
                              <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block ml-1">
                                PO: {rfq.parentPoNumber}
                              </span>
                            )}
                            {!rfq.orderNumber && !rfq.parentPoNumber && (
                              <span className="text-gray-400 italic">General Sourcing</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[10px] font-medium text-gray-800">
                          {rfq.items.map(i => `${i.quantity} ${i.unit} ${i.name}`).join(', ')}
                        </td>
                        <td className="px-4 py-3 text-[10px] text-red-600 font-bold">
                          {new Date(rfq.deadline).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-bold",
                            rfq.status === 'Sent' ? "bg-blue-50 text-blue-600" :
                            rfq.status === 'Completed' ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-600"
                          )}>
                            {rfq.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => setPrintingRfq(rfq)}
                              title="Print RFQ Document"
                              className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg"
                            >
                              <Printer size={14} />
                            </button>
                            <button 
                              onClick={() => handleOpenQuoteForRfq(rfq)}
                              title="Enter Supplier Quotation"
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded text-[10px] font-bold flex items-center gap-1"
                            >
                              <Plus size={12} /> Enter Quote
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {rfqs.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-400 text-xs">
                          No Request for Quotations (RFQs) created yet. Click "Create RFQ" to solicit supplier pricing.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: SUPPLIER QUOTATIONS */}
          {activeTab === 'quotations' && (
            <div className="space-y-3">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase">Quote Ref</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase">Supplier Name</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase">Category</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase">Linked Order / RFQ</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase">Items Count</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase">Net Total</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase">Status</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {quotations.map((quote, quoteIdx) => (
                      <tr key={quote.id ? `${quote.id}-${quoteIdx}` : `quote-${quoteIdx}`} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-bold text-gray-900 font-mono">{quote.quotationNumber || quote.id}</td>
                        <td className="px-4 py-3 text-[11px] font-bold text-gray-900">{quote.supplierName}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700">
                            {quote.type || 'Material'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[10px] text-gray-500 space-y-0.5">
                          {quote.orderNumber && <p className="font-bold text-indigo-600">Order: {quote.orderNumber}</p>}
                          {quote.rfqNumber && <p className="text-gray-400">RFQ: {quote.rfqNumber}</p>}
                          {!quote.orderNumber && !quote.rfqNumber && <span>Direct Quotation</span>}
                        </td>
                        <td className="px-4 py-3 text-[10px] font-bold text-gray-700">{quote.items.length} items</td>
                        <td className="px-4 py-3 text-[11px] font-black text-gray-900">{formatCurrency(quote.total)}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-bold",
                            quote.status === 'Pending' ? "bg-amber-50 text-amber-600" :
                            quote.status === 'Accepted' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          )}>
                            {quote.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {quote.status === 'Pending' && (
                              <>
                                <button 
                                  onClick={() => handleApproveQuote(quote)}
                                  className="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded text-[10px] font-bold shadow-xs flex items-center gap-1 transition-all"
                                  title="Approve & Generate PO"
                                >
                                  <CheckCircle2 size={12} /> Approve & Issue PO
                                </button>
                                <button 
                                  onClick={() => handleOpenEditQuote(quote)}
                                  className="p-1 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-gray-200"
                                  title="Edit Quotation"
                                >
                                  <Edit size={13} />
                                </button>
                                <button 
                                  onClick={() => setQuoteRejectModalQuote(quote)}
                                  className="p-1 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded border border-gray-200"
                                  title="Reject Quotation with Reason"
                                >
                                  <XCircle size={13} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteQuote(quote.id)}
                                  className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                  title="Delete Quotation"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}

                            {quote.status === 'Accepted' && (
                              <>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                                  <CheckCircle2 size={12} /> Approved
                                </span>
                                <button 
                                  onClick={() => handleRevertQuote(quote)}
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                                  title="Revert to quotation status so it can be edited"
                                >
                                  <RotateCcw size={12} /> Revert to Quotation
                                </button>
                                <button 
                                  disabled
                                  className="p-1 text-gray-300 bg-gray-50 border border-gray-100 rounded cursor-not-allowed"
                                  title="Approved quotation cannot be edited directly. Revert to quotation first."
                                >
                                  <Edit size={13} />
                                </button>
                              </>
                            )}

                            {quote.status === 'Rejected' && (
                              <>
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 flex items-center gap-1">
                                  <XCircle size={12} /> Rejected
                                </span>
                                <button 
                                  onClick={() => handleRevertQuote(quote)}
                                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-bold flex items-center gap-1"
                                  title="Re-open / Revert to Pending"
                                >
                                  <RotateCcw size={12} /> Set Pending
                                </button>
                                <button 
                                  onClick={() => handleOpenEditQuote(quote)}
                                  className="p-1 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-gray-200"
                                  title="Edit Quotation"
                                >
                                  <Edit size={13} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteQuote(quote.id)}
                                  className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                  title="Delete Quotation"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {quotations.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-400 text-xs">
                          No supplier quotations recorded yet. Click "Enter Quotation" to input supplier prices.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PROCUREMENT ORDERS (PO WORKFLOW) */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text"
                    placeholder="Search by PO #, supplier name, or item..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  {['All', 'Sent', 'Partial', 'Received', 'Unpaid', 'Paid'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                        statusFilter === filter ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase">PO Ref</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase">PO Date</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase">Supplier Partner</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase">Category</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase">Total Amount</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase">Goods Status</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase min-w-[160px]">Stages & Progress</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase">Payment Status</th>
                      <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {procurementOrders.filter(po => {
                      const matchSearch = po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                          po.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                          po.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
                      if (!matchSearch) return false;

                      if (statusFilter === 'Sent') return po.status === 'Sent';
                      if (statusFilter === 'Partial') return po.status === 'Partial';
                      if (statusFilter === 'Received') return po.status === 'Received';
                      if (statusFilter === 'Unpaid') return po.paymentStatus === 'Unpaid';
                      if (statusFilter === 'Paid') return po.paymentStatus === 'Paid';
                      return true;
                    }).map((po, poIdx) => (
                      <tr key={po.id ? `${po.id}-${poIdx}` : `po-${poIdx}`} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-bold text-indigo-900 font-mono">
                          <button 
                            onClick={() => setSelectedPoForDetails(po)}
                            className="hover:underline flex items-center gap-1 text-indigo-700"
                          >
                            {po.poNumber} <Eye size={12} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-[10px] text-gray-500">{new Date(po.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-[11px] font-bold text-gray-900">{po.supplierName}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-700">
                            {po.type || 'Material'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] font-black text-gray-900">{formatCurrency(po.total)}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 w-fit",
                            po.status === 'Sent' ? "bg-blue-50 text-blue-600 border-blue-100" :
                            po.status === 'Partial' ? "bg-amber-50 text-amber-700 border-amber-200" :
                            po.status === 'Received' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-100 text-gray-600 border-gray-200"
                          )}>
                            {po.status === 'Partial' ? '⚠️ Partial' : po.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <POStageProgressBars po={po} compact={true} />
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-bold border",
                            po.paymentStatus === 'Paid' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            po.paymentStatus === 'Partial' ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200"
                          )}>
                            {po.paymentStatus} {po.paidAmount ? `(${formatCurrency(po.paidAmount)})` : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button 
                              onClick={() => setPrintingPo(po)}
                              title="View & Print Official PO Document"
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-[10px] font-bold flex items-center gap-1"
                            >
                              <Printer size={12} /> Print
                            </button>

                            {po.status === 'Partial' && (
                              <button 
                                onClick={() => {
                                  if (po.deficitRfqNumber) {
                                    setActiveTab('rfq');
                                    setSearchQuery(po.deficitRfqNumber);
                                  } else {
                                    handleCreateDeficitRfqForExistingPo(po);
                                  }
                                }}
                                title={po.deficitRfqNumber ? `View Linked RFQ ${po.deficitRfqNumber}` : "Issue Deficit RFQ for remaining items"}
                                className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded text-[10px] font-bold flex items-center gap-1"
                              >
                                <Send size={11} /> {po.deficitRfqNumber ? po.deficitRfqNumber : '+ Deficit RFQ'}
                              </button>
                            )}

                            {po.status !== 'Received' && (
                              <button 
                                onClick={() => handleOpenReceiveModal(po)}
                                title="Receive Goods / Update Stock"
                                className="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded text-[10px] font-bold flex items-center gap-1 shadow-xs"
                              >
                                <PackageCheck size={12} /> Receive
                              </button>
                            )}

                            {po.paymentStatus !== 'Paid' && (
                              <button 
                                onClick={() => handleOpenPaymentModal(undefined, po)}
                                title="Record Payment"
                                className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded text-[10px] font-bold flex items-center gap-1"
                              >
                                <CreditCard size={12} /> Pay
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {procurementOrders.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-400 text-xs">
                          No Purchase Orders (POs) generated yet. Approve a quotation or click "Create Direct PO".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: OUTSOURCED SERVICES & CONTRACTS WORKFLOW */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              {/* Header & Sourcing Options */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Briefcase size={18} className="text-indigo-600" /> Flora & Design Outsourced Services Portal
                    </h3>
                    <p className="text-xs text-gray-500">Contract external specialty partners for custom plant fabrication, overseas factory production & QC, specialist installation crews, decor printing, and plant maintenance.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => {
                        setNewRfqData({
                          type: 'Service',
                          orderId: '',
                          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                          selectedSuppliers: [],
                          notes: 'Sourcing RFQ for Flora Design & Specialized Outsourced Services',
                          items: [{ materialId: '', name: 'Specialist Installation Crew / Custom Fabrication Contract', quantity: 1, unit: 'job', specs: 'Include complete labor, tools, insurance, and delivery specs.' }]
                        });
                        setIsCreateRfqOpen(true);
                      }}
                      className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Send size={14} /> Issue Service RFQ
                    </button>
                    <button 
                      onClick={() => handleOpenCreateServiceModal()}
                      className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-indigo-700 transition-all"
                    >
                      <Plus size={14} /> Register Outsourced Contract
                    </button>
                  </div>
                </div>

                {/* Outsourced Categories Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {[
                    { title: 'Tree & Flora Fabrication', category: 'Custom Manufacturing & Tree Fabrication', icon: Sparkles, bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                    { title: 'Logistics & Overseas QC', category: 'Logistics & Overseas QC Fulfillment', icon: RefreshCw, bg: 'bg-blue-50 text-blue-800 border-blue-200' },
                    { title: 'Specialist Floral Crew', category: 'Specialist Freelance Crew & Greenspeople', icon: Scissors, bg: 'bg-purple-50 text-purple-800 border-purple-200' },
                    { title: 'Structure Fabrication', category: 'Raw Materials & Structure Fabrication', icon: Layers, bg: 'bg-amber-50 text-amber-800 border-amber-200' },
                    { title: 'Irrigation & Lighting', category: 'Drip Irrigation & Spectrum Lighting', icon: Flower2, bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                    { title: 'Plant Rental & Maintenance', category: 'Plant Rental & On-Site Maintenance', icon: ShieldCheck, bg: 'bg-teal-50 text-teal-800 border-teal-200' },
                  ].map((cat, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => handleOpenCreateServiceModal(cat.category)}
                      className={cn("p-3 rounded-xl border flex flex-col items-center text-center space-y-1.5 hover:scale-102 transition-transform cursor-pointer", cat.bg)}
                    >
                      <cat.icon size={18} />
                      <span className="text-[10px] font-extrabold leading-tight">{cat.title}</span>
                      <span className="text-[9px] font-bold opacity-80 bg-white/60 px-1.5 py-0.2 rounded">+ Register</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Outsourced Service Contracts List */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
                    <Briefcase size={14} className="text-indigo-600" /> Active Outsourced Service Contracts & Agreements
                  </h4>
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {procurementOrders.filter(p => p.type === 'Service').length} Contracts Registered
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase">Contract Ref</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase">Specialty Partner</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase">Category & Title</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase">Linked Order / Venue</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase">Contract Value</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase">Payment Status</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase">Service Stage</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {procurementOrders.filter(p => p.type === 'Service').map((servPo, servIdx) => {
                        const paid = servPo.paidAmount || 0;
                        const balanceDue = Math.max(0, servPo.total - paid);
                        const isCompleted = servPo.serviceDetails?.serviceStatus === 'Completed';

                        return (
                          <tr key={servPo.id ? `${servPo.id}-${servIdx}` : `serv-${servIdx}`} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-3 py-2.5 text-xs font-bold font-mono text-indigo-900">
                              <button 
                                onClick={() => setSelectedServicePoForDetails(servPo)}
                                className="hover:underline flex items-center gap-1 text-indigo-700"
                              >
                                {servPo.poNumber} <Eye size={12} />
                              </button>
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-900">{servPo.supplierName}</span>
                                <span className="text-[9px] font-semibold text-gray-500">
                                  {servPo.serviceDetails?.contractType || 'Specialist Contract'}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-bold text-gray-800 line-clamp-1">
                                  {servPo.serviceDetails?.serviceType || servPo.items[0]?.name}
                                </span>
                                <span className="text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.2 rounded w-fit">
                                  {servPo.serviceDetails?.serviceCategory || 'Outsourced Service'}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-xs">
                              <div className="flex flex-col gap-0.5">
                                {servPo.orderNumber ? (
                                  <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded w-fit text-[10px]">
                                    {servPo.orderNumber}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic text-[10px]">General Project</span>
                                )}
                                {servPo.serviceDetails?.locationOrSite && (
                                  <span className="text-[9px] font-medium text-gray-500 truncate max-w-[120px]">
                                    📍 {servPo.serviceDetails.locationOrSite}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-xs font-black text-gray-900">
                              {formatCurrency(servPo.total)}
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex flex-col gap-0.5">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[9px] font-bold border w-fit",
                                  servPo.paymentStatus === 'Paid' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                  servPo.paymentStatus === 'Partial' ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200"
                                )}>
                                  {servPo.paymentStatus} {paid > 0 ? `(${formatCurrency(paid)})` : ''}
                                </span>
                                {balanceDue > 0 && (
                                  <span className="text-[9px] font-bold text-rose-600">
                                    Due: {formatCurrency(balanceDue)}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-extrabold border flex items-center gap-1 w-fit",
                                isCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                servPo.serviceDetails?.serviceStatus === 'On-Site Work' ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                                servPo.serviceDetails?.serviceStatus === 'QA Inspection' ? "bg-amber-50 text-amber-700 border-amber-200" :
                                servPo.serviceDetails?.serviceStatus === 'In Production' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                servPo.serviceDetails?.serviceStatus === 'Design Approval' ? "bg-purple-50 text-purple-700 border-purple-200" :
                                "bg-gray-100 text-gray-700 border-gray-200"
                              )}>
                                {servPo.serviceDetails?.serviceStatus || 'Contracted'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {!isCompleted ? (
                                  <button 
                                    onClick={() => handleAdvanceServiceStatus(servPo)}
                                    className="px-2 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold hover:bg-indigo-700 flex items-center gap-0.5 shadow-xs"
                                    title="Advance Service Stage"
                                  >
                                    Stage ➔
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                                    <CheckCircle2 size={12} /> Delivered
                                  </span>
                                )}

                                {servPo.paymentStatus !== 'Paid' && (
                                  <button 
                                    onClick={() => handleOpenPaymentModal(undefined, servPo)}
                                    className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded text-[10px] font-bold flex items-center gap-0.5"
                                    title="Record Payment for Service"
                                  >
                                    <CreditCard size={11} /> Pay
                                  </button>
                                )}

                                <button 
                                  onClick={() => handleOpenEditServiceModal(servPo)}
                                  className="p-1 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-gray-200"
                                  title="Edit Service Contract"
                                >
                                  <Edit size={13} />
                                </button>

                                <button 
                                  onClick={() => setDeletingServicePoId(servPo.id)}
                                  className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded border border-gray-200"
                                  title="Delete Service Contract"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {procurementOrders.filter(p => p.type === 'Service').length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-gray-400 text-xs">
                            No active outsourced service contracts recorded yet. Click "Register Outsourced Contract" or "Issue Service RFQ" to begin.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SUPPLIERS & 5-STAR RATINGS */}
          {activeTab === 'suppliers' && (
            <div className="space-y-4">
              {/* Header banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Users size={16} className="text-primary" /> Approved Suppliers & 5-Star Performance Ratings
                  </h3>
                  <p className="text-xs text-gray-500">
                    Manage vendor relationships, fulfillment records, and assign 5-star ratings based on quality and delivery.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedSupplierForEdit({ id: '', name: '', contactPerson: '', email: '', phone: '', address: '', category: 'Fabric', rating: 5, ratingCount: 1 })}
                    className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus size={14} /> Add New Supplier
                  </button>
                </div>
              </div>

              {/* Supplier Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map((supplier) => {
                  const avgLeadTime = leadTimeAnalytics.supplierMap[supplier.id]?.avgLeadTimeDays || 3.5;
                  const totalOrders = leadTimeAnalytics.supplierMap[supplier.id]?.totalOrders || 0;

                  return (
                    <div key={supplier.id} className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 flex flex-col justify-between space-y-3 hover:border-indigo-200 transition-all">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              {supplier.category || 'General'}
                            </span>
                            <h4 className="font-extrabold text-sm text-gray-900 mt-1">{supplier.name}</h4>
                            <p className="text-xs text-gray-500">{supplier.contactPerson}</p>
                          </div>
                          <div className="text-right">
                            <StarRatingDisplay rating={supplier.rating || 4.5} count={supplier.ratingCount || 8} size="sm" />
                          </div>
                        </div>

                        <div className="bg-gray-50/80 rounded-lg p-2.5 text-xs space-y-1.5 border border-gray-100">
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Contact Email:</span>
                            <span className="font-semibold text-gray-800">{supplier.email}</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Phone:</span>
                            <span className="font-semibold text-gray-800">{supplier.phone}</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Avg Lead Time:</span>
                            <span className="font-mono font-bold text-indigo-700">{avgLeadTime} Days</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Completed Orders:</span>
                            <span className="font-mono font-bold text-gray-800">{totalOrders} POs</span>
                          </div>
                        </div>

                        {/* Latest Review Snippet if available */}
                        {supplier.ratingsHistory && supplier.ratingsHistory.length > 0 && (
                          <div className="bg-amber-50/70 rounded-lg p-2.5 border border-amber-200/60 text-[11px] space-y-1">
                            <div className="flex items-center justify-between text-amber-900 font-bold">
                              <span>Latest Review Rating:</span>
                              <span className="text-amber-700 font-extrabold">⭐ {supplier.ratingsHistory[0].score}/5</span>
                            </div>
                            <p className="text-amber-800 italic">"{supplier.ratingsHistory[0].comment || 'Consistently strong fulfillment turnaround.'}"</p>
                            <span className="text-[9px] text-amber-700 block text-right">— {supplier.ratingsHistory[0].author || 'Procurement Team'}, {supplier.ratingsHistory[0].date}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleOpenRateSupplier(supplier)}
                          className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <Star size={14} className="fill-amber-400 text-amber-500" /> Rate Supplier (5-Star)
                        </button>
                        <button
                          onClick={() => setSelectedSupplierForEdit(supplier)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Edit Supplier Details"
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: LEAD TIME TRACKER & TRENDS */}
          {activeTab === 'leadtime' && (
            <div className="space-y-4">
              {/* Analytics Top Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-[10px] font-bold uppercase tracking-tight">Avg Procurement Lead Time</span>
                    <Clock size={16} className="text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900">{leadTimeAnalytics.overallAvgLeadTime} <span className="text-xs font-semibold text-gray-500">Days</span></h3>
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <TrendingDown size={12} /> 0.4 days faster than last month
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-[10px] font-bold uppercase tracking-tight">Fastest Supplier</span>
                    <Award size={16} className="text-amber-500" />
                  </div>
                  <h3 className="text-base font-black text-gray-900 truncate">{leadTimeAnalytics.fastestVendor}</h3>
                  <p className="text-[10px] text-gray-500">Top vendor for rapid fulfillment</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-[10px] font-bold uppercase tracking-tight">Target Lead Time SLA</span>
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900">5.0 <span className="text-xs font-semibold text-gray-500">Days SLA</span></h3>
                  <p className="text-[10px] text-emerald-600 font-bold">94.2% On-Time Delivery Rate</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-[10px] font-bold uppercase tracking-tight">Active Suppliers Tracked</span>
                    <Users size={16} className="text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900">{leadTimeAnalytics.suppliersList.length} <span className="text-xs font-semibold text-gray-500">Vendors</span></h3>
                  <p className="text-[10px] text-gray-500">Full RFQ to Receipt analytics</p>
                </div>
              </div>

              {/* Lead Time Trend Line Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <TrendingUp size={16} className="text-indigo-600" /> Supplier Lead Time Trend (RFQ to Goods Receipt Days)
                    </h3>
                    <p className="text-xs text-gray-500">Average fulfillment duration calculated per supplier across recent order cycles.</p>
                  </div>

                  {/* Filter Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">Filter Supplier:</span>
                    <select
                      value={leadTimeSupplierFilter}
                      onChange={(e) => setLeadTimeSupplierFilter(e.target.value)}
                      className="text-xs font-bold border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="all">All Suppliers (Comparison)</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Line Chart */}
                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={leadTimeAnalytics.lineChartTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit=" days" domain={[0, 'auto']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                        formatter={(value: any) => [`${value} Days`, 'Lead Time']}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
                      <ReferenceLine y={5} label={{ value: 'Target SLA (5 Days)', fill: '#ef4444', fontSize: 10, position: 'top' }} stroke="#ef4444" strokeDasharray="4 4" />

                      {suppliers.map((sup, idx) => {
                        if (leadTimeSupplierFilter !== 'all' && leadTimeSupplierFilter !== sup.id) return null;
                        const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
                        const color = colors[idx % colors.length];

                        return (
                          <Line
                            key={sup.id}
                            type="monotone"
                            dataKey={sup.name}
                            name={sup.name}
                            stroke={color}
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: color }}
                            activeDot={{ r: 6 }}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detailed Lead Time Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-tight">Supplier Lead Time & Fulfillment Scorecard</h4>
                  <span className="text-[11px] text-gray-400 font-medium">Calculated Automatically from Goods Receipt Stamps</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold text-[10px] uppercase">
                        <th className="p-3">Supplier Name</th>
                        <th className="p-3">5-Star Rating</th>
                        <th className="p-3">Avg Lead Time</th>
                        <th className="p-3">Target SLA</th>
                        <th className="p-3">Fulfillment Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {leadTimeAnalytics.suppliersList.map((sup) => (
                        <tr key={sup.supplierId} className="hover:bg-gray-50/60">
                          <td className="p-3 font-bold text-gray-900">{sup.supplierName}</td>
                          <td className="p-3">
                            <StarRatingDisplay rating={sup.rating} count={sup.totalOrders} size="xs" />
                          </td>
                          <td className="p-3 font-mono font-bold text-indigo-700">{sup.avgLeadTimeDays} Days</td>
                          <td className="p-3 font-mono text-gray-500">5.0 Days</td>
                          <td className="p-3">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold",
                              sup.avgLeadTimeDays <= 4 ? "bg-emerald-100 text-emerald-800" : sup.avgLeadTimeDays <= 6 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                            )}>
                              {sup.avgLeadTimeDays <= 4 ? '🟢 Excellent Turnaround' : sup.avgLeadTimeDays <= 6 ? '🟡 On Target' : '🔴 Delayed'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                const found = suppliers.find(s => s.id === sup.supplierId || s.name === sup.supplierName);
                                if (found) handleOpenRateSupplier(found);
                              }}
                              className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Star size={12} className="fill-amber-400 text-amber-500" /> Rate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: CREDIT & PAYABLES PORTAL */}
          {activeTab === 'credit' && (
            <div className="space-y-4">
              {/* Payables Summary Header */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Supplier Accounts Payable & Credit Lines</h3>
                  <p className="text-xs text-gray-500">Track outstanding vendor balances, payment terms, and aging obligations</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleOpenPaymentModal()}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 flex items-center gap-1.5 shadow-sm"
                  >
                    <CreditCard size={14} /> Record Supplier Payment
                  </button>
                </div>
              </div>

              {/* Payables Ledger Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden space-y-2 p-4">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-tight mb-2">Unpaid & Partial Purchase Orders Ledger</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase">PO Ref</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase">Vendor</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase">PO Date</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase">Net Total</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase">Paid Amount</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase">Balance Due</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase">Status</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {procurementOrders.filter(p => p.paymentStatus !== 'Paid').map((po, unpaidIdx) => {
                        const balanceDue = po.total - (po.paidAmount || 0);
                        return (
                          <tr key={po.id ? `${po.id}-${unpaidIdx}` : `unpaid-${unpaidIdx}`} className="hover:bg-gray-50">
                            <td className="px-3 py-2.5 text-xs font-bold font-mono text-indigo-900">{po.poNumber}</td>
                            <td className="px-3 py-2.5 text-xs font-bold text-gray-900">{po.supplierName}</td>
                            <td className="px-3 py-2.5 text-xs text-gray-500">{new Date(po.date).toLocaleDateString()}</td>
                            <td className="px-3 py-2.5 text-xs font-bold text-gray-900">{formatCurrency(po.total)}</td>
                            <td className="px-3 py-2.5 text-xs font-bold text-emerald-600">{formatCurrency(po.paidAmount || 0)}</td>
                            <td className="px-3 py-2.5 text-xs font-black text-rose-600">{formatCurrency(balanceDue)}</td>
                            <td className="px-3 py-2.5">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-bold",
                                po.paymentStatus === 'Partial' ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                              )}>
                                {po.paymentStatus}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <button 
                                onClick={() => handleOpenPaymentModal(undefined, po)}
                                className="px-2.5 py-1 bg-rose-600 text-white hover:bg-rose-700 rounded text-[10px] font-bold shadow-xs"
                              >
                                Pay Now
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {procurementOrders.filter(p => p.paymentStatus !== 'Paid').length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-6 text-gray-400 text-xs">
                            All procurement purchase orders are fully settled! No outstanding payables.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Supplier Credit Limits Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {suppliers.map(s => (
                  <div key={s.id} className="bg-white p-4 rounded-xl border border-gray-200 space-y-3 shadow-sm hover:border-gray-300 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 uppercase">{s.name}</h4>
                        <p className="text-[9px] text-gray-400 font-medium">{s.category || 'Vendor Partner'}</p>
                      </div>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{s.paymentTerms || 'Net 30'}</span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[10px] font-medium">
                        <span className="text-gray-500">Current Payable Balance:</span>
                        <span className="text-rose-600 font-bold">{formatCurrency(s.currentBalance || 0)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-medium">
                        <span className="text-gray-500">Credit Limit:</span>
                        <span className="text-gray-800 font-bold">{formatCurrency(s.creditLimit || 0)}</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all", ((s.currentBalance || 0) / (s.creditLimit || 1)) > 0.8 ? "bg-rose-500" : "bg-primary")} 
                          style={{ width: `${Math.min(100, ((s.currentBalance || 0) / (s.creditLimit || 1)) * 100)}%` }} 
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-[10px]">
                      <span className="text-gray-400">Tax ID: {s.taxId || 'N/A'}</span>
                      <button 
                        onClick={() => {
                          setSelectedSupplierForEdit(s);
                          setEditSupplierData({
                            creditLimit: s.creditLimit || 0,
                            paymentTerms: s.paymentTerms || 'Net 30',
                            taxId: s.taxId || ''
                          });
                          setIsEditCreditModalOpen(true);
                        }}
                        className="text-indigo-600 font-bold hover:underline"
                      >
                        Edit Credit Terms
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: ANALYTICS & SPEND PORTAL */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-tight">Procurement Spend Analytics</h3>
                  <p className="text-[11px] text-gray-500">Expenditure breakdown by raw materials, outsourced services, and suppliers</p>
                </div>
                <div className="flex gap-2">
                  {(['all', 'month', 'quarter', 'year'] as const).map(tf => (
                    <button
                      key={tf}
                      onClick={() => setTimeframeFilter(tf)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all",
                        timeframeFilter === tf ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Spend by Category */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-[11px] font-bold text-gray-900 mb-4 uppercase tracking-tight">Expenditure by Category</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.categoryData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                        >
                          {analyticsData.categoryData.map((_, i) => (
                            <Cell key={`cell-${i}`} fill={['#2563eb', '#8b5cf6', '#10b981', '#f59e0b'][i % 4]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                        <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Suppliers Spend */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-[11px] font-bold text-gray-900 mb-4 uppercase tracking-tight">Top Suppliers by Spend</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.supplierData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" tickFormatter={(v) => `$${v / 1000}k`} tick={{ fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                        <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                        <Bar dataKey="amount" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Monthly Spend Trend */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-[11px] font-bold text-gray-900 mb-4 uppercase tracking-tight">Monthly Procurement Spend Trend</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                      <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: CREATE RFQ */}
      <AnimatePresence>
        {isCreateRfqOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Create Request for Quotation (RFQ)</h3>
                <button onClick={() => setIsCreateRfqOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateRfq} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">RFQ Category</label>
                    <select 
                      value={newRfqData.type}
                      onChange={e => setNewRfqData({ ...newRfqData, type: e.target.value as any })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                    >
                      <option value="Material">Material (Fabrics / Accessories)</option>
                      <option value="Service">Outsourced Service (Sewing/Dyeing)</option>
                      <option value="Support">Support Service / Partner</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Link Client Order (Optional)</label>
                    <select 
                      value={newRfqData.orderId}
                      onChange={e => {
                        const selectedOrdId = e.target.value;
                        const ord = orders.find(o => o.id === selectedOrdId);
                        if (ord && ord.items && ord.items.length > 0) {
                          setNewRfqData({
                            ...newRfqData,
                            orderId: selectedOrdId,
                            items: ord.items.map(item => ({
                              materialId: item.id || '',
                              name: item.name,
                              quantity: item.quantity,
                              unit: 'pcs',
                              specs: `Order ${ord.orderNumber} (${item.color || ''} ${item.size || ''})`.trim()
                            }))
                          });
                        } else {
                          setNewRfqData({ ...newRfqData, orderId: selectedOrdId });
                        }
                      }}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                    >
                      <option value="">-- No Linked Order --</option>
                      {orders.map(o => (
                        <option key={o.id} value={o.id}>{o.orderNumber} ({o.clientName})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Submission Deadline</label>
                    <input 
                      type="date"
                      value={newRfqData.deadline}
                      onChange={e => setNewRfqData({ ...newRfqData, deadline: e.target.value })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                      required
                    />
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Requested Items / Services</label>
                    <button 
                      type="button"
                      onClick={() => setNewRfqData({
                        ...newRfqData,
                        items: [...newRfqData.items, { materialId: '', name: '', quantity: 10, unit: 'pcs', specs: '' }]
                      })}
                      className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
                    >
                      <Plus size={12} /> Add Row
                    </button>
                  </div>

                  {newRfqData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 items-center">
                      <div className="col-span-4">
                        <input 
                          type="text"
                          placeholder="Item Name / Description"
                          value={item.name}
                          onChange={e => {
                            const updated = [...newRfqData.items];
                            updated[index].name = e.target.value;
                            setNewRfqData({ ...newRfqData, items: updated });
                          }}
                          className="w-full p-1.5 bg-white border border-gray-200 rounded text-xs font-bold"
                          required
                        />
                      </div>
                      <div className="col-span-4">
                        <input 
                          type="text"
                          placeholder="Specs (e.g. UV-Resistant, Grade A, Fire-Retardant)"
                          value={item.specs}
                          onChange={e => {
                            const updated = [...newRfqData.items];
                            updated[index].specs = e.target.value;
                            setNewRfqData({ ...newRfqData, items: updated });
                          }}
                          className="w-full p-1.5 bg-white border border-gray-200 rounded text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <input 
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={e => {
                            const updated = [...newRfqData.items];
                            updated[index].quantity = Number(e.target.value);
                            setNewRfqData({ ...newRfqData, items: updated });
                          }}
                          className="w-full p-1.5 bg-white border border-gray-200 rounded text-xs font-bold"
                          required
                        />
                      </div>
                      <div className="col-span-1">
                        <input 
                          type="text"
                          placeholder="Unit"
                          value={item.unit}
                          onChange={e => {
                            const updated = [...newRfqData.items];
                            updated[index].unit = e.target.value;
                            setNewRfqData({ ...newRfqData, items: updated });
                          }}
                          className="w-full p-1.5 bg-white border border-gray-200 rounded text-xs"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        {newRfqData.items.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => {
                              const updated = newRfqData.items.filter((_, i) => i !== index);
                              setNewRfqData({ ...newRfqData, items: updated });
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Target Suppliers */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Target Suppliers (Select or leave empty for all)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                    {suppliers.map(s => (
                      <label key={s.id} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={newRfqData.selectedSuppliers.includes(s.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setNewRfqData({ ...newRfqData, selectedSuppliers: [...newRfqData.selectedSuppliers, s.id] });
                            } else {
                              setNewRfqData({ ...newRfqData, selectedSuppliers: newRfqData.selectedSuppliers.filter(id => id !== s.id) });
                            }
                          }}
                        />
                        <span className="truncate">{s.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Special Instructions / Remarks</label>
                  <textarea 
                    value={newRfqData.notes}
                    onChange={e => setNewRfqData({ ...newRfqData, notes: e.target.value })}
                    className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                    rows={2}
                    placeholder="Enter any additional requirements, quality specs or delivery terms..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => setIsCreateRfqOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90"
                  >
                    Issue RFQ
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ENTER SUPPLIER QUOTATION */}
      <AnimatePresence>
        {isCreateQuoteOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">{editingQuoteId ? 'Edit Supplier Quotation' : 'Record Supplier Quotation'}</h3>
                <button onClick={() => { setIsCreateQuoteOpen(false); setEditingQuoteId(null); }} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveQuote} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Select Supplier</label>
                    <select 
                      value={newQuoteData.supplierId}
                      onChange={e => setNewQuoteData({ ...newQuoteData, supplierId: e.target.value })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                      required
                    >
                      <option value="">-- Choose Supplier --</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Supplier Quote Ref #</label>
                    <input 
                      type="text"
                      value={newQuoteData.quotationNumber}
                      onChange={e => setNewQuoteData({ ...newQuoteData, quotationNumber: e.target.value })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Validity Date</label>
                    <input 
                      type="date"
                      value={newQuoteData.validUntil}
                      onChange={e => setNewQuoteData({ ...newQuoteData, validUntil: e.target.value })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Items & Unit Prices */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Items & Quoted Unit Pricing</label>
                  {newQuoteData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 items-center">
                      <div className="col-span-5">
                        <input 
                          type="text"
                          placeholder="Item Name"
                          value={item.name}
                          onChange={e => {
                            const updated = [...newQuoteData.items];
                            updated[index].name = e.target.value;
                            setNewQuoteData({ ...newQuoteData, items: updated });
                          }}
                          className="w-full p-1.5 bg-white border border-gray-200 rounded text-xs font-bold"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input 
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={e => {
                            const updated = [...newQuoteData.items];
                            updated[index].quantity = Number(e.target.value);
                            setNewQuoteData({ ...newQuoteData, items: updated });
                          }}
                          className="w-full p-1.5 bg-white border border-gray-200 rounded text-xs font-bold"
                          required
                        />
                      </div>
                      <div className="col-span-3">
                        <input 
                          type="number"
                          placeholder="Unit Price ($)"
                          value={item.unitPrice}
                          onChange={e => {
                            const updated = [...newQuoteData.items];
                            updated[index].unitPrice = Number(e.target.value);
                            setNewQuoteData({ ...newQuoteData, items: updated });
                          }}
                          className="w-full p-1.5 bg-white border border-gray-200 rounded text-xs font-bold"
                          required
                        />
                      </div>
                      <div className="col-span-2 text-right text-xs font-bold text-gray-900">
                        {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Financial Factors */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Discount ($)</label>
                    <input 
                      type="number"
                      value={newQuoteData.discount}
                      onChange={e => setNewQuoteData({ ...newQuoteData, discount: Number(e.target.value) })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Tax Rate (%)</label>
                    <input 
                      type="number"
                      value={newQuoteData.taxRate}
                      onChange={e => setNewQuoteData({ ...newQuoteData, taxRate: Number(e.target.value) })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Freight / Shipping ($)</label>
                    <input 
                      type="number"
                      value={newQuoteData.freight}
                      onChange={e => setNewQuoteData({ ...newQuoteData, freight: Number(e.target.value) })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Other Charges ($)</label>
                    <input 
                      type="number"
                      value={newQuoteData.otherCharges}
                      onChange={e => setNewQuoteData({ ...newQuoteData, otherCharges: Number(e.target.value) })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => { setIsCreateQuoteOpen(false); setEditingQuoteId(null); }}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
                  >
                    {editingQuoteId ? 'Update & Save Quotation' : 'Save Quotation'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 3: CREATE DIRECT PURCHASE ORDER (PO) */}
      <AnimatePresence>
        {isCreatePoOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Create Direct Purchase Order (PO)</h3>
                <button onClick={() => setIsCreatePoOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateDirectPo} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">PO Type</label>
                    <select 
                      value={newPoData.type}
                      onChange={e => setNewPoData({ ...newPoData, type: e.target.value as any })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                    >
                      <option value="Material">Material (Raw Fabrics / Trims)</option>
                      <option value="Service">Outsourced Service (Stitching/Dyeing)</option>
                      <option value="Support">Support Service / Equipment</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Supplier Partner</label>
                    <select 
                      value={newPoData.supplierId}
                      onChange={e => setNewPoData({ ...newPoData, supplierId: e.target.value })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                      required
                    >
                      <option value="">-- Select Vendor --</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Expected Delivery Date</label>
                    <input 
                      type="date"
                      value={newPoData.deliveryDate}
                      onChange={e => setNewPoData({ ...newPoData, deliveryDate: e.target.value })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                      required
                    />
                  </div>
                </div>

                {/* Outsourced Service Specific Fields */}
                {newPoData.type === 'Service' && (
                  <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <Scissors size={14} /> Outsourced Service Parameters
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-purple-700 uppercase">Service Category</label>
                        <select 
                          value={newPoData.serviceDetails.serviceType}
                          onChange={e => setNewPoData({ ...newPoData, serviceDetails: { ...newPoData.serviceDetails, serviceType: e.target.value } })}
                          className="w-full mt-1 p-1.5 bg-white border border-purple-200 rounded text-xs font-bold"
                        >
                          <option value="Sewing / Assembly">Sewing / Assembly</option>
                          <option value="Custom Embroidery">Custom Embroidery</option>
                          <option value="Screen Printing">Screen Printing / Sublimation</option>
                          <option value="Garment Dyeing / Wash">Garment Dyeing / Wash</option>
                          <option value="Pattern Grading">Pattern Grading</option>
                          <option value="QA & Finishing">QA & Finishing</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-purple-700 uppercase">Installation / Flora Scope</label>
                        <input 
                          type="text"
                          value={newPoData.serviceDetails.garmentType}
                          onChange={e => setNewPoData({ ...newPoData, serviceDetails: { ...newPoData.serviceDetails, garmentType: e.target.value } })}
                          className="w-full mt-1 p-1.5 bg-white border border-purple-200 rounded text-xs"
                          placeholder="e.g. Living Wall, Moss Art, Specimen Tree"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-purple-700 uppercase">Turnaround (Days)</label>
                        <input 
                          type="number"
                          value={newPoData.serviceDetails.turnaroundDays}
                          onChange={e => setNewPoData({ ...newPoData, serviceDetails: { ...newPoData.serviceDetails, turnaroundDays: Number(e.target.value) } })}
                          className="w-full mt-1 p-1.5 bg-white border border-purple-200 rounded text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Item List */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Line Items & Pricing</label>
                    <button 
                      type="button"
                      onClick={() => setNewPoData({
                        ...newPoData,
                        items: [...newPoData.items, { materialId: '', name: '', quantity: 10, unitPrice: 0, unit: 'pcs' }]
                      })}
                      className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
                    >
                      <Plus size={12} /> Add Row
                    </button>
                  </div>

                  {newPoData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 items-center">
                      <div className="col-span-5">
                        <input 
                          type="text"
                          placeholder="Item / Service Name"
                          value={item.name}
                          onChange={e => {
                            const updated = [...newPoData.items];
                            updated[index].name = e.target.value;
                            setNewPoData({ ...newPoData, items: updated });
                          }}
                          className="w-full p-1.5 bg-white border border-gray-200 rounded text-xs font-bold"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input 
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={e => {
                            const updated = [...newPoData.items];
                            updated[index].quantity = Number(e.target.value);
                            setNewPoData({ ...newPoData, items: updated });
                          }}
                          className="w-full p-1.5 bg-white border border-gray-200 rounded text-xs font-bold"
                          required
                        />
                      </div>
                      <div className="col-span-3">
                        <input 
                          type="number"
                          placeholder="Unit Rate ($)"
                          value={item.unitPrice}
                          onChange={e => {
                            const updated = [...newPoData.items];
                            updated[index].unitPrice = Number(e.target.value);
                            setNewPoData({ ...newPoData, items: updated });
                          }}
                          className="w-full p-1.5 bg-white border border-gray-200 rounded text-xs font-bold"
                          required
                        />
                      </div>
                      <div className="col-span-2 text-right text-xs font-bold text-gray-900">
                        {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => setIsCreatePoOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
                  >
                    Issue Purchase Order
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 4: RECORD SUPPLIER PAYMENT */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Record Supplier Payment</h3>
                <button onClick={() => setIsPaymentModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRecordPaymentSubmit} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Vendor / Supplier</label>
                  <select 
                    value={paymentData.supplierId}
                    onChange={e => {
                      const sup = suppliers.find(s => s.id === e.target.value);
                      setSelectedSupplierForPayment(sup || null);
                      setPaymentData({ 
                        ...paymentData, 
                        supplierId: e.target.value,
                        amount: sup?.currentBalance || 0
                      });
                    }}
                    className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                    required
                  >
                    <option value="">-- Select Vendor --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (Balance: {formatCurrency(s.currentBalance || 0)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Payment Amount ($)</label>
                  <input 
                    type="number"
                    value={paymentData.amount}
                    onChange={e => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                    className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-black text-rose-600"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Payment Method</label>
                    <select 
                      value={paymentData.paymentMethod}
                      onChange={e => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Check">Check</option>
                      <option value="Cash">Cash</option>
                      <option value="Wire Transfer">Wire Transfer</option>
                      <option value="Credit Card">Credit Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Reference / Ref #</label>
                    <input 
                      type="text"
                      value={paymentData.referenceNumber}
                      onChange={e => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Notes / Remarks</label>
                  <textarea 
                    value={paymentData.notes}
                    onChange={e => setPaymentData({ ...paymentData, notes: e.target.value })}
                    className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 shadow-sm"
                  >
                    Confirm & Record Payment
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 5: RECEIVE GOODS & UPDATE INVENTORY */}
      <AnimatePresence>
        {selectedPoForReceive && (() => {
          // Calculate shortfalls in real-time
          const shortfalls = selectedPoForReceive.items.map((item, idx) => {
            const prevReceived = item.receivedQuantity || 0;
            const nowReceiving = itemReceiptQty[idx] !== undefined ? Math.max(0, Number(itemReceiptQty[idx])) : Math.max(0, item.quantity - prevReceived);
            const cumulative = prevReceived + nowReceiving;
            const deficit = Math.max(0, item.quantity - cumulative);
            return {
              name: item.name,
              ordered: item.quantity,
              prevReceived,
              nowReceiving,
              cumulative,
              deficit,
              unit: item.unit || 'pcs'
            };
          });

          const totalDeficitUnits = shortfalls.reduce((sum, s) => sum + s.deficit, 0);
          const hasShortfall = totalDeficitUnits > 0;

          return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl"
              >
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <PackageCheck size={18} className="text-emerald-600" /> Confirm Goods Receipt: {selectedPoForReceive.poNumber}
                    </h3>
                    <p className="text-xs text-gray-500">Vendor: {selectedPoForReceive.supplierName}</p>
                  </div>
                  <button onClick={() => setSelectedPoForReceive(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-gray-600">Enter the physical quantities received in this shipment. Available inventory stock will automatically increase upon confirmation.</p>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selectedPoForReceive.items.map((item, idx) => {
                      const sf = shortfalls[idx];
                      return (
                        <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-xs text-gray-900">{item.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                                <span>Ordered: <strong>{item.quantity} {item.unit || 'pcs'}</strong></span>
                                {sf.prevReceived > 0 && (
                                  <span className="text-blue-600">Prev. Received: <strong>{sf.prevReceived}</strong></span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-[10px] font-bold text-gray-500 uppercase">Receiving Now:</label>
                              <input 
                                type="number"
                                min={0}
                                value={itemReceiptQty[idx] !== undefined ? itemReceiptQty[idx] : Math.max(0, item.quantity - (item.receivedQuantity || 0))}
                                onChange={e => setItemReceiptQty({ ...itemReceiptQty, [idx]: Number(e.target.value) })}
                                className="w-24 p-1.5 bg-white border border-gray-300 rounded-lg font-bold text-center text-xs focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </div>

                          {/* Item Shortfall Warning */}
                          {sf.deficit > 0 && (
                            <div className="flex items-center justify-between text-[11px] font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-md border border-amber-200">
                              <span className="flex items-center gap-1">
                                <AlertCircle size={13} className="text-amber-600" /> Shortfall Detected:
                              </span>
                              <span>Deficit: {sf.deficit} {sf.unit}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* DEFICIT NOTIFICATION & RFQ WORKFLOW AUTOMATION */}
                  {hasShortfall && (
                    <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-2xl space-y-3 shadow-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                            <AlertCircle size={18} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-amber-950">
                              Delivery Shortfall Detected ({totalDeficitUnits} units total)
                            </h4>
                            <p className="text-[11px] text-amber-800">
                              The received quantity is less than the approved PO quantity.
                            </p>
                          </div>
                        </div>

                        {/* Deficit RFQ Toggle */}
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input 
                            type="checkbox" 
                            checked={autoCreateDeficitRfq} 
                            onChange={e => setAutoCreateDeficitRfq(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-amber-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                        </label>
                      </div>

                      {autoCreateDeficitRfq && (
                        <div className="space-y-2 pt-2 border-t border-amber-200/80 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-900 text-[11px] uppercase tracking-wide">Auto-Generate Replenishment RFQ</span>
                            <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                              RFQ-DEF-{selectedPoForReceive.poNumber.replace(/^PO-/, '')}
                            </span>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-amber-800 uppercase">Target Suppliers for Deficit RFQ</label>
                            <div className="grid grid-cols-2 gap-1.5 mt-1 max-h-24 overflow-y-auto p-2 bg-white/80 rounded-lg border border-amber-200">
                              {suppliers.map(s => (
                                <label key={s.id} className="flex items-center gap-1 text-[11px] text-gray-800 cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    checked={selectedDeficitSuppliers.includes(s.id)}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        setSelectedDeficitSuppliers([...selectedDeficitSuppliers, s.id]);
                                      } else {
                                        setSelectedDeficitSuppliers(selectedDeficitSuppliers.filter(id => id !== s.id));
                                      }
                                    }}
                                  />
                                  <span className="truncate">{s.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-amber-800 uppercase">Deficit RFQ Notes / Instructions</label>
                            <input 
                              type="text"
                              value={deficitRfqNotes}
                              onChange={e => setDeficitRfqNotes(e.target.value)}
                              className="w-full mt-1 p-2 bg-white border border-amber-200 rounded-lg text-xs font-medium"
                              placeholder="e.g. Urgent replacement required for factory production schedule"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                    <button 
                      onClick={() => setSelectedPoForReceive(null)}
                      className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleConfirmReceiveGoods}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
                    >
                      <PackageCheck size={14} /> 
                      {hasShortfall && autoCreateDeficitRfq 
                        ? 'Confirm Receipt & Issue Deficit RFQ' 
                        : 'Confirm & Update Inventory'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* MODAL 5.5: PO DETAILS & DEFICIT AUDIT MODAL */}
      <AnimatePresence>
        {selectedPoForDetails && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{selectedPoForDetails.poNumber} Details</h3>
                    <p className="text-xs text-gray-500">Issued to: {selectedPoForDetails.supplierName} • Date: {new Date(selectedPoForDetails.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedPoForDetails(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              {/* Status Badges Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Fulfillment Status</span>
                  <div className="mt-0.5">
                    <span className={cn(
                      "px-2 py-0.5 text-xs font-bold rounded-md inline-block",
                      selectedPoForDetails.status === 'Received' ? 'bg-emerald-100 text-emerald-800' :
                      selectedPoForDetails.status === 'Partial' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    )}>
                      {selectedPoForDetails.status === 'Partial' ? '⚠️ Partially Received' : selectedPoForDetails.status}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Payment Status</span>
                  <div className="mt-0.5">
                    <span className={cn(
                      "px-2 py-0.5 text-xs font-bold rounded-md inline-block",
                      selectedPoForDetails.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                      selectedPoForDetails.paymentStatus === 'Partial' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    )}>
                      {selectedPoForDetails.paymentStatus}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">PO Total</span>
                  <p className="text-sm font-black text-gray-900 mt-0.5">{formatCurrency(selectedPoForDetails.total)}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Linked Client Order</span>
                  <p className="text-xs font-bold text-indigo-600 mt-0.5">{selectedPoForDetails.orderNumber || 'Direct PO'}</p>
                </div>
              </div>

              {/* Linked Deficit RFQ Alert Card */}
              {(selectedPoForDetails.status === 'Partial' || selectedPoForDetails.deficitRfqNumber || selectedPoForDetails.items.some(i => (i.deficitQuantity || 0) > 0)) && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertCircle size={16} className="text-amber-600" /> Deficit & Shortfall Management
                    </span>
                    {selectedPoForDetails.deficitRfqNumber ? (
                      <span className="text-[11px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Send size={11} /> Linked RFQ: {selectedPoForDetails.deficitRfqNumber}
                      </span>
                    ) : (
                      <button 
                        onClick={() => {
                          handleCreateDeficitRfqForExistingPo(selectedPoForDetails);
                        }}
                        className="text-xs font-bold bg-amber-600 text-white px-3 py-1 rounded-lg hover:bg-amber-700 flex items-center gap-1 shadow-xs"
                      >
                        <Plus size={12} /> Issue Deficit RFQ Now
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-amber-800">
                    This order experienced a receiving deficit. You can track or issue new Requests for Quotation to fulfill the missing item count.
                  </p>
                </div>
              )}

              {/* Items Breakdown Table */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Order Line Items & Received Progress</h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 text-[10px] uppercase">
                      <tr>
                        <th className="p-2.5">Item Name</th>
                        <th className="p-2.5 text-center">Ordered</th>
                        <th className="p-2.5 text-center">Received</th>
                        <th className="p-2.5 text-center">Deficit</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                      {selectedPoForDetails.items.map((item, idx) => {
                        const rec = item.receivedQuantity !== undefined ? item.receivedQuantity : (selectedPoForDetails.status === 'Received' ? item.quantity : 0);
                        const def = item.deficitQuantity !== undefined ? item.deficitQuantity : Math.max(0, item.quantity - rec);
                        return (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="p-2.5 font-bold text-gray-900">{item.name}</td>
                            <td className="p-2.5 text-center font-bold">{item.quantity} {item.unit || 'pcs'}</td>
                            <td className="p-2.5 text-center font-bold text-emerald-600">{rec}</td>
                            <td className="p-2.5 text-center font-bold text-amber-600">
                              {def > 0 ? <span className="px-1.5 py-0.5 bg-amber-100 rounded text-amber-800">{def}</span> : '0'}
                            </td>
                            <td className="p-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="p-2.5 text-right font-bold text-gray-900">{formatCurrency(item.total || item.quantity * item.unitPrice)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <button 
                  onClick={() => {
                    setPrintingPo(selectedPoForDetails);
                  }}
                  className="px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 flex items-center gap-1.5"
                >
                  <Printer size={14} /> Print PO Document
                </button>

                <div className="flex gap-2">
                  {selectedPoForDetails.status !== 'Received' && (
                    <button 
                      onClick={() => {
                        const targetPo = selectedPoForDetails;
                        setSelectedPoForDetails(null);
                        handleOpenReceiveModal(targetPo);
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
                    >
                      <PackageCheck size={14} /> Receive Goods
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedPoForDetails(null)}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 6: EDIT SUPPLIER CREDIT TERMS */}
      <AnimatePresence>
        {isEditCreditModalOpen && selectedSupplierForEdit && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Edit Terms: {selectedSupplierForEdit.name}</h3>
                <button onClick={() => setIsEditCreditModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveSupplierTerms} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Credit Limit ($)</label>
                  <input 
                    type="number"
                    value={editSupplierData.creditLimit}
                    onChange={e => setEditSupplierData({ ...editSupplierData, creditLimit: Number(e.target.value) })}
                    className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Payment Terms</label>
                  <select 
                    value={editSupplierData.paymentTerms}
                    onChange={e => setEditSupplierData({ ...editSupplierData, paymentTerms: e.target.value })}
                    className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                    <option value="COD">Cash On Delivery (COD)</option>
                    <option value="Prepayment">Prepayment Required</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Tax ID / VAT Registration</label>
                  <input 
                    type="text"
                    value={editSupplierData.taxId}
                    onChange={e => setEditSupplierData({ ...editSupplierData, taxId: e.target.value })}
                    className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => setIsEditCreditModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90"
                  >
                    Save Terms
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 7: REGISTER / EDIT OUTSOURCED SERVICE CONTRACT */}
      <AnimatePresence>
        {isCreateServiceModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {editingServicePo ? `Edit Contract: ${editingServicePo.poNumber}` : 'Register Outsourced Service Contract'}
                    </h3>
                    <p className="text-xs text-gray-500">Flora, artificial flora, fabrication & specialized installation services</p>
                  </div>
                </div>
                <button onClick={() => setIsCreateServiceModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveServiceContractSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Specialty Partner / Service Provider</label>
                    <select 
                      value={serviceContractForm.supplierId}
                      onChange={e => {
                        const sup = suppliers.find(s => s.id === e.target.value);
                        setServiceContractForm({
                          ...serviceContractForm,
                          supplierId: e.target.value,
                          customSupplierName: sup ? sup.name : serviceContractForm.customSupplierName
                        });
                      }}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                      required
                    >
                      <option value="">-- Select Partner --</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Contract Type</label>
                    <select 
                      value={serviceContractForm.contractType}
                      onChange={e => setServiceContractForm({ ...serviceContractForm, contractType: e.target.value as any })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                    >
                      <option value="Freelance/Specialist Contract">Freelance/Specialist Contract</option>
                      <option value="Client Service Agreement">Client Service Agreement</option>
                      <option value="Strategic Partnership">Strategic Partnership Agreement</option>
                      <option value="Custom Manufacturing">Custom Manufacturing & Production</option>
                      <option value="Logistics & Fulfillment">Logistics & Overseas QC Fulfillment</option>
                      <option value="Specialized Service">Specialized Service Agreement</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Service Category</label>
                    <select 
                      value={serviceContractForm.serviceCategory}
                      onChange={e => setServiceContractForm({ ...serviceContractForm, serviceCategory: e.target.value })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                    >
                      <option value="Custom Manufacturing & Tree Fabrication">Custom Manufacturing & Tree Fabrication</option>
                      <option value="Logistics & Overseas QC Fulfillment">Logistics & Overseas QC Fulfillment</option>
                      <option value="Specialist Freelance Crew & Greenspeople">Specialist Freelance Crew & Greenspeople</option>
                      <option value="Raw Materials & Structure Fabrication">Raw Materials & Structure Fabrication</option>
                      <option value="Decor Printing & Dye Sublimation">Decor Printing & Dye Sublimation</option>
                      <option value="Plant Rental & On-Site Maintenance">Plant Rental & On-Site Maintenance</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Contract / Service Title</label>
                    <input 
                      type="text"
                      value={serviceContractForm.serviceTitle}
                      onChange={e => setServiceContractForm({ ...serviceContractForm, serviceTitle: e.target.value })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                      placeholder="e.g. Custom Ficus Tree Assembly & Flame Coating"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Detailed Scope of Work & Deliverables</label>
                  <textarea 
                    value={serviceContractForm.scopeOfWork}
                    onChange={e => setServiceContractForm({ ...serviceContractForm, scopeOfWork: e.target.value })}
                    rows={3}
                    className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                    placeholder="Describe specific tasks, materials, safety standards, and completion criteria..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Venue / Installation Site</label>
                    <input 
                      type="text"
                      value={serviceContractForm.locationOrSite}
                      onChange={e => setServiceContractForm({ ...serviceContractForm, locationOrSite: e.target.value })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium"
                      placeholder="e.g. Grand Ballroom, Hilton Hotel"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Linked Client Order / Project (Optional)</label>
                    <select 
                      value={serviceContractForm.orderId}
                      onChange={e => setServiceContractForm({ ...serviceContractForm, orderId: e.target.value })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                    >
                      <option value="">-- General Studio / Project --</option>
                      {orders.map(o => (
                        <option key={o.id} value={o.id}>{o.orderNumber} - {o.clientName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Contract Total Amount ($)</label>
                    <input 
                      type="number"
                      min={0}
                      value={serviceContractForm.totalAmount}
                      onChange={e => setServiceContractForm({ ...serviceContractForm, totalAmount: Number(e.target.value) })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-black text-gray-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Contract Start Date</label>
                    <input 
                      type="date"
                      value={serviceContractForm.startDate}
                      onChange={e => setServiceContractForm({ ...serviceContractForm, startDate: e.target.value })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Target Delivery / Handover Date</label>
                    <input 
                      type="date"
                      value={serviceContractForm.deliveryDate}
                      onChange={e => setServiceContractForm({ ...serviceContractForm, deliveryDate: e.target.value })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Payment Terms</label>
                    <select 
                      value={serviceContractForm.paymentTerms}
                      onChange={e => setServiceContractForm({ ...serviceContractForm, paymentTerms: e.target.value })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                    >
                      <option value="50% Deposit / 50% On Handover">50% Deposit / 50% On Handover</option>
                      <option value="100% Prepayment">100% Prepayment Required</option>
                      <option value="Net 30">Net 30 Days</option>
                      <option value="Net 15">Net 15 Days</option>
                      <option value="Milestone Payments">Milestone-based Payments</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Notes & Special Instructions</label>
                    <input 
                      type="text"
                      value={serviceContractForm.notes}
                      onChange={e => setServiceContractForm({ ...serviceContractForm, notes: e.target.value })}
                      className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                      placeholder="e.g. Include site cleanup, safety rigging..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => setIsCreateServiceModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm"
                  >
                    {editingServicePo ? 'Save Contract Changes' : 'Register Service Contract'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 8: OUTSOURCED SERVICE CONTRACT DETAILS */}
      <AnimatePresence>
        {selectedServicePoForDetails && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{selectedServicePoForDetails.poNumber}</h3>
                    <p className="text-xs text-gray-500">Service Partner: {selectedServicePoForDetails.supplierName}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedServicePoForDetails(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Contract Type:</span>
                    <p className="font-bold text-gray-900">{selectedServicePoForDetails.serviceDetails?.contractType || 'Specialist Contract'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Service Category:</span>
                    <p className="font-bold text-purple-700">{selectedServicePoForDetails.serviceDetails?.serviceCategory || 'Outsourced Service'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Contract Value:</span>
                    <p className="font-black text-gray-900 text-sm">{formatCurrency(selectedServicePoForDetails.total)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Payment Status:</span>
                    <p className="font-bold text-emerald-700">{selectedServicePoForDetails.paymentStatus} ({formatCurrency(selectedServicePoForDetails.paidAmount || 0)} Paid)</p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Scope of Work & Specifications:</span>
                  <p className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 font-medium leading-relaxed mt-1">
                    {selectedServicePoForDetails.serviceDetails?.scopeOfWork || selectedServicePoForDetails.notes || 'No scope specified.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Venue / Installation Location:</span>
                    <p className="font-bold text-gray-800">📍 {selectedServicePoForDetails.serviceDetails?.locationOrSite || 'Studio / Factory'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Target Completion Date:</span>
                    <p className="font-bold text-gray-800">📅 {selectedServicePoForDetails.deliveryDate || 'Flexible'}</p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Current Service Stage:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 font-extrabold rounded-full text-xs">
                      {selectedServicePoForDetails.serviceDetails?.serviceStatus || 'Contracted'}
                    </span>
                    {selectedServicePoForDetails.serviceDetails?.serviceStatus !== 'Completed' && (
                      <button 
                        onClick={() => {
                          handleAdvanceServiceStatus(selectedServicePoForDetails);
                          setSelectedServicePoForDetails(null);
                        }}
                        className="px-2.5 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700"
                      >
                        Advance to Next Stage ➔
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <button 
                  onClick={() => setPrintingPo(selectedServicePoForDetails)}
                  className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 flex items-center gap-1"
                >
                  <Printer size={14} /> Print Agreement
                </button>
                <button 
                  onClick={() => setSelectedServicePoForDetails(null)}
                  className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 9: DELETE SERVICE CONTRACT CONFIRMATION */}
      <AnimatePresence>
        {deletingServicePoId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl text-center"
            >
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl w-fit mx-auto">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Delete Service Contract?</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Are you sure you want to remove this outsourced service contract? Any unpaid balance will be removed from the supplier's balance sheet.
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <button 
                  onClick={() => setDeletingServicePoId(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteServiceContractConfirm}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 shadow-sm"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 10: QUOTATION REJECTION WITH REASON */}
      <AnimatePresence>
        {quoteRejectModalQuote && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h3 className="text-base font-bold text-gray-900">Reject Quotation</h3>
                <button onClick={() => setQuoteRejectModalQuote(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-gray-600">
                  Please provide a reason for rejecting quotation <strong>{quoteRejectModalQuote.quotationNumber || quoteRejectModalQuote.id}</strong> from {quoteRejectModalQuote.supplierName}:
                </p>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Rejection Reason</label>
                  <textarea 
                    value={quoteRejectReason}
                    onChange={e => setQuoteRejectReason(e.target.value)}
                    rows={3}
                    className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                    placeholder="e.g. Price exceeds project budget; delivery turnaround too slow..."
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button 
                    onClick={() => setQuoteRejectModalQuote(null)}
                    className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleRejectQuoteWithReasonConfirm}
                    className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 shadow-sm"
                  >
                    Reject Quotation
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 11: BULK SUPPLY LIST IMPORT (BATCH RFQ MANUAL ENTRY GRID) */}
      <AnimatePresence>
        {isBulkImportOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 rounded-xl">
                    <Grid size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                      Bulk Supply List Import Grid
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-bold border border-emerald-500/30">
                        Batch RFQ Generator
                      </span>
                    </h3>
                    <p className="text-xs text-gray-300">
                      Import multiple supply line items simultaneously via manual entry grid and create batch RFQs in one click.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsBulkImportOpen(false)} 
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Grid Control Toolbar with Real-Time Validation */}
              <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadLowStockItems}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Zap size={14} /> ⚡ Import Low-Stock Shortages
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSampleBulkRows}
                    className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileSpreadsheet size={14} className="text-emerald-600" /> Load Sample List
                  </button>
                  <button
                    type="button"
                    onClick={handleAddBulkRow}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus size={14} /> Add Row
                  </button>

                  {/* Clean Duplicates Button */}
                  {bulkGridValidation.duplicateCount > 0 && (
                    <button
                      type="button"
                      onClick={handleCleanGridDuplicates}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      🧹 Clean {bulkGridValidation.duplicateCount} Duplicate(s)
                    </button>
                  )}

                  {bulkRows.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setBulkRows([])}
                      className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-all"
                    >
                      Clear Grid
                    </button>
                  )}
                </div>

                {/* Validation Status Indicator */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 text-xs">
                  <span className="font-bold text-gray-500 text-[10px] uppercase">Grid Health:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                    ✅ {bulkGridValidation.validCount} Valid
                  </span>
                  {bulkGridValidation.duplicateCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 animate-pulse">
                      ⚠️ {bulkGridValidation.duplicateCount} Duplicates
                    </span>
                  )}
                  {bulkGridValidation.errorCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                      ❌ {bulkGridValidation.errorCount} Empty
                    </span>
                  )}
                </div>

                {/* RFQ Grouping Mode */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium">
                  <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">RFQ Generation Strategy:</span>
                  <select
                    value={bulkImportGrouping}
                    onChange={e => setBulkImportGrouping(e.target.value as any)}
                    className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
                  >
                    <option value="bySupplier">Group by Preferred Supplier (Multi-Item RFQs)</option>
                    <option value="individual">Create Separate RFQ Per Row</option>
                    <option value="consolidated">Single Master RFQ (All Items Consolidated)</option>
                  </select>
                </div>
              </div>

              {/* Editable Table Grid */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {bulkRows.length === 0 ? (
                  <div className="p-12 text-center bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
                    <Grid size={36} className="mx-auto text-gray-400 mb-2" />
                    <h4 className="text-sm font-bold text-gray-700">Grid is empty</h4>
                    <p className="text-xs text-gray-500 mb-4">Add supply rows manually or import inventory shortages with one click.</p>
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={handleLoadLowStockItems}
                        className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold"
                      >
                        Import Deficit Shortages
                      </button>
                      <button 
                        onClick={handleAddBulkRow}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                      >
                        + Add First Row
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-xs">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead className="bg-gray-100/80 text-gray-700 border-b border-gray-200 text-[10px] uppercase tracking-wider font-extrabold">
                        <tr>
                          <th className="px-3 py-2.5 w-10 text-center">#</th>
                          <th className="px-3 py-2.5 min-w-[220px]">Item / Material / Service Name *</th>
                          <th className="px-3 py-2.5 w-32">Type</th>
                          <th className="px-3 py-2.5 w-24">Qty *</th>
                          <th className="px-3 py-2.5 w-24">Unit</th>
                          <th className="px-3 py-2.5 min-w-[170px]">Preferred Supplier</th>
                          <th className="px-3 py-2.5 w-36">Deadline</th>
                          <th className="px-3 py-2.5 min-w-[180px]">Specifications / Specs</th>
                          <th className="px-3 py-2.5 w-12 text-center">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs">
                        {bulkRows.map((row, idx) => {
                          const status = bulkGridValidation.rowStatuses.find(s => s.rowId === row.id);
                          const isDup = status?.isDuplicate;
                          const isEmpty = status?.isEmpty;
                          const match = status?.systemMatch;

                          return (
                            <tr key={row.id} className={cn(
                              "transition-colors",
                              isEmpty ? "bg-rose-50/50" : isDup ? "bg-amber-50/50" : "hover:bg-indigo-50/30"
                            )}>
                              <td className="px-3 py-2 text-center font-mono font-bold text-gray-400 text-[11px]">
                                {idx + 1}
                              </td>
                              <td className="px-2 py-1.5">
                                <div className="space-y-1">
                                  <input 
                                    type="text"
                                    value={row.name}
                                    onChange={e => handleUpdateBulkRow(row.id, 'name', e.target.value)}
                                    placeholder="e.g. Preserved Cushion Moss 10kg"
                                    className={cn(
                                      "w-full px-2 py-1.5 bg-white border rounded-lg text-xs font-bold focus:outline-none transition-all",
                                      isEmpty ? "border-rose-400 focus:border-rose-600" : isDup ? "border-amber-400 focus:border-amber-600 text-amber-950" : "border-gray-200 focus:border-indigo-500 text-gray-900"
                                    )}
                                  />
                                  {isDup && (
                                    <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200 flex items-center gap-1">
                                      ⚠️ Duplicate Item Name in Grid
                                    </span>
                                  )}
                                  {isEmpty && (
                                    <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded border border-rose-200 flex items-center gap-1">
                                      ❌ Required item name missing
                                    </span>
                                  )}
                                  {match && !isDup && !isEmpty && (
                                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-1">
                                      ✅ System {match.type} Match ({match.id})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-1.5">
                                <select 
                                  value={row.type}
                                  onChange={e => handleUpdateBulkRow(row.id, 'type', e.target.value)}
                                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500"
                                >
                                  <option value="Material">Material</option>
                                  <option value="Product">Product</option>
                                  <option value="Service">Service</option>
                                  <option value="Support">Support</option>
                                </select>
                              </td>
                              <td className="px-2 py-1.5">
                                <input 
                                  type="number"
                                  min={1}
                                  value={row.quantity}
                                  onChange={e => handleUpdateBulkRow(row.id, 'quantity', Math.max(1, Number(e.target.value)))}
                                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-black font-mono focus:outline-none focus:border-indigo-500"
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input 
                                  type="text"
                                  value={row.unit}
                                  onChange={e => handleUpdateBulkRow(row.id, 'unit', e.target.value)}
                                  placeholder="pcs / m / kg"
                                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500"
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <select 
                                  value={row.preferredSupplierId}
                                  onChange={e => handleUpdateBulkRow(row.id, 'preferredSupplierId', e.target.value)}
                                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500"
                                >
                                  <option value="">-- General Sourcing --</option>
                                  {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-2 py-1.5">
                                <input 
                                  type="date"
                                  value={row.deadline}
                                  onChange={e => handleUpdateBulkRow(row.id, 'deadline', e.target.value)}
                                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500"
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input 
                                  type="text"
                                  value={row.specs}
                                  onChange={e => handleUpdateBulkRow(row.id, 'specs', e.target.value)}
                                  placeholder="Color, grade, specs..."
                                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:border-indigo-500"
                                />
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBulkRow(row.id)}
                                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Delete Row"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="font-bold text-gray-900 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-2xs font-mono">
                    {bulkRows.filter(r => r.name.trim()).length} Items Ready
                  </span>
                  <span>•</span>
                  <span className="text-indigo-700 font-semibold">
                    Strategy: {bulkImportGrouping === 'bySupplier' ? 'Grouped by Supplier' : bulkImportGrouping === 'individual' ? '1 RFQ per Row' : 'Single Consolidated RFQ'}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsBulkImportOpen(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateBulkRfqs}
                    disabled={bulkRows.filter(r => r.name.trim()).length === 0}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle2 size={16} /> Create All RFQs Simultaneously
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 12: 5-STAR SUPPLIER PERFORMANCE RATING */}
      <AnimatePresence>
        {isRateSupplierOpen && selectedSupplierForRating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-gray-100"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                    <Star size={18} className="fill-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Rate Supplier Performance</h3>
                    <p className="text-xs text-gray-500 font-medium">{selectedSupplierForRating.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsRateSupplierOpen(false)} 
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitSupplierRating} className="space-y-4">
                {/* Interactive Star Rating Picker */}
                <div className="text-center space-y-2 bg-gradient-to-b from-amber-50/60 to-orange-50/40 p-4 rounded-xl border border-amber-200/50">
                  <label className="text-xs font-extrabold text-amber-900 uppercase tracking-wider block">
                    Overall Fulfillment Rating *
                  </label>
                  <div className="flex justify-center py-1">
                    <StarRatingPicker 
                      value={ratingScore} 
                      onChange={setRatingScore} 
                      size={24} 
                    />
                  </div>
                </div>

                {/* Sub category sliders */}
                <div className="space-y-3 bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-gray-700">
                      <span>Material Quality Grade:</span>
                      <span className="font-mono text-indigo-700">{ratingAspects.quality}/5</span>
                    </div>
                    <input 
                      type="range" 
                      min={1} 
                      max={5} 
                      value={ratingAspects.quality} 
                      onChange={e => setRatingAspects(prev => ({ ...prev, quality: Number(e.target.value) }))}
                      className="w-full accent-indigo-600" 
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-gray-700">
                      <span>Delivery Speed & Lead Time SLA:</span>
                      <span className="font-mono text-emerald-700">{ratingAspects.deliveryTime}/5</span>
                    </div>
                    <input 
                      type="range" 
                      min={1} 
                      max={5} 
                      value={ratingAspects.deliveryTime} 
                      onChange={e => setRatingAspects(prev => ({ ...prev, deliveryTime: Number(e.target.value) }))}
                      className="w-full accent-emerald-600" 
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-gray-700">
                      <span>Price Competitiveness:</span>
                      <span className="font-mono text-amber-700">{ratingAspects.pricing}/5</span>
                    </div>
                    <input 
                      type="range" 
                      min={1} 
                      max={5} 
                      value={ratingAspects.pricing} 
                      onChange={e => setRatingAspects(prev => ({ ...prev, pricing: Number(e.target.value) }))}
                      className="w-full accent-amber-600" 
                    />
                  </div>
                </div>

                {/* Review Comment */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Fulfillment Notes / Performance Comment</label>
                  <textarea 
                    value={ratingComment}
                    onChange={e => setRatingComment(e.target.value)}
                    rows={3}
                    className="w-full mt-1 p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Orders delivered 2 days ahead of SLA; pristine fabric weave quality."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={() => setIsRateSupplierOpen(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Star size={14} className="fill-white" /> Submit 5-Star Rating
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRINT RFQ PORTAL MODAL */}
      {printingRfq && (
        <PrintPortal isOpen={!!printingRfq} title={`RFQ-${printingRfq.rfqNumber}`} onClose={() => setPrintingRfq(null)}>
          <RfqPrintView rfq={printingRfq} settings={companySettings} suppliers={suppliers} />
        </PrintPortal>
      )}

      {/* PRINT PO PORTAL MODAL */}
      {printingPo && (
        <PrintPortal isOpen={!!printingPo} title={`PO-${printingPo.poNumber}`} onClose={() => setPrintingPo(null)}>
          <PoPrintView po={printingPo} settings={companySettings} suppliers={suppliers} />
        </PrintPortal>
      )}

      {/* MONTHLY MANAGEMENT REVIEW REPORT MODAL */}
      <ProcurementReportModal
        isOpen={isManagementReportOpen}
        onClose={() => setIsManagementReportOpen(false)}
        companySettings={companySettings}
        suppliers={suppliers}
        procurementOrders={procurementOrders}
        rfqs={rfqs}
        materials={materials}
        finishedProducts={finishedProducts}
        onAddAuditLog={onAddAuditLog}
      />
    </div>
  );
}
