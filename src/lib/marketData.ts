/**
 * marketData.ts — Source centrale de vérité pour tous les produits et boutiques.
 * Toutes les pages passent par ces fonctions.
 * Prêt pour remplacement par API / base de données en Phase 3+.
 */

import { SHOPS_DATA, Shop } from "@/data/shops";
import { ELECTRONICS_PRODUCTS, ElectronicProduct } from "@/data/electronics";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Retourne le code pays d'une boutique (défaut : "CD" pour la RDC) */
export function getShopCountryCode(shop: Shop): string {
  return (shop.countryCode || "CD").toUpperCase();
}

/** Retourne le code pays d'un produit en remontant via shopId → shop.countryCode */
export function getProductCountryCode(product: ElectronicProduct): string {
  if (product.shopId) {
    const shop = SHOPS_DATA.find((s) => s.id === product.shopId);
    if (shop) return getShopCountryCode(shop);
  }
  // Fallback : produits sans shopId appartiennent à la RDC
  return "CD";
}

// ─── Boutiques ────────────────────────────────────────────────────────────────

/**
 * Retourne TOUTES les boutiques (catalogue global panafricain sans filtre pays).
 */
export function getAllShops(): Shop[] {
  return SHOPS_DATA;
}

/**
 * Retourne toutes les boutiques d'un pays donné.
 * @param countryCode Code ISO 3166-1 alpha-2 (ex: "CD", "CG", "RW")
 */
export function getShopsByCountry(countryCode: string): Shop[] {
  const code = (countryCode || "CD").toUpperCase();
  return SHOPS_DATA.filter((s) => getShopCountryCode(s) === code);
}

/**
 * Retourne une boutique par son ID.
 */
export function getShopById(id: string): Shop | undefined {
  return SHOPS_DATA.find((s) => s.id === id);
}

// ─── Produits ─────────────────────────────────────────────────────────────────

/**
 * Retourne TOUS les produits (catalogue global panafricain sans filtre pays).
 */
export function getAllProducts(): ElectronicProduct[] {
  return ELECTRONICS_PRODUCTS;
}

/**
 * Retourne tous les produits d'un pays donné.
 * Le pays d'un produit est déduit de sa boutique (via shopId).
 * @param countryCode Code ISO 3166-1 alpha-2 (ex: "CD", "KE", "CI")
 */
export function getProductsByCountry(countryCode: string): ElectronicProduct[] {
  const code = (countryCode || "CD").toUpperCase();
  return ELECTRONICS_PRODUCTS.filter(
    (p) => getProductCountryCode(p) === code
  );
}

/**
 * Retourne un produit par son ID.
 */
export function getProductById(id: string): ElectronicProduct | undefined {
  return ELECTRONICS_PRODUCTS.find((p) => p.id === id);
}

/**
 * Retourne tous les produits d'une boutique donnée (par shopId).
 */
export function getProductsByShop(shopId: string): ElectronicProduct[] {
  return ELECTRONICS_PRODUCTS.filter((p) => p.shopId === shopId);
}

/**
 * Retourne les régions/provinces distinctes présentes dans TOUTES les boutiques (global).
 */
export function getAllShopProvinces(): string[] {
  const provinces = new Set<string>();
  SHOPS_DATA.forEach((s) => {
    if (s.province) provinces.add(s.province);
  });
  return Array.from(provinces).sort();
}

/**
 * Retourne les régions/provinces distinctes présentes dans les boutiques d'un pays.
 * Utilisé pour alimenter les filtres de province.
 */
export function getProvincesByCountry(countryCode: string): string[] {
  const shops = getShopsByCountry(countryCode);
  const provinces = new Set<string>();
  shops.forEach((s) => {
    if (s.province) provinces.add(s.province);
  });
  return Array.from(provinces).sort();
}

/**
 * Retourne les régions/provinces distinctes dans TOUS les produits (global).
 */
export function getAllProductProvinces(): string[] {
  const provinces = new Set<string>();
  ELECTRONICS_PRODUCTS.forEach((p) => {
    if (p.province) provinces.add(p.province);
  });
  return Array.from(provinces).sort();
}

/**
 * Retourne les régions/provinces distinctes dans les produits d'un pays.
 */
export function getProductProvincesByCountry(countryCode: string): string[] {
  const products = getProductsByCountry(countryCode);
  const provinces = new Set<string>();
  products.forEach((p) => {
    if (p.province) provinces.add(p.province);
  });
  return Array.from(provinces).sort();
}

/**
 * Retourne les noms de boutiques distincts dans TOUS les produits (global).
 */
export function getAllShopNames(): string[] {
  const names = new Set<string>();
  ELECTRONICS_PRODUCTS.forEach((p) => {
    if (p.shopName) names.add(p.shopName);
  });
  return Array.from(names).sort();
}

/**
 * Retourne les noms de boutiques distincts dans les produits d'un pays.
 */
export function getShopNamesByCountry(countryCode: string): string[] {
  const products = getProductsByCountry(countryCode);
  const names = new Set<string>();
  products.forEach((p) => {
    if (p.shopName) names.add(p.shopName);
  });
  return Array.from(names).sort();
}

/**
 * Convertit un produit ElectronicProduct en objet minimal Product (pour ProductCard).
 * Évite les imports croisés entre pages.
 */
export function toProductCard(p: ElectronicProduct) {
  return {
    id: p.id,
    title: p.title,
    shopName: p.shopName,
    shopCity: p.shopCity,
    shopCountryCode: getProductCountryCode(p),
    shopVerified: p.shopVerified,
    image: p.image,
    usdPrice: p.usdPrice,
    originalUsdPrice: p.originalUsdPrice,
    rating: p.rating,
    reviewCount: p.reviewCount,
    badges: p.badges,
  };
}
