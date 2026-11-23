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
import { MemoryMessenger } from './services/messenger.js';

const ORIGIN = 'http://localhost:3000';
const PWD = 'Un-bon-mot-de-passe-42';
let app: FastifyInstance;
let db: Db;
let seq = 0;
const mailer = new MemoryMailer();
const messenger = new MemoryMessenger();

async function call(method: 'GET' | 'POST' | 'PATCH', url: string, opts: { body?: unknown; cookie?: string } = {}) {
  const headers: Record<string, string> = {};
  if (opts.cookie) headers.cookie = opts.cookie;
  if (method !== 'GET') headers.origin = ORIGIN;
  const res = await app.inject({ method, url: `/v1${url}`, headers, payload: opts.body as object | undefined, remoteAddress: `10.4.0.${(seq % 250) + 1}` });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test
  return { status: res.statusCode, json: (res.body ? JSON.parse(res.body) : {}) as Record<string, any>, cookies: res.cookies };
}
const sessionOf = (r: { cookies: { name: string; value: string }[] }) => `stm_session=${r.cookies.find((c) => c.name === 'stm_session')!.value}`;
const phoneN = () => `+24381${String(1000000 + ++seq)}`;

async function registerPhoneOnly(phone = phoneN()) {
  const r = await call('POST', '/auth/register', { body: { password: PWD, firstName: 'Mama', lastName: 'Bora', phone, countryCode: 'CD' } });
  return { phone, status: r.status, json: r.json };
}
async function loginAs(identifier: string) {
  const r = await call('POST', '/auth/login', { body: { identifier, password: PWD, client: 'web' } });
  return { ...r, cookie: r.status === 200 ? sessionOf(r) : '' };
}
async function emailUser() {
  const email = `wv${++seq}@example.com`;
  await call('POST', '/auth/register', { body: { email, password: PWD, firstName: 'Ada', lastName: 'L', phone: phoneN(), countryCode: 'CD' } });
  const r = await loginAs(email);
  const id = (await call('GET', '/auth/me', { cookie: r.cookie })).json.user.id as string;
  return { email, cookie: r.cookie, id };
}

describe('Comptes sans e-mail, vérification facultative, retraits', () => {
  before(async () => {
    db = createPgliteDb(new PGlite());
    await migrate(db, fileURLToPath(new URL('../migrations', import.meta.url)));
    app = await buildApp(
      { NODE_ENV: 'test', PORT: 4004, HOST: '127.0.0.1', WEB_ORIGIN: ORIGIN, DATABASE_URL: 'unused', API_SECRET: 'test_secret_must_be_at_least_16_chars', MAIL_FROM: 'test@x' },
      { db, mailer, limiter: new MemoryRateLimiter(() => Date.now()), messenger },
    );
  });
  after(async () => { await app.close(); await db.close(); });

  it('inscription et connexion avec le seul numéro ; numéro déjà pris signalé', async () => {
    const a = await registerPhoneOnly();
    assert.equal(a.status, 200);
    const l = await loginAs(a.phone.replace('+243', '+243 ').replace(/(\d{3})(\d{4})$/, '$1 $2'));
    assert.equal(l.status, 200);
    const me = (await call('GET', '/auth/me', { cookie: l.cookie })).json.user;
    assert.equal(me.email, null);
    assert.equal(me.verified, false);
    assert.equal((await registerPhoneOnly(a.phone)).status, 409);
    assert.equal((await loginAs(a.phone)).status, 200);
  });

  it('vérification facultative : tout fonctionne sans, le code WhatsApp la valide', async () => {
    const a = await registerPhoneOnly();
    const { cookie } = await loginAs(a.phone);
    assert.equal((await call('GET', '/auth/channels')).json.whatsapp, true);
    assert.equal((await call('POST', '/seller/shop', { cookie, body: { name: `Boutique ${seq}` } })).status, 201); // pas bloqué
    assert.equal((await call('POST', '/auth/verify/start', { cookie, body: { channel: 'email' } })).status, 400); // pas d'e-mail
    assert.equal((await call('POST', '/auth/verify/start', { cookie, body: { channel: 'whatsapp' } })).status, 200);
    const code = messenger.lastCode(a.phone)!;
    assert.match(code, /^\d{6}$/);
    assert.equal((await call('POST', '/auth/verify/confirm', { cookie, body: { code: code === '000000' ? '000001' : '000000' } })).status, 400);
    const ok = await call('POST', '/auth/verify/confirm', { cookie, body: { code } });
    assert.equal(ok.status, 200);
    assert.equal(ok.json.user.phoneVerified, true);
    assert.equal(ok.json.user.verified, true);
    assert.equal((await call('POST', '/auth/verify/confirm', { cookie, body: { code } })).status, 400); // usage unique
  });

  it('code : 5 essais puis blocage', async () => {
    const a = await registerPhoneOnly();
    const { cookie } = await loginAs(a.phone);
    await call('POST', '/auth/verify/start', { cookie, body: { channel: 'sms' } });
    const code = messenger.lastCode(a.phone)!;
    const wrong = code === '123456' ? '654321' : '123456';
    for (let i = 0; i < 5; i++) assert.equal((await call('POST', '/auth/verify/confirm', { cookie, body: { code: wrong } })).status, 400);
    assert.equal((await call('POST', '/auth/verify/confirm', { cookie, body: { code } })).status, 429);
  });

  it('mot de passe oublié par numéro : code, nouveau mot de passe, anciennes sessions coupées', async () => {
    const a = await registerPhoneOnly();
    const old = await loginAs(a.phone);
    assert.equal((await call('POST', '/auth/forgot-password', { body: { identifier: a.phone } })).status, 200);
    const code = messenger.lastCode(a.phone)!;
    assert.equal((await call('POST', '/auth/reset-password-phone', { body: { phone: a.phone, code: '000000', password: 'Nouveau-mdp-solide-77' } })).status, 400);
    assert.equal((await call('POST', '/auth/reset-password-phone', { body: { phone: a.phone, code, password: 'Nouveau-mdp-solide-77' } })).status, 200);
    assert.equal((await call('GET', '/auth/me', { cookie: old.cookie })).status, 401);
    assert.equal((await call('POST', '/auth/login', { body: { identifier: a.phone, password: 'Nouveau-mdp-solide-77' } })).status, 200);
  });

  it('alerte WhatsApp au vendeur sans e-mail à chaque nouvelle commande', async () => {
    const seller = await registerPhoneOnly();
    const sc = (await loginAs(seller.phone)).cookie;
    await call('POST', '/seller/shop', { cookie: sc, body: { name: `Boutique WA ${seq}` } });
    const shop = (await call('GET', '/seller/shop', { cookie: sc })).json.shop;
    assert.equal(shop.whatsapp, seller.phone); // sans e-mail : le numéro du compte sert de WhatsApp
    await db.query("UPDATE shops SET status = 'active' WHERE id = $1", [shop.id]);
    const pid = (await call('POST', '/seller/products', { cookie: sc, body: { name: 'Pagne', description: 'Pagne wax.', priceUsd: 30, department: 'electronique', category: 'Audio', colors: [], sizes: [], inStock: true, images: [] } })).json.id as number;
    const buyer = await emailUser();
    await call('POST', '/orders', { cookie: buyer.cookie, body: { items: [{ id: pid, quantity: 1 }], shippingPhone: '+243907261113', shippingCity: 'Bukavu', shippingAddress: 'Avenue du Lac' } });
    const m = messenger.sent.filter((x) => x.channel === 'notify' && x.to === seller.phone);
    assert.equal(m.length, 1);
    assert.equal(m[0]!.template, 'new_order');
    // il peut couper les notifications WhatsApp
    await call('PATCH', '/seller/shop', { cookie: sc, body: { notifyWhatsapp: false } });
    await call('POST', '/orders', { cookie: buyer.cookie, body: { items: [{ id: pid, quantity: 1 }], shippingPhone: '+243907261113', shippingCity: 'Bukavu', shippingAddress: 'Avenue du Lac' } });
    assert.equal(messenger.sent.filter((x) => x.channel === 'notify' && x.to === seller.phone).length, 1);
  });

  it('retraits : solde des commandes livrées, minimum, plafond, validation et refus par l’administration', async () => {
    const seller = await emailUser();
    await call('POST', '/seller/shop', { cookie: seller.cookie, body: { name: `Boutique Gains ${seq}` } });
    const shop = (await call('GET', '/seller/shop', { cookie: seller.cookie })).json.shop;
    await db.query("UPDATE shops SET status = 'active' WHERE id = $1", [shop.id]);
    const pid = (await call('POST', '/seller/products', { cookie: seller.cookie, body: { name: 'Machine', description: 'Une machine.', priceUsd: 100, department: 'electronique', category: 'Audio', colors: [], sizes: [], inStock: true, images: [] } })).json.id as number;
    const buyer = await emailUser();
    const num = (await call('POST', '/orders', { cookie: buyer.cookie, body: { items: [{ id: pid, quantity: 1 }], shippingPhone: '+243907261113', shippingCity: 'Bukavu', shippingAddress: 'Avenue du Lac' } })).json.order.number as string;
    const W = { amountUsd: 20, method: 'mobile_money', provider: 'M-Pesa', accountName: 'Mama Bora', accountNumber: '+243812345678' };
    assert.equal((await call('GET', '/seller/wallet', { cookie: seller.cookie })).json.availableUsd, 0);
    assert.equal((await call('POST', '/seller/withdrawals', { cookie: seller.cookie, body: W })).status, 409); // rien de livré
    await call('POST', `/seller/orders/${num}/confirm`, { cookie: seller.cookie });
    await call('POST', `/seller/orders/${num}/ship`, { cookie: seller.cookie });
    assert.equal((await call('GET', '/seller/wallet', { cookie: seller.cookie })).json.availableUsd, 0); // expédié, pas encore livré
    await call('POST', `/orders/${num}/receive`, { cookie: buyer.cookie });
    const w0 = (await call('GET', '/seller/wallet', { cookie: seller.cookie })).json;
    assert.ok(w0.earnedUsd > 80 && w0.earnedUsd < 100, `gain net inattendu ${w0.earnedUsd}`);
    assert.equal(w0.availableUsd, w0.earnedUsd);
    assert.equal((await call('POST', '/seller/withdrawals', { cookie: seller.cookie, body: { ...W, amountUsd: 5 } })).status, 400); // sous le minimum
    assert.equal((await call('POST', '/seller/withdrawals', { cookie: seller.cookie, body: { ...W, amountUsd: w0.earnedUsd + 1 } })).status, 409); // plus que le solde
    const r1 = await call('POST', '/seller/withdrawals', { cookie: seller.cookie, body: W });
    assert.equal(r1.status, 201);
    const r2 = await call('POST', '/seller/withdrawals', { cookie: seller.cookie, body: { ...W, amountUsd: w0.earnedUsd - 20 } });
    assert.equal(r2.status, 201);
    assert.equal((await call('POST', '/seller/withdrawals', { cookie: seller.cookie, body: { ...W, amountUsd: 10 } })).status, 409); // solde épuisé par les demandes en attente
    const w1 = (await call('GET', '/seller/wallet', { cookie: seller.cookie })).json;
    assert.equal(w1.availableUsd, 0);
    assert.equal(w1.pendingUsd, w0.earnedUsd);
    // administration
    const admin = await emailUser();
    assert.equal((await call('GET', '/admin/withdrawals', { cookie: seller.cookie })).status, 403);
    await db.query("INSERT INTO admin_roles(user_id, role) VALUES ($1, 'finance')", [admin.id]);
    const list = (await call('GET', '/admin/withdrawals?status=pending', { cookie: admin.cookie })).json.withdrawals;
    assert.equal(list.length, 2);
    assert.equal((await call('POST', `/admin/withdrawals/${r1.json.id}/reject`, { cookie: admin.cookie, body: {} })).status, 400); // motif obligatoire
    assert.equal((await call('POST', `/admin/withdrawals/${r1.json.id}/pay`, { cookie: admin.cookie, body: { reference: 'MP-123' } })).status, 200);
    assert.equal((await call('POST', `/admin/withdrawals/${r1.json.id}/pay`, { cookie: admin.cookie, body: {} })).status, 404); // déjà traitée
    assert.match(mailer.last(seller.email)!.subject, /payé/);
    assert.equal((await call('POST', `/admin/withdrawals/${r2.json.id}/reject`, { cookie: admin.cookie, body: { reason: 'Numéro incorrect' } })).status, 200);
    const w2 = (await call('GET', '/seller/wallet', { cookie: seller.cookie })).json;
    assert.equal(w2.paidUsd, 20);
    assert.equal(w2.pendingUsd, 0);
    assert.equal(w2.availableUsd, w0.earnedUsd - 20); // la demande refusée retourne au solde
    assert.match(mailer.last(seller.email)!.subject, /refusé/);
  });

  it('retrait : boutique non validée refusée', async () => {
    const u = await emailUser();
    await call('POST', '/seller/shop', { cookie: u.cookie, body: { name: `Boutique Attente ${seq}` } });
    const r = await call('POST', '/seller/withdrawals', { cookie: u.cookie, body: { amountUsd: 20, method: 'bank', provider: 'Equity BCDC', accountName: 'X', accountNumber: '123' } });
    assert.equal(r.status, 403);
  });
});
