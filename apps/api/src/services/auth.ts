import type { Db } from '../db/client.js';
import type { EnvConfig } from '../config/env.js';
import { webOrigins } from '../config/env.js';
import { AppError } from '../errors.js';
import { hashToken, newId, newToken } from '../lib/crypto.js';
import { checkPassword, hashPassword, verifyPassword } from '../lib/password.js';
import type { RateLimiter } from '../lib/ratelimit.js';
import type { Mailer } from '../mail/mailer.js';
import * as tpl from '../mail/templates.js';
import type { LoginBody, RegisterBody, UserDto } from '@saotech/shared';

export interface AuthDeps {
  db: Db;
  mailer: Mailer;
  limiter: RateLimiter;
  config: EnvConfig;
  now?: () => Date;
}
export interface ReqMeta { ip: string; userAgent?: string }

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
export const SESSION_DAYS = 30;
export const ADMIN_SESSION_HOURS = 8;
const LOGIN_FAILS = 5;
const LOGIN_WINDOW = 15 * MIN;

type Locale = 'fr' | 'en';
interface UserRow {
  id: string; email: string; email_verified_at: Date | null; password_hash: string | null; first_name: string; last_name: string;
  phone: string | null; country_code: string | null; city_id: string | null; locale: string; status: string;
}

export const publicUrl = (c: EnvConfig) => webOrigins(c)[0] ?? '';
const asLocale = (l: string): Locale => (l === 'en' ? 'en' : 'fr');

// Hash factice pour égaliser le temps de réponse quand le compte n'existe pas.
let dummyHash: Promise<string> | undefined;
const getDummy = () => (dummyHash ??= hashPassword('dummy-password-for-timing'));

export class AuthService {
  constructor(private d: AuthDeps) {}
  private now = () => (this.d.now ? this.d.now() : new Date());

  private limit(key: string, limit: number, windowMs: number) {
    if (this.d.limiter.hit(key, limit, windowMs)) throw new AppError(429, 'too_many_requests', 'Trop de tentatives. Réessayez plus tard.');
  }

  async toDto(u: UserRow): Promise<UserDto> {
    const roles = await this.d.db.query<{ role: UserDto['roles'][number] }>('SELECT role FROM admin_roles WHERE user_id = $1 ORDER BY role', [u.id]);
    return {
      id: u.id, email: u.email, emailVerified: !!u.email_verified_at, firstName: u.first_name, lastName: u.last_name, phone: u.phone,
      countryCode: u.country_code, cityId: u.city_id, locale: u.locale, roles: roles.map((r) => r.role),
    };
  }

  private async cityId(countryCode: string, slug?: string | null): Promise<string | null> {
    if (!slug) return null;
    const r = await this.d.db.query<{ id: string }>(
      'SELECT c.id FROM cities c JOIN regions r ON r.id = c.region_id WHERE r.country_code = $1 AND c.slug = $2', [countryCode, slug]);
    return r[0]?.id ?? null;
  }

  private async issueToken(userId: string, purpose: 'verify_email' | 'reset_password', ttlMs: number): Promise<string> {
    await this.d.db.query(`UPDATE one_time_tokens SET used_at = $3 WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL`, [userId, purpose, this.now()]);
    const token = newToken();
    await this.d.db.query('INSERT INTO one_time_tokens(id, user_id, purpose, token_hash, expires_at) VALUES ($1,$2,$3,$4,$5)',
      [newId(), userId, purpose, hashToken(token), new Date(this.now().getTime() + ttlMs)]);
    return token;
  }

  // ---------- Inscription ----------
  async register(body: RegisterBody, meta: ReqMeta): Promise<void> {
    this.limit(`register:ip:${meta.ip}`, 10, HOUR);
    this.limit(`register:email:${body.email}`, 5, HOUR);
    const problem = checkPassword(body.password, body.email);
    if (problem) throw new AppError(400, `weak_password_${problem}`, 'Mot de passe trop faible.');
    const passwordHash = await hashPassword(body.password); // toujours calculé : même durée que le compte existe ou non
    const existing = await this.d.db.query<{ id: string; locale: string }>('SELECT id, locale FROM users WHERE email = $1', [body.email]);
    const base = publicUrl(this.d.config);
    if (existing[0]) {
      await this.d.mailer.send(tpl.accountExists(asLocale(existing[0].locale), body.email, `${base}/connexion`, `${base}/mot-de-passe-oublie`));
      return;
    }
    const country = await this.d.db.query('SELECT 1 FROM countries WHERE code = $1 AND active', [body.countryCode]);
    if (!country[0]) throw new AppError(400, 'country_not_supported', 'Pays non disponible.');
    const id = newId();
    try {
      await this.d.db.query(
        `INSERT INTO users(id, email, password_hash, first_name, last_name, phone, country_code, city_id, locale) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [id, body.email, passwordHash, body.firstName, body.lastName, body.phone, body.countryCode, await this.cityId(body.countryCode, body.citySlug), body.locale]);
    } catch (e) {
      if ((e as { code?: string }).code === '23505') return; // course : compte créé entre-temps, réponse identique
      throw e;
    }
    const token = await this.issueToken(id, 'verify_email', DAY);
    await this.d.mailer.send(tpl.verifyEmail(body.locale, body.email, `${base}/verifier-email?token=${token}`));
  }

  // ---------- Connexion ----------
  async login(body: LoginBody, meta: ReqMeta): Promise<{ token: string; expiresAt: Date; admin: boolean; user: UserDto }> {
    const failKey = `login:fail:${body.email}`;
    this.limit(`login:ip:${meta.ip}`, 30, LOGIN_WINDOW);
    if (this.d.limiter.count(`login:lock:${body.email}`, LOGIN_WINDOW) > 0) throw new AppError(429, 'too_many_requests', 'Trop de tentatives. Réessayez dans 15 minutes.');
    const rows = await this.d.db.query<UserRow>('SELECT * FROM users WHERE email = $1', [body.email]);
    const u = rows[0];
    const ok = await verifyPassword(u?.password_hash ?? (await getDummy()), body.password);
    if (!u || !u.password_hash || !ok) {
      this.d.limiter.hit(failKey, Number.MAX_SAFE_INTEGER, LOGIN_WINDOW);
      // 5 échecs en 15 min : blocage de 15 min à partir de maintenant.
      if (this.d.limiter.count(failKey, LOGIN_WINDOW) >= LOGIN_FAILS) this.d.limiter.hit(`login:lock:${body.email}`, Number.MAX_SAFE_INTEGER, LOGIN_WINDOW);
      throw new AppError(401, 'invalid_credentials', 'E-mail ou mot de passe incorrect.');
    }
    if (u.status !== 'active') throw new AppError(403, 'account_suspended', 'Ce compte est suspendu.');
    this.d.limiter.reset(failKey);
    const admin = (await this.d.db.query('SELECT 1 FROM admin_roles WHERE user_id = $1', [u.id])).length > 0;
    const token = newToken();
    const now = this.now();
    const expiresAt = new Date(now.getTime() + (admin ? ADMIN_SESSION_HOURS * HOUR : SESSION_DAYS * DAY));
    await this.d.db.query('INSERT INTO sessions(id, user_id, token_hash, kind, ip, user_agent, created_at, expires_at, last_used_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$7)',
      [newId(), u.id, hashToken(token), body.client, meta.ip, meta.userAgent?.slice(0, 300) ?? null, now, expiresAt]);
    await this.d.db.query('UPDATE users SET last_login_at = $2 WHERE id = $1', [u.id, now]);
    return { token, expiresAt, admin, user: await this.toDto(u) };
  }

  /** Retrouve la session (cookie ou Bearer). Renvoie null si absente, expirée, révoquée ou compte suspendu. */
  async resolve(token: string | undefined): Promise<{ sessionId: string; user: UserRow; expiresAt: Date } | null> {
    if (!token) return null;
    const rows = await this.d.db.query<UserRow & { sid: string; created_at: Date; expires_at: Date; last_used_at: Date }>(
      `SELECT u.*, s.id AS sid, s.created_at, s.expires_at, s.last_used_at FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.revoked_at IS NULL`, [hashToken(token)]);
    const r = rows[0];
    if (!r) return null;
    const now = this.now();
    if (r.status !== 'active') return null;
    const isAdmin = (await this.d.db.query('SELECT 1 FROM admin_roles WHERE user_id = $1', [r.id])).length > 0;
    let expiresAt = new Date(r.expires_at);
    if (isAdmin) {
      // Session d'administration : 8 h à partir de la création, jamais prolongée.
      expiresAt = new Date(Math.min(expiresAt.getTime(), new Date(r.created_at).getTime() + ADMIN_SESSION_HOURS * HOUR));
    }
    if (expiresAt.getTime() <= now.getTime()) return null;
    if (!isAdmin && now.getTime() - new Date(r.last_used_at).getTime() > HOUR) {
      expiresAt = new Date(now.getTime() + SESSION_DAYS * DAY); // durée glissante
      await this.d.db.query('UPDATE sessions SET last_used_at = $2, expires_at = $3 WHERE id = $1', [r.sid, now, expiresAt]);
    }
    return { sessionId: r.sid, user: r, expiresAt };
  }

  async logout(sessionId: string): Promise<void> {
    await this.d.db.query('UPDATE sessions SET revoked_at = $2 WHERE id = $1 AND revoked_at IS NULL', [sessionId, this.now()]);
  }

  // ---------- Vérification d'e-mail ----------
  private async consume(token: string, purpose: 'verify_email' | 'reset_password') {
    const hash = hashToken(token);
    const row = (await this.d.db.query<{ id: string; user_id: string; expires_at: Date; used_at: Date | null }>(
      'SELECT id, user_id, expires_at, used_at FROM one_time_tokens WHERE token_hash = $1 AND purpose = $2', [hash, purpose]))[0];
    if (!row) throw new AppError(400, 'invalid_token', 'Lien invalide.');
    if (row.used_at) throw new AppError(400, 'token_used', 'Ce lien a déjà été utilisé.');
    if (new Date(row.expires_at).getTime() <= this.now().getTime()) throw new AppError(400, 'token_expired', 'Ce lien a expiré.');
    // Usage unique garanti même en cas de requêtes simultanées.
    const claimed = await this.d.db.query('UPDATE one_time_tokens SET used_at = $2 WHERE id = $1 AND used_at IS NULL RETURNING id', [row.id, this.now()]);
    if (!claimed[0]) throw new AppError(400, 'token_used', 'Ce lien a déjà été utilisé.');
    return row.user_id;
  }

  async verifyEmail(token: string): Promise<void> {
    const userId = await this.consume(token, 'verify_email');
    await this.d.db.query('UPDATE users SET email_verified_at = COALESCE(email_verified_at, $2), updated_at = $2 WHERE id = $1', [userId, this.now()]);
  }

  async resendVerification(email: string, meta: ReqMeta): Promise<void> {
    this.limit(`resend:ip:${meta.ip}`, 10, HOUR);
    this.limit(`resend:email:${email}`, 3, HOUR);
    const u = (await this.d.db.query<UserRow>('SELECT * FROM users WHERE email = $1', [email]))[0];
    if (!u || u.email_verified_at || u.status !== 'active') return;
    const token = await this.issueToken(u.id, 'verify_email', DAY);
    await this.d.mailer.send(tpl.verifyEmail(asLocale(u.locale), u.email, `${publicUrl(this.d.config)}/verifier-email?token=${token}`));
  }

  // ---------- Mot de passe ----------
  async forgotPassword(email: string, meta: ReqMeta): Promise<void> {
    this.limit(`forgot:ip:${meta.ip}`, 10, HOUR);
    this.limit(`forgot:email:${email}`, 3, HOUR);
    const u = (await this.d.db.query<UserRow>('SELECT * FROM users WHERE email = $1', [email]))[0];
    if (!u || u.status !== 'active') return;
    const token = await this.issueToken(u.id, 'reset_password', HOUR);
    await this.d.mailer.send(tpl.resetPassword(asLocale(u.locale), u.email, `${publicUrl(this.d.config)}/reinitialiser-mot-de-passe?token=${token}`));
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const hash = hashToken(token);
    const peek = (await this.d.db.query<{ email: string }>(
      `SELECT u.email FROM one_time_tokens t JOIN users u ON u.id = t.user_id WHERE t.token_hash = $1 AND t.purpose = 'reset_password'`, [hash]))[0];
    if (peek) {
      const problem = checkPassword(password, peek.email);
      if (problem) throw new AppError(400, `weak_password_${problem}`, 'Mot de passe trop faible.');
    }
    const userId = await this.consume(token, 'reset_password');
    const u = (await this.d.db.query<UserRow>('SELECT * FROM users WHERE id = $1', [userId]))[0]!;
    const now = this.now();
    await this.d.db.query('UPDATE users SET password_hash = $2, email_verified_at = COALESCE(email_verified_at, $3), updated_at = $3 WHERE id = $1', [userId, await hashPassword(password), now]);
    await this.d.db.query('UPDATE sessions SET revoked_at = $2 WHERE user_id = $1 AND revoked_at IS NULL', [userId, now]);
    await this.d.mailer.send(tpl.passwordChanged(asLocale(u.locale), u.email));
  }

  async changePassword(user: UserRow, sessionId: string, oldPassword: string, newPassword: string): Promise<void> {
    this.limit(`chgpwd:user:${user.id}`, 10, HOUR);
    if (!user.password_hash || !(await verifyPassword(user.password_hash, oldPassword))) throw new AppError(400, 'wrong_password', 'Ancien mot de passe incorrect.');
    const problem = checkPassword(newPassword, user.email);
    if (problem) throw new AppError(400, `weak_password_${problem}`, 'Mot de passe trop faible.');
    const now = this.now();
    await this.d.db.query('UPDATE users SET password_hash = $2, updated_at = $3 WHERE id = $1', [user.id, await hashPassword(newPassword), now]);
    await this.d.db.query('UPDATE sessions SET revoked_at = $3 WHERE user_id = $1 AND id <> $2 AND revoked_at IS NULL', [user.id, sessionId, now]);
    await this.d.mailer.send(tpl.passwordChanged(asLocale(user.locale), user.email));
  }

  // ---------- Profil et appareils ----------
  async updateProfile(user: UserRow, patch: { firstName?: string; lastName?: string; phone?: string; countryCode?: string; citySlug?: string | null; locale?: 'fr' | 'en' }): Promise<UserDto> {
    const country = patch.countryCode ?? user.country_code ?? 'CD';
    if (patch.countryCode && !(await this.d.db.query('SELECT 1 FROM countries WHERE code = $1 AND active', [patch.countryCode]))[0]) {
      throw new AppError(400, 'country_not_supported', 'Pays non disponible.');
    }
    const city = patch.citySlug === undefined ? user.city_id : await this.cityId(country, patch.citySlug);
    await this.d.db.query(
      `UPDATE users SET first_name = $2, last_name = $3, phone = $4, country_code = $5, city_id = $6, locale = $7, updated_at = $8 WHERE id = $1`,
      [user.id, patch.firstName ?? user.first_name, patch.lastName ?? user.last_name, patch.phone ?? user.phone, country, city, patch.locale ?? user.locale, this.now()]);
    return this.toDto((await this.d.db.query<UserRow>('SELECT * FROM users WHERE id = $1', [user.id]))[0]!);
  }

  async listSessions(userId: string, currentId: string) {
    const rows = await this.d.db.query<{ id: string; kind: string; ip: string | null; user_agent: string | null; created_at: Date; last_used_at: Date; expires_at: Date }>(
      `SELECT id, kind, ip, user_agent, created_at, last_used_at, expires_at FROM sessions WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > $2 ORDER BY last_used_at DESC`, [userId, this.now()]);
    return rows.map((r) => ({ id: r.id, kind: r.kind, ip: r.ip, userAgent: r.user_agent, createdAt: r.created_at, lastUsedAt: r.last_used_at, expiresAt: r.expires_at, current: r.id === currentId }));
  }

  async revokeSession(userId: string, id: string): Promise<void> {
    const r = await this.d.db.query('UPDATE sessions SET revoked_at = $3 WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL RETURNING id', [id, userId, this.now()]);
    if (!r[0]) throw new AppError(404, 'not_found', 'Session introuvable.');
  }
}
export type { UserRow };
