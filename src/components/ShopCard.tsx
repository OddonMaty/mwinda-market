"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Shop } from "@/data/shops";

interface ShopCardProps {
  shop: Shop;
  className?: string;
}

export const ShopCard: React.FC<ShopCardProps> = ({ shop, className = "" }) => {
  return (
    <article
      className={`bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden hover:border-secondary hover:shadow-card-hover transition-all flex flex-col group ${className}`}
    >
      {/* Banner Container with Badges */}
      <div className="relative h-28 sm:h-32 w-full bg-primary-container overflow-hidden">
        <div
          className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
          style={{ backgroundImage: `url('${shop.bannerImage}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          {shop.verified && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
              <span>Certifié Mwinda</span>
            </span>
          )}
        </div>

        {shop.topSeller && (
          <span className="absolute top-2.5 right-2.5 inline-flex items-center px-2 py-0.5 rounded-md bg-white/95 text-primary text-[10px] font-bold shadow-sm z-10">
            Top Vendeur
          </span>
        )}
      </div>

      {/* Vendor Identity Block */}
      <div className="px-4 sm:px-5 pt-0 pb-4 sm:pb-5 flex-1 flex flex-col">
        {/* Avatar + Title Header */}
        <div className="flex items-start sm:items-end -mt-6 sm:-mt-7 mb-3 gap-2.5 sm:gap-3">
          <Link
            href={`/boutiques/${shop.id}`}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-white bg-white shadow-md overflow-hidden shrink-0 flex items-center justify-center p-0.5 sm:p-1 group-hover:scale-105 transition-transform relative z-10"
          >
            <Image
              src={shop.logoImage}
              alt={shop.name}
              width={56}
              height={56}
              className="w-full h-full object-cover rounded-xl"
            />
          </Link>
          <div className="min-w-0 flex-1 pt-0.5 sm:pt-0">
            <Link href={`/boutiques/${shop.id}`} className="block">
              <h3 className="text-sm sm:text-base font-bold text-primary font-display truncate hover:text-secondary transition-colors leading-snug">
                {shop.name}
              </h3>
            </Link>
            <p className="flex items-center gap-1 text-outline text-xs truncate mt-0.5">
              <span className="material-symbols-outlined text-[14px] text-secondary shrink-0">location_on</span>
              <span className="truncate">
                {shop.city}, {shop.province}
              </span>
            </p>
          </div>
        </div>

        {/* Category & Rating */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-surface-container-low text-secondary font-semibold text-[11px] truncate max-w-[170px]">
            {shop.category}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <span
              className="material-symbols-outlined text-[16px] text-amber-500"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            <span className="font-bold text-primary">{shop.rating.toFixed(1)}</span>
            <span className="text-[11px] text-outline">({shop.reviewCount})</span>
          </div>
        </div>

        {/* Catalog summary */}
        <div className="text-xs text-on-surface-variant flex items-center gap-1.5 mb-3">
          <span className="material-symbols-outlined text-[16px] text-outline">inventory_2</span>
          <span>
            <strong className="font-semibold text-primary">{shop.productCount}+ créations</strong> en catalogue direct
          </span>
        </div>

        {/* 3 Miniature Featured Products (if available) */}
        {shop.productPreviews && shop.productPreviews.length > 0 && (
          <div className="border-t border-outline-variant/60 pt-2.5 mb-4">
            <span className="text-[10px] text-outline block mb-1.5 font-bold uppercase tracking-wider">
              Produits phares de la boutique :
            </span>
            <div className="grid grid-cols-3 gap-2">
              {shop.productPreviews.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-lg border border-outline-variant/60 overflow-hidden bg-surface-container-low group/item relative"
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 33vw, 100px"
                    className="w-full h-full object-cover group-hover/item:scale-105 transition-transform"
                    title={item.title}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-auto pt-2">
          <Link
            href={`/boutiques/${shop.id}`}
            className="w-full h-10 rounded-xl bg-tertiary hover:bg-tertiary-hover text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow group-hover:shadow-md active:scale-95"
          >
            <span>Voir la boutique</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>
      </div>
    </article>
  );
};
