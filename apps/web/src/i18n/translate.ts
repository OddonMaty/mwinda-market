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

/** Le texte source est le français : une phrase sans traduction reste en français. */
export function tr(lang: Lang, text: string): string {
  if (lang === 'fr') return text;
  return DICT[lang][text] ?? text;
}

/** Langue du navigateur parmi les cinq prises en charge (français par défaut). */
export function detectLang(navigatorLang: string | undefined): Lang {
  const base = (navigatorLang ?? '').slice(0, 2).toLowerCase();
  return isLang(base) ? base : 'fr';
}
