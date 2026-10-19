/**
 * Table de taux de change paramétrable (Base: 1 USD).
 * Taux fixes de démonstration pour la Phase 1, conçus pour être branchés
 * ultérieurement sur un oracle ou une API financière temps réel.
 */
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  CDF: 2800, // RD Congo (taux officiel/marché de référence)
  XAF: 615,  // Congo-Brazzaville, Cameroun, Gabon, Tchad, RCA, Guinée Équatoriale
  XOF: 615,  // Côte d'Ivoire, Sénégal, Bénin, Togo, Mali, Burkina Faso, Niger, Guinée-Bissau
  RWF: 1350, // Rwanda
  KES: 130,  // Kenya
  AOA: 920,  // Angola
  BIF: 2950, // Burundi
  TZS: 2600, // Tanzanie
  UGX: 3700, // Ouganda
  NGN: 1550, // Nigéria
  GHS: 15.5, // Ghana
  ZAR: 18.2, // Afrique du Sud
  MZN: 64,   // Mozambique
  MAD: 10,   // Maroc
  EGP: 48,   // Égypte
  ETB: 115,  // Éthiopie
  ZMW: 27,   // Zambie
  DZD: 134,  // Algérie
  TND: 3.1,  // Tunisie
};

/**
 * Convertit un montant exprimé en USD vers la devise cible.
 */
export function convertUsdToCurrency(usdAmount: number, currencyCode: string): number {
  const code = (currencyCode || "USD").toUpperCase();
  const rate = EXCHANGE_RATES[code] || 1;
  const raw = usdAmount * rate;

  // Arrondi adapté selon les devises à grande valeur faciale (CDF, XAF, RWF, BIF, UGX...)
  if (["CDF", "XAF", "XOF", "RWF", "BIF", "UGX", "TZS", "GNF", "AOA"].includes(code)) {
    return Math.round(raw / 10) * 10;
  }
  if (rate >= 100) {
    return Math.round(raw);
  }
  return Math.round(raw * 100) / 100;
}

/**
 * Formate un montant dans la devise spécifiée avec le séparateur de milliers local.
 */
export function formatLocalPrice(
  amount: number,
  currencyCode: string,
  symbol?: string
): string {
  const code = (currencyCode || "USD").toUpperCase();
  const formattedNumber = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: ["CDF", "XAF", "XOF", "RWF", "BIF", "UGX"].includes(code) ? 0 : 2,
    minimumFractionDigits: ["CDF", "XAF", "XOF", "RWF", "BIF", "UGX"].includes(code) ? 0 : 2,
  }).format(amount).replace(/\u202F/g, " ");

  const displaySymbol = symbol || code;
  return `${formattedNumber} ${displaySymbol}`;
}
