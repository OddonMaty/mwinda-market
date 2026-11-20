import { Header, Footer } from '../components/Chrome';
import { HeroSlider, type Slide } from '../components/HeroSlider';
import { CategorySidebar } from '../components/CategorySidebar';
import { Countdown } from '../components/Countdown';
import { NewProducts, HomeCatalog } from '../components/HomeCatalog';
import { ProductCard } from '../components/ProductCard';
import { getProducts } from '../data/source';
import { formatPrice, isProductNew } from '../lib';
import type { Product } from '../data/catalogue';

export const revalidate = 10;

const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=1400&h=600&fit=crop&auto=format`;

const slides = (products: Product[]): Slide[] => {
  const price = (id: number) => `À partir de ${formatPrice(products.find((p) => p.id === id)?.price ?? 0)}`;
  return [
  { tag: 'Nouveauté', title: ['Vinova SmartPhone', 'Pro 12'], text: '108MP de clarté. Vitesse 5G. Batterie toute la journée. Le seul téléphone dont vous avez besoin.', image: u('1511707171634-5f897ff02aa9'), priceLabel: price(1) },
  { tag: 'Meilleure vente', title: ['Audio Master', 'Pro XR'], text: "40 heures d'autonomie, réduction active du bruit, un son de qualité studio pour votre quotidien.", image: u('1505740420928-5e560c06d30e'), priceLabel: price(2) },
  { tag: 'Offre limitée', title: ['ProBook 15', 'Ultra'], text: 'Intel Core i9 · RTX 4070 · 32 Go de RAM. Conçu pour les créateurs qui ne font aucun compromis.', image: u('1496181133206-80ce9b88a853'), priceLabel: price(5) },
  ];
};

export default async function HomePage() {
  const products = await getProducts();
  const now = Date.now();
  const newProducts = products.filter((p) => isProductNew(p, now));
  const deals = products.filter((p) => p.originalPrice && p.originalPrice > p.price).sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0)).slice(0, 8);

  return (
    <>
      <Header active="home" />
      <div className="container home-hero-row"><CategorySidebar /><HeroSlider slides={slides(products)} /></div>

      <section className="usp-band">
        <div className="container">
          <div className="usp-grid">
            {[['fa-truck', 'Livraison dans votre ville', 'Des vendeurs locaux près de chez vous'], ['fa-box', 'Livraison gratuite', 'Le prix affiché est le prix payé'], ['fa-undo', 'Retours sous 30 jours', 'Satisfait ou remboursé']].map(([icon, t, s]) => (
              <div className="usp-item" key={t}>
                <i className={`fas ${icon}`} />
                <div><p className="usp-title">{t}</p><p className="usp-sub">{s}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="products-section">
        <div className="container"><NewProducts products={newProducts} now={now} /></div>
      </section>

      <section className="promo-banner">
        <div className="container">
          <div className="promo-content">
            <div>
              <p className="promo-tag">Offre à durée limitée</p>
              <h3>Jusqu&apos;à 40% de réduction sur l&apos;audio</h3>
            </div>
            <button type="button" className="btn btn-secondary">Voir les promos <i className="fas fa-arrow-right" /></button>
          </div>
        </div>
      </section>

      <section className="deals-section">
        <div className="container">
          <div className="section-header deals-header">
            <div><p className="section-tag">Aujourd&apos;hui seulement</p><h2>Offres du jour</h2></div>
            <Countdown />
          </div>
          <div className="products-grid">
            {deals.length > 0 ? deals.map((p) => <ProductCard key={p.id} product={p} now={now} />) : <p className="empty-collection">Aucune offre en ce moment. Revenez bientôt !</p>}
          </div>
        </div>
      </section>

      <section className="products-section home-catalog-section">
        <div className="container"><HomeCatalog products={products} now={now} /></div>
      </section>

      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-content">
            <p className="newsletter-tag">Newsletter</p>
            <h2>10% de réduction sur votre première commande</h2>
            <p>Abonnez-vous pour recevoir des offres exclusives, les nouveautés et des réductions réservées aux membres.</p>
            <div className="newsletter-form">
              <input type="email" placeholder="Entrez votre adresse e-mail" />
              <button type="button" className="btn btn-dark">S&apos;abonner</button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
