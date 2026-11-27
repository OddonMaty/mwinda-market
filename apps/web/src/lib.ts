import { DEPARTMENTS } from '@saotech/shared';
import type { Product } from './data/catalogue';

export const USD_TO_CDF = 2800; // taux de secours de l'ancien site (a remplacer par un taux en base)
const NEW_WINDOW_DAYS = 30;

/** Prix affiché en dollars : « $12.50 », sans décimales quand le montant est rond. */
export function formatUsd(usd: number): string {
  return '$' + new Intl.NumberFormat('en-US', { minimumFractionDigits: Number.isInteger(usd) ? 0 : 2, maximumFractionDigits: 2 }).format(usd);
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

export const departmentLabels: Record<string, string> = Object.fromEntries(DEPARTMENTS.map((d) => [d.slug, d.name]));

export function normalizeSearchText(text: unknown): string {
  return String(text ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function matchesSearch(p: Product, query: string): boolean {
  if (!query) return true;
  const q = normalizeSearchText(query);
  return normalizeSearchText(p.name).includes(q) || normalizeSearchText(p.category).includes(q) || normalizeSearchText(p.description).includes(q);
}

export function collectionHref(department?: string, category?: string, q?: string, place?: { pays?: string; ville?: string }): string {
  const sp = new URLSearchParams();
  if (q) sp.set('q', q);
  if (place?.pays) sp.set('pays', place.pays);
  if (place?.ville) sp.set('ville', place.ville);
  if (department && department !== 'All') sp.set('dep', department);
  if (category && category !== 'All') sp.set('cat', category);
  const s = sp.toString();
  return s ? `/collection?${s}` : '/collection';
}

/** « Goma, RD Congo » : où se trouve la boutique d'un produit. */
export const placeLabel = (p: { city?: string | null; countryName?: string | null }): string => [p.city, p.countryName].filter(Boolean).join(', ');
