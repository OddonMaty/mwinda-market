import type { Metadata } from 'next';
import { Header, Footer } from '../../components/Chrome';
import { CollectionView } from '../../components/CollectionView';
import { getProducts } from '../../data/source';
import { DEPARTMENTS } from '@saotech/shared';
import { collectionHref, departmentLabels, matchesSearch } from '../../lib';

export const metadata: Metadata = { title: 'Nos produits - Mwinda Market' };
export const dynamic = 'force-dynamic';

type SP = Promise<{ dep?: string; cat?: string; q?: string; pays?: string; ville?: string }>;

export default async function CollectionPage({ searchParams }: { searchParams: SP }) {
  const { dep = 'All', cat = 'All', q = '', pays = '', ville = '' } = await searchParams;
  const products = await getProducts();
  const query = q.trim();
  const now = Date.now();

  let list = products;
  if (dep !== 'All') list = list.filter((p) => p.department === dep);
  if (cat !== 'All') list = list.filter((p) => p.category === cat);
  if (query) list = list.filter((p) => matchesSearch(p, query));
  if (pays) list = list.filter((p) => p.countryCode === pays);
  if (ville) list = list.filter((p) => p.citySlug === ville);

  const inScope = dep !== 'All' ? products.filter((p) => p.department === dep) : products;
  const taxo = DEPARTMENTS.find((d) => d.slug === dep)?.categories ?? [];
  const categories = ['All', ...new Set([...taxo, ...inScope.map((p) => p.category).filter(Boolean)])];
  // Localisation : pays et villes où se trouvent des vendeurs, avec le nombre de produits (hors filtre de lieu).
  const base = products.filter((p) => (dep === 'All' || p.department === dep) && (cat === 'All' || p.category === cat) && (!query || matchesSearch(p, query)));
  const byCountry = new Map<string, { code: string; name: string; count: number; cities: Map<string, { slug: string; name: string; count: number }> }>();
  for (const p of base) {
    if (!p.countryCode) continue;
    const c = byCountry.get(p.countryCode) ?? { code: p.countryCode, name: p.countryName ?? p.countryCode, count: 0, cities: new Map() };
    c.count++;
    if (p.citySlug) { const ci = c.cities.get(p.citySlug) ?? { slug: p.citySlug, name: p.city ?? p.citySlug, count: 0 }; ci.count++; c.cities.set(p.citySlug, ci); }
    byCountry.set(p.countryCode, c);
  }
  const places = [...byCountry.values()].sort((a, b) => b.count - a.count).map((c) => ({ code: c.code, name: c.name, count: c.count, cities: [...c.cities.values()].sort((a, b) => b.count - a.count) }));
  const pills = categories.map((c) => ({
    label: c === 'All' ? 'Tous les produits' : c,
    href: collectionHref(dep, c, query, { pays, ville }),
    active: c === cat,
  }));

  let label: string;
  const placeName = ville ? places.flatMap((c) => c.cities).find((c) => c.slug === ville)?.name : pays ? places.find((c) => c.code === pays)?.name : null;
  if (query) label = `Résultats pour « ${query} » (${list.length})`;
  else {
    const d = dep !== 'All' ? departmentLabels[dep] : null;
    const c = cat !== 'All' ? cat : null;
    label = d && c ? `${d} — ${c}` : d || c || 'Tous les produits';
  }
  if (placeName) label += ` · ${placeName}`;

  return (
    <>
      <Header active="collection" />
      <CollectionView
        products={list}
        now={now}
        pills={pills}
        breadcrumbLabel={label}
        query={query}
        clearHref={collectionHref(dep, cat, undefined, { pays, ville })}
        inStockCount={products.filter((p) => p.inStock).length}
        activeDep={dep}
        places={places}
        place={{ pays, ville }}
        baseDep={dep}
        baseCat={cat}
      />
      <Footer />
    </>
  );
}
