import { Header, Footer } from '../components/Chrome';
import { HeroSlider, type Slide } from '../components/HeroSlider';
import { CategorySidebar } from '../components/CategorySidebar';
import { Countdown } from '../components/Countdown';
import { NewProducts, HomeCatalog } from '../components/HomeCatalog';
import { ProductCard } from '../components/ProductCard';
import { getHeroSlides, getProducts } from '../data/source';
import { formatUsd, isProductNew, productImageUrl } from '../lib';
import { MobileCatStrip } from '../components/MobileCatStrip';

export const revalidate = 10;

const FALLBACK: Slide = { id: 'brand', tag: 'Mwinda Market', title: 'La place de marché des vendeurs africains', text: 'Des boutiques locales près de chez vous, livrées dans votre ville.', image: '', priceLabel: '', href: '/collection' };

export default async function HomePage() {
  const [products, heroData] = await Promise.all([getProducts(), getHeroSlides()]);
  const slides: Slide[] = heroData.length ? heroData.map((h) => ({ id: h.id, tag: h.tag, title: h.title, text: h.text, image: productImageUrl(h.image, 1400, 600), priceLabel: h.priceUsd != null ? `À partir de ${formatUsd(h.priceUsd)}` : '', href: h.href })) : [FALLBACK];
  const now = Date.now();
  const newProducts = products.filter((p) => isProductNew(p, now));
  const deals = products.filter((p) => p.originalPrice && p.originalPrice > p.price).sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0)).slice(0, 8);

  return (
    <>
      <Header active="home" />
      <MobileCatStrip />
      <div className="container home-hero-row"><CategorySidebar /><HeroSlider slides={slides} /></div>

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
