/**
 * src/lib/discounts.ts
 * Fonction unique et centralisée pour le calcul des remises réelles de Mwinda Market.
 * Plus aucun pourcentage codé en dur.
 */

/**
 * Calcule le pourcentage de remise réel arrondi à l'entier le plus proche.
 * Retourne null s'il n'y a pas d'ancien prix valide supérieur au prix actuel.
 *
 * @param price Prix actuel (usdPrice)
 * @param originalPrice Ancien prix barré (originalUsdPrice)
 */
export function getDiscountPercent(
  productOrPrice: number | { usdPrice: number; originalUsdPrice?: number | null },
  originalPrice?: number | null
): number | null {
  if (typeof productOrPrice === "object" && productOrPrice !== null) {
    return getDiscountPercent(productOrPrice.usdPrice, productOrPrice.originalUsdPrice);
  }
  if (!originalPrice || originalPrice <= productOrPrice) return null;
  const percent = Math.round((1 - productOrPrice / originalPrice) * 100);
  return percent > 0 ? percent : null;
}

/**
 * Retourne le libellé formaté de remise (ex: "-25%") ou null.
 */
export function getDiscountBadgeText(
  productOrPrice: number | { usdPrice: number; originalUsdPrice?: number | null },
  originalPrice?: number | null
): string | null {
  if (typeof productOrPrice === "object" && productOrPrice !== null) {
    return getDiscountBadgeText(productOrPrice.usdPrice, productOrPrice.originalUsdPrice);
  }
  const percent = getDiscountPercent(productOrPrice, originalPrice);
  return percent ? `-${percent}%` : null;
}

/**
 * Calcule la remise maximale réelle présente sur l'ensemble d'une liste de produits.
 */
export function getMaxRealDiscount(
  products: Array<{ usdPrice: number; originalUsdPrice?: number | null }>
): number {
  let max = 0;
  for (const p of products) {
    const pct = getDiscountPercent(p.usdPrice, p.originalUsdPrice);
    if (pct && pct > max) {
      max = pct;
    }
  }
  return max;
}
