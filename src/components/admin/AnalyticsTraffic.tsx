import React from 'react';
import { useStore } from '../../context/StoreContext';
import { TrendingUp, TrendingDown, Minus, Users, Globe, Filter, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, AreaChart, Area } from 'recharts';

export const AnalyticsTraffic: React.FC = () => {
  const { analyticsMetrics, funnelSteps, products } = useStore();

  const formatValue = (m: { label: string; value: number }): string => {
    if (m.label.includes('Duration')) {
      const mins = Math.floor(m.value / 60); const secs = m.value % 60;
      return `${mins}m ${secs}s`;
    }
    if (m.label.includes('Rate')) return `${m.value}%`;
    return m.value.toLocaleString();
  };

  // Top products by units sold
  const topProducts = [...products].sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0)).slice(0, 8);

  // Build revenue chart data from existing orders
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="admin-card p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-display">Analytics & Traffic</h1>
            <p className="text-xs text-gray-500 mt-0.5">Sessions, conversion rate, traffic sources, and product-level performance.</p>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {analyticsMetrics.map((m) => {
          const TrendIcon = m.trend === 'up' ? TrendingUp : m.trend === 'down' ? TrendingDown : Minus;
          const trendColor = m.trend === 'up' ? 'text-emerald-400' : m.trend === 'down' ? 'text-red-400' : 'text-gray-400';
          return (
            <div key={m.label} className="admin-card p-4">
              <div className="text-[10px] uppercase text-gray-500 tracking-wider font-mono">{m.label}</div>
              <div className="text-lg font-bold text-white mt-1 font-mono">{formatValue(m)}</div>
              <div className={`flex items-center gap-1 text-[10px] mt-1 ${trendColor}`}>
                <TrendIcon className="w-3 h-3" />
                <span>{Math.abs(m.change)}% vs prev period</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Funnel */}
        <div className="admin-card p-5 lg:col-span-7">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Conversion Funnel</h2>
            <span className="admin-pill-blue ml-auto">Last 30 days</span>
          </div>
          <div className="space-y-2.5">
            {funnelSteps.map((step, idx) => {
              const width = idx === 0 ? 100 : (step.visitors / funnelSteps[0].visitors) * 100;
              return (
                <div key={step.step}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-gray-300 font-medium">{step.step}</span>
                    <span className="text-gray-500 font-mono">
                      <span className="text-white font-semibold">{step.visitors.toLocaleString()}</span> · {step.conversionRate}%
                    </span>
                  </div>
                  <div className="h-7 bg-[#1f2937] rounded-md overflow-hidden relative">
                    <div
                      className="h-full rounded-md transition-all flex items-center px-2"
                      style={{
                        width: `${width}%`,
                        background: `linear-gradient(90deg, #3b82f6 ${idx * 8}%, #8b5cf6 100%)`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Traffic sources (reuse dashboard data) */}
        <div className="admin-card p-5 lg:col-span-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Traffic Sources</h2>
            <span className="admin-pill-blue ml-auto">Configured sources only</span>
          </div>
          <div className="h-[200px] flex items-center justify-center text-center text-xs text-gray-500">
            No traffic source provider is connected. Connect an analytics provider to display real attribution data.
          </div>
          {/* Traffic chart intentionally stays empty until a real provider is configured. */}
          <div className="hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[]} layout="vertical" margin={{ top: 0, right: 5, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip contentStyle={{ background: '#0a0b0d', border: '1px solid #252b3b', borderRadius: 8, fontSize: 12, color: '#f9fafb' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top products leaderboard */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-white">Top Products by Units Sold</h2>
        </div>
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-[#1f2937] text-gray-500 uppercase text-[10px] tracking-wider font-mono bg-[#0f141c]">
                  <th className="p-3 font-medium">Rank</th>
                  <th className="p-3 font-medium">Product</th>
                  <th className="p-3 font-medium">Category</th>
                  <th className="p-3 font-medium">Units Sold</th>
                  <th className="p-3 font-medium">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2937]/60">
                {topProducts.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3">
                      <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center font-mono font-bold text-[10px] ${
                        idx === 0 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                        idx === 1 ? 'bg-gray-400/15 text-gray-300 border border-gray-400/30' :
                        idx === 2 ? 'bg-orange-600/15 text-orange-400 border border-orange-600/30' :
                        'bg-white/5 text-gray-500'
                      }`}>{idx + 1}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <img src={p.images[0]} alt="" className="w-8 h-8 rounded-md object-cover bg-black/40" />
                        <span className="text-white font-medium truncate max-w-[200px]">{p.title}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-300">{p.categoryName}</td>
                    <td className="p-3 font-mono text-emerald-400 font-bold">{(p.totalSold || 0).toLocaleString()}</td>
                    <td className="p-3">
                      <span className="font-mono text-amber-400">{p.rating}</span>
                      <span className="text-gray-500 font-mono text-[10px] ml-1">({p.reviewCount})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
