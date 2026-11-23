'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { detectLang, isLang, LANGS, tr, type Lang } from '../i18n/translate';

const KEY = 'mwinda_lang';
/** Langue courante, lisible hors React (messages de notification). */
let current: Lang = 'fr';
export const trNow = (text: string): string => tr(current, text);

interface Ctx { lang: Lang; setLang: (l: Lang, persist?: boolean) => void; t: (text: string) => string }
const I18nContext = createContext<Ctx>({ lang: 'fr', setLang: () => {}, t: (s) => s });
export const useI18n = () => useContext(I18nContext);
export const useT = () => useContext(I18nContext).t;

/** Cinq langues : français (source), anglais, swahili, chinois, espagnol. Choix mémorisé dans le navigateur ; à défaut, langue du navigateur. */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr');
  const apply = useCallback((l: Lang) => { current = l; setLangState(l); document.documentElement.lang = l; }, []);
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(KEY); } catch { /* stockage indisponible */ }
    apply(isLang(saved) ? saved : detectLang(navigator.language));
  }, [apply]);
  const setLang = useCallback((l: Lang, persist = true) => {
    apply(l);
    if (persist) { try { localStorage.setItem(KEY, l); } catch { /* ignoré */ } }
  }, [apply]);
  const t = useCallback((text: string) => tr(lang, text), [lang]);
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

/** Texte traduisible utilisable aussi dans un composant serveur : <T>Accueil</T>. */
export function T({ children }: { children: string }) { return <>{useT()(children)}</>; }

/** Sélecteur de langue de la barre du haut. */
export function LanguageSelector() {
  const { lang, setLang } = useI18n();
  return (
    <label className="lang-select" title="Langue / Language">
      <i className="fas fa-language" aria-hidden="true" />
      <select aria-label="Langue" value={lang} onChange={(e) => { const l = e.target.value; if (isLang(l)) { setLang(l); void fetch('/api/v1/me', { method: 'PATCH', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ locale: l }) }).catch(() => {}); } }}>
        {LANGS.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
      </select>
    </label>
  );
}

/** Champ e-mail de la newsletter (le texte d'aide dépend de la langue). */
export function NewsletterField() { return <input type="email" placeholder={useT()('Votre adresse e-mail')} />; }
