import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Building2, 
  ShieldAlert, 
  Smartphone, 
  Fingerprint, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  User, 
  Eye, 
  EyeOff, 
  Flower2, 
  AlertCircle,
  Clock,
  Briefcase,
  ChevronDown,
  Globe,
  Check,
  X
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { ROLE_CONFIGS } from '../../lib/rbac';
import { cn } from '../../lib/utils';

interface AuthScreenProps {
  isOpen?: boolean;
  users: UserProfile[];
  onLoginSuccess: (user: UserProfile) => void;
  onRegisterUser: (newUser: Omit<UserProfile, 'id' | 'createdAt'>) => void;
  onClose?: () => void;
  initialMode?: 'login' | 'signup';
  language?: string;
}

export default function AuthScreen({ 
  isOpen = true,
  users, 
  onLoginSuccess, 
  onRegisterUser, 
  onClose,
  initialMode = 'login' 
}: AuthScreenProps) {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'login' | 'signup' | 'mfa' | 'pending'>(initialMode);
  const [portalType, setPortalType] = useState<'customer' | 'staff'>('customer');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Additional Staff / B2B Signup State
  const [signupRole, setSignupRole] = useState<UserRole>('Client');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  // Status & MFA
  const [mfaCode, setMfaCode] = useState(['', '', '', '', '', '']);
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isLangOpen, setIsLangOpen] = useState(false);

  // Password strength score (0-4)
  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const passwordStrength = calculatePasswordStrength(password);

  // Handle Login Submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const targetEmail = email.trim().toLowerCase();
    const foundUser = users.find(u => u.email.toLowerCase() === targetEmail);

    if (!foundUser) {
      // Auto-create customer if logging in with email not found in customer mode
      if (portalType === 'customer') {
        const newCustomer: UserProfile = {
          id: `cust-${Date.now()}`,
          name: email.split('@')[0] || 'Web Customer',
          email: targetEmail,
          role: 'Client',
          status: 'Active',
          createdAt: new Date().toISOString()
        };
        onLoginSuccess(newCustomer);
        return;
      }
      setAuthError('Account not found. Please check your credentials or switch to Sign Up.');
      return;
    }

    if (foundUser.status === 'Pending Approval') {
      setPendingUser(foundUser);
      setMode('pending');
      return;
    }

    if (foundUser.status === 'Rejected') {
      setAuthError('Your account application was reviewed and declined by the Super Admin.');
      return;
    }

    // Check if MFA is enabled (Bypassed for Super Admin)
    const isAdmin = foundUser.role === 'Super Admin';
    if (foundUser.mfaEnabled && !isAdmin) {
      setPendingUser(foundUser);
      setMode('mfa');
      return;
    }

    onLoginSuccess(foundUser);
  };

  // Quick One-Click Demo Login
  const handleDemoLogin = (user: UserProfile) => {
    if (user.status === 'Pending Approval') {
      setPendingUser(user);
      setMode('pending');
      return;
    }
    onLoginSuccess(user);
  };

  // Social Login Handler (Google / Apple)
  const handleSocialLogin = (provider: 'Google' | 'Apple') => {
    setAuthError(null);
    const demoCustomer = users.find(u => u.role === 'Client') || {
      id: `cust-social-${Date.now()}`,
      name: `${provider} User`,
      email: `user.${provider.toLowerCase()}@example.com`,
      role: 'Client' as UserRole,
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    onLoginSuccess(demoCustomer);
  };

  // Handle Sign Up Submission
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!acceptTerms) {
      setAuthError('Please agree to the Terms & Privacy Policy to create an account.');
      return;
    }

    if (password !== repeatPassword) {
      setAuthError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (password.length < 8) {
      setAuthError('Password must be at least 8 characters with a mix of letters, numbers & symbols.');
      return;
    }

    // Customer Sign Up requires Admin Approval
    if (portalType === 'customer' || signupRole === 'Client') {
      const newCustomerProfile: Omit<UserProfile, 'id' | 'createdAt'> = {
        name: fullName || email.split('@')[0] || 'New Customer',
        email: email,
        role: 'Client',
        status: 'Pending Approval',
        companyName: companyName || undefined
      };

      onRegisterUser(newCustomerProfile);
      setPendingUser({
        ...newCustomerProfile,
        id: `cust-${Date.now()}`,
        createdAt: new Date().toISOString()
      });
      setMode('pending');
      return;
    }

    // Internal Staff / Supplier Sign Up requires Admin Approval
    const newStaffProfile: Omit<UserProfile, 'id' | 'createdAt'> = {
      name: fullName || 'Staff Applicant',
      email: email,
      role: signupRole,
      status: 'Pending Approval',
      companyName: companyName,
      mfaEnabled: signupRole === 'Finance Manager'
    };

    onRegisterUser(newStaffProfile);
    setPendingUser({
      ...newStaffProfile,
      id: `u-new-${Date.now()}`,
      createdAt: new Date().toISOString()
    });
    setMode('pending');
  };

  // Handle MFA Verification
  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const codeStr = mfaCode.join('');
    if (codeStr.length < 6) {
      setAuthError('Please enter all 6 digits of your authentication code.');
      return;
    }
    if (pendingUser) {
      onLoginSuccess(pendingUser);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto print:hidden font-sans">
      
      {/* Outer Atmospheric Glassmorphism Wrapper */}
      <div className="relative w-full max-w-5xl bg-gradient-to-br from-blue-100/90 via-sky-50/80 to-purple-100/90 rounded-[32px] p-4 sm:p-8 shadow-2xl border border-white/60 overflow-hidden my-auto">
        
        {/* Soft Organic Background Blurs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Modal Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 transition-all shadow-sm"
            title="Close modal"
          >
            <X size={18} />
          </button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* LEFT HERO & BRANDING COLUMN */}
          <div className="lg:col-span-6 p-4 sm:p-8 flex flex-col justify-between h-full space-y-8">
            
            <div className="space-y-6">
              {/* Main Tagline */}
              <div className="space-y-3 pt-4">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Fast, Efficient and Productive
                </h1>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-md">
                  Unified portal for instant customer ordering, live botanical stock availability, and secure back-office ERP operations.
                </p>
              </div>
            </div>

            {/* Left Footer: Language Selector & Links */}
            <div className="pt-8 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-4 text-xs">
              
              {/* Language Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/90 hover:bg-white rounded-xl border border-slate-200/80 font-bold text-slate-800 shadow-sm transition-all"
                >
                  <span className="text-base">🇺🇸</span>
                  <span>{selectedLanguage}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {isLangOpen && (
                  <div className="absolute bottom-full mb-1 left-0 bg-white rounded-2xl shadow-xl border border-slate-200 py-1 w-36 z-30 text-xs">
                    {['English', 'Sinhala', 'Tamil', 'French', 'German'].map(lang => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => { setSelectedLanguage(lang); setIsLangOpen(false); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-semibold text-slate-700 flex items-center justify-between"
                      >
                        <span>{lang}</span>
                        {selectedLanguage === lang && <Check size={12} className="text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Links */}
              <div className="flex items-center gap-4 text-blue-600 font-bold">
                <button type="button" onClick={() => alert('Terms of Service: Instant customer orders are processed immediately. Internal ERP access requires staff authorization.')} className="hover:underline">Terms</button>
                <button type="button" onClick={() => alert('Plans: Standard Public Storefront (Free) & Enterprise B2B Custom Tier.')} className="hover:underline">Plans</button>
                <button type="button" onClick={() => alert('Contact Support: support@flora-verdant.com')} className="hover:underline">Contact Us</button>
              </div>

            </div>

          </div>

          {/* RIGHT AUTHENTICATION CARD COLUMN */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-6">
            
            {/* Form Title & Subtitle */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : mode === 'mfa' ? 'Verify Code' : 'Review Status'}
                </h2>
                
                {/* Mode Switcher pill */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setAuthError(null); }}
                    className={cn(
                      "px-3 py-1 rounded-lg transition-all",
                      mode === 'login' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setAuthError(null); }}
                    className={cn(
                      "px-3 py-1 rounded-lg transition-all",
                      mode === 'signup' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    Sign Up
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {portalType === 'customer' ? 'Instant Customer Ordering & Track Orders' : 'Restricted Internal ERP Staff Gateway'}
              </p>
            </div>

            {/* Portal Type Toggle (Customer vs Internal Staff) */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setPortalType('customer'); setSignupRole('Client'); }}
                className={cn(
                  "py-2 rounded-xl transition-all flex items-center justify-center gap-1.5",
                  portalType === 'customer' ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <User size={14} className="text-emerald-600" />
                <span>Customer Order Access</span>
              </button>
              <button
                type="button"
                onClick={() => { setPortalType('staff'); setSignupRole('Sales Executive'); }}
                className={cn(
                  "py-2 rounded-xl transition-all flex items-center justify-center gap-1.5",
                  portalType === 'staff' ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <Briefcase size={14} className="text-amber-400" />
                <span>Internal ERP Access</span>
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-xs font-medium animate-shake">
                <AlertCircle size={16} className="shrink-0 text-rose-500" />
                <span className="flex-1">{authError}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={portalType === 'customer' ? 'customer@example.com' : 'admin@verdantflora.com'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => alert(`Password reset link sent to ${email || 'your email'}.`)}
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember & Touch ID */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 accent-blue-600"
                    />
                    <span>Remember credentials</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      if (users[0]) onLoginSuccess(users[0]);
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-blue-600"
                  >
                    <Fingerprint size={14} className="text-blue-600" /> Touch ID / Biometric
                  </button>
                </div>

                {/* Primary Action Button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </button>

                {/* Footer Switch Link */}
                <div className="text-center pt-2 text-xs font-semibold text-slate-500">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setAuthError(null); }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Sign Up
                  </button>
                </div>

              </form>
            )}

            {/* SIGN UP FORM */}
            {mode === 'signup' && (
              <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Vance Sterling"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. user@example.com"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-3.5 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    Use 8 or more characters with a mix of letters, numbers & symbols.
                  </p>
                </div>

                {/* Repeat Password Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Repeat Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={repeatPassword}
                    onChange={e => setRepeatPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                </div>

                {/* Role selection if staff portal */}
                {portalType === 'staff' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Requested Role (Requires Admin Approval)</label>
                    <select
                      value={signupRole}
                      onChange={e => setSignupRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                    >
                      <option value="Sales Executive">Sales Executive</option>
                      <option value="Production Manager">Production Manager</option>
                      <option value="Procurement Officer">Procurement Officer</option>
                      <option value="Finance Manager">Finance Manager</option>
                      <option value="Supplier">Supplier Partner</option>
                    </select>
                  </div>
                )}

                {/* Terms Checkbox */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={e => setAcceptTerms(e.target.checked)}
                      className="rounded border-slate-300 accent-blue-600"
                    />
                    <span>I accept the <button type="button" onClick={() => alert('Terms & Privacy Policy')} className="text-blue-600 font-bold hover:underline">Term</button></span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <span>Sign Up</span>
                  <ArrowRight size={16} />
                </button>

                {/* Footer Switch Link */}
                <div className="text-center pt-2 text-xs font-semibold text-slate-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setAuthError(null); }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </div>

              </form>
            )}

            {/* MFA MODE */}
            {mode === 'mfa' && (
              <form onSubmit={handleMfaSubmit} className="space-y-4 py-2">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center">
                    <ShieldCheck size={24} />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Two-Factor Security Code</h3>
                  <p className="text-xs text-slate-500">
                    Sent to <strong>{pendingUser?.email}</strong> ({pendingUser?.role})
                  </p>
                </div>

                <div className="flex justify-center gap-2 my-2">
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      value={mfaCode[i]}
                      onChange={e => {
                        const val = e.target.value;
                        const newCode = [...mfaCode];
                        newCode[i] = val;
                        setMfaCode(newCode);
                        if (val && e.target.nextElementSibling) {
                          (e.target.nextElementSibling as HTMLInputElement).focus();
                        }
                      }}
                      className="w-9 h-11 text-center text-lg font-bold bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 focus:bg-white focus:outline-none"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  Verify & Enter System
                </button>
              </form>
            )}

            {/* PENDING APPROVAL MODE */}
            {mode === 'pending' && (
              <div className="text-center space-y-4 py-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl mx-auto flex items-center justify-center">
                  <Clock size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 text-sm">Account Pending Admin Approval</h3>
                  <p className="text-xs text-slate-500">
                    Account <strong>{pendingUser?.name}</strong> ({pendingUser?.role}) has been submitted.
                  </p>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-left text-[11px] text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-amber-800">
                    <AlertCircle size={14} /> Admin Approval Notification Sent
                  </div>
                  <p>
                    A registration request has been sent to the Super Admin to approve your account.
                  </p>
                  <p className="text-[10px] text-amber-700 font-semibold pt-1">
                    🔒 Cart balance (LKR) and direct ordering are restricted to approved active customer accounts only. Once approved, you can sign in to view your cart & place orders!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => { setMode('login'); setPendingUser(null); }}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all"
                >
                  Back to Sign In
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

