'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Product } from '../data/catalogue';
import { useCart } from './CartProvider';
import { isProductNew, placeLabel, productImageUrl } from '../lib';
import { Price } from './Locale';


export function Stars({ rating }: { rating: number }) {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => {
        const cls = i < Math.floor(rating) ? 'fas fa-star' : i < rating ? 'fas fa-star-half-alt' : 'far fa-star';
        return <span className="star" key={i}><i className={cls} /></span>;
      })}
    </>
  );
}

export function ProductCard({ product, now }: { product: Product; now: number }) {
  const router = useRouter();
  const [wish, setWish] = useState(false);
  const cart = useCart();
  const open = () => router.push(`/produit/${product.id}`);
  return (
    <div className="product-card" onClick={open}>
      <div className="product-image">
        <img src={productImageUrl(product.image, 300, 300)} alt={product.name} loading="lazy" decoding="async" />
        <div className="product-badges">
          {isProductNew(product, now) && <span className="product-badge">NOUVEAU</span>}
          {product.tags.includes('bestseller') && <span className="product-badge">BEST-SELLER</span>}
          {product.certified && <span className="product-badge badge-certified"><i className="fas fa-check-circle" /> CERTIFIÉ</span>}
        </div>
        <div className="product-actions-hover">
          <button type="button" className={wish ? 'active' : ''} style={wish ? { color: 'var(--primary)' } : undefined} onClick={(e) => { e.stopPropagation(); setWish(!wish); }}><i className="fas fa-heart" /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); open(); }}><i className="fas fa-eye" /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); cart.add(product, 1); }}><i className="fas fa-shopping-cart" /></button>
        </div>
      </div>
      <div className="product-info">
        <p className="product-category">{product.category}</p>
        {placeLabel(product) && <p className="product-place"><i className="fas fa-map-marker-alt" /> {placeLabel(product)}</p>}
        <h3 className="product-name">{product.name}</h3>
        <div className="product-rating">
          <div className="stars"><Stars rating={product.rating} /></div>
          <span className="review-count">({product.reviews})</span>
        </div>
        <div className="product-price">
          <span className="current-price"><Price usd={product.price} /></span>
          {product.originalPrice ? <span className="original-price"><Price usd={product.originalPrice} local={false} /></span> : null}
        </div>
        <p className={`product-stock ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
          {product.inStock ? 'En stock' : 'Rupture de stock'}
        </p>
      </div>
    </div>
  );
}
