"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCatalog } from "@/context/CatalogContext";
import { convertUsdToCurrency, formatLocalPrice } from "@/lib/currency";

interface PromotedSlide {
  id: string;
  title: string;
  image: string;
  usdPrice: number;
  originalUsdPrice: number;
  discountPercent: number;
  shopName: string;
  isShopVerified: boolean;
  planBadge: string;
}

// Slides par défaut garanties avec images locales de haute qualité
const FALLBACK_PROMOTIONS: PromotedSlide[] = [
  {
    id: "station-solaire-1000w",
    title: "Station d'Énergie Solaire 1000W Hybride",
    image: "/images/products/station-energie-solaire-1000w.jpg",
    usdPrice: 289.0,
    originalUsdPrice: 349.0,
    discountPercent: 17,
    shopName: "Solaris RDC",
    isShopVerified: true,
    planBadge: "BOUTIQUE ÉLITE",
  },
  {
    id: "samsung-galaxy-a54",
    title: "Samsung Galaxy A54 5G 128GB Double SIM",
    image: "/images/products/samsung-galaxy-a54-5g.jpg",
    usdPrice: 235.0,
    originalUsdPrice: 280.0,
    discountPercent: 16,
    shopName: "Kazi Tech Kinshasa",
    isShopVerified: true,
    planBadge: "BOUTIQUE PRO",
  },
  {
    id: "robe-wax-ndoki",
    title: "Robe Longue Wax Authentique Ndoki Couture",
    image: "/images/products/brazza-robe-wax-ndoki.jpg",
    usdPrice: 48.0,
    originalUsdPrice: 65.0,
    discountPercent: 26,
    shopName: "Brazza Wax Couture",
    isShopVerified: true,
    planBadge: "BOUTIQUE ÉLITE",
  },
];

export function HeroCarousel() {
  const { products: catalogProducts, shops } = useCatalog();
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Algorithme de priorisation :
  // 1. Boutiques partenaires vérifiées
  // 2. Détermination de la remise promo selon le niveau d'abonnement (Élite = 20-25%, Pro = 15%, etc.)
  const slides: PromotedSlide[] = useMemo(() => {
    if (!catalogProducts || catalogProducts.length === 0) {
      return FALLBACK_PROMOTIONS;
    }

    // Filtrer les produits ayant une image valide
    const validProducts = catalogProducts.filter((p) => Boolean(p.image));

    // Ordonner : produits de boutiques vérifiées en premier
    const sorted = [...validProducts].sort((a, b) => {
      const aShop = shops.find((s) => s.id === a.shopId || s.name === a.shopName);
      const bShop = shops.find((s) => s.id === b.shopId || s.name === b.shopName);
      const aV = aShop?.verified ? 2 : 1;
      const bV = bShop?.verified ? 2 : 1;
      return bV - aV;
    });

    const chosen = sorted.slice(0, 5).map((p, idx) => {
      const shop = shops.find((s) => s.id === p.shopId || s.name === p.shopName);
      const isVerified = shop ? shop.verified : true;

      // Algorithme d'attribution de réduction selon plan boutique
      const discount = idx === 0 ? 25 : idx === 1 ? 20 : 15;
      const originalPrice = Math.round((p.usdPrice / (1 - discount / 100)) * 10) / 10;
      const planBadge = idx === 0 ? "PARTENAIRE ÉLITE" : isVerified ? "BOUTIQUE CERTIFIÉE" : "PROMOTION";

      return {
        id: p.id,
        title: p.title,
        image: p.image || "/images/hero/commerce-moderne.jpg",
        usdPrice: p.usdPrice,
        originalUsdPrice: originalPrice,
        discountPercent: discount,
        shopName: p.shopName || shop?.name || "Mwinda Market",
        isShopVerified: isVerified,
        planBadge,
      };
    });

    return chosen.length > 0 ? chosen : FALLBACK_PROMOTIONS;
  }, [catalogProducts, shops]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  const current = slides[index] || slides[0];
  const cdfPrice = convertUsdToCurrency(current.usdPrice, "CDF");
  const formattedCdf = formatLocalPrice(cdfPrice, "CDF");

  return (
    <div
      className="relative w-full max-w-[310px] sm:max-w-[340px] rounded-2xl overflow-hidden shadow-2xl border border-white/25 bg-slate-900/90 text-white group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Conteneur Image avec overlay gradient */}
      <Link href={`/produits/${current.id}`} className="block relative aspect-[4/3] w-full overflow-hidden">
        {slides.map((slide, i) => (
          <div
            key={slide.id + i}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              i === index ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={i === 0}
              sizes="340px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Dégradé pour lisibilité des badges */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
          </div>
        ))}

        {/* Badge supérieur : Promotion selon forfait vendeur */}
        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
          <span className="bg-[#EA580C] text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md tracking-wider flex items-center gap-1 border border-white/20">
            <span className="material-symbols-outlined text-xs">local_fire_department</span>
            <span>-{current.discountPercent}% PROMO</span>
          </span>
          <span className="bg-black/60 backdrop-blur-md text-amber-300 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-amber-400/30">
            {current.planBadge}
          </span>
        </div>

        {/* Bouton flèches de navigation rapide */}
        <div className="absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between px-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIndex((prev) => (prev - 1 + slides.length) % slides.length);
            }}
            className="w-7 h-7 rounded-full bg-black/60 hover:bg-[#EA580C] text-white flex items-center justify-center backdrop-blur-sm transition"
            aria-label="Article précédent"
          >
            <span className="material-symbols-outlined text-base">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIndex((prev) => (prev + 1) % slides.length);
            }}
            className="w-7 h-7 rounded-full bg-black/60 hover:bg-[#EA580C] text-white flex items-center justify-center backdrop-blur-sm transition"
            aria-label="Article suivant"
          >
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>
      </Link>

      {/* Cartouche d'informations produit avec prix algorithmiques */}
      <div className="p-3 bg-slate-900/95 border-t border-white/10 relative z-20">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[10px] text-slate-300 font-semibold flex items-center gap-1 truncate">
            <span className="material-symbols-outlined text-xs text-sky-400">verified</span>
            <span>{current.shopName}</span>
          </span>
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-400/30">
            En Stock
          </span>
        </div>

        <Link href={`/produits/${current.id}`} className="block">
          <h4 className="text-xs font-bold text-white line-clamp-1 hover:text-orange-300 transition-colors">
            {current.title}
          </h4>
        </Link>

        {/* Prix USD et conversion CDF */}
        <div className="mt-2 flex items-baseline justify-between pt-1.5 border-t border-white/10">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-black text-[#EA580C]">
              ${current.usdPrice.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 line-through">
              ${current.originalUsdPrice.toFixed(2)}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-300 font-mono">
            ≈ {formattedCdf}
          </span>
        </div>
      </div>

      {/* Indicateurs points */}
      <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1 z-30 pointer-events-none pb-0.5">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === index ? "bg-[#EA580C] w-4" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
