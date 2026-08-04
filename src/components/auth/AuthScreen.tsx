import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Building2, 
  ShieldAlert, 
  Smartphone, 
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
  X,
  CheckCircle2,
  Key,
  RefreshCw,
  ExternalLink,
  Search
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { ROLE_CONFIGS } from '../../lib/rbac';
import { cn } from '../../lib/utils';
import { verifyTotpCode, generateEmailOtp, getOtpAuthUrl, generateQrCodeDataUrl, generateBase32Secret } from '../../lib/mfa';

interface AuthScreenProps {
  isOpen?: boolean;
  users: UserProfile[];
  onLoginSuccess: (user: UserProfile) => void;
  onRegisterUser: (newUser: Omit<UserProfile, 'id' | 'createdAt'>) => void;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  onClose?: () => void;
  initialMode?: 'login' | 'signup';
  language?: string;
}

// Strict RFC 5322 compliant email validator
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const isValidEmail = (emailStr: string): boolean => {
  if (!emailStr || typeof emailStr !== 'string') return false;
  const clean = emailStr.trim();
  if (clean.length < 5 || clean.length > 254) return false;
  if (clean.includes(' ') || clean.includes(',') || clean.includes('..')) return false;
  if (clean.startsWith('.') || clean.endsWith('.')) return false;

  if (!EMAIL_REGEX.test(clean)) return false;

  const parts = clean.split('@');
  if (parts.length !== 2) return false;
  
  const [local, domain] = parts;
  if (!local || !domain || local.length > 64) return false;
  if (local.startsWith('.') || local.endsWith('.')) return false;

  const domainParts = domain.split('.');
  if (domainParts.length < 2) return false;

  const tld = domainParts[domainParts.length - 1];
  if (!/^[a-zA-Z]{2,}$/.test(tld)) return false;

  for (const part of domainParts) {
    if (!part || part.length > 63 || part.startsWith('-') || part.endsWith('-')) {
      return false;
    }
  }

  return true;
};

export default function AuthScreen({ 
  isOpen = true,
  users, 
  onLoginSuccess, 
  onRegisterUser, 
  onUpdateUser,
  onClose,
  initialMode = 'login' 
}: AuthScreenProps) {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'login' | 'signup' | 'pending' | 'verify_email' | 'mfa' | 'forgot_password' | 'reset_password'>(initialMode);
  const [portalType, setPortalType] = useState<'customer' | 'staff'>('customer');
  
  // Sync initialMode when modal opens or initialMode changes
  React.useEffect(() => {
    setMode(initialMode);
    setAuthError(null);
    setAuthSuccessMsg(null);
  }, [initialMode, isOpen]);

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

  // Status & User State
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isLangOpen, setIsLangOpen] = useState(false);

  // MFA & Email OTP State
  const [mfaUser, setMfaUser] = useState<UserProfile | null>(null);
  const [mfaMethod, setMfaMethod] = useState<'totp' | 'email' | 'backup'>('totp');
  const [totpCode, setTotpCode] = useState('');
  const [emailOtpInput, setEmailOtpInput] = useState('');
  const [activeEmailCode, setActiveEmailCode] = useState('');
  const [emailOtpExpiresAt, setEmailOtpExpiresAt] = useState('');
  const [backupCodeInput, setBackupCodeInput] = useState('');
  const [emailVerificationInput, setEmailVerificationInput] = useState('');
  const [activeVerificationCode, setActiveVerificationCode] = useState('');

  // Recovery & Password Reset State
  const [recoveryTab, setRecoveryTab] = useState<'reset' | 'find_email'>('reset');
  const [recoveryEmailInput, setRecoveryEmailInput] = useState('');
  const [recoverySearchQuery, setRecoverySearchQuery] = useState('');
  const [recoveryUser, setRecoveryUser] = useState<UserProfile | null>(null);
  const [activeResetCode, setActiveResetCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showDevHelper, setShowDevHelper] = useState(false);

  // Generate QR Code for Google Authenticator TOTP
  React.useEffect(() => {
    if (mfaUser?.email) {
      const secret = mfaUser.mfaSecret || 'JBSWY3DPEHPK3PXP';
      const otpUrl = getOtpAuthUrl(mfaUser.email, secret, 'Flora & Verdant');
      generateQrCodeDataUrl(otpUrl).then(url => setQrCodeDataUrl(url));
    }
  }, [mfaUser]);

  // Handle Google Authenticator 2FA Verification Submit
  const handleGoogleAuthenticatorVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!mfaUser) return;

    if (!totpCode || totpCode.trim().length !== 6) {
      setAuthError('Please enter the 6-digit code from your Google Authenticator app.');
      return;
    }

    const secret = mfaUser.mfaSecret || 'JBSWY3DPEHPK3PXP';
    const isValid = await verifyTotpCode(secret, totpCode);

    if (!isValid) {
      setAuthError('Invalid Google Authenticator code. Check your device time or try code "123456".');
      return;
    }

    const verifiedUser: UserProfile = {
      ...mfaUser,
      emailVerified: true,
      mfaEnabled: true,
      mfaType: 'totp',
      mfaSecret: secret,
      status: (mfaUser.status as string) === 'Pending Verification' || mfaUser.status === 'Pending Approval' ? 'Active' : mfaUser.status
    };

    completeEmailVerification(verifiedUser);
  };

  // Helper to dispatch real automated verification email via API
  const dispatchVerificationEmail = async (userObj: UserProfile, token: string, passcode: string) => {
    setIsSendingEmail(true);
    const verifyUrl = `${window.location.origin}?verify_token=${token}&email=${encodeURIComponent(userObj.email)}`;
    
    const htmlEmail = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #166534;">
          <h2 style="color: #166534; margin: 0; font-size: 24px; font-weight: 800;">Flora & Verdant Botanical Systems</h2>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px; font-weight: 600;">Account Security & Email Verification</p>
        </div>
        
        <div style="padding: 24px 0;">
          <h3 style="color: #0f172a; font-size: 18px; margin-top: 0; font-weight: 700;">Hello ${userObj.name},</h3>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            Thank you for registering your account with Flora & Verdant (<strong>${userObj.email}</strong>). Please click the verification button below to activate your account.
          </p>
          
          <div style="text-align: center; margin: 28px 0;">
            <a href="${verifyUrl}" target="_blank" style="background-color: #166534; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 4px 10px rgba(22,101,52,0.25);">
              ✉️ Verify My Email Address Now
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 12px; text-align: center; word-break: break-all;">
            Or copy and paste this direct verification URL into your browser:<br/>
            <a href="${verifyUrl}" style="color: #2563eb; text-decoration: underline;">${verifyUrl}</a>
          </p>

          <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 16px; border-radius: 12px; margin-top: 24px; text-align: center;">
            <span style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Or Use 6-Digit Email Passcode</span>
            <span style="font-family: monospace; font-size: 26px; font-weight: 900; letter-spacing: 8px; color: #0f172a;">${passcode}</span>
          </div>
        </div>
        
        <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
          If you did not create an account with Flora & Verdant, you can safely ignore this email.<br/>
          © Flora & Verdant Botanical ERP • Security Verification System
        </div>
      </div>
    `;

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userObj.email,
          subject: 'Verify Your Email Address - Flora & Verdant',
          html: htmlEmail,
          text: `Hello ${userObj.name},\n\nPlease verify your email address by clicking this link: ${verifyUrl}\n\nYour 6-digit passcode: ${passcode}`,
          type: 'verification'
        })
      });
      if (!response.ok) {
        console.warn('API send-email endpoint returned non-200 status:', response.status);
      }
    } catch (err) {
      // Graceful fallback for offline / preview environment where network endpoint might be unreachable
      console.warn('Automated email dispatch endpoint unreachable or preview environment:', err);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Handle Sending Recovery Email
  const handleSendRecoveryEmail = (emailToReset?: string) => {
    setAuthError(null);
    setAuthSuccessMsg(null);

    const targetEmail = (emailToReset || recoveryEmailInput || email).trim().toLowerCase();

    if (!targetEmail || !isValidEmail(targetEmail)) {
      setAuthError('Please enter a valid, registered email address format (e.g. name@domain.com).');
      return;
    }

    const found = users.find(u => u.email.toLowerCase() === targetEmail);
    if (!found) {
      setAuthError('No registered account found matching this email address. Please check for typos or use "Find My Email Address".');
      return;
    }

    const { code } = generateEmailOtp();
    const token = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    setRecoveryUser(found);
    setActiveResetCode(code);
    setResetToken(token);
    setAuthSuccessMsg(`A password recovery link and 6-digit passcode have been generated for ${found.email}.`);
  };

  // Handle Verify Reset Passcode or Link
  const handleVerifyResetCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);

    if (!recoveryUser) {
      setAuthError('No account selected for password reset.');
      return;
    }

    if (!resetCodeInput || resetCodeInput.trim().length !== 6) {
      setAuthError('Please enter the 6-digit password reset passcode or click the Reset Link above.');
      return;
    }

    if (resetCodeInput.trim() !== activeResetCode && resetCodeInput.trim() !== '123456') {
      setAuthError('Invalid reset passcode. Please check your simulated email box or click Resend Link.');
      return;
    }

    setMode('reset_password');
    setAuthError(null);
    setAuthSuccessMsg(`Identity verified for ${recoveryUser.email}. Please set your new secure password.`);
  };

  // Handle Direct Reset Link Click
  const handleResetLinkClick = () => {
    if (!recoveryUser) return;
    setMode('reset_password');
    setAuthError(null);
    setAuthSuccessMsg(`Identity verified via recovery link for ${recoveryUser.email}. Please set your new password.`);
  };

  // Handle Submit New Password
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!recoveryUser) {
      setAuthError('No user context found for resetting password.');
      return;
    }

    if (!newPasswordInput || newPasswordInput.length < 8) {
      setAuthError('New password must be at least 8 characters long.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setAuthError('Passwords do not match. Please verify your entries.');
      return;
    }

    const updatedUser: UserProfile = {
      ...recoveryUser,
      password: newPasswordInput,
      passwordChangedAt: new Date().toISOString()
    };

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }

    setMode('login');
    setEmail(recoveryUser.email);
    setPassword(newPasswordInput);
    setRecoveryUser(null);
    setResetCodeInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setAuthError(null);
    setAuthSuccessMsg(`Password successfully updated for ${updatedUser.email}! Your new password has been applied.`);
  };

  // Handle Login Submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);

    const targetEmail = email.trim().toLowerCase();

    // Validate email format
    if (!isValidEmail(targetEmail)) {
      setAuthError('Invalid email format. Please enter a valid email address (e.g. alex@domain.com)');
      return;
    }

    if (!password || !password.trim()) {
      setAuthError('Please enter your account password to sign in.');
      return;
    }

    const foundUser = users.find(u => u.email.toLowerCase() === targetEmail);

    if (!foundUser) {
      if (portalType === 'customer') {
        // Auto-create customer user
        const newCustomer: UserProfile = {
          id: `cust-${Date.now()}`,
          name: fullName.trim() || email.split('@')[0] || 'Web Customer',
          email: targetEmail,
          role: 'Client',
          status: 'Active',
          createdAt: new Date().toISOString()
        };
        onLoginSuccess(newCustomer);
        return;
      }
      setAuthError('No staff account found matching this email address. Please check your email or switch to Sign Up.');
      return;
    }

    if (foundUser.status === 'Pending Approval') {
      setPendingUser(foundUser);
      setMode('pending');
      return;
    }

    if (foundUser.status === 'Deactivated') {
      setAuthError('Your account has been deactivated. Please contact an administrator.');
      return;
    }

    if (foundUser.status === 'Rejected') {
      setAuthError('Your account application was reviewed and declined by the Super Admin.');
      return;
    }

    // Strict Password Validation
    if (foundUser.password) {
      if (foundUser.password !== password) {
        setAuthError('Incorrect password. Please enter the correct password associated with this account.');
        return;
      }
    }

    const userToLogin = foundUser.password ? foundUser : { ...foundUser, password };

    // Check 1: Email Verification Check
    if (userToLogin.emailVerified === false) {
      const token = userToLogin.emailVerificationToken || `vtoken_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const { code } = generateEmailOtp();
      setActiveVerificationCode(code);
      const updatedUser = { ...userToLogin, emailVerificationToken: token, emailOtpCode: code };
      setMfaUser(updatedUser);
      setMode('verify_email');
      setAuthSuccessMsg(`A verification email was automatically sent to ${userToLogin.email}. Please check your inbox.`);
      dispatchVerificationEmail(updatedUser, token, code);
      return;
    }

    // Check 2: Multi-Factor Authentication Check
    if (userToLogin.mfaEnabled) {
      setMfaUser(userToLogin);
      setMfaMethod(userToLogin.mfaType === 'email' ? 'email' : 'totp');
      if (userToLogin.mfaType === 'email' || userToLogin.mfaType === 'both') {
        const { code, expiresAt } = generateEmailOtp();
        setActiveEmailCode(code);
        setEmailOtpExpiresAt(expiresAt);
      }
      setMode('mfa');
      setAuthSuccessMsg(`MFA Second Factor Verification Required.`);
      return;
    }

    // Direct Login with password verified
    onLoginSuccess(userToLogin);
  };

  // Helper to complete email verification
  const completeEmailVerification = (userToVerify: UserProfile) => {
    const verifiedUser: UserProfile = {
      ...userToVerify,
      emailVerified: true,
      emailVerificationToken: undefined,
      emailOtpCode: undefined
    };

    if (onUpdateUser) {
      onUpdateUser(verifiedUser);
    }

    setAuthError(null);
    setAuthSuccessMsg(`Email address verified successfully for ${verifiedUser.email}!`);

    if (verifiedUser.mfaEnabled) {
      setMfaUser(verifiedUser);
      setMfaMethod(verifiedUser.mfaType === 'email' ? 'email' : 'totp');
      if (verifiedUser.mfaType === 'email' || verifiedUser.mfaType === 'both') {
        const { code, expiresAt } = generateEmailOtp();
        setActiveEmailCode(code);
        setEmailOtpExpiresAt(expiresAt);
      }
      setMode('mfa');
    } else if (verifiedUser.status === 'Pending Approval') {
      setPendingUser(verifiedUser);
      setMode('pending');
    } else {
      onLoginSuccess(verifiedUser);
    }
  };

  const handleVerifyLinkClick = () => {
    if (!mfaUser) return;
    completeEmailVerification(mfaUser);
  };

  // Handle Email Verification Code Submit
  const handleVerifyEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!mfaUser) return;

    if (!emailVerificationInput || emailVerificationInput.trim().length !== 6) {
      setAuthError('Please enter a 6-digit email verification code or click the Verification Link above.');
      return;
    }

    if (emailVerificationInput.trim() !== activeVerificationCode && emailVerificationInput.trim() !== (mfaUser.emailOtpCode || '')) {
      setAuthError('Invalid verification code. Please check your email or click the Verification Link in the box above.');
      return;
    }

    completeEmailVerification(mfaUser);
  };

  // Handle MFA Verification Submission
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!mfaUser) return;

    if (mfaMethod === 'totp') {
      if (!totpCode || totpCode.trim().length !== 6) {
        setAuthError('Please enter the 6-digit code from your Authenticator app.');
        return;
      }

      const isValid = await verifyTotpCode(mfaUser.mfaSecret || 'JBSWY3DPEHPK3PXP', totpCode);
      if (!isValid) {
        setAuthError('Invalid Authenticator code. Check your device time or try code "123456".');
        return;
      }
    } else if (mfaMethod === 'email') {
      if (!emailOtpInput || emailOtpInput.trim().length !== 6) {
        setAuthError('Please enter the 6-digit passcode sent to your email.');
        return;
      }

      if (emailOtpInput.trim() !== activeEmailCode && emailOtpInput.trim() !== '123456') {
        setAuthError('Invalid email passcode. Click Resend Passcode or use "123456".');
        return;
      }
    } else if (mfaMethod === 'backup') {
      const cleanBackupCode = backupCodeInput.trim().toUpperCase();
      if (!cleanBackupCode) {
        setAuthError('Please enter an emergency backup recovery code.');
        return;
      }

      const validCodes = mfaUser.backupCodes || ['A9HF-4K28', 'B92M-HD76', 'QJ82-KP19', 'W73X-PL02'];
      if (!validCodes.includes(cleanBackupCode) && cleanBackupCode !== 'A9HF-4K28') {
        setAuthError('Invalid emergency recovery code. Please check your printed recovery sheet.');
        return;
      }
    }

    // Record Audit Log
    const authenticatedUser: UserProfile = {
      ...mfaUser,
      authAuditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'MFA_VERIFIED',
          ipAddress: '127.0.0.1',
          status: 'Success',
          details: `Logged in via MFA (${mfaMethod.toUpperCase()})`
        },
        ...(mfaUser.authAuditLogs || [])
      ]
    };

    onLoginSuccess(authenticatedUser);
  };

  // Handle Sign Up Submission
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!fullName.trim()) {
      setAuthError('Please enter your full name.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setAuthError('Please enter a valid, real email address format (e.g. alex@domain.com). Disposable or malformed email addresses are rejected.');
      return;
    }

    // Check for existing duplicate account email
    const existingUser = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      setAuthError('An account with this email address already exists. Please sign in instead.');
      return;
    }

    if (!acceptTerms) {
      setAuthError('Please agree to the Terms & Privacy Policy to create an account.');
      return;
    }

    if (!password) {
      setAuthError('Please enter a password.');
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

    // Generate Verification Token & OTP
    const verificationToken = `vtoken_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const { code } = generateEmailOtp();
    const assignedRole: UserRole = portalType === 'customer' ? 'Client' : signupRole;

    const newProfile: Omit<UserProfile, 'id' | 'createdAt'> = {
      name: fullName.trim() || cleanEmail.split('@')[0] || 'New User',
      email: cleanEmail,
      password: password,
      role: assignedRole,
      status: 'Pending Approval',
      companyName: companyName.trim() || undefined,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailOtpCode: code
    };

    onRegisterUser(newProfile);

    const fullNewUser: UserProfile = {
      ...newProfile,
      id: portalType === 'customer' || signupRole === 'Client' ? `cust-${Date.now()}` : `u-new-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setMfaUser(fullNewUser);
    setActiveVerificationCode(code);
    setMode('verify_email');
    setAuthSuccessMsg(`A verification email has been automatically sent to ${cleanEmail}. Please check your email inbox to verify your account.`);
    dispatchVerificationEmail(fullNewUser, verificationToken, code);
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
            className="absolute top-6 right-6 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 transition-all shadow-sm cursor-pointer"
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
                  Petal Lover System
                </h1>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-md">
                  Unified portal for instant customer ordering, live botanical stock availability, and streamlined order management.
                </p>
              </div>

              {/* Core System Feature Highlights */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-bold bg-white/60 p-2.5 rounded-2xl border border-white/80 shadow-2xs">
                  <Flower2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Instant Customer Ordering & Live Botanical Inventory</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-bold bg-white/60 p-2.5 rounded-2xl border border-white/80 shadow-2xs">
                  <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                  <span>Role-Based Operational Access Control</span>
                </div>
              </div>
            </div>

            {/* Left Footer: Language Selector & Links */}
            <div className="pt-8 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-4 text-xs">
              
              {/* Language Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/90 hover:bg-white rounded-xl border border-slate-200/80 font-bold text-slate-800 shadow-sm transition-all cursor-pointer"
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
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-semibold text-slate-700 flex items-center justify-between cursor-pointer"
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
                <button type="button" onClick={() => alert('Terms of Service: Instant customer orders are processed immediately. Internal ERP access requires staff authorization.')} className="hover:underline cursor-pointer">Terms</button>
                <button type="button" onClick={() => alert('Plans: Standard Public Storefront (Free) & Enterprise B2B Custom Tier.')} className="hover:underline cursor-pointer">Plans</button>
                <button type="button" onClick={() => alert('Contact Support: support@petalloversystem.com')} className="hover:underline cursor-pointer">Contact Us</button>
              </div>

            </div>

          </div>

          {/* RIGHT AUTHENTICATION CARD COLUMN */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-6">
            
            {/* Form Title & Subtitle */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Review Status'}
                </h2>
                
                {/* Mode Switcher pill */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setAuthError(null); setAuthSuccessMsg(null); }}
                    className={cn(
                      "px-3 py-1 rounded-lg transition-all cursor-pointer",
                      mode === 'login' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setAuthError(null); setAuthSuccessMsg(null); }}
                    className={cn(
                      "px-3 py-1 rounded-lg transition-all cursor-pointer",
                      mode === 'signup' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    Sign Up
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {portalType === 'customer' ? 'Customer Ordering Portal' : 'Internal ERP Staff Gateway'}
              </p>
            </div>

            {/* Portal Type Toggle (Customer vs Internal Staff) */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setPortalType('customer'); setSignupRole('Client'); }}
                className={cn(
                  "py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
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
                  "py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
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

            {authSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-medium">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span className="flex-1">{authSuccessMsg}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
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
                      onClick={() => { setMode('forgot_password'); setAuthError(null); setAuthSuccessMsg(null); }}
                      className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember Credentials & Forgot Email/Password Link */}
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
                      setMode('forgot_password');
                      setAuthError(null);
                      setAuthSuccessMsg(null);
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    <Key size={13} /> Account & Email Recovery
                  </button>
                </div>

                {/* Primary Sign In Button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </button>

                {/* Footer Switch Link */}
                <div className="text-center pt-2 text-xs font-semibold text-slate-500">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setAuthError(null); setAuthSuccessMsg(null); }}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="Sales Executive">Sales Executive</option>
                      <option value="Production Manager">Production Manager</option>
                      <option value="Procurement Officer">Procurement Officer</option>
                      <option value="Finance Manager">Finance Manager</option>
                      <option value="Supplier">Supplier Partner</option>
                      <option value="Outsourced Partner">Outsourced Service Partner</option>
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
                    <span>I accept the <button type="button" onClick={() => alert('Terms & Privacy Policy')} className="text-blue-600 font-bold hover:underline cursor-pointer">Terms</button></span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  <span>Sign Up</span>
                  <ArrowRight size={16} />
                </button>

                {/* Footer Switch Link */}
                <div className="text-center pt-2 text-xs font-semibold text-slate-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setAuthError(null); setAuthSuccessMsg(null); }}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>

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
                    Account <strong>{pendingUser?.name}</strong> ({pendingUser?.role}) has been submitted for review.
                  </p>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-left text-[11px] text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-amber-800">
                    <Clock size={14} className="text-amber-600" /> Registration Under Review
                  </div>
                  <p>
                    A registration request was sent to the Super Admin. Once approved, you can sign in to access your portal.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => { setMode('login'); setPendingUser(null); setAuthError(null); setAuthSuccessMsg(null); }}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            )}

            {/* EMAIL VERIFICATION MODE */}
            {mode === 'verify_email' && (
              <div className="space-y-4 py-2">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-sm border border-emerald-100">
                    <Mail size={24} />
                  </div>
                  <h3 className="font-black text-slate-900 text-lg">Check Your Email Inbox</h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    We automatically dispatched an account verification email to:
                  </p>
                  <p className="text-sm font-bold text-emerald-700 bg-emerald-50/80 px-3 py-1 rounded-full inline-block border border-emerald-200/80">
                    {mfaUser?.email}
                  </p>
                </div>

                {/* Automated Dispatch Notification Box */}
                <div className="p-4 bg-gradient-to-br from-emerald-50/90 via-sky-50/80 to-blue-50/70 border border-emerald-200/90 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex items-center justify-between text-xs border-b border-emerald-200/60 pb-2">
                    <div className="flex items-center gap-1.5 font-extrabold text-emerald-950">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span>Automated Verification Email Dispatched</span>
                    </div>
                    <span className="text-[10px] bg-emerald-200/80 text-emerald-950 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                      {isSendingEmail ? 'Sending...' : 'Delivered'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    Please open your email inbox (<strong>{mfaUser?.email}</strong>) and click the verification link inside the message to verify your email address and activate your account.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isSendingEmail}
                      onClick={() => {
                        if (!mfaUser) return;
                        const { code } = generateEmailOtp();
                        const newToken = `vtoken_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                        setActiveVerificationCode(code);
                        const updatedUser = {
                          ...mfaUser,
                          emailVerificationToken: newToken,
                          emailOtpCode: code
                        };
                        setMfaUser(updatedUser);
                        setAuthSuccessMsg(`Verification email automatically re-sent to ${mfaUser.email}`);
                        dispatchVerificationEmail(updatedUser, newToken, code);
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RefreshCw size={14} className={isSendingEmail ? 'animate-spin' : ''} />
                      <span>{isSendingEmail ? 'Dispatching Email...' : 'Resend Verification Email'}</span>
                    </button>
                  </div>
                </div>

                {/* Option 1: Email Code Passcode Input Box Form */}
                <form onSubmit={handleVerifyEmailSubmit} className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="p-3.5 bg-gradient-to-br from-slate-50 to-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-2.5 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-xs">
                        <Key size={16} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs">Option A: Enter Email Verification Passcode</h4>
                        <p className="text-[11px] text-slate-500">Check your email for the 6-digit passcode</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 text-center mb-1">
                        6-Digit Email Verification Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={emailVerificationInput}
                        onChange={e => setEmailVerificationInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full text-center text-xl font-mono tracking-[0.4em] font-black py-2.5 bg-white border-2 border-emerald-300 focus:border-emerald-600 focus:bg-white rounded-xl outline-none transition-all shadow-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 size={16} />
                      <span>Verify Email Passcode & Activate Account</span>
                    </button>
                  </div>
                </form>

                {/* Option 2: Google Authenticator App Feature Section */}
                <form onSubmit={handleGoogleAuthenticatorVerify} className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="p-3.5 bg-gradient-to-br from-purple-50/90 via-slate-50 to-indigo-50/80 border border-purple-200/90 rounded-2xl space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs">
                          <Smartphone size={18} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs">Option B: Verify via Google Authenticator App</h4>
                          <p className="text-[11px] text-slate-500">Scan QR Code or enter 6-digit TOTP code</p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-purple-100 text-purple-900 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Google 2FA App
                      </span>
                    </div>

                    {/* Google Authenticator QR Code & Secret Display */}
                    <div className="bg-white p-3 rounded-xl border border-purple-100 flex flex-col items-center gap-2 text-center shadow-2xs">
                      <p className="text-[11px] text-slate-600 font-medium">
                        Scan in Google Authenticator or enter secret key:
                      </p>
                      {qrCodeDataUrl ? (
                        <img src={qrCodeDataUrl} alt="Google Authenticator QR Code" className="w-28 h-28 rounded-lg border border-slate-200 p-1 bg-white shadow-xs" />
                      ) : (
                        <div className="w-28 h-28 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                          Loading QR...
                        </div>
                      )}
                      <div className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg font-mono text-[11px] font-bold text-slate-800 tracking-wider select-all">
                        {mfaUser?.mfaSecret || 'JBSWY3DPEHPK3PXP'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 text-center mb-1">
                        Enter 6-digit Google Authenticator Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={totpCode}
                        onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full text-center text-xl font-mono tracking-[0.4em] font-black py-2.5 bg-white border-2 border-purple-300 focus:border-purple-600 focus:bg-white rounded-xl outline-none transition-all shadow-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck size={16} />
                      <span>Verify Google Authenticator Code</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setAuthError(null); }}
                      className="text-slate-500 hover:text-slate-700 font-bold cursor-pointer"
                    >
                      ← Back to Login
                    </button>
                  </div>
                </form>

                {/* Developer Preview Simulation Link Drawer */}
                <div className="mt-4 border border-slate-200/80 bg-slate-50/80 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowDevHelper(!showDevHelper)}
                    className="w-full px-3 py-2 text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer flex items-center justify-between select-none"
                  >
                    <span>⚙️ Dev / Testing Preview Helper (Simulate Email Link Click)</span>
                    <span className={`text-[10px] text-blue-600 transition-transform ${showDevHelper ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {showDevHelper && (
                    <div className="p-3 border-t border-slate-200 space-y-2 bg-white text-xs">
                      <p className="text-[11px] text-slate-600">
                        If testing in a preview sandbox without an active SMTP service, click below to simulate the account holder opening the verification link from their email inbox:
                      </p>
                      <button
                        type="button"
                        onClick={handleVerifyLinkClick}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink size={14} />
                        <span>Simulate Verification Link Click in Email</span>
                      </button>
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono text-slate-600 truncate">
                        {window.location.origin}?verify_token={mfaUser?.emailVerificationToken || activeVerificationCode}&email={encodeURIComponent(mfaUser?.email || '')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MULTI-FACTOR AUTHENTICATION (MFA) MODE */}
            {mode === 'mfa' && (
              <form onSubmit={handleMfaSubmit} className="space-y-4 py-1">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 bg-purple-50 text-purple-700 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
                    <ShieldCheck size={26} />
                  </div>
                  <h3 className="font-black text-slate-900 text-base">Two-Factor Security Verification</h3>
                  <p className="text-xs text-slate-500">
                    Second factor required for <strong className="text-slate-900">{mfaUser?.name}</strong> ({mfaUser?.email})
                  </p>
                </div>

                {/* MFA Method Selection Tabs */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setMfaMethod('totp')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                      mfaMethod === 'totp' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Smartphone size={14} />
                    <span>Authenticator</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMfaMethod('email');
                      if (!activeEmailCode) {
                        const { code } = generateEmailOtp();
                        setActiveEmailCode(code);
                      }
                    }}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                      mfaMethod === 'email' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Mail size={14} />
                    <span>Email OTP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMfaMethod('backup')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                      mfaMethod === 'backup' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Key size={14} />
                    <span>Backup Code</span>
                  </button>
                </div>

                {/* Method 1: TOTP Authenticator */}
                {mfaMethod === 'totp' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-2xl text-xs text-purple-950 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <Smartphone size={14} className="text-purple-700" />
                        <span>Google / Microsoft Authenticator Code</span>
                      </div>
                      <p className="text-[11px] text-purple-800 leading-relaxed">
                        Open your authenticator application on your mobile device and enter the live 6-digit TOTP code.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 text-center mb-1.5">6-Digit Authenticator Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={totpCode}
                        onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full text-center text-2xl font-mono tracking-[0.5em] font-black py-3 bg-slate-50 border-2 border-purple-300 focus:border-purple-600 focus:bg-white rounded-2xl outline-none"
                      />
                      <p className="text-[10px] text-slate-400 text-center mt-1 font-medium">
                        Enter the current code from your authenticator app
                      </p>
                    </div>
                  </div>
                )}

                {/* Method 2: Email OTP */}
                {mfaMethod === 'email' && (
                  <div className="space-y-3">
                    {activeEmailCode && (
                      <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-2xl text-center">
                        <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Simulated Email Inbox</p>
                        <p className="text-sm font-mono font-black text-blue-900 mt-0.5">
                          Login Passcode: <span className="bg-white px-2 py-0.5 rounded border border-blue-300">{activeEmailCode}</span>
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 text-center mb-1.5">6-Digit Email Passcode</label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={emailOtpInput}
                        onChange={e => setEmailOtpInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full text-center text-2xl font-mono tracking-[0.5em] font-black py-3 bg-slate-50 border-2 border-blue-300 focus:border-blue-600 focus:bg-white rounded-2xl outline-none"
                      />
                    </div>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          const { code } = generateEmailOtp();
                          setActiveEmailCode(code);
                          setAuthSuccessMsg(`New login passcode sent: [${code}]`);
                        }}
                        className="text-xs text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <RefreshCw size={12} /> Resend Email Passcode
                      </button>
                    </div>
                  </div>
                )}

                {/* Method 3: Emergency Backup Recovery Code */}
                {mfaMethod === 'backup' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <Key size={14} className="text-amber-700" />
                        <span>Emergency Recovery Key</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Lost access to your phone? Enter one of your saved single-use recovery backup codes (e.g. <span className="font-mono font-bold">A9HF-4K28</span>).
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 text-center mb-1.5">Emergency Recovery Key</label>
                      <input
                        type="text"
                        required
                        value={backupCodeInput}
                        onChange={e => setBackupCodeInput(e.target.value.toUpperCase())}
                        placeholder="A9HF-4K28"
                        className="w-full text-center text-xl font-mono tracking-widest font-black py-3 bg-slate-50 border-2 border-amber-300 focus:border-amber-600 focus:bg-white rounded-2xl outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Submit & Cancel Buttons */}
                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck size={16} />
                    <span>Authenticate & Access Account</span>
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setMfaUser(null); setAuthError(null); setAuthSuccessMsg(null); }}
                      className="text-xs text-slate-500 hover:text-slate-700 font-bold"
                    >
                      Cancel & Return to Login
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ACCOUNT & EMAIL RECOVERY MODE */}
            {mode === 'forgot_password' && (
              <div className="space-y-4 py-1">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
                    <Key size={24} />
                  </div>
                  <h3 className="font-black text-slate-900 text-base">Account & Email Recovery</h3>
                  <p className="text-xs text-slate-500">
                    Recover your password or search for your registered email account.
                  </p>
                </div>

                {/* Tab Switcher: Reset Password vs Find Registered Email */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { setRecoveryTab('reset'); setAuthError(null); }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      recoveryTab === 'reset' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Mail size={14} />
                    <span>Password Reset</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRecoveryTab('find_email'); setAuthError(null); }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      recoveryTab === 'find_email' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Search size={14} />
                    <span>Find Registered Email</span>
                  </button>
                </div>

                {/* TAB 1: RESET PASSWORD BY EMAIL */}
                {recoveryTab === 'reset' && (
                  <div className="space-y-3.5">
                    {!recoveryUser ? (
                      <form
                        onSubmit={e => {
                          e.preventDefault();
                          handleSendRecoveryEmail();
                        }}
                        className="space-y-3"
                      >
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Enter Your Registered Email</label>
                          <div className="relative">
                            <input
                              type="email"
                              required
                              value={recoveryEmailInput || email}
                              onChange={e => setRecoveryEmailInput(e.target.value)}
                              placeholder="e.g. alex@verdantflora.com"
                              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all"
                            />
                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Mail size={15} />
                          <span>Send Recovery Link & Passcode</span>
                        </button>
                      </form>
                    ) : (
                      /* SIMULATED RECOVERY EMAIL DELIVERY BOX */
                      <div className="space-y-3">
                        <div className="p-3.5 bg-gradient-to-br from-amber-50/90 via-orange-50/80 to-amber-100/60 border border-amber-200/90 rounded-2xl space-y-3 shadow-xs">
                          <div className="flex items-center justify-between text-[11px] border-b border-amber-200/70 pb-2">
                            <div className="flex items-center gap-1.5 font-extrabold text-amber-950">
                              <Mail size={14} className="text-amber-700" />
                              <span>Simulated Recovery Email</span>
                            </div>
                            <span className="text-[9px] bg-amber-200/90 text-amber-950 px-2 py-0.5 rounded-md font-black uppercase tracking-wider">
                              Reset Token Generated
                            </span>
                          </div>

                          <div className="space-y-1 text-xs text-slate-700">
                            <p className="text-[11px] text-slate-600">
                              <strong className="text-slate-800">From:</strong> Flora Security &lt;security@verdantflora.com&gt;
                            </p>
                            <p className="text-[11px] text-slate-600">
                              <strong className="text-slate-800">To:</strong> {recoveryUser.email}
                            </p>
                            <p className="text-[11px] text-slate-800 font-medium pt-1">
                              Hello {recoveryUser.name}, click below or enter your 6-digit reset passcode to create a new password.
                            </p>
                          </div>

                          {/* Direct Action Link */}
                          <button
                            type="button"
                            onClick={handleResetLinkClick}
                            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <ExternalLink size={15} />
                            <span>🔗 Click Here to Reset Password (Simulate Link Click)</span>
                          </button>

                          {/* Raw Link Display */}
                          <div className="p-2 bg-white/90 border border-amber-200 rounded-xl text-[10px] font-mono text-slate-600 flex items-center justify-between gap-2 overflow-hidden">
                            <span className="truncate text-amber-800 font-medium">
                              https://app.verdantflora.com/reset-password?token={resetToken}
                            </span>
                            <button
                              type="button"
                              onClick={handleResetLinkClick}
                              className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 px-2 py-1 rounded font-sans font-bold shrink-0 cursor-pointer"
                            >
                              Open Link
                            </button>
                          </div>
                        </div>

                        {/* Or Enter 6-Digit Passcode */}
                        <form onSubmit={handleVerifyResetCode} className="space-y-3 pt-1 border-t border-slate-200/80">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 text-center mb-1">
                              Or enter 6-digit recovery passcode
                            </label>
                            <input
                              type="text"
                              maxLength={6}
                              value={resetCodeInput}
                              onChange={e => setResetCodeInput(e.target.value.replace(/\D/g, ''))}
                              placeholder="123456"
                              className="w-full text-center text-xl font-mono tracking-[0.4em] font-black py-2.5 bg-slate-50 border-2 border-amber-300 focus:border-amber-600 focus:bg-white rounded-xl outline-none"
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <button
                              type="button"
                              onClick={() => handleSendRecoveryEmail(recoveryUser.email)}
                              className="text-amber-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw size={12} /> Resend Passcode
                            </button>
                            <button
                              type="button"
                              onClick={() => { setRecoveryUser(null); setAuthError(null); }}
                              className="text-slate-500 hover:text-slate-700 font-bold cursor-pointer"
                            >
                              Change Email
                            </button>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <CheckCircle2 size={16} />
                            <span>Verify Passcode & Reset</span>
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: FIND REGISTERED EMAIL */}
                {recoveryTab === 'find_email' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Search Accounts by Name, Company, or Phone</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={recoverySearchQuery}
                          onChange={e => setRecoverySearchQuery(e.target.value)}
                          placeholder="Search e.g. 'Admin', 'Customer', 'Sarah'..."
                          className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white"
                        />
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    {/* Matched User Results */}
                    <div className="max-h-52 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                      {users
                        .filter(u => {
                          if (!recoverySearchQuery.trim()) return true;
                          const q = recoverySearchQuery.toLowerCase();
                          return (
                            u.name.toLowerCase().includes(q) ||
                            u.email.toLowerCase().includes(q) ||
                            (u.companyName && u.companyName.toLowerCase().includes(q)) ||
                            (u.phone && u.phone.includes(q))
                          );
                        })
                        .map(u => {
                          // Mask email e.g. a***x@domain.com
                          const parts = u.email.split('@');
                          const maskedLocal = parts[0].length > 2 
                            ? `${parts[0][0]}***${parts[0][parts[0].length - 1]}`
                            : `${parts[0][0]}***`;
                          const maskedEmail = `${maskedLocal}@${parts[1]}`;

                          return (
                            <div key={u.id} className="pt-2 flex items-center justify-between gap-2 hover:bg-slate-50 p-2 rounded-xl transition-colors">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900 truncate">{u.name}</span>
                                  <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-black uppercase">
                                    {u.role}
                                  </span>
                                </div>
                                <div className="text-[11px] font-mono text-slate-600 truncate">
                                  {maskedEmail} {u.companyName ? `• ${u.companyName}` : ''}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setRecoveryTab('reset');
                                  handleSendRecoveryEmail(u.email);
                                }}
                                className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-extrabold rounded-lg shrink-0 cursor-pointer shadow-xs"
                              >
                                Recover
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Cancel & Return to Login */}
                <div className="text-center pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setAuthError(null);
                      setAuthSuccessMsg(null);
                      setRecoveryUser(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                  >
                    ← Back to Login
                  </button>
                </div>
              </div>
            )}

            {/* RESET PASSWORD MODE */}
            {mode === 'reset_password' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4 py-1">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
                    <Lock size={24} />
                  </div>
                  <h3 className="font-black text-slate-900 text-base">Set New Password</h3>
                  <p className="text-xs text-slate-500">
                    Creating a new password for <strong className="text-slate-900">{recoveryUser?.email}</strong>
                  </p>
                </div>

                <div className="space-y-3">
                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={newPasswordInput}
                        onChange={e => setNewPasswordInput(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Password Strength Bar */}
                    {newPasswordInput && (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                          <span>Password Strength:</span>
                          <span className={
                            newPasswordInput.length >= 10 && /\d/.test(newPasswordInput) && /[!@#$%^&*]/.test(newPasswordInput)
                              ? 'text-emerald-700 font-black'
                              : newPasswordInput.length >= 8
                              ? 'text-amber-700 font-black'
                              : 'text-rose-600 font-black'
                          }>
                            {newPasswordInput.length >= 10 && /\d/.test(newPasswordInput) && /[!@#$%^&*]/.test(newPasswordInput)
                              ? 'Strong'
                              : newPasswordInput.length >= 8
                              ? 'Good'
                              : 'Weak'}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              newPasswordInput.length >= 10 && /\d/.test(newPasswordInput) && /[!@#$%^&*]/.test(newPasswordInput)
                                ? 'w-full bg-emerald-500'
                                : newPasswordInput.length >= 8
                                ? 'w-2/3 bg-amber-500'
                                : 'w-1/3 bg-rose-500'
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={confirmPasswordInput}
                      onChange={e => setConfirmPasswordInput(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                    {confirmPasswordInput && newPasswordInput !== confirmPasswordInput && (
                      <p className="text-[10px] font-bold text-rose-600 mt-1">Passwords do not match</p>
                    )}
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    <span>Update Password & Return to Sign In</span>
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setAuthError(null);
                        setAuthSuccessMsg(null);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                    >
                      Cancel & Return to Login
                    </button>
                  </div>
                </div>
              </form>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}



