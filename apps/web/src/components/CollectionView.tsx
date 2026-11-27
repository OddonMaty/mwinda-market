'use client';
import { useMemo, useState } from 'react';
import type { Product } from '../data/catalogue';
import { collectionHref, formatUsd } from '../lib';
import { useLocale } from './Locale';
import { ProductCard } from './ProductCard';
import { NavButton } from './NavButton';
import { CategorySidebar } from './CategorySidebar';
import { MobileCatStrip } from './MobileCatStrip';

interface Pill { label: string; href: string; active: boolean }
interface Props {
  products: Product[];
  now: number;
  pills: Pill[];
  breadcrumbLabel: string;
  query: string;
  clearHref: string;
  inStockCount: number;
  activeDep?: string;
  places: { code: string; name: string; count: number; cities: { slug: string; name: string; count: number }[] }[];
  place: { pays: string; ville: string };
  baseDep: string;
  baseCat: string;
}

/** Page catalogue : même structure que l'ancien site (les filtres de la barre latérale n'y étaient qu'indicatifs). */
export function CollectionView({ products, now, pills, breadcrumbLabel, query, clearHref, inStockCount, activeDep, places, place, baseDep, baseCat }: Props) {
  const { code: myCountry } = useLocale();
  const href = (pays?: string, ville?: string) => collectionHref(baseDep, baseCat, query, { pays, ville });
  const nearMe = places.find((c) => c.code === myCountry);
  const open = places.find((c) => c.code === place.pays);
  const [price, setPrice] = useState(2500);
  const [sort, setSort] = useState(0);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sorts = ['Vedette', 'Meilleures ventes', 'Prix croissant', 'Prix décroissant', 'A-Z'];
  const shown = useMemo(() => {
    const l = price < 2500 ? products.filter((p) => p.price <= price) : [...products];
    if (sort === 2) l.sort((a, b) => a.price - b.price);
    else if (sort === 3) l.sort((a, b) => b.price - a.price);
    else if (sort === 4) l.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    return l;
  }, [products, price, sort]);

  return (
    <div className="container collection-container">
      <h1 className="m-page-title">{query ? `« ${query} »` : 'Catégories'}</h1>
      <MobileCatStrip active={activeDep} withAll />
      <div className="breadcrumb">
        <NavButton to="/">Accueil</NavButton>
        <i className="fas fa-chevron-right" />
        <span>{breadcrumbLabel}</span>
        {query && <NavButton to={clearHref} className="link-btn">✕ Effacer la recherche</NavButton>}
      </div>

      <div className={`filter-tabs${baseDep === 'All' ? ' m-hide' : ''}`} style={{ marginBottom: '1.5rem' }}>
        {pills.map((p) => <NavButton key={p.label} to={p.href} className={`tab-btn ${p.active ? 'active' : ''}`}>{p.label}</NavButton>)}
      </div>

      <div className="m-fsbar">
        <button type="button" onClick={() => setSidebarOpen(true)}><i className="fas fa-sliders-h" /> Filtrer</button>
        <label><i className="fas fa-sort-amount-down" /> Trier
          <select value={sort} onChange={(e) => setSort(Number(e.target.value))} aria-label="Trier">{sorts.map((x, i) => <option key={x} value={i}>{x}</option>)}</select>
        </label>
      </div>
      <button type="button" className="filter-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <i className="fas fa-sliders-h" /> Filtres et localisation
      </button>
      {sidebarOpen && <div className="m-backdrop m-filter-backdrop" onClick={() => setSidebarOpen(false)} />}

      <div className="collection-layout">
        <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
          <div className="m-sheet-head m-filter-head"><b>Filtres</b><button type="button" onClick={() => setSidebarOpen(false)} aria-label="Fermer"><i className="fas fa-times" /></button></div>
          <div className="collection-cats"><CategorySidebar active={activeDep} /></div>
          <div className="filter-group location-filter">
            <h4>Localisation de la boutique</h4>
            {nearMe && place.pays !== myCountry && <NavButton to={href(nearMe.code)} className="near-me-btn"><i className="fas fa-location-arrow" /> {`Boutiques de mon pays (${nearMe.count})`}</NavButton>}
            {places.length === 0 ? <p className="loc-empty">Aucune localisation pour cette sélection.</p> : (
              <ul className="loc-list">
                <li><NavButton to={href()} className={`loc-link${!place.pays ? ' active' : ''}`}>Tous les pays</NavButton></li>
                {places.map((c) => (
                  <li key={c.code}>
                    <NavButton to={href(c.code)} className={`loc-link${place.pays === c.code && !place.ville ? ' active' : ''}`}><span className={`fi fi-${c.code.toLowerCase()} country-flag`} /> {c.name} <em>{c.count}</em></NavButton>
                    {open?.code === c.code && c.cities.length > 0 && (
                      <ul className="loc-cities">{c.cities.map((ci) => <li key={ci.slug}><NavButton to={href(c.code, ci.slug)} className={`loc-link${place.ville === ci.slug ? ' active' : ''}`}>{ci.name} <em>{ci.count}</em></NavButton></li>)}</ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="filter-group">
            <h4>Disponibilité</h4>
            <label className="checkbox-label"><input type="checkbox" /><span>{`En stock (${inStockCount})`}</span></label>
          </div>
          <div className="filter-group">
            <h4>Prix</h4>
            <div className="price-range">
              <p><span>{formatUsd(0)}</span> — <span>{formatUsd(price)}</span></p>
              <input type="range" min={0} max={2500} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            </div>
          </div>
          <div className="filter-group">
            <h4>Marque</h4>
            <label className="checkbox-label"><input type="checkbox" /><span>Mwinda Market (5)</span></label>
            <label className="checkbox-label"><input type="checkbox" /><span>Vinova (3)</span></label>
            <label className="checkbox-label"><input type="checkbox" /><span>ProTech (2)</span></label>
          </div>
          <div className="filter-group">
            <h4>Couleur</h4>
            <div className="color-options" />
          </div>
          <div className="filter-group">
            <h4>Boutique</h4>
            <label className="checkbox-label"><input type="checkbox" /><span>Produits des boutiques uniquement</span></label>
          </div>
          <div className="m-filter-foot"><button type="button" className="btn btn-primary" onClick={() => setSidebarOpen(false)}>{shown.length > 1 ? `Voir ${shown.length} produits` : `Voir ${shown.length} produit`}</button></div>
        </aside>

        <div className="products-area">
          <div className="products-toolbar">
            <div className="sort-options">
              <span>Trier :</span>
              {sorts.map((s, i) => <button type="button" key={s} className={`sort-btn${sort === i ? ' active' : ''}`} onClick={() => setSort(i)}>{s}</button>)}
            </div>
            <div className="view-options">
              <button type="button" className={`view-btn${view === 'grid' ? ' active' : ''}`} onClick={() => setView('grid')}><i className="fas fa-th" /></button>
              <button type="button" className={`view-btn${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')}><i className="fas fa-list" /></button>
            </div>
          </div>
          <div className="products-grid">
            {shown.length === 0
              ? <p className="empty-collection">{query ? `Aucun résultat pour « ${query} ». Essayez un autre mot-clé.` : 'Aucun produit dans cette catégorie pour le moment.'}</p>
              : shown.map((p) => <ProductCard key={p.id} product={p} now={now} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
