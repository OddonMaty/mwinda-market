import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Db } from './client.js';

/** Applique les migrations SQL (dossiers NNNN_nom/migration.sql) pas encore enregistrées. */
export async function migrate(db: Db, dir: string): Promise<string[]> {
  await db.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
  const done = new Set((await db.query<{ name: string }>('SELECT name FROM schema_migrations')).map((r) => r.name));
  const applied: string[] = [];
  const names = readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(join(dir, d.name, 'migration.sql'))).map((d) => d.name).sort();
  for (const name of names) {
    if (done.has(name)) continue;
    const sql = readFileSync(join(dir, name, 'migration.sql'), 'utf8');
    await db.transaction(async (tx) => {
      await tx.exec(sql);
      await tx.query('INSERT INTO schema_migrations(name) VALUES ($1)', [name]);
    });
    applied.push(name);
  }
  return applied;
}
