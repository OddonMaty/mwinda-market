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
import type { ImageStore } from './services/storage.js';

const ORIGIN = 'http://localhost:3000';
const PWD = 'Un-bon-mot-de-passe-42';
let app: FastifyInstance;
let db: Db;
let seq = 0;
const stored: string[] = [];
const store: ImageStore = { put: async (key) => { stored.push(key); return `https://blob.test/${key}.png`; } };
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function call(method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT', url: string, opts: { body?: unknown; cookie?: string } = {}) {
  const headers: Record<string, string> = {};
  if (opts.cookie) headers.cookie = opts.cookie;
  if (method !== 'GET') headers.origin = ORIGIN;
  const res = await app.inject({ method, url: `/v1${url}`, headers, payload: opts.body as object | undefined, remoteAddress: `10.2.0.${(seq % 250) + 1}` });
  const sc = res.cookies.find((c) => c.name === 'stm_session');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test
  return { status: res.statusCode, json: (res.body ? JSON.parse(res.body) : {}) as Record<string, any>, cookie: sc ? `stm_session=${sc.value}` : undefined, headers: res.headers };
}
async function user(): Promise<{ cookie: string; id: string }> {
  const email = `hero${++seq}@example.com`;
  await call('POST', '/auth/register', { body: { email, password: PWD, firstName: 'Ada', lastName: 'L', phone: '+243907261113', countryCode: 'CD', citySlug: 'bukavu' } });
  const r = await call('POST', '/auth/login', { body: { email, password: PWD, client: 'web' } });
  const id = (await call('GET', '/auth/me', { cookie: r.cookie })).json.user.id as string;
  return { cookie: r.cookie!, id };
}

describe('Carrousel, stockage, produits de démonstration', () => {
  before(async () => {
    db = createPgliteDb(new PGlite());
    await migrate(db, fileURLToPath(new URL('../migrations', import.meta.url)));
    app = await buildApp(
      { NODE_ENV: 'test', PORT: 4002, HOST: '127.0.0.1', WEB_ORIGIN: ORIGIN, DATABASE_URL: 'unused', API_SECRET: 'test_secret_must_be_at_least_16_chars', MAIL_FROM: 'test@x' },
      { db, mailer: new MemoryMailer(), limiter: new MemoryRateLimiter(() => Date.now()), store },
    );
  });
  after(async () => { await app.close(); await db.close(); });

  it('le carrousel de départ reprend les 3 diapositives actuelles', async () => {
    const s = (await call('GET', '/hero')).json.slides;
    assert.equal(s.length, 3);
    assert.equal(s[0].href, '/produit/1');
    assert.equal(s[0].priceUsd, 650);
  });

  it('administration : accès réservé, ordre, prix imposé, suppression', async () => {
    const a = await user();
    assert.equal((await call('GET', '/admin/hero', { cookie: a.cookie })).status, 403);
    await db.query("INSERT INTO admin_roles(user_id, role) VALUES ($1, 'superadmin')", [a.id]);
    const list = (await call('GET', '/admin/hero', { cookie: a.cookie })).json.slides;
    const ids = list.map((x: { id: string }) => x.id);
    assert.equal((await call('PUT', '/admin/hero/order', { cookie: a.cookie, body: { ids: [...ids].reverse() } })).status, 200);
    assert.equal((await call('GET', '/hero')).json.slides[0].id, ids[2]);
    await call('PATCH', `/admin/hero/${ids[2]}`, { cookie: a.cookie, body: { priceUsd: 99 } });
    assert.equal((await call('GET', '/hero')).json.slides[0].priceUsd, 99);
    assert.equal((await call('DELETE', `/admin/hero/${ids[2]}`, { cookie: a.cookie })).status, 200);
    assert.equal((await call('GET', '/hero')).json.slides.length, 2);
  });

  it("éligibilité : le plan du vendeur décide de ce qui peut passer sur l'accueil", async () => {
    const a = await user();
    await db.query("INSERT INTO admin_roles(user_id, role) VALUES ($1, 'superadmin')", [a.id]);
    const seller = await user();
    await call('POST', '/seller/shop', { cookie: seller.cookie, body: { name: 'Boutique Pro', phone: '+243907261113' } });
    await db.query("UPDATE shops SET status = 'active' WHERE owner_id = $1", [seller.id]);
    const p = (await call('POST', '/seller/products', { cookie: seller.cookie, body: { name: 'Sac', description: 'Un sac.', priceUsd: 20, department: 'electronique', category: 'Audio', colors: [], sizes: [], inStock: true, images: ['https://example.com/a.jpg'] } })).json.id as number;
    const refused = await call('POST', '/admin/hero', { cookie: a.cookie, body: { productId: p, tag: 'Promo' } });
    assert.equal(refused.status, 409);
    assert.equal(refused.json.error?.code ?? refused.json.code, 'plan_not_eligible');
    await db.query("UPDATE shops SET plan = 'pro', plan_expires_at = now() + interval '30 days' WHERE owner_id = $1", [seller.id]);
    const ok = await call('POST', '/admin/hero', { cookie: a.cookie, body: { productId: p, tag: 'Promo' } });
    assert.equal(ok.status, 201);
    assert.ok((await call('GET', '/hero')).json.slides.some((s: { href: string }) => s.href === `/produit/${p}`));
    // l'abonnement expire : la diapositive disparaît toute seule
    await db.query("UPDATE shops SET plan_expires_at = now() - interval '1 day' WHERE owner_id = $1", [seller.id]);
    assert.ok(!(await call('GET', '/hero')).json.slides.some((s: { href: string }) => s.href === `/produit/${p}`));
  });

  it('promotions « À la une » : choisies par l\'administrateur, mêmes règles d\'abonnement', async () => {
    const a = await user();
    await db.query("INSERT INTO admin_roles(user_id, role) VALUES ($1, 'superadmin')", [a.id]);
    assert.deepEqual((await call('GET', '/promotions')).json.products, []);
    const r = await call('POST', '/admin/hero', { cookie: a.cookie, body: { productId: 3, placement: 'home', tag: 'Promo' } });
    assert.equal(r.status, 201);
    assert.equal((await call('POST', '/admin/hero', { cookie: a.cookie, body: { productId: 3, placement: 'home' } })).status, 409);
    assert.deepEqual((await call('GET', '/promotions')).json.products, [{ productId: 3, tag: 'Promo' }]);
    assert.ok(!(await call('GET', '/hero')).json.slides.some((s: { href: string }) => s.href === '/produit/3'));
    assert.equal((await call('POST', '/admin/hero', { cookie: a.cookie, body: { placement: 'home', title: 'x' } })).status, 400);
  });

  it('produits de démonstration : retrait puis rétablissement, carrousel coupé', async () => {
    const a = await user();
    await db.query("INSERT INTO admin_roles(user_id, role) VALUES ($1, 'superadmin')", [a.id]);
    const st = (await call('GET', '/admin/demo', { cookie: a.cookie })).json;
    assert.equal(st.demoTotal, 19);
    assert.equal(st.realActive >= 0, true);
    await call('POST', '/admin/demo/hide', { cookie: a.cookie });
    assert.equal((await call('GET', '/admin/demo', { cookie: a.cookie })).json.demoActive, 0);
    assert.equal((await call('GET', '/products')).json.products.filter((x: { id: number }) => x.id < 1000).length, 0);
    assert.equal((await call('GET', '/hero')).json.slides.filter((s: { href: string }) => /^\/produit\/\d{1,3}$/.test(s.href)).length, 0);
    await call('POST', '/admin/demo/restore', { cookie: a.cookie });
    assert.equal((await call('GET', '/admin/demo', { cookie: a.cookie })).json.demoActive, 19);
  });

  it('photos : envoyées au stockage dédié, adresse https renvoyée', async () => {
    const seller = await user();
    await call('POST', '/seller/shop', { cookie: seller.cookie, body: { name: 'Boutique Photo', phone: '+243907261113' } });
    await db.query("UPDATE shops SET status = 'active' WHERE owner_id = $1", [seller.id]);
    const r = await call('POST', '/seller/images', { cookie: seller.cookie, body: { data: PNG } });
    assert.equal(r.status, 201);
    assert.match(r.json.url, /^https:\/\/blob\.test\/shops\/.+\.png$/);
    assert.equal(stored.length, 1);
    const a = await user();
    await db.query("INSERT INTO admin_roles(user_id, role) VALUES ($1, 'superadmin')", [a.id]);
    assert.equal((await call('POST', '/admin/images', { cookie: a.cookie, body: { data: PNG } })).status, 201);
  });
});
