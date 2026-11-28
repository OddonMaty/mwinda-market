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
/** Textes déjà produits par une traduction (dictionnaire ou machine) : on ne les renvoie jamais à la traduction automatique. */
const produced = new Set<string>();
export const markProduced = (text: string): void => { if (produced.size < 5000) produced.add(norm(text)); };
export const isProduced = (text: string): boolean => produced.has(norm(text));

export function tr(lang: Lang, text: string, ...args: (string | number)[]): string {
  const out = trCore(lang, text, ...args);
  if (lang !== 'fr' && out !== text) markProduced(out);
  return out;
}

function trCore(lang: Lang, text: string, ...args: (string | number)[]): string {
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

/** Vrai si le texte français fait partie du dictionnaire de la langue (donc déjà connu, inutile de le faire traduire par la machine). */
/** Sorties du dictionnaire pour la langue (« Open menu » est déjà de l'anglais, pas du français à traduire). */
const outputs = new Map<string, Set<string>>();
export function isDictOutput(lang: Lang, text: string): boolean {
  if (lang === 'fr') return false;
  let set = outputs.get(lang);
  if (!set) { set = new Set([...indexOf(lang as Exclude<Lang, 'fr'>).exact.values()].map(norm)); outputs.set(lang, set); }
  return set.has(norm(text));
}
export const hasEntry = (lang: Lang, text: string): boolean => lang !== 'fr' && indexOf(lang as Exclude<Lang, 'fr'>).exact.has(norm(text));

/** Un texte mérite-t-il une traduction automatique ? Écarte nombres, prix, adresses, sigles et noms de personnes. */
// Propriétés Unicode (\p{L}) absentes des vieux navigateurs Android : repli sur les lettres latines accentuées.
function rx(src: string, fallback: string, flags = ''): RegExp {
  try { return new RegExp(src, flags + 'u'); } catch { return new RegExp(fallback, flags); }
}
const HAS_WORD = rx('\\p{L}{3}', '[A-Za-z\\u00C0-\\u024F\\u0370-\\u1FFF\\u3040-\\u9FFF]{3}');
const LOOKS_NAME = rx("^(\\p{Lu}[\\p{Ll}'’-]+)( \\p{Lu}[\\p{Ll}'’-]+){0,2}$", "^([A-Z\\u00C0-\\u00DE][a-z\\u00DF-\\u00FF'’-]+)( [A-Z\\u00C0-\\u00DE][a-z\\u00DF-\\u00FF'’-]+){0,2}$");
export function worthMachine(core: string, ugc: boolean): boolean {
  if (core.length < 3 || core.length > 700 || core.includes('©')) return false;
  if (/^\d/.test(core) && core.length <= 24) return false; // dates, quantités, prix
  if (/^(Mwinda Market|Sao Tech Agency|Mwinda|WhatsApp|Facebook|Instagram|TikTok|Twitter|YouTube|LinkedIn|Mobile Money|M-Pesa|Airtel Money|Orange Money)$/i.test(core)) return false;
  if (!HAS_WORD.test(core)) return false;
  if (/^[\d\s.,:;%$€£¥+\-–—/()#*]+$/.test(core) || /@|https?:|www\./i.test(core)) return false;
  if (/^[A-Z0-9 .\-/]+$/.test(core) && core.length <= 6) return false;
  if (!ugc && !/\d/.test(core) && LOOKS_NAME.test(core)) return false; // ressemble à un nom de personne
  return true;
}

// ── Noms de pays : traduits via Intl, à partir du nom français stocké en base ──
const FR_ALIASES: Record<string, string> = { 'congo-brazzaville': 'CG', 'republique du congo': 'CG', 'rd congo': 'CD', 'rdc': 'CD', 'republique democratique du congo': 'CD', 'cote d ivoire': 'CI', 'sao tome-et-principe': 'ST' };
const flat = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ').toLowerCase().trim();
let nameToCode: Map<string, string> | null = null;
function codeOfName(name: string): string | null {
  if (!nameToCode) {
    nameToCode = new Map();
    try {
      const dn = new Intl.DisplayNames(['fr'], { type: 'region' });
      const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (const a of A) for (const b of A) { const code = a + b; const n = dn.of(code); if (n && n !== code) nameToCode.set(flat(n), code); }
    } catch { /* Intl indisponible */ }
    for (const [k, v] of Object.entries(FR_ALIASES)) nameToCode.set(k, v);
  }
  return nameToCode.get(flat(name)) ?? null;
}
const regionNames = new Map<string, Intl.DisplayNames | null>();
/** Nom de pays dans la langue choisie (à partir du code ISO, sinon du nom français). */
export function countryName(lang: Lang, name: string | null | undefined, code?: string | null): string {
  const fallback = name ?? code ?? '';
  if (lang === 'fr' || !fallback) return fallback;
  try {
    let dn = regionNames.get(lang);
    if (dn === undefined) { dn = new Intl.DisplayNames([lang === 'zh' ? 'zh-CN' : lang], { type: 'region' }); regionNames.set(lang, dn); }
    const c = (code ?? codeOfName(fallback))?.toUpperCase();
    const out = c && dn ? dn.of(c) : undefined;
    if (out && out !== c) { markProduced(out); return out; }
  } catch { /* garde le nom d'origine */ }
  return fallback;
}
