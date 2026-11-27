import { products as fallback, type Product } from './catalogue';

interface ApiProduct {
  id: number; name: string; description: string; priceUsd: number; originalPriceUsd: number | null; department: string; category: string; sku: string;
  colors: string[]; sizes: string[]; tags: string[]; inStock: boolean; rating: number; reviews: number; images: string[]; createdAt: string; certified?: boolean; shopName?: string; shopSlug?: string; countryCode?: string | null; countryName?: string | null; city?: string | null; citySlug?: string | null;
}

const toProduct = (p: ApiProduct): Product => ({
  id: p.id, createdAt: p.createdAt.slice(0, 10), name: p.name, price: p.priceUsd, originalPrice: p.originalPriceUsd,
  discount: p.originalPriceUsd ? Math.round((1 - p.priceUsd / p.originalPriceUsd) * 100) : null,
  department: p.department, category: p.category, image: p.images[0] ?? '', images: p.images.slice(1), rating: p.rating, reviews: p.reviews,
  inStock: p.inStock, sku: p.sku, colors: p.colors, sizes: p.sizes, tags: p.tags, description: p.description, certified: !!p.certified, shopName: p.shopName, shopSlug: p.shopSlug,
  countryCode: p.countryCode ?? null, countryName: p.countryName ?? null, city: p.city ?? null, citySlug: p.citySlug ?? null,
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

export interface HeroSlideData { id: string; tag: string; title: string; text: string; image: string; priceUsd: number | null; href: string }

/** Diapositives du carrousel d'accueil, choisies par l'administration (vide si l'API est indisponible). */
export async function getHeroSlides(): Promise<HeroSlideData[]> {
  const api = process.env.API_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${api}/v1/hero`, { next: { revalidate: 10 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(String(res.status));
    return ((await res.json()) as { slides: HeroSlideData[] }).slides;
  } catch {
    return [];
  }
}

/** Produits promus « À la une » par l'administration (identifiants, dans l'ordre choisi). */
export async function getPromotedIds(): Promise<number[]> {
  const api = process.env.API_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${api}/v1/promotions`, { next: { revalidate: 10 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(String(res.status));
    return ((await res.json()) as { products: { productId: number }[] }).products.map((p) => p.productId);
  } catch {
    return [];
  }
}

export interface PublicShop { shop: { name: string; slug: string; description: string | null; certified: boolean; official: boolean; city: string | null; country: string | null; since: string; whatsapp: string | null }; products: Product[] }

/** Page publique d'une boutique ; null si elle n'existe pas ou n'est pas active. */
export async function getShop(slug: string): Promise<PublicShop | null> {
  const api = process.env.API_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${api}/v1/shops/${encodeURIComponent(slug)}`, { next: { revalidate: 10 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const d = (await res.json()) as { shop: PublicShop['shop']; products: ApiProduct[] };
    return { shop: d.shop, products: d.products.map(toProduct) };
  } catch {
    return null;
  }
}
