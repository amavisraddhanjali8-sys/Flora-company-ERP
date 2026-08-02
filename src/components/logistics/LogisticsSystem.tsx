import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  Navigation, 
  MapPin, 
  ShieldCheck, 
  MessageSquare, 
  MoreVertical,
  Calendar,
  ExternalLink,
  ClipboardCheck,
  Wrench,
  BarChart3,
  RotateCcw,
  DollarSign,
  X,
  FileText,
  Printer,
  Eye,
  Check,
  Edit2,
  Trash2,
  AlertTriangle,
  UserCheck,
  Activity,
  RefreshCw,
  FileCheck,
  Layers,
  Box,
  CornerUpLeft,
  ArrowDownLeft,
  Send
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
  Legend
} from 'recharts';
import { cn, formatCurrency } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Order, 
  Delivery, 
  Vehicle, 
  AssetEquipment,
  DefectItem,
  QualityInspection,
  AfterSalesRecord, 
  TransportType,
  ProcurementOrder,
  Material,
  FinishedProduct,
  Supplier,
  Client,
  Invoice,
  Transaction,
  CompanySettings
} from '../../types';
import { translations, Language } from '../../i18n';

interface LogisticsSystemProps {
  orders: Order[];
  onUpdateOrders: (orders: Order[]) => void;
  procurementOrders?: ProcurementOrder[];
  onUpdateProcurementOrders?: (pos: ProcurementOrder[]) => void;
  materials?: Material[];
  onUpdateMaterials?: (materials: Material[]) => void;
  finishedProducts?: FinishedProduct[];
  onUpdateFinishedProducts?: (products: FinishedProduct[]) => void;
  suppliers?: Supplier[];
  onUpdateSuppliers?: (suppliers: Supplier[]) => void;
  clients?: Client[];
  invoices?: Invoice[];
  onUpdateInvoices?: (invoices: Invoice[]) => void;
  transactions?: Transaction[];
  onUpdateTransactions?: (transactions: Transaction[]) => void;
  onAddAuditLog?: (action: string, details: string, category: any, type?: any) => void;
  companySettings?: CompanySettings;
  language?: Language;
}

type LogisticsTab = 'tracking' | 'fleet' | 'quality' | 'after-sales' | 'reports';

const TRANSPORT_TYPES: TransportType[] = ['Courier', 'Own Vehicle', 'Third Party', 'Partner'];

export default function LogisticsSystem({ 
  orders, 
  onUpdateOrders,
  procurementOrders = [],
  onUpdateProcurementOrders,
  materials = [],
  onUpdateMaterials,
  finishedProducts = [],
  onUpdateFinishedProducts,
  suppliers = [],
  onUpdateSuppliers,
  clients = [],
  invoices = [],
  onUpdateInvoices,
  transactions = [],
  onUpdateTransactions,
  onAddAuditLog,
  companySettings,
  language = 'en' 
}: LogisticsSystemProps) {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<LogisticsTab>('tracking');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // Fleet & Asset State
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: 'v1', plateNumber: 'LOG-101', type: 'Van (1.5T)', status: 'Available', driver: 'Ahmed Nisar', mileage: 14200, fuelLevel: '85%', capacity: '1,500 kg', lastServiceDate: '2026-07-10', nextServiceDate: '2026-10-10' },
    { id: 'v2', plateNumber: 'LOG-202', type: 'Truck (5.0T)', status: 'On Delivery', driver: 'Kamal Perera', mileage: 38900, fuelLevel: '60%', capacity: '5,000 kg', lastServiceDate: '2026-06-15', nextServiceDate: '2026-09-15' },
    { id: 'v3', plateNumber: 'LOG-303', type: 'Motorcycle Express', status: 'Available', driver: 'Saman Silva', mileage: 8400, fuelLevel: '95%', capacity: '50 kg', lastServiceDate: '2026-07-20', nextServiceDate: '2026-08-20' }
  ]);

  const [assets, setAssets] = useState<AssetEquipment[]>([
    { id: 'a1', assetNumber: 'AST-W01', name: 'Zebra Wireless Barcode Scanner', category: 'Warehouse Equipment', condition: 'Optimal', assignedTo: 'Dispatch Dock A', lastInspectionDate: '2026-07-28' },
    { id: 'a2', assetNumber: 'AST-W02', name: 'Hydraulic Pallet Jack 2.5T', category: 'Warehouse Equipment', condition: 'Optimal', assignedTo: 'Warehouse Floor', lastInspectionDate: '2026-07-15' },
    { id: 'a3', assetNumber: 'AST-F01', name: 'Thermal Receipt & Shipping Label Printer', category: 'Printing/POS Hardware', condition: 'Optimal', assignedTo: 'Packing Station 1', lastInspectionDate: '2026-07-30' },
    { id: 'a4', assetNumber: 'AST-F02', name: 'Digital Textile Fabric Density Gauge', category: 'Testing Device', condition: 'Optimal', assignedTo: 'QC Lab', lastInspectionDate: '2026-07-25' }
  ]);

  // Quality Control & Inspection State
  const [qualityInspections, setQualityInspections] = useState<QualityInspection[]>([
    {
      id: 'qc-001',
      inspectionNumber: 'QC-2026-001',
      date: new Date().toISOString().split('T')[0],
      type: 'Procurement PO Receipt',
      referenceId: procurementOrders[0]?.id || 'po-1',
      referenceNumber: procurementOrders[0]?.poNumber || 'PO-2026-101',
      entityName: procurementOrders[0]?.supplierName || 'GreenLeaf Botanical Nurseries',
      inspectorName: 'Chief Horticulturist - Suneth',
      overallStatus: 'Passed with Defects',
      defectsFound: true,
      resolutionStatus: 'Return Processed',
      actionTaken: 'Defective batch returned to supplier; Debit note issued',
      refundAmount: 450,
      defectItems: [
        {
          itemId: 'mat1',
          itemName: 'Preserved Emerald Cushion Moss (Kg)',
          orderedQty: 50,
          defectiveQty: 5,
          passedQty: 45,
          defectReason: 'Foliage Discoloration / Moisture Damage',
          defectSeverity: 'Major',
          diagnosticNotes: 'Excessive moisture in 5kg batch causing shade unevenness.',
          recommendedAction: 'Return to Supplier'
        }
      ]
    }
  ]);

  // After Sales State
  const [afterSalesRecords, setAfterSalesRecords] = useState<AfterSalesRecord[]>([
    {
      id: 'as-001',
      ticketNumber: 'TK-2026-0801',
      orderNumber: orders[0]?.orderNumber || 'ORD-1001',
      clientId: orders[0]?.clientId || 'c1',
      clientName: orders[0]?.clientName || 'Apex Corporation',
      date: '2026-07-29',
      type: 'Defect Return',
      details: 'Client reported 5 custom printed polo shirts had misaligned embroidery logo.',
      defectDiagnosis: 'Digitizing alignment offset on size XL garments during 2nd shift run.',
      status: 'Resolved',
      resolutionAction: 'Issue Refund',
      refundAmount: 250
    }
  ]);

  // Modals State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<Order | null>(null);
  const [dispatchForm, setDispatchForm] = useState({
    transportType: 'Own Vehicle' as TransportType,
    courierName: '',
    trackingNumber: '',
    vehicleId: '',
    driverName: '',
    deliveryAddress: '',
    expectedDate: '',
    notes: ''
  });

  // Quality Check Modal State
  const [isQCModalOpen, setIsQCModalOpen] = useState(false);
  const [selectedItemForQC, setSelectedItemForQC] = useState<{
    type: 'Procurement PO Receipt' | 'Customer Order Fulfillment';
    referenceId: string;
    referenceNumber: string;
    entityName: string;
    items: { id: string; name: string; quantity: number; unitPrice: number }[];
  } | null>(null);

  const [qcForm, setQcForm] = useState<{
    inspectorName: string;
    itemResults: {
      [itemId: string]: {
        defectiveQty: number;
        defectReason: string;
        defectSeverity: 'Minor' | 'Major' | 'Critical';
        diagnosticNotes: string;
        recommendedAction: 'Return to Supplier' | 'Return to Warehouse' | 'Scrap' | 'Reprocess/Repair' | 'Customer Refund';
      }
    };
    processRefund: boolean;
    refundAmount: number;
    actionNotes: string;
  }>({
    inspectorName: 'Chief Quality Officer',
    itemResults: {},
    processRefund: true,
    refundAmount: 0,
    actionNotes: ''
  });

  // Vehicle Modal State
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    plateNumber: '',
    type: 'Van',
    driver: '',
    capacity: '1,000 kg',
    mileage: 0,
    fuelLevel: '100%'
  });

  // Asset Modal State
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetForm, setAssetForm] = useState({
    assetNumber: '',
    name: '',
    category: 'Warehouse Equipment' as AssetEquipment['category'],
    assignedTo: '',
    condition: 'Optimal' as AssetEquipment['condition']
  });

  // After Sales Modal State
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    orderNumber: '',
    clientName: '',
    type: 'Defect Return' as AfterSalesRecord['type'],
    details: '',
    defectDiagnosis: '',
    resolutionAction: 'Issue Refund' as AfterSalesRecord['resolutionAction'],
    refundAmount: 0
  });

  // Print Delivery Note State
  const [selectedDeliveryNote, setSelectedDeliveryNote] = useState<Order | null>(null);

  // Quick Statistics calculation
  const stats = useMemo(() => {
    const pendingOrders = orders.filter(o => o.status === 'Confirmed' || o.status === 'Processing' || o.status === 'Ready').length;
    const inTransit = orders.filter(o => o.status === 'Shipped').length;
    const delivered = orders.filter(o => o.status === 'Delivered').length;
    const qcPending = procurementOrders.filter(po => po.status === 'Received' || po.status === 'Sent' || po.status === 'Partial').length + pendingOrders;
    
    return {
      pending: pendingOrders,
      inTransit,
      delivered,
      qcPending,
      totalVehicles: vehicles.length,
      availableVehicles: vehicles.filter(v => v.status === 'Available').length,
      totalDefectReturns: qualityInspections.filter(q => q.defectsFound).length + afterSalesRecords.filter(a => a.type === 'Defect Return').length,
      totalRefundsAmount: qualityInspections.reduce((sum, q) => sum + (q.refundAmount || 0), 0) + afterSalesRecords.reduce((sum, a) => sum + (a.refundAmount || 0), 0)
    };
  }, [orders, procurementOrders, vehicles, qualityInspections, afterSalesRecords]);

  // Filtered Orders for Order Fulfillment tab
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (statusFilter === 'All') return matchesSearch;
      return matchesSearch && o.status === statusFilter;
    });
  }, [orders, searchQuery, statusFilter]);

  // Dispatch Order Handler
  const handleOpenDispatch = (order: Order) => {
    setSelectedOrderForDispatch(order);
    setDispatchForm({
      transportType: 'Own Vehicle',
      courierName: '',
      trackingNumber: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      vehicleId: vehicles.find(v => v.status === 'Available')?.id || '',
      driverName: vehicles.find(v => v.status === 'Available')?.driver || '',
      deliveryAddress: clients.find(c => c.id === order.clientId)?.address || 'Client Address, Main City',
      expectedDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      notes: ''
    });
    setIsDispatchModalOpen(true);
  };

  const handleConfirmDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForDispatch) return;

    const assignedVeh = vehicles.find(v => v.id === dispatchForm.vehicleId);

    const updatedOrder: Order = {
      ...selectedOrderForDispatch,
      status: 'Shipped',
      expectedDeliveryDate: dispatchForm.expectedDate,
      notes: `${selectedOrderForDispatch.notes || ''}\n[Dispatched via ${dispatchForm.transportType} | Tracking: ${dispatchForm.trackingNumber}]`
    };

    onUpdateOrders(orders.map(o => o.id === selectedOrderForDispatch.id ? updatedOrder : o));

    // Update vehicle status if own vehicle
    if (assignedVeh && dispatchForm.transportType === 'Own Vehicle') {
      setVehicles(vehicles.map(v => v.id === assignedVeh.id ? { ...v, status: 'On Delivery' } : v));
    }

    onAddAuditLog?.('Order Dispatched', `Order #${selectedOrderForDispatch.orderNumber} dispatched via ${dispatchForm.transportType} (Tracking: ${dispatchForm.trackingNumber})`, 'logistics', 'info');
    showNotification('success', `Order #${selectedOrderForDispatch.orderNumber} successfully dispatched for delivery!`);
    setIsDispatchModalOpen(false);
  };

  // Mark Delivery Status
  const handleUpdateDeliveryStatus = (order: Order, newStatus: Order['status']) => {
    const updatedOrder = { ...order, status: newStatus };
    onUpdateOrders(orders.map(o => o.id === order.id ? updatedOrder : o));
    onAddAuditLog?.('Delivery Status Updated', `Order #${order.orderNumber} status changed to ${newStatus}`, 'logistics', 'info');
    showNotification('info', `Order #${order.orderNumber} marked as ${newStatus}`);
  };

  // Open Quality Check for Procurement PO or Customer Order
  const handleOpenQCForPO = (po: ProcurementOrder) => {
    setSelectedItemForQC({
      type: 'Procurement PO Receipt',
      referenceId: po.id,
      referenceNumber: po.poNumber,
      entityName: po.supplierName,
      items: po.items.map((item, idx) => ({ id: item.materialId || `po-item-${idx}`, name: item.name, quantity: item.quantity, unitPrice: item.unitPrice }))
    });

    const initialItemResults: any = {};
    po.items.forEach((item, idx) => {
      const itemId = item.materialId || `po-item-${idx}`;
      initialItemResults[itemId] = {
        defectiveQty: 0,
        defectReason: 'Fabric Flaw / Tear',
        defectSeverity: 'Minor',
        diagnosticNotes: '',
        recommendedAction: 'Return to Supplier'
      };
    });

    setQcForm({
      inspectorName: 'Quality Inspector - Lead',
      itemResults: initialItemResults,
      processRefund: true,
      refundAmount: 0,
      actionNotes: ''
    });
    setIsQCModalOpen(true);
  };

  const handleOpenQCForOrder = (order: Order) => {
    setSelectedItemForQC({
      type: 'Customer Order Fulfillment',
      referenceId: order.id,
      referenceNumber: order.orderNumber,
      entityName: order.clientName,
      items: order.items.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, unitPrice: item.price }))
    });

    const initialItemResults: any = {};
    order.items.forEach(item => {
      initialItemResults[item.id] = {
        defectiveQty: 0,
        defectReason: 'Damaged in transit',
        defectSeverity: 'Minor',
        diagnosticNotes: '',
        recommendedAction: 'Customer Refund'
      };
    });

    setQcForm({
      inspectorName: 'Fulfillment QC Manager',
      itemResults: initialItemResults,
      processRefund: true,
      refundAmount: 0,
      actionNotes: ''
    });
    setIsQCModalOpen(true);
  };

  // Submit Quality Inspection & Execute Returns / Refunds
  const handleSubmitQC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForQC) return;

    const defectItemsList: DefectItem[] = [];
    let totalDefectVal = 0;

    selectedItemForQC.items.forEach(item => {
      const res = qcForm.itemResults[item.id];
      if (res && res.defectiveQty > 0) {
        defectItemsList.push({
          itemId: item.id,
          itemName: item.name,
          orderedQty: item.quantity,
          defectiveQty: res.defectiveQty,
          passedQty: item.quantity - res.defectiveQty,
          defectReason: res.defectReason,
          defectSeverity: res.defectSeverity,
          diagnosticNotes: res.diagnosticNotes,
          recommendedAction: res.recommendedAction
        });
        totalDefectVal += (res.defectiveQty * item.unitPrice);
      }
    });

    const defectsFound = defectItemsList.length > 0;
    const refundToProcess = qcForm.processRefund ? (qcForm.refundAmount > 0 ? qcForm.refundAmount : totalDefectVal) : 0;

    const newInspection: QualityInspection = {
      id: `qc-${Date.now()}`,
      inspectionNumber: `QC-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      type: selectedItemForQC.type,
      referenceId: selectedItemForQC.referenceId,
      referenceNumber: selectedItemForQC.referenceNumber,
      entityName: selectedItemForQC.entityName,
      inspectorName: qcForm.inspectorName,
      overallStatus: !defectsFound ? 'Passed' : totalDefectVal >= (selectedItemForQC.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0) * 0.8) ? 'Rejected / Defective' : 'Passed with Defects',
      defectsFound,
      defectItems: defectItemsList,
      resolutionStatus: defectsFound ? (refundToProcess > 0 ? 'Refund Issued' : 'Return Processed') : 'Resolved',
      actionTaken: defectsFound ? `Defects diagnosed. ${defectItemsList.map(d => `${d.itemName} (${d.defectiveQty} defective: ${d.defectReason})`).join(', ')}.` : '100% Quality Pass confirmed.',
      refundAmount: refundToProcess
    };

    setQualityInspections([newInspection, ...qualityInspections]);

    // Executing Defects & Returns Dependencies across Portals
    if (defectsFound) {
      if (selectedItemForQC.type === 'Procurement PO Receipt') {
        // 1. Stock Inventory Return Adjustment: Reduce Raw Materials / Stock
        if (onUpdateMaterials && materials.length > 0) {
          const updatedMaterials = materials.map(mat => {
            const defective = defectItemsList.find(d => d.itemId === mat.id || mat.name.toLowerCase().includes(d.itemName.toLowerCase()));
            if (defective) {
              return { ...mat, stock: Math.max(0, mat.stock - defective.defectiveQty) };
            }
            return mat;
          });
          onUpdateMaterials(updatedMaterials);
        }

        // 2. Financial Return & Accounting Sync: Process Supplier Refund / Debit Note
        if (refundToProcess > 0) {
          // Add Supplier Refund Transaction
          const supplierObj = suppliers.find(s => s.name === selectedItemForQC.entityName);
          const refundTx: Transaction = {
            id: `TRX-REF-SUP-${Date.now()}`,
            type: 'Income',
            category: 'Supplier Return Refund',
            amount: refundToProcess,
            date: new Date().toISOString(),
            description: `Supplier Return Debit Refund for ${selectedItemForQC.referenceNumber} (${selectedItemForQC.entityName})`,
            paymentMethod: 'Bank Transfer',
            referenceId: newInspection.id,
            supplierId: supplierObj?.id,
            supplierName: selectedItemForQC.entityName,
            status: 'Completed'
          };
          onUpdateTransactions?.([refundTx, ...transactions]);

          // Update Supplier Balance
          if (supplierObj && onUpdateSuppliers) {
            onUpdateSuppliers(suppliers.map(s => s.id === supplierObj.id ? { ...s, currentBalance: Math.max(0, s.currentBalance - refundToProcess) } : s));
          }

          // Create Credit Note in Invoice Portal
          if (onUpdateInvoices) {
            const creditInv: Invoice = {
              id: `inv-cn-${Date.now()}`,
              invoiceNumber: `CN-SUP-${selectedItemForQC.referenceNumber}`,
              isSupplierInvoice: true,
              type: 'Supplier',
              clientId: supplierObj?.id || `sup-${Date.now()}`,
              clientName: selectedItemForQC.entityName,
              date: new Date().toISOString().split('T')[0],
              dueDate: new Date().toISOString().split('T')[0],
              items: defectItemsList.map(d => ({
                id: d.itemId,
                name: `RETURN: ${d.itemName} (${d.defectReason})`,
                price: refundToProcess,
                costPrice: refundToProcess,
                quantity: d.defectiveQty,
                category: 'Defect Return',
                stock: 0,
                minStock: 0,
                description: d.diagnosticNotes || d.defectReason
              })),
              subtotal: refundToProcess,
              tax: 0,
              taxRate: 0,
              discount: 0,
              discountRate: 0,
              freight: 0,
              otherCharges: 0,
              total: refundToProcess,
              amountPaid: refundToProcess,
              balance: 0,
              status: 'Paid',
              terms: [],
              notes: `Credit Note / Debit Refund for Returned Defective PO ${selectedItemForQC.referenceNumber}`
            };
            onUpdateInvoices([creditInv, ...invoices]);
          }
        }

        onAddAuditLog?.('Supplier Goods Return', `Diagnosed defects on PO #${selectedItemForQC.referenceNumber}. Returned defective goods & issued ${formatCurrency(refundToProcess, companySettings?.currency)} refund.`, 'logistics', 'warning');
        showNotification('success', `Quality Check completed! Returned defective goods to supplier and logged ${formatCurrency(refundToProcess, companySettings?.currency)} refund in Accounting!`);
      } else {
        // Customer Order Fulfillment Defect
        if (refundToProcess > 0) {
          const clientObj = clients.find(c => c.name === selectedItemForQC.entityName);
          const refundTx: Transaction = {
            id: `TRX-REF-CUST-${Date.now()}`,
            type: 'Expense',
            category: 'Customer Defect Refund',
            amount: refundToProcess,
            date: new Date().toISOString(),
            description: `Customer Defect Refund for Order ${selectedItemForQC.referenceNumber} (${selectedItemForQC.entityName})`,
            paymentMethod: 'Cash',
            referenceId: newInspection.id,
            clientId: clientObj?.id,
            clientName: selectedItemForQC.entityName,
            status: 'Completed'
          };
          onUpdateTransactions?.([refundTx, ...transactions]);

          // Update Order Status
          const ord = orders.find(o => o.id === selectedItemForQC.referenceId);
          if (ord) {
            onUpdateOrders(orders.map(o => o.id === ord.id ? { ...o, status: 'Processing', notes: `${o.notes || ''}\n[QC Defect Return: Refunded ${formatCurrency(refundToProcess, companySettings?.currency)}]` } : o));
          }
        }

        onAddAuditLog?.('Customer Goods Return', `Diagnosed customer order defect on Order #${selectedItemForQC.referenceNumber}. Processed return & refund.`, 'logistics', 'warning');
        showNotification('success', `Customer Quality Check logged! Defective goods returned and refund of ${formatCurrency(refundToProcess, companySettings?.currency)} posted!`);
      }
    } else {
      showNotification('success', `100% Quality Pass confirmed for ${selectedItemForQC.referenceNumber}! Ready for dispatch.`);
    }

    setIsQCModalOpen(false);
  };

  // Add Fleet Vehicle
  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const newVeh: Vehicle = {
      id: `v-${Date.now()}`,
      plateNumber: vehicleForm.plateNumber.toUpperCase(),
      type: vehicleForm.type,
      driver: vehicleForm.driver || 'Unassigned',
      status: 'Available',
      mileage: Number(vehicleForm.mileage) || 0,
      fuelLevel: vehicleForm.fuelLevel,
      capacity: vehicleForm.capacity,
      lastServiceDate: new Date().toISOString().split('T')[0],
      nextServiceDate: new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0]
    };
    setVehicles([...vehicles, newVeh]);
    setIsVehicleModalOpen(false);
    showNotification('success', `Vehicle ${newVeh.plateNumber} added to fleet!`);
  };

  // Add Asset Equipment
  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const newAsset: AssetEquipment = {
      id: `a-${Date.now()}`,
      assetNumber: assetForm.assetNumber.toUpperCase() || `AST-${Date.now().toString().slice(-4)}`,
      name: assetForm.name,
      category: assetForm.category,
      condition: assetForm.condition,
      assignedTo: assetForm.assignedTo || 'General Warehouse',
      lastInspectionDate: new Date().toISOString().split('T')[0]
    };
    setAssets([...assets, newAsset]);
    setIsAssetModalOpen(false);
    showNotification('success', `Asset ${newAsset.name} registered!`);
  };

  // Create After Sales Ticket
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const newRec: AfterSalesRecord = {
      id: `as-${Date.now()}`,
      ticketNumber: `TK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      orderNumber: ticketForm.orderNumber,
      clientName: ticketForm.clientName,
      date: new Date().toISOString().split('T')[0],
      type: ticketForm.type,
      details: ticketForm.details,
      defectDiagnosis: ticketForm.defectDiagnosis,
      status: ticketForm.resolutionAction === 'Issue Refund' ? 'Refunded' : 'In Progress',
      resolutionAction: ticketForm.resolutionAction,
      refundAmount: Number(ticketForm.refundAmount) || 0
    };

    setAfterSalesRecords([newRec, ...afterSalesRecords]);

    // If Issue Refund selected in Ticket, record in Accounting & Transactions
    if (ticketForm.resolutionAction === 'Issue Refund' && Number(ticketForm.refundAmount) > 0) {
      const refundVal = Number(ticketForm.refundAmount);
      const refundTx: Transaction = {
        id: `TRX-TK-REF-${Date.now()}`,
        type: 'Expense',
        category: 'After-Sales Defect Refund',
        amount: refundVal,
        date: new Date().toISOString(),
        description: `After-Sales Refund for Ticket ${newRec.ticketNumber} (${ticketForm.clientName} - Order ${ticketForm.orderNumber})`,
        paymentMethod: 'Cash',
        clientName: ticketForm.clientName,
        status: 'Completed'
      };
      onUpdateTransactions?.([refundTx, ...transactions]);

      onAddAuditLog?.('After Sales Refund Issued', `Ticket ${newRec.ticketNumber} resolved with ${formatCurrency(refundVal, companySettings?.currency)} refund to ${ticketForm.clientName}`, 'logistics', 'warning');
      showNotification('success', `After-Sales Ticket logged and ${formatCurrency(refundVal, companySettings?.currency)} refund posted to Accounting!`);
    } else {
      showNotification('success', `Ticket ${newRec.ticketNumber} successfully opened!`);
    }

    setIsTicketModalOpen(false);
  };

  return (
    <div className="flex-1 bg-gray-50 p-4 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-4">

        {/* Floating Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border text-xs font-bold",
                notification.type === 'success' ? "bg-emerald-600 text-white border-emerald-500" :
                notification.type === 'error' ? "bg-rose-600 text-white border-rose-500" :
                "bg-blue-600 text-white border-blue-500"
              )}
            >
              <CheckCircle2 size={16} />
              <span>{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="text-primary" size={24} /> Logistics & Fulfillment Portal
            </h1>
            <p className="text-xs text-gray-500">End-to-end delivery tracking, fleet assets, quality control & defect returns</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => {
                const poToInspect = procurementOrders[0];
                if (poToInspect) handleOpenQCForPO(poToInspect);
                else showNotification('info', 'No procurement orders available for inspection.');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 shadow-sm transition-all"
            >
              <ClipboardCheck size={15} className="text-blue-600" /> Inspect PO Materials
            </button>
            <button 
              onClick={() => {
                const ordToInspect = orders.find(o => o.status === 'Ready' || o.status === 'Processing' || o.status === 'Confirmed');
                if (ordToInspect) handleOpenQCForOrder(ordToInspect);
                else showNotification('info', 'No active customer orders ready for quality check.');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold hover:bg-amber-100 shadow-sm transition-all"
            >
              <ShieldCheck size={15} className="text-amber-600" /> Inspect Customer Goods
            </button>
            <button 
              onClick={() => {
                const readyOrd = orders.find(o => o.status === 'Ready' || o.status === 'Processing');
                if (readyOrd) handleOpenDispatch(readyOrd);
                else showNotification('info', 'Please select an order from fulfillment table below to dispatch.');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
            >
              <Send size={15} /> Quick Dispatch Order
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Orders Pending Issuance', value: stats.pending, sub: 'Ready for fulfillment', icon: Package, color: 'bg-blue-500', badge: 'Live' },
            { label: 'Currently In Transit', value: stats.inTransit, sub: 'Active deliveries', icon: Truck, color: 'bg-amber-500', badge: 'In Motion' },
            { label: 'Defect Returns & Issues', value: stats.totalDefectReturns, sub: `${formatCurrency(stats.totalRefundsAmount, companySettings?.currency)} refunded`, icon: RotateCcw, color: 'bg-rose-500', badge: 'Actioned' },
            { label: 'Available Fleet & Assets', value: `${stats.availableVehicles}/${stats.totalVehicles} Vehicles`, sub: `${assets.length} Equipment units`, icon: Wrench, color: 'bg-emerald-500', badge: 'Ready' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className={cn("p-2 rounded-xl text-white shadow-sm", stat.color)}>
                  <stat.icon size={18} />
                </div>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{stat.badge}</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-xl font-bold text-gray-900 mt-0.5">{stat.value}</h3>
                <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 sm:gap-6 border-b border-gray-200 overflow-x-auto pb-0">
          {[
            { id: 'tracking', label: 'Order Fulfillment & Dispatch', icon: Navigation },
            { id: 'fleet', label: 'Fleet & Asset Equipment', icon: Truck },
            { id: 'quality', label: 'Quality Control & Defect Returns', icon: ShieldCheck },
            { id: 'after-sales', label: 'After Sales & Support Tickets', icon: Wrench },
            { id: 'reports', label: 'Performance & Return Analytics', icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as LogisticsTab)}
              className={cn(
                "pb-2.5 text-xs font-bold transition-all relative flex items-center gap-2 whitespace-nowrap shrink-0 px-1",
                activeTab === tab.id ? "text-primary" : "text-gray-500 hover:text-gray-800"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeLogisticsTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="min-h-[450px]">

          {/* TAB 1: ORDER FULFILLMENT */}
          {activeTab === 'tracking' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text"
                    placeholder="Search order number, client name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary transition-all shadow-sm"
                  />
                </div>
                <div className="flex gap-2 items-center overflow-x-auto">
                  <span className="text-[10px] font-bold text-gray-400 uppercase shrink-0">Filter Status:</span>
                  {['All', 'Confirmed', 'Processing', 'Ready', 'Shipped', 'Delivered'].map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all shrink-0",
                        statusFilter === st ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Order #</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Client</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Items</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Total</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Fulfillment Status</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Expected Delivery</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-xs italic">
                          No active orders found matching the filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-xs font-bold text-gray-900 block">#{order.orderNumber}</span>
                            <span className="text-[10px] text-gray-400">{order.date}</span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs font-bold text-gray-800">{order.clientName}</p>
                            <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{clients.find(c => c.id === order.clientId)?.address || 'Address registered'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium text-gray-700">{order.items?.length || 0} Item(s)</span>
                            <p className="text-[10px] text-gray-400 truncate max-w-[140px]">{order.items?.map(i => i.name).join(', ')}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-bold text-gray-900">{formatCurrency(order.total, companySettings?.currency)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1",
                              order.status === 'Delivered' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              order.status === 'Shipped' ? "bg-amber-50 text-amber-700 border-amber-200" :
                              order.status === 'Ready' ? "bg-blue-50 text-blue-700 border-blue-200" :
                              "bg-gray-100 text-gray-700 border-gray-200"
                            )}>
                              {order.status === 'Delivered' && <CheckCircle2 size={12} />}
                              {order.status === 'Shipped' && <Truck size={12} />}
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-gray-700 font-medium">{order.expectedDeliveryDate || 'Not set'}</span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-1">
                            {order.status !== 'Shipped' && order.status !== 'Delivered' && (
                              <button
                                onClick={() => handleOpenDispatch(order)}
                                className="px-2.5 py-1 bg-primary text-white text-[11px] font-bold rounded-lg hover:bg-primary/90 transition-all shadow-sm"
                              >
                                Dispatch
                              </button>
                            )}
                            {order.status === 'Shipped' && (
                              <button
                                onClick={() => handleUpdateDeliveryStatus(order, 'Delivered')}
                                className="px-2.5 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-sm"
                              >
                                Mark Delivered
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedDeliveryNote(order)}
                              className="px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 text-[11px] font-bold rounded-lg transition-all"
                              title="View / Print Delivery Note"
                            >
                              <Printer size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: FLEET & ASSETS */}
          {activeTab === 'fleet' && (
            <div className="space-y-6">
              {/* Vehicles Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Truck className="text-primary" size={18} /> Delivery Fleet Vehicles
                    </h3>
                    <p className="text-[11px] text-gray-500">Manage company transport vehicles, drivers, mileage, and maintenance</p>
                  </div>
                  <button 
                    onClick={() => setIsVehicleModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 shadow-sm"
                  >
                    <Plus size={15} /> Add Vehicle
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicles.map((v) => (
                    <div key={v.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
                            <Truck size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">{v.plateNumber}</h4>
                            <p className="text-[10px] text-gray-500 font-medium">{v.type} • Cap: {v.capacity}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                          v.status === 'Available' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          v.status === 'On Delivery' ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-rose-50 text-rose-700 border-rose-200"
                        )}>
                          {v.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase font-bold">Assigned Driver</span>
                          <span className="font-bold text-gray-800">{v.driver || 'Unassigned'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase font-bold">Mileage & Fuel</span>
                          <span className="font-bold text-gray-800">{v.mileage?.toLocaleString()} km ({v.fuelLevel})</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                        <span>Next Service: <strong className="text-gray-700">{v.nextServiceDate || 'N/A'}</strong></span>
                        <button 
                          onClick={() => setVehicles(vehicles.map(item => item.id === v.id ? { ...item, status: item.status === 'Available' ? 'Maintenance' : 'Available' } : item))}
                          className="text-primary font-bold hover:underline"
                        >
                          Toggle Status
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warehouse & Fleet Assets */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Box className="text-primary" size={18} /> Warehouse & Fleet Assets Equipment
                    </h3>
                    <p className="text-[11px] text-gray-500">Track scanners, printers, pallet jacks, testing machinery and conditions</p>
                  </div>
                  <button 
                    onClick={() => setIsAssetModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 shadow-sm"
                  >
                    <Plus size={15} /> Add Equipment Asset
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Asset #</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Equipment Name</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Category</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Assigned Station</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Condition</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Last Inspected</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {assets.map((asset) => (
                        <tr key={asset.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-3 font-bold text-xs text-gray-900">{asset.assetNumber}</td>
                          <td className="px-4 py-3 font-bold text-xs text-gray-800">{asset.name}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">{asset.category}</td>
                          <td className="px-4 py-3 text-xs text-gray-700 font-medium">{asset.assignedTo}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                              asset.condition === 'Optimal' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              asset.condition === 'Requires Maintenance' ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-rose-50 text-rose-700 border-rose-200"
                            )}>
                              {asset.condition}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{asset.lastInspectionDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUALITY CONTROL & DEFECT RETURNS */}
          {activeTab === 'quality' && (
            <div className="space-y-6">
              {/* Active Pending Inspection Queue */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <ShieldCheck className="text-emerald-600" size={20} /> Quality Control & Defect Diagnosis Portal
                    </h3>
                    <p className="text-[11px] text-gray-500">Perform defect diagnosis on received procurement goods or customer orders. Return defective items and execute financial refund sync!</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
                    Auto-Linked to Accounting & Invoices
                  </span>
                </div>

                {/* Procurement PO Receipt Inspection Queue */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Package size={15} className="text-primary" /> Incoming Procurement Goods Received (Supplier Inspection)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {procurementOrders.length === 0 ? (
                      <p className="text-xs text-gray-400 italic col-span-2 p-3 bg-gray-50 rounded-xl">No active procurement orders found for incoming quality check.</p>
                    ) : (
                      procurementOrders.slice(0, 4).map(po => (
                        <div key={po.id} className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between hover:bg-gray-100/80 transition-colors">
                          <div>
                            <span className="text-xs font-bold text-gray-900 block">PO #{po.poNumber}</span>
                            <span className="text-[11px] text-gray-600 font-medium">{po.supplierName} • {po.items?.length || 0} item(s)</span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">Total Value: {formatCurrency(po.total, companySettings?.currency)}</span>
                          </div>
                          <button
                            onClick={() => handleOpenQCForPO(po)}
                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                          >
                            <ClipboardCheck size={14} /> Diagnose & Inspect
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Customer Orders Inspection Queue */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Truck size={15} className="text-amber-600" /> Customer Orders Ready for Shipping / Return Diagnosis
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {orders.slice(0, 4).map(ord => (
                      <div key={ord.id} className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between hover:bg-gray-100/80 transition-colors">
                        <div>
                          <span className="text-xs font-bold text-gray-900 block">Order #{ord.orderNumber}</span>
                          <span className="text-[11px] text-gray-600 font-medium">{ord.clientName} • {ord.items?.length || 0} item(s)</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">Total: {formatCurrency(ord.total, companySettings?.currency)}</span>
                        </div>
                        <button
                          onClick={() => handleOpenQCForOrder(ord)}
                          className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                        >
                          <ShieldCheck size={14} /> Diagnose Order
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Inspection & Defect Return History Log */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FileCheck size={18} className="text-primary" /> Diagnosed Quality Inspection & Defect Return Records
                </h3>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">QC #</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Type & Ref</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Entity Name</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Inspection Status</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Diagnosed Defects</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Return Refund</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Resolution Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {qualityInspections.map((qc) => (
                        <tr key={qc.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-xs font-bold text-gray-900 block">{qc.inspectionNumber}</span>
                            <span className="text-[10px] text-gray-400">{qc.date}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-bold text-gray-800 block">{qc.referenceNumber}</span>
                            <span className="text-[10px] text-gray-500">{qc.type}</span>
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-gray-700">{qc.entityName}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                              qc.overallStatus === 'Passed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              qc.overallStatus === 'Passed with Defects' ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-rose-50 text-rose-700 border-rose-200"
                            )}>
                              {qc.overallStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {qc.defectsFound ? (
                              <div className="text-xs text-rose-700 font-medium max-w-[200px]">
                                {qc.defectItems.map((d, i) => (
                                  <div key={i} className="truncate">
                                    • {d.itemName}: <strong>{d.defectiveQty} defective</strong> ({d.defectReason})
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-emerald-600 font-bold">No defects (100% Pass)</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-gray-900">
                            {qc.refundAmount && qc.refundAmount > 0 ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {formatCurrency(qc.refundAmount, companySettings?.currency)}
                              </span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {qc.resolutionStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AFTER SALES & SUPPORT TICKETS */}
          {activeTab === 'after-sales' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Wrench className="text-primary" size={18} /> After Sales Service & Defect Complaints
                  </h3>
                  <p className="text-[11px] text-gray-500">Manage customer claims, defect returns, warranty repairs, and issue immediate financial refunds</p>
                </div>
                <button 
                  onClick={() => setIsTicketModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 shadow-sm"
                >
                  <Plus size={15} /> Create Support Ticket
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Ticket #</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Order # & Client</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Claim Type</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Defect Diagnosis</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Resolution & Refund</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {afterSalesRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-xs italic">
                          No active after-sales support tickets recorded.
                        </td>
                      </tr>
                    ) : (
                      afterSalesRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-3 font-bold text-xs text-gray-900">
                            {rec.ticketNumber || `TK-${rec.id.slice(-4)}`}
                            <span className="text-[10px] text-gray-400 block font-normal">{rec.date}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-bold text-gray-800 block">#{rec.orderNumber}</span>
                            <span className="text-[11px] text-gray-600">{rec.clientName}</span>
                          </td>
                          <td className="px-4 py-3 text-xs font-medium text-gray-700">
                            <span className="px-2 py-0.5 rounded bg-gray-100 border text-[10px] font-bold">
                              {rec.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 max-w-[200px]">
                            <p className="font-medium text-gray-800 line-clamp-1">{rec.details}</p>
                            {rec.defectDiagnosis && <p className="text-[10px] text-rose-600 font-semibold">{rec.defectDiagnosis}</p>}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-gray-900">
                            <span>{rec.resolutionAction || 'Pending'}</span>
                            {rec.refundAmount && rec.refundAmount > 0 ? (
                              <span className="block text-[10px] text-emerald-700 font-bold">
                                Refund: {formatCurrency(rec.refundAmount, companySettings?.currency)}
                              </span>
                            ) : null}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                              rec.status === 'Resolved' || rec.status === 'Refunded' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                            )}>
                              {rec.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: PERFORMANCE & Analytics */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 size={16} className="text-primary" /> Delivery On-Time Fulfillment Volume
                  </h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Mon', completed: 14, delayed: 1 },
                        { name: 'Tue', completed: 20, delayed: 0 },
                        { name: 'Wed', completed: 18, delayed: 2 },
                        { name: 'Thu', completed: 25, delayed: 1 },
                        { name: 'Fri', completed: 32, delayed: 0 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                        <Tooltip />
                        <Bar dataKey="completed" name="On Time" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="delayed" name="Delayed" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 size={16} className="text-amber-600" /> Diagnosed Defect Causes Breakdown
                  </h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Fabric Flaw / Tear', value: 40, color: '#f43f5e' },
                            { name: 'Wrong Specs / Color', value: 25, color: '#f59e0b' },
                            { name: 'Transit Damage', value: 20, color: '#3b82f6' },
                            { name: 'Substandard Quality', value: 15, color: '#8b5cf6' },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          <Cell key="c1" fill="#f43f5e" />
                          <Cell key="c2" fill="#f59e0b" />
                          <Cell key="c3" fill="#3b82f6" />
                          <Cell key="c4" fill="#8b5cf6" />
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* MODAL: DISPATCH ORDER */}
        <AnimatePresence>
          {isDispatchModalOpen && selectedOrderForDispatch && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Truck className="text-primary" size={18} /> Dispatch Order #{selectedOrderForDispatch.orderNumber}
                  </h3>
                  <button onClick={() => setIsDispatchModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleConfirmDispatch} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Transport Method</label>
                    <select 
                      value={dispatchForm.transportType}
                      onChange={e => setDispatchForm({ ...dispatchForm, transportType: e.target.value as TransportType })}
                      className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold"
                    >
                      {TRANSPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {dispatchForm.transportType === 'Own Vehicle' ? (
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Select Fleet Vehicle</label>
                      <select 
                        value={dispatchForm.vehicleId}
                        onChange={e => {
                          const v = vehicles.find(item => item.id === e.target.value);
                          setDispatchForm({ ...dispatchForm, vehicleId: e.target.value, driverName: v?.driver || '' });
                        }}
                        className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold"
                      >
                        <option value="">-- Choose Vehicle --</option>
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber} ({v.type}) - Driver: {v.driver || 'None'}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">Courier Partner</label>
                        <input 
                          type="text" 
                          placeholder="e.g. DHL, FedEx" 
                          value={dispatchForm.courierName}
                          onChange={e => setDispatchForm({ ...dispatchForm, courierName: e.target.value })}
                          className="w-full p-2 bg-gray-50 border rounded-xl text-xs" 
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">Tracking Number</label>
                        <input 
                          type="text" 
                          value={dispatchForm.trackingNumber}
                          onChange={e => setDispatchForm({ ...dispatchForm, trackingNumber: e.target.value })}
                          className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-mono font-bold" 
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Delivery Address</label>
                    <textarea 
                      rows={2}
                      value={dispatchForm.deliveryAddress}
                      onChange={e => setDispatchForm({ ...dispatchForm, deliveryAddress: e.target.value })}
                      className="w-full p-2 bg-gray-50 border rounded-xl text-xs" 
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Expected Delivery Date</label>
                    <input 
                      type="date"
                      value={dispatchForm.expectedDate}
                      onChange={e => setDispatchForm({ ...dispatchForm, expectedDate: e.target.value })}
                      className="w-full p-2 bg-gray-50 border rounded-xl text-xs"
                    />
                  </div>

                  <div className="pt-3 border-t flex justify-end gap-2">
                    <button type="button" onClick={() => setIsDispatchModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20">
                      Confirm Dispatch
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: QUALITY CHECK & DEFECT DIAGNOSIS */}
        <AnimatePresence>
          {isQCModalOpen && selectedItemForQC && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <ShieldCheck className="text-emerald-600" size={20} /> Quality Inspection & Defect Diagnosis
                    </h3>
                    <p className="text-[11px] text-gray-500">{selectedItemForQC.type}: <strong>{selectedItemForQC.referenceNumber}</strong> ({selectedItemForQC.entityName})</p>
                  </div>
                  <button onClick={() => setIsQCModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmitQC} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Inspector Name</label>
                    <input 
                      type="text" 
                      value={qcForm.inspectorName}
                      onChange={e => setQcForm({ ...qcForm, inspectorName: e.target.value })}
                      className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold" 
                    />
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b pb-1">
                      Inspect Received Items for Defects:
                    </h4>

                    {selectedItemForQC.items.map((item) => {
                      const res = qcForm.itemResults[item.id] || { defectiveQty: 0, defectReason: 'Fabric Flaw / Tear', defectSeverity: 'Minor', diagnosticNotes: '', recommendedAction: 'Return to Supplier' };
                      return (
                        <div key={item.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-900">{item.name}</span>
                            <span className="text-[11px] text-gray-500 font-medium">Total Qty: {item.quantity} units (@ {formatCurrency(item.unitPrice, companySettings?.currency)})</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-rose-700 block">Defective Qty</label>
                              <input 
                                type="number"
                                min="0"
                                max={item.quantity}
                                value={res.defectiveQty}
                                onChange={e => {
                                  const val = Math.min(item.quantity, Math.max(0, Number(e.target.value)));
                                  setQcForm({
                                    ...qcForm,
                                    itemResults: {
                                      ...qcForm.itemResults,
                                      [item.id]: { ...res, defectiveQty: val }
                                    }
                                  });
                                }}
                                className="w-full p-1.5 bg-white border border-rose-300 rounded-lg text-xs font-bold text-rose-700"
                              />
                            </div>

                            {res.defectiveQty > 0 && (
                              <>
                                <div>
                                  <label className="text-[10px] font-bold text-gray-700 block">Defect Cause</label>
                                  <select
                                    value={res.defectReason}
                                    onChange={e => {
                                      setQcForm({
                                        ...qcForm,
                                        itemResults: {
                                          ...qcForm.itemResults,
                                          [item.id]: { ...res, defectReason: e.target.value }
                                        }
                                      });
                                    }}
                                    className="w-full p-1.5 bg-white border rounded-lg text-xs font-medium"
                                  >
                                    <option value="Fabric Flaw / Tear">Fabric Flaw / Tear</option>
                                    <option value="Color Mismatch">Color Mismatch</option>
                                    <option value="Wrong Dimensions / Specs">Wrong Dimensions / Specs</option>
                                    <option value="Damaged in Transit">Damaged in Transit</option>
                                    <option value="Substandard Workmanship">Substandard Workmanship</option>
                                    <option value="Missing Parts">Missing Parts</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-gray-700 block">Severity</label>
                                  <select
                                    value={res.defectSeverity}
                                    onChange={e => {
                                      setQcForm({
                                        ...qcForm,
                                        itemResults: {
                                          ...qcForm.itemResults,
                                          [item.id]: { ...res, defectSeverity: e.target.value as any }
                                        }
                                      });
                                    }}
                                    className="w-full p-1.5 bg-white border rounded-lg text-xs font-medium"
                                  >
                                    <option value="Minor">Minor</option>
                                    <option value="Major">Major</option>
                                    <option value="Critical">Critical</option>
                                  </select>
                                </div>
                              </>
                            )}
                          </div>

                          {res.defectiveQty > 0 && (
                            <div>
                              <input 
                                type="text"
                                placeholder="Diagnostic notes / photo evidence summary..."
                                value={res.diagnosticNotes}
                                onChange={e => {
                                  setQcForm({
                                    ...qcForm,
                                    itemResults: {
                                      ...qcForm.itemResults,
                                      [item.id]: { ...res, diagnosticNotes: e.target.value }
                                    }
                                  });
                                }}
                                className="w-full p-1.5 bg-white border rounded-lg text-xs"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Financial Refund Sync */}
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-emerald-900 flex items-center gap-2">
                        <DollarSign size={16} /> Auto-Execute Payment Refund & Ledger Posting
                      </label>
                      <input 
                        type="checkbox"
                        checked={qcForm.processRefund}
                        onChange={e => setQcForm({ ...qcForm, processRefund: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                    </div>
                    <p className="text-[10px] text-emerald-700">
                      If checked, returning defective goods will automatically record a Debit Refund in Accounting, update Supplier/Client balance, and post to Invoice Portal!
                    </p>
                  </div>

                  <div className="pt-3 border-t flex justify-end gap-2">
                    <button type="button" onClick={() => setIsQCModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/20">
                      Save Inspection & Execute Return
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: ADD VEHICLE */}
        <AnimatePresence>
          {isVehicleModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Truck className="text-primary" size={18} /> Register Fleet Vehicle
                  </h3>
                  <button onClick={() => setIsVehicleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleAddVehicle} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Plate Number</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. LOG-505"
                      value={vehicleForm.plateNumber}
                      onChange={e => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value })}
                      className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold uppercase" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Vehicle Type</label>
                      <select 
                        value={vehicleForm.type}
                        onChange={e => setVehicleForm({ ...vehicleForm, type: e.target.value })}
                        className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold"
                      >
                        <option value="Van (1.5T)">Van (1.5T)</option>
                        <option value="Truck (5.0T)">Truck (5.0T)</option>
                        <option value="Motorcycle Express">Motorcycle Express</option>
                        <option value="Container Truck">Container Truck</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Assigned Driver</label>
                      <input 
                        type="text" 
                        placeholder="Driver name" 
                        value={vehicleForm.driver}
                        onChange={e => setVehicleForm({ ...vehicleForm, driver: e.target.value })}
                        className="w-full p-2 bg-gray-50 border rounded-xl text-xs" 
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t flex justify-end gap-2">
                    <button type="button" onClick={() => setIsVehicleModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20">
                      Save Vehicle
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: ADD ASSET */}
        <AnimatePresence>
          {isAssetModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Box className="text-primary" size={18} /> Register Warehouse Asset
                  </h3>
                  <button onClick={() => setIsAssetModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleAddAsset} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Equipment Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Handheld Laser Barcode Scanner"
                      value={assetForm.name}
                      onChange={e => setAssetForm({ ...assetForm, name: e.target.value })}
                      className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold" 
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Category</label>
                    <select 
                      value={assetForm.category}
                      onChange={e => setAssetForm({ ...assetForm, category: e.target.value as any })}
                      className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold"
                    >
                      <option value="Warehouse Equipment">Warehouse Equipment</option>
                      <option value="Delivery Fleet">Delivery Fleet</option>
                      <option value="Printing/POS Hardware">Printing/POS Hardware</option>
                      <option value="Testing Device">Testing Device</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Assigned Station / Location</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Dispatch Dock 1" 
                      value={assetForm.assignedTo}
                      onChange={e => setAssetForm({ ...assetForm, assignedTo: e.target.value })}
                      className="w-full p-2 bg-gray-50 border rounded-xl text-xs" 
                    />
                  </div>

                  <div className="pt-3 border-t flex justify-end gap-2">
                    <button type="button" onClick={() => setIsAssetModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20">
                      Save Asset
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: CREATE SUPPORT TICKET */}
        <AnimatePresence>
          {isTicketModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Wrench className="text-primary" size={18} /> Open Support & Defect Ticket
                  </h3>
                  <button onClick={() => setIsTicketModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateTicket} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Order #</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="ORD-1001"
                        value={ticketForm.orderNumber}
                        onChange={e => setTicketForm({ ...ticketForm, orderNumber: e.target.value })}
                        className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold" 
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Client Name</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Client name"
                        value={ticketForm.clientName}
                        onChange={e => setTicketForm({ ...ticketForm, clientName: e.target.value })}
                        className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Claim Type</label>
                    <select 
                      value={ticketForm.type}
                      onChange={e => setTicketForm({ ...ticketForm, type: e.target.value as any })}
                      className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold"
                    >
                      <option value="Defect Return">Defect Return</option>
                      <option value="Warranty Claim">Warranty Claim</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Complaint">Complaint</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Details & Defect Diagnosis</label>
                    <textarea 
                      rows={2}
                      required
                      placeholder="Describe defect diagnosed..."
                      value={ticketForm.details}
                      onChange={e => setTicketForm({ ...ticketForm, details: e.target.value, defectDiagnosis: e.target.value })}
                      className="w-full p-2 bg-gray-50 border rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">Resolution Action</label>
                      <select 
                        value={ticketForm.resolutionAction}
                        onChange={e => setTicketForm({ ...ticketForm, resolutionAction: e.target.value as any })}
                        className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold"
                      >
                        <option value="Issue Refund">Issue Refund</option>
                        <option value="Reprocess Order">Reprocess Order</option>
                        <option value="Store Credit">Store Credit</option>
                        <option value="Replacement Sent">Replacement Sent</option>
                      </select>
                    </div>
                    {ticketForm.resolutionAction === 'Issue Refund' && (
                      <div>
                        <label className="text-[11px] font-bold text-emerald-700 block mb-1">Refund Amount</label>
                        <input 
                          type="number" 
                          min="0"
                          value={ticketForm.refundAmount}
                          onChange={e => setTicketForm({ ...ticketForm, refundAmount: Number(e.target.value) })}
                          className="w-full p-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800" 
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t flex justify-end gap-2">
                    <button type="button" onClick={() => setIsTicketModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20">
                      Submit Ticket
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: PRINT DELIVERY NOTE */}
        <AnimatePresence>
          {selectedDeliveryNote && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="text-primary" size={18} /> Official Delivery Note #{selectedDeliveryNote.orderNumber}
                  </h3>
                  <button onClick={() => setSelectedDeliveryNote(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>

                <div className="p-4 bg-gray-50 border rounded-xl text-xs space-y-3">
                  <div className="flex justify-between border-b pb-2">
                    <div>
                      <p className="font-bold text-gray-900">{companySettings?.name || 'OmniConnect Business'}</p>
                      <p className="text-gray-500">{companySettings?.address || 'Main Commercial Office'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">Delivery Slip</p>
                      <p className="text-gray-500">Date: {new Date().toISOString().split('T')[0]}</p>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-gray-700 block">Consignee Client:</span>
                    <p className="font-bold text-gray-900">{selectedDeliveryNote.clientName}</p>
                    <p className="text-gray-600">{clients.find(c => c.id === selectedDeliveryNote.clientId)?.address || 'Client Address'}</p>
                  </div>

                  <div>
                    <span className="font-bold text-gray-700 block mb-1">Delivered Items:</span>
                    <table className="w-full text-left bg-white border rounded">
                      <thead>
                        <tr className="bg-gray-100 border-b">
                          <th className="p-1.5 font-bold">Item Description</th>
                          <th className="p-1.5 font-bold text-right">Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDeliveryNote.items?.map((item, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="p-1.5">{item.name}</td>
                            <td className="p-1.5 text-right font-bold">{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-4 grid grid-cols-2 gap-4 border-t text-[10px] text-gray-500">
                    <div className="border-t border-dashed pt-2">
                      <span>Dispatch Officer Signature:</span>
                    </div>
                    <div className="border-t border-dashed pt-2">
                      <span>Customer Receiver Signature & Stamp:</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button onClick={() => setSelectedDeliveryNote(null)} className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl">
                    Close
                  </button>
                  <button onClick={() => { try { window.print(); } catch (err) { console.warn('Print failed:', err); } }} className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-1.5">
                    <Printer size={14} /> Print Delivery Note
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
