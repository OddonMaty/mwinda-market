// Point d'entrée Vercel (fonction serverless) : lance Fastify une fois par instance chaude.
import { getConfig } from '../dist/config/env.js';
import { buildApp } from '../dist/app.js';
import { createPgDb } from '../dist/db/client.js';
import { SmtpMailer, NoopMailer } from '../dist/mail/mailer.js';

let ready;
function init() {
  const config = getConfig();
  const db = createPgDb(config.DATABASE_URL);
  const mailer = config.SMTP_URL ? new SmtpMailer(config.SMTP_URL, config.MAIL_FROM) : new NoopMailer();
  return buildApp(config, { db, mailer }).then(async (app) => { await app.ready(); return app; });
}

export default async function handler(req, res) {
  ready ??= init().catch((e) => { ready = undefined; throw e; });
  const app = await ready;
  app.server.emit('request', req, res);
}
