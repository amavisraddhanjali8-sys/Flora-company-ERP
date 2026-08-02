import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { Notification, UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export function isNotificationDeserved(
  n: { category?: string; targetRole?: any; title?: string },
  userRole: UserRole
): boolean {
  // Super Admin receives all alerts
  if (userRole === 'Super Admin') {
    return true;
  }

  // Check explicit targetRole property if set
  if (n.targetRole) {
    if (n.targetRole === 'all') return true;
    if (n.targetRole === 'admin_only') return false;
    if (n.targetRole === 'staff_only') return userRole !== 'Client' && userRole !== 'Supplier';
    if (Array.isArray(n.targetRole)) return n.targetRole.includes(userRole);
    if (typeof n.targetRole === 'string') return n.targetRole === userRole;
  }

  // Category-based filtering when targetRole is unspecified:
  // Client (Customers & Web Storefront)
  if (userRole === 'Client') {
    // Clients only receive sales/orders updates or direct info. No internal system, hardware, accounting, inventory, or forecast alerts.
    if (n.category === 'system' || n.category === 'hardware' || n.category === 'accounting' || n.category === 'inventory' || n.category === 'forecast') {
      return false;
    }
    return true;
  }

  // Supplier
  if (userRole === 'Supplier') {
    if (n.category === 'system' || n.category === 'hardware' || n.category === 'accounting' || n.category === 'forecast') {
      return false;
    }
    return true;
  }

  // Specialized staff roles ('Sales Executive', 'Production Manager', 'Procurement Officer', 'Finance Manager', 'Logistics Manager')
  // Low-level hardware & raw system administration alerts are Super Admin only unless explicitly marked staff_only
  if (n.category === 'hardware' || n.category === 'system') {
    return false;
  }

  if (n.category === 'accounting') {
    return userRole === 'Finance Manager';
  }

  if (n.category === 'inventory') {
    return userRole === 'Production Manager' || userRole === 'Procurement Officer' || userRole === 'Logistics Manager';
  }

  if (n.category === 'forecast') {
    return userRole === 'Finance Manager' || userRole === 'Production Manager' || userRole === 'Sales Executive';
  }

  return true;
}

interface NotificationContextType {
  notifications: Notification[];
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
  markAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Notification[]>([]);
  const [userRole, setUserRoleState] = useState<UserRole>('Super Admin');
  const userRoleRef = useRef<UserRole>(userRole);

  const setUserRole = useCallback((role: UserRole) => {
    setUserRoleState(role);
    userRoleRef.current = role;
  }, []);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'date' | 'read'>) => {
    const newNotification: Notification = {
      ...n,
      id: Math.random().toString(36).substring(7),
      date: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Only show toast popup if the active role is entitled to receive it
    if (isNotificationDeserved(newNotification, userRoleRef.current)) {
      setToasts(prev => [...prev, newNotification]);

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newNotification.id));
      }, 5000);
    }
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Filter notifications list for the current active role
  const filteredNotifications = notifications.filter(n => isNotificationDeserved(n, userRole));

  return (
    <NotificationContext.Provider value={{ 
      notifications: filteredNotifications, 
      userRole, 
      setUserRole, 
      addNotification, 
      markAsRead, 
      deleteNotification, 
      markAllAsRead, 
      clearAll 
    }}>
      {children}
      
      {/* Toast Container - Only displays toasts allowed for current active role */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.filter(t => isNotificationDeserved(t, userRole)).map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={cn(
                "pointer-events-auto w-80 p-4 rounded-2xl shadow-2xl border flex gap-3 items-start",
                toast.type === 'success' ? "bg-green-50 border-green-100 text-green-900" :
                toast.type === 'error' ? "bg-red-50 border-red-100 text-red-900" :
                toast.type === 'warning' ? "bg-amber-50 border-amber-100 text-amber-900" :
                "bg-blue-50 border-blue-100 text-blue-900"
              )}
            >
              <div className="mt-0.5">
                {toast.type === 'success' && <CheckCircle2 size={18} className="text-green-500" />}
                {toast.type === 'error' && <AlertCircle size={18} className="text-red-500" />}
                {toast.type === 'warning' && <AlertTriangle size={18} className="text-amber-500" />}
                {toast.type === 'info' && <Info size={18} className="text-blue-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase tracking-widest mb-1">{toast.title}</p>
                <p className="text-[11px] font-medium leading-relaxed opacity-80">{toast.message}</p>
              </div>
              <button 
                onClick={() => removeToast(toast.id)}
                className="text-current opacity-40 hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};
