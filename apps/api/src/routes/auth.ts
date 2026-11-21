import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import { z, ZodError } from 'zod';
import {
  ChangePasswordBodySchema, EmailBodySchema, LoginBodySchema, RegisterBodySchema, ResetPasswordBodySchema, TokenBodySchema, UpdateProfileBodySchema,
} from '@saotech/shared';
import { AppError } from '../errors.js';
import { isAllowedOrigin } from '../config/env.js';
import { AuthService, publicUrl, type AuthDeps, type UserRow } from '../services/auth.js';
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
      await svc.forgotPassword(parse(EmailBodySchema, req.body).email, meta(req));
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
    const commerce = new CommerceService(deps.db);
    const admin = new AdminService(deps.db, commerce, { mailer: deps.mailer, baseUrl: publicUrl(deps.config) });
    commerceRoutes(r, { svc: commerce, authenticate, parse });
    publicPlatformRoutes(r, admin, parse);
    adminRoutes(r, { svc: admin, authenticate, parse });
  }, { prefix: '/v1' });
}
