import React, { useState, useRef } from 'react';
import { Save, Plus, Trash2, Building2, Landmark, Phone, Globe, Mail, Image as ImageIcon, Upload, FileText, Tag, Download, Archive, DollarSign, Store, PhoneCall, Share2, Check, RefreshCw, Megaphone, Eye, EyeOff, Sparkles } from 'lucide-react';
import { CompanySettings, BankDetail, TermAndCondition, Advertisement, AdvertisementItem } from '../../types';
import { INITIAL_SETTINGS } from '../../constants';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useNotifications } from '../../context/NotificationContext';
import { translations, Language } from '../../i18n';

interface SettingsProps {
  settings: CompanySettings;
  onUpdateSettings: (settings: CompanySettings) => void;
  allData?: {
    finishedProducts: any[];
    materials: any[];
    orders: any[];
    transactions: any[];
    quotations: any[];
    invoices: any[];
    expenses: any[];
    clients: any[];
    suppliers: any[];
  };
  language?: Language;
}

export default function Settings({ settings, onUpdateSettings, allData, language = 'en' }: SettingsProps) {
  const { addNotification } = useNotifications();
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleSaveSettings = () => {
    addNotification({
      title: 'Settings Saved',
      message: 'Business settings have been updated successfully.',
      type: 'success',
      category: 'system'
    });
  };

  const handleBulkExport = async () => {
    if (!allData) return;
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const timestamp = new Date().toISOString().split('T')[0];
      const folder = zip.folder(`business_data_backup_${timestamp}`);

      if (folder) {
        // Add JSON data
        folder.file('finishedProducts.json', JSON.stringify(allData.finishedProducts, null, 2));
        folder.file('materials.json', JSON.stringify(allData.materials, null, 2));
        folder.file('orders.json', JSON.stringify(allData.orders, null, 2));
        folder.file('transactions.json', JSON.stringify(allData.transactions, null, 2));
        folder.file('quotations.json', JSON.stringify(allData.quotations, null, 2));
        folder.file('invoices.json', JSON.stringify(allData.invoices, null, 2));
        folder.file('expenses.json', JSON.stringify(allData.expenses, null, 2));
        folder.file('clients.json', JSON.stringify(allData.clients, null, 2));
        folder.file('suppliers.json', JSON.stringify(allData.suppliers, null, 2));
        folder.file('company_settings.json', JSON.stringify(settings, null, 2));

        // Create a summary text file
        const summary = `
BUSINESS DATA EXPORT SUMMARY
Generated on: ${new Date().toLocaleString()}
Company: ${settings.name}

DATA COUNTS:
- Finished Products: ${allData.finishedProducts.length}
- Materials/Services: ${allData.materials.length}
- Orders: ${allData.orders.length}
- Transactions: ${allData.transactions.length}
- Quotations: ${allData.quotations.length}
- Invoices: ${allData.invoices.length}
- Expenses: ${allData.expenses.length}
- Clients: ${allData.clients.length}
- Suppliers: ${allData.suppliers.length}
        `;
        folder.file('summary.txt', summary);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `full_backup_${settings.name.replace(/\s+/g, '_').toLowerCase()}_${timestamp}.zip`);
      addNotification({
        title: 'Export Successful',
        message: 'Bulk data export has been completed successfully.',
        type: 'success',
        category: 'system'
      });
    } catch (error) {
      console.error('Export failed:', error);
      addNotification({
        title: 'Export Failed',
        message: 'Failed to generate bulk data export. Please try again.',
        type: 'error',
        category: 'system'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateSettings({ ...settings, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addPhone = () => {
    onUpdateSettings({ ...settings, phones: [...settings.phones, ''] });
  };

  const updatePhone = (index: number, value: string) => {
    const newPhones = [...settings.phones];
    newPhones[index] = value;
    onUpdateSettings({ ...settings, phones: newPhones });
  };

  const removePhone = (index: number) => {
    onUpdateSettings({ ...settings, phones: settings.phones.filter((_, i) => i !== index) });
  };

  const addBank = () => {
    const newBank: BankDetail = {
      id: Date.now().toString(),
      bankName: '',
      accountNumber: '',
      branch: '',
      accountHolder: ''
    };
    onUpdateSettings({ ...settings, bankDetails: [...settings.bankDetails, newBank] });
  };

  const updateBank = (index: number, field: keyof BankDetail, value: string) => {
    const newBanks = [...settings.bankDetails];
    newBanks[index] = { ...newBanks[index], [field]: value };
    onUpdateSettings({ ...settings, bankDetails: newBanks });
  };

  const removeBank = (index: number) => {
    onUpdateSettings({ ...settings, bankDetails: settings.bankDetails.filter((_, i) => i !== index) });
  };

  const addTerm = () => {
    const newTerm: TermAndCondition = {
      id: `term-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: ''
    };
    onUpdateSettings({ ...settings, terms: [...(settings.terms || []), newTerm] });
  };

  const updateTerm = (index: number, text: string) => {
    const newTerms = [...settings.terms];
    newTerms[index] = { ...newTerms[index], text };
    onUpdateSettings({ ...settings, terms: newTerms });
  };

  const removeTerm = (index: number) => {
    onUpdateSettings({ ...settings, terms: settings.terms.filter((_, i) => i !== index) });
  };

  const addExpenseCategory = () => {
    onUpdateSettings({ ...settings, expenseCategories: [...settings.expenseCategories, 'New Category'] });
  };

  const updateExpenseCategory = (index: number, value: string) => {
    const newCategories = [...settings.expenseCategories];
    newCategories[index] = value;
    onUpdateSettings({ ...settings, expenseCategories: newCategories });
  };

  const removeExpenseCategory = (index: number) => {
    onUpdateSettings({ ...settings, expenseCategories: settings.expenseCategories.filter((_, i) => i !== index) });
  };

  const updateAdvanceTier = (index: number, value: number) => {
    const newTiers = [...(settings.advanceTiers || [30, 50, 100])];
    newTiers[index] = value;
    onUpdateSettings({ ...settings, advanceTiers: newTiers });
  };

  const addAdvanceTier = () => {
    onUpdateSettings({ ...settings, advanceTiers: [...(settings.advanceTiers || [30, 50, 100]), 0] });
  };

  const removeAdvanceTier = (index: number) => {
    onUpdateSettings({ ...settings, advanceTiers: (settings.advanceTiers || [30, 50, 100]).filter((_, i) => i !== index) });
  };

  const addAdvertisement = () => {
    const newAd: AdvertisementItem = {
      id: `ad-${Date.now()}`,
      badgeText: 'NEW PROMOTIONAL OFFER',
      title: 'Special Promotional Headline Here',
      description: 'Exclusive promotional campaign details displayed on the sliding storefront banner ribbon.',
      buttonText: 'Explore Now',
      isActive: true,
      bgGradient: 'from-amber-500 via-orange-600 to-purple-700'
    };
    const currentAds = settings.storefront?.advertisements || [];
    onUpdateSettings({
      ...settings,
      storefront: {
        ...settings.storefront,
        advertisements: [...currentAds, newAd]
      }
    });
  };

  const updateAdvertisement = (index: number, field: keyof AdvertisementItem, value: any) => {
    const currentAds = [...(settings.storefront?.advertisements || [])];
    currentAds[index] = { ...currentAds[index], [field]: value };
    onUpdateSettings({
      ...settings,
      storefront: {
        ...settings.storefront,
        advertisements: currentAds
      }
    });
  };

  const removeAdvertisement = (index: number) => {
    const currentAds = (settings.storefront?.advertisements || []).filter((_, i) => i !== index);
    onUpdateSettings({
      ...settings,
      storefront: {
        ...settings.storefront,
        advertisements: currentAds
      }
    });
  };

  return (
    <div className="flex-1 bg-gray-50 p-4 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Business Settings</h1>
            <p className="text-xs text-gray-500">Manage your company profile, contact info, and bank details</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleBulkExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg font-bold text-xs hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
              ) : (
                <Archive size={16} />
              )}
              {isExporting ? 'Exporting...' : 'Bulk Export (ZIP)'}
            </button>
            <button 
              onClick={handleSaveSettings}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold text-xs hover:bg-primary/90 transition-all shadow-sm"
            >
              <Save size={16} />
              Save All Changes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Profile */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-primary font-bold border-b border-gray-100 pb-3">
              <Building2 size={18} />
              <h3>Company Profile</h3>
            </div>
            
            <div className="space-y-4">
              {/* Enhanced Logo Upload Section */}
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon size={12} /> Company Logo & Branding Asset
                  </label>
                  {settings.logo && (
                    <button 
                      onClick={() => onUpdateSettings({ ...settings, logo: '' })}
                      className="text-[10px] text-red-600 hover:text-red-700 font-extrabold"
                    >
                      Clear Logo
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* High Resolution Logo Preview Box */}
                  <div className="w-24 h-24 bg-white rounded-2xl border-2 border-dashed border-emerald-200 p-2 flex items-center justify-center overflow-hidden relative group shadow-sm shrink-0">
                    {settings.logo ? (
                      <img 
                        src={settings.logo} 
                        alt="Company Logo Preview" 
                        className="max-w-full max-h-full object-contain transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <ImageIcon className="text-emerald-300 mx-auto mb-1" size={28} />
                        <span className="text-[9px] text-emerald-600 font-bold block">No Logo</span>
                      </div>
                    )}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-emerald-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity"
                    >
                      <Upload size={18} className="mb-0.5" />
                      <span>Upload New</span>
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleLogoUpload} 
                    />
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Upload your corporate emblem or logo file. It will display crisp on both light and dark storefront headers.
                    </p>
                    
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={settings.logo || ''}
                        onChange={e => onUpdateSettings({...settings, logo: e.target.value})}
                        placeholder="Paste image URL or upload image file..."
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm shrink-0"
                      >
                        <Upload size={12} />
                        Browse
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[9px] text-slate-400 font-semibold uppercase">Preview on Dark:</span>
                      <div className="bg-slate-900 px-3 py-1 rounded-lg flex items-center gap-2">
                        {settings.logo ? (
                          <img src={settings.logo} alt="Dark mode preview" className="h-5 w-auto max-w-[80px] object-contain" />
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-serif font-bold">{settings.name || 'Flora & Verdant'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Company Name</label>
                <input 
                  type="text" 
                  value={settings.name}
                  onChange={e => onUpdateSettings({...settings, name: e.target.value})}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Address</label>
                <textarea 
                  value={settings.address}
                  onChange={e => onUpdateSettings({...settings, address: e.target.value})}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-primary h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                    <Mail size={10} /> Email
                  </label>
                  <input 
                    type="email" 
                    value={settings.email}
                    onChange={e => onUpdateSettings({...settings, email: e.target.value})}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                    <Globe size={10} /> Website
                  </label>
                  <input 
                    type="text" 
                    value={settings.website}
                    onChange={e => onUpdateSettings({...settings, website: e.target.value})}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Currency</label>
                  <input 
                    type="text" 
                    value={settings.currency}
                    onChange={e => onUpdateSettings({...settings, currency: e.target.value})}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Tax ID</label>
                  <input 
                    type="text" 
                    value={settings.taxId || ''}
                    onChange={e => onUpdateSettings({...settings, taxId: e.target.value})}
                    placeholder="SV-123..."
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase text-primary">Default Tax (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={settings.defaultTaxRate}
                    onChange={e => onUpdateSettings({...settings, defaultTaxRate: Number(e.target.value)})}
                    className="w-full px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-lg text-xs font-bold text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Numbers */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Phone size={18} />
                <h3>Contact Numbers</h3>
              </div>
              <button 
                onClick={addPhone}
                className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {settings.phones.map((phone, index) => (
                <div key={index} className="flex gap-2 group">
                  <input 
                    type="text" 
                    value={phone}
                    onChange={e => updatePhone(index, e.target.value)}
                    placeholder="Phone number..."
                    className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  />
                  <button 
                    onClick={() => removePhone(index)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {settings.phones.length === 0 && (
                <p className="text-center text-xs text-gray-400 py-4">No phone numbers added</p>
              )}
            </div>
          </div>

          {/* Web Storefront Header & Social Branding Details */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <Store size={18} />
                <h3>Web Storefront Header & Social Branding Settings</h3>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-1 rounded-full border border-emerald-200 uppercase tracking-wider">
                Storefront Navbar Controls
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Call Button & Header Settings */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <PhoneCall size={14} className="text-emerald-600" /> Storefront Call Button Details
                </h4>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Call Button Phone Number / Hotline</label>
                  <input 
                    type="text" 
                    value={settings.storefront?.callButtonNumber ?? settings.phones[0] ?? '+123-456-789'}
                    onChange={e => onUpdateSettings({
                      ...settings,
                      storefront: {
                        ...settings.storefront,
                        callButtonNumber: e.target.value
                      }
                    })}
                    placeholder="+123-456-789"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600 font-bold text-gray-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Call Button Label / Action Text</label>
                  <input 
                    type="text" 
                    value={settings.storefront?.callButtonLabel ?? 'Call Us Now'}
                    onChange={e => onUpdateSettings({
                      ...settings,
                      storefront: {
                        ...settings.storefront,
                        callButtonLabel: e.target.value
                      }
                    })}
                    placeholder="Call Us Now"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600 font-bold text-gray-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Storefront Subtitle / Tagline</label>
                  <input 
                    type="text" 
                    value={settings.storefront?.tagline ?? 'Public E-Commerce Showcase'}
                    onChange={e => onUpdateSettings({
                      ...settings,
                      storefront: {
                        ...settings.storefront,
                        tagline: e.target.value
                      }
                    })}
                    placeholder="Public E-Commerce Showcase"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600 font-medium text-gray-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Top Announcement Banner Text</label>
                  <input 
                    type="text" 
                    value={settings.storefront?.topAnnouncementBar ?? 'Sign up and GET 20% OFF for your first order.'}
                    onChange={e => onUpdateSettings({
                      ...settings,
                      storefront: {
                        ...settings.storefront,
                        topAnnouncementBar: e.target.value
                      }
                    })}
                    placeholder="Sign up and GET 20% OFF..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600 font-medium text-gray-800"
                  />
                </div>
              </div>

              {/* Right Column: Social Media Links */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <Share2 size={14} className="text-emerald-600" /> Social Media Links & Accounts
                </h4>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center justify-between">
                      <span>Facebook URL</span>
                      <span className="text-[9px] text-blue-600 font-semibold">facebook.com/...</span>
                    </label>
                    <input 
                      type="text" 
                      value={settings.storefront?.socialLinks?.facebook ?? ''}
                      onChange={e => onUpdateSettings({
                        ...settings,
                        storefront: {
                          ...settings.storefront,
                          socialLinks: {
                            ...settings.storefront?.socialLinks,
                            facebook: e.target.value
                          }
                        }
                      })}
                      placeholder="https://facebook.com/yourbrand"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center justify-between">
                      <span>Instagram URL</span>
                      <span className="text-[9px] text-pink-600 font-semibold">instagram.com/...</span>
                    </label>
                    <input 
                      type="text" 
                      value={settings.storefront?.socialLinks?.instagram ?? ''}
                      onChange={e => onUpdateSettings({
                        ...settings,
                        storefront: {
                          ...settings.storefront,
                          socialLinks: {
                            ...settings.storefront?.socialLinks,
                            instagram: e.target.value
                          }
                        }
                      })}
                      placeholder="https://instagram.com/yourbrand"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center justify-between">
                      <span>WhatsApp Direct Link / Number</span>
                      <span className="text-[9px] text-emerald-600 font-semibold">wa.me/...</span>
                    </label>
                    <input 
                      type="text" 
                      value={settings.storefront?.socialLinks?.whatsapp ?? ''}
                      onChange={e => onUpdateSettings({
                        ...settings,
                        storefront: {
                          ...settings.storefront,
                          socialLinks: {
                            ...settings.storefront?.socialLinks,
                            whatsapp: e.target.value
                          }
                        }
                      })}
                      placeholder="https://wa.me/123456789"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">LinkedIn URL</label>
                      <input 
                        type="text" 
                        value={settings.storefront?.socialLinks?.linkedin ?? ''}
                        onChange={e => onUpdateSettings({
                          ...settings,
                          storefront: {
                            ...settings.storefront,
                            socialLinks: {
                              ...settings.storefront?.socialLinks,
                              linkedin: e.target.value
                            }
                          }
                        })}
                        placeholder="https://linkedin.com/..."
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Twitter / X URL</label>
                      <input 
                        type="text" 
                        value={settings.storefront?.socialLinks?.twitter ?? ''}
                        onChange={e => onUpdateSettings({
                          ...settings,
                          storefront: {
                            ...settings.storefront,
                            socialLinks: {
                              ...settings.storefront?.socialLinks,
                              twitter: e.target.value
                            }
                          }
                        })}
                        placeholder="https://x.com/..."
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Web Storefront Advertisements & Sliding Banner Manager */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2 text-amber-600 font-bold">
                <Megaphone size={18} />
                <h3>Web Storefront Advertisements & Sliding Banners</h3>
              </div>
              <button 
                onClick={() => {
                  const currentAds = settings.storefront?.advertisements ?? [];
                  const newAd: Advertisement = {
                    id: `ad-${Date.now()}`,
                    badge: 'SPECIAL OFFER',
                    title: 'New Storefront Promotional Announcement',
                    description: 'Highlight new arrivals, festive discount vouchers, or store news to customers here.',
                    buttonText: 'View Special Deals',
                    buttonAction: 'discounted_filter',
                    isActive: true
                  };
                  onUpdateSettings({
                    ...settings,
                    storefront: {
                      ...settings.storefront,
                      advertisements: [...currentAds, newAd]
                    }
                  });
                  addNotification({
                    title: 'Advertisement Added',
                    message: 'New promotional banner created. Edit details below and save.',
                    type: 'success'
                  });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-xl hover:bg-amber-100 transition-all text-xs font-bold shadow-xs"
              >
                <Plus size={15} />
                <span>Add Advertisement</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Create and manage promotional advertisements that appear in the sliding ribbon on the storefront. The ribbon automatically loops through all active advertisements and allows customers to slide manually.
            </p>

            {/* List of Advertisements */}
            <div className="space-y-4">
              {(!settings.storefront?.advertisements || settings.storefront.advertisements.length === 0) ? (
                <div className="p-8 text-center bg-amber-50/50 rounded-2xl border border-dashed border-amber-200 space-y-2">
                  <Megaphone size={28} className="text-amber-400 mx-auto" />
                  <p className="text-xs font-bold text-amber-900">No advertisements configured</p>
                  <p className="text-[11px] text-amber-700">Click &quot;Add Advertisement&quot; above to create your first sliding promotional banner.</p>
                </div>
              ) : (
                settings.storefront.advertisements.map((ad, idx) => (
                  <div key={ad.id || idx} className={`p-4 rounded-2xl border transition-all space-y-3 relative ${ad.isActive !== false ? 'bg-amber-50/30 border-amber-200 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-slate-900 text-amber-300 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Ad #{idx + 1}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ad.isActive !== false ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-600'}`}>
                          {ad.isActive !== false ? 'Active & Displaying' : 'Paused / Hidden'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...(settings.storefront?.advertisements ?? [])];
                            updated[idx] = { ...updated[idx], isActive: !(updated[idx].isActive !== false) };
                            onUpdateSettings({
                              ...settings,
                              storefront: {
                                ...settings.storefront,
                                advertisements: updated
                              }
                            });
                          }}
                          className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                            ad.isActive !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {ad.isActive !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                          <span>{ad.isActive !== false ? 'Active' : 'Hidden'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = (settings.storefront?.advertisements ?? []).filter((_, i) => i !== idx);
                            onUpdateSettings({
                              ...settings,
                              storefront: {
                                ...settings.storefront,
                                advertisements: updated
                              }
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Advertisement"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Badge Label / Tag</label>
                        <input
                          type="text"
                          value={ad.badge || ''}
                          onChange={e => {
                            const updated = [...(settings.storefront?.advertisements ?? [])];
                            updated[idx] = { ...updated[idx], badge: e.target.value };
                            onUpdateSettings({ ...settings, storefront: { ...settings.storefront, advertisements: updated } });
                          }}
                          placeholder="e.g. SPECIAL ADMIN OFFER"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-amber-900 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Banner Headline / Title</label>
                        <input
                          type="text"
                          value={ad.title || ''}
                          onChange={e => {
                            const updated = [...(settings.storefront?.advertisements ?? [])];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            onUpdateSettings({ ...settings, storefront: { ...settings.storefront, advertisements: updated } });
                          }}
                          placeholder="Promotional Price Drops Active — Up to 50% OFF!"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Description Text</label>
                        <input
                          type="text"
                          value={ad.description || ''}
                          onChange={e => {
                            const updated = [...(settings.storefront?.advertisements ?? [])];
                            updated[idx] = { ...updated[idx], description: e.target.value };
                            onUpdateSettings({ ...settings, storefront: { ...settings.storefront, advertisements: updated } });
                          }}
                          placeholder="Describe the promotion or announcement clearly..."
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Button Action Label</label>
                        <input
                          type="text"
                          value={ad.buttonText || ''}
                          onChange={e => {
                            const updated = [...(settings.storefront?.advertisements ?? [])];
                            updated[idx] = { ...updated[idx], buttonText: e.target.value };
                            onUpdateSettings({ ...settings, storefront: { ...settings.storefront, advertisements: updated } });
                          }}
                          placeholder="View Discounted Offers Only"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Button Action Target</label>
                        <select
                          value={ad.buttonAction || 'discounted_filter'}
                          onChange={e => {
                            const updated = [...(settings.storefront?.advertisements ?? [])];
                            updated[idx] = { ...updated[idx], buttonAction: e.target.value };
                            onUpdateSettings({ ...settings, storefront: { ...settings.storefront, advertisements: updated } });
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                        >
                          <option value="discounted_filter">Filter On-Sale / Discounted Products</option>
                          <option value="signup_modal">Open Customer Account Sign-Up</option>
                          <option value="all_catalog">Show Entire Shop Catalog</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bank Details */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Landmark size={18} />
                <h3>Bank Accounts</h3>
              </div>
              <button 
                onClick={addBank}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all text-xs font-bold"
              >
                <Plus size={16} />
                Add Bank
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings.bankDetails.map((bank, index) => (
                <div key={bank.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 relative group">
                  <button 
                    onClick={() => removeBank(index)}
                    className="absolute top-4 right-4 p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Bank Name</label>
                      <input 
                        type="text" 
                        value={bank.bankName}
                        onChange={e => updateBank(index, 'bankName', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Account Holder</label>
                      <input 
                        type="text" 
                        value={bank.accountHolder}
                        onChange={e => updateBank(index, 'accountHolder', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Account Number</label>
                      <input 
                        type="text" 
                        value={bank.accountNumber}
                        onChange={e => updateBank(index, 'accountNumber', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Branch</label>
                      <input 
                        type="text" 
                        value={bank.branch}
                        onChange={e => updateBank(index, 'branch', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {settings.bankDetails.length === 0 && (
                <div className="md:col-span-2 text-center text-xs text-gray-400 py-8 border-2 border-dashed border-gray-100 rounded-2xl">
                  No bank accounts configured
                </div>
              )}
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-primary font-bold">
                <FileText size={18} />
                <h3>Terms & Conditions</h3>
              </div>
              <button 
                type="button"
                onClick={addTerm}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all text-xs font-bold"
              >
                <Plus size={16} />
                Add Term
              </button>
            </div>
            <div className="space-y-3">
              {settings.terms.map((term, index) => (
                <div key={term.id} className="flex gap-2 group">
                  <textarea 
                    value={term.text}
                    onChange={e => updateTerm(index, e.target.value)}
                    placeholder="Enter term or condition..."
                    className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-primary h-12"
                  />
                  <button 
                    type="button"
                    onClick={() => removeTerm(index)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {settings.terms.length === 0 && (
                <div className="text-center text-xs text-gray-400 py-8 border-2 border-dashed border-gray-100 rounded-2xl">
                  No terms or conditions added
                </div>
              )}
            </div>
          </div>

          {/* Advance Payment Tiers */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-primary font-bold">
                <DollarSign size={18} />
                <h3>Advance Payment Tiers (%)</h3>
              </div>
              <button 
                onClick={addAdvanceTier}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all text-xs font-bold"
              >
                <Plus size={16} />
                Add Tier
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {(settings.advanceTiers || [30, 50, 100]).map((tier, index) => (
                <div key={index} className="flex gap-2 group bg-blue-50 p-2 rounded-xl border border-blue-100">
                  <input 
                    type="number" 
                    value={tier}
                    onChange={e => updateAdvanceTier(index, Number(e.target.value))}
                    placeholder="30"
                    className="flex-1 w-full px-2 py-1 bg-white border border-blue-200 rounded text-xs font-bold text-blue-600 focus:outline-none focus:border-blue-400"
                  />
                  <button 
                    onClick={() => removeAdvanceTier(index)}
                    className="p-1 text-blue-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 italic">These percentages will appear as quick selection buttons in the Quotation portal.</p>
          </div>

          {/* Expense Categories */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Tag size={18} />
                <h3>Expense Categories</h3>
              </div>
              <button 
                onClick={addExpenseCategory}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all text-xs font-bold"
              >
                <Plus size={16} />
                Add Category
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {settings.expenseCategories.map((category, index) => (
                <div key={index} className="flex gap-2 group bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <input 
                    type="text" 
                    value={category}
                    onChange={e => updateExpenseCategory(index, e.target.value)}
                    placeholder="Category name..."
                    className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  />
                  <button 
                    onClick={() => removeExpenseCategory(index)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {settings.expenseCategories.length === 0 && (
                <div className="col-span-full text-center text-xs text-gray-400 py-8 border-2 border-dashed border-gray-100 rounded-2xl">
                  No expense categories configured
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
