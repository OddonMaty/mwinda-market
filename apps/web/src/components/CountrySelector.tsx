'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthProvider';
import { useCountries } from './Geo';

const KEY = 'mwinda_country';
const flag = (code: string) => String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));

/** « Livrer à » dans la barre du haut : pays du compte connecté, sinon dernier choix du visiteur (RDC par défaut). */
export function CountrySelector() {
  const { user } = useAuth();
  const countries = useCountries();
  const [code, setCode] = useState('CD');
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.countryCode) { setCode(user.countryCode); return; }
    try { const v = localStorage.getItem(KEY); if (v) setCode(v); } catch { /* stockage indisponible */ }
  }, [user?.countryCode]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const current = countries.find((c) => c.code === code);
  const shown = countries.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));
  function pick(c: string) {
    setCode(c); setOpen(false); setQ('');
    try { localStorage.setItem(KEY, c); } catch { /* ignoré */ }
  }
  return (
    <div className="country-select" ref={ref}>
      <button type="button" className="country-select-btn" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="hidden-mobile">Livrer à :</span> <span className="country-flag">{flag(code)}</span> <b>{current?.name ?? code}</b> <i className="fas fa-chevron-down" />
      </button>
      {open && (
        <div className="country-select-menu" role="listbox">
          <input type="search" placeholder="Rechercher un pays…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          <ul>
            {shown.map((c) => (
              <li key={c.code}><button type="button" role="option" aria-selected={c.code === code} className={c.code === code ? 'active' : ''} onClick={() => pick(c.code)}><span className="country-flag">{flag(c.code)}</span> {c.name}</button></li>
            ))}
            {shown.length === 0 && <li className="country-empty">Aucun pays trouvé</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
