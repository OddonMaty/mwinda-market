import { AFRICAN_COUNTRIES, Country } from "@/data/countries";
import { SHOPS_DATA, Shop } from "@/data/shops";

/**
 * Déduit la liste des pays actifs (ceux où au moins un vendeur a créé une boutique).
 * Une seule source de vérité, prête à être branchée sur une API ou base de données plus tard.
 */
export function getActiveCountries(shops: Shop[] = SHOPS_DATA): Country[] {
  // Ensemble des codes pays présents dans les boutiques (défaut 'CD' si non spécifié)
  const activeCodes = new Set<string>();

  for (const shop of shops) {
    const code = (shop.countryCode || "CD").toUpperCase();
    activeCodes.add(code);
  }

  // Filtrer les pays africains correspondants, en conservant la RDC en premier (zone phare)
  const activeList = AFRICAN_COUNTRIES.filter((country) =>
    activeCodes.has(country.code.toUpperCase())
  );

  // Garantir que la RDC (CD) est toujours présente et en tête
  const drcIndex = activeList.findIndex((c) => c.code === "CD");
  if (drcIndex > 0) {
    const [drc] = activeList.splice(drcIndex, 1);
    activeList.unshift(drc);
  } else if (drcIndex === -1) {
    const drc = AFRICAN_COUNTRIES.find((c) => c.code === "CD");
    if (drc) activeList.unshift(drc);
  }

  return activeList;
}

/**
 * Vérifie si un pays donné dispose de vendeurs actifs sur Mwinda Market.
 */
export function isCountryActive(countryCode: string, shops: Shop[] = SHOPS_DATA): boolean {
  const activeList = getActiveCountries(shops);
  return activeList.some((c) => c.code.toUpperCase() === countryCode.toUpperCase());
}

/**
 * Récupère les métadonnées d'un pays par son code ISO.
 */
export function getCountryByCode(code: string): Country | undefined {
  const normalized = (code || "").toUpperCase();
  return AFRICAN_COUNTRIES.find((c) => c.code.toUpperCase() === normalized);
}

/**
 * Nombre de boutiques actives pour un pays donné.
 */
export function getShopCountByCountry(countryCode: string, shops: Shop[] = SHOPS_DATA): number {
  const normalized = (countryCode || "CD").toUpperCase();
  return shops.filter((s) => (s.countryCode || "CD").toUpperCase() === normalized).length;
}
