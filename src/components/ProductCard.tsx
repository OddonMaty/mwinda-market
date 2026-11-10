"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PriceTag } from "./PriceTag";
import { Badge } from "./Badge";
import { useCart } from "@/context/CartContext";
import { getShopIdByName, getShopById } from "@/data/shops";
import { getCountryByCode } from "@/lib/activeCountries";
import { getDiscountBadgeText } from "@/lib/discounts";
import { Heart, Star, ShoppingBag, Check, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Product {
  id: string;
  title: string;
  shopId?: string;
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
    setTimeout(() => setAdded(false), 1600);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const shopId = product.shopId || getShopIdByName(product.shopName);
  const shopObj = getShopById(shopId);
  const countryCode = product.shopCountryCode || shopObj?.countryCode || "CD";
  const flag = getCountryByCode(countryCode)?.flag || "🇨🇩";
  const isVerified = product.shopVerified ?? shopObj?.verified ?? false;
  const city = product.shopCity || shopObj?.city;

  // Pastille de réduction : calculée dynamiquement à partir des prix réels
  const computedDiscount = getDiscountBadgeText(product.usdPrice, product.originalUsdPrice);
  const discountText =
    computedDiscount ||
    (product.badges?.discount?.includes("%") ? undefined : product.badges?.discount);

  return (
    <div
      className={cn(
        "group relative bg-card rounded-xl border border-border/70 overflow-hidden transition-all duration-200 hover:shadow-card-hover hover:border-slate-300",
        layout === "list" ? "flex flex-col sm:flex-row items-stretch" : "flex flex-col",
        className
      )}
    >
      {/* ─── Image carrée avec ratio 1:1 ─────────────────────────────── */}
      <div
        className={cn(
          "relative bg-slate-50 overflow-hidden",
          layout === "list" ? "aspect-square w-full sm:w-44 sm:h-44 shrink-0" : "aspect-square w-full"
        )}
      >
        <Link href={`/produits/${product.id}`} className="block w-full h-full relative">
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes={
              layout === "list"
                ? "(max-width: 640px) 100vw, 176px"
                : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px"
            }
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        </Link>

        {/* Badges discrets (haut-gauche) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none max-w-[80%]">
          {discountText && <Badge variant="discount" text={discountText} />}
          {product.badges?.logistics && (
            <Badge
              variant={product.badges.logistics}
              text={product.badges.logisticsText}
            />
          )}
        </div>

        {/* Bouton favori épuré */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label="Ajouter aux favoris"
          className={cn(
            "absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center transition-all z-10 shadow-xs",
            "opacity-90 lg:opacity-0 lg:group-hover:opacity-100",
            isWishlisted ? "text-rose-500 bg-white" : "text-slate-400 hover:text-rose-500 hover:bg-white"
          )}
        >
          <Heart
            className={cn(
              "w-4 h-4 transition-transform active:scale-125",
              isWishlisted && "fill-rose-500 text-rose-500"
            )}
          />
        </button>
      </div>

      {/* ─── Détails Produit ─────────────────────────────────────────── */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        <div className="space-y-1.5">
          {/* Ligne vendeur épurée avec coche vérifié et ville/drapeau */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
            <span className="select-none shrink-0" title={`Pays : ${countryCode}`}>{flag}</span>
            <Link
              href={`/boutiques/${shopId}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:text-foreground font-medium text-slate-600 truncate flex items-center gap-1 max-w-[140px] transition-colors"
            >
              <span className="truncate">{product.shopName}</span>
              {isVerified && (
                <span title="Boutique vérifiée" className="inline-flex items-center">
                  <CheckCircle2
                    className="w-3 h-3 text-brand-blue shrink-0 fill-brand-blue/15"
                  />
                </span>
              )}
            </Link>
            {city && (
              <span className="text-slate-400 truncate shrink-0">• {city}</span>
            )}
          </div>

          {/* Titre sur 2 lignes */}
          <Link href={`/produits/${product.id}`} className="block">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-brand-blue transition-colors line-clamp-2 leading-snug min-h-[2.4rem]">
              {product.title}
            </h3>
          </Link>

          {/* Note avec nombre d'avis */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-0.5 text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
              <span className="font-semibold text-slate-800 ml-0.5">{product.rating.toFixed(1)}</span>
            </div>
            <span className="text-slate-400">({product.reviewCount} avis)</span>
          </div>
        </div>

        {/* ─── Prix et Bouton d'ajout au panier ───────────────────────── */}
        <div className="pt-2.5 border-t border-border/70 flex items-center justify-between gap-2">
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
            className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 shadow-xs",
              added
                ? "bg-emerald-600 text-white scale-105"
                : "bg-brand-orange hover:bg-orange-600 text-white active:scale-95 hover:shadow-sm"
            )}
            title="Ajouter au panier"
          >
            {added ? (
              <Check className="w-4 h-4 animate-in zoom-in-75 duration-200" />
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
