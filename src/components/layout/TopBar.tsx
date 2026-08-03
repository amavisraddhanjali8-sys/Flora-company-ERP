import React, { useState } from 'react';
import { Bell, Search, User, X, CheckCircle2, AlertTriangle, AlertCircle, Info, Trash2, Barcode, Globe, Keyboard as KeyboardIcon, Home, Printer, ShieldCheck, ChevronDown, Sparkles, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../../context/NotificationContext';
import { Notification, UserProfile, UserRole } from '../../types';
import { cn } from '../../lib/utils';
import { translations, Language } from '../../i18n';
import InfoModal from './InfoModal';
import { ROLE_CONFIGS, canAccessTab } from '../../lib/rbac';

interface TopBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  scannerStatus: 'idle' | 'connected' | 'error';
  scannerMessage: string | null;
  language: Language;
  setLanguage: (lang: Language) => void;
  isKeyboardOpen: boolean;
  setIsKeyboardOpen: (open: boolean) => void;
  onOpenPrinterSettings?: () => void;
  printerSettings?: {
    receiptPrinter: string;
    reportPrinter: string;
    isConnected: boolean;
    isDrawerConnected: boolean;
  };
  lowStockCount?: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSwitchUser: (user: UserProfile) => void;
  onOpenAuthScreen: () => void;
  onLogout?: () => void;
  onOpenChangePassword?: () => void;
}

export default function TopBar({ 
  activeTab,
  setActiveTab,
  scannerStatus, 
  scannerMessage,
  language,
  setLanguage,
  isKeyboardOpen,
  setIsKeyboardOpen,
  onOpenPrinterSettings,
  printerSettings,
  lowStockCount = 0,
  searchQuery,
  setSearchQuery,
  currentUser,
  allUsers,
  onSwitchUser,
  onOpenAuthScreen,
  onLogout,
  onOpenChangePassword
}: TopBarProps) {
  const { notifications, markAsRead, deleteNotification, markAllAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const t = translations[language];

  const unreadCount = (notifications || []).filter(n => !n.read).length;
  const roleConfig = ROLE_CONFIGS[currentUser.role];

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-green-500" size={16} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={16} />;
      case 'error': return <AlertCircle className="text-red-500" size={16} />;
      default: return <Info className="text-blue-500" size={16} />;
    }
  };


  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-40 print:hidden overflow-x-auto no-scrollbar gap-2 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        {currentUser.role === 'Super Admin' && activeTab !== 'lobby' && (
          <button 
            onClick={() => setActiveTab('lobby')}
            className="p-1.5 sm:p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all group shrink-0"
            title="Go to Admin Dashboard"
          >
            <Home size={18} className="group-hover:scale-110 transition-transform sm:w-5 sm:h-5" />
          </button>
        )}
        {currentUser.role !== 'Super Admin' && activeTab !== (ROLE_CONFIGS[currentUser.role]?.defaultTab || 'pos') && (
          <button 
            onClick={() => setActiveTab(ROLE_CONFIGS[currentUser.role]?.defaultTab || 'pos')}
            className="p-1.5 sm:p-2 bg-emerald-50 text-emerald-800 rounded-xl hover:bg-emerald-600 hover:text-white transition-all group shrink-0"
            title="Go to Portal Home"
          >
            <Home size={18} className="group-hover:scale-110 transition-transform sm:w-5 sm:h-5" />
          </button>
        )}
        <div className="relative w-32 xs:w-40 sm:w-52 md:w-64 group shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={14} />
          <input 
            type="text" 
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:border-primary focus:bg-white transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Barcode Scanner Status */}
        <button 
          onClick={() => {
            setIsInfoModalOpen(true);
          }}
          className={cn(
            "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border hover:shadow-md shrink-0",
            scannerStatus === 'connected' ? "bg-green-50 text-green-600 border-green-100" :
            scannerStatus === 'error' ? "bg-red-50 text-red-600 border-red-100" :
            "bg-gray-50 text-gray-400 border-gray-100"
          )}
        >
          <Barcode size={13} className={cn(scannerStatus === 'connected' && "animate-pulse")} />
          <span className="tracking-wider">
            {scannerStatus === 'connected' ? t.scannerReady : 
             scannerStatus === 'error' ? t.scannerError : t.scannerIdle}
          </span>
        </button>

        <InfoModal 
          isOpen={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          title={t.scannerReady}
          message={t.scannerInfo}
          language={language}
        />

        {/* Printer Settings Button */}
        <button 
          onClick={onOpenPrinterSettings}
          className={cn(
            "hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border hover:shadow-md shrink-0",
            printerSettings?.isConnected ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-gray-50 text-gray-400 border-gray-100"
          )}
        >
          <Printer size={13} className={cn(printerSettings?.isConnected && "animate-pulse")} />
          <span className="tracking-wider">
            {printerSettings?.isConnected ? 'Printer Online' : t.printerSettings}
          </span>
        </button>

        {/* Low Stock Indicator */}
        {lowStockCount > 0 && canAccessTab(currentUser.role, 'inventory', currentUser.customAllowedTabs) && (
          <button 
            onClick={() => setActiveTab('inventory')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border border-red-100 bg-red-50 text-red-600 hover:shadow-md animate-pulse shrink-0"
          >
            <AlertTriangle size={13} />
            <span className="tracking-wider">{lowStockCount} {t.lowStockItems}</span>
          </button>
        )}
        
        <nav className="hidden xl:flex items-center gap-1 ml-4 border-l border-gray-100 pl-4">
          {canAccessTab(currentUser.role, 'pos', currentUser.customAllowedTabs) && (
            <button 
              onClick={() => setActiveTab('pos')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all tracking-wider",
                activeTab === 'pos' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-500 hover:bg-gray-100"
              )}
            >
              Pos
            </button>
          )}
          {canAccessTab(currentUser.role, 'products', currentUser.customAllowedTabs) && (
            <button 
              onClick={() => setActiveTab('products')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all tracking-wider",
                activeTab === 'products' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-500 hover:bg-gray-100"
              )}
            >
              Products
            </button>
          )}
          {canAccessTab(currentUser.role, 'inventory', currentUser.customAllowedTabs) && (
            <button 
              onClick={() => setActiveTab('inventory')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all tracking-wider whitespace-nowrap",
                activeTab === 'inventory' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-500 hover:bg-gray-100"
              )}
            >
              Materials
            </button>
          )}
          {canAccessTab(currentUser.role, 'quotation', currentUser.customAllowedTabs) && (
            <button 
              onClick={() => setActiveTab('quotation')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all tracking-wider",
                activeTab === 'quotation' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-500 hover:bg-gray-100"
              )}
            >
              Quotes
            </button>
          )}
          {canAccessTab(currentUser.role, 'procurement', currentUser.customAllowedTabs) && (
            <button 
              onClick={() => setActiveTab('procurement')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all tracking-wider",
                activeTab === 'procurement' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-500 hover:bg-gray-100"
              )}
            >
              Procure
            </button>
          )}
          {canAccessTab(currentUser.role, 'logistics', currentUser.customAllowedTabs) && (
            <button 
              onClick={() => setActiveTab('logistics')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all tracking-wider",
                activeTab === 'logistics' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-500 hover:bg-gray-100"
              )}
            >
              Logistics
            </button>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* Language Switcher */}
        <div className="flex items-center bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setLanguage('en')}
            className={cn(
              "px-3 py-1 text-[10px] font-bold rounded-lg transition-all",
              language === 'en' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('si')}
            className={cn(
              "px-3 py-1 text-[10px] font-bold rounded-lg transition-all",
              language === 'si' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            සිං
          </button>
        </div>

        {/* Storefront Quick Toggle Button */}
        <button
          onClick={() => {
            if (activeTab === 'storefront') {
              const defaultTab = ROLE_CONFIGS[currentUser.role]?.defaultTab || 'pos';
              const target = currentUser.role === 'Super Admin' ? 'lobby' : defaultTab;
              setActiveTab(target);
            } else {
              setActiveTab('storefront');
            }
          }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all shadow-sm border",
            activeTab === 'storefront' 
              ? "bg-purple-900 text-white border-purple-800 hover:bg-purple-950"
              : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
          )}
          title="Toggle between Public Storefront and Internal ERP"
        >
          <Globe size={14} className={activeTab === 'storefront' ? "text-amber-300" : "text-emerald-700"} />
          <span className="hidden sm:inline">
            {activeTab === 'storefront' ? 'Return to ERP' : 'Web Storefront'}
          </span>
        </button>

        {/* Keyboard Toggle */}
        <button
          onClick={() => setIsKeyboardOpen(!isKeyboardOpen)}
          className={cn(
            "p-2 rounded-xl transition-all relative",
            isKeyboardOpen ? "bg-primary/10 text-primary" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          )}
          title={t.keyboard}
        >
          <KeyboardIcon size={20} />
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "p-2 rounded-xl transition-all relative",
              isOpen ? "bg-primary/10 text-primary" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            )}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsOpen(false)} 
                />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{t.notifications}</h3>
                      <p className="text-[10px] text-gray-500 font-bold tracking-wider">{t.systemAlerts}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={markAllAsRead}
                        className="text-[10px] font-bold text-primary hover:underline"
                      >
                        {t.markAllRead}
                      </button>
                      <button 
                        onClick={clearAll}
                        className="text-[10px] font-bold text-red-500 hover:underline"
                      >
                        {t.clearAll}
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center space-y-2">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                          <Bell className="text-gray-300" size={24} />
                        </div>
                        <p className="text-xs text-gray-400 italic">{t.noNotifications}</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {notifications.map((n) => (
                          <div 
                            key={n.id} 
                            className={cn(
                              "p-4 flex gap-3 hover:bg-gray-50 transition-colors relative group",
                              !n.read && "bg-primary/5"
                            )}
                            onClick={() => markAsRead(n.id)}
                          >
                            <div className="mt-0.5 shrink-0">
                              {getIcon(n.type)}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className={cn("text-xs font-bold truncate", n.read ? "text-gray-700" : "text-gray-900")}>
                                  {n.title}
                                </p>
                                <span className="text-[9px] text-gray-400 whitespace-nowrap">
                                  {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                                {n.message}
                              </p>
                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[9px] font-bold tracking-wider text-gray-400 px-1.5 py-0.5 bg-gray-100 rounded">
                                  {n.category}
                                </span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(n.id);
                                  }}
                                  className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
                    <button className="text-[10px] font-bold text-gray-500 hover:text-primary transition-colors">
                      {t.viewAllNotifications}
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="h-8 w-px bg-gray-200 mx-1" />

        {/* User & Role Quick Selector */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2.5 pl-2 py-1 pr-2 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
            title="Click to switch role or view portal permissions"
          >
            <div className="text-right hidden sm:block">
              <div className="text-xs font-extrabold text-slate-900 leading-none">{currentUser.name}</div>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                  roleConfig?.badgeColor || "bg-gray-100 text-gray-800"
                )}>
                  {currentUser.role}
                </span>
                <ChevronDown size={12} className="text-slate-400" />
              </div>
            </div>
            <div className="w-9 h-9 bg-emerald-700 text-white rounded-xl flex items-center justify-center font-bold text-xs shadow-md shadow-emerald-700/20">
              {currentUser.name.charAt(0)}
            </div>
          </button>

          <AnimatePresence>
            {isRoleDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsRoleDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 p-3 space-y-2"
                >
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Account</span>
                      <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                        <ShieldCheck size={12} /> {currentUser.status}
                      </span>
                    </div>
                    <div className="font-extrabold text-slate-900 text-xs">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                    {currentUser.id !== 'guest' && onOpenChangePassword && (
                      <button
                        onClick={() => {
                          setIsRoleDropdownOpen(false);
                          onOpenChangePassword();
                        }}
                        className="w-full mt-1.5 py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Key size={13} className="text-purple-600" />
                        <span>Change Password (Account Owner)</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                      <span>Switch Active Role (RBAC Demo)</span>
                      <Sparkles size={12} className="text-emerald-600" />
                    </div>

                    <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                      {allUsers.filter(u => u.status === 'Active').map(u => {
                        const conf = ROLE_CONFIGS[u.role];
                        const isCurrent = u.id === currentUser.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              onSwitchUser(u);
                              setIsRoleDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full text-left p-2 rounded-xl transition-all flex items-center justify-between group",
                              isCurrent ? "bg-emerald-50 border border-emerald-200 font-bold" : "hover:bg-slate-50 border border-transparent"
                            )}
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-800">{u.name}</div>
                              <div className="text-[10px] text-slate-500 truncate">{u.role}</div>
                            </div>
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0",
                              conf?.badgeColor || "bg-gray-100 text-gray-800"
                            )}>
                              {u.role.split(' ')[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => {
                        setIsRoleDropdownOpen(false);
                        onOpenAuthScreen();
                      }}
                      className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all text-center"
                    >
                      Login / Signup
                    </button>
                    {onLogout && currentUser.id !== 'guest' && (
                      <button
                        onClick={() => {
                          setIsRoleDropdownOpen(false);
                          onLogout();
                        }}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                        title="Log Out & Clear Active Session"
                      >
                        <X size={14} />
                        <span>Log Out</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );

}
