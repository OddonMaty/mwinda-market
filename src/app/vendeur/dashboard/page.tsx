"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  VENDOR_PROFILE,
  VENDOR_STATS,
  VENDOR_RECENT_ORDERS,
  VENDOR_STOCK_ALERTS,
  VENDOR_PRODUCTS,
  VendorOrder,
  VendorProduct,
  getPayoutConfigForCountry,
} from "@/data/vendor";
import { useT } from "@/i18n";

type TabType = "dashboard" | "products" | "orders" | "customers" | "settings";

export default function VendorDashboardPage() {
  const { t } = useT();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<"7J" | "30J" | "3M" | "1AN">("30J");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orders] = useState<VendorOrder[]>(VENDOR_RECENT_ORDERS);
  const [products, setProducts] = useState<VendorProduct[]>(VENDOR_PRODUCTS);
  const [productSearch, setProductSearch] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const vendorPayoutConfig = getPayoutConfigForCountry(VENDOR_PROFILE.countryCode);

  // Quick toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Copy helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    showToast(`Référence ${text} copiée`);
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesQuery =
      order.reference.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.destination.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.itemsSummary.toLowerCase().includes(orderSearch.toLowerCase());

    const matchesStatus =
      orderStatusFilter === "all" ||
      (orderStatusFilter === "in_delivery" && order.status === "in_delivery") ||
      (orderStatusFilter === "shipped_hub" && order.status === "shipped_hub") ||
      (orderStatusFilter === "delivered" && order.status === "delivered") ||
      (orderStatusFilter === "in_prep" && order.status === "in_prep");

    return matchesQuery && matchesStatus;
  });

  // Filter products
  const filteredProducts = products.filter((prod) => {
    return (
      prod.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      prod.category.toLowerCase().includes(productSearch.toLowerCase()) ||
      prod.sku.toLowerCase().includes(productSearch.toLowerCase())
    );
  });

  const toggleProductStatus = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newStatus = p.status === "disabled" ? "active" : "disabled";
          showToast(`Produit "${p.name}" ${newStatus === "disabled" ? t("vendor_dashboard.status_disabled") : t("vendor_dashboard.status_active")}`);
          return { ...p, status: newStatus };
        }
        return p;
      })
    );
  };

  return (
    <div className="h-screen flex flex-col bg-surface text-on-surface font-sans overflow-hidden antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary-container text-white px-5 py-3.5 rounded-xl shadow-2xl border border-secondary-fixed flex items-center gap-3 animate-fade-in text-sm font-medium">
          <span className="material-symbols-outlined text-secondary-fixed text-xl">
            check_circle
          </span>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 text-base"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── 1. TOP HEADER BACK-OFFICE ───────────────────────────────── */}
      <header className="bg-surface-container-lowest border-b border-outline-variant z-40 flex-shrink-0 h-16">
        <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
          {/* Gauche: Marque, Mobile trigger, Sélecteur de Boutique */}
          <div className="flex items-center gap-3 sm:gap-5 min-w-max">
            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition"
              aria-label="Menu"
            >
              <span className="material-symbols-outlined text-2xl">
                {mobileSidebarOpen ? "close" : "menu"}
              </span>
            </button>

            {/* Logo Brand */}
            <Link href="/" className="flex items-center gap-2.5 group" aria-label="Mwinda Market — Accueil">
              <Image
                src="/images/logo-mwinda.png"
                alt="Mwinda Market"
                width={36}
                height={36}
                className="w-9 h-9 object-contain group-hover:scale-105 transition-transform"
              />
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-primary tracking-tight font-display">
                    Mwinda Market
                  </span>
                  <span className="bg-secondary-fixed text-on-secondary-fixed font-bold text-[10px] px-2 py-0.5 rounded-full border border-secondary-fixed-dim uppercase tracking-wider">
                    {t("vendor_dashboard.seller_central")}
                  </span>
                </div>
              </div>
            </Link>

            <div className="h-6 w-px bg-outline-variant hidden sm:block"></div>

            {/* Sélecteur de boutique avec pays et devise de règlement */}
            <Link
              href={`/boutiques/${VENDOR_PROFILE.shopId}`}
              className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low hover:bg-surface-container transition-colors text-left"
              title={t("vendor_dashboard.view_public_shop")}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-xs text-on-surface leading-tight">
                  <span>{VENDOR_PROFILE.shopName}</span>
                  <span className="material-symbols-outlined text-sm text-secondary">
                    open_in_new
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
                  <span>{VENDOR_PROFILE.countryFlag} {VENDOR_PROFILE.countryName}</span> •{" "}
                  <span className="text-secondary font-medium font-mono">
                    {VENDOR_PROFILE.settlementCurrency.code} ({VENDOR_PROFILE.settlementCurrency.symbol})
                  </span>
                </p>
              </div>
            </Link>
          </div>

          {/* Centre: Recherche Globale Back-office */}
          <div className="flex-1 max-w-xl hidden xl:block">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg">
                search
              </span>
              <input
                className="w-full bg-surface border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                placeholder={t("vendor_dashboard.search_orders_placeholder")}
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-outline border border-outline-variant rounded bg-surface-container-lowest">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          {/* Droite: Indicateurs & Profil */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-max">
            {/* Bouton Voir ma boutique */}
            <Link
              href={`/boutiques/${VENDOR_PROFILE.shopId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-secondary text-secondary hover:bg-secondary-fixed transition-colors font-semibold text-xs"
            >
              <span className="material-symbols-outlined text-base">storefront</span>
              <span className="hidden sm:inline">{t("vendor_dashboard.view_public_shop")}</span>
            </Link>

            {/* Action Messagerie Directe */}
            <button
              onClick={() => showToast("Messagerie ouverte")}
              className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
              title="Messagerie"
              type="button"
            >
              <span className="material-symbols-outlined text-xl">chat</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-surface-container-lowest"></span>
            </button>

            {/* Notifications Commandes */}
            <button
              onClick={() => showToast("5 alertes commandes")}
              className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
              title="Alertes"
              type="button"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-1 right-1 px-1 min-w-[16px] h-4 rounded-full bg-[#EA580C] text-white font-bold text-[10px] flex items-center justify-center">
                5
              </span>
            </button>

            <div className="h-6 w-px bg-outline-variant hidden sm:block"></div>

            {/* Profil Marchand */}
            <div className="flex items-center gap-2.5 pl-1">
              <div className="relative">
                <Image
                  className="w-9 h-9 rounded-full object-cover border border-outline-variant bg-surface-container-high"
                  alt={VENDOR_PROFILE.name}
                  src={VENDOR_PROFILE.avatarUrl}
                  width={36}
                  height={36}
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
              </div>
              <div className="hidden md:block text-left">
                <div className="font-semibold text-xs text-on-surface leading-tight">
                  {VENDOR_PROFILE.name}
                </div>
                <div className="text-[11px] text-on-surface-variant font-medium">
                  {VENDOR_PROFILE.role}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── CONTENEUR PRINCIPAL AVEC SIDEBAR ────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Backdrop for mobile sidebar */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* ─── 2. BARRE LATÉRALE DE NAVIGATION (SIDEBAR) ─────────────── */}
        <aside
          className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-surface-container-lowest border-r border-outline-variant flex-shrink-0 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
            mobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="p-4 space-y-5 overflow-y-auto">
            {/* Badge Provincial Hub & Pays */}
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shrink-0">
                <span className="material-symbols-outlined text-lg">hub</span>
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                  {t("vendor_dashboard.hub_principal")}
                </div>
                <div className="text-xs text-primary-container truncate font-bold">
                  {VENDOR_PROFILE.hubLocation}
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1">
              <div className="px-2 pb-1 text-[11px] font-bold text-outline uppercase tracking-wider">
                {t("vendor_dashboard.section_commerce")}
              </div>

              {/* Tableau de bord */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("dashboard");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                  activeTab === "dashboard"
                    ? "bg-primary-container text-white shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl">dashboard</span>
                  <span>{t("vendor_dashboard.tab_dashboard")}</span>
                </div>
                {activeTab === "dashboard" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed"></span>
                )}
              </button>

              {/* Produits */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("products");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                  activeTab === "products"
                    ? "bg-primary-container text-white shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl">inventory_2</span>
                  <span>{t("vendor_dashboard.tab_products")}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-surface-container text-on-surface-variant">
                  {VENDOR_STATS.productsCount}
                </span>
              </button>

              {/* Commandes */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("orders");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                  activeTab === "orders"
                    ? "bg-primary-container text-white shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl">
                    shopping_cart_checkout
                  </span>
                  <span>{t("vendor_dashboard.tab_orders")}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#EA580C] text-white font-bold">
                  12 {t("vendor_dashboard.new_orders_badge")}
                </span>
              </button>

              {/* Clients */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("customers");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                  activeTab === "customers"
                    ? "bg-primary-container text-white shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl">group</span>
                  <span>{t("vendor_dashboard.tab_customers")}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-surface-container text-on-surface-variant">
                  {VENDOR_STATS.customerCount.toLocaleString("fr-FR")}
                </span>
              </button>

              <div className="pt-4 px-2 pb-1 text-[11px] font-bold text-outline uppercase tracking-wider">
                {t("vendor_dashboard.section_management")}
              </div>

              {/* Boutique publique */}
              <Link
                href={`/boutiques/${VENDOR_PROFILE.shopId}`}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition text-sm font-semibold"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl">store</span>
                  <span>{t("vendor_dashboard.tab_showcase")}</span>
                </div>
                <span className="material-symbols-outlined text-base text-outline">
                  chevron_right
                </span>
              </Link>

              {/* Paramètres */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("settings");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                  activeTab === "settings"
                    ? "bg-primary-container text-white shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl">settings</span>
                  <span>{t("vendor_dashboard.tab_settings")}</span>
                </div>
                <span className="material-symbols-outlined text-base text-outline">
                  chevron_right
                </span>
              </button>
            </nav>
          </div>

          {/* Bas de Sidebar : Solde dans la devise du vendeur & Support */}
          <div className="p-4 border-t border-outline-variant space-y-3 bg-surface-container-lowest">
            {/* Solde Vendeur en devise de règlement */}
            <div className="p-3 rounded-xl border border-secondary-fixed bg-surface-container-low">
              <div className="flex items-center justify-between text-on-surface-variant text-[11px] font-semibold">
                <span>{t("vendor_dashboard.kpi_available_balance")}</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {VENDOR_PROFILE.settlementCurrency.code}
                </span>
              </div>
              <div className="text-xl text-primary-container font-black mt-1">
                {VENDOR_STATS.availableBalanceCdf.toLocaleString("fr-FR")}{" "}
                <span className="text-xs font-bold text-secondary font-mono">
                  {VENDOR_PROFILE.settlementCurrency.symbol}
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                ≈ ${VENDOR_STATS.availableBalanceUsd.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} USD
              </p>
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(true)}
                className="w-full mt-2.5 px-3 py-1.5 rounded-lg bg-secondary text-white hover:bg-secondary/90 transition-colors text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">payments</span>
                <span>{t("vendor_dashboard.btn_withdraw")}</span>
              </button>
            </div>

            {/* Support Vendeur */}
            <div className="p-2.5 rounded-lg border border-outline-variant bg-surface text-center">
              <p className="text-[11px] font-semibold flex items-center justify-center gap-1.5 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {t("vendor_dashboard.support_vendor_title")}
              </p>
              <a
                href={`tel:${VENDOR_PROFILE.supportPhone}`}
                className="mt-1 inline-flex items-center justify-center gap-1 text-xs text-secondary hover:underline font-medium"
              >
                <span className="material-symbols-outlined text-sm">call</span>
                <span>{VENDOR_PROFILE.supportPhone}</span>
              </a>
            </div>
          </div>
        </aside>

        {/* ─── 3. ZONE PRINCIPALE DE CONTENU ─────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
          {/* TAB: DASHBOARD */}
          {activeTab === "dashboard" && (
            <>
              {/* En-tête de bienvenue avec pays et devise de règlement du vendeur */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl lg:text-3xl font-bold text-primary-container">
                      Bonjour, {VENDOR_PROFILE.name} ({VENDOR_PROFILE.shopName})
                    </h1>
                    <span
                      className="material-symbols-outlined text-amber-500 text-2xl"
                      title={t("tracking.courier_verified")}
                    >
                      verified
                    </span>
                  </div>
                  {/* Mention pays et devise de règlement */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-on-surface-variant mt-2">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                      <span>{VENDOR_PROFILE.countryFlag}</span>
                      <span>{t("vendor_dashboard.vendor_country")} {VENDOR_PROFILE.countryName}</span>
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-secondary">
                      <span className="material-symbols-outlined text-sm">payments</span>
                      <span>
                        {t("vendor_dashboard.settlement_currency")} {VENDOR_PROFILE.settlementCurrency.code} ({VENDOR_PROFILE.settlementCurrency.symbol} - {VENDOR_PROFILE.settlementCurrency.name})
                      </span>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {VENDOR_PROFILE.settlementMethod}
                    </span>
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-2.5">
                  {/* Dropdown Période */}
                  <div className="relative">
                    <select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value as "7J" | "30J" | "3M" | "1AN")}
                      className="appearance-none bg-surface border border-outline-variant rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary cursor-pointer"
                    >
                      <option value="30J">{t("vendor_dashboard.time_30d")}</option>
                      <option value="7J">{t("vendor_dashboard.time_7d")}</option>
                      <option value="3M">{t("vendor_dashboard.time_3m")}</option>
                      <option value="1AN">{t("vendor_dashboard.time_1y")}</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-base">
                      expand_more
                    </span>
                  </div>

                  {/* Exporter le rapport */}
                  <button
                    type="button"
                    onClick={() => showToast("Export du rapport généré avec succès")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors text-xs font-semibold"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    <span>{t("vendor_dashboard.btn_export")}</span>
                  </button>

                  {/* Ajouter un produit (CTA Principal) */}
                  <button
                    type="button"
                    onClick={() => setIsAddProductModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white transition-colors text-xs font-bold shadow-sm"
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                    <span>{t("vendor_dashboard.btn_add_product")}</span>
                  </button>
                </div>
              </div>

              {/* Rangée de 4 cartes statistiques (KPIs) - Chiffre d'affaires affiché dans la devise du vendeur */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* KPI 1 : Chiffre d'affaires en devise de règlement */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant font-medium">
                      {t("vendor_dashboard.kpi_sales")}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                      <span className="material-symbols-outlined text-xl">
                        account_balance_wallet
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-bold text-primary-container leading-none">
                      {VENDOR_STATS.totalSalesCdf.toLocaleString("fr-FR")}{" "}
                      <span className="text-xs font-bold text-secondary font-mono">
                        {VENDOR_PROFILE.settlementCurrency.symbol}
                      </span>
                    </div>
                    <div className="text-xs text-on-surface-variant mt-1.5">
                      ≈ ${VENDOR_STATS.totalSalesUsd.toLocaleString("fr-FR")} USD
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-outline-variant flex items-center gap-2">
                    <span className="inline-flex items-center text-emerald-700 font-bold text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded">
                      <span className="material-symbols-outlined text-sm">trending_up</span> +
                      {VENDOR_STATS.salesGrowthPercent}%
                    </span>
                  </div>
                </div>

                {/* KPI 2 : Commandes */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant font-medium">
                      {t("vendor_dashboard.kpi_orders")}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
                      <span className="material-symbols-outlined text-xl">local_shipping</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-bold text-primary-container leading-none">
                      {VENDOR_STATS.ordersCount}
                    </div>
                    <div className="text-xs text-on-surface-variant mt-1.5">
                      {VENDOR_STATS.shippingSuccessRate}%
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-outline-variant flex items-center gap-2">
                    <span className="inline-flex items-center text-emerald-700 font-bold text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded">
                      <span className="material-symbols-outlined text-sm">trending_up</span> +
                      {VENDOR_STATS.ordersGrowthPercent}%
                    </span>
                  </div>
                </div>

                {/* KPI 3 : Produits Référencés */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant font-medium">
                      {t("vendor_dashboard.tab_products")}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center border border-secondary-fixed-dim">
                      <span className="material-symbols-outlined text-xl">category</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-bold text-primary-container leading-none">
                      {VENDOR_STATS.productsCount}
                    </div>
                    <div className="text-xs text-amber-700 mt-1.5 font-medium">
                      {VENDOR_STATS.lowStockCount} {t("vendor_dashboard.kpi_stock_alerts")}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-outline-variant flex items-center gap-2">
                    <span className="inline-flex items-center text-secondary font-bold text-[11px] bg-secondary-fixed px-1.5 py-0.5 rounded">
                      {VENDOR_STATS.inStockPercent}%
                    </span>
                  </div>
                </div>

                {/* KPI 4 : Clients Nationaux */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant font-medium">
                      {t("vendor_dashboard.tab_customers")}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
                      <span className="material-symbols-outlined text-xl">groups</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-bold text-primary-container leading-none">
                      {VENDOR_STATS.customerCount.toLocaleString("fr-FR")}
                    </div>
                    <div className="text-xs text-on-surface-variant mt-1.5">
                      {VENDOR_STATS.provincesCovered} provinces
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-outline-variant flex items-center gap-2">
                    <span className="inline-flex items-center text-emerald-700 font-bold text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded">
                      +{VENDOR_STATS.newCustomersThisMonth}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grand Graphique : Évolution des Ventes */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-outline-variant">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-primary-container">
                        {t("vendor_dashboard.kpi_sales")}
                      </h2>
                    </div>
                    <p className="text-2xl font-bold text-primary mt-1">
                      {VENDOR_STATS.totalSalesCdf.toLocaleString("fr-FR")} {VENDOR_PROFILE.settlementCurrency.symbol}{" "}
                      <span className="text-xs font-normal text-on-surface-variant">
                        (≈ ${VENDOR_STATS.totalSalesUsd.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} USD)
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-outline-variant self-start sm:self-auto">
                    {(["7J", "30J", "3M", "1AN"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTimeRange(r)}
                        className={`px-3 py-1 text-xs rounded font-semibold transition ${
                          timeRange === r
                            ? "bg-surface-container-lowest text-primary-container shadow-xs font-bold border border-outline-variant"
                            : "text-on-surface-variant hover:text-primary"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative w-full overflow-hidden">
                  <svg
                    className="w-full h-56 lg:h-64 overflow-visible"
                    preserveAspectRatio="none"
                    viewBox="0 0 900 240"
                  >
                    <defs>
                      <linearGradient id="primaryAreaGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#006398" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#006398" stopOpacity="0.00" />
                      </linearGradient>
                      <linearGradient id="secondaryAreaGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#ea580c" stopOpacity="0.20" />
                        <stop offset="100%" stopColor="#ea580c" stopOpacity="0.00" />
                      </linearGradient>
                    </defs>

                    <line stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="900" y1="30" y2="30" />
                    <line stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="900" y1="80" y2="80" />
                    <line stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="900" y1="130" y2="130" />
                    <line stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="900" y1="180" y2="180" />

                    <path
                      d="M0,190 C60,170 120,175 180,150 C240,130 300,160 360,140 C420,120 480,135 540,80 C600,110 660,95 720,130 C780,105 840,115 900,90 L900,210 L0,210 Z"
                      fill="url(#secondaryAreaGrad)"
                    />
                    <path
                      d="M0,190 C60,170 120,175 180,150 C240,130 300,160 360,140 C420,120 480,135 540,80 C600,110 660,95 720,130 C780,105 840,115 900,90"
                      fill="none"
                      stroke="#ea580c"
                      strokeLinecap="round"
                      strokeWidth="2.5"
                    />

                    <path
                      d="M0,170 C50,150 100,160 150,130 C200,100 250,125 320,110 C390,95 450,110 520,60 C580,55 630,70 700,90 C770,75 830,40 900,45 L900,210 L0,210 Z"
                      fill="url(#primaryAreaGrad)"
                    />
                    <path
                      d="M0,170 C50,150 100,160 150,130 C200,100 250,125 320,110 C390,95 450,110 520,60 C580,55 630,70 700,90 C770,75 830,40 900,45"
                      fill="none"
                      stroke="#006398"
                      strokeLinecap="round"
                      strokeWidth="3"
                    />
                  </svg>
                </div>
              </div>

              {/* Tableau "Commandes récentes" */}
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
                <div className="p-5 border-b border-outline-variant flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-primary-container">
                      {t("vendor_dashboard.recent_orders_title")}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-base">
                        search
                      </span>
                      <input
                        className="pl-8 pr-3 py-1.5 text-xs bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-secondary text-on-surface"
                        placeholder={t("vendor_dashboard.search_orders_placeholder")}
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                      />
                    </div>

                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-xs font-medium text-on-surface focus:outline-none"
                    >
                      <option value="all">{t("vendor_dashboard.filter_all")}</option>
                      <option value="in_delivery">{t("vendor_dashboard.filter_in_delivery")}</option>
                      <option value="shipped_hub">Hub Kinshasa</option>
                      <option value="delivered">{t("vendor_dashboard.filter_delivered")}</option>
                      <option value="in_prep">{t("vendor_dashboard.filter_in_prep")}</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setActiveTab("orders")}
                      className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors text-xs font-semibold"
                    >
                      {t("vendor_dashboard.all_orders_title")}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant text-[11px] font-bold text-outline uppercase tracking-wider">
                        <th className="py-3 px-4">{t("vendor_dashboard.order_ref")}</th>
                        <th className="py-3 px-4">{t("vendor_dashboard.order_customer")} &amp; {t("vendor_dashboard.order_destination")}</th>
                        <th className="py-3 px-4">{t("vendor_dashboard.order_items")}</th>
                        <th className="py-3 px-4">{t("vendor_dashboard.order_status")}</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">{t("vendor_dashboard.order_total")}</th>
                        <th className="py-3 px-4 text-right">{t("vendor_dashboard.order_action")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant text-xs">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                            {t("vendor_dashboard.no_orders_match")}
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-surface-container-low/60 transition-colors">
                            <td className="py-3.5 px-4 font-medium text-on-surface">
                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={`/suivi/${ord.reference}`}
                                  className="font-bold text-secondary hover:underline"
                                  title="Suivre cette commande"
                                >
                                  #{ord.reference}
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(ord.reference)}
                                  className="text-outline hover:text-primary transition"
                                  title="Copier la référence"
                                >
                                  <span className="material-symbols-outlined text-[15px]">
                                    content_copy
                                  </span>
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-on-surface">{ord.customerName}</div>
                              <div className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-[13px] text-secondary">
                                  location_on
                                </span>
                                <span>{ord.destination}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex-shrink-0 flex items-center justify-center text-outline">
                                  <span className="material-symbols-outlined text-base">
                                    {ord.icon}
                                  </span>
                                </div>
                                <span className="text-on-surface font-medium truncate max-w-[180px]">
                                  {ord.itemsSummary}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                {ord.statusLabel}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-on-surface-variant text-[11px]">
                              {ord.date}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-sm text-on-surface">
                                ${ord.amountUsd.toFixed(2)}{" "}
                                <span className="text-[10px] font-normal text-on-surface-variant">
                                  USD
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(ord)}
                                className="px-2.5 py-1 rounded-md border border-outline-variant hover:bg-surface-container text-xs font-semibold text-on-surface transition"
                              >
                                {t("vendor_dashboard.order_details")}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bloc secondaire bas de page : Alertes Stock */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#EA580C] text-2xl">
                      warning
                    </span>
                    <h4 className="text-base font-bold text-primary-container">
                      {t("vendor_dashboard.stock_alerts_title")}
                    </h4>
                  </div>
                </div>

                <div className="mt-4 space-y-2.5">
                  {VENDOR_STOCK_ALERTS.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-outline shrink-0">
                          <span className="material-symbols-outlined text-lg">
                            {alert.icon}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-on-surface">
                            {alert.title}
                          </div>
                          <div className="text-[11px] text-error font-medium">
                            {alert.subtitle}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          showToast(`Action initiée : ${alert.title}`)
                        }
                        className="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-secondary font-semibold text-xs hover:bg-secondary-fixed transition"
                      >
                        {alert.actionLabel}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TAB: PRODUITS (GESTION DU CATALOGUE) */}
          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm">
                <div>
                  <h2 className="text-2xl font-bold text-primary-container">
                    {t("vendor_dashboard.products_title")} ({products.length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold shadow-sm self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  <span>{t("vendor_dashboard.btn_add_product")}</span>
                </button>
              </div>

              {/* Barre de recherche */}
              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder={t("vendor_dashboard.search_products_placeholder")}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              {/* Grille des produits */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 shadow-sm flex flex-col justify-between hover:border-secondary/40 transition"
                  >
                    <div>
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-xl bg-surface-container-high overflow-hidden flex-shrink-0 border border-outline-variant flex items-center justify-center text-outline">
                          <span className="material-symbols-outlined text-2xl">checkroom</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-outline">
                              {p.sku}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                p.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {p.status === "active"
                                ? t("vendor_dashboard.status_active")
                                : t("vendor_dashboard.status_disabled")}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm text-on-surface truncate mt-1">
                            {p.name}
                          </h3>
                          <p className="text-xs text-on-surface-variant">{p.category}</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-base text-primary">
                            ${p.priceUsd.toFixed(2)}{" "}
                            <span className="text-xs font-normal text-on-surface-variant">USD</span>
                          </div>
                          <div className="text-[10px] text-on-surface-variant">
                            ≈ {p.priceCdf.toLocaleString("fr-FR")} CDF
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-on-surface">
                            {t("vendor_dashboard.product_stock")}: {p.stock}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-outline-variant flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => showToast(`Édition de "${p.name}"`)}
                        className="flex-1 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface transition"
                      >
                        {t("vendor_dashboard.btn_edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleProductStatus(p.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          p.status === "disabled"
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-red-50 text-red-700 hover:bg-red-100"
                        }`}
                      >
                        {p.status === "disabled"
                          ? t("vendor_dashboard.action_enable")
                          : t("vendor_dashboard.action_disable")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: COMMANDES (VUE COMPLÈTE) */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm">
                <div>
                  <h2 className="text-2xl font-bold text-primary-container">
                    {t("vendor_dashboard.all_orders_title")} ({orders.length})
                  </h2>
                  <p className="text-sm text-on-surface-variant mt-1">
                    {t("vendor_dashboard.all_orders_desc")}
                  </p>
                </div>
              </div>

              {/* Table réutilisée */}
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant text-[11px] font-bold text-outline uppercase tracking-wider">
                        <th className="py-3 px-4">{t("vendor_dashboard.order_ref")}</th>
                        <th className="py-3 px-4">{t("vendor_dashboard.order_customer")} &amp; {t("vendor_dashboard.order_destination")}</th>
                        <th className="py-3 px-4">{t("vendor_dashboard.order_items")}</th>
                        <th className="py-3 px-4">{t("vendor_dashboard.order_status")}</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">{t("vendor_dashboard.order_total")}</th>
                        <th className="py-3 px-4 text-right">{t("vendor_dashboard.order_action")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant text-xs">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-surface-container-low/60">
                          <td className="py-3.5 px-4 font-bold text-secondary">
                            <Link href={`/suivi/${ord.reference}`} className="hover:underline">
                              #{ord.reference}
                            </Link>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-on-surface">
                            {ord.customerName}
                            <div className="text-[11px] font-normal text-on-surface-variant">
                              {ord.destination}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">{ord.itemsSummary}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-secondary">{ord.statusLabel}</span>
                          </td>
                          <td className="py-3.5 px-4 text-on-surface-variant">{ord.date}</td>
                          <td className="py-3.5 px-4 font-bold">${ord.amountUsd.toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(ord)}
                              className="px-2.5 py-1 rounded-md border border-outline-variant text-xs font-semibold"
                            >
                              {t("vendor_dashboard.order_details")}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CLIENTS */}
          {activeTab === "customers" && (
            <div className="space-y-6">
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm">
                <h2 className="text-2xl font-bold text-primary-container">
                  {t("vendor_dashboard.tab_customers")} ({VENDOR_STATS.customerCount})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant">
                    <div className="text-xs text-on-surface-variant">Clients fidèles (+3 commandes)</div>
                    <div className="text-xl font-bold text-primary mt-1">842</div>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant">
                    <div className="text-xs text-on-surface-variant">Panier moyen</div>
                    <div className="text-xl font-bold text-primary mt-1">$80.25 USD</div>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant">
                    <div className="text-xs text-on-surface-variant">Taux de réachat</div>
                    <div className="text-xl font-bold text-emerald-700 mt-1">34.4%</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PARAMÈTRES */}
          {activeTab === "settings" && (
            <div className="space-y-6 max-w-3xl">
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
                <h2 className="text-2xl font-bold text-primary-container">
                  {t("vendor_dashboard.tab_settings")}
                </h2>
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-on-surface mb-1">Nom de la boutique</label>
                    <input
                      type="text"
                      defaultValue={VENDOR_PROFILE.shopName}
                      className="w-full p-2.5 rounded-lg border border-outline-variant bg-surface"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-on-surface mb-1">{t("vendor_dashboard.hub_principal")}</label>
                    <input
                      type="text"
                      defaultValue={VENDOR_PROFILE.hubLocation}
                      disabled
                      className="w-full p-2.5 rounded-lg border border-outline-variant bg-surface-container-high text-on-surface-variant"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-on-surface mb-1">Numéro WhatsApp</label>
                    <input
                      type="text"
                      defaultValue={VENDOR_PROFILE.phone}
                      className="w-full p-2.5 rounded-lg border border-outline-variant bg-surface"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast("Paramètres boutique sauvegardés")}
                    className="px-4 py-2 bg-primary-container text-white font-semibold rounded-lg text-xs"
                  >
                    {t("vendor_dashboard.btn_save")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─── MODAL DÉTAILS COMMANDE ──────────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div>
                <h3 className="font-bold text-lg text-primary">
                  {t("vendor_dashboard.modal_order_title")} #{selectedOrder.reference}
                </h3>
                <p className="text-xs text-on-surface-variant">{selectedOrder.date}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-outline hover:text-primary text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-container-low">
                <div className="font-semibold text-on-surface">{t("vendor_dashboard.order_destination")} :</div>
                <div className="text-sm font-bold text-primary mt-0.5">{selectedOrder.customerName}</div>
                <div className="text-on-surface-variant">{selectedOrder.destination}</div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low">
                <div className="font-semibold text-on-surface">{t("vendor_dashboard.order_items")} :</div>
                <div className="text-sm text-on-surface mt-0.5">{selectedOrder.itemsSummary}</div>
              </div>

              <div className="flex justify-between p-3 rounded-xl bg-surface-container-low">
                <div>
                  <div className="font-semibold text-on-surface">{t("vendor_dashboard.order_total")} :</div>
                  <div className="text-base font-bold text-primary">${selectedOrder.amountUsd.toFixed(2)} USD</div>
                  <div className="text-[10px] text-emerald-700">{selectedOrder.paymentMethod}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-on-surface">{t("vendor_dashboard.order_status")} :</div>
                  <span className="font-bold text-secondary">{selectedOrder.statusLabel}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Link
                href={`/suivi/${selectedOrder.reference}`}
                className="flex-1 py-2.5 rounded-lg bg-secondary text-white text-center font-semibold text-xs hover:bg-secondary/90 transition"
              >
                {t("vendor_dashboard.modal_view_tracking")}
              </Link>
              <button
                type="button"
                onClick={() => {
                  showToast(`Bon d'expédition imprimé pour #${selectedOrder.reference}`);
                  setSelectedOrder(null);
                }}
                className="px-4 py-2.5 rounded-lg border border-outline-variant text-xs font-semibold hover:bg-surface-container-low transition"
              >
                {t("vendor_dashboard.modal_print_slip")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL AJOUT PRODUIT ─────────────────────────────────────── */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <h3 className="font-bold text-lg text-primary">{t("vendor_dashboard.modal_add_product_title")}</h3>
              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(false)}
                className="text-outline hover:text-primary text-lg"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                showToast("Produit ajouté !");
                setIsAddProductModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-on-surface mb-1">{t("vendor_dashboard.product_name_label")} *</label>
                <input
                  required
                  placeholder="Ex: Robe Wax Kinshasa Soirée"
                  className="w-full p-2.5 rounded-lg border border-outline-variant bg-surface"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-on-surface mb-1">{t("vendor_dashboard.product_price_label")} *</label>
                  <input
                    required
                    type="number"
                    placeholder="45.00"
                    className="w-full p-2.5 rounded-lg border border-outline-variant bg-surface"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-on-surface mb-1">{t("vendor_dashboard.product_stock_label")} *</label>
                  <input
                    required
                    type="number"
                    placeholder="20"
                    className="w-full p-2.5 rounded-lg border border-outline-variant bg-surface"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">{t("vendor_dashboard.product_category_label")} *</label>
                <select className="w-full p-2.5 rounded-lg border border-outline-variant bg-surface">
                  <option>Mode</option>
                  <option>Électronique</option>
                  <option>Maison</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant"
                >
                  {t("vendor_dashboard.action_cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#EA580C] text-white font-bold"
                >
                  {t("vendor_dashboard.product_btn_publish")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL RETRAIT INSTANTANÉ (OPÉRATEURS FILTRÉS SELON LE PAYS DU VENDEUR) ── */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-outline-variant space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <h3 className="font-bold text-lg text-primary">{t("vendor_dashboard.modal_withdraw_title")}</h3>
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="text-outline hover:text-primary text-lg"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-on-surface-variant">
              {t("vendor_dashboard.modal_withdraw_desc")}{" "}
              <strong>
                {VENDOR_STATS.availableBalanceCdf.toLocaleString("fr-FR")} {VENDOR_PROFILE.settlementCurrency.symbol}
              </strong>{" "}
              (≈ ${VENDOR_STATS.availableBalanceUsd.toFixed(2)} USD).
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-on-surface mb-1">
                  {t("vendor_dashboard.withdraw_method_label")} ({VENDOR_PROFILE.countryFlag} {VENDOR_PROFILE.countryName})
                </label>
                <select className="w-full p-2.5 rounded-lg border border-outline-variant bg-surface">
                  {vendorPayoutConfig.mobileMoneyOperators.map((operator) => (
                    <option key={operator} value={operator}>
                      {operator}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">
                  {t("vendor_dashboard.withdraw_amount_label")} ({VENDOR_PROFILE.settlementCurrency.symbol})
                </label>
                <input
                  type="number"
                  defaultValue={VENDOR_STATS.availableBalanceCdf}
                  max={VENDOR_STATS.availableBalanceCdf}
                  className="w-full p-2.5 rounded-lg border border-outline-variant bg-surface font-mono"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-outline-variant text-xs"
              >
                {t("vendor_dashboard.action_cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast("Demande de retrait initiée vers votre compte de règlement");
                  setIsWithdrawModalOpen(false);
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs"
              >
                {t("vendor_dashboard.withdraw_btn_confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
