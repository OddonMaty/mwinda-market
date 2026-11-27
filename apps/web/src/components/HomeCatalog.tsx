'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Product } from '../data/catalogue';
import { departmentIcon } from '@saotech/shared';
import { ProductCard } from './ProductCard';
import { NewsletterForm } from './Newsletter';

/** Catégories réellement présentes dans le catalogue, les plus fournies d'abord. */
const catsOf = (products: Product[]) => {
  const count = new Map<string, number>();
  for (const p of products) count.set(p.category, (count.get(p.category) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr')).map(([name]) => name);
};
const iconOf = (products: Product[], category: string) => departmentIcon(products.find((p) => p.category === category)?.department ?? '');

/** Onglets « Nouveaux produits » (filtre par rayon). */
export function NewProducts({ products, now }: { products: Product[]; now: number }) {
  const [dep, setDep] = useState('All');
  const list = dep === 'All' ? products : products.filter((p) => p.category === dep);
  const tab = (key: string, label: string) => (
    <button type="button" key={key} className={`tab-btn${dep === key ? ' active' : ''}`} onClick={() => setDep(key)}>{label}</button>
  );
  return (
    <>
      <div className="section-header">
        <h2>Nouveaux produits</h2>
        <div className="filter-tabs">
          {tab('All', 'Tous')}{catsOf(products).slice(0, 6).map((c) => tab(c, c))}
        </div>
      </div>
      <div className="products-grid new-products-row">
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
    ? catsOf(products).flatMap((c) => products.filter((p) => p.category === c).slice(0, 3))
    : products.filter((p) => p.category === dep).slice(0, 12);
  const btn = (key: string, label: string) => (
    <button type="button" key={key} className={`sector-filter-btn${dep === key ? ' active' : ''}`} onClick={() => setDep(key)}>
      {key !== 'All' && <><i className={`fas ${iconOf(products, key)}`} />{' '}</>}{label}
    </button>
  );
  return (
    <>
      <div className="section-header"><h2>Tous nos produits</h2></div>
      <div className="home-sector-tabs">
        {btn('All', 'Tous')}
        {catsOf(products).map((c) => btn(c, c))}
      </div>
      <div className="home-catalog-layout">
        <aside className="home-newsletter-card">
          <i className="fas fa-envelope-open-text" />
          <p className="newsletter-tag">Newsletter</p>
          <h3>-10 % sur votre première commande</h3>
          <p>Offres exclusives, nouveautés et réductions réservées aux abonnés.</p>
          <NewsletterForm stacked />
        </aside>
        <div className="products-grid">
          {items.length > 0
            ? items.map((p) => <ProductCard key={p.id} product={p} now={now} />)
            : <p className="empty-collection">Aucun produit dans cette catégorie pour le moment.</p>}
        </div>
      </div>
      <div className="home-catalog-cta">
        <Link href="/collection" className="btn btn-outline">Voir tout le catalogue <i className="fas fa-arrow-right" /></Link>
      </div>
    </>
  );
}
