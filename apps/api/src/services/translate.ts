import { createHash } from 'node:crypto';
import type { Db } from '../db/client.js';

export const TARGETS = ['en', 'sw', 'zh', 'es'] as const;
export type Target = (typeof TARGETS)[number];
type FetchFn = typeof fetch;

export interface TranslateConfig { GOOGLE_TRANSLATE_API_KEY?: string; TRANSLATE_EMAIL?: string }

const hashOf = (text: string): string => createHash('sha1').update(text).digest('hex');
const clean = (s: string): string => s.replace(/\s+/g, ' ').trim();

/** Découpe un long texte en morceaux (fin de phrase de préférence) pour les services qui limitent la taille. */
export function chunkText(text: string, max: number): string[] {
  if (text.length <= max) return [text];
  const out: string[] = [];
  let cur = '';
  for (const part of text.split(/(?<=[.!?。])\s+/)) {
    if ((cur + ' ' + part).trim().length > max && cur) { out.push(cur.trim()); cur = ''; }
    let p = part;
    while (p.length > max) { const cut = p.lastIndexOf(' ', max); const at = cut > 0 ? cut : max; out.push(p.slice(0, at).trim()); p = p.slice(at); }
    cur = (cur + ' ' + p).trim();
  }
  if (cur) out.push(cur);
  return out;
}

/** Traduction automatique : Google Cloud Translation si une clé est fournie, sinon le service public MyMemory. Langue source détectée automatiquement. */
export class TranslateService {
  private memory = new Map<string, string>();
  constructor(private db: Db, private cfg: TranslateConfig = {}, private fetchFn: FetchFn = fetch) {}

  available(): boolean { return true; }

  private async google(texts: string[], lang: Target): Promise<(string | null)[]> {
    const res = await this.fetchFn(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(this.cfg.GOOGLE_TRANSLATE_API_KEY!)}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q: texts, target: lang === 'zh' ? 'zh-CN' : lang, format: 'text' }), signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`google ${res.status}`);
    const j = (await res.json()) as { data?: { translations?: { translatedText: string }[] } };
    return texts.map((_, i) => j.data?.translations?.[i]?.translatedText ?? null);
  }

  private async myMemoryOne(text: string, lang: Target): Promise<string | null> {
    const target = lang === 'zh' ? 'zh-CN' : lang;
    const email = this.cfg.TRANSLATE_EMAIL ? `&de=${encodeURIComponent(this.cfg.TRANSLATE_EMAIL)}` : '';
    const parts = chunkText(text, 450);
    const outs: string[] = [];
    for (const part of parts) {
      let done: string | null = null;
      for (const src of ['Autodetect', 'fr']) {
        const res = await this.fetchFn(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(part)}&langpair=${src}|${target}${email}`, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) continue;
        const j = (await res.json()) as { responseStatus?: number | string; responseData?: { translatedText?: string } };
        const t = j.responseData?.translatedText;
        if (Number(j.responseStatus) === 200 && t && !/MYMEMORY WARNING|INVALID/i.test(t)) { done = t; break; }
      }
      if (done === null) return null;
      outs.push(done);
    }
    return outs.join(' ');
  }

  private async provider(texts: string[], lang: Target): Promise<(string | null)[]> {
    if (this.cfg.GOOGLE_TRANSLATE_API_KEY) return this.google(texts, lang);
    const out: (string | null)[] = [];
    for (const t of texts) { try { out.push(await this.myMemoryOne(t, lang)); } catch { out.push(null); } }
    return out;
  }

  /** Renvoie, pour chaque texte, sa traduction (mise en cache) ou null si le service est indisponible. */
  async translate(lang: Target, texts: string[]): Promise<(string | null)[]> {
    const norm = texts.map(clean);
    const result: (string | null)[] = norm.map(() => null);
    const need: number[] = [];
    const hashes = norm.map(hashOf);
    norm.forEach((t, i) => { const m = this.memory.get(`${lang}:${hashes[i]}`); if (m !== undefined) result[i] = m; else if (t) need.push(i); });
    if (need.length) {
      const rows = await this.db.query<{ hash: string; target: string }>('SELECT hash, target FROM translations WHERE lang = $1 AND hash = ANY($2::text[])', [lang, need.map((i) => hashes[i])]);
      const byHash = new Map(rows.map((r) => [r.hash.trim(), r.target]));
      for (const i of [...need]) { const hit = byHash.get(hashes[i]!); if (hit !== undefined) { result[i] = hit; this.memory.set(`${lang}:${hashes[i]}`, hit); need.splice(need.indexOf(i), 1); } }
    }
    if (need.length) {
      let got: (string | null)[] = [];
      try { got = await this.provider(need.map((i) => norm[i]!), lang); } catch { got = []; }
      for (let k = 0; k < need.length; k++) {
        const i = need[k]!; const t = got[k];
        if (!t) continue;
        const target = clean(t);
        result[i] = target;
        this.memory.set(`${lang}:${hashes[i]}`, target);
        await this.db.query('INSERT INTO translations(hash, lang, source, target) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING', [hashes[i], lang, norm[i], target]).catch(() => undefined);
      }
    }
    return result;
  }
}
