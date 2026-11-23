'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { toLocal, USD_RATES } from '@saotech/shared';
import { formatUsd } from '../lib';
import { useAuth } from './AuthProvider';
import { useCountries } from './Geo';
import { useI18n } from './I18n';
import { isLang } from '../i18n/translate';

const KEY = 'mwinda_country';
interface Ctx { code: string; currency: string | null; rates: Record<string, number>; setCountry: (code: string) => void }
const LocaleContext = createContext<Ctx>({ code: 'CD', currency: 'CDF', rates: USD_RATES, setCountry: () => {} });
export const useLocale = () => useContext(LocaleContext);

/** Pays choisi dans la barre du haut : pays du compte connecté, sinon dernier choix du visiteur (RDC par défaut). Il fixe la monnaie locale affichée à côté des prix en dollars. */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const countries = useCountries();
  const { setLang } = useI18n();
  const [code, setCode] = useState('CD');
  const [rates, setRates] = useState<Record<string, number>>({ ...USD_RATES });
  useEffect(() => {
    // Le dernier choix du visiteur prime ; à défaut, le pays de son compte.
    let saved: string | null = null;
    try { saved = localStorage.getItem(KEY); } catch { /* stockage indisponible */ }
    if (saved) setCode(saved); else if (user?.countryCode) setCode(user.countryCode);
  }, [user?.countryCode]);
  // La langue enregistrée sur le compte s'applique si le visiteur n'en a pas choisi une sur cet appareil.
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem('mwinda_lang'); } catch { /* indisponible */ }
    if (!saved && isLang(user?.locale)) setLang(user.locale, false);
  }, [user?.locale, setLang]);
  // Taux du jour (base dollar) fournis par l'API ; les valeurs de secours restent en place si elle est injoignable.
  useEffect(() => {
    fetch('/api/v1/rates').then((r) => (r.ok ? r.json() : null)).then((d: { rates?: Record<string, number> } | null) => { if (d?.rates) setRates((prev) => ({ ...prev, ...d.rates })); }).catch(() => {});
  }, []);
  const setCountry = (c: string) => { setCode(c); try { localStorage.setItem(KEY, c); } catch { /* ignoré */ } };
  const currency = countries.find((c) => c.code === code)?.currency ?? (code === 'CD' ? 'CDF' : null);
  return <LocaleContext.Provider value={{ code, currency, rates, setCountry }}>{children}</LocaleContext.Provider>;
}

/** Prix en dollars, avec la valeur approximative en monnaie locale à côté. */
export function Price({ usd, local = true }: { usd: number; local?: boolean }) {
  const { currency, rates } = useLocale();
  const l = local ? toLocal(usd, currency, rates) : null;
  return <>{formatUsd(usd)}{l && <small className="price-local"> ≈ {new Intl.NumberFormat('fr-FR').format(l.amount)} {l.symbol}</small>}</>;
}
