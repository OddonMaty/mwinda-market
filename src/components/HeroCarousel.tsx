"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCatalog } from "@/context/CatalogContext";
import { convertUsdToCurrency, formatLocalPrice } from "@/lib/currency";
import {
  Flame,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Truck,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export function HeroCarousel() {
  const { products: catalogProducts, shops, isLoading } = useCatalog();
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Produits réels issus de la base de données
  const slides: PromotedSlide[] = useMemo(() => {
    if (!catalogProducts || catalogProducts.length === 0) {
      return [];
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

    return sorted.slice(0, 5).map((p, idx) => {
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
  }, [catalogProducts, shops]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  // Si le catalogue charge ou est vide
  if (slides.length === 0) {
    return (
      <div className="relative w-full max-w-[310px] sm:max-w-[340px] rounded-2xl overflow-hidden shadow-card-hover border border-border/80 bg-gradient-to-br from-brand-navy via-slate-900 to-brand-blue text-white p-6 flex flex-col justify-between min-h-[300px]">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-200">
              {isLoading ? "Chargement des offres..." : "Marketplace Panafricaine"}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2 leading-tight">
            Mwinda Market
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Connectez-vous directement aux meilleurs vendeurs vérifiés de toute l'Afrique. Paiements mobiles sécurisés et expéditions rapides.
          </p>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Comptes vendeurs certifiés</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Mobile Money (Airtel, Orange, M-Pesa)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <Truck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Livraison suivie sans frais cachés</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2 mt-4">
          <Link
            href="/produits"
            className="flex-1 text-center py-2 px-3 bg-brand-orange hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            Voir le catalogue
          </Link>
          <Link
            href="/devenir-vendeur"
            className="flex-1 text-center py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors border border-white/20"
          >
            Vendre ici
          </Link>
        </div>
      </div>
    );
  }

  const current = slides[index] || slides[0];
  const cdfPrice = convertUsdToCurrency(current.usdPrice, "CDF");
  const formattedCdf = formatLocalPrice(cdfPrice, "CDF");

  return (
    <div
      className="relative w-full max-w-[310px] sm:max-w-[340px] rounded-2xl overflow-hidden shadow-card-hover border border-border/60 bg-slate-900 text-white group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Conteneur Image avec overlay épuré */}
      <Link href={`/produits/${current.id}`} className="block relative aspect-[4/3] w-full overflow-hidden">
        {slides.map((slide, i) => (
          <div
            key={slide.id + i}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-in-out",
              i === index ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            )}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={i === 0}
              sizes="340px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-black/30" />
          </div>
        ))}

        {/* Badges supérieurs épurés */}
        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
          <span className="bg-brand-orange text-white text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full shadow-xs tracking-wider flex items-center gap-1">
            <Flame className="w-3 h-3 shrink-0" />
            <span>-{current.discountPercent}% PROMO</span>
          </span>
          <span className="bg-black/60 backdrop-blur-xs text-amber-300 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border border-amber-400/30">
            {current.planBadge}
          </span>
        </div>

        {/* Flèches de navigation rapide */}
        <div className="absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIndex((prev) => (prev - 1 + slides.length) % slides.length);
            }}
            className="w-7 h-7 rounded-full bg-black/60 hover:bg-brand-orange text-white flex items-center justify-center backdrop-blur-xs transition-colors"
            aria-label="Article précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIndex((prev) => (prev + 1) % slides.length);
            }}
            className="w-7 h-7 rounded-full bg-black/60 hover:bg-brand-orange text-white flex items-center justify-center backdrop-blur-xs transition-colors"
            aria-label="Article suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </Link>

      {/* Cartouche d'informations produit */}
      <div className="p-3.5 bg-slate-900 border-t border-white/10 relative z-20">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1 truncate">
            <CheckCircle2 className="w-3 h-3 text-brand-blue shrink-0" />
            <span className="truncate">{current.shopName}</span>
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-400/30">
            En Stock
          </span>
        </div>

        <Link href={`/produits/${current.id}`} className="block">
          <h4 className="text-xs font-semibold text-white line-clamp-1 hover:text-amber-300 transition-colors">
            {current.title}
          </h4>
        </Link>

        {/* Prix USD et conversion CDF */}
        <div className="mt-2.5 flex items-baseline justify-between pt-2 border-t border-white/10">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-brand-orange">
              ${current.usdPrice.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 line-through">
              ${current.originalUsdPrice.toFixed(2)}
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-300 font-mono">
            ≈ {formattedCdf}
          </span>
        </div>
      </div>

      {/* Indicateurs points */}
      <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1 z-30 pointer-events-none pb-0.5">
        {slides.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              i === index ? "bg-brand-orange w-4" : "bg-white/40 w-1.5"
            )}
          />
        ))}
      </div>
    </div>
  );
}
