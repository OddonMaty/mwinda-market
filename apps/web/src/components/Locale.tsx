'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { toLocal } from '@saotech/shared';
import { formatUsd } from '../lib';
import { useAuth } from './AuthProvider';
import { useCountries } from './Geo';

const KEY = 'mwinda_country';
interface Ctx { code: string; currency: string | null; setCountry: (code: string) => void }
const LocaleContext = createContext<Ctx>({ code: 'CD', currency: 'CDF', setCountry: () => {} });
export const useLocale = () => useContext(LocaleContext);

/** Pays choisi dans la barre du haut : pays du compte connecté, sinon dernier choix du visiteur (RDC par défaut). Il fixe la monnaie locale affichée à côté des prix en dollars. */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const countries = useCountries();
  const [code, setCode] = useState('CD');
  useEffect(() => {
    if (user?.countryCode) { setCode(user.countryCode); return; }
    try { const v = localStorage.getItem(KEY); if (v) setCode(v); } catch { /* stockage indisponible */ }
  }, [user?.countryCode]);
  const setCountry = (c: string) => { setCode(c); try { localStorage.setItem(KEY, c); } catch { /* ignoré */ } };
  const currency = countries.find((c) => c.code === code)?.currency ?? (code === 'CD' ? 'CDF' : null);
  return <LocaleContext.Provider value={{ code, currency, setCountry }}>{children}</LocaleContext.Provider>;
}

/** Prix en dollars, avec la valeur approximative en monnaie locale à côté. */
export function Price({ usd, local = true }: { usd: number; local?: boolean }) {
  const { currency } = useLocale();
  const l = local ? toLocal(usd, currency) : null;
  return <>{formatUsd(usd)}{l && <small className="price-local"> ≈ {new Intl.NumberFormat('fr-FR').format(l.amount)} {l.symbol}</small>}</>;
}
