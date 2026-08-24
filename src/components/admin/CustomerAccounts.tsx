import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { User } from '../../types';
import { Users, Search, Mail, ShoppingBag, Heart, DollarSign, MapPin, Clock } from 'lucide-react';

const formatDate = (iso: string): string => {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const timeAgo = (iso: string): string => {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

export const CustomerAccounts: React.FC = () => {
  const { products, orders, formatPrice } = useStore();
  const [registeredCustomers, setRegisteredCustomers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(response => response.ok ? response.json() : { users: [] })
      .then(data => setRegisteredCustomers(Array.isArray(data.users) ? data.users.filter((user: User) => user.role === 'customer' && user.status !== 'deleted') : []))
      .catch(() => setRegisteredCustomers([]));
  }, [orders.length]);

  // Build a customer view by combining users + their orders + wishlist items
  // For this demo we synthesize customer records from existing orders + the INITIAL_USERS
  // (the user list is exposed via currentUser's auth role-switcher, but for this directory
  // we use a derived list of unique customers from orders).
  const customersFromOrders = orders.reduce((acc, order) => {
    if (!acc.find(c => c.email === order.customerEmail)) {
      acc.push({
        id: `cust-${order.customerEmail}`,
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        ordersCount: orders.filter(o => o.customerEmail === order.customerEmail).length,
        totalSpent: orders.filter(o => o.customerEmail === order.customerEmail).reduce((sum, o) => sum + o.total, 0),
        lastOrderAt: order.createdAt,
        wishlist: [],
      });
    }
    return acc;
  }, [] as Array<{ id: string; name: string; email: string; phone?: string; ordersCount: number; totalSpent: number; lastOrderAt: string; wishlist: string[] }>);

  const registeredByEmail = new Map(registeredCustomers.map(customer => [customer.email.toLowerCase(), customer]));
  const merged = [...registeredCustomers.map(customer => ({
    ...customer,
    ordersCount: orders.filter(order => order.customerEmail.toLowerCase() === customer.email.toLowerCase()).length,
    totalSpent: orders.filter(order => order.customerEmail.toLowerCase() === customer.email.toLowerCase() && order.paymentStatus === 'paid').reduce((sum, order) => sum + order.total, 0),
    lastOrderAt: orders.find(order => order.customerEmail.toLowerCase() === customer.email.toLowerCase())?.createdAt || customer.createdAt,
  })), ...customersFromOrders.filter(customer => !registeredByEmail.has(customer.email.toLowerCase()))];

  const filtered = merged.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const totalCustomers = merged.length;
  const totalRevenue = merged.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgLtv = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
  const activeThisMonth = merged.filter(c => new Date(c.lastOrderAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="admin-card p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-display">Customer Accounts</h1>
            <p className="text-xs text-gray-500 mt-0.5">Searchable directory with order history, lifetime value, and wishlist.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-[#1f2937]">
          <div className="p-3 rounded-lg bg-[#0f141c] border border-[#1f2937]">
            <div className="text-[10px] uppercase text-gray-500 tracking-wider font-mono">Total Customers</div>
            <div className="text-xl font-bold text-white mt-1">{totalCustomers}</div>
          </div>
          <div className="p-3 rounded-lg bg-[#0f141c] border border-[#1f2937]">
            <div className="text-[10px] uppercase text-gray-500 tracking-wider font-mono">Total Revenue</div>
            <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">${totalRevenue.toFixed(2)}</div>
          </div>
          <div className="p-3 rounded-lg bg-[#0f141c] border border-[#1f2937]">
            <div className="text-[10px] uppercase text-gray-500 tracking-wider font-mono">Avg LTV</div>
            <div className="text-xl font-bold text-amber-400 mt-1 font-mono">${avgLtv.toFixed(2)}</div>
          </div>
          <div className="p-3 rounded-lg bg-[#0f141c] border border-[#1f2937]">
            <div className="text-[10px] uppercase text-gray-500 tracking-wider font-mono">Active (30d)</div>
            <div className="text-xl font-bold text-white mt-1">{activeThisMonth}</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span>Directory ({filtered.length})</span>
        </h2>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-sharp pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 w-full sm:w-72" />
        </div>
      </div>

      {/* Customer cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((customer) => {
          const wishlistProducts = customer.wishlist
            .map(id => products.find(p => p.id === id))
            .filter((p): p is NonNullable<typeof p> => Boolean(p));
          return (
            <div key={customer.id} className="admin-card p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 text-white flex items-center justify-center font-bold text-sm border border-blue-500/30 shrink-0">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{customer.name}</div>
                  <a href={`mailto:${customer.email}`} className="text-[11px] text-blue-400 hover:text-blue-300 font-mono truncate block">{customer.email}</a>
                  {customer.phone && <div className="text-[10px] text-gray-500 font-mono mt-0.5">{customer.phone}</div>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2 rounded-lg bg-[#0f141c] border border-[#1f2937]">
                  <div className="flex items-center gap-1 text-[9px] uppercase text-gray-500 tracking-wider font-mono"><ShoppingBag className="w-2.5 h-2.5" /><span>Orders</span></div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">{customer.ordersCount}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#0f141c] border border-[#1f2937]">
                  <div className="flex items-center gap-1 text-[9px] uppercase text-gray-500 tracking-wider font-mono"><DollarSign className="w-2.5 h-2.5" /><span>LTV</span></div>
                  <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">${customer.totalSpent.toFixed(2)}</div>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 font-mono flex items-center gap-1 mb-2">
                <Clock className="w-3 h-3" />
                <span>Last order: {timeAgo(customer.lastOrderAt)}</span>
              </div>

              {wishlistProducts.length > 0 && (
                <div className="pt-3 border-t border-[#1f2937]">
                  <div className="text-[10px] uppercase text-gray-500 tracking-wider font-mono mb-1.5 flex items-center gap-1">
                    <Heart className="w-2.5 h-2.5" /><span>Wishlist ({wishlistProducts.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {wishlistProducts.slice(0, 3).map(p => (
                      <img key={p.id} src={p.images[0]} alt={p.title} className="w-7 h-7 rounded object-cover" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="admin-card p-10 text-center">
          <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No customers match "{search}".</p>
        </div>
      )}
    </div>
  );
};
