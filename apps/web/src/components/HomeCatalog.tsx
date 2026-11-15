'use client';
import { useState } from 'react';
import type { Product } from '../data/catalogue';
import { departmentLabels } from '../lib';
import { ProductCard } from './ProductCard';

const ICONS: Record<string, string> = { electronique: 'fa-mobile-alt', construction: 'fa-hard-hat', vetements: 'fa-tshirt', imprimantes: 'fa-print' };
const DEPS = ['electronique', 'construction', 'vetements', 'imprimantes'];

/** Onglets « Nouveaux produits » (filtre par rayon). */
export function NewProducts({ products, now }: { products: Product[]; now: number }) {
  const [dep, setDep] = useState('All');
  const list = dep === 'All' ? products : products.filter((p) => p.department === dep);
  const tab = (key: string, label: string) => (
    <button type="button" key={key} className={`tab-btn${dep === key ? ' active' : ''}`} onClick={() => setDep(key)}>{label}</button>
  );
  return (
    <>
      <div className="section-header">
        <h2>Nouveaux produits</h2>
        <div className="filter-tabs">
          {tab('All', 'Tous')}{tab('electronique', 'Électronique')}{tab('construction', 'Construction')}{tab('vetements', 'Vêtements')}{tab('imprimantes', 'Imprimantes')}
        </div>
      </div>
      <div className="products-grid">
        {list.length > 0
          ? list.map((p) => <ProductCard key={p.id} product={p} now={now} />)
          : <p className="empty-collection">{dep === 'All' ? 'Aucun nouveau produit pour le moment.' : 'Aucun nouveau produit dans ce rayon pour le moment.'}</p>}
      </div>
    </>
  );
}

/** Section « Tous nos produits » avec filtre par secteur. */
export function HomeCatalog({ products, now }: { products: Product[]; now: number }) {
  const [dep, setDep] = useState('All');
  const items = dep === 'All'
    ? DEPS.flatMap((d) => products.filter((p) => p.department === d).slice(0, 3))
    : products.filter((p) => p.department === dep).slice(0, 12);
  const btn = (key: string, label: string) => (
    <button type="button" key={key} className={`sector-filter-btn${dep === key ? ' active' : ''}`} onClick={() => setDep(key)}>
      {key !== 'All' && <><i className={`fas ${ICONS[key]}`} />{' '}</>}{label}
    </button>
  );
  return (
    <>
      <div className="section-header"><h2>Tous nos produits</h2></div>
      <div className="home-catalog-layout">
        <aside className="home-sector-filters">
          {btn('All', 'Tous les secteurs')}
          {DEPS.map((d) => btn(d, departmentLabels[d] ?? d))}
        </aside>
        <div className="products-grid">
          {items.length > 0
            ? items.map((p) => <ProductCard key={p.id} product={p} now={now} />)
            : <p className="empty-collection">Aucun produit dans ce secteur pour le moment.</p>}
        </div>
      </div>
      <div className="home-catalog-cta">
        <button type="button" className="btn btn-outline">Voir tout le catalogue <i className="fas fa-arrow-right" /></button>
      </div>
    </>
  );
}
