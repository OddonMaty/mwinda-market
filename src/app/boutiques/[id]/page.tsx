"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductCard, Product } from "@/components/ProductCard";
import { SHOPS_DATA, getShopById, Shop } from "@/data/shops";
import { getCountryByCode } from "@/lib/activeCountries";
import { getShopCountryCode, getProductsByShop, toProductCard } from "@/lib/marketData";
import { useT } from "@/i18n";

interface PageProps {
  params: {
    id: string;
  };
}

export default function ShopDetailPage({ params }: PageProps) {
  const shopId = params?.id || "kin-fashion";
  const shopFound: Shop | undefined = getShopById(shopId);
  const shop: Shop = shopFound || SHOPS_DATA[0];

  const { t, language } = useT();
  const shopCountryCode = getShopCountryCode(shop);
  const shopCountry = getCountryByCode(shopCountryCode);
  const shopCountryName =
    shopCountry?.name?.[language as "fr" | "en"] || shopCountry?.name?.fr || shopCountryCode;
  const shopCountryFlag = shopCountry?.flag || "🇨🇩";

  const [activeTab, setActiveTab] = useState<string>("Tout");
  const [inStoreQuery, setInStoreQuery] = useState("");
  const [sortOption, setSortOption] = useState<string>("newest");
  const [isFollowing, setIsFollowing] = useState(false);
  const [contactFeedback, setContactFeedback] = useState<string | null>(null);

  // Déterminer la liste des produits réels de la boutique (aucune donnée fictive)
  const baseProducts: Product[] = useMemo(() => {
    return getProductsByShop(shop.id).map(toProductCard);
  }, [shop.id]);

  // Filtrer et trier les produits
  const displayedProducts = useMemo(() => {
    let list = [...baseProducts];

    if (inStoreQuery.trim()) {
      const q = inStoreQuery.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }

    if (activeTab !== "Tout") {
      const tabLower = activeTab.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(tabLower) ||
          p.badges?.logisticsText?.toLowerCase().includes(tabLower)
      );
    }

    if (sortOption === "price-asc") {
      list.sort((a, b) => a.usdPrice - b.usdPrice);
    } else if (sortOption === "price-desc") {
      list.sort((a, b) => b.usdPrice - a.usdPrice);
    } else if (sortOption === "rating") {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [baseProducts, inStoreQuery, activeTab, sortOption]);

  const handleContact = () => {
    setContactFeedback("Ligne WhatsApp & GSM : " + shop.phone);
    setTimeout(() => setContactFeedback(null), 4000);
  };

  const breadcrumbItems = useMemo(
    () => [
      { label: t("shop_detail.breadcrumb_home") || "Accueil", href: "/", icon: "home" },
      { label: t("shop_detail.breadcrumb_shops") || "Boutiques", href: "/boutiques" },
      { label: shop.name, href: undefined },
    ],
    [t, shop.name]
  );

  // État boutique introuvable
  if (!shopFound) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-8 sm:p-12 text-center max-w-md mx-auto shadow-2xs space-y-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">store_off</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-[#0B1B3D] font-display">
                {t("shop_detail.not_found_title")}
              </h1>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {t("shop_detail.not_found_desc")}
              </p>
            </div>
            <Link
              href="/boutiques"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-lg font-bold text-xs transition shadow-xs"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>{t("shop_detail.not_found_cta")}</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] selection:bg-[#EA580C] selection:text-white">
      <Header />

      {/* Main Container unifié max-w-[1280px] */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 lg:px-6 py-4 sm:py-6 space-y-5">
        <Breadcrumb items={breadcrumbItems} />

        {/* 1. STOREFRONT HERO BANNER */}
        <section className="relative rounded-lg overflow-hidden bg-[#0B1B3D] text-white shadow-2xs border border-[#E2E8F0]">
          {/* Bannière de fond */}
          <div
            className="h-48 sm:h-60 w-full bg-cover bg-center relative"
            style={{ backgroundImage: `url('${shop.bannerImage}')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B3D] via-[#0B1B3D]/65 to-transparent" />

            {/* Badges en haut à droite */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <span className="bg-[#0B1B3D]/80 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-sky-200 border border-sky-400/30 flex items-center gap-1 shadow-xs">
                <span className="material-symbols-outlined text-sm text-sky-300">bolt</span>
                <span>{t("shop_detail.fast_shipping")}</span>
              </span>
              <span className="bg-[#0B1B3D]/80 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-white border border-white/20 flex items-center gap-1 shadow-xs">
                <span className="material-symbols-outlined text-sm text-[#EA580C]">local_shipping</span>
                <span>{shopCountryCode === "cd" ? t("shop_detail.shipping_rdc") : t("shop_detail.regions_covered")}</span>
              </span>
            </div>
          </div>

          {/* Identité Vendeur & Actions */}
          <div className="px-5 sm:px-8 pb-5 pt-0 relative -mt-14 sm:-mt-16 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
              {/* Avatar + Titre + Bio */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-white border-2 border-white shadow-md overflow-hidden flex items-center justify-center p-0.5 relative">
                    <Image
                      src={shop.logoImage}
                      alt={shop.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                  {shop.verified && (
                    <span
                      className="absolute -bottom-1 -right-1 bg-[#0284C7] text-white rounded-full p-1 border-2 border-white shadow-xs"
                      title="Boutique Certifiée Mwinda"
                    >
                      <span
                        className="material-symbols-outlined text-xs block"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        verified
                      </span>
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white font-display tracking-tight">
                      {shop.name}
                    </h1>
                    <span className="bg-white/10 text-white/90 border border-white/20 px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1">
                      <span>{shopCountryFlag}</span>
                      <span>{shop.city}, {shopCountryName}</span>
                    </span>
                    {shop.verified && (
                      <span className="bg-[#0284C7]/30 text-sky-200 border border-[#0284C7]/50 px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">workspace_premium</span>
                        <span>{t("shop_detail.certified_seller")}</span>
                      </span>
                    )}
                    {shop.topSeller && (
                      <span className="bg-[#EA580C]/30 text-orange-200 border border-[#EA580C]/50 px-2 py-0.5 rounded text-xs font-bold">
                        {t("shop_detail.top_seller")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    {shop.bio}
                  </p>
                </div>
              </div>

              {/* Boutons Suivre / Contacter */}
              <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-end">
                <button
                  type="button"
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`px-3.5 py-2 rounded-lg font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 active:scale-95 ${
                    isFollowing
                      ? "bg-emerald-600 text-white"
                      : "bg-[#EA580C] hover:bg-[#c2410c] text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {isFollowing ? "check" : "notifications_active"}
                  </span>
                  <span>{isFollowing ? t("shop_detail.following") : t("shop_detail.follow")}</span>
                </button>

                <button
                  type="button"
                  onClick={handleContact}
                  className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/30 font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95 backdrop-blur-sm"
                >
                  <span className="material-symbols-outlined text-sm text-sky-200">chat</span>
                  <span>{t("shop_detail.contact_seller")}</span>
                </button>
              </div>
            </div>

            {/* Notification de contact */}
            {contactFeedback && (
              <div className="p-3 bg-[#0284C7]/20 border border-[#0284C7]/40 rounded-lg text-xs text-white flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400 text-sm">info</span>
                  <span>{contactFeedback}</span>
                </div>
                <a
                  href={`tel:${shop.phone.replace(/\s+/g, "")}`}
                  className="font-bold underline text-sky-200 ml-2"
                >
                  {t("shop_detail.call_directly")}
                </a>
              </div>
            )}

            {/* Bandeau de statistiques clés */}
            <div className="pt-3 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
                  <span
                    className="material-symbols-outlined text-base"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1 font-bold text-white text-sm">
                    <span>{shop.rating.toFixed(1)}</span>
                    <span className="text-slate-400 text-[10px] font-normal">/5</span>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    {shop.reviewCount} {t("shop_detail.verified_reviews")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sky-300 shrink-0">
                  <span className="material-symbols-outlined text-base">inventory_2</span>
                </div>
                <div>
                  <span className="font-bold text-white text-sm">{shop.productCount}</span>
                  <p className="text-[10px] text-slate-300">{t("shop_detail.online_articles")}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-emerald-300 shrink-0">
                  <span className="material-symbols-outlined text-base">schedule</span>
                </div>
                <div>
                  <span className="font-bold text-white text-sm">{shop.responseRate}</span>
                  <p className="text-[10px] text-slate-300">{t("shop_detail.response_rate")}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-300 shrink-0">
                  <span className="material-symbols-outlined text-base">verified_user</span>
                </div>
                <div>
                  <span className="font-bold text-white text-sm">
                    {t("shop_detail.since")} {shop.yearEstablished}
                  </span>
                  <p className="text-[10px] text-slate-300">
                    {t("shops.certified_seller")} {shopCountryName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. BARRE D'ONGLETS & RECHERCHE INTERNE */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-2xs p-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Onglets spécialités */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("Tout")}
                className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTab === "Tout"
                    ? "bg-[#0B1B3D] text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{t("shop_detail.all_catalog")}</span>
                <span className="text-[10px] bg-[#EA580C] px-1.5 py-0.2 rounded-full text-white">
                  {displayedProducts.length}
                </span>
              </button>

              {shop.specialties.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => setActiveTab(spec)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1 shrink-0 ${
                    activeTab === spec
                      ? "bg-[#0B1B3D] text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span>{spec}</span>
                </button>
              ))}
            </div>

            {/* Recherche interne et Tri */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-56">
                <input
                  type="text"
                  value={inStoreQuery}
                  onChange={(e) => setInStoreQuery(e.target.value)}
                  placeholder={t("shop_detail.search_placeholder")}
                  className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-slate-50 border border-[#E2E8F0] rounded-md focus:outline-none focus:border-[#0284C7] text-[#0B1B3D] placeholder:text-slate-400"
                />
                <span className="material-symbols-outlined absolute left-2 top-2 text-slate-400 text-sm">
                  search
                </span>
              </div>

              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="py-1.5 px-2.5 rounded-md border border-[#E2E8F0] bg-white text-xs text-[#0B1B3D] font-semibold focus:outline-none cursor-pointer"
              >
                <option value="newest">{t("catalog.sort_newest")}</option>
                <option value="rating">{t("catalog.sort_popular")}</option>
                <option value="price-asc">{t("catalog.sort_price_asc")}</option>
                <option value="price-desc">{t("catalog.sort_price_desc")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. DISPOSITION 2 COLONNES : PRODUITS (8 COLS) + INFORMATIONS (4 COLS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Grille des produits de la boutique */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <h2 className="text-sm sm:text-base font-bold text-[#0B1B3D] font-display flex items-center gap-2">
                <span>{t("shop_detail.available_articles")}</span>
                <span className="text-xs font-semibold text-slate-500">
                  ({displayedProducts.length})
                </span>
              </h2>
              <span className="text-xs text-[#0284C7] font-semibold">
                {t("shop_detail.certified_stock")} {shopCountryName}
              </span>
            </div>

            {baseProducts.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-10 text-center space-y-3 shadow-2xs">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">inventory_2</span>
                </div>
                <h3 className="text-base font-bold text-[#0B1B3D]">
                  {t("shops.catalog_coming_soon")}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {t("shop_detail.catalog_prep_desc")}
                </p>
                <Link
                  href="/boutiques"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#EA580C] text-white text-xs font-bold hover:bg-[#c2410c] transition shadow-xs mt-2"
                >
                  <span className="material-symbols-outlined text-sm">storefront</span>
                  <span>{t("shops.view_other_shops")}</span>
                </Link>
              </div>
            ) : displayedProducts.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-8 text-center space-y-3 shadow-2xs">
                <span className="material-symbols-outlined text-3xl text-slate-400">inventory</span>
                <h3 className="text-sm font-bold text-[#0B1B3D]">
                  {t("shop_detail.no_articles_found")}
                </h3>
                <p className="text-xs text-slate-500">
                  {t("shop_detail.no_articles_desc")}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setInStoreQuery("");
                    setActiveTab("Tout");
                  }}
                  className="px-4 py-2 rounded-lg bg-[#EA580C] text-white text-xs font-bold hover:bg-[#c2410c] transition shadow-xs"
                >
                  {t("shop_detail.show_all_articles")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {displayedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>

          {/* Colonne latérale d'informations de la boutique */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <h3 className="text-sm font-bold text-[#0B1B3D] font-display">
                  {t("shop_detail.about_shop")} {shop.name}
                </h3>
                <span className="material-symbols-outlined text-[#0284C7] text-lg">storefront</span>
              </div>

              {/* Adresse physique */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center shrink-0 text-[#0284C7]">
                  <span className="material-symbols-outlined text-sm">pin_drop</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {t("shop_detail.physical_store")}
                  </p>
                  <p className="text-xs font-semibold text-[#0B1B3D] mt-0.5">
                    {shop.fullAddress}
                  </p>
                  <span className="text-[10px] text-[#0284C7] font-medium inline-block mt-0.5">
                    {t("shop_detail.gps_verified")}
                  </span>
                </div>
              </div>

              {/* Vitesse de livraison */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center shrink-0 text-[#EA580C]">
                  <span className="material-symbols-outlined text-sm">timer</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {t("shop_detail.shipping_speed")}
                  </p>
                  <p className="text-xs font-semibold text-[#0B1B3D] mt-0.5">
                    {shop.shippingSpeed}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {shop.city} : livraison le jour même. Autres provinces : 48 à 72h via hub Mwinda.
                  </p>
                </div>
              </div>

              {/* Territoires couverts */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center shrink-0 text-[#0284C7]">
                  <span className="material-symbols-outlined text-sm">public</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {t("shop_detail.covered_territories")}
                  </p>
                  <p className="text-xs font-semibold text-[#0B1B3D] mt-0.5">
                    {shop.coveredTerritories}
                  </p>
                  <span className="inline-block mt-1 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-[#0284C7]">
                    Mwinda Express Inter-provinces
                  </span>
                </div>
              </div>

              {/* Horaires */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                  <span className="material-symbols-outlined text-sm">alarm</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {t("shop_detail.opening_hours")}
                  </p>
                  <p className="text-xs font-semibold text-[#0B1B3D] mt-0.5">
                    {shop.openingHours}
                  </p>
                </div>
              </div>

              {/* Score de performance */}
              <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0B1B3D]">{t("shop_detail.performance_score")}</span>
                  <span className="font-bold text-[#0284C7] font-mono">{shop.performanceScore.overall}</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div>
                    <div className="flex justify-between text-slate-600 mb-0.5">
                      <span>{t("shop_detail.item_quality")}</span>
                      <span className="font-bold text-[#0B1B3D]">{shop.performanceScore.itemQuality} / 5</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#0284C7] h-full rounded-full" style={{ width: "98%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 mb-0.5">
                      <span>{t("shop_detail.communication")}</span>
                      <span className="font-bold text-[#0B1B3D]">{shop.performanceScore.communication} / 5</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#0284C7] h-full rounded-full" style={{ width: "100%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 mb-0.5">
                      <span>{t("shop_detail.shipping_speed_score")}</span>
                      <span className="font-bold text-[#0B1B3D]">{shop.performanceScore.shippingSpeed} / 5</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#0284C7] h-full rounded-full" style={{ width: "96%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Moyens de paiement acceptés */}
              <div className="pt-3 border-t border-[#E2E8F0] space-y-1.5">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {t("shop_detail.secure_payments")}
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-center text-[10px] font-bold">
                  <div className="p-1.5 rounded bg-slate-50 border border-[#E2E8F0] text-[#0B1B3D]">
                    M-Pesa
                  </div>
                  <div className="p-1.5 rounded bg-slate-50 border border-[#E2E8F0] text-[#0B1B3D]">
                    Orange Money
                  </div>
                  <div className="p-1.5 rounded bg-slate-50 border border-[#E2E8F0] text-[#0B1B3D]">
                    Airtel Money
                  </div>
                  <div className="p-1.5 rounded bg-slate-50 border border-[#E2E8F0] text-[#0B1B3D]">
                    Visa / Mastercard
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
