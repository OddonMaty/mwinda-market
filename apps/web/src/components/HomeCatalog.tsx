'use client';
import { useState } from 'react';
import type { Product } from '../data/catalogue';
import { DEPARTMENTS, departmentIcon, departmentName } from '@saotech/shared';
import { useAuth } from './AuthProvider';
import { ProductCard } from './ProductCard';

/** Rayons qui contiennent des produits, dans l'ordre du catalogue. */
const depsOf = (products: Product[]) => DEPARTMENTS.map((d) => d.slug).filter((s) => products.some((p) => p.department === s));

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
          {tab('All', 'Tous')}{depsOf(products).slice(0, 6).map((d) => tab(d, departmentName(d)))}
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
  const [email, setEmail] = useState('');
  const { notify } = useAuth();
  const items = dep === 'All'
    ? depsOf(products).flatMap((d) => products.filter((p) => p.department === d).slice(0, 3))
    : products.filter((p) => p.department === dep).slice(0, 12);
  const btn = (key: string, label: string) => (
    <button type="button" key={key} className={`sector-filter-btn${dep === key ? ' active' : ''}`} onClick={() => setDep(key)}>
      {key !== 'All' && <><i className={`fas ${departmentIcon(key)}`} />{' '}</>}{label}
    </button>
  );
  return (
    <>
      <div className="section-header"><h2>Tous nos produits</h2></div>
      <div className="home-sector-tabs">
        {btn('All', 'Tous')}
        {depsOf(products).map((d) => btn(d, departmentName(d)))}
      </div>
      <div className="home-catalog-layout">
        <aside className="home-newsletter-card">
          <i className="fas fa-envelope-open-text" />
          <p className="newsletter-tag">Newsletter</p>
          <h3>-10 % sur votre première commande</h3>
          <p>Offres exclusives, nouveautés et réductions réservées aux abonnés.</p>
          <input type="email" placeholder="Votre e-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="button" className="btn btn-primary" onClick={() => { notify(email.includes('@') ? 'Merci ! Votre inscription sera confirmée dès l’activation des e-mails.' : 'Entrez une adresse e-mail valide.'); if (email.includes('@')) setEmail(''); }}>S&apos;abonner</button>
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
