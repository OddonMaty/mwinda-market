import { LOCALES } from '@saotech/shared';
import { DICT } from './dict';

export type Lang = (typeof LOCALES)[number];
export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'sw', label: 'Kiswahili', short: 'SW' },
  { code: 'zh', label: '中文', short: '中文' },
  { code: 'es', label: 'Español', short: 'ES' },
];
export const isLang = (v: unknown): v is Lang => typeof v === 'string' && (LOCALES as readonly string[]).includes(v);

const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
type Index = { exact: Map<string, string>; patterns: { re: RegExp; to: string }[] };
const indexes = new Map<Lang, Index>();
function indexOf(lang: Exclude<Lang, 'fr'>): Index {
  let ix = indexes.get(lang);
  if (!ix) {
    ix = { exact: new Map(), patterns: [] };
    for (const [k, v] of Object.entries(DICT[lang])) {
      if (/\{\d\}/.test(k)) {
        // un « {n} » en tête de phrase ne capture qu'un mot (nombre, nom court) : évite d'avaler des phrases entières
        const rx = esc(norm(k)).replace(/^\\\{\d\\\}/, '(\\S+)').replace(/\\\{\d\\\}/g, '(.+?)');
        ix.patterns.push({ re: new RegExp('^' + rx + '$'), to: v });
      }
      else ix.exact.set(norm(k), v);
    }
    indexes.set(lang, ix);
  }
  return ix;
}

/** Le texte source est le français : une phrase sans traduction reste en français. Les modèles « {0} » reçoivent leurs valeurs en arguments ou depuis le texte déjà assemblé. */
export function tr(lang: Lang, text: string, ...args: (string | number)[]): string {
  const fill = (s: string) => s.replace(/\{(\d)\}/g, (_, i: string) => String(args[Number(i)] ?? ''));
  if (lang === 'fr') return fill(text);
  const ix = indexOf(lang);
  const key = norm(text);
  const hit = ix.exact.get(key) ?? DICT[lang][text];
  if (hit !== undefined) return fill(hit);
  if (args.length === 0) {
    for (const p of ix.patterns) { const m = p.re.exec(key); if (m) return p.to.replace(/\{(\d)\}/g, (_, i: string) => { const v = m[Number(i) + 1] ?? ''; return ix.exact.get(norm(v)) ?? v; }); }
  } else {
    const t = DICT[lang][text];
    if (t) return fill(t);
  }
  return fill(text);
}

/** Traduit un texte du document en gardant les espaces de début et de fin. */
export function trDom(lang: Lang, raw: string): string {
  const core = norm(raw);
  if (!core) return raw;
  const out = tr(lang, core);
  if (out === core) return raw;
  const lead = /^\s*/.exec(raw)![0];
  const tail = /\s*$/.exec(raw)![0];
  return lead + out + tail;
}

/** Locale de dates/nombres pour la langue choisie. */
export const dateLocale = (lang: Lang): string => ({ fr: 'fr-FR', en: 'en-GB', sw: 'sw-KE', zh: 'zh-CN', es: 'es-ES' } as const)[lang];

/** Langue du navigateur parmi les cinq prises en charge (français par défaut). */
export function detectLang(navigatorLang: string | undefined): Lang {
  const base = (navigatorLang ?? '').slice(0, 2).toLowerCase();
  return isLang(base) ? base : 'fr';
}
