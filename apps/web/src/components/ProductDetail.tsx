'use client';
import { useState } from 'react';
import type { Product } from '../data/catalogue';
import { placeLabel, productImageUrl } from '../lib';
import { Price } from './Locale';

import { useCart } from './CartProvider';
import { useChat } from './Chat';
import { Countdown } from './Countdown';
import { NavButton } from './NavButton';
import { ProductCard, Stars } from './ProductCard';

/** Fiche produit : même structure et mêmes interactions que l'ancien site. */
export function ProductDetail({ product, related, now }: { product: Product; related: Product[]; now: number }) {
  const [color, setColor] = useState(product.colors[0] ?? '');
  const [size, setSize] = useState(product.sizes[0] ?? '');
  const [qty, setQty] = useState(1);
  const cart = useCart();
  const chat = useChat();
  const [tab, setTab] = useState<'description' | 'shipping' | 'faq'>('description');
  const allImages = [product.image, ...(product.images ?? [])].filter(Boolean);
  const [main, setMain] = useState(product.image);
  const ask = () => chat.ask({ productId: Number(product.id), productName: product.name, shopName: product.shopName });
  const hasDiscount = !!product.originalPrice && product.originalPrice > product.price;

  return (
    <div className="container product-container">
      <div className="breadcrumb">
        <NavButton to="/">Accueil</NavButton>
        <i className="fas fa-chevron-right" />
        <NavButton to="/collection">Nos produits</NavButton>
        <i className="fas fa-chevron-right" />
        <span>{product.name}</span>
      </div>

      <div className="product-layout">
        <div className="product-gallery">
          <div className="main-image">
            <img src={productImageUrl(main, 600, 600)} alt={product.name} />
          </div>
          <div className="thumbnail-images">
            {allImages.length > 1 && allImages.map((img, i) => (
              <div key={img} className={`thumbnail${img === main ? ' active' : ''}`} onClick={() => setMain(img)}>
                <img src={productImageUrl(img, 100, 100)} alt={`${product.name} — vue ${i + 1}`} loading="lazy" decoding="async" />
              </div>
            ))}
          </div>
        </div>

        <div className="product-info">
          <div className="product-meta"><i className="fas fa-eye" /> Récemment consulté</div>
          <h1>{product.name}</h1>
          {product.shopName && <p className="seller-line">Vendu par <b>{product.shopName}</b>{product.certified && <span className="badge-certified-inline"><i className="fas fa-check-circle" /> Vendeur certifié Mwinda</span>}</p>}
          {placeLabel(product) && <p className="seller-place"><i className="fas fa-map-marker-alt" /> Expédié depuis <b>{placeLabel(product)}</b></p>}
          <div className="product-rating">
            <div className="stars"><Stars rating={product.rating} /></div>
            <span><span className="review-count">({product.reviews} avis)</span></span>
            <button type="button" className="view-reviews">Voir tous les avis</button>
          </div>

          <div className="product-price">
            <span className="current-price"><Price usd={product.price} /></span>
            <span className="original-price" style={hasDiscount ? undefined : { display: 'none' }}>{hasDiscount ? <Price usd={product.originalPrice as number} local={false} /> : ''}</span>
            <span className="discount-badge" style={hasDiscount ? undefined : { display: 'none' }}>{hasDiscount ? `-${product.discount}%` : ''}</span>
          </div>

          <p className="product-description">{product.description}</p>

          <div className="flash-sale">
            <i className="fas fa-bolt" />
            <div>
              <p>Vente flash — Se termine dans :</p>
              <Countdown />
            </div>
          </div>

          <div className="product-details">
            <div className="detail-item">
              <span className="detail-label">Disponibilité :</span>
              <span className={product.inStock ? 'in-stock' : 'out-of-stock'}>{product.inStock ? 'En stock' : 'Rupture de stock'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Référence :</span>
              <span>{product.sku}</span>
            </div>
          </div>

          <div className="product-option">
            <p className="option-label">Couleur : <span>{color}</span></p>
            <div className="color-buttons">
              {product.colors.map((c) => <button type="button" key={c} className={`color-option${c === color ? ' active' : ''}`} onClick={() => setColor(c)}>{c}</button>)}
            </div>
          </div>

          {product.sizes.length > 0 && (
            <div className="product-option">
              <p className="option-label">Capacité : <span>{size}</span></p>
              <div className="size-buttons">
                {product.sizes.map((s) => <button type="button" key={s} className={`size-option${s === size ? ' active' : ''}`} onClick={() => setSize(s)}>{s}</button>)}
              </div>
            </div>
          )}

          <div className="product-actions">
            <div className="quantity-selector">
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))}><i className="fas fa-minus" /></button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty(qty + 1)}><i className="fas fa-plus" /></button>
            </div>
            <button type="button" className="btn btn-primary add-to-cart" onClick={() => { cart.add(product, qty, { color, size }); setQty(1); }}>
              <i className="fas fa-shopping-cart" /> Ajouter au panier
            </button>
            <button type="button" className="btn btn-dark buy-now" onClick={ask}>
              <i className="fas fa-comments" /> Acheter
            </button>
            <button type="button" className="btn btn-outline"><i className="fas fa-heart" /></button>
          </div>

          <div className="product-share">
            <button type="button"><i className="fas fa-share-alt" /> Partager</button>
            <button type="button" onClick={ask}><i className="fas fa-comment-dots" /> Poser une question</button>
          </div>
        </div>
      </div>

      <div className="m-buybar">
        <button type="button" className="m-buybar-ask" onClick={ask} aria-label="Poser une question au vendeur"><i className="fas fa-comment-dots" /><span>Question</span></button>
        <button type="button" className="m-buybar-cart" disabled={!product.inStock} onClick={() => { cart.add(product, qty, { color, size }); setQty(1); }}>Ajouter au panier</button>
        <button type="button" className="m-buybar-buy" onClick={ask}>Acheter</button>
      </div>

      <div className="product-tabs">
        <div className="tabs-header">
          <button type="button" className={`tab-header${tab === 'description' ? ' active' : ''}`} onClick={() => setTab('description')}>Description</button>
          <button type="button" className={`tab-header${tab === 'shipping' ? ' active' : ''}`} onClick={() => setTab('shipping')}>Livraison &amp; Retours</button>
          <button type="button" className={`tab-header${tab === 'faq' ? ' active' : ''}`} onClick={() => setTab('faq')}>FAQ</button>
        </div>
        <div className="tabs-content">
          <div className={`tab-content${tab === 'description' ? ' active' : ''}`}>
            <p>{product.description} Ce produit haut de gamme est conçu pour ceux qui exigent le meilleur.</p>
          </div>
          <div className={`tab-content${tab === 'shipping' ? ' active' : ''}`}>
            <p>Si vous n&apos;êtes pas entièrement satisfait, retournez tout article sous 30 jours pour un remboursement complet ou un échange.</p>
            <ul>
              <li>Les articles doivent être dans leur état d&apos;origine avec l&apos;emballage</li>
              <li>Retours selon les conditions de la boutique</li>
              <li>Remboursements traités sous 5 à 7 jours ouvrables</li>
              <li>Échanges disponibles pour les variantes de taille/couleur</li>
            </ul>
          </div>
          <div className={`tab-content${tab === 'faq' ? ' active' : ''}`}>
            <details>
              <summary>Ce produit est-il couvert par une garantie ?</summary>
              <p>Oui. Tous les produits incluent une garantie constructeur de 12 mois. Des options étendues sont disponibles au moment du paiement.</p>
            </details>
            <details>
              <summary>Puis-je l&apos;utiliser à l&apos;international ?</summary>
              <p>Oui, cet appareil prend en charge une tension universelle (100–240V) et est compatible avec les principaux réseaux du monde entier.</p>
            </details>
          </div>
        </div>
      </div>

      <section className="related-products">
        <h2>Produits similaires</h2>
        <div className="products-grid">
          {related.map((p) => <ProductCard key={p.id} product={p} now={now} />)}
        </div>
      </section>
    </div>
  );
}
