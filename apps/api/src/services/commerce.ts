import { AppError } from '../errors.js';
import { newId } from '../lib/crypto.js';
import type { Db } from '../db/client.js';
import type { UserRow } from './auth.js';

export interface OrderItemInput { id: number; quantity: number; color?: string; size?: string }
export interface ShippingInput { shippingPhone: string; shippingCity: string; shippingAddress: string }
export interface ProductInput {
  name: string; description: string; priceUsd: number; originalPriceUsd?: number | null; department: string; category: string;
  colors: string[]; sizes: string[]; inStock: boolean; images: string[];
}

const IMAGE_PATH = /^\/api\/v1\/images\/([0-9A-Za-z]{26})$/;
const MAX_IMAGE_BYTES = 1_500_000;
const MAX_IMAGES_PER_SHOP = 300;

/** Type réel déduit des premiers octets : on ne fait pas confiance au type annoncé. */
function sniff(b: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length > 12 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (b.length > 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  return null;
}

export interface PlanRow { code: string; name: string; price_usd: string; commission_bps: number; max_products: number | null; features: string[]; sort: number; active: boolean }
export const planDto = (p: PlanRow) => ({ code: p.code, name: p.name, priceUsd: Number(p.price_usd), commissionBps: p.commission_bps, maxProducts: p.max_products, features: p.features, sort: p.sort, active: p.active });
/** Plan réellement appliqué : un plan payant expiré (ou sans date) retombe sur le plan gratuit. */
export const EFFECTIVE_PLAN_FOR = (plan: string, expires: string): string => `(CASE WHEN ${plan} <> 'free' AND (${expires}::timestamptz IS NULL OR ${expires}::timestamptz <= now()) THEN 'free' ELSE ${plan} END)`;

export const ORDER_FLOW = ['pending', 'confirmed', 'shipped', 'delivered'] as const;
export type OrderStatus = (typeof ORDER_FLOW)[number];
const round2 = (n: number): number => Math.round(n * 100) / 100;

const slugify = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'boutique';

interface ProductRow { rating?: string; reviews?: number; sku?: string | null; tags?: string[]; id: string; shop_id: string; name: string; description: string; price_usd: string; original_price_usd: string | null; department: string; category: string; colors: string[]; sizes: string[]; in_stock: boolean; status: string; created_at: Date }

export class CommerceService {
  constructor(private db: Db) {}

  // ---------- Catalogue public ----------
  private publicDto(p: ProductRow, imgs: string[]) {
    return {
      id: Number(p.id), name: p.name, description: p.description, priceUsd: Number(p.price_usd), originalPriceUsd: p.original_price_usd ? Number(p.original_price_usd) : null,
      department: p.department, category: p.category, sku: p.sku ?? '', colors: p.colors, sizes: p.sizes, tags: p.tags ?? [], inStock: p.in_stock,
      rating: Number(p.rating ?? 0), reviews: p.reviews ?? 0, images: imgs, createdAt: p.created_at,
    };
  }

  /** Produits visibles par les acheteurs : actifs, d'une boutique active. */
  async listPublicProducts() {
    const rows = await this.db.query<ProductRow>("SELECT p.* FROM products p JOIN shops s ON s.id = p.shop_id WHERE p.status = 'active' AND s.status = 'active' ORDER BY p.id");
    const imgs = await this.images(rows.map((r) => r.id));
    return rows.map((r) => this.publicDto(r, imgs.get(r.id) ?? []));
  }

  async getPublicProduct(id: number) {
    const rows = await this.db.query<ProductRow>("SELECT p.* FROM products p JOIN shops s ON s.id = p.shop_id WHERE p.id = $1 AND p.status = 'active' AND s.status = 'active'", [id]);
    if (!rows[0]) throw new AppError(404, 'not_found', 'Produit introuvable.');
    return this.publicDto(rows[0], (await this.images([rows[0].id])).get(rows[0].id) ?? []);
  }

  // ---------- Adresses ----------
  async listAddresses(userId: string) {
    const rows = await this.db.query<{ id: string; label: string; city: string; address: string; phone: string; is_default: boolean }>(
      'SELECT id, label, city, address, phone, is_default FROM customer_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at', [userId]);
    return rows.map((r) => ({ id: r.id, label: r.label, city: r.city, address: r.address, phone: r.phone, isDefault: r.is_default }));
  }

  async addAddress(userId: string, a: { label?: string; city: string; address: string; phone: string }) {
    const count = await this.db.query<{ n: string }>('SELECT count(*) AS n FROM customer_addresses WHERE user_id = $1', [userId]);
    if (Number(count[0]?.n) >= 10) throw new AppError(400, 'too_many_addresses', 'Vous ne pouvez pas enregistrer plus de 10 adresses.');
    await this.db.query('INSERT INTO customer_addresses(id,user_id,label,city,address,phone,is_default) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [newId(), userId, a.label?.trim() || 'Adresse', a.city, a.address, a.phone, Number(count[0]?.n) === 0]);
  }

  async deleteAddress(userId: string, id: string) {
    const r = await this.db.query('DELETE FROM customer_addresses WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
    if (!r[0]) throw new AppError(404, 'not_found', 'Adresse introuvable.');
  }

  // ---------- Commandes ----------
  /** Les prix viennent de la base : ceux envoyés par le navigateur sont ignorés. */
  async placeOrder(user: UserRow, items: OrderItemInput[], ship: ShippingInput) {
    if (items.length === 0) throw new AppError(400, 'empty_cart', 'Votre panier est vide.');
    const merged = new Map<number, OrderItemInput>();
    for (const i of items) {
      const prev = merged.get(i.id);
      merged.set(i.id, prev ? { ...prev, quantity: prev.quantity + i.quantity } : { ...i });
    }
    return this.db.transaction(async (t) => {
      const ids = [...merged.keys()];
      const rows = await t.query<ProductRow & { image: string | null; shop_status: string; shop_plan: string; shop_official: boolean }>(
        `SELECT p.*, s.status AS shop_status, s.is_official AS shop_official, CASE WHEN s.is_official THEN 'official' ELSE ${EFFECTIVE_PLAN_FOR('s.plan', 's.plan_expires_at')} END AS shop_plan, (SELECT url FROM product_images WHERE product_id = p.id AND position = 0) AS image
           FROM products p JOIN shops s ON s.id = p.shop_id WHERE p.id = ANY($1::bigint[])`, [ids]);
      const byId = new Map(rows.map((r) => [Number(r.id), r]));
      let subtotal = 0;
      const lines = [...merged.values()].map((i) => {
        const p = byId.get(i.id);
        if (!p || p.status !== 'active' || p.shop_status !== 'active') throw new AppError(400, 'product_unavailable', `Produit indisponible : ${p?.name ?? i.id}.`);
        if (!p.in_stock) throw new AppError(400, 'out_of_stock', `En rupture de stock : ${p.name}.`);
        const unit = Number(p.price_usd);
        subtotal += unit * i.quantity;
        return { p, i, unit };
      });
      const bpsByPlan = new Map((await t.query<{ code: string; commission_bps: number }>('SELECT code, commission_bps FROM plans')).map((x) => [x.code, x.commission_bps]));
      const orderId = newId();
      const num = await t.query<{ n: string }>("SELECT nextval('order_number_seq') AS n");
      const number = `STM-${num[0]!.n}`;
      await t.query('INSERT INTO orders(id,number,user_id,subtotal_usd,shipping_phone,shipping_city,shipping_address) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [orderId, number, user.id, subtotal.toFixed(2), ship.shippingPhone, ship.shippingCity, ship.shippingAddress]);
      for (const { p, i, unit } of lines) {
        const bps = p.shop_official ? 0 : (bpsByPlan.get(p.shop_plan) ?? 500);
        await t.query('INSERT INTO order_items(id,order_id,product_id,shop_id,name,unit_price_usd,quantity,color,size,image,commission_bps) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
          [newId(), orderId, p.id, p.shop_id, p.name, unit.toFixed(2), i.quantity, i.color ?? '', i.size ?? '', p.image, bps]);
      }
      return { id: orderId, number, subtotalUsd: Number(subtotal.toFixed(2)) };
    });
  }

  async listOrders(userId: string) {
    const orders = await this.db.query<{ id: string; number: string; status: string; subtotal_usd: string; shipping_city: string; shipping_address: string; created_at: Date }>(
      'SELECT id, number, status, subtotal_usd, shipping_city, shipping_address, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100', [userId]);
    const items = orders.length
      ? await this.db.query<{ order_id: string; product_id: string; name: string; unit_price_usd: string; quantity: number; color: string; size: string; image: string | null; status: string; shop: string }>(
          `SELECT i.order_id, i.product_id, i.name, i.unit_price_usd, i.quantity, i.color, i.size, i.image, i.status, s.name AS shop
             FROM order_items i JOIN shops s ON s.id = i.shop_id WHERE i.order_id = ANY($1::char(26)[])`, [orders.map((o) => o.id)])
      : [];
    return orders.map((o) => {
      const its = items.filter((i) => i.order_id === o.id);
      return {
        id: o.id, number: o.number, status: o.status, subtotalUsd: Number(o.subtotal_usd), city: o.shipping_city, address: o.shipping_address, createdAt: o.created_at,
        canCancel: its.some((i) => i.status === 'pending'), canConfirmReceipt: its.some((i) => i.status === 'shipped'),
        items: its.map((i) => ({ productId: Number(i.product_id), name: i.name, unitPriceUsd: Number(i.unit_price_usd), quantity: i.quantity, color: i.color, size: i.size, image: i.image, status: i.status, shop: i.shop })),
      };
    });
  }

  /** L'état d'une commande suit sa ligne la moins avancée (hors lignes annulées). */
  async syncOrderStatus(t: Db, orderId: string) {
    const rows = await t.query<{ status: string }>('SELECT status FROM order_items WHERE order_id = $1', [orderId]);
    const live = rows.map((r) => r.status).filter((x) => x !== 'cancelled');
    const status = live.length === 0 ? 'cancelled' : ORDER_FLOW[Math.min(...live.map((x) => ORDER_FLOW.indexOf(x as OrderStatus)))]!;
    await t.query('UPDATE orders SET status = $2 WHERE id = $1', [orderId, status]);
    return status;
  }

  /** L'acheteur annule ce qui n'est pas encore confirmé, ou confirme la réception de ce qui est expédié. */
  async buyerOrderAction(userId: string, number: string, action: 'cancel' | 'receive') {
    const o = (await this.db.query<{ id: string }>('SELECT id FROM orders WHERE number = $1 AND user_id = $2', [number, userId]))[0];
    if (!o) throw new AppError(404, 'not_found', 'Commande introuvable.');
    const [from, to] = action === 'cancel' ? ['pending', 'cancelled'] : ['shipped', 'delivered'];
    return this.db.transaction(async (t) => {
      const r = await t.query('UPDATE order_items SET status = $3 WHERE order_id = $1 AND status = $2 RETURNING id', [o.id, from, to]);
      if (!r[0]) throw new AppError(409, 'invalid_transition', action === 'cancel' ? 'Cette commande ne peut plus être annulée.' : 'Aucun colis à confirmer.');
      return { status: await this.syncOrderStatus(t, o.id) };
    });
  }

  // ---------- Boutique du vendeur ----------
  async getShop(userId: string) {
    const r = await this.db.query<{ id: string; name: string; slug: string; phone: string | null; description: string | null; plan: string; plan_expires_at: Date | null; status: string; is_official: boolean; country_code: string | null; city: string | null }>(
      `SELECT s.id, s.name, s.slug, s.phone, s.description, s.plan, s.plan_expires_at, s.status, s.is_official, s.country_code, c.name AS city
         FROM shops s LEFT JOIN cities c ON c.id = s.city_id WHERE s.owner_id = $1`, [userId]);
    const s = r[0];
    if (!s) return null;
    const expired = s.plan !== 'free' && (!s.plan_expires_at || new Date(s.plan_expires_at).getTime() <= Date.now());
    const plan = (await this.db.query<PlanRow>('SELECT * FROM plans WHERE code = $1', [expired ? 'free' : s.plan]))[0]!;
    const used = await this.db.query<{ n: string }>("SELECT count(*) AS n FROM products WHERE shop_id = $1 AND status = 'active'", [s.id]);
    const pending = await this.db.query<{ plan: string }>("SELECT plan FROM plan_requests WHERE shop_id = $1 AND status = 'pending' ORDER BY created_at DESC LIMIT 1", [s.id]);
    return {
      id: s.id, name: s.name, slug: s.slug, phone: s.phone, description: s.description, status: s.status, isOfficial: s.is_official, countryCode: s.country_code, city: s.city,
      plan: plan.code, planName: plan.name, planExpiresAt: s.plan_expires_at, commissionBps: s.is_official ? 0 : plan.commission_bps,
      maxProducts: plan.max_products, productCount: Number(used[0]?.n ?? 0), pendingPlan: pending[0]?.plan ?? null,
    };
  }

  async createShop(user: UserRow, b: { name: string; phone?: string; description?: string; countryCode?: string; citySlug?: string }) {
    if (await this.getShop(user.id)) throw new AppError(409, 'shop_exists', 'Vous avez déjà une boutique.');
    const country = (b.countryCode ?? user.country_code ?? 'CD').toUpperCase();
    if (!(await this.db.query('SELECT 1 FROM countries WHERE code = $1 AND active', [country]))[0]) throw new AppError(400, 'country_not_supported', 'Pays non disponible.');
    const city = b.citySlug
      ? await this.db.query<{ id: string }>('SELECT c.id FROM cities c JOIN regions r ON r.id = c.region_id WHERE r.country_code = $1 AND c.slug = $2', [country, b.citySlug])
      : [];
    const base = slugify(b.name);
    for (let n = 0; n < 20; n++) {
      const slug = n === 0 ? base : `${base}-${n + 1}`;
      const taken = await this.db.query('SELECT 1 FROM shops WHERE slug = $1', [slug]);
      if (taken[0]) continue;
      await this.db.query('INSERT INTO shops(id,owner_id,name,slug,city_id,country_code,phone,description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [newId(), user.id, b.name.trim(), slug, city[0]?.id ?? null, country, b.phone ?? user.phone, b.description ?? null]);
      return (await this.getShop(user.id))!;
    }
    throw new AppError(409, 'slug_taken', 'Nom de boutique indisponible.');
  }

  async updateShop(userId: string, b: { name?: string; phone?: string; description?: string }) {
    const s = await this.getShop(userId);
    if (!s) throw new AppError(403, 'no_shop', 'Créez votre boutique d’abord.');
    await this.db.query('UPDATE shops SET name = COALESCE($2, name), phone = COALESCE($3, phone), description = COALESCE($4, description) WHERE id = $1', [s.id, b.name?.trim() ?? null, b.phone ?? null, b.description ?? null]);
    return (await this.getShop(userId))!;
  }

  /** Demande de changement de plan : le plan gratuit s'applique tout de suite ; un plan payant attend la validation de l'administration. */
  async requestPlan(userId: string, code: string) {
    const s = await this.requireShop(userId);
    const plan = (await this.db.query<PlanRow>('SELECT * FROM plans WHERE code = $1 AND active', [code]))[0];
    if (!plan) throw new AppError(404, 'not_found', 'Plan introuvable.');
    if (plan.code === 'free') {
      await this.db.query("UPDATE shops SET plan = 'free', plan_expires_at = NULL WHERE id = $1", [s.id]);
      await this.db.query("UPDATE plan_requests SET status = 'rejected', decided_at = now() WHERE shop_id = $1 AND status = 'pending'", [s.id]);
      return { applied: true };
    }
    await this.db.query("UPDATE plan_requests SET status = 'rejected', decided_at = now() WHERE shop_id = $1 AND status = 'pending'", [s.id]);
    await this.db.query('INSERT INTO plan_requests(id, shop_id, plan) VALUES ($1,$2,$3)', [newId(), s.id, plan.code]);
    return { applied: false };
  }

  async listPlans() {
    const rows = await this.db.query<PlanRow>('SELECT * FROM plans WHERE active ORDER BY sort, price_usd');
    return rows.map(planDto);
  }

  private async requireShop(userId: string) {
    const s = await this.getShop(userId);
    if (!s) throw new AppError(403, 'no_shop', 'Créez votre boutique d’abord.');
    if (s.status !== 'active') throw new AppError(403, 'shop_inactive', 'Votre boutique n’est pas active.');
    return s;
  }

  private async images(ids: string[]): Promise<Map<string, string[]>> {
    const m = new Map<string, string[]>();
    if (!ids.length) return m;
    const rows = await this.db.query<{ product_id: string; url: string }>('SELECT product_id, url FROM product_images WHERE product_id = ANY($1::bigint[]) ORDER BY position', [ids]);
    for (const r of rows) m.set(r.product_id, [...(m.get(r.product_id) ?? []), r.url]);
    return m;
  }

  private dto(p: ProductRow, imgs: string[]) {
    return {
      id: Number(p.id), name: p.name, description: p.description, priceUsd: Number(p.price_usd), originalPriceUsd: p.original_price_usd ? Number(p.original_price_usd) : null,
      department: p.department, category: p.category, colors: p.colors, sizes: p.sizes, inStock: p.in_stock, status: p.status, images: imgs, createdAt: p.created_at,
    };
  }

  async listMyProducts(userId: string) {
    const s = await this.requireShop(userId);
    const rows = await this.db.query<ProductRow>("SELECT * FROM products WHERE shop_id = $1 AND status = 'active' ORDER BY created_at DESC", [s.id]);
    const imgs = await this.images(rows.map((r) => r.id));
    return rows.map((r) => this.dto(r, imgs.get(r.id) ?? []));
  }

  /** Les photos envoyées par le vendeur doivent appartenir à sa boutique ; les autres doivent être des liens https. */
  private async checkImages(shopId: string, images: string[]) {
    for (const url of images) {
      const m = IMAGE_PATH.exec(url);
      if (!m) continue;
      const own = await this.db.query('SELECT 1 FROM uploaded_images WHERE id = $1 AND shop_id = $2', [m[1], shopId]);
      if (!own[0]) throw new AppError(400, 'image_not_found', 'Photo introuvable : renvoyez-la.');
    }
  }

  async uploadImage(userId: string, base64: string) {
    const s = await this.requireShop(userId);
    const bytes = Buffer.from(base64, 'base64');
    if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) throw new AppError(413, 'image_too_large', 'Photo trop lourde (1,5 Mo maximum).');
    const type = sniff(bytes);
    if (!type) throw new AppError(415, 'image_type_unsupported', 'Format non pris en charge (JPEG, PNG ou WebP).');
    const count = await this.db.query<{ n: string }>('SELECT count(*) AS n FROM uploaded_images WHERE shop_id = $1', [s.id]);
    if (Number(count[0]?.n) >= MAX_IMAGES_PER_SHOP) throw new AppError(409, 'image_quota', 'Limite de photos atteinte pour cette boutique.');
    const id = newId();
    await this.db.query('INSERT INTO uploaded_images(id, shop_id, content_type, bytes, size) VALUES ($1,$2,$3,$4,$5)', [id, s.id, type, bytes, bytes.length]);
    return { url: `/api/v1/images/${id}` };
  }

  async getImage(id: string) {
    const r = await this.db.query<{ content_type: string; bytes: Buffer }>('SELECT content_type, bytes FROM uploaded_images WHERE id = $1', [id]);
    if (!r[0]) throw new AppError(404, 'not_found', 'Photo introuvable.');
    return { type: r[0].content_type, bytes: r[0].bytes };
  }

  private async writeImages(t: Db, productId: string | number, images: string[]) {
    await t.query('DELETE FROM product_images WHERE product_id = $1', [productId]);
    for (const [i, url] of images.slice(0, 5).entries()) await t.query('INSERT INTO product_images(product_id, position, url) VALUES ($1,$2,$3)', [productId, i, url]);
  }

  async createProduct(userId: string, b: ProductInput) {
    const s = await this.requireShop(userId);
    if (s.maxProducts != null && s.productCount >= s.maxProducts) throw new AppError(403, 'plan_limit', `Votre plan ${s.planName} est limité à ${s.maxProducts} produits. Passez à un plan supérieur.`);
    await this.checkImages(s.id, b.images);
    return this.db.transaction(async (t) => {
      const r = await t.query<{ id: string }>(
        `INSERT INTO products(shop_id,name,description,price_usd,original_price_usd,department,category,colors,sizes,in_stock)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [s.id, b.name, b.description, b.priceUsd, b.originalPriceUsd ?? null, b.department, b.category, b.colors, b.sizes, b.inStock]);
      await this.writeImages(t, r[0]!.id, b.images);
      return { id: Number(r[0]!.id) };
    });
  }

  async updateProduct(userId: string, id: number, b: ProductInput) {
    const s = await this.requireShop(userId);
    await this.checkImages(s.id, b.images);
    return this.db.transaction(async (t) => {
      const r = await t.query(
        `UPDATE products SET name=$3, description=$4, price_usd=$5, original_price_usd=$6, department=$7, category=$8, colors=$9, sizes=$10, in_stock=$11, updated_at=now()
          WHERE id=$1 AND shop_id=$2 AND status='active' RETURNING id`,
        [id, s.id, b.name, b.description, b.priceUsd, b.originalPriceUsd ?? null, b.department, b.category, b.colors, b.sizes, b.inStock]);
      if (!r[0]) throw new AppError(404, 'not_found', 'Produit introuvable.');
      await this.writeImages(t, id, b.images);
    });
  }

  /** Archivage plutôt que suppression : les commandes passées gardent leur produit. */
  async archiveProduct(userId: string, id: number) {
    const s = await this.requireShop(userId);
    const r = await this.db.query("UPDATE products SET status='archived', updated_at=now() WHERE id=$1 AND shop_id=$2 AND status='active' RETURNING id", [id, s.id]);
    if (!r[0]) throw new AppError(404, 'not_found', 'Produit introuvable.');
  }

  async listShopOrders(userId: string) {
    const s = await this.requireShop(userId);
    const rows = await this.db.query<{ number: string; status: string; created_at: Date; shipping_city: string; shipping_address: string; shipping_phone: string; first_name: string; last_name: string; name: string; unit_price_usd: string; quantity: number; color: string; size: string; commission_bps: number }>(
      `SELECT o.number, i.status, o.created_at, o.shipping_city, o.shipping_address, o.shipping_phone, u.first_name, u.last_name, i.name, i.unit_price_usd, i.quantity, i.color, i.size, i.commission_bps
         FROM order_items i JOIN orders o ON o.id = i.order_id JOIN users u ON u.id = o.user_id
        WHERE i.shop_id = $1 ORDER BY o.created_at DESC LIMIT 300`, [s.id]);
    const out = new Map<string, { number: string; status: string; createdAt: Date; customer: string; city: string; address: string; phone: string; totalUsd: number; commissionUsd: number; items: { name: string; quantity: number; unitPriceUsd: number; color: string; size: string }[] }>();
    for (const r of rows) {
      const o = out.get(r.number) ?? { number: r.number, status: r.status, createdAt: r.created_at, customer: `${r.first_name} ${r.last_name}`, city: r.shipping_city, address: r.shipping_address, phone: r.shipping_phone, totalUsd: 0, commissionUsd: 0, items: [] };
      const line = Number(r.unit_price_usd) * r.quantity;
      o.items.push({ name: r.name, quantity: r.quantity, unitPriceUsd: Number(r.unit_price_usd), color: r.color, size: r.size });
      o.totalUsd += line;
      o.commissionUsd += (line * r.commission_bps) / 10000;
      out.set(r.number, o);
    }
    return [...out.values()].map((o) => ({ ...o, totalUsd: round2(o.totalUsd), commissionUsd: round2(o.commissionUsd), netUsd: round2(o.totalUsd - o.commissionUsd) }));
  }

  /** Le vendeur fait avancer sa part de la commande : confirmer, expédier, ou annuler avant l'expédition. */
  async shopOrderAction(userId: string, number: string, to: 'confirmed' | 'shipped' | 'cancelled') {
    const s = await this.requireShop(userId);
    const o = (await this.db.query<{ id: string }>('SELECT id FROM orders WHERE number = $1', [number]))[0];
    const from = to === 'confirmed' ? ['pending'] : to === 'shipped' ? ['confirmed'] : ['pending', 'confirmed'];
    if (!o) throw new AppError(404, 'not_found', 'Commande introuvable.');
    return this.db.transaction(async (t) => {
      const r = await t.query('UPDATE order_items SET status = $4 WHERE order_id = $1 AND shop_id = $2 AND status = ANY($3::text[]) RETURNING id', [o.id, s.id, from, to]);
      if (!r[0]) throw new AppError(409, 'invalid_transition', 'Cette action n’est pas possible dans l’état actuel de la commande.');
      return { status: await this.syncOrderStatus(t, o.id) };
    });
  }

  async shopStats(userId: string) {
    const s = await this.requireShop(userId);
    const r = await this.db.query<{ status: string; gross: string; commission: string; lines: string }>(
      `SELECT status, COALESCE(SUM(unit_price_usd * quantity),0) AS gross, COALESCE(SUM(unit_price_usd * quantity * commission_bps / 10000.0),0) AS commission, count(*) AS lines
         FROM order_items WHERE shop_id = $1 GROUP BY status`, [s.id]);
    const by = (st: string) => r.find((x) => x.status === st);
    const delivered = by('delivered');
    const inProgress = ['pending', 'confirmed', 'shipped'].reduce((a, st) => a + Number(by(st)?.gross ?? 0), 0);
    return {
      salesUsd: round2(Number(delivered?.gross ?? 0)), commissionUsd: round2(Number(delivered?.commission ?? 0)),
      netUsd: round2(Number(delivered?.gross ?? 0) - Number(delivered?.commission ?? 0)), inProgressUsd: round2(inProgress),
      pendingLines: Number(by('pending')?.lines ?? 0), deliveredLines: Number(delivered?.lines ?? 0),
    };
  }
}
