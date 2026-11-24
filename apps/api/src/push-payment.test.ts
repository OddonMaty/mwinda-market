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
import { MemoryPush } from './services/push.js';

const ORIGIN = 'http://localhost:3000';
const PWD = 'Un-bon-mot-de-passe-42';
let app: FastifyInstance; let db: Db; let seq = 0;
const push = new MemoryPush();

async function call(method: 'GET' | 'POST' | 'PATCH', url: string, opts: { body?: unknown; cookie?: string } = {}) {
  const headers: Record<string, string> = {};
  if (opts.cookie) headers.cookie = opts.cookie;
  if (method !== 'GET') headers.origin = ORIGIN;
  const res = await app.inject({ method, url: `/v1${url}`, headers, payload: opts.body as object | undefined, remoteAddress: `10.5.0.${(seq % 250) + 1}` });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test
  return { status: res.statusCode, json: (res.body ? JSON.parse(res.body) : {}) as Record<string, any>, cookies: res.cookies };
}
async function user() {
  const email = `pp${++seq}@example.com`;
  await call('POST', '/auth/register', { body: { email, password: PWD, firstName: 'Ada', lastName: 'L', phone: '+243907261113', countryCode: 'CD' } });
  const r = await call('POST', '/auth/login', { body: { identifier: email, password: PWD, client: 'web' } });
  const cookie = `stm_session=${r.cookies.find((c) => c.name === 'stm_session')!.value}`;
  return { email, cookie, id: (await call('GET', '/auth/me', { cookie })).json.user.id as string };
}

describe('Notifications push et paiement', () => {
  before(async () => {
    db = createPgliteDb(new PGlite());
    await migrate(db, fileURLToPath(new URL('../migrations', import.meta.url)));
    app = await buildApp({ NODE_ENV: 'test', PORT: 4005, HOST: '127.0.0.1', WEB_ORIGIN: ORIGIN, DATABASE_URL: 'unused', API_SECRET: 'test_secret_must_be_at_least_16_chars', MAIL_FROM: 'test@x' },
      { db, mailer: new MemoryMailer(), limiter: new MemoryRateLimiter(() => Date.now()), push });
  });
  after(async () => { await app.close(); await db.close(); });

  it('clé publique, abonnement, désabonnement', async () => {
    assert.equal((await call('GET', '/push/key')).json.publicKey, 'test-public-key');
    const u = await user();
    const sub = { endpoint: 'https://push.example/abc', keys: { p256dh: 'k1', auth: 'a1' } };
    assert.equal((await call('POST', '/push/subscribe', { body: sub })).status, 401);
    assert.equal((await call('POST', '/push/subscribe', { cookie: u.cookie, body: sub })).status, 200);
    assert.equal((await call('POST', '/push/subscribe', { cookie: u.cookie, body: sub })).status, 200); // idempotent
    assert.equal((await db.query('SELECT 1 FROM push_subscriptions WHERE user_id = $1', [u.id])).length, 1);
    assert.equal((await call('POST', '/push/unsubscribe', { cookie: u.cookie, body: { endpoint: sub.endpoint } })).status, 200);
    assert.equal((await db.query('SELECT 1 FROM push_subscriptions WHERE user_id = $1', [u.id])).length, 0);
  });

  it('commande : push au vendeur ; paiement Mobile Money exige opérateur et numéro ; confirmation : push à l’acheteur', async () => {
    const seller = await user();
    await call('POST', '/seller/shop', { cookie: seller.cookie, body: { name: `Boutique Push ${seq}` } });
    const shop = (await call('GET', '/seller/shop', { cookie: seller.cookie })).json.shop;
    assert.equal(shop.status, 'pending');
    // boutique en attente : aucun produit publiable
    const P = { name: 'Radio', description: 'Une radio.', priceUsd: 25, department: 'electronique', category: 'Audio', colors: [], sizes: [], inStock: true, images: [] };
    assert.equal((await call('POST', '/seller/products', { cookie: seller.cookie, body: P })).status, 403);
    await db.query("UPDATE shops SET status = 'active' WHERE id = $1", [shop.id]);
    const pid = (await call('POST', '/seller/products', { cookie: seller.cookie, body: P })).json.id as number;
    const buyer = await user();
    const ship = { items: [{ id: pid, quantity: 1 }], shippingPhone: '+243907261113', shippingCity: 'Bukavu', shippingAddress: 'Avenue du Lac' };
    assert.equal((await call('POST', '/orders', { cookie: buyer.cookie, body: { ...ship, paymentMethod: 'mobile_money' } })).status, 400);
    const ok = await call('POST', '/orders', { cookie: buyer.cookie, body: { ...ship, paymentMethod: 'mobile_money', paymentProvider: 'M-Pesa', paymentPhone: '+243812345678' } });
    assert.equal(ok.status, 201, JSON.stringify(ok.json));
    const toSeller = push.sent.filter((p) => p.userId === seller.id);
    assert.equal(toSeller.length, 1);
    assert.match(toSeller[0]!.payload.title, /Nouvelle commande/);
    const sellerOrders = (await call('GET', '/seller/orders', { cookie: seller.cookie })).json.orders;
    assert.match(sellerOrders[0].payment, /M-Pesa/);
    assert.match((await call('GET', '/orders', { cookie: buyer.cookie })).json.orders[0].payment, /Mobile Money/);
    await call('POST', `/seller/orders/${ok.json.order.number}/confirm`, { cookie: seller.cookie });
    assert.equal(push.sent.filter((p) => p.userId === buyer.id).length, 1);
    // paiement à la livraison par défaut
    const cod = await call('POST', '/orders', { cookie: buyer.cookie, body: ship });
    assert.equal(cod.status, 201, JSON.stringify(cod.json));
    assert.equal((await call('GET', '/orders', { cookie: buyer.cookie })).json.orders[0].payment, 'Paiement à la livraison');
  });

  it('message : le vendeur reçoit un push de l’acheteur, et inversement', async () => {
    const seller = await user();
    await call('POST', '/seller/shop', { cookie: seller.cookie, body: { name: `Boutique Msg ${seq}` } });
    const shop = (await call('GET', '/seller/shop', { cookie: seller.cookie })).json.shop;
    await db.query("UPDATE shops SET status = 'active' WHERE id = $1", [shop.id]);
    const pid = (await call('POST', '/seller/products', { cookie: seller.cookie, body: { name: 'Lampe', description: 'Une lampe.', priceUsd: 9, department: 'electronique', category: 'Audio', colors: [], sizes: [], inStock: true, images: [] } })).json.id as number;
    const buyer = await user();
    const c = await call('POST', '/conversations', { cookie: buyer.cookie, body: { productId: pid, message: 'Bonjour, est-elle disponible ?' } });
    assert.equal(c.status, 201, JSON.stringify(c.json));
    const got = push.sent.filter((p) => p.userId === seller.id && /Nouveau message/.test(p.payload.title));
    assert.equal(got.length, 1);
    assert.match(got[0]!.payload.body, /disponible/);
    await call('POST', `/conversations/${c.json.id}/messages`, { cookie: seller.cookie, body: { message: 'Oui, en stock.' } });
    assert.equal(push.sent.filter((p) => p.userId === buyer.id && /Message de/.test(p.payload.title)).length, 1);
  });
});
