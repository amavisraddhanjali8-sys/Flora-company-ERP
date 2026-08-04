import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  FileText, 
  PieChart, 
  Package, 
  Users, 
  Settings,
  LogOut,
  History,
  Receipt,
  DollarSign,
  Truck,
  Flower2,
  ShieldCheck,
  User,
  ShoppingBag,
  Globe,
  Truck as TruckIcon,
  Menu,
  X,
  Building2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { translations, Language } from '../../i18n';
import { UserProfile } from '../../types';
import { canAccessTab, ROLE_CONFIGS } from '../../lib/rbac';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: Language;
  currentUser: UserProfile;
  onOpenAuthScreen: () => void;
  onLogout: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  language,
  currentUser,
  onOpenAuthScreen,
  onLogout
}: SidebarProps) {
  const t = translations[language];
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const allMenuItems = [
    { id: 'storefront', label: 'E-Commerce Website', icon: Globe },
    { id: 'supplier-portal', label: 'Supplier & Partner Portal', icon: Building2 },
    { id: 'lobby', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Create Order', icon: ShoppingCart },
    { id: 'order-management', label: 'Order System', icon: History },
    { id: 'quotation', label: 'Quotations', icon: FileText },
    { id: 'invoices', label: 'Billing', icon: Receipt },
    { id: 'inventory', label: 'Botanical Stock', icon: Package },
    { id: 'products', label: 'Product Catalog', icon: ShoppingBag },
    { id: 'procurement', label: 'Procurement', icon: TruckIcon },
    { id: 'logistics', label: 'Logistics & QC', icon: Truck },
    { id: 'accounting', label: 'Finance', icon: PieChart },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'suppliers', label: 'Partners', icon: Users },
    { id: 'customers', label: 'Clients', icon: Users },
    { id: 'user-management', label: 'User & Admin Portal', icon: ShieldCheck },
    { id: 'settings', label: 'System', icon: Settings },
  ];

  // Filter menu items strictly based on role permissions
  const menuItems = allMenuItems.filter(item => canAccessTab(currentUser.role, item.id, currentUser.customAllowedTabs));

  const roleConfig = ROLE_CONFIGS[currentUser.role];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileDrawerOpen(false);
  };

  return (
    <>
      {/* Desktop/Tablet Sidebar (Fixed narrow on sm/md, wide on lg) */}
      <aside className="w-14 sm:w-16 lg:w-56 bg-white border-r border-gray-200 flex flex-col h-screen transition-all duration-300 print:hidden shrink-0 z-30">
        <div className="p-3 sm:p-4 flex items-center justify-between gap-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 via-indigo-500 to-pink-500 rounded-lg flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
              <Flower2 size={18} />
            </div>
            <div className="hidden lg:block overflow-hidden">
              <span className="font-bold text-base tracking-tight text-slate-900 block leading-tight truncate">Flora & Verdant</span>
              <span className="text-[10px] text-sky-600 font-bold uppercase tracking-wider block truncate">Enterprise OMS</span>
            </div>
          </div>
          {/* Mobile Menu Expansion Trigger */}
          <button 
            onClick={() => setIsMobileDrawerOpen(true)}
            className="lg:hidden p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
            title="Expand Navigation Menu"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* User Badge Section */}
        <div className="p-3 border-b border-gray-100 bg-sky-50/40 hidden lg:block">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-pink-500 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="font-bold text-xs text-slate-800 truncate">{currentUser.name}</div>
              <div className="text-[10px] text-slate-500 truncate">{currentUser.companyName || currentUser.email}</div>
            </div>
          </div>
          <div className={cn(
            "px-2 py-0.5 rounded-md text-[10px] font-bold inline-block border mt-1 truncate max-w-full",
            roleConfig?.badgeColor || "bg-sky-100 text-sky-800 border-sky-300"
          )}>
            {currentUser.role}
          </div>
        </div>

        <nav className="flex-1 px-1.5 sm:px-2 space-y-1 mt-2 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 sm:px-3 py-2.5 rounded-xl transition-all duration-200 group text-left",
                activeTab === item.id 
                  ? "bg-gradient-to-r from-sky-600 via-indigo-600 to-pink-600 text-white shadow-md shadow-sky-500/20 font-bold" 
                  : "text-gray-600 hover:bg-sky-50/70 hover:text-sky-900"
              )}
              title={item.label}
            >
              <item.icon size={18} className={cn(
                "shrink-0 mx-auto lg:mx-0",
                activeTab === item.id ? "text-white" : "group-hover:text-sky-600 text-gray-500"
              )} />
              <span className="font-medium text-xs hidden lg:block truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-gray-100 space-y-1">
          <button
            onClick={onOpenAuthScreen}
            className="w-full flex items-center gap-2 px-2.5 sm:px-3 py-2 text-gray-600 hover:bg-sky-50 hover:text-sky-800 rounded-xl transition-colors group"
            title="Switch User / Portal Login"
          >
            <User size={18} className="shrink-0 text-sky-600 mx-auto lg:mx-0" />
            <span className="font-bold text-xs hidden lg:block truncate">Switch Portal</span>
          </button>

          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-2.5 sm:px-3 py-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors group"
            title="Log Out"
          >
            <LogOut size={18} className="shrink-0 group-hover:text-red-600 text-gray-400 mx-auto lg:mx-0" />
            <span className="font-medium text-xs hidden lg:block truncate">{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Full-screen Mobile & Tablet Navigation Drawer Overlay */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Slide-out Drawer Panel */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-emerald-400 rounded-lg flex items-center justify-center text-slate-900 font-bold">
                    <Flower2 size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Flora & Verdant</div>
                    <div className="text-[10px] text-sky-300 uppercase tracking-widest font-semibold">OMS & Storefront</div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Active User info card inside mobile drawer */}
              <div className="p-3.5 bg-sky-50/60 border-b border-sky-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-xs text-slate-800 truncate">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{currentUser.role}</div>
                  </div>
                </div>
                <div className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-extrabold border shrink-0",
                  roleConfig?.badgeColor || "bg-sky-100 text-sky-800 border-sky-300"
                )}>
                  {currentUser.role}
                </div>
              </div>

              {/* Drawer Links */}
              <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left text-xs font-bold",
                      activeTab === item.id
                        ? "bg-gradient-to-r from-sky-600 via-indigo-600 to-pink-600 text-white shadow-md shadow-sky-500/20"
                        : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900"
                    )}
                  >
                    <item.icon size={18} className={activeTab === item.id ? "text-white" : "text-sky-600"} />
                    <span className="flex-1">{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* Footer actions inside mobile drawer */}
              <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onOpenAuthScreen();
                  }}
                  className="w-full py-2.5 px-3 bg-white hover:bg-sky-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <User size={16} className="text-sky-600" />
                  <span>Switch Portal / Role</span>
                </button>

                {onLogout && (
                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      onLogout();
                    }}
                    className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}


