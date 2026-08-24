import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { LeadStatus, TikTokLead } from '../../types';
import { Music2, Users, DollarSign, TrendingUp, Mail, Phone, ArrowRight, CheckCircle2, XCircle, Clock, BarChart3, Megaphone, Image, Search, Gauge, ExternalLink } from 'lucide-react';

const TIKTOK_ADS_MODULES = [
  { title: 'Account insights', description: 'Spend, impressions, clicks, CTR, CPM and CPC reporting.', icon: BarChart3 },
  { title: 'Campaign intelligence', description: 'Campaign, ad group and ad structure with performance audits.', icon: Megaphone },
  { title: 'Creative library', description: 'Image, video and identity inventory with launch readiness.', icon: Image },
  { title: 'Keyword & targeting', description: 'Keywords, interests, hashtags and negative keyword guidance.', icon: Search },
  { title: 'Benchmark plus', description: 'Peer comparison, historical baseline and effect evaluation.', icon: Gauge },
  { title: 'Access & OAuth', description: 'Advertiser discovery through OAuth 2.1 PKCE.', icon: ExternalLink },
];

const STATUS_META: Record<LeadStatus, { pill: string; label: string }> = {
  new: { pill: 'admin-pill-blue', label: 'New' },
  contacted: { pill: 'admin-pill-amber', label: 'Contacted' },
  qualified: { pill: 'admin-pill-purple', label: 'Qualified' },
  converted: { pill: 'admin-pill-green', label: 'Converted' },
  lost: { pill: 'admin-pill-red', label: 'Lost' },
};

const timeAgo = (iso: string): string => {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export const TikTokLeadsEngine: React.FC = () => {
  const { tiktokLeads, updateLeadStatus, addToast } = useStore();
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all');

  const filtered = statusFilter === 'all' ? tiktokLeads : tiktokLeads.filter(l => l.status === statusFilter);

  // Stats
  const totalLeads = tiktokLeads.length;
  const newLeads = tiktokLeads.filter(l => l.status === 'new').length;
  const converted = tiktokLeads.filter(l => l.status === 'converted').length;
  const totalCost = tiktokLeads.reduce((sum, l) => sum + l.costPerLead, 0);
  const avgCpl = totalLeads > 0 ? totalCost / totalLeads : 0;
  const conversionRate = totalLeads > 0 ? (converted / totalLeads) * 100 : 0;

  // Campaign breakdown
  const campaignStats = tiktokLeads.reduce((acc, lead) => {
    if (!acc[lead.campaign]) acc[lead.campaign] = { leads: 0, cost: 0, converted: 0 };
    acc[lead.campaign].leads++;
    acc[lead.campaign].cost += lead.costPerLead;
    if (lead.status === 'converted') acc[lead.campaign].converted++;
    return acc;
  }, {} as Record<string, { leads: number; cost: number; converted: number }>);

  const advanceLead = (lead: TikTokLead) => {
    const order: LeadStatus[] = ['new', 'contacted', 'qualified', 'converted'];
    const currentIdx = order.indexOf(lead.status);
    if (currentIdx < 0 || currentIdx >= order.length - 1) return;
    updateLeadStatus(lead.id, order[currentIdx + 1]);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="admin-card p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center">
            <Music2 className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-display">TikTok Leads Engine</h1>
            <p className="text-xs text-gray-500 mt-0.5">Capture leads from TikTok ads with campaign attribution and follow-up.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-[#1f2937]">
          <div className="p-3 rounded-lg bg-[#0f141c] border border-[#1f2937]">
            <div className="flex items-center gap-1 text-[10px] uppercase text-gray-500 tracking-wider font-mono"><Users className="w-2.5 h-2.5" /><span>Total Leads</span></div>
            <div className="text-xl font-bold text-white mt-1">{totalLeads}</div>
            <div className="text-[10px] text-blue-400 mt-0.5">{newLeads} new</div>
          </div>
          <div className="p-3 rounded-lg bg-[#0f141c] border border-[#1f2937]">
            <div className="flex items-center gap-1 text-[10px] uppercase text-gray-500 tracking-wider font-mono"><DollarSign className="w-2.5 h-2.5" /><span>Avg CPL</span></div>
            <div className="text-xl font-bold text-amber-400 mt-1 font-mono">${avgCpl.toFixed(2)}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">cost per lead</div>
          </div>
          <div className="p-3 rounded-lg bg-[#0f141c] border border-[#1f2937]">
            <div className="flex items-center gap-1 text-[10px] uppercase text-gray-500 tracking-wider font-mono"><CheckCircle2 className="w-2.5 h-2.5" /><span>Converted</span></div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{converted}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">of {totalLeads} leads</div>
          </div>
          <div className="p-3 rounded-lg bg-[#0f141c] border border-[#1f2937]">
            <div className="flex items-center gap-1 text-[10px] uppercase text-gray-500 tracking-wider font-mono"><TrendingUp className="w-2.5 h-2.5" /><span>Conv. Rate</span></div>
            <div className="text-xl font-bold text-white mt-1">{conversionRate.toFixed(1)}%</div>
            <div className="text-[10px] text-gray-500 mt-0.5">lead→customer</div>
          </div>
        </div>
      </div>

      <div className="admin-card p-5 border-pink-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-pink-300 font-mono font-bold">TikTok Ads MCP · v2.0.1</div>
            <h2 className="text-sm font-bold text-white mt-1">Business management workspace</h2>
            <p className="text-[11px] text-gray-500 mt-1">Connect <span className="text-gray-300 font-mono">tt-ads-flat</span> to run live analysis through the attached HuntMobi skill pack.</p>
          </div>
          <a href="https://business-api.tiktok.com/open_mcp/tt-ads-mcp-flat" target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-pink-500/15 border border-pink-400/30 text-pink-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
            <ExternalLink className="w-3.5 h-3.5" /> Connect MCP
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {TIKTOK_ADS_MODULES.map(({ title, description, icon: Icon }) => (
            <div key={title} className="p-3 rounded-xl bg-[#0f141c] border border-[#1f2937] flex items-start gap-2.5">
              <Icon className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
              <div><div className="text-xs font-semibold text-white">{title}</div><div className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{description}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <span>Campaign Performance</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(campaignStats).map(([campaign, stats]) => {
            const convRate = stats.leads > 0 ? (stats.converted / stats.leads) * 100 : 0;
            return (
              <div key={campaign} className="admin-card p-4">
                <div className="text-xs font-bold text-white truncate">{campaign}</div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <div className="text-[9px] uppercase text-gray-500 tracking-wider font-mono">Leads</div>
                    <div className="text-sm font-bold text-white font-mono">{stats.leads}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase text-gray-500 tracking-wider font-mono">Cost</div>
                    <div className="text-sm font-bold text-amber-400 font-mono">${stats.cost.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase text-gray-500 tracking-wider font-mono">Conv.</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono">{convRate.toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0f141c] border border-[#1f2937] w-fit">
        {(['all', 'new', 'contacted', 'qualified', 'converted', 'lost'] as const).map((s) => (
          <button
            key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-colors ${
              statusFilter === s ? 'bg-pink-600/30 text-pink-300' : 'text-gray-500 hover:text-gray-300'
            }`}
          >{s}</button>
        ))}
      </div>

      {/* Leads table */}
      <div className="admin-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-gray-500">No leads match this filter.</div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-[#1f2937] text-gray-500 uppercase text-[10px] tracking-wider font-mono bg-[#0f141c]">
                  <th className="p-3 font-medium">Lead</th>
                  <th className="p-3 font-medium">Campaign</th>
                  <th className="p-3 font-medium">Audience</th>
                  <th className="p-3 font-medium">CPL</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Captured</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2937]/60">
                {filtered.map((lead) => {
                  const status = STATUS_META[lead.status];
                  const canAdvance = ['new', 'contacted', 'qualified'].includes(lead.status);
                  return (
                    <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 text-white flex items-center justify-center font-bold text-[10px] border border-pink-500/30 shrink-0">
                            {lead.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-white font-medium truncate">{lead.name}</div>
                            <div className="text-[10px] text-gray-500 font-mono truncate flex items-center gap-1">
                              <Mail className="w-2.5 h-2.5" />{lead.email}
                            </div>
                            {lead.phone && (
                              <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5" />{lead.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-gray-300 text-[11px]">{lead.campaign}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{lead.adGroup} · {lead.creative}</div>
                      </td>
                      <td className="p-3 text-gray-400 text-[11px]">{lead.audience}</td>
                      <td className="p-3 font-mono text-amber-400">${lead.costPerLead.toFixed(2)}</td>
                      <td className="p-3"><span className={`${status.pill} flex items-center gap-1 w-fit`}>{status.label}</span></td>
                      <td className="p-3 text-gray-400 font-mono text-[11px]">{timeAgo(lead.capturedAt)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canAdvance && (
                            <button
                              onClick={() => advanceLead(lead)}
                              className="px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1"
                            >
                              <ArrowRight className="w-3 h-3" /><span className="hidden sm:inline">Advance</span>
                            </button>
                          )}
                          {lead.status !== 'lost' && lead.status !== 'converted' && (
                            <button
                              onClick={() => updateLeadStatus(lead.id, 'lost')}
                              className="p-1.5 rounded-md bg-[#1f2937] hover:bg-red-500/15 text-gray-400 hover:text-red-400 transition-colors"
                              aria-label="Mark as lost"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
