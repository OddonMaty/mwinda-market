"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PriceTag } from "./PriceTag";
import { Badge } from "./Badge";
import { useCart } from "@/context/CartContext";
import { getShopIdByName } from "@/data/shops";

export interface Product {
  id: string;
  title: string;
  shopName: string;
  shopCity?: string;
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
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  className = "",
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

  return (
    <div
      className={`bg-surface-container-lowest rounded-lg border border-outline-variant overflow-hidden custom-shadow hover:custom-shadow-hover transition-all flex flex-col group ${className}`}
    >
      {/* Product Image Area */}
      <div className="relative aspect-square bg-surface-container-low overflow-hidden">
        <Link href={`/produits/${product.id}`} className="block w-full h-full relative">
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Badges Stack (Upper Left) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
          {product.badges?.discount && (
            <Badge variant="discount" text={product.badges.discount} />
          )}
          {product.badges?.logistics && (
            <Badge
              variant={product.badges.logistics}
              text={product.badges.logisticsText}
            />
          )}
        </div>

        {/* Wishlist Trigger (Upper Right) */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label="Ajouter aux favoris"
          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/80 backdrop-blur text-outline hover:text-error transition z-10 shadow-sm"
        >
          <span
            className={`material-symbols-outlined text-lg transition-colors ${
              isWishlisted ? "text-error" : ""
            }`}
            style={isWishlisted ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            favorite
          </span>
        </button>
      </div>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <p className="text-xs text-secondary font-medium truncate">
            <span>Boutique : </span>
            <Link
              href={`/boutiques/${getShopIdByName(product.shopName)}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline font-semibold"
            >
              {product.shopName}
            </Link>
          </p>
          <Link href={`/produits/${product.id}`} className="block">
            <h3 className="text-sm sm:text-base font-semibold text-primary mt-1 group-hover:text-secondary transition-colors line-clamp-2 leading-snug">
              {product.title}
            </h3>
          </Link>
          <div className="flex items-center gap-1 text-on-tertiary-container text-xs mt-1">
            <span
              className="material-symbols-outlined text-sm text-on-tertiary-container"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            <span className="font-bold">{product.rating.toFixed(1)}</span>
            <span className="text-outline">({product.reviewCount} avis)</span>
          </div>
        </div>

        {/* Pricing and CTA */}
        <div className="pt-2 border-t border-outline-variant flex items-center justify-between">
          <PriceTag
            usdPrice={product.usdPrice}
            originalUsdPrice={product.originalUsdPrice}
            size="md"
          />

          <button
            type="button"
            onClick={handleAddToCart}
            aria-label="Ajouter au panier"
            className={`p-2.5 rounded-lg transition shadow flex items-center justify-center ${
              added
                ? "bg-emerald-600 text-white"
                : "bg-tertiary hover:bg-tertiary-hover text-white active:scale-95"
            }`}
            title="Ajouter au panier"
          >
            <span className="material-symbols-outlined text-xl">
              {added ? "check" : "add_shopping_cart"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
