'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { dateLocale, detectLang, hasEntry, isDictOutput, isLang, isProduced, LANGS, markProduced, tr, trDom, worthMachine, type Lang } from '../i18n/translate';

const KEY = 'mwinda_lang';
/** Langue courante, lisible hors React (messages de notification). */
let current: Lang = 'fr';
export const trNow = (text: string, ...args: (string | number)[]): string => tr(current, text, ...args);
/** Locale des dates selon la langue choisie (lisible hors React). */
export const nowLocale = (): string => dateLocale(current);

interface Ctx { lang: Lang; setLang: (l: Lang, persist?: boolean) => void; t: (text: string, ...args: (string | number)[]) => string }
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
  const t = useCallback((text: string, ...args: (string | number)[]) => tr(lang, text, ...args), [lang]);
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}<AutoTranslate lang={lang} /></I18nContext.Provider>;
}

const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const texts = new WeakMap<Node, { src: string; shown: string }>();
const attrs = new WeakMap<Element, Record<string, { src: string; shown: string }>>();
const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'TITLE']); // le titre de l'onglet est géré à part (doTitle)

/** Traductions automatiques déjà obtenues (contenus saisis par les boutiques, textes hors dictionnaire), par langue. */
const MT_KEY = (l: Lang) => `mwinda_mt_${l}`;
const mtCache = new Map<Lang, Map<string, string>>();
function mtFor(lang: Lang): Map<string, string> {
  let m = mtCache.get(lang);
  if (!m) {
    m = new Map();
    try { for (const [k, v] of JSON.parse(localStorage.getItem(MT_KEY(lang)) ?? '[]') as [string, string][]) { m.set(k, v); markProduced(v); } } catch { /* cache absent */ }
    mtCache.set(lang, m);
  }
  return m;
}
const mtSave = (lang: Lang) => { try { localStorage.setItem(MT_KEY(lang), JSON.stringify([...mtFor(lang)].slice(-600))); } catch { /* ignoré */ } };
const mtFailedAt = new Map<string, number>();
const norm1 = (s: string) => s.replace(/\s+/g, ' ').trim();

/**
 * Traduit tout le document (textes, placeholders, titres, info-bulles) à partir du français d'origine,
 * y compris ce qui est affiché plus tard (notifications, listes chargées). Chaque texte garde son français d'origine
 * pour pouvoir revenir en arrière ou changer de langue à tout moment.
 * Ce qui n'est pas dans le dictionnaire (produits et descriptions saisis par les boutiques, textes oubliés) est envoyé à la
 * traduction automatique du serveur, puis mémorisé.
 */
function AutoTranslate({ lang }: { lang: Lang }) {
  useEffect(() => {
    const pending = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    const skip = (el: Element | null): boolean => { for (let e = el; e; e = e.parentElement) { if (SKIP.has(e.tagName) || e.hasAttribute('data-no-translate') || e.classList.contains('chat-msg')) return true; } return false; };
    const inUgc = (el: Element | null) => !!el?.closest('[data-ugc]');
    /** Traduit un texte : dictionnaire, sinon traduction automatique déjà reçue, sinon la demande est mise en file. */
    const convert = (raw: string, el: Element | null): string => {
      if (lang === 'fr') return raw;
      const viaDict = trDom(lang, raw);
      if (viaDict !== raw) return viaDict;
      const core = norm1(raw);
      if (!core || hasEntry(lang, core) || isProduced(core) || isDictOutput(lang, core)) return raw;
      const hit = mtFor(lang).get(core);
      if (hit !== undefined) { const lead = /^\s*/.exec(raw)![0]; const tail = /\s*$/.exec(raw)![0]; return lead + hit + tail; }
      if (worthMachine(core, inUgc(el)) && !((mtFailedAt.get(`${lang}:${core}`) ?? 0) > Date.now() - 120_000)) { pending.add(core); if (!timer) timer = setTimeout(() => void fetchMt(), 250); }
      return raw;
    };
    const fetchMt = async () => {
      timer = undefined;
      const all = [...pending]; pending.clear();
      if (!all.length || lang === 'fr') return;
      for (let i = 0; i < all.length; i += 40) {
        const batch = all.slice(i, i + 40);
        try {
          const res = await fetch('/api/v1/translate', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lang, texts: batch }) });
          if (!res.ok) throw new Error(String(res.status));
          const { translations } = (await res.json()) as { translations: (string | null)[] };
          const m = mtFor(lang);
          batch.forEach((src, k) => { const t = translations[k]; if (t) { m.set(src, t); markProduced(t); } else mtFailedAt.set(`${lang}:${src}`, Date.now()); });
        } catch { batch.forEach((src) => mtFailedAt.set(`${lang}:${src}`, Date.now())); }
      }
      if (cancelled) return;
      mtSave(lang);
      observer.disconnect(); walk(document.documentElement); doTitle(); observer.observe(document.documentElement, OPTS);
    };
    const doText = (n: Text) => {
      if (skip(n.parentElement)) return;
      const cur = n.nodeValue ?? '';
      const rec = texts.get(n);
      const src = rec && rec.shown === cur ? rec.src : cur;
      const out = convert(src, n.parentElement);
      if (out !== cur) n.nodeValue = out;
      texts.set(n, { src, shown: out });
    };
    const doAttrs = (el: Element) => {
      if (skip(el)) return;
      for (const a of ATTRS) {
        const cur = el.getAttribute(a);
        if (cur === null) continue;
        const all = attrs.get(el) ?? {};
        const rec = all[a];
        const src = rec && rec.shown === cur ? rec.src : cur;
        const out = convert(src, el);
        if (out !== cur) el.setAttribute(a, out);
        all[a] = { src, shown: out };
        attrs.set(el, all);
      }
    };
    /** Titre de l'onglet : chaque segment (« Page - Mwinda Market ») est traduit séparément. */
    const doTitle = () => {
      const cur = document.title; const rec = titleRec;
      const src = rec && rec.shown === cur ? rec.src : cur;
      const out = lang === 'fr' ? src : src.split(' - ').map((seg) => convert(seg, null)).join(' - ');
      if (out !== cur) document.title = out;
      titleRec = { src, shown: out };
    };
    let titleRec: { src: string; shown: string } | undefined;
    const walk = (root: Node) => {
      if (root.nodeType === 3) { doText(root as Text); return; }
      if (root.nodeType !== 1) return;
      const el = root as Element;
      if (SKIP.has(el.tagName)) return;
      doAttrs(el);
      for (let c = el.firstChild; c; c = c.nextSibling) walk(c);
    };
    walk(document.documentElement);
    doTitle();
    let queue: Node[] = []; let raf = 0;
    const flush = () => { raf = 0; const q = queue; queue = []; observer.disconnect(); for (const n of q) if (n.isConnected) walk(n); doTitle(); observer.observe(document.documentElement, OPTS); };
    const OPTS: MutationObserverInit = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS };
    const observer = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'childList') m.addedNodes.forEach((n) => queue.push(n));
        else if (m.type === 'characterData') queue.push(m.target);
        else if (m.target.nodeType === 1) queue.push(m.target);
      }
      if (!raf) raf = requestAnimationFrame(flush);
    });
    observer.observe(document.documentElement, OPTS);
    return () => { cancelled = true; if (timer) clearTimeout(timer); observer.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [lang]);
  return null;
}

/** Texte traduisible utilisable aussi dans un composant serveur : <T>Accueil</T>. */
export function T({ children }: { children: string }) { return <>{useT()(children)}</>; }

/** Sélecteur de langue de la barre du haut. */
export function LanguageSelector() {
  const { lang, setLang } = useI18n();
  const { user } = useAuth();
  return (
    <label className="lang-select" title="Langue / Language">
      <i className="fas fa-language" aria-hidden="true" />
      <select aria-label="Langue" value={lang} onChange={(e) => { const l = e.target.value; if (isLang(l)) { setLang(l); if (user) void fetch('/api/v1/me', { method: 'PATCH', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ locale: l }) }).catch(() => {}); } }}>
        {LANGS.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
      </select>
    </label>
  );
}

/** Choix de la langue dans le menu du téléphone : une pastille par langue. */
export function LanguageChips() {
  const { lang, setLang, t } = useI18n();
  const { user } = useAuth();
  const pick = (l: Lang) => { setLang(l); if (user) void fetch('/api/v1/me', { method: 'PATCH', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ locale: l }) }).catch(() => {}); };
  return (
    <div className="m-lang">
      <p><i className="fas fa-language" /> {t('Langue de la plateforme')}</p>
      <div data-no-translate>
        {LANGS.map((o) => <button key={o.code} type="button" className={lang === o.code ? 'on' : ''} aria-pressed={lang === o.code} onClick={() => pick(o.code)}>{o.label}</button>)}
      </div>
    </div>
  );
}

