/** Taux indicatifs : unités de monnaie locale pour 1 USD. Les prix sont fixés en dollars ; la valeur locale n'est qu'une aide à la lecture. */
export const USD_RATES: Readonly<Record<string, number>> = {
  USD: 1, CDF: 2800, AOA: 912, BIF: 2900, BWP: 13.6, CVE: 100, DJF: 178, DZD: 134, EGP: 48, ERN: 15, ETB: 135, GHS: 12.5, GMD: 71,
  GNF: 8600, KES: 129, KMF: 450, LRD: 190, LSL: 18, LYD: 5, MAD: 9.3, MGA: 4500, MRU: 40, MUR: 45, MWK: 1750, MZN: 64, NAD: 18,
  NGN: 1500, RWF: 1400, SCR: 14, SDG: 600, SLE: 23, SOS: 571, SSP: 4500, STN: 22, SZL: 18, TND: 3.1, TZS: 2600, UGX: 3600,
  XAF: 600, XOF: 600, ZAR: 18, ZMW: 25, ZWL: 26,
};
const SYMBOLS: Record<string, string> = { CDF: 'FC', XAF: 'FCFA', XOF: 'FCFA', ZAR: 'R', NGN: '₦', GHS: 'GH₵', KES: 'KSh', UGX: 'USh', TZS: 'TSh', RWF: 'FRw', MAD: 'DH', DZD: 'DA', EGP: 'E£', ZWL: 'ZiG' };

/** Montant local (arrondi) d'un prix en USD ; null si la monnaie est le dollar ou inconnue. */
export function toLocal(usd: number, currency: string | null | undefined): { amount: number; symbol: string } | null {
  if (!currency || currency === 'USD') return null;
  const rate = USD_RATES[currency];
  if (!rate) return null;
  const raw = usd * rate;
  return { amount: raw >= 100 ? Math.round(raw) : Math.round(raw * 100) / 100, symbol: SYMBOLS[currency] ?? currency };
}
