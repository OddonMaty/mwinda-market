export interface VendorPlan {
  id: "free" | "pro" | "elite" | "wholesale";
  name: string;
  tagline: string;
  priceUsd: number;
  priceCdfApprox: number;
  commissionRate: number; // in percent (e.g. 5 for 5%)
  productLimit: number | null; // null = unlimited
  badge?: string;
  popular?: boolean;
  features: string[];
  ctaLabel: string;
}

export const VENDOR_PLANS: VendorPlan[] = [
  {
    id: "free",
    name: "Mwinda Essentiel",
    tagline: "Lancez votre activité en ligne sans aucun frais fixe.",
    priceUsd: 0,
    priceCdfApprox: 0,
    commissionRate: 5.0,
    productLimit: 15,
    features: [
      "Jusqu'à 15 produits au catalogue",
      "Page boutique personnalisée",
      "Paiements Mobile Money sécurisés (Escrow)",
      "Gestion des commandes de base",
      "Support standard par email",
    ],
    ctaLabel: "Démarrer gratuitement",
  },
  {
    id: "pro",
    name: "Mwinda Pro",
    tagline: "Pour les commerçants et artisans réguliers en croissance.",
    priceUsd: 9,
    priceCdfApprox: 25000,
    commissionRate: 3.5,
    productLimit: 75,
    badge: "Vendeur Vérifié",
    popular: true,
    features: [
      "Jusqu'à 75 produits au catalogue",
      "Badge vert « Vendeur Vérifié »",
      "Commission réduite à 3.5% par vente",
      "Statistiques des ventes & visites",
      "Création de codes promos & réductions",
      "Assistance prioritaire sur WhatsApp",
    ],
    ctaLabel: "Choisir le forfait Pro",
  },
  {
    id: "elite",
    name: "Mwinda Élite",
    tagline: "Pour les marques et boutiques établies recherchant un volume élevé.",
    priceUsd: 19,
    priceCdfApprox: 52000,
    commissionRate: 2.0,
    productLimit: null,
    badge: "Boutique Officielle",
    features: [
      "Produits illimités",
      "Badge Or « Boutique Officielle »",
      "Commission minimale de 2.0% par vente",
      "Mise en avant sur la page d'accueil & recherches",
      "Outils marketing avancés & ventes flash",
      "Support prioritaire 7j/7",
    ],
    ctaLabel: "Passer à l'Élite",
  },
  {
    id: "wholesale",
    name: "Mwinda Grossiste & Marque",
    tagline: "Pour les grossistes, importateurs et distributeurs panafricains.",
    priceUsd: 39,
    priceCdfApprox: 105000,
    commissionRate: 1.0,
    productLimit: null,
    badge: "Grossiste Certifié",
    features: [
      "Produits illimités & catalogue B2B",
      "Tarifs dégressifs par volume (Vente en gros)",
      "Multi-comptes vendeurs (accès employés)",
      "Commission plancher de 1.0% seulement",
      "Intégration logistique & livreurs dédiés",
      "Conseiller de compte Mwinda dédié",
    ],
    ctaLabel: "Rejoindre en tant que Grossiste",
  },
];
