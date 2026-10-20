"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Shop } from "@/data/shops";
import { getCountryByCode } from "@/lib/activeCountries";
import { getShopCountryCode } from "@/lib/marketData";
import { useT } from "@/i18n";

interface ShopCardProps {
  shop: Shop;
  className?: string;
}

export const ShopCard: React.FC<ShopCardProps> = ({ shop, className = "" }) => {
  const { t } = useT();
  const countryCode = getShopCountryCode(shop);
  const flag = getCountryByCode(countryCode)?.flag || "🇨🇩";

  return (
    <article
      className={`bg-white rounded-lg border border-[#E2E8F0] overflow-hidden hover:shadow-md hover:border-[#0284C7] transition-all flex flex-col group ${className}`}
    >
      {/* ─── Bannière de couverture courte (~96px = h-24) ──────────────────── */}
      <div className="relative h-24 w-full bg-slate-100 overflow-hidden">
        <Image
          src={shop.bannerImage}
          alt={shop.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />

        {/* Badges sur la bannière */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
          {shop.verified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0284C7] text-white text-[10px] font-bold shadow-xs">
              <span
                className="material-symbols-outlined text-[12px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
              <span>{t("shops.certified_seller")}</span>
            </span>
          )}
        </div>

        {shop.topSeller && (
          <span className="absolute top-2 right-2 inline-flex items-center px-2 py-0.5 rounded bg-white/95 text-[#0B1B3D] text-[10px] font-bold shadow-xs z-10">
            {t("shops.top_seller")}
          </span>
        )}
      </div>

      {/* ─── Bloc Identité (fond blanc, nom et ville jamais masqués) ───────── */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
        <div>
          {/* Avatar débordant sur la bannière + Nom & Ville */}
          <div className="flex items-start gap-3 -mt-8 mb-2">
            <Link
              href={`/boutiques/${shop.id}`}
              className="w-12 h-12 rounded-lg border-2 border-white bg-white shadow-sm overflow-hidden shrink-0 flex items-center justify-center relative z-10 group-hover:scale-105 transition-transform"
            >
              <Image
                src={shop.logoImage}
                alt={shop.name}
                width={48}
                height={48}
                className="w-full h-full object-cover rounded-md"
              />
            </Link>

            <div className="min-w-0 flex-1 pt-6">
              <Link href={`/boutiques/${shop.id}`} className="block">
                <h3 className="text-sm font-bold text-[#0B1B3D] font-display truncate hover:text-[#0284C7] transition-colors leading-tight">
                  {shop.name}
                </h3>
              </Link>
              <p className="flex items-center gap-1 text-slate-500 text-xs truncate mt-0.5">
                <span className="select-none text-xs" title={`Pays: ${countryCode}`}>
                  {flag}
                </span>
                <span className="truncate">
                  {shop.city}, {shop.province}
                </span>
              </p>
            </div>
          </div>

          {/* Catégorie et Note */}
          <div className="flex items-center justify-between text-xs py-1 border-t border-[#E2E8F0]/60">
            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px] truncate max-w-[160px]">
              {shop.category}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <span
                className="material-symbols-outlined text-sm text-amber-500"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              <span className="font-bold text-[#0B1B3D]">{shop.rating.toFixed(1)}</span>
              <span className="text-[11px] text-slate-400">({shop.reviewCount})</span>
            </div>
          </div>

          {/* Nombre réel de produits */}
          <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-1.5">
            <span className="material-symbols-outlined text-[15px] text-slate-400">
              inventory_2
            </span>
            <span>
              <strong className="font-bold text-[#0B1B3D]">{shop.productCount}</strong>{" "}
              {shop.productCount > 1
                ? t("shops.articles_count")
                : t("shops.article_count_singular")}
            </span>
          </div>

          {/* Miniatures des produits phares */}
          {shop.productPreviews && shop.productPreviews.length > 0 && (
            <div className="pt-2.5 mt-2 border-t border-[#E2E8F0]">
              <span className="text-[10px] text-slate-400 block mb-1.5 font-bold uppercase tracking-wider">
                {t("shops.featured_products")}
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {shop.productPreviews.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded border border-[#E2E8F0] overflow-hidden bg-slate-50 relative group/item"
                  >
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="80px"
                      className="w-full h-full object-cover group-hover/item:scale-105 transition-transform"
                      title={item.title}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bouton Voir la boutique (orange action) */}
        <div className="pt-2">
          <Link
            href={`/boutiques/${shop.id}`}
            className="w-full py-2.5 px-3 rounded-lg bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95"
          >
            <span>{t("shops.visit_shop")}</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>
    </article>
  );
};
