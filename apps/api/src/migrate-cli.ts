/** Applique les migrations sur la base indiquée par DATABASE_URL : `pnpm --filter @saotech/api migrate`. */
import { fileURLToPath } from 'node:url';
import { createPgDb } from './db/client.js';
import { migrate } from './db/migrate.js';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL manquant');
const db = createPgDb(url);
const applied = await migrate(db, fileURLToPath(new URL('../migrations', import.meta.url)));
console.log(applied.length ? `Migrations appliquées : ${applied.join(', ')}` : 'Base déjà à jour.');
await db.close();
