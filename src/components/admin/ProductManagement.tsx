import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuthStore } from '../../store/useAuthStore';
import { Product, ProductType } from '../../types';
import { ProductEditorModal } from './ProductEditorModal';
import { CsvImportReviewModal } from './CsvImportReviewModal';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Zap,
  Truck,
  Layers,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Eye,
  Upload,
  RotateCcw,
  LogOut,
  Loader2,
  Package,
  Copy,
  Archive,
} from 'lucide-react';

export const ProductManagement: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, formatPrice, setSelectedProduct, addToast, setCurrentUser, setActiveView, refreshProducts } = useStore();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ProductType>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);
  const [isCsvReviewOpen, setIsCsvReviewOpen] = useState(false);
  const [isMigratingVars, setIsMigratingVars] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // CSV import — handles both simple CSV and WooCommerce export format
  // Supports quoted fields with embedded commas/newlines
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setCsvUploading(true);

    try {
      // Read every selected CSV and combine them. Each file may include its
      // own header; repeated headers are filtered out below.
      const text = (await Promise.all(files.map((file) => file.text()))).join('\n');
      // Remove BOM
      const cleanText = text.replace(/^\uFEFF/, '');

      // Accept standard comma CSV plus semicolon and tab-delimited exports.
      // Looking only at the first line avoids counting commas inside quoted
      // product descriptions.
      const firstLine = cleanText.split(/\r?\n/, 1)[0] || '';
      const delimiters = [',', ';', '\t'];
      const delimiter = delimiters.reduce((best, candidate) =>
        (firstLine.split(candidate).length > firstLine.split(best).length ? candidate : best), ',');

      // Parse CSV with proper quote handling
      const rows: string[][] = [];
      let currentRow: string[] = [];
      let currentField = '';
      let inQuotes = false;

      for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];
        if (char === '"') {
          if (inQuotes && cleanText[i + 1] === '"') {
            currentField += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          currentRow.push(currentField);
          currentField = '';
        } else if (char === '\n' && !inQuotes) {
          currentRow.push(currentField);
          if (currentRow.some(f => f.trim())) rows.push(currentRow);
          currentRow = [];
          currentField = '';
        } else if (char === '\r') {
          // skip
        } else {
          currentField += char;
        }
      }
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField);
        if (currentRow.some(f => f.trim())) rows.push(currentRow);
      }

      if (rows.length < 2) {
        addToast('error', 'CSV Invalid', 'CSV must have a header row and at least one product row.');
        setCsvUploading(false);
        e.target.value = '';
        return;
      }

      // Normalize headers from WooCommerce, Shopify, supplier exports, and
      // simple CSV files (BOM, quotes, underscores, and spacing are ignored).
      const normalizeHeader = (header: string) => header
        .replace(/^\uFEFF/, '')
        .trim()
        .replace(/^"|"$/g, '')
        .toLowerCase()
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ');
      const titleHeaders = ['name', 'title', 'product name', 'product title', 'item name', 'post title'];
      const headerIndex = rows.findIndex((row) => {
        const candidateHeaders = row.map(normalizeHeader);
        return candidateHeaders.includes('sku') && titleHeaders.some((header) => candidateHeaders.includes(header));
      });
      if (headerIndex < 0) {
        addToast('error', 'CSV Invalid', 'Could not find a product header row. Include SKU and Name or Title columns.');
        setCsvUploading(false);
        e.target.value = '';
        return;
      }
      const headers = rows[headerIndex].map(normalizeHeader);
      const titleHeader = titleHeaders.some((header) => headers.includes(header));
      if (!titleHeader) {
        addToast('error', 'CSV Invalid', 'CSV must include a Name or Title column.');
        setCsvUploading(false);
        e.target.value = '';
        return;
      }

      // Map category string to our category IDs
      const mapCategory = (catStr: string): string => {
        const c = (catStr || '').toLowerCase();
        if (c.includes('gift card') || c.includes('crypto')) return 'gift-cards';
        if (c.includes('gaming') || c.includes('game')) return 'gaming';
        if (c.includes('software') || c.includes('windows') || c.includes('office')) return 'software';
        if (c.includes('saas') || c.includes('ai') || c.includes('tool')) return 'saas';
        if (c.includes('stream') || c.includes('netflix') || c.includes('spotify')) return 'streaming';
        if (c.includes('iptv') || c.includes('tv')) return 'iptv';
        if (c.includes('projector')) return 'smart-projectors';
        if (c.includes('coaching') || c.includes('session')) return 'game-coaching';
        if (c.includes('companion')) return 'gamepal-companion';
        return 'gaming';
      };

      // Normalize rows first so WooCommerce exports can be grouped by their
      // parent SKU instead of importing every variation as a new product.
      const records = rows.slice(headerIndex + 1).map((cols) => {
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = (cols[i] || '').trim(); });
        return row;
      }).filter((row) => row['sku']?.toLowerCase() !== 'sku');

      const parentRows = records.filter((row) => (row['type'] || '').toLowerCase() !== 'variation' || !row['parent']);

      // Parse each parent product and attach its WooCommerce variations.
      const items = parentRows.map((row, idx) => {

        const name = row['name'] || row['title'] || row['product name'] || row['product title'] || row['item name'] || row['post title'] || 'Untitled Product';
        const sku = row['sku'] || `PB-${row['id'] || Date.now()}-${idx}`;
        const shortDesc = row['short description'] || row['shortdescription'] || '';
        const desc = (row['description'] || shortDesc).replace(/<[^>]+>/g, '').substring(0, 500);
        const childRows = records.filter((candidate) => candidate['parent'].toLowerCase() === sku.toLowerCase());
        const firstChildPrice = childRows
          .map((child) => parseFloat(child['sale price'] || child['regular price'] || child['price'] || ''))
          .find((value) => Number.isFinite(value) && value > 0);
        const price = firstChildPrice || parseFloat(row['sale price'] || row['regular price'] || row['price'] || row['costprice'] || '29.99') || 29.99;
        const category = mapCategory(row['categories'] || row['category'] || row['categoryid'] || '');
        const parsedStock = parseInt(row['stock'] || row['stock quantity'] || '', 10);
        const stock = Number.isFinite(parsedStock)
          ? Math.max(0, parsedStock)
          : (row['in stock?'] === '1' || row['in stock'] === '1' ? 100 : 50);
        const images = row['images'] || row['imageurl'] || row['image'] || '';
        const imageUrl = images ? images.split(',')[0].trim().replace(/^"|"$/g, '') : 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/1a2604e96f45.jpg';
        const attrValues = row['attribute 1 value(s)'] || '';

        // Parse variations from attribute values like "$10 | $25 | $50 | $100"
        let variations: { type: string; value: string; costPrice: number; stock: number }[] | undefined;
        const variationSourceRows = childRows.length > 0 ? childRows : (attrValues ? [{
          'attribute 1 name': row['attribute 1 name'] || 'Denomination',
          'attribute 1 value(s)': attrValues,
          stock: String(stock),
          'regular price': String(price),
        }] : []);
        if (variationSourceRows.length > 0) {
          variations = variationSourceRows.flatMap((variationRow) => {
            const values = (variationRow['attribute 1 value(s)'] || '').split(/[|,]/).map(v => v.trim()).filter(Boolean);
            const variationPrice = parseFloat(variationRow['sale price'] || variationRow['regular price'] || variationRow['price'] || String(price)) || price;
            const variationStock = Math.max(0, parseInt(variationRow.stock || variationRow['stock quantity'] || String(stock), 10) || 0);
            return values.map((value) => ({
              type: variationRow['attribute 1 name'] || row['attribute 1 name'] || 'Option',
              value,
              costPrice: variationPrice * 0.8,
              price: variationPrice,
              stock: variationStock,
            }));
          });
        }

        return {
          externalId: sku,
          title: name,
          description: desc,
          category: category,
          costPrice: price * 0.8,
          price,
          stock: stock,
          sku: sku,
          imageUrl: imageUrl,
          productType: 'digital' as const,
          variations: variations,
          csvPrice: parseFloat(row['sale price'] || row['regular price'] || row['price'] || row['costprice'] || '29.99') || 29.99,
        };
      });

      // A matching SKU is an update, not a duplicate. This lets the product
      // manager refresh pricing, stock, content, and publication status from
      // a supplier export without creating renamed copies.
      let catalogForMatching = products;
      try {
        const catalogResponse = await fetch('/api/products', { headers: { 'x-admin-query': 'true' } });
        const catalogData = await catalogResponse.json();
        if (catalogResponse.ok && Array.isArray(catalogData.products)) catalogForMatching = catalogData.products;
      } catch {
        // Fall back to the catalog already loaded in the store.
      }
      const existingBySku = new Map(catalogForMatching.map((product) => [product.sku.toLowerCase(), product]));
      const updates = items.filter((item) => existingBySku.has(item.sku.toLowerCase()));
      const newItems = items.filter((item) => !existingBySku.has(item.sku.toLowerCase()));

      addToast('info', 'CSV Parsed', `${items.length} products found: ${updates.length} updates and ${newItems.length} new products.`);

      let updatedCount = 0;
      let updateFailures = 0;
      for (const item of updates) {
        const existing = existingBySku.get(item.sku.toLowerCase());
        if (!existing) continue;
        try {
          const response = await fetch(`/api/products/${encodeURIComponent(existing.id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: item.title,
              description: item.description,
              shortDescription: item.description.substring(0, 140),
              price: item.csvPrice,
              costPrice: item.costPrice,
              stock: item.stock,
              categoryId: item.category,
              variations: item.variations,
              images: item.imageUrl ? [item.imageUrl] : existing.images,
              status: 'published',
            }),
          });
          if (response.ok) updatedCount++;
          else updateFailures++;
        } catch {
          updateFailures++;
        }
      }

      // Import in batches of 20 to avoid payload size limits
      const batchSize = 20;
      let totalImported = 0;
      let failedBatches = 0;
      let lastImportError = '';

      for (let i = 0; i < newItems.length; i += batchSize) {
        const batch = newItems.slice(i, i + batchSize);
        try {
          const res = await fetch('/api/import/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: batch, markupType: 'percentage', markupValue: 25, autoApprove: true }),
          });
          const data = await res.json();
          if (res.ok && data.success && data.importJob) {
            totalImported += data.importJob.importedCount;
          } else {
            failedBatches++;
            lastImportError = data.error || `Batch ${Math.floor(i / batchSize) + 1} failed with HTTP ${res.status}.`;
          }
        } catch (error) {
          failedBatches++;
          lastImportError = error instanceof Error ? error.message : 'Network error while importing a batch.';
        }
      }

      if (updatedCount > 0 || totalImported > 0) {
        const failures = failedBatches + updateFailures;
        const suffix = failures > 0 ? ` ${failures} row/batch update(s) failed.` : '';
        addToast('success', 'CSV Published', `${updatedCount} existing products updated and ${totalImported} new products published.${suffix} Reloading...`);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        addToast('error', 'Import Failed', lastImportError || 'No products were updated or imported. Check the CSV format and server configuration.');
      }
    } catch {
      addToast('error', 'CSV Error', 'Could not parse the CSV file.');
    }
    setCsvUploading(false);
    e.target.value = '';
  };

  // Reset database
  const handleResetDb = async () => {
    if (!window.confirm('This will DELETE all products, orders, customers, and settings. The Super Admin account will be retained, but all application data will be reset to zero. Continue?')) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/reset-db', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'Database Reset', 'All application data is now zero. Super Admin access was retained. Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        addToast('error', 'Reset Failed', data.error || 'Could not reset database.');
      }
    } catch {
      addToast('error', 'Reset Failed', 'Network error.');
    }
    setIsResetting(false);
  };

  // Logout super admin everywhere
  const handleLogoutEverywhere = async () => {
    if (!window.confirm('This will log out the super admin from ALL sessions and devices. Continue?')) return;
    setIsLoggingOut(true);
    try {
      // Clear Zustand auth store
      useAuthStore.getState().logout();

      // Clear StoreContext
      setCurrentUser({
        id: 'guest', name: 'Guest', email: '', role: 'customer',
        twoFactorEnabled: false, addresses: [], totalSpent: 0, ordersCount: 0,
        wishlist: [], status: 'active', createdAt: new Date().toISOString(),
      });

      addToast('info', 'Logged Out Everywhere', 'Super admin session terminated on all devices.');
      setActiveView('store');
      window.history.pushState({ view: 'store' }, '', '/');
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      addToast('error', 'Logout Failed', 'Could not complete global logout.');
    }
    setIsLoggingOut(false);
  };

  const filteredProducts = products.filter(p => {
    if (typeFilter !== 'all' && p.productType !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q);
    }
    return true;
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete ${title}?`)) {
      deleteProduct(id);
      addToast('info', 'Product Deleted', `${title} has been removed.`);
    }
  };

  const handleDuplicate = (product: Product) => {
    const baseSku = `${product.sku}-COPY`;
    const usedSkus = new Set(products.map((item) => item.sku.toLowerCase()));
    let nextSku = baseSku;
    let suffix = 2;
    while (usedSkus.has(nextSku.toLowerCase())) nextSku = `${baseSku}-${suffix++}`;
    const now = new Date().toISOString();
    const duplicate: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      title: `${product.title} (Copy)`,
      slug: `${product.slug}-copy`,
      sku: nextSku,
      status: 'draft',
      variations: product.variations.map((variation, index) => ({
        ...variation,
        id: `v-${Date.now()}-${index}`,
        sku: variation.sku ? `${variation.sku}-COPY` : undefined,
      })),
      createdAt: now,
      updatedAt: now,
    };
    addProduct(duplicate);
    addToast('success', 'Product Duplicated', `${duplicate.title} was created as a draft.`);
  };

  const handleArchive = (product: Product) => {
    if (product.status === 'archived') return;
    if (!window.confirm(`Archive ${product.title}? It will be hidden from the storefront.`)) return;
    updateProduct(product.id, { status: 'archived' });
    addToast('info', 'Product Archived', `${product.title} is no longer visible on the storefront.`);
  };

  // Migrate product variations
  // Calls /api/admin/products/migrate-variations — a dry-run first, then
  // asks for confirmation, then applies.
  const handleMigrateVariations = async () => {
    if (isMigratingVars) return;
    setIsMigratingVars(true);

    try {
      // Step 1: dry-run preview
      const previewRes = await fetch('/api/admin/products/migrate-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apply: false }),
      });
      const preview = await previewRes.json();

      if (!preview.success) {
        addToast('error', 'Migration Failed', preview.error || 'Could not preview variations.');
        setIsMigratingVars(false);
        return;
      }

      if (preview.targeted === 0) {
        addToast('info', 'Nothing to Migrate', 'All products already have rich variations.');
        setIsMigratingVars(false);
        return;
      }

      const sampleList = preview.sample.length > 0
        ? preview.sample.map((s: any) => `• ${s.title} (${s.categoryId}) → ${s.variationsCount} variants`).join('\n')
        : '';
      const ok = window.confirm(
        `Variation Migration Preview\n\n` +
        `Scanned: ${preview.scanned}\n` +
        `Will update: ${preview.targeted}\n` +
        `Skipped (projectors / already migrated): ${preview.skipped}\n\n` +
        `Sample:\n${sampleList}\n\n` +
        `Apply changes to the database now?`
      );
      if (!ok) {
        addToast('info', 'Migration Cancelled', 'No changes were applied.');
        setIsMigratingVars(false);
        return;
      }

      // Step 2: apply
      const applyRes = await fetch('/api/admin/products/migrate-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apply: true }),
      });
      const applied = await applyRes.json();
      if (applied.success) {
        addToast(
          'success',
          'Variations Migrated',
          `Updated ${applied.targeted} products with rich variations. Reloading…`
        );
        setTimeout(() => window.location.reload(), 1800);
      } else {
        addToast('error', 'Migration Failed', applied.error || 'Could not apply migration.');
      }
    } catch (err: any) {
      addToast('error', 'Migration Failed', err?.message || 'Network error during migration.');
    }
    setIsMigratingVars(false);
  };

  return (
    <div className="space-y-6 pb-fade-up">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl pb-panel shadow-lg">
        <div>
          <span className="pb-eyebrow">
            <Package className="w-3 h-3" />
            Catalog Management
          </span>
          <h2 className="text-xl font-bold text-white font-display mt-1">Product Catalog & SKUs</h2>
          <p className="text-xs text-[var(--pb-silver-3)] mt-0.5">
            Manage instant digital keys, subscriptions, and 4K physical projector inventories.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* CSV Import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            multiple
            onChange={handleCsvUpload}
            className="hidden"
          />
          <button
            onClick={() => setIsCsvReviewOpen(true)}
            disabled={csvUploading}
            className="pb-btn pb-btn-success pb-btn-sm"
            title="Update matching SKUs, publish them, and add new products from a CSV file"
          >
            {csvUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>CSV Import</span>
          </button>

          {/* Add New Product */}
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsEditorOpen(true);
            }}
            className="pb-btn pb-btn-primary pb-btn-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>

          {/* Migrate Variations */}
          <button
            onClick={handleMigrateVariations}
            disabled={isMigratingVars}
            className="pb-btn pb-btn-secondary pb-btn-sm"
            title="Generate category-aware variations (durations, editions, sessions) for products that currently have only the CSV-import default variation."
          >
            {isMigratingVars ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
            <span>Migrate Variations</span>
          </button>

          {/* Dashboard Reset */}
          <button
            onClick={handleResetDb}
            disabled={isResetting}
            className="pb-btn pb-btn-dark pb-btn-sm"
            title="Clear all application data to zero (destructive!)"
          >
            {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            <span>Reset DB</span>
          </button>

          {/* Logout Super Admin Everywhere */}
          <button
            onClick={handleLogoutEverywhere}
            disabled={isLoggingOut}
            className="pb-btn pb-btn-ghost pb-btn-sm"
            title="Log out super admin from all sessions and devices"
          >
            {isLoggingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
            <span>Logout All</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl pb-panel">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[var(--pb-silver-4)] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by title, SKU, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pb-input pl-9"
          />
        </div>

        <div className="pb-tabs">
          <button
            onClick={() => setTypeFilter('all')}
            className={`pb-tab ${typeFilter === 'all' ? 'is-active' : ''}`}
          >
            All ({products.length})
          </button>
          <button
            onClick={() => setTypeFilter('digital')}
            className={`pb-tab ${typeFilter === 'digital' ? 'is-active' : ''}`}
          >
            <Zap className="w-3 h-3" /> Digital
          </button>
          <button
            onClick={() => setTypeFilter('physical_projector')}
            className={`pb-tab ${typeFilter === 'physical_projector' ? 'is-active' : ''}`}
          >
            <Truck className="w-3 h-3" /> 4K Projectors
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl pb-panel overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="pb-table min-w-[900px]">
            <thead>
              <tr>
                <th>Product Details</th>
                <th>SKU / Type</th>
                <th>Status</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Variations</th>
                <th>Flags</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const isPhysical = p.productType === 'physical_projector';
                const stockLow = p.stock <= p.lowStockThreshold;
                const stockOut = p.stock <= 0;
                const statusClass =
                  p.status === 'published' ? 'pb-status-published'
                  : p.status === 'draft' ? 'pb-status-draft'
                  : p.status === 'archived' ? 'pb-status-archived'
                  : 'pb-status-draft';
                const flags: string[] = [];
                if (p.isFeatured) flags.push('★');
                if (p.isTrending) flags.push('↑');
                if (p.isBestSeller) flags.push('BS');
                if (p.isFlashDeal) flags.push('⚡');
                if (p.isLimitedTime) flags.push('⏰');

                return (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images?.[0] || ''}
                          alt={p.title}
                          loading="lazy"
                          className="w-10 h-10 rounded object-cover bg-[var(--pb-charcoal-2)] shrink-0 border border-[var(--pb-line)]"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate max-w-xs">{p.title}</div>
                          <div className="text-[11px] text-[var(--pb-silver-3)]">{p.categoryName}</div>
                        </div>
                      </div>
                    </td>

                    <td className="font-mono">
                      <div className="text-white font-bold">{p.sku}</div>
                      <div className="mt-0.5">
                        {isPhysical ? (
                          <span className="pb-badge pb-badge-blue">
                            <Truck className="w-2.5 h-2.5" /> 4K
                          </span>
                        ) : (
                          <span className="pb-badge pb-badge-green">
                            <Zap className="w-2.5 h-2.5" /> Digital
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className={`pb-status ${statusClass}`}>{p.status}</span>
                    </td>

                    <td className="font-mono">
                      <div className="pb-price-current !text-sm">{formatPrice(p.price)}</div>
                      {p.compareAtPrice > p.price && (
                        <div className="pb-price-original">{formatPrice(p.compareAtPrice)}</div>
                      )}
                    </td>

                    <td className="font-mono">
                      <span className={`pb-status ${stockOut ? 'pb-status-out-stock' : stockLow ? 'pb-status-low-stock' : 'pb-status-in-stock'}`}>
                        {p.stock} units
                      </span>
                    </td>

                    <td className="font-mono text-[var(--pb-silver-2)]">
                      {p.variations && p.variations.length > 0 ? (
                        <span className="text-xs font-semibold text-white">{p.variations.length} opts</span>
                      ) : (
                        <span className="text-[var(--pb-silver-4)]">Single SKU</span>
                      )}
                    </td>

                    <td>
                      <div className="flex flex-wrap gap-1 max-w-[120px]">
                        {flags.length === 0 ? (
                          <span className="text-[var(--pb-silver-4)] text-[10px]">—</span>
                        ) : (
                          flags.map((f, i) => (
                            <span
                              key={i}
                              className="pb-badge pb-badge-dark"
                              title={f === '★' ? 'Featured' : f === '↑' ? 'Trending' : f === 'BS' ? 'Best Seller' : f === '⚡' ? 'Flash Deal' : 'Limited Time'}
                            >
                              {f}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedProduct(p)}
                          className="p-2 rounded text-[var(--pb-silver-3)] hover:text-[var(--pb-red-bright)] hover:bg-[var(--pb-red-soft)] transition-colors"
                          title="Preview (as customers will see it)"
                          aria-label={`Preview ${p.title}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setIsEditorOpen(true);
                          }}
                          className="p-2 rounded text-[var(--pb-silver-3)] hover:text-white hover:bg-white/10 transition-colors"
                          title="Edit Product"
                          aria-label={`Edit ${p.title}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDuplicate(p)}
                          className="p-2 rounded text-[var(--pb-silver-3)] hover:text-white hover:bg-white/10 transition-colors"
                          title="Duplicate as draft"
                          aria-label={`Duplicate ${p.title}`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleArchive(p)}
                          disabled={p.status === 'archived'}
                          className="p-2 rounded text-[var(--pb-silver-3)] hover:text-amber-300 hover:bg-amber-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Archive product"
                          aria-label={`Archive ${p.title}`}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(p.id, p.title)}
                          className="p-2 rounded text-[var(--pb-silver-3)] hover:text-[#FF2E42] hover:bg-[var(--pb-red-soft)] transition-colors"
                          title="Delete Product"
                          aria-label={`Delete ${p.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      <ProductEditorModal
        product={editingProduct}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingProduct(null);
        }}
      />

      <CsvImportReviewModal
        isOpen={isCsvReviewOpen}
        products={products}
        addToast={addToast}
        onClose={() => setIsCsvReviewOpen(false)}
        onComplete={() => {
          refreshProducts();
          setTimeout(() => window.location.reload(), 900);
        }}
      />
    </div>
  );
};
