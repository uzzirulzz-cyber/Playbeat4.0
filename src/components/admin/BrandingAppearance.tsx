import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Palette, Upload, RotateCcw, Save, Eye, Smartphone, Monitor } from 'lucide-react';

interface BrandDraft {
  brandName: string;
  tagline: string;
  description: string;
  supportEmail: string;
  primaryColor: string;
  accentColor: string;
  background: string;
  cardBackground: string;
  radius: 'sharp' | 'soft' | 'round';
}

const DEFAULT_BRAND: BrandDraft = {
  brandName: 'PlayBeat Digital',
  tagline: 'Premium digital goods, delivered instantly.',
  description: 'A refined commerce experience for digital products and smart hardware.',
  supportEmail: 'support@playbeat.digital',
  primaryColor: '#E11D2E',
  accentColor: '#FF7A18',
  background: '#050505',
  cardBackground: '#0E0E10',
  radius: 'soft',
};

const STORAGE_KEY = 'playbeat-branding-draft';

export const BrandingAppearance: React.FC = () => {
  const { brandingLogoUrl, setBrandingLogoUrl, addToast } = useStore();
  const [draft, setDraft] = useState<BrandDraft>(DEFAULT_BRAND);
  const [preview, setPreview] = useState<'desktop' | 'mobile'>('desktop');
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setDraft({ ...DEFAULT_BRAND, ...JSON.parse(saved) });
    } catch { /* Use the safe defaults when storage is unavailable. */ }
  }, []);

  const update = <K extends keyof BrandDraft>(key: K, value: BrandDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setIsPublished(false);
  };

  const saveDraft = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch { /* Keep the current session usable. */ }
    addToast('success', 'Branding Draft Saved', 'Your appearance changes are ready to review.');
  };

  const publish = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch { /* Keep the current session usable. */ }
    setIsPublished(true);
    addToast('success', 'Branding Published', 'Your PlayBeat Digital appearance is now active.');
  };

  const reset = () => {
    setDraft(DEFAULT_BRAND);
    setIsPublished(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* Ignore storage failures. */ }
    addToast('info', 'Branding Reset', 'The default PlayBeat premium theme has been restored.');
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      addToast('error', 'Invalid Logo', 'Choose an image smaller than 2 MB.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBrandingLogoUrl(reader.result);
        addToast('success', 'Logo Updated', 'The new logo is visible in the admin shell.');
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const radiusClass = draft.radius === 'sharp' ? 'rounded-md' : draft.radius === 'round' ? 'rounded-3xl' : 'rounded-xl';

  return (
    <div className="space-y-6 pb-fade-up">
      <div className="pb-panel p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="pb-eyebrow"><Palette className="w-3 h-3" /> Brand system</span>
          <h2 className="text-2xl font-bold text-white font-display mt-1">Branding & Appearance</h2>
          <p className="text-xs text-[var(--pb-silver-3)] mt-1">Shape the admin and storefront experience without exposing credentials or touching commerce data.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={reset} className="pb-btn pb-btn-dark pb-btn-sm"><RotateCcw className="w-3.5 h-3.5" /> Reset default</button>
          <button onClick={saveDraft} className="pb-btn pb-btn-secondary pb-btn-sm"><Save className="w-3.5 h-3.5" /> Save draft</button>
          <button onClick={publish} className="pb-btn pb-btn-primary pb-btn-sm"><Eye className="w-3.5 h-3.5" /> Publish</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-7 pb-panel p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--pb-line)] pb-3">
            <div><h3 className="font-bold text-white">Identity & visual theme</h3><p className="text-[11px] text-[var(--pb-silver-3)] mt-1">Changes are staged locally until you publish.</p></div>
            {isPublished && <span className="pb-status pb-status-published">Published</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="sm:col-span-2"><span className="pb-label">Brand name</span><input className="pb-input" value={draft.brandName} onChange={(e) => update('brandName', e.target.value)} /></label>
            <label><span className="pb-label">Tagline</span><input className="pb-input" value={draft.tagline} onChange={(e) => update('tagline', e.target.value)} /></label>
            <label><span className="pb-label">Support email</span><input className="pb-input" type="email" value={draft.supportEmail} onChange={(e) => update('supportEmail', e.target.value)} /></label>
            <label className="sm:col-span-2"><span className="pb-label">Brand description</span><textarea className="pb-input min-h-20 resize-y" value={draft.description} onChange={(e) => update('description', e.target.value)} /></label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([['primaryColor', 'Primary'], ['accentColor', 'Accent'], ['background', 'Background'], ['cardBackground', 'Cards']] as const).map(([key, label]) => (
              <label key={key} className="pb-inset p-3"><span className="pb-label">{label}</span><input type="color" className="w-full h-9 cursor-pointer bg-transparent" value={draft[key]} onChange={(e) => update(key, e.target.value)} /></label>
            ))}
          </div>

          <div>
            <span className="pb-label">Card radius</span>
            <div className="flex gap-2">
              {(['sharp', 'soft', 'round'] as const).map((radius) => <button key={radius} onClick={() => update('radius', radius)} className={`pb-variant-chip ${draft.radius === radius ? 'is-selected' : ''}`}>{radius}</button>)}
            </div>
          </div>

          <div className="pb-inset p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-black border border-[var(--pb-line)] flex items-center justify-center overflow-hidden"><img src={brandingLogoUrl} alt="Current PlayBeat logo" className="max-w-full max-h-full object-contain" /></div>
            <div className="flex-1"><div className="text-sm font-bold text-white">Brand logo</div><div className="text-[11px] text-[var(--pb-silver-3)] mt-1">PNG, JPG, WebP or SVG · max 2 MB</div></div>
            <label className="pb-btn pb-btn-secondary pb-btn-sm cursor-pointer"><Upload className="w-3.5 h-3.5" /> Replace<input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} /></label>
          </div>
        </section>

        <section className="xl:col-span-5 pb-panel p-5 space-y-4">
          <div className="flex items-center justify-between"><div><h3 className="font-bold text-white">Live preview</h3><p className="text-[11px] text-[var(--pb-silver-3)]">Preview the published shell at each breakpoint.</p></div><div className="flex gap-1"><button onClick={() => setPreview('desktop')} className={`p-2 rounded-lg ${preview === 'desktop' ? 'bg-white/10 text-white' : 'text-gray-500'}`} aria-label="Desktop preview"><Monitor className="w-4 h-4" /></button><button onClick={() => setPreview('mobile')} className={`p-2 rounded-lg ${preview === 'mobile' ? 'bg-white/10 text-white' : 'text-gray-500'}`} aria-label="Mobile preview"><Smartphone className="w-4 h-4" /></button></div></div>
          <div className={`mx-auto transition-all ${preview === 'mobile' ? 'max-w-[260px]' : 'max-w-full'}`}>
            <div className={`${radiusClass} overflow-hidden border border-white/15 shadow-2xl`} style={{ background: draft.background }}>
              <div className="p-3 border-b border-white/10 flex items-center gap-2"><img src={brandingLogoUrl} alt="" className="w-8 h-8 object-contain" /><span className="font-bold text-white text-sm">{draft.brandName}</span><span className="ml-auto text-[10px] text-gray-400">Admin</span></div>
              <div className="p-5 space-y-4"><span className="pb-eyebrow">Operations center</span><h4 className="text-xl font-bold text-white font-display">{draft.tagline}</h4><p className="text-xs text-gray-400">{draft.description}</p><div className="grid grid-cols-2 gap-3"><div className={`${radiusClass} p-3 border border-white/10`} style={{ background: draft.cardBackground }}><div className="text-[10px] text-gray-400">Revenue</div><div className="text-lg font-bold text-white mt-1">Rs 248k</div></div><div className={`${radiusClass} p-3 border border-white/10`} style={{ background: draft.cardBackground }}><div className="text-[10px] text-gray-400">Orders</div><div className="text-lg font-bold mt-1" style={{ color: draft.accentColor }}>1,284</div></div></div><button className="pb-btn pb-btn-primary pb-btn-sm" style={{ background: `linear-gradient(180deg, ${draft.accentColor}, ${draft.primaryColor})` }}>View workspace</button></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
