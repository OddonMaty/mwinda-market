"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/Badge";
import { PriceTag } from "@/components/PriceTag";
import { ProductCard } from "@/components/ProductCard";
import { ELECTRONICS_PRODUCTS, ElectronicProduct } from "@/data/electronics";
import { useCart } from "@/context/CartContext";
import { getShopIdByName } from "@/data/shops";
import { getAllProducts, toProductCard } from "@/lib/marketData";
import { useT } from "@/i18n";

interface PageProps {
  params: {
    id: string;
  };
}

export default function ProductDetailPage({ params }: PageProps) {
  const { addToCart: addGlobalToCart } = useCart();
  const { t } = useT();

  // Resolve product — null when ID truly doesn't exist (B-03)
  const productFound: ElectronicProduct | undefined = ELECTRONICS_PRODUCTS.find(
    (p) => p.id === params.id
  );
  const product: ElectronicProduct =
    productFound ||
    ELECTRONICS_PRODUCTS.find((p) => p.id === "station-energie-solaire-1000w") ||
    ELECTRONICS_PRODUCTS[0];


  // Gallery state
  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Cart & Quantity state
  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);



  // Active info tab
  const [activeTab, setActiveTab] = useState<"specs" | "features" | "delivery">("specs");

  // Quantity handlers
  const maxStock = product.stockCount || 15;
  const handleDecreaseQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };
  const handleIncreaseQuantity = () => {
    setQuantity((prev) => (prev < maxStock ? prev + 1 : prev));
  };

  // Add to cart handler (always active — global catalogue)
  const handleAddToCart = () => {
    addGlobalToCart(product, quantity);
    setToastMessage(`${quantity}x « ${product.title} » ${t("product_detail.toast_added")}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Buy now handler (always active — global catalogue)
  const handleBuyNow = () => {
    addGlobalToCart(product, quantity);
    setToastMessage(`${t("product_detail.toast_redirect")} (${quantity})...`);
    setTimeout(() => {
      window.location.href = "/panier";
    }, 1200);
  };

  // Produits similaires : catalogue global, même catégorie
  const similarProducts = useMemo(() => {
    return getAllProducts()
      .filter((p) => p.id !== product.id && p.category === product.category)
      .slice(0, 3)
      .map((p) => toProductCard(p));
  }, [product.id, product.category]);

  // Fallbacks for specs, features, reviews
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
    "Livraison fiable avec suivi en direct à travers les 26 provinces",
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

  // B-03: afficher un état visuel clair si le produit est introuvable
  if (!productFound) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-8 sm:p-16 text-center max-w-md mx-auto shadow-card space-y-6">
            <div className="w-20 h-20 bg-surface-container text-outline rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl">inventory_2</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold text-primary font-display">
                {t("product_detail.not_found_title")}
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                {t("product_detail.not_found_desc")}
              </p>
            </div>
            <Link
              href="/produits"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-tertiary hover:bg-tertiary-hover text-white rounded-lg font-bold text-xs sm:text-sm transition shadow-md"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span>{t("product_detail.not_found_cta")}</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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

      {/* Breadcrumb Navigation Bar */}
      <nav aria-label="Fil d'Ariane" className="bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-10 py-3">
          <ol className="flex items-center gap-2 text-xs text-outline overflow-x-auto whitespace-nowrap">
            <li>
              <Link href="/" className="hover:text-primary transition flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">home</span>
                <span>Accueil</span>
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <Link href="/produits" className="hover:text-primary transition">
                Catégories
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <Link href="/categories/electronique" className="hover:text-primary transition">
                {product.category}
              </Link>
            </li>
            <li className="flex items-center gap-2 text-on-surface font-semibold truncate max-w-[220px] sm:max-w-md">
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="truncate">{product.title}</span>
            </li>
          </ol>
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-10 py-6 sm:py-8 space-y-12 flex-1">
        {/* ================= SECTION 1 : 2-COLUMN HERO (GALERIE + INFOS PRODUIT) ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* COLONNE GAUCHE : GALERIE IMAGE (Mobile haut / Desktop 6-7 cols) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Image Principale avec Aspect Ratio verrouillé */}
            <div className="relative aspect-square w-full bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden custom-shadow group">
              <Image
                src={images[selectedImageIndex]}
                alt={product.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Badges Stack (Haut Gauche) */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10 pointer-events-none">
                {product.badges.discount && (
                  <Badge variant="discount" text={product.badges.discount} />
                )}
                {product.badges.logistics && (
                  <Badge
                    variant={product.badges.logistics}
                    text={product.badges.logisticsText}
                  />
                )}
              </div>

              {/* Bouton Favoris (Haut Droit) */}
              <button
                type="button"
                onClick={() => setIsWishlisted(!isWishlisted)}
                aria-label="Ajouter aux favoris"
                className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 backdrop-blur text-outline hover:text-error transition shadow-md z-10"
              >
                <span
                  className={`material-symbols-outlined text-xl transition-colors ${
                    isWishlisted ? "text-error" : ""
                  }`}
                  style={isWishlisted ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  favorite
                </span>
              </button>

              {/* Badge zoom hint */}
              <div className="absolute bottom-3 right-3 bg-primary/70 backdrop-blur text-white px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 pointer-events-none">
                <span className="material-symbols-outlined text-xs">zoom_in</span>
                <span>Survoler pour zoomer</span>
              </div>
            </div>

            {/* Miniatures cliquables */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((imgUrl, idx) => (
                  <button
                    key={imgUrl + idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 bg-surface-container-lowest transition-all ${
                      selectedImageIndex === idx
                        ? "border-secondary ring-2 ring-secondary/20 shadow-md scale-95"
                        : "border-outline-variant hover:border-slate-300 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`${product.title} - vue ${idx + 1}`}
                      fill
                      sizes="120px"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Garanties Rapides sous la galerie */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant text-center space-y-1">
                <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified_user
                </span>
                <p className="text-[11px] font-bold text-primary">Garantie 2 ans</p>
                <p className="text-[10px] text-outline">Pièces &amp; S.A.V</p>
              </div>

              <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant text-center space-y-1">
                <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  payments
                </span>
                <p className="text-[11px] font-bold text-primary">Mobile Money</p>
                <p className="text-[10px] text-outline">M-Pesa, Airtel, Orange</p>
              </div>

              <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant text-center space-y-1">
                <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  local_shipping
                </span>
                <p className="text-[11px] font-bold text-primary">26 Provinces</p>
                <p className="text-[10px] text-outline">Suivi en direct</p>
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : INFOS PRODUIT & ACHAT (Desktop 6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Header info : Titre, Vendeur, Notes */}
            <div className="space-y-3">
              {/* Vendeur & Ville Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/boutiques/${getShopIdByName(product.shopName)}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline"
                >
                  <span className="material-symbols-outlined text-sm">storefront</span>
                  <span>Boutique : {product.shopName} ({product.shopCity})</span>
                </Link>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-secondary-fixed text-on-secondary-container">
                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                  Certifié Mwinda
                </span>
              </div>

              {/* Titre Produit Principal */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-primary font-display leading-snug">
                {product.title}
              </h1>

              {/* Étoiles & Lien vers avis clients */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-base"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                </div>
                <span className="font-bold text-primary">{product.rating.toFixed(1)}</span>
                <span className="text-outline">•</span>
                <a href="#reviews-section" className="text-secondary font-semibold hover:underline">
                  {product.reviewCount} avis clients vérifiés
                </a>
              </div>
            </div>

            {/* Bloc Prix Principal (USD + CDF) */}
            <div className="bg-surface-container-low p-4 sm:p-5 rounded-xl border border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-outline font-bold block mb-1">
                  Prix officiel garanti
                </span>
                <PriceTag
                  usdPrice={product.usdPrice}
                  originalUsdPrice={product.originalUsdPrice}
                  size="lg"
                />
              </div>

              <div className="sm:text-right shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>En stock ({maxStock} disponibles)</span>
                </span>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Expédié depuis le hub {product.province}
                </p>
              </div>
            </div>

            {/* Sélecteur de Quantité & Boutons d'Action CTA */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  {t("product_detail.quantity")} :
                </span>
                <div className="flex items-center border border-outline-variant rounded-lg bg-surface-container-lowest">
                  <button
                    type="button"
                    onClick={handleDecreaseQuantity}
                    disabled={quantity <= 1}
                    className="w-10 h-10 flex items-center justify-center text-on-surface hover:bg-surface-container disabled:opacity-30 transition font-bold"
                    aria-label="Diminuer la quantité"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold text-sm text-primary tnum">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncreaseQuantity}
                    disabled={quantity >= maxStock}
                    className="w-10 h-10 flex items-center justify-center text-on-surface hover:bg-surface-container disabled:opacity-30 transition font-bold"
                    aria-label="Augmenter la quantité"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-outline">
                  Total : <strong className="text-primary">{product.usdPrice * quantity} $</strong>
                </span>
              </div>

              {/* Bouton CTA Orange Large & Proéminent */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full py-3.5 px-6 rounded-lg font-bold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-95 group bg-tertiary hover:bg-tertiary-hover text-white"
                  title={t("product_detail.add_to_cart")}
                >
                  <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">
                    shopping_cart
                  </span>
                  <span>{t("product_detail.add_to_cart")}</span>
                </button>

                {/* Bouton Secondaire Acheter Maintenant */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full py-3.5 px-6 rounded-lg font-bold text-sm sm:text-base shadow transition flex items-center justify-center gap-2 active:scale-95 bg-primary hover:bg-slate-800 text-white"
                >
                  <span className="material-symbols-outlined text-xl">flash_on</span>
                  <span>{t("product_detail.buy_now")}</span>
                </button>

                {/* Mention discrète livraison disponible */}
                <div className="flex items-center gap-2 pt-1 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-secondary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                    local_shipping
                  </span>
                  <span className="font-medium">Livraison disponible avec suivi de commande</span>
                </div>
              </div>
            </div>

            {/* Bloc Information Livraison */}
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    local_shipping
                  </span>
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                    Livraison
                  </h4>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Disponible
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Expédition soignée et remise sécurisée. Suivi en direct disponible pour toute commande.
              </p>
            </div>

            {/* Carte Info Vendeur & Confiance */}
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-base shrink-0">
                  {product.shopName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary font-display">{product.shopName}</span>
                    <span className="text-[10px] font-bold bg-secondary-fixed text-on-secondary-container px-1.5 py-0.5 rounded">
                      Vendeur Vérifié
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">{product.shopCity} • {product.shopRating || "4.9"}/5 satisfaction</p>
                </div>
              </div>
              <Link
                href={`/boutiques/${getShopIdByName(product.shopName)}`}
                className="px-3.5 py-1.5 rounded-lg border border-secondary text-secondary hover:bg-secondary/10 font-bold text-xs transition whitespace-nowrap"
              >
                Voir boutique
              </Link>
            </div>
          </div>
        </section>

        {/* ================= SECTION 2 : SPÉCIFICATIONS TECHNIQUES & DESCRIPTION ================= */}
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden custom-shadow">
          {/* Navigation des Onglets */}
          <div className="flex items-center border-b border-outline-variant bg-surface-container-low px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setActiveTab("specs")}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === "specs"
                  ? "border-secondary text-secondary"
                  : "border-transparent text-outline hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-base">tune</span>
              <span>{t("product_detail.tab_specs")}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("features")}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === "features"
                  ? "border-secondary text-secondary"
                  : "border-transparent text-outline hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>{t("product_detail.tab_features")}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("delivery")}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === "delivery"
                  ? "border-secondary text-secondary"
                  : "border-transparent text-outline hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-base">local_shipping</span>
              <span>{t("product_detail.tab_delivery")}</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {/* Onglet 1 : Spécifications techniques */}
            {activeTab === "specs" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-primary font-display mb-2">
                    Fiche technique détaillée
                  </h3>
                  {product.description && (
                    <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6">
                      {product.description}
                    </p>
                  )}
                </div>

                {/* Tableau à double colonnes zébrées */}
                <div className="border border-outline-variant rounded-xl overflow-hidden">
                  <table className="w-full text-xs sm:text-sm text-left">
                    <tbody>
                      {Object.entries(specifications).map(([key, value], idx) => (
                        <tr
                          key={key}
                          className={idx % 2 === 0 ? "bg-white" : "bg-surface-container-low"}
                        >
                          <td className="py-3 px-4 font-semibold text-primary w-1/3 border-r border-outline-variant/60">
                            {key}
                          </td>
                          <td className="py-3 px-4 text-on-surface font-medium">
                            {value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Onglet 2 : Caractéristiques & Avantages */}
            {activeTab === "features" && (
              <div className="space-y-6">
                <h3 className="text-base sm:text-lg font-bold text-primary font-display">
                  Pourquoi choisir ce produit ?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {features.map((feat, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-surface-container-low border border-outline-variant flex items-start gap-3"
                    >
                      <span className="material-symbols-outlined text-secondary text-xl shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                        task_alt
                      </span>
                      <p className="text-xs sm:text-sm text-on-surface leading-snug font-medium">
                        {feat}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Onglet 3 : Livraison */}
            {activeTab === "delivery" && (
              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      local_shipping
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-primary font-display">
                      Livraison disponible
                    </h3>
                    <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                      La livraison est disponible pour ce produit avec suivi sécurisé en temps réel et protection acheteur sous séquestre Mwinda Pay.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================= SECTION 3 : AVIS & RETOURS D'EXPÉRIENCE CLIENTS ================= */}
        <section id="reviews-section" className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 sm:p-8 custom-shadow space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-outline-variant pb-6">
            <div>
              <span className="text-xs uppercase tracking-wider text-secondary font-bold">
                Retours d&apos;expérience authentifiés
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-display mt-0.5">
                Avis &amp; Évaluations Clients
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Avis rédigés par des acheteurs ayant reçu et testé ce produit en RDC.
              </p>
            </div>

            {/* Note globale & Répartition */}
            <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant">
              <div className="text-center">
                <span className="text-3xl sm:text-4xl font-black text-primary font-display block leading-none">
                  {product.rating.toFixed(1)}
                </span>
                <div className="flex items-center text-amber-500 justify-center mt-1">
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
                <span className="text-[11px] text-outline mt-0.5 block">{product.reviewCount} évaluations</span>
              </div>

              <div className="h-10 w-px bg-outline-variant" />

              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-on-surface font-semibold w-6">5 ★</span>
                  <div className="w-24 sm:w-32 h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: "92%" }} />
                  </div>
                  <span className="text-[10px] text-outline">92%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-on-surface font-semibold w-6">4 ★</span>
                  <div className="w-24 sm:w-32 h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: "6%" }} />
                  </div>
                  <span className="text-[10px] text-outline">6%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-on-surface font-semibold w-6">3 ★</span>
                  <div className="w-24 sm:w-32 h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: "2%" }} />
                  </div>
                  <span className="text-[10px] text-outline">2%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des Avis Clients */}
          <div className="space-y-5 divide-y divide-outline-variant/60">
            {reviews.map((rev) => (
              <article key={rev.id} className="pt-5 first:pt-0 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      {rev.author.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-primary">{rev.author}</span>
                        {rev.verifiedPurchase && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              check
                            </span>
                            Achat Vérifié RDC
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-outline">{rev.city}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <div className="flex items-center text-amber-500">
                      {[...Array(rev.rating)].map((_, i) => (
                        <span
                          key={i}
                          className="material-symbols-outlined text-sm"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                    <span className="text-[11px] text-outline">{rev.date}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-on-surface leading-relaxed pl-12">
                  {rev.comment}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ================= SECTION 4 : PRODUITS SIMILAIRES & ACCESSOIRES COMPATIBLES ================= */}
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-secondary font-bold">
                {t("home.products_tag")}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-display">
                {t("product_detail.similar_products")}
              </h2>
            </div>
            <Link
              href="/categories/electronique"
              className="text-xs sm:text-sm font-semibold text-secondary hover:underline flex items-center gap-1"
            >
              <span>{t("product_detail.view_all_category")}</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </Link>
          </div>

          {/* Grille 3 colonnes réutilisant ProductCard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarProducts.map((simProd) => (
              <ProductCard
                key={simProd.id}
                product={simProd}
                onAddToCart={(p) => {
                  addGlobalToCart(p, 1);
                  setToastMessage(`"${p.title}" a été ajouté à votre panier`);
                  setTimeout(() => setToastMessage(null), 3000);
                }}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
