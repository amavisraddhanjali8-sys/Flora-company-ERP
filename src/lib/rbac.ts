import { UserRole } from '../types';

export interface RoleInfo {
  role: UserRole;
  displayName: string;
  category: 'Internal Staff' | 'External Partner';
  badgeColor: string;
  description: string;
  allowedTabs: string[];
  defaultTab: string;
}

export const ROLE_CONFIGS: Record<UserRole, RoleInfo> = {
  'Super Admin': {
    role: 'Super Admin',
    displayName: 'Super Admin',
    category: 'Internal Staff',
    badgeColor: 'bg-purple-600 text-white border-purple-300',
    description: 'Full system control: User approvals, system audit logs, settings & all functional portals.',
    allowedTabs: [
      'lobby',
      'pos',
      'order-management',
      'quotation',
      'invoices',
      'inventory',
      'products',
      'accounting',
      'expenses',
      'suppliers',
      'customers',
      'procurement',
      'logistics',
      'settings',
      'user-management',
      'storefront'
    ],
    defaultTab: 'lobby'
  },
  'Sales Executive': {
    role: 'Sales Executive',
    displayName: 'Sales Executive',
    category: 'Internal Staff',
    badgeColor: 'bg-emerald-600 text-white border-emerald-300',
    description: 'Client management, biophilic quotations, direct sales orders, invoice view & order tracking.',
    allowedTabs: [
      'pos',
      'order-management',
      'quotation',
      'invoices',
      'customers',
      'storefront'
    ],
    defaultTab: 'pos'
  },
  'Production Manager': {
    role: 'Production Manager',
    displayName: 'Production / Inventory Manager',
    category: 'Internal Staff',
    badgeColor: 'bg-blue-600 text-white border-blue-300',
    description: 'Botanical catalog, bill of materials (BOM), living wall fabrication & order status updates.',
    allowedTabs: [
      'products',
      'inventory',
      'order-management',
      'logistics',
      'storefront'
    ],
    defaultTab: 'products'
  },
  'Procurement Officer': {
    role: 'Procurement Officer',
    displayName: 'Procurement Officer',
    category: 'Internal Staff',
    badgeColor: 'bg-amber-600 text-white border-amber-300',
    description: 'Vendor RFQs, purchase orders, supplier evaluation, stock reorder alerts & material expenses.',
    allowedTabs: [
      'procurement',
      'suppliers',
      'inventory',
      'expenses',
      'storefront'
    ],
    defaultTab: 'procurement'
  },
  'Finance Manager': {
    role: 'Finance Manager',
    displayName: 'Finance / Accountant',
    category: 'Internal Staff',
    badgeColor: 'bg-indigo-600 text-white border-indigo-300',
    description: 'Invoice generation, expense reviews & payment approvals, general ledger & profit/loss statements.',
    allowedTabs: [
      'accounting',
      'invoices',
      'expenses',
      'storefront'
    ],
    defaultTab: 'accounting'
  },
  'Logistics Manager': {
    role: 'Logistics Manager',
    displayName: 'Logistics Manager',
    category: 'Internal Staff',
    badgeColor: 'bg-cyan-600 text-white border-cyan-300',
    description: 'Delivery dispatch, fleet tracking, site installation QC inspections & delivery notes.',
    allowedTabs: [
      'logistics',
      'order-management',
      'storefront'
    ],
    defaultTab: 'logistics'
  },
  'Client': {
    role: 'Client',
    displayName: 'Client Portal User',
    category: 'External Partner',
    badgeColor: 'bg-teal-600 text-white border-teal-300',
    description: 'Self-service portal: View flora project status, download invoices, request custom quotes & payments.',
    allowedTabs: [
      'order-management',
      'invoices',
      'quotation',
      'storefront'
    ],
    defaultTab: 'order-management'
  },
  'Supplier': {
    role: 'Supplier',
    displayName: 'Supplier Portal User',
    category: 'External Partner',
    badgeColor: 'bg-rose-600 text-white border-rose-300',
    description: 'Vendor portal: Review company RFQs, send itemized quotations with discounts/freight, view awarded POs, dispatch goods, review GRNs & generate invoices.',
    allowedTabs: [
      'supplier-portal',
      'storefront'
    ],
    defaultTab: 'supplier-portal'
  },
  'Outsourced Partner': {
    role: 'Outsourced Partner',
    displayName: 'Outsourced Service Partner',
    category: 'External Partner',
    badgeColor: 'bg-purple-600 text-white border-purple-300',
    description: 'Outsourced partner portal: View service RFQs, submit contract quotes, dispatch completed jobs, share proof documents & generate invoices.',
    allowedTabs: [
      'supplier-portal',
      'storefront'
    ],
    defaultTab: 'supplier-portal'
  }
};

export function canAccessTab(role: UserRole, tabId: string, customTabs?: string[]): boolean {
  if (tabId === 'storefront') return true;
  if (customTabs && customTabs.length > 0) {
    return customTabs.includes(tabId);
  }
  if (tabId === 'lobby' && role !== 'Super Admin') return false;
  const config = ROLE_CONFIGS[role];
  if (!config) return false;
  return config.allowedTabs.includes(tabId);
}

export function getRoleAllowedTabs(role: UserRole): string[] {
  return ROLE_CONFIGS[role]?.allowedTabs || ['pos'];
}
