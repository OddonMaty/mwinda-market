/**
 * src/config/contact.ts
 * Source unique de vérité pour toutes les coordonnées de contact de Mwinda Market.
 */

export const SELLER_VALIDATION_DELAY = "48h";

export const CONTACT_CONFIG = {
  /** Numéro principal pour appels téléphoniques (format affichage international) */
  phone: "+243 818 900 125",
  /** Format sans espaces pour les liens tel: */
  phoneRaw: "+243818900125",
  /** Numéro WhatsApp au format international sans le signe + */
  whatsappNumber: "243818900125",
  /** Lien direct vers la conversation WhatsApp */
  whatsappLink: "https://wa.me/243818900125",
  /** Adresse e-mail officielle de support */
  email: "support@mwinda.market",
  /** Horaires d'ouverture du service client */
  hours: "Lun - Sam : 08h00 - 18h30 (GMT+1)",
} as const;

/**
 * Construit un lien WhatsApp officiel (format https://wa.me/<chiffres> sans '+' ni espaces).
 */
export function getWhatsAppLink(phone: string = CONTACT_CONFIG.phone): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

/**
 * Construit un lien téléphonique (format tel:<chiffres> avec '+' initial conservé).
 */
export function getTelLink(phone: string = CONTACT_CONFIG.phone): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return `tel:${cleaned}`;
}

