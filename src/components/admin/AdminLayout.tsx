import React, { useRef, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { AdminDashboard } from './AdminDashboard';
import { NavigationManager } from './NavigationManager';
import { ProductManagement } from './ProductManagement';
import { SmartProjectorsManager } from './SmartProjectorsManager';
import { LicenseVaultManager } from './LicenseVaultManager';
import { OrderManagement } from './OrderManagement';
import { FinancialPaymentManager } from './FinancialPaymentManager';
import { MarketingAutomationView } from './MarketingAutomationView';
import { G2GConnectorView } from './G2GConnectorView';
import { DuplicateVariationInspector } from './DuplicateVariationInspector';
import { SystemStatusView } from './SystemStatusView';
import { AdminRolesView } from './AdminRolesView';
import { ContentManager } from './ContentManager';
import { ComingSoonView } from './ComingSoonView';
import { IptvM3uManager } from './IptvM3uManager';
import { WooCommerceBridge } from './WooCommerceBridge';
import { SubscriptionsManager } from './SubscriptionsManager';
import { WebsiteBuilderCMS } from './WebsiteBuilderCMS';
import { AnalyticsTraffic } from './AnalyticsTraffic';
import { DiscountsCoupons } from './DiscountsCoupons';
import { CustomerAccounts } from './CustomerAccounts';
import { SupportTickets } from './SupportTickets';
import { SocialAutomation } from './SocialAutomation';
import { TikTokLeadsEngine } from './TikTokLeadsEngine';
import { EmailSmsCampaigns } from './EmailSmsCampaigns';
import { FinancialBalance } from './FinancialBalance';
import { JazzCashMerchant } from './JazzCashMerchant';
import { PaymentProofs } from './PaymentProofs';
import { SecurityAuditLogs } from './SecurityAuditLogs';
import { AccountManagement } from './AccountManagement';
import { SuperAgentManagement } from './SuperAgentManagement';
import { BrandingAppearance } from './BrandingAppearance';
import {
  LayoutDashboard,
  Globe,
  BarChart3,
  Package,
  Key,
  ShoppingCart,
  CreditCard,
  Tag,
  Users,
  Ticket,
  Tv,
  Link2,
  Bot,
  Music2,
  Send,
  Wallet,
  Lock,
  Store,
  ShieldAlert,
  ShieldCheck,
  FileCheck2,
  UserCog,
  Menu,
  X,
  Headphones,
  MessageCircle,
  Palette,
  ChevronDown,
  Bell,
  Plus,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../../store/useAuthStore';
import { LogOut } from 'lucide-react';

/**
 * Admin layout matching the screenshot the user shared:
 *  - Fixed left sidebar (260px) with grouped navigation
 *  - Top header bar with hamburger + ALL CATEGORIES dropdown + breadcrumb + Storefront link + Admin Panel pill + Live Support link
 *  - Main content area with admin-card based dashboard
 *  - Purple gradient Live Support FAB on the bottom-left
 *
 * Theme matches the screenshot exactly:
 *  - Sidebar bg: #0a0b0d (deep black)
 *  - Card bg: #151a23 (slightly lighter)
 *  - Gold accents: #f59e0b (prices, active state border)
 *  - Blue charts: #3b82f6
 *  - Purple FAB: #8b5cf6 → #6366f1 gradient
 */

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const NAVIGATION_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'website-builder', label: 'Website Builder CMS', icon: Globe },
      { id: 'analytics', label: 'Analytics & Traffic', icon: BarChart3 },
    ],
  },
  {
    title: 'Website',
    items: [
      { id: 'branding', label: 'Branding & Appearance', icon: Palette },
      { id: 'nav-manager', label: 'Navigation & Menus', icon: Menu },
    ],
  },
  {
    title: 'Commerce & Inventory',
    items: [
      { id: 'orders', label: 'Orders & Fulfillment', icon: ShoppingCart },
      { id: 'products', label: 'Catalog Products', icon: Package },
      { id: 'license-vault', label: 'Digital License Vault', icon: Key },
      { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
      { id: 'discounts', label: 'Discounts & Coupons', icon: Tag },
    ],
  },
  {
    title: 'Customers & Support',
    items: [
      { id: 'customers', label: 'Customer Accounts', icon: Users },
      { id: 'account-management', label: 'Account Management', icon: UserCog },
      { id: 'support-tickets', label: 'Support Tickets', icon: Ticket },
    ],
  },
  {
    title: 'IPTV & Services',
    items: [
      { id: 'iptv', label: 'IPTV M3U Servers', icon: Tv },
    ],
  },
  {
    title: 'Marketing & Integrations',
    items: [
      { id: 'woocommerce', label: 'WooCommerce Bridge', icon: Link2 },
      { id: 'social-automation', label: 'Social Automation', icon: Bot },
      { id: 'tiktok-leads', label: 'TikTok Leads Engine', icon: Music2 },
      { id: 'email-sms', label: 'Email & SMS Campaigns', icon: Send },
    ],
  },
  {
    title: 'Payments & Security',
    items: [
      { id: 'financial-balance', label: 'Financial Balance', icon: Wallet },
      { id: 'payments', label: 'Payment Gateways', icon: CreditCard },
      { id: 'jazzcash', label: 'JazzCash & Merchant', icon: Store },
      { id: 'payment-proofs', label: 'Payment Proofs', icon: FileCheck2 },
      { id: 'security', label: 'Security & Audit Logs', icon: ShieldAlert },
      { id: 'super-agents', label: 'Super Agent Management', icon: ShieldCheck },
    ],
  },
];

// Helper to find the active nav item's label (for the breadcrumb)
const findActiveLabel = (id: string): string => {
  for (const sec of NAVIGATION_SECTIONS) {
    const found = sec.items.find((i) => i.id === id);
    if (found) return found.label;
  }
  return 'Dashboard';
};

// Map of menu IDs that have functional implementations to their components
// Everything else falls back to ComingSoonView with a description.
// NOTE: As of Task 4, ALL admin pages have functional implementations.
// This map is kept empty as a fallback for any future menu items added without a component.
const COMING_SOON_META: Record<string, { description: string; features: string[] }> = {};

export const AdminLayout: React.FC = () => {
  const { setActiveView, currentUser, setCurrentUser, setIsAuthModalOpen, adminTab, setAdminTab, addToast, brandingLogoUrl, setBrandingLogoUrl } = useStore();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const brandingInputRef = useRef<HTMLInputElement>(null);

  const handleBrandingUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      addToast('error', 'Logo Too Large', 'Please choose an image smaller than 2 MB.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBrandingLogoUrl(reader.result);
        addToast('success', 'Branding Updated', 'The logo now updates the storefront and admin profile.');
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleSignOut = () => {
    useAuthStore.getState().logout();
    setCurrentUser({
      id: 'guest', name: 'Guest', email: 'guest@playbeat.digital', role: 'customer',
      twoFactorEnabled: false, addresses: [], totalSpent: 0, ordersCount: 0,
      wishlist: [], status: 'active', createdAt: new Date().toISOString(),
    });
    addToast('info', 'Signed Out', 'You have been logged out.');
    setActiveView('store');
  };

  const handleReset = async () => {
    const confirmation = window.prompt('This clears all dashboard data. Type RESET to continue:');
    if (confirmation !== 'RESET') {
      if (confirmation !== null) addToast('error', 'Reset Cancelled', 'Type RESET exactly to confirm.');
      return;
    }

    try {
      const response = await fetch('/api/admin/reset-db', { method: 'POST' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Reset failed.');
      addToast('success', 'Dashboard Reset', 'Funds, orders, leads, and application data were cleared to zero.');
      try {
        localStorage.setItem('playbeat-zero-state', 'true');
      } catch {
        // The backend reset still succeeds if browser storage is unavailable.
      }
      window.location.reload();
    } catch (error) {
      addToast('error', 'Reset Failed', error instanceof Error ? error.message : 'Could not reset dashboard data.');
    }
  };

  const handleTabSelect = (id: string) => {
    setAdminTab(id);
    setIsMobileSidebarOpen(false);
    setIsCategoryMenuOpen(false);
  };

  const activeLabel = findActiveLabel(adminTab);

  // Render the active view. Functional pages render their real component;
  // everything else renders ComingSoonView with descriptive metadata.
  const renderActiveView = () => {
    switch (adminTab) {
      // Overview
      case 'dashboard':
        return <AdminDashboard />;
      case 'nav-manager':
        return <NavigationManager />;
      case 'branding':
        return <BrandingAppearance />;
      case 'system-status':
        return <SystemStatusView />;

      // Commerce & Inventory
      case 'products':
        return <ProductManagement />;
      case 'smart-projectors':
        return <SmartProjectorsManager />;
      case 'license-vault':
        return <LicenseVaultManager />;
      case 'orders':
        return <OrderManagement />;
      case 'payments':
        return <FinancialPaymentManager />;
      case 'dedup':
        return <DuplicateVariationInspector />;

      // Marketing & Integrations (existing)
      case 'marketing':
        return <MarketingAutomationView />;
      case 'g2g':
        return <G2GConnectorView />;

      // IPTV M3U Servers — NEW
      case 'iptv':
        return <IptvM3uManager />;

      // WooCommerce Bridge — NEW
      case 'woocommerce':
        return <WooCommerceBridge />;

      // Subscriptions — NEW
      case 'subscriptions':
        return <SubscriptionsManager />;

      // Website Builder CMS — NEW
      case 'website-builder':
        return <WebsiteBuilderCMS />;

      // Analytics & Traffic — NEW
      case 'analytics':
        return <AnalyticsTraffic />;

      // Discounts & Coupons — NEW
      case 'discounts':
        return <DiscountsCoupons />;

      // Customer Accounts — NEW
      case 'customers':
        return <CustomerAccounts />;
      case 'account-management':
        return <AccountManagement />;

      // Support Tickets — NEW
      case 'support-tickets':
        return <SupportTickets />;

      // Social Automation — NEW
      case 'social-automation':
        return <SocialAutomation />;

      // TikTok Leads Engine — NEW
      case 'tiktok-leads':
        return <TikTokLeadsEngine />;

      // Email & SMS Campaigns — NEW
      case 'email-sms':
        return <EmailSmsCampaigns />;

      // Financial Balance — NEW
      case 'financial-balance':
        return <FinancialBalance />;

      // JazzCash & Merchant — NEW
      case 'jazzcash':
        return <JazzCashMerchant />;

      // Payment Proofs — NEW
      case 'payment-proofs':
        return <PaymentProofs />;

      // Security & Audit Logs — NEW
      case 'security':
        return <SecurityAuditLogs />;
      case 'super-agents':
        return <SuperAgentManagement />;

      // Growth & Security (existing)
      case 'roles':
        return <AdminRolesView />;
      case 'content':
        return <ContentManager />;

      // Coming-soon items (placeholder views)
      default: {
        const meta = COMING_SOON_META[adminTab];
        if (!meta) {
          return (
            <ComingSoonView
              title={activeLabel}
              description="This section is being prepared and will be available soon."
            />
          );
        }
        const navItem = NAVIGATION_SECTIONS.flatMap((s) => s.items).find((i) => i.id === adminTab);
        return (
          <ComingSoonView
            title={activeLabel}
            description={meta.description}
            icon={navItem?.icon}
            features={meta.features}
          />
        );
      }
    }
  };

  // Sidebar content — shared between desktop sidebar and mobile drawer
  const sidebarContent = (
    <>
      {/* Brand strip + admin profile */}
      <div className="px-3 py-3 border-b border-[#1f2937] flex items-center gap-2.5">
        <img src={brandingLogoUrl} alt="PlayBeat Digital" className="w-12 h-12 object-contain shrink-0" />
        <div className="sidebar-brand-text hidden min-w-0 flex-1">
          <div className="text-sm font-bold text-white font-display truncate">{currentUser.name}</div>
          <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider truncate">{currentUser.role.replace('_', ' ')}</div>
        </div>
        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setIsCollapsed(v => !v)}
          className="hidden md:flex p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors sidebar-footer-text"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation groups — scrollable */}
      <nav className="flex-1 overflow-y-auto admin-sidebar-scroll py-3">
        {NAVIGATION_SECTIONS.map((section) => (
          <div key={section.title} className="mb-1">
            <div className="admin-section-header">{section.title}</div>
            <div className="px-2.5 space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = adminTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabSelect(item.id)}
                    className={`admin-nav-item ${isActive ? 'is-active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-500'}`} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {/* Tooltip — visible only in collapsed mode */}
                    <span className="admin-nav-item-tooltip">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar footer — Themes, Nav Customizer + Sign Out */}
      <div className="border-t border-[#1f2937] p-3 space-y-0.5">
        <input
          ref={brandingInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="sr-only"
          onChange={handleBrandingUpload}
        />
        <button
          onClick={() => brandingInputRef.current?.click()}
          className="admin-nav-item"
          title="Edit logo and admin profile picture"
        >
          <Upload className="w-4 h-4 shrink-0 text-cyan-400" />
          <span className="flex-1 text-left truncate sidebar-footer-text">Edit Branding</span>
        </button>
        <button
          onClick={() => handleTabSelect('content')}
          className={`admin-nav-item ${adminTab === 'content' ? 'is-active' : ''}`}
        >
          <Palette className={`w-4 h-4 shrink-0 ${adminTab === 'content' ? 'text-blue-400' : 'text-gray-500'}`} />
          <span className="flex-1 text-left truncate sidebar-footer-text">Themes & Sections</span>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 sidebar-footer-text" />
        </button>
        <button
          onClick={() => handleTabSelect('nav-manager')}
          className={`admin-nav-item ${adminTab === 'nav-manager' ? 'is-active' : ''}`}
        >
          <LayoutDashboard className={`w-4 h-4 shrink-0 ${adminTab === 'nav-manager' ? 'text-blue-400' : 'text-gray-500'}`} />
          <span className="flex-1 text-left truncate sidebar-footer-text">Navigation Customizer</span>
        </button>
        {/* Sign Out — glossy red pill */}
        <button onClick={handleSignOut} className="btn-glossy btn-glossy-red btn-glossy-sm w-full mt-2">
          <LogOut className="w-3.5 h-3.5" />
          <span className="sidebar-footer-text">Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="admin-skin min-h-screen bg-[#0b0d10] text-gray-200 flex">
      {/* ===========================================================
          DESKTOP SIDEBAR (260px or 64px collapsed, fixed)
          =========================================================== */}
      <aside className={`hidden md:flex flex-col w-[270px] admin-sidebar fixed inset-y-0 left-0 z-30 transition-all duration-200 ${isCollapsed ? 'admin-sidebar-collapsed' : ''}`}>
        {sidebarContent}
      </aside>

      {/* ===========================================================
          MOBILE SIDEBAR (drawer, slide-over)
          =========================================================== */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden flex flex-col w-[260px] admin-sidebar fixed inset-y-0 left-0 z-50"
            >
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white z-10"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ===========================================================
          MAIN COLUMN (offset by sidebar width on desktop)
          =========================================================== */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${isCollapsed ? 'md:ml-16' : 'md:ml-[270px]'}`}>
        {/* ---- TOP HEADER BAR ---- */}
        <header className="sticky top-0 z-20 bg-[#0f1115]/95 backdrop-blur-md border-b border-[#1f2937] px-4 sm:px-6 h-[60px] flex items-center justify-between gap-3">
          {/* Left side: hamburger + ALL CATEGORIES dropdown + breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/5"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* ALL CATEGORIES dropdown */}
            <div className="relative hidden">
              <button
                onClick={() => setIsCategoryMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>All Categories</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isCategoryMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsCategoryMenuOpen(false)}
                      aria-hidden="true"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute top-full left-0 mt-2 w-64 admin-card !rounded-lg p-2 z-40 max-h-[400px] overflow-y-auto admin-sidebar-scroll"
                    >
                      {NAVIGATION_SECTIONS.map((sec) => (
                        <div key={sec.title} className="mb-2">
                          <div className="admin-section-header !px-2 !py-1">{sec.title}</div>
                          {sec.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = adminTab === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => handleTabSelect(item.id)}
                                className={`admin-nav-item !py-1.5 !text-[12px] ${isActive ? 'is-active' : ''}`}
                              >
                                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-gray-500'}`} />
                                <span className="flex-1 truncate">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Breadcrumb / Title */}
            <div className="relative hidden sm:block w-60 lg:w-[min(32vw,420px)]">
              <input aria-label="Search dashboard" placeholder="Search anything..." className="w-full h-9 rounded-lg bg-[#0b1426] border border-[#26334a] px-10 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/60" />
              <span className="absolute left-3 top-2 text-gray-500">⌕</span>
              <span className="absolute right-2 top-2 text-[9px] text-gray-600 border border-[#26334a] rounded px-1">CTRL /</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-gray-600">/</span>
              <span className="text-white font-semibold truncate">{activeLabel}</span>
            </div>
          </div>

          {/* Right side: each button gets its own premium glossy color */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setActiveView('store')}
              className="btn-glossy btn-glossy-yellow btn-glossy-sm !text-black"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline normal-case tracking-normal">Storefront</span>
            </button>

            <button
              onClick={() => setAdminTab('products')}
              className="btn-glossy btn-glossy-blue btn-glossy-sm"
              title="Add a product"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden lg:inline normal-case tracking-normal">Quick Add</span>
            </button>

            <button
              onClick={() => addToast('info', 'Notifications', 'You are all caught up.')}
              className="p-2 text-gray-400 hover:text-white"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>

            <button
              onClick={handleReset}
              className="btn-glossy btn-glossy-red btn-glossy-sm"
              title="Reset all dashboard data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline normal-case tracking-normal">Reset Data</span>
            </button>
          </div>
        </header>

        {/* ---- MAIN CONTENT ---- */}
        <main className="flex-1 p-3 sm:p-4 overflow-x-hidden">
          {renderActiveView()}
        </main>
      </div>

      {/* ===========================================================
          LIVE SUPPORT FAB (purple gradient, bottom-left)
          Navigates to the Support Tickets page so the admin can see
          and respond to storefront customer queries.
          =========================================================== */}
      <button
        onClick={() => setAdminTab('support-tickets')}
        className="admin-fab"
        aria-label="View storefront support queries"
        title="View storefront support queries"
      >
        <MessageCircle className="w-5 h-5" />
      </button>
    </div>
  );
};
