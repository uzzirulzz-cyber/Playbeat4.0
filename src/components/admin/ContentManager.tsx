import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { PromoCoupon } from '../../types';
import {
  Sparkles,
  Megaphone,
  Tag,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Percent,
  Flame
} from 'lucide-react';

export const ContentManager: React.FC = () => {
  const { content, updateContent, coupons, addCoupon, deleteCoupon, addToast } = useStore();

  // Announcement Bar state
  const [announcementText, setAnnouncementText] = useState(content.announcementBar.text);
  const [announcementBadge, setAnnouncementBadge] = useState(content.announcementBar.badgeText);
  const [announcementEnabled, setAnnouncementEnabled] = useState(content.announcementBar.enabled);

  // Hero state
  const [headline, setHeadline] = useState(content.heroBanner.headline);
  const [subheadline, setSubheadline] = useState(content.heroBanner.subheadline);
  const [highlightBadge, setHighlightBadge] = useState(content.heroBanner.highlightBadge);
  const [ctaText, setCtaText] = useState(content.heroBanner.ctaText);

  // New Coupon form
  const [couponCode, setCouponCode] = useState('');
  const [discountValue, setDiscountValue] = useState(15);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');

  useEffect(() => {
    setAnnouncementText(content.announcementBar.text);
    setAnnouncementBadge(content.announcementBar.badgeText || '');
    setAnnouncementEnabled(content.announcementBar.enabled);
    setHeadline(content.heroBanner.headline);
    setSubheadline(content.heroBanner.subheadline);
    setHighlightBadge(content.heroBanner.highlightBadge);
    setCtaText(content.heroBanner.ctaText);
  }, [content]);

  const handleSaveStoreContent = (e: React.FormEvent) => {
    e.preventDefault();
    updateContent({
      announcementBar: {
        text: announcementText,
        badgeText: announcementBadge,
        enabled: announcementEnabled
      },
      heroBanner: {
        ...content.heroBanner,
        headline,
        subheadline,
        highlightBadge,
        ctaText
      }
    });
    addToast('success', 'Storefront Content Saved', 'Live homepage headlines and announcements updated.');
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;
    const newCoupon: PromoCoupon = {
      id: `c-${Date.now()}`,
      code: couponCode.toUpperCase().trim(),
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: 0,
      usageCount: 0,
      maxUsage: 500,
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString()
    };
    addCoupon(newCoupon);
    setCouponCode('');
    addToast('success', 'Coupon Created', `Promo code ${newCoupon.code} is now active.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-[#10121B] border border-white/10 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white font-display">Storefront Copy, Hero & Coupons</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Modify promotional banners, announcement ticker, and discount coupon codes in real-time.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: HERO & ANNOUNCEMENT BAR (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-[#10121B] border border-white/10 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-red-400" />
              <span>Announcement Bar & Hero Banner</span>
            </span>
          </div>

          <form onSubmit={handleSaveStoreContent} className="space-y-4 text-xs">
            {/* Announcement Bar */}
            <div className="p-4 rounded-2xl bg-[#141622] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white font-display">Announcement Bar Ticker</span>
                <label className="flex items-center gap-2 text-neutral-400 text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={announcementEnabled}
                    onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                    className="accent-red-600 rounded"
                  />
                  <span>Enable Live Bar</span>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={announcementBadge}
                    onChange={(e) => setAnnouncementBadge(e.target.value)}
                    className="w-full bg-black/50 rounded-xl border border-white/10 px-3 py-2 text-xs text-white uppercase font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] text-neutral-400 mb-1">Announcement Message</label>
                  <input
                    type="text"
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    className="w-full bg-black/50 rounded-xl border border-white/10 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Hero Banner Headline */}
            <div className="p-4 rounded-2xl bg-[#141622] border border-white/5 space-y-3">
              <span className="font-bold text-white font-display block">Hero Showcase Section</span>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Top Highlight Badge</label>
                <input
                  type="text"
                  value={highlightBadge}
                  onChange={(e) => setHighlightBadge(e.target.value)}
                  className="w-full bg-black/50 rounded-xl border border-white/10 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Headline Text</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-black/50 rounded-xl border border-white/10 px-3 py-2 text-xs text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Subheadline Description</label>
                <textarea
                  rows={2}
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  className="w-full bg-black/50 rounded-xl border border-white/10 p-2.5 text-xs text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Primary Button CTA</label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  className="w-full bg-black/50 rounded-xl border border-white/10 px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold font-display text-xs shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Publish Content Changes</span>
            </button>
          </form>
        </div>

        {/* RIGHT: PROMO COUPONS MANAGER (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#10121B] border border-white/10 space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-red-400" />
                <span>Promo Discount Codes</span>
              </span>
            </div>

            {/* Create Coupon Form */}
            <form onSubmit={handleCreateCoupon} className="mt-4 p-4 rounded-2xl bg-[#141622] border border-white/5 space-y-3 text-xs">
              <div className="font-bold text-white font-display">Add Promo Coupon</div>

              <div>
                <input
                  type="text"
                  placeholder="Coupon Code (e.g. VIP20)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full bg-black/50 rounded-xl border border-white/10 px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-red-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-neutral-400 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-black/50 rounded-xl border border-white/10 px-2 py-2 text-xs text-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-400 mb-1">Value</label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full bg-black/50 rounded-xl border border-white/10 px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-bold font-display transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Coupon</span>
              </button>
            </form>

            {/* Coupons List */}
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              {coupons.map((c) => (
                <div key={c.id} className="p-3 rounded-xl bg-[#141622] border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-red-400">{c.code}</span>
                    <span className="text-neutral-400 ml-2 font-mono text-[11px]">
                      (-{c.discountType === 'percentage' ? `${c.discountValue}%` : `Rs ${c.discountValue.toLocaleString()}`})
                    </span>
                    <div className="text-[10px] text-neutral-500 font-mono">Used: {c.usageCount} times</div>
                  </div>

                  <button
                    onClick={() => deleteCoupon(c.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-400"
                    title="Delete coupon"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
