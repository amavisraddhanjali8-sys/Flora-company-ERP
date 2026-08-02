import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Heart, 
  ShoppingBag, 
  User, 
  Star, 
  Filter, 
  X, 
  Eye, 
  Check, 
  Sparkles, 
  Truck, 
  ShieldCheck, 
  Headphones, 
  ChevronRight, 
  ArrowRight, 
  SlidersHorizontal, 
  Plus, 
  Minus, 
  Flower2, 
  Tag, 
  CheckCircle2, 
  Lock, 
  AlertCircle,
  Clock,
  Send,
  Layers,
  ChevronDown,
  Package,
  ExternalLink,
  ShoppingCart,
  Boxes,
  FileText,
  LayoutDashboard,
  ShieldAlert,
  LogOut,
  AlertTriangle,
  PhoneCall,
  Phone,
  Menu,
  Share2,
  Facebook,
  Instagram,
  MessageCircle,
  Linkedin,
  Twitter,
  Youtube
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FinishedProduct, UserProfile, Order, CompanySettings } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';
import { useNotifications } from '../../context/NotificationContext';

interface ShopStorefrontProps {
  products: FinishedProduct[];
  currentUser: UserProfile;
  companySettings?: CompanySettings;
  onOpenAuthScreen: (mode?: 'login' | 'signup') => void;
  onPlaceCustomerOrder: (orderData: Partial<Order>, cartItems: any[]) => void;
  onNavigateToERP?: (tab?: string) => void;
  onLogout?: () => void;
}

export interface StorefrontCartItem {
  product: FinishedProduct;
  quantity: number;
  selectedColor?: string;
  customNotes?: string;
}

export default function ShopStorefront({
  products,
  currentUser,
  companySettings,
  onOpenAuthScreen,
  onPlaceCustomerOrder,
  onNavigateToERP,
  onLogout
}: ShopStorefrontProps) {
  const { addNotification } = useNotifications();

  // Active filters state
  const [selectedFlowerType, setSelectedFlowerType] = useState<string | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<number>(150000); // LKR / USD max
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [onlyDiscountsFilter, setOnlyDiscountsFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('default');

  // E-commerce interactivity state
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<StorefrontCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [quickViewProduct, setQuickViewProduct] = useState<FinishedProduct | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [quickViewQty, setQuickViewQty] = useState<number>(1);
  const [newsletterEmail, setNewsletterEmail] = useState<string>('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState<boolean>(false);

  // Helper function to handle ERP navigation with smooth toggle notifications
  const handleERPNavigation = (targetTab?: string) => {
    if (isGuestUser || currentUser.role === 'Client' || currentUser.status === 'Pending Approval') {
      addNotification({
        title: 'ERP Back-Office Portal',
        message: 'The internal ERP system is restricted to authorized staff. Please sign in with staff credentials.',
        type: 'info',
        category: 'system'
      });
      onOpenAuthScreen('login');
      return;
    }

    if (onNavigateToERP) {
      onNavigateToERP(targetTab);
    }
  };

  // Mobile Navigation & Search States
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);

  // Master Catalog from Product Portal (ERP)
  const fullCatalog: FinishedProduct[] = useMemo(() => {
    return products || [];
  }, [products]);

  // Active Promotional Discounts offered by Admin
  const discountedProducts = useMemo(() => {
    return fullCatalog.filter(p => (p.discountPercent && p.discountPercent > 0) || (p.originalPrice && p.originalPrice > p.price));
  }, [fullCatalog]);

  const maxDiscountPct = useMemo(() => {
    if (discountedProducts.length === 0) return 0;
    return Math.max(...discountedProducts.map(p => p.discountPercent || (p.originalPrice ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0)));
  }, [discountedProducts]);

  // Active Storefront Advertisements configured by Admin in Settings
  const activeAds = useMemo(() => {
    const configured = companySettings?.storefront?.advertisements?.filter(ad => ad.isActive !== false) || [];
    if (configured.length > 0) {
      return configured;
    }
    // Default fallback advertisement if none configured yet
    return [
      {
        id: 'default-ad-1',
        badge: 'SPECIAL ADMIN OFFER',
        title: `Promotional Price Drops Active — Up to ${maxDiscountPct || 50}% OFF!`,
        description: `The Admin team has offered exclusive promotional discounts on ${discountedProducts.length || 8} selected bouquet & floral items. Reduced prices clearly displayed on product tiles with instant savings.`,
        buttonText: 'View Discounted Offers Only',
        buttonAction: 'discounted_filter',
        isActive: true
      }
    ];
  }, [companySettings?.storefront?.advertisements, maxDiscountPct, discountedProducts.length]);

  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  // Keep index in bounds when activeAds array changes
  useEffect(() => {
    if (currentAdIndex >= activeAds.length) {
      setCurrentAdIndex(0);
    }
  }, [activeAds.length, currentAdIndex]);

  // Automatic sliding loop every 5 seconds
  useEffect(() => {
    if (activeAds.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentAdIndex(prev => (prev + 1) % activeAds.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeAds.length]);

  const handlePrevAd = () => {
    setCurrentAdIndex(prev => (prev === 0 ? activeAds.length - 1 : prev - 1));
  };

  const handleNextAd = () => {
    setCurrentAdIndex(prev => (prev + 1) % activeAds.length);
  };

  const handleAdButtonClick = (action?: string) => {
    if (action === 'discounted_filter') {
      setOnlyDiscountsFilter(!onlyDiscountsFilter);
    } else if (action === 'signup_modal' || action === 'signup') {
      onOpenAuthScreen('signup');
    } else if (action === 'all_catalog' || action === 'all') {
      setOnlyDiscountsFilter(false);
      setSelectedFlowerType(null);
      setSelectedOccasion(null);
    } else {
      setOnlyDiscountsFilter(!onlyDiscountsFilter);
    }
  };

  // Filter Logic
  const filteredProducts = useMemo(() => {
    return fullCatalog.filter(p => {
      // Promotional Discounts filter
      if (onlyDiscountsFilter) {
        const hasDiscount = (p.discountPercent && p.discountPercent > 0) || (p.originalPrice && p.originalPrice > p.price);
        if (!hasDiscount) return false;
      }

      // Enhanced Search query filter across all keywords & attributes
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchCat = p.category.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q) || false;
        const matchFlower = p.flowerType?.toLowerCase().includes(q) || false;
        const matchOccasion = p.occasion?.toLowerCase().includes(q) || false;
        const matchColor = p.color?.toLowerCase().includes(q) || false;
        const matchRecipient = p.recipient?.toLowerCase().includes(q) || false;
        const matchCare = p.careGuide?.toLowerCase().includes(q) || false;
        const matchKeywords = (p.keywords || []).some(kw => kw.toLowerCase().includes(q));

        if (!matchName && !matchCat && !matchDesc && !matchFlower && !matchOccasion && !matchColor && !matchRecipient && !matchCare && !matchKeywords) {
          return false;
        }
      }

      // Flower Type
      if (selectedFlowerType) {
        if (p.flowerType !== selectedFlowerType && !p.category.toLowerCase().includes(selectedFlowerType.toLowerCase())) {
          return false;
        }
      }

      // Occasion
      if (selectedOccasion) {
        if (p.occasion !== selectedOccasion) return false;
      }

      // Color
      if (selectedColor) {
        if (p.color !== selectedColor && !p.name.toLowerCase().includes(selectedColor.toLowerCase())) {
          return false;
        }
      }

      // Recipient
      if (selectedRecipient) {
        if (p.recipient !== selectedRecipient) return false;
      }

      // Price Range
      if (p.price > priceRange) return false;

      // Rating
      if (minRating > 0 && (p.rating || 4.5) < minRating) return false;

      // Availability
      if (inStockOnly && p.stock <= 0) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0; // Default
    });
  }, [fullCatalog, searchQuery, selectedFlowerType, selectedOccasion, selectedColor, selectedRecipient, priceRange, minRating, inStockOnly, onlyDiscountsFilter, sortBy]);

  // Wishlist toggle
  const toggleWishlist = (id: string, name?: string) => {
    setWishlist(prev => {
      const isAlready = prev.includes(id);
      addNotification({
        title: 'Wishlist',
        message: isAlready ? 'Removed item from favorites.' : 'Saved item to favorites.',
        type: 'info'
      });
      return isAlready ? prev.filter(item => item !== id) : [...prev, id];
    });
  };

  // Customer Authentication & Status Helpers
  const isGuestUser = !currentUser || !currentUser.id || currentUser.id === 'guest' || (currentUser.email && currentUser.email.includes('guest'));
  const isPendingApproval = currentUser && currentUser.status === 'Pending Approval';
  const isAuthenticatedCustomer = currentUser && !isGuestUser && currentUser.status === 'Active';

  const handleHeaderCartClick = () => {
    setIsCartOpen(true);
  };

  // Add to cart
  const addToCart = (product: FinishedProduct, qty: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + qty } 
            : item
        );
      }
      return [...prev, { product, quantity: qty }];
    });

    addNotification({
      title: 'Added to Cart',
      message: `${product.name} (${qty}x) added to your cart.`,
      type: 'info',
      category: 'sales'
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as StorefrontCartItem[]);
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const freeShippingThreshold = 15000; // LKR ~ $50
  const isFreeShipping = cartSubtotal >= freeShippingThreshold;
  const shippingCost = isFreeShipping ? 0 : (cart.length > 0 ? 1200 : 0);
  const cartTotal = cartSubtotal + shippingCost;

  // Handle Order Request Submission
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is logged in
    const isGuest = currentUser.role === 'Client' && currentUser.email.includes('guest');
    
    // Crucial requirement: Account creation is instant and doesn't require admin approval, but user should be authenticated!
    if (!currentUser.id || isGuest) {
      // Prompt user to login or sign up instantly
      onOpenAuthScreen('signup');
      return;
    }

    // Process customer order request
    const orderData: Partial<Order> = {
      orderNumber: `SO-WEB-${Math.floor(100000 + Math.random() * 900000)}`,
      clientId: currentUser.id,
      clientName: currentUser.name,
      status: 'Pending',
      type: 'Direct',
      date: new Date().toISOString(),
      total: cartTotal,
      subtotal: cartSubtotal,
      advancePayment: 0,
      balance: cartTotal,
      paymentMethod: 'Credit Card / Online',
      items: cart.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        quantity: i.quantity,
        unitPrice: i.product.price,
        total: i.product.price * i.quantity
      }))
    };

    onPlaceCustomerOrder(orderData, cart);

    addNotification({
      title: 'Order Placed',
      message: `Order #${orderData.orderNumber} successfully submitted! Thank you.`,
      type: 'info',
      category: 'sales'
    });

    setCart([]);
    setIsCheckoutModalOpen(false);
    setIsCartOpen(false);
  };

  const clearAllFilters = () => {
    setSelectedFlowerType(null);
    setSelectedOccasion(null);
    setSelectedColor(null);
    setSelectedRecipient(null);
    setPriceRange(150000);
    setMinRating(0);
    setInStockOnly(false);
    setOnlyDiscountsFilter(false);
    setSearchQuery('');
  };

  const activeFilterCount = [
    selectedFlowerType,
    selectedOccasion,
    selectedColor,
    selectedRecipient,
    minRating > 0,
    inStockOnly,
    onlyDiscountsFilter,
    searchQuery !== ''
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50/40 to-pink-50 flex flex-col font-sans text-slate-800">
      
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-[11px] py-1.5 px-3 sm:px-6 flex flex-wrap items-center justify-between gap-2 border-b border-indigo-900/50">
        <div className="flex items-center gap-3">
          <a 
            href={`tel:${companySettings?.storefront?.callButtonNumber || companySettings?.phones?.[0] || '+123-456-789'}`}
            className="font-bold text-sky-200 hover:text-white transition-colors flex items-center gap-1.5 text-[10px] sm:text-[11px]"
          >
            <Phone size={12} className="text-sky-400 shrink-0" />
            <span className="truncate">Hotline: {companySettings?.storefront?.callButtonNumber || companySettings?.phones?.[0] || '+123-456-789'}</span>
          </a>
          <span className="hidden md:inline text-indigo-700">•</span>
          <span className="hidden md:inline font-bold text-pink-300 truncate max-w-xs xl:max-w-none">
            {companySettings?.storefront?.topAnnouncementBar || 'Sign up and GET 20% OFF for your first order.'}
            <button onClick={() => onOpenAuthScreen('signup')} className="underline hover:text-white ml-1.5 font-extrabold cursor-pointer">Sign up now</button>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateToERP && (
            <div className="hidden lg:flex items-center gap-2 text-[10px] bg-indigo-900/60 px-2.5 py-0.5 rounded-lg border border-indigo-700/60 font-bold">
              <span className="text-sky-300 uppercase tracking-wider">ERP Portals:</span>
              <button onClick={() => handleERPNavigation('products')} className="text-sky-200 hover:underline flex items-center gap-0.5 cursor-pointer">
                <Package size={10} /> Products
              </button>
              <span className="text-indigo-700">•</span>
              <button onClick={() => handleERPNavigation('inventory')} className="text-sky-200 hover:underline flex items-center gap-0.5 cursor-pointer">
                <Boxes size={10} /> Stock
              </button>
              <span className="text-indigo-700">•</span>
              <button onClick={() => handleERPNavigation('order-management')} className="text-sky-200 hover:underline flex items-center gap-0.5 cursor-pointer">
                <FileText size={10} /> Orders
              </button>
              <span className="text-indigo-700">•</span>
              <button onClick={() => handleERPNavigation('pos')} className="text-pink-300 hover:underline flex items-center gap-0.5 cursor-pointer">
                <ShoppingCart size={10} /> POS
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 border-l border-indigo-800 pl-2.5">
            <button 
              onClick={() => onOpenAuthScreen('login')} 
              className="hover:text-pink-300 transition-colors font-bold flex items-center gap-1.5 text-[10px] sm:text-xs cursor-pointer"
            >
              <User size={12} className="shrink-0" /> 
              {!isGuestUser ? (
                <span className="flex items-center gap-1">
                  <span className="truncate max-w-[80px] sm:max-w-none">Logged in: <strong className="text-pink-300">{currentUser.name}</strong></span>
                  <span className="hidden sm:inline bg-indigo-900 text-sky-200 text-[8px] px-1 py-0.2 rounded font-black uppercase tracking-wider border border-indigo-700">{currentUser.role}</span>
                </span>
              ) : (
                <span>Sign In / Staff Portal</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC WEB STOREFRONT NAVBAR */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs border-b border-sky-100/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Company Logo & Brand Title */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {companySettings?.logo ? (
              <div className="h-10 sm:h-14 max-w-[140px] sm:max-w-[220px] flex items-center justify-center overflow-hidden rounded-xl border border-sky-200/80 p-1 bg-white shadow-2xs">
                <img 
                  src={companySettings.logo} 
                  alt={companySettings.name || 'Company Logo'} 
                  className="max-h-full max-w-full w-auto object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-sky-600 to-pink-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-sky-600/20 shrink-0">
                <Flower2 size={22} />
              </div>
            )}
            
            <div className="flex flex-col">
              <span className="text-base sm:text-2xl lg:text-3xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 bg-clip-text text-transparent block leading-tight font-serif truncate max-w-[130px] sm:max-w-[240px] lg:max-w-none">
                {companySettings?.name || 'Flora & Verdant'}
              </span>
              <span className="text-[9px] sm:text-xs text-sky-700 font-extrabold uppercase tracking-widest hidden xs:block truncate max-w-[130px] sm:max-w-none">
                {companySettings?.storefront?.tagline || 'Public E-Commerce Showcase'}
              </span>
            </div>
          </div>

          {/* Right Action Bar Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Call Icon Button */}
            <a 
              href={`tel:${companySettings?.storefront?.callButtonNumber || companySettings?.phones?.[0] || '+123-456-789'}`}
              className="p-2 sm:p-2.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-pink-500 hover:from-sky-600 hover:to-pink-600 text-white rounded-xl shadow-xs transition-all flex items-center justify-center shrink-0"
              title={`Call Hotline: ${companySettings?.storefront?.callButtonNumber || companySettings?.phones?.[0] || '+123-456-789'}`}
            >
              <PhoneCall size={16} className="sm:w-[18px] sm:h-[18px]" />
            </a>

            {/* Desktop Search Input */}
            <div className="relative hidden md:block w-40 lg:w-60">
              <input
                type="text"
                placeholder="Search flowers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 focus:bg-white border border-sky-200 focus:border-sky-500 rounded-xl text-xs outline-none transition-all shadow-2xs"
              />
              <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Mobile Search Toggle Button */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="p-2 sm:p-2.5 md:hidden rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
              title="Search Catalog"
            >
              <Search size={16} />
            </button>

            {/* Wishlist Button */}
            <button 
              onClick={() => addNotification({ title: 'Wishlist Updated', message: `${wishlist.length} item(s) saved in your favorites.`, type: 'info' })}
              className="relative p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
              title="View Wishlist"
            >
              <Heart size={16} className={cn("sm:w-[18px] sm:h-[18px]", wishlist.length > 0 ? "fill-rose-500 text-rose-500" : "")} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button 
              onClick={handleHeaderCartClick}
              className="relative p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-pink-600 hover:from-sky-700 hover:to-pink-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Shopping Cart"
            >
              <ShoppingBag size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden lg:inline font-bold text-xs">{formatCurrency(cartSubtotal)}</span>
              {cart.length > 0 && (
                <span className="bg-white text-pink-600 text-[9px] font-black w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-2xs">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>

            {/* User Profile / Auth Button */}
            {!isGuestUser ? (
              <div className="hidden sm:flex items-center gap-1.5 bg-sky-50/80 border border-sky-200/80 p-1 pl-2 pr-1.5 rounded-xl">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-500 to-pink-500 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-black text-slate-900 leading-tight truncate max-w-[90px]">{currentUser.name}</div>
                  <div className="text-[8px] text-sky-700 font-extrabold uppercase">{currentUser.role}</div>
                </div>
                {onLogout && (
                  <button 
                    onClick={onLogout}
                    className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg transition-all cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut size={13} />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => onOpenAuthScreen('login')}
                className="hidden sm:flex px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-100 text-slate-800 items-center gap-1 cursor-pointer"
              >
                <User size={13} className="text-sky-600" />
                <span>Sign In</span>
              </button>
            )}

            {/* ERP Back-Office Button */}
            {onNavigateToERP && (
              <button
                onClick={() => handleERPNavigation()}
                className={cn(
                  "hidden sm:flex px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all items-center gap-1 border shrink-0 cursor-pointer",
                  !isGuestUser && currentUser.role !== 'Client' && currentUser.status === 'Active'
                    ? "bg-slate-900 hover:bg-black text-white border-slate-800"
                    : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300/80"
                )}
                title="Switch to Internal ERP System"
              >
                {!isGuestUser && currentUser.role !== 'Client' && currentUser.status === 'Active' ? (
                  <Lock size={12} className="text-emerald-400" />
                ) : (
                  <ShieldAlert size={12} className="text-amber-600" />
                )}
                <span>ERP</span>
              </button>
            )}

            {/* Mobile Storefront Navigation Drawer Menu Trigger */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        {/* Collapsible Mobile Search Input Bar */}
        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-100 bg-slate-50 p-3 px-4"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search flowers, bouquets, preserved moss..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-sky-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  autoFocus
                />
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Slide-out Mobile Storefront Drawer Navigation */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative ml-auto w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-pink-400 rounded-lg flex items-center justify-center text-slate-900 font-bold">
                    <Flower2 size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-sm">{companySettings?.name || 'Flora & Verdant'}</div>
                    <div className="text-[10px] text-sky-300 font-semibold uppercase tracking-wider">E-Commerce Navigation</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Account Quick Status */}
              <div className="p-3.5 bg-sky-50/60 border-b border-sky-100 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-pink-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'G'}
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-xs text-slate-800 truncate">{currentUser.name || 'Guest Customer'}</div>
                    <div className="text-[10px] text-slate-500 truncate">{currentUser.email || 'Browse & Shop Catalog'}</div>
                  </div>
                </div>
                {!isGuestUser ? (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold rounded border border-emerald-200">Active</span>
                ) : (
                  <button
                    onClick={() => { setIsMobileNavOpen(false); onOpenAuthScreen('login'); }}
                    className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-bold shadow-2xs"
                  >
                    Sign In
                  </button>
                )}
              </div>

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Search Bar inside Drawer */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search catalog items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs outline-none focus:border-sky-500"
                  />
                  <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                </div>

                {/* Categories Navigation */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1">Shop Categories</div>
                  <button
                    onClick={() => { setSelectedFlowerType(null); setIsMobileNavOpen(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between",
                      !selectedFlowerType ? "bg-sky-50 text-sky-800 font-extrabold border border-sky-200" : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <span>All Products</span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border text-slate-500">{fullCatalog.length}</span>
                  </button>
                  {['Rose', 'Lily', 'Orchid', 'Tulip', 'Carnation', 'SunFlower', 'Hydrangea', 'Preserved Moss'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedFlowerType(cat); setIsMobileNavOpen(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between",
                        selectedFlowerType === cat ? "bg-sky-50 text-sky-800 font-extrabold border border-sky-200" : "text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <span>{cat}</span>
                      <ChevronRight size={14} className="text-slate-400" />
                    </button>
                  ))}
                </div>

                {/* Special Promos Link */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <button
                    onClick={() => { setOnlyDiscountsFilter(true); setIsMobileNavOpen(false); }}
                    className="w-full p-3 bg-gradient-to-r from-pink-500 to-sky-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-between shadow-xs"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={16} />
                      <span>Special Discounts ({discountedProducts.length})</span>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/80 space-y-2">
                {onNavigateToERP && (
                  <button
                    onClick={() => { setIsMobileNavOpen(false); handleERPNavigation(); }}
                    className="w-full py-2.5 px-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Lock size={14} className="text-emerald-400" />
                    <span>Switch to Internal ERP</span>
                  </button>
                )}

                {!isGuestUser && onLogout && (
                  <button
                    onClick={() => { setIsMobileNavOpen(false); onLogout(); }}
                    className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. HERO BANNER HEADER (Lightest light blue to light pink gradient) */}
      <section className="bg-gradient-to-r from-sky-100 via-indigo-50/70 to-pink-100 text-slate-800 py-12 px-4 sm:px-8 relative overflow-hidden border-b border-pink-200/60 shadow-xs">
        <div className="absolute -right-10 -bottom-20 w-96 h-96 bg-pink-300/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-20 w-96 h-96 bg-sky-300/25 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-3.5 max-w-xl text-center md:text-left">
            <h1 className="text-3xl sm:text-5xl font-black font-serif tracking-tight leading-tight text-slate-900">
              Special Smells, <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">Special Bouquets</span>
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
              Explore our fresh floral bouquets, preserved moss wall art, and living plant creations. Place instant custom orders online with real-time stock sync.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3 justify-center md:justify-start text-xs font-bold">
              <span className="flex items-center gap-1.5 bg-white/90 backdrop-blur px-3.5 py-2 rounded-xl border border-sky-200 shadow-xs text-slate-700">
                <Truck size={15} className="text-sky-500" /> Same-Day Delivery
              </span>
              <span className="flex items-center gap-1.5 bg-white/90 backdrop-blur px-3.5 py-2 rounded-xl border border-pink-200 shadow-xs text-slate-700">
                <ShieldCheck size={15} className="text-pink-500" /> 100% Freshness Guarantee
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3.1. ADMIN STOREFRONT ADVERTISEMENTS SLIDING RIBBON (Lightest Blue & Pink Ribbon) */}
      {activeAds.length > 0 && (() => {
        const currentAd = activeAds[currentAdIndex] || activeAds[0];
        return (
          <section className="bg-gradient-to-r from-sky-200/90 via-indigo-100 to-pink-200/90 text-slate-900 py-3.5 px-4 sm:px-8 shadow-inner border-y border-pink-300/50 relative overflow-hidden">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
              
              {/* Manual Navigation: Previous Slide Button */}
              {activeAds.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrevAd}
                  className="w-8 h-8 bg-white/80 hover:bg-white text-slate-800 rounded-full flex items-center justify-center transition-all shrink-0 border border-sky-300/60 shadow-xs text-sm font-bold cursor-pointer"
                  title="Previous Advertisement"
                >
                  &larr;
                </button>
              )}

              {/* Sliding Content Container */}
              <div className="flex-1 overflow-hidden relative min-h-[52px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentAd.id || currentAdIndex}
                    initial={{ opacity: 0, x: 25 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -25 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="w-full flex flex-col md:flex-row items-center justify-between gap-4 py-1"
                  >
                    <div className="space-y-1 text-center md:text-left flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap justify-center md:justify-start">
                        {currentAd.badge && (
                          <span className="bg-white/90 text-sky-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-sky-300 shadow-xs">
                            {currentAd.badge}
                          </span>
                        )}
                        <h2 className="text-sm sm:text-base font-extrabold font-serif text-slate-900">
                          {currentAd.title}
                        </h2>
                      </div>
                      {currentAd.description && (
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">
                          {currentAd.description}
                        </p>
                      )}
                    </div>

                    {/* Action Button (Icon-Free as requested) */}
                    {currentAd.buttonText && (
                      <button
                        type="button"
                        onClick={() => handleAdButtonClick(currentAd.buttonAction)}
                        className={cn(
                          "px-5 py-2.5 rounded-2xl font-black text-xs transition-all shrink-0 shadow-sm cursor-pointer",
                          onlyDiscountsFilter && currentAd.buttonAction === 'discounted_filter'
                            ? "bg-slate-900 text-white hover:bg-black shadow-md"
                            : "bg-gradient-to-r from-sky-600 via-indigo-600 to-pink-600 hover:from-sky-700 hover:to-pink-700 text-white shadow-md shadow-sky-500/20"
                        )}
                      >
                        <span>
                          {onlyDiscountsFilter && currentAd.buttonAction === 'discounted_filter'
                            ? `Showing Discounted Items (${discountedProducts.length}) — View All Products`
                            : currentAd.buttonText}
                        </span>
                      </button>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Manual Navigation: Next Slide Button */}
              {activeAds.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextAd}
                  className="w-8 h-8 bg-white/80 hover:bg-white text-slate-800 rounded-full flex items-center justify-center transition-all shrink-0 border border-sky-300/60 shadow-xs text-sm font-bold cursor-pointer"
                  title="Next Advertisement"
                >
                  &rarr;
                </button>
              )}
            </div>

            {/* Pagination / Slide Indicator Dots for Multiple Ads */}
            {activeAds.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                {activeAds.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentAdIndex(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all cursor-pointer",
                      i === currentAdIndex ? "w-6 bg-slate-900" : "w-1.5 bg-slate-400 hover:bg-slate-700"
                    )}
                    title={`Slide to advertisement ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })()}

      {/* BREADCRUMB & SORT BAR */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Home</span>
            <ChevronRight size={12} />
            <span className="font-bold text-slate-900">Shop Catalog</span>
            {selectedFlowerType && (
              <>
                <ChevronRight size={12} />
                <span className="text-emerald-700 font-bold">{selectedFlowerType}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
            
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700"
            >
              <SlidersHorizontal size={14} />
              <span>Filters ({activeFilterCount})</span>
            </button>

            <span className="text-slate-500 font-medium hidden sm:inline">
              Showing <strong>{filteredProducts.length}</strong> of {fullCatalog.length} products
            </span>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 text-xs outline-none focus:border-emerald-600"
              >
                <option value="default">Default Sorting</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Customer Rated</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MAIN STOREFRONT CONTENT LAYOUT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full flex gap-8">

        {/* LEFT FILTER SIDEBAR (DESKTOP) */}
        <aside className="w-64 shrink-0 hidden lg:block space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-6 sticky top-24">
            
            {/* Header & Clear Button */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 font-extrabold text-sm text-slate-900">
                <SlidersHorizontal size={16} className="text-sky-600" />
                <span>Filter Options</span>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] font-bold text-pink-600 hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-2">
                {selectedFlowerType && (
                  <span className="px-2 py-1 bg-sky-100 text-sky-900 text-[10px] font-bold rounded-lg flex items-center gap-1 border border-sky-200">
                    {selectedFlowerType} <X size={10} className="cursor-pointer" onClick={() => setSelectedFlowerType(null)} />
                  </span>
                )}
                {selectedOccasion && (
                  <span className="px-2 py-1 bg-pink-100 text-pink-900 text-[10px] font-bold rounded-lg flex items-center gap-1 border border-pink-200">
                    {selectedOccasion} <X size={10} className="cursor-pointer" onClick={() => setSelectedOccasion(null)} />
                  </span>
                )}
                {selectedColor && (
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-900 text-[10px] font-bold rounded-lg flex items-center gap-1 border border-indigo-200">
                    Color: {selectedColor} <X size={10} className="cursor-pointer" onClick={() => setSelectedColor(null)} />
                  </span>
                )}
              </div>
            )}

            {/* By Flower / Plant Type */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">By Flower Type</h4>
              <div className="space-y-1">
                {['Roses', 'Tulips', 'Lilies', 'Orchids', 'Daisies', 'Sunflowers', 'Preserved Moss', 'Living Wall'].map(type => (
                  <label 
                    key={type}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all hover:bg-slate-50",
                      selectedFlowerType === type ? "bg-sky-50 text-sky-900 font-bold border-l-2 border-sky-500" : "text-slate-600"
                    )}
                  >
                    <input
                      type="radio"
                      name="flowerType"
                      checked={selectedFlowerType === type}
                      onChange={() => setSelectedFlowerType(selectedFlowerType === type ? null : type)}
                      className="accent-sky-600"
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* By Occasion */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">By Occasion</h4>
              <div className="space-y-1">
                {['Weddings', 'Birthday', 'Anniversary', 'Thank You', 'Graduation', 'Get Well Soon'].map(occ => (
                  <label 
                    key={occ}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all hover:bg-slate-50",
                      selectedOccasion === occ ? "bg-pink-50 text-pink-900 font-bold border-l-2 border-pink-500" : "text-slate-600"
                    )}
                  >
                    <input
                      type="radio"
                      name="occasion"
                      checked={selectedOccasion === occ}
                      onChange={() => setSelectedOccasion(selectedOccasion === occ ? null : occ)}
                      className="accent-pink-600"
                    />
                    <span>{occ}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Filter Slider */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Max Price</h4>
                <span className="text-xs font-bold text-sky-600">{formatCurrency(priceRange)}</span>
              </div>
              <input
                type="range"
                min="5000"
                max="150000"
                step="5000"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-sky-600"
              />
            </div>

            {/* By Rating */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Customer Review</h4>
              <div className="space-y-1">
                {[5, 4, 3].map(stars => (
                  <button
                    key={stars}
                    onClick={() => setMinRating(minRating === stars ? 0 : stars)}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-1.5 rounded-xl text-xs font-medium transition-all",
                      minRating === stars ? "bg-amber-50 text-amber-900 font-bold border border-amber-200" : "hover:bg-slate-50 text-slate-600"
                    )}
                  >
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: stars }).map((_, i) => (
                        <Star key={i} size={12} className="fill-amber-400" />
                      ))}
                      <span className="text-slate-700 font-bold text-[11px] ml-1">& Up</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* By Color */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">By Color</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Red', colorBg: 'bg-red-500' },
                  { label: 'Pink', colorBg: 'bg-pink-400' },
                  { label: 'White', colorBg: 'bg-white border border-slate-300' },
                  { label: 'Yellow', colorBg: 'bg-yellow-400' },
                  { label: 'Purple', colorBg: 'bg-purple-500' },
                  { label: 'Mixed', colorBg: 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500' }
                ].map(c => (
                  <button
                    key={c.label}
                    onClick={() => setSelectedColor(selectedColor === c.label ? null : c.label)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all",
                      selectedColor === c.label ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <span className={cn("w-2.5 h-2.5 rounded-full inline-block", c.colorBg)} />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded accent-emerald-700"
                />
                <span>In Stock Only</span>
              </label>
            </div>

          </div>
        </aside>

        {/* RIGHT PRODUCT SHOWCASE GRID */}
        <main className="flex-1 min-w-0 space-y-6">

          {/* Empty State */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl mx-auto flex items-center justify-center">
                <Flower2 size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-slate-900">No Floral Products Found</h3>
                <p className="text-xs text-slate-500">Try adjusting your category filter, price slider, or search term.</p>
              </div>
              <button
                onClick={clearAllFilters}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold shadow-md transition-all"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {filteredProducts.map(product => {
                const isWishlisted = wishlist.includes(product.id);
                const discount = product.discountPercent || (product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : null);

                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group relative"
                  >
                    
                    {/* Image Container */}
                    <div className="relative aspect-square overflow-hidden bg-slate-100">
                      <img
                        src={product.image || 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&q=80&w=600'}
                        alt={product.name}
                        className={cn(
                          "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
                          product.stock <= 0 && "grayscale-[30%] opacity-90"
                        )}
                        loading="lazy"
                      />

                      {/* Out of Stock Overlay Banner */}
                      {product.stock <= 0 && (
                        <div className="absolute top-3 left-3 bg-rose-600 text-white font-black text-[10px] px-2.5 py-1 rounded-xl shadow-lg uppercase tracking-wider flex items-center gap-1 border border-white/20 z-10">
                          <AlertTriangle size={11} />
                          <span>OUT OF STOCK</span>
                        </div>
                      )}

                      {/* Discount Badge */}
                      {product.stock > 0 && discount && discount > 0 && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-700 to-pink-600 text-white font-black text-[10px] px-2.5 py-1 rounded-xl shadow-lg uppercase tracking-wider flex items-center gap-1 border border-white/20">
                          <Sparkles size={11} />
                          <span>{discount}% OFF OFFER</span>
                        </div>
                      )}

                      {/* Floating Action Icons */}
                      <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity z-10">
                        <button
                          onClick={() => toggleWishlist(product.id)}
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center backdrop-blur shadow-md transition-all",
                            isWishlisted ? "bg-rose-500 text-white" : "bg-white/90 text-slate-700 hover:bg-white"
                          )}
                          title="Save to Wishlist"
                        >
                          <Heart size={14} className={isWishlisted ? "fill-white" : ""} />
                        </button>

                        <button
                          onClick={() => {
                            setQuickViewProduct(product);
                            setQuickViewQty(1);
                          }}
                          className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center backdrop-blur shadow-md transition-all"
                          title="Quick View"
                        >
                          <Eye size={14} />
                        </button>
                      </div>

                      {/* Category & Stock Tag */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-1 z-10">
                        <div className="bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg backdrop-blur">
                          {product.category}
                        </div>
                        <div className={cn(
                          "text-[10px] font-extrabold px-2 py-0.5 rounded-lg backdrop-blur border shadow-sm",
                          product.stock > product.minStock 
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40" 
                            : product.stock > 0 
                            ? "bg-amber-950/80 text-amber-300 border-amber-500/40" 
                            : "bg-rose-950/90 text-rose-200 border-rose-500/60 font-black"
                        )}>
                          {product.stock > 0 ? `ERP Stock: ${product.stock}` : 'OUT OF STOCK (0)'}
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      
                      <div className="space-y-1">
                        {/* Rating & ERP Portal Link */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                            <Star size={13} className="fill-amber-400" />
                            <span>{product.rating || 4.9}</span>
                            <span className="text-slate-400 text-[10px]">({product.reviewCount || 24})</span>
                          </div>

                          {onNavigateToERP && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToERP('products');
                              }}
                              className="text-[10px] font-bold text-slate-500 hover:text-emerald-700 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded-md hover:bg-slate-100"
                              title="Link to ERP Product Catalog Portal"
                            >
                              <Package size={11} />
                              <span>ERP Portal</span>
                            </button>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-extrabold text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-sky-700 transition-colors">
                          {product.name}
                        </h3>
                      </div>

                      {/* Price & Action */}
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div>
                            <div className="flex items-baseline gap-1.5">
                              <span className={cn(
                                "text-base font-black",
                                discount && discount > 0 ? "text-pink-600 font-extrabold" : "text-slate-900"
                              )}>
                                {formatCurrency(product.price)}
                              </span>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <span className="text-xs text-slate-400 line-through font-bold">
                                  {formatCurrency(product.originalPrice)}
                                </span>
                              )}
                            </div>
                            
                            {discount && discount > 0 && product.originalPrice && (
                              <div className="text-[10px] font-extrabold text-pink-700 bg-pink-50 px-1.5 py-0.5 rounded-md border border-pink-200/60 inline-block mt-0.5">
                                Save {formatCurrency(product.originalPrice - product.price)}
                              </div>
                            )}
                          </div>

                          {product.stock > 0 ? (
                            <button
                              onClick={() => addToCart(product)}
                              className="px-3.5 py-2 bg-gradient-to-r from-sky-600 via-indigo-600 to-pink-600 hover:from-sky-700 hover:to-pink-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-sky-500/20 transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
                            >
                              <ShoppingBag size={14} />
                              <span>Add to Cart</span>
                            </button>
                          ) : (
                            <button
                              disabled
                              className="px-3.5 py-2 bg-rose-100 text-rose-700 font-extrabold text-xs rounded-2xl border border-rose-200 opacity-90 cursor-not-allowed flex items-center gap-1.5 shrink-0"
                            >
                              <AlertTriangle size={13} />
                              <span>Out of Stock</span>
                            </button>
                          )}
                        </div>
                      </div>

                    </div>

                  </motion.div>
                );
              })}
            </div>
          )}

        </main>
      </div>

      {/* 5. SHOPPING CART DRAWER */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50" onClick={() => setIsCartOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-700 text-white rounded-xl flex items-center justify-center font-bold">
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Your Floral Cart</h3>
                    <p className="text-[10px] text-slate-500">{cart.length} unique item(s)</p>
                  </div>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl text-slate-500">
                  <X size={18} />
                </button>
              </div>

              {/* Free Shipping Progress Indicator */}
              <div className="bg-purple-50 p-3 border-b border-purple-100 space-y-1 text-xs text-purple-900">
                <div className="flex justify-between font-bold">
                  <span>{isFreeShipping ? '🎉 You unlocked FREE Shipping!' : `Add ${formatCurrency(freeShippingThreshold - cartSubtotal)} more for FREE Shipping!`}</span>
                  <span>{Math.min(100, Math.round((cartSubtotal / freeShippingThreshold) * 100))}%</span>
                </div>
                <div className="w-full h-1.5 bg-purple-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-700 transition-all duration-300" 
                    style={{ width: `${Math.min(100, (cartSubtotal / freeShippingThreshold) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-3">
                    <ShoppingBag size={48} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold">Your cart is currently empty.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.product.id} className="flex gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                      <img 
                        src={item.product.image} 
                        alt={item.product.name}
                        className="w-16 h-16 rounded-xl object-cover shrink-0" 
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="font-bold text-xs text-slate-900 truncate">{item.product.name}</div>
                        <div className="text-xs font-extrabold text-emerald-800">{formatCurrency(item.product.price)}</div>
                        <div className="flex items-center gap-2 pt-1">
                          <button onClick={() => updateCartQty(item.product.id, -1)} className="w-5 h-5 bg-white border border-slate-300 rounded-md flex items-center justify-center text-slate-600">
                            <Minus size={10} />
                          </button>
                          <span className="text-xs font-bold text-slate-900">{item.quantity}</span>
                          <button onClick={() => updateCartQty(item.product.id, 1)} className="w-5 h-5 bg-white border border-slate-300 rounded-md flex items-center justify-center text-slate-600">
                            <Plus size={10} />
                          </button>
                        </div>
                      </div>
                      <button onClick={() => updateCartQty(item.product.id, -item.quantity)} className="text-rose-500 hover:text-rose-700 p-1">
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer */}
              {cart.length > 0 && (
                <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-bold text-slate-900">{formatCurrency(cartSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Estimated Shipping</span>
                      <span className="font-bold text-slate-900">{isFreeShipping ? 'FREE' : formatCurrency(shippingCost)}</span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total Amount</span>
                      <span className="text-emerald-800">{formatCurrency(cartTotal)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutModalOpen(true);
                    }}
                    className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-extrabold text-xs shadow-lg shadow-emerald-700/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Order Checkout</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 6. PRODUCT QUICK VIEW / DETAIL MODAL */}
      <AnimatePresence>
        {quickViewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-all"
              >
                <X size={18} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden">
                  <img src={quickViewProduct.image} alt={quickViewProduct.name} className="w-full h-full object-cover" />
                </div>

                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-lg uppercase tracking-wider">
                      {quickViewProduct.category}
                    </span>
                    <h2 className="text-lg font-extrabold text-slate-900 leading-snug">{quickViewProduct.name}</h2>
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-2xl font-black text-emerald-800">{formatCurrency(quickViewProduct.price)}</span>
                        {quickViewProduct.originalPrice && quickViewProduct.originalPrice > quickViewProduct.price && (
                          <span className="text-sm text-rose-500 line-through font-bold">{formatCurrency(quickViewProduct.originalPrice)}</span>
                        )}
                      </div>
                      {((quickViewProduct.discountPercent && quickViewProduct.discountPercent > 0) || (quickViewProduct.originalPrice && quickViewProduct.originalPrice > quickViewProduct.price)) && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 text-purple-900 font-extrabold text-[11px] rounded-lg border border-purple-200">
                          <Sparkles size={13} className="text-purple-700 animate-pulse" />
                          <span>Admin Promotional Discount Offer Active</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{quickViewProduct.description}</p>

                    {quickViewProduct.careGuide && (
                      <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-900 space-y-1">
                        <div className="font-bold flex items-center gap-1">
                          <Flower2 size={14} className="text-purple-700" /> Botanical Care Note
                        </div>
                        <p className="text-[11px] text-purple-800">{quickViewProduct.careGuide}</p>
                      </div>
                    )}

                    {/* ERP System Portals Link Card */}
                    {onNavigateToERP && (
                      <div className="p-3 bg-slate-900 text-white rounded-2xl space-y-2 text-xs border border-slate-800 shadow-md">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-extrabold flex items-center gap-1.5 text-emerald-400">
                            <Lock size={12} /> Linked ERP Portals
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">SKU: {quickViewProduct.barcode || quickViewProduct.id}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                          <div>
                            <span className="text-slate-400 block text-[10px]">ERP Botanical Stock</span>
                            <span className="font-bold text-emerald-300">{quickViewProduct.stock} units available</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">BOM Recipe Items</span>
                            <span className="font-bold text-amber-300">{quickViewProduct.materials?.length || 0} component(s)</span>
                          </div>
                        </div>

                        <div className="pt-1 flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onNavigateToERP('products');
                              setQuickViewProduct(null);
                            }}
                            className="flex-1 min-w-[120px] px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                          >
                            <Package size={12} /> Product Catalog
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onNavigateToERP('inventory');
                              setQuickViewProduct(null);
                            }}
                            className="flex-1 min-w-[120px] px-2.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                          >
                            <Boxes size={12} /> Stock Inventory
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-700">Quantity:</span>
                      <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                        <button onClick={() => setQuickViewQty(Math.max(1, quickViewQty - 1))} className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-slate-700 font-bold">
                          -
                        </button>
                        <span className="text-xs font-bold px-2">{quickViewQty}</span>
                        <button onClick={() => setQuickViewQty(quickViewQty + 1)} className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-slate-700 font-bold">
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        addToCart(quickViewProduct, quickViewQty);
                        setQuickViewProduct(null);
                      }}
                      className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={16} /> Add to Order Cart
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. INSTANT CUSTOMER CHECKOUT MODAL */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-700 text-white rounded-xl flex items-center justify-center font-bold">
                    <CheckCircle2 size={18} />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900">Finalize Floral Order Request</h3>
                </div>
                <button onClick={() => setIsCheckoutModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400">
                  <X size={16} />
                </button>
              </div>

              {/* Zero-Friction Notice Banner */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <div className="font-extrabold flex items-center gap-1.5 text-emerald-900">
                  <Sparkles size={14} className="text-emerald-700" /> Instant Customer Account Integration
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  No ERP admin approval is needed to place order requests! Once submitted, your order is immediately dispatched to our fulfillment team.
                </p>
              </div>

              <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-xs">
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 block">Delivery Recipient Name</label>
                  <input
                    type="text"
                    required
                    defaultValue={currentUser.name}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-600 font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-700 block">Shipping Address</label>
                  <textarea
                    required
                    rows={2}
                    defaultValue={currentUser.companyName || 'No. 45 Park Avenue, Colombo 03'}
                    placeholder="Full street address for floral courier delivery..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-600 font-medium text-slate-800"
                  />
                </div>

                <div className="p-3 bg-slate-100 rounded-2xl flex justify-between font-extrabold text-sm text-slate-900">
                  <span>Total Order Request:</span>
                  <span className="text-emerald-800">{formatCurrency(cartTotal)}</span>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-2 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-extrabold shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Send size={16} /> Submit Order Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER VALUE PROPOSITION BADGES & SOCIAL MEDIA AT THE BOTTOM */}
      <footer className="bg-white/90 backdrop-blur-md border-t border-sky-200/60 mt-12">
        {/* Social Media Links Banner at the bottom of the system */}
        <div className="bg-gradient-to-r from-sky-100/80 via-indigo-100/50 to-pink-100/80 border-b border-sky-200/60 py-8 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-slate-900 font-serif flex items-center justify-center md:justify-start gap-2">
                <Sparkles size={18} className="text-pink-500" />
                <span>Follow {companySettings?.name || 'Flora & Verdant'} On Social Media</span>
              </h4>
              <p className="text-xs text-slate-600">
                Connect with us on official social channels for daily floral inspirations, new catalog drops, and exclusive offers.
              </p>
            </div>

            {/* Social Media Links Icons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {companySettings?.storefront?.socialLinks?.facebook && (
                <a 
                  href={companySettings.storefront.socialLinks.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-blue-600 hover:text-white text-slate-700 font-bold text-xs transition-all shadow-sm border border-slate-200 hover:border-blue-600 group"
                  title="Facebook Page"
                >
                  <Facebook size={16} className="text-blue-600 group-hover:text-white transition-colors" />
                  <span>Facebook</span>
                </a>
              )}

              {companySettings?.storefront?.socialLinks?.instagram && (
                <a 
                  href={companySettings.storefront.socialLinks.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-pink-600 hover:text-white text-slate-700 font-bold text-xs transition-all shadow-sm border border-slate-200 hover:border-pink-600 group"
                  title="Instagram Profile"
                >
                  <Instagram size={16} className="text-pink-600 group-hover:text-white transition-colors" />
                  <span>Instagram</span>
                </a>
              )}

              {companySettings?.storefront?.socialLinks?.whatsapp && (
                <a 
                  href={companySettings.storefront.socialLinks.whatsapp} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-emerald-600 hover:text-white text-slate-700 font-bold text-xs transition-all shadow-sm border border-slate-200 hover:border-emerald-600 group"
                  title="WhatsApp Direct Contact"
                >
                  <MessageCircle size={16} className="text-emerald-600 group-hover:text-white transition-colors" />
                  <span>WhatsApp</span>
                </a>
              )}

              {companySettings?.storefront?.socialLinks?.linkedin && (
                <a 
                  href={companySettings.storefront.socialLinks.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-blue-700 hover:text-white text-slate-700 font-bold text-xs transition-all shadow-sm border border-slate-200 hover:border-blue-700 group"
                  title="LinkedIn Profile"
                >
                  <Linkedin size={16} className="text-blue-700 group-hover:text-white transition-colors" />
                  <span>LinkedIn</span>
                </a>
              )}

              {companySettings?.storefront?.socialLinks?.twitter && (
                <a 
                  href={companySettings.storefront.socialLinks.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-slate-900 hover:text-white text-slate-700 font-bold text-xs transition-all shadow-sm border border-slate-200 hover:border-slate-900 group"
                  title="Twitter / X Profile"
                >
                  <Twitter size={16} className="text-slate-900 group-hover:text-white transition-colors" />
                  <span>Twitter / X</span>
                </a>
              )}

              {companySettings?.storefront?.socialLinks?.youtube && (
                <a 
                  href={companySettings.storefront.socialLinks.youtube} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-red-600 hover:text-white text-slate-700 font-bold text-xs transition-all shadow-sm border border-slate-200 hover:border-red-600 group"
                  title="YouTube Channel"
                >
                  <Youtube size={16} className="text-red-600 group-hover:text-white transition-colors" />
                  <span>YouTube</span>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-8 grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-sky-100 text-sky-800 rounded-2xl flex items-center justify-center shrink-0">
              <Truck size={24} />
            </div>
            <div>
              <div className="font-extrabold text-xs text-slate-900">Free Regional Shipping</div>
              <div className="text-[11px] text-slate-500">On all flower orders above $50</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-800 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="font-extrabold text-xs text-slate-900">Flexible Payment</div>
              <div className="text-[11px] text-slate-500">Multiple secure payment channels</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 text-purple-800 rounded-2xl flex items-center justify-center shrink-0">
              <Headphones size={24} />
            </div>
            <div>
              <div className="font-extrabold text-xs text-slate-900">24/7 Floral Support</div>
              <div className="text-[11px] text-slate-500">Dedicated biophilic design team</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-pink-100 text-pink-800 rounded-2xl flex items-center justify-center shrink-0">
              <Flower2 size={24} />
            </div>
            <div>
              <div className="font-extrabold text-xs text-slate-900">Instant Customer Signup</div>
              <div className="text-[11px] text-slate-500">No ERP admin approval required</div>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
