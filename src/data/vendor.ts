export interface VendorOrder {
  id: string;
  reference: string;
  customerName: string;
  destination: string;
  province: string;
  itemsSummary: string;
  itemCount: number;
  icon: string;
  status: "in_delivery" | "shipped_hub" | "delivered" | "in_prep" | "pending";
  statusLabel: string;
  date: string;
  amountUsd: number;
  amountCdf: number;
  paymentMethod: string;
}

export interface VendorProduct {
  id: string;
  name: string;
  category: string;
  priceUsd: number;
  priceCdf: number;
  stock: number;
  status: "active" | "low_stock" | "out_of_stock" | "disabled";
  salesCount: number;
  rating: number;
  image: string;
  sku: string;
}

export interface VendorStats {
  totalSalesUsd: number;
  totalSalesCdf: number;
  salesGrowthPercent: number;
  ordersCount: number;
  shippingSuccessRate: number;
  ordersGrowthPercent: number;
  productsCount: number;
  lowStockCount: number;
  inStockPercent: number;
  customerCount: number;
  newCustomersThisMonth: number;
  provincesCovered: number;
  availableBalanceUsd: number;
  availableBalanceCdf: number;
  customerRating: number;
  complianceRate: number;
  hubShippingTimeHours: number;
}

export interface VendorProfile {
  name: string;
  role: string;
  shopName: string;
  shopId: string;
  hubLocation: string;
  countryCode: string;
  countryName: string;
  countryFlag: string;
  settlementCurrency: {
    code: string;
    symbol: string;
    name: string;
  };
  settlementMethod: string;
  phone: string;
  supportPhone: string;
  verified: boolean;
  avatarUrl: string;
}

export interface CountryPayoutConfig {
  hasMobileMoney: boolean;
  mobileMoneyOperators: string[];
  settlementMethodKey: string;
}

export const COUNTRY_PAYOUT_CONFIGS: Record<string, CountryPayoutConfig> = {
  CD: {
    hasMobileMoney: true,
    mobileMoneyOperators: [
      "M-Pesa (+243 81 234 5678)",
      "Orange Money (+243 89 123 4567)",
      "Airtel Money (+243 99 876 5432)",
      "Virement bancaire (Rawbank)",
    ],
    settlementMethodKey: "Mobile Money (M-Pesa, Orange Money, Airtel Money)",
  },
  CG: {
    hasMobileMoney: true,
    mobileMoneyOperators: [
      "MTN MoMo (+242 06 123 4567)",
      "Airtel Money (+242 05 987 6543)",
      "Virement bancaire (BGFI Bank)",
    ],
    settlementMethodKey: "Mobile Money (MTN MoMo, Airtel Money)",
  },
  RW: {
    hasMobileMoney: true,
    mobileMoneyOperators: [
      "MTN MoMo (+250 78 123 4567)",
      "Airtel Money (+250 73 987 6543)",
      "Virement bancaire (Bank of Kigali)",
    ],
    settlementMethodKey: "Mobile Money (MTN MoMo, Airtel Money)",
  },
  KE: {
    hasMobileMoney: true,
    mobileMoneyOperators: [
      "M-Pesa (+254 712 345678)",
      "Airtel Money (+254 733 987654)",
      "Virement bancaire (Equity Bank)",
    ],
    settlementMethodKey: "Mobile Money (M-Pesa, Airtel Money)",
  },
  CI: {
    hasMobileMoney: true,
    mobileMoneyOperators: [
      "Wave (+225 07 1234 5678)",
      "Orange Money (+225 05 1234 5678)",
      "MTN MoMo (+225 01 1234 5678)",
      "Virement bancaire (SGCI)",
    ],
    settlementMethodKey: "Mobile Money (Wave, Orange Money, MTN MoMo)",
  },
  AO: {
    hasMobileMoney: false,
    mobileMoneyOperators: [
      "Virement bancaire (Banco BAI)",
      "Multicaixa Express",
    ],
    settlementMethodKey: "Virement bancaire / Multicaixa",
  },
  CM: {
    hasMobileMoney: true,
    mobileMoneyOperators: [
      "MTN MoMo (+237 67 123 4567)",
      "Orange Money (+237 69 123 4567)",
      "Virement bancaire (Afriland First Bank)",
    ],
    settlementMethodKey: "Mobile Money (MTN MoMo, Orange Money)",
  },
  SN: {
    hasMobileMoney: true,
    mobileMoneyOperators: [
      "Wave (+221 77 123 4567)",
      "Orange Money (+221 78 123 4567)",
      "Virement bancaire (CBAO)",
    ],
    settlementMethodKey: "Mobile Money (Wave, Orange Money)",
  },
};

export function getPayoutConfigForCountry(countryCode: string): CountryPayoutConfig {
  const code = (countryCode || "CD").toUpperCase();
  return (
    COUNTRY_PAYOUT_CONFIGS[code] || {
      hasMobileMoney: false,
      mobileMoneyOperators: [
        "Virement bancaire (Swift / SEPA / Local)",
        "Carte bancaire professionnelle",
      ],
      settlementMethodKey: "Virement bancaire",
    }
  );
}

export const VENDOR_PROFILE: VendorProfile = {
  name: "Godefroid Kalonji",
  role: "Gérant Vendeur Certifié",
  shopName: "Kin Fashion - Atelier Gombe",
  shopId: "kin-fashion",
  hubLocation: "Kinshasa Limete (RDC)",
  countryCode: "CD",
  countryName: "RD Congo",
  countryFlag: "🇨🇩",
  settlementCurrency: {
    code: "CDF",
    symbol: "FC",
    name: "Franc congolais",
  },
  settlementMethod: "Mobile Money (M-Pesa, Orange Money, Airtel Money)",
  phone: "+243 818 900 125",
  supportPhone: "+243 818 900 125",
  verified: true,
  avatarUrl: "/images/shops/vendor-avatar.jpg",
};

export const VENDOR_STATS: VendorStats = {
  totalSalesUsd: 25680,
  totalSalesCdf: 71904000,
  salesGrowthPercent: 18.5,
  ordersCount: 320,
  shippingSuccessRate: 99.4,
  ordersGrowthPercent: 12.0,
  productsCount: 150,
  lowStockCount: 8,
  inStockPercent: 98,
  customerCount: 2450,
  newCustomersThisMonth: 145,
  provincesCovered: 26,
  availableBalanceUsd: 4820,
  availableBalanceCdf: 13496000,
  customerRating: 4.9,
  complianceRate: 99.2,
  hubShippingTimeHours: 24,
};

export const VENDOR_RECENT_ORDERS: VendorOrder[] = [
  {
    id: "ord-1",
    reference: "MW-1250",
    customerName: "Jean-Luc Mukendi",
    destination: "Kinshasa Gombe",
    province: "Kinshasa",
    itemsSummary: "2x Robe Wax Moderne",
    itemCount: 2,
    icon: "checkroom",
    status: "in_delivery",
    statusLabel: "En cours de livraison",
    date: "Aujourd'hui, 14:15",
    amountUsd: 116.0,
    amountCdf: 324800,
    paymentMethod: "Payé via M-Pesa",
  },
  {
    id: "ord-2",
    reference: "MW-1249",
    customerName: "Marie Mwamba",
    destination: "Lubumbashi (Katanga)",
    province: "Haut-Katanga",
    itemsSummary: "1x Ensemble Abacost Lin",
    itemCount: 1,
    icon: "dry_cleaning",
    status: "shipped_hub",
    statusLabel: "Expédié Hub Kinshasa",
    date: "Aujourd'hui, 11:30",
    amountUsd: 195.0,
    amountCdf: 546000,
    paymentMethod: "Orange Money (Séquestre)",
  },
  {
    id: "ord-3",
    reference: "MW-1248",
    customerName: "Patrick Kasongo",
    destination: "Goma (Nord-Kivu)",
    province: "Nord-Kivu",
    itemsSummary: "3x Chemise Lin & Pagne",
    itemCount: 3,
    icon: "apparel",
    status: "delivered",
    statusLabel: "Livré & Payé",
    date: "Hier, 18:40",
    amountUsd: 640.0,
    amountCdf: 1792000,
    paymentMethod: "Airtel Money",
  },
  {
    id: "ord-4",
    reference: "MW-1247",
    customerName: "Falonne Tshilanda",
    destination: "Matadi (Kongo Central)",
    province: "Kongo-Central",
    itemsSummary: "1x Foulard Soie Motifs Kuba",
    itemCount: 1,
    icon: "styler",
    status: "in_prep",
    statusLabel: "En préparation",
    date: "Hier, 16:10",
    amountUsd: 45.0,
    amountCdf: 126000,
    paymentMethod: "M-Pesa (Validé)",
  },
  {
    id: "ord-5",
    reference: "MW-1246",
    customerName: "David Bolamba",
    destination: "Kolwezi (Lualaba)",
    province: "Lualaba",
    itemsSummary: "1x Veste Saharienne Coton",
    itemCount: 1,
    icon: "checkroom",
    status: "shipped_hub",
    statusLabel: "Expédié Hub Kinshasa",
    date: "Il y a 2 jours, 09:15",
    amountUsd: 210.0,
    amountCdf: 588000,
    paymentMethod: "Orange Money",
  },
];

export const VENDOR_STOCK_ALERTS = [
  {
    id: "alert-1",
    title: "Ensemble Abacost Lin (Bleu Nuit, L)",
    subtitle: "Il ne reste que 2 pièces au Hub",
    icon: "dry_cleaning",
    actionLabel: "Créer un bon d'envoi",
  },
  {
    id: "alert-2",
    title: "Robe Wax Moderne 'Kinshasa Chic' (M)",
    subtitle: "3 pièces restantes • 8 paniers actifs",
    icon: "checkroom",
    actionLabel: "Créer un bon d'envoi",
  },
];

export const VENDOR_PRODUCTS: VendorProduct[] = [
  {
    id: "vp-1",
    name: "Robe Wax Moderne 'Kinshasa Chic'",
    category: "Mode Femme",
    priceUsd: 58.0,
    priceCdf: 162400,
    stock: 3,
    status: "low_stock",
    salesCount: 86,
    rating: 4.9,
    image:
      "/images/products/brazza-robe-wax-ndoki.jpg",
    sku: "KF-WAX-001",
  },
  {
    id: "vp-2",
    name: "Ensemble Abacost Lin Supérieur",
    category: "Mode Homme",
    priceUsd: 195.0,
    priceCdf: 546000,
    stock: 2,
    status: "low_stock",
    salesCount: 42,
    rating: 5.0,
    image:
      "/images/products/brazza-ensemble-kente-homme.jpg",
    sku: "KF-ABA-042",
  },
  {
    id: "vp-3",
    name: "Chemise Lin & Pagne Brodé",
    category: "Mode Homme",
    priceUsd: 85.0,
    priceCdf: 238000,
    stock: 24,
    status: "active",
    salesCount: 65,
    rating: 4.8,
    image:
      "/images/products/luanda-camisa-linho-angola.jpg",
    sku: "KF-CHM-018",
  },
  {
    id: "vp-4",
    name: "Foulard Soie Motifs Kuba Traditionnels",
    category: "Accessoires",
    priceUsd: 45.0,
    priceCdf: 126000,
    stock: 40,
    status: "active",
    salesCount: 112,
    rating: 4.9,
    image:
      "/images/products/brazza-sac-raphia-artisan.jpg",
    sku: "KF-ACC-009",
  },
  {
    id: "vp-5",
    name: "Veste Saharienne Coton Kinois",
    category: "Mode Homme",
    priceUsd: 210.0,
    priceCdf: 588000,
    stock: 15,
    status: "active",
    salesCount: 29,
    rating: 4.7,
    image:
      "/images/products/brazza-boubou-grande-occasion.jpg",
    sku: "KF-VES-003",
  },
  {
    id: "vp-6",
    name: "Kimono Wax & Soie 'Fleuve Congo'",
    category: "Mode Femme",
    priceUsd: 135.0,
    priceCdf: 378000,
    stock: 0,
    status: "out_of_stock",
    salesCount: 54,
    rating: 4.9,
    image:
      "/images/products/luanda-vestido-samakaka-festa.jpg",
    sku: "KF-KIM-011",
  },
];
