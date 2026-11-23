import { USD_RATES } from '@saotech/shared';
import { AppError } from '../errors.js';
import { newId } from '../lib/crypto.js';
import type { Db } from '../db/client.js';
import type { Notifier } from './notify.js';
import type { Mailer } from '../mail/mailer.js';
import * as tpl from '../mail/templates.js';
import { EFFECTIVE_PLAN_FOR, ORDER_FLOW, planDto, type CommerceService, type PlanRow } from './commerce.js';

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


  /** Taux de change : unités de monnaie locale pour 1 USD. Rafraîchis au plus toutes les 12 h depuis une source publique, sinon dernières valeurs connues, sinon valeurs de secours. */
  async rates() {
    type R = { code: string; rate: string; updated_at: Date };
    let rows = await this.db.query<R>('SELECT code, rate, updated_at FROM exchange_rates');
    const newest = rows.reduce((m, r) => Math.max(m, new Date(r.updated_at).getTime()), 0);
    if (rows.length === 0 || Date.now() - newest > 12 * 3600_000) {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(4000) });
        const json = (await res.json()) as { result?: string; rates?: Record<string, number> };
        if (json.result === 'success' && json.rates) {
          const entries = Object.entries(json.rates).filter(([c, v]) => /^[A-Z]{3}$/.test(c) && Number.isFinite(v) && v > 0);
          if (entries.length > 20) {
            await this.db.query('INSERT INTO exchange_rates(code, rate, updated_at) SELECT k, v::numeric, now() FROM unnest($1::text[], $2::float8[]) AS t(k, v) ON CONFLICT (code) DO UPDATE SET rate = EXCLUDED.rate, updated_at = now()', [entries.map((e) => e[0]), entries.map((e) => e[1])]);
            rows = await this.db.query<R>('SELECT code, rate, updated_at FROM exchange_rates');
          }
        }
      } catch { /* source injoignable : on garde les derniers taux */ }
    }
    const rates: Record<string, number> = { ...USD_RATES };
    for (const r of rows) rates[r.code] = Number(r.rate);
    const updatedAt = rows.length ? new Date(rows.reduce((m, r) => Math.max(m, new Date(r.updated_at).getTime()), 0)).toISOString() : null;
    return { base: 'USD', rates, updatedAt, source: rows.length ? 'live' : 'fallback' };
  }

  async page(slug: string) {
    const r = (await this.db.query<{ slug: string; title: string; body: string; updated_at: Date }>('SELECT slug, title, body, updated_at FROM pages WHERE slug = $1', [slug]))[0];
    if (!r) throw new AppError(404, 'not_found', 'Page introuvable.');
    return { slug: r.slug, title: r.title, body: r.body, updatedAt: r.updated_at };
  }
}

export class AdminService extends PlatformService {
  constructor(db: Db, private commerce: CommerceService, private notifier?: { mailer: Mailer; baseUrl: string }, private notify?: Notifier) { super(db); }

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
      productsByDepartment: (await this.db.query<{ department: string; name: string; n: string }>("SELECT department, department_name AS name, SUM(products) AS n FROM catalogue_counts GROUP BY department, department_name HAVING SUM(products) > 0 ORDER BY SUM(products) DESC")).map((r) => ({ department: r.department, name: r.name, count: Number(r.n) })),
      salesUsd: round2(Number(money.gmv)), commissionUsd: round2(Number(money.commission)),
    };
  }

  // ---------- Utilisateurs ----------
  async users(q?: string) {
    const rows = await this.db.query<{ id: string; email: string; first_name: string; last_name: string; phone: string | null; country_code: string | null; status: string; created_at: Date; roles: string[] | null; shop: string | null }>(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.country_code, u.status, u.created_at,
              (SELECT array_agg(role) FROM admin_roles WHERE user_id = u.id) AS roles, (SELECT name FROM shops WHERE owner_id = u.id) AS shop
         FROM users u WHERE u.email ILIKE $1 OR u.phone ILIKE $1 OR u.first_name ILIKE $1 OR u.last_name ILIKE $1 ORDER BY u.created_at DESC LIMIT 200`, [like(q)]);
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

  async updateShop(actor: string, id: string, b: { status?: 'pending' | 'active' | 'suspended' | 'rejected'; reason?: string; plan?: string; planMonths?: number }) {
    const before = (await this.db.query<{ status: string; name: string; email: string | null; locale: string | null }>(
      'SELECT s.status, s.name, u.email, u.locale FROM shops s LEFT JOIN users u ON u.id = s.owner_id WHERE s.id = $1', [id]))[0];
    if (!before) throw new AppError(404, 'not_found', 'Boutique introuvable.');
    if (b.status) await this.db.query('UPDATE shops SET status = $2::varchar, reject_reason = CASE WHEN $2::text = \'rejected\' THEN $3::text ELSE NULL END WHERE id = $1', [id, b.status, b.reason?.trim() || null]);
    if (b.plan) {
      if (!(await this.db.query('SELECT 1 FROM plans WHERE code = $1', [b.plan]))[0]) throw new AppError(404, 'not_found', 'Plan introuvable.');
      const months = b.plan === 'free' ? null : (b.planMonths ?? 3);
      await this.db.query("UPDATE shops SET plan = $2, plan_expires_at = CASE WHEN $3::int IS NULL THEN NULL ELSE now() + ($3::int * interval '1 month') END WHERE id = $1", [id, b.plan, months]);
    }
    await this.audit(actor, 'shop.update', 'shop', id, b);
    await this.notifyOwner(before, b);
  }

  /** Prévient le vendeur par e-mail quand sa boutique est acceptée (avec le lien) ou refusée (avec le motif). Un échec d'envoi ne bloque jamais la décision. */
  private async notifyOwner(before: { status: string; name: string; email: string | null; locale: string | null }, b: { status?: string; reason?: string }) {
    if (!this.notifier || !before.email || !b.status || b.status === before.status) return;
    const locale = before.locale === 'en' ? 'en' : 'fr';
    try {
      if (b.status === 'active' && (before.status === 'pending' || before.status === 'rejected')) await this.notifier.mailer.send(tpl.shopApproved(locale, before.email, before.name, `${this.notifier.baseUrl}/vendeur/tableau`));
      else if (b.status === 'rejected') await this.notifier.mailer.send(tpl.shopRejected(locale, before.email, before.name, b.reason?.trim() || null));
    } catch { /* e-mail non envoyé : la décision reste enregistrée */ }
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

  // ---------- Carrousel d'accueil ----------
  private static readonly HERO_MAX = 8;
  private static readonly HERO_SQL = `SELECT h.*, p.name AS p_name, p.price_usd AS p_price, p.status AS p_status,
      (SELECT url FROM product_images WHERE product_id = p.id ORDER BY position LIMIT 1) AS p_image,
      s.name AS shop_name, s.status AS shop_status, s.is_official AS shop_official, pl.name AS plan_name,
      COALESCE(pl.hero_eligible, false) AS plan_eligible, ${EFFECTIVE_PLAN_FOR('s.plan', 's.plan_expires_at')} AS plan_code
    FROM hero_slides h LEFT JOIN products p ON p.id = h.product_id LEFT JOIN shops s ON s.id = p.shop_id
    LEFT JOIN plans pl ON pl.code = ${EFFECTIVE_PLAN_FOR('s.plan', 's.plan_expires_at')}`;

  private heroDto(r: HeroRow) {
    const linked = r.product_id != null;
    const eligible = !linked || r.shop_official === true || r.plan_eligible === true;
    const now = Date.now();
    const inWindow = (!r.starts_at || new Date(r.starts_at).getTime() <= now) && (!r.ends_at || new Date(r.ends_at).getTime() > now);
    const productOk = !linked || (r.p_status === 'active' && r.shop_status === 'active' && eligible);
    const price = r.price_usd != null ? Number(r.price_usd) : linked ? Number(r.p_price) : null;
    return {
      id: r.id.trim(), productId: linked ? Number(r.product_id) : null, tag: r.tag, title: r.title || r.p_name || '', text: r.text,
      image: r.image_url || r.p_image || '', priceUsd: price, priceOverride: r.price_usd != null ? Number(r.price_usd) : null,
      placement: r.placement, link: r.link, href: r.link || (linked ? `/produit/${r.product_id}` : '/collection'), position: r.position, active: r.active,
      startsAt: r.starts_at, endsAt: r.ends_at, shop: r.shop_name, plan: r.shop_official ? 'Officielle' : r.plan_name, eligible,
      live: r.active && inWindow && productOk,
      reason: !r.active ? 'inactive' : !inWindow ? 'hors_periode' : !linked ? null : r.p_status !== 'active' ? 'produit_indisponible' : r.shop_status !== 'active' ? 'boutique_inactive' : !eligible ? 'plan_non_eligible' : null,
    };
  }

  async publicHero() {
    const rows = await this.db.query<HeroRow>(`${AdminService.HERO_SQL} WHERE h.active AND h.placement = 'hero' ORDER BY h.position, h.created_at`);
    return rows.map((r) => this.heroDto(r)).filter((d) => d.live && d.image).slice(0, AdminService.HERO_MAX)
      .map((d) => ({ id: d.id, tag: d.tag, title: d.title, text: d.text, image: d.image, priceUsd: d.priceUsd, href: d.href }));
  }

  /** Produits promus « À la une » sur l'accueil (identifiants, dans l'ordre choisi par l'administrateur). */
  async promotedProducts() {
    const rows = await this.db.query<HeroRow>(`${AdminService.HERO_SQL} WHERE h.active AND h.placement = 'home' AND h.product_id IS NOT NULL ORDER BY h.position, h.created_at`);
    return rows.map((r) => this.heroDto(r)).filter((d) => d.live && d.productId != null).slice(0, 12).map((d) => ({ productId: d.productId!, tag: d.tag }));
  }

  async heroSlides() {
    const rows = await this.db.query<HeroRow>(`${AdminService.HERO_SQL} ORDER BY h.position, h.created_at`);
    return rows.map((r) => this.heroDto(r));
  }

  /** Produits proposables au carrousel : actifs, boutique active, avec l'éligibilité de leur abonnement. */
  async heroCandidates(q?: string) {
    const rows = await this.db.query<{ id: string; name: string; price_usd: string; image: string | null; shop: string; official: boolean; plan_name: string; eligible: boolean; demo: boolean }>(
      `SELECT p.id, p.name, p.price_usd, (SELECT url FROM product_images WHERE product_id = p.id ORDER BY position LIMIT 1) AS image,
              s.name AS shop, s.is_official AS official, pl.name AS plan_name, (s.is_official OR COALESCE(pl.hero_eligible,false)) AS eligible, p.is_demo AS demo
         FROM products p JOIN shops s ON s.id = p.shop_id JOIN plans pl ON pl.code = ${EFFECTIVE_PLAN_FOR('s.plan', 's.plan_expires_at')}
        WHERE p.status = 'active' AND s.status = 'active' AND p.name ILIKE $1
        ORDER BY (s.is_official OR pl.hero_eligible) DESC, pl.sort DESC, p.created_at DESC LIMIT 30`, [like(q)]);
    return rows.map((r) => ({ id: Number(r.id), name: r.name, priceUsd: Number(r.price_usd), image: r.image, shop: r.shop, plan: r.official ? 'Officielle' : r.plan_name, eligible: r.eligible, demo: r.demo }));
  }

  private async checkHeroProduct(productId: number | null | undefined) {
    if (productId == null) return;
    const r = await this.db.query<{ eligible: boolean }>(
      `SELECT (s.is_official OR COALESCE(pl.hero_eligible,false)) AS eligible FROM products p JOIN shops s ON s.id = p.shop_id
         JOIN plans pl ON pl.code = ${EFFECTIVE_PLAN_FOR('s.plan', 's.plan_expires_at')} WHERE p.id = $1`, [productId]);
    if (!r[0]) throw new AppError(404, 'not_found', 'Produit introuvable.');
    if (!r[0].eligible) throw new AppError(409, 'plan_not_eligible', "L'abonnement de ce vendeur n'inclut pas la mise en avant sur l'accueil.");
  }

  async createHeroSlide(actor: string, b: HeroInput) {
    const n = Number((await this.db.query<{ n: string }>('SELECT count(*) AS n FROM hero_slides'))[0]?.n ?? 0);
    if (n >= AdminService.HERO_MAX * 2) throw new AppError(409, 'hero_full', 'Trop de diapositives : supprimez-en avant d\'en ajouter.');
    if (b.placement === 'home' && b.productId == null) throw new AppError(400, 'validation_error', 'Une promotion « À la une » concerne un produit.');
    if (b.placement !== 'home' && b.productId == null && (!b.image || !b.title)) throw new AppError(400, 'validation_error', 'Une bannière libre demande un titre et une image.');
    await this.checkHeroProduct(b.productId);
    if (b.productId != null && (await this.db.query('SELECT 1 FROM hero_slides WHERE product_id = $1 AND placement = $2', [b.productId, b.placement ?? 'hero']))[0]) throw new AppError(409, 'already_promoted', 'Ce produit est déjà promu à cet emplacement.');
    const id = newId();
    const pos = Number((await this.db.query<{ m: string | null }>('SELECT max(position) + 1 AS m FROM hero_slides'))[0]?.m ?? 0);
    await this.db.query(
      'INSERT INTO hero_slides(id, product_id, tag, title, text, image_url, price_usd, link, position, active, starts_at, ends_at, placement) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      [id, b.productId ?? null, b.tag ?? '', b.title ?? '', b.text ?? '', b.image ?? '', b.priceUsd ?? null, b.link ?? null, pos, b.active ?? true, b.startsAt ?? null, b.endsAt ?? null, b.placement ?? 'hero']);
    await this.audit(actor, 'hero.create', 'hero_slide', id, b);
    return { id };
  }

  async updateHeroSlide(actor: string, id: string, b: Partial<HeroInput>) {
    const cur = (await this.db.query<{ product_id: string | null }>('SELECT product_id FROM hero_slides WHERE id = $1', [id]))[0];
    if (!cur) throw new AppError(404, 'not_found', 'Diapositive introuvable.');
    if (b.active !== false && 'productId' in b) await this.checkHeroProduct(b.productId);
    else if (b.active === true && cur.product_id != null) await this.checkHeroProduct(Number(cur.product_id));
    const cols: Record<string, unknown> = { product_id: b.productId, tag: b.tag, title: b.title, text: b.text, image_url: b.image, price_usd: b.priceUsd, link: b.link, active: b.active, starts_at: b.startsAt, ends_at: b.endsAt };
    const set = Object.entries(cols).filter(([, v]) => v !== undefined);
    if (set.length) await this.db.query(`UPDATE hero_slides SET ${set.map(([k], i) => `${k} = $${i + 2}`).join(', ')} WHERE id = $1`, [id, ...set.map(([, v]) => v)]);
    await this.audit(actor, 'hero.update', 'hero_slide', id, b);
  }

  async deleteHeroSlide(actor: string, id: string) {
    const r = await this.db.query('DELETE FROM hero_slides WHERE id = $1 RETURNING id', [id]);
    if (!r[0]) throw new AppError(404, 'not_found', 'Diapositive introuvable.');
    await this.audit(actor, 'hero.delete', 'hero_slide', id);
  }

  async reorderHero(actor: string, ids: string[]) {
    await this.db.transaction(async (t) => { for (const [i, id] of ids.entries()) await t.query('UPDATE hero_slides SET position = $2 WHERE id = $1', [id, i]); });
    await this.audit(actor, 'hero.reorder', 'hero_slide', 'all', ids);
  }

  async heroImage(base64: string) { return this.commerce.uploadOfficialImage(base64); }

  // ---------- Produits de démonstration ----------
  async demoStatus() {
    const r = (await this.db.query<{ total: string; active: string; real_active: string }>(
      `SELECT count(*) FILTER (WHERE is_demo) AS total, count(*) FILTER (WHERE is_demo AND status = 'active') AS active, count(*) FILTER (WHERE NOT is_demo AND status = 'active') AS real_active FROM products`))[0]!;
    return { demoTotal: Number(r.total), demoActive: Number(r.active), realActive: Number(r.real_active) };
  }

  /** Archive tous les produits de démonstration (réversible) et coupe les diapositives qui y sont liées. */
  async hideDemo(actor: string) {
    await this.db.transaction(async (t) => {
      await t.query("UPDATE products SET status = 'archived', updated_at = now() WHERE is_demo");
      await t.query('UPDATE hero_slides SET active = FALSE WHERE product_id IN (SELECT id FROM products WHERE is_demo)');
    });
    await this.audit(actor, 'demo.hide', 'platform', 'demo');
  }

  async restoreDemo(actor: string) {
    await this.db.query("UPDATE products SET status = 'active', updated_at = now() WHERE is_demo");
    await this.audit(actor, 'demo.restore', 'platform', 'demo');
  }

  // ---------- Retraits des vendeurs ----------
  async withdrawals(status?: string) {
    const rows = await this.db.query<{ id: string; amount_usd: string; method: string; provider: string; account_name: string; account_number: string; status: string; reference: string | null; reason: string | null; created_at: Date; decided_at: Date | null; shop: string; owner: string | null }>(
      `SELECT w.*, s.name AS shop, COALESCE(u.email, u.phone) AS owner FROM withdrawals w JOIN shops s ON s.id = w.shop_id LEFT JOIN users u ON u.id = s.owner_id
        WHERE ($1::text IS NULL OR w.status = $1) ORDER BY (w.status = 'pending') DESC, w.created_at DESC LIMIT 200`, [status ?? null]);
    return rows.map((r) => ({ id: r.id, shop: r.shop, owner: r.owner, amountUsd: Number(r.amount_usd), method: r.method, provider: r.provider, accountName: r.account_name, accountNumber: r.account_number, status: r.status, reference: r.reference, reason: r.reason, createdAt: r.created_at, decidedAt: r.decided_at }));
  }

  /** Valide (le paiement a été fait hors plateforme, référence facultative) ou refuse (motif obligatoire) une demande en attente. */
  async decideWithdrawal(actor: string, id: string, b: { approve: boolean; reference?: string; reason?: string }) {
    if (!b.approve && !b.reason?.trim()) throw new AppError(400, 'validation_error', 'Indiquez le motif du refus.');
    const r = await this.db.query(
      "UPDATE withdrawals SET status = $2, reference = $3, reason = $4, decided_at = now(), decided_by = $5 WHERE id = $1 AND status = 'pending' RETURNING id",
      [id, b.approve ? 'paid' : 'rejected', b.approve ? (b.reference?.trim() || null) : null, b.approve ? null : b.reason!.trim(), actor]);
    if (!r[0]) throw new AppError(404, 'not_found', 'Demande introuvable ou déjà traitée.');
    await this.audit(actor, b.approve ? 'withdrawal.pay' : 'withdrawal.reject', 'withdrawal', id, b);
    await this.notify?.withdrawalDecision(id);
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
    await this.notify?.orderStatus(o.id, status);
    await this.audit(actor, 'order.status', 'order', number, { status });
  }

  // ---------- Plans ----------
  async plans() {
    return (await this.db.query<PlanRow>('SELECT * FROM plans ORDER BY sort, price_usd')).map(planDto);
  }

  async savePlan(actor: string, code: string, b: { name: string; priceUsd: number; commissionBps: number; maxProducts: number | null; features: string[]; sort: number; active: boolean; certified: boolean; heroEligible: boolean }) {
    await this.db.query(
      `INSERT INTO plans(code,name,price_usd,commission_bps,max_products,features,sort,active,certified,hero_eligible) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, price_usd=EXCLUDED.price_usd, commission_bps=EXCLUDED.commission_bps, max_products=EXCLUDED.max_products, features=EXCLUDED.features, sort=EXCLUDED.sort, active=EXCLUDED.active, certified=EXCLUDED.certified, hero_eligible=EXCLUDED.hero_eligible`,
      [code, b.name, b.priceUsd, b.commissionBps, b.maxProducts, b.features, b.sort, code === 'free' ? true : b.active, code === 'free' ? false : b.certified, code === 'free' ? false : b.heroEligible]);
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
    await this.notify?.planDecision(r.shop_id, approve);
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

  // ---------- Notifications ----------
  async notifications() {
    const rows = await this.db.query<{ id: string; kind: string; title: string; body: string | null; ref: string | null; read: boolean; created_at: Date }>('SELECT id, kind, title, body, ref, read, created_at FROM notifications ORDER BY id DESC LIMIT 30');
    const unread = Number((await this.db.query<{ n: string }>('SELECT count(*) AS n FROM notifications WHERE read = false'))[0]?.n ?? 0);
    return { unread, notifications: rows.map((n) => ({ id: Number(n.id), kind: n.kind, title: n.title, body: n.body, ref: n.ref, read: n.read, createdAt: n.created_at })) };
  }

  async readNotifications() { await this.db.query('UPDATE notifications SET read = true WHERE read = false'); }

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

interface HeroRow {
  id: string; product_id: string | null; tag: string; title: string; text: string; image_url: string; price_usd: string | null; link: string | null; position: number; active: boolean; placement: string;
  starts_at: Date | null; ends_at: Date | null; p_name: string | null; p_price: string | null; p_status: string | null; p_image: string | null;
  shop_name: string | null; shop_status: string | null; shop_official: boolean | null; plan_name: string | null; plan_eligible: boolean | null;
}
export interface HeroInput { productId?: number | null; tag?: string; title?: string; text?: string; image?: string; priceUsd?: number | null; link?: string | null; active?: boolean; startsAt?: string | null; endsAt?: string | null; placement?: 'hero' | 'home' }
