"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Badge } from "@/components/Badge";
import { PriceTag } from "@/components/PriceTag";
import { ProductCard } from "@/components/ProductCard";
import { ElectronicProduct } from "@/data/electronics";
import { useCart } from "@/context/CartContext";
import { getShopIdByName } from "@/data/shops";
import { getCountryByCode } from "@/lib/activeCountries";
import { toProductCard } from "@/lib/marketData";
import { useCatalog } from "@/context/CatalogContext";
import { getCategoryForProduct } from "@/config/categories";
import { getDiscountBadgeText } from "@/lib/discounts";
import { useT } from "@/i18n";

interface PageProps {
  params: {
    id: string;
  };
}

export default function ProductDetailPage({ params }: PageProps) {
  const { addToCart: addGlobalToCart } = useCart();
  const { t } = useT();
  const {
    products: catalogProducts,
    getProductById,
    getShopById,
  } = useCatalog();

  // Résolution du produit — fallback sur le premier produit du catalogue live/mock
  const product: ElectronicProduct =
    getProductById(params.id) ||
    getProductById("station-energie-solaire-1000w") ||
    catalogProducts[0]!;

  // Galerie photo
  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Quantité et Panier
  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Onglet actif
  const [activeTab, setActiveTab] = useState<"specs" | "delivery" | "reviews">("specs");

  // Vendeur et pays
  const shopId = product.shopId || getShopIdByName(product.shopName);
  const shopObj = getShopById(shopId);
  const shopCountryCode = shopObj?.countryCode || "CD";
  const flag = getCountryByCode(shopCountryCode)?.flag || "🇨🇩";
  const isVerified = shopObj?.verified ?? true;

  // Gestion quantité
  const maxStock = product.stockCount || 15;
  const handleDecreaseQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };
  const handleIncreaseQuantity = () => {
    setQuantity((prev) => (prev < maxStock ? prev + 1 : prev));
  };

  // Ajout au panier
  const handleAddToCart = () => {
    addGlobalToCart(product, quantity);
    setToastMessage(`${quantity}x « ${product.title} » ${t("product_detail.toast_added")}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Achat immédiat
  const handleBuyNow = () => {
    addGlobalToCart(product, quantity);
    setToastMessage(`${t("product_detail.toast_redirect")} (${quantity})...`);
    setTimeout(() => {
      window.location.href = "/panier";
    }, 1000);
  };

  // Produits similaires dans la même catégorie / boutique / populaires (max 4, dédupliqués)
  const resolvedShopId = product.shopId || getShopIdByName(product.shopName);
  const categoryConfig = useMemo(
    () => getCategoryForProduct(product.category),
    [product.category]
  );

  const similarProducts = useMemo(() => {
    const all = catalogProducts;
    const sameCat = all.filter((p) => p.id !== product.id && p.category === product.category);
    const sameShop = all.filter(
      (p) =>
        p.id !== product.id &&
        (p.shopId || getShopIdByName(p.shopName)) === resolvedShopId &&
        !sameCat.some((c) => c.id === p.id)
    );
    const others = all.filter(
      (p) =>
        p.id !== product.id &&
        !sameCat.some((c) => c.id === p.id) &&
        !sameShop.some((s) => s.id === p.id)
    );

    const combined = [...sameCat, ...sameShop, ...others].slice(0, 4);
    return combined.map((p) => toProductCard(p));
  }, [product, catalogProducts, resolvedShopId]);

  // Spécifications techniques
  const specifications = product.specifications || {
    "Marque / Distributeur": product.shopName,
    "Catégorie": product.category,
    "Origine du stock": `${product.province}, RDC`,
    "Disponibilité": "En stock local certifié",
    "Garantie commerciale": "1 an pièces et main-d'œuvre Mwinda",
    "État": "Neuf sous emballage d'origine scellé",
  };

  const features = product.features || [
    "Produit 100% authentique vérifié par l'équipe technique Mwinda Market",
    `Stock garanti disponible immédiatement à ${product.shopCity}`,
    "Paiement sécurisé par Mobile Money (M-Pesa, Airtel Money, Orange Money)",
    t("product_detail.delivery_available_sub"),
  ];

  const reviews = product.reviews || [
    {
      id: "rev-default-1",
      author: "Dieudonné Mukendi",
      city: "Kinshasa (Gombe)",
      rating: 5,
      date: "14 Janvier 2025",
      comment:
        "Matériel de très grande qualité. Parfait pour les coupures d'électricité à Kinshasa, alimente mes appareils sans bruit.",
      verifiedPurchase: true,
    },
    {
      id: "rev-default-2",
      author: "Grâce Tshilombo",
      city: "Lubumbashi (Haut-Katanga)",
      rating: 5,
      date: "03 Février 2025",
      comment: "Arrivé en 48 heures au hub de Lubumbashi. Colis impeccable et produit déjà chargé.",
      verifiedPurchase: true,
    },
  ];

  const breadcrumbItems = useMemo(
    () => [
      { label: t("product_detail.breadcrumb_home") || "Accueil", href: "/", icon: "home" },
      { label: t("product_detail.breadcrumb_catalog") || t("catalog.title") || "Catalogue", href: "/produits" },
      {
        label: categoryConfig ? categoryConfig.defaultLabel : product.category,
        href: categoryConfig
          ? `/produits?category=${categoryConfig.slug}`
          : `/produits?category=${encodeURIComponent(product.category)}`,
      },
      { label: product.title, href: undefined },
    ],
    [t, categoryConfig, product.category, product.title]
  );

  // État produit introuvable
  if (!productFound) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-8 sm:p-12 text-center max-w-md mx-auto shadow-2xs space-y-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">inventory_2</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-[#0B1B3D] font-display">
                {t("product_detail.not_found_title")}
              </h1>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {t("product_detail.not_found_desc")}
              </p>
            </div>
            <Link
              href="/produits"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-lg font-bold text-xs transition shadow-xs"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>{t("product_detail.not_found_cta")}</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] selection:bg-[#EA580C] selection:text-white pb-24 lg:pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-5 right-5 z-[999] bg-[#0B1B3D] text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
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

      <Header />

      {/* Main Container unifié max-w-[1280px] */}
      <main className="w-full max-w-[1280px] mx-auto px-4 lg:px-6 py-4 sm:py-6 space-y-6 flex-1">
        <Breadcrumb items={breadcrumbItems} />

        {/* ─── STRUCTURE ALIBABA EN 3 ZONES SUR DESKTOP ────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ZONE 1 (Gauche, 5 colonnes) : Galerie Photo */}
          <div className="lg:col-span-5 space-y-3">
            {/* Image principale carrée */}
            <div className="relative aspect-square w-full bg-white rounded-lg border border-[#E2E8F0] overflow-hidden shadow-2xs group">
              <Image
                src={images[selectedImageIndex]}
                alt={product.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 500px"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Badges en haut à gauche */}
              <div className="absolute top-3 left-3 flex flex-col gap-1 z-10 pointer-events-none">
                {getDiscountBadgeText(product) && (
                  <Badge variant="discount" text={getDiscountBadgeText(product)!} />
                )}
                {product.badges.logistics && (
                  <Badge
                    variant={product.badges.logistics}
                    text={product.badges.logisticsText}
                  />
                )}
              </div>

              {/* Bouton favoris */}
              <button
                type="button"
                onClick={() => setIsWishlisted(!isWishlisted)}
                aria-label="Ajouter aux favoris"
                className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur text-slate-400 hover:text-rose-500 transition shadow-xs z-10"
              >
                <span
                  className={`material-symbols-outlined text-lg leading-none ${
                    isWishlisted ? "text-rose-500" : ""
                  }`}
                  style={isWishlisted ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  favorite
                </span>
              </button>

              {/* Zoom hint */}
              <div className="absolute bottom-2.5 right-2.5 bg-[#0B1B3D]/70 backdrop-blur text-white px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 pointer-events-none">
                <span className="material-symbols-outlined text-xs">zoom_in</span>
                <span>Zoom</span>
              </div>
            </div>

            {/* Miniatures cliquables */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((imgUrl, idx) => (
                  <button
                    key={imgUrl + idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative aspect-square rounded-md overflow-hidden border-2 bg-white transition-all ${
                      selectedImageIndex === idx
                        ? "border-[#0284C7] shadow-xs"
                        : "border-[#E2E8F0] opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`${product.title} - vue ${idx + 1}`}
                      fill
                      sizes="100px"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ZONE 2 (Centre, 4 colonnes) : Bloc d'Achat & Informations Produit */}
          <div className="lg:col-span-4 space-y-4">
            {/* Titre & Évaluations */}
            <div className="space-y-1.5">
              <h1 className="text-lg sm:text-xl font-bold text-[#0B1B3D] font-display leading-snug">
                {product.title}
              </h1>

              {/* Étoiles & avis */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                </div>
                <span className="font-bold text-[#0B1B3D]">{product.rating.toFixed(1)}</span>
                <span className="text-slate-400">•</span>
                <a
                  href="#reviews-section"
                  onClick={() => setActiveTab("reviews")}
                  className="text-[#0284C7] font-semibold hover:underline"
                >
                  {product.reviewCount} avis vérifiés
                </a>
              </div>
            </div>

            {/* Bloc Prix mis en valeur sur fond légèrement teinté */}
            <div className="bg-slate-50 border border-[#E2E8F0] p-4 rounded-lg space-y-2">
              <PriceTag
                usdPrice={product.usdPrice}
                originalUsdPrice={product.originalUsdPrice}
                size="lg"
              />
              <div className="flex items-center gap-2 pt-1 border-t border-[#E2E8F0] text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-emerald-700">
                  En stock ({maxStock} disponibles)
                </span>
                <span className="text-slate-400 text-[11px] ml-auto">Hub {product.province}</span>
              </div>
            </div>

            {/* Ligne vendeur discrète */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
              <span className="select-none text-sm">{flag}</span>
              <Link
                href={`/boutiques/${shopId}`}
                className="font-bold text-[#0B1B3D] hover:text-[#0284C7] transition-colors truncate"
              >
                {product.shopName}
              </Link>
              {isVerified && (
                <span
                  className="material-symbols-outlined text-xs text-[#0284C7]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  title="Vendeur certifié"
                >
                  verified
                </span>
              )}
              <span className="text-slate-400 ml-auto shrink-0">{product.shopCity}</span>
            </div>

            {/* Sélecteur de quantité */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs font-bold text-[#0B1B3D]">
                {t("product_detail.quantity")} :
              </span>
              <div className="flex items-center border border-[#E2E8F0] rounded-lg bg-white shadow-2xs">
                <button
                  type="button"
                  onClick={handleDecreaseQuantity}
                  disabled={quantity <= 1}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition font-bold"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-xs text-[#0B1B3D] tnum">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncreaseQuantity}
                  disabled={quantity >= maxStock}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition font-bold"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-slate-500">
                Total : <strong className="text-[#0B1B3D]">{product.usdPrice * quantity} $</strong>
              </span>
            </div>

            {/* Boutons d'Action : Ajouter (orange) & Acheter maintenant (marine) */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-3 px-4 rounded-lg bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-2 active:scale-95"
              >
                <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                <span>{t("product_detail.add_to_cart")}</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full py-3 px-4 rounded-lg bg-[#0B1B3D] hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-2 active:scale-95"
              >
                <span className="material-symbols-outlined text-base">flash_on</span>
                <span>{t("product_detail.buy_now")}</span>
              </button>

              {/* Mention discrète livraison disponible */}
              <div className="flex items-center gap-1.5 pt-1 text-xs text-slate-500">
                <span className="material-symbols-outlined text-sm text-[#0284C7]">
                  local_shipping
                </span>
                <span>{t("product_detail.delivery_available_sub")}</span>
              </div>
            </div>
          </div>

          {/* ZONE 3 (Droite, 3 colonnes) : Carte Vendeur & Protections */}
          <aside className="lg:col-span-3 space-y-4">
            {/* Carte Vendeur */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Boutique certifiée
                </span>
                <span className="text-xs">{flag}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-[#0B1B3D] border border-[#E2E8F0] flex items-center justify-center font-bold text-xs shrink-0">
                  {product.shopName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-xs text-[#0B1B3D] truncate font-display">
                      {product.shopName}
                    </span>
                    {isVerified && (
                      <span
                        className="material-symbols-outlined text-xs text-[#0284C7] shrink-0"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        verified
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{product.shopCity}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Note vendeur :</span>
                <span className="font-bold text-[#0B1B3D] flex items-center gap-0.5">
                  <span
                    className="material-symbols-outlined text-xs text-amber-500"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <span>{product.shopRating || "4.9"}/5</span>
                </span>
              </div>

              <Link
                href={`/boutiques/${shopId}`}
                className="w-full py-2 px-3 rounded-md bg-slate-50 hover:bg-slate-100 border border-[#E2E8F0] text-[#0B1B3D] font-bold text-xs flex items-center justify-center gap-1.5 transition block text-center"
              >
                <span>Voir la boutique</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
            </div>

            {/* Carte Protections Mwinda Market */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-2xs space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block pb-1 border-b border-[#E2E8F0]">
                Garanties Mwinda Market
              </span>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <span
                    className="material-symbols-outlined text-sm text-[#0284C7] shrink-0 mt-0.5"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    shield
                  </span>
                  <div>
                    <strong className="font-bold text-[#0B1B3D] block text-[11px]">
                      Séquestre Mwinda Pay
                    </strong>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      Paiement sécurisé et débloqué uniquement à la réception.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span
                    className="material-symbols-outlined text-sm text-[#EA580C] shrink-0 mt-0.5"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    local_shipping
                  </span>
                  <div>
                    <strong className="font-bold text-[#0B1B3D] block text-[11px]">
                      Livraison &amp; Suivi
                    </strong>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      Acheminement garanti avec suivi en direct par référence.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span
                    className="material-symbols-outlined text-sm text-emerald-600 shrink-0 mt-0.5"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    payments
                  </span>
                  <div>
                    <strong className="font-bold text-[#0B1B3D] block text-[11px]">
                      Mobile Money Direct
                    </strong>
                    <span className="text-[11px] text-slate-500 leading-tight block">
                      M-Pesa, Orange Money, Airtel Money en devises locales.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>

        {/* ─── BARRE D'ONGLETS STICKY (Caractéristiques, Livraison, Avis) ───── */}
        <div className="space-y-4">
          <div className="sticky top-16 md:top-[72px] z-20 bg-white/95 backdrop-blur-md rounded-lg border border-[#E2E8F0] shadow-2xs px-4 flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("specs")}
              className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === "specs"
                  ? "border-[#EA580C] text-[#EA580C]"
                  : "border-transparent text-slate-500 hover:text-[#0B1B3D]"
              }`}
            >
              <span className="material-symbols-outlined text-base">tune</span>
              <span>{t("product_detail.tab_specs")}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("delivery")}
              className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === "delivery"
                  ? "border-[#EA580C] text-[#EA580C]"
                  : "border-transparent text-slate-500 hover:text-[#0B1B3D]"
              }`}
            >
              <span className="material-symbols-outlined text-base">local_shipping</span>
              <span>{t("product_detail.tab_delivery")}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("reviews")}
              className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === "reviews"
                  ? "border-[#EA580C] text-[#EA580C]"
                  : "border-transparent text-slate-500 hover:text-[#0B1B3D]"
              }`}
            >
              <span className="material-symbols-outlined text-base">star</span>
              <span>Avis ({product.reviewCount})</span>
            </button>
          </div>

          {/* Contenu des onglets */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs">
            {/* Onglet Spécifications */}
            {activeTab === "specs" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0B1B3D] font-display mb-1.5">
                    Fiche technique détaillée
                  </h3>
                  {product.description && (
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                      {product.description}
                    </p>
                  )}
                </div>

                <div className="border border-[#E2E8F0] rounded-md overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <tbody>
                      {Object.entries(specifications).map(([key, value], idx) => (
                        <tr
                          key={key}
                          className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                        >
                          <td className="py-2.5 px-3.5 font-semibold text-[#0B1B3D] w-1/3 border-r border-[#E2E8F0]">
                            {key}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-700">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Caractéristiques additionnelles */}
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-[#0B1B3D] uppercase tracking-wider mb-2.5">
                    Points forts du produit
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {features.map((feat, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-md bg-slate-50 border border-[#E2E8F0] flex items-start gap-2.5"
                      >
                        <span
                          className="material-symbols-outlined text-emerald-600 text-base shrink-0 mt-0.5"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check_circle
                        </span>
                        <p className="text-xs text-slate-700 font-medium leading-snug">{feat}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Livraison */}
            {activeTab === "delivery" && (
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-slate-50 border border-[#E2E8F0] flex items-start gap-3">
                  <div className="w-10 h-10 rounded bg-[#0284C7] text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">local_shipping</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0B1B3D] font-display">
                      {t("product_detail.delivery_available")}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                      {t("product_detail.delivery_tab_desc")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Avis */}
            {activeTab === "reviews" && (
              <div id="reviews-section" className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#0B1B3D] font-display">
                      Avis clients vérifiés ({product.reviewCount})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Évaluations certifiées par les acheteurs après livraison.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-[#0B1B3D] font-display">
                      {product.rating.toFixed(1)}/5
                    </span>
                    <div className="flex items-center text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className="material-symbols-outlined text-sm"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-lg border border-[#E2E8F0] bg-slate-50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#0B1B3D]">{rev.author}</span>
                          <span className="text-[11px] text-slate-400">• {rev.city}</span>
                          {rev.verifiedPurchase && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              Achat vérifié
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">{rev.date}</span>
                      </div>
                      <div className="flex items-center text-amber-500">
                        {[...Array(rev.rating)].map((_, i) => (
                          <span
                            key={i}
                            className="material-symbols-outlined text-xs"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── SECTION PRODUITS SIMILAIRES ─────────────────────────────────── */}
        {similarProducts.length > 0 && (
          <section className="space-y-3 pt-4 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0B1B3D] font-display">
                Produits similaires dans {product.category}
              </h2>
              <Link
                href={`/produits?category=${getCategoryForProduct(product.category).slug}`}
                className="text-xs font-semibold text-[#0284C7] hover:underline flex items-center gap-1"
              >
                <span>Voir plus</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {similarProducts.map((simProd) => (
                <ProductCard key={simProd.id} product={simProd} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ─── BARRE D'ACHAT FIXE MOBILE (sticky en bas de l'écran) ─────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E2E8F0] shadow-lg px-4 py-2.5 flex items-center justify-between gap-3 lg:hidden">
        <div>
          <span className="text-[10px] text-slate-400 block font-medium leading-none mb-0.5">
            Prix total ({quantity})
          </span>
          <PriceTag usdPrice={product.usdPrice * quantity} size="sm" />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddToCart}
            className="px-4 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95"
          >
            <span className="material-symbols-outlined text-base">add_shopping_cart</span>
            <span>Ajouter</span>
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            className="px-3 py-2.5 rounded-lg bg-[#0B1B3D] text-white font-bold text-xs flex items-center justify-center active:scale-95"
          >
            <span className="material-symbols-outlined text-base">flash_on</span>
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
