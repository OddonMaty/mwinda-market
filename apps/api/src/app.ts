import type { GoogleOAuth } from './services/google.js';
import type { ImageStore } from './services/storage.js';
import fastify, { type FastifyInstance, type FastifyError } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import type { EnvConfig } from './config/env.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import type { Db } from './db/client.js';
import type { Mailer } from './mail/mailer.js';
import { MemoryRateLimiter, type RateLimiter } from './lib/ratelimit.js';
import { NoopMailer } from './mail/mailer.js';
import { isAllowedOrigin } from './config/env.js';

export interface AppDeps {
  db?: Db;
  mailer?: Mailer;
  limiter?: RateLimiter;
  now?: () => Date;
  store?: ImageStore;
  google?: GoogleOAuth;
}

export async function buildApp(config: EnvConfig, deps: AppDeps = {}): Promise<FastifyInstance> {
  const isDev = config.NODE_ENV === 'development';

  const app = fastify({
    logger: {
      level: config.NODE_ENV === 'test' ? 'silent' : isDev ? 'debug' : 'info',
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["set-cookie"]',
          '*.password',
          '*.password_hash',
          '*.token',
          '*.secret',
          '*.key',
        ],
        censor: '[REDACTED]',
      },
    },
    trustProxy: true,
  });

  // Security headers
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: config.NODE_ENV === 'production',
  });

  // CORS limited to configured web origin
  await app.register(fastifyCors, {
    origin: (origin, cb) => cb(null, !origin || isAllowedOrigin(config, origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Global rate limit
  await app.register(fastifyRateLimit, {
    max: 600, // beaucoup d'utilisateurs partagent la même adresse IP (réseaux mobiles) : limite large, les routes sensibles ont leurs propres limites
    timeWindow: '1 minute',
  });

  // Unique global error handler
  app.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode =
      typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 600
        ? error.statusCode
        : 500;

    const code =
      typeof error.code === 'string' && error.code !== ''
        ? error.code
        : statusCode === 500
        ? 'INTERNAL_SERVER_ERROR'
        : statusCode === 429
        ? 'too_many_requests'
        : 'BAD_REQUEST';

    const message =
      statusCode === 500 && config.NODE_ENV === 'production'
        ? 'Une erreur interne est survenue.'
        : error.message || 'Une erreur est survenue.';

    request.log.error(
      {
        err: {
          name: error.name,
          message: error.message,
          stack: isDev ? error.stack : undefined,
        },
        statusCode,
        code,
      },
      'Request error caught by global error handler'
    );

    return reply.status(statusCode).send({
      error: {
        code,
        message,
      },
    });
  });

  // 404 handler
  app.setNotFoundHandler((request, reply) => {
    return reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
      },
    });
  });

  // Routes
  await app.register(healthRoutes);

  if (deps.db) {
    const authDeps = { db: deps.db, mailer: deps.mailer ?? new NoopMailer(), limiter: deps.limiter ?? new MemoryRateLimiter(), config, now: deps.now, store: deps.store, google: deps.google };
    await app.register((instance) => authRoutes(instance, authDeps));
  }

  return app;
}

