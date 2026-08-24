/**
 * Data access layer for PlayBeat.
 *
 * Design:
 *  - When MONGODB_URI is configured (production/Vercel), all reads/writes go to
 *    MongoDB Atlas collections. Data persists across server restarts and is
 *    shared across serverless instances.
 *  - When MONGODB_URI is NOT configured (local dev without Atlas), the
 *    repository falls back to in-memory arrays seeded from mockData. This
 *    keeps local dev working with zero setup.
 *
 * Collections used:
 *   products, categories, users, orders, coupons, content, admin_logs,
 *   g2g_connector, import_jobs
 *
 * Seeding:
 *   On first connection, if collections are empty, the repository auto-seeds
 *   from mockData so the app has data on first deploy.
 */

import { getDb, isMongoConfigured } from './mongodb.js';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_USERS,
  INITIAL_ORDERS,
  INITIAL_G2G_CONNECTOR,
  INITIAL_CONTENT,
  INITIAL_COUPONS,
  INITIAL_ADMIN_LOGS,
} from '../data/mockData.js';
import { CUSTOM_CATEGORIES, CUSTOM_PRODUCTS } from '../data/customCatalog.js';
import type {
  Product, Category, User, Order, Coupon, AdminLog,
  G2GSupplierConnector, ContentSection, ImportJob, OrderStatus, NavItem,
} from '../types.js';
import { hashPassword } from './auth.js';

// ============================================================
// In-memory fallback state (used when MongoDB is not configured)
// ============================================================
let memProducts: Product[] = [...CUSTOM_PRODUCTS];
let memCategories: Category[] = [...CUSTOM_CATEGORIES];
let memUsers: User[] = [...INITIAL_USERS];
let memOrders: Order[] = [...INITIAL_ORDERS];
let memCoupons: Coupon[] = [...INITIAL_COUPONS];
let memAdminLogs: AdminLog[] = [...INITIAL_ADMIN_LOGS];
let memImportJobs: ImportJob[] = [];
let memG2GConnector: G2GSupplierConnector = { ...INITIAL_G2G_CONNECTOR };
let memContent: ContentSection = { ...INITIAL_CONTENT };
let memNavItems: NavItem[] = [];
let zeroStateReset = false;
const REQUESTED_ADMIN_AGENTS = INITIAL_USERS.filter(user =>
  user.email === 'mahbuba@playbeat.digital' || user.email === 'qazi@playbeat.digital'
);

// ============================================================
// Seeding — populates MongoDB on first boot if collections are empty
// ============================================================
let seedPromise: Promise<void> | null = null;

async function seedIfEmpty(): Promise<void> {
  if (!isMongoConfigured) return;
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    try {
      const db = await getDb();

      const resetMarker = await db.collection('system_state').findOne({ id: 'reset-state', zeroState: true });
      if (resetMarker) {
        for (const agent of REQUESTED_ADMIN_AGENTS) {
          await db.collection('users').updateOne(
            { email: agent.email },
            { $setOnInsert: { ...agent, _seededAt: new Date().toISOString() } },
            { upsert: true },
          );
        }
        console.info('[repository] Zero-state reset is active — skipping automatic seed.');
        return;
      }

      // Check products first — if they exist, the catalog was already seeded.
      // But we ALWAYS upsert the default admin so its password hash is current.
      const productsCount = await db.collection('products').countDocuments();
      const adminPasswordHash = await hashPassword('playbeat1122');
      const now = new Date().toISOString();

      // Use updateOne with $set (matched by email) so we don't trip the unique
      // email index if an admin with a different ID but same email already exists.
      await db.collection('users').updateOne(
        { email: 'admin@playbeat.digital' },
        {
          $set: {
            name: 'PlayBeat Super Admin',
            role: 'super_admin',
            twoFactorEnabled: false,
            addresses: [],
            totalSpent: 0,
            ordersCount: 0,
            wishlist: [],
            status: 'active',
            passwordHash: adminPasswordHash,
            lastLogin: null,
          },
          $setOnInsert: {
            id: 'usr-admin-default',
            email: 'admin@playbeat.digital',
            createdAt: now,
            _seededAt: now,
          },
        },
        { upsert: true }
      );

      if (productsCount > 0) {
        console.info('[repository] MongoDB already has catalog data — skipping catalog seed. Admin password hash ensured.');
        return;
      }
      console.info('[repository] Seeding MongoDB from mock data (using upsert to handle partial seeds)...');

      // Use upsert instead of insertMany so we don't crash on duplicate keys
      // if some collections were partially seeded from a previous run.
      // (Note: `now` was already declared above for the admin upsert.)

      const productOps = CUSTOM_PRODUCTS.map(p => ({
        replaceOne: { filter: { id: p.id }, replacement: { ...p, _seededAt: now }, upsert: true }
      }));
      const categoryOps = CUSTOM_CATEGORIES.map(c => ({
        replaceOne: { filter: { id: c.id }, replacement: { ...c, _seededAt: now }, upsert: true }
      }));
      const userOps = INITIAL_USERS.map(u => ({
        replaceOne: { filter: { id: u.id }, replacement: { ...u, _seededAt: now }, upsert: true }
      }));

      // The default admin (with password hash) was already upserted above
      // before the productsCount check — no need to re-seed it here.
      const orderOps = INITIAL_ORDERS.map(o => ({
        replaceOne: { filter: { id: o.id }, replacement: { ...o, _seededAt: now }, upsert: true }
      }));
      const couponOps = INITIAL_COUPONS.map(c => ({
        replaceOne: { filter: { id: c.id }, replacement: { ...c, _seededAt: now }, upsert: true }
      }));
      const logOps = INITIAL_ADMIN_LOGS.map(l => ({
        replaceOne: { filter: { id: l.id }, replacement: { ...l, _seededAt: now }, upsert: true }
      }));

      await Promise.all([
        productOps.length > 0 ? db.collection('products').bulkWrite(productOps) : Promise.resolve(),
        categoryOps.length > 0 ? db.collection('categories').bulkWrite(categoryOps) : Promise.resolve(),
        userOps.length > 0 ? db.collection('users').bulkWrite(userOps) : Promise.resolve(),
        orderOps.length > 0 ? db.collection('orders').bulkWrite(orderOps) : Promise.resolve(),
        couponOps.length > 0 ? db.collection('coupons').bulkWrite(couponOps) : Promise.resolve(),
        logOps.length > 0 ? db.collection('admin_logs').bulkWrite(logOps) : Promise.resolve(),
        db.collection('g2g_connector').replaceOne({}, { ...INITIAL_G2G_CONNECTOR, _seededAt: now }, { upsert: true }),
        db.collection('content').replaceOne({}, { ...INITIAL_CONTENT, _seededAt: now }, { upsert: true }),
      ]);
      console.info('[repository] Seed complete. Default admin account ensured.');
    } catch (err) {
      console.error('[repository] Seed failed:', err);
      // Reset so a future call can retry
      seedPromise = null;
    }
  })();

  return seedPromise;
}

/**
 * Ensure MongoDB is seeded before reading. No-op for in-memory mode.
 */
async function ensureSeeded() {
  if (!isMongoConfigured) return;
  try {
    await seedIfEmpty();
  } catch (err) {
    console.error('[repository] MongoDB connection failed, using in-memory fallback:', (err as Error)?.message?.substring(0, 100));
    // Reset the connection promise so the next call can retry
    globalThis.__mongoConnPromise = undefined;
    globalThis.__mongoClient = undefined;
    globalThis.__mongoDb = undefined;
  }
}

// ============================================================
// PRODUCTS
// ============================================================

export async function getProducts(): Promise<Product[]> {
  if (isMongoConfigured) {
    try {
      await ensureSeeded();
      const db = await getDb();
      const docs = await db.collection('products').find({}, { projection: { _seededAt: 0, _id: 0 } }).toArray();
      return docs as unknown as Product[];
    } catch {
      console.warn('[repository] MongoDB error in getProducts, using in-memory');
      globalThis.__mongoConnPromise = undefined;
      globalThis.__mongoClient = undefined;
      globalThis.__mongoDb = undefined;
    }
  }
  return [...memProducts];
}

export async function getProductByIdOrSlug(idOrSlug: string): Promise<Product | null> {
  if (isMongoConfigured) {
    await ensureSeeded();
    const db = await getDb();
    const doc = await db.collection('products').findOne(
      { $or: [{ id: idOrSlug }, { slug: idOrSlug }] },
      { projection: { _seededAt: 0, _id: 0 } }
    );
    return (doc as unknown as Product) || null;
  }
  return memProducts.find(p => p.id === idOrSlug || p.slug === idOrSlug) || null;
}

export async function createProduct(product: Product): Promise<void> {
  if (isMongoConfigured) {
    const db = await getDb();
    await db.collection('products').insertOne({ ...product, _seededAt: new Date().toISOString() });
  } else {
    memProducts.unshift(product);
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  if (isMongoConfigured) {
    const db = await getDb();
    const result = await db.collection('products').findOneAndUpdate(
      { id },
      { $set: { ...updates, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after', projection: { _seededAt: 0, _id: 0 } }
    );
    return (result as unknown as Product) || null;
  }
  const idx = memProducts.findIndex(p => p.id === id);
  if (idx === -1) return null;
  memProducts[idx] = { ...memProducts[idx], ...updates, updatedAt: new Date().toISOString() };
  return memProducts[idx];
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (isMongoConfigured) {
    const db = await getDb();
    const result = await db.collection('products').deleteOne({ id });
    return result.deletedCount > 0;
  }
  const before = memProducts.length;
  memProducts = memProducts.filter(p => p.id !== id);
  return memProducts.length < before;
}

/**
 * Bulk-replace all products. Used by bulk-update and import endpoints.
 */
export async function replaceAllProducts(newList: Product[]): Promise<void> {
  if (isMongoConfigured) {
    const db = await getDb();
    // Use bulkWrite for efficiency: upsert each, delete missing
    const ops = newList.map(p => ({
      replaceOne: {
        filter: { id: p.id },
        replacement: { ...p, _seededAt: new Date().toISOString() },
        upsert: true,
      },
    }));
    if (ops.length > 0) await db.collection('products').bulkWrite(ops);
    // Note: we don't delete missing products here — that's handled by the caller if needed
  } else {
    memProducts = newList;
  }
}

/**
 * Bulk-update specific products by ID with a transform function.
 */
export async function bulkUpdateProducts(
  productIds: string[],
  transform: (p: Product) => Product
): Promise<number> {
  if (isMongoConfigured) {
    const db = await getDb();
    const docs = await db.collection('products').find({ id: { $in: productIds } }).toArray();
    if (docs.length === 0) return 0;
    const ops = docs.map((doc: any) => {
      const product = { ...doc } as Product;
      delete (product as any)._id;
      delete (product as any)._seededAt;
      const updated = transform(product);
      return {
        replaceOne: {
          filter: { id: product.id },
          replacement: { ...updated, _seededAt: doc._seededAt || new Date().toISOString() },
        },
      };
    });
    await db.collection('products').bulkWrite(ops);
    return docs.length;
  }
  let count = 0;
  memProducts = memProducts.map(p => {
    if (!productIds.includes(p.id)) return p;
    count++;
    return transform(p);
  });
  return count;
}

// ============================================================
// CATEGORIES
// ============================================================

export async function getCategories(): Promise<Category[]> {
  if (isMongoConfigured) {
    await ensureSeeded();
    const db = await getDb();
    const docs = await db.collection('categories').find({}, { projection: { _seededAt: 0, _id: 0 } }).toArray();
    return docs as unknown as Category[];
  }
  return [...memCategories];
}

export async function createCategory(category: Category): Promise<void> {
  if (isMongoConfigured) {
    const db = await getDb();
    await db.collection('categories').insertOne({ ...category, _seededAt: new Date().toISOString() });
  } else {
    memCategories.push(category);
  }
}

// ============================================================
// USERS
// ============================================================

export async function getUsers(): Promise<User[]> {
  if (isMongoConfigured) {
    try {
      await ensureSeeded();
      const db = await getDb();
      const docs = await db.collection('users').find({}, { projection: { _seededAt: 0, _id: 0 } }).toArray();
      return docs as unknown as User[];
    } catch {
      console.warn('[repository] MongoDB error in getUsers, using in-memory fallback');
      globalThis.__mongoConnPromise = undefined;
      globalThis.__mongoClient = undefined;
      globalThis.__mongoDb = undefined;
    }
  }
  return [...memUsers];
}

export async function findUserByEmail(email: string): Promise<User | null> {
  if (isMongoConfigured) {
    try {
      await ensureSeeded();
      const db = await getDb();
      const doc = await db.collection('users').findOne(
        { email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { projection: { _seededAt: 0, _id: 0 } }
      );
      return (doc as unknown as User) || null;
    } catch {
      console.warn('[repository] MongoDB error in findUserByEmail, using in-memory fallback');
      globalThis.__mongoConnPromise = undefined;
      globalThis.__mongoClient = undefined;
      globalThis.__mongoDb = undefined;
    }
  }
  return memUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function createUser(user: User): Promise<void> {
  if (isMongoConfigured) {
    try {
      const db = await getDb();
      await db.collection('users').insertOne({ ...user, _seededAt: new Date().toISOString() });
      return;
    } catch (err) {
      console.warn('[repository] MongoDB error in createUser, using in-memory fallback:', (err as Error)?.message?.substring(0, 100));
      globalThis.__mongoConnPromise = undefined;
      globalThis.__mongoClient = undefined;
      globalThis.__mongoDb = undefined;
    }
  }
  // In-memory fallback (also runs if Mongo write failed above)
  memUsers.push(user);
}

export async function updateUserByEmail(email: string, updates: Partial<User>): Promise<void> {
  if (isMongoConfigured) {
    try {
      const db = await getDb();
      await db.collection('users').updateOne(
        { email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { $set: updates }
      );
      return;
    } catch {
      console.warn('[repository] MongoDB error in updateUserByEmail, using in-memory fallback');
      globalThis.__mongoConnPromise = undefined;
      globalThis.__mongoClient = undefined;
      globalThis.__mongoDb = undefined;
    }
  }
  const idx = memUsers.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (idx !== -1) memUsers[idx] = { ...memUsers[idx], ...updates };
}

/**
 * Find a user by email INCLUDING their passwordHash.
 * Only used internally by the auth layer — never return this to the client.
 */
export async function findUserWithPassword(email: string): Promise<User | null> {
  if (isMongoConfigured) {
    try {
      await ensureSeeded();
      const db = await getDb();
      const doc = await db.collection('users').findOne(
        { email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { projection: { _seededAt: 0, _id: 0 } }
      );
      return (doc as unknown as User) || null;
    } catch {
      console.warn('[repository] MongoDB error in findUserWithPassword, using in-memory fallback');
      globalThis.__mongoConnPromise = undefined;
      globalThis.__mongoClient = undefined;
      globalThis.__mongoDb = undefined;
    }
  }
  return memUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

/**
 * Update a user by ID. Used by Account Management and Super Agent Management.
 */
export async function updateUserById(id: string, updates: Partial<User>): Promise<User | null> {
  if (isMongoConfigured) {
    try {
      const db = await getDb();
      const result = await db.collection('users').findOneAndUpdate(
        { id },
        { $set: updates },
        { returnDocument: 'after', projection: { _seededAt: 0, _id: 0 } }
      );
      return (result as unknown as User) || null;
    } catch {
      console.warn('[repository] MongoDB error in updateUserById, using in-memory fallback');
      globalThis.__mongoConnPromise = undefined;
      globalThis.__mongoClient = undefined;
      globalThis.__mongoDb = undefined;
    }
  }
  const idx = memUsers.findIndex(u => u.id === id);
  if (idx === -1) return null;
  memUsers[idx] = { ...memUsers[idx], ...updates };
  return memUsers[idx];
}

/**
 * Delete a user by ID.
 */
export async function deleteUserById(id: string): Promise<boolean> {
  if (isMongoConfigured) {
    try {
      const db = await getDb();
      const result = await db.collection('users').deleteOne({ id });
      return result.deletedCount > 0;
    } catch {
      console.warn('[repository] MongoDB error in deleteUserById, using in-memory fallback');
      globalThis.__mongoConnPromise = undefined;
      globalThis.__mongoClient = undefined;
      globalThis.__mongoDb = undefined;
    }
  }
  const before = memUsers.length;
  const filtered = memUsers.filter(u => u.id !== id);
  if (filtered.length === before) return false;
  memUsers = filtered;
  return true;
}

/**
 * Suspend or reactivate a user.
 */
export async function setUserStatus(id: string, status: 'active' | 'suspended' | 'pending_verification'): Promise<User | null> {
  return updateUserById(id, { status });
}

/**
 * Change a user's password. Hashes the new password before storing.
 */
export async function changeUserPassword(id: string, newPassword: string): Promise<boolean> {
  const passwordHash = await hashPassword(newPassword);
  if (isMongoConfigured) {
    try {
      const db = await getDb();
      const result = await db.collection('users').updateOne({ id }, { $set: { passwordHash } });
      return result.modifiedCount > 0;
    } catch {
      console.warn('[repository] MongoDB error in changeUserPassword, using in-memory fallback');
      globalThis.__mongoConnPromise = undefined;
      globalThis.__mongoClient = undefined;
      globalThis.__mongoDb = undefined;
    }
  }
  const idx = memUsers.findIndex(u => u.id === id);
  if (idx === -1) return false;
  memUsers[idx].passwordHash = passwordHash;
  return true;
}

/**
 * Reset the entire database — drops all collections and re-seeds.
 * Used by the "Reset Dashboard" button in the admin panel.
 * DANGEROUS: this wipes all orders, users, products, etc.
 *
 * Reset leaves application collections empty. The Super Admin account is
 * retained so the operator can sign in and import new data afterward.
 */
export async function resetDatabase(): Promise<void> {
  memProducts = [];
  memCategories = [];
  memUsers = memUsers.filter(u => u.role === 'super_admin');
  memOrders = [];
  memCoupons = [];
  memAdminLogs = [];
  memImportJobs = [];
  memG2GConnector = {} as G2GSupplierConnector;
  memContent = {} as ContentSection;
  memNavItems = [];
  zeroStateReset = true;

  // Keep the zero-state decision for this server instance.
  seedPromise = Promise.resolve();
  // Clear the cached Mongo client so the next request gets a fresh connection
  globalThis.__mongoConnPromise = undefined;
  globalThis.__mongoClient = undefined;
  globalThis.__mongoDb = undefined;

  if (!isMongoConfigured) {
    return;
  }

  // Best-effort DB wipe — don't fail the reset if Mongo is unreachable.
  try {
    const db = await getDb();
    const collections = [
      'products', 'categories', 'users', 'orders', 'coupons',
      'admin_logs', 'g2g_connector', 'content', 'import_jobs',
      'navigation',
    ];
    await Promise.all([
      ...collections.filter(name => name !== 'users').map(name => db.collection(name).deleteMany({})),
      db.collection('users').deleteMany({ role: { $ne: 'super_admin' } }),
      db.collection('system_state').updateOne(
        { id: 'reset-state' },
        { $set: { id: 'reset-state', zeroState: true, updatedAt: new Date().toISOString() } },
        { upsert: true },
      ),
    ]);
    console.info('[repository] Database reset: application data cleared; Super Admin retained.');
  } catch (err) {
    console.warn(
      '[repository] Database reset: MongoDB unreachable, only in-memory arrays were reset. ' +
      'The in-memory zero state remains active until the server restarts.',
      (err as Error)?.message?.substring(0, 100)
    );
  }
}

// ============================================================
// ORDERS
// ============================================================

export async function getOrders(): Promise<Order[]> {
  if (isMongoConfigured) {
    await ensureSeeded();
    const db = await getDb();
    const docs = await db.collection('orders').find({}, { projection: { _seededAt: 0, _id: 0 } }).sort({ createdAt: -1 }).toArray();
    return docs as unknown as Order[];
  }
  return [...memOrders];
}

export async function getOrderById(idOrNumber: string): Promise<Order | null> {
  if (isMongoConfigured) {
    await ensureSeeded();
    const db = await getDb();
    const doc = await db.collection('orders').findOne(
      { $or: [{ id: idOrNumber }, { orderNumber: idOrNumber }] },
      { projection: { _seededAt: 0, _id: 0 } }
    );
    return (doc as unknown as Order) || null;
  }
  return memOrders.find(o => o.id === idOrNumber || o.orderNumber === idOrNumber) || null;
}

export async function createOrder(order: Order): Promise<void> {
  if (isMongoConfigured) {
    const db = await getDb();
    await db.collection('orders').insertOne({ ...order, _seededAt: new Date().toISOString() });
  } else {
    memOrders.unshift(order);
  }
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
  if (isMongoConfigured) {
    const db = await getDb();
    const result = await db.collection('orders').findOneAndUpdate(
      { id },
      { $set: { ...updates, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after', projection: { _seededAt: 0, _id: 0 } }
    );
    return (result as unknown as Order) || null;
  }
  const idx = memOrders.findIndex(o => o.id === id);
  if (idx === -1) return null;
  memOrders[idx] = { ...memOrders[idx], ...updates, updatedAt: new Date().toISOString() };
  return memOrders[idx];
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await updateOrder(id, { orderStatus: status });
}

// ============================================================
// COUPONS
// ============================================================

export async function getCoupons(): Promise<Coupon[]> {
  if (isMongoConfigured) {
    await ensureSeeded();
    const db = await getDb();
    const docs = await db.collection('coupons').find({}, { projection: { _seededAt: 0, _id: 0 } }).toArray();
    return docs as unknown as Coupon[];
  }
  return [...memCoupons];
}

export async function findCouponByCode(code: string): Promise<Coupon | null> {
  if (isMongoConfigured) {
    await ensureSeeded();
    const db = await getDb();
    const doc = await db.collection('coupons').findOne(
      { code: { $regex: new RegExp(`^${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      { projection: { _seededAt: 0, _id: 0 } }
    );
    return (doc as unknown as Coupon) || null;
  }
  return memCoupons.find(c => c.code.toUpperCase() === code.toUpperCase()) || null;
}

export async function incrementCouponUsage(code: string): Promise<void> {
  if (isMongoConfigured) {
    const db = await getDb();
    await db.collection('coupons').updateOne(
      { code: { $regex: new RegExp(`^${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      { $inc: { usageCount: 1 } }
    );
  } else {
    const coupon = memCoupons.find(c => c.code.toUpperCase() === code.toUpperCase());
    if (coupon) coupon.usageCount = (coupon.usageCount || 0) + 1;
  }
}

export async function createCoupon(coupon: Coupon): Promise<void> {
  if (isMongoConfigured) {
    const db = await getDb();
    await db.collection('coupons').insertOne({ ...coupon, _seededAt: new Date().toISOString() });
  } else {
    memCoupons.unshift(coupon);
  }
}

export async function deleteCoupon(id: string): Promise<boolean> {
  if (isMongoConfigured) {
    const db = await getDb();
    const result = await db.collection('coupons').deleteOne({ id });
    return result.deletedCount > 0;
  }
  const before = memCoupons.length;
  memCoupons = memCoupons.filter(coupon => coupon.id !== id);
  return memCoupons.length < before;
}

// ============================================================
// CONTENT (single document)
// ============================================================

export async function getContent(): Promise<ContentSection> {
  if (isMongoConfigured) {
    await ensureSeeded();
    const db = await getDb();
    const doc = await db.collection('content').findOne({}, { projection: { _seededAt: 0, _id: 0 } });
    if (doc) return doc as unknown as ContentSection;
    return { ...INITIAL_CONTENT };
  }
  return { ...memContent };
}

export async function updateContent(updates: Partial<ContentSection>): Promise<ContentSection> {
  if (isMongoConfigured) {
    const db = await getDb();
    const result = await db.collection('content').findOneAndUpdate(
      {},
      { $set: updates },
      { returnDocument: 'after', projection: { _seededAt: 0, _id: 0 }, upsert: true }
    );
    return (result as unknown as ContentSection) || { ...INITIAL_CONTENT, ...updates };
  }
  memContent = { ...memContent, ...updates };
  return memContent;
}

// ============================================================
// NAVIGATION (single document)
// ============================================================

export async function getNavigation(): Promise<NavItem[]> {
  if (isMongoConfigured) {
    await ensureSeeded();
    const db = await getDb();
    const doc = await db.collection('navigation').findOne({}, { projection: { _seededAt: 0, _id: 0 } });
    if (doc && Array.isArray((doc as any).items)) return (doc as any).items as NavItem[];
    return [];
  }
  return [...memNavItems];
}

export async function updateNavigation(items: NavItem[]): Promise<NavItem[]> {
  if (isMongoConfigured) {
    const db = await getDb();
    const result = await db.collection('navigation').findOneAndUpdate(
      {},
      { $set: { items, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after', projection: { _seededAt: 0, _id: 0 }, upsert: true }
    );
    return ((result as any)?.items as NavItem[]) || items;
  }
  memNavItems = [...items];
  return memNavItems;
}

// ============================================================
// ADMIN LOGS
// ============================================================

export async function getAdminLogs(limit?: number): Promise<AdminLog[]> {
  if (isMongoConfigured) {
    await ensureSeeded();
    const db = await getDb();
    const cursor = db.collection('admin_logs').find({}, { projection: { _seededAt: 0, _id: 0 } }).sort({ timestamp: -1 });
    const docs = limit ? await cursor.limit(limit).toArray() : await cursor.toArray();
    return docs as unknown as AdminLog[];
  }
  const list = [...memAdminLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return limit ? list.slice(0, limit) : list;
}

export async function createAdminLog(log: AdminLog): Promise<void> {
  if (isMongoConfigured) {
    try {
      const db = await getDb();
      await db.collection('admin_logs').insertOne({ ...log, _seededAt: new Date().toISOString() });
      return;
    } catch (err) {
      console.warn('[repository] MongoDB error in createAdminLog, using in-memory fallback:', (err as Error)?.message?.substring(0, 100));
      globalThis.__mongoConnPromise = undefined;
      globalThis.__mongoClient = undefined;
      globalThis.__mongoDb = undefined;
    }
  }
  // In-memory fallback (also runs if Mongo write failed above)
  memAdminLogs.unshift(log);
}

// ============================================================
// G2G CONNECTOR (single document)
// ============================================================

export async function getG2GConnector(): Promise<G2GSupplierConnector> {
  if (isMongoConfigured) {
    await ensureSeeded();
    const db = await getDb();
    const doc = await db.collection('g2g_connector').findOne({}, { projection: { _seededAt: 0, _id: 0 } });
    if (doc) return doc as unknown as G2GSupplierConnector;
    return { ...INITIAL_G2G_CONNECTOR };
  }
  return { ...memG2GConnector };
}

export async function updateG2GConnector(updates: Partial<G2GSupplierConnector>): Promise<G2GSupplierConnector> {
  if (isMongoConfigured) {
    const db = await getDb();
    const result = await db.collection('g2g_connector').findOneAndUpdate(
      {},
      { $set: { ...updates, lastSync: new Date().toISOString() } },
      { returnDocument: 'after', projection: { _seededAt: 0, _id: 0 }, upsert: true }
    );
    return (result as unknown as G2GSupplierConnector) || { ...INITIAL_G2G_CONNECTOR, ...updates };
  }
  memG2GConnector = { ...memG2GConnector, ...updates, lastSync: new Date().toISOString() };
  return memG2GConnector;
}

// ============================================================
// IMPORT JOBS
// ============================================================

export async function getImportJobs(): Promise<ImportJob[]> {
  if (isMongoConfigured) {
    await ensureSeeded();
    const db = await getDb();
    const docs = await db.collection('import_jobs').find({}, { projection: { _seededAt: 0, _id: 0 } }).sort({ createdAt: -1 }).toArray();
    return docs as unknown as ImportJob[];
  }
  return [...memImportJobs];
}

export async function createImportJob(job: ImportJob): Promise<void> {
  if (isMongoConfigured) {
    const db = await getDb();
    await db.collection('import_jobs').insertOne({ ...job, _seededAt: new Date().toISOString() });
  } else {
    memImportJobs.unshift(job);
  }
}

/**
 * Add multiple products at once (used by import endpoints).
 */
export async function addProducts(products: Product[]): Promise<void> {
  if (isMongoConfigured) {
    const db = await getDb();
    if (products.length > 0) {
      const now = new Date().toISOString();
      await db.collection('products').insertMany(products.map(p => ({ ...p, _seededAt: now })));
    }
  } else {
    memProducts = [...products, ...memProducts];
  }
}

// ============================================================
// Health / introspection
// ============================================================

export async function getCollectionCounts(): Promise<Record<string, number>> {
  if (!isMongoConfigured) {
    return {
      products: memProducts.length,
      categories: memCategories.length,
      users: memUsers.length,
      orders: memOrders.length,
      coupons: memCoupons.length,
      admin_logs: memAdminLogs.length,
    };
  }
  const db = await getDb();
  const names = ['products', 'categories', 'users', 'orders', 'coupons', 'admin_logs', 'import_jobs'];
  const entries = await Promise.all(
    names.map(async n => [n, await db.collection(n).countDocuments()])
  );
  return Object.fromEntries(entries);
}

// ============================================================
// SAFE MONGODB WRAPPER — catches errors and returns null
// so the server never crashes on MongoDB timeouts
// ============================================================
async function safeMongo<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    console.warn('[repository] MongoDB error (using fallback):', (err as Error)?.message?.substring(0, 80));
    globalThis.__mongoConnPromise = undefined;
    globalThis.__mongoClient = undefined;
    globalThis.__mongoDb = undefined;
    return null;
  }
}
