"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ElectronicProduct } from "@/data/electronics";
import { PriceTag } from "@/components/PriceTag";
import { useMarket } from "@/context/MarketContext";
import { useCart } from "@/context/CartContext";
import { useT } from "@/i18n";
import {
  getAllProducts,
  getAllProductProvinces,
  getAllShopNames,
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

function ElectronicsContent() {
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

  // Catégories disponibles globalement (inclut la catégorie sélectionnée même si 0 produit)
  const subCategories = useMemo(() => {
    const cats = new Set<string>();
    allProducts.forEach((p) => cats.add(p.category));
    if (selectedSubCategory !== "Tous") {
      cats.add(selectedSubCategory);
    }
    return ["Tous", ...Array.from(cats).sort()];
  }, [allProducts, selectedSubCategory]);

  // Max prix global (arrondi à la centaine supérieure)
  const maxPriceInCatalog = useMemo(() => {
    if (allProducts.length === 0) return 700;
    const max = Math.max(...allProducts.map((p) => p.usdPrice));
    return Math.ceil(max / 100) * 100;
  }, [allProducts]);

  const [regionSearchText, setRegionSearchText] = useState<string>("");
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState<string>("Toutes");
  const [selectedShopFilter, setSelectedShopFilter] = useState<string>("Toutes");
  const [priceMax, setPriceMax] = useState<number>(700);
  const [sortOption, setSortOption] = useState<string>("pertinence");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    setPriceMax(maxPriceInCatalog);
    setSortOption("pertinence");
  };

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

    result = result.filter((p) => p.usdPrice <= priceMax);

    if (sortOption === "prix-asc") {
      result.sort((a, b) => a.usdPrice - b.usdPrice);
    } else if (sortOption === "prix-desc") {
      result.sort((a, b) => b.usdPrice - a.usdPrice);
    } else if (sortOption === "notes") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [allProducts, selectedSubCategory, regionSearchText, selectedProvinceFilter, selectedShopFilter, priceMax, sortOption]);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-secondary selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[999] bg-primary text-white px-4 py-3 rounded-xl shadow-modal border border-outline-variant flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
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

      {/* Category Hero & Subcategory Bar */}
      <section className="bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-10 py-5">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-outline mb-2">
            <Link href="/" className="hover:text-primary transition-colors">
              {t("catalog.breadcrumb_home")}
            </Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <Link href="/produits" className="hover:text-primary transition-colors">
              {t("catalog.breadcrumb_categories")}
            </Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-on-surface font-semibold">{t("catalog.breadcrumb_current")}</span>
          </nav>

          {/* Title & Logistics Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-primary tracking-tight font-display">
                  {t("catalog.title")}
                </h1>
                <span className="bg-surface-container text-secondary text-xs font-bold px-2.5 py-0.5 rounded-full border border-secondary/20">
                  {allProducts.length}+ {t("shops.articles_count")}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-3xl leading-relaxed">
                {t("catalog.subtitle")}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg border border-secondary/20 self-start md:self-auto text-xs font-medium">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                public
              </span>
              <span>Marché Panafricain • {country.currency.code}</span>
            </div>
          </div>

          {/* Subcategories Horizontal Scroll */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
            {subCategories.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubCategory(sub)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedSubCategory === sub
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface-container-low text-on-surface border border-outline-variant hover:bg-surface-container"
                }`}
              >
                {sub.includes("Solaire") && (
                  <span className="material-symbols-outlined text-sm text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    solar_power
                  </span>
                )}
                <span>{sub === "Tous" ? t("catalog.all_subcategories") : sub}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Grid: 3-col Sidebar (Filters) + 9-col Content */}
      <main className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-10 py-8 flex-1">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-bold text-primary shadow-sm"
          >
            <span className="material-symbols-outlined text-base text-secondary">tune</span>
            <span>{t("catalog.filters")} ({filteredProducts.length})</span>
          </button>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-2 text-xs font-semibold text-on-surface outline-none"
          >
            <option value="pertinence">{t("catalog.sort_relevance")}</option>
            <option value="prix-asc">{t("catalog.sort_price_asc")}</option>
            <option value="prix-desc">{t("catalog.sort_price_desc")}</option>
            <option value="notes">{t("catalog.sort_rating")}</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* ================= LEFT FILTERS SIDEBAR (3 Columns) ================= */}
          <aside className="hidden lg:block lg:col-span-3 space-y-4">
            {/* Header Card */}
            <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant shadow-card flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">tune</span>
                <span className="font-bold text-primary font-display text-sm">{t("catalog.filters")}</span>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-secondary hover:underline"
              >
                {t("catalog.reset")}
              </button>
            </div>

            {/* Filter: Sous-catégories */}
            <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant shadow-card space-y-2.5">
              <h3 className="font-bold text-primary text-xs uppercase tracking-wider">{t("catalog.subcategories")}</h3>
              <div className="space-y-1.5 text-xs">
                {subCategories.slice(1).map((cat) => (
                  <label key={cat} className="flex items-center justify-between cursor-pointer group py-0.5">
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="subcategory-filter"
                        checked={selectedSubCategory === cat}
                        onChange={() => setSelectedSubCategory(cat)}
                        className="text-secondary focus:ring-secondary"
                      />
                      <span className="text-on-surface group-hover:text-secondary transition-colors">
                        {cat}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter: Prix Max */}
            <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary text-xs uppercase tracking-wider">{t("catalog.max_price")}</h3>
                <span className="text-xs font-bold text-secondary">{priceMax} $</span>
              </div>
              <input
                type="range"
                min="30"
                max="700"
                step="10"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-full accent-secondary cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px] text-outline font-medium">
                <span>30 $</span>
                <span>700 $</span>
              </div>
            </div>

            {/* Filter: Région de provenance (texte libre global + liste) */}
            <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant shadow-card space-y-2.5">
              <h3 className="font-bold text-primary text-xs uppercase tracking-wider">{t("catalog.origin_province")}</h3>
              <div className="relative">
                <input
                  type="text"
                  value={regionSearchText}
                  onChange={(e) => setRegionSearchText(e.target.value)}
                  placeholder="Rechercher ville, région..."
                  className="w-full pl-7 pr-2.5 py-1.5 bg-surface-container-low border border-outline-variant rounded-md text-xs placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-secondary"
                />
                <span className="material-symbols-outlined absolute left-1.5 top-2 text-outline text-sm">
                  search
                </span>
              </div>
              <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
                {["Toutes", ...availableProvinces].map((prov) => (
                  <label key={prov} className="flex items-center justify-between cursor-pointer group py-0.5">
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="province-filter"
                        checked={selectedProvinceFilter === prov}
                        onChange={() => setSelectedProvinceFilter(prov)}
                        className="text-secondary focus:ring-secondary"
                      />
                      <span className="text-on-surface group-hover:text-secondary transition-colors">
                        {prov === "Toutes" ? t("catalog.all_provinces") : prov}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter: Boutiques Partenaires (dynamique) */}
            <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant shadow-card space-y-2.5">
              <h3 className="font-bold text-primary text-xs uppercase tracking-wider">{t("catalog.certified_shop")}</h3>
              <div className="space-y-1.5 text-xs">
                {["Toutes", ...availableShops].map((shop) => (
                  <label key={shop} className="flex items-center justify-between cursor-pointer group py-0.5">
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="shop-filter"
                        checked={selectedShopFilter === shop}
                        onChange={() => setSelectedShopFilter(shop)}
                        className="text-secondary focus:ring-secondary"
                      />
                      <span className="text-on-surface group-hover:text-secondary transition-colors">
                        {shop === "Toutes" ? t("catalog.all_shops") : shop}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* ================= RIGHT MAIN CONTENT FEED (9 Columns) ================= */}
          <section className="lg:col-span-9 space-y-6">
            {/* Controls Bar */}
            <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant shadow-card space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs sm:text-sm font-bold text-primary">
                  <span className="text-secondary">{filteredProducts.length}</span> {t("catalog.products_found")}
                </p>

                <div className="hidden sm:flex items-center gap-3">
                  {/* Sort dropdown */}
                  <div className="flex items-center gap-2 text-xs">
                    <label htmlFor="desktop-sort" className="text-outline">{t("catalog.sort_by")} :</label>
                    <select
                      id="desktop-sort"
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-1.5 font-medium text-on-surface outline-none cursor-pointer"
                    >
                      <option value="pertinence">{t("catalog.sort_relevance")}</option>
                      <option value="prix-asc">{t("catalog.sort_price_asc")}</option>
                      <option value="prix-desc">{t("catalog.sort_price_desc")}</option>
                      <option value="notes">{t("catalog.sort_rating")}</option>
                    </select>
                  </div>

                  {/* View Switcher */}
                  <div className="flex items-center border border-outline-variant rounded-lg p-0.5 bg-surface-container-low">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded transition ${
                        viewMode === "grid"
                          ? "bg-surface-container-lowest text-primary shadow-sm"
                          : "text-outline hover:text-on-surface"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">grid_view</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded transition ${
                        viewMode === "list"
                          ? "bg-surface-container-lowest text-primary shadow-sm"
                          : "text-outline hover:text-on-surface"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">view_list</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Filter Removable Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-surface-container text-xs">
                <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">{t("catalog.filters")} :</span>
                {selectedSubCategory !== "Tous" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-surface-container text-on-surface text-[11px] rounded-full border border-outline-variant">
                    {selectedSubCategory}
                    <button
                      type="button"
                      onClick={() => setSelectedSubCategory("Tous")}
                      className="text-outline hover:text-rose-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedProvinceFilter !== "Toutes" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-surface-container text-on-surface text-[11px] rounded-full border border-outline-variant">
                    {selectedProvinceFilter}
                    <button
                      type="button"
                      onClick={() => setSelectedProvinceFilter("Toutes")}
                      className="text-outline hover:text-rose-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedShopFilter !== "Toutes" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-surface-container text-on-surface text-[11px] rounded-full border border-outline-variant">
                    {selectedShopFilter}
                    <button
                      type="button"
                      onClick={() => setSelectedShopFilter("Toutes")}
                      className="text-outline hover:text-rose-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] text-secondary hover:underline font-bold ml-1"
                >
                  {t("catalog.reset")}
                </button>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-surface-container-lowest p-12 text-center rounded-xl border border-outline-variant">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">devices</span>
                <p className="text-base font-bold text-primary">
                  {t("catalog.no_products")}
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-secondary text-white rounded-lg text-xs font-bold hover:bg-secondary-dark transition"
                  >
                    {t("catalog.reset")}
                  </button>
                </div>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredProducts.map((product) => (
                  <article
                    key={product.id}
                    className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3.5 flex flex-col justify-between custom-shadow hover:custom-shadow-hover hover:border-slate-300 transition-all duration-200 group"
                  >
                    <div>
                      {/* Image container */}
                      <div className="relative aspect-square w-full rounded-md overflow-hidden bg-surface-container-low mb-3">
                        <Link href={`/produits/${product.id}`} className="block w-full h-full relative">
                          <Image
                            src={product.image}
                            alt={product.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>
                        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
                          {product.badges.discount && (
                            <span className="bg-tertiary text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-sm">
                              {product.badges.discount}
                            </span>
                          )}
                          {product.badges.logisticsText && (
                            <span className="bg-primary text-secondary-accent text-[11px] font-semibold px-2 py-0.5 rounded">
                              {product.badges.logisticsText}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Store & Location */}
                      <p className="text-xs text-outline mb-1 truncate">
                        <span className="font-semibold text-secondary hover:underline cursor-pointer">
                          {product.shopName}
                        </span>{" "}
                        • {product.shopCity}
                      </p>

                      {/* Title */}
                      <Link href={`/produits/${product.id}`} className="block">
                        <h3 className="font-bold text-sm text-primary line-clamp-2 mb-1 group-hover:text-secondary transition-colors font-display">
                          {product.title}
                        </h3>
                      </Link>

                      {/* Rating */}
                      <div className="flex items-center gap-1 text-xs mb-2">
                        <span className="material-symbols-outlined text-xs text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                        <span className="font-bold text-on-surface">{product.rating}</span>
                        <span className="text-outline">({product.reviewCount} {t("shops.reviews_count")})</span>
                      </div>
                    </div>

                    {/* Price & Buy Action */}
                    <div className="pt-2 border-t border-outline-variant flex items-end justify-between">
                      <PriceTag
                        usdPrice={product.usdPrice}
                        originalUsdPrice={product.originalUsdPrice}
                        size="md"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className="p-2.5 rounded-lg bg-tertiary hover:bg-tertiary-hover text-white transition shadow flex items-center justify-center active:scale-95"
                        title={t("product_detail.add_to_cart")}
                      >
                        <span className="material-symbols-outlined text-lg">shopping_cart</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-3">
                {filteredProducts.map((product) => (
                  <article
                    key={product.id}
                    className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row gap-4 items-center justify-between custom-shadow hover:custom-shadow-hover transition"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-surface-container-low overflow-hidden shrink-0 relative">
                        <Image
                          src={product.image}
                          alt={product.title}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-secondary">{product.shopName} • {product.shopCity}</span>
                        <h3 className="text-sm sm:text-base font-bold text-primary font-display line-clamp-1">{product.title}</h3>
                        <div className="flex items-center gap-1 text-xs text-on-tertiary-container mt-0.5">
                          <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="font-bold">{product.rating}</span>
                          <span className="text-outline">({product.reviewCount} {t("shops.reviews_count")})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-outline-variant">
                      <PriceTag usdPrice={product.usdPrice} originalUsdPrice={product.originalUsdPrice} size="sm" />
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className="px-4 py-2 rounded-lg bg-tertiary hover:bg-tertiary-hover text-white text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-base">shopping_cart</span>
                        <span>{t("catalog.add")}</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm" onClick={() => setMobileFilterOpen(false)} />
          <div className="fixed bottom-0 inset-x-0 max-h-[85vh] bg-white rounded-t-2xl p-5 overflow-y-auto z-10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <span className="font-bold text-base text-primary">{t("catalog.filters")}</span>
              <button type="button" onClick={() => setMobileFilterOpen(false)} className="p-1">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Mobile Filter sections */}
            <div className="space-y-4 text-xs">
              <div>
                <p className="font-bold mb-2">{t("catalog.subcategories")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {subCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedSubCategory(cat)}
                      className={`px-3 py-1.5 rounded-full font-semibold ${
                        selectedSubCategory === cat ? "bg-secondary text-white" : "bg-surface-container"
                      }`}
                    >
                      {cat === "Tous" ? t("catalog.all_subcategories") : cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-bold mb-2">{t("catalog.origin_province")}</p>
                <div className="relative mb-2.5">
                  <input
                    type="text"
                    value={regionSearchText}
                    onChange={(e) => setRegionSearchText(e.target.value)}
                    placeholder="Rechercher ville, région..."
                    className="w-full pl-8 pr-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                  <span className="material-symbols-outlined absolute left-2 top-2 text-outline text-base">
                    search
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {["Toutes", ...availableProvinces].map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => setSelectedProvinceFilter(prov)}
                      className={`px-3 py-1.5 rounded-full font-semibold ${
                        selectedProvinceFilter === prov ? "bg-secondary text-white" : "bg-surface-container"
                      }`}
                    >
                      {prov === "Toutes" ? t("catalog.all_provinces") : prov}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full py-3 bg-primary text-white rounded-lg font-bold text-sm"
                >
                  {t("catalog.filters")} ({filteredProducts.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function ElectronicsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <ElectronicsContent />
    </Suspense>
  );
}
