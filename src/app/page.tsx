"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard, Product } from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/i18n";
import { useCatalog } from "@/context/CatalogContext";
import { toProductCard } from "@/lib/marketData";
import { getActiveCategories, countProductsInCategory } from "@/config/categories";
import { getMaxRealDiscount } from "@/lib/discounts";
import { HeroCarousel } from "@/components/HeroCarousel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  Truck,
  CreditCard,
  Store,
  Layers,
  Sparkles,
  ShoppingBag,
  Search,
  PackageCheck,
  Star,
  Check,
  X,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Palettes de couleurs pour les cartes boutiques
const SHOP_COLORS = [
  "bg-brand-navy text-white",
  "bg-brand-blue text-white",
  "bg-brand-orange text-white",
  "bg-slate-700 text-white",
];

export default function HomePage() {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { t } = useT();

  const [activeFilter, setActiveFilter] = useState("all");
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  const filterTabs = [
    { key: "all", label: t("home.filter_all") },
    { key: "express", label: t("home.filter_express") },
    { key: "flash", label: t("home.filter_flash") },
    { key: "local", label: t("home.filter_local") },
  ];

  const { products: allProducts, shops: catalogShops } = useCatalog();
  const totalCatalogCount = allProducts.length;

  // Catégories actives (uniquement celles ayant au moins 1 produit réel)
  const activeCategories = useMemo(() => getActiveCategories(allProducts), [allProducts]);

  // Remise maximale réelle calculée à partir des produits du catalogue
  const maxRealDiscount = useMemo(() => getMaxRealDiscount(allProducts), [allProducts]);

  // 4 Tuiles promo colorées sous la zone principale
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

  // Algorithme d'affichage et priorisation selon l'abonnement du vendeur
  const sortedCatalogProducts = useMemo(() => {
    return [...allProducts].sort((a, b) => {
      const aVerified = a.shopVerified ? 1 : 0;
      const bVerified = b.shopVerified ? 1 : 0;
      if (bVerified !== aVerified) return bVerified - aVerified;

      const aScore = (a.rating || 0) * (a.reviewCount || 0);
      const bScore = (b.rating || 0) * (b.reviewCount || 0);
      return bScore - aScore;
    });
  }, [allProducts]);

  // Produits populaires globaux
  const featuredProducts: Product[] = useMemo(() => {
    return sortedCatalogProducts.slice(0, 15).map((p) => toProductCard(p));
  }, [sortedCatalogProducts]);

  // Boutiques populaires
  const popularShops = useMemo(() => {
    const prominentShopIds = ["solaris-rdc", "kazi-tech", "brazza-wax-couture", "abidjan-elegance-deco"];
    const selected = prominentShopIds
      .map((id) => catalogShops.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s && s.productCount > 0));

    const pool =
      selected.length >= 4
        ? selected.slice(0, 4)
        : [
            ...selected,
            ...catalogShops.filter((s) => s.productCount > 0 && !selected.some((sel) => sel.id === s.id)),
          ].slice(0, 4);

    return pool.map((s, i) => {
      const realCount = s.productCount;
      return {
        id: s.id,
        name: s.name,
        tag: s.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
        location: `${s.city}, ${s.province}`,
        rating: s.rating.toFixed(1),
        reviewCount: s.reviewCount,
        productsCount:
          realCount > 0
            ? `${realCount} ${realCount > 1 ? t("shops.articles_count") : t("shops.article_count_singular")}`
            : null,
        verified: s.verified,
        colorBg: SHOP_COLORS[i % SHOP_COLORS.length],
      };
    });
  }, [t, catalogShops]);

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
    <div className="min-h-screen flex flex-col bg-background selection:bg-brand-orange selection:text-white">
      {/* Toast Notification épurée */}
      {notificationMessage && (
        <div className="fixed bottom-5 right-5 z-[999] bg-brand-navy text-white px-4 py-3 rounded-xl shadow-xl border border-white/10 flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{notificationMessage}</span>
          <button
            type="button"
            onClick={() => setNotificationMessage(null)}
            className="text-white/60 hover:text-white ml-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <Header />

      {/* Main Canvas unifié */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 lg:px-6 py-6 space-y-12">
        {/* ─── 1. ZONE PRINCIPALE EN 3 COLONNES (Style Kikuu/Alibaba épuré) ── */}
        <section className="flex flex-col lg:flex-row gap-4 items-stretch">
          {/* Colonne gauche (Catégories verticales épurées) */}
          <aside className="hidden lg:flex w-64 shrink-0 bg-white rounded-xl border border-border/70 p-2.5 flex-col justify-between shadow-card">
            <div className="space-y-0.5">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 mb-1">
                Catégories
              </div>
              {activeCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/produits?category=${cat.slug}`}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-brand-navy transition-colors group text-xs font-medium"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
                    <span className="material-symbols-outlined text-base text-slate-400 group-hover:text-brand-blue transition-colors shrink-0">
                      {cat.icon}
                    </span>
                    <span className="line-clamp-1">{t(`home.${cat.labelKey}`)}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors shrink-0" />
                </Link>
              ))}
            </div>

            <div className="pt-2 border-t border-border/50 mt-1">
              <Link
                href="/produits"
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-brand-blue transition-colors text-xs font-semibold group"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-400 group-hover:text-brand-blue shrink-0" />
                  <span>{t("home.all_catalog")}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-blue shrink-0" />
              </Link>
            </div>
          </aside>

          {/* Colonne centrale : Bannière Héros immersif (l'image des promotions prend tout le hero) */}
          <div className="flex-1 min-w-0">
            <HeroCarousel />
          </div>

          {/* Colonne droite : Espace Confiance & Connexion */}
          <aside className="hidden lg:flex w-64 shrink-0 bg-white rounded-xl border border-border/70 p-4 flex-col justify-between shadow-card">
            <div>
              <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                <div className="w-9 h-9 shrink-0 flex items-center justify-center">
                  <Image
                    src="/images/logo-mwinda.png"
                    alt="Mwinda Market"
                    width={36}
                    height={36}
                    className="w-9 h-9 object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-brand-navy line-clamp-1">
                    {t("home.welcome_title")}
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2 mt-0.5">
                    {t("home.welcome_desc")}
                  </p>
                </div>
              </div>

              {/* Statut connexion */}
              {user ? (
                <div className="my-3.5 space-y-2">
                  <div className="p-2.5 bg-slate-50 border border-border/70 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-blue shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Connecté</p>
                      <p className="text-xs font-semibold text-brand-navy truncate">
                        {user.fullName || user.phone || user.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/mon-compte"
                    className="w-full py-2 px-3 bg-brand-orange text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Accéder à Mon Compte</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 my-3.5">
                  <Link
                    href="/connexion"
                    className="w-full py-2 px-2 bg-brand-navy text-white text-xs font-semibold rounded-lg hover:bg-brand-navy/90 transition-colors text-center truncate shadow-xs"
                  >
                    {t("home.welcome_login")}
                  </Link>
                  <Link
                    href="/connexion"
                    className="w-full py-2 px-2 border border-border text-foreground text-xs font-semibold rounded-lg hover:bg-muted transition-colors text-center truncate"
                  >
                    {t("home.welcome_register")}
                  </Link>
                </div>
              )}

              {/* 4 Points de confiance avec Lucide icons */}
              <div className="space-y-2.5 pt-2 border-t border-border/60">
                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-[11px]">{t("home.trust_secure_pay")}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                  <CreditCard className="w-4 h-4 text-brand-blue shrink-0" />
                  <span className="font-medium text-[11px]">{t("home.trust_escrow")}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                  <Truck className="w-4 h-4 text-brand-orange shrink-0" />
                  <span className="font-medium text-[11px]">{t("home.trust_delivery")}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="font-medium text-[11px]">{t("home.trust_certified")}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 mt-3">
              <Link
                href="/devenir-vendeur"
                className="text-[11px] font-semibold text-brand-blue hover:underline flex items-center justify-between"
              >
                <span>{t("home.seller_tag")}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </aside>
        </section>

        {/* ─── Grille mobile des catégories (<1024px) ──────────────────────── */}
        <section className="lg:hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {activeCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/produits?category=${cat.slug}`}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-border/70 text-slate-700 hover:text-brand-navy hover:border-brand-blue transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-lg text-brand-blue shrink-0">
                  {cat.icon}
                </span>
                <span className="text-xs font-semibold line-clamp-1">{t(`home.${cat.labelKey}`)}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── 2. QUATRE TUILES PROMO ÉPURÉES ──────────────────────────────── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {promoTiles.map((tile) => (
            <Link
              key={tile.slug}
              href={`/produits?category=${tile.slug}`}
              className="group relative rounded-xl border border-border/70 bg-white p-3.5 hover:shadow-card-hover hover:border-slate-300 transition-all duration-200 flex items-center justify-between overflow-hidden"
            >
              <div className="space-y-1 min-w-0 flex-1 pr-2">
                <h3 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-brand-blue transition-colors line-clamp-1">
                  {tile.name}
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-orange group-hover:underline">
                  {t("home.promo_tile_view")}
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-slate-50 shrink-0 border border-border/60">
                <Image
                  src={tile.image}
                  alt={tile.name}
                  fill
                  sizes="80px"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </Link>
          ))}
        </section>

        {/* ─── 3. GRANDES BANNIÈRES PROMOTIONNELLES CAMPAGNE ────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Bannière 1 : Énergie Solaire & High-Tech */}
          <Link
            href="/produits?category=energie-solaire"
            className="group relative rounded-2xl overflow-hidden shadow-card border border-border/70 min-h-[220px] sm:min-h-[260px] flex items-end p-6 sm:p-8"
          >
            <Image
              src="/images/shops/solaris-rdc-banner.jpg"
              alt="Offres Spéciales Énergie Solaire & High-Tech"
              fill
              sizes="(max-width: 1024px) 100vw, 600px"
              className="object-cover object-center w-full h-full group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent" />
            <div className="relative z-10 space-y-2 max-w-md text-white">
              <span className="inline-flex items-center gap-1.5 bg-brand-orange text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow-sm tracking-wider">
                <Flame className="w-3 h-3 text-white" />
                Jusqu'à -30% Réduction Immédiate
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight group-hover:text-orange-200 transition-colors">
                Énergie Solaire & High-Tech
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                Stations électriques, panneaux solaires et smartphones de pointe avec garantie constructeur.
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:underline">
                  <span>Découvrir la sélection</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </Link>

          {/* Bannière 2 : Mode Panafricaine & Décoration Artisanale */}
          <Link
            href="/produits?category=mode"
            className="group relative rounded-2xl overflow-hidden shadow-card border border-border/70 min-h-[220px] sm:min-h-[260px] flex items-end p-6 sm:p-8"
          >
            <Image
              src="/images/shops/brazza-wax-couture-banner.jpg"
              alt="Collections Mode & Artisanat d'Afrique"
              fill
              sizes="(max-width: 1024px) 100vw, 600px"
              className="object-cover object-center w-full h-full group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent" />
            <div className="relative z-10 space-y-2 max-w-md text-white">
              <span className="inline-flex items-center gap-1.5 bg-brand-blue text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow-sm tracking-wider">
                <Sparkles className="w-3 h-3 text-white" />
                Nouveaux Arrivages Créateurs
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight group-hover:text-sky-200 transition-colors">
                Mode Africaine & Déco Faite-Main
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                Robes en wax premium, lin artisanal et luminaires confectionnés par des ateliers certifiés.
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:underline">
                  <span>Voir les collections</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </Link>
        </section>

        {/* ─── 4. CATÉGORIES PHARES AVEC COMPTEURS RÉELS ──────────────────── */}
        <section className="space-y-4" id="categories">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-brand-blue font-bold">
                {t("home.categories_tag")}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                {t("home.categories_title")}
              </h2>
            </div>
            <Link
              href="/produits"
              className="text-xs font-semibold text-brand-blue hover:underline flex items-center gap-1"
            >
              <span>{t("home.all_catalog")}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {activeCategories.slice(0, 5).map((cat) => {
              const count = countProductsInCategory(allProducts, cat.slug);
              return (
                <Link
                  key={cat.slug}
                  href={`/produits?category=${cat.slug}`}
                  className="group bg-card p-4 rounded-xl border border-border/70 hover:border-slate-300 hover:shadow-card-hover transition-all duration-200 text-center flex flex-col items-center"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-brand-navy group-hover:bg-brand-blue/10 group-hover:text-brand-blue flex items-center justify-center mb-2.5 transition-colors">
                    <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                  </div>
                  <h3 className="text-xs font-semibold text-foreground group-hover:text-brand-blue line-clamp-1 transition-colors">
                    {t(`home.${cat.labelKey}`) || cat.defaultLabel}
                  </h3>
                  <span className="text-[11px] text-muted-foreground mt-1 font-medium">
                    {count} {count > 1 ? t("shops.articles_count") : t("shops.article_count_singular")}
                  </span>
                </Link>
              );
            })}

            {/* Carte "Tout le catalogue" avec le total réel */}
            <Link
              href="/produits"
              className="group bg-slate-50/80 p-4 rounded-xl border border-border/70 hover:border-slate-300 hover:bg-white hover:shadow-card-hover transition-all duration-200 text-center flex flex-col items-center justify-center"
            >
              <div className="w-12 h-12 rounded-full bg-slate-200/80 text-slate-700 group-hover:bg-brand-navy group-hover:text-white flex items-center justify-center mb-2.5 transition-colors">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-semibold text-foreground group-hover:text-brand-navy line-clamp-1 transition-colors">
                {t("home.all_catalog")}
              </h3>
              <span className="text-[11px] text-muted-foreground mt-1 font-medium">
                {totalCatalogCount} {t("shops.articles_count")}
              </span>
            </Link>
          </div>
        </section>

        {/* ─── 5. BOUTIQUES POPULAIRES (Compteurs réels) ───────────────────── */}
        <section className="space-y-4" id="boutiques">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-brand-blue font-bold">
                {t("home.shops_tag")}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                {t("home.shops_title")}
              </h2>
            </div>
            <Link
              href="/boutiques"
              className="text-xs font-semibold text-brand-blue hover:underline flex items-center gap-1"
            >
              <span>{t("home.shops_view_all")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularShops.length > 0 ? (
              popularShops.map((shop) => {
                if (!shop) return null;
                return (
                  <div
                    key={shop.id}
                    className="bg-card rounded-xl border border-border/70 p-4 hover:shadow-card-hover hover:border-slate-300 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div
                          className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-base shadow-xs ${shop.colorBg}`}
                        >
                          {shop.tag}
                        </div>
                        {shop.verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-brand-blue border border-sky-200/60">
                            <CheckCircle2 className="w-3 h-3 text-brand-blue" />
                            {t("home.certified_mwinda")}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-foreground mt-3 truncate">
                        {shop.name}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                        {shop.location}
                      </p>

                      <div className="flex items-center gap-2 my-2.5 text-xs">
                        <span className="flex items-center text-amber-500 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                          {shop.rating}
                          <span className="text-[11px] text-muted-foreground font-normal ml-1">
                            ({shop.reviewCount})
                          </span>
                        </span>
                        {shop.productsCount && (
                          <>
                            <span className="text-border">•</span>
                            <span className="text-muted-foreground font-medium text-[11px]">{shop.productsCount}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/boutiques/${shop.id}`}
                      className="w-full py-2 rounded-lg border border-border text-foreground hover:bg-slate-50 font-semibold text-xs text-center transition-colors block mt-2"
                    >
                      {t("home.view_shop")}
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full bg-card rounded-xl border border-border/70 p-8 text-center">
                <Store className="w-8 h-8 text-brand-blue mx-auto mb-2" />
                <p className="text-sm font-bold text-foreground">Nouvelles boutiques en cours d'ouverture</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Rejoignez les premiers marchands vérifiés de la plateforme pour exposer vos produits.
                </p>
                <Link
                  href="/devenir-vendeur"
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-blue text-white rounded-lg text-xs font-semibold hover:bg-sky-700 transition-colors shadow-xs"
                >
                  <span>Créer ma boutique</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ─── 6. PRODUITS POPULAIRES (Grille 2 à 5 colonnes épurée) ───────── */}
        <section className="space-y-4" id="produits">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs uppercase tracking-wider text-brand-orange font-bold">
                {t("home.products_tag")}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                {t("home.products_title")}
              </h2>
            </div>

            {/* Filtres par onglets épurés (shadcn pill tabs) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilter(tab.key)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150",
                    activeFilter === tab.key
                      ? "bg-brand-navy text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grille : 2 col mobile, 3 tablette, 4 lg, 5 xl */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-card rounded-xl border border-border/70 p-8 shadow-xs">
                <ShoppingBag className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-base font-bold text-foreground">Catalogue en cours d'actualisation</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                  Les vendeurs ajoutent de nouveaux articles. Vous pouvez également ouvrir votre propre boutique pour commencer à vendre dès aujourd'hui.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Link
                    href="/devenir-vendeur"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-lg text-xs font-semibold hover:bg-orange-600 transition-colors shadow-xs"
                  >
                    <span>Ouvrir une boutique</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ─── 7. COMMENT COMMANDER SUR MWINDA MARKET (5 étapes épurées) ───── */}
        <section className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 md:p-10 shadow-card space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-1.5">
            <span className="text-xs uppercase tracking-wider text-brand-blue font-bold">
              {t("home.how_tag")}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {t("home.how_title")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t("home.how_subtitle")}
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-5 gap-6 pt-2">
            <div className="hidden md:block absolute top-10 left-12 right-12 h-0.5 bg-slate-200 z-0" />

            {/* Étape 1 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-2 group">
              <div className="w-12 h-12 rounded-xl bg-brand-navy text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
                <Search className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-brand-blue uppercase tracking-wider">
                {t("home.step1_tag")}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-foreground">
                {t("home.step1_title")}
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                {t("home.step1_desc")}
              </p>
            </div>

            {/* Étape 2 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-2 group">
              <div className="w-12 h-12 rounded-xl bg-white border-2 border-brand-blue text-brand-blue flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-brand-blue uppercase tracking-wider">
                {t("home.step2_tag")}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-foreground">
                {t("home.step2_title")}
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                {t("home.step2_desc")}
              </p>
            </div>

            {/* Étape 3 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-2 group">
              <div className="w-12 h-12 rounded-xl bg-brand-orange text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-brand-orange uppercase tracking-wider">
                {t("home.step3_tag")}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-foreground">
                {t("home.step3_title")}
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                {t("home.step3_desc")}
              </p>
            </div>

            {/* Étape 4 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-2 group">
              <div className="w-12 h-12 rounded-xl bg-white border-2 border-brand-blue text-brand-blue flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-brand-blue uppercase tracking-wider">
                {t("home.step4_tag")}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-foreground">
                {t("home.step4_title")}
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                {t("home.step4_desc")}
              </p>
            </div>

            {/* Étape 5 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-2 group">
              <div className="w-12 h-12 rounded-xl bg-brand-navy text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
                <PackageCheck className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-brand-blue uppercase tracking-wider">
                {t("home.step5_tag")}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-foreground">
                {t("home.step5_title")}
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                {t("home.step5_desc")}
              </p>
            </div>
          </div>
        </section>

        {/* ─── 8. CALLOUT : ESPACE COMMERÇANT & IMPORTATEUR ─────────────────── */}
        <section className="rounded-2xl bg-slate-50/80 border border-border/70 p-6 lg:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase bg-brand-blue text-white px-2.5 py-0.5 rounded-full tracking-wider">
              {t("home.seller_tag")}
            </span>
            <h3 className="text-lg sm:text-2xl font-bold text-foreground">
              {t("home.seller_title")}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
              {t("home.seller_desc")}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link
              href="/devenir-vendeur"
              className="w-full sm:w-auto px-6 py-3 bg-brand-navy text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-brand-navy/90 transition-colors shadow-xs text-center block"
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
