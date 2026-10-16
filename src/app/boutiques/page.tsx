"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ShopCard } from "@/components/ShopCard";
import { Shop } from "@/data/shops";
import { useMarket } from "@/context/MarketContext";
import { useT } from "@/i18n";
import { getAllShops } from "@/lib/marketData";

export default function ShopsDirectoryPage() {
  const { country } = useMarket();
  const { t } = useT();

  const [searchQuery, setSearchQuery] = useState("");
  const [regionSearchText, setRegionSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Toutes");
  const [selectedProvince, setSelectedProvince] = useState<string>("Toutes");
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sortOption, setSortOption] = useState<string>("popularity");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Toutes les boutiques (catalogue panafricain sans filtre pays)
  const allShops = useMemo(() => getAllShops(), []);

  // Catégories dynamiques globales
  const categories = useMemo(() => {
    const cats = new Set<string>();
    allShops.forEach((s) => cats.add(s.category));
    return ["Toutes", ...Array.from(cats).sort()];
  }, [allShops]);

  // Provinces/Régions dynamiques globales
  const provinces = useMemo(() => {
    const provs = new Set<string>();
    allShops.forEach((s) => { if (s.province) provs.add(s.province); });
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
  }, [allShops, searchQuery, regionSearchText, selectedCategory, selectedProvince, minRating, onlyVerified, sortOption]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setRegionSearchText("");
    setSelectedCategory("Toutes");
    setSelectedProvince("Toutes");
    setMinRating(0);
    setOnlyVerified(false);
    setSortOption("popularity");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-secondary selection:text-white">
      <Header />

      {/* Fil d'Ariane & Hero Header Section */}
      <section className="bg-surface-container-lowest border-b border-outline-variant py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-10 space-y-4">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-outline">
            <Link href="/" className="hover:text-primary transition flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">home</span>
              <span>{t("shops.breadcrumb_home")}</span>
            </Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-on-surface font-semibold">{t("shops.breadcrumb_shops")}</span>
          </nav>

          {/* Main Headline Cluster */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-container text-xs font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  public
                </span>
                <span>Marché Panafricain • {country.currency.code}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-primary font-display tracking-tight">
                {t("shops.title")}
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
                {t("shops.subtitle")}
              </p>
            </div>

            {/* Metrics Summary Strip */}
            <div className="flex items-center gap-3 sm:gap-4 bg-surface-container-low p-3 sm:p-4 rounded-2xl border border-outline-variant shrink-0">
              <div className="px-3 text-center border-r border-outline-variant">
                <span className="block text-lg sm:text-xl font-black text-primary font-display">
                  {allShops.length}+
                </span>
                <span className="text-[11px] text-on-surface-variant">{t("shops.shops_found")}</span>
              </div>
              <div className="px-3 text-center border-r border-outline-variant">
                <span className="block text-lg sm:text-xl font-black text-secondary font-display">
                  {provinces.length > 1 ? provinces.length - 1 : 1}
                </span>
                <span className="text-[11px] text-on-surface-variant">{t("shops.location")}</span>
              </div>
              <div className="px-3 text-center flex flex-col items-center">
                <div className="flex items-center gap-1 text-lg sm:text-xl font-black text-primary font-display">
                  <span
                    className="material-symbols-outlined text-base text-amber-500"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <span>4.9/5</span>
                </div>
                <span className="text-[11px] text-on-surface-variant">{t("shops.certified_seller")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout: 12 Cols (3 Sidebar + 9 Content Feed) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-10 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ================= LEFT SIDEBAR FILTERS (3 COLS) ================= */}
          <aside className="lg:col-span-3">
            {/* Mobile Filter Toggle Button */}
            <div className="lg:hidden mb-4">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="w-full py-3 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest font-bold text-xs text-primary flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-base">tune</span>
                  <span>{t("shops.filters")} ({filteredShops.length})</span>
                </div>
                <span className="material-symbols-outlined text-sm">
                  {mobileFilterOpen ? "expand_less" : "expand_more"}
                </span>
              </button>
            </div>

            <div
              className={`bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 shadow-card space-y-5 lg:block ${
                mobileFilterOpen ? "block" : "hidden"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-lg">tune</span>
                  <h3 className="font-bold text-sm text-primary font-display">{t("shops.filters")}</h3>
                </div>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-secondary hover:text-primary transition"
                >
                  {t("shops.reset")}
                </button>
              </div>

              {/* Filter 1: Catégories */}
              <div className="space-y-2 pb-4 border-b border-outline-variant">
                <label className="block text-xs font-bold text-primary">{t("shops.categories")}</label>
                <div className="space-y-1.5 text-xs">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg transition flex items-center justify-between ${
                        selectedCategory === cat
                          ? "bg-secondary-fixed text-on-secondary-container font-bold"
                          : "text-on-surface-variant hover:bg-surface-container-low"
                      }`}
                    >
                      <span>{cat === "Toutes" ? t("shops.all_categories") : cat}</span>
                      {selectedCategory === cat && (
                        <span className="material-symbols-outlined text-xs">check</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter 2: Provinces */}
              <div className="space-y-2 pb-4 border-b border-outline-variant">
                <label className="block text-xs font-bold text-primary">{t("shops.location")}</label>
                <div className="relative mb-2">
                  <input
                    type="text"
                    value={regionSearchText}
                    onChange={(e) => setRegionSearchText(e.target.value)}
                    placeholder="Filtrer ville, région..."
                    className="w-full pl-7 pr-2.5 py-1.5 bg-surface-container-low border border-outline-variant rounded-md text-xs placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                  <span className="material-symbols-outlined absolute left-1.5 top-2 text-outline text-sm">
                    search
                  </span>
                </div>
                <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
                  {provinces.map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => setSelectedProvince(prov)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg transition flex items-center justify-between ${
                        selectedProvince === prov
                          ? "bg-secondary-fixed text-on-secondary-container font-bold"
                          : "text-on-surface-variant hover:bg-surface-container-low"
                      }`}
                    >
                      <span>{prov === "Toutes" ? t("shops.all_locations") : prov}</span>
                      {selectedProvince === prov && (
                        <span className="material-symbols-outlined text-xs">check</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter 3: Note minimale */}
              <div className="space-y-2 pb-4 border-b border-outline-variant">
                <label className="block text-xs font-bold text-primary">{t("shops.min_rating")}</label>
                <div className="space-y-1.5 text-xs text-on-surface-variant">
                  {[
                    { label: t("shops.all_ratings"), val: 0 },
                    { label: "4.8+", val: 4.8 },
                    { label: "4.5+", val: 4.5 },
                  ].map((r) => (
                    <label key={r.val} className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="radio"
                        name="ratingFilter"
                        checked={minRating === r.val}
                        onChange={() => setMinRating(r.val)}
                        className="text-secondary focus:ring-secondary"
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filter 4: Garanties */}
              <div className="space-y-2 pb-4 border-b border-outline-variant">
                <label className="block text-xs font-bold text-primary">{t("shops.certified_seller")}</label>
                <label className="flex items-start gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={onlyVerified}
                    onChange={(e) => setOnlyVerified(e.target.checked)}
                    className="mt-0.5 rounded text-secondary focus:ring-secondary"
                  />
                  <div>
                    <strong className="text-primary block font-semibold">{t("shops.verified_only")}</strong>
                  </div>
                </label>
              </div>
            </div>
          </aside>

          {/* ================= RIGHT CONTENT AREA (9 COLS) ================= */}
          <section className="lg:col-span-9 space-y-6">
            {/* Search, Sort and Filter Bar */}
            <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline-variant shadow-card space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1 w-full">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("shops.search_placeholder")}
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs sm:text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition placeholder:text-outline"
                  />
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <span className="text-xs text-on-surface-variant font-medium whitespace-nowrap">
                    {t("catalog.sort_by")} :
                  </span>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="flex-1 sm:flex-initial py-2.5 px-3 rounded-xl border border-outline-variant bg-surface-container-low text-xs sm:text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer"
                  >
                    <option value="popularity">{t("shops.sort_popularity")}</option>
                    <option value="rating">{t("shops.sort_rating")}</option>
                    <option value="products">{t("shops.sort_products")}</option>
                    <option value="reviews">{t("shops.sort_reviews")}</option>
                  </select>
                </div>
              </div>

              {/* Active Filter Tags */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-on-surface-variant font-semibold">{t("shops.filters")} :</span>
                  {selectedCategory !== "Toutes" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-container font-semibold">
                      {selectedCategory}
                      <button
                        type="button"
                        onClick={() => setSelectedCategory("Toutes")}
                        className="hover:text-rose-600"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedProvince !== "Toutes" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-container font-semibold">
                      {selectedProvince}
                      <button
                        type="button"
                        onClick={() => setSelectedProvince("Toutes")}
                        className="hover:text-rose-600"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {minRating > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-semibold border border-outline-variant">
                      ★ {minRating}+
                      <button type="button" onClick={() => setMinRating(0)} className="hover:text-rose-600">
                        ×
                      </button>
                    </span>
                  )}
                  {onlyVerified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary text-white font-semibold">
                      {t("shops.certified_seller")}
                      <button type="button" onClick={() => setOnlyVerified(false)} className="hover:text-rose-200">
                        ×
                      </button>
                    </span>
                  )}
                  {(selectedCategory !== "Toutes" ||
                    selectedProvince !== "Toutes" ||
                    minRating > 0 ||
                    onlyVerified) && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-secondary hover:underline font-bold ml-1 text-xs"
                    >
                      {t("shops.reset")}
                    </button>
                  )}
                </div>

                <div className="text-outline text-xs">
                  <strong className="text-primary">{filteredShops.length}</strong> {t("shops.shops_found")}
                </div>
              </div>
            </div>

            {/* Boutiques Grid (3 Columns on Desktop) */}
            {filteredShops.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-10 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-surface-container-low text-outline flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">storefront</span>
                </div>
                <h3 className="text-base font-bold text-primary">{t("shops.no_shops")}</h3>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-secondary text-white font-bold text-xs"
                >
                  {t("shops.reset")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
