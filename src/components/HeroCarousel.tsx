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
  ArrowRight,
  ShoppingBag,
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

    const validProducts = catalogProducts.filter((p) => Boolean(p.image));

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

      const discount = idx === 0 ? 30 : idx === 1 ? 25 : idx === 2 ? 20 : 15;
      const originalPrice = Math.round((p.usdPrice / (1 - discount / 100)) * 10) / 10;
      const planBadge = idx === 0 ? "VENTE VEDETTE" : isVerified ? "BOUTIQUE CERTIFIÉE" : "SÉLECTION DU JOUR";

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
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  // Fallback si chargement ou aucun produit
  if (slides.length === 0) {
    return (
      <div className="relative w-full h-[360px] sm:h-[400px] lg:h-[420px] rounded-2xl overflow-hidden shadow-card border border-border/60 bg-brand-navy text-white flex items-center p-6 sm:p-10">
        <div className="max-w-xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20">
            <span className="w-2 h-2 rounded-full bg-brand-orange animate-ping" />
            <span className="text-[10px] font-bold tracking-wide uppercase text-orange-200">
              {isLoading ? "Chargement des offres..." : "Plateforme Panafricaine"}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Des milliers d'articles vérifiés à prix direct producteur
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
            Achetez directement auprès de vendeurs certifiés avec paiements protégés en séquestre (Mobile Money) et livraison suivie.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <Link
              href="/produits"
              className="px-5 py-2.5 bg-brand-orange text-white font-semibold text-xs rounded-lg shadow-sm hover:bg-orange-600 transition-colors flex items-center gap-2"
            >
              <span>Découvrir le catalogue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const current = slides[index] || slides[0];
  const cdfPrice = convertUsdToCurrency(current.usdPrice, "CDF");
  const formattedCdf = formatLocalPrice(cdfPrice, "CDF");

  return (
    <div
      className="relative w-full h-[360px] sm:h-[400px] lg:h-[420px] rounded-2xl overflow-hidden shadow-card border border-border/70 group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ─── IMAGES DES ARTICLES EN PLEIN ÉCRAN (Background total du Hero) ── */}
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
            sizes="(max-width: 1024px) 100vw, 850px"
            className="object-cover object-center w-full h-full transform scale-100 group-hover:scale-[1.02] transition-transform duration-700"
          />
          {/* Overlay dégradé cinématographique pour garantir une lisibilité absolue */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-slate-950/30 md:bg-gradient-to-r md:from-slate-950/95 md:via-slate-950/70 md:to-transparent" />
        </div>
      ))}

      {/* ─── CONTENU D'IMPACT SUR LE HERO ─────────────────────────────────── */}
      <div className="relative z-20 h-full flex flex-col justify-between p-6 sm:p-8 lg:p-10 max-w-xl text-white">
        {/* Badges en haut */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-brand-orange text-white text-[11px] font-bold uppercase px-3 py-1 rounded-full shadow-sm tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-white animate-pulse" />
            <span>-{current.discountPercent}% RÉDUCTION</span>
          </span>
          <span className="bg-black/60 backdrop-blur-xs text-amber-300 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border border-amber-400/30">
            {current.planBadge}
          </span>
        </div>

        {/* Titre, Vendeur & Prix au centre / bas */}
        <div className="space-y-3.5 my-auto">
          {/* Vendeur certifié */}
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="truncate">{current.shopName}</span>
            <span className="text-white/40">•</span>
            <span className="text-emerald-400 font-semibold bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-400/30 text-[10px]">
              En stock vérifié
            </span>
          </div>

          {/* Titre du produit en vedette */}
          <Link href={`/produits/${current.id}`} className="block group/title">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight line-clamp-2 group-hover/title:text-orange-200 transition-colors">
              {current.title}
            </h1>
          </Link>

          {/* Tarification en vedette (USD + CDF) */}
          <div className="flex items-baseline gap-3 pt-1">
            <span className="text-3xl sm:text-4xl font-black text-brand-orange tracking-tight">
              ${current.usdPrice.toFixed(2)}
            </span>
            <span className="text-sm sm:text-base text-slate-400 line-through">
              ${current.originalUsdPrice.toFixed(2)}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-300 font-mono bg-white/10 px-2.5 py-1 rounded-md backdrop-blur-xs">
              ≈ {formattedCdf}
            </span>
          </div>
        </div>

        {/* Boutons d'action rapides */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Link
            href={`/produits/${current.id}`}
            className="px-5 py-2.5 bg-brand-orange text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md hover:bg-orange-600 transition-all flex items-center gap-2 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Commander cet article</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
          <Link
            href="/produits"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium text-xs sm:text-sm transition-colors border border-white/20 backdrop-blur-xs"
          >
            Voir tout le catalogue
          </Link>
        </div>
      </div>

      {/* ─── FLÈCHES DE NAVIGATION DISCRÈTES ──────────────────────────────── */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setIndex((prev) => (prev - 1 + slides.length) % slides.length);
        }}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/50 hover:bg-brand-orange text-white flex items-center justify-center backdrop-blur-xs transition-all opacity-80 hover:opacity-100 shadow-md"
        aria-label="Article précédent"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setIndex((prev) => (prev + 1) % slides.length);
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/50 hover:bg-brand-orange text-white flex items-center justify-center backdrop-blur-xs transition-all opacity-80 hover:opacity-100 shadow-md"
        aria-label="Article suivant"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* ─── INDICATEURS DE SLIDES (Pillules modernes) ───────────────────── */}
      <div className="absolute bottom-3.5 right-6 z-30 flex items-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Aller au slide ${i + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === index ? "bg-brand-orange w-7" : "bg-white/40 hover:bg-white/70 w-2"
            )}
          />
        ))}
      </div>
    </div>
  );
}
