"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";

import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductCard } from "@/components/ProductCard";
import { ElectronicProduct } from "@/data/electronics";
import { useMarket } from "@/context/MarketContext";
import { useCart } from "@/context/CartContext";
import { useT } from "@/i18n";
import {
  getAllProducts,
  getAllProductProvinces,
  getAllShopNames,
  toProductCard,
} from "@/lib/marketData";

const CATEGORY_SLUG_MAP: Record<string, string> = {
  electronique: "Électronique",
  electronics: "Électronique",
  mode: "Mode & Habillement",
  fashion: "Mode & Habillement",
  maison: "Maison & Décoration",
  home: "Maison & Décoration",
  beaute: "Beauté & Cosmétiques",
  beauty: "Beauté & Cosmétiques",
  alimentation: "Alimentation & Produits Frais",
  food: "Alimentation & Produits Frais",
  solaire: "Énergie Solaire & Onduleurs",
  energie: "Énergie Solaire & Onduleurs",
  "energie-solaire": "Énergie Solaire & Onduleurs",
  solar: "Énergie Solaire & Onduleurs",
  smartphones: "Smartphones & Tablettes",
  audio: "Audio & Écouteurs",
  informatique: "Informatique & Ordinateurs",
  electromenager: "Électroménager",
};

function resolveCategoryParam(param: string | null, availableCategories: string[]): string {
  if (!param) return "Tous";
  const normalized = param.trim().toLowerCase();
  if (CATEGORY_SLUG_MAP[normalized]) {
    return CATEGORY_SLUG_MAP[normalized];
  }
  const match = availableCategories.find(
    (c) =>
      c.toLowerCase() === normalized ||
      c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalized
  );
  if (match) return match;
  return param;
}

function CatalogContent() {
  const { country } = useMarket();
  const { addToCart } = useCart();
  const { t } = useT();
  const searchParams = useSearchParams();

  // Données globales sans filtre pays (catalogue panafricain)
  const allProducts = useMemo(() => getAllProducts(), []);
  const availableProvinces = useMemo(() => getAllProductProvinces(), []);
  const availableShops = useMemo(() => getAllShopNames(), []);
  const catalogCategories = useMemo(
    () => Array.from(new Set(allProducts.map((p) => p.category))),
    [allProducts]
  );

  const initialCategory = useMemo(() => {
    const cat = searchParams.get("category");
    return resolveCategoryParam(cat, catalogCategories);
  }, [searchParams, catalogCategories]);

  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(initialCategory);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setSelectedSubCategory(resolveCategoryParam(cat, catalogCategories));
    }
  }, [searchParams, catalogCategories]);

  // Catégories disponibles globalement
  const subCategories = useMemo(() => {
    const cats = new Set<string>();
    allProducts.forEach((p) => cats.add(p.category));
    if (selectedSubCategory !== "Tous") {
      cats.add(selectedSubCategory);
    }
    return ["Tous", ...Array.from(cats).sort()];
  }, [allProducts, selectedSubCategory]);

  // Max prix global
  const maxPriceInCatalog = useMemo(() => {
    if (allProducts.length === 0) return 700;
    const max = Math.max(...allProducts.map((p) => p.usdPrice));
    return Math.ceil(max / 100) * 100;
  }, [allProducts]);

  const [regionSearchText, setRegionSearchText] = useState<string>("");
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState<string>("Toutes");
  const [selectedShopFilter, setSelectedShopFilter] = useState<string>("Toutes");
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [onlyVerifiedShops, setOnlyVerifiedShops] = useState<boolean>(false);
  const [priceMax, setPriceMax] = useState<number>(700);
  const [sortOption, setSortOption] = useState<string>("pertinence");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sections repliables de la colonne de filtres
  const [openSections, setOpenSections] = useState({
    categories: true,
    price: true,
    region: true,
    rating: true,
    shops: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAddToCart = (product: ElectronicProduct) => {
    addToCart({
      id: product.id,
      title: product.title,
      image: product.image,
      usdPrice: product.usdPrice,
      originalUsdPrice: product.originalUsdPrice,
      shopName: product.shopName,
      shopCity: product.shopCity,
      province: product.province,
      badges: product.badges,
    });
    setToastMessage(`« ${product.title} » ${t("catalog.toast_added")}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleResetFilters = () => {
    setSelectedSubCategory("Tous");
    setRegionSearchText("");
    setSelectedProvinceFilter("Toutes");
    setSelectedShopFilter("Toutes");
    setMinRatingFilter(0);
    setOnlyVerifiedShops(false);
    setPriceMax(maxPriceInCatalog);
    setSortOption("pertinence");
  };

  const hasActiveFilters = useMemo(() => {
    return (
      selectedSubCategory !== "Tous" ||
      regionSearchText.trim() !== "" ||
      selectedProvinceFilter !== "Toutes" ||
      selectedShopFilter !== "Toutes" ||
      minRatingFilter > 0 ||
      onlyVerifiedShops ||
      priceMax < maxPriceInCatalog
    );
  }, [
    selectedSubCategory,
    regionSearchText,
    selectedProvinceFilter,
    selectedShopFilter,
    minRatingFilter,
    onlyVerifiedShops,
    priceMax,
    maxPriceInCatalog,
  ]);

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    if (selectedSubCategory !== "Tous") {
      result = result.filter((p) => p.category === selectedSubCategory);
    }

    if (regionSearchText.trim()) {
      const q = regionSearchText.toLowerCase();
      result = result.filter(
        (p) =>
          p.province.toLowerCase().includes(q) ||
          p.shopCity.toLowerCase().includes(q)
      );
    }

    if (selectedProvinceFilter !== "Toutes") {
      result = result.filter((p) => p.province === selectedProvinceFilter);
    }

    if (selectedShopFilter !== "Toutes") {
      result = result.filter((p) => p.shopName.includes(selectedShopFilter));
    }

    if (minRatingFilter > 0) {
      result = result.filter((p) => p.rating >= minRatingFilter);
    }

    if (onlyVerifiedShops) {
      result = result.filter((p) => p.shopVerified);
    }

    result = result.filter((p) => p.usdPrice <= priceMax);

    if (sortOption === "prix-asc") {
      result.sort((a, b) => a.usdPrice - b.usdPrice);
    } else if (sortOption === "prix-desc") {
      result.sort((a, b) => b.usdPrice - a.usdPrice);
    } else if (sortOption === "notes") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [
    allProducts,
    selectedSubCategory,
    regionSearchText,
    selectedProvinceFilter,
    selectedShopFilter,
    minRatingFilter,
    onlyVerifiedShops,
    priceMax,
    sortOption,
  ]);

  // Éléments du fil d'Ariane
  const breadcrumbItems = useMemo(() => {
    const items = [
      { label: t("catalog.breadcrumb_home") || "Accueil", href: "/", icon: "home" },
      {
        label: t("catalog.title") || "Catalogue",
        href: selectedSubCategory !== "Tous" ? "/produits" : undefined,
      },
    ];
    if (selectedSubCategory !== "Tous") {
      items.push({ label: selectedSubCategory, href: undefined });
    }
    return items;
  }, [t, selectedSubCategory]);

  // Contenu du volet de filtres (partagé desktop / tiroir mobile)
  const FilterPanelContent = () => (
    <div className="space-y-4">
      {/* Header filtres */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#0284C7] text-lg">tune</span>
          <span className="font-bold text-[#0B1B3D] font-display text-sm">
            {t("catalog.filters")}
          </span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-semibold text-[#EA580C] hover:underline"
          >
            {t("catalog.reset")}
          </button>
        )}
      </div>

      {/* 1. Catégories */}
      <div className="border-b border-[#E2E8F0] pb-3">
        <button
          type="button"
          onClick={() => toggleSection("categories")}
          className="w-full flex items-center justify-between py-1 text-xs font-bold text-[#0B1B3D] uppercase tracking-wider"
        >
          <span>{t("catalog.subcategories")}</span>
          <span className="material-symbols-outlined text-sm text-slate-400">
            {openSections.categories ? "expand_less" : "expand_more"}
          </span>
        </button>
        {openSections.categories && (
          <div className="mt-2 space-y-1 text-xs">
            {subCategories.map((cat) => (
              <label
                key={cat}
                className="flex items-center justify-between cursor-pointer py-1 px-1.5 rounded hover:bg-slate-50 transition"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="subcategory-filter"
                    checked={selectedSubCategory === cat}
                    onChange={() => setSelectedSubCategory(cat)}
                    className="text-[#0284C7] focus:ring-[#0284C7]"
                  />
                  <span
                    className={
                      selectedSubCategory === cat
                        ? "font-bold text-[#0B1B3D]"
                        : "text-slate-700"
                    }
                  >
                    {cat === "Tous" ? t("catalog.all_subcategories") : cat}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 2. Prix */}
      <div className="border-b border-[#E2E8F0] pb-3">
        <button
          type="button"
          onClick={() => toggleSection("price")}
          className="w-full flex items-center justify-between py-1 text-xs font-bold text-[#0B1B3D] uppercase tracking-wider"
        >
          <span>{t("catalog.max_price")}</span>
          <span className="text-xs font-bold text-[#0284C7]">{priceMax} $</span>
        </button>
        {openSections.price && (
          <div className="mt-2 space-y-2">
            <input
              type="range"
              min="30"
              max={maxPriceInCatalog}
              step="10"
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full accent-[#0284C7] cursor-pointer"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>30 $</span>
              <span>{maxPriceInCatalog} $</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Ville / Région */}
      <div className="border-b border-[#E2E8F0] pb-3">
        <button
          type="button"
          onClick={() => toggleSection("region")}
          className="w-full flex items-center justify-between py-1 text-xs font-bold text-[#0B1B3D] uppercase tracking-wider"
        >
          <span>{t("catalog.origin_province")}</span>
          <span className="material-symbols-outlined text-sm text-slate-400">
            {openSections.region ? "expand_less" : "expand_more"}
          </span>
        </button>
        {openSections.region && (
          <div className="mt-2 space-y-2">
            <div className="relative">
              <input
                type="text"
                value={regionSearchText}
                onChange={(e) => setRegionSearchText(e.target.value)}
                placeholder="Rechercher ville..."
                className="w-full pl-7 pr-2.5 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-md text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#0284C7]"
              />
              <span className="material-symbols-outlined absolute left-2 top-2 text-slate-400 text-sm">
                search
              </span>
            </div>
            <div className="space-y-1 text-xs max-h-40 overflow-y-auto pr-1">
              {["Toutes", ...availableProvinces].map((prov) => (
                <label
                  key={prov}
                  className="flex items-center justify-between cursor-pointer py-0.5 px-1 rounded hover:bg-slate-50 transition"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="province-filter"
                      checked={selectedProvinceFilter === prov}
                      onChange={() => setSelectedProvinceFilter(prov)}
                      className="text-[#0284C7] focus:ring-[#0284C7]"
                    />
                    <span
                      className={
                        selectedProvinceFilter === prov
                          ? "font-bold text-[#0B1B3D]"
                          : "text-slate-700"
                      }
                    >
                      {prov === "Toutes" ? t("catalog.all_provinces") : prov}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Note minimale */}
      <div className="border-b border-[#E2E8F0] pb-3">
        <button
          type="button"
          onClick={() => toggleSection("rating")}
          className="w-full flex items-center justify-between py-1 text-xs font-bold text-[#0B1B3D] uppercase tracking-wider"
        >
          <span>Avis &amp; Notes</span>
          <span className="material-symbols-outlined text-sm text-slate-400">
            {openSections.rating ? "expand_less" : "expand_more"}
          </span>
        </button>
        {openSections.rating && (
          <div className="mt-2 space-y-1.5 text-xs">
            {[
              { val: 0, label: "Toutes les notes" },
              { val: 4.5, label: "4.5★ et plus" },
              { val: 4.0, label: "4.0★ et plus" },
              { val: 3.5, label: "3.5★ et plus" },
            ].map((r) => (
              <label
                key={r.val}
                className="flex items-center gap-2 cursor-pointer py-0.5 px-1 rounded hover:bg-slate-50 transition"
              >
                <input
                  type="radio"
                  name="rating-filter"
                  checked={minRatingFilter === r.val}
                  onChange={() => setMinRatingFilter(r.val)}
                  className="text-[#0284C7] focus:ring-[#0284C7]"
                />
                <span
                  className={
                    minRatingFilter === r.val ? "font-bold text-[#0B1B3D]" : "text-slate-700"
                  }
                >
                  {r.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 5. Vendeur certifié & Boutiques */}
      <div className="pb-1">
        <button
          type="button"
          onClick={() => toggleSection("shops")}
          className="w-full flex items-center justify-between py-1 text-xs font-bold text-[#0B1B3D] uppercase tracking-wider"
        >
          <span>{t("catalog.certified_shop")}</span>
          <span className="material-symbols-outlined text-sm text-slate-400">
            {openSections.shops ? "expand_less" : "expand_more"}
          </span>
        </button>
        {openSections.shops && (
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer py-1 px-1 bg-slate-50 rounded border border-[#E2E8F0]">
              <input
                type="checkbox"
                checked={onlyVerifiedShops}
                onChange={(e) => setOnlyVerifiedShops(e.target.checked)}
                className="rounded text-[#0284C7] focus:ring-[#0284C7]"
              />
              <span className="text-xs font-bold text-[#0B1B3D] flex items-center gap-1">
                <span
                  className="material-symbols-outlined text-xs text-[#0284C7]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                <span>Vendeurs certifiés uniquement</span>
              </span>
            </label>

            <div className="space-y-1 text-xs max-h-36 overflow-y-auto pr-1">
              {["Toutes", ...availableShops].map((shop) => (
                <label
                  key={shop}
                  className="flex items-center justify-between cursor-pointer py-0.5 px-1 rounded hover:bg-slate-50 transition"
                >
                  <span className="flex items-center gap-2 truncate">
                    <input
                      type="radio"
                      name="shop-filter"
                      checked={selectedShopFilter === shop}
                      onChange={() => setSelectedShopFilter(shop)}
                      className="text-[#0284C7] focus:ring-[#0284C7]"
                    />
                    <span
                      className={`truncate ${
                        selectedShopFilter === shop
                          ? "font-bold text-[#0B1B3D]"
                          : "text-slate-700"
                      }`}
                    >
                      {shop === "Toutes" ? t("catalog.all_shops") : shop}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] selection:bg-[#EA580C] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[999] bg-[#0B1B3D] text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Header */}
      <Header />

      {/* Main Canvas Conteneur unifié max-w-[1280px] */}
      <main className="w-full max-w-[1280px] mx-auto px-4 lg:px-6 py-5 sm:py-6 flex-1 space-y-5">
        {/* En-tête de page : Fil d'Ariane, Titre, Nombre de résultats, Tri & Vue */}
        <div className="space-y-3 pb-3 border-b border-[#E2E8F0]">
          <Breadcrumb items={breadcrumbItems} />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-[#0B1B3D] font-display tracking-tight">
                  {selectedSubCategory !== "Tous"
                    ? selectedSubCategory
                    : t("catalog.title")}
                </h1>
                <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                  {filteredProducts.length} {t("catalog.products_found")}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Marché Panafricain • {country.flag} {country.currency.code} — {t("catalog.subtitle")}
              </p>
            </div>

            {/* Contrôles Desktop : Tri + Vue Grille/Liste */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              {/* Bouton Filtres Mobile */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-bold text-[#0B1B3D] shadow-2xs hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-base text-[#0284C7]">tune</span>
                <span>{t("catalog.filters")}</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
                )}
              </button>

              {/* Tri */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="hidden md:inline text-slate-500 font-medium">
                  {t("catalog.sort_by")} :
                </span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-2 text-xs font-semibold text-[#0B1B3D] outline-none cursor-pointer hover:border-slate-300"
                >
                  <option value="pertinence">{t("catalog.sort_relevance")}</option>
                  <option value="prix-asc">{t("catalog.sort_price_asc")}</option>
                  <option value="prix-desc">{t("catalog.sort_price_desc")}</option>
                  <option value="notes">{t("catalog.sort_rating")}</option>
                </select>
              </div>

              {/* Bascule Grille / Liste */}
              <div className="flex items-center border border-[#E2E8F0] rounded-lg p-0.5 bg-white shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded transition ${
                    viewMode === "grid"
                      ? "bg-slate-100 text-[#0B1B3D]"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                  title="Vue Grille"
                >
                  <span className="material-symbols-outlined text-base leading-none">
                    grid_view
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded transition ${
                    viewMode === "list"
                      ? "bg-slate-100 text-[#0B1B3D]"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                  title="Vue Liste"
                >
                  <span className="material-symbols-outlined text-base leading-none">
                    view_list
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Corps principal : Colonne de filtres (~260px) + Grille/Liste de produits */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Colonne de filtres Desktop (~260px) */}
          <aside className="hidden lg:block w-64 shrink-0 bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-2xs sticky top-24">
            <FilterPanelContent />
          </aside>

          {/* Tiroir mobile de filtres */}
          {mobileFilterOpen && (
            <div className="fixed inset-0 z-50 bg-[#0B1B3D]/60 backdrop-blur-sm lg:hidden flex justify-end">
              <div className="w-full max-w-xs h-full bg-white p-5 flex flex-col shadow-2xl overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-3 shrink-0">
                  <h3 className="font-bold text-[#0B1B3D] text-sm font-display">
                    {t("catalog.filters")} ({filteredProducts.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1 rounded-full hover:bg-slate-100"
                  >
                    <span className="material-symbols-outlined text-slate-500">close</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <FilterPanelContent />
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] mt-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(false)}
                    className="w-full py-2.5 bg-[#EA580C] text-white rounded-lg text-xs font-bold hover:bg-[#c2410c] transition"
                  >
                    Voir les {filteredProducts.length} produits
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Zone de contenu principale (Pastilles actives + Grille) */}
          <section className="flex-1 min-w-0 w-full space-y-4">
            {/* Pastilles de filtres actifs */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-white rounded-lg border border-[#E2E8F0] text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Filtres actifs :
                </span>

                {selectedSubCategory !== "Tous" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0B1B3D] border border-slate-200 text-xs font-medium">
                    <span>{selectedSubCategory}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedSubCategory("Tous")}
                      className="text-slate-400 hover:text-rose-600 font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                )}

                {priceMax < maxPriceInCatalog && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0B1B3D] border border-slate-200 text-xs font-medium">
                    <span>Max {priceMax} $</span>
                    <button
                      type="button"
                      onClick={() => setPriceMax(maxPriceInCatalog)}
                      className="text-slate-400 hover:text-rose-600 font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                )}

                {selectedProvinceFilter !== "Toutes" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0B1B3D] border border-slate-200 text-xs font-medium">
                    <span>{selectedProvinceFilter}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedProvinceFilter("Toutes")}
                      className="text-slate-400 hover:text-rose-600 font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                )}

                {regionSearchText.trim() !== "" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0B1B3D] border border-slate-200 text-xs font-medium">
                    <span>« {regionSearchText} »</span>
                    <button
                      type="button"
                      onClick={() => setRegionSearchText("")}
                      className="text-slate-400 hover:text-rose-600 font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                )}

                {selectedShopFilter !== "Toutes" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0B1B3D] border border-slate-200 text-xs font-medium">
                    <span>{selectedShopFilter}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedShopFilter("Toutes")}
                      className="text-slate-400 hover:text-rose-600 font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                )}

                {minRatingFilter > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0B1B3D] border border-slate-200 text-xs font-medium">
                    <span>{minRatingFilter}★ et +</span>
                    <button
                      type="button"
                      onClick={() => setMinRatingFilter(0)}
                      className="text-slate-400 hover:text-rose-600 font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                )}

                {onlyVerifiedShops && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0B1B3D] border border-slate-200 text-xs font-medium">
                    <span>Certifiés uniquement</span>
                    <button
                      type="button"
                      onClick={() => setOnlyVerifiedShops(false)}
                      className="text-slate-400 hover:text-rose-600 font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-[#EA580C] hover:underline ml-auto"
                >
                  Effacer tout
                </button>
              </div>
            )}

            {/* Rendu des produits ou État vide */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-10 text-center shadow-2xs space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <span className="material-symbols-outlined text-3xl">search_off</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#0B1B3D] font-display">
                    {t("catalog.no_products")}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Aucun produit ne correspond à vos filtres actuels. Essayez d&apos;élargir vos critères de recherche.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 bg-[#EA580C] text-white rounded-lg text-xs font-bold hover:bg-[#c2410c] transition shadow-xs"
                >
                  {t("catalog.reset")}
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={toProductCard(product)}
                    onAddToCart={() => handleAddToCart(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={toProductCard(product)}
                    layout="list"
                    onAddToCart={() => handleAddToCart(product)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#0284C7] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-[#0B1B3D]">Chargement du catalogue...</p>
          </div>
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
