import React, { useState } from 'react';
import { AuditLog } from '../../types';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  Activity, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Download,
  Trash2,
  Database,
  ShoppingCart,
  Calculator,
  Settings,
  Users,
  Truck
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import ConfirmModal from './ConfirmModal';

import { translations, Language } from '../../i18n';

interface SystemAuditLogProps {
  logs: AuditLog[];
  onClearLogs: () => void;
  language?: Language;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function SystemAuditLog({ 
  logs, 
  onClearLogs, 
  language = 'en',
  searchQuery,
  setSearchQuery
}: SystemAuditLogProps) {
  const t = translations[language];
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const filteredLogs = (logs || []).filter(log => {
    const matchesSearch = 
      (log.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || log.type === filterType;
    const matchesCategory = filterCategory === 'all' || log.category === filterCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'error': return <XCircle size={16} className="text-red-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sales': return <ShoppingCart size={14} />;
      case 'accounting': return <Calculator size={14} />;
      case 'system': return <Settings size={14} />;
      case 'inventory': return <Database size={14} />;
      case 'clients': return <Users size={14} />;
      case 'suppliers': return <Truck size={14} />;
      default: return <Activity size={14} />;
    }
  };

  const handleDownloadCSV = () => {
    const headers = ['Date', 'User', 'Action', 'Category', 'Type', 'Details'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        new Date(log.date).toLocaleString(),
        log.userName,
        `"${log.action}"`,
        log.category,
        log.type,
        `"${log.details}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
              <Activity className="text-primary" size={28} />
              System Audit Log
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Track all system activities and security events</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
            >
              <Download size={18} />
              Export CSV
            </button>
            <button
              onClick={() => setIsConfirmModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-xl text-sm font-bold text-red-600 hover:bg-red-100 transition-all shadow-sm"
            >
              <Trash2 size={18} />
              Clear Logs
            </button>
          </div>
        </div>

        <ConfirmModal 
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={onClearLogs}
          title="Clear Audit Logs"
          message="Are you sure you want to clear all audit logs? This action cannot be undone."
          type="danger"
          language={language}
        />

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t.searchLogs || "Search by action, user, or details..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl p-1 shadow-sm">
              <button
                onClick={() => setFilterType('all')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  filterType === 'all' ? "bg-gray-900 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                All Types
              </button>
              <button
                onClick={() => setFilterType('info')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  filterType === 'info' ? "bg-blue-500 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                Info
              </button>
              <button
                onClick={() => setFilterType('success')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  filterType === 'success' ? "bg-green-500 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                Success
              </button>
              <button
                onClick={() => setFilterType('warning')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  filterType === 'warning' ? "bg-amber-500 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                Warning
              </button>
              <button
                onClick={() => setFilterType('error')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  filterType === 'error' ? "bg-red-500 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                Error
              </button>
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            >
              <option value="all">All Categories</option>
              <option value="sales">Sales</option>
              <option value="accounting">Accounting</option>
              <option value="inventory">Inventory</option>
              <option value="clients">Clients</option>
              <option value="suppliers">Suppliers</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto space-y-4">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={log.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    log.type === 'success' ? "bg-green-50 text-green-600" :
                    log.type === 'warning' ? "bg-amber-50 text-amber-600" :
                    log.type === 'error' ? "bg-red-50 text-red-600" :
                    "bg-blue-50 text-blue-600"
                  )}>
                    {getIcon(log.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <h3 className="font-black text-gray-900 text-sm uppercase tracking-tight truncate">
                        {log.action}
                      </h3>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase shrink-0">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(log.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(log.date).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                      {log.details}
                    </p>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase bg-gray-50 px-2 py-1 rounded-lg">
                        <User size={12} />
                        {log.userName}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase bg-primary/5 px-2 py-1 rounded-lg">
                        {getCategoryIcon(log.category)}
                        {log.category}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Activity size={40} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-gray-600">No logs found</h3>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
