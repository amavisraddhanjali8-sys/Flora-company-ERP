import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  ShieldCheck, 
  Search, 
  Plus, 
  Check, 
  X, 
  Filter, 
  Building2, 
  FileText, 
  Mail, 
  Phone, 
  Clock, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Shield,
  Key,
  Trash2,
  Edit,
  Power,
  ShieldAlert,
  Sliders,
  Eye,
  CheckSquare,
  Square,
  UserPlus,
  RefreshCw,
  Unlock,
  KeyRound,
  RotateCcw,
  Activity,
  Briefcase,
  FileCheck,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { ROLE_CONFIGS } from '../../lib/rbac';
import { cn } from '../../lib/utils';
import { useNotifications } from '../../context/NotificationContext';

interface UserManagementPortalProps {
  users: UserProfile[];
  currentUser: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onAddUser: (newUser: Omit<UserProfile, 'id' | 'createdAt'>) => void;
  onDeleteUser?: (userId: string) => void;
}

const ALL_SYSTEM_TABS = [
  { id: 'lobby', label: 'Executive Dashboard', category: 'System' },
  { id: 'pos', label: 'Create Order (POS)', category: 'Sales' },
  { id: 'order-management', label: 'Order Processing', category: 'Sales' },
  { id: 'quotation', label: 'Quotations', category: 'Sales' },
  { id: 'invoices', label: 'Billing & Invoices', category: 'Finance' },
  { id: 'inventory', label: 'Botanical Stock', category: 'Inventory' },
  { id: 'products', label: 'Product Catalog', category: 'Inventory' },
  { id: 'procurement', label: 'Procurement Portal', category: 'Supply Chain' },
  { id: 'logistics', label: 'Logistics & Dispatch', category: 'Supply Chain' },
  { id: 'accounting', label: 'Finance & Ledger', category: 'Finance' },
  { id: 'expenses', label: 'Expenses Manager', category: 'Finance' },
  { id: 'suppliers', label: 'Supplier Network', category: 'Partners' },
  { id: 'customers', label: 'Clients Directory', category: 'Partners' },
  { id: 'user-management', label: 'User & Admin Portal', category: 'Admin' },
  { id: 'settings', label: 'System Settings', category: 'Admin' },
  { id: 'storefront', label: 'E-Commerce Website', category: 'Public' },
];

export default function UserManagementPortal({
  users,
  currentUser,
  onUpdateUser,
  onAddUser,
  onDeleteUser
}: UserManagementPortalProps) {
  const { addNotification } = useNotifications();
  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'access-giving' | 'security'>('accounts');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Active' | 'Pending Approval' | 'Deactivated' | 'Rejected'>('All');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [accessCategoryFilter, setAccessCategoryFilter] = useState<string>('All');
  
  // Security Policies State
  const [requireApprovalForNewUsers, setRequireApprovalForNewUsers] = useState(true);
  const [forceMfaForAdminFinance, setForceMfaForAdminFinance] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [allowSelfServiceReset, setAllowSelfServiceReset] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserProfile | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [userForAccessGrant, setUserForAccessGrant] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [userToDeactivate, setUserToDeactivate] = useState<UserProfile | null>(null);

  // New User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Sales Executive');
  const [newCompany, setNewCompany] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newMfa, setNewMfa] = useState(false);

  // Edit User State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Sales Executive');
  const [editCompany, setEditCompany] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTaxId, setEditTaxId] = useState('');
  const [editStatus, setEditStatus] = useState<UserProfile['status']>('Active');
  const [editMfa, setEditMfa] = useState(false);

  // Custom Access State
  const [selectedCustomTabs, setSelectedCustomTabs] = useState<string[]>([]);

  // Permission check
  const isAdmin = currentUser.role === 'Super Admin';
  const hasPortalAccess = isAdmin || (currentUser.customAllowedTabs && currentUser.customAllowedTabs.includes('user-management'));

  if (!hasPortalAccess) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="bg-gradient-to-br from-rose-950 via-slate-900 to-red-950 rounded-3xl p-8 text-white shadow-2xl border border-rose-500/30 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-rose-100">Super Admin Portal Access Restricted</h2>
          <p className="text-sm text-rose-200/80 leading-relaxed">
            The User Management and Access Control Portal is strictly reserved for authorized <strong className="text-white">Super Administrators</strong> or users granted custom portal rights.
            Your account role (<strong className="text-amber-300">{currentUser.role}</strong>) does not currently possess administrative management rights.
          </p>
          <div className="pt-2">
            <span className="px-4 py-2 bg-rose-900/60 text-rose-200 text-xs font-mono font-bold rounded-xl border border-rose-700/50 inline-block">
              SECURITY EVENT LOGGED • USER: {currentUser.email}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Active Super Admins count
  const activeAdminsCount = users.filter(u => u.role === 'Super Admin' && u.status === 'Active').length;

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.companyName && u.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.phone && u.phone.includes(searchQuery));
    const matchesStatus = selectedStatus === 'All' || u.status === selectedStatus;
    const matchesRole = selectedRole === 'All' || u.role === selectedRole;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const pendingCount = users.filter(u => u.status === 'Pending Approval').length;
  const activeCount = users.filter(u => u.status === 'Active').length;
  const deactivatedCount = users.filter(u => u.status === 'Deactivated').length;

  // Handlers
  const handleApprove = (user: UserProfile) => {
    const updated: UserProfile = {
      ...user,
      status: 'Active',
      approvedAt: new Date().toISOString(),
      approvedBy: currentUser.name
    };
    onUpdateUser(updated);
    addNotification({
      title: 'User Application Approved',
      message: `Approved ${user.name} (${user.email}) as ${user.role}.`,
      type: 'success',
      category: 'system'
    });
  };

  const handleReject = (user: UserProfile) => {
    const updated: UserProfile = {
      ...user,
      status: 'Rejected'
    };
    onUpdateUser(updated);
    addNotification({
      title: 'User Application Declined',
      message: `Declined account access for ${user.name}.`,
      type: 'warning',
      category: 'system'
    });
  };

  const handleToggleDeactivate = (user: UserProfile) => {
    if (user.role === 'Super Admin') {
      if (user.status === 'Active' && activeAdminsCount <= 1) {
        addNotification({
          title: 'Action Blocked',
          message: 'Cannot deactivate the last remaining active Super Admin in the system.',
          type: 'error',
          category: 'system'
        });
        return;
      }
    }
    setUserToDeactivate(user);
  };

  const confirmDeactivateToggle = () => {
    if (!userToDeactivate) return;
    const newStatus: UserProfile['status'] = userToDeactivate.status === 'Deactivated' ? 'Active' : 'Deactivated';
    
    const updated: UserProfile = {
      ...userToDeactivate,
      status: newStatus
    };

    onUpdateUser(updated);
    addNotification({
      title: newStatus === 'Deactivated' ? 'Account Deactivated' : 'Account Re-Activated',
      message: `Account status for ${userToDeactivate.name} changed to ${newStatus}.`,
      type: newStatus === 'Deactivated' ? 'warning' : 'success',
      category: 'system'
    });

    setUserToDeactivate(null);
  };

  const handleToggleMfa = (user: UserProfile) => {
    const updated: UserProfile = {
      ...user,
      mfaEnabled: !user.mfaEnabled
    };
    onUpdateUser(updated);
    addNotification({
      title: 'MFA Policy Updated',
      message: `Two-Factor Authentication ${updated.mfaEnabled ? 'Enforced' : 'Disabled'} for ${user.name}.`,
      type: 'info',
      category: 'system'
    });
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    
    if (userToDelete.role === 'Super Admin') {
      if (activeAdminsCount <= 1 && userToDelete.status === 'Active') {
        addNotification({
          title: 'Cannot Delete Last Admin',
          message: 'At least one active Super Admin must remain in the system.',
          type: 'error',
          category: 'system'
        });
        setUserToDelete(null);
        return;
      }
    }

    if (onDeleteUser) {
      onDeleteUser(userToDelete.id);
    } else {
      const updated: UserProfile = { ...userToDelete, status: 'Deactivated' };
      onUpdateUser(updated);
    }

    setUserToDelete(null);
  };

  const handleRoleChange = (user: UserProfile, newRoleVal: UserRole) => {
    if (user.role === 'Super Admin' && newRoleVal !== 'Super Admin' && activeAdminsCount <= 1) {
      addNotification({
        title: 'Role Demotion Blocked',
        message: 'Cannot change role of the last remaining active Super Admin.',
        type: 'error',
        category: 'system'
      });
      return;
    }

    const updated: UserProfile = {
      ...user,
      role: newRoleVal
    };
    onUpdateUser(updated);
    addNotification({
      title: 'User Role Reassigned',
      message: `Updated ${user.name}'s role to ${newRoleVal}.`,
      type: 'info',
      category: 'system'
    });
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    onAddUser({
      name: newName,
      email: newEmail,
      role: newRole,
      status: 'Active',
      companyName: newCompany || 'Flora & Verdant Biophilic Design',
      phone: newPhone,
      mfaEnabled: newMfa
    });

    addNotification({
      title: 'Staff / Admin Created',
      message: `Created account for ${newName} as ${newRole}.`,
      type: 'success',
      category: 'system'
    });

    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewCompany('');
    setNewMfa(false);
  };

  const openEditModal = (user: UserProfile) => {
    setUserToEdit(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditCompany(user.companyName || '');
    setEditPhone(user.phone || '');
    setEditTaxId(user.taxId || '');
    setEditStatus(user.status);
    setEditMfa(user.mfaEnabled || false);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    if (userToEdit.role === 'Super Admin' && editRole !== 'Super Admin' && activeAdminsCount <= 1) {
      addNotification({
        title: 'Role Update Blocked',
        message: 'At least one active Super Admin must remain in the system.',
        type: 'error',
        category: 'system'
      });
      return;
    }

    const updated: UserProfile = {
      ...userToEdit,
      name: editName,
      email: editEmail,
      role: editRole,
      companyName: editCompany,
      phone: editPhone,
      taxId: editTaxId,
      status: editStatus,
      mfaEnabled: editMfa
    };

    onUpdateUser(updated);
    addNotification({
      title: 'Account Settings Saved',
      message: `Profile and permissions updated for ${editName}.`,
      type: 'success',
      category: 'system'
    });

    setUserToEdit(null);
  };

  const openAccessGrantModal = (user: UserProfile) => {
    setUserForAccessGrant(user);
    const defaultTabs = ROLE_CONFIGS[user.role]?.allowedTabs || [];
    setSelectedCustomTabs(user.customAllowedTabs && user.customAllowedTabs.length > 0 ? user.customAllowedTabs : defaultTabs);
  };

  const handleSaveCustomAccess = () => {
    if (!userForAccessGrant) return;
    const updated: UserProfile = {
      ...userForAccessGrant,
      customAllowedTabs: selectedCustomTabs
    };
    onUpdateUser(updated);
    addNotification({
      title: 'Access Permissions Updated',
      message: `Custom module permissions updated for ${userForAccessGrant.name}.`,
      type: 'success',
      category: 'system'
    });
    setUserForAccessGrant(null);
  };

  const handleResetAccessToRoleDefault = (user: UserProfile) => {
    const updated: UserProfile = {
      ...user,
      customAllowedTabs: undefined
    };
    onUpdateUser(updated);
    addNotification({
      title: 'Permissions Reset',
      message: `Reset permissions for ${user.name} back to ${user.role} default settings.`,
      type: 'info',
      category: 'system'
    });
  };

  const toggleCustomTab = (tabId: string) => {
    if (selectedCustomTabs.includes(tabId)) {
      setSelectedCustomTabs(selectedCustomTabs.filter(id => id !== tabId));
    } else {
      setSelectedCustomTabs([...selectedCustomTabs, tabId]);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 w-full max-w-7xl mx-auto min-h-0 min-w-0">
      {/* Super Admin Command Portal Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-purple-800/40">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-purple-400" /> Admin Access & User Control Center
            </span>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-amber-950 animate-pulse">
                {pendingCount} Pending Approval{pendingCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Super Admin Controls & Security Portal</h2>
          <p className="text-xs sm:text-sm text-purple-200/80 max-w-2xl leading-relaxed">
            Full administrative control over user accounts, role permissions, MFA enforcement, registration approvals, and account status overrides.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <UserPlus size={16} />
            <span>Add Staff or Admin Account</span>
          </button>
        </div>
      </div>

      {/* Analytics & KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider truncate">Total Accounts</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{users.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider truncate">Active Users</div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">{activeCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider truncate">Deactivated</div>
            <div className="text-2xl font-black text-rose-600 mt-0.5">{deactivatedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <Power size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider truncate">Active Admins</div>
            <div className="text-2xl font-black text-purple-700 mt-0.5">{activeAdminsCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 bg-white p-1.5 rounded-2xl border border-gray-200/80 shadow-xs">
        <button
          onClick={() => setActiveSubTab('accounts')}
          className={cn(
            "py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer",
            activeSubTab === 'accounts'
              ? "bg-purple-600 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <Users size={16} />
          <span>User Accounts & Status Controls</span>
        </button>

        <button
          onClick={() => setActiveSubTab('access-giving')}
          className={cn(
            "py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer",
            activeSubTab === 'access-giving'
              ? "bg-purple-600 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <Sliders size={16} />
          <span>Access Giving & Module Permissions</span>
        </button>

        <button
          onClick={() => setActiveSubTab('security')}
          className={cn(
            "py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer",
            activeSubTab === 'security'
              ? "bg-purple-600 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <ShieldAlert size={16} />
          <span>Admin Protection & Safeguards</span>
        </button>
      </div>

      {/* SUB-TAB 1: USER ACCOUNTS & STATUS CONTROLS */}
      {activeSubTab === 'accounts' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search user name, email, company, phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Role Dropdown Filter */}
              <div className="flex items-center gap-1.5 min-w-[150px]">
                <Filter size={14} className="text-gray-400 shrink-0" />
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-purple-600 cursor-pointer"
                >
                  <option value="All">All System Roles</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Sales Executive">Sales Executive</option>
                  <option value="Production Manager">Production Manager</option>
                  <option value="Procurement Officer">Procurement Officer</option>
                  <option value="Finance Manager">Finance Manager</option>
                  <option value="Logistics Manager">Logistics Manager</option>
                  <option value="Client">Client</option>
                  <option value="Supplier">Supplier</option>
                </select>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
                {(['All', 'Pending Approval', 'Active', 'Deactivated', 'Rejected'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer whitespace-nowrap",
                      selectedStatus === st
                        ? "bg-purple-600 text-white shadow-xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {st} {st === 'Pending Approval' && pendingCount > 0 ? `(${pendingCount})` : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* User Table Container */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-gray-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="p-4 pl-5">User & Business Identity</th>
                    <th className="p-4">Assigned System Role</th>
                    <th className="p-4">Account Status</th>
                    <th className="p-4">Custom Permissions</th>
                    <th className="p-4 pr-5 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-gray-400 font-medium">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Users className="w-10 h-10 text-gray-300 mx-auto" />
                          <p className="text-sm font-bold text-gray-600">No user accounts found</p>
                          <p className="text-xs text-gray-400">No user profiles match your current filter and search criteria.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => {
                      const roleConfig = ROLE_CONFIGS[user.role];
                      const isTargetAdmin = user.role === 'Super Admin';
                      const hasCustomAccess = user.customAllowedTabs && user.customAllowedTabs.length > 0;

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 pl-5">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white text-xs shadow-xs shrink-0 border border-white/20",
                                isTargetAdmin ? "bg-purple-700" :
                                user.role === 'Sales Executive' ? "bg-emerald-600" :
                                user.role === 'Production Manager' ? "bg-blue-600" :
                                user.role === 'Finance Manager' ? "bg-indigo-600" :
                                user.role === 'Procurement Officer' ? "bg-amber-600" :
                                user.role === 'Logistics Manager' ? "bg-cyan-600" :
                                user.role === 'Client' ? "bg-teal-600" :
                                user.role === 'Supplier' ? "bg-rose-600" : "bg-slate-700"
                              )}>
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                  <span className="truncate">{user.name}</span>
                                  {isTargetAdmin && (
                                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-900 text-[9px] font-black rounded border border-purple-200 tracking-wider">
                                      SUPER ADMIN
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                  <Mail size={12} className="shrink-0 text-gray-400" />
                                  <span className="truncate">{user.email}</span>
                                </div>
                                {user.companyName && (
                                  <div className="text-[11px] font-semibold text-purple-700 flex items-center gap-1 mt-0.5">
                                    <Building2 size={12} className="shrink-0" />
                                    <span className="truncate">{user.companyName}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <select
                              value={user.role}
                              onChange={e => handleRoleChange(user, e.target.value as UserRole)}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-2xs transition-all",
                                roleConfig?.badgeColor || "bg-gray-100 text-gray-800"
                              )}
                            >
                              <option value="Super Admin">Super Admin</option>
                              <option value="Sales Executive">Sales Executive</option>
                              <option value="Production Manager">Production Manager</option>
                              <option value="Procurement Officer">Procurement Officer</option>
                              <option value="Finance Manager">Finance Manager</option>
                              <option value="Logistics Manager">Logistics Manager</option>
                              <option value="Client">Client</option>
                              <option value="Supplier">Supplier</option>
                            </select>
                          </td>

                          <td className="p-4">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 whitespace-nowrap shadow-2xs",
                              user.status === 'Active' ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                              user.status === 'Pending Approval' ? "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse" :
                              user.status === 'Deactivated' ? "bg-rose-100 text-rose-800 border border-rose-300" :
                              "bg-slate-200 text-slate-700"
                            )}>
                              {user.status === 'Active' && <CheckCircle2 size={12} />}
                              {user.status === 'Pending Approval' && <Clock size={12} />}
                              {user.status === 'Deactivated' && <Power size={12} />}
                              {user.status === 'Rejected' && <X size={12} />}
                              <span>{user.status}</span>
                            </span>
                          </td>

                          <td className="p-4">
                            <button
                              onClick={() => openAccessGrantModal(user)}
                              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs"
                            >
                              <Sliders size={13} className="text-purple-600" />
                              <span>{hasCustomAccess ? `${user.customAllowedTabs?.length} Custom Portals` : 'Role Default'}</span>
                            </button>
                          </td>

                          <td className="p-4 pr-5 text-right">
                            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                              {user.status === 'Pending Approval' ? (
                                <>
                                  <button
                                    onClick={() => handleApprove(user)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                                    title="Approve Account Access"
                                  >
                                    <Check size={14} /> Approve
                                  </button>
                                  <button
                                    onClick={() => handleReject(user)}
                                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                    title="Decline Account"
                                  >
                                    <X size={14} /> Decline
                                  </button>
                                </>
                              ) : (
                                <>
                                  {/* Deactivate / Activate Button */}
                                  <button
                                    onClick={() => handleToggleDeactivate(user)}
                                    className={cn(
                                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border shadow-2xs",
                                      user.status === 'Deactivated'
                                        ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                                        : "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                                    )}
                                    title={user.status === 'Deactivated' ? "Activate Account" : "Deactivate Account"}
                                  >
                                    <Power size={13} />
                                    <span>{user.status === 'Deactivated' ? 'Activate' : 'Deactivate'}</span>
                                  </button>

                                  {/* Edit Profile */}
                                  <button
                                    onClick={() => openEditModal(user)}
                                    className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all cursor-pointer border border-gray-200"
                                    title="Edit Account Details"
                                  >
                                    <Edit size={14} />
                                  </button>

                                  {/* Delete Account */}
                                  <button
                                    onClick={() => setUserToDelete(user)}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition-all cursor-pointer"
                                    title="Delete User Account"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ACCESS GIVING & MODULE PERMISSIONS MATRIX */}
      {activeSubTab === 'access-giving' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <Sliders size={20} className="text-purple-600" /> Access Giving Portal & Custom Module Grants
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Grant or restrict specific portal modules for individual user accounts. Custom portal overrides supersede role-based defaults.
              </p>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="Filter users..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map(u => {
              const roleConfig = ROLE_CONFIGS[u.role];
              const isCustom = u.customAllowedTabs && u.customAllowedTabs.length > 0;
              const effectiveTabs = isCustom
                ? u.customAllowedTabs!
                : (roleConfig?.allowedTabs || []);

              return (
                <div key={u.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 truncate">{u.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{u.email}</div>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0",
                        roleConfig?.badgeColor || "bg-gray-100 text-gray-800"
                      )}>
                        {u.role}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 font-medium">Access Mode:</span>
                      {isCustom ? (
                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-bold text-[10px] border border-purple-200">
                          Custom Matrix Overridden
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-bold text-[10px]">
                          Role Standard Default
                        </span>
                      )}
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center justify-between">
                        <span>Granted Portals ({effectiveTabs.length})</span>
                        {isCustom && (
                          <button
                            onClick={() => handleResetAccessToRoleDefault(u)}
                            className="text-purple-600 hover:underline text-[10px] font-bold cursor-pointer"
                          >
                            Reset to Default
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {ALL_SYSTEM_TABS.map(tab => {
                          const isGranted = effectiveTabs.includes(tab.id);
                          if (!isGranted) return null;
                          return (
                            <span key={tab.id} className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 text-[10px] font-bold border border-purple-200">
                              {tab.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => openAccessGrantModal(u)}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    <Sliders size={14} />
                    <span>Configure Access Rights</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ADMIN PROTECTION RULES & SECURITY POLICIES */}
      {activeSubTab === 'security' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-6">
          <div>
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
              <ShieldAlert size={20} className="text-purple-600" /> Admin Protection & Active Security Policies
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Active system guardrails, registration policies, and multi-factor authentication requirements for administrative safety.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50/60 rounded-2xl border border-purple-200 space-y-3">
              <div className="flex items-center gap-2 text-purple-900 font-black text-sm">
                <ShieldCheck size={18} className="text-purple-600" />
                <span>Admin Account Deactivation Safeguard</span>
              </div>
              <p className="text-xs text-purple-800/80 leading-relaxed">
                Super Admin accounts cannot be deactivated or deleted if doing so leaves zero active Super Admins in the system.
              </p>
              <div className="pt-2 flex items-center justify-between text-xs font-bold text-purple-900 border-t border-purple-200/60">
                <span>Active Super Admins in System:</span>
                <span className="px-2.5 py-0.5 bg-purple-600 text-white rounded-full font-black">{activeAdminsCount}</span>
              </div>
            </div>

            <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50/60 rounded-2xl border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                <ShieldCheck size={18} className="text-emerald-600" />
                <span>Role-Based Access Control Policy</span>
              </div>
              <p className="text-xs text-emerald-800/80 leading-relaxed">
                Direct role-based authentication is active across all system roles with custom portal module overrides.
              </p>
              <div className="pt-2 flex items-center justify-between text-xs font-bold text-emerald-900 border-t border-emerald-200/60">
                <span>Direct Access Authentication:</span>
                <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded-full font-black">Active</span>
              </div>
            </div>
          </div>

          {/* Interactive Policy Controls */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Sliders size={16} className="text-purple-600" />
              <span>Interactive Security Enforcement Controls</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Require Admin Approval for Registrations</div>
                  <div className="text-[10px] text-slate-500">New self-registering users require Super Admin verification</div>
                </div>
                <button
                  onClick={() => {
                    setRequireApprovalForNewUsers(!requireApprovalForNewUsers);
                    addNotification({
                      title: 'Registration Policy Changed',
                      message: `Admin Approval for new users set to ${!requireApprovalForNewUsers ? 'ON' : 'OFF'}.`,
                      type: 'info',
                      category: 'system'
                    });
                  }}
                  className="cursor-pointer"
                >
                  {requireApprovalForNewUsers ? <ToggleRight size={26} className="text-purple-600" /> : <ToggleLeft size={26} className="text-gray-400" />}
                </button>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Auto Session Inactivity Timeout</div>
                  <div className="text-[10px] text-slate-500">Automatically logout inactive portal sessions</div>
                </div>
                <select
                  value={sessionTimeout}
                  onChange={e => {
                    setSessionTimeout(e.target.value);
                    addNotification({
                      title: 'Session Timeout Updated',
                      message: `Inactivity timeout set to ${e.target.value} minutes.`,
                      type: 'info',
                      category: 'system'
                    });
                  }}
                  className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="60">1 Hour</option>
                  <option value="480">8 Hours</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD STAFF / ADMIN USER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <UserPlus size={18} className="text-purple-600" /> Register Staff or Admin Account
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="e.g. eleanor@verdantflora.com"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Assign Role *</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600 cursor-pointer"
                >
                  <option value="Super Admin">Super Admin (Full System Control)</option>
                  <option value="Sales Executive">Sales Executive</option>
                  <option value="Production Manager">Production Manager</option>
                  <option value="Procurement Officer">Procurement Officer</option>
                  <option value="Finance Manager">Finance Manager</option>
                  <option value="Logistics Manager">Logistics Manager</option>
                  <option value="Client">Client</option>
                  <option value="Supplier">Supplier</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={e => setNewCompany(e.target.value)}
                    placeholder="e.g. Flora & Verdant"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="+94 77 123 4567"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-purple-700 cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER DETAILS */}
      {userToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <Edit size={18} className="text-purple-600" /> Edit User Profile & Role
              </h3>
              <button onClick={() => setUserToEdit(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Role</label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600 cursor-pointer"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Sales Executive">Sales Executive</option>
                    <option value="Production Manager">Production Manager</option>
                    <option value="Procurement Officer">Procurement Officer</option>
                    <option value="Finance Manager">Finance Manager</option>
                    <option value="Logistics Manager">Logistics Manager</option>
                    <option value="Client">Client</option>
                    <option value="Supplier">Supplier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Account Status</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as UserProfile['status'])}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Deactivated">Deactivated</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={editCompany}
                    onChange={e => setEditCompany(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setUserToEdit(null)}
                  className="w-1/2 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-purple-700 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ACCESS GIVING & MODULE PERMISSIONS OVERRIDE */}
      {userForAccessGrant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xl shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] flex flex-col my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <Sliders size={18} className="text-purple-600" /> Module Access Giving Portal
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure custom module permissions for <strong className="text-purple-700">{userForAccessGrant.name}</strong> ({userForAccessGrant.role}).
                </p>
              </div>
              <button onClick={() => setUserForAccessGrant(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1 no-scrollbar">
              <div className="flex items-center justify-between text-xs font-extrabold text-gray-500 uppercase tracking-wider pb-1">
                <span>Select Granted Portals ({selectedCustomTabs.length})</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedCustomTabs(ALL_SYSTEM_TABS.map(t => t.id));
                    }}
                    className="text-purple-600 hover:underline text-[11px] font-bold cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    onClick={() => {
                      const defaultTabs = ROLE_CONFIGS[userForAccessGrant.role]?.allowedTabs || [];
                      setSelectedCustomTabs(defaultTabs);
                    }}
                    className="text-purple-600 hover:underline text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={11} /> Reset Default
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_SYSTEM_TABS.map(tab => {
                  const isChecked = selectedCustomTabs.includes(tab.id);
                  return (
                    <div
                      key={tab.id}
                      onClick={() => toggleCustomTab(tab.id)}
                      className={cn(
                        "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2",
                        isChecked
                          ? "bg-purple-50 border-purple-300 text-purple-900 font-bold shadow-2xs"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="text-xs truncate">{tab.label}</div>
                        <div className="text-[9px] text-gray-400 font-normal">{tab.category}</div>
                      </div>
                      {isChecked ? (
                        <CheckSquare size={16} className="text-purple-600 shrink-0" />
                      ) : (
                        <Square size={16} className="text-gray-300 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setUserForAccessGrant(null)}
                className="w-1/2 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomAccess}
                className="w-1/2 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-purple-700 cursor-pointer"
              >
                Save Granted Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DEACTIVATION */}
      {userToDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 space-y-4 text-center my-auto">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
              <Power size={24} />
            </div>

            <div>
              <h3 className="font-bold text-base text-gray-900">
                Confirm Account {userToDeactivate.status === 'Deactivated' ? 'Activation' : 'Deactivation'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to {userToDeactivate.status === 'Deactivated' ? 'reactivate' : 'deactivate'} access for <strong className="text-gray-800">{userToDeactivate.name}</strong> ({userToDeactivate.role})?
              </p>
              {userToDeactivate.role === 'Super Admin' && (
                <div className="mt-2 p-2 bg-purple-50 text-purple-900 rounded-xl text-[11px] font-bold border border-purple-200">
                  ⚠️ Note: This is a Super Admin account. Deactivation takes effect immediately.
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setUserToDeactivate(null)}
                className="w-1/2 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeactivateToggle}
                className="w-1/2 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-amber-700 cursor-pointer"
              >
                Confirm Status Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETION */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 space-y-4 text-center my-auto">
            <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="font-bold text-base text-gray-900">Permanently Delete Account?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to permanently delete <strong className="text-gray-800">{userToDelete.name}</strong> ({userToDelete.email})? This action cannot be undone.
              </p>
              {userToDelete.role === 'Super Admin' && (
                <div className="mt-2 p-2 bg-rose-50 text-rose-900 rounded-xl text-[11px] font-bold border border-rose-200">
                  ⚠️ Warning: You are deleting a Super Admin account!
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="w-1/2 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="w-1/2 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-rose-700 cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
