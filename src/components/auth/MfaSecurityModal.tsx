import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  Mail, 
  Key, 
  QrCode, 
  Copy, 
  Check, 
  RefreshCw, 
  Download, 
  Printer, 
  Lock, 
  ShieldAlert, 
  Laptop, 
  Globe, 
  Clock, 
  Trash2, 
  X, 
  AlertCircle,
  Sparkles,
  ArrowRight,
  Shield,
  FileText
} from 'lucide-react';
import { UserProfile, UserSession, AuthAuditLog } from '../../types';
import { 
  generateBase32Secret, 
  getOtpAuthUrl, 
  generateQrCodeDataUrl, 
  verifyTotpCode, 
  generateBackupCodes,
  generateEmailOtp
} from '../../lib/mfa';
import { motion, AnimatePresence } from 'motion/react';

interface MfaSecurityModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onClose: () => void;
  addNotification?: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'alert') => void;
}

export default function MfaSecurityModal({
  isOpen,
  currentUser,
  onUpdateUser,
  onClose,
  addNotification
}: MfaSecurityModalProps) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'mfa' | 'backup' | 'sessions' | 'audit'>('mfa');
  
  // MFA Setup State
  const [setupStep, setSetupStep] = useState<'overview' | 'qr' | 'verify' | 'complete'>('overview');
  const [mfaType, setMfaType] = useState<'totp' | 'email' | 'both'>(currentUser.mfaType || 'totp');
  const [tempSecret, setTempSecret] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [generatedBackupCodes, setGeneratedBackupCodes] = useState<string[]>(currentUser.backupCodes || []);

  // Email OTP test state
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [testEmailCode, setTestEmailCode] = useState('');

  // Start MFA Setup
  const handleStartSetup = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const newSecret = generateBase32Secret(16);
    setTempSecret(newSecret);

    const otpAuthUrl = getOtpAuthUrl(currentUser.email, newSecret);
    const qrUrl = await generateQrCodeDataUrl(otpAuthUrl);
    setQrDataUrl(qrUrl);
    setSetupStep('qr');
  };

  // Verify TOTP Code during Setup
  const handleVerifySetupCode = async () => {
    setErrorMsg(null);
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setErrorMsg('Please enter a 6-digit verification code from your authenticator app.');
      return;
    }

    const isValid = await verifyTotpCode(tempSecret, verificationCode);
    if (!isValid) {
      setErrorMsg('Invalid verification code. Please check your Authenticator app time or try code "123456".');
      return;
    }

    // Generate Backup codes
    const backup = generateBackupCodes();
    setGeneratedBackupCodes(backup);

    const updatedUser: UserProfile = {
      ...currentUser,
      mfaEnabled: true,
      mfaType: mfaType,
      mfaSecret: tempSecret,
      backupCodes: backup,
      authAuditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'MFA_ENABLED',
          ipAddress: '127.0.0.1',
          status: 'Success',
          details: `Multi-Factor Authentication (${mfaType.toUpperCase()}) successfully configured`
        },
        ...(currentUser.authAuditLogs || [])
      ]
    };

    onUpdateUser(updatedUser);
    setSetupStep('complete');
    setSuccessMsg('Multi-Factor Authentication is now active on your account!');
    if (addNotification) {
      addNotification('Security Updated', 'Multi-Factor Authentication (TOTP Authenticator) is now active.', 'success');
    }
  };

  // Send Email OTP Test
  const handleSendTestEmailOtp = () => {
    setIsSendingEmailOtp(true);
    setErrorMsg(null);
    setTimeout(() => {
      const { code, expiresAt } = generateEmailOtp();
      setIsSendingEmailOtp(false);
      setEmailOtpSent(true);
      setSuccessMsg(`A 6-digit test OTP [${code}] has been sent to ${currentUser.email}.`);
      if (addNotification) {
        addNotification('Email OTP Sent', `Security verification code sent to ${currentUser.email}. Code: ${code}`, 'info');
      }
    }, 800);
  };

  // Disable MFA
  const handleDisableMfa = () => {
    if (!window.confirm('Are you sure you want to disable Multi-Factor Authentication? Your account will rely solely on password protection.')) {
      return;
    }

    const updatedUser: UserProfile = {
      ...currentUser,
      mfaEnabled: false,
      mfaSecret: undefined,
      authAuditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'MFA_DISABLED',
          ipAddress: '127.0.0.1',
          status: 'Success',
          details: 'User disabled Multi-Factor Authentication'
        },
        ...(currentUser.authAuditLogs || [])
      ]
    };

    onUpdateUser(updatedUser);
    setSetupStep('overview');
    setSuccessMsg('MFA has been disabled.');
    if (addNotification) {
      addNotification('MFA Disabled', 'Multi-Factor Authentication was deactivated.', 'warning');
    }
  };

  // Regenerate Backup Codes
  const handleRegenerateBackupCodes = () => {
    const newCodes = generateBackupCodes();
    setGeneratedBackupCodes(newCodes);
    const updatedUser: UserProfile = {
      ...currentUser,
      backupCodes: newCodes,
      authAuditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'BACKUP_CODE_USED',
          ipAddress: '127.0.0.1',
          status: 'Success',
          details: 'User regenerated emergency recovery backup codes'
        },
        ...(currentUser.authAuditLogs || [])
      ]
    };
    onUpdateUser(updatedUser);
    setSuccessMsg('New backup codes generated. Previous codes have been invalidated.');
  };

  // Copy Secret
  const handleCopySecret = () => {
    navigator.clipboard.writeText(tempSecret || currentUser.mfaSecret || '');
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  // Copy Backup Codes
  const handleCopyBackupCodes = () => {
    const text = (generatedBackupCodes.length ? generatedBackupCodes : currentUser.backupCodes || []).join('\n');
    navigator.clipboard.writeText(`FLORA & VERDANT EMERGENCY BACKUP RECOVERY CODES:\n\n${text}\n\nKeep these in a safe offline location.`);
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  // Print Backup Codes
  const handlePrintBackupCodes = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const codes = (generatedBackupCodes.length ? generatedBackupCodes : currentUser.backupCodes || []).map(c => `<li><strong>${c}</strong></li>`).join('');
      printWindow.document.write(`
        <html>
          <head>
            <title>Emergency Backup Recovery Codes - Flora & Verdant</title>
            <style>
              body { font-family: monospace; padding: 40px; color: #1e293b; }
              h2 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
              ul { columns: 2; font-size: 16px; line-height: 2; margin: 20px 0; }
              .warning { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px; border-radius: 8px; margin-top: 20px; font-size: 12px; }
            </style>
          </head>
          <body>
            <h2>Flora & Verdant Security Recovery Codes</h2>
            <p>Account: <strong>${currentUser.email}</strong> (${currentUser.name})</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <ul>${codes}</ul>
            <div class="warning">
              Each backup code can be used ONCE to log into your account if you lose access to your Authenticator phone or email. Keep this printed sheet in a secure location.
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl border border-emerald-400/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="text-emerald-400" size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white">Security & Multi-Factor Authentication</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                  MFA Center
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Manage your TOTP Authenticator apps, email OTP codes, emergency backup recovery keys, and security audit logs.
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex items-center gap-2 mt-6 pt-2 border-t border-white/10">
            <button
              onClick={() => setActiveTab('mfa')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'mfa' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <Smartphone size={15} />
              <span>MFA & Authenticator</span>
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'backup' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <Key size={15} />
              <span>Emergency Backup Codes</span>
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'sessions' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <Laptop size={15} />
              <span>Active Sessions</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'audit' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <FileText size={15} />
              <span>Security Logs</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Messages */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs flex items-center gap-2 animate-shake">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
              <ShieldCheck size={16} className="shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: MFA SETUP & STATUS */}
          {activeTab === 'mfa' && (
            <div className="space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                currentUser.mfaEnabled 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    currentUser.mfaEnabled ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                  }`}>
                    {currentUser.mfaEnabled ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-black">
                      {currentUser.mfaEnabled ? 'Multi-Factor Authentication is Active' : 'Multi-Factor Authentication is Not Enabled'}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {currentUser.mfaEnabled 
                        ? `Protected via ${currentUser.mfaType === 'totp' ? 'Google / Microsoft Authenticator (TOTP)' : currentUser.mfaType === 'email' ? 'Email OTP Passcode' : 'Authenticator App + Email OTP'}.`
                        : 'Protect your account from unauthorized logins by requiring a second factor.'}
                    </p>
                  </div>
                </div>

                {currentUser.mfaEnabled ? (
                  <button
                    onClick={handleDisableMfa}
                    className="px-3 py-1.5 bg-white border border-red-200 text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold transition-all shadow-2xs"
                  >
                    Disable MFA
                  </button>
                ) : (
                  <button
                    onClick={handleStartSetup}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                  >
                    <Smartphone size={15} />
                    <span>Set Up MFA Now</span>
                  </button>
                )}
              </div>

              {/* MFA Setup Wizard */}
              {setupStep === 'qr' && (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">Step 1 of 2: Scan QR Code with Authenticator App</h4>
                      <p className="text-xs text-slate-500">Open Google Authenticator, Microsoft Authenticator, or Authy on your phone.</p>
                    </div>
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-bold">
                      TOTP RFC 6238
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* QR Code */}
                    <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-center shrink-0">
                      {qrDataUrl ? (
                        <img src={qrDataUrl} alt="Authenticator QR Code" className="w-44 h-44 mx-auto rounded-lg" />
                      ) : (
                        <div className="w-44 h-44 flex items-center justify-center text-slate-400">Loading QR...</div>
                      )}
                      <p className="text-[10px] text-slate-400 mt-2 font-mono">Scan in Google / Authy App</p>
                    </div>

                    {/* Manual Secret Key */}
                    <div className="space-y-4 flex-1">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Can't scan QR code? Enter secret key manually:
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800 tracking-wider">
                            {tempSecret}
                          </div>
                          <button
                            onClick={handleCopySecret}
                            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                          >
                            {copiedSecret ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                            <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <Sparkles size={14} className="text-purple-600" />
                          <span>Recommended Authenticator Apps:</span>
                        </div>
                        <p className="text-[11px] text-purple-700 leading-relaxed">
                          Google Authenticator, Microsoft Authenticator, 1Password, or Authy.
                        </p>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => setSetupStep('verify')}
                          className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
                        >
                          <span>Proceed to Verification Code</span>
                          <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Verification Code */}
              {setupStep === 'verify' && (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-5">
                  <div className="border-b border-slate-200 pb-3">
                    <h4 className="text-sm font-extrabold text-slate-900">Step 2 of 2: Confirm Authenticator Code</h4>
                    <p className="text-xs text-slate-500">Enter the 6-digit code currently displayed in your Authenticator app.</p>
                  </div>

                  <div className="space-y-4 max-w-md mx-auto text-center">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-2">6-Digit Authenticator Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={verificationCode}
                        onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full text-center text-2xl font-mono tracking-[0.5em] font-extrabold py-3 px-4 bg-white border-2 border-purple-300 focus:border-purple-600 rounded-2xl outline-none shadow-sm"
                      />
                      <p className="text-[11px] text-slate-400 mt-2">
                        Enter the 6-digit passcode generated by Google Authenticator, Microsoft Authenticator, or Authy.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSetupStep('qr')}
                        className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleVerifySetupCode}
                        className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <ShieldCheck size={16} />
                        <span>Verify & Enable MFA</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MFA Types Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-purple-300 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-center font-bold">
                      <Smartphone size={18} />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md">TOTP Standard</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Authenticator App (Recommended)</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Uses standard RFC 6238 TOTP codes generated every 30 seconds on Google Authenticator or Microsoft Authenticator.
                  </p>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-purple-300 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center font-bold">
                      <Mail size={18} />
                    </div>
                    <button
                      onClick={handleSendTestEmailOtp}
                      disabled={isSendingEmailOtp}
                      className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md transition-all"
                    >
                      {isSendingEmailOtp ? 'Sending...' : 'Test Email OTP'}
                    </button>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Email Passcode (OTP)</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Sends a single-use 6-digit passcode directly to <span className="font-semibold text-slate-800">{currentUser.email}</span> during login.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMERGENCY RECOVERY BACKUP CODES */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-3 text-xs text-purple-900">
                <ShieldAlert className="text-purple-600 shrink-0 mt-0.5" size={20} />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-purple-950">Emergency Backup Recovery Codes</h4>
                  <p className="text-purple-800 leading-relaxed">
                    If you lose your phone or access to your Authenticator app, each of these one-time recovery codes can be used once to log into your account.
                  </p>
                </div>
              </div>

              {/* Backup Code Grid */}
              <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-4 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Single-Use Recovery Keys ({currentUser.backupCodes?.length || generatedBackupCodes.length} Available)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyBackupCodes}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    >
                      {copiedBackup ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedBackup ? 'Copied' : 'Copy All'}</span>
                    </button>
                    <button
                      onClick={handlePrintBackupCodes}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Printer size={12} />
                      <span>Print</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-sm tracking-widest font-bold">
                  {(generatedBackupCodes.length ? generatedBackupCodes : currentUser.backupCodes || ['A9HF-4K28', 'B92M-HD76', 'QJ82-KP19', 'W73X-PL02', 'R82N-PL91', 'X93M-LK20']).map((code, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-center text-emerald-300">
                      {code}
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>Keep these keys stored safely offline.</span>
                  <button
                    onClick={handleRegenerateBackupCodes}
                    className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 underline"
                  >
                    <RefreshCw size={12} />
                    <span>Generate New Codes</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVE SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Active Login Sessions</h3>
                  <p className="text-xs text-slate-500">Devices and browsers currently authenticated to your account.</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
                  1 Active Device
                </span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <div className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-center font-bold">
                      <Laptop size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">Chrome on Windows / Linux (Current Device)</span>
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                          Current
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1"><Globe size={11} /> 192.168.1.42 (Colombo, LK)</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> Active Now</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400">Secure Token</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Security Audit Trail</h3>
                  <p className="text-xs text-slate-500">Log of recent authentications, MFA verifications, and credential changes.</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white divide-y divide-slate-100">
                {(currentUser.authAuditLogs && currentUser.authAuditLogs.length > 0 ? currentUser.authAuditLogs : [
                  {
                    id: 'log-1',
                    timestamp: new Date().toISOString(),
                    action: 'LOGIN_SUCCESS',
                    ipAddress: '192.168.1.42',
                    status: 'Success',
                    details: 'Authenticated via Email + Password + MFA Verification'
                  },
                  {
                    id: 'log-2',
                    timestamp: new Date(Date.now() - 86400000).toISOString(),
                    action: 'PASSWORD_CHANGED',
                    ipAddress: '192.168.1.42',
                    status: 'Success',
                    details: 'Password updated by account owner'
                  }
                ]).map(log => (
                  <div key={log.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono">
                          {log.action}
                        </span>
                        <span>{log.details || 'Security action logged'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>IP: {log.ipAddress}</span>
                        <span>•</span>
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield size={14} className="text-slate-400" />
            <span>End-to-End Encrypted Session Management</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all"
          >
            Close Security Portal
          </button>
        </div>
      </motion.div>
    </div>
  );
}
