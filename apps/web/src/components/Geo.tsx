'use client';

import { useEffect, useState } from 'react';

export interface Country { code: string; name: string; phonePrefix: string; currency: string | null; cities: { name: string; slug: string }[] }

let cache: Country[] | null = null;
let pending: Promise<Country[]> | null = null;

/** Liste des pays (et villes) ouverts, chargée une seule fois. */
export function useCountries(): Country[] {
  const [list, setList] = useState<Country[]>(cache ?? []);
  useEffect(() => {
    if (cache) return;
    pending ??= fetch('/api/v1/countries').then((r) => r.json()).then((d: { countries?: Country[] }) => (cache = d.countries ?? [])).catch(() => (pending = null, []));
    let live = true;
    void pending.then((c) => { if (live && c.length) setList(c); });
    return () => { live = false; };
  }, []);
  return list;
}

/** Choix du pays puis de la ville. Champs du formulaire : `country` (code) et `city` (identifiant de ville, vide = autre ville). */
export function GeoFields({ defaultCountry = 'CD', label = true }: { defaultCountry?: string; label?: boolean }) {
  const countries = useCountries();
  const [code, setCode] = useState(defaultCountry);
  const current = countries.find((c) => c.code === code);
  return (
    <>
      <div className="form-group">
        {label && <label>Pays *</label>}
        <select name="country" value={code} onChange={(e) => setCode(e.target.value)} required>
          {countries.length === 0 && <option value={code}>Chargement…</option>}
          {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        {label && <label>Ville</label>}
        <select name="city" key={code} defaultValue="">
          <option value="">{current?.cities.length ? 'Autre ville' : 'Ville non listée'}</option>
          {current?.cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </div>
    </>
  );
}
