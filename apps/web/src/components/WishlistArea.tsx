'use client';

import Link from 'next/link';
import type { Product } from '../data/catalogue';
import { ProductCard } from './ProductCard';
import { useWishlist } from './WishlistProvider';

export function WishlistArea({ products }: { products: Product[] }) {
  const { ids } = useWishlist();
  const list = ids.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p);
  const now = Date.now();
  return (
    <section className="products-section">
      <div className="container">
        <div className="section-header"><h2>Mes favoris</h2></div>
        {list.length > 0
          ? <div className="products-grid">{list.map((p) => <ProductCard key={p.id} product={p} now={now} />)}</div>
          : <div className="empty-collection"><p>Vous n&apos;avez pas encore de favoris.</p><p>Touchez le cœur d&apos;un produit pour le retrouver ici.</p><Link href="/collection" className="btn btn-primary">Découvrir les produits</Link></div>}
      </div>
    </section>
  );
}
