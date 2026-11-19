import { AppError } from '../errors.js';
import { newId } from '../lib/crypto.js';
import type { Db } from '../db/client.js';
import { ORDER_FLOW, planDto, type CommerceService, type PlanRow } from './commerce.js';

export type AdminRole = 'moderator' | 'finance' | 'superadmin';
export const LEGAL_SLUGS = ['conditions', 'confidentialite', 'conditions-vendeur', 'remboursement', 'livraison', 'paiements'] as const;
const round2 = (n: number): number => Math.round(n * 100) / 100;
const like = (q?: string) => `%${(q ?? '').trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

/** Contenu public de référence : pays, villes, plans et textes légaux. */
export class PlatformService {
  constructor(protected db: Db) {}

  async countries() {
    const rows = await this.db.query<{ code: string; name: string; phone_prefix: string; currency_code: string | null }>('SELECT code, name, phone_prefix, currency_code FROM countries WHERE active ORDER BY name');
    const cities = await this.db.query<{ country_code: string; name: string; slug: string }>(
      'SELECT r.country_code, c.name, c.slug FROM cities c JOIN regions r ON r.id = c.region_id WHERE r.country_code = ANY($1::text[]) ORDER BY c.name', [rows.map((r) => r.code)]);
    return rows.map((c) => ({ code: c.code, name: c.name, phonePrefix: c.phone_prefix, currency: c.currency_code, cities: cities.filter((x) => x.country_code === c.code).map((x) => ({ name: x.name, slug: x.slug })) }));
  }

  async page(slug: string) {
    const r = (await this.db.query<{ slug: string; title: string; body: string; updated_at: Date }>('SELECT slug, title, body, updated_at FROM pages WHERE slug = $1', [slug]))[0];
    if (!r) throw new AppError(404, 'not_found', 'Page introuvable.');
    return { slug: r.slug, title: r.title, body: r.body, updatedAt: r.updated_at };
  }
}

export class AdminService extends PlatformService {
  constructor(db: Db, private commerce: CommerceService) { super(db); }

  async roles(userId: string): Promise<AdminRole[]> {
    return (await this.db.query<{ role: AdminRole }>('SELECT role FROM admin_roles WHERE user_id = $1', [userId])).map((r) => r.role);
  }

  async audit(actorId: string, action: string, type: string, target: string, after?: unknown, ip?: string) {
    await this.db.query('INSERT INTO audit_log(id, actor_id, action, target_type, target_id, after, ip) VALUES ($1,$2,$3,$4,$5,$6,$7)', [newId(), actorId, action, type, target, after ? JSON.stringify(after) : null, ip ?? null]);
  }

  async stats() {
    const one = async (sql: string) => Number((await this.db.query<{ n: string }>(sql))[0]?.n ?? 0);
    const money = (await this.db.query<{ gmv: string; commission: string }>(
      `SELECT COALESCE(SUM(unit_price_usd * quantity),0) AS gmv, COALESCE(SUM(unit_price_usd * quantity * commission_bps / 10000.0),0) AS commission FROM order_items WHERE status = 'delivered'`))[0]!;
    const byStatus = await this.db.query<{ status: string; n: string }>('SELECT status, count(*) AS n FROM orders GROUP BY status');
    return {
      users: await one('SELECT count(*) AS n FROM users'),
      shops: await one("SELECT count(*) AS n FROM shops WHERE owner_id IS NOT NULL"),
      shopsPending: await one("SELECT count(*) AS n FROM shops WHERE status = 'pending'"),
      products: await one("SELECT count(*) AS n FROM products WHERE status = 'active'"),
      orders: await one('SELECT count(*) AS n FROM orders'),
      ordersByStatus: Object.fromEntries(byStatus.map((r) => [r.status, Number(r.n)])),
      planRequests: await one("SELECT count(*) AS n FROM plan_requests WHERE status = 'pending'"),
      salesUsd: round2(Number(money.gmv)), commissionUsd: round2(Number(money.commission)),
    };
  }

  // ---------- Utilisateurs ----------
  async users(q?: string) {
    const rows = await this.db.query<{ id: string; email: string; first_name: string; last_name: string; phone: string | null; country_code: string | null; status: string; created_at: Date; roles: string[] | null; shop: string | null }>(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.country_code, u.status, u.created_at,
              (SELECT array_agg(role) FROM admin_roles WHERE user_id = u.id) AS roles, (SELECT name FROM shops WHERE owner_id = u.id) AS shop
         FROM users u WHERE u.email ILIKE $1 OR u.first_name ILIKE $1 OR u.last_name ILIKE $1 ORDER BY u.created_at DESC LIMIT 200`, [like(q)]);
    return rows.map((u) => ({ id: u.id, email: u.email, name: `${u.first_name} ${u.last_name}`, phone: u.phone, countryCode: u.country_code, status: u.status, createdAt: u.created_at, roles: u.roles ?? [], shop: u.shop }));
  }

  async setUserStatus(actor: string, id: string, status: 'active' | 'suspended') {
    if (id === actor) throw new AppError(400, 'self_action', 'Vous ne pouvez pas suspendre votre propre compte.');
    const r = await this.db.query('UPDATE users SET status = $2, updated_at = now() WHERE id = $1 RETURNING id', [id, status]);
    if (!r[0]) throw new AppError(404, 'not_found', 'Utilisateur introuvable.');
    if (status === 'suspended') await this.db.query('UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [id]);
    await this.audit(actor, `user.${status}`, 'user', id);
  }

  async setUserRoles(actor: string, id: string, roles: AdminRole[]) {
    if (id === actor && !roles.includes('superadmin')) throw new AppError(400, 'self_action', 'Vous ne pouvez pas retirer votre propre rôle de super-administrateur.');
    if (!(await this.db.query('SELECT 1 FROM users WHERE id = $1', [id]))[0]) throw new AppError(404, 'not_found', 'Utilisateur introuvable.');
    await this.db.transaction(async (t) => {
      await t.query('DELETE FROM admin_roles WHERE user_id = $1', [id]);
      for (const role of roles) await t.query('INSERT INTO admin_roles(user_id, role) VALUES ($1,$2)', [id, role]);
    });
    await this.audit(actor, 'user.roles', 'user', id, { roles });
  }

  // ---------- Boutiques ----------
  async shops(q?: string) {
    const rows = await this.db.query<{ id: string; name: string; slug: string; status: string; plan: string; plan_expires_at: Date | null; is_official: boolean; country_code: string | null; city: string | null; owner: string | null; products: string; created_at: Date }>(
      `SELECT s.id, s.name, s.slug, s.status, s.plan, s.plan_expires_at, s.is_official, s.country_code, c.name AS city, u.email AS owner,
              (SELECT count(*) FROM products WHERE shop_id = s.id AND status = 'active') AS products, s.created_at
         FROM shops s LEFT JOIN users u ON u.id = s.owner_id LEFT JOIN cities c ON c.id = s.city_id
        WHERE s.name ILIKE $1 OR u.email ILIKE $1 ORDER BY s.created_at DESC LIMIT 200`, [like(q)]);
    return rows.map((s) => ({ id: s.id, name: s.name, slug: s.slug, status: s.status, plan: s.plan, planExpiresAt: s.plan_expires_at, isOfficial: s.is_official, countryCode: s.country_code, city: s.city, owner: s.owner, products: Number(s.products), createdAt: s.created_at }));
  }

  async updateShop(actor: string, id: string, b: { status?: 'pending' | 'active' | 'suspended'; plan?: string; planMonths?: number }) {
    if (!(await this.db.query('SELECT 1 FROM shops WHERE id = $1', [id]))[0]) throw new AppError(404, 'not_found', 'Boutique introuvable.');
    if (b.status) await this.db.query('UPDATE shops SET status = $2 WHERE id = $1', [id, b.status]);
    if (b.plan) {
      if (!(await this.db.query('SELECT 1 FROM plans WHERE code = $1', [b.plan]))[0]) throw new AppError(404, 'not_found', 'Plan introuvable.');
      const months = b.plan === 'free' ? null : (b.planMonths ?? 3);
      await this.db.query("UPDATE shops SET plan = $2, plan_expires_at = CASE WHEN $3::int IS NULL THEN NULL ELSE now() + ($3::int * interval '1 month') END WHERE id = $1", [id, b.plan, months]);
    }
    await this.audit(actor, 'shop.update', 'shop', id, b);
  }

  // ---------- Produits ----------
  async products(q?: string, status?: string) {
    const rows = await this.db.query<{ id: string; name: string; price_usd: string; status: string; department: string; shop: string; created_at: Date }>(
      `SELECT p.id, p.name, p.price_usd, p.status, p.department, s.name AS shop, p.created_at FROM products p JOIN shops s ON s.id = p.shop_id
        WHERE (p.name ILIKE $1 OR s.name ILIKE $1) AND ($2::text IS NULL OR p.status = $2) ORDER BY p.created_at DESC LIMIT 200`, [like(q), status ?? null]);
    return rows.map((p) => ({ id: Number(p.id), name: p.name, priceUsd: Number(p.price_usd), status: p.status, department: p.department, shop: p.shop, createdAt: p.created_at }));
  }

  async setProductStatus(actor: string, id: number, status: 'active' | 'archived') {
    const r = await this.db.query('UPDATE products SET status = $2, updated_at = now() WHERE id = $1 RETURNING id', [id, status]);
    if (!r[0]) throw new AppError(404, 'not_found', 'Produit introuvable.');
    await this.audit(actor, `product.${status}`, 'product', String(id));
  }

  // ---------- Commandes ----------
  async orders(q?: string, status?: string) {
    const rows = await this.db.query<{ number: string; status: string; subtotal_usd: string; created_at: Date; email: string; first_name: string; last_name: string; city: string; commission: string }>(
      `SELECT o.number, o.status, o.subtotal_usd, o.created_at, u.email, u.first_name, u.last_name, o.shipping_city AS city,
              (SELECT COALESCE(SUM(unit_price_usd * quantity * commission_bps / 10000.0),0) FROM order_items WHERE order_id = o.id) AS commission
         FROM orders o JOIN users u ON u.id = o.user_id
        WHERE (o.number ILIKE $1 OR u.email ILIKE $1) AND ($2::text IS NULL OR o.status = $2) ORDER BY o.created_at DESC LIMIT 200`, [like(q), status ?? null]);
    return rows.map((o) => ({ number: o.number, status: o.status, totalUsd: Number(o.subtotal_usd), commissionUsd: round2(Number(o.commission)), createdAt: o.created_at, customer: `${o.first_name} ${o.last_name}`, email: o.email, city: o.city }));
  }

  /** Intervention de l'administration : force toutes les lignes non terminées vers l'état voulu. */
  async setOrderStatus(actor: string, number: string, status: (typeof ORDER_FLOW)[number] | 'cancelled') {
    const o = (await this.db.query<{ id: string }>('SELECT id FROM orders WHERE number = $1', [number]))[0];
    if (!o) throw new AppError(404, 'not_found', 'Commande introuvable.');
    await this.db.transaction(async (t) => {
      await t.query("UPDATE order_items SET status = $2 WHERE order_id = $1 AND status NOT IN ('cancelled', 'delivered')", [o.id, status]);
      await this.commerce.syncOrderStatus(t, o.id);
    });
    await this.audit(actor, 'order.status', 'order', number, { status });
  }

  // ---------- Plans ----------
  async plans() {
    return (await this.db.query<PlanRow>('SELECT * FROM plans ORDER BY sort, price_usd')).map(planDto);
  }

  async savePlan(actor: string, code: string, b: { name: string; priceUsd: number; commissionBps: number; maxProducts: number | null; features: string[]; sort: number; active: boolean }) {
    await this.db.query(
      `INSERT INTO plans(code,name,price_usd,commission_bps,max_products,features,sort,active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, price_usd=EXCLUDED.price_usd, commission_bps=EXCLUDED.commission_bps, max_products=EXCLUDED.max_products, features=EXCLUDED.features, sort=EXCLUDED.sort, active=EXCLUDED.active`,
      [code, b.name, b.priceUsd, b.commissionBps, b.maxProducts, b.features, b.sort, code === 'free' ? true : b.active]);
    await this.audit(actor, 'plan.save', 'plan', code, b);
  }

  async planRequests() {
    const rows = await this.db.query<{ id: string; plan: string; status: string; created_at: Date; shop: string; owner: string | null; price_usd: string }>(
      `SELECT r.id, r.plan, r.status, r.created_at, s.name AS shop, u.email AS owner, p.price_usd FROM plan_requests r JOIN shops s ON s.id = r.shop_id
         LEFT JOIN users u ON u.id = s.owner_id JOIN plans p ON p.code = r.plan ORDER BY (r.status = 'pending') DESC, r.created_at DESC LIMIT 100`);
    return rows.map((r) => ({ id: r.id, plan: r.plan, status: r.status, createdAt: r.created_at, shop: r.shop, owner: r.owner, priceUsd: Number(r.price_usd) }));
  }

  /** Validation après réception du paiement hors plateforme : le plan court 3 mois. */
  async decidePlanRequest(actor: string, id: string, approve: boolean) {
    const r = (await this.db.query<{ shop_id: string; plan: string }>("SELECT shop_id, plan FROM plan_requests WHERE id = $1 AND status = 'pending'", [id]))[0];
    if (!r) throw new AppError(404, 'not_found', 'Demande introuvable ou déjà traitée.');
    await this.db.transaction(async (t) => {
      await t.query('UPDATE plan_requests SET status = $2, decided_at = now() WHERE id = $1', [id, approve ? 'approved' : 'rejected']);
      if (approve) await t.query("UPDATE shops SET plan = $2, plan_expires_at = now() + interval '3 months' WHERE id = $1", [r.shop_id, r.plan]);
    });
    await this.audit(actor, approve ? 'plan_request.approve' : 'plan_request.reject', 'plan_request', id);
  }

  // ---------- Pays et villes ----------
  async allCountries() {
    const rows = await this.db.query<{ code: string; name: string; phone_prefix: string; active: boolean; currency_code: string | null; cities: string }>(
      'SELECT c.code, c.name, c.phone_prefix, c.active, c.currency_code, (SELECT count(*) FROM cities ci JOIN regions r ON r.id = ci.region_id WHERE r.country_code = c.code) AS cities FROM countries c ORDER BY c.name');
    return rows.map((c) => ({ code: c.code, name: c.name, phonePrefix: c.phone_prefix, active: c.active, currency: c.currency_code, cities: Number(c.cities) }));
  }

  async setCountryActive(actor: string, code: string, active: boolean) {
    const r = await this.db.query('UPDATE countries SET active = $2 WHERE code = $1 RETURNING code', [code, active]);
    if (!r[0]) throw new AppError(404, 'not_found', 'Pays introuvable.');
    await this.audit(actor, active ? 'country.enable' : 'country.disable', 'country', code);
  }

  async addCity(actor: string, countryCode: string, name: string) {
    let region = (await this.db.query<{ id: string }>("SELECT id FROM regions WHERE country_code = $1 ORDER BY (slug = 'villes-principales' OR slug = 'autres-provinces') DESC LIMIT 1", [countryCode]))[0];
    if (!region) {
      if (!(await this.db.query('SELECT 1 FROM countries WHERE code = $1', [countryCode]))[0]) throw new AppError(404, 'not_found', 'Pays introuvable.');
      region = { id: newId() };
      await this.db.query("INSERT INTO regions(id, country_code, name, slug) VALUES ($1,$2,'Villes principales','villes-principales')", [region.id, countryCode]);
    }
    const slug = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!slug) throw new AppError(400, 'validation_error', 'Nom de ville invalide.');
    const r = await this.db.query('INSERT INTO cities(id, region_id, name, slug) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING id', [newId(), region.id, name.trim(), slug]);
    if (!r[0]) throw new AppError(409, 'city_exists', 'Cette ville existe déjà.');
    await this.audit(actor, 'city.add', 'city', `${countryCode}:${slug}`);
  }

  // ---------- Pages légales ----------
  async pages() {
    const rows = await this.db.query<{ slug: string; title: string; body: string; updated_at: Date }>('SELECT slug, title, body, updated_at FROM pages');
    return LEGAL_SLUGS.map((slug) => { const r = rows.find((x) => x.slug === slug); return { slug, title: r?.title ?? null, body: r?.body ?? null, updatedAt: r?.updated_at ?? null }; });
  }

  async savePage(actor: string, slug: string, title: string, body: string) {
    await this.db.query('INSERT INTO pages(slug, title, body, updated_at) VALUES ($1,$2,$3,now()) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, updated_at = now()', [slug, title, body]);
    await this.audit(actor, 'page.save', 'page', slug);
  }

  async deletePage(actor: string, slug: string) {
    await this.db.query('DELETE FROM pages WHERE slug = $1', [slug]);
    await this.audit(actor, 'page.reset', 'page', slug);
  }

  async auditLog() {
    const rows = await this.db.query<{ action: string; target_type: string; target_id: string; created_at: Date; email: string | null }>(
      'SELECT a.action, a.target_type, a.target_id, a.created_at, u.email FROM audit_log a LEFT JOIN users u ON u.id = a.actor_id ORDER BY a.created_at DESC LIMIT 100');
    return rows.map((a) => ({ action: a.action, targetType: a.target_type, targetId: a.target_id, createdAt: a.created_at, actor: a.email }));
  }
}
