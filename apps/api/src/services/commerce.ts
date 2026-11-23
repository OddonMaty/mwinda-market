import type { ImageStore } from './storage.js';
import type { Notifier } from './notify.js';
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

export interface PlanRow { code: string; name: string; price_usd: string; commission_bps: number; max_products: number | null; features: string[]; sort: number; active: boolean; certified: boolean; hero_eligible: boolean }
export const planDto = (p: PlanRow) => ({ code: p.code, name: p.name, priceUsd: Number(p.price_usd), commissionBps: p.commission_bps, maxProducts: p.max_products, features: p.features, sort: p.sort, active: p.active, certified: p.certified, heroEligible: p.hero_eligible });
/** Plan réellement appliqué : un plan payant expiré (ou sans date) retombe sur le plan gratuit. */
export const EFFECTIVE_PLAN_FOR = (plan: string, expires: string): string => `(CASE WHEN ${plan} <> 'free' AND (${expires}::timestamptz IS NULL OR ${expires}::timestamptz <= now()) THEN 'free' ELSE ${plan} END)`;

export const OFFICIAL_SHOP_ID = '01OFFICIALSHOP000000000000';

export const ORDER_FLOW = ['pending', 'confirmed', 'shipped', 'delivered'] as const;
export type OrderStatus = (typeof ORDER_FLOW)[number];
const round2 = (n: number): number => Math.round(n * 100) / 100;

const slugify = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'boutique';

interface ProductRow { certified?: boolean; shop_name?: string; shop_country?: string | null; shop_country_name?: string | null; shop_city?: string | null; shop_city_slug?: string | null; rating?: string; reviews?: number; sku?: string | null; tags?: string[]; id: string; shop_id: string; name: string; description: string; price_usd: string; original_price_usd: string | null; department: string; category: string; colors: string[]; sizes: string[]; in_stock: boolean; status: string; created_at: Date }

export class CommerceService {
  constructor(private db: Db, private store?: ImageStore, private notify?: Notifier) {}

  // ---------- Catalogue public ----------
  private publicDto(p: ProductRow, imgs: string[]) {
    return {
      id: Number(p.id), name: p.name, description: p.description, priceUsd: Number(p.price_usd), originalPriceUsd: p.original_price_usd ? Number(p.original_price_usd) : null,
      department: p.department, category: p.category, sku: p.sku ?? '', colors: p.colors, sizes: p.sizes, tags: p.tags ?? [], inStock: p.in_stock,
      rating: Number(p.rating ?? 0), reviews: p.reviews ?? 0, images: imgs, createdAt: p.created_at,
      certified: !!p.certified, shopName: p.shop_name ?? '',
      countryCode: p.shop_country ?? null, countryName: p.shop_country_name ?? null, city: p.shop_city ?? null, citySlug: p.shop_city_slug ?? null,
    };
  }

  /** Produits visibles par les acheteurs : actifs, d'une boutique active. */
  async listPublicProducts() {
    const rows = await this.db.query<ProductRow>(`SELECT p.*, (s.is_official OR COALESCE(pl.certified, false)) AS certified, s.name AS shop_name, s.country_code AS shop_country, co.name AS shop_country_name, ci.name AS shop_city, ci.slug AS shop_city_slug FROM products p JOIN shops s ON s.id = p.shop_id LEFT JOIN countries co ON co.code = s.country_code LEFT JOIN cities ci ON ci.id = s.city_id LEFT JOIN plans pl ON pl.code = ${EFFECTIVE_PLAN_FOR('s.plan', 's.plan_expires_at')} WHERE p.status = 'active' AND s.status = 'active' ORDER BY p.id`);
    const imgs = await this.images(rows.map((r) => r.id));
    return rows.map((r) => this.publicDto(r, imgs.get(r.id) ?? []));
  }

  async getPublicProduct(id: number) {
    const rows = await this.db.query<ProductRow>(`SELECT p.*, (s.is_official OR COALESCE(pl.certified, false)) AS certified, s.name AS shop_name, s.country_code AS shop_country, co.name AS shop_country_name, ci.name AS shop_city, ci.slug AS shop_city_slug FROM products p JOIN shops s ON s.id = p.shop_id LEFT JOIN countries co ON co.code = s.country_code LEFT JOIN cities ci ON ci.id = s.city_id LEFT JOIN plans pl ON pl.code = ${EFFECTIVE_PLAN_FOR('s.plan', 's.plan_expires_at')} WHERE p.id = $1 AND p.status = 'active' AND s.status = 'active'`, [id]);
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
    const placed = await this.db.transaction(async (t) => {
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
      await t.query("INSERT INTO order_events(order_id, kind, location, note) VALUES ($1, 'placed', $2, 'Commande passée')", [orderId, ship.shippingCity]);
      return { id: orderId, number, subtotalUsd: Number(subtotal.toFixed(2)) };
    });
    await this.notify?.orderPlaced(placed.id);
    return placed;
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
      const r = await t.query<{ shop_id: string }>('UPDATE order_items SET status = $3 WHERE order_id = $1 AND status = $2 RETURNING shop_id', [o.id, from, to]);
      if (!r[0]) throw new AppError(409, 'invalid_transition', action === 'cancel' ? 'Cette commande ne peut plus être annulée.' : 'Aucun colis à confirmer.');
      for (const shopId of new Set(r.map((x) => x.shop_id))) {
        await t.query('INSERT INTO order_events(order_id, shop_id, kind, location, note) VALUES ($1,$2,$3,$4,$5)',
          [o.id, shopId, to, to === 'delivered' ? (await t.query<{ c: string }>('SELECT shipping_city AS c FROM orders WHERE id = $1', [o.id]))[0]!.c : null, to === 'delivered' ? 'Réception confirmée par le client' : 'Commande annulée par le client']);
      }
      return { status: await this.syncOrderStatus(t, o.id) };
    });
  }

  // ---------- Suivi de commande ----------
  /** Frise de suivi d'une commande de l'acheteur : une expédition par boutique, avec sa position actuelle et son historique. */
  async trackOrder(userId: string, number: string) {
    const o = (await this.db.query<{ id: string; number: string; status: string; shipping_city: string; shipping_address: string; created_at: Date }>(
      'SELECT id, number, status, shipping_city, shipping_address, created_at FROM orders WHERE number = $1 AND user_id = $2', [number, userId]))[0];
    if (!o) throw new AppError(404, 'not_found', 'Commande introuvable.');
    const items = await this.db.query<{ shop_id: string; shop: string; status: string; name: string; city: string | null; country: string | null }>(
      `SELECT i.shop_id, s.name AS shop, i.status, i.name, c.name AS city, co.name AS country
         FROM order_items i JOIN shops s ON s.id = i.shop_id LEFT JOIN cities c ON c.id = s.city_id LEFT JOIN countries co ON co.code = s.country_code
        WHERE i.order_id = $1 ORDER BY i.id`, [o.id]);
    const events = await this.db.query<{ shop_id: string | null; kind: string; location: string | null; note: string | null; created_at: Date }>(
      'SELECT shop_id, kind, location, note, created_at FROM order_events WHERE order_id = $1 ORDER BY id', [o.id]);
    const dto = (e: (typeof events)[number]) => ({ kind: e.kind, location: e.location, note: e.note, createdAt: e.created_at });
    const shipments = [...new Set(items.map((i) => i.shop_id))].map((shopId) => {
      const its = items.filter((i) => i.shop_id === shopId);
      const live = its.map((i) => i.status).filter((x) => x !== 'cancelled');
      const status = live.length === 0 ? 'cancelled' : ORDER_FLOW[Math.min(...live.map((x) => ORDER_FLOW.indexOf(x as OrderStatus)))]!;
      const evs = events.filter((e) => e.shop_id === shopId);
      const located = [...evs].reverse().find((e) => e.location);
      const currentLocation = status === 'delivered' ? o.shipping_city : (located?.location ?? (status === 'pending' ? null : its[0]!.city));
      return { shop: its[0]!.shop, origin: { city: its[0]!.city, country: its[0]!.country }, status, items: its.map((i) => i.name), currentLocation, events: evs.map(dto) };
    });
    return {
      number: o.number, status: o.status, createdAt: o.created_at, destination: { city: o.shipping_city, address: o.shipping_address },
      placed: events.filter((e) => e.kind === 'placed').map(dto)[0] ?? null, shipments,
    };
  }

  /** Le vendeur indique où se trouve le colis (ville, étape, remarque) tant que sa part de commande est confirmée ou expédiée. */
  async addTracking(userId: string, number: string, b: { location: string; note?: string }) {
    const s = await this.requireShop(userId);
    const o = (await this.db.query<{ id: string }>('SELECT id FROM orders WHERE number = $1', [number]))[0];
    const live = o ? await this.db.query('SELECT 1 FROM order_items WHERE order_id = $1 AND shop_id = $2 AND status IN (\'confirmed\',\'shipped\') LIMIT 1', [o.id, s.id]) : [];
    if (!o || !live[0]) throw new AppError(409, 'invalid_transition', 'La position ne peut être mise à jour que pour une commande confirmée ou expédiée.');
    await this.db.query("INSERT INTO order_events(order_id, shop_id, kind, location, note) VALUES ($1,$2,'update',$3,$4)", [o.id, s.id, b.location.trim(), b.note?.trim() || null]);
    return { ok: true };
  }

  // ---------- Boutique du vendeur ----------
  async getShop(userId: string) {
    const r = await this.db.query<{ id: string; name: string; slug: string; phone: string | null; whatsapp: string | null; notify_whatsapp: boolean; description: string | null; plan: string; plan_expires_at: Date | null; status: string; is_official: boolean; country_code: string | null; city: string | null; reject_reason: string | null }>(
      `SELECT s.id, s.name, s.slug, s.phone, s.whatsapp, s.notify_whatsapp, s.description, s.plan, s.plan_expires_at, s.status, s.is_official, s.country_code, c.name AS city, s.reject_reason
         FROM shops s LEFT JOIN cities c ON c.id = s.city_id WHERE s.owner_id = $1`, [userId]);
    const s = r[0];
    if (!s) return null;
    const expired = s.plan !== 'free' && (!s.plan_expires_at || new Date(s.plan_expires_at).getTime() <= Date.now());
    const plan = (await this.db.query<PlanRow>('SELECT * FROM plans WHERE code = $1', [expired ? 'free' : s.plan]))[0]!;
    const used = await this.db.query<{ n: string }>("SELECT count(*) AS n FROM products WHERE shop_id = $1 AND status = 'active'", [s.id]);
    const pending = await this.db.query<{ plan: string }>("SELECT plan FROM plan_requests WHERE shop_id = $1 AND status = 'pending' ORDER BY created_at DESC LIMIT 1", [s.id]);
    return {
      id: s.id, name: s.name, slug: s.slug, phone: s.phone, whatsapp: s.whatsapp, notifyWhatsapp: s.notify_whatsapp, description: s.description, status: s.status, rejectReason: s.reject_reason, isOfficial: s.is_official, countryCode: s.country_code, city: s.city,
      plan: plan.code, planName: plan.name, certified: s.is_official || plan.certified, planExpiresAt: s.plan_expires_at, commissionBps: s.is_official ? 0 : plan.commission_bps,
      maxProducts: plan.max_products, productCount: Number(used[0]?.n ?? 0), pendingPlan: pending[0]?.plan ?? null,
    };
  }

  async createShop(user: UserRow, b: { name: string; phone?: string; whatsapp?: string; description?: string; countryCode?: string; citySlug?: string }) {
    if (await this.getShop(user.id)) throw new AppError(409, 'shop_exists', 'Vous avez déjà une boutique.');
    if (!user.email && !b.whatsapp && !user.phone) throw new AppError(400, 'contact_required', 'Indiquez un numéro WhatsApp pour être joint.');
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
      // Un vendeur sans e-mail est joint par WhatsApp : son numéro de compte sert alors par défaut.
      const whatsapp = b.whatsapp ?? (user.email ? null : user.phone);
      await this.db.query('INSERT INTO shops(id,owner_id,name,slug,city_id,country_code,phone,whatsapp,description,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,\'pending\')',
        [newId(), user.id, b.name.trim(), slug, city[0]?.id ?? null, country, b.phone ?? user.phone, whatsapp, b.description ?? null]);
      await this.db.query('INSERT INTO notifications(kind,title,body,ref) VALUES ($1,$2,$3,$4)',
        ['shop.created', `Nouvelle boutique à valider : ${b.name.trim()}`, `${user.first_name} ${user.last_name} (${user.email ?? user.phone}) · ${country}`, slug]);
      return (await this.getShop(user.id))!;
    }
    throw new AppError(409, 'slug_taken', 'Nom de boutique indisponible.');
  }

  async updateShop(userId: string, b: { name?: string; phone?: string; whatsapp?: string | null; notifyWhatsapp?: boolean; description?: string }) {
    const s = await this.getShop(userId);
    if (!s) throw new AppError(403, 'no_shop', 'Créez votre boutique d’abord.');
    await this.db.query('UPDATE shops SET name = COALESCE($2, name), phone = COALESCE($3, phone), description = COALESCE($4, description), whatsapp = CASE WHEN $5 THEN $6 ELSE whatsapp END, notify_whatsapp = COALESCE($7, notify_whatsapp) WHERE id = $1', [s.id, b.name?.trim() ?? null, b.phone ?? null, b.description ?? null, b.whatsapp !== undefined, b.whatsapp ?? null, b.notifyWhatsapp ?? null]);
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
    return this.storeImage(s.id, base64, true);
  }

  /** Photo envoyée par l'administration (bannières du carrousel) : rattachée à la boutique officielle, sans quota. */
  async uploadOfficialImage(base64: string) {
    return this.storeImage(OFFICIAL_SHOP_ID, base64, false);
  }

  private async storeImage(shopId: string, base64: string, quota: boolean) {
    const bytes = Buffer.from(base64, 'base64');
    if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) throw new AppError(413, 'image_too_large', 'Photo trop lourde (1,5 Mo maximum).');
    const type = sniff(bytes);
    if (!type) throw new AppError(415, 'image_type_unsupported', 'Format non pris en charge (JPEG, PNG ou WebP).');
    if (quota) {
      const count = await this.db.query<{ n: string }>('SELECT count(*) AS n FROM uploaded_images WHERE shop_id = $1', [shopId]);
      if (Number(count[0]?.n) >= MAX_IMAGES_PER_SHOP) throw new AppError(409, 'image_quota', 'Limite de photos atteinte pour cette boutique.');
    }
    const id = newId();
    if (this.store) {
      let url: string;
      try { url = await this.store.put(`shops/${shopId}/${id}`, bytes, type); } catch { throw new AppError(502, 'storage_unavailable', "Stockage des photos indisponible, réessayez."); }
      await this.db.query('INSERT INTO uploaded_images(id, shop_id, content_type, url, size) VALUES ($1,$2,$3,$4,$5)', [id, shopId, type, url, bytes.length]);
      return { url };
    }
    await this.db.query('INSERT INTO uploaded_images(id, shop_id, content_type, bytes, size) VALUES ($1,$2,$3,$4,$5)', [id, shopId, type, bytes, bytes.length]);
    return { url: `/api/v1/images/${id}` };
  }

  async getImage(id: string): Promise<{ type: string; bytes: Buffer } | { type: string; redirect: string }> {
    const r = await this.db.query<{ content_type: string; bytes: Buffer | null; url: string | null }>('SELECT content_type, bytes, url FROM uploaded_images WHERE id = $1', [id]);
    if (!r[0]) throw new AppError(404, 'not_found', 'Photo introuvable.');
    if (r[0].bytes) return { type: r[0].content_type, bytes: r[0].bytes };
    return { type: r[0].content_type, redirect: r[0].url! };
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
    const done = await this.db.transaction(async (t) => {
      const r = await t.query('UPDATE order_items SET status = $4 WHERE order_id = $1 AND shop_id = $2 AND status = ANY($3::text[]) RETURNING id', [o.id, s.id, from, to]);
      if (!r[0]) throw new AppError(409, 'invalid_transition', 'Cette action n’est pas possible dans l’état actuel de la commande.');
      const origin = (await t.query<{ city: string | null }>('SELECT c.name AS city FROM shops sh LEFT JOIN cities c ON c.id = sh.city_id WHERE sh.id = $1', [s.id]))[0]?.city ?? null;
      await t.query('INSERT INTO order_events(order_id, shop_id, kind, location, note) VALUES ($1,$2,$3,$4,$5)',
        [o.id, s.id, to, to === 'cancelled' ? null : origin, to === 'confirmed' ? 'Commande confirmée par le vendeur' : to === 'shipped' ? 'Colis expédié par le vendeur' : 'Commande annulée par le vendeur']);
      return { status: await this.syncOrderStatus(t, o.id) };
    });
    await this.notify?.orderStatus(o.id, to);
    return done;
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

  // ---------- Gains et retraits ----------
  static readonly MIN_WITHDRAWAL_USD = 10;

  private async balance(db: Db, shopId: string) {
    const r = (await db.query<{ net: string; pending: string; paid: string }>(
      `SELECT (SELECT COALESCE(SUM(unit_price_usd * quantity * (10000 - commission_bps) / 10000.0),0) FROM order_items WHERE shop_id = $1 AND status = 'delivered') AS net,
              (SELECT COALESCE(SUM(amount_usd),0) FROM withdrawals WHERE shop_id = $1 AND status = 'pending') AS pending,
              (SELECT COALESCE(SUM(amount_usd),0) FROM withdrawals WHERE shop_id = $1 AND status = 'paid') AS paid`, [shopId]))[0]!;
    const net = round2(Number(r.net)), pending = round2(Number(r.pending)), paid = round2(Number(r.paid));
    return { earnedUsd: net, pendingUsd: pending, paidUsd: paid, availableUsd: round2(net - pending - paid) };
  }

  async wallet(userId: string) {
    const s = await this.requireShop(userId);
    const rows = await this.db.query<{ id: string; amount_usd: string; method: string; provider: string; account_name: string; account_number: string; status: string; reference: string | null; reason: string | null; created_at: Date; decided_at: Date | null }>(
      'SELECT * FROM withdrawals WHERE shop_id = $1 ORDER BY created_at DESC LIMIT 50', [s.id]);
    return {
      ...(await this.balance(this.db, s.id)), minWithdrawalUsd: CommerceService.MIN_WITHDRAWAL_USD,
      withdrawals: rows.map((r) => ({ id: r.id, amountUsd: Number(r.amount_usd), method: r.method, provider: r.provider, accountName: r.account_name, accountNumber: r.account_number, status: r.status, reference: r.reference, reason: r.reason, createdAt: r.created_at, decidedAt: r.decided_at })),
    };
  }

  async requestWithdrawal(userId: string, b: { amountUsd: number; method: 'mobile_money' | 'bank'; provider: string; accountName: string; accountNumber: string }) {
    const s = await this.requireShop(userId);
    const shop = (await this.db.query<{ status: string; is_official: boolean; name: string }>('SELECT status, is_official, name FROM shops WHERE id = $1', [s.id]))[0]!;
    if (shop.is_official) throw new AppError(403, 'forbidden', 'La boutique officielle ne demande pas de retrait.');
    if (shop.status !== 'active') throw new AppError(403, 'shop_not_active', 'Votre boutique doit être validée pour retirer vos gains.');
    const amount = round2(b.amountUsd);
    if (amount < CommerceService.MIN_WITHDRAWAL_USD) throw new AppError(400, 'below_minimum', `Retrait minimum : ${CommerceService.MIN_WITHDRAWAL_USD} $.`);
    const id = await this.db.transaction(async (t) => {
      await t.query('SELECT id FROM shops WHERE id = $1 FOR UPDATE', [s.id]); // deux demandes simultanées ne doivent pas dépasser le solde
      if (amount > (await this.balance(t, s.id)).availableUsd) throw new AppError(409, 'insufficient_balance', 'Montant supérieur à votre solde disponible.');
      if (Number((await t.query<{ n: string }>("SELECT count(*) AS n FROM withdrawals WHERE shop_id = $1 AND status = 'pending'", [s.id]))[0]!.n) >= 3) throw new AppError(409, 'too_many_pending', 'Trois demandes sont déjà en attente de validation.');
      const wid = newId();
      await t.query('INSERT INTO withdrawals(id, shop_id, amount_usd, method, provider, account_name, account_number) VALUES ($1,$2,$3,$4,$5,$6,$7)', [wid, s.id, amount.toFixed(2), b.method, b.provider.trim(), b.accountName.trim(), b.accountNumber.trim()]);
      await t.query('INSERT INTO notifications(kind,title,body,ref) VALUES ($1,$2,$3,$4)', ['withdrawal.requested', `Demande de retrait : ${amount.toFixed(2)} $`, `Boutique ${shop.name} · ${b.provider.trim()}`, wid]);
      return wid;
    });
    return { id };
  }

  // ---------- Messagerie acheteur ↔ vendeur ----------
  /** Ouvre (ou reprend) la discussion de l'acheteur avec la boutique du produit et y poste le premier message. */
  async startConversation(userId: string, productId: number, body: string) {
    const p = (await this.db.query<{ shop_id: string; owner_id: string | null }>(
      "SELECT p.shop_id, s.owner_id FROM products p JOIN shops s ON s.id = p.shop_id WHERE p.id = $1 AND p.status = 'active' AND s.status = 'active'", [productId]))[0];
    if (!p) throw new AppError(404, 'not_found', 'Produit introuvable.');
    if (p.owner_id === null) throw new AppError(400, 'official_shop', 'Cet article est vendu par Mwinda Market : écrivez-nous depuis la page Contact.');
    if (p.owner_id === userId) throw new AppError(400, 'own_shop', 'Vous ne pouvez pas écrire à votre propre boutique.');
    const existing = (await this.db.query<{ id: string }>('SELECT id FROM conversations WHERE buyer_id = $1 AND shop_id = $2', [userId, p.shop_id]))[0];
    const id = existing ? Number(existing.id) : Number((await this.db.query<{ id: string }>('INSERT INTO conversations(buyer_id, shop_id) VALUES ($1,$2) RETURNING id', [userId, p.shop_id]))[0]!.id);
    await this.addMessage(id, 'buyer', body, productId);
    return { id };
  }

  /** Discussion déjà ouverte par l'acheteur avec la boutique de ce produit (ou null). */
  async findConversation(userId: string, productId: number) {
    const r = (await this.db.query<{ id: string }>('SELECT c.id FROM conversations c JOIN products p ON p.shop_id = c.shop_id WHERE c.buyer_id = $1 AND p.id = $2', [userId, productId]))[0];
    return { id: r ? Number(r.id) : null };
  }

  private async side(userId: string, conversationId: number): Promise<{ side: 'buyer' | 'seller'; shopId: string }> {
    const c = (await this.db.query<{ buyer_id: string; shop_id: string; owner_id: string | null }>(
      'SELECT c.buyer_id, c.shop_id, s.owner_id FROM conversations c JOIN shops s ON s.id = c.shop_id WHERE c.id = $1', [conversationId]))[0];
    if (!c || (c.buyer_id !== userId && c.owner_id !== userId)) throw new AppError(404, 'not_found', 'Discussion introuvable.');
    return { side: c.buyer_id === userId ? 'buyer' : 'seller', shopId: c.shop_id };
  }

  private async addMessage(conversationId: number, sender: 'buyer' | 'seller', body: string, productId?: number) {
    await this.db.query('INSERT INTO messages(conversation_id, sender, body, product_id) VALUES ($1,$2,$3,$4)', [conversationId, sender, body.trim(), productId ?? null]);
    await this.db.query(`UPDATE conversations SET last_message_at = now(), ${sender === 'buyer' ? 'buyer_read_at' : 'shop_read_at'} = now() WHERE id = $1`, [conversationId]);
  }

  async postMessage(userId: string, conversationId: number, body: string) {
    const { side } = await this.side(userId, conversationId);
    await this.addMessage(conversationId, side, body);
    return { ok: true };
  }

  async listMessages(userId: string, conversationId: number) {
    const { side } = await this.side(userId, conversationId);
    await this.db.query(`UPDATE conversations SET ${side === 'buyer' ? 'buyer_read_at' : 'shop_read_at'} = now() WHERE id = $1`, [conversationId]);
    const rows = await this.db.query<{ id: string; sender: string; body: string; product_id: string | null; product_name: string | null; created_at: Date }>(
      'SELECT m.id, m.sender, m.body, m.product_id, p.name AS product_name, m.created_at FROM messages m LEFT JOIN products p ON p.id = m.product_id WHERE m.conversation_id = $1 ORDER BY m.id', [conversationId]);
    return { side, messages: rows.map((m) => ({ id: Number(m.id), mine: m.sender === side, sender: m.sender, body: m.body, productId: m.product_id ? Number(m.product_id) : null, productName: m.product_name, createdAt: m.created_at })) };
  }

  async listConversations(userId: string, as: 'buyer' | 'seller') {
    const rows = await this.db.query<{ id: string; other: string; last_message_at: Date; last_body: string | null; unread: string }>(
      as === 'buyer'
        ? `SELECT c.id, s.name AS other, c.last_message_at,
                  (SELECT body FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) AS last_body,
                  (SELECT count(*) FROM messages WHERE conversation_id = c.id AND sender = 'seller' AND created_at > c.buyer_read_at) AS unread
             FROM conversations c JOIN shops s ON s.id = c.shop_id WHERE c.buyer_id = $1 ORDER BY c.last_message_at DESC LIMIT 100`
        : `SELECT c.id, u.first_name || ' ' || u.last_name AS other, c.last_message_at,
                  (SELECT body FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) AS last_body,
                  (SELECT count(*) FROM messages WHERE conversation_id = c.id AND sender = 'buyer' AND created_at > c.shop_read_at) AS unread
             FROM conversations c JOIN shops s ON s.id = c.shop_id JOIN users u ON u.id = c.buyer_id WHERE s.owner_id = $1 ORDER BY c.last_message_at DESC LIMIT 100`, [userId]);
    return rows.map((c) => ({ id: Number(c.id), other: c.other, lastMessageAt: c.last_message_at, lastBody: c.last_body, unread: Number(c.unread) }));
  }

  /** Suggestions de recherche : produits actifs dont le nom, la catégorie ou la boutique correspondent. */
  async suggest(q: string) {
    const like = `%${q.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    const rows = await this.db.query<{ id: string; name: string; price_usd: string; category: string; department: string; image: string | null }>(
      `SELECT p.id, p.name, p.price_usd, p.category, p.department, (SELECT url FROM product_images WHERE product_id = p.id AND position = 0) AS image
         FROM products p JOIN shops s ON s.id = p.shop_id
        WHERE p.status = 'active' AND s.status = 'active' AND (p.name ILIKE $1 OR p.category ILIKE $1 OR p.description ILIKE $1 OR s.name ILIKE $1)
        ORDER BY (p.name ILIKE $1) DESC, p.id DESC LIMIT 8`, [like]);
    return rows.map((p) => ({ id: Number(p.id), name: p.name, priceUsd: Number(p.price_usd), category: p.category, department: p.department, image: p.image }));
  }
}
