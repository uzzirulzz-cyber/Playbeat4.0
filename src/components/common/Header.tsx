import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuthStore } from '../../store/useAuthStore';
import { CategoryIcon } from './CategoryIcon';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Shield,
  MessageCircle,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Zap,
  Layers,
  Flame,
  Clock,
  TrendingUp,
  Award,
  ArrowRight,
  Gift,
  Laptop,
  Cpu,
  Tv,
  Radio,
  Projector,
  LogOut,
  Gamepad2,
  Smartphone,
  Bot,
  Film
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Header: React.FC = () => {
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    cartCount,
    cartSubtotal,
    setIsCartOpen,
    wishlist,
    setIsWishlistOpen,
    currentUser,
    setCurrentUser,
    setIsAuthModalOpen,
    setAuthMode,
    setIsCustomerPortalOpen,
    setIsWhatsAppModalOpen,
    activeView,
    setActiveView,
    content,
    products,
    setSelectedProduct,
    currency,
    setCurrency,
    formatPrice,
    setProductTypeFilter,
    navItems,
    activePromoFilter,
    setActivePromoFilter,
    brandingLogoUrl,
    addToast
  } = useStore();

  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products for quick search popup
  const searchResults = searchQuery.trim()
    ? products
        .filter(p =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const currencies = [
    { code: 'PKR', symbol: 'Rs ', rate: 1 },
    { code: 'USD', symbol: '$', rate: 1 / 278.5 },
    { code: 'EUR', symbol: '€', rate: 1 / 302.0 },
    { code: 'GBP', symbol: '£', rate: 1 / 352.0 },
    { code: 'AED', symbol: 'AED ', rate: 1 / 75.8 }
  ];

  // Helper to handle nav item clicks
  const handleNavClick = (target: string) => {
    setActiveView('store');
    if (target === 'limited-time') {
      setActivePromoFilter('limited-time');
      setSelectedCategory('all');
      setProductTypeFilter('all');
      const el = document.getElementById('catalog');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (target === 'flash-deals') {
      setActivePromoFilter('flash-deals');
      const el = document.getElementById('deals');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (target === 'trending-week') {
      setActivePromoFilter('trending-week');
      const el = document.getElementById('trending');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (target === 'best-sellers') {
      setActivePromoFilter('best-sellers');
      setSelectedCategory('all');
      const el = document.getElementById('catalog');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (target === 'projectors') {
      setSelectedCategory('smart-projectors');
      setProductTypeFilter('physical_projector');
      const el = document.getElementById('projectors-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (target.startsWith('category:')) {
      const catId = target.replace('category:', '');
      setSelectedCategory(catId);
      setProductTypeFilter(catId === 'smart-projectors' ? 'physical_projector' : 'all');
      const el = document.getElementById('catalog');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setSelectedCategory('all');
      setProductTypeFilter('all');
      setActivePromoFilter('all');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getNavIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Clock': return <Clock className="w-3.5 h-3.5 text-[#FFC928]" />;
      case 'Flame': return <Flame className="w-3.5 h-3.5 text-[#FF304F]" />;
      case 'TrendingUp': return <TrendingUp className="w-3.5 h-3.5 text-[#1769FF]" />;
      case 'Award': return <Award className="w-3.5 h-3.5 text-[#FFC928]" />;
      case 'Projector': return <Projector className="w-3.5 h-3.5 text-[#1769FF]" />;
      default: return null;
    }
  };

  const activeNavList = navItems.filter(item => item.isActive).sort((a, b) => a.order - b.order);

  return (
    <header className="storefront-header sticky top-0 z-40 w-full flex flex-col bg-[#08152F]/95 backdrop-blur-xl border-b border-[#8993a3]/40 shadow-2xl">
      {/* 1. ANNOUNCEMENT BAR */}
      {content.announcementBar.enabled && (
        <div className="storefront-announcement w-full bg-[#070B14] border-b border-[#26334A]/80 py-1 px-4 text-xs text-slate-300 font-medium">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
              {content.announcementBar.badgeText && (
                <span className="px-2 py-0.5 rounded-md bg-[#FFC928]/15 text-[#FFC928] text-[10px] font-bold uppercase tracking-widest border border-[#FFC928]/35 font-mono">
                  {content.announcementBar.badgeText}
                </span>
              )}
              <span className="truncate text-slate-200 text-xs">{content.announcementBar.text}</span>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-slate-400 text-xs shrink-0">
              <span className="flex items-center gap-1.5 text-[#00D99A] font-mono text-[11px] uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D99A] animate-ping" />
                24/7 Automated Delivery
              </span>
              <span className="text-[#26334A]">|</span>
              <button
                onClick={() => setIsWhatsAppModalOpen(true)}
                className="hover:text-[#1769FF] transition-colors flex items-center gap-1.5 text-slate-300 text-xs"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#00D99A]" />
                WhatsApp Concierge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN HEADER NAVIGATION */}
      <div className="storefront-main-nav max-w-7xl mx-auto w-full px-4 sm:px-6 py-1 flex items-center justify-between gap-3 lg:gap-5">
        {/* BRAND LOGO */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              setActiveView('store');
              setSelectedCategory('all');
              setProductTypeFilter('all');
              setActivePromoFilter('all');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 group text-left focus:outline-none"
            aria-label="PlayBeat Digital Home"
          >
            <img
              src={brandingLogoUrl}
              alt="PlayBeat Digital"
              width={120}
              height={64}
              className="header-logo w-[120px] h-[64px] object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </button>

          {/* CATEGORIES BUTTON (DESKTOP) */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
              className={`nav-silver-button flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs uppercase tracking-widest font-bold transition-all ${
                isMegaMenuOpen
                  ? 'bg-[#1769FF]/20 text-[#287BFF] border border-[#1769FF]/40 font-bold shadow-sm'
                  : 'btn-glossy btn-glossy-dark btn-glossy-sm'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#1769FF]" />
              <span>Categories</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isMegaMenuOpen ? 'rotate-180 text-[#1769FF]' : 'text-slate-400'}`} />
            </button>

            {/* CATEGORY MEGA-MENU DROPDOWN */}
            <AnimatePresence>
              {isMegaMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.12 } }}
                  className="absolute left-0 top-full mt-2 w-[720px] rounded-2xl modern-card shadow-2xl p-5 z-50 grid grid-cols-2 gap-2"
                >
                  <div className="col-span-2 pb-2 mb-2 border-b border-[#26334A] flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold text-white uppercase tracking-[0.2em]">Explore Verified Collections</span>
                    <span className="font-mono text-slate-400">{categories.length} Categories</span>
                  </div>

                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setProductTypeFilter(cat.id === 'smart-projectors' ? 'physical_projector' : 'all');
                        setIsMegaMenuOpen(false);
                        setActiveView('store');
                        const el = document.getElementById('catalog');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                        selectedCategory === cat.id
                          ? 'bg-[#1769FF]/15 border border-[#1769FF]/40 text-white shadow-sm'
                          : 'hover:bg-[#121C30] border border-transparent text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl ${cat.id === 'smart-projectors' ? 'bg-[#1769FF]/20 text-[#287BFF] border border-[#1769FF]/30 shadow-sm' : 'bg-[#10182A] text-slate-300 border border-[#26334A]'}`}>
                        <CategoryIcon name={cat.iconName} className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                          {cat.name}
                          {cat.isFeatured && (
                            <span className="px-1.5 py-0.5 text-[9px] rounded bg-[#FFC928]/15 text-[#FFC928] font-mono border border-[#FFC928]/30">
                              Popular
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 truncate">{cat.description}</div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{cat.productCount}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 3. GLOBAL SMART SEARCH */}
        <div ref={searchRef} className="relative flex-1 max-w-lg hidden sm:block">
          <div className={`relative flex items-center rounded-full bg-[#10182A] border transition-all duration-200 ${
            isSearchFocused ? 'border-[#1769FF]/70 shadow-[0_0_20px_rgba(23,105,255,0.2)]' : 'border-[#26334A] hover:border-[#1769FF]/40'
          }`}>
            <Search className="w-4 h-4 text-slate-400 ml-4 shrink-0" />
            <input
              type="text"
              placeholder="Search digital assets, 4K projectors, licenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mr-3 text-slate-400 hover:text-white text-xs p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden lg:inline-block mr-3 px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-white/5 border border-[#26334A] rounded-md shadow-inner">
              /
            </kbd>
          </div>

          {/* INSTANT SEARCH AUTOCOMPLETE DROPDOWN */}
          <AnimatePresence>
            {isSearchFocused && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6, transition: { duration: 0.1 } }}
                className="absolute left-0 right-0 top-full mt-2 rounded-2xl modern-card shadow-2xl p-3 z-50"
              >
                {searchResults.length > 0 ? (
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 px-2 tracking-[0.2em] mb-1 font-mono">Matching Assets</div>
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedProduct(item);
                          setIsSearchFocused(false);
                        }}
                        className="w-full flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-[#121C30] text-left transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={item.images[0]} alt={item.title} className="w-9 h-9 rounded-lg object-cover bg-slate-950 shrink-0 border border-[#26334A]" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-100 truncate group-hover:text-[#1769FF] transition-colors">
                              {item.title}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {item.categoryName} • {item.productType === 'physical_projector' ? 'Tracked Delivery' : 'Instant Key'}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-[#1769FF] font-mono shrink-0">
                          {formatPrice(item.price)}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No matching assets found for "{searchQuery}".
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    <div className="text-[10px] uppercase font-bold text-slate-400 px-1 tracking-[0.2em] font-mono">Trending Searches</div>
                    <div className="flex flex-wrap gap-1.5">
                      {['4K Laser Projector', 'Steam $100', 'IPTV 4K', 'Canva Pro', 'Windows 11 Pro', 'Netflix 4K'].map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setSearchQuery(tag)}
                          className="px-2.5 py-1 rounded-md bg-[#10182A] hover:bg-[#1769FF]/20 hover:text-[#287BFF] border border-[#26334A] text-xs text-slate-300 font-medium transition-all"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. ACTIONS & SHORTCUTS */}
        <div className="header-actions flex items-center gap-3 lg:gap-4">
          {/* CURRENCY SELECTOR */}
          <div className="relative hidden lg:block">
            <button
              onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
              className="btn-glossy btn-glossy-dark btn-glossy-sm flex items-center gap-1.5"
            >
              <span>{currency.code}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            <AnimatePresence>
              {isCurrencyMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1.5 w-28 rounded-2xl modern-card shadow-xl p-1.5 z-50"
                >
                  {currencies.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setCurrency(c);
                        setIsCurrencyMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-mono rounded-lg transition-colors ${
                        currency.code === c.code ? 'bg-[#1769FF]/20 text-[#287BFF] font-bold' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span>{c.code}</span>
                      <span className="text-slate-400">{c.symbol}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* WISHLIST BUTTON */}
          <button
            onClick={() => setIsWishlistOpen(true)}
            className="btn-glossy btn-glossy-dark btn-glossy-circle"
            aria-label="View Wishlist"
          >
            <Heart className="w-4 h-4" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF304F] rounded-full shadow-[0_0_8px_rgba(255,48,79,0.7)]" />
            )}
          </button>

          {/* CART BUTTON */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="header-cart btn-glossy btn-glossy-dark btn-glossy-sm flex items-center gap-2"
            aria-label="View Cart"
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-[#1769FF] rounded-full shadow-[0_0_8px_rgba(23,105,255,0.7)]" />
              )}
            </div>
            <span className="hidden md:inline font-mono text-xs font-bold text-white">
              {formatPrice(cartSubtotal)}
            </span>
          </button>

          {/* Admin Console button removed from storefront — accessible only via /admin URL */}

          {/* MOBILE MENU TOGGLE */}
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="btn-glossy btn-glossy-dark btn-glossy-circle md:hidden"
            aria-label="Toggle navigation menu"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 5. QUICK NAVIGATION BAR — directly below the main header */}
      <div className="storefront-subnav storefront-subnav-promos nav-silver-gradient hidden md:block w-full border-t border-[#aeb7c5]/40 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar py-1 text-xs uppercase tracking-wider">
          <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
            <button
              onClick={() => handleNavClick('all')}
              className={`hover:text-[#1769FF] transition-colors ${
                selectedCategory === 'all' && activePromoFilter === 'all' ? 'text-[#287BFF] font-bold' : ''
              }`}
            >
              All Assets
            </button>

            {/* DYNAMIC CUSTOMIZABLE NAV ITEMS (FROM ADMIN) */}
            {activeNavList.map((item) => {
              const isSelected = 
                (item.target === 'limited-time' && activePromoFilter === 'limited-time') ||
                (item.target === 'flash-deals' && activePromoFilter === 'flash-deals') ||
                (item.target === 'trending-week' && activePromoFilter === 'trending-week') ||
                (item.target === 'best-sellers' && activePromoFilter === 'best-sellers') ||
                (item.target === 'projectors' && selectedCategory === 'smart-projectors') ||
                (item.target.startsWith('category:') && selectedCategory === item.target.replace('category:', ''));

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.target)}
                  className={`flex items-center gap-1.5 transition-all whitespace-nowrap px-1 py-0.5 rounded-md ${
                    isSelected
                      ? 'text-[#287BFF] font-bold drop-shadow-[0_0_8px_rgba(23,105,255,0.4)]'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {getNavIcon(item.icon)}
                  <span>{item.label}</span>
                  {item.badgeText && (
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold tracking-tight ${
                      item.badgeColor === 'yellow'
                        ? 'bg-[#FFC928]/15 text-[#FFC928] border border-[#FFC928]/35'
                        : item.badgeColor === 'red'
                        ? 'bg-[#FF304F]/15 text-[#FF304F] border border-[#FF304F]/35'
                        : 'bg-[#1769FF]/15 text-[#287BFF] border border-[#1769FF]/35'
                    }`}>
                      {item.badgeText}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-5 shrink-0 pl-6 border-l border-[#26334A]">
            <button
              onClick={() => handleNavClick('flash-deals')}
              className="flex items-center gap-1.5 text-[#FF304F] font-bold hover:text-[#ff6b81] transition-colors text-xs uppercase tracking-widest"
            >
              <Flame className="w-3.5 h-3.5 text-[#FF304F]" />
              <span>Cyber Drops</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5b. CATEGORY NAV BAR — directly below the quick navigation bar */}
      <div className="storefront-subnav storefront-subnav-categories nav-silver-gradient nav-silver-gradient-dark hidden md:block w-full border-t border-[#aeb7c5]/30 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 py-1 overflow-x-auto no-scrollbar">
          {/* Left: category buttons */}
          <div className="flex items-center gap-1">
            {[
              { label: 'Video Streaming', icon: Film, cat: 'streaming', type: 'digital' as const },
              { label: 'Games', icon: Gamepad2, cat: 'gaming', type: 'digital' as const },
              { label: 'Top Up', icon: Smartphone, cat: 'gaming', type: 'digital' as const },
              { label: 'AI Tools', icon: Bot, cat: 'saas', type: 'digital' as const },
              { label: 'Smart Projectors', icon: Projector, cat: 'smart-projectors', type: 'physical_projector' as const },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = selectedCategory === item.cat;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setSelectedCategory(item.cat);
                    setProductTypeFilter(item.type);
                    setActivePromoFilter('all');
                    setActiveView('store');
                    setTimeout(() => {
                      const el = document.getElementById('catalog');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    isActive
                      ? 'btn-glossy btn-glossy-blue btn-glossy-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Account control belongs to the third navigation bar. */}
          {currentUser.id === 'guest' ? (
            <button
              onClick={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }}
              className="hidden lg:inline-flex items-center gap-2 rounded-xl border border-[#FFC928]/50 bg-[#FFC928]/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#FFE08A] transition-all hover:-translate-y-0.5 hover:bg-[#FFC928]/25"
            >
              <User className="w-3.5 h-3.5" />
              Sign Up
            </button>
          ) : (
            <div className="header-profile relative hidden lg:block">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-black/15 px-2 py-1 text-slate-200 transition-colors hover:border-white/50 hover:bg-white/10"
                aria-label={`Open profile for ${currentUser.name}`}
              >
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1769FF]/50 to-[#10182A] border border-[#CBD5E1]/40 flex items-center justify-center text-[10px] text-white font-bold">
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[120px] truncate text-[10px] font-bold normal-case tracking-normal">{currentUser.name}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-2xl modern-card shadow-2xl p-2 z-50"
                  >
                    <div className="px-3 py-2.5 border-b border-[#26334A]">
                      <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{currentUser.email}</div>
                      <div className="mt-1"><span className="px-2 py-0.5 rounded-md bg-[#1769FF]/15 text-[#287BFF] text-[9px] font-bold uppercase tracking-wider font-mono border border-[#1769FF]/30">{currentUser.role.replace('_', ' ')}</span></div>
                    </div>
                    <div className="py-1 space-y-1">
                      <button onClick={() => { setIsCustomerPortalOpen(true); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-[#121C30] rounded-xl transition-colors"><User className="w-3.5 h-3.5 text-slate-400" />Orders & Key Vault</button>
                      <button onClick={() => { setIsAuthModalOpen(true); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-xl transition-colors"><Shield className="w-3.5 h-3.5" />Account Settings</button>
                      <button onClick={() => { useAuthStore.getState().logout(); setCurrentUser({ id: 'guest', name: 'Guest', email: 'guest@playbeat.digital', role: 'customer', twoFactorEnabled: false, addresses: [], totalSpent: 0, ordersCount: 0, wishlist: [], status: 'active', createdAt: new Date().toISOString() }); addToast('info', 'Signed Out', 'You have been logged out.'); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"><LogOut className="w-3.5 h-3.5" />Sign Out</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

        </div>
      </div>

      {/* 6. MOBILE NAVIGATION DRAWER */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-[#26334A] bg-[#070B14] px-4 py-4 space-y-4 shadow-2xl"
          >
            {/* Mobile Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search digital assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#10182A] rounded-full border border-[#26334A] px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#1769FF]/60"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Admin button removed from mobile nav — accessible only via /admin URL */}

              <button
                onClick={() => {
                  if (currentUser.id === 'guest') {
                    setAuthMode('signup');
                    setIsAuthModalOpen(true);
                    setIsMobileNavOpen(false);
                    addToast('info', 'Create an Account', 'Please sign up to access your orders and digital key vault.');
                    return;
                  }
                  setIsCustomerPortalOpen(true);
                  setIsMobileNavOpen(false);
                }}
                className="btn-glossy btn-glossy-dark btn-glossy-sm flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                Vault
              </button>
            </div>

            {/* Category Quick Nav — mobile */}
            <div className="space-y-1 pt-2 border-t border-[#26334A]">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] font-mono mb-2">Browse Categories</div>
              {[
                { label: 'Video Streaming', icon: Film, cat: 'streaming', type: 'digital' as const },
                { label: 'Games', icon: Gamepad2, cat: 'gaming', type: 'digital' as const },
                { label: 'Top Up', icon: Smartphone, cat: 'gaming', type: 'digital' as const },
                { label: 'AI Tools', icon: Bot, cat: 'saas', type: 'digital' as const },
                { label: 'Smart Projectors', icon: Projector, cat: 'smart-projectors', type: 'physical_projector' as const },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setSelectedCategory(item.cat);
                      setProductTypeFilter(item.type);
                      setActivePromoFilter('all');
                      setIsMobileNavOpen(false);
                      setActiveView('store');
                      setTimeout(() => {
                        const el = document.getElementById('catalog');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs text-slate-300 hover:bg-[#10182A] transition-colors"
                  >
                    <Icon className="w-4 h-4 text-[#1769FF]" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Sign In / Sign Up — mobile */}
            {currentUser.id === 'guest' && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#26334A]">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setIsAuthModalOpen(true);
                    setIsMobileNavOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-widest"
                >
                  <Shield className="w-4 h-4" />
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setIsAuthModalOpen(true);
                    setIsMobileNavOpen(false);
                  }}
                  className="btn-glossy btn-glossy-yellow btn-glossy-sm w-full"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Promotional Quick Links */}
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] font-mono mb-2">Featured Highlights</div>
              {activeNavList.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    handleNavClick(item.target);
                    setIsMobileNavOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-slate-300 hover:bg-[#10182A] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {getNavIcon(item.icon)}
                    {item.label}
                  </span>
                  {item.badgeText && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#FFC928]/15 text-[#FFC928] border border-[#FFC928]/35">
                      {item.badgeText}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-1 pt-2 border-t border-[#26334A]">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] font-mono mb-2">Categories</div>
              {categories.slice(0, 8).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setProductTypeFilter(cat.id === 'smart-projectors' ? 'physical_projector' : 'all');
                    setIsMobileNavOpen(false);
                    setActiveView('store');
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-slate-300 hover:bg-[#10182A]"
                >
                  <span className="flex items-center gap-2.5">
                    <CategoryIcon name={cat.iconName} className="w-4 h-4 text-[#1769FF]" />
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{cat.productCount}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
