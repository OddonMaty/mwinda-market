"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PriceTag } from "./PriceTag";
import { Badge } from "./Badge";
import { useCart } from "@/context/CartContext";
import { getShopIdByName, getShopById } from "@/data/shops";
import { getCountryByCode } from "@/lib/activeCountries";

export interface Product {
  id: string;
  title: string;
  shopName: string;
  shopCity?: string;
  shopCountryCode?: string;
  shopVerified?: boolean;
  image: string;
  usdPrice: number;
  originalUsdPrice?: number;
  rating: number;
  reviewCount: number;
  badges?: {
    discount?: string;
    logistics?: "express" | "interprovincial" | "essential" | "top-sale" | "origin-rdc";
    logisticsText?: string;
  };
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  className?: string;
  layout?: "grid" | "list";
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  className = "",
  layout = "grid",
}) => {
  const { addToCart } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    onAddToCart?.(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const shopId = getShopIdByName(product.shopName);
  const shopObj = getShopById(shopId);
  const countryCode = product.shopCountryCode || shopObj?.countryCode || "CD";
  const flag = getCountryByCode(countryCode)?.flag || "🇨🇩";
  const isVerified = product.shopVerified ?? shopObj?.verified ?? false;
  const city = product.shopCity || shopObj?.city;

  // Pastille de réduction : utiliser le badge fourni ou calculer si originalUsdPrice existe
  const discountText =
    product.badges?.discount ||
    (product.originalUsdPrice && product.originalUsdPrice > product.usdPrice
      ? `-${Math.round(((product.originalUsdPrice - product.usdPrice) / product.originalUsdPrice) * 100)}%`
      : undefined);

  return (
    <div
      className={`bg-white rounded-lg border border-[#E2E8F0] overflow-hidden hover:shadow-md transition-shadow group ${
        layout === "list" ? "flex flex-col sm:flex-row items-stretch" : "flex flex-col"
      } ${className}`}
    >
      {/* ─── Image carrée ──────────────────────────────────────────────── */}
      <div
        className={`relative bg-slate-50 overflow-hidden ${
          layout === "list" ? "aspect-square w-full sm:w-44 sm:h-44 shrink-0" : "aspect-square"
        }`}
      >
        <Link href={`/produits/${product.id}`} className="block w-full h-full relative">
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Badges (maximum 2 en haut à gauche) */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none max-w-[80%]">
          {discountText && (
            <Badge variant="discount" text={discountText} />
          )}
          {product.badges?.logistics && (
            <Badge
              variant={product.badges.logistics}
              text={product.badges.logisticsText}
            />
          )}
        </div>

        {/* Bouton favori (visible au survol sur desktop, accessible sur mobile) */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label="Ajouter aux favoris"
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur text-slate-400 hover:text-rose-500 transition-all z-10 shadow-sm opacity-90 lg:opacity-0 lg:group-hover:opacity-100"
        >
          <span
            className={`material-symbols-outlined text-lg leading-none transition-colors ${
              isWishlisted ? "text-rose-500" : ""
            }`}
            style={isWishlisted ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            favorite
          </span>
        </button>
      </div>

      {/* ─── Détails Produit ───────────────────────────────────────────── */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        <div className="space-y-1.5">
          {/* Ligne vendeur discrète avec coche vérifié et ville/drapeau */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0">
            <span className="select-none shrink-0" title={`Pays : ${countryCode}`}>{flag}</span>
            <Link
              href={`/boutiques/${shopId}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline font-medium text-slate-600 truncate flex items-center gap-1 max-w-[140px]"
            >
              <span className="truncate">{product.shopName}</span>
              {isVerified && (
                <span
                  className="material-symbols-outlined text-[13px] text-[#0284C7] shrink-0"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  title="Boutique vérifiée"
                >
                  verified
                </span>
              )}
            </Link>
            {city && (
              <span className="text-slate-400 truncate shrink-0">• {city}</span>
            )}
          </div>

          {/* Titre sur 2 lignes */}
          <Link href={`/produits/${product.id}`} className="block">
            <h3 className="text-xs sm:text-sm font-semibold text-[#0B1B3D] group-hover:text-[#0284C7] transition-colors line-clamp-2 leading-snug min-h-[2.5rem]">
              {product.title}
            </h3>
          </Link>

          {/* Note avec nombre d'avis */}
          <div className="flex items-center gap-1 text-[11px] text-slate-600">
            <span
              className="material-symbols-outlined text-sm text-amber-500 shrink-0"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            <span className="font-bold text-slate-800">{product.rating.toFixed(1)}</span>
            <span className="text-slate-400">({product.reviewCount} avis)</span>
          </div>
        </div>

        {/* ─── Prix et Bouton d'ajout au panier ─────────────────────────── */}
        <div className="pt-2 border-t border-[#E2E8F0] flex items-end justify-between gap-2">
          <div className="flex-1 min-w-0">
            <PriceTag
              usdPrice={product.usdPrice}
              originalUsdPrice={product.originalUsdPrice}
              size="md"
            />
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            aria-label="Ajouter au panier"
            className={`p-2.5 rounded-lg transition-all shadow-sm flex items-center justify-center shrink-0 ${
              added
                ? "bg-emerald-600 text-white"
                : "bg-[#EA580C] hover:bg-[#c2410c] text-white active:scale-95"
            }`}
            title="Ajouter au panier"
          >
            <span className="material-symbols-outlined text-lg leading-none">
              {added ? "check" : "add_shopping_cart"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
