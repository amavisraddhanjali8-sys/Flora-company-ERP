import { FinishedProduct, Client, CompanySettings, TermAndCondition, Transaction, InventoryMovement, Notification, Supplier, LedgerAccount, Material, UserProfile, RFQ, ProcurementOrder, SupplierQuotation } from './types';

export const INITIAL_ACCOUNTS: LedgerAccount[] = [
  { id: 'acc-cash', code: '1000', name: 'Cash on Hand', type: 'Asset', balance: 0, isSystem: true },
  { id: 'acc-bank', code: '1100', name: 'Bank Account', type: 'Asset', balance: 0, isSystem: true },
  { id: 'acc-ar', code: '1200', name: 'Accounts Receivable', type: 'Asset', balance: 0, isSystem: true },
  { id: 'acc-inventory', code: '1300', name: 'Botanical & Material Inventory', type: 'Asset', balance: 0, isSystem: true },
  { id: 'acc-ap', code: '2000', name: 'Accounts Payable', type: 'Liability', balance: 0, isSystem: true },
  { id: 'acc-equity', code: '3000', name: "Owner's Equity", type: 'Equity', balance: 0, isSystem: true },
  { id: 'acc-sales', code: '4000', name: 'Flora & Installation Revenue', type: 'Revenue', balance: 0, isSystem: true },
  { id: 'acc-other-income', code: '4100', name: 'Maintenance Contract Income', type: 'Revenue', balance: 0, isSystem: true },
  { id: 'acc-cogs', code: '5000', name: 'Cost of Botanical Goods Sold', type: 'Expense', balance: 0, isSystem: true },
  { id: 'acc-rent', code: '5100', name: 'Studio & Nursery Rent', type: 'Expense', balance: 0, isSystem: true },
  { id: 'acc-utilities', code: '5200', name: 'Water & Light Utilities', type: 'Expense', balance: 0, isSystem: true },
  { id: 'acc-salaries', code: '5300', name: 'Horticultural & Design Wages', type: 'Expense', balance: 0, isSystem: true },
  { id: 'acc-marketing', code: '5400', name: 'Marketing & Exhibition', type: 'Expense', balance: 0, isSystem: true },
  { id: 'acc-other-expense', code: '5900', name: 'Other Operating Expenses', type: 'Expense', balance: 0, isSystem: true },
];

export const INITIAL_SETTINGS: CompanySettings = {
  name: 'Flora & Verdant',
  address: 'No. 88, Botanical Gardens Way, Commercial District, Colombo 03, Sri Lanka',
  phones: ['+123-456-789', '+94 77 888 9900'],
  email: 'design@verdantflora.com',
  website: 'www.verdantflora.com',
  bankDetails: [
    { id: 'b1', bankName: 'Commercial Bank', accountNumber: '8001234567', branch: 'Colombo Fort', accountHolder: 'Verdant Biophilic Design Ltd' },
    { id: 'b2', bankName: 'Standard Chartered', accountNumber: '0100987654', branch: 'Kollupitiya', accountHolder: 'Verdant Biophilic Design Ltd' }
  ],
  currency: 'LKR',
  logo: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=200',
  terms: [
    { id: '1', text: '50% advance deposit required prior to custom design fabrication and installation.' },
    { id: '2', text: 'Preserved moss & living wall installations carry a 12-month structural warranty.' },
    { id: '3', text: 'Ongoing maintenance contract terms billed quarterly in advance.' }
  ],
  taxId: 'TX-FLORA-2026-LK',
  defaultTaxRate: 8,
  expenseCategories: ['Botanical Sourcing', 'Horticultural Labor', 'Plant Transport & Freight', 'Preserved Foliage & Moss', 'Planters & Vessels', 'Studio & Nursery Rent', 'Water & Irrigation Utilities', 'Tools & Hardware', 'Marketing', 'Other'],
  advanceTiers: [30, 50, 100],
  storefront: {
    callButtonNumber: '+123-456-789',
    callButtonLabel: 'Call Us Now',
    socialLinks: {
      facebook: 'https://facebook.com',
      instagram: 'https://instagram.com',
      whatsapp: 'https://wa.me/123456789',
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
      youtube: ''
    },
    topAnnouncementBar: 'Sign up and GET 20% OFF for your first order.',
    tagline: 'Public E-Commerce Showcase',
    advertisements: [
      {
        id: 'ad-1',
        badgeText: 'SPECIAL ADMIN OFFER',
        title: 'Promotional Price Drops Active — Up to 50% OFF!',
        description: 'The Admin team has offered exclusive promotional discounts on selected bouquet & floral items. Reduced prices clearly displayed on product tiles with instant savings.',
        buttonText: 'View Discounted Offers Only',
        isActive: true,
        bgGradient: 'from-amber-500 via-orange-600 to-purple-700'
      },
      {
        id: 'ad-2',
        badgeText: 'NEW ARRIVALS 2026',
        title: 'Handcrafted Preserved Moss & Living Plant Wall Art',
        description: 'Transform corporate workspaces and homes with luxury zero-maintenance preserved moss frames and bespoke interior plant installations.',
        buttonText: 'Explore Living Wall Creations',
        isActive: true,
        bgGradient: 'from-emerald-600 via-teal-700 to-cyan-800'
      },
      {
        id: 'ad-3',
        badgeText: 'EXPRESS DELIVERY',
        title: 'Guaranteed Fresh Floral Bouquets & Same-Day Dispatch',
        description: 'Freshly harvested luxury roses, orchids, and lilies delivered in eco-friendly hydration packaging with personalized greeting notes.',
        buttonText: 'Order Fresh Bouquets',
        isActive: true,
        bgGradient: 'from-rose-600 via-purple-700 to-indigo-800'
      }
    ]
  }
};

export const INITIAL_TERMS: TermAndCondition[] = [
  { id: '1', text: '50% advance deposit required prior to custom design fabrication and installation.' },
  { id: '2', text: 'Preserved moss & living wall installations carry a 12-month structural warranty.' },
  { id: '3', text: 'Ongoing maintenance contract terms billed quarterly in advance.' }
];

export const MOCK_NOTIFICATIONS: Notification[] = [];

export const MOCK_CLIENTS: Client[] = [];

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-demo',
    name: 'Flora & Verdant Biophilic Design',
    contactPerson: 'Seven ignito',
    email: 'sevenignito@gmail.com',
    phone: '+1 800 555 0199',
    address: 'Industrial Zone 4, Sector B, Eco Park',
    category: 'Biophilic Design & Services',
    paymentTerms: 'Net 30',
    rating: 4.9,
    status: 'Active',
    currentBalance: 0,
    taxId: 'TAX-SUP-9981'
  },
  {
    id: 'sup-andean',
    name: 'Andean Floral Farms',
    contactPerson: 'Carlos Mendoza',
    email: 'carlos@andeanfloral.com',
    phone: '+593 2 299 1000',
    address: 'Cayambe Floral Valley, Quito, Ecuador',
    category: 'Botanicals & Cut Flowers',
    paymentTerms: 'Net 30',
    rating: 4.8,
    status: 'Active',
    currentBalance: 0
  },
  {
    id: 'sup-holland',
    name: 'Holland Bloom Importers',
    contactPerson: 'Anika van der Meer',
    email: 'anika@hollandbloom.nl',
    phone: '+31 20 555 0123',
    address: 'Aalsmeer Flower Auction Zone 12, Netherlands',
    category: 'Specialty Flora',
    paymentTerms: 'Net 15',
    rating: 4.7,
    status: 'Active',
    currentBalance: 0
  }
];

export const INITIAL_RFQS: RFQ[] = [
  {
    id: 'rfq-2026-001',
    rfqNumber: 'RFQ-2026-001',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: '2026-08-15',
    suppliers: ['sup-demo', 'sup-andean', 'sup-holland'],
    type: 'Material',
    items: [
      { materialId: 'mat-rose-red', name: 'Ecuadorian Long-Stem Red Roses', quantity: 200, unit: 'Stems', specs: 'Grade A2 Long stem 60cm' },
      { materialId: 'mat-hydrangea-pink', name: 'Dutch Pink Hydrangea Stems', quantity: 100, unit: 'Stems', specs: 'Fresh pink premium head' }
    ],
    status: 'Sent',
    notes: 'Please quote inclusive of climate-controlled freight to our main warehouse.'
  },
  {
    id: 'rfq-2026-002',
    rfqNumber: 'RFQ-2026-002',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: '2026-08-20',
    suppliers: ['sup-demo'],
    type: 'Service',
    items: [
      { name: 'Custom Biophilic Moss Wall Sub-Assembly & Mounting', quantity: 4, unit: 'Panels', specs: 'Living preserved moss 1.2m x 2.4m aluminum frame' },
      { name: 'On-Site Specialist Technical Assembly Support', quantity: 3, unit: 'Days', specs: 'On-site installation supervisor' }
    ],
    status: 'Sent',
    notes: 'Outsourced partner installation quote required for corporate headquarters project.'
  }
];

export const INITIAL_PROCUREMENT_ORDERS: ProcurementOrder[] = [
  {
    id: 'po-2026-001',
    poNumber: 'PO-2026-001',
    rfqId: 'rfq-2026-001',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    supplierId: 'sup-demo',
    supplierName: 'Flora & Verdant Biophilic Design',
    items: [
      { materialId: 'mat-rose-red', name: 'Ecuadorian Long-Stem Red Roses', quantity: 150, unitPrice: 2.50, unit: 'Stems', total: 375, receivedQuantity: 150 },
      { materialId: 'mat-eucalyptus', name: 'Silver Dollar Eucalyptus Foliage', quantity: 50, unitPrice: 3.50, unit: 'Bunches', total: 175, receivedQuantity: 50 }
    ],
    subtotal: 550,
    discount: 25,
    tax: 0,
    freight: 45,
    otherCharges: 10,
    total: 580,
    status: 'Received',
    paymentStatus: 'Unpaid',
    deliveryDate: '2026-08-10',
    type: 'Material',
    notes: 'Awarded PO for floral inventory restock.'
  }
];

export const INITIAL_SUPPLIER_QUOTATIONS: SupplierQuotation[] = [
  {
    id: 'sq-1001',
    rfqId: 'rfq-2026-001',
    rfqNumber: 'RFQ-2026-001',
    supplierId: 'sup-demo',
    supplierName: 'Flora & Verdant Biophilic Design',
    type: 'Material',
    quotationNumber: 'SQ-1001',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: '2026-08-30',
    items: [
      { materialId: 'mat-rose-red', name: 'Ecuadorian Long-Stem Red Roses', quantity: 150, unitPrice: 2.50, unit: 'Stems', total: 375, isAvailable: true, leadTime: '2 Days' },
      { materialId: 'mat-eucalyptus', name: 'Silver Dollar Eucalyptus Foliage', quantity: 50, unitPrice: 3.50, unit: 'Bunches', total: 175, isAvailable: true, leadTime: '2 Days' }
    ],
    subtotal: 550,
    discount: 25,
    tax: 0,
    freight: 45,
    otherCharges: 10,
    total: 580,
    status: 'Accepted',
    notes: 'Includes 5% bulk discount and refrigerated freight delivery.'
  }
];

export const DEFAULT_FALLBACK_MATERIALS: Material[] = [
  {
    id: 'mat-rose-red',
    name: 'Ecuadorian Long-Stem Red Roses',
    type: 'Preserved Flora',
    unit: 'Stems',
    costPerUnit: 2.50,
    stock: 500,
    minStock: 50,
    category: 'Cut Flowers',
    supplier: 'Andean Floral Farms'
  },
  {
    id: 'mat-hydrangea-pink',
    name: 'Dutch Pink Hydrangea Stems',
    type: 'Preserved Flora',
    unit: 'Stems',
    costPerUnit: 4.20,
    stock: 250,
    minStock: 30,
    category: 'Cut Flowers',
    supplier: 'Holland Bloom Importers'
  },
  {
    id: 'mat-eucalyptus',
    name: 'Silver Dollar Eucalyptus Foliage',
    type: 'Organics',
    unit: 'Bunches',
    costPerUnit: 3.50,
    stock: 180,
    minStock: 20,
    category: 'Foliage & Greens',
    supplier: 'Pacific Greenery Co.'
  },
  {
    id: 'mat-lily-white',
    name: 'Oriental White Lily Stems',
    type: 'Preserved Flora',
    unit: 'Stems',
    costPerUnit: 3.80,
    stock: 300,
    minStock: 40,
    category: 'Cut Flowers',
    supplier: 'Holland Bloom Importers'
  },
  {
    id: 'mat-foam-block',
    name: 'Oasis MaxLife Floral Foam Block',
    type: 'Accessory',
    unit: 'Blocks',
    costPerUnit: 1.15,
    stock: 400,
    minStock: 50,
    category: 'Floral Foam',
    supplier: 'Oasis Floral Products'
  },
  {
    id: 'mat-ribbon-satin',
    name: 'Double-Sided Satin Ribbon 2"',
    type: 'Accessory',
    unit: 'Meters',
    costPerUnit: 0.45,
    stock: 1200,
    minStock: 100,
    category: 'Ribbons & Wraps',
    supplier: 'Craft & Trim Wholesale'
  },
  {
    id: 'mat-wrap-kraft',
    name: 'Premium Waterproof Kraft Wrapping Paper',
    type: 'Accessory',
    unit: 'Sheets',
    costPerUnit: 0.35,
    stock: 900,
    minStock: 100,
    category: 'Ribbons & Wraps',
    supplier: 'Craft & Trim Wholesale'
  },
  {
    id: 'mat-glass-vase',
    name: 'Clear Cylinder Glass Vase 10"',
    type: 'Vessel',
    unit: 'Pieces',
    costPerUnit: 6.50,
    stock: 120,
    minStock: 15,
    category: 'Vessels & Glassware',
    supplier: 'Verdant Glassworks'
  }
];

export const MATERIALS: Material[] = DEFAULT_FALLBACK_MATERIALS;

export const FLORA_CATEGORIES: string[] = [
  'Bouquets',
  'Centerpieces & Table Vases',
  'Fresh Cut Flower Stems',
  'Indoor Plants & Planters',
  'Dried & Preserved Floral',
  'Floral Baskets & Gift Sets',
  'Funeral & Sympathy Floral',
  'Wedding & Bridal Installations',
  'Corporate & Event Decor',
  'Floral Accessories & Supplies'
];

export const FLORA_EVENT_TYPES: string[] = [
  'Weddings & Engagements',
  'Corporate Events & Galas',
  'Anniversaries & Romance',
  'Birthdays & Celebrations',
  'Funerals & Sympathy',
  'Baby Showers & Gender Reveals',
  'Graduations & Ceremonies',
  'Holidays & Seasonal',
  'Housewarming & Thank You'
];

export const FINISHED_PRODUCTS: FinishedProduct[] = [];

export const PRODUCTS = FINISHED_PRODUCTS; // Compatibility reference

export const MOCK_TRANSACTIONS: Transaction[] = [];

export const MOCK_INVENTORY_MOVEMENTS: InventoryMovement[] = [];

export const MOCK_AUDIT_LOGS: any[] = [];

export const MOCK_USERS: UserProfile[] = [
  {
    id: 'u-admin',
    name: 'Eleanor Vance',
    email: 'admin@verdantflora.com',
    role: 'Super Admin',
    status: 'Active',
    companyName: 'Verdant Biophilic Design Co.',
    phone: '+94 11 234 5678',
    createdAt: '2026-01-01T08:00:00Z',
    mfaEnabled: true,
    mfaType: 'totp',
    mfaSecret: 'JBSWY3DPEHPK3PXP',
    backupCodes: ['A9HF-4K28', 'B92M-HD76', 'QJ82-KP19', 'W73X-PL02', 'R82N-PL91', 'X93M-LK20'],
    emailVerified: true,
    password: 'AdminPassword123!',
    mustChangePassword: false,
    authAuditLogs: [
      {
        id: 'log-101',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        action: 'LOGIN_SUCCESS',
        ipAddress: '192.168.1.42',
        status: 'Success',
        details: 'Logged in via Password + TOTP Authenticator'
      }
    ]
  },
  {
    id: 'u-supplier-seven',
    name: 'Seven ignito',
    email: 'sevenignito@gmail.com',
    role: 'Supplier',
    status: 'Active',
    companyName: 'Flora & Verdant Biophilic Design',
    phone: '+1 800 555 0199',
    createdAt: '2026-02-01T09:00:00Z',
    mfaEnabled: false,
    emailVerified: true,
    password: 'Supplier123!',
    mustChangePassword: false
  },
  {
    id: 'u-ops',
    name: 'Marcus Brody',
    email: 'ops@verdantflora.com',
    role: 'Production Manager',
    status: 'Active',
    companyName: 'Verdant Biophilic Design Co.',
    phone: '+94 11 765 4321',
    createdAt: '2026-02-15T10:00:00Z',
    mfaEnabled: true,
    mfaType: 'email',
    emailVerified: true,
    password: 'OpsPassword123!',
    mustChangePassword: false
  }
];

