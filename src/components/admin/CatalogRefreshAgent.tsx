import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Bot, CheckCircle2, Clock3, ExternalLink, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react';

type AgentStatus = {
  enabled: boolean;
  running: boolean;
  sourceUrl: string;
  lastStartedAt?: string;
  lastCompletedAt?: string;
  lastSuccessAt?: string;
  lastError?: string;
  lastScanned: number;
  lastUpdated: number;
  lastCreated: number;
};

const formatDate = (value?: string) => value ? new Date(value).toLocaleString() : 'Not run yet';

export const CatalogRefreshAgent: React.FC = () => {
  const { refreshProducts, addToast } = useStore();
  const [agent, setAgent] = useState<AgentStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/catalog-agent/status');
      if (response.ok) setAgent((await response.json()).agent);
    } catch { /* The panel remains usable when the API is unavailable. */ }
  }, []);

  useEffect(() => {
    void loadStatus();
    const timer = window.setInterval(() => void loadStatus(), 15_000);
    return () => window.clearInterval(timer);
  }, [loadStatus]);

  const runRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/admin/catalog-agent/refresh', { method: 'POST' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.agent?.lastError || data.error || 'Refresh failed.');
      setAgent(data.agent);
      refreshProducts();
      addToast('success', 'Catalog Agent Complete', `Scanned ${data.agent.lastScanned} listings, updated ${data.agent.lastUpdated}, and queued ${data.agent.lastCreated} new products.`);
    } catch (error) {
      addToast('error', 'Catalog Agent Failed', error instanceof Error ? error.message : 'Could not refresh the source catalog.');
      await loadStatus();
    } finally {
      setIsRefreshing(false);
    }
  };

  const healthy = Boolean(agent?.lastSuccessAt) && !agent?.lastError;

  return (
    <div className="space-y-6 pb-fade-up">
      <div className="pb-panel p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/15 text-orange-300 border border-orange-400/30 flex items-center justify-center"><Bot className="w-6 h-6" /></div>
          <div>
            <span className="pb-eyebrow">Catalog operations</span>
            <h2 className="text-2xl font-bold text-white font-display mt-1">PlayBeat Catalog Refresh Agent</h2>
            <p className="text-xs text-[var(--pb-silver-3)] mt-1 max-w-2xl">Reads public product and price cards from the source store every five minutes. Existing listings keep their content; new listings wait for admin approval.</p>
          </div>
        </div>
        <button onClick={runRefresh} disabled={isRefreshing || agent?.running} className="pb-btn pb-btn-primary shrink-0"><RefreshCw className={`w-4 h-4 ${isRefreshing || agent?.running ? 'animate-spin' : ''}`} /> {isRefreshing || agent?.running ? 'Refreshing…' : 'Refresh now'}</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="pb-panel p-4"><div className="text-[10px] uppercase tracking-wider text-gray-500">Schedule</div><div className="text-xl font-bold text-white mt-1">Every 5 min</div><div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1"><Clock3 className="w-3 h-3" /> Automatic</div></div>
        <div className="pb-panel p-4"><div className="text-[10px] uppercase tracking-wider text-gray-500">Last scanned</div><div className="text-xl font-bold text-white mt-1">{agent?.lastScanned ?? 0}</div><div className="text-[11px] text-gray-500 mt-1">Public listings</div></div>
        <div className="pb-panel p-4"><div className="text-[10px] uppercase tracking-wider text-gray-500">Prices updated</div><div className="text-xl font-bold text-white mt-1">{agent?.lastUpdated ?? 0}</div><div className="text-[11px] text-gray-500 mt-1">Last completed run</div></div>
        <div className="pb-panel p-4"><div className="text-[10px] uppercase tracking-wider text-gray-500">New review queue</div><div className="text-xl font-bold text-white mt-1">{agent?.lastCreated ?? 0}</div><div className="text-[11px] text-amber-300 mt-1">Pending approval</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 pb-panel p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--pb-line)] pb-3"><div><h3 className="font-bold text-white">Agent status</h3><p className="text-[11px] text-gray-500 mt-1">The dashboard polls status every 15 seconds.</p></div><span className={`pb-status ${healthy ? 'pb-status-published' : agent?.lastError ? 'pb-status-out-stock' : 'pb-status-draft'}`}>{healthy ? 'Healthy' : agent?.lastError ? 'Needs attention' : 'Waiting'}</span></div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between gap-4"><span className="text-gray-400">Source store</span><a href={agent?.sourceUrl || 'https://playbeatdigital.store'} target="_blank" rel="noreferrer" className="pb-link truncate flex items-center gap-1">{agent?.sourceUrl || 'https://playbeatdigital.store'} <ExternalLink className="w-3 h-3 shrink-0" /></a></div>
            <div className="flex items-center justify-between"><span className="text-gray-400">Last successful refresh</span><span className="text-white font-mono text-[11px]">{formatDate(agent?.lastSuccessAt)}</span></div>
            <div className="flex items-center justify-between"><span className="text-gray-400">Last run completed</span><span className="text-white font-mono text-[11px]">{formatDate(agent?.lastCompletedAt)}</span></div>
            {agent?.lastError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 flex gap-2"><TriangleAlert className="w-4 h-4 shrink-0" /><span>{agent.lastError}</span></div>}
          </div>
        </section>

        <section className="lg:col-span-5 pb-panel p-5 space-y-4">
          <h3 className="font-bold text-white">Safety rules</h3>
          <div className="space-y-3 text-xs text-gray-400">
            <div className="flex gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /><span>Only public catalog cards are read. License keys, customer records, and checkout data are never requested.</span></div>
            <div className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /><span>Existing products are matched by normalized title and only pricing metadata is refreshed.</span></div>
            <div className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /><span>New products are created as pending approval with zero stock and no delivery credentials.</span></div>
          </div>
        </section>
      </div>
    </div>
  );
};
