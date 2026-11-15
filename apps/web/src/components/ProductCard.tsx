import type { Product } from '../data/catalogue';
import { formatPrice, isProductNew, productImageUrl } from '../lib';

function Stars({ rating }: { rating: number }) {
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
  return (
    <div className="product-card">
      <div className="product-image">
        <img src={productImageUrl(product.image, 300, 300)} alt={product.name} />
        <div className="product-badges">
          {isProductNew(product, now) && <span className="product-badge">NOUVEAU</span>}
          {product.tags.includes('bestseller') && <span className="product-badge">BEST-SELLER</span>}
        </div>
        <div className="product-actions-hover">
          <button type="button"><i className="fas fa-heart" /></button>
          <button type="button"><i className="fas fa-eye" /></button>
          <button type="button"><i className="fas fa-shopping-cart" /></button>
        </div>
      </div>
      <div className="product-info">
        <p className="product-category">{product.category}</p>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-rating">
          <div className="stars"><Stars rating={product.rating} /></div>
          <span className="review-count">({product.reviews})</span>
        </div>
        <div className="product-price">
          <span className="current-price">{formatPrice(product.price)}</span>
          {product.originalPrice ? <span className="original-price">{formatPrice(product.originalPrice)}</span> : null}
        </div>
        <p className={`product-stock ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
          {product.inStock ? 'En stock' : 'Rupture de stock'}
        </p>
      </div>
    </div>
  );
}
