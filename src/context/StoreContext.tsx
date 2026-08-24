import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Category,
  User,
  Order,
  OrderStatus,
  ContentSection,
  Coupon,
  G2GSupplierConnector,
  ImportJob,
  AdminLog,
  ProductVariation,
  ProductType,
  NavItem,
  IptvServer,
  IptvCredential,
  WooCommerceConnection,
  SyncConflict,
  SubscriptionPlan,
  CustomerSubscription,
  BillingCycle,
  WebsitePage,
  BlockLibraryItem,
  AnalyticsMetric,
  FunnelStep,
  SupportTicket,
  TicketStatus,
  ScheduledPost,
  TikTokLead,
  LeadStatus,
  MarketingCampaign,
  GatewayBalance,
  JazzCashTransaction,
  PaymentProof,
  ProofStatus,
  LoginAttempt,
  SecretRotation,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_USERS,
  INITIAL_ORDERS,
  INITIAL_CONTENT,
  INITIAL_G2G_CONNECTOR,
  INITIAL_COUPONS,
  INITIAL_ADMIN_LOGS,
  INITIAL_NAV_ITEMS,
  INITIAL_IPTV_SERVERS,
  INITIAL_IPTV_CREDENTIALS,
  INITIAL_WOOCOMMERCE_CONNECTIONS,
  INITIAL_SYNC_CONFLICTS,
  INITIAL_SUBSCRIPTION_PLANS,
  INITIAL_CUSTOMER_SUBSCRIPTIONS,
  INITIAL_WEBSITE_PAGES,
  INITIAL_BLOCK_LIBRARY,
  ANALYTICS_METRICS,
  FUNNEL_STEPS,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_SCHEDULED_POSTS,
  INITIAL_TIKTOK_LEADS,
  INITIAL_CAMPAIGNS,
  INITIAL_GATEWAY_BALANCES,
  INITIAL_JAZZCASH_TXS,
  INITIAL_PAYMENT_PROOFS,
  INITIAL_LOGIN_ATTEMPTS,
  INITIAL_SECRET_ROTATIONS,
} from '../data/mockData';
import { CUSTOM_CATEGORIES, CUSTOM_PRODUCTS } from '../data/customCatalog';

export interface CartItem {
  productId: string;
  product: Product;
  variation?: ProductVariation;
  quantity: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

export interface G2GSettingsState {
  status: 'connected' | 'disconnected' | 'testing';
  apiKey: string;
  marginMarkupPercent: number;
  environment: 'production' | 'sandbox';
  autoSync: boolean;
  currency: string;
  lastSyncedAt: string;
}

export interface StoreContextType {
  // Store state
  products: Product[];
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  productTypeFilter: 'all' | 'digital' | 'physical_projector';
  setProductTypeFilter: (t: 'all' | 'digital' | 'physical_projector') => void;
  
  // Navigation Customization (Storefront & Admin)
  navItems: NavItem[];
  setNavItems: React.Dispatch<React.SetStateAction<NavItem[]>>;
  addNavItem: (item: Omit<NavItem, 'id'>) => void;
  updateNavItem: (id: string, updates: Partial<NavItem>) => void;
  deleteNavItem: (id: string) => void;
  reorderNavItems: (items: NavItem[]) => void;
  toggleNavItemActive: (id: string) => void;
  activePromoFilter: string;
  setActivePromoFilter: (filter: string) => void;
  
  // Modals & Navigation
  activeView: 'store' | 'admin';
  setActiveView: (v: 'store' | 'admin') => void;
  adminTab: string;
  setAdminTab: (tab: string) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isCustomerPortalOpen: boolean;
  setIsCustomerPortalOpen: (open: boolean) => void;
  isWhatsAppModalOpen: boolean;
  setIsWhatsAppModalOpen: (open: boolean) => void;
  isCompareModalOpen: boolean;
  setIsCompareModalOpen: (open: boolean) => void;
  
  // Cart & Wishlist
  cart: CartItem[];
  addToCart: (product: Product, variation?: ProductVariation, quantity?: number) => void;
  removeFromCart: (productId: string, variationId?: string) => void;
  updateCartQuantity: (productId: string, variationId: string | undefined, qty: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartCount: number;
  isInCart: (productId: string, variationId?: string) => boolean;
  
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  
  // Projector Comparison
  compareList: Product[];
  toggleCompare: (product: Product) => void;
  clearCompare: () => void;
  
  // Auth
  currentUser: User;
  switchUserRole: (role: User['role']) => void;
  setCurrentUser: (u: User) => void;
  brandingLogoUrl: string;
  setBrandingLogoUrl: (url: string) => void;
  
  // Orders
  orders: Order[];
  createOrder: (orderData: any) => Promise<Order>;
  updateOrderShipment: (orderId: string, trackingNumber: string, carrier: string, status: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  
  // Content & Coupons
  content: ContentSection;
  updateContent: (newContent: Partial<ContentSection>) => void;
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  addCoupon: (coupon: Coupon) => void;
  deleteCoupon: (id: string) => void;
  
  // Admin Data & Sourcing
  g2gConnector: G2GSupplierConnector;
  g2gSettings: G2GSettingsState;
  updateG2GConnector: (conn: Partial<G2GSupplierConnector>) => void;
  updateG2GSettings: (settings: Partial<G2GSettingsState>) => void;
  syncG2GCatalog: () => Promise<void>;
  importJobs: ImportJob[];
  adminLogs: AdminLog[];
  refreshProducts: () => void;
  addProduct: (product: Product) => void;
  updateProduct: (productOrId: Product | string, maybeUpdates?: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  approveProduct: (id: string) => void;
  cleanAllProductVariations: () => void;
  
  // Toasts
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
  
  // Currency
  currency: { code: string; symbol: string; rate: number };
  setCurrency: (c: { code: string; symbol: string; rate: number }) => void;
  formatPrice: (usdPrice: number) => string;

  // ====== IPTV M3U Servers ======
  iptvServers: IptvServer[];
  iptvCredentials: IptvCredential[];
  addIptvServer: (server: Omit<IptvServer, 'id' | 'lastCheckedAt' | 'activeConnections'>) => void;
  toggleIptvServer: (id: string) => void;
  deleteIptvServer: (id: string) => void;
  refreshIptvServerHealth: (id: string) => void;
  provisionIptvCredential: (credential: { assignedTo: string; serverId: string; expiresAt: string }) => void;
  revokeIptvCredential: (id: string) => void;

  // ====== WooCommerce Bridge ======
  wooCommerceConnections: WooCommerceConnection[];
  syncConflicts: SyncConflict[];
  addWooCommerceConnection: (conn: Omit<WooCommerceConnection, 'id' | 'lastSyncAt' | 'productsSynced' | 'ordersSynced' | 'pendingConflicts'>) => void;
  toggleWooCommerceConnection: (id: string) => void;
  deleteWooCommerceConnection: (id: string) => void;
  syncWooCommerceConnection: (id: string) => void;
  resolveSyncConflict: (id: string, resolution: 'resolved_local' | 'resolved_remote') => void;

  // ====== Subscriptions ======
  subscriptionPlans: SubscriptionPlan[];
  customerSubscriptions: CustomerSubscription[];
  createSubscriptionPlan: (plan: Omit<SubscriptionPlan, 'id' | 'subscribers' | 'mrr'>) => void;
  updateSubscriptionPlan: (id: string, updates: Partial<SubscriptionPlan>) => void;
  archiveSubscriptionPlan: (id: string) => void;
  retryFailedSubscription: (id: string) => void;
  cancelSubscription: (id: string) => void;

  // ====== Website Builder ======
  websitePages: WebsitePage[];
  blockLibrary: BlockLibraryItem[];
  createWebsitePage: (page: Omit<WebsitePage, 'id' | 'lastEditedAt'>) => void;
  updateWebsitePage: (id: string, updates: Partial<WebsitePage>) => void;
  publishWebsitePage: (id: string) => void;
  deleteWebsitePage: (id: string) => void;

  // ====== Analytics ======
  analyticsMetrics: AnalyticsMetric[];
  funnelSteps: FunnelStep[];

  // ====== Support Tickets ======
  supportTickets: SupportTicket[];
  createSupportTicket: (input: { subject: string; message: string }) => void;
  replyToSupportTicket: (id: string, message: string) => void;
  updateTicketStatus: (id: string, status: TicketStatus) => void;
  assignTicket: (id: string, assignee: string) => void;

  // ====== Social Automation ======
  scheduledPosts: ScheduledPost[];
  schedulePost: (post: Omit<ScheduledPost, 'id'>) => void;
  deleteScheduledPost: (id: string) => void;

  // ====== TikTok Leads ======
  tiktokLeads: TikTokLead[];
  updateLeadStatus: (id: string, status: LeadStatus) => void;

  // ====== Email & SMS Campaigns ======
  campaigns: MarketingCampaign[];
  pauseCampaign: (id: string) => void;
  resumeCampaign: (id: string) => void;
  growthAutomationEnabled: boolean;
  setGrowthAutomationEnabled: (enabled: boolean) => void;
  resetGrowthAutomation: () => void;
  growthAutomationResetAt: number;

  // ====== Financial Balance ======
  gatewayBalances: GatewayBalance[];

  // ====== JazzCash ======
  jazzcashTransactions: JazzCashTransaction[];

  // ====== Payment Proofs ======
  paymentProofs: PaymentProof[];
  approvePaymentProof: (id: string, reviewerName: string) => void;
  rejectPaymentProof: (id: string, reviewerName: string) => void;

  // ====== Security & Audit Logs ======
  loginAttempts: LoginAttempt[];
  secretRotations: SecretRotation[];
  rotateSecret: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isZeroState = (() => {
    try {
      return localStorage.getItem('playbeat-zero-state') === 'true';
    } catch {
      return false;
    }
  })();

  const [products, setProducts] = useState<Product[]>(isZeroState ? [] : CUSTOM_PRODUCTS);
  const [categories] = useState<Category[]>(CUSTOM_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [productTypeFilter, setProductTypeFilter] = useState<'all' | 'digital' | 'physical_projector'>('all');
  const [navItems, setNavItems] = useState<NavItem[]>(INITIAL_NAV_ITEMS);
  const [activePromoFilter, setActivePromoFilter] = useState<string>('all');
  
  const [activeView, setActiveView] = useState<'store' | 'admin'>('store');
  const [adminTab, setAdminTab] = useState<string>('dashboard');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCustomerPortalOpen, setIsCustomerPortalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [brandingLogoUrl, setBrandingLogoUrl] = useState<string>(() => {
    try {
      const storedLogo = localStorage.getItem('playbeat-branding-logo');
      return storedLogo && !['/assets/playbeat-logo.svg', '/assets/logo.png.jpeg'].includes(storedLogo)
        ? storedLogo
        : '/assets/playbeat-logo.png';
    } catch {
      return '/assets/playbeat-logo.png';
    }
  });

  const updateBrandingLogoUrl = (url: string) => {
    setBrandingLogoUrl(url);
    try {
      if (url) localStorage.setItem('playbeat-branding-logo', url);
      else localStorage.removeItem('playbeat-branding-logo');
    } catch {
      // Ignore storage failures while keeping the current session updated.
    }
  };

  // ====== IPTV M3U Servers state ======
  const [iptvServers, setIptvServers] = useState<IptvServer[]>(isZeroState ? [] : INITIAL_IPTV_SERVERS);
  const [iptvCredentials, setIptvCredentials] = useState<IptvCredential[]>(isZeroState ? [] : INITIAL_IPTV_CREDENTIALS);

  // ====== WooCommerce Bridge state ======
  const [wooCommerceConnections, setWooCommerceConnections] = useState<WooCommerceConnection[]>(isZeroState ? [] : INITIAL_WOOCOMMERCE_CONNECTIONS);
  const [syncConflicts, setSyncConflicts] = useState<SyncConflict[]>(isZeroState ? [] : INITIAL_SYNC_CONFLICTS);

  // ====== Subscriptions state ======
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>(isZeroState ? [] : INITIAL_SUBSCRIPTION_PLANS);
  const [customerSubscriptions, setCustomerSubscriptions] = useState<CustomerSubscription[]>(isZeroState ? [] : INITIAL_CUSTOMER_SUBSCRIPTIONS);

  // ====== Website Builder state ======
  const [websitePages, setWebsitePages] = useState<WebsitePage[]>(isZeroState ? [] : INITIAL_WEBSITE_PAGES);
  const [blockLibrary] = useState<BlockLibraryItem[]>(INITIAL_BLOCK_LIBRARY);

  // ====== Analytics state (read-only aggregates) ======
  const [analyticsMetrics, setAnalyticsMetrics] = useState<AnalyticsMetric[]>(isZeroState ? [] : ANALYTICS_METRICS);
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>(isZeroState ? [] : FUNNEL_STEPS);

  // ====== Support Tickets state ======
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(isZeroState ? [] : INITIAL_SUPPORT_TICKETS);

  // ====== Social Automation state ======
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>(isZeroState ? [] : INITIAL_SCHEDULED_POSTS);

  // ====== TikTok Leads state ======
  const [tiktokLeads, setTiktokLeads] = useState<TikTokLead[]>(isZeroState ? [] : INITIAL_TIKTOK_LEADS);

  // ====== Email & SMS Campaigns state ======
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(isZeroState ? [] : INITIAL_CAMPAIGNS);
  const [growthAutomationEnabled, setGrowthAutomationEnabledState] = useState<boolean>(() => {
    try { return localStorage.getItem('playbeat-growth-automation-enabled') !== 'false'; } catch { return true; }
  });
  const [growthAutomationResetAt, setGrowthAutomationResetAt] = useState(0);

  // ====== Financial Balance state (read-only balances) ======
  const [gatewayBalances, setGatewayBalances] = useState<GatewayBalance[]>(isZeroState ? [] : INITIAL_GATEWAY_BALANCES);

  // ====== JazzCash Transactions state (read-only) ======
  const [jazzcashTransactions, setJazzcashTransactions] = useState<JazzCashTransaction[]>(isZeroState ? [] : INITIAL_JAZZCASH_TXS);

  // ====== Payment Proofs state ======
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>(isZeroState ? [] : INITIAL_PAYMENT_PROOFS);

  // ====== Security & Audit Logs state ======
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>(isZeroState ? [] : INITIAL_LOGIN_ATTEMPTS);
  const [secretRotations, setSecretRotations] = useState<SecretRotation[]>(isZeroState ? [] : INITIAL_SECRET_ROTATIONS);

  // Cart and wishlist start EMPTY — user adds items by browsing the storefront.
  // No pre-seeded cart items or wishlist items on first visit.
  const [cart, setCart] = useState<CartItem[]>([]);

  const [wishlist, setWishlist] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<Product[]>(CUSTOM_PRODUCTS.filter(p => p.productType === 'physical_projector').slice(0, 2));
  // Start as a GUEST — no profile pre-loaded. Users must explicitly sign in.
  // The super admin is NOT auto-loaded on app start.
  const GUEST_USER: User = {
    id: 'guest',
    name: 'Guest',
    email: '',
    role: 'customer',
    twoFactorEnabled: false,
    addresses: [],
    totalSpent: 0,
    ordersCount: 0,
    wishlist: [],
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
  const [orders, setOrders] = useState<Order[]>(isZeroState ? [] : INITIAL_ORDERS);
  const [content, setContent] = useState<ContentSection>(INITIAL_CONTENT);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [g2gConnector, setG2GConnector] = useState<G2GSupplierConnector>(INITIAL_G2G_CONNECTOR);
  
  const [g2gSettings, setG2GSettings] = useState<G2GSettingsState>({
    status: 'connected',
    // Credentials belong on the server; never ship supplier secrets to the browser.
    apiKey: '',
    marginMarkupPercent: 18,
    environment: 'production',
    autoSync: true,
    currency: 'USD',
    lastSyncedAt: new Date().toISOString()
  });

  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>(INITIAL_ADMIN_LOGS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const [currency, setCurrency] = useState({ code: 'PKR', symbol: 'Rs ', rate: 1 });

  // Initial fetch from backend if running
  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(res => res.json()),
      fetch('/api/orders').then(res => res.json()),
      fetch('/api/content').then(res => res.json()),
      fetch('/api/coupons').then(res => res.json()),
      fetch('/api/navigation').then(res => res.json()),
    ])
      .then(([productsData, ordersData, contentData, couponsData, navigationData]) => {
        const nextProducts = Array.isArray(productsData.products) ? productsData.products : CUSTOM_PRODUCTS;
        const nextOrders = Array.isArray(ordersData.orders) ? ordersData.orders : INITIAL_ORDERS;
        const isResetState = nextProducts.length === 0 && nextOrders.length === 0;

        // A confirmed local reset must win over stale API responses or a
        // database that has not finished propagating its zero-state marker.
        if (!isZeroState) {
          setProducts(nextProducts);
          setOrders(nextOrders);
          if (contentData?.content) setContent(contentData.content);
          if (Array.isArray(couponsData?.coupons)) setCoupons(couponsData.coupons);
          if (Array.isArray(navigationData?.items) && navigationData.items.length > 0) setNavItems(navigationData.items);
        }

        // The reset endpoint clears MongoDB, but these admin-only datasets are
        // client-side demo state. Keep them consistent with the zeroed backend.
        if (isZeroState || isResetState) {
          setSupportTickets([]);
          setScheduledPosts([]);
          setTiktokLeads([]);
          setCampaigns([]);
          setPaymentProofs([]);
          setAnalyticsMetrics([]);
          setFunnelSteps([]);
          setGatewayBalances([]);
          setJazzcashTransactions([]);
          setLoginAttempts([]);
          setSecretRotations([]);
          setIptvServers([]);
          setIptvCredentials([]);
          setWooCommerceConnections([]);
          setSyncConflicts([]);
          setSubscriptionPlans([]);
          setCustomerSubscriptions([]);
          setWebsitePages([]);
          setG2GConnector({} as G2GSupplierConnector);
          setG2GSettings(prev => ({ ...prev, status: 'disconnected', autoSync: false }));
        }
      })
      .catch(() => {
        // Keep the local demo seed when the API is unavailable.
      });
  }, []);

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const formatPrice = (pkrPrice: number): string => {
    const safePrice = Number(pkrPrice) || 0;
    const converted = safePrice * currency.rate;
    if (currency.code === 'PKR') {
      return `${currency.symbol}${Math.round(converted).toLocaleString('en-US')}`;
    }
    return `${currency.symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const addToCart = (product: Product, variation?: ProductVariation, quantity: number = 1) => {
    const activeVar = variation || (product.variations && product.variations.length > 0 ? product.variations[0] : undefined);

    // Check if this exact product + variation is already in the cart
    // so we can give the user clearer feedback (quantity updated vs. added).
    const alreadyInCart = cart.some(item =>
      item.productId === product.id &&
      (activeVar ? item.variation?.id === activeVar.id : !item.variation)
    );

    setCart(prev => {
      const existingIdx = prev.findIndex(item =>
        item.productId === product.id &&
        (activeVar ? item.variation?.id === activeVar.id : true)
      );

      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: copy[existingIdx].quantity + quantity,
        };
        return copy;
      } else {
        return [...prev, { productId: product.id, product, variation: activeVar, quantity }];
      }
    });

    if (alreadyInCart) {
      addToast('info', 'Quantity Updated', `${product.title} (${activeVar ? activeVar.value : 'Default'}) quantity increased to ${cart.find(i => i.productId === product.id)?.quantity ? (cart.find(i => i.productId === product.id)!.quantity + quantity) : quantity}.`);
    } else {
      addToast('success', 'Added to Cart', `${product.title} (${activeVar ? activeVar.value : 'Default'}) added.`);
    }
  };

  // Helper for the UI to know if a product+variation is already in the cart
  const isInCart = (productId: string, variationId?: string): boolean => {
    return cart.some(item =>
      item.productId === productId &&
      (variationId ? item.variation?.id === variationId : !item.variation)
    );
  };

  const removeFromCart = (productId: string, variationId?: string) => {
    setCart(prev => prev.filter(item => !(item.productId === productId && (variationId ? item.variation?.id === variationId : true))));
    addToast('info', 'Item Removed', 'Product removed from your cart.');
  };

  const updateCartQuantity = (productId: string, variationId: string | undefined, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId, variationId);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.productId === productId && (variationId ? item.variation?.id === variationId : true)) {
        return { ...item, quantity: qty };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartSubtotal = cart.reduce((sum, item) => {
    const price = item.variation ? item.variation.price : item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const exists = prev.includes(productId);
      if (exists) {
        addToast('info', 'Wishlist Updated', 'Item removed from your wishlist.');
        return prev.filter(id => id !== productId);
      } else {
        addToast('success', 'Wishlist Updated', 'Item saved to your wishlist.');
        return [...prev, productId];
      }
    });
  };

  const toggleCompare = (product: Product) => {
    setCompareList(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        addToast('info', 'Comparison List', `Removed ${product.title} from comparison.`);
        return prev.filter(p => p.id !== product.id);
      } else {
        if (prev.length >= 4) {
          addToast('warning', 'Comparison Limit', 'You can compare up to 4 projectors at once.');
          return prev;
        }
        addToast('success', 'Added to Compare', `${product.title} added for side-by-side comparison.`);
        return [...prev, product];
      }
    });
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const switchUserRole = (role: User['role']) => {
    setCurrentUser(prev => ({
      ...prev,
      role,
      name: role === 'super_admin' ? 'PlayBeat Super Admin' : role === 'product_manager' ? 'Product Lead' : 'Valued Customer',
      email: role === 'super_admin' ? 'admin@playbeat.digital' : 'customer@playbeat.digital'
    }));
    addToast('info', 'Role Switched', `Active session switched to ${role.replace('_', ' ').toUpperCase()}`);
  };

  const applyCoupon = (code: string) => {
    const found = coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && (c.isActive !== false && c.status !== 'expired'));
    if (!found) {
      addToast('error', 'Invalid Coupon', 'The promo code entered does not exist or has expired.');
      return { success: false, message: 'Invalid or expired promo code.' };
    }
    const minP = found.minPurchase || found.minOrderAmount || 0;
    if (cartSubtotal < minP) {
      const msg = `Minimum purchase of ${formatPrice(minP)} required for this coupon.`;
      addToast('warning', 'Coupon Requirement', msg);
      return { success: false, message: msg };
    }
    setAppliedCoupon(found);
    addToast('success', 'Promo Code Applied', `Coupon "${found.code}" applied successfully!`);
    return { success: true, message: 'Coupon applied.' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    addToast('info', 'Coupon Removed', 'Promo discount cleared.');
  };

  const addCoupon = (newC: Coupon) => {
    setCoupons(prev => [newC, ...prev]);
    fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newC),
    }).catch(() => {});
  };

  const deleteCoupon = (id: string) => {
    setCoupons(prev => prev.filter(c => c.id !== id));
    fetch(`/api/coupons/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
    addToast('info', 'Coupon Deleted', 'Promo code removed.');
  };

  const createOrder = async (orderData: any): Promise<Order> => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const data = await res.json();
      if (data.order) {
        setOrders(prev => [data.order, ...prev]);
        clearCart();
        setAppliedCoupon(null);
        addToast('success', 'Order Confirmed!', `Order #${data.order.orderNumber || data.order.id} successfully processed.`);
        return data.order;
      }
    } catch (e) {
      console.error('Checkout error:', e);
    }

    // Fallback in-memory order creation
    const hasPhysical = cart.some(i => i.product.productType === 'physical_projector');
    const newOrder: Order = {
      id: `ord-${Date.now().toString().slice(-6)}`,
      orderNumber: `PB-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      userId: currentUser.id,
      customerId: currentUser.id,
      customerName: orderData.customerName || currentUser.name,
      customerEmail: orderData.customerEmail || currentUser.email,
      customerPhone: orderData.customerPhone || '+1 (888) 752-9232',
      shippingAddress: orderData.shippingAddress,
      items: cart.map(item => ({
        productId: item.product.id,
        productTitle: item.product.title,
        productType: item.product.productType,
        productImage: item.product.images[0],
        variationId: item.variation?.id,
        variationTitle: item.variation?.value,
        variation: item.variation,
        quantity: item.quantity,
        unitPrice: item.variation ? item.variation.price : item.product.price,
        subtotal: (item.variation ? item.variation.price : item.product.price) * item.quantity,
        totalPrice: (item.variation ? item.variation.price : item.product.price) * item.quantity,
        licenseKeys: item.product.productType === 'digital' ? [
          `PB-ACT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        ] : undefined,
        trackingNumber: item.product.productType === 'physical_projector' ? `DHL-${Math.floor(Math.random() * 90000000 + 10000000)}` : undefined,
        digitalDelivery: item.product.productType === 'digital' ? {
          type: item.product.instantDeliveryFormat || 'license_key',
          content: `PB-ACT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          instructions: item.product.deliveryInstructions || 'Redeem on client application.',
          claimed: true
        } : undefined,
        shipment: item.product.productType === 'physical_projector' ? {
          trackingNumber: `DHL-PB-${Math.floor(Math.random() * 90000000 + 10000000)}`,
          carrier: 'DHL Express Global Insured',
          status: 'processing',
          estimatedDelivery: '2026-08-25'
        } : undefined
      })),
      subtotal: cartSubtotal,
      discount: appliedCoupon ? (appliedCoupon.discountType === 'percentage' ? (cartSubtotal * appliedCoupon.discountValue) / 100 : appliedCoupon.discountValue) : 0,
      tax: Number((cartSubtotal * 0.05).toFixed(2)),
      shippingFee: hasPhysical ? 0 : 0,
      total: Number((cartSubtotal * 1.05).toFixed(2)),
      paymentMethod: orderData.paymentMethod || 'stripe',
      paymentGateway: orderData.paymentMethod || 'stripe',
      paymentStatus: 'paid',
      paymentTransactionId: `tx_${Math.random().toString(36).substring(2, 10)}`,
      fulfillmentStatus: hasPhysical ? 'partially_fulfilled' : 'delivered_digital',
      deliveryStatus: hasPhysical ? 'dispatched' : 'instant_ready',
      orderStatus: 'completed',
      couponCode: appliedCoupon?.code,
      customerNotes: orderData.customerNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    setAppliedCoupon(null);
    addToast('success', 'Order Confirmed!', `Order #${newOrder.orderNumber} successfully processed.`);
    return newOrder;
  };

  const updateOrderShipment = (orderId: string, trackingNumber: string, carrier: string, status: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          deliveryStatus: status === 'delivered' ? 'delivered' : 'in_transit',
          fulfillmentStatus: 'shipped_physical',
          items: o.items.map(item => {
            if (item.productType === 'physical_projector') {
              return {
                ...item,
                trackingNumber,
                shipment: {
                  trackingNumber,
                  carrier,
                  status,
                  estimatedDelivery: '2026-08-25'
                }
              };
            }
            return item;
          })
        };
      }
      return o;
    }));
    addToast('success', 'Shipment Dispatched', `Tracking ${trackingNumber} updated.`);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: status } : o));
    addToast('success', 'Order Status Updated', `Order #${orderId} set to ${status}.`);
  };

  // =========================================================
  // IPTV M3U — Server & Credential management
  // =========================================================

  const addIptvServer = (server: Omit<IptvServer, 'id' | 'lastCheckedAt' | 'activeConnections'>) => {
    const newServer: IptvServer = {
      ...server,
      id: `iptv-${Date.now()}`,
      activeConnections: 0,
      lastCheckedAt: new Date().toISOString(),
    };
    setIptvServers(prev => [...prev, newServer]);
    addToast('success', 'Server Added', `${newServer.name} added to IPTV server registry.`);
  };

  const toggleIptvServer = (id: string) => {
    setIptvServers(prev => prev.map(s => s.id === id ? {
      ...s,
      isActive: !s.isActive,
      status: !s.isActive ? 'online' : 'offline',
      activeConnections: !s.isActive ? s.activeConnections : 0,
    } : s));
    const target = iptvServers.find(s => s.id === id);
    if (target) {
      addToast('info', target.isActive ? 'Server Paused' : 'Server Activated', `${target.name} is now ${target.isActive ? 'paused' : 'live'}.`);
    }
  };

  const deleteIptvServer = (id: string) => {
    const target = iptvServers.find(s => s.id === id);
    setIptvServers(prev => prev.filter(s => s.id !== id));
    // Revoke any credentials assigned to this server
    setIptvCredentials(prev => prev.map(c => c.serverId === id ? { ...c, status: 'revoked' as const } : c));
    if (target) addToast('info', 'Server Removed', `${target.name} removed from registry.`);
  };

  const refreshIptvServerHealth = (id: string) => {
    const now = new Date().toISOString();
    setIptvServers(prev => prev.map(s => {
      if (s.id !== id) return s;
      // Simulate a fresh health probe — jitter the uptime/buffer slightly so the user sees a change
      const jitterUptime = s.status === 'online' ? Math.min(99.99, s.uptime + (Math.random() * 0.05)) : s.uptime;
      const jitterBuffer = s.status === 'online' ? Math.max(0.1, s.bufferRate - (Math.random() * 0.1)) : s.bufferRate;
      return { ...s, lastCheckedAt: now, uptime: Number(jitterUptime.toFixed(2)), bufferRate: Number(jitterBuffer.toFixed(2)) };
    }));
    const target = iptvServers.find(s => s.id === id);
    if (target) addToast('success', 'Health Re-checked', `${target.name} probes completed at ${new Date().toLocaleTimeString()}.`);
  };

  const provisionIptvCredential = (credential: { assignedTo: string; serverId: string; expiresAt: string }) => {
    const server = iptvServers.find(s => s.id === credential.serverId);
    if (!server) {
      addToast('error', 'Provisioning Failed', 'Selected server no longer exists.');
      return;
    }
    const newCred: IptvCredential = {
      id: `iptv-cred-${Date.now()}`,
      username: `pb_user_${Math.floor(10000 + Math.random() * 89999)}`,
      // Real password is never persisted client-side; only a masked placeholder is stored.
      passwordMasked: '••••••••••••',
      assignedTo: credential.assignedTo,
      serverId: credential.serverId,
      serverName: server.name,
      expiresAt: credential.expiresAt,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    setIptvCredentials(prev => [newCred, ...prev]);
    // Bump the server's active connection count
    setIptvServers(prev => prev.map(s => s.id === credential.serverId ? { ...s, activeConnections: s.activeConnections + 1 } : s));
    addToast('success', 'Credential Provisioned', `IPTV access for ${credential.assignedTo} issued on ${server.name}.`);
  };

  const revokeIptvCredential = (id: string) => {
    const target = iptvCredentials.find(c => c.id === id);
    setIptvCredentials(prev => prev.map(c => c.id === id ? { ...c, status: 'revoked' } : c));
    // Decrement the server's active connection count
    if (target) {
      setIptvServers(prev => prev.map(s => s.id === target.serverId ? { ...s, activeConnections: Math.max(0, s.activeConnections - 1) } : s));
      addToast('info', 'Credential Revoked', `Access for ${target.assignedTo} has been revoked.`);
    }
  };

  // =========================================================
  // WooCommerce Bridge — connections & conflict resolution
  // =========================================================

  const addWooCommerceConnection = (conn: Omit<WooCommerceConnection, 'id' | 'lastSyncAt' | 'productsSynced' | 'ordersSynced' | 'pendingConflicts'>) => {
    const newConn: WooCommerceConnection = {
      ...conn,
      id: `woo-conn-${Date.now()}`,
      lastSyncAt: new Date().toISOString(),
      productsSynced: 0,
      ordersSynced: 0,
      pendingConflicts: 0,
    };
    setWooCommerceConnections(prev => [...prev, newConn]);
    addToast('success', 'Store Connected', `${newConn.storeName} is now linked to PlayBeat.`);
  };

  const toggleWooCommerceConnection = (id: string) => {
    setWooCommerceConnections(prev => prev.map(c => c.id === id ? {
      ...c,
      status: c.status === 'disconnected' ? 'connected' : 'disconnected',
    } : c));
    const target = wooCommerceConnections.find(c => c.id === id);
    if (target) addToast('info', target.status === 'disconnected' ? 'Store Reconnected' : 'Store Disconnected', `${target.storeName} is now ${target.status === 'disconnected' ? 'connected' : 'disconnected'}.`);
  };

  const deleteWooCommerceConnection = (id: string) => {
    const target = wooCommerceConnections.find(c => c.id === id);
    setWooCommerceConnections(prev => prev.filter(c => c.id !== id));
    // Drop any pending conflicts for this connection
    setSyncConflicts(prev => prev.filter(conf => conf.connectionId !== id));
    if (target) addToast('info', 'Connection Removed', `${target.storeName} has been delinked.`);
  };

  const syncWooCommerceConnection = (id: string) => {
    const target = wooCommerceConnections.find(c => c.id === id);
    if (!target) return;
    // Mark as syncing
    setWooCommerceConnections(prev => prev.map(c => c.id === id ? { ...c, status: 'syncing' } : c));
    addToast('info', 'Sync Started', `Pulling products and orders from ${target.storeName}...`);
    // Simulate async sync completion after ~1s
    setTimeout(() => {
      setWooCommerceConnections(prev => prev.map(c => c.id === id ? {
        ...c,
        status: 'connected',
        lastSyncAt: new Date().toISOString(),
        productsSynced: c.productsSynced + Math.floor(Math.random() * 5),
        ordersSynced: c.ordersSynced + Math.floor(Math.random() * 12),
      } : c));
      addToast('success', 'Sync Complete', `${target.storeName} is up to date.`);
    }, 1100);
  };

  const resolveSyncConflict = (id: string, resolution: 'resolved_local' | 'resolved_remote') => {
    const target = syncConflicts.find(c => c.id === id);
    if (!target) return;
    setSyncConflicts(prev => prev.map(c => c.id === id ? { ...c, status: resolution } : c));
    // Decrement the connection's pending-conflict counter
    setWooCommerceConnections(prev => prev.map(c => c.id === target.connectionId ? {
      ...c,
      pendingConflicts: Math.max(0, c.pendingConflicts - 1),
    } : c));
    const label = resolution === 'resolved_local' ? 'local (PlayBeat)' : 'remote (WooCommerce)';
    addToast('success', 'Conflict Resolved', `${target.productTitle} kept ${label} value.`);
  };

  // =========================================================
  // Subscriptions — plans & customer subscriptions
  // =========================================================

  const createSubscriptionPlan = (plan: Omit<SubscriptionPlan, 'id' | 'subscribers' | 'mrr'>) => {
    const newPlan: SubscriptionPlan = {
      ...plan,
      id: `plan-${Date.now()}`,
      subscribers: 0,
      mrr: 0,
    };
    setSubscriptionPlans(prev => [newPlan, ...prev]);
    addToast('success', 'Plan Created', `${newPlan.name} (${newPlan.billingCycle}) is now live.`);
  };

  const updateSubscriptionPlan = (id: string, updates: Partial<SubscriptionPlan>) => {
    setSubscriptionPlans(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    const target = subscriptionPlans.find(p => p.id === id);
    if (target) addToast('success', 'Plan Updated', `${target.name} has been updated.`);
  };

  const archiveSubscriptionPlan = (id: string) => {
    setSubscriptionPlans(prev => prev.map(p => p.id === id ? {
      ...p,
      status: 'archived',
      isActive: false,
    } : p));
    const target = subscriptionPlans.find(p => p.id === id);
    if (target) addToast('info', 'Plan Archived', `${target.name} is no longer available for new sign-ups.`);
  };

  const retryFailedSubscription = (id: string) => {
    const target = customerSubscriptions.find(s => s.id === id);
    if (!target) return;
    // Simulate a retry — 75% success rate
    const success = Math.random() < 0.75;
    if (success) {
      setCustomerSubscriptions(prev => prev.map(s => s.id === id ? {
        ...s,
        status: 'active',
        failedAttempts: 0,
        renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } : s));
      addToast('success', 'Payment Recovered', `${target.customerName}'s subscription is now active.`);
    } else {
      setCustomerSubscriptions(prev => prev.map(s => s.id === id ? {
        ...s,
        failedAttempts: s.failedAttempts + 1,
      } : s));
      addToast('error', 'Retry Failed', `Payment attempt ${target.failedAttempts + 1} failed for ${target.customerName}.`);
    }
  };

  const cancelSubscription = (id: string) => {
    const target = customerSubscriptions.find(s => s.id === id);
    if (!target) return;
    setCustomerSubscriptions(prev => prev.map(s => s.id === id ? { ...s, status: 'cancelled' } : s));
    // Decrement the plan's subscriber count
    setSubscriptionPlans(prev => prev.map(p => p.id === target.planId ? {
      ...p,
      subscribers: Math.max(0, p.subscribers - 1),
      mrr: Math.max(0, p.mrr - (target.billingCycle === 'yearly' ? target.amount / 12 : target.amount)),
    } : p));
    addToast('info', 'Subscription Cancelled', `${target.customerName}'s ${target.planName} has been cancelled.`);
  };

  // =========================================================
  // Website Builder CMS
  // =========================================================

  const createWebsitePage = (page: Omit<WebsitePage, 'id' | 'lastEditedAt'>) => {
    const newPage: WebsitePage = {
      ...page,
      id: `page-${Date.now()}`,
      lastEditedAt: new Date().toISOString(),
    };
    setWebsitePages(prev => [newPage, ...prev]);
    addToast('success', 'Page Created', `${newPage.title} added as ${newPage.status}.`);
  };

  const updateWebsitePage = (id: string, updates: Partial<WebsitePage>) => {
    setWebsitePages(prev => prev.map(p => p.id === id ? { ...p, ...updates, lastEditedAt: new Date().toISOString() } : p));
    const target = websitePages.find(p => p.id === id);
    if (target) addToast('success', 'Page Saved', `${target.title} has been updated.`);
  };

  const publishWebsitePage = (id: string) => {
    setWebsitePages(prev => prev.map(p => p.id === id ? {
      ...p,
      status: 'published',
      publishedAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
    } : p));
    const target = websitePages.find(p => p.id === id);
    if (target) addToast('success', 'Page Published', `${target.title} is now live.`);
  };

  const deleteWebsitePage = (id: string) => {
    const target = websitePages.find(p => p.id === id);
    setWebsitePages(prev => prev.filter(p => p.id !== id));
    if (target) addToast('info', 'Page Deleted', `${target.title} has been removed.`);
  };

  // =========================================================
  // Support Tickets
  // =========================================================

  const createSupportTicket = (input: { subject: string; message: string }) => {
    const now = new Date().toISOString();
    const customerName = currentUser.id === 'guest' ? 'Website Visitor' : currentUser.name;
    const customerEmail = currentUser.id === 'guest' ? 'visitor@playbeat.digital' : currentUser.email;
    const ticket: SupportTicket = {
      id: `CHAT-${Date.now()}`,
      subject: input.subject,
      customerName,
      customerEmail,
      priority: 'normal',
      status: 'open',
      channel: 'in_app',
      assignedTo: 'Unassigned',
      slaMinutesRemaining: 30,
      createdAt: now,
      lastReplyAt: now,
      messageCount: 1,
      latestMessage: input.message,
    };
    setSupportTickets(prev => [ticket, ...prev]);
    addToast('success', 'Message Sent', 'Your support request is now in the admin inbox.');
  };

  const replyToSupportTicket = (id: string, message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;
    setSupportTickets(prev => prev.map(ticket => ticket.id === id ? {
      ...ticket,
      latestMessage: trimmedMessage,
      messageCount: ticket.messageCount + 1,
      lastReplyAt: new Date().toISOString(),
      status: 'waiting_on_customer',
    } : ticket));
    addToast('success', 'Reply Sent', 'Your response was added to the support conversation.');
  };

  const updateTicketStatus = (id: string, status: TicketStatus) => {
    setSupportTickets(prev => prev.map(t => t.id === id ? { ...t, status, lastReplyAt: new Date().toISOString() } : t));
    const target = supportTickets.find(t => t.id === id);
    if (target) addToast('success', 'Ticket Updated', `${target.id} marked as ${status.replace(/_/g, ' ')}.`);
  };

  const assignTicket = (id: string, assignee: string) => {
    setSupportTickets(prev => prev.map(t => t.id === id ? { ...t, assignedTo: assignee } : t));
    addToast('info', 'Ticket Assigned', `Ticket ${id} assigned to ${assignee}.`);
  };

  // =========================================================
  // Social Automation
  // =========================================================

  const schedulePost = (post: Omit<ScheduledPost, 'id'>) => {
    const newPost: ScheduledPost = { ...post, id: `POST-${Date.now()}` };
    setScheduledPosts(prev => [newPost, ...prev]);
    addToast('success', 'Post Scheduled', `Post scheduled for ${new Date(post.scheduledAt).toLocaleString()}.`);
  };

  const deleteScheduledPost = (id: string) => {
    setScheduledPosts(prev => prev.filter(p => p.id !== id));
    addToast('info', 'Post Deleted', 'Scheduled post removed.');
  };

  // =========================================================
  // TikTok Leads
  // =========================================================

  const updateLeadStatus = (id: string, status: LeadStatus) => {
    setTiktokLeads(prev => prev.map(l => l.id === id ? {
      ...l,
      status,
      followedUpAt: status !== 'new' ? new Date().toISOString() : l.followedUpAt,
    } : l));
    addToast('success', 'Lead Updated', `Lead marked as ${status}.`);
  };

  // =========================================================
  // Email & SMS Campaigns
  // =========================================================

  const pauseCampaign = (id: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'paused' } : c));
    const target = campaigns.find(c => c.id === id);
    if (target) addToast('info', 'Campaign Paused', `${target.name} has been paused.`);
  };

  const resumeCampaign = (id: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'sending' } : c));
    const target = campaigns.find(c => c.id === id);
    if (target) addToast('success', 'Campaign Resumed', `${target.name} is now sending.`);
  };

  const setGrowthAutomationEnabled = (enabled: boolean) => {
    setGrowthAutomationEnabledState(enabled);
    try { localStorage.setItem('playbeat-growth-automation-enabled', String(enabled)); } catch { /* keep session state */ }
  };

  const resetGrowthAutomation = () => {
    setScheduledPosts([]);
    setTiktokLeads([]);
    setCampaigns([]);
    setCoupons([]);
    setGrowthAutomationResetAt(Date.now());
    addToast('success', 'Growth Automation Reset', 'TikTok leads, social posts, campaigns, and promo codes were cleared.');
  };

  // =========================================================
  // Payment Proofs
  // =========================================================

  const approvePaymentProof = (id: string, reviewerName: string) => {
    setPaymentProofs(prev => prev.map(p => p.id === id ? {
      ...p,
      status: 'approved' as ProofStatus,
      reviewedBy: reviewerName,
      reviewedAt: new Date().toISOString(),
    } : p));
    const target = paymentProofs.find(p => p.id === id);
    if (target) addToast('success', 'Proof Approved', `Proof from ${target.customerName} approved.`);
  };

  const rejectPaymentProof = (id: string, reviewerName: string) => {
    setPaymentProofs(prev => prev.map(p => p.id === id ? {
      ...p,
      status: 'rejected' as ProofStatus,
      reviewedBy: reviewerName,
      reviewedAt: new Date().toISOString(),
    } : p));
    const target = paymentProofs.find(p => p.id === id);
    if (target) addToast('info', 'Proof Rejected', `Proof from ${target.customerName} rejected.`);
  };

  // =========================================================
  // Security & Audit Logs
  // =========================================================

  const rotateSecret = (id: string) => {
    setSecretRotations(prev => prev.map(s => s.id === id ? {
      ...s,
      lastRotatedAt: new Date().toISOString(),
      isOverdue: false,
    } : s));
    const target = secretRotations.find(s => s.id === id);
    if (target) addToast('success', 'Secret Rotated', `${target.secretName} rotation completed. Update your environment variables.`);
  };

  const updateContent = (newContent: Partial<ContentSection>) => {
    setContent(prev => ({ ...prev, ...newContent }));
    fetch('/api/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newContent)
    }).then(async response => {
      const data = await response.json().catch(() => null);
      if (response.ok && data?.content) setContent(data.content);
    }).catch(() => {});
    addToast('success', 'Storefront Updated', 'Homepage banners and announcements updated.');
  };

  const updateG2GConnector = (conn: Partial<G2GSupplierConnector>) => {
    setG2GConnector(prev => ({ ...prev, ...conn }));
    fetch('/api/import/g2g-connector', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conn)
    }).catch(() => {});
    addToast('success', 'G2G Configuration Saved', 'Supplier markup & category sync settings updated.');
  };

  const updateG2GSettings = (settings: Partial<G2GSettingsState>) => {
    setG2GSettings(prev => ({ ...prev, ...settings }));
    addToast('success', 'Wholesale Settings Saved', 'G2G profit margin and sync frequency updated.');
  };

  const syncG2GCatalog = async () => {
    try {
      const res = await fetch('/api/import/g2g-sync', { method: 'POST' });
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (e) {
      console.warn('API sync fallback to client simulation');
    }
    setG2GSettings(prev => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
    addToast('success', 'Catalog Synchronized', 'Wholesale products & live stock updated from G2G supplier.');
  };

  const cleanAllProductVariations = () => {
    setProducts(prev => prev.map(p => {
      if (!p.variations || p.variations.length <= 1) return p;
      const seen = new Set<string>();
      const clean: ProductVariation[] = [];
      for (const v of p.variations) {
        const key = `${v.type.toLowerCase().trim()}_${v.value.toLowerCase().trim()}`;
        if (!seen.has(key)) {
          seen.add(key);
          clean.push(v);
        }
      }
      return { ...p, variations: clean };
    }));
    addToast('success', 'Deduplication Complete', 'All redundant SKU options cleaned across catalog.');
  };

  const refreshProducts = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.products) setProducts(data.products);
      })
      .catch(() => {});
  };

  const addProduct = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    }).catch(() => {});
    addToast('success', 'Product Added', `${newProduct.title} added to catalog.`);
  };

  const updateProduct = (productOrId: Product | string, maybeUpdates?: Partial<Product>) => {
    if (typeof productOrId === 'string') {
      const id = productOrId;
      const updates = maybeUpdates || {};
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
      fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }).catch(() => {});
    } else {
      const updatedProduct = productOrId;
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      fetch(`/api/products/${updatedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      }).catch(() => {});
    }
    addToast('success', 'Product Updated', 'Changes saved successfully.');
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    fetch(`/api/products/${id}`, { method: 'DELETE' }).catch(() => {});
    addToast('info', 'Product Deleted', 'Item removed from database.');
  };

  const approveProduct = (id: string) => {
    updateProduct(id, { status: 'published' });
    addToast('success', 'Product Approved', 'Product is now live on the storefront.');
  };

  const addNavItem = (item: Omit<NavItem, 'id'>) => {
    const newItem: NavItem = {
      ...item,
      id: `nav-${Date.now()}`
    };
    setNavItems(prev => {
      const next = [...prev, newItem];
      fetch('/api/navigation', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: next }) }).catch(() => {});
      return next;
    });
    addToast('success', 'Navigation Item Added', `"${item.label}" added to menu.`);
  };

  const updateNavItem = (id: string, updates: Partial<NavItem>) => {
    setNavItems(prev => {
      const next = prev.map(item => item.id === id ? { ...item, ...updates } : item);
      fetch('/api/navigation', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: next }) }).catch(() => {});
      return next;
    });
    addToast('success', 'Navigation Updated', 'Menu item saved successfully.');
  };

  const deleteNavItem = (id: string) => {
    setNavItems(prev => {
      const next = prev.filter(item => item.id !== id);
      fetch('/api/navigation', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: next }) }).catch(() => {});
      return next;
    });
    addToast('info', 'Navigation Item Removed', 'Menu item deleted.');
  };

  const reorderNavItems = (newItems: NavItem[]) => {
    const next = newItems.map((item, idx) => ({ ...item, order: idx + 1 }));
    setNavItems(next);
    fetch('/api/navigation', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: next }) }).catch(() => {});
  };

  const toggleNavItemActive = (id: string) => {
    setNavItems(prev => {
      const next = prev.map(item => item.id === id ? { ...item, isActive: !item.isActive } : item);
      fetch('/api/navigation', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: next }) }).catch(() => {});
      return next;
    });
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        productTypeFilter,
        setProductTypeFilter,
        
        navItems,
        setNavItems,
        addNavItem,
        updateNavItem,
        deleteNavItem,
        reorderNavItems,
        toggleNavItemActive,
        activePromoFilter,
        setActivePromoFilter,
        
        activeView,
        setActiveView,
        adminTab,
        setAdminTab,
        selectedProduct,
        setSelectedProduct,
        isCartOpen,
        setIsCartOpen,
        isWishlistOpen,
        setIsWishlistOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authMode,
        setAuthMode,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isCustomerPortalOpen,
        setIsCustomerPortalOpen,
        isWhatsAppModalOpen,
        setIsWhatsAppModalOpen,
        isCompareModalOpen,
        setIsCompareModalOpen,
        
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartSubtotal,
        cartCount,
        isInCart,
        
        wishlist,
        toggleWishlist,
        
        compareList,
        toggleCompare,
        clearCompare,
        
        currentUser,
        switchUserRole,
        setCurrentUser,
        brandingLogoUrl,
        setBrandingLogoUrl: updateBrandingLogoUrl,
        
        orders,
        createOrder,
        updateOrderShipment,
        updateOrderStatus,
        
        content,
        updateContent,
        coupons,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        addCoupon,
        deleteCoupon,
        
        g2gConnector,
        g2gSettings,
        updateG2GConnector,
        updateG2GSettings,
        syncG2GCatalog,
        importJobs,
        adminLogs,
        refreshProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        approveProduct,
        cleanAllProductVariations,
        
        toasts,
        addToast,
        removeToast,

        currency,
        setCurrency,
        formatPrice,

        // IPTV M3U
        iptvServers,
        iptvCredentials,
        addIptvServer,
        toggleIptvServer,
        deleteIptvServer,
        refreshIptvServerHealth,
        provisionIptvCredential,
        revokeIptvCredential,

        // WooCommerce Bridge
        wooCommerceConnections,
        syncConflicts,
        addWooCommerceConnection,
        toggleWooCommerceConnection,
        deleteWooCommerceConnection,
        syncWooCommerceConnection,
        resolveSyncConflict,

        // Subscriptions
        subscriptionPlans,
        customerSubscriptions,
        createSubscriptionPlan,
        updateSubscriptionPlan,
        archiveSubscriptionPlan,
        retryFailedSubscription,
        cancelSubscription,

        // Website Builder
        websitePages,
        blockLibrary,
        createWebsitePage,
        updateWebsitePage,
        publishWebsitePage,
        deleteWebsitePage,

        // Analytics
        analyticsMetrics,
        funnelSteps,

        // Support Tickets
        supportTickets,
        createSupportTicket,
        replyToSupportTicket,
        updateTicketStatus,
        assignTicket,

        // Social Automation
        scheduledPosts,
        schedulePost,
        deleteScheduledPost,

        // TikTok Leads
        tiktokLeads,
        updateLeadStatus,

        // Email & SMS Campaigns
        campaigns,
        pauseCampaign,
        resumeCampaign,
        growthAutomationEnabled,
        setGrowthAutomationEnabled,
        resetGrowthAutomation,
        growthAutomationResetAt,

        // Financial Balance
        gatewayBalances,

        // JazzCash
        jazzcashTransactions,

        // Payment Proofs
        paymentProofs,
        approvePaymentProof,
        rejectPaymentProof,

        // Security & Audit Logs
        loginAttempts,
        secretRotations,
        rotateSecret
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
