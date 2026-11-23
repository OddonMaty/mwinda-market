import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import { z, ZodError } from 'zod';
import {
  ChangePasswordBodySchema, EmailBodySchema, ForgotBodySchema, LoginBodySchema, ResetPhoneBodySchema, VerifyConfirmBodySchema, VerifyStartBodySchema, RegisterBodySchema, ResetPasswordBodySchema, TokenBodySchema, UpdateProfileBodySchema,
} from '@saotech/shared';
import { AppError } from '../errors.js';
import { isAllowedOrigin } from '../config/env.js';
import { AuthService, publicUrl, type AuthDeps, type UserRow } from '../services/auth.js';
import { randomBytes } from 'node:crypto';
import { newPkce } from '../services/google.js';
import { Notifier } from '../services/notify.js';
import { CommerceService } from '../services/commerce.js';
import { commerceRoutes } from './commerce.js';
import { adminRoutes, publicPlatformRoutes } from './admin.js';
import { AdminService } from '../services/admin.js';

export const SESSION_COOKIE = 'stm_session';

declare module 'fastify' {
  interface FastifyRequest {
    auth?: { sessionId: string; user: UserRow; expiresAt: Date };
  }
}

const OK = { ok: true } as const;

function parse<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (e) {
    if (e instanceof ZodError) throw new AppError(400, 'validation_error', e.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
    throw e;
  }
}

export async function authRoutes(app: FastifyInstance, deps: AuthDeps): Promise<void> {
  const svc = new AuthService(deps);
  const secure = deps.config.NODE_ENV === 'production';
  await app.register(fastifyCookie);

  const meta = (req: FastifyRequest) => ({ ip: req.ip, userAgent: req.headers['user-agent'] });
  const bearer = (req: FastifyRequest) => {
    const h = req.headers.authorization;
    return h?.startsWith('Bearer ') ? h.slice(7).trim() : undefined;
  };

  // Protection CSRF : toute requête qui modifie des données et passe par un cookie doit venir du site autorisé.
  app.addHook('onRequest', async (req) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || bearer(req)) return;
    const origin = req.headers.origin;
    const hasCookie = !!req.cookies?.[SESSION_COOKIE] || (req.headers.cookie ?? '').includes(`${SESSION_COOKIE}=`);
    if (origin ? !isAllowedOrigin(deps.config, origin) : hasCookie) throw new AppError(403, 'csrf_rejected', 'Origine non autorisée.');
  });

  const authenticate = async (req: FastifyRequest) => {
    const token = bearer(req) ?? req.cookies?.[SESSION_COOKIE];
    const r = await svc.resolve(token);
    if (!r) throw new AppError(401, 'unauthenticated', 'Connexion requise.');
    req.auth = r;
  };

  const setCookie = (reply: FastifyReply, token: string, expiresAt: Date, admin: boolean) =>
    reply.setCookie(SESSION_COOKIE, token, { httpOnly: true, secure, sameSite: 'lax', path: '/', ...(admin ? {} : { expires: expiresAt }) });

  await app.register(async (r) => {
    r.post('/auth/register', async (req) => {
      await svc.register(parse(RegisterBodySchema, req.body), meta(req));
      return OK; // réponse identique que le compte existe ou non
    });

    r.post('/auth/login', async (req, reply) => {
      const body = parse(LoginBodySchema, req.body);
      const s = await svc.login(body, meta(req));
      if (body.client === 'web') {
        setCookie(reply, s.token, s.expiresAt, s.admin);
        return { user: s.user };
      }
      return { user: s.user, token: s.token, expiresAt: s.expiresAt };
    });

    r.get('/auth/providers', async () => ({ google: !!deps.google }));
    r.get('/auth/channels', async () => svc.channels());
    r.post('/auth/verify/start', { preHandler: authenticate }, async (req) => { await svc.startVerification(req.auth!.user, parse(VerifyStartBodySchema, req.body).channel); return OK; });
    r.post('/auth/verify/confirm', { preHandler: authenticate }, async (req) => ({ user: await svc.confirmPhone(req.auth!.user, parse(VerifyConfirmBodySchema, req.body).code) }));
    r.post('/auth/reset-password-phone', async (req) => { const b = parse(ResetPhoneBodySchema, req.body); await svc.resetPasswordByPhone(b.phone, b.code, b.password); return OK; });

    // Connexion Google : /start redirige vers Google, /callback ouvre la session puis renvoie vers le site.
    const GCOOKIE = 'stm_oauth';
    r.get('/auth/google/start', async (req, reply) => {
      if (!deps.google) throw new AppError(404, 'not_found', 'Connexion Google indisponible.');
      const { next } = parse(z.object({ next: z.string().max(200).optional() }), req.query);
      const pk = newPkce();
      const state = randomBytes(16).toString('base64url');
      const dest = next && /^\/(?!\/)[\w\-/.?=&%]*$/.test(next) ? next : '/compte';
      reply.setCookie(GCOOKIE, `${state}.${pk.verifier}.${Buffer.from(dest).toString('base64url')}`, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 600 });
      return reply.redirect(deps.google.authUrl(state, pk.challenge), 302);
    });
    r.get('/auth/google/callback', async (req, reply) => {
      const fail = (why: string) => { reply.clearCookie(GCOOKIE, { path: '/' }); return reply.redirect(`/?google=${why}`, 302); };
      if (!deps.google) return fail('erreur');
      const q = parse(z.object({ code: z.string().max(2000).optional(), state: z.string().max(200).optional(), error: z.string().max(100).optional() }), req.query);
      const [state, verifier, dest64] = (req.cookies?.[GCOOKIE] ?? '').split('.');
      if (q.error || !q.code || !state || !verifier || q.state !== state) return fail(q.error === 'access_denied' ? 'annule' : 'erreur');
      try {
        const profile = await deps.google.exchange(q.code, verifier);
        const s = await svc.googleLogin(profile, meta(req));
        setCookie(reply, s.token, s.expiresAt, s.admin);
        reply.clearCookie(GCOOKIE, { path: '/' });
        const dest = dest64 ? Buffer.from(dest64, 'base64url').toString() : '/compte';
        return reply.redirect(dest.startsWith('/') && !dest.startsWith('//') ? dest : '/compte', 302);
      } catch (e) {
        return fail(e instanceof AppError && e.code === 'account_suspended' ? 'suspendu' : 'erreur');
      }
    });

    r.post('/auth/logout', { preHandler: authenticate }, async (req, reply) => {
      await svc.logout(req.auth!.sessionId);
      reply.clearCookie(SESSION_COOKIE, { path: '/' });
      return OK;
    });

    r.get('/auth/me', { preHandler: authenticate }, async (req) => ({ user: await svc.toDto(req.auth!.user), sessionExpiresAt: req.auth!.expiresAt }));

    r.post('/auth/verify-email', async (req) => {
      await svc.verifyEmail(parse(TokenBodySchema, req.body).token);
      return OK;
    });
    r.post('/auth/resend-verification', async (req) => {
      await svc.resendVerification(parse(EmailBodySchema, req.body).email, meta(req));
      return OK;
    });
    r.post('/auth/forgot-password', async (req) => {
      await svc.forgotPassword(parse(ForgotBodySchema, req.body).identifier, meta(req));
      return OK;
    });
    r.post('/auth/reset-password', async (req) => {
      const b = parse(ResetPasswordBodySchema, req.body);
      await svc.resetPassword(b.token, b.password);
      return OK;
    });
    r.post('/auth/change-password', { preHandler: authenticate }, async (req) => {
      const b = parse(ChangePasswordBodySchema, req.body);
      await svc.changePassword(req.auth!.user, req.auth!.sessionId, b.oldPassword, b.newPassword);
      return OK;
    });

    r.patch('/me', { preHandler: authenticate }, async (req) => ({ user: await svc.updateProfile(req.auth!.user, parse(UpdateProfileBodySchema, req.body)) }));
    r.get('/me/sessions', { preHandler: authenticate }, async (req) => ({ sessions: await svc.listSessions(req.auth!.user.id, req.auth!.sessionId) }));
    r.delete('/me/sessions/:id', { preHandler: authenticate }, async (req) => {
      await svc.revokeSession(req.auth!.user.id, parse(z.object({ id: z.string().length(26) }), req.params).id);
      return OK;
    });
    const notify = new Notifier(deps.db, deps.mailer, publicUrl(deps.config), deps.messenger);
    const commerce = new CommerceService(deps.db, deps.store, notify);
    const admin = new AdminService(deps.db, commerce, { mailer: deps.mailer, baseUrl: publicUrl(deps.config) }, notify);
    commerceRoutes(r, { svc: commerce, authenticate, parse });
    publicPlatformRoutes(r, admin, parse);
    adminRoutes(r, { svc: admin, authenticate, parse });
  }, { prefix: '/v1' });
}
