"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard, Product } from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import { useT } from "@/i18n";
import { getAllProducts, getAllShops, toProductCard } from "@/lib/marketData";
import { getActiveCategories, countProductsInCategory } from "@/config/categories";
import { getMaxRealDiscount } from "@/lib/discounts";

// Palettes de couleurs pour les cartes boutiques
const SHOP_COLORS = [
  "bg-[#0B1B3D] text-white",
  "bg-[#0284C7] text-white",
  "bg-[#EA580C] text-white",
  "bg-slate-700 text-white",
];

export default function HomePage() {
  const { addToCart } = useCart();
  const { t } = useT();

  const [activeFilter, setActiveFilter] = useState("all");
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  const filterTabs = [
    { key: "all", label: t("home.filter_all") },
    { key: "express", label: t("home.filter_express") },
    { key: "flash", label: t("home.filter_flash") },
    { key: "local", label: t("home.filter_local") },
  ];

  // Tous les produits réels du catalogue
  const allProducts = useMemo(() => getAllProducts(), []);
  const totalCatalogCount = allProducts.length;

  // Catégories actives (uniquement celles ayant au moins 1 produit réel)
  const activeCategories = useMemo(() => getActiveCategories(allProducts), [allProducts]);

  // Remise maximale réelle calculée à partir des produits du catalogue
  const maxRealDiscount = useMemo(() => getMaxRealDiscount(allProducts), [allProducts]);

  // 4 Tuiles promo colorées sous la zone principale (images locales réelles)
  const promoTiles = useMemo(
    () => [
      {
        slug: "electronique",
        name: t("home.cat_electronics"),
        image: "/images/products/samsung-galaxy-a54-5g.jpg",
      },
      {
        slug: "mode",
        name: t("home.cat_fashion"),
        image: "/images/products/brazza-robe-wax-ndoki.jpg",
      },
      {
        slug: "maison",
        name: t("home.cat_home"),
        image: "/images/products/abidjan-coussin-pagne-bajoue.jpg",
      },
      {
        slug: "energie-solaire",
        name: t("home.cat_solar"),
        image: "/images/products/station-energie-solaire-1000w.jpg",
      },
    ],
    [t]
  );

  // Panneau 1 : Produits de boutiques certifiées (4 mini-cartes)
  const certifiedShowcaseProducts = useMemo(() => {
    return allProducts
      .filter((p) => p.shopVerified)
      .slice(0, 4);
  }, [allProducts]);

  // Panneau 2 : Produits avec promotion réelle (ancien prix barré)
  const discountShowcaseProducts = useMemo(() => {
    return allProducts
      .filter((p) => p.originalUsdPrice && p.originalUsdPrice > p.usdPrice)
      .slice(0, 4);
  }, [allProducts]);

  // Produits populaires globaux (15 produits pour remplir la grille 5 colonnes)
  const featuredProducts: Product[] = useMemo(() => {
    return allProducts.slice(0, 15).map((p) => toProductCard(p));
  }, [allProducts]);

  // Boutiques populaires : ne montre QUE des boutiques ayant au moins 1 produit réel
  const popularShops = useMemo(() => {
    const prominentShopIds = ["solaris-rdc", "kazi-tech", "brazza-wax-couture", "abidjan-elegance-deco"];
    const allShops = getAllShops();
    const selected = prominentShopIds
      .map((id) => allShops.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s && s.productCount > 0));

    // Fallback avec d'autres boutiques ayant au moins 1 produit si nécessaire
    const pool =
      selected.length >= 4
        ? selected.slice(0, 4)
        : [
            ...selected,
            ...allShops.filter((s) => s.productCount > 0 && !selected.some((sel) => sel.id === s.id)),
          ].slice(0, 4);

    return pool.map((s, i) => {
      const realCount = s.productCount;
      return {
        id: s.id,
        name: s.name,
        tag: s.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
        location: `${s.city}, ${s.province}`,
        rating: s.rating.toFixed(1),
        productsCount:
          realCount > 0
            ? `${realCount} ${realCount > 1 ? t("shops.articles_count") : t("shops.article_count_singular")}`
            : null,
        verified: s.verified,
        colorBg: SHOP_COLORS[i % SHOP_COLORS.length],
      };
    });
  }, [t]);

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
      return Boolean(prod.badges?.discount?.includes("%") || (prod.originalUsdPrice && prod.originalUsdPrice > prod.usdPrice));
    }
    if (activeFilter === "local") {
      return prod.badges?.logistics === "origin-rdc" || prod.shopName.includes("Kivu") || prod.shopName.includes("Lubumbashi") || prod.shopName.includes("Solaris");
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] selection:bg-[#EA580C] selection:text-white">
      {/* Toast Notification */}
      {notificationMessage && (
        <div className="fixed bottom-5 right-5 z-[999] bg-[#0B1B3D] text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
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

      {/* Main Canvas — Même largeur et marges latérales unifiées max-w-[1280px] mx-auto px-4 lg:px-6 */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 lg:px-6 py-5 sm:py-6 space-y-10">
        {/* ─── 1. ZONE PRINCIPALE EN 3 COLONNES (Style Kikuu/Alibaba) ──────── */}
        <section className="flex flex-col lg:flex-row gap-4 items-stretch">
          {/* Colonne gauche (~256px) : Catégories verticales */}
          <aside className="hidden lg:flex w-64 shrink-0 bg-white rounded-lg border border-[#E2E8F0] p-2 flex-col justify-between shadow-2xs">
            <div className="space-y-0.5">
              {activeCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/produits?category=${cat.slug}`}
                  className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-slate-50 text-slate-700 hover:text-[#0B1B3D] transition group text-xs font-semibold"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
                    <span className="material-symbols-outlined text-lg text-slate-400 group-hover:text-[#0284C7] transition-colors shrink-0">
                      {cat.icon}
                    </span>
                    <span className="line-clamp-2 leading-tight">{t(`home.${cat.labelKey}`)}</span>
                  </div>
                  <span className="material-symbols-outlined text-sm text-slate-300 group-hover:text-slate-600 transition-colors shrink-0">
                    chevron_right
                  </span>
                </Link>
              ))}
            </div>

            <div className="pt-2 border-t border-[#E2E8F0] mt-1">
              <Link
                href="/produits"
                className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-slate-50 text-slate-700 hover:text-[#0284C7] transition text-xs font-bold group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-lg text-slate-400 group-hover:text-[#0284C7] shrink-0">
                    grid_view
                  </span>
                  <span>{t("home.all_catalog")}</span>
                </div>
                <span className="material-symbols-outlined text-sm text-slate-300 group-hover:text-[#0284C7] shrink-0">
                  chevron_right
                </span>
              </Link>
            </div>
          </aside>

          {/* Colonne centrale (flex-1) : Bannière héros hauteur ~360px */}
          <div className="flex-1 min-w-0 relative rounded-lg overflow-hidden bg-gradient-to-r from-[#0B1B3D] via-[#0F294A] to-[#1E3A8A] text-white shadow-sm border border-[#E2E8F0] flex flex-col justify-between min-h-[340px] lg:min-h-[360px]">
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 sm:p-8 flex-1">
              <div className="md:col-span-7 space-y-3.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse" />
                  <span className="text-[10px] font-bold tracking-wide uppercase text-orange-200">
                    {t("home.hero_tag")}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black leading-tight text-white font-display">
                  {t("home.hero_title")}
                </h1>

                <p className="text-xs sm:text-sm text-slate-200 max-w-lg leading-relaxed line-clamp-3 sm:line-clamp-none">
                  {t("home.hero_subtitle")}
                </p>

                <div className="pt-1 flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <a
                    href="#produits"
                    className="px-5 py-2.5 bg-[#EA580C] text-white font-bold text-xs rounded-lg shadow hover:bg-[#c2410c] transition-all flex items-center gap-1.5 transform active:scale-95 group"
                  >
                    <span>{t("home.hero_cta_buy")}</span>
                    <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">
                      arrow_forward
                    </span>
                  </a>
                  <a
                    href="#boutiques"
                    className="px-4 py-2.5 border border-white/40 text-white rounded-lg font-semibold text-xs hover:bg-white/10 transition-colors"
                  >
                    {t("home.hero_cta_shops")}
                  </a>
                </div>
              </div>

              <div className="hidden md:flex md:col-span-5 justify-center">
                <div className="relative w-full max-w-[260px] aspect-[4/3] rounded-lg overflow-hidden shadow-lg border border-white/20">
                  <Image
                    src="/images/hero/commerce-moderne.jpg"
                    alt="Commerce moderne"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 300px"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B3D]/80 via-transparent to-transparent flex items-end p-2.5">
                    <div className="bg-white/95 backdrop-blur-md rounded p-2 w-full text-slate-800 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-bold text-[#0284C7] tracking-wider">
                          {t("home.hero_offer_special")}
                        </span>
                        <span className="text-[9px] font-bold bg-[#EA580C] text-white px-1.5 py-0.5 rounded">
                          {maxRealDiscount > 0 ? `-${maxRealDiscount}%` : t("home.hero_offer_special")}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#0B1B3D] mt-0.5 truncate">{t("home.hero_offer_pack")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite (~260px) : Bienvenue Mwinda Market */}
          <aside className="hidden lg:flex w-64 shrink-0 bg-white rounded-lg border border-[#E2E8F0] p-4 flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-3 pb-3 border-b border-[#E2E8F0]">
                <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                  <Image
                    src="/images/logo-mwinda.png"
                    alt="Mwinda Market"
                    width={40}
                    height={40}
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-[#0B1B3D] font-display line-clamp-2 leading-snug">
                    {t("home.welcome_title")}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-tight line-clamp-2 mt-0.5">
                    {t("home.welcome_desc")}
                  </p>
                </div>
              </div>

              {/* Boutons Connexion / Inscription */}
              <div className="grid grid-cols-2 gap-2 my-3.5">
                <Link
                  href="/connexion"
                  className="w-full py-2 px-2 bg-[#0B1B3D] text-white text-xs font-bold rounded-md hover:bg-slate-800 transition text-center truncate shadow-xs"
                >
                  {t("home.welcome_login")}
                </Link>
                <Link
                  href="/connexion"
                  className="w-full py-2 px-2 border border-[#0B1B3D] text-[#0B1B3D] text-xs font-bold rounded-md hover:bg-slate-50 transition text-center truncate"
                >
                  {t("home.welcome_register")}
                </Link>
              </div>

              {/* 4 Points de confiance avec icônes */}
              <div className="space-y-2.5 pt-2 border-t border-[#E2E8F0]">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <span className="material-symbols-outlined text-base text-emerald-600 shrink-0">
                    verified_user
                  </span>
                  <span className="font-medium text-[11px]">{t("home.trust_secure_pay")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <span className="material-symbols-outlined text-base text-[#0284C7] shrink-0">
                    shield
                  </span>
                  <span className="font-medium text-[11px]">{t("home.trust_escrow")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <span className="material-symbols-outlined text-base text-[#EA580C] shrink-0">
                    local_shipping
                  </span>
                  <span className="font-medium text-[11px]">{t("home.trust_delivery")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <span className="material-symbols-outlined text-base text-amber-500 shrink-0">
                    verified
                  </span>
                  <span className="font-medium text-[11px]">{t("home.trust_certified")}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] mt-3">
              <Link
                href="/devenir-vendeur"
                className="text-[11px] font-semibold text-[#0284C7] hover:underline flex items-center justify-between"
              >
                <span>{t("home.seller_tag")}</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
            </div>
          </aside>
        </section>

        {/* ─── Grille mobile/tablette compacte des catégories (<1024px) ───── */}
        <section className="lg:hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {activeCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/produits?category=${cat.slug}`}
                className="flex items-center gap-2.5 p-3 rounded-lg bg-white border border-[#E2E8F0] text-slate-700 hover:text-[#0B1B3D] hover:border-[#0284C7] transition"
              >
                <span className="material-symbols-outlined text-xl text-[#0284C7] shrink-0">
                  {cat.icon}
                </span>
                <span className="text-xs font-semibold line-clamp-2 leading-tight">{t(`home.${cat.labelKey}`)}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── 2. QUATRE TUILES PROMO COLORÉES (Catalogue Local) ──────────── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {promoTiles.map((tile) => (
            <Link
              key={tile.slug}
              href={`/produits?category=${tile.slug}`}
              className="group relative rounded-lg border border-[#E2E8F0] bg-white p-3.5 hover:shadow-md hover:border-[#0284C7] transition-all flex items-center justify-between overflow-hidden"
            >
              <div className="space-y-1 min-w-0 flex-1 pr-2">
                <h3 className="text-xs sm:text-sm font-bold text-[#0B1B3D] group-hover:text-[#0284C7] transition-colors line-clamp-2 leading-snug">
                  {tile.name}
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#EA580C] group-hover:underline">
                  {t("home.promo_tile_view")}
                  <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform">
                    chevron_right
                  </span>
                </span>
              </div>
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                <Image
                  src={tile.image}
                  alt={tile.name}
                  fill
                  sizes="80px"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            </Link>
          ))}
        </section>

        {/* ─── 3. DEUX PANNEAUX : BOUTIQUES CERTIFIÉES & MEILLEURES PROMOTIONS ─ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {/* Panneau 1 : Boutiques certifiées Mwinda (fond marine) */}
          <div className="bg-[#0B1B3D] text-white rounded-lg p-4 sm:p-5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3.5">
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-lg text-sky-400"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                <h3 className="text-sm sm:text-base font-bold font-display tracking-tight text-white">
                  {t("home.certified_panel_title")}
                </h3>
              </div>
              <Link
                href="/boutiques"
                className="text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-0.5 transition"
              >
                <span>{t("home.view_all")}</span>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {certifiedShowcaseProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/produits/${p.id}`}
                  className="group bg-white rounded-md p-2 text-slate-900 flex flex-col hover:shadow transition border border-white/20"
                >
                  <div className="relative aspect-square rounded overflow-hidden bg-slate-100 mb-1.5">
                    <Image
                      src={p.image}
                      alt={p.title}
                      fill
                      sizes="120px"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <p className="text-[11px] font-medium text-slate-800 line-clamp-1 group-hover:text-[#0284C7] transition-colors">
                    {p.title}
                  </p>
                  <p className="text-xs font-bold text-[#0B1B3D] mt-0.5">
                    {p.usdPrice} $
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Panneau 2 : Meilleures promotions (fond bleu / dégradé) */}
          <div className="bg-gradient-to-br from-sky-900 to-[#0B1B3D] text-white rounded-lg p-4 sm:p-5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3.5">
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-lg text-[#EA580C]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_offer
                </span>
                <h3 className="text-sm sm:text-base font-bold font-display tracking-tight text-white">
                  {t("home.promo_panel_title")}
                </h3>
              </div>
              <Link
                href="/produits"
                className="text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-0.5 transition"
              >
                <span>{t("home.view_all")}</span>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {discountShowcaseProducts.map((p) => {
                const disc = p.originalUsdPrice
                  ? Math.round(((p.originalUsdPrice - p.usdPrice) / p.originalUsdPrice) * 100)
                  : 0;
                return (
                  <Link
                    key={p.id}
                    href={`/produits/${p.id}`}
                    className="group bg-white rounded-md p-2 text-slate-900 flex flex-col hover:shadow transition border border-white/20"
                  >
                    <div className="relative aspect-square rounded overflow-hidden bg-slate-100 mb-1.5">
                      <Image
                        src={p.image}
                        alt={p.title}
                        fill
                        sizes="120px"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {disc > 0 && (
                        <span className="absolute top-1 left-1 bg-[#EA580C] text-white text-[9px] font-bold px-1 py-0.5 rounded leading-none">
                          -{disc}%
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-slate-800 line-clamp-1 group-hover:text-[#0284C7] transition-colors">
                      {p.title}
                    </p>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xs font-bold text-[#EA580C]">{p.usdPrice} $</span>
                      {p.originalUsdPrice && (
                        <span className="text-[10px] text-slate-400 line-through">
                          {p.originalUsdPrice} $
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── 4. CATÉGORIES PHARES AVEC COMPTEURS RÉELS ──────────────────── */}
        <section className="space-y-3.5" id="categories">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#0284C7] font-bold">
                {t("home.categories_tag")}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#0B1B3D] font-display">
                {t("home.categories_title")}
              </h2>
            </div>
            <Link
              href="/produits"
              className="text-xs font-semibold text-[#0284C7] hover:underline flex items-center gap-1"
            >
              <span>{t("home.all_catalog")}</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {activeCategories.slice(0, 5).map((cat) => {
              const count = countProductsInCategory(allProducts, cat.slug);
              return (
                <Link
                  key={cat.slug}
                  href={`/produits?category=${cat.slug}`}
                  className="group bg-white p-3.5 rounded-lg border border-[#E2E8F0] hover:border-[#0284C7] hover:shadow-sm transition-all text-center flex flex-col items-center"
                >
                  <div className="w-11 h-11 rounded-full bg-slate-100 text-[#0B1B3D] group-hover:bg-sky-50 group-hover:text-[#0284C7] flex items-center justify-center mb-2 group-hover:scale-105 transition-all">
                    <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                  </div>
                  <h3 className="text-xs font-bold text-[#0B1B3D] group-hover:text-[#0284C7] line-clamp-1 transition-colors">
                    {t(`home.${cat.labelKey}`) || cat.defaultLabel}
                  </h3>
                  <span className="text-[11px] text-slate-500 mt-1 font-medium">
                    {count} {count > 1 ? t("shops.articles_count") : t("shops.article_count_singular")}
                  </span>
                </Link>
              );
            })}

            {/* Carte "Tout le catalogue" avec le total réel de produits */}
            <Link
              href="/produits"
              className="group bg-slate-50 p-3.5 rounded-lg border border-[#E2E8F0] hover:border-[#0284C7] hover:bg-white hover:shadow-sm transition-all text-center flex flex-col items-center justify-center"
            >
              <div className="w-11 h-11 rounded-full bg-slate-200 text-slate-700 group-hover:bg-[#0284C7] group-hover:text-white flex items-center justify-center mb-2 group-hover:rotate-90 transition-all">
                <span className="material-symbols-outlined text-2xl">grid_view</span>
              </div>
              <h3 className="text-xs font-bold text-[#0B1B3D] group-hover:text-[#0284C7] line-clamp-1 transition-colors">
                {t("home.all_catalog")}
              </h3>
              <span className="text-[11px] text-slate-500 mt-1 font-medium">
                {totalCatalogCount} {t("shops.articles_count")}
              </span>
            </Link>
          </div>
        </section>

        {/* ─── 5. BOUTIQUES POPULAIRES (Compteurs réels, masqués si 0) ─────── */}
        <section className="space-y-3.5" id="boutiques">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#0284C7] font-bold">
                {t("home.shops_tag")}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#0B1B3D] font-display">
                {t("home.shops_title")}
              </h2>
            </div>
            <Link
              href="/boutiques"
              className="text-xs font-semibold text-[#0284C7] hover:underline flex items-center gap-1"
            >
              <span>{t("home.shops_view_all")}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularShops.map((shop) => {
              if (!shop) return null;
              return (
                <div
                  key={shop.id}
                  className="bg-white rounded-lg border border-[#E2E8F0] p-4 hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-base shadow-xs ${shop.colorBg}`}
                      >
                        {shop.tag}
                      </div>
                      {shop.verified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-[#0284C7] border border-sky-200">
                          <span
                            className="material-symbols-outlined text-xs"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            verified
                          </span>
                          {t("home.certified_mwinda")}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-[#0B1B3D] mt-3 font-display truncate">
                      {shop.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <span className="material-symbols-outlined text-xs text-[#0284C7] shrink-0">location_on</span>
                      {shop.location}
                    </p>

                    <div className="flex items-center gap-2 my-2.5 text-xs">
                      <span className="flex items-center text-amber-500 font-bold">
                        <span
                          className="material-symbols-outlined text-sm mr-0.5"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        {shop.rating}
                      </span>
                      {shop.productsCount && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600 font-medium text-[11px]">{shop.productsCount}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/boutiques/${shop.id}`}
                    className="w-full py-2 rounded-md border border-[#0284C7] text-[#0284C7] hover:bg-sky-50 font-bold text-xs text-center transition block mt-1"
                  >
                    {t("home.view_shop")}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── 6. PRODUITS POPULAIRES (Grille dense 2 col / 3 / 4 / 5 xl) ───── */}
        <section className="space-y-4" id="produits">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#EA580C] font-bold">
                {t("home.products_tag")}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#0B1B3D] font-display">
                {t("home.products_title")}
              </h2>
            </div>

            {/* Filtres par onglets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                    activeFilter === tab.key
                      ? "bg-[#0B1B3D] text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grille dense : 2 col mobile, 3 tablette, 4 lg, 5 xl */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>

        {/* ─── 7. COMMENT COMMANDER SUR MWINDA MARKET (5 étapes) ──────────── */}
        <section className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 md:p-10 shadow-2xs space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-1.5">
            <span className="text-xs uppercase tracking-wider text-[#0284C7] font-bold">
              {t("home.how_tag")}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0B1B3D] font-display">
              {t("home.how_title")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {t("home.how_subtitle")}
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-5 gap-6 pt-2">
            <div className="hidden md:block absolute top-12 left-10 right-10 h-0.5 bg-slate-200 z-0" />

            {/* Étape 1 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-2 group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#0B1B3D] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-xl sm:text-2xl">search</span>
              </div>
              <span className="text-[11px] font-bold text-[#0284C7] uppercase tracking-wider">
                {t("home.step1_tag")}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0B1B3D] font-display">
                {t("home.step1_title")}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs">
                {t("home.step1_desc")}
              </p>
            </div>

            {/* Étape 2 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-2 group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border-2 border-[#0284C7] text-[#0284C7] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-xl sm:text-2xl">shopping_cart_checkout</span>
              </div>
              <span className="text-[11px] font-bold text-[#0284C7] uppercase tracking-wider">
                {t("home.step2_tag")}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0B1B3D] font-display">
                {t("home.step2_title")}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs">
                {t("home.step2_desc")}
              </p>
            </div>

            {/* Étape 3 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-2 group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#EA580C] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-xl sm:text-2xl">point_of_sale</span>
              </div>
              <span className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wider">
                {t("home.step3_tag")}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0B1B3D] font-display">
                {t("home.step3_title")}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs">
                {t("home.step3_desc")}
              </p>
            </div>

            {/* Étape 4 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-2 group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border-2 border-[#0284C7] text-[#0284C7] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-xl sm:text-2xl">local_shipping</span>
              </div>
              <span className="text-[11px] font-bold text-[#0284C7] uppercase tracking-wider">
                {t("home.step4_tag")}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0B1B3D] font-display">
                {t("home.step4_title")}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs">
                {t("home.step4_desc")}
              </p>
            </div>

            {/* Étape 5 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-2 group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#0B1B3D] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-xl sm:text-2xl">inventory_2</span>
              </div>
              <span className="text-[11px] font-bold text-[#0284C7] uppercase tracking-wider">
                {t("home.step5_tag")}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#0B1B3D] font-display">
                {t("home.step5_title")}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs">
                {t("home.step5_desc")}
              </p>
            </div>
          </div>
        </section>

        {/* ─── 8. CALLOUT : VOUS ÊTES COMMERÇANT OU IMPORTATEUR ? ──────────── */}
        <section className="rounded-lg bg-gradient-to-r from-slate-50 to-sky-50 border border-[#E2E8F0] p-6 lg:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-2xs">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase bg-[#0284C7] text-white px-2 py-0.5 rounded tracking-wider">
              {t("home.seller_tag")}
            </span>
            <h3 className="text-lg sm:text-2xl font-bold text-[#0B1B3D] font-display">
              {t("home.seller_title")}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
              {t("home.seller_desc")}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link
              href="/devenir-vendeur"
              className="w-full sm:w-auto px-6 py-3 bg-[#0B1B3D] text-white rounded-lg text-xs sm:text-sm font-bold hover:bg-slate-800 transition shadow-xs text-center block"
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
