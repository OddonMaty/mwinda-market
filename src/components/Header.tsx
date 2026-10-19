"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { CountrySelector } from "./CountrySelector";
import { useCart } from "@/context/CartContext";
import { useMarket, SupportedLanguage, SUPPORTED_LANGUAGES } from "@/context/MarketContext";
import { useT } from "@/i18n";

interface HeaderProps {
  cartCount?: number;
}

const CATEGORIES = [
  { slug: "electronique", labelKey: "cat_electronics" as const, icon: "devices" },
  { slug: "energie-solaire", labelKey: "cat_solar" as const, icon: "solar_power" },
  { slug: "mode", labelKey: "cat_fashion" as const, icon: "checkroom" },
  { slug: "maison", labelKey: "cat_home" as const, icon: "chair" },
  { slug: "beaute", labelKey: "cat_beauty" as const, icon: "spa" },
  { slug: "alimentation", labelKey: "cat_food" as const, icon: "restaurant" },
];

// Fallback labels when keys might not be in i18n yet
const CAT_LABELS_FR: Record<string, string> = {
  cat_electronics: "Électronique",
  cat_solar: "Énergie Solaire",
  cat_fashion: "Mode & Wax",
  cat_home: "Maison & Artisanat",
  cat_beauty: "Beauté & Bien-être",
  cat_food: "Alimentation",
};

export const Header: React.FC<HeaderProps> = ({ cartCount }) => {
  const { totalCount } = useCart();
  const displayCartCount = totalCount !== undefined ? totalCount : (cartCount ?? 0);
  const { country, language, setLanguage, availableLanguages, isRDC } = useMarket();
  const { t } = useT();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [catPanelOpen, setCatPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const catBtnRef = useRef<HTMLButtonElement>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/produits?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const hotline = isRDC ? "+243 81 000 9999" : `${country.phoneCode} 800 000`;

  // Close cat panel on outside click
  useEffect(() => {
    if (!catPanelOpen) return;
    const handler = (e: MouseEvent) => {
      if (catBtnRef.current && !catBtnRef.current.closest("div")?.contains(e.target as Node)) {
        setCatPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [catPanelOpen]);

  return (
    <header className="sticky top-0 z-50 w-full overflow-x-clip">
      {/* ─────────────────────────────────────────────────────────
          LEVEL 1 — Utility bar (desktop only, marine background)
      ───────────────────────────────────────────────────────── */}
      <div className="hidden lg:block w-full bg-primary text-white/90 text-[11px]">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6 flex items-center justify-between h-8 gap-4">
          {/* Left: hotline */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="material-symbols-outlined text-sm text-tertiary">support_agent</span>
            <span className="font-medium">{t("header.utility_hotline_prefix")}</span>
            <a href={`tel:${hotline}`} className="font-bold hover:text-secondary-accent transition">
              {hotline}
            </a>
          </div>
          {/* Right: quick links + selectors */}
          <div className="flex items-center gap-4">
            <Link href="/suivi" className="hover:text-secondary-accent transition whitespace-nowrap">
              {t("header.utility_tracking")}
            </Link>
            <Link href="/devenir-vendeur" className="hover:text-secondary-accent transition whitespace-nowrap">
              {t("header.utility_sell")}
            </Link>
            <div className="w-px h-4 bg-white/20" />
            <CountrySelector variant="header" />
            {/* Language dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1 hover:text-secondary-accent transition"
                title={t("header.select_language")}
              >
                <span>{currentLangObj.flag}</span>
                <span className="font-semibold uppercase">{currentLangObj.code}</span>
                <span className="material-symbols-outlined text-xs">expand_more</span>
              </button>
              {langMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setLangMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-outline-variant rounded-xl shadow-modal z-40 py-1 overflow-hidden">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-outline">
                      {t("header.select_language")}
                    </div>
                    {availableLanguages.map((lCode) => {
                      const lObj = SUPPORTED_LANGUAGES.find((item) => item.code === lCode);
                      if (!lObj) return null;
                      const isCurrent = lObj.code === language;
                      return (
                        <button
                          key={lObj.code}
                          type="button"
                          onClick={() => { setLanguage(lObj.code as SupportedLanguage); setLangMenuOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition ${
                            isCurrent
                              ? "bg-surface-container text-primary font-bold"
                              : "text-on-surface hover:bg-surface-container-low"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{lObj.flag}</span>
                            <span>{lObj.label}</span>
                          </span>
                          {isCurrent && (
                            <span className="material-symbols-outlined text-secondary text-sm">check</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          LEVEL 2 — Main bar (white, logo + search + actions)
      ───────────────────────────────────────────────────────── */}
      <div className="w-full bg-white border-b border-outline-variant shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6 flex items-center gap-3 md:gap-4 h-16 md:h-[72px]">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg lg:hidden hover:bg-surface-container text-on-surface shrink-0"
            aria-label="Menu"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>

          {/* Logo — horizontal officiel (M + Mwinda MARKET) */}
          <Link href="/" className="flex items-center shrink-0 group" aria-label="Mwinda Market — Accueil">
            {/* Mobile: monogramme seul pour économiser l'espace */}
            <Image
              src="/images/logo-mwinda.png"
              alt="Mwinda Market"
              width={40}
              height={40}
              className="sm:hidden w-9 h-9 object-contain"
              priority
            />
            {/* Desktop/tablette: logo horizontal complet */}
            <Image
              src="/images/logo-mwinda-h-light.png"
              alt="Mwinda Market"
              width={200}
              height={56}
              className="hidden sm:block h-10 md:h-11 w-auto object-contain"
              priority
            />
          </Link>


          {/* Search bar — desktop & tablet */}
          <div className="hidden md:flex flex-1 max-w-xl lg:max-w-2xl">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("header.search_placeholder")}
                className="w-full pl-4 pr-[120px] lg:pr-[130px] py-2.5 bg-white border-2 border-tertiary rounded-lg text-sm text-on-surface focus:outline-none focus:border-tertiary transition placeholder:text-outline"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 bottom-0 px-5 bg-tertiary text-white rounded-r-lg text-sm font-bold hover:bg-tertiary-hover transition flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">search</span>
                <span>{t("header.search_btn")}</span>
              </button>
            </form>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 md:gap-2 shrink-0 ml-auto md:ml-0">
            {/* Mobile search toggle */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full transition md:hidden"
              aria-label={t("header.search_btn") || "Recherche"}
            >
              <span className="material-symbols-outlined text-xl">
                {mobileSearchOpen ? "close" : "search"}
              </span>
            </button>

            {/* Favorites — desktop only */}
            <button
              type="button"
              className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full transition hidden lg:flex items-center"
              title={t("header.favorites")}
            >
              <span className="material-symbols-outlined text-[22px]">favorite_border</span>
            </button>

            {/* Notifications — desktop only */}
            <button
              type="button"
              className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full transition relative hidden lg:flex items-center"
              title={t("header.notifications")}
            >
              <span className="material-symbols-outlined text-[22px]">notifications_none</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-tertiary rounded-full ring-2 ring-white" />
            </button>

            {/* Cart — always visible */}
            <Link
              href="/panier"
              className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full transition relative flex items-center"
              title={t("header.cart_title")}
            >
              <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
              {displayCartCount > 0 && (
                <span suppressHydrationWarning className="absolute -top-1 -right-1 bg-tertiary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white">
                  {displayCartCount}
                </span>
              )}
            </Link>

            {/* Separator */}
            <div className="h-6 w-px bg-outline-variant mx-1 hidden lg:block" />

            {/* Login | Register — desktop: text link, not dark button */}
            <Link
              href="/connexion"
              className="hidden lg:flex items-center gap-1.5 text-sm font-semibold text-on-surface hover:text-secondary transition whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[20px] text-secondary">person</span>
              <span>{t("header.login_register")}</span>
            </Link>
          </div>
        </div>

        {/* Mobile search expandable row */}
        {mobileSearchOpen && (
          <div className="md:hidden px-4 pb-3 pt-1 border-t border-outline-variant/60">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("header.search_placeholder")}
                className="w-full pl-4 pr-28 py-2 border-2 border-tertiary rounded-lg text-sm text-on-surface focus:outline-none transition placeholder:text-outline"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 bottom-0 px-4 bg-tertiary text-white rounded-r-lg text-sm font-bold"
              >
                {t("header.search_btn")}
              </button>
            </form>
          </div>
        )}

        {/* Mobile country/lang row */}
        <div className="lg:hidden px-4 pb-2 pt-0 flex items-center justify-between gap-2 border-t border-outline-variant/30">
          <CountrySelector variant="compact" />
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="px-2 py-1 rounded border border-outline-variant bg-surface text-xs font-semibold text-primary flex items-center gap-1"
            >
              <span>{currentLangObj.flag}</span>
              <span className="uppercase">{currentLangObj.code}</span>
              <span className="material-symbols-outlined text-xs text-outline">expand_more</span>
            </button>
            {langMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setLangMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-outline-variant rounded-xl shadow-modal z-40 py-1 overflow-hidden">
                  {availableLanguages.map((lCode) => {
                    const lObj = SUPPORTED_LANGUAGES.find((item) => item.code === lCode);
                    if (!lObj) return null;
                    const isCurrent = lObj.code === language;
                    return (
                      <button
                        key={lObj.code}
                        type="button"
                        onClick={() => { setLanguage(lObj.code as SupportedLanguage); setLangMenuOpen(false); }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between ${
                          isCurrent ? "bg-surface-container text-primary font-bold" : "text-on-surface hover:bg-surface-container-low"
                        }`}
                      >
                        <span className="flex items-center gap-2"><span>{lObj.flag}</span><span>{lObj.label}</span></span>
                        {isCurrent && <span className="material-symbols-outlined text-secondary text-sm">check</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          LEVEL 3 — Navigation bar (desktop only, white)
      ───────────────────────────────────────────────────────── */}
      <div className="hidden lg:block w-full bg-white border-b border-outline-variant">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6 flex items-center gap-0 h-10">
          {/* All Categories button */}
          <div className="relative shrink-0">
            <button
              ref={catBtnRef}
              type="button"
              onClick={() => setCatPanelOpen(!catPanelOpen)}
              className="flex items-center gap-1.5 h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-base">menu</span>
              <span>{t("header.all_categories")}</span>
              <span className="material-symbols-outlined text-sm ml-1">expand_more</span>
            </button>
            {/* Categories panel */}
            {catPanelOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setCatPanelOpen(false)} />
                <div className="absolute left-0 top-full mt-0 w-56 bg-white border border-outline-variant rounded-b-xl shadow-modal z-40 py-1 overflow-hidden">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/produits?category=${cat.slug}`}
                      onClick={() => setCatPanelOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low hover:text-secondary transition"
                    >
                      <span className="material-symbols-outlined text-base text-secondary">{cat.icon}</span>
                      <span>{CAT_LABELS_FR[cat.labelKey] || cat.slug}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Nav links */}
          <nav className="flex items-center flex-1 overflow-hidden">
            {[
              { href: "/", label: t("header.home"), icon: "home" },
              { href: "/boutiques", label: t("header.all_shops"), icon: "storefront" },
              { href: "/produits", label: t("header.catalog"), icon: "category" },
              { href: "/devenir-vendeur", label: t("header.become_seller"), icon: "badge" },
              { href: "/suivi", label: t("header.order_tracking"), icon: "track_changes" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1 px-3.5 xl:px-4 h-10 text-sm font-semibold text-on-surface-variant hover:text-secondary hover:bg-surface-container-low transition whitespace-nowrap border-b-2 border-transparent hover:border-secondary"
              >
                <span className="material-symbols-outlined text-[15px]">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          MOBILE DRAWER
      ───────────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-primary/60 backdrop-blur-sm">
          <div className="w-4/5 max-w-xs h-full bg-white flex flex-col shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant shrink-0">
              <div className="flex items-center gap-2">
                <Image
                  src="/images/logo-mwinda.png"
                  alt="Mwinda Market"
                  width={36}
                  height={36}
                  className="w-8 h-8 object-contain"
                />
                <span className="font-bold text-primary font-display">Mwinda Market</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-full hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Drawer body — scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Country selector */}
              <div className="border-b border-outline-variant/60 pb-4">
                <CountrySelector variant="card" />
              </div>

              {/* Language picker */}
              <div className="border-b border-outline-variant/60 pb-4">
                <span className="text-[10px] uppercase font-bold text-outline tracking-wider block mb-2">
                  {t("header.select_language")}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {availableLanguages.map((lCode) => {
                    const lObj = SUPPORTED_LANGUAGES.find((item) => item.code === lCode);
                    if (!lObj) return null;
                    const isSelected = lObj.code === language;
                    return (
                      <button
                        key={lObj.code}
                        type="button"
                        onClick={() => setLanguage(lObj.code as SupportedLanguage)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                          isSelected ? "bg-secondary text-white border-secondary" : "bg-surface border-outline-variant text-on-surface"
                        }`}
                      >
                        <span>{lObj.flag}</span>
                        <span>{lObj.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main nav */}
              <nav className="space-y-0.5">
                {[
                  { href: "/", label: t("header.home"), icon: "home", accent: true },
                  { href: "/boutiques", label: t("header.all_shops"), icon: "storefront" },
                  { href: "/produits", label: t("header.catalog"), icon: "category" },
                  { href: "/devenir-vendeur", label: t("header.become_seller"), icon: "badge" },
                  { href: "/suivi", label: t("header.order_tracking"), icon: "track_changes" },
                  { href: "/vendeur/dashboard", label: t("header.utility_sell"), icon: "dashboard" },
                  { href: "/assistance", label: t("header.utility_hotline_prefix"), icon: "support_agent" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                      link.accent
                        ? "text-secondary font-bold bg-surface-container-low"
                        : "text-on-surface hover:bg-surface-container font-medium"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Drawer footer */}
            <div className="px-5 py-4 border-t border-outline-variant shrink-0 space-y-3">
              <Link
                href="/connexion"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 bg-primary text-white rounded-lg font-semibold text-center block text-sm shadow"
              >
                {t("header.login_register")}
              </Link>
              <div className="text-[11px] text-center text-on-surface-variant font-medium flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-xs text-secondary">call</span>
                {t("header.utility_hotline_prefix")} {hotline}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
