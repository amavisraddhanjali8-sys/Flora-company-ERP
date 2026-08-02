import { FinishedProduct, Client, CompanySettings, TermAndCondition, Transaction, InventoryMovement, Notification, Supplier, LedgerAccount, Material, UserProfile } from './types';

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

export const MOCK_SUPPLIERS: Supplier[] = [];

export const MATERIALS: Material[] = [];

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
    mfaEnabled: false,
  }
];

