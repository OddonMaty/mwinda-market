import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { createPgliteDb, type Db } from './db/client.js';
import { migrate } from './db/migrate.js';
import { TranslateService, chunkText } from './services/translate.js';

let db: Db;
before(async () => { db = createPgliteDb(new PGlite()); await migrate(db, fileURLToPath(new URL('../migrations', import.meta.url))); });
after(async () => { await db.close(); });

const mm = (calls: string[]): typeof fetch => (async (url: string | URL | Request) => {
  const u = new URL(String(url)); calls.push(u.searchParams.get('q') ?? '');
  return new Response(JSON.stringify({ responseStatus: 200, responseData: { translatedText: `EN(${u.searchParams.get('q')})` } }), { status: 200 });
}) as typeof fetch;

describe('Traduction automatique', () => {
  it('traduit, met en cache en base et en mémoire, sans rappeler le service', async () => {
    const calls: string[] = [];
    const svc = new TranslateService(db, {}, mm(calls));
    assert.deepEqual(await svc.translate('en', ['  Casque   audio ']), ['EN(Casque audio)']);
    assert.deepEqual(await new TranslateService(db, {}, mm(calls)).translate('en', ['Casque audio']), ['EN(Casque audio)']);
    assert.equal(calls.length, 1);
    assert.equal((await db.query('SELECT 1 FROM translations')).length, 1);
  });
  it('service en panne : null, rien n’est mis en cache', async () => {
    const svc = new TranslateService(db, {}, (async () => { throw new Error('down'); }) as typeof fetch);
    assert.deepEqual(await svc.translate('sw', ['Bonjour le monde']), [null]);
    assert.equal((await db.query("SELECT 1 FROM translations WHERE lang = 'sw'")).length, 0);
  });
  it('Google : un seul appel pour plusieurs textes, chinois = zh-CN', async () => {
    let body: { q: string[]; target: string } | undefined;
    const f = (async (_u: string | URL | Request, init?: RequestInit) => { body = JSON.parse(String(init?.body)); return new Response(JSON.stringify({ data: { translations: body!.q.map((q) => ({ translatedText: `ZH:${q}` })) } }), { status: 200 }); }) as typeof fetch;
    const out = await new TranslateService(db, { GOOGLE_TRANSLATE_API_KEY: 'k' }, f).translate('zh', ['Chaussures', 'Sac à dos']);
    assert.deepEqual(out, ['ZH:Chaussures', 'ZH:Sac à dos']);
    assert.equal(body?.target, 'zh-CN');
  });
  it('découpe les longs textes', () => {
    const parts = chunkText('Phrase une. '.repeat(80), 450);
    assert.ok(parts.length > 1 && parts.every((p) => p.length <= 450));
  });
});
