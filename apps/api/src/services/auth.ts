import type { ImageStore } from './storage.js';
import type { GoogleOAuth, GoogleProfile } from './google.js';
import type { Channel, Messenger } from './messenger.js';
import { randomInt } from 'node:crypto';
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
  store?: ImageStore;
  google?: GoogleOAuth;
  messenger?: Messenger;
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
  id: string; email: string | null; email_verified_at: Date | null; phone_verified_at: Date | null; password_hash: string | null; first_name: string; last_name: string;
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
      id: u.id, email: u.email, emailVerified: !!u.email_verified_at, phoneVerified: !!u.phone_verified_at, verified: !!(u.email_verified_at || u.phone_verified_at), firstName: u.first_name, lastName: u.last_name, phone: u.phone,
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
    const handle = body.email ?? body.phone;
    this.limit(`register:ip:${meta.ip}`, 10, HOUR);
    this.limit(`register:id:${handle}`, 5, HOUR);
    const problem = checkPassword(body.password, handle);
    if (problem) throw new AppError(400, `weak_password_${problem}`, 'Mot de passe trop faible.');
    const passwordHash = await hashPassword(body.password); // toujours calculé : même durée que le compte existe ou non
    const existing = await this.d.db.query<{ id: string; locale: string; email: string | null }>(
      body.email ? 'SELECT id, locale, email FROM users WHERE email = $1' : 'SELECT id, locale, email FROM users WHERE phone = $1 AND (email IS NULL OR phone_verified_at IS NOT NULL)', [body.email ?? body.phone]);
    const base = publicUrl(this.d.config);
    if (existing[0]) {
      // Sans e-mail, on ne peut pas prévenir le titulaire : on l'indique franchement (le numéro n'est pas un secret).
      if (!body.email) throw new AppError(409, 'account_exists', 'Un compte existe déjà avec ce numéro. Connectez-vous.');
      if (existing[0].email) await this.d.mailer.send(tpl.accountExists(asLocale(existing[0].locale), existing[0].email, `${base}/connexion`, `${base}/mot-de-passe-oublie`));
      return;
    }
    const country = await this.d.db.query('SELECT 1 FROM countries WHERE code = $1 AND active', [body.countryCode]);
    if (!country[0]) throw new AppError(400, 'country_not_supported', 'Pays non disponible.');
    const id = newId();
    try {
      await this.d.db.query(
        `INSERT INTO users(id, email, password_hash, first_name, last_name, phone, country_code, city_id, locale) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [id, body.email ?? null, passwordHash, body.firstName, body.lastName, body.phone, body.countryCode, await this.cityId(body.countryCode, body.citySlug), body.locale]);
    } catch (e) {
      if ((e as { code?: string }).code === '23505') return; // course : compte créé entre-temps, réponse identique
      throw e;
    }
    if (body.email) {
      const token = await this.issueToken(id, 'verify_email', DAY);
      await this.d.mailer.send(tpl.verifyEmail(asLocale(body.locale), body.email, `${base}/verifier-email?token=${token}`));
    }
  }

  async login(body: LoginBody, meta: ReqMeta): Promise<{ token: string; expiresAt: Date; admin: boolean; user: UserDto }> {
    const failKey = `login:fail:${body.identifier}`;
    this.limit(`login:ip:${meta.ip}`, 30, LOGIN_WINDOW);
    if (this.d.limiter.count(`login:lock:${body.identifier}`, LOGIN_WINDOW) > 0) throw new AppError(429, 'too_many_requests', 'Trop de tentatives. Réessayez dans 15 minutes.');
    const rows = await this.d.db.query<UserRow>(body.identifier.includes('@') ? 'SELECT * FROM users WHERE email = $1' : 'SELECT * FROM users WHERE phone = $1 AND (email IS NULL OR phone_verified_at IS NOT NULL)', [body.identifier]);
    const u = rows[0];
    const ok = await verifyPassword(u?.password_hash ?? (await getDummy()), body.password);
    if (!u || !u.password_hash || !ok) {
      this.d.limiter.hit(failKey, Number.MAX_SAFE_INTEGER, LOGIN_WINDOW);
      // 5 échecs en 15 min : blocage de 15 min à partir de maintenant.
      if (this.d.limiter.count(failKey, LOGIN_WINDOW) >= LOGIN_FAILS) this.d.limiter.hit(`login:lock:${body.identifier}`, Number.MAX_SAFE_INTEGER, LOGIN_WINDOW);
      throw new AppError(401, 'invalid_credentials', 'Identifiant ou mot de passe incorrect.');
    }
    if (u.status !== 'active') throw new AppError(403, 'account_suspended', 'Ce compte est suspendu.');
    this.d.limiter.reset(failKey);
    return this.openSession(u, body.client, meta);
  }

  private async openSession(u: UserRow, client: string, meta: ReqMeta) {
    const admin = (await this.d.db.query('SELECT 1 FROM admin_roles WHERE user_id = $1', [u.id])).length > 0;
    const token = newToken();
    const now = this.now();
    const expiresAt = new Date(now.getTime() + (admin ? ADMIN_SESSION_HOURS * HOUR : SESSION_DAYS * DAY));
    await this.d.db.query('INSERT INTO sessions(id, user_id, token_hash, kind, ip, user_agent, created_at, expires_at, last_used_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$7)',
      [newId(), u.id, hashToken(token), client, meta.ip, meta.userAgent?.slice(0, 300) ?? null, now, expiresAt]);
    await this.d.db.query('UPDATE users SET last_login_at = $2 WHERE id = $1', [u.id, now]);
    return { token, expiresAt, admin, user: await this.toDto(u) };
  }

  // ---------- Connexion Google ----------
  /** Connecte (ou crée) le compte correspondant au profil Google. L'e-mail doit être vérifié par Google. */
  async googleLogin(g: GoogleProfile, meta: ReqMeta) {
    this.limit(`google:ip:${meta.ip}`, 30, LOGIN_WINDOW);
    if (!g.emailVerified) throw new AppError(403, 'google_email_unverified', 'Votre adresse Google n\'est pas vérifiée.');
    const db = this.d.db;
    let u = (await db.query<UserRow>('SELECT * FROM users WHERE google_sub = $1', [g.sub]))[0];
    if (!u) {
      u = (await db.query<UserRow>('SELECT * FROM users WHERE email = $1', [g.email]))[0];
      if (u) {
        await db.query('UPDATE users SET google_sub = $2, email_verified_at = COALESCE(email_verified_at, now()), updated_at = now() WHERE id = $1', [u.id, g.sub]);
      } else {
        const id = newId();
        await db.query("INSERT INTO users(id, email, email_verified_at, google_sub, first_name, last_name, locale) VALUES ($1,$2,now(),$3,$4,$5,'fr')", [id, g.email, g.sub, g.firstName.slice(0, 80), g.lastName.slice(0, 80)]);
        u = (await db.query<UserRow>('SELECT * FROM users WHERE id = $1', [id]))[0]!;
      }
    }
    if (u.status !== 'active') throw new AppError(403, 'account_suspended', 'Ce compte est suspendu.');
    return this.openSession(u, 'web', meta);
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
    if (u.email) await this.d.mailer.send(tpl.verifyEmail(asLocale(u.locale), u.email, `${publicUrl(this.d.config)}/verifier-email?token=${token}`));
  }

  // ---------- Mot de passe ----------
  async forgotPassword(identifier: string, meta: ReqMeta): Promise<void> {
    this.limit(`forgot:ip:${meta.ip}`, 10, HOUR);
    this.limit(`forgot:id:${identifier}`, 3, HOUR);
    const byEmail = identifier.includes('@');
    const u = (await this.d.db.query<UserRow>(byEmail ? 'SELECT * FROM users WHERE email = $1' : 'SELECT * FROM users WHERE phone = $1 AND (email IS NULL OR phone_verified_at IS NOT NULL)', [identifier]))[0];
    if (!u || u.status !== 'active') return;
    if (byEmail) {
      const token = await this.issueToken(u.id, 'reset_password', HOUR);
      await this.d.mailer.send(tpl.resetPassword(asLocale(u.locale), u.email!, `${publicUrl(this.d.config)}/reinitialiser-mot-de-passe?token=${token}`));
      return;
    }
    // Compte identifié par son numéro : le code part sur ce numéro (WhatsApp de préférence).
    const av = this.d.messenger?.available();
    const channel: Channel | null = av?.whatsapp ? 'whatsapp' : av?.sms ? 'sms' : null;
    if (!channel) return;
    try { await this.d.messenger!.sendCode(channel, u.phone!, await this.issueCode(u.id, 'reset_phone'), u.locale); } catch { /* réponse identique */ }
  }

  async resetPasswordByPhone(phone: string, code: string, password: string): Promise<void> {
    this.limit(`resetphone:id:${phone}`, 10, HOUR);
    const u = (await this.d.db.query<UserRow>('SELECT * FROM users WHERE phone = $1 AND (email IS NULL OR phone_verified_at IS NOT NULL)', [phone]))[0];
    if (!u || u.status !== 'active') throw new AppError(400, 'invalid_code', 'Code invalide ou expiré.');
    const problem = checkPassword(password, u.email ?? u.phone ?? '');
    if (problem) throw new AppError(400, `weak_password_${problem}`, 'Mot de passe trop faible.');
    await this.checkCode(u.id, 'reset_phone', code);
    const now = this.now();
    await this.d.db.query('UPDATE users SET password_hash = $2, phone_verified_at = COALESCE(phone_verified_at, $3), updated_at = $3 WHERE id = $1', [u.id, await hashPassword(password), now]);
    await this.d.db.query('UPDATE sessions SET revoked_at = $2 WHERE user_id = $1 AND revoked_at IS NULL', [u.id, now]);
  }

  // ---------- Vérification facultative du compte (e-mail, SMS ou WhatsApp) ----------
  channels() {
    const av = this.d.messenger?.available() ?? { sms: false, whatsapp: false };
    return { email: !!this.d.config.SMTP_URL || this.d.config.NODE_ENV === 'test', sms: av.sms, whatsapp: av.whatsapp, google: !!this.d.google };
  }

  private async issueCode(userId: string, purpose: 'verify_phone' | 'reset_phone'): Promise<string> {
    await this.d.db.query('UPDATE one_time_tokens SET used_at = $3 WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL', [userId, purpose, this.now()]);
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.d.db.query('INSERT INTO one_time_tokens(id, user_id, purpose, token_hash, expires_at) VALUES ($1,$2,$3,$4,$5)',
      [newId(), userId, purpose, hashToken(`${userId}:${purpose}:${code}`), new Date(this.now().getTime() + 10 * MIN)]);
    return code;
  }

  private async checkCode(userId: string, purpose: 'verify_phone' | 'reset_phone', code: string): Promise<void> {
    const row = (await this.d.db.query<{ id: string; token_hash: string; expires_at: Date; attempts: number }>(
      'SELECT id, token_hash, expires_at, attempts FROM one_time_tokens WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL ORDER BY expires_at DESC LIMIT 1', [userId, purpose]))[0];
    if (!row || new Date(row.expires_at).getTime() <= this.now().getTime()) throw new AppError(400, 'invalid_code', 'Code invalide ou expiré.');
    if (row.attempts >= 5) throw new AppError(429, 'too_many_requests', 'Trop de tentatives. Demandez un nouveau code.');
    if (row.token_hash !== hashToken(`${userId}:${purpose}:${code}`)) {
      await this.d.db.query('UPDATE one_time_tokens SET attempts = attempts + 1 WHERE id = $1', [row.id]);
      throw new AppError(400, 'invalid_code', 'Code invalide ou expiré.');
    }
    const claimed = await this.d.db.query('UPDATE one_time_tokens SET used_at = $2 WHERE id = $1 AND used_at IS NULL RETURNING id', [row.id, this.now()]);
    if (!claimed[0]) throw new AppError(400, 'invalid_code', 'Code invalide ou expiré.');
  }

  /** Envoie le lien (e-mail) ou le code (SMS / WhatsApp) de vérification. Facultatif : rien n'est bloqué tant que le compte n'est pas vérifié. */
  async startVerification(user: UserRow, channel: 'email' | 'sms' | 'whatsapp'): Promise<void> {
    this.limit(`verify:user:${user.id}`, 6, HOUR);
    if (channel === 'email') {
      if (!user.email) throw new AppError(400, 'no_email', 'Aucune adresse e-mail sur ce compte.');
      if (user.email_verified_at) throw new AppError(409, 'already_verified', 'Cette adresse est déjà vérifiée.');
      const token = await this.issueToken(user.id, 'verify_email', DAY);
      try { await this.d.mailer.send(tpl.verifyEmail(asLocale(user.locale), user.email, `${publicUrl(this.d.config)}/verifier-email?token=${token}`)); } catch { throw new AppError(502, 'send_failed', "Envoi impossible pour le moment."); }
      return;
    }
    if (!user.phone) throw new AppError(400, 'no_phone', 'Aucun numéro de téléphone sur ce compte.');
    if (user.phone_verified_at) throw new AppError(409, 'already_verified', 'Ce numéro est déjà vérifié.');
    if (!this.d.messenger?.available()[channel]) throw new AppError(503, 'channel_unavailable', 'Ce canal n’est pas disponible pour le moment.');
    const code = await this.issueCode(user.id, 'verify_phone');
    try { await this.d.messenger.sendCode(channel, user.phone, code, user.locale); } catch { throw new AppError(502, 'send_failed', "Envoi impossible pour le moment."); }
  }

  async confirmPhone(user: UserRow, code: string): Promise<UserDto> {
    this.limit(`verifycode:user:${user.id}`, 20, HOUR);
    await this.checkCode(user.id, 'verify_phone', code);
    try {
      await this.d.db.query('UPDATE users SET phone_verified_at = $2, updated_at = $2 WHERE id = $1', [user.id, this.now()]);
    } catch (e) {
      if ((e as { code?: string }).code === '23505') throw new AppError(409, 'phone_taken', 'Ce numéro est déjà associé à un autre compte.');
      throw e;
    }
    return this.toDto((await this.d.db.query<UserRow>('SELECT * FROM users WHERE id = $1', [user.id]))[0]!);
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const hash = hashToken(token);
    const peek = (await this.d.db.query<{ email: string | null }>(
      `SELECT u.email FROM one_time_tokens t JOIN users u ON u.id = t.user_id WHERE t.token_hash = $1 AND t.purpose = 'reset_password'`, [hash]))[0];
    if (peek) {
      const problem = checkPassword(password, peek.email ?? '');
      if (problem) throw new AppError(400, `weak_password_${problem}`, 'Mot de passe trop faible.');
    }
    const userId = await this.consume(token, 'reset_password');
    const u = (await this.d.db.query<UserRow>('SELECT * FROM users WHERE id = $1', [userId]))[0]!;
    const now = this.now();
    await this.d.db.query('UPDATE users SET password_hash = $2, email_verified_at = COALESCE(email_verified_at, $3), updated_at = $3 WHERE id = $1', [userId, await hashPassword(password), now]);
    await this.d.db.query('UPDATE sessions SET revoked_at = $2 WHERE user_id = $1 AND revoked_at IS NULL', [userId, now]);
    if (u.email) await this.d.mailer.send(tpl.passwordChanged(asLocale(u.locale), u.email));
  }

  async changePassword(user: UserRow, sessionId: string, oldPassword: string, newPassword: string): Promise<void> {
    this.limit(`chgpwd:user:${user.id}`, 10, HOUR);
    if (!user.password_hash || !(await verifyPassword(user.password_hash, oldPassword))) throw new AppError(400, 'wrong_password', 'Ancien mot de passe incorrect.');
    const problem = checkPassword(newPassword, user.email ?? user.phone ?? '');
    if (problem) throw new AppError(400, `weak_password_${problem}`, 'Mot de passe trop faible.');
    const now = this.now();
    await this.d.db.query('UPDATE users SET password_hash = $2, updated_at = $3 WHERE id = $1', [user.id, await hashPassword(newPassword), now]);
    await this.d.db.query('UPDATE sessions SET revoked_at = $3 WHERE user_id = $1 AND id <> $2 AND revoked_at IS NULL', [user.id, sessionId, now]);
    if (user.email) await this.d.mailer.send(tpl.passwordChanged(asLocale(user.locale), user.email));
  }

  // ---------- Profil et appareils ----------
  async updateProfile(user: UserRow, patch: { firstName?: string; lastName?: string; phone?: string; countryCode?: string; citySlug?: string | null; locale?: 'fr' | 'en' | 'sw' | 'zh' | 'es' }): Promise<UserDto> {
    const country = patch.countryCode ?? user.country_code ?? 'CD';
    if (patch.countryCode && !(await this.d.db.query('SELECT 1 FROM countries WHERE code = $1 AND active', [patch.countryCode]))[0]) {
      throw new AppError(400, 'country_not_supported', 'Pays non disponible.');
    }
    const city = patch.citySlug === undefined ? user.city_id : await this.cityId(country, patch.citySlug);
    await this.d.db.query(
      `UPDATE users SET first_name = $2, last_name = $3, phone = $4::varchar, country_code = $5, city_id = $6, locale = $7, updated_at = $8, phone_verified_at = CASE WHEN phone IS DISTINCT FROM $4::varchar THEN NULL ELSE phone_verified_at END WHERE id = $1`,
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
