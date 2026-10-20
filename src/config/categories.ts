/**
 * src/config/categories.ts
 * Taxonomie unique et centralisée pour Mwinda Market.
 * Utilisée par :
 * - Menu « Toutes les catégories » (Header)
 * - Accueil (sidebar desktop, tuiles promo, grille mobile)
 * - Filtres du catalogue (/produits)
 * - Fil d'ariane et liens catégories (/produits/[id])
 * - Catégories boutiques (/boutiques)
 * - Formulaire « Devenir vendeur » (/devenir-vendeur)
 */

export interface SubCategoryDefinition {
  slug: string;
  labelKey: string;
  defaultLabel: string;
  productCategory: string;
}

export interface CategoryTaxonomy {
  slug: string;
  labelKey: string;
  defaultLabel: string;
  icon: string;
  /** Liste des valeurs exactes présentes dans ElectronicProduct.category */
  productCategories: string[];
  subcategories?: SubCategoryDefinition[];
}

export const CATEGORY_TAXONOMY: CategoryTaxonomy[] = [
  {
    slug: "electronique",
    labelKey: "cat_electronics",
    defaultLabel: "Électronique",
    icon: "devices",
    productCategories: [
      "Smartphones & Tablettes",
      "Audio & Écouteurs",
      "Informatique & Ordinateurs",
      "Électroménager",
      "Électronique",
    ],
    subcategories: [
      {
        slug: "smartphones",
        labelKey: "subcat_smartphones",
        defaultLabel: "Smartphones & Tablettes",
        productCategory: "Smartphones & Tablettes",
      },
      {
        slug: "audio",
        labelKey: "subcat_audio",
        defaultLabel: "Audio & Écouteurs",
        productCategory: "Audio & Écouteurs",
      },
      {
        slug: "informatique",
        labelKey: "subcat_it",
        defaultLabel: "Informatique & PC",
        productCategory: "Informatique & Ordinateurs",
      },
      {
        slug: "electromenager",
        labelKey: "subcat_appliances",
        defaultLabel: "Électroménager",
        productCategory: "Électroménager",
      },
    ],
  },
  {
    slug: "energie-solaire",
    labelKey: "cat_solar",
    defaultLabel: "Énergie Solaire & Onduleurs",
    icon: "solar_power",
    productCategories: ["Énergie Solaire & Onduleurs"],
    subcategories: [
      {
        slug: "panneaux",
        labelKey: "subcat_solar_panels",
        defaultLabel: "Panneaux Solaires",
        productCategory: "Énergie Solaire & Onduleurs",
      },
      {
        slug: "batteries",
        labelKey: "subcat_solar_batteries",
        defaultLabel: "Batteries LiFePO4",
        productCategory: "Énergie Solaire & Onduleurs",
      },
      {
        slug: "onduleurs",
        labelKey: "subcat_solar_inverters",
        defaultLabel: "Onduleurs & MPPT",
        productCategory: "Énergie Solaire & Onduleurs",
      },
    ],
  },
  {
    slug: "mode",
    labelKey: "cat_fashion",
    defaultLabel: "Mode & Habillement",
    icon: "checkroom",
    productCategories: ["Mode & Habillement"],
    subcategories: [
      {
        slug: "wax-pagne",
        labelKey: "subcat_wax",
        defaultLabel: "Wax & Pagnes",
        productCategory: "Mode & Habillement",
      },
      {
        slug: "pret-a-porter",
        labelKey: "subcat_pret_a_porter",
        defaultLabel: "Prêt-à-porter",
        productCategory: "Mode & Habillement",
      },
      {
        slug: "maroquinerie",
        labelKey: "subcat_leather",
        defaultLabel: "Maroquinerie & Chaussures",
        productCategory: "Mode & Habillement",
      },
    ],
  },
  {
    slug: "maison",
    labelKey: "cat_home",
    defaultLabel: "Maison & Décoration",
    icon: "chair",
    productCategories: ["Maison & Décoration"],
    subcategories: [
      {
        slug: "decoration",
        labelKey: "subcat_deco",
        defaultLabel: "Décoration Africaine",
        productCategory: "Maison & Décoration",
      },
      {
        slug: "mobilier",
        labelKey: "subcat_furniture",
        defaultLabel: "Mobilier & Salon",
        productCategory: "Maison & Décoration",
      },
    ],
  },
  {
    slug: "beaute",
    labelKey: "cat_beauty",
    defaultLabel: "Beauté & Bien-être",
    icon: "spa",
    productCategories: ["Beauté & Santé", "Beauté & Bien-être"],
  },
  {
    slug: "alimentation",
    labelKey: "cat_food",
    defaultLabel: "Alimentation",
    icon: "restaurant",
    productCategories: ["Alimentation", "Alimentation & Produits Locaux"],
  },
];

/**
 * Recherche une catégorie par son slug.
 */
export function getCategoryBySlug(slug: string): CategoryTaxonomy | undefined {
  const normalized = (slug || "").toLowerCase().trim();
  return CATEGORY_TAXONOMY.find(
    (c) =>
      c.slug === normalized ||
      c.defaultLabel.toLowerCase() === normalized ||
      c.defaultLabel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalized
  );
}

/**
 * Détermine la catégorie principale associée à un produit en fonction de son champ product.category.
 */
export function getCategoryForProduct(productCategory: string): CategoryTaxonomy {
  const normalized = (productCategory || "").toLowerCase().trim();

  for (const cat of CATEGORY_TAXONOMY) {
    if (cat.productCategories.some((pc) => pc.toLowerCase() === normalized)) {
      return cat;
    }
  }

  // Fallback partiel
  if (normalized.includes("mode") || normalized.includes("wax") || normalized.includes("vêtement")) {
    return CATEGORY_TAXONOMY.find((c) => c.slug === "mode")!;
  }
  if (normalized.includes("solaire") || normalized.includes("onduleur") || normalized.includes("batterie")) {
    return CATEGORY_TAXONOMY.find((c) => c.slug === "energie-solaire")!;
  }
  if (normalized.includes("maison") || normalized.includes("déco") || normalized.includes("deco") || normalized.includes("meuble")) {
    return CATEGORY_TAXONOMY.find((c) => c.slug === "maison")!;
  }
  if (normalized.includes("beauté") || normalized.includes("beaute") || normalized.includes("santé")) {
    return CATEGORY_TAXONOMY.find((c) => c.slug === "beaute")!;
  }
  if (normalized.includes("aliment") || normalized.includes("nourriture") || normalized.includes("saveur")) {
    return CATEGORY_TAXONOMY.find((c) => c.slug === "alimentation")!;
  }

  return CATEGORY_TAXONOMY[0]; // défaut: electronique
}

/**
 * Vérifie si un produit correspond à un filtre de catégorie (par slug ou nom de catégorie).
 */
export function matchProductToCategory(
  productCategory: string,
  categorySlugOrLabel?: string
): boolean {
  if (
    !categorySlugOrLabel ||
    categorySlugOrLabel.toLowerCase() === "all" ||
    categorySlugOrLabel.toLowerCase() === "toutes" ||
    categorySlugOrLabel.toLowerCase() === "tous"
  ) {
    return true;
  }

  const catDef = getCategoryBySlug(categorySlugOrLabel);
  if (catDef) {
    return catDef.productCategories.some(
      (pc) => pc.toLowerCase() === productCategory.toLowerCase().trim()
    );
  }

  // Vérification directe par nom exact ou sous-chaîne
  const normCat = productCategory.toLowerCase().trim();
  const normTarget = categorySlugOrLabel.toLowerCase().trim();
  return normCat === normTarget || normCat.includes(normTarget);
}

/**
 * Compte le nombre de produits correspondant à une catégorie.
 */
export function countProductsInCategory(
  products: Array<{ category: string }>,
  slug: string
): number {
  return products.filter((p) => matchProductToCategory(p.category, slug)).length;
}

/**
 * Retourne uniquement les catégories qui possèdent au moins 1 produit réel dans le catalogue.
 * Règle 2.4 : les catégories à 0 produit sont exclues de l'affichage menu et accueil.
 */
export function getActiveCategories(
  products: Array<{ category: string }>
): CategoryTaxonomy[] {
  return CATEGORY_TAXONOMY.filter((cat) => countProductsInCategory(products, cat.slug) > 0);
}
