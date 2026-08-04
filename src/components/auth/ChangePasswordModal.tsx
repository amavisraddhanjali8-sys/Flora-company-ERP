import React, { useState } from 'react';
import { Lock, Key, Eye, EyeOff, CheckCircle2, ShieldAlert, X, Sparkles, Check } from 'lucide-react';
import { UserProfile } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import { cn } from '../../lib/utils';

interface ChangePasswordModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  onClose: () => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
  isFirstLoginPrompt?: boolean;
}

export default function ChangePasswordModal({
  isOpen,
  currentUser,
  onClose,
  onUpdateUser,
  isFirstLoginPrompt = false
}: ChangePasswordModalProps) {
  const { addNotification } = useNotifications();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Verify current password if account already has a password set
    if (currentUser.password) {
      if (!currentPassword) {
        setErrorMsg('Please enter your current account password.');
        return;
      }
      if (currentPassword !== currentUser.password) {
        setErrorMsg('The current password you entered is incorrect.');
        return;
      }
    }

    if (!newPassword || newPassword.trim().length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation password do not match.');
      return;
    }

    // Update user profile
    const updatedUser: UserProfile = {
      ...currentUser,
      password: newPassword,
      mustChangePassword: false,
      passwordChangedAt: new Date().toISOString()
    };

    onUpdateUser(updatedUser);

    addNotification({
      title: 'Password Updated Successfully',
      message: 'Your account password has been changed. Only you (account owner) hold access to this credential.',
      type: 'success',
      category: 'system'
    });

    // Reset fields
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Key size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {isFirstLoginPrompt ? 'First Login: Change Password' : 'Change Account Password'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Account Owner Self-Service Security Portal
              </p>
            </div>
          </div>
          {!isFirstLoginPrompt && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
              <X size={18} />
            </button>
          )}
        </div>

        {isFirstLoginPrompt && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">First-Time Login Security Requirement</strong>
              <span className="text-[11px] opacity-90">
                For security reasons, you must update your password before proceeding to access system features.
              </span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-2">
            <ShieldAlert size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-extrabold uppercase text-slate-400">Account Owner</div>
              <div className="font-bold text-slate-900">{currentUser.name}</div>
              <div className="text-[11px] text-slate-500">{currentUser.email}</div>
            </div>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-900 rounded text-[10px] font-bold border border-purple-200">
              {currentUser.role}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Current Password {currentUser.password ? '*' : '(Optional)'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type={showPasswords ? 'text' : 'password'}
                required={!!currentUser.password}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder={currentUser.password ? "Enter your current account password" : "Enter current password"}
                className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Password *</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPasswords ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password *</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            {!isFirstLoginPrompt && (
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className={cn(
                "py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5 transition-all",
                isFirstLoginPrompt ? "w-full" : "w-1/2"
              )}
            >
              <CheckCircle2 size={15} />
              <span>Save New Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
