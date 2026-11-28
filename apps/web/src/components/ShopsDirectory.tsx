'use client';
import { countryName } from '../i18n/translate';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api, useAuth } from './AuthProvider';
import { T, useI18n, useT } from './I18n';
import type { ShopSummary } from '../data/source';

const letter = (n: string) => n.trim().slice(0, 1).toUpperCase();

/** Annuaire : d'abord toutes les boutiques déjà présentes, puis la proposition d'ouvrir la sienne. */
export function ShopsDirectory({ initial, initialQuery = '' }: { initial: ShopSummary[]; initialQuery?: string }) {
  const t = useT();
  const { lang } = useI18n();
  const { user } = useAuth();
  const [q, setQ] = useState(initialQuery);
  const [shops, setShops] = useState(initial);
  const first = useRef(!initialQuery);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const ctl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/v1/shops?q=${encodeURIComponent(q.trim())}`, { signal: ctl.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { shops: ShopSummary[] } | null) => { if (d) setShops(d.shops); })
        .catch(() => undefined);
    }, 250);
    return () => { clearTimeout(timer); ctl.abort(); };
  }, [q]);

  const [mine, setMine] = useState(false);
  useEffect(() => {
    if (!user) { setMine(false); return; }
    void api<{ shop: unknown }>('/seller/shop').then((r) => setMine(r.ok && !!r.data.shop));
  }, [user]);
  return (
    <main className="container shops-page">
      <h1 className="shops-title"><T>Boutiques</T> <span className="shops-count">{shops.length}</span></h1>
      <div className="shops-search">
        <i className="fas fa-search" aria-hidden />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Rechercher une boutique…')} aria-label={t('Rechercher une boutique…')} />
      </div>

      {shops.length === 0
        ? <p className="shops-empty"><T>Aucune boutique ne correspond à votre recherche.</T></p>
        : (
          <ul className="shops-list">
            {shops.map((s) => (
              <li key={s.slug} data-ugc>
                <Link href={`/boutique/${s.slug}`} className="shop-row">
                  <span className="shop-avatar" aria-hidden>{letter(s.name)}</span>
                  <span className="shop-info">
                    <b className="shop-name">{s.name}{s.certified && <i className="fas fa-check-circle shop-cert" title={t('Boutique certifiée Mwinda')} />}</b>
                    <small>{[s.city, s.country && countryName(lang, s.country)].filter(Boolean).join(', ') || <T>Afrique</T>}</small>
                    <small className="shop-count">{s.productCount} <T>{s.productCount > 1 ? 'produits' : 'produit'}</T></small>
                  </span>
                  <i className="fas fa-chevron-right shop-go" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}

      <section className="shops-cta">
        <i className="fas fa-store" aria-hidden />
        <h2><T>{mine ? 'Votre boutique est ouverte' : 'Vous vendez vos produits ?'}</T></h2>
        <p><T>{mine ? 'Gérez vos produits, vos commandes et vos gains.' : 'Créez votre boutique sur Mwinda Market et touchez des clients dans toute l’Afrique.'}</T></p>
        <Link href="/vendeur" className="btn btn-primary"><T>{mine ? 'Accéder à ma boutique' : 'Créer ma boutique'}</T></Link>
      </section>
    </main>
  );
}
