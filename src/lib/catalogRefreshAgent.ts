import type { Product } from '../types.js';
import * as repo from './repository.js';

export const CATALOG_SOURCE_URL = process.env.PLAYBEAT_SOURCE_URL || 'https://playbeatdigital.store';
export const CATALOG_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

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

type SourceProduct = {
  title: string;
  price: number;
  compareAtPrice: number;
  categoryId: string;
  categoryName: string;
  sourceUrl: string;
};

const status: AgentStatus = {
  enabled: true,
  running: false,
  sourceUrl: CATALOG_SOURCE_URL,
  lastScanned: 0,
  lastUpdated: 0,
  lastCreated: 0,
};

let refreshPromise: Promise<AgentStatus> | null = null;
let schedulerStarted = false;
let scheduler: ReturnType<typeof setInterval> | undefined;

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function classify(title: string, block: string): { id: string; name: string } {
  const text = `${title} ${block}`.toLowerCase();
  if (/gift card|voucher|wallet|crypto|bitcoin|ethereum|tether|litecoin|binance|dogecoin/.test(text)) return { id: 'gift-cards', name: 'Gift Cards & Vouchers' };
  if (/game|steam|xbox|playstation|nintendo|fortnite|battle\.net|ubisoft|ea app/.test(text)) return { id: 'gaming', name: 'Games & Gaming Keys' };
  if (/netflix|spotify|hulu|disney|youtube|prime video|hbo|max|streaming|vpn/.test(text)) return { id: 'streaming', name: 'Streaming & VPN Passes' };
  if (/chatgpt|claude|midjourney|cursor|perplexity|capcut|canva|gemini|ai assistant|ai tool/.test(text)) return { id: 'saas', name: 'AI Tools & Subscriptions' };
  if (/bundle|saver pack|creator master/.test(text)) return { id: 'bundles', name: 'Digital Value Bundles' };
  return { id: 'software', name: 'Software & OS Keys' };
}

function parseMoney(value: string): number | null {
  const parsed = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseSourceProducts(html: string): SourceProduct[] {
  const products: SourceProduct[] = [];
  const headingPattern = /<h3\b[^>]*>([\s\S]*?)<\/h3>/gi;
  let match: RegExpExecArray | null;
  while ((match = headingPattern.exec(html))) {
    const title = stripHtml(match[1]);
    if (!title || title.length < 3 || title.length > 180 || /^(explore|filter|sort|load more|why buyers|trusted)/i.test(title)) continue;
    const block = html.slice(match.index, match.index + 1800);
    const text = stripHtml(block);
    const moneyMatches = [...text.matchAll(/\$\s*([0-9][0-9,]*(?:\.\d{1,2})?)/g)]
      .map((item) => parseMoney(item[1]))
      .filter((value): value is number => value !== null);
    if (moneyMatches.length === 0) continue;
    const price = moneyMatches[0];
    const compareAtPrice = moneyMatches.find((value) => value > price) || price;
    const category = classify(title, text);
    const sourceUrl = `${CATALOG_SOURCE_URL.replace(/\/$/, '')}/product/${slugify(title)}`;
    if (!products.some((product) => product.title.toLowerCase() === title.toLowerCase())) {
      products.push({ title, price, compareAtPrice, categoryId: category.id, categoryName: category.name, sourceUrl });
    }
  }
  return products;
}

function parseEmbeddedProducts(bundle: string): SourceProduct[] {
  const products: SourceProduct[] = [];
  const productPattern = /\{id:"([^"]+)",slug:"([^"]+)",title:"((?:\\.|[^"])*)",category:"([^"]+)"[^}]{0,1200}?price:([0-9]+(?:\.[0-9]+)?),originalPrice:([0-9]+(?:\.[0-9]+)?)[^}]*?image:"([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = productPattern.exec(bundle))) {
    const title = match[3].replace(/\\"/g, '"').replace(/\\'/g, "'");
    const category = classify(title, match[4]);
    const price = Number(match[5]);
    const compareAtPrice = Number(match[6]);
    if (!title || !Number.isFinite(price) || price <= 0) continue;
    if (!products.some((product) => product.title.toLowerCase() === title.toLowerCase())) {
      products.push({
        title,
        price,
        compareAtPrice: compareAtPrice >= price ? compareAtPrice : price,
        categoryId: category.id,
        categoryName: category.name,
        sourceUrl: `${CATALOG_SOURCE_URL.replace(/\/$/, '')}/product/${match[2]}`,
      });
    }
  }
  return products;
}

async function fetchSourceProducts(): Promise<SourceProduct[]> {
  const response = await fetch(CATALOG_SOURCE_URL, {
    headers: { Accept: 'text/html', 'User-Agent': 'PlayBeatCatalogAgent/1.0 (+admin catalog refresh)' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
  const html = await response.text();
  const htmlProducts = parseSourceProducts(html);
  if (htmlProducts.length > 0) return htmlProducts;

  // The source is a Vite SPA in production. Its initial catalog is embedded
  // in the public JS bundle, so follow only the script URL from that page.
  const scriptPath = html.match(/<script[^>]+src=["']([^"']+\.js)["']/i)?.[1];
  if (!scriptPath) return [];
  const bundleUrl = new URL(scriptPath, CATALOG_SOURCE_URL).toString();
  const bundleResponse = await fetch(bundleUrl, {
    headers: { Accept: 'application/javascript', 'User-Agent': 'PlayBeatCatalogAgent/1.0 (+admin catalog refresh)' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!bundleResponse.ok) throw new Error(`Source catalog bundle returned HTTP ${bundleResponse.status}`);
  return parseEmbeddedProducts(await bundleResponse.text());
}

function makeProduct(source: SourceProduct): Product {
  const now = new Date().toISOString();
  const slug = slugify(source.title);
  const sku = `SOURCE-${slug.slice(0, 48).toUpperCase()}`;
  return {
    id: `source-${slug}`,
    title: source.title,
    slug,
    shortDescription: 'Digital product sourced from the PlayBeat Digital catalog.',
    description: `Catalog listing synchronized from ${CATALOG_SOURCE_URL}. Review the product before publishing.`,
    categoryId: source.categoryId,
    categoryName: source.categoryName,
    productType: 'digital',
    productSource: 'supplier',
    price: source.price,
    compareAtPrice: source.compareAtPrice,
    discountPercent: source.compareAtPrice > source.price ? Math.round(((source.compareAtPrice - source.price) / source.compareAtPrice) * 100) : 0,
    images: [],
    variations: [{ id: `${slug}-default`, type: 'Edition', value: 'Standard Access', price: source.price, stock: 0, sku, isAvailable: false }],
    instantDeliveryFormat: 'license_key',
    deliveryInstructions: 'Review fulfillment details before publishing this listing.',
    tags: ['source-sync'],
    isFeatured: false,
    isTrending: false,
    isBestSeller: false,
    isFlashDeal: false,
    isLimitedTime: false,
    status: 'pending_approval',
    rating: 0,
    reviewCount: 0,
    reviews: [],
    stock: 0,
    lowStockThreshold: 5,
    sku,
    supplierName: 'PlayBeat Digital source catalog',
    seo: { title: source.title, description: `Shop ${source.title} at PlayBeat Digital.`, keywords: source.title.split(/\s+/).slice(0, 8) },
    createdAt: now,
    updatedAt: now,
  };
}

export function getCatalogAgentStatus(): AgentStatus {
  return { ...status };
}

export async function refreshCatalogFromSource(): Promise<AgentStatus> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    status.running = true;
    status.lastStartedAt = new Date().toISOString();
    status.lastError = undefined;
    try {
      const sourceProducts = await fetchSourceProducts();
      if (sourceProducts.length === 0) throw new Error('No public product cards with prices were found. No catalog changes were made.');

      const existing = await repo.getProducts();
      const byTitle = new Map(existing.map((product) => [product.title.trim().toLowerCase(), product]));
      let updated = 0;
      let created = 0;
      for (const source of sourceProducts) {
        const current = byTitle.get(source.title.trim().toLowerCase());
        if (current) {
          await repo.updateProduct(current.id, {
            price: source.price,
            compareAtPrice: source.compareAtPrice,
            discountPercent: source.compareAtPrice > source.price ? Math.round(((source.compareAtPrice - source.price) / source.compareAtPrice) * 100) : 0,
            productSource: 'supplier',
            supplierName: 'PlayBeat Digital source catalog',
          });
          updated++;
        } else {
          await repo.createProduct(makeProduct(source));
          created++;
        }
      }
      status.lastScanned = sourceProducts.length;
      status.lastUpdated = updated;
      status.lastCreated = created;
      status.lastSuccessAt = new Date().toISOString();
      await repo.createAdminLog({
        id: `log-${Date.now()}-catalog-agent`,
        adminName: 'Catalog Refresh Agent',
        adminEmail: 'system@playbeat.digital',
        action: 'Source Catalog Refreshed',
        targetType: 'import',
        targetId: 'playbeat-source-catalog',
        details: `Scanned ${sourceProducts.length} public listings; updated ${updated} prices and created ${created} pending-approval listings.`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      status.lastError = error instanceof Error ? error.message : 'Catalog refresh failed';
    } finally {
      status.running = false;
      status.lastCompletedAt = new Date().toISOString();
      refreshPromise = null;
    }
    return { ...status };
  })();
  return refreshPromise;
}

export function startCatalogAgentScheduler(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;
  scheduler = setInterval(() => {
    if (status.enabled && !status.running) void refreshCatalogFromSource();
  }, CATALOG_REFRESH_INTERVAL_MS);
  // Avoid keeping CLI/test processes alive solely for the optional scheduler.
  scheduler.unref?.();
}

export function stopCatalogAgentScheduler(): void {
  if (scheduler) clearInterval(scheduler);
  scheduler = undefined;
  schedulerStarted = false;
}
