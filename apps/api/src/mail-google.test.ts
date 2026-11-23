import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';
import { createPgliteDb, type Db } from './db/client.js';
import { migrate } from './db/migrate.js';
import { MemoryMailer, renderHtml } from './mail/mailer.js';
import { MemoryRateLimiter } from './lib/ratelimit.js';
import type { GoogleOAuth, GoogleProfile } from './services/google.js';

const ORIGIN = 'http://localhost:3000';
const PWD = 'Un-bon-mot-de-passe-42';
let app: FastifyInstance;
let db: Db;
let seq = 0;
const mailer = new MemoryMailer();
let profile: GoogleProfile = { sub: 'g-1', email: 'new.google@example.com', emailVerified: true, firstName: 'Grace', lastName: 'Hopper' };
const google: GoogleOAuth = {
  authUrl: (state, challenge) => `https://accounts.google.com/o/oauth2/v2/auth?state=${state}&code_challenge=${challenge}`,
  exchange: async (code) => { if (code !== 'good') throw new Error('bad code'); return profile; },
};

async function call(method: 'GET' | 'POST' | 'PATCH' | 'PUT', url: string, opts: { body?: unknown; cookie?: string } = {}) {
  const headers: Record<string, string> = {};
  if (opts.cookie) headers.cookie = opts.cookie;
  if (method !== 'GET') headers.origin = ORIGIN;
  const res = await app.inject({ method, url: `/v1${url}`, headers, payload: opts.body as object | undefined, remoteAddress: `10.3.0.${(seq % 250) + 1}` });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test
  return { status: res.statusCode, json: (res.body && res.headers['content-type']?.toString().includes('json') ? JSON.parse(res.body) : {}) as Record<string, any>, res, cookies: res.cookies };
}
async function user(): Promise<{ cookie: string; id: string; email: string }> {
  const email = `mg${++seq}@example.com`;
  await call('POST', '/auth/register', { body: { email, password: PWD, firstName: 'Ada', lastName: 'L', phone: '+243907261113', countryCode: 'CD', citySlug: 'bukavu' } });
  await db.query('UPDATE users SET email_verified_at = now() WHERE email = $1', [email]);
  const r = await call('POST', '/auth/login', { body: { email, password: PWD, client: 'web' } });
  const cookie = `stm_session=${r.cookies.find((c) => c.name === 'stm_session')!.value}`;
  return { cookie, id: (await call('GET', '/auth/me', { cookie })).json.user.id, email };
}

describe('E-mails et connexion Google', () => {
  before(async () => {
    db = createPgliteDb(new PGlite());
    await migrate(db, fileURLToPath(new URL('../migrations', import.meta.url)));
    app = await buildApp(
      { NODE_ENV: 'test', PORT: 4003, HOST: '127.0.0.1', WEB_ORIGIN: ORIGIN, DATABASE_URL: 'unused', API_SECRET: 'test_secret_must_be_at_least_16_chars', MAIL_FROM: 'test@x' },
      { db, mailer, limiter: new MemoryRateLimiter(() => Date.now()), google },
    );
  });
  after(async () => { await app.close(); await db.close(); });

  it('e-mail HTML : logo, paragraphes, liens et échappement', () => {
    const h = renderHtml('Bonjour <b>Ada</b>\nConfirmez : https://x.test/a?t=1&u=2\n\nMerci', 'https://site.test');
    assert.match(h, /https:\/\/site\.test\/images\/brand\/mwinda-h-light\.png/);
    assert.ok(h.includes('&lt;b&gt;Ada&lt;/b&gt;'));
    assert.ok(h.includes('href="https://x.test/a?t=1&amp;u=2"') || h.includes('href="https://x.test/a?t=1&u=2"'));
  });

  it('commande : confirmation acheteur, alerte vendeur, suivi des étapes', async () => {
    const seller = await user();
    await call('POST', '/seller/shop', { cookie: seller.cookie, body: { name: 'Boutique Mail', phone: '+243907261113' } });
    await db.query("UPDATE shops SET status = 'active' WHERE owner_id = $1", [seller.id]);
    const pid = (await call('POST', '/seller/products', { cookie: seller.cookie, body: { name: 'Casque', description: 'Un casque.', priceUsd: 40, department: 'electronique', category: 'Audio', colors: [], sizes: [], inStock: true, images: ['https://example.com/a.jpg'] } })).json.id as number;
    const buyer = await user();
    const o = await call('POST', '/orders', { cookie: buyer.cookie, body: { items: [{ id: pid, quantity: 2 }], shippingPhone: '+243907261113', shippingCity: 'Bukavu', shippingAddress: 'Avenue du Lac' } });
    assert.equal(o.status, 201);
    const number = o.json.order.number as string;
    assert.match(mailer.last(buyer.email)!.subject, new RegExp(number));
    assert.match(mailer.last(buyer.email)!.text, /\$80\.00/);
    assert.match(mailer.last(seller.email)!.subject, /Nouvelle commande/);
    const cf = await call('POST', `/seller/orders/${number}/confirm`, { cookie: seller.cookie }); assert.equal(cf.status, 200, JSON.stringify(cf.json));
    assert.match(mailer.last(buyer.email)!.subject, /confirmée/);
    await call('POST', `/seller/orders/${number}/ship`, { cookie: seller.cookie });
    assert.match(mailer.last(buyer.email)!.subject, /expédiée/);
  });

  it('un envoi en échec ne casse pas la commande', async () => {
    const seller = await user();
    await call('POST', '/seller/shop', { cookie: seller.cookie, body: { name: 'Boutique Panne', phone: '+243907261113' } });
    await db.query("UPDATE shops SET status = 'active' WHERE owner_id = $1", [seller.id]);
    const pid = (await call('POST', '/seller/products', { cookie: seller.cookie, body: { name: 'Sac', description: 'Un sac.', priceUsd: 10, department: 'electronique', category: 'Audio', colors: [], sizes: [], inStock: true, images: [] } })).json.id as number;
    const buyer = await user();
    const orig = mailer.send.bind(mailer);
    mailer.send = async () => { throw new Error('smtp down'); };
    const o = await call('POST', '/orders', { cookie: buyer.cookie, body: { items: [{ id: pid, quantity: 1 }], shippingPhone: '+243907261113', shippingCity: 'Bukavu', shippingAddress: 'Avenue du Lac' } });
    mailer.send = orig;
    assert.equal(o.status, 201);
  });

  it('Google : proposé seulement si configuré, état et PKCE dans le cookie', async () => {
    assert.equal((await call('GET', '/auth/providers')).json.google, true);
    const r = await call('GET', '/auth/google/start?next=/commande');
    assert.equal(r.status, 302);
    assert.match(String(r.res.headers.location), /accounts\.google\.com.*code_challenge=/);
    assert.ok(r.cookies.find((c) => c.name === 'stm_oauth'));
  });

  async function loginWithGoogle(code = 'good', stateOverride?: string) {
    const start = await call('GET', '/auth/google/start?next=/commande');
    const cookie = start.cookies.find((c) => c.name === 'stm_oauth')!;
    const state = new URL(String(start.res.headers.location)).searchParams.get('state')!;
    return call('GET', `/auth/google/callback?code=${code}&state=${stateOverride ?? state}`, { cookie: `stm_oauth=${cookie.value}` });
  }

  it('Google : crée le compte (e-mail vérifié), ouvre la session, retourne à la page demandée', async () => {
    const r = await loginWithGoogle();
    assert.equal(r.status, 302);
    assert.equal(r.res.headers.location, '/commande');
    const sc = r.cookies.find((c) => c.name === 'stm_session')!;
    const me = (await call('GET', '/auth/me', { cookie: `stm_session=${sc.value}` })).json.user;
    assert.equal(me.email, 'new.google@example.com');
    assert.equal(me.emailVerified, true);
    assert.equal(me.firstName, 'Grace');
  });

  it('Google : rattache un compte existant de même e-mail ; reconnaît le compte au retour', async () => {
    const u = await user();
    await db.query('UPDATE users SET email_verified_at = NULL WHERE id = $1', [u.id]);
    profile = { sub: 'g-2', email: u.email, emailVerified: true, firstName: 'X', lastName: 'Y' };
    assert.equal((await loginWithGoogle()).status, 302);
    const row = (await db.query<{ google_sub: string; email_verified_at: Date | null }>('SELECT google_sub, email_verified_at FROM users WHERE id = $1', [u.id]))[0]!;
    assert.equal(row.google_sub, 'g-2');
    assert.ok(row.email_verified_at);
    assert.equal(Number((await db.query<{ n: string }>('SELECT count(*) AS n FROM users WHERE email = $1', [u.email]))[0]!.n), 1);
  });

  it('Google : refuse un état falsifié, un code invalide, un e-mail non vérifié ou un compte suspendu', async () => {
    assert.match(String((await loginWithGoogle('good', 'forged')).res.headers.location), /google=erreur/);
    assert.match(String((await loginWithGoogle('bad')).res.headers.location), /google=erreur/);
    profile = { sub: 'g-3', email: 'unverified@example.com', emailVerified: false, firstName: 'U', lastName: 'V' };
    const r = await loginWithGoogle();
    assert.match(String(r.res.headers.location), /google=erreur/);
    assert.equal((await db.query('SELECT 1 FROM users WHERE email = $1', ['unverified@example.com'])).length, 0);
    profile = { sub: 'g-1', email: 'new.google@example.com', emailVerified: true, firstName: 'Grace', lastName: 'Hopper' };
    await db.query("UPDATE users SET status = 'suspended' WHERE google_sub = 'g-1'");
    assert.match(String((await loginWithGoogle()).res.headers.location), /google=suspendu/);
  });
});
