import React from 'react';
import { 
  ShoppingCart, 
  FileText, 
  PieChart, 
  Package, 
  Users, 
  Settings,
  History,
  Receipt,
  DollarSign,
  Truck,
  ArrowRight,
  LayoutDashboard
} from 'lucide-react';
import { motion } from 'motion/react';
import { CompanySettings, UserProfile } from '../../types';
import { cn } from '../../lib/utils';
import { translations, Language } from '../../i18n';
import { canAccessTab } from '../../lib/rbac';

interface LobbyProps {
  companySettings: CompanySettings;
  setActiveTab: (tab: string) => void;
  lowStockCount?: number;
  language: Language;
  currentUser?: UserProfile;
}

export default function Lobby({ companySettings, setActiveTab, lowStockCount = 0, language, currentUser }: LobbyProps) {
  const t = translations[language];

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.goodMorning;
    if (hour < 17) return t.goodAfternoon;
    return t.goodEvening;
  };

  const tiles = [
    {
      id: 'pos',
      title: 'Create Order',
      description: 'Create instant flora & biophilic installation orders with deposits',
      icon: ShoppingCart,
      color: 'bg-emerald-500',
      pattern: 'circles'
    },
    {
      id: 'order-management',
      title: 'Order System',
      description: 'Track workflow from design fabrication to site installation',
      icon: History,
      color: 'bg-blue-500',
      pattern: 'squares'
    },
    {
      id: 'quotation',
      title: 'Quotations',
      description: 'Generate B2B proposals for live walls, moss art & maintenance',
      icon: FileText,
      color: 'bg-blue-600',
      pattern: 'triangles'
    },
    {
      id: 'invoices',
      title: t.invoices,
      description: t.invoicesDescription,
      icon: Receipt,
      color: 'bg-purple-500',
      pattern: 'waves'
    },
    {
      id: 'expenses',
      title: t.expenses,
      description: t.expensesDescription,
      icon: DollarSign,
      color: 'bg-rose-500',
      pattern: 'dots'
    },
    {
      id: 'accounting',
      title: t.accounting,
      description: t.accountingDescription,
      icon: PieChart,
      color: 'bg-indigo-500',
      pattern: 'grid'
    },
    {
      id: 'products',
      title: 'Product Catalog',
      description: 'Manage live plant displays, preserved moss art & material BOMs',
      icon: LayoutDashboard,
      color: 'bg-indigo-600',
      pattern: 'grid'
    },
    {
      id: 'inventory',
      title: 'Botanical Stock',
      description: 'Track live plants, preserved moss, pots & installation hardware',
      icon: Package,
      color: 'bg-amber-500',
      pattern: 'hexagons',
      badge: lowStockCount > 0 ? `${lowStockCount} LOW` : null
    },
    {
      id: 'suppliers',
      title: t.suppliers,
      description: t.suppliersDescription,
      icon: Truck,
      color: 'bg-cyan-500',
      pattern: 'lines'
    },
    {
      id: 'customers',
      title: t.clients,
      description: t.customersDescription,
      icon: Users,
      color: 'bg-teal-500',
      pattern: 'zigzags'
    },
    {
      id: 'procurement',
      title: 'Procurement Portal',
      description: 'Manage supplier RFQs, service outsourcing and credit',
      icon: ShoppingCart,
      color: 'bg-blue-700',
      pattern: 'squares'
    },
    {
      id: 'logistics',
      title: 'Logistic Portal',
      description: 'Track deliveries, fleet and after-sales service',
      icon: Truck,
      color: 'bg-orange-600',
      pattern: 'waves'
    },
    {
      id: 'settings',
      title: t.settings,
      description: t.settingsDescription,
      icon: Settings,
      color: 'bg-slate-600',
      pattern: 'crosses'
    },
    {
      id: 'audit',
      title: 'Activity Trail',
      description: 'Audit history of all system transactions',
      icon: History,
      color: 'bg-zinc-700',
      pattern: 'lines'
    },
    {
      id: 'user-management',
      title: 'User & Admin Portal',
      description: 'Manage staff, user accounts, role approvals & access permissions',
      icon: Users,
      color: 'bg-purple-600',
      pattern: 'grid'
    }
  ];

  const visibleTiles = currentUser 
    ? tiles.filter(tile => canAccessTab(currentUser.role, tile.id, currentUser.customAllowedTabs))
    : tiles;

  return (
    <div className="flex-1 bg-gray-50 p-4 lg:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="space-y-0.5">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight"
          >
            {getTimeGreeting()}, <span className="text-primary">{companySettings.name}</span>!
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-gray-500 font-medium"
          >
            {t.welcomeBack}
          </motion.p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleTiles.map((tile, index) => (
            <motion.button
              key={tile.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => setActiveTab(tile.id)}
              className="group relative h-48 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden text-left flex flex-col p-5"
            >
              {/* Background UI Pattern */}
              <div className={cn(
                "absolute bottom-0 right-0 w-24 h-24 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none",
                tile.color.replace('bg-', 'text-')
              )}>
                {tile.pattern === 'circles' && (
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="40" fill="currentColor" />
                    <circle cx="80" cy="20" r="20" fill="currentColor" />
                  </svg>
                )}
                {tile.pattern === 'squares' && (
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <rect x="20" y="20" width="60" height="60" fill="currentColor" />
                    <rect x="70" y="0" width="30" height="30" fill="currentColor" />
                  </svg>
                )}
                {tile.pattern === 'triangles' && (
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <path d="M50 10 L90 90 L10 90 Z" fill="currentColor" />
                  </svg>
                )}
                {tile.pattern === 'waves' && (
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <path d="M0 50 Q25 0 50 50 T100 50 V100 H0 Z" fill="currentColor" />
                  </svg>
                )}
                {tile.pattern === 'dots' && (
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="20" cy="20" r="10" fill="currentColor" />
                    <circle cx="50" cy="50" r="10" fill="currentColor" />
                    <circle cx="80" cy="80" r="10" fill="currentColor" />
                  </svg>
                )}
                {tile.pattern === 'grid' && (
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <rect x="10" y="10" width="30" height="30" fill="currentColor" />
                    <rect x="50" y="10" width="30" height="30" fill="currentColor" />
                    <rect x="10" y="50" width="30" height="30" fill="currentColor" />
                    <rect x="50" y="50" width="30" height="30" fill="currentColor" />
                  </svg>
                )}
                {tile.pattern === 'hexagons' && (
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <path d="M50 0 L93 25 L93 75 L50 100 L7 75 L7 25 Z" fill="currentColor" />
                  </svg>
                )}
                {tile.pattern === 'lines' && (
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <rect x="0" y="20" width="100" height="10" fill="currentColor" />
                    <rect x="0" y="50" width="100" height="10" fill="currentColor" />
                    <rect x="0" y="80" width="100" height="10" fill="currentColor" />
                  </svg>
                )}
                {tile.pattern === 'zigzags' && (
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <path d="M0 20 L25 0 L50 20 L75 0 L100 20 V40 L75 20 L50 40 L25 20 L0 40 Z" fill="currentColor" />
                  </svg>
                )}
                {tile.pattern === 'crosses' && (
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <rect x="45" y="0" width="10" height="100" fill="currentColor" />
                    <rect x="0" y="45" width="100" height="10" fill="currentColor" />
                  </svg>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg",
                    tile.color
                  )}>
                    <tile.icon size={20} />
                  </div>
                  {tile.badge && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full shadow-lg shadow-red-500/20 animate-pulse">
                      {tile.badge}
                    </span>
                  )}
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">{tile.title}</h3>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed line-clamp-2">
                    {tile.description}
                  </p>
                </div>
              </div>

              <div className="mt-auto">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300",
                  "bg-gray-100 text-gray-400 group-hover:bg-primary group-hover:text-white"
                )}>
                  <ArrowRight size={14} />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
