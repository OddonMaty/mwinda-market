'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from './Locale';
import { useCountries } from './Geo';

const flag = (code: string) => String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));

/** « Livrer à » dans la barre du haut : seul le drapeau du pays choisi est affiché. */
export function CountrySelector() {
  const { code, setCountry } = useLocale();
  const countries = useCountries();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const current = countries.find((c) => c.code === code);
  const shown = countries.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));
  function pick(c: string) { setCountry(c); setOpen(false); setQ(''); }
  return (
    <div className="country-select" ref={ref}>
      <button type="button" className="country-select-btn" aria-haspopup="listbox" aria-expanded={open} aria-label={`Livrer à : ${current?.name ?? code}`} title={`Livrer à : ${current?.name ?? code}`} onClick={() => setOpen((v) => !v)}>
        <span className="country-flag" style={{ fontSize: '1.15rem' }}>{flag(code)}</span> <i className="fas fa-chevron-down" />
      </button>
      {open && (
        <div className="country-select-menu" role="listbox">
          <input type="search" placeholder="Rechercher un pays…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          <ul>
            {shown.map((c) => (
              <li key={c.code}><button type="button" role="option" aria-selected={c.code === code} className={c.code === code ? 'active' : ''} onClick={() => pick(c.code)}><span className="country-flag">{flag(c.code)}</span> {c.name}{c.currency ? <small style={{ marginLeft: 'auto', color: '#999' }}>{c.currency}</small> : null}</button></li>
            ))}
            {shown.length === 0 && <li className="country-empty">Aucun pays trouvé</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
