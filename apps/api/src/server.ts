import { getConfig } from './config/env.js';
import { buildApp } from './app.js';
import { createPgDb } from './db/client.js';
import { migrate } from './db/migrate.js';
import { SmtpMailer, NoopMailer } from './mail/mailer.js';
import { VercelBlobStore } from './services/storage.js';
import { fileURLToPath } from 'node:url';

async function main(): Promise<void> {
  const config = getConfig();
  const db = createPgDb(config.DATABASE_URL);
  if (config.NODE_ENV !== 'production') await migrate(db, fileURLToPath(new URL('../migrations', import.meta.url)));
  const mailer = config.SMTP_URL ? new SmtpMailer(config.SMTP_URL, config.MAIL_FROM) : new NoopMailer();
  const store = config.BLOB_READ_WRITE_TOKEN ? new VercelBlobStore(config.BLOB_READ_WRITE_TOKEN) : undefined;
  const app = await buildApp(config, { db, mailer, store });

  try {
    const address = await app.listen({
      port: config.PORT,
      host: config.HOST,
    });
    app.log.info({ address }, `Server running at ${address}`);
  } catch (err) {
    app.log.error(err, 'Failed to start server');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

