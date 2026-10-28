"use client";

import React, { useState, useMemo } from "react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ShopCard } from "@/components/ShopCard";
import { Shop } from "@/data/shops";
import { useMarket } from "@/context/MarketContext";
import { useT } from "@/i18n";
import { useCatalog } from "@/context/CatalogContext";

export default function ShopsDirectoryPage() {
  const { country } = useMarket();
  const { t } = useT();
  const { shops: allShops } = useCatalog();

  const [searchQuery, setSearchQuery] = useState("");
  const [regionSearchText, setRegionSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Toutes");
  const [selectedProvince, setSelectedProvince] = useState<string>("Toutes");
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sortOption, setSortOption] = useState<string>("popularity");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sections repliables de filtres
  const [openSections, setOpenSections] = useState({
    search: true,
    categories: true,
    regions: true,
    rating: true,
    verified: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Catégories dynamiques globales
  const categories = useMemo(() => {
    const cats = new Set<string>();
    allShops.forEach((s) => cats.add(s.category));
    return ["Toutes", ...Array.from(cats).sort()];
  }, [allShops]);

  // Provinces/Régions dynamiques globales
  const provinces = useMemo(() => {
    const provs = new Set<string>();
    allShops.forEach((s) => {
      if (s.province) provs.add(s.province);
    });
    return ["Toutes", ...Array.from(provs).sort()];
  }, [allShops]);

  // Boutiques filtrées
  const filteredShops = useMemo(() => {
    let list: Shop[] = [...allShops];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.tagline.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.province.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.specialties.some((spec) => spec.toLowerCase().includes(q))
      );
    }

    if (regionSearchText.trim()) {
      const q = regionSearchText.toLowerCase();
      list = list.filter(
        (s) =>
          s.city.toLowerCase().includes(q) ||
          s.province.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "Toutes") {
      list = list.filter((s) => s.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (selectedProvince !== "Toutes") {
      list = list.filter((s) => s.province.toLowerCase() === selectedProvince.toLowerCase());
    }

    if (minRating > 0) {
      list = list.filter((s) => s.rating >= minRating);
    }

    if (onlyVerified) {
      list = list.filter((s) => s.verified);
    }

    // Sort
    if (sortOption === "rating") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortOption === "products") {
      list.sort((a, b) => b.productCount - a.productCount);
    } else if (sortOption === "reviews") {
      list.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    return list;
  }, [
    allShops,
    searchQuery,
    regionSearchText,
    selectedCategory,
    selectedProvince,
    minRating,
    onlyVerified,
    sortOption,
  ]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setRegionSearchText("");
    setSelectedCategory("Toutes");
    setSelectedProvince("Toutes");
    setMinRating(0);
    setOnlyVerified(false);
    setSortOption("popularity");
  };

  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim() !== "" ||
      regionSearchText.trim() !== "" ||
      selectedCategory !== "Toutes" ||
      selectedProvince !== "Toutes" ||
      minRating > 0 ||
      onlyVerified
    );
  }, [searchQuery, regionSearchText, selectedCategory, selectedProvince, minRating, onlyVerified]);

  const breadcrumbItems = useMemo(
    () => [
      { label: t("shops.breadcrumb_home") || "Accueil", href: "/", icon: "home" },
      { label: t("shops.breadcrumb_shops") || "Boutiques partenaires", href: undefined },
    ],
    [t]
  );

  // Contenu du volet de filtres
  const FilterPanelContent = () => (
    <div className="space-y-4 text-xs">
      {/* Header filtres */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#0284C7] text-lg">tune</span>
          <span className="font-bold text-[#0B1B3D] font-display text-sm">
            {t("shops.filters")}
          </span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-semibold text-[#EA580C] hover:underline"
          >
            {t("shops.reset")}
          </button>
        )}
      </div>

      {/* 1. Recherche par nom / mot-clé */}
      <div className="border-b border-[#E2E8F0] pb-3">
        <button
          type="button"
          onClick={() => toggleSection("search")}
          className="w-full flex items-center justify-between py-1 text-xs font-bold text-[#0B1B3D] uppercase tracking-wider"
        >
          <span>Recherche</span>
          <span className="material-symbols-outlined text-sm text-slate-400">
            {openSections.search ? "expand_less" : "expand_more"}
          </span>
        </button>
        {openSections.search && (
          <div className="mt-2 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nom de boutique, artisan..."
              className="w-full pl-7 pr-2.5 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-md text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#0284C7]"
            />
            <span className="material-symbols-outlined absolute left-2 top-2 text-slate-400 text-sm">
              search
            </span>
          </div>
        )}
      </div>

      {/* 2. Catégories */}
      <div className="border-b border-[#E2E8F0] pb-3">
        <button
          type="button"
          onClick={() => toggleSection("categories")}
          className="w-full flex items-center justify-between py-1 text-xs font-bold text-[#0B1B3D] uppercase tracking-wider"
        >
          <span>{t("shops.categories")}</span>
          <span className="material-symbols-outlined text-sm text-slate-400">
            {openSections.categories ? "expand_less" : "expand_more"}
          </span>
        </button>
        {openSections.categories && (
          <div className="mt-2 space-y-1">
            {categories.map((cat) => (
              <label
                key={cat}
                className="flex items-center justify-between cursor-pointer py-1 px-1.5 rounded hover:bg-slate-50 transition"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="shop-cat-filter"
                    checked={selectedCategory === cat}
                    onChange={() => setSelectedCategory(cat)}
                    className="text-[#0284C7] focus:ring-[#0284C7]"
                  />
                  <span
                    className={
                      selectedCategory === cat ? "font-bold text-[#0B1B3D]" : "text-slate-700"
                    }
                  >
                    {cat}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 3. Ville / Région */}
      <div className="border-b border-[#E2E8F0] pb-3">
        <button
          type="button"
          onClick={() => toggleSection("regions")}
          className="w-full flex items-center justify-between py-1 text-xs font-bold text-[#0B1B3D] uppercase tracking-wider"
        >
          <span>{t("shops.location")}</span>
          <span className="material-symbols-outlined text-sm text-slate-400">
            {openSections.regions ? "expand_less" : "expand_more"}
          </span>
        </button>
        {openSections.regions && (
          <div className="mt-2 space-y-2">
            <div className="relative">
              <input
                type="text"
                value={regionSearchText}
                onChange={(e) => setRegionSearchText(e.target.value)}
                placeholder="Ville ou province..."
                className="w-full pl-7 pr-2.5 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-md text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#0284C7]"
              />
              <span className="material-symbols-outlined absolute left-2 top-2 text-slate-400 text-sm">
                search
              </span>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {provinces.map((prov) => (
                <label
                  key={prov}
                  className="flex items-center justify-between cursor-pointer py-0.5 px-1 rounded hover:bg-slate-50 transition"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="shop-prov-filter"
                      checked={selectedProvince === prov}
                      onChange={() => setSelectedProvince(prov)}
                      className="text-[#0284C7] focus:ring-[#0284C7]"
                    />
                    <span
                      className={
                        selectedProvince === prov ? "font-bold text-[#0B1B3D]" : "text-slate-700"
                      }
                    >
                      {prov}
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
          <span>Avis &amp; Évaluation</span>
          <span className="material-symbols-outlined text-sm text-slate-400">
            {openSections.rating ? "expand_less" : "expand_more"}
          </span>
        </button>
        {openSections.rating && (
          <div className="mt-2 space-y-1.5">
            {[
              { val: 0, label: "Toutes les notes" },
              { val: 4.8, label: "4.8★ et plus" },
              { val: 4.5, label: "4.5★ et plus" },
              { val: 4.0, label: "4.0★ et plus" },
            ].map((r) => (
              <label
                key={r.val}
                className="flex items-center gap-2 cursor-pointer py-0.5 px-1 rounded hover:bg-slate-50 transition"
              >
                <input
                  type="radio"
                  name="shop-rating-filter"
                  checked={minRating === r.val}
                  onChange={() => setMinRating(r.val)}
                  className="text-[#0284C7] focus:ring-[#0284C7]"
                />
                <span
                  className={minRating === r.val ? "font-bold text-[#0B1B3D]" : "text-slate-700"}
                >
                  {r.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 5. Vendeur certifié */}
      <div className="pb-1">
        <button
          type="button"
          onClick={() => toggleSection("verified")}
          className="w-full flex items-center justify-between py-1 text-xs font-bold text-[#0B1B3D] uppercase tracking-wider"
        >
          <span>Certification</span>
          <span className="material-symbols-outlined text-sm text-slate-400">
            {openSections.verified ? "expand_less" : "expand_more"}
          </span>
        </button>
        {openSections.verified && (
          <div className="mt-2">
            <label className="flex items-center gap-2 cursor-pointer py-1.5 px-2 bg-slate-50 rounded border border-[#E2E8F0]">
              <input
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="rounded text-[#0284C7] focus:ring-[#0284C7]"
              />
              <span className="text-xs font-bold text-[#0B1B3D] flex items-center gap-1">
                <span
                  className="material-symbols-outlined text-xs text-[#0284C7]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                <span>Boutiques certifiées uniquement</span>
              </span>
            </label>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] selection:bg-[#EA580C] selection:text-white">
      <Header />

      {/* Main Canvas unifié max-w-[1280px] */}
      <main className="w-full max-w-[1280px] mx-auto px-4 lg:px-6 py-5 sm:py-6 flex-1 space-y-5">
        {/* En-tête : Fil d'Ariane, Titre, Nombre de boutiques réelles, Tri */}
        <div className="space-y-3 pb-3 border-b border-[#E2E8F0]">
          <Breadcrumb items={breadcrumbItems} />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-[#0B1B3D] font-display tracking-tight">
                  {t("shops.title")}
                </h1>
                <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                  {filteredShops.length} {t("shops.shops_found")}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Marché Panafricain • {country.flag} {country.currency.code} — {t("shops.subtitle")}
              </p>
            </div>

            {/* Contrôles Desktop & Mobile */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              {/* Bouton Filtres Mobile */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-bold text-[#0B1B3D] shadow-2xs hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-base text-[#0284C7]">tune</span>
                <span>{t("shops.filters")}</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
                )}
              </button>

              {/* Tri */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="hidden md:inline text-slate-500 font-medium">
                  {t("shops.sort_by")} :
                </span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-2 text-xs font-semibold text-[#0B1B3D] outline-none cursor-pointer hover:border-slate-300"
                >
                  <option value="popularity">{t("shops.sort_popular")}</option>
                  <option value="rating">{t("shops.sort_rating")}</option>
                  <option value="products">{t("shops.sort_products")}</option>
                  <option value="reviews">{t("shops.sort_reviews")}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Corps principal : Colonne de filtres (~260px) + Grille des boutiques */}
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
                    {t("shops.filters")} ({filteredShops.length})
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
                    Voir les {filteredShops.length} boutiques
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Grille des boutiques & Pastilles de filtres */}
          <section className="flex-1 min-w-0 w-full space-y-4">
            {/* Pastilles actives */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-white rounded-lg border border-[#E2E8F0] text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Filtres actifs :
                </span>

                {searchQuery.trim() !== "" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0B1B3D] border border-slate-200 text-xs font-medium">
                    <span>« {searchQuery} »</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="text-slate-400 hover:text-rose-600 font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                )}

                {selectedCategory !== "Toutes" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0B1B3D] border border-slate-200 text-xs font-medium">
                    <span>{selectedCategory}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("Toutes")}
                      className="text-slate-400 hover:text-rose-600 font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                )}

                {selectedProvince !== "Toutes" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0B1B3D] border border-slate-200 text-xs font-medium">
                    <span>{selectedProvince}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedProvince("Toutes")}
                      className="text-slate-400 hover:text-rose-600 font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                )}

                {regionSearchText.trim() !== "" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0B1B3D] border border-slate-200 text-xs font-medium">
                    <span>Région: « {regionSearchText} »</span>
                    <button
                      type="button"
                      onClick={() => setRegionSearchText("")}
                      className="text-slate-400 hover:text-rose-600 font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                )}

                {minRating > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0B1B3D] border border-slate-200 text-xs font-medium">
                    <span>{minRating}★ et +</span>
                    <button
                      type="button"
                      onClick={() => setMinRating(0)}
                      className="text-slate-400 hover:text-rose-600 font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                )}

                {onlyVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0B1B3D] border border-slate-200 text-xs font-medium">
                    <span>Certifiées uniquement</span>
                    <button
                      type="button"
                      onClick={() => setOnlyVerified(false)}
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

            {/* Grille ou État vide */}
            {filteredShops.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-10 text-center shadow-2xs space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <span className="material-symbols-outlined text-3xl">storefront</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#0B1B3D] font-display">
                    {t("shops.no_shops")}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Aucune boutique ne correspond à vos critères de recherche actuels.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 bg-[#EA580C] text-white rounded-lg text-xs font-bold hover:bg-[#c2410c] transition shadow-xs"
                >
                  {t("shops.reset")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {filteredShops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} />
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
