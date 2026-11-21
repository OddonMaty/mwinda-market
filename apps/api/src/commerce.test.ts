import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';
import { createPgliteDb, type Db } from './db/client.js';
import { migrate } from './db/migrate.js';
import { MemoryMailer } from './mail/mailer.js';
import { MemoryRateLimiter } from './lib/ratelimit.js';

const ORIGIN = 'http://localhost:3000';
const PWD = 'Un-bon-mot-de-passe-42';
let app: FastifyInstance;
let db: Db;
let seq = 0;
let ipSeq = 0;

async function call(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, opts: { body?: unknown; cookie?: string } = {}) {
  const headers: Record<string, string> = {};
  if (opts.cookie) headers.cookie = opts.cookie;
  if (method !== 'GET') headers.origin = ORIGIN;
  const res = await app.inject({ method, url: `/v1${url}`, headers, payload: opts.body as object | undefined, remoteAddress: `10.1.0.${(ipSeq % 250) + 1}` });
  const sc = res.cookies.find((c) => c.name === 'stm_session');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test : réponses JSON consultées librement
  return { status: res.statusCode, json: (res.body ? JSON.parse(res.body) : {}) as Record<string, any>, cookie: sc ? `stm_session=${sc.value}` : undefined };
}

/** Crée un compte et renvoie son cookie de session. */
async function user(): Promise<string> {
  ipSeq++;
  const email = `shop${++seq}@example.com`;
  await call('POST', '/auth/register', { body: { email, password: PWD, firstName: 'Ada', lastName: 'Lovelace', phone: '+243907261113', countryCode: 'CD', citySlug: 'bukavu' } });
  const r = await call('POST', '/auth/login', { body: { email, password: PWD, client: 'web' } });
  assert.ok(r.cookie);
  return r.cookie;
}

/** Ouvre une boutique puis la valide comme le ferait l'administrateur (une nouvelle boutique est « en attente »). */
async function openShop(opts: { cookie: string; body: unknown }) {
  const r = await call('POST', '/seller/shop', opts);
  await db.query("UPDATE shops SET status = 'active' WHERE status = 'pending'");
  return r;
}

const SHIP = { shippingPhone: '+243907261113', shippingCity: 'Bukavu', shippingAddress: 'Avenue du Lac, Nyawera' };
const PRODUCT = { name: 'Casque test', description: 'Un casque.', priceUsd: 40, department: 'electronique', category: 'Audio', colors: ['Noir'], sizes: [], inStock: true, images: ['https://example.com/a.jpg'] };

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const png = (extra = 0) => Buffer.concat([PNG, Buffer.alloc(extra)]).toString('base64');

describe('Boutiques, produits, commandes', () => {
  before(async () => {
    db = createPgliteDb(new PGlite());
    await migrate(db, fileURLToPath(new URL('../migrations', import.meta.url)));
    const clock = () => Date.now();
    app = await buildApp(
      { NODE_ENV: 'test', PORT: 4001, HOST: '127.0.0.1', WEB_ORIGIN: ORIGIN, DATABASE_URL: 'unused', API_SECRET: 'test_secret_must_be_at_least_16_chars', MAIL_FROM: 'test@x' },
      { db, mailer: new MemoryMailer(), limiter: new MemoryRateLimiter(clock) },
    );
  });
  after(async () => { await app.close(); await db.close(); });

  it('le catalogue de départ est en base (boutique officielle)', async () => {
    const r = await db.query<{ n: string }>("SELECT count(*) AS n FROM products WHERE shop_id = (SELECT id FROM shops WHERE is_official)");
    assert.equal(Number(r[0]?.n), 19);
  });

  it('catalogue public : sans connexion, produits actifs seulement, notes conservées', async () => {
    const all = (await call('GET', '/products')).json.products;
    assert.equal(all.length, 19);
    const p1 = all.find((p: { id: number }) => p.id === 1);
    assert.equal(p1.rating, 4.5);
    assert.equal(p1.priceUsd, 650);
    assert.equal((await call('GET', '/products/1')).json.product.name, 'Vinova SmartPhone Pro 12');
    assert.equal((await call('GET', '/products/999999')).status, 404);
  });

  it('catalogue public : un produit vendeur apparaît puis disparaît une fois archivé', async () => {
    const c = await user();
    await openShop({ cookie: c, body: { name: 'Boutique Vitrine' } });
    const id = (await call('POST', '/seller/products', { cookie: c, body: PRODUCT })).json.id as number;
    const shown = (await call('GET', '/products')).json.products.find((p: { id: number }) => p.id === id);
    assert.equal(shown.rating, 0);
    assert.equal(shown.images[0], 'https://example.com/a.jpg');
    await call('DELETE', `/seller/products/${id}`, { cookie: c });
    assert.equal((await call('GET', `/products/${id}`)).status, 404);
  });

  it('commande : refusée sans connexion', async () => {
    assert.equal((await call('POST', '/orders', { body: { items: [{ id: 1, quantity: 1 }], ...SHIP } })).status, 401);
  });

  it('commande : le prix vient de la base, jamais du navigateur', async () => {
    const c = await user();
    const r = await call('POST', '/orders', { cookie: c, body: { items: [{ id: 1, quantity: 2, price: 0.01 }], ...SHIP } });
    assert.equal(r.status, 201);
    assert.equal(r.json.order.subtotalUsd, 1300); // 2 × 650 $
    assert.match(r.json.order.number, /^STM-\d+$/);
    const list = await call('GET', '/orders', { cookie: c });
    assert.equal(list.json.orders.length, 1);
    assert.equal(list.json.orders[0].items[0].unitPriceUsd, 650);
  });

  it('commande : produit inconnu, panier vide et quantité folle refusés', async () => {
    const c = await user();
    assert.equal((await call('POST', '/orders', { cookie: c, body: { items: [{ id: 999999, quantity: 1 }], ...SHIP } })).status, 400);
    assert.equal((await call('POST', '/orders', { cookie: c, body: { items: [], ...SHIP } })).status, 400);
    assert.equal((await call('POST', '/orders', { cookie: c, body: { items: [{ id: 1, quantity: 1000 }], ...SHIP } })).status, 400);
    assert.equal((await call('POST', '/orders', { cookie: c, body: { items: [{ id: 1, quantity: 1 }], ...SHIP, shippingPhone: 'abc' } })).status, 400);
  });

  it('commande : chacun ne voit que ses commandes', async () => {
    const a = await user();
    const b = await user();
    await call('POST', '/orders', { cookie: a, body: { items: [{ id: 2, quantity: 1 }], ...SHIP } });
    assert.equal((await call('GET', '/orders', { cookie: b })).json.orders.length, 0);
  });

  it('adresses : ajout, première par défaut, suppression limitée à son propriétaire', async () => {
    const a = await user();
    const b = await user();
    assert.equal((await call('POST', '/me/addresses', { cookie: a, body: { city: 'Goma', address: 'Quartier Himbi', phone: '+243907261113' } })).status, 200);
    const list = (await call('GET', '/me/addresses', { cookie: a })).json.addresses;
    assert.equal(list.length, 1);
    assert.equal(list[0].isDefault, true);
    assert.equal((await call('DELETE', `/me/addresses/${list[0].id}`, { cookie: b })).status, 404);
    assert.equal((await call('DELETE', `/me/addresses/${list[0].id}`, { cookie: a })).status, 200);
  });

  it('vendeur : une seule boutique, produits avec 5 photos maximum, https obligatoire', async () => {
    const c = await user();
    assert.equal((await call('GET', '/seller/products', { cookie: c })).status, 403); // pas encore de boutique
    const shop = await openShop({ cookie: c, body: { name: 'TechPlus Bukavu', citySlug: 'bukavu' } });
    assert.equal(shop.status, 201);
    assert.equal(shop.json.shop.slug, 'techplus-bukavu');
    assert.equal((await call('POST', '/seller/shop', { cookie: c, body: { name: 'Autre' } })).status, 409);

    const six = Array.from({ length: 6 }, (_, i) => `https://example.com/${i}.jpg`);
    assert.equal((await call('POST', '/seller/products', { cookie: c, body: { ...PRODUCT, images: six } })).status, 400);
    assert.equal((await call('POST', '/seller/products', { cookie: c, body: { ...PRODUCT, images: ['http://example.com/a.jpg'] } })).status, 400);
    assert.equal((await call('POST', '/seller/products', { cookie: c, body: { ...PRODUCT, originalPriceUsd: 10 } })).status, 400);

    const created = await call('POST', '/seller/products', { cookie: c, body: PRODUCT });
    assert.equal(created.status, 201);
    const id = created.json.id as number;
    assert.ok(id >= 1000);
    assert.equal((await call('PUT', `/seller/products/${id}`, { cookie: c, body: { ...PRODUCT, priceUsd: 35, images: six.slice(0, 5) } })).status, 200);
    const mine = (await call('GET', '/seller/products', { cookie: c })).json.products;
    assert.equal(mine.length, 1);
    assert.equal(mine[0].priceUsd, 35);
    assert.equal(mine[0].images.length, 5);
    assert.equal((await call('DELETE', `/seller/products/${id}`, { cookie: c })).status, 200);
    assert.equal((await call('GET', '/seller/products', { cookie: c })).json.products.length, 0);
  });

  it('vendeur : ne peut ni modifier ni archiver le produit d\'un autre', async () => {
    const a = await user();
    const b = await user();
    await openShop({ cookie: a, body: { name: 'Boutique A' } });
    await openShop({ cookie: b, body: { name: 'Boutique B' } });
    const id = (await call('POST', '/seller/products', { cookie: a, body: PRODUCT })).json.id as number;
    assert.equal((await call('PUT', `/seller/products/${id}`, { cookie: b, body: PRODUCT })).status, 404);
    assert.equal((await call('DELETE', `/seller/products/${id}`, { cookie: b })).status, 404);
  });

  it('vendeur : voit uniquement les lignes de commande de sa boutique', async () => {
    const seller = await user();
    const buyer = await user();
    await openShop({ cookie: seller, body: { name: 'Boutique Vente' } });
    const id = (await call('POST', '/seller/products', { cookie: seller, body: PRODUCT })).json.id as number;
    const order = await call('POST', '/orders', { cookie: buyer, body: { items: [{ id, quantity: 3 }, { id: 1, quantity: 1 }], ...SHIP } });
    assert.equal(order.status, 201);
    assert.equal(order.json.order.subtotalUsd, 770); // 3 × 40 + 650
    const sales = (await call('GET', '/seller/orders', { cookie: seller })).json.orders;
    assert.equal(sales.length, 1);
    assert.equal(sales[0].items.length, 1);
    assert.equal(sales[0].totalUsd, 120); // pas les 650 $ de la boutique officielle
  });

  it('produit archivé : plus commandable', async () => {
    const seller = await user();
    const buyer = await user();
    await openShop({ cookie: seller, body: { name: 'Boutique Archive' } });
    const id = (await call('POST', '/seller/products', { cookie: seller, body: PRODUCT })).json.id as number;
    await call('DELETE', `/seller/products/${id}`, { cookie: seller });
    assert.equal((await call('POST', '/orders', { cookie: buyer, body: { items: [{ id, quantity: 1 }], ...SHIP } })).status, 400);
  });

  it('photos : envoi depuis le téléphone, lecture publique, formats et taille contrôlés', async () => {
    const c = await user();
    assert.equal((await call('POST', '/seller/images', { cookie: c, body: { data: png() } })).status, 403); // pas de boutique
    await openShop({ cookie: c, body: { name: 'Boutique Photos' } });
    const up = await call('POST', '/seller/images', { cookie: c, body: { data: png() } });
    assert.equal(up.status, 201);
    assert.match(up.json.url, /^\/api\/v1\/images\/[0-9A-Z]{26}$/);
    const res = await app.inject({ method: 'GET', url: up.json.url.replace('/api', '') }); // lecture sans connexion
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['content-type'], 'image/png');
    assert.match(String(res.headers['cache-control']), /immutable/);
    assert.deepEqual(res.rawPayload, PNG);
    assert.equal((await call('POST', '/seller/images', { cookie: c, body: { data: Buffer.from('<script>alert(1)</script> pas une image').toString('base64') } })).status, 415);
    assert.equal((await call('POST', '/seller/images', { cookie: c, body: { data: png(1_550_000) } })).status, 413);
    assert.equal((await call('POST', '/seller/images', { body: { data: png() } })).status, 401);
  });

  it('photos : produit avec photos envoyées ; celles d\'une autre boutique sont refusées', async () => {
    const a = await user();
    const b = await user();
    await openShop({ cookie: a, body: { name: 'Boutique Alpha' } });
    await openShop({ cookie: b, body: { name: 'Boutique Beta' } });
    const mine = (await call('POST', '/seller/images', { cookie: a, body: { data: png() } })).json.url as string;
    const created = await call('POST', '/seller/products', { cookie: a, body: { ...PRODUCT, images: [mine, 'https://example.com/b.jpg'] } });
    assert.equal(created.status, 201);
    const shown = (await call('GET', `/products/${created.json.id}`)).json.product;
    assert.deepEqual(shown.images, [mine, 'https://example.com/b.jpg']);
    assert.equal((await call('POST', '/seller/products', { cookie: b, body: { ...PRODUCT, images: [mine] } })).status, 400);
    assert.equal((await call('POST', '/seller/products', { cookie: a, body: { ...PRODUCT, images: ['/api/v1/images/01ZZZZZZZZZZZZZZZZZZZZZZZZ'] } })).status, 400);
  });

  // ---------- Plateforme panafricaine, plans, suivi, administration ----------
  async function admin(): Promise<{ cookie: string; id: string }> {
    const c = await user();
    const id = (await call('GET', '/auth/me', { cookie: c })).json.user.id as string;
    await db.query("INSERT INTO admin_roles(user_id, role) VALUES ($1, 'superadmin')", [id]);
    return { cookie: c, id };
  }

  it('pays : liste publique panafricaine avec villes', async () => {
    const list = (await call('GET', '/countries')).json.countries as { code: string; cities: { slug: string }[] }[];
    assert.ok(list.length >= 54);
    assert.ok(list.find((c) => c.code === 'CD')!.cities.some((c) => c.slug === 'kinshasa'));
    assert.ok(list.find((c) => c.code === 'KE')!.cities.some((c) => c.slug === 'nairobi'));
  });

  it('boutique : le vendeur choisit son pays et sa ville', async () => {
    const c = await user();
    const shop = (await openShop({ cookie: c, body: { name: 'Nairobi Tech', countryCode: 'KE', citySlug: 'nairobi' } })).json.shop;
    assert.equal(shop.countryCode, 'KE');
    assert.equal(shop.city, 'Nairobi');
    const bad = await openShop({ cookie: await user(), body: { name: 'Pays inconnu', countryCode: 'FR' } });
    assert.equal(bad.status, 400);
  });

  it('plans : 4 plans publics, le dernier à 45 $ par trimestre et 2 %', async () => {
    const plans = (await call('GET', '/plans')).json.plans as { code: string; priceUsd: number; commissionBps: number }[];
    assert.deepEqual(plans.map((p) => p.code), ['free', 'essentiel', 'pro', 'premium']);
    assert.equal(plans[0]!.commissionBps, 500);
    assert.deepEqual([plans[3]!.priceUsd, plans[3]!.commissionBps], [45, 200]);
  });

  it('plan gratuit : limite de produits et demande de plan payant validée par l\'administration', async () => {
    const c = await user();
    await openShop({ cookie: c, body: { name: 'Limite Shop' } });
    for (let i = 0; i < 10; i++) assert.equal((await call('POST', '/seller/products', { cookie: c, body: { ...PRODUCT, name: `P${i}` } })).status, 201);
    const over = await call('POST', '/seller/products', { cookie: c, body: PRODUCT });
    assert.equal(over.status, 403);
    assert.equal(over.json.error.code, 'plan_limit');
    assert.equal((await call('POST', '/seller/plan', { cookie: c, body: { plan: 'premium' } })).json.applied, false);
    assert.equal((await call('GET', '/seller/shop', { cookie: c })).json.shop.pendingPlan, 'premium');
    assert.equal((await call('GET', '/admin/plan-requests', { cookie: c })).status, 403); // un vendeur n'est pas admin
    const a = await admin();
    const req = (await call('GET', '/admin/plan-requests', { cookie: a.cookie })).json.requests.find((r: { shop: string }) => r.shop === 'Limite Shop');
    assert.equal((await call('POST', `/admin/plan-requests/${req.id}/approve`, { cookie: a.cookie })).status, 200);
    const shop = (await call('GET', '/seller/shop', { cookie: c })).json.shop;
    assert.deepEqual([shop.plan, shop.commissionBps, shop.maxProducts], ['premium', 200, null]);
    assert.equal((await call('POST', '/seller/products', { cookie: c, body: PRODUCT })).status, 201);
  });

  it('certification : seulement pour le plan Premium actif (et la boutique officielle)', async () => {
    const c = await user();
    await openShop({ cookie: c, body: { name: 'Certif Shop' } });
    const made = await call('POST', '/seller/products', { cookie: c, body: { ...PRODUCT, name: 'Produit certifie' } });
    const id = made.json.id as number;
    const flag = async () => (await call('GET', `/products/${id}`)).json.product.certified;
    assert.equal(await flag(), false);
    await db.query("UPDATE shops SET plan = 'pro', plan_expires_at = now() + interval '3 months' WHERE name = 'Certif Shop'");
    assert.equal(await flag(), false); // Pro : pas de certification
    await db.query("UPDATE shops SET plan = 'premium' WHERE name = 'Certif Shop'");
    assert.equal(await flag(), true);
    assert.equal((await call('GET', '/seller/shop', { cookie: c })).json.shop.certified, true);
    await db.query("UPDATE shops SET plan_expires_at = now() - interval '1 day' WHERE name = 'Certif Shop'");
    assert.equal(await flag(), false); // abonnement expiré : certification retirée
  });

  it('plan payant expiré : retour au plan gratuit', async () => {
    const c = await user();
    await openShop({ cookie: c, body: { name: 'Expire Shop' } });
    await db.query("UPDATE shops SET plan = 'pro', plan_expires_at = now() - interval '1 day' WHERE name = 'Expire Shop'");
    const shop = (await call('GET', '/seller/shop', { cookie: c })).json.shop;
    assert.deepEqual([shop.plan, shop.commissionBps], ['free', 500]);
  });

  it('commande : commission figée selon le plan, suivi vendeur puis réception acheteur', async () => {
    const seller = await user();
    await openShop({ cookie: seller, body: { name: 'Suivi Shop' } });
    await db.query("UPDATE shops SET plan = 'premium', plan_expires_at = now() + interval '3 months' WHERE name = 'Suivi Shop'");
    const pid = (await call('POST', '/seller/products', { cookie: seller, body: { ...PRODUCT, priceUsd: 100 } })).json.id as number;
    const buyer = await user();
    const num = (await call('POST', '/orders', { cookie: buyer, body: { items: [{ id: pid, quantity: 2 }], ...SHIP } })).json.order.number as string;
    const so = (await call('GET', '/seller/orders', { cookie: seller })).json.orders.find((o: { number: string }) => o.number === num);
    assert.deepEqual([so.totalUsd, so.commissionUsd, so.netUsd], [200, 4, 196]);
    assert.equal((await call('POST', `/seller/orders/${num}/ship`, { cookie: seller })).status, 409); // pas avant confirmation
    assert.equal((await call('POST', `/seller/orders/${num}/confirm`, { cookie: seller })).json.status, 'confirmed');
    assert.equal((await call('POST', `/orders/${num}/cancel`, { cookie: buyer })).status, 409); // confirmée : plus annulable par l'acheteur
    assert.equal((await call('POST', `/seller/orders/${num}/ship`, { cookie: seller })).json.status, 'shipped');
    assert.equal((await call('POST', `/orders/${num}/receive`, { cookie: await user() })).status, 404); // pas sa commande
    assert.equal((await call('POST', `/orders/${num}/receive`, { cookie: buyer })).json.status, 'delivered');
    const stats = (await call('GET', '/seller/stats', { cookie: seller })).json.stats;
    assert.deepEqual([stats.salesUsd, stats.commissionUsd, stats.netUsd], [200, 4, 196]);
    const mine = (await call('GET', '/orders', { cookie: buyer })).json.orders.find((o: { number: string }) => o.number === num);
    assert.equal(mine.status, 'delivered');
  });

  it('commande : l\'acheteur annule tant que le vendeur n\'a pas confirmé', async () => {
    const seller = await user();
    await openShop({ cookie: seller, body: { name: 'Annul Shop' } });
    const pid = (await call('POST', '/seller/products', { cookie: seller, body: PRODUCT })).json.id as number;
    const buyer = await user();
    const num = (await call('POST', '/orders', { cookie: buyer, body: { items: [{ id: pid, quantity: 1 }], ...SHIP } })).json.order.number as string;
    assert.equal((await call('POST', `/orders/${num}/cancel`, { cookie: buyer })).json.status, 'cancelled');
    assert.equal((await call('POST', `/seller/orders/${num}/confirm`, { cookie: seller })).status, 409);
  });

  it('administration : accès refusé aux non-admins, statistiques, suspension, pages légales', async () => {
    const plain = await user();
    for (const u of ['/admin/stats', '/admin/users', '/admin/shops', '/admin/pages']) assert.equal((await call('GET', u, { cookie: plain })).status, 403, u);
    assert.equal((await call('GET', '/admin/stats')).status, 401);
    const a = await admin();
    const stats = (await call('GET', '/admin/stats', { cookie: a.cookie })).json.stats;
    assert.ok(stats.users >= 2 && stats.products >= 19);
    const victim = await user();
    const vid = (await call('GET', '/auth/me', { cookie: victim })).json.user.id as string;
    assert.equal((await call('PATCH', `/admin/users/${vid}`, { cookie: a.cookie, body: { status: 'suspended' } })).status, 200);
    assert.equal((await call('GET', '/auth/me', { cookie: victim })).status, 401);
    assert.equal((await call('PATCH', `/admin/users/${a.id}`, { cookie: a.cookie, body: { status: 'suspended' } })).status, 400);
    assert.match((await call('GET', '/pages/conditions')).json.page.title, /Conditions générales/);
    assert.equal((await call('PUT', '/admin/pages/conditions', { cookie: a.cookie, body: { title: 'Conditions', body: 'Texte.' } })).status, 200);
    assert.equal((await call('GET', '/pages/conditions')).json.page.title, 'Conditions');
    assert.equal((await call('PUT', '/admin/pages/nimporte', { cookie: a.cookie, body: { title: 'x', body: 'y' } })).status, 400);
    assert.equal((await call('PUT', '/admin/plans/premium', { cookie: a.cookie, body: { name: 'Premium', priceUsd: 50, commissionBps: 200, maxProducts: null, features: [], sort: 3, active: true } })).status, 200);
    assert.equal((await call('GET', '/plans')).json.plans.find((p: { code: string }) => p.code === 'premium').priceUsd, 50);
    assert.equal((await call('POST', '/admin/cities', { cookie: a.cookie, body: { countryCode: 'CD', name: 'Kindu' } })).status, 200);
    assert.equal((await call('PATCH', '/admin/countries/KE', { cookie: a.cookie, body: { active: false } })).status, 200);
    assert.equal((await call('POST', '/seller/shop', { cookie: await user(), body: { name: 'Hors service', countryCode: 'KE' } })).status, 400);
  });
});

describe('Validation des boutiques, messagerie, recherche, taux', () => {
  let adminCookie = '';
  let mailer: MemoryMailer;
  before(async () => {
    db = createPgliteDb(new PGlite());
    await migrate(db, fileURLToPath(new URL('../migrations', import.meta.url)));
    const clock = () => Date.now();
    app = await buildApp(
      { NODE_ENV: 'test', PORT: 4002, HOST: '127.0.0.1', WEB_ORIGIN: ORIGIN, DATABASE_URL: 'unused', API_SECRET: 'test_secret_must_be_at_least_16_chars', MAIL_FROM: 'test@x' },
      { db, mailer: (mailer = new MemoryMailer()), limiter: new MemoryRateLimiter(clock) },
    );
    adminCookie = await user();
    await db.query("INSERT INTO admin_roles(user_id, role) SELECT id, 'superadmin' FROM users WHERE email = (SELECT email FROM users ORDER BY created_at DESC LIMIT 1)");
  });
  after(async () => { await app.close(); await db.close(); });

  it('nouvelle boutique : en attente, l’administrateur est notifié, puis accepte ou refuse', async () => {
    const c = await user();
    const shop = await call('POST', '/seller/shop', { cookie: c, body: { name: 'Boutique Neuve' } });
    assert.equal(shop.json.shop.status, 'pending');
    // en attente : impossible de publier
    assert.equal((await call('POST', '/seller/products', { cookie: c, body: PRODUCT })).status, 403);
    const n = await call('GET', '/admin/notifications', { cookie: adminCookie });
    assert.equal(n.status, 200);
    assert.equal(n.json.unread, 1);
    assert.match(n.json.notifications[0].title, /Boutique Neuve/);
    await call('POST', '/admin/notifications/read', { cookie: adminCookie });
    assert.equal((await call('GET', '/admin/notifications', { cookie: adminCookie })).json.unread, 0);
    const id = shop.json.shop.id as string;
    const ownerEmail = (await db.query<{ email: string }>('SELECT u.email FROM shops s JOIN users u ON u.id = s.owner_id WHERE s.id = $1', [id]))[0]!.email;
    assert.equal((await call('PATCH', `/admin/shops/${id}`, { cookie: adminCookie, body: { status: 'rejected', reason: 'Pièce illisible' } })).status, 200);
    const refusedMail = mailer.last(ownerEmail)!;
    assert.match(refusedMail.subject, /pas été acceptée/);
    assert.match(refusedMail.text, /Motif : Pièce illisible/);
    const refused = await call('GET', '/seller/shop', { cookie: c });
    assert.equal(refused.json.shop.status, 'rejected');
    assert.equal(refused.json.shop.rejectReason, 'Pièce illisible');
    await call('PATCH', `/admin/shops/${id}`, { cookie: adminCookie, body: { status: 'active' } });
    const okMail = mailer.last(ownerEmail)!;
    assert.match(okMail.subject, /a été acceptée/);
    assert.match(okMail.text, new RegExp(`${ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/vendeur/tableau`));
    assert.equal((await call('POST', '/seller/products', { cookie: c, body: PRODUCT })).status, 201);
  });

  it('messagerie : l’acheteur écrit au vendeur depuis un produit, le vendeur répond', async () => {
    const seller = await user();
    await openShop({ cookie: seller, body: { name: 'Boutique Chat' } });
    const pid = (await call('POST', '/seller/products', { cookie: seller, body: PRODUCT })).json.id as number;
    const buyer = await user();
    assert.equal((await call('POST', '/conversations', { body: { productId: pid, message: 'Disponible ?' } })).status, 401);
    assert.equal((await call('POST', '/conversations', { cookie: seller, body: { productId: pid, message: 'Moi-même' } })).status, 400);
    const conv = await call('POST', '/conversations', { cookie: buyer, body: { productId: pid, message: 'Est-il disponible ?' } });
    assert.equal(conv.status, 201);
    const cid = conv.json.id as number;
    // une seconde question reprend la même discussion
    assert.equal((await call('POST', '/conversations', { cookie: buyer, body: { productId: pid, message: 'Livrez-vous à Uvira ?' } })).json.id, cid);
    const sellerList = (await call('GET', '/conversations?as=seller', { cookie: seller })).json.conversations;
    assert.equal(sellerList.length, 1);
    assert.equal(sellerList[0].unread, 2);
    const thread = await call('GET', `/conversations/${cid}/messages`, { cookie: seller });
    assert.equal(thread.json.messages.length, 2);
    assert.equal(thread.json.messages[0].productName, 'Casque test');
    assert.equal((await call('GET', '/conversations?as=seller', { cookie: seller })).json.conversations[0].unread, 0);
    await call('POST', `/conversations/${cid}/messages`, { cookie: seller, body: { message: 'Oui, en stock.' } });
    const mine = (await call('GET', `/conversations/${cid}/messages`, { cookie: buyer })).json;
    assert.equal(mine.messages.at(-1).body, 'Oui, en stock.');
    assert.equal(mine.messages.at(-1).mine, false);
    // un tiers ne voit rien
    assert.equal((await call('GET', `/conversations/${cid}/messages`, { cookie: await user() })).status, 404);
  });

  it('recherche : suggestions sur le nom, la catégorie ou la boutique', async () => {
    assert.equal((await call('GET', '/products/suggest?q=c')).status, 400);
    const r = await call('GET', '/products/suggest?q=casque');
    assert.ok(r.json.suggestions.some((s: { name: string }) => s.name === 'Casque test'));
    assert.deepEqual((await call('GET', '/products/suggest?q=zzzzintrouvable')).json.suggestions, []);
  });

  it('taux de change : base dollar, valeurs de secours si la source est injoignable', async () => {
    const r = await call('GET', '/rates');
    assert.equal(r.status, 200);
    assert.equal(r.json.base, 'USD');
    assert.equal(r.json.rates.USD, 1);
    assert.ok(r.json.rates.CDF > 100);
  });
  it('suivi de commande : étapes, position du colis, réception', async () => {
    const seller = await user();
    await call('POST', '/seller/shop', { cookie: seller, body: { name: 'Boutique Suivi', countryCode: 'CD', citySlug: 'goma' } });
    await db.query("UPDATE shops SET status = 'active' WHERE status = 'pending'");
    const pid = (await call('POST', '/seller/products', { cookie: seller, body: PRODUCT })).json.id as number;
    // localisation du produit : ville et pays du vendeur
    const pub = (await call('GET', `/products/${pid}`)).json.product;
    assert.equal(pub.countryCode, 'CD');
    assert.equal(pub.city, 'Goma');
    const buyer = await user();
    const number = (await call('POST', '/orders', { cookie: buyer, body: { items: [{ id: pid, quantity: 1 }], ...SHIP } })).json.order.number as string;
    let t = (await call('GET', `/orders/${number}/tracking`, { cookie: buyer })).json;
    assert.equal(t.status, 'pending');
    assert.equal(t.placed.location, 'Bukavu');
    assert.equal(t.shipments[0].shop, 'Boutique Suivi');
    assert.equal(t.shipments[0].currentLocation, null);
    // un autre client ne voit pas cette commande
    assert.equal((await call('GET', `/orders/${number}/tracking`, { cookie: await user() })).status, 404);
    // position impossible avant la confirmation
    assert.equal((await call('POST', `/seller/orders/${number}/tracking`, { cookie: seller, body: { location: 'Goma' } })).status, 409);
    await call('POST', `/seller/orders/${number}/confirm`, { cookie: seller });
    await call('POST', `/seller/orders/${number}/ship`, { cookie: seller });
    assert.equal((await call('POST', `/seller/orders/${number}/tracking`, { cookie: seller, body: { location: 'Bukavu', note: 'Arrivé au dépôt' } })).status, 200);
    t = (await call('GET', `/orders/${number}/tracking`, { cookie: buyer })).json;
    assert.equal(t.status, 'shipped');
    assert.equal(t.shipments[0].currentLocation, 'Bukavu');
    assert.deepEqual(t.shipments[0].events.map((e: { kind: string }) => e.kind), ['confirmed', 'shipped', 'update']);
    await call('POST', `/orders/${number}/receive`, { cookie: buyer });
    t = (await call('GET', `/orders/${number}/tracking`, { cookie: buyer })).json;
    assert.equal(t.status, 'delivered');
    assert.equal(t.shipments[0].currentLocation, 'Bukavu');
    assert.equal(t.shipments[0].events.at(-1).kind, 'delivered');
  });
});
