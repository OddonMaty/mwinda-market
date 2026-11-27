import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header, Footer } from '../../../components/Chrome';
import { ProductCard } from '../../../components/ProductCard';
import { LocalDate } from '../../../components/LocalDate';
import { T } from '../../../components/I18n';
import { getShop } from '../../../data/source';

export const revalidate = 10;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await getShop((await params).slug);
  return d ? { title: `${d.shop.name} - Mwinda Market`, description: d.shop.description ?? undefined } : { title: 'Boutique introuvable - Mwinda Market' };
}

export default async function ShopPage({ params }: Props) {
  const d = await getShop((await params).slug);
  if (!d) notFound();
  const { shop, products } = d;
  const now = Date.now();
  const place = [shop.city, shop.country].filter(Boolean).join(', ');
  return (
    <>
      <Header active="" />
      <div className="container" style={{ padding: '1.2rem 0 2rem' }}>
        <section style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', padding: '1.2rem', border: '1px solid var(--border, #e5e5e5)', borderRadius: 14, background: '#fff' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--primary, #e98a2b)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '1.8rem', fontWeight: 800 }} aria-hidden>{shop.name.slice(0, 1).toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{shop.name}{shop.certified && <span className="badge-certified-inline" style={{ marginLeft: 8 }}><i className="fas fa-check-circle" /> <T>Vendeur certifié Mwinda</T></span>}</h1>
            <p style={{ margin: '0.3rem 0 0', color: '#666', fontSize: '0.9rem' }}>
              {place && <><i className="fas fa-map-marker-alt" /> {place} · </>}
              <T>Sur Mwinda Market depuis</T> <LocalDate iso={shop.since} />
            </p>
            {shop.description && <p style={{ margin: '0.5rem 0 0' }}>{shop.description}</p>}
          </div>
          {shop.whatsapp && <a className="btn btn-outline" href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"><i className="fab fa-whatsapp" /> WhatsApp</a>}
        </section>
        <h2 style={{ margin: '1.4rem 0 0.8rem', fontSize: '1.15rem' }}><T>Produits de la boutique</T> ({products.length})</h2>
        {products.length
          ? <div className="products-grid">{products.map((p) => <ProductCard key={p.id} product={p} now={now} />)}</div>
          : <p className="empty-collection"><T>Aucun produit publié pour le moment.</T></p>}
      </div>
      <Footer />
    </>
  );
}
