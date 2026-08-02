import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, Sparkles, Building2, UserCheck } from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { ROLE_CONFIGS } from '../../lib/rbac';

interface AccessRestrictedProps {
  currentUser: UserProfile;
  tabId: string;
  onReturnToAllowedTab: () => void;
  onOpenAuthScreen: () => void;
}

export default function AccessRestricted({
  currentUser,
  tabId,
  onReturnToAllowedTab,
  onOpenAuthScreen
}: AccessRestrictedProps) {
  const roleConfig = ROLE_CONFIGS[currentUser.role];

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 text-center space-y-6">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl mx-auto flex items-center justify-center border border-rose-200 shadow-inner">
          <Lock size={32} />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 inline-block uppercase tracking-wider">
            Portal Access Guard
          </span>
          <h2 className="text-xl font-extrabold text-slate-900">Module Access Restricted</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {tabId === 'lobby' ? (
              <>The <strong>Home Dashboard</strong> is restricted exclusively to <strong>Super Admin</strong> accounts. As a <strong>{currentUser.role}</strong>, please use your designated portal modules.</>
            ) : (
              <>Your current assigned role <strong>({currentUser.role})</strong> does not have security authorization to view the <strong>{tabId}</strong> module.</>
            )}
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
          <div className="font-bold text-slate-800 flex items-center justify-between">
            <span>Role Scope Definition</span>
            <span className={roleConfig?.badgeColor || 'bg-gray-100 text-gray-800'}>
              {currentUser.role}
            </span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            {roleConfig?.description || 'Standard role access.'}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            onClick={onReturnToAllowedTab}
            className="flex-1 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Return to Allowed Portal
          </button>
          <button
            onClick={onOpenAuthScreen}
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={16} className="text-emerald-600" /> Switch Role / Login
          </button>
        </div>
      </div>
    </div>
  );
}
