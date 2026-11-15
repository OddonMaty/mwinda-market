import type { Product } from './data/catalogue';

export const USD_TO_CDF = 2800; // taux de secours de l'ancien site (a remplacer par un taux en base)
const NEW_WINDOW_DAYS = 30;

export function formatPrice(usd: number): string {
  const cdf = Math.round(usd * USD_TO_CDF);
  // Intl fr-FR utilise des espaces insécables fines, comme sur l'ancien site
  return new Intl.NumberFormat('fr-FR').format(cdf) + ' FC';
}

export function productImageUrl(image: string | undefined, w: number, h: number): string {
  if (!image) return `https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=${w}&h=${h}&fit=crop&auto=format`;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  if (image.includes('/') || /\.(jpe?g|png|webp|gif|avif)$/i.test(image)) return image;
  return `https://images.unsplash.com/photo-${image}?w=${w}&h=${h}&fit=crop&auto=format`;
}

export function isProductNew(p: Product, now = Date.now()): boolean {
  const t = new Date(p.createdAt).getTime();
  if (Number.isNaN(t)) return false;
  const age = (now - t) / 86_400_000;
  return age >= 0 && age <= NEW_WINDOW_DAYS;
}

export const departmentLabels: Record<string, string> = {
  electronique: 'Gadgets Électroniques',
  construction: 'Matériaux de Construction',
  vetements: 'Vêtements et Chaussures',
  imprimantes: 'Imprimantes',
};

export function normalizeSearchText(text: unknown): string {
  return String(text ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function matchesSearch(p: Product, query: string): boolean {
  if (!query) return true;
  const q = normalizeSearchText(query);
  return normalizeSearchText(p.name).includes(q) || normalizeSearchText(p.category).includes(q) || normalizeSearchText(p.description).includes(q);
}

export function collectionHref(department?: string, category?: string, q?: string): string {
  const sp = new URLSearchParams();
  if (q) sp.set('q', q);
  if (department && department !== 'All') sp.set('dep', department);
  if (category && category !== 'All') sp.set('cat', category);
  const s = sp.toString();
  return s ? `/collection?${s}` : '/collection';
}
