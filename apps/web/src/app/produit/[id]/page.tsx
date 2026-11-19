import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header, Footer } from '../../../components/Chrome';
import { ProductDetail } from '../../../components/ProductDetail';
import { getProducts } from '../../../data/source';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const products = await getProducts();
  const p = products.find((x) => x.id === Number(id));
  return { title: p ? `${p.name} - Mwinda Market` : 'Produit - Mwinda Market', description: p?.description };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { id } = await params;
  const products = await getProducts();
  const product = products.find((p) => p.id === Number(id));
  if (!product) notFound();
  const related = products.filter((p) => p.id !== product.id).slice(0, 4);
  return (
    <>
      <Header active="collection" />
      <ProductDetail product={product} related={related} now={Date.now()} />
      <Footer />
    </>
  );
}
