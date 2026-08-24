import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { NavItem } from '../../types';
import {
  Compass,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Sparkles,
  Flame,
  Clock,
  TrendingUp,
  Award,
  Projector,
  ExternalLink,
  Layers,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const NavigationManager: React.FC = () => {
  const {
    navItems,
    setNavItems,
    addNavItem,
    updateNavItem,
    deleteNavItem,
    reorderNavItems,
    toggleNavItemActive,
    categories,
    setActivePromoFilter,
    setActiveView
  } = useStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<NavItem>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemForm, setNewItemForm] = useState<Omit<NavItem, 'id'>>({
    label: '',
    target: 'limited-time',
    type: 'filter',
    badgeText: '',
    badgeColor: 'yellow',
    icon: 'Clock',
    isActive: true,
    order: navItems.length + 1
  });

  const handleStartEdit = (item: NavItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleSaveEdit = (id: string) => {
    if (!editForm.label?.trim()) return;
    updateNavItem(id, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.label.trim()) return;
    addNavItem({
      ...newItemForm,
      order: navItems.length + 1
    });
    setNewItemForm({
      label: '',
      target: 'limited-time',
      type: 'filter',
      badgeText: '',
      badgeColor: 'yellow',
      icon: 'Clock',
      isActive: true,
      order: navItems.length + 2
    });
    setIsAddModalOpen(false);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...navItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    reorderNavItems(newItems);
  };

  const resetToDefault = () => {
    const defaultItems: NavItem[] = [
      {
        id: 'nav-limited-time',
        label: 'Limited-Time Offers',
        target: 'limited-time',
        type: 'filter',
        badgeText: 'HOT',
        badgeColor: 'yellow',
        icon: 'Clock',
        isActive: true,
        order: 1,
      },
      {
        id: 'nav-flash-deals',
        label: 'Flash Deals & Special Offers',
        target: 'flash-deals',
        type: 'section',
        badgeText: '50% OFF',
        badgeColor: 'red',
        icon: 'Flame',
        isActive: true,
        order: 2,
      },
      {
        id: 'nav-trending-week',
        label: 'Trending This Week',
        target: 'trending-week',
        type: 'filter',
        badgeText: 'TRENDING',
        badgeColor: 'blue',
        icon: 'TrendingUp',
        isActive: true,
        order: 3,
      },
      {
        id: 'nav-best-sellers',
        label: 'Best Sellers',
        target: 'best-sellers',
        type: 'filter',
        badgeText: 'TOP RATED',
        badgeColor: 'yellow',
        icon: 'Award',
        isActive: true,
        order: 4,
      },
      {
        id: 'nav-smart-projectors',
        label: '4K Smart Projectors',
        target: 'projectors',
        type: 'section',
        badgeText: '4K LASER',
        badgeColor: 'blue',
        icon: 'Projector',
        isActive: true,
        order: 5,
      },
      {
        id: 'nav-gaming-keys',
        label: 'Gaming & Keys',
        target: 'category:gaming',
        type: 'category',
        isActive: true,
        order: 6,
      },
      {
        id: 'nav-software-os',
        label: 'Software & OS',
        target: 'category:software',
        type: 'category',
        isActive: true,
        order: 7,
      },
      {
        id: 'nav-saas-tools',
        label: 'SaaS AI Tools',
        target: 'category:saas-tools',
        type: 'category',
        isActive: true,
        order: 8,
      }
    ];
    setNavItems(defaultItems);
    fetch('/api/navigation', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: defaultItems }),
    }).catch(() => {});
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#10182A] border border-[#26334A] shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-[#1769FF] text-xs font-mono font-bold uppercase tracking-widest mb-1">
            <Compass className="w-4 h-4" />
            <span>Storefront Header & Navigation Control</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Navigation & Promotional Offers Manager</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Edit, modify, switch active states, add new menu items, or delete promotional tabs (Limited-Time Offers, Flash Deals & Special Offers, Trending This Week, Best Sellers) in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={resetToDefault}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl btn-secondary text-xs text-slate-300 hover:text-white"
            title="Reset to default menu items"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl btn-primary text-xs font-bold uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            <span>Add Nav Item</span>
          </button>
        </div>
      </div>

      {/* LIVE PREVIEW BAR */}
      <div className="p-4 rounded-2xl bg-[#08152F] border border-[#26334A] space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono uppercase font-bold text-[#FFC928] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Live Storefront Nav Preview
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {navItems.filter(n => n.isActive).length} Active Items Visible to Customers
          </span>
        </div>

        <div className="overflow-x-auto no-scrollbar py-2 px-3 bg-[#070B14] rounded-xl border border-[#26334A] flex items-center gap-4 text-xs font-medium">
          <span className="text-slate-400 cursor-default uppercase tracking-wider font-mono text-[11px]">All Assets</span>
          {navItems.filter(i => i.isActive).map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#10182A] border border-[#26334A] text-slate-200 whitespace-nowrap"
            >
              {item.icon === 'Clock' && <Clock className="w-3 h-3 text-[#FFC928]" />}
              {item.icon === 'Flame' && <Flame className="w-3 h-3 text-[#FF304F]" />}
              {item.icon === 'TrendingUp' && <TrendingUp className="w-3 h-3 text-[#1769FF]" />}
              {item.icon === 'Award' && <Award className="w-3 h-3 text-[#FFC928]" />}
              {item.icon === 'Projector' && <Projector className="w-3 h-3 text-[#1769FF]" />}
              <span>{item.label}</span>
              {item.badgeText && (
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                  item.badgeColor === 'yellow' ? 'bg-[#FFC928]/20 text-[#FFC928]' :
                  item.badgeColor === 'red' ? 'bg-[#FF304F]/20 text-[#FF304F]' :
                  'bg-[#1769FF]/20 text-[#287BFF]'
                }`}>
                  {item.badgeText}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* NAVIGATION ITEMS TABLE / LIST */}
      <div className="rounded-2xl bg-[#10182A] border border-[#26334A] overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#26334A] flex items-center justify-between">
          <div className="font-bold text-white text-sm uppercase tracking-wider font-mono">
            Configured Navigation Links & Promotional Offers
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Drag / Reorder priority
          </div>
        </div>

        <div className="divide-y divide-[#26334A]/60">
          {navItems.map((item, index) => {
            const isEditing = editingId === item.id;
            return (
              <div
                key={item.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  item.isActive ? 'hover:bg-[#121C30]' : 'opacity-60 bg-black/20'
                }`}
              >
                {/* Left: Reorder & Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-[#17243C] text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                      title="Move Up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === navItems.length - 1}
                      className="p-1 rounded hover:bg-[#17243C] text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                      title="Move Down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Icon & Label */}
                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                      <input
                        type="text"
                        value={editForm.label || ''}
                        onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                        className="bg-[#08152F] border border-[#1769FF]/50 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                        placeholder="Nav Label (e.g. Flash Deals)"
                      />
                      <select
                        value={editForm.target || 'limited-time'}
                        onChange={(e) => setEditForm({ ...editForm, target: e.target.value })}
                        className="bg-[#08152F] border border-[#26334A] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                      >
                        <option value="limited-time">Filter: Limited-Time Offers</option>
                        <option value="flash-deals">Section: Flash Deals & Special Offers</option>
                        <option value="trending-week">Filter: Trending This Week</option>
                        <option value="best-sellers">Filter: Best Sellers</option>
                        <option value="projectors">Section: 4K Smart Projectors</option>
                        {categories.map(c => (
                          <option key={c.id} value={`category:${c.id}`}>Category: {c.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editForm.badgeText || ''}
                          onChange={(e) => setEditForm({ ...editForm, badgeText: e.target.value })}
                          className="bg-[#08152F] border border-[#26334A] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none w-28"
                          placeholder="Badge Text"
                        />
                        <select
                          value={editForm.badgeColor || 'yellow'}
                          onChange={(e) => setEditForm({ ...editForm, badgeColor: e.target.value as any })}
                          className="bg-[#08152F] border border-[#26334A] rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
                        >
                          <option value="yellow">Yellow</option>
                          <option value="red">Red</option>
                          <option value="blue">Blue</option>
                          <option value="green">Green</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#08152F] border border-[#26334A] flex items-center justify-center shrink-0">
                        {item.icon === 'Clock' && <Clock className="w-4 h-4 text-[#FFC928]" />}
                        {item.icon === 'Flame' && <Flame className="w-4 h-4 text-[#FF304F]" />}
                        {item.icon === 'TrendingUp' && <TrendingUp className="w-4 h-4 text-[#1769FF]" />}
                        {item.icon === 'Award' && <Award className="w-4 h-4 text-[#FFC928]" />}
                        {item.icon === 'Projector' && <Projector className="w-4 h-4 text-[#1769FF]" />}
                        {!item.icon && <Layers className="w-4 h-4 text-slate-400" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{item.label}</span>
                          {item.badgeText && (
                            <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                              item.badgeColor === 'yellow' ? 'bg-[#FFC928]/15 text-[#FFC928] border border-[#FFC928]/30' :
                              item.badgeColor === 'red' ? 'bg-[#FF304F]/15 text-[#FF304F] border border-[#FF304F]/30' :
                              'bg-[#1769FF]/15 text-[#287BFF] border border-[#1769FF]/30'
                            }`}>
                              {item.badgeText}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                          <span>Target: <strong className="text-slate-300">{item.target}</strong></span>
                          <span>•</span>
                          <span>Type: <span className="capitalize">{item.type}</span></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg btn-primary text-xs font-bold"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditForm({}); }}
                        className="p-1.5 rounded-lg btn-secondary text-xs text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Toggle Active Switch */}
                      <button
                        onClick={() => toggleNavItemActive(item.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                          item.isActive
                            ? 'bg-[#00D99A]/15 text-[#00D99A] border border-[#00D99A]/30 hover:bg-[#00D99A]/25'
                            : 'bg-slate-800/60 text-slate-400 border border-slate-700 hover:bg-slate-800'
                        }`}
                        title={item.isActive ? 'Active on Storefront' : 'Hidden from Storefront'}
                      >
                        {item.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{item.isActive ? 'Active' : 'Disabled'}</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-2 rounded-lg btn-secondary text-slate-300 hover:text-white hover:border-[#1769FF]/50"
                        title="Edit Item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => deleteNavItem(item.id)}
                        className="p-2 rounded-lg bg-red-950/20 text-[#FF304F] hover:bg-[#FF304F]/20 border border-[#FF304F]/30 transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADD NAV ITEM MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg rounded-2xl bg-[#10182A] border border-[#26334A] shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#26334A] pb-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#1769FF]" />
                  <h3 className="font-bold text-white text-base">Add New Header Navigation Link</h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                    Link Display Label <span className="text-[#FF304F]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newItemForm.label}
                    onChange={(e) => setNewItemForm({ ...newItemForm, label: e.target.value })}
                    placeholder="e.g. VIP Drops, Weekend Steals, Steam Sale"
                    className="w-full bg-[#08152F] border border-[#26334A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#1769FF]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Target Action / Section</label>
                    <select
                      value={newItemForm.target}
                      onChange={(e) => setNewItemForm({ ...newItemForm, target: e.target.value })}
                      className="w-full bg-[#08152F] border border-[#26334A] rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#1769FF]"
                    >
                      <option value="limited-time">Filter: Limited-Time Offers</option>
                      <option value="flash-deals">Section: Flash Deals & Special Offers</option>
                      <option value="trending-week">Filter: Trending This Week</option>
                      <option value="best-sellers">Filter: Best Sellers</option>
                      <option value="projectors">Section: 4K Smart Projectors</option>
                      {categories.map(c => (
                        <option key={c.id} value={`category:${c.id}`}>Category: {c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Icon Style</label>
                    <select
                      value={newItemForm.icon}
                      onChange={(e) => setNewItemForm({ ...newItemForm, icon: e.target.value })}
                      className="w-full bg-[#08152F] border border-[#26334A] rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#1769FF]"
                    >
                      <option value="Clock">Clock (Yellow Accent)</option>
                      <option value="Flame">Flame (Red Accent)</option>
                      <option value="TrendingUp">Trending Up (Blue Accent)</option>
                      <option value="Award">Award / Trophy (Gold Accent)</option>
                      <option value="Projector">Projector (Tech Accent)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Badge Text (Optional)</label>
                    <input
                      type="text"
                      value={newItemForm.badgeText}
                      onChange={(e) => setNewItemForm({ ...newItemForm, badgeText: e.target.value })}
                      placeholder="e.g. HOT, 50% OFF, NEW"
                      className="w-full bg-[#08152F] border border-[#26334A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">Badge Color</label>
                    <select
                      value={newItemForm.badgeColor}
                      onChange={(e) => setNewItemForm({ ...newItemForm, badgeColor: e.target.value as any })}
                      className="w-full bg-[#08152F] border border-[#26334A] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="yellow">Yellow (#FFC928)</option>
                      <option value="red">Red (#FF304F)</option>
                      <option value="blue">Blue (#1769FF)</option>
                      <option value="green">Green (#00D99A)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#26334A]">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl btn-secondary text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl btn-primary text-xs font-bold uppercase tracking-wider"
                  >
                    Add Navigation Item
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
