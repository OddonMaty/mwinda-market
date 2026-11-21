import { products as fallback, type Product } from './catalogue';

interface ApiProduct {
  id: number; name: string; description: string; priceUsd: number; originalPriceUsd: number | null; department: string; category: string; sku: string;
  colors: string[]; sizes: string[]; tags: string[]; inStock: boolean; rating: number; reviews: number; images: string[]; createdAt: string; certified?: boolean; shopName?: string;
}

const toProduct = (p: ApiProduct): Product => ({
  id: p.id, createdAt: p.createdAt.slice(0, 10), name: p.name, price: p.priceUsd, originalPrice: p.originalPriceUsd,
  discount: p.originalPriceUsd ? Math.round((1 - p.priceUsd / p.originalPriceUsd) * 100) : null,
  department: p.department, category: p.category, image: p.images[0] ?? '', images: p.images.slice(1), rating: p.rating, reviews: p.reviews,
  inStock: p.inStock, sku: p.sku, colors: p.colors, sizes: p.sizes, tags: p.tags, description: p.description, certified: !!p.certified, shopName: p.shopName,
});

/** Catalogue lu depuis l'API (boutique officielle + vendeurs) ; en cas de panne, repli sur la liste d'origine. */
export async function getProducts(): Promise<Product[]> {
  const api = process.env.API_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${api}/v1/products`, { next: { revalidate: 10 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(String(res.status));
    const { products } = (await res.json()) as { products: ApiProduct[] };
    return products.map(toProduct);
  } catch {
    return fallback;
  }
}

export interface LegalPageData { slug: string; title: string; body: string; updatedAt: string }

/** Texte légal rédigé depuis l'espace admin ; null tant qu'aucun texte n'a été enregistré (la page d'origine s'affiche alors). */
export async function getLegalPage(slug: string): Promise<LegalPageData | null> {
  const api = process.env.API_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${api}/v1/pages/${slug}`, { next: { revalidate: 30 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    return ((await res.json()) as { page: LegalPageData }).page;
  } catch {
    return null;
  }
}
