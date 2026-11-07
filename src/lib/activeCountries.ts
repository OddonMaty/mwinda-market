import { AFRICAN_COUNTRIES, Country } from "@/data/countries";
import { Shop } from "@/data/shops";

/**
 * Retourne la liste complète des pays africains pour le sélecteur panafricain.
 * La RDC (CD) et les grands pôles commerciaux sont placés en tête,
 * suivis de tous les pays d'Afrique par ordre alphabétique.
 */
export function getActiveCountries(shops?: Shop[]): Country[] {
  // Cloner la liste complète des 54 pays africains
  const list = [...AFRICAN_COUNTRIES];

  // Priorités d'affichage en tête : RDC, Congo Brazzaville, Côte d'Ivoire, Sénégal, Cameroun
  const priorityCodes = ["CD", "CG", "CI", "SN", "CM", "GA", "RW", "AO"];
  const prioritized: Country[] = [];
  const others: Country[] = [];

  for (const code of priorityCodes) {
    const found = list.find((c) => c.code.toUpperCase() === code);
    if (found) prioritized.push(found);
  }

  for (const c of list) {
    if (!priorityCodes.includes(c.code.toUpperCase())) {
      others.push(c);
    }
  }

  // Trier le reste alphabétiquement par nom français
  others.sort((a, b) => a.name.fr.localeCompare(b.name.fr));

  return [...prioritized, ...others];
}

/**
 * Vérifie si un pays donné est supporté sur Mwinda Market (tous les pays d'Afrique).
 */
export function isCountryActive(countryCode: string): boolean {
  const normalized = (countryCode || "").toUpperCase();
  return AFRICAN_COUNTRIES.some((c) => c.code.toUpperCase() === normalized);
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
export function getShopCountByCountry(countryCode: string, shops: Shop[] = []): number {
  const normalized = (countryCode || "CD").toUpperCase();
  return shops.filter((s) => (s.countryCode || "CD").toUpperCase() === normalized).length;
}
