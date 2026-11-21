/**
 * Serveur de test bout en bout : base PGlite en mémoire + courrier en mémoire.
 * Jamais utilisé en production. Expose GET /__mail/last?to=… pour lire le dernier courrier (jeton de vérification).
 */
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { buildApp } from './app.js';
import { getConfig } from './config/env.js';
import { createPgliteDb } from './db/client.js';
import { migrate } from './db/migrate.js';
import { MemoryMailer } from './mail/mailer.js';

process.env.DATABASE_URL ??= 'pglite://memory';
process.env.API_SECRET ??= 'e2e-secret-e2e-secret-e2e-secret';
process.env.WEB_ORIGIN ??= 'http://localhost:3000';
process.env.NODE_ENV = 'development';

const config = getConfig();
const db = createPgliteDb(new PGlite());
await migrate(db, fileURLToPath(new URL('../migrations', import.meta.url)));
const mailer = new MemoryMailer();
const app = await buildApp(config, { db, mailer });
app.get('/__mail/last', async (req) => {
  const to = (req.query as { to?: string }).to;
  return { mail: mailer.last(to) ?? null };
});
app.get('/__make-admin', async (req) => {
  const email = (req.query as { email?: string }).email ?? '';
  await db.query("INSERT INTO admin_roles(user_id, role) SELECT id, 'superadmin' FROM users WHERE email = $1 ON CONFLICT DO NOTHING", [email]);
  return { ok: true };
});
app.get('/__approve-shops', async () => { await db.query("UPDATE shops SET status = 'active' WHERE status = 'pending'"); return { ok: true }; });
await app.listen({ port: config.PORT, host: '127.0.0.1' });
console.log(`e2e api on ${config.PORT}`);
