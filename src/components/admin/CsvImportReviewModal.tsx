import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, Save, Upload, X } from 'lucide-react';
import { Product } from '../../types';

type ImportRow = {
  sourceFile: string;
  rowNumber: number;
  title: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string;
  description: string;
  variations?: { type: string; value: string; costPrice: number; price: number; stock: number }[];
};

type Props = {
  isOpen: boolean;
  products: Product[];
  onClose: () => void;
  onComplete: () => void;
  addToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
};

const normalizeHeader = (value: string) => value
  .replace(/^\uFEFF/, '').trim().replace(/^"|"$/g, '').toLowerCase()
  .replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

const parseCsv = (content: string, delimiter: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const clean = content.replace(/^\uFEFF/, '');
  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    if (char === '"') {
      if (quoted && clean[i + 1] === '"') { field += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(field); field = '';
    } else if (char === '\n' && !quoted) {
      row.push(field);
      if (row.some(cell => cell.trim())) rows.push(row);
      row = []; field = '';
    } else if (char !== '\r') field += char;
  }
  if (field || row.length) {
    row.push(field);
    if (row.some(cell => cell.trim())) rows.push(row);
  }
  return rows;
};

const categoryId = (value: string) => {
  const text = value.toLowerCase();
  if (text.includes('gift') || text.includes('crypto')) return 'gift-cards';
  if (text.includes('software') || text.includes('windows') || text.includes('office')) return 'software';
  if (text.includes('saas') || text.includes('ai') || text.includes('tool')) return 'saas';
  if (text.includes('stream') || text.includes('netflix') || text.includes('spotify')) return 'streaming';
  if (text.includes('iptv') || text.includes(' tv')) return 'iptv';
  if (text.includes('projector')) return 'smart-projectors';
  if (text.includes('coach') || text.includes('session')) return 'game-coaching';
  if (text.includes('companion')) return 'gamepal-companion';
  return 'gaming';
};

const firstValue = (record: Record<string, string>, names: string[]) => names.map(name => record[name]).find(Boolean) || '';

async function readFiles(files: File[]): Promise<{ rows: ImportRow[]; errors: string[] }> {
  const rows: ImportRow[] = [];
  const errors: string[] = [];
  const titleNames = ['name', 'title', 'product name', 'product title', 'item name', 'post title'];

  for (const file of files) {
    const text = await file.text();
    const firstLine = text.replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0] || '';
    const delimiter = [',', ';', '\t'].reduce((best, candidate) =>
      firstLine.split(candidate).length > firstLine.split(best).length ? candidate : best, ',');
    const csvRows = parseCsv(text, delimiter);
    const headerIndex = csvRows.findIndex(candidate => {
      const headers = candidate.map(normalizeHeader);
      return headers.includes('sku') && titleNames.some(title => headers.includes(title));
    });
    if (headerIndex < 0) {
      errors.push(`${file.name}: include SKU and Name or Title columns`);
      continue;
    }
    const headers = csvRows[headerIndex].map(normalizeHeader);
    const records = csvRows.slice(headerIndex + 1).map((values, index) => {
      const record: Record<string, string> = {};
      headers.forEach((header, column) => { record[header] = (values[column] || '').trim(); });
      return { record, rowNumber: index + headerIndex + 2 };
    }).filter(item => item.record.sku.toLowerCase() !== 'sku');

    const parents = records.filter(({ record }) => (record.type || '').toLowerCase() !== 'variation' || !record.parent);
    for (const { record, rowNumber } of parents) {
      const sku = firstValue(record, ['sku', 'id']) || `PB-CSV-${Date.now()}-${rowNumber}`;
      const title = firstValue(record, titleNames) || 'Untitled Product';
      const description = firstValue(record, ['description', 'short description']).replace(/<[^>]+>/g, '').slice(0, 500);
      const price = Number.parseFloat(firstValue(record, ['sale price', 'regular price', 'price', 'costprice'])) || 29.99;
      const stockValue = Number.parseInt(firstValue(record, ['stock', 'stock quantity']), 10);
      const stock = Number.isFinite(stockValue) ? Math.max(0, stockValue) : 50;
      const children = records.filter(child => child.record.parent.toLowerCase() === sku.toLowerCase());
      const variationRecords = children.length ? children : (record['attribute 1 value(s)'] ? [{ record, rowNumber }] : []);
      const variations = variationRecords.flatMap(({ record: variation }) => {
        const values = firstValue(variation, ['attribute 1 value(s)', 'attribute values']).split(/[|,]/).map(value => value.trim()).filter(Boolean);
        const variationPrice = Number.parseFloat(firstValue(variation, ['sale price', 'regular price', 'price'])) || price;
        const variationStock = Number.parseInt(firstValue(variation, ['stock', 'stock quantity']), 10) || stock;
        return values.map(value => ({ type: firstValue(variation, ['attribute 1 name']) || 'Option', value, costPrice: variationPrice * 0.8, price: variationPrice, stock: variationStock }));
      });
      const rawImage = firstValue(record, ['images', 'imageurl', 'image']);
      rows.push({ sourceFile: file.name, rowNumber, title, sku, category: categoryId(firstValue(record, ['categories', 'category', 'categoryid'])), price, stock, imageUrl: rawImage ? rawImage.split(',')[0].trim() : undefined, description, variations: variations.length ? variations : undefined });
    }
  }
  return { rows, errors };
}

export const CsvImportReviewModal: React.FC<Props> = ({ isOpen, products, onClose, onComplete, addToast }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isReading, setIsReading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  const existingSkus = useMemo(() => new Set(products.map(product => product.sku.toLowerCase())), [products]);
  const updates = rows.filter(row => existingSkus.has(row.sku.toLowerCase())).length;
  const newProducts = rows.length - updates;

  if (!isOpen) return null;

  const chooseFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;
    setFiles(selected); setReviewed(false); setIsReading(true);
    const result = await readFiles(selected);
    setRows(result.rows); setErrors(result.errors); setIsReading(false);
    event.target.value = '';
  };

  const save = async (publish: boolean) => {
    if (!rows.length || isSaving) return;
    setIsSaving(true);
    let updated = 0;
    let imported = 0;
    let failed = 0;
    const catalog = new Map(products.map(product => [product.sku.toLowerCase(), product]));
    try {
      for (const row of rows) {
        const existing = catalog.get(row.sku.toLowerCase());
        const payload = { title: row.title, description: row.description, shortDescription: row.description.slice(0, 140), price: row.price, costPrice: row.price * 0.8, stock: row.stock, categoryId: row.category, variations: row.variations, images: row.imageUrl ? [row.imageUrl] : undefined, status: publish ? 'published' : 'pending_approval' };
        const response = await fetch(existing ? `/api/products/${encodeURIComponent(existing.id)}` : '/api/import/batch', {
          method: existing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(existing ? payload : { items: [{ externalId: row.sku, title: row.title, description: row.description, category: row.category, costPrice: row.price * 0.8, price: row.price, stock: row.stock, sku: row.sku, imageUrl: row.imageUrl, productType: 'digital', variations: row.variations }], markupType: 'percentage', markupValue: 25, autoApprove: publish }),
        });
        if (!response.ok) { failed += 1; continue; }
        existing ? updated += 1 : imported += 1;
      }
      if (failed) addToast('warning', 'Import Partially Saved', `${updated + imported} saved, ${failed} failed. Review the server logs for failed rows.`);
      else addToast('success', publish ? 'CSV Published' : 'CSV Saved for Review', `${updated} updates and ${imported} new products ${publish ? 'are live' : 'are queued for approval'}.`);
      onComplete(); onClose();
    } catch (error) {
      addToast('error', 'Import Failed', error instanceof Error ? error.message : 'Could not save the CSV import.');
    } finally { setIsSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="csv-review-title">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl bg-[#10121b] border border-white/10 shadow-2xl flex flex-col">
        <div className="p-5 border-b border-white/10 flex items-start justify-between gap-3">
          <div><div className="text-[10px] uppercase tracking-widest text-emerald-400 font-mono font-bold">Catalog ingestion</div><h2 id="csv-review-title" className="text-xl font-bold text-white mt-1">CSV Import Review</h2><p className="text-xs text-gray-400 mt-1">List files, inspect normalized rows, then save as pending or publish to the storefront.</p></div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white" aria-label="Close CSV review"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">
          <label className="flex items-center justify-center gap-2 p-5 rounded-xl border border-dashed border-emerald-400/40 bg-emerald-500/5 text-emerald-300 text-sm font-semibold cursor-pointer hover:bg-emerald-500/10"><Upload className="w-4 h-4" /> Choose one or more CSV files<input type="file" accept=".csv,text/csv" multiple className="sr-only" onChange={chooseFiles} /></label>
          {files.length > 0 && <div className="flex flex-wrap gap-2">{files.map(file => <span key={file.name} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 flex items-center gap-1.5"><FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />{file.name}</span>)}</div>}
          {isReading && <div className="flex items-center gap-2 text-xs text-gray-400"><Loader2 className="w-4 h-4 animate-spin" />Reading and normalizing files…</div>}
          {rows.length > 0 && <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><div className="p-3 rounded-xl bg-white/5 border border-white/10"><div className="text-[10px] uppercase text-gray-500">Rows ready</div><div className="text-xl text-white font-bold">{rows.length}</div></div><div className="p-3 rounded-xl bg-blue-500/10 border border-blue-400/20"><div className="text-[10px] uppercase text-blue-300">New</div><div className="text-xl text-white font-bold">{newProducts}</div></div><div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/20"><div className="text-[10px] uppercase text-amber-300">SKU updates</div><div className="text-xl text-white font-bold">{updates}</div></div><div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/20"><div className="text-[10px] uppercase text-emerald-300">Files</div><div className="text-xl text-white font-bold">{files.length}</div></div></div>}
          {errors.length > 0 && <div className="p-3 rounded-xl border border-red-400/30 bg-red-500/10 text-xs text-red-200 space-y-1"><div className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Files needing attention</div>{errors.map(error => <div key={error}>{error}</div>)}</div>}
          {rows.length > 0 && <div className="rounded-xl border border-white/10 overflow-hidden"><div className="px-4 py-3 bg-white/5 flex items-center justify-between"><span className="text-xs font-bold text-white">Review normalized products</span><span className="text-[10px] text-gray-500">Prices, stock, categories, variations</span></div><div className="max-h-72 overflow-auto"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-[#151925] text-gray-500 uppercase text-[10px]"><tr><th className="p-3">Source / row</th><th className="p-3">Product</th><th className="p-3">SKU</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Action</th></tr></thead><tbody className="divide-y divide-white/5">{rows.map(row => <tr key={`${row.sourceFile}-${row.rowNumber}`}><td className="p-3 text-gray-400">{row.sourceFile} · {row.rowNumber}</td><td className="p-3 text-white font-medium max-w-xs truncate">{row.title}</td><td className="p-3 text-gray-400 font-mono">{row.sku}</td><td className="p-3 text-amber-300 font-mono">${row.price.toFixed(2)}</td><td className="p-3 text-gray-300 font-mono">{row.stock}</td><td className="p-3">{existingSkus.has(row.sku.toLowerCase()) ? <span className="text-amber-300">Update</span> : <span className="text-blue-300">New</span>}</td></tr>)}</tbody></table></div></div>}
        </div>
        <div className="p-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3"><div className="text-[11px] text-gray-500">{reviewed ? 'Review acknowledged. Choose how to save.' : rows.length ? 'Please review the rows before saving.' : 'No file selected yet.'}</div><div className="flex gap-2"><button onClick={() => setReviewed(true)} disabled={!rows.length || isReading} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-bold disabled:opacity-40"><CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />Mark reviewed</button><button onClick={() => save(false)} disabled={!reviewed || isSaving} className="px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs font-bold disabled:opacity-40"><Save className="w-3.5 h-3.5 inline mr-1.5" />Save for approval</button><button onClick={() => save(true)} disabled={!reviewed || isSaving} className="px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold disabled:opacity-40"><Upload className="w-3.5 h-3.5 inline mr-1.5" />Save & publish</button></div></div>
      </div>
    </div>
  );
};
