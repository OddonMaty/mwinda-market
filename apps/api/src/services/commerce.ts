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
      const rows = await t.query<ProductRow & { image: string | null; shop_status: string }>(
        `SELECT p.*, s.status AS shop_status, (SELECT url FROM product_images WHERE product_id = p.id AND position = 0) AS image
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
      const orderId = newId();
      const num = await t.query<{ n: string }>("SELECT nextval('order_number_seq') AS n");
      const number = `STM-${num[0]!.n}`;
      await t.query('INSERT INTO orders(id,number,user_id,subtotal_usd,shipping_phone,shipping_city,shipping_address) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [orderId, number, user.id, subtotal.toFixed(2), ship.shippingPhone, ship.shippingCity, ship.shippingAddress]);
      for (const { p, i, unit } of lines) {
        await t.query('INSERT INTO order_items(id,order_id,product_id,shop_id,name,unit_price_usd,quantity,color,size,image) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
          [newId(), orderId, p.id, p.shop_id, p.name, unit.toFixed(2), i.quantity, i.color ?? '', i.size ?? '', p.image]);
      }
      return { id: orderId, number, subtotalUsd: Number(subtotal.toFixed(2)) };
    });
  }

  async listOrders(userId: string) {
    const orders = await this.db.query<{ id: string; number: string; status: string; subtotal_usd: string; shipping_city: string; shipping_address: string; created_at: Date }>(
      'SELECT id, number, status, subtotal_usd, shipping_city, shipping_address, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100', [userId]);
    const items = orders.length
      ? await this.db.query<{ order_id: string; product_id: string; name: string; unit_price_usd: string; quantity: number; color: string; size: string; image: string | null }>(
          'SELECT order_id, product_id, name, unit_price_usd, quantity, color, size, image FROM order_items WHERE order_id = ANY($1::char(26)[])', [orders.map((o) => o.id)])
      : [];
    return orders.map((o) => ({
      id: o.id, number: o.number, status: o.status, subtotalUsd: Number(o.subtotal_usd), city: o.shipping_city, address: o.shipping_address, createdAt: o.created_at,
      items: items.filter((i) => i.order_id === o.id).map((i) => ({ productId: Number(i.product_id), name: i.name, unitPriceUsd: Number(i.unit_price_usd), quantity: i.quantity, color: i.color, size: i.size, image: i.image })),
    }));
  }

  // ---------- Boutique du vendeur ----------
  async getShop(userId: string) {
    const r = await this.db.query<{ id: string; name: string; slug: string; phone: string | null; description: string | null; plan: string; status: string; is_official: boolean }>(
      'SELECT id, name, slug, phone, description, plan, status, is_official FROM shops WHERE owner_id = $1', [userId]);
    const s = r[0];
    return s ? { id: s.id, name: s.name, slug: s.slug, phone: s.phone, description: s.description, plan: s.plan, status: s.status, isOfficial: s.is_official } : null;
  }

  async createShop(user: UserRow, b: { name: string; phone?: string; description?: string; citySlug?: string }) {
    if (await this.getShop(user.id)) throw new AppError(409, 'shop_exists', 'Vous avez déjà une boutique.');
    const city = b.citySlug ? await this.db.query<{ id: string }>('SELECT id FROM cities WHERE slug = $1', [b.citySlug]) : [];
    const base = slugify(b.name);
    for (let n = 0; n < 20; n++) {
      const slug = n === 0 ? base : `${base}-${n + 1}`;
      const taken = await this.db.query('SELECT 1 FROM shops WHERE slug = $1', [slug]);
      if (taken[0]) continue;
      await this.db.query('INSERT INTO shops(id,owner_id,name,slug,city_id,phone,description) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [newId(), user.id, b.name.trim(), slug, city[0]?.id ?? user.city_id ?? null, b.phone ?? user.phone, b.description ?? null]);
      return (await this.getShop(user.id))!;
    }
    throw new AppError(409, 'slug_taken', 'Nom de boutique indisponible.');
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

  private async writeImages(t: Db, productId: string | number, images: string[]) {
    await t.query('DELETE FROM product_images WHERE product_id = $1', [productId]);
    for (const [i, url] of images.slice(0, 5).entries()) await t.query('INSERT INTO product_images(product_id, position, url) VALUES ($1,$2,$3)', [productId, i, url]);
  }

  async createProduct(userId: string, b: ProductInput) {
    const s = await this.requireShop(userId);
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
    const rows = await this.db.query<{ number: string; status: string; created_at: Date; shipping_city: string; shipping_phone: string; first_name: string; last_name: string; name: string; unit_price_usd: string; quantity: number; color: string; size: string }>(
      `SELECT o.number, o.status, o.created_at, o.shipping_city, o.shipping_phone, u.first_name, u.last_name, i.name, i.unit_price_usd, i.quantity, i.color, i.size
         FROM order_items i JOIN orders o ON o.id = i.order_id JOIN users u ON u.id = o.user_id
        WHERE i.shop_id = $1 ORDER BY o.created_at DESC LIMIT 200`, [s.id]);
    const out = new Map<string, { number: string; status: string; createdAt: Date; customer: string; city: string; phone: string; totalUsd: number; items: { name: string; quantity: number; unitPriceUsd: number; color: string; size: string }[] }>();
    for (const r of rows) {
      const o = out.get(r.number) ?? { number: r.number, status: r.status, createdAt: r.created_at, customer: `${r.first_name} ${r.last_name}`, city: r.shipping_city, phone: r.shipping_phone, totalUsd: 0, items: [] };
      o.items.push({ name: r.name, quantity: r.quantity, unitPriceUsd: Number(r.unit_price_usd), color: r.color, size: r.size });
      o.totalUsd += Number(r.unit_price_usd) * r.quantity;
      out.set(r.number, o);
    }
    return [...out.values()];
  }
}
