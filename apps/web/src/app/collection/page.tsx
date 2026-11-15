import type { Metadata } from 'next';
import { Header, Footer } from '../../components/Chrome';
import { CollectionView } from '../../components/CollectionView';
import { products } from '../../data/catalogue';
import { collectionHref, departmentLabels, matchesSearch } from '../../lib';

export const metadata: Metadata = { title: 'Nos produits - Sao Tech Market' };
export const dynamic = 'force-dynamic';

type SP = Promise<{ dep?: string; cat?: string; q?: string }>;

export default async function CollectionPage({ searchParams }: { searchParams: SP }) {
  const { dep = 'All', cat = 'All', q = '' } = await searchParams;
  const query = q.trim();
  const now = Date.now();

  let list = products;
  if (dep !== 'All') list = list.filter((p) => p.department === dep);
  if (cat !== 'All') list = list.filter((p) => p.category === cat);
  if (query) list = list.filter((p) => matchesSearch(p, query));

  const inScope = dep !== 'All' ? products.filter((p) => p.department === dep) : products;
  const categories = ['All', ...new Set(inScope.map((p) => p.category).filter(Boolean))];
  const pills = categories.map((c) => ({
    label: c === 'All' ? 'Tous les produits' : c,
    href: collectionHref(dep, c),
    active: c === cat,
  }));

  let label: string;
  if (query) label = `Résultats pour « ${query} » (${list.length})`;
  else {
    const d = dep !== 'All' ? departmentLabels[dep] : null;
    const c = cat !== 'All' ? cat : null;
    label = d && c ? `${d} — ${c}` : d || c || 'Tous les produits';
  }

  return (
    <>
      <Header active="collection" />
      <CollectionView
        products={list}
        now={now}
        pills={pills}
        breadcrumbLabel={label}
        query={query}
        clearHref={collectionHref(dep, cat)}
        inStockCount={products.filter((p) => p.inStock).length}
      />
      <Footer />
    </>
  );
}
