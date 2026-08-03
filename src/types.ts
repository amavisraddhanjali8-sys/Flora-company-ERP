export interface SupplierRating {
  id: string;
  supplierId: string;
  score: number;
  date: string;
  comment?: string;
  author?: string;
  aspects?: {
    quality?: number;
    deliveryTime?: number;
    communication?: number;
    pricing?: number;
  };
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  taxId?: string;
  creditLimit?: number;
  currentBalance?: number;
  paymentTerms?: string;
  rating?: number;
  ratingCount?: number;
  ratingsHistory?: SupplierRating[];
}

export type Category = string;

export type MaterialType = 'Fabric' | 'Accessory' | 'Service' | 'Support' | 'Partner' | 'Preserved Flora' | 'Live Plant' | 'Organics' | 'Vessel' | 'Infrastructure' | 'Hardware';

export interface Material {
  id: string;
  name: string;
  description?: string;
  type: MaterialType;
  unit: string;
  costPerUnit: number;
  stock: number;
  minStock: number;
  category: string;
  image?: string;
  supplier?: string;
}

export interface RFQ {
  id: string;
  rfqNumber: string;
  date: string;
  deadline: string;
  suppliers: string[]; // Supplier IDs
  orderId?: string; // Optional linked client order ID
  orderNumber?: string;
  type?: 'Material' | 'Service' | 'Support' | 'Product';
  isDeficitRfq?: boolean; // Flag if created due to PO delivery deficit
  isAutoDraft?: boolean; // Flag if auto-generated draft for critical threshold
  criticalThresholdItem?: string;
  parentPoId?: string;
  parentPoNumber?: string;
  deficitReason?: string;
  items: { 
    materialId?: string; 
    name: string; 
    quantity: number; 
    unit: string; 
    specs?: string;
    receivedBefore?: number;
    deficitQty?: number;
  }[];
  status: 'Draft' | 'Sent' | 'Completed' | 'Cancelled';
  notes?: string;
  terms?: string[];
}

export interface SupplierQuotation {
  id: string;
  rfqId?: string;
  rfqNumber?: string;
  orderId?: string;
  orderNumber?: string;
  supplierId: string;
  supplierName: string;
  type?: 'Material' | 'Service' | 'Support' | 'Product';
  quotationNumber?: string;
  date: string;
  validUntil?: string;
  items: {
    materialId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    unit?: string;
    total: number;
    isAvailable?: boolean;
    leadTime?: string;
  }[];
  subtotal: number;
  discount: number;
  discountRate?: number;
  tax: number;
  taxRate?: number;
  freight: number;
  otherCharges: number;
  otherChargesList?: OtherCharge[];
  total: number;
  status: 'Pending' | 'Accepted' | 'Rejected';
  notes?: string;
  terms?: string[];
}

export interface ProcurementOrder {
  id: string;
  poNumber: string;
  rfqId?: string;
  quotationId?: string;
  orderId?: string;
  orderNumber?: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: {
    materialId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    unit?: string;
    total: number;
    receivedQuantity?: number;
    deficitQuantity?: number;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  freight: number;
  otherCharges: number;
  otherChargesList?: OtherCharge[];
  total: number;
  paidAmount?: number;
  status: 'Draft' | 'Sent' | 'Partial' | 'Received' | 'Cancelled';
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
  deliveryDate?: string;
  type: 'Material' | 'Service' | 'Support' | 'Product';
  notes?: string;
  terms?: string[];
  deficitRfqId?: string;
  deficitRfqNumber?: string;
  serviceDetails?: {
    serviceType: string;
    contractType?: 'Client Service Agreement' | 'Freelance/Specialist Contract' | 'Strategic Partnership' | 'Custom Manufacturing' | 'Logistics & Fulfillment' | 'Specialized Service';
    serviceCategory?: string;
    scopeOfWork?: string;
    locationOrSite?: string;
    garmentType?: string;
    complexity?: string;
    turnaroundDays?: number;
    stitchCount?: number;
    contractStartDate?: string;
    contractEndDate?: string;
    serviceStatus?: 'Contracted' | 'Design Approval' | 'In Production' | 'QA Inspection' | 'On-Site Work' | 'Completed' | 'Cancelled';
  };
}

export interface SupplierPayment {
  id: string;
  paymentNumber: string;
  supplierId: string;
  supplierName: string;
  poId?: string;
  poNumber?: string;
  amount: number;
  date: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}

export type TransportType = 'Courier' | 'Own Vehicle' | 'Third Party' | 'Partner';

export interface Vehicle {
  id: string;
  plateNumber: string;
  type: string;
  driver?: string;
  status: 'Available' | 'On Delivery' | 'Maintenance';
  mileage?: number;
  fuelLevel?: string;
  capacity?: string;
  lastServiceDate?: string;
  nextServiceDate?: string;
}

export interface AssetEquipment {
  id: string;
  assetNumber: string;
  name: string;
  category: 'Warehouse Equipment' | 'Delivery Fleet' | 'Printing/POS Hardware' | 'Testing Device';
  assignedTo?: string;
  condition: 'Optimal' | 'Requires Maintenance' | 'Defective/Repair Needed';
  lastInspectionDate?: string;
}

export interface DefectItem {
  itemId: string;
  itemName: string;
  orderedQty: number;
  defectiveQty: number;
  passedQty: number;
  defectReason: string;
  defectSeverity: 'Minor' | 'Major' | 'Critical';
  diagnosticNotes?: string;
  recommendedAction: 'Return to Supplier' | 'Return to Warehouse' | 'Scrap' | 'Reprocess/Repair' | 'Customer Refund';
}

export interface QualityInspection {
  id: string;
  inspectionNumber: string;
  date: string;
  type: 'Procurement PO Receipt' | 'Customer Order Fulfillment';
  referenceId: string; // poId or orderId
  referenceNumber: string; // poNumber or orderNumber
  entityName: string; // supplierName or clientName
  inspectorName: string;
  overallStatus: 'Passed' | 'Passed with Defects' | 'Rejected / Defective';
  defectsFound: boolean;
  defectItems: DefectItem[];
  resolutionStatus: 'Pending Action' | 'Return Processed' | 'Refund Issued' | 'Resolved';
  actionTaken?: string;
  refundAmount?: number;
}

export interface Delivery {
  id: string;
  orderId: string;
  orderNumber: string;
  clientName: string;
  date: string;
  status: 'Pending' | 'Issuance' | 'In Transit' | 'Delivered' | 'Failed';
  transportType: TransportType;
  courierName?: string;
  trackingNumber?: string;
  vehicleId?: string;
  driverName?: string;
  qualityStatus: 'Pending' | 'Passed' | 'Failed';
  qualityNotes?: string;
  deliveryAddress: string;
}

export interface AfterSalesRecord {
  id: string;
  ticketNumber?: string;
  deliveryId?: string;
  orderId?: string;
  orderNumber: string;
  clientId?: string;
  clientName: string;
  date: string;
  type: 'Maintenance' | 'Update' | 'Complaint' | 'Feedback' | 'Defect Return' | 'Warranty Claim';
  details: string;
  defectDiagnosis?: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Refunded';
  resolutionAction?: 'Reprocess Order' | 'Issue Refund' | 'Store Credit' | 'Replacement Sent';
  refundAmount?: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: Category;
  image?: string;
  status?: 'Active' | 'Inactive';
  barcode?: string;
}

export interface FinishedProduct extends Product {
  size?: string;
  color?: string;
  materials?: { materialId: string; quantity: number }[]; // BOM
  stock: number;
  minStock: number;
  costPrice: number;
  isService?: boolean;
  barcode?: string;
  originalPrice?: number;
  discountPercent?: number;
  rating?: number;
  reviewCount?: number;
  flowerType?: string;
  occasion?: string;
  recipient?: string;
  keywords?: string[];
  isB2BOnly?: boolean;
  careGuide?: string;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Ready' | 'Shipped' | 'Delivered' | 'Cancelled';
export type OrderType = 'Direct' | 'Quotation';

export interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  clientId: string;
  clientName: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  discountRate: number;
  freight: number;
  otherCharges: number;
  otherChargesList?: OtherCharge[];
  total: number;
  advancePayment: number;
  advancePaymentDate?: string;
  balance: number;
  paymentMethod: string;
  quotationId?: string;
  notes?: string;
  expectedDeliveryDate?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  image?: string;
  creditLimit?: number;
  isBlacklisted?: boolean;
  notes?: string;
}

export interface BankDetail {
  id: string;
  bankName: string;
  accountNumber: string;
  branch: string;
  accountHolder?: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
}

export interface AdvertisementItem {
  id: string;
  badge?: string;
  badgeText?: string;
  title: string;
  description: string;
  buttonText?: string;
  buttonAction?: string;
  isActive?: boolean;
  bgGradient?: string;
}

export type Advertisement = AdvertisementItem;

export interface StorefrontSettings {
  callButtonNumber?: string;
  callButtonLabel?: string;
  socialLinks?: SocialLinks;
  topAnnouncementBar?: string;
  tagline?: string;
  advertisements?: AdvertisementItem[];
}

export interface CompanySettings {
  name: string;
  address: string;
  phones: string[];
  email: string;
  website: string;
  bankDetails: BankDetail[];
  currency: string;
  logo?: string;
  terms: TermAndCondition[];
  taxId?: string;
  defaultTaxRate: number;
  expenseCategories: string[];
  advanceTiers: number[];
  storefront?: StorefrontSettings;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  date: string;
  read: boolean;
  category: 'inventory' | 'sales' | 'system' | 'forecast' | 'hardware' | 'accounting';
}

export interface TermAndCondition {
  id: string;
  text: string;
}

export interface CartItem extends FinishedProduct {
  quantity: number;
  attachments?: string[];
}

export interface OtherCharge {
  id: string;
  description: string;
  amount: number;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  clientId: string;
  clientName: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  discountRate: number;
  freight: number;
  otherCharges: number;
  otherChargesList?: OtherCharge[];
  total: number;
  status: 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Won';
  terms: string[];
  bankId?: string;
  advancePercentage?: number;
  attachments?: string[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quotationId?: string;
  quotationNumber?: string;
  poId?: string;
  poNumber?: string;
  isSupplierInvoice?: boolean;
  type?: 'Customer' | 'Supplier';
  clientId: string;
  clientName: string;
  date: string;
  dueDate: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  discountRate: number;
  freight: number;
  otherCharges: number;
  otherChargesList?: OtherCharge[];
  total: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled' | 'Approved';
  amountPaid: number;
  balance: number;
  terms: string[];
  bankId?: string;
  notes?: string;
  stockReduced?: boolean;
  isBadDebt?: boolean;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  vendor: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: string;
  status: 'Pending' | 'Paid' | 'Cancelled';
  description: string;
  receiptImage?: string;
  reference?: string;
  supplierId?: string;
  supplierName?: string;
}

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface LedgerAccount {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  balance: number;
  description?: string;
  isSystem?: boolean; // System accounts like Cash, Sales, etc.
}

export interface LedgerEntry {
  id: string;
  date: string;
  accountId: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  referenceId?: string;
  transactionId?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  entries: LedgerEntry[];
  referenceId?: string;
}

export interface Transaction {
  id: string;
  type: 'Income' | 'Expense' | 'Sale' | 'Purchase';
  category: string;
  amount: number;
  subtotal?: number;
  tax?: number;
  taxRate?: number;
  discount?: number;
  discountRate?: number;
  freight?: number;
  otherCharges?: number;
  otherChargesList?: OtherCharge[];
  date: string;
  description: string;
  items?: CartItem[];
  paymentMethod?: string;
  amountPaid?: number;
  change?: number;
  status?: 'Completed' | 'Refunded' | 'Pending';
  stockReduced?: boolean;
  referenceId?: string;
  clientId?: string;
  clientName?: string;
  supplierId?: string;
  supplierName?: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  date: string;
  reason: string;
}

export interface ForecastData {
  date: string;
  actual: number;
  forecast: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  date: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'inventory' | 'sales' | 'accounting' | 'system' | 'clients' | 'suppliers';
}

export type UserRole = 
  | 'Super Admin'
  | 'Sales Executive'
  | 'Production Manager'
  | 'Procurement Officer'
  | 'Finance Manager'
  | 'Logistics Manager'
  | 'Client'
  | 'Supplier';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'Active' | 'Pending Approval' | 'Rejected' | 'Deactivated';
  companyName?: string;
  taxId?: string;
  phone?: string;
  address?: string;
  businessLicenseUrl?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  mfaEnabled?: boolean;
  emailVerified?: boolean;
  customAllowedTabs?: string[];
  password?: string;
  mustChangePassword?: boolean;
  passwordChangedAt?: string;
}
