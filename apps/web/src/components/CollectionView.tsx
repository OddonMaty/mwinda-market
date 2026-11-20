'use client';
import { useState } from 'react';
import type { Product } from '../data/catalogue';
import { formatPrice } from '../lib';
import { ProductCard } from './ProductCard';
import { NavButton } from './NavButton';
import { CategorySidebar } from './CategorySidebar';

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
}

/** Page catalogue : même structure que l'ancien site (les filtres de la barre latérale n'y étaient qu'indicatifs). */
export function CollectionView({ products, now, pills, breadcrumbLabel, query, clearHref, inStockCount, activeDep }: Props) {
  const [price, setPrice] = useState(2500);
  const [sort, setSort] = useState(0);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sorts = ['Vedette', 'Meilleures ventes', 'Prix croissant', 'Prix décroissant', 'A-Z'];

  return (
    <div className="container collection-container">
      <div className="breadcrumb">
        <NavButton to="/">Accueil</NavButton>
        <i className="fas fa-chevron-right" />
        <span>{breadcrumbLabel}</span>
        {query && <NavButton to={clearHref} className="link-btn">✕ Effacer la recherche</NavButton>}
      </div>

      <div className="filter-tabs" style={{ marginBottom: '1.5rem' }}>
        {pills.map((p) => <NavButton key={p.label} to={p.href} className={`tab-btn ${p.active ? 'active' : ''}`}>{p.label}</NavButton>)}
      </div>

      <button type="button" className="filter-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <i className="fas fa-sliders-h" /> Filtres
      </button>

      <div className="collection-layout">
        <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
          <div className="collection-cats"><CategorySidebar active={activeDep} /></div>
          <div className="filter-group">
            <h4>Disponibilité</h4>
            <label className="checkbox-label"><input type="checkbox" /><span>En stock ({inStockCount})</span></label>
          </div>
          <div className="filter-group">
            <h4>Prix</h4>
            <div className="price-range">
              <p><span>{formatPrice(0)}</span> — <span>{formatPrice(price)}</span></p>
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
            <label className="checkbox-label"><input type="checkbox" /><span>Produits vendeurs uniquement</span></label>
          </div>
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
            {products.length === 0
              ? <p className="empty-collection">{query ? `Aucun résultat pour « ${query} ». Essayez un autre mot-clé.` : 'Aucun produit dans cette catégorie pour le moment.'}</p>
              : products.map((p) => <ProductCard key={p.id} product={p} now={now} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
