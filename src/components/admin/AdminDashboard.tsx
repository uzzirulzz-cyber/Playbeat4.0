import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  TrendingUp,
  CheckCircle2,
  Globe,
  Server,
  ShieldCheck,
  PackageCheck,
  Package,
  ShoppingCart,
  BellRing,
  Activity,
  ArrowUpRight,
  ArrowRight,
  CircleCheck,
  Cpu,
  Network,
  CreditCard,
  Database,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  Loader2,
  X,
  Play,
  BarChart3,
  FileText,
  Calendar,
  ChevronDown,
  Download,
  RefreshCw,
  Settings,
  Upload,
  UserPlus,
  Users,
  Megaphone,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { WeatherWidget } from './WeatherWidget';

/**
 * New admin dashboard matching the screenshot.
 *
 * Layout (top-to-bottom):
 *   Row 1: Revenue Trend (wide) + Order Breakdown (donut) + Traffic Sources (bars)
 *   Row 2: System Status (list) + Pending Approvals (empty state) + Live Notifications
 *   Row 3: Recent Orders table + Top Products list
 *
 * Includes a destructive reset that clears application data while retaining
 * the Super Admin account for future access.
 */
export const AdminDashboard: React.FC = () => {
  const { orders, products, formatPrice, addToast, setAdminTab, brandingLogoUrl, setBrandingLogoUrl } = useStore();
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  // Retained for backwards-compatible settings markup; the reference toolbar no longer exposes this modal.
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<'1D' | '1W' | '1M' | '1Y'>('1W');
  const [customerCount, setCustomerCount] = useState(0);
  const [dbHealthy, setDbHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/users').then(response => response.ok ? response.json() : { users: [] }),
      fetch('/api/health/db').then(response => response.ok ? response.json() : { ok: false }),
    ]).then(([usersData, healthData]) => {
      setCustomerCount(Array.isArray(usersData.users) ? usersData.users.filter((user: any) => user.role === 'customer' && user.status !== 'deleted').length : 0);
      setDbHealthy(Boolean(healthData.ok));
    }).catch(() => setDbHealthy(false));
  }, [orders.length, products.length]);

  const handleReset = async () => {
    if (confirmText !== 'RESET') {
      addToast('error', 'Confirmation Required', 'Type RESET to confirm.');
      return;
    }
    setResetting(true);
    try {
      const res = await fetch('/api/admin/reset-db', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'Database Reset', 'Funds, orders, leads, and application data were cleared to zero. Reloading...');
        setIsResetOpen(false);
        setConfirmText('');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        addToast('error', 'Reset Failed', data.error || 'Could not reset database.');
      }
    } catch {
      addToast('error', 'Reset Failed', 'Network error.');
    }
    setResetting(false);
  };

  const revenueData = useMemo(() => Array.from({ length: 14 }, (_, offset) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (13 - offset));
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const dayOrders = orders.filter(order => {
      const created = new Date(order.createdAt);
      return created >= date && created < next;
    });
    return { date: date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }), revenue: dayOrders.filter(order => order.paymentStatus === 'paid').reduce((sum, order) => sum + order.total, 0), orders: dayOrders.length };
  }), [orders]);
  const maxDailyRevenue = Math.max(...revenueData.map(point => point.revenue), 1);

  // Order breakdown — most orders completed
  const completedOrders = orders.filter(o => o.orderStatus === 'completed').length;
  const processingOrders = orders.filter(o => o.orderStatus === 'processing').length;
  const totalOrdersCount = orders.length;
  const completionRate = totalOrdersCount > 0 ? Math.round((completedOrders / totalOrdersCount) * 100) : 0;

  // Traffic attribution is intentionally empty until a real analytics source is configured.
  const trafficSources: { label: string; percent: number; count: number; color: string }[] = [];

  // System status
  const systemStatus = [
    { icon: Server, label: 'API Server', status: 'Operational', state: 'green' },
    { icon: Database, label: 'Database', status: dbHealthy === null ? 'Checking' : dbHealthy ? 'Connected' : 'Unavailable', state: dbHealthy ? 'green' : 'amber' },
  ];

  // Live notifications — pull from recent orders if available
  const liveNotifications = orders.slice(0, 2).map((o, i) => ({
    title: i === 0 ? 'Order Verified' : 'New Order',
    message: `${o.customerName} — ${o.items[0]?.productTitle || 'Order'} #${o.id}`,
    time: '1h ago',
  }));
  // Fallbacks if no orders in store
  const notifications = liveNotifications;

  // Recent orders (last 5)
  const recentOrders = orders.slice(0, 3);

  // Top products (highest totalSold)
  const topProducts = [...products]
    .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
    .slice(0, 3);

  // Donut chart values
  const donutSize = 120;
  const donutStroke = 12;
  const donutRadius = (donutSize - donutStroke) / 2;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const donutOffset = donutCircumference * (1 - completionRate / 100);

  return (
    <div className="dashboard-reference space-y-3">
      <div className="flex items-center justify-between gap-4 flex-wrap rounded-xl border border-[#1f3558] bg-[#071224]/75 px-4 py-3">
        <div>
          <h1 className="text-xl font-bold text-white font-display">Welcome back, PlayBeat Admin! 👋</h1>
          <p className="text-xs text-gray-500 mt-0.5">Here’s what’s happening with your business today.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-glossy btn-glossy-dark btn-glossy-sm"><Calendar className="w-3.5 h-3.5" />This Week<ChevronDown className="w-3 h-3" /></button>
          <button className="btn-glossy btn-glossy-dark btn-glossy-sm"><Download className="w-3.5 h-3.5" />Export<ChevronDown className="w-3 h-3" /></button>
          <button onClick={() => window.location.reload()} className="btn-glossy btn-glossy-yellow btn-glossy-sm !text-black"><RefreshCw className="w-3.5 h-3.5" />Refresh</button>
        </div>
      </div>

      {/* ============================================
          WEATHER + CLOCK WIDGET
          Live local time + current weather + 4-day forecast.
          Uses the free Open-Meteo API (no API key required).
          City is persisted to localStorage so the user's choice is remembered.
          ============================================ */}
      <div className="hidden"><WeatherWidget /></div>

      {/* ============================================
          COLORFUL KPI CARDS WITH SPARKLINES (Flare UI style)
          Each card: solid colored bg, large bold number, trend badge, mini sparkline
          ============================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue — emerald glossy card */}
        <button className="dashboard-kpi dashboard-kpi-revenue text-left rounded-xl p-5 overflow-hidden relative border-2 border-emerald-400/30 transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(180deg, #047857 0%, #064E3B 100%)', boxShadow: '0 10px 25px rgba(4,120,87,0.3), 0 0 20px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase text-emerald-100 tracking-wider font-mono font-bold">Total Revenue</div>
            <TrendingUp className="w-4 h-4 text-emerald-200" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{formatPrice(orders.reduce((s, o) => s + (o.paymentStatus === 'paid' ? o.total : 0), 0))}</div>
          <div className="text-[10px] text-emerald-200 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Based on paid orders
          </div>
          <div className="flex items-end gap-0.5 mt-3 h-8">
            {revenueData.slice(-10).map((point, i) => (
              <div key={i} className="flex-1 bg-emerald-300/40 rounded-sm" style={{ height: `${Math.max(8, (point.revenue / maxDailyRevenue) * 100)}%` }} />
            ))}
          </div>
        </button>

        {/* Orders — blue glossy card */}
        <button className="dashboard-kpi dashboard-kpi-orders text-left rounded-xl p-5 overflow-hidden relative border-2 border-blue-400/30 transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(180deg, #2563EB 0%, #1E40AF 100%)', boxShadow: '0 10px 25px rgba(37,99,235,0.3), 0 0 20px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase text-blue-100 tracking-wider font-mono font-bold">Total Orders</div>
            <ShoppingCart className="w-4 h-4 text-blue-200" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{orders.length}</div>
          <div className="text-[10px] text-blue-200 mt-1 flex items-center gap-1">
            <ShoppingCart className="w-3 h-3" /> All recorded orders
          </div>
          <div className="flex items-end gap-0.5 mt-3 h-8">
            {revenueData.slice(-10).map((point, i) => (
              <div key={i} className="flex-1 bg-blue-300/40 rounded-sm" style={{ height: `${Math.max(8, Math.min(100, point.orders * 10))}%` }} />
            ))}
          </div>
        </button>

        {/* Products — purple glossy card */}
        <button className="dashboard-kpi dashboard-kpi-products text-left rounded-xl p-5 overflow-hidden relative border-2 border-purple-400/30 transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(180deg, #7E22CE 0%, #581C87 100%)', boxShadow: '0 10px 25px rgba(126,34,206,0.3), 0 0 20px rgba(147,51,234,0.15), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase text-purple-100 tracking-wider font-mono font-bold">Products</div>
            <Package className="w-4 h-4 text-purple-200" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{products.length}</div>
          <div className="text-[10px] text-purple-200 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> {products.filter(p => p.status === 'published').length} published
          </div>
          <div className="flex items-end gap-0.5 mt-3 h-8">
            {Array.from({ length: Math.max(1, Math.min(10, products.length)) }, (_, i) => (
              <div key={i} className="flex-1 bg-purple-300/40 rounded-sm" style={{ height: `${Math.max(10, ((i + 1) / Math.max(products.length, 1)) * 100)}%` }} />
            ))}
          </div>
        </button>

        {/* Customers — cyan glossy card */}
        <button className="dashboard-kpi dashboard-kpi-customers text-left rounded-xl p-5 overflow-hidden relative border-2 border-cyan-400/30 transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(180deg, #0e7490 0%, #164e63 100%)', boxShadow: '0 10px 25px rgba(8,145,178,0.3), 0 0 20px rgba(34,211,238,0.15), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase text-cyan-100 tracking-wider font-mono font-bold">Total Customers</div>
            <Users className="w-4 h-4 text-cyan-200" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{customerCount}</div>
          <div className="text-[10px] text-cyan-200 mt-1 flex items-center gap-1">
            <Users className="w-3 h-3" /> From registered customer records
          </div>
          <div className="flex items-end gap-0.5 mt-3 h-8">
            {Array.from({ length: Math.max(1, Math.min(10, customerCount || 1)) }, (_, i) => (
              <div key={i} className="flex-1 bg-cyan-300/40 rounded-sm" style={{ height: `${Math.max(10, ((i + 1) / Math.max(customerCount, 1)) * 100)}%` }} />
            ))}
          </div>
        </button>
      </div>

      {/* ============================================
          ROW 1 — KEY METRICS
          ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Revenue Trend — spans wider */}
        <div className="admin-card p-4 lg:col-span-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Revenue Overview</h3>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 font-mono">Live 14-Day Cycle</p>
            </div>
            <span className="admin-pill-green flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              Paid orders
            </span>
          </div>
          <div className="h-[180px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#facc15" stopOpacity={0.42} />
                    <stop offset="100%" stopColor="#facc15" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: '#1f2937' }}
                  tickLine={false}
                  interval={3}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0a0b0d',
                    border: '1px solid #252b3b',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#f9fafb',
                  }}
                  labelStyle={{ color: '#9ca3af', fontFamily: 'JetBrains Mono', fontSize: 10 }}
                  formatter={(value: any) => [`Rs ${value.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#facc15"
                  strokeWidth={2.5}
                  fill="url(#revGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#facc15', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Breakdown — donut */}
        <div className="admin-card p-4 lg:col-span-3">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Order Breakdown</h3>
            </div>
            <span className="text-[10px] text-gray-500 font-mono">{completionRate}% Fulfilled</span>
          </div>
          <div className="flex flex-col items-center justify-center py-3">
            <div className="relative" style={{ width: donutSize, height: donutSize }}>
              <svg width={donutSize} height={donutSize} className="-rotate-90">
                <circle
                  cx={donutSize / 2}
                  cy={donutSize / 2}
                  r={donutRadius}
                  fill="none"
                  stroke="#1f2937"
                  strokeWidth={donutStroke}
                />
                <circle
                  cx={donutSize / 2}
                  cy={donutSize / 2}
                  r={donutRadius}
                  fill="none"
                  stroke="#facc15"
                  strokeWidth={donutStroke}
                  strokeLinecap="round"
                  strokeDasharray={donutCircumference}
                  strokeDashoffset={donutOffset}
                  style={{ filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))', transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white font-mono">{totalOrdersCount}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Total</span>
              </div>
            </div>
            <div className="mt-4 space-y-1 w-full">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-gray-400">Completed</span>
                </div>
                <span className="text-white font-mono font-semibold">{completedOrders}</span>
              </div>
              {processingOrders > 0 && (
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-gray-400">Processing</span>
                  </div>
                  <span className="text-white font-mono font-semibold">{processingOrders}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Traffic Sources — horizontal bars */}
        <div className="admin-card p-4 lg:col-span-3">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Traffic Sources</h3>
            </div>
            <span className="admin-pill-blue">Configured sources only</span>
          </div>
          <div className="space-y-2.5">
            {trafficSources.map((src) => (
              <div key={src.label}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-gray-300 truncate pr-2">{src.label}</span>
                  <span className="text-gray-500 font-mono">
                    <span className="text-white font-semibold">{src.percent}%</span> ({src.count})
                  </span>
                </div>
                <div className="h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${src.percent}%`, background: src.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          {trafficSources.length === 0 && <p className="text-[10px] text-gray-600 mt-3 font-mono">No traffic provider is connected yet.</p>}
        </div>
      </div>

      {/* ============================================
          ROW 3 — DATA TABLES
          ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Recent Orders */}
        <div className="admin-card p-4 lg:col-span-4 order-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Orders</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Latest transactions dispatched across Pakistan</p>
            </div>
            <span className="admin-pill-blue">{recentOrders.length} Total</span>
          </div>
          {recentOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">
              No recent orders yet — orders will appear here once customers check out.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-[#1f2937] text-gray-500 uppercase text-[10px] tracking-wider font-mono">
                    <th className="px-2 py-2 font-medium">Order</th>
                    <th className="px-2 py-2 font-medium">Customer</th>
                    <th className="px-2 py-2 font-medium">Amount</th>
                    <th className="px-2 py-2 font-medium">Method</th>
                    <th className="px-2 py-2 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2937]/60">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-2 py-2.5 font-mono text-white">{order.id}</td>
                      <td className="px-2 py-2.5">
                        <div className="text-white font-medium truncate max-w-[140px]">{order.customerName}</div>
                        <div className="text-[10px] text-gray-500 font-mono truncate max-w-[140px]">{order.customerEmail}</div>
                      </td>
                      <td className="px-2 py-2.5 font-mono">
                        <span className="text-amber-400 font-semibold">{formatPrice(order.total)}</span>
                      </td>
                      <td className="px-2 py-2.5">
                        <span className="text-gray-300 font-mono text-[11px] uppercase">
                          {order.paymentGateway || order.paymentMethod || 'Stripe'}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <span className="admin-pill-green">
                          {order.orderStatus || 'completed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="admin-card p-4 lg:col-span-4 order-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Top Selling Products</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Best-selling subscriptions, projectors & passes</p>
            </div>
            <span className="admin-pill-purple">Verified</span>
          </div>
          <div className="space-y-2.5">
            {topProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-[#0f141c] border border-[#1f2937] hover:border-[#3a4256] transition-colors"
              >
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-10 h-10 rounded-md object-cover bg-black/40 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {product.productType === 'physical_projector' && (
                      <span className="admin-pill-blue !py-0 !px-1.5 !text-[9px]">4K</span>
                    )}
                    <span className="text-xs text-white font-medium truncate">{product.title}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">
                    {product.categoryName} · {(product.totalSold || 0)} sold
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-amber-400 font-mono">{formatPrice(product.price)}</div>
                  <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5 justify-end">
                    <TrendingUp className="w-2.5 h-2.5" />
                    {product.rating} ({product.reviewCount})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card p-4 lg:col-span-4 order-3">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">System Health</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Live service availability</p>
            </div>
            <span className={dbHealthy ? 'admin-pill-green' : 'admin-pill-amber'}>{dbHealthy === null ? 'Checking' : dbHealthy ? 'Healthy' : 'Degraded'}</span>
          </div>
          <div className="flex items-center gap-5">
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[10px] border-[#1f2937]" />
              <div className={`absolute inset-0 rounded-full border-[10px] ${dbHealthy ? 'border-emerald-400' : 'border-amber-400'} border-l-transparent rotate-[-35deg]`} />
              <div className="text-center"><div className="text-2xl font-bold text-white">{dbHealthy === null ? '—' : dbHealthy ? 'OK' : '!'}</div><div className="text-[10px] text-gray-400">Database</div></div>
            </div>
            <div className="space-y-3 flex-1">
              {systemStatus.map((sys) => <div key={sys.label} className="flex items-center justify-between gap-2 text-[11px]"><span className="flex items-center gap-2 text-gray-300 truncate"><CircleCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />{sys.label === 'MongoDB Atlas Cloud' ? 'Database' : sys.label}</span><span className="text-emerald-400 text-[10px]">Operational</span></div>)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions sit beside the campaign banner in the reference layout. */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="admin-card p-4 lg:col-span-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Common admin shortcuts</p>
            </div>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Add Product', icon: Package, tab: 'products', tone: 'blue' },
              { label: 'View Orders', icon: ShoppingCart, tab: 'orders', tone: 'yellow' },
              { label: 'Customers', icon: UserPlus, tab: 'customers', tone: 'cyan' },
              { label: 'Campaigns', icon: Megaphone, tab: 'marketing', tone: 'purple' },
            ].map(({ label, icon: Icon, tab, tone }) => (
              <button key={label} onClick={() => setAdminTab(tab)} className={`quick-action quick-action-${tone}`}>
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                <ArrowRight className="w-3 h-3 ml-auto opacity-60" />
              </button>
            ))}
          </div>
        </div>

        <div className="admin-card min-h-[150px] p-5 flex items-center justify-between gap-4 overflow-hidden relative lg:col-span-8 border-amber-400/40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_50%,rgba(245,158,11,.18),transparent_42%)] pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10"><img src={brandingLogoUrl} alt="PlayBeat" className="w-28 h-12 object-contain" /><div><h3 className="text-base font-bold text-white">Boost Your Sales with PlayBeat Marketing Tools</h3><p className="text-[11px] text-gray-500 mt-1">Create powerful campaigns, grow your audience and increase conversions.</p></div></div>
          <button onClick={() => setAdminTab('marketing')} className="btn-glossy btn-glossy-yellow btn-glossy-sm !text-black relative z-10 shrink-0">Launch Campaign <ArrowRight className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* ============================================
          RESET DASHBOARD CONFIRMATION MODAL
          ============================================ */}
      <AnimatePresence>
        {isResetOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsResetOpen(false)} className="absolute inset-0 bg-black/85 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md rounded-2xl bg-[#151a23] border border-red-500/30 shadow-2xl p-6 z-10" role="dialog" aria-modal="true">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <h3 className="text-base font-bold text-white font-display">Reset Dashboard</h3>
                </div>
                <button onClick={() => setIsResetOpen(false)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-[11px] text-red-300 leading-relaxed mb-4">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                This permanently clears all application data in MongoDB (products, orders, customers, coupons, logs, and settings). The Super Admin account is retained so you can sign in again. This action cannot be undone.
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Type <span className="font-mono font-bold text-red-400">RESET</span> to confirm</label>
                <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="RESET" className="input-sharp w-full px-3 py-2 text-xs text-white font-mono uppercase" />
              </div>
              <div className="flex items-center gap-2 pt-4">
                <button onClick={() => setIsResetOpen(false)} className="flex-1 py-2.5 rounded-lg bg-[#1f2937] hover:bg-[#2a3344] text-gray-300 text-xs font-bold uppercase tracking-wider">Cancel</button>
                <button onClick={handleReset} disabled={resetting || confirmText !== 'RESET'} className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                  {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  <span>Reset Everything</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ===== SETTINGS MODAL ===== */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-2xl bg-[#151a23] border border-purple-500/30 shadow-2xl p-6 z-10"
              role="dialog"
              aria-modal="true"
              aria-labelledby="settings-modal-title"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 id="settings-modal-title" className="text-base font-bold text-white font-display">Dashboard Settings</h3>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                  aria-label="Close settings"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Time range preference */}
                <div>
                  <label className="block text-[11px] text-gray-400 mb-2 font-mono uppercase tracking-wider">Default Time Range</label>
                  <div className="flex flex-wrap gap-2">
                    {(['1D', '1W', '1M', '1Y'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setTimeRange(r);
                          addToast('success', 'Preference Saved', `Default time range set to ${r === '1D' ? 'Today' : r === '1W' ? 'This Week' : r === '1M' ? 'This Month' : 'This Year'}.`);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider border transition-all ${
                          timeRange === r
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {r === '1D' ? 'Today' : r === '1W' ? 'Week' : r === '1M' ? 'Month' : 'Year'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick links to admin sections */}
                <div>
                  <label className="block text-[11px] text-gray-400 mb-2 font-mono uppercase tracking-wider">Quick Admin Links</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { setAdminTab('products'); setIsSettingsOpen(false); }}
                      className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium flex items-center gap-2 border border-white/10"
                    >
                      <Package className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Catalog Products</span>
                    </button>
                    <button
                      onClick={() => { setAdminTab('orders'); setIsSettingsOpen(false); }}
                      className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium flex items-center gap-2 border border-white/10"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-blue-400" />
                      <span>Orders</span>
                    </button>
                    <button
                      onClick={() => { setAdminTab('security'); setIsSettingsOpen(false); }}
                      className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium flex items-center gap-2 border border-white/10"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                      <span>Security & Audit</span>
                    </button>
                    <button
                      onClick={() => { setAdminTab('content'); setIsSettingsOpen(false); }}
                      className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium flex items-center gap-2 border border-white/10"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Storefront Content</span>
                    </button>
                  </div>
                </div>

                {/* Shared logo / admin profile picture */}
                <div className="pt-3 border-t border-white/10">
                  <label className="block text-[11px] text-gray-400 mb-2 font-mono uppercase tracking-wider">Brand Logo & Admin Profile Picture</label>
                  <div className="flex items-center gap-3 rounded-xl bg-black/20 border border-white/10 p-3">
                    <div className="w-[350px] h-[200px] max-w-full rounded-lg bg-[#071d58] border border-[#facc15]/30 flex items-center justify-center overflow-hidden shrink-0">
                      <img src={brandingLogoUrl} alt="Current PlayBeat logo" className="admin-branding-preview max-w-full max-h-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-white font-semibold">Use one logo everywhere</p>
                      <p className="text-[10px] text-gray-500 mt-1">Header, footer, hero banner, and admin profile.</p>
                    </div>
                    <label className="cursor-pointer px-3 py-2 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-[10px] font-bold uppercase tracking-wider border border-purple-500/30 flex items-center gap-1.5 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="sr-only"
                        onChange={(event) => {
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
                              addToast('success', 'Logo Updated', 'The new logo is now used across the storefront and admin panel.');
                            }
                          };
                          reader.readAsDataURL(file);
                          event.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                  <button
                    onClick={() => {
                      setBrandingLogoUrl('/assets/playbeat-logo.png');
                      addToast('success', 'Logo Reset', 'The default PlayBeat logo has been restored.');
                    }}
                    className="mt-2 text-[10px] text-gray-500 hover:text-white underline underline-offset-2"
                  >
                    Restore default logo
                  </button>
                </div>

                {/* Reset DB shortcut */}
                <div className="pt-3 border-t border-white/10">
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setIsResetOpen(true);
                    }}
                    className="w-full px-3 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-red-500/30"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Database (Destructive)</span>
                  </button>
                  <p className="text-[10px] text-gray-500 mt-2 text-center leading-relaxed">
                    Clears application data to zero and retains only Super Admin access.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
