import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';
import { createPgliteDb, type Db } from './db/client.js';
import { migrate } from './db/migrate.js';
import { MemoryMailer } from './mail/mailer.js';
import { MemoryRateLimiter } from './lib/ratelimit.js';
import { hashToken } from './lib/crypto.js';

const ORIGIN = 'http://localhost:3000';
const PWD = 'Un-bon-mot-de-passe-42';
const MIN = 60_000;
const HOUR = 60 * MIN;

let app: FastifyInstance;
let db: Db;
let mailer: MemoryMailer;
let clock = Date.now();
let limiter: MemoryRateLimiter;
const bodies: string[] = []; // toutes les réponses, pour vérifier qu'aucun secret ne fuit
let seq = 0;
let ipSeq = 0; // une adresse IP fictive par test (les limites par IP sont testées séparément)

const reg = (over: Record<string, unknown> = {}) => ({
  email: `user${++seq}@example.com`, password: PWD, firstName: 'Ada', lastName: 'Lovelace', phone: '+243907261113', countryCode: 'CD', citySlug: 'bukavu', ...over,
});

async function call(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, opts: { body?: unknown; cookie?: string; origin?: string | null; bearer?: string } = {}) {
  const headers: Record<string, string> = {};
  if (opts.cookie) headers.cookie = opts.cookie;
  if (opts.origin !== null && method !== 'GET') headers.origin = opts.origin ?? ORIGIN;
  if (opts.bearer) headers.authorization = `Bearer ${opts.bearer}`;
  const res = await app.inject({ method, url: `/v1${url}`, headers, payload: opts.body as object | undefined, remoteAddress: `10.0.${Math.floor(ipSeq / 250)}.${ipSeq % 250 + 1}` });
  bodies.push(res.body);
  const sc = res.cookies.find((c) => c.name === 'stm_session');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test : réponses JSON consultées librement
  return { status: res.statusCode, json: res.body ? (JSON.parse(res.body) as Record<string, any>) : {}, cookie: sc ? `stm_session=${sc.value}` : undefined, setCookie: sc };
}
const tokenFrom = (m: { text: string } | undefined) => /token=([\w-]+)/.exec(m?.text ?? '')?.[1] as string;
async function signup(over: Record<string, unknown> = {}) {
  const body = reg(over);
  await call('POST', '/auth/register', { body });
  return body;
}
async function login(email: string, password = PWD, client: 'web' | 'api' = 'web') {
  return call('POST', '/auth/login', { body: { email, password, client } });
}

describe('Comptes et sessions', () => {
  before(async () => {
    const lite = new PGlite();
    db = createPgliteDb(lite);
    await migrate(db, fileURLToPath(new URL('../migrations', import.meta.url)));
    mailer = new MemoryMailer();
    limiter = new MemoryRateLimiter(() => clock);
    app = await buildApp(
      { NODE_ENV: 'test', PORT: 4001, HOST: '127.0.0.1', WEB_ORIGIN: ORIGIN, DATABASE_URL: 'unused', API_SECRET: 'test_secret_must_be_at_least_16_chars', MAIL_FROM: 'test@x', WEB_ORIGIN_REGEX: '^https://saotechmarket-[a-z0-9]{9}-sao-tech-agency\\.vercel\\.app$' },
      { db, mailer, limiter, now: () => new Date(clock) },
    );
  });
  after(async () => {
    await app.close();
    await db.close();
  });
  beforeEach(() => {
    ipSeq++;
    mailer.sent.length = 0;
  });

  it('inscription : compte créé, e-mail de vérification envoyé, rien en clair en base', async () => {
    const body = reg();
    const r = await call('POST', '/auth/register', { body });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { ok: true });
    const mail = mailer.last(body.email);
    assert.match(mail!.text, /\/verifier-email\?token=/);
    const [u] = await db.query<{ password_hash: string; email: string; city_id: string | null }>('SELECT * FROM users WHERE email = $1', [body.email]);
    assert.match(u!.password_hash, /^\$argon2id\$/);
    assert.ok(!u!.password_hash.includes(PWD));
    assert.ok(u!.city_id, 'la ville Bukavu est rattachée');
    const token = tokenFrom(mail);
    const [t] = await db.query<{ token_hash: string }>('SELECT token_hash FROM one_time_tokens ORDER BY expires_at DESC LIMIT 1');
    assert.equal(t!.token_hash, hashToken(token));
    assert.notEqual(t!.token_hash, token);
  });

  it('inscription : refuse un mot de passe faible, commun ou contenant l\'e-mail', async () => {
    for (const password of ['court1', 'password123', 'xxxxxxxxxx']) {
      const r = await call('POST', '/auth/register', { body: reg({ password }) });
      assert.equal(r.status, 400, password);
    }
    const r = await call('POST', '/auth/register', { body: reg({ email: 'jeanpierre@example.com', password: 'jeanpierre2026' }) });
    assert.equal(r.status, 400);
    assert.equal(r.json.error.code, 'weak_password_contains_email');
  });

  it('inscription : e-mail déjà utilisé → réponse identique + e-mail « compte existant »', async () => {
    const body = await signup();
    mailer.sent.length = 0;
    const again = await call('POST', '/auth/register', { body: { ...body, firstName: 'Autre' } });
    assert.equal(again.status, 200);
    assert.deepEqual(again.json, { ok: true });
    assert.match(mailer.last(body.email)!.subject, /déjà un compte/);
    assert.equal((await db.query('SELECT 1 FROM users WHERE email = $1', [body.email])).length, 1);
  });

  it('connexion : correcte, incorrecte (message générique identique), nouvelle session à chaque fois', async () => {
    const { email } = await signup();
    const ok = await login(email);
    assert.equal(ok.status, 200);
    assert.ok(ok.setCookie!.httpOnly);
    assert.equal(ok.setCookie!.sameSite, 'Lax');
    const bad = await login(email, 'mauvais-mot-de-passe-1');
    const unknown = await login('inconnu@example.com', 'mauvais-mot-de-passe-1');
    assert.equal(bad.status, 401);
    assert.deepEqual(bad.json, unknown.json);
    const second = await login(email);
    assert.notEqual(ok.cookie, second.cookie);
    const sessions = await db.query('SELECT token_hash FROM sessions s JOIN users u ON u.id = s.user_id WHERE u.email = $1', [email]);
    assert.equal(sessions.length, 2);
    const me = await call('GET', '/auth/me', { cookie: ok.cookie });
    assert.equal(me.json.user.email, email);
    assert.equal(me.json.user.emailVerified, false);
  });

  it('connexion : blocage après 5 échecs en 15 minutes, levé ensuite', async () => {
    const { email } = await signup();
    for (let i = 0; i < 5; i++) assert.equal((await login(email, 'mauvais-mot-de-passe-1')).status, 401);
    assert.equal((await login(email)).status, 429, 'même le bon mot de passe est refusé pendant le blocage');
    clock += 16 * MIN;
    assert.equal((await login(email)).status, 200);
  });

  it('vérification d\'e-mail : valide, déjà utilisé, expiré, invalide', async () => {
    const a = await signup();
    const token = tokenFrom(mailer.last(a.email));
    assert.equal((await call('POST', '/auth/verify-email', { body: { token } })).status, 200);
    const me = await call('GET', '/auth/me', { cookie: (await login(a.email)).cookie });
    assert.equal(me.json.user.emailVerified, true);
    const used = await call('POST', '/auth/verify-email', { body: { token } });
    assert.equal(used.json.error.code, 'token_used');

    const b = await signup();
    const t2 = tokenFrom(mailer.last(b.email));
    clock += 25 * HOUR;
    assert.equal((await call('POST', '/auth/verify-email', { body: { token: t2 } })).json.error.code, 'token_expired');
    assert.equal((await call('POST', '/auth/verify-email', { body: { token: 'x'.repeat(43) } })).json.error.code, 'invalid_token');
  });

  it('renvoi de la vérification : réponse identique, e-mail seulement si nécessaire', async () => {
    const a = await signup();
    mailer.sent.length = 0;
    const known = await call('POST', '/auth/resend-verification', { body: { email: a.email } });
    const unknown = await call('POST', '/auth/resend-verification', { body: { email: 'personne@example.com' } });
    assert.deepEqual(known.json, unknown.json);
    assert.equal(mailer.sent.length, 1);
  });

  it('mot de passe oublié : réponse identique, jeton 1 h à usage unique, sessions révoquées', async () => {
    const a = await signup();
    const session = await login(a.email);
    mailer.sent.length = 0;
    const unknown = await call('POST', '/auth/forgot-password', { body: { email: 'personne@example.com' } });
    assert.equal(mailer.sent.length, 0);
    const known = await call('POST', '/auth/forgot-password', { body: { email: a.email } });
    assert.deepEqual(known.json, unknown.json);
    const token = tokenFrom(mailer.last(a.email));
    const newPwd = 'Nouveau-mot-de-passe-77';
    assert.equal((await call('POST', '/auth/reset-password', { body: { token, password: 'court' } })).status, 400);
    assert.equal((await call('POST', '/auth/reset-password', { body: { token, password: newPwd } })).status, 200);
    assert.equal((await call('POST', '/auth/reset-password', { body: { token, password: newPwd } })).json.error.code, 'token_used');
    assert.equal((await call('GET', '/auth/me', { cookie: session.cookie })).status, 401, 'ancienne session révoquée');
    assert.equal((await login(a.email)).status, 401, 'ancien mot de passe refusé');
    assert.equal((await login(a.email, newPwd)).status, 200);
    assert.match(mailer.last(a.email)!.subject, /modifié/);

    await call('POST', '/auth/forgot-password', { body: { email: a.email } });
    const late = tokenFrom(mailer.last(a.email));
    clock += 61 * MIN;
    assert.equal((await call('POST', '/auth/reset-password', { body: { token: late, password: 'Encore-un-autre-88' } })).json.error.code, 'token_expired');
  });

  it('session : durée glissante de 30 jours pour un client, 8 h non glissantes pour un administrateur', async () => {
    const c = await signup();
    const cs = await login(c.email);
    clock += 2 * HOUR;
    await call('GET', '/auth/me', { cookie: cs.cookie }); // prolonge
    const [row] = await db.query<{ expires_at: Date }>('SELECT expires_at FROM sessions ORDER BY created_at DESC LIMIT 1');
    assert.ok(new Date(row!.expires_at).getTime() > clock + 29 * 24 * HOUR);

    const a = await signup();
    const [user] = await db.query<{ id: string }>('SELECT id FROM users WHERE email = $1', [a.email]);
    await db.query(`INSERT INTO admin_roles(user_id, role) VALUES ($1, 'moderator')`, [user!.id]);
    const as = await login(a.email);
    assert.equal(as.setCookie!.expires, undefined, 'cookie de session (pas de durée longue)');
    clock += 7 * HOUR;
    assert.equal((await call('GET', '/auth/me', { cookie: as.cookie })).status, 200);
    clock += 2 * HOUR; // 9 h après la création
    assert.equal((await call('GET', '/auth/me', { cookie: as.cookie })).status, 401);
  });

  it('CSRF : refuse une mauvaise Origin, ou une requête à cookie sans Origin ; Bearer exempté', async () => {
    const a = await signup();
    const s = await login(a.email);
    const evil = await call('POST', '/auth/logout', { cookie: s.cookie, origin: 'https://evil.example' });
    assert.equal(evil.status, 403);
    // adresse d'un déploiement de l'équipe (forme exacte) : acceptée ; adresse qui y ressemble : refusée
    assert.equal((await call('POST', '/auth/logout', { cookie: s.cookie, origin: 'https://saotechmarket-git-x-sao-tech-agency.vercel.app' })).status, 403);
    assert.equal((await call('POST', '/auth/logout', { cookie: s.cookie, origin: null })).status, 403);
    assert.equal((await call('GET', '/auth/me', { cookie: s.cookie })).status, 200, 'session toujours valide');
    const api = await login(a.email, PWD, 'api');
    assert.ok(api.json.token);
    assert.equal(api.cookie, undefined);
    const viaBearer = await call('POST', '/auth/logout', { bearer: api.json.token, origin: 'https://evil.example' });
    assert.equal(viaBearer.status, 200);
    assert.equal((await call('POST', '/auth/logout', { cookie: s.cookie, origin: 'https://saotechmarket-8wtustpec-sao-tech-agency.vercel.app' })).status, 200);
  });

  it('compte suspendu : connexion refusée et sessions actives refusées', async () => {
    const a = await signup();
    const s = await login(a.email);
    await db.query(`UPDATE users SET status = 'suspended' WHERE email = $1`, [a.email]);
    assert.equal((await call('GET', '/auth/me', { cookie: s.cookie })).status, 401);
    const r = await login(a.email);
    assert.equal(r.status, 403);
    assert.equal(r.json.error.code, 'account_suspended');
  });

  it('changement de mot de passe, profil, liste et révocation des appareils', async () => {
    const a = await signup();
    const s1 = await login(a.email);
    const s2 = await login(a.email);
    assert.equal((await call('POST', '/auth/change-password', { cookie: s1.cookie, body: { oldPassword: 'faux-mot-de-passe-1', newPassword: 'Autre-mot-de-passe-55' } })).json.error.code, 'wrong_password');
    assert.equal((await call('POST', '/auth/change-password', { cookie: s1.cookie, body: { oldPassword: PWD, newPassword: 'Autre-mot-de-passe-55' } })).status, 200);
    assert.equal((await call('GET', '/auth/me', { cookie: s2.cookie })).status, 401, 'les autres appareils sont déconnectés');
    assert.equal((await call('GET', '/auth/me', { cookie: s1.cookie })).status, 200);

    const p = await call('PATCH', '/me', { cookie: s1.cookie, body: { firstName: 'Grace', phone: '+243812345678', citySlug: 'goma' } });
    assert.equal(p.json.user.firstName, 'Grace');
    assert.equal((await call('PATCH', '/me', { cookie: s1.cookie, body: { phone: '0907261113' } })).status, 400);

    const s3 = await login(a.email, 'Autre-mot-de-passe-55');
    const list = await call('GET', '/me/sessions', { cookie: s1.cookie });
    assert.equal(list.json.sessions.length, 2);
    const other = list.json.sessions.find((x: { current: boolean }) => !x.current);
    assert.equal((await call('DELETE', `/me/sessions/${other.id}`, { cookie: s1.cookie })).status, 200);
    assert.equal((await call('GET', '/auth/me', { cookie: s3.cookie })).status, 401);
  });

  it('limitation par adresse IP : trop d\'inscriptions depuis la même adresse → 429', async () => {
    let last = 0;
    for (let i = 0; i < 12; i++) last = (await call('POST', '/auth/register', { body: reg() })).status;
    assert.equal(last, 429);
  });

  it('aucune réponse ne contient de hash de mot de passe ni de hash de jeton', async () => {
    assert.ok(bodies.length > 30);
    for (const b of bodies) {
      assert.ok(!/password_hash|passwordHash|token_hash|tokenHash|\$argon2/.test(b), b);
    }
  });

  it('en base, aucun jeton de session ni jeton à usage unique en clair', async () => {
    const a = await signup();
    const s = await login(a.email);
    const raw = s.cookie!.split('=')[1]!;
    const dump = JSON.stringify(await db.query('SELECT * FROM sessions')) + JSON.stringify(await db.query('SELECT * FROM one_time_tokens'));
    assert.ok(!dump.includes(raw));
    assert.ok(!dump.includes(tokenFrom(mailer.last(a.email))));
  });
});
