"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard, Product } from "@/components/ProductCard";
import { useMarket } from "@/context/MarketContext";
import { useCart } from "@/context/CartContext";
import { useT } from "@/i18n";
import { getProductsByCountry, getShopsByCountry, toProductCard } from "@/lib/marketData";

// Palettes de couleurs pour les cartes boutiques
const SHOP_COLORS = [
  "bg-primary text-white",
  "bg-secondary text-white",
  "bg-tertiary text-white",
  "bg-primary text-secondary-container",
];

export default function HomePage() {
  const { country } = useMarket();
  const { addToCart } = useCart();
  const { t } = useT();
  const countryCode = country.code;
  const countryName = country.name.fr;

  const [activeFilter, setActiveFilter] = useState("all");
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  const filterTabs = [
    { key: "all", label: t("home.filter_all") },
    { key: "express", label: t("home.filter_express") },
    { key: "flash", label: t("home.filter_flash") },
    { key: "local", label: t("home.filter_local") },
  ];

  // Produits phares du pays courant (top 6)
  const featuredProducts: Product[] = useMemo(() => {
    const countryProducts = getProductsByCountry(countryCode);
    return countryProducts.slice(0, 6).map((p) => toProductCard(p));
  }, [countryCode]);

  // Boutiques populaires du pays courant (top 4)
  const popularShops = useMemo(() => {
    const shops = getShopsByCountry(countryCode);
    return shops.slice(0, 4).map((s, i) => ({
      id: s.id,
      name: s.name,
      tag: s.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
      location: `${s.city}, ${s.province}`,
      rating: s.rating.toFixed(1),
      productsCount: `${s.productCount}+ ${t("shops.articles_count")}`,
      colorBg: SHOP_COLORS[i % SHOP_COLORS.length],
    }));
  }, [countryCode, t]);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    setNotificationMessage(`« ${product.title} » ${t("home.toast_added")}`);
    setTimeout(() => setNotificationMessage(null), 3500);
  };

  const filteredProducts = featuredProducts.filter((prod) => {
    if (activeFilter === "express") {
      return prod.badges?.logisticsText?.includes("Express") || prod.badges?.logisticsText?.includes("Local");
    }
    if (activeFilter === "flash") {
      return prod.badges?.discount?.includes("%");
    }
    if (activeFilter === "local") {
      return prod.badges?.logistics === "origin-rdc" || prod.shopName.includes("Kivu") || prod.shopName.includes("Lubumbashi");
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-secondary selection:text-white">
      {/* Toast Notification */}
      {notificationMessage && (
        <div className="fixed bottom-5 right-5 z-[999] bg-primary text-white px-4 py-3 rounded-xl shadow-modal border border-outline-variant flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <span className="text-xs sm:text-sm font-medium">{notificationMessage}</span>
          <button
            type="button"
            onClick={() => setNotificationMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Header */}
      <Header />

      {/* Main Canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-10 py-6 space-y-12">
        {/* 2. Hero Promotionnel Immersif */}
        <section className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary via-primary to-secondary text-white shadow-xl border border-outline-variant">
          <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-80 h-80 rounded-full bg-tertiary/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-8 lg:p-12">
            <div className="lg:col-span-7 space-y-4 sm:space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                <span className="text-[11px] font-bold tracking-wide uppercase text-tertiary-fixed">
                  {t("home.hero_tag")}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black leading-tight text-white font-display">
                {t("home.hero_title")}
              </h1>

              <p className="text-sm sm:text-base text-slate-200 max-w-xl leading-relaxed">
                {t("home.hero_subtitle")}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                <a
                  href="#produits"
                  className="px-6 sm:px-7 py-3 sm:py-3.5 bg-tertiary text-white font-bold text-xs sm:text-sm rounded-lg shadow-lg hover:bg-tertiary-hover transition-all flex items-center gap-2 transform active:scale-95 group"
                >
                  <span>{t("home.hero_cta_buy")}</span>
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </a>
                <a
                  href="#boutiques"
                  className="px-5 sm:px-6 py-3 sm:py-3.5 border border-white/40 text-white rounded-lg font-semibold text-xs sm:text-sm hover:bg-white/10 transition-colors"
                >
                  {t("home.hero_cta_shops")}
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm aspect-[4/3] rounded-xl overflow-hidden shadow-2xl border-2 border-white/20">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-vpy6nciVJGdMIFpvc8MTwNl516DpjthYCN6ZpfKuu0ALmMC3w2vkW0ti1jdR2IWw0E57frBfd7yWmrVze7lqNV1NAoKPKhw9rZsyStIXTwNOcoadfyQJ8rZxhD1KRfT7buduuFTiHxeXgv6ziNqyVLDwVXH2XdWMfecBVHU9NbQitXYj9BfC1WLaqQaFqGSX9VRjG3iwvz68cvv2lDB0Mcwo2_BtJ2GYRQBTgJ5UTjTZvVinsN3Y"
                  alt="Commerce moderne"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 400px"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent flex items-end p-4">
                  <div className="bg-white/95 backdrop-blur-md rounded-lg p-3 w-full text-on-surface shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-secondary tracking-wider">
                        {t("home.hero_offer_special")}
                      </span>
                      <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full">
                        {t("home.hero_offer_discount")}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-primary mt-1">{t("home.hero_offer_pack")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Assurance Strip */}
          <div className="border-t border-white/15 bg-primary/80 backdrop-blur px-6 sm:px-8 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-secondary-accent shrink-0">
                <span className="material-symbols-outlined text-xl">payments</span>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold">{t("home.trust_payments_title")}</p>
                <p className="text-[11px] text-slate-300">{t("home.trust_payments_desc")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-secondary-accent shrink-0">
                <span className="material-symbols-outlined text-xl">flight_takeoff</span>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold">{t("home.trust_delivery_title")}</p>
                <p className="text-[11px] text-slate-300">{t("home.trust_delivery_desc")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-secondary-accent shrink-0">
                <span className="material-symbols-outlined text-xl">verified_user</span>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold">{t("home.trust_verified_title")}</p>
                <p className="text-[11px] text-slate-300">{t("home.trust_verified_desc")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Grille des 6 Catégories Phares */}
        <section className="space-y-4" id="categories">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-secondary font-bold">{t("home.categories_tag")}</span>
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-display">{t("home.categories_title")}</h2>
            </div>
            <Link
              href="/categories"
              className="text-xs sm:text-sm font-semibold text-secondary hover:underline flex items-center gap-1"
            >
              <span>{t("home.all_catalog")}</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Cat 1 */}
            <Link
              href="/categories/electronique"
              className="group bg-surface-container-lowest p-4 sm:p-5 rounded-lg border border-outline-variant hover:border-secondary hover:shadow-card-hover transition-all text-center flex flex-col items-center"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-secondary-fixed/50 text-secondary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">devices</span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-primary group-hover:text-secondary line-clamp-2">
                {t("home.cat_electronics")}
              </h3>
              <span className="text-[11px] text-outline mt-1 font-medium">1 420+ {t("shops.articles_count")}</span>
            </Link>

            {/* Cat 2 */}
            <Link
              href="/categories/mode"
              className="group bg-surface-container-lowest p-4 sm:p-5 rounded-lg border border-outline-variant hover:border-secondary hover:shadow-card-hover transition-all text-center flex flex-col items-center"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-surface-container text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">checkroom</span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-primary group-hover:text-secondary line-clamp-2">
                {t("home.cat_fashion")}
              </h3>
              <span className="text-[11px] text-outline mt-1 font-medium">890+ {t("shops.articles_count")}</span>
            </Link>

            {/* Cat 3 */}
            <Link
              href="/categories/maison"
              className="group bg-surface-container-lowest p-4 sm:p-5 rounded-lg border border-outline-variant hover:border-secondary hover:shadow-card-hover transition-all text-center flex flex-col items-center"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-surface-container text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">chair</span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-primary group-hover:text-secondary line-clamp-2">
                {t("home.cat_home")}
              </h3>
              <span className="text-[11px] text-outline mt-1 font-medium">640+ {t("shops.articles_count")}</span>
            </Link>

            {/* Cat 4 */}
            <Link
              href="/categories/beaute"
              className="group bg-surface-container-lowest p-4 sm:p-5 rounded-lg border border-outline-variant hover:border-secondary hover:shadow-card-hover transition-all text-center flex flex-col items-center"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-secondary-fixed/50 text-secondary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">spa</span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-primary group-hover:text-secondary line-clamp-2">
                {t("home.cat_beauty")}
              </h3>
              <span className="text-[11px] text-outline mt-1 font-medium">520+ {t("shops.articles_count")}</span>
            </Link>

            {/* Cat 5 */}
            <Link
              href="/categories/alimentation"
              className="group bg-surface-container-lowest p-4 sm:p-5 rounded-lg border border-outline-variant hover:border-secondary hover:shadow-card-hover transition-all text-center flex flex-col items-center"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-surface-container text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">shopping_basket</span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-primary group-hover:text-secondary line-clamp-2">
                {t("home.cat_food")}
              </h3>
              <span className="text-[11px] text-outline mt-1 font-medium">730+ {t("shops.articles_count")}</span>
            </Link>

            {/* Cat 6 */}
            <Link
              href="/categories"
              className="group bg-surface-container-low p-4 sm:p-5 rounded-lg border border-outline-variant hover:border-secondary hover:bg-surface-container transition-all text-center flex flex-col items-center"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center mb-3 group-hover:rotate-90 transition-transform">
                <span className="material-symbols-outlined text-2xl">grid_view</span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-primary group-hover:text-secondary line-clamp-2">
                {t("home.cat_more")}
              </h3>
              <span className="text-[11px] text-outline mt-1 font-medium">{t("home.cat_more_count")}</span>
            </Link>
          </div>
        </section>

        {/* 4. Section Boutiques Populaires */}
        <section className="space-y-4" id="boutiques">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-secondary font-bold">{t("home.shops_tag")}</span>
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-display">{t("home.shops_title")} — {countryName}</h2>
            </div>
            <Link
              href="/boutiques"
              className="text-xs sm:text-sm font-semibold text-secondary hover:underline flex items-center gap-1"
            >
              <span>{t("home.shops_view_all")}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {popularShops.map((shop) => (
              <div
                key={shop.id}
                className="bg-surface-container-lowest rounded-lg border border-outline-variant p-5 custom-shadow hover:custom-shadow-hover transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${shop.colorBg}`}
                    >
                      {shop.tag}
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-secondary-fixed text-on-secondary-container">
                      <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                        verified
                      </span>
                      {t("home.certified_mwinda")}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-primary mt-3 font-display">{shop.name}</h3>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1 truncate">
                    <span className="material-symbols-outlined text-sm text-secondary shrink-0">location_on</span>
                    {shop.location}
                  </p>

                  <div className="flex items-center gap-3 my-3 text-xs">
                    <span className="flex items-center text-tertiary font-bold">
                      <span className="material-symbols-outlined text-sm text-tertiary mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                      {shop.rating}
                    </span>
                    <span className="text-outline">•</span>
                    <span className="text-on-surface font-medium">{shop.productsCount}</span>
                  </div>
                </div>

                <Link
                  href={`/boutiques/${shop.id}`}
                  className="w-full py-2.5 rounded-lg border border-secondary text-secondary hover:bg-secondary/10 font-bold text-xs text-center transition block mt-2"
                >
                  {t("home.view_shop")}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Section Produits Populaires */}
        <section className="space-y-5" id="produits">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-tertiary font-bold">{t("home.products_tag")}</span>
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-display">{t("home.products_title")}</h2>
            </div>

            {/* Quick filter pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                    activeFilter === tab.key
                      ? "bg-primary text-white shadow-sm"
                      : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>

        {/* 6. Section Comment Commander sur Mwinda Market (5 étapes) */}
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 sm:p-8 md:p-10 custom-shadow space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-wider text-secondary font-bold">{t("home.how_tag")}</span>
            <h2 className="text-xl sm:text-2xl font-bold text-primary font-display">{t("home.how_title")}</h2>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              {t("home.how_subtitle")}
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-5 gap-6 pt-4">
            <div className="hidden md:block absolute top-12 left-10 right-10 h-0.5 bg-surface-container-high z-0" />

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-2.5 group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">search</span>
              </div>
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">{t("home.step1_tag")}</span>
              <h4 className="text-sm font-bold text-primary font-display">{t("home.step1_title")}</h4>
              <p className="text-xs text-on-surface-variant">
                {t("home.step1_desc")}
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-2.5 group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-surface-container-lowest border-2 border-secondary text-secondary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">shopping_cart_checkout</span>
              </div>
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">{t("home.step2_tag")}</span>
              <h4 className="text-sm font-bold text-primary font-display">{t("home.step2_title")}</h4>
              <p className="text-xs text-on-surface-variant">
                {t("home.step2_desc")}
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-2.5 group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-tertiary text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">point_of_sale</span>
              </div>
              <span className="text-[11px] font-bold text-tertiary uppercase tracking-wider">{t("home.step3_tag")}</span>
              <h4 className="text-sm font-bold text-primary font-display">{t("home.step3_title")}</h4>
              <p className="text-xs text-on-surface-variant">
                {t("home.step3_desc")}
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-2.5 group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-surface-container-lowest border-2 border-secondary text-secondary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">local_shipping</span>
              </div>
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">{t("home.step4_tag")}</span>
              <h4 className="text-sm font-bold text-primary font-display">{t("home.step4_title")}</h4>
              <p className="text-xs text-on-surface-variant">
                {t("home.step4_desc")}
              </p>
            </div>

            {/* Step 5 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-2.5 group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">inventory_2</span>
              </div>
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">{t("home.step5_tag")}</span>
              <h4 className="text-sm font-bold text-primary font-display">{t("home.step5_title")}</h4>
              <p className="text-xs text-on-surface-variant">
                {t("home.step5_desc")}
              </p>
            </div>
          </div>
        </section>

        {/* 7. Callout Banner: Devenir Vendeur */}
        <section className="rounded-2xl bg-gradient-to-r from-surface-container-low to-secondary-fixed/40 border border-outline-variant p-6 lg:p-8 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase bg-secondary text-white px-2 py-0.5 rounded tracking-wider">
              {t("home.seller_tag")}
            </span>
            <h3 className="text-lg sm:text-2xl font-bold text-primary font-display">
              {t("home.seller_title")}
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl leading-relaxed">
              {t("home.seller_desc")}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link
              href="/devenir-vendeur"
              className="w-full sm:w-auto px-6 py-3 bg-primary text-white rounded-lg text-xs sm:text-sm font-bold hover:bg-slate-800 transition shadow text-center block"
            >
              {t("home.seller_btn")}
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
