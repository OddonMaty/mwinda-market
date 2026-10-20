/**
 * src/config/contact.ts
 * Source unique de vérité pour toutes les coordonnées de contact de Mwinda Market.
 */

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
