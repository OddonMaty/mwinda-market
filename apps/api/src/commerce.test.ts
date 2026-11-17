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

async function call(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, opts: { body?: unknown; cookie?: string } = {}) {
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

const SHIP = { shippingPhone: '+243907261113', shippingCity: 'Bukavu', shippingAddress: 'Avenue du Lac, Nyawera' };
const PRODUCT = { name: 'Casque test', description: 'Un casque.', priceUsd: 40, department: 'electronique', category: 'Audio', colors: ['Noir'], sizes: [], inStock: true, images: ['https://example.com/a.jpg'] };

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
    await call('POST', '/seller/shop', { cookie: c, body: { name: 'Boutique Vitrine' } });
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
    const shop = await call('POST', '/seller/shop', { cookie: c, body: { name: 'TechPlus Bukavu', citySlug: 'bukavu' } });
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
    await call('POST', '/seller/shop', { cookie: a, body: { name: 'Boutique A' } });
    await call('POST', '/seller/shop', { cookie: b, body: { name: 'Boutique B' } });
    const id = (await call('POST', '/seller/products', { cookie: a, body: PRODUCT })).json.id as number;
    assert.equal((await call('PUT', `/seller/products/${id}`, { cookie: b, body: PRODUCT })).status, 404);
    assert.equal((await call('DELETE', `/seller/products/${id}`, { cookie: b })).status, 404);
  });

  it('vendeur : voit uniquement les lignes de commande de sa boutique', async () => {
    const seller = await user();
    const buyer = await user();
    await call('POST', '/seller/shop', { cookie: seller, body: { name: 'Boutique Vente' } });
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
    await call('POST', '/seller/shop', { cookie: seller, body: { name: 'Boutique Archive' } });
    const id = (await call('POST', '/seller/products', { cookie: seller, body: PRODUCT })).json.id as number;
    await call('DELETE', `/seller/products/${id}`, { cookie: seller });
    assert.equal((await call('POST', '/orders', { cookie: buyer, body: { items: [{ id, quantity: 1 }], ...SHIP } })).status, 400);
  });
});
