import type { Metadata } from 'next';
import { Header, Footer } from '../../components/Chrome';
import { ShopsDirectory } from '../../components/ShopsDirectory';
import { getShops } from '../../data/source';

export const revalidate = 30;
export const metadata: Metadata = { title: 'Boutiques - Mwinda Market', description: 'Toutes les boutiques de Mwinda Market : trouvez la vôtre ou ouvrez-en une.' };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [shops, { q }] = await Promise.all([getShops(), searchParams]);
  return (<><Header active="boutiques" /><ShopsDirectory initial={shops} initialQuery={q ?? ''} /><Footer /></>);
}
