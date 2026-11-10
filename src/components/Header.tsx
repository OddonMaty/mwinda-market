"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CountrySelector } from "./CountrySelector";
import { useCart } from "@/context/CartContext";
import { useMarket, SupportedLanguage, SUPPORTED_LANGUAGES } from "@/context/MarketContext";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/i18n";
import { CONTACT_CONFIG } from "@/config/contact";
import { getActiveCategories } from "@/config/categories";
import { useCatalog } from "@/context/CatalogContext";
import {
  Search,
  ShoppingBag,
  Bell,
  Heart,
  User,
  ChevronDown,
  Menu,
  X,
  Headphones,
  Check,
  CheckCircle2,
  Store,
  LogOut,
  Sparkles,
  Phone,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  cartCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ cartCount }) => {
  const { items } = useCart();
  const displayCartCount = cartCount !== undefined ? cartCount : items.length;
  const { language, setLanguage, availableLanguages } = useMarket();
  const { user, signOut } = useAuth();
  const { t } = useT();
  const { products: catalogProducts } = useCatalog();
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [catPanelOpen, setCatPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifRead, setNotifRead] = useState(false);
  const catBtnRef = useRef<HTMLButtonElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Catégories actives (exclut celles ayant 0 produit)
  const activeCategories = React.useMemo(
    () => getActiveCategories(catalogProducts),
    [catalogProducts]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/produits?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const hotline = CONTACT_CONFIG.phone;
  const hotlineRaw = CONTACT_CONFIG.phoneRaw;

  // Fermeture des menus au clic extérieur
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

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  return (
    <header className="sticky top-0 z-50 w-full overflow-x-clip bg-white/95 backdrop-blur-md">
      {/* ─────────────────────────────────────────────────────────
          LEVEL 1 — Utility bar (desktop only, marine sleek)
      ───────────────────────────────────────────────────────── */}
      <div className="hidden lg:block w-full bg-brand-navy text-white text-xs border-b border-white/10">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6 flex items-center justify-between h-8 gap-4">
          {/* Left: hotline / service client */}
          <div className="flex items-center gap-2 shrink-0">
            <Headphones className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-white/80">{t("header.utility_hotline_prefix")}</span>
            <a
              href={`tel:${hotlineRaw}`}
              className="font-semibold text-white hover:text-brand-orange transition-colors"
            >
              {hotline}
            </a>
          </div>

          {/* Right: quick links + selectors */}
          <div className="flex items-center gap-4 text-white/85">
            <Link
              href="/suivi"
              className="hover:text-white transition-colors whitespace-nowrap"
            >
              {t("header.utility_tracking")}
            </Link>
            <Link
              href="/devenir-vendeur"
              className="hover:text-white transition-colors whitespace-nowrap flex items-center gap-1 font-medium"
            >
              <Store className="w-3.5 h-3.5 text-brand-blue" />
              <span>{t("header.utility_sell")}</span>
            </Link>
            <div className="w-px h-3.5 bg-white/20" />
            <CountrySelector variant="header" />

            {/* Language dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 hover:text-white transition-colors py-1"
                title={t("header.select_language")}
              >
                <span>{currentLangObj.flag}</span>
                <span className="font-semibold uppercase tracking-wider text-[11px]">{currentLangObj.code}</span>
                <ChevronDown className="w-3 h-3 text-white/70" />
              </button>
              {langMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setLangMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-40 bg-white text-slate-800 border border-border rounded-xl shadow-lg z-40 py-1.5 overflow-hidden animate-in fade-in-50 zoom-in-95">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50">
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
                          onClick={() => {
                            setLanguage(lObj.code as SupportedLanguage);
                            setLangMenuOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors",
                            isCurrent
                              ? "bg-brand-blue/10 text-brand-blue font-bold"
                              : "hover:bg-muted text-foreground"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span>{lObj.flag}</span>
                            <span>{lObj.label}</span>
                          </span>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-brand-blue" />}
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
          LEVEL 2 — Main bar (logo + search + actions)
      ───────────────────────────────────────────────────────── */}
      <div className="w-full border-b border-border/70">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6 flex items-center gap-3 md:gap-6 h-16 md:h-18">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg lg:hidden hover:bg-muted text-foreground shrink-0 transition-colors"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo officiel Mwinda Market */}
          <Link href="/" className="flex items-center shrink-0 group" aria-label="Mwinda Market — Accueil">
            <Image
              src="/images/logo-mwinda.png"
              alt="Mwinda Market"
              width={38}
              height={38}
              className="sm:hidden h-[38px] w-auto object-contain"
              priority
            />
            <Image
              src="/images/logo-mwinda-h-light.png"
              alt="Mwinda Market"
              width={180}
              height={40}
              className="hidden sm:block h-[40px] w-auto object-contain transition-transform group-hover:scale-[1.01]"
              priority
            />
          </Link>

          {/* Search bar épurée — desktop & tablette */}
          <div className="hidden md:flex flex-1 max-w-xl lg:max-w-2xl mx-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center w-full group rounded-full border border-border/80 bg-slate-50/80 transition-all duration-200 focus-within:bg-white focus-within:border-brand-navy focus-within:ring-2 focus-within:ring-brand-navy/10 shadow-xs"
            >
              <Search className="w-4 h-4 ml-4 text-muted-foreground group-focus-within:text-brand-navy shrink-0 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("header.search_placeholder")}
                className="w-full pl-3 pr-28 py-2.5 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-4 bg-brand-orange text-white rounded-full text-xs font-semibold hover:bg-orange-600 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>{t("header.search_btn")}</span>
              </button>
            </form>
          </div>

          {/* Actions à droite */}
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0 ml-auto md:ml-0">
            {/* Mobile search toggle */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors md:hidden"
              aria-label={t("header.search_btn") || "Recherche"}
            >
              {mobileSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>

            {/* Notifications épurées */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  if (!notifRead) setNotifRead(true);
                }}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors relative flex items-center justify-center"
                title={t("header.notifications") || "Notifications"}
                aria-label="Centre de notifications"
              >
                <Bell className="w-5 h-5" />
                {!notifRead && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-orange rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {/* Popover Notifications */}
              {notifOpen && (
                <div className="absolute right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mt-2 w-76 sm:w-80 bg-white border border-border rounded-2xl shadow-xl z-50 overflow-hidden text-foreground animate-in fade-in-50 zoom-in-95">
                  <div className="p-3.5 bg-slate-50 border-b border-border flex items-center justify-between">
                    <span className="font-bold text-xs text-brand-navy flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-brand-orange" />
                      <span>Notifications Mwinda</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotifRead(true)}
                      className="text-[10px] text-muted-foreground hover:text-foreground font-medium"
                    >
                      Tout marquer comme lu
                    </button>
                  </div>

                  <div className="divide-y divide-border/60 max-h-72 overflow-y-auto">
                    {/* Alerte compte non vérifié */}
                    {!user?.isVerified && !user?.emailConfirmed && (
                      <Link
                        href="/mon-compte"
                        onClick={() => setNotifOpen(false)}
                        className="p-3.5 flex items-start gap-2.5 hover:bg-muted/50 transition-colors block bg-amber-50/40"
                      >
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-brand-navy">Compte à certifier</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Validez votre numéro par code OTP pour obtenir le badge membre vérifié.
                          </p>
                        </div>
                      </Link>
                    )}

                    {/* Notification séquestre */}
                    <div className="p-3.5 flex items-start gap-2.5 hover:bg-muted/50 transition-colors">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-brand-navy">Paiements sécurisés (Escrow)</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Fonds retenus jusqu'à la réception conforme de votre commande.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 border-t border-border text-center">
                    <Link
                      href="/mon-compte"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-semibold text-brand-orange hover:underline"
                    >
                      Accéder à mon espace &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Button avec compteur pill */}
            <Link
              href="/panier"
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors relative flex items-center justify-center"
              title={t("header.cart_title")}
            >
              <ShoppingBag className="w-5 h-5" />
              {displayCartCount > 0 && (
                <span
                  suppressHydrationWarning
                  className="absolute -top-1 -right-1 bg-brand-orange text-white text-[10px] font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center ring-2 ring-white shadow-xs"
                >
                  {displayCartCount}
                </span>
              )}
            </Link>

            <div className="h-5 w-px bg-border mx-1 hidden lg:block" />

            {/* Compte Utilisateur / Connexion (Desktop) */}
            {user ? (
              <div className="hidden lg:flex items-center gap-1.5">
                <Link
                  href="/mon-compte"
                  className="text-xs font-semibold text-brand-navy flex items-center gap-1.5 bg-slate-100/80 hover:bg-slate-200/80 px-3 py-1.5 rounded-full border border-border/80 transition-all"
                >
                  <User className="w-3.5 h-3.5 text-brand-blue" />
                  <span className="max-w-[110px] truncate">{user.fullName || user.phone || user.email}</span>
                </Link>
                {user.role === "vendor" && (
                  <Link
                    href="/vendeur/dashboard"
                    className="p-1.5 text-brand-blue hover:bg-brand-blue/10 transition-colors rounded-lg"
                    title="Espace Vendeur"
                  >
                    <Store className="w-4 h-4" />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-muted"
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/connexion"
                className="hidden lg:flex items-center gap-2 text-xs font-semibold text-foreground hover:text-brand-blue transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
              >
                <User className="w-4 h-4 text-brand-blue" />
                <span>{t("header.login_register")}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search Row (Expandable) */}
        {mobileSearchOpen && (
          <div className="md:hidden px-4 pb-3 pt-1 border-t border-border/60">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("header.search_placeholder")}
                className="w-full pl-3.5 pr-24 py-2 border border-border rounded-full text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-navy/15 bg-slate-50"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-4 bg-brand-orange text-white rounded-full text-xs font-semibold"
              >
                {t("header.search_btn")}
              </button>
            </form>
          </div>
        )}

        {/* Mobile Country & Lang Compact Row */}
        <div className="lg:hidden px-4 py-1.5 flex items-center justify-between gap-2 border-t border-border/40 bg-slate-50/50">
          <CountrySelector variant="compact" />
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="px-2.5 py-1 rounded-md border border-border bg-white text-xs font-semibold text-foreground flex items-center gap-1 shadow-xs"
            >
              <span>{currentLangObj.flag}</span>
              <span className="uppercase text-[10px]">{currentLangObj.code}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
            {langMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setLangMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-border rounded-xl shadow-lg z-40 py-1 overflow-hidden">
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
                        className={cn(
                          "w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors",
                          isCurrent ? "bg-muted font-bold text-brand-navy" : "text-foreground hover:bg-muted/50"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span>{lObj.flag}</span>
                          <span>{lObj.label}</span>
                        </span>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-brand-blue" />}
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
          LEVEL 3 — Navigation bar (desktop only)
      ───────────────────────────────────────────────────────── */}
      <div className="hidden lg:block w-full bg-white border-b border-border/70">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6 flex items-center gap-1 h-11">
          {/* Menu Toutes les catégories */}
          <div className="relative shrink-0 mr-2">
            <button
              ref={catBtnRef}
              type="button"
              onClick={() => setCatPanelOpen(!catPanelOpen)}
              className="flex items-center gap-2 h-9 px-3.5 bg-brand-navy text-white text-xs font-semibold rounded-lg hover:bg-brand-navy/90 transition-all shadow-xs"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{t("header.all_categories")}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70 ml-0.5" />
            </button>

            {/* Panneau déroulant des catégories */}
            {catPanelOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setCatPanelOpen(false)} />
                <div className="absolute left-0 top-full mt-1.5 w-60 bg-white border border-border rounded-xl shadow-xl z-40 py-2 overflow-hidden animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 mb-1">
                    Rayons & Catégories
                  </div>
                  {activeCategories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/produits?category=${cat.slug}`}
                      onClick={() => setCatPanelOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-slate-50 hover:text-brand-blue transition-colors"
                    >
                      <span className="material-symbols-outlined text-base text-brand-blue opacity-80">{cat.icon}</span>
                      <span>{t(`header.${cat.labelKey}`) || cat.defaultLabel}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Liens de navigation principaux */}
          <nav className="flex items-center gap-1 flex-1">
            {[
              { href: "/", label: t("header.home") },
              { href: "/produits", label: t("header.catalog") },
              { href: "/devenir-vendeur", label: t("header.become_seller") },
              { href: "/suivi", label: t("header.order_tracking") },
            ].map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-slate-100 text-brand-navy font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-slate-50"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          MOBILE DRAWER
      ───────────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-4/5 max-w-xs h-full bg-white flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Header du drawer */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Image
                  src="/images/logo-mwinda.png"
                  alt="Mwinda Market"
                  width={34}
                  height={34}
                  className="h-[34px] w-auto object-contain"
                />
                <span className="font-bold text-sm text-brand-navy">Mwinda Market</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corps défilable */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="border-b border-border/70 pb-4">
                <CountrySelector variant="card" />
              </div>

              {/* Sélection de langue */}
              <div className="border-b border-border/70 pb-4">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-2">
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
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border transition-colors",
                          isSelected
                            ? "bg-brand-navy text-white border-brand-navy font-semibold"
                            : "bg-white border-border text-foreground hover:bg-muted"
                        )}
                      >
                        <span>{lObj.flag}</span>
                        <span>{lObj.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation principale */}
              <nav className="space-y-1">
                {[
                  { href: "/", label: t("header.home") },
                  { href: "/produits", label: t("header.catalog") },
                  { href: "/devenir-vendeur", label: t("header.become_seller") },
                  { href: "/suivi", label: t("header.order_tracking") },
                  { href: "/assistance", label: t("header.utility_hotline_prefix") },
                ].map((link) => {
                  const isActive =
                    link.href === "/"
                      ? pathname === "/"
                      : pathname === link.href || pathname.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors",
                        isActive
                          ? "bg-brand-blue/10 text-brand-blue font-bold"
                          : "text-foreground hover:bg-muted font-medium"
                      )}
                    >
                      <span>{link.label}</span>
                    </Link>
                  );
                })}

                {user && (
                  <Link
                    href="/mon-compte"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted font-medium"
                  >
                    <User className="w-4 h-4 text-brand-blue" />
                    <span>Mon Compte</span>
                  </Link>
                )}

                {user?.role === "vendor" && (
                  <Link
                    href="/vendeur/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-brand-blue font-semibold hover:bg-brand-blue/5"
                  >
                    <Store className="w-4 h-4" />
                    <span>Espace Vendeur</span>
                  </Link>
                )}
              </nav>
            </div>

            {/* Pied du drawer */}
            <div className="px-5 py-4 border-t border-border shrink-0 space-y-3">
              {user ? (
                <div className="p-3 bg-muted/60 rounded-xl flex items-center justify-between border border-border">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="w-4 h-4 text-brand-blue shrink-0" />
                    <span className="text-xs font-semibold text-brand-navy truncate">
                      {user.fullName || user.phone || user.email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs text-destructive font-medium hover:underline shrink-0 ml-2"
                  >
                    Déconnexion
                  </button>
                </div>
              ) : (
                <Link
                  href="/connexion"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 bg-brand-navy text-white rounded-lg font-semibold text-center block text-sm shadow-sm"
                >
                  {t("header.login_register")}
                </Link>
              )}
              <div className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1.5">
                <Phone className="w-3 h-3 text-brand-blue" />
                <span>{hotline}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
