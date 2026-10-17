"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CountrySelector } from "./CountrySelector";
import { useCart } from "@/context/CartContext";
import { useMarket, SupportedLanguage, SUPPORTED_LANGUAGES } from "@/context/MarketContext";
import { useT } from "@/i18n";

interface HeaderProps {
  cartCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ cartCount }) => {
  const { totalCount } = useCart();
  const displayCartCount = totalCount !== undefined ? totalCount : (cartCount ?? 0);
  const { country, language, setLanguage, availableLanguages, isRDC } = useMarket();
  const { t } = useT();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/produits?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-outline-variant w-full overflow-x-clip">
      <div className="w-full px-4 md:px-6 lg:px-10 max-w-7xl mx-auto flex flex-col min-w-0">
        {/* Top Row: Brand, Search, Selectors & Actions */}
        <div className="flex items-center justify-between py-2.5 sm:py-3 gap-2 sm:gap-3 md:gap-4">
          {/* Left: Mobile hamburger & Logo */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg lg:hidden hover:bg-surface-container text-on-surface"
              aria-label="Menu"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>

            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary text-secondary-container flex items-center justify-center shadow-md">
                <span
                  className="material-symbols-outlined text-lg sm:text-2xl text-tertiary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  light_mode
                </span>
              </div>
              <div>
                <span className="text-base sm:text-xl font-black text-primary tracking-tight block leading-tight font-display">
                  Mwinda Market
                </span>
                <span className="block text-[9px] sm:text-[10px] text-secondary font-bold -mt-0.5 tracking-widest uppercase">
                  {isRDC ? "Congo Éclairé" : "Pan-Africa Market"}
                </span>
              </div>
            </Link>
          </div>

          {/* Signature Selector (Desktop only) : Pays / Devise */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <CountrySelector variant="header" />
          </div>

          {/* Center Search Bar (Tablet & Desktop: hidden on mobile < 768px) */}
          <div className="hidden md:flex flex-1 max-w-xs lg:max-w-2xl mx-1 sm:mx-2">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("header.search_placeholder")}
                className="w-full pl-9 pr-16 lg:pl-10 lg:pr-24 py-1.5 lg:py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition placeholder:text-outline"
              />
              <span className="material-symbols-outlined absolute left-2.5 lg:left-3 text-outline text-base lg:text-xl">
                search
              </span>
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-2.5 lg:px-4 bg-secondary text-white rounded-md text-xs font-semibold flex items-center gap-1 hover:bg-secondary-dark transition"
              >
                <span>{t("header.search_btn")}</span>
              </button>
            </form>
          </div>

          {/* Trailing Actions */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 shrink-0">
            {/* Mobile Search Toggle Icon (< 768px) */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="p-1.5 sm:p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full transition md:hidden"
              aria-label={t("header.search_btn") || "Recherche"}
              title={t("header.search_btn") || "Recherche"}
            >
              <span className="material-symbols-outlined text-xl">
                {mobileSearchOpen ? "close" : "search"}
              </span>
            </button>

            {/* Language Selector Dropdown (Tablet & Desktop: hidden on mobile < 768px) */}
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="px-2.5 py-1.5 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container-low text-xs font-semibold text-primary flex items-center gap-1.5 transition"
                title={t("header.select_language")}
              >
                <span>{currentLangObj.flag}</span>
                <span className="hidden sm:inline uppercase text-[11px] font-bold">
                  {currentLangObj.code}
                </span>
                <span className="material-symbols-outlined text-sm text-outline">
                  expand_more
                </span>
              </button>

              {langMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setLangMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-36 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl z-40 py-1 divide-y divide-outline-variant/40 animate-scale-up">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-outline">
                      {t("header.select_language")}
                    </div>
                    <div className="py-1">
                      {availableLanguages.map((lCode) => {
                        const lObj = SUPPORTED_LANGUAGES.find((item) => item.code === lCode);
                        if (!lObj) return null;
                        const isCurrent = lObj.code === language;
                        return (
                          <button
                            key={lObj.code}
                            type="button"
                            onClick={() => {
                              setLanguage(lObj.code as SupportedLanguage);
                              setLangMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition ${
                              isCurrent
                                ? "bg-secondary-fixed text-primary font-bold"
                                : "text-on-surface hover:bg-surface-container-low"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span>{lObj.flag}</span>
                              <span>{lObj.label}</span>
                            </span>
                            {isCurrent && (
                              <span className="material-symbols-outlined text-secondary text-sm">
                                check
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Notifications (Desktop only: hidden on mobile/tablet) */}
            <button
              type="button"
              className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full transition relative hidden lg:flex"
              title={t("header.notifications")}
            >
              <span className="material-symbols-outlined text-xl sm:text-2xl">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-tertiary rounded-full ring-2 ring-white"></span>
            </button>

            {/* Favorites (Desktop only: hidden on mobile/tablet) */}
            <button
              type="button"
              className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full transition hidden lg:flex"
              title={t("header.favorites")}
            >
              <span className="material-symbols-outlined text-xl sm:text-2xl">favorite</span>
            </button>

            {/* Cart Icon with badge (Always visible: mobile, tablet, desktop) */}
            <Link
              href="/panier"
              className="p-1.5 sm:p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full transition relative flex items-center"
              title={t("header.cart_title")}
            >
              <span className="material-symbols-outlined text-xl sm:text-2xl">shopping_cart</span>
              {displayCartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-tertiary text-white text-[10px] font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center ring-2 ring-white">
                  {displayCartCount}
                </span>
              )}
            </Link>

            <div className="h-6 w-px bg-outline-variant mx-1 hidden lg:block"></div>

            {/* Login CTA (Desktop only: hidden on mobile/tablet, present in drawer) */}
            <Link
              href="/connexion"
              className="px-3 sm:px-4 py-2 rounded-lg bg-primary text-white font-semibold text-xs sm:text-sm hover:bg-slate-800 transition items-center gap-1.5 shadow-sm hidden lg:flex"
            >
              <span className="material-symbols-outlined text-base sm:text-lg">person</span>
              <span>{t("header.login")}</span>
            </Link>
          </div>
        </div>

        {/* Mobile Search Row (Expandable on Mobile < 768px) */}
        {mobileSearchOpen && (
          <div className="md:hidden pb-2.5 pt-1 border-t border-outline-variant/60 animate-in fade-in slide-in-from-top-1 duration-150">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("header.search_placeholder")}
                className="w-full pl-9 pr-20 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition placeholder:text-outline"
              />
              <span className="material-symbols-outlined absolute left-2.5 text-outline text-lg">
                search
              </span>
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-3 bg-secondary text-white rounded-md text-xs font-semibold flex items-center gap-1 hover:bg-secondary-dark transition"
              >
                <span>{t("header.search_btn")}</span>
              </button>
            </form>
          </div>
        )}

        {/* Mobile Country Selector Bar */}
        <div className="lg:hidden pb-2.5 pt-0.5 flex items-center justify-between gap-2 overflow-x-auto min-w-0 max-w-full">
          <div className="flex items-center gap-1.5 shrink-0">
            <CountrySelector variant="compact" />
          </div>
          <span className="text-[11px] text-on-surface-variant font-medium whitespace-nowrap flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-secondary">local_shipping</span>
            <span>Livraison disponible</span>
          </span>
        </div>

        {/* Bottom Row: Navigation Links Bar (Desktop) */}
        <nav className="hidden lg:flex items-center justify-between border-t border-outline-variant py-2.5 gap-3 min-w-0">
          <ul className="flex items-center gap-2.5 lg:gap-3.5 xl:gap-4 text-xs xl:text-[13px] font-semibold shrink min-w-0">
            <li className="shrink-0">
              <Link
                href="/"
                className="text-secondary font-bold border-b-2 border-secondary pb-1 flex items-center gap-1.5 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[17px]">home</span>
                <span>{t("header.home")}</span>
              </Link>
            </li>
            <li className="shrink-0">
              <Link
                href="/boutiques"
                className="text-on-surface-variant hover:text-primary transition pb-1 flex items-center gap-1.5 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[17px]">storefront</span>
                <span>{t("header.all_shops")}</span>
              </Link>
            </li>
            <li className="shrink-0">
              <Link
                href="/produits"
                className="text-on-surface-variant hover:text-primary transition pb-1 flex items-center gap-1.5 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[17px]">category</span>
                <span>{t("header.categories")}</span>
              </Link>
            </li>
            <li className="shrink-0">
              <Link
                href="/devenir-vendeur"
                className="text-on-surface-variant hover:text-primary transition pb-1 flex items-center gap-1.5 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[17px]">badge</span>
                <span>{t("header.become_seller")}</span>
              </Link>
            </li>
            <li className="shrink-0">
              <Link
                href="/suivi"
                className="text-on-surface-variant hover:text-primary transition pb-1 flex items-center gap-1.5 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[17px]">track_changes</span>
                <span>{t("header.order_tracking")}</span>
              </Link>
            </li>
          </ul>

          {/* Hotline assistance */}
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant shrink-0 whitespace-nowrap pl-4">
            <span className="material-symbols-outlined text-secondary text-base shrink-0">support_agent</span>
            <span className="whitespace-nowrap">{t("header.customer_support")} :</span>
            <strong className="text-primary font-bold whitespace-nowrap">
              {isRDC ? "+243 81 000 9999" : `${country.phoneCode} 800 000`}
            </strong>
          </div>
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-primary/60 backdrop-blur-sm">
          <div className="w-4/5 max-w-xs h-full bg-white p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary text-secondary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg text-tertiary">light_mode</span>
                  </div>
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

              {/* Mobile Selector (Country) */}
              <div className="py-4 space-y-2.5 border-b border-outline-variant/60">
                <CountrySelector variant="card" />
              </div>

              {/* Language Picker in Drawer */}
              <div className="py-3 border-b border-outline-variant/60">
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
                          isSelected
                            ? "bg-secondary text-white border-secondary"
                            : "bg-surface border-outline-variant text-on-surface"
                        }`}
                      >
                        <span>{lObj.flag}</span>
                        <span>{lObj.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1 py-3">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-secondary font-bold bg-secondary-fixed/30"
                >
                  <span className="material-symbols-outlined text-lg">home</span>
                  <span>{t("header.home")}</span>
                </Link>
                <Link
                  href="/boutiques"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-lg">storefront</span>
                  <span>{t("header.all_shops")}</span>
                </Link>
                <Link
                  href="/produits"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-lg">category</span>
                  <span>{t("header.categories")}</span>
                </Link>
                <Link
                  href="/devenir-vendeur"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-lg">badge</span>
                  <span>{t("header.become_seller")}</span>
                </Link>
                <Link
                  href="/suivi"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-lg">track_changes</span>
                  <span>{t("header.order_tracking")}</span>
                </Link>
                <Link
                  href="/vendeur/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#EA580C] font-semibold hover:bg-orange-50"
                >
                  <span className="material-symbols-outlined text-lg">dashboard</span>
                  <span>Tableau de bord Vendeur</span>
                </Link>
              </nav>
            </div>

            <div className="pt-4 border-t border-outline-variant space-y-3">
              <Link
                href="/connexion"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 bg-primary text-white rounded-lg font-semibold text-center block text-sm shadow"
              >
                {t("header.login")}
              </Link>
              <div className="text-[11px] text-center text-on-surface-variant font-medium">
                {t("header.customer_support")} : {isRDC ? "+243 81 000 9999" : `${country.phoneCode} 800 000`}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
