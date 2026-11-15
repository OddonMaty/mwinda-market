import type { PGlite } from '@electric-sql/pglite';
import pg from 'pg';

/** Interface minimale de base de données (PostgreSQL) : Neon/pg en production, PGlite en test. */
export interface Db {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  /** Exécute un script SQL de plusieurs instructions (migrations). */
  exec(sql: string): Promise<void>;
  transaction<R>(fn: (tx: Db) => Promise<R>): Promise<R>;
  close(): Promise<void>;
}

export function createPgDb(connectionString: string): Db {
  const pool = new pg.Pool({ connectionString, max: 5 });
  const wrap = (q: { query: (s: string, p?: unknown[]) => Promise<{ rows: unknown[] }> }, tx = false): Db => ({
    async query<T>(sql: string, params: unknown[] = []) {
      return (await q.query(sql, params)).rows as T[];
    },
    async exec(sql: string) {
      await q.query(sql);
    },
    async transaction<R>(fn: (t: Db) => Promise<R>): Promise<R> {
      if (tx) return fn(this);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const r = await fn(wrap(client, true));
        await client.query('COMMIT');
        return r;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    },
    close: () => (tx ? Promise.resolve() : pool.end()),
  });
  return wrap(pool);
}

export function createPgliteDb(lite: PGlite): Db {
  const wrap = (q: { query: PGlite['query']; exec: PGlite['exec'] }, tx = false): Db => ({
    async query<T>(sql: string, params: unknown[] = []) {
      return (await q.query<T>(sql, params)).rows;
    },
    async exec(sql: string) {
      await q.exec(sql);
    },
    async transaction<R>(fn: (t: Db) => Promise<R>): Promise<R> {
      if (tx) return fn(this);
      return lite.transaction((t) => fn(wrap(t as unknown as { query: PGlite['query']; exec: PGlite['exec'] }, true)));
    },
    close: () => (tx ? Promise.resolve() : lite.close()),
  });
  return wrap(lite);
}
