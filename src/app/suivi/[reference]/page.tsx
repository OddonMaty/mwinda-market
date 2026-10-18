"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/Badge";
import { PriceTag } from "@/components/PriceTag";
import { useT } from "@/i18n";

interface PageProps {
  params: {
    reference: string;
  };
}

export default function OrderTrackingPage({ params }: PageProps) {
  const { t } = useT();
  const reference = (params?.reference || "MW-1250").toUpperCase();
  const [downloadNotice, setDownloadNotice] = useState(false);

  // Dynamic simulation depending on reference
  const isDelivered = reference.includes("309") || reference.includes("LIVRE");
  const isTransit = reference.includes("849") || reference.includes("TRANSIT");

  const statusLabel = isDelivered
    ? t("tracking.status_delivered")
    : isTransit
    ? t("tracking.status_transit")
    : t("tracking.status_in_delivery");

  const statusVariant = isDelivered ? "verified" : isTransit ? "interprovincial" : "express";

  // B-03: une référence valide suit le pattern MWD-YYYY-NNN
  // Les patterns connus de simulation (MWD-2024-*, MWD-2025-*) sont acceptés
  const isValidRef = /^MWD-\d{4}-\d{3,}$/i.test(reference) ||
    reference.includes("MW-") ||
    reference.includes("MWD");

  const handlePrint = () => {
    setDownloadNotice(true);
    setTimeout(() => {
      setDownloadNotice(false);
      window.print();
    }, 400);
  };

  // B-03: état visuel si la référence est introuvable
  if (!isValidRef) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-8 sm:p-16 text-center max-w-md mx-auto shadow-card space-y-6">
            <div className="w-20 h-20 bg-surface-container text-outline rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl">search_off</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold text-primary font-display">
                {t("tracking.not_found_title")}
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                {t("tracking.not_found_desc")}
              </p>
              <p className="font-mono text-xs text-outline bg-surface-container px-3 py-1.5 rounded-lg inline-block mt-1">
                &ldquo;{reference}&rdquo;
              </p>
            </div>
            <Link
              href="/suivi"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-tertiary hover:bg-tertiary-hover text-white rounded-lg font-bold text-xs sm:text-sm transition shadow-md"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span>{t("tracking.not_found_cta")}</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-secondary selection:text-white print:bg-white">
      <div className="print:hidden">
        <Header />
      </div>

      {/* Breadcrumb Bar */}
      <nav aria-label="Breadcrumb" className="bg-surface-container-lowest border-b border-outline-variant print:hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-10 py-3">
          <ol className="flex items-center gap-2 text-xs text-outline">
            <li>
              <Link href="/" className="hover:text-primary transition flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">home</span>
                <span>{t("tracking.breadcrumb_home")}</span>
              </Link>
            </li>
            <li>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
            </li>
            <li>
              <Link href="/suivi" className="hover:text-primary transition">
                {t("tracking.breadcrumb_tracking")}
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-secondary font-bold">#{reference}</span>
            </li>
          </ol>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-10 py-6 lg:py-8 space-y-6">
        {/* Print / Download notification toast */}
        {downloadNotice && (
          <div className="bg-primary text-white text-xs px-4 py-3 rounded-xl shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400">check_circle</span>
              <span>{t("tracking.generating_slip")} #{reference}...</span>
            </div>
          </div>
        )}

        {/* TOP SUMMARY BANNER */}
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-card p-5 sm:p-7">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-primary font-display tracking-tight">
                  {t("tracking.summary_realtime_title")}
                </h1>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold bg-primary text-white shadow-sm">
                  #{reference}
                </span>
                <Badge variant={statusVariant} text={statusLabel} />
              </div>

              <div className="text-xs sm:text-sm text-on-surface-variant flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base text-secondary">calendar_today</span>
                  <span>{t("tracking.ordered_on")} <strong className="text-primary">{t("tracking.ordered_today")}</strong></span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base text-tertiary">payments</span>
                  <span>{t("tracking.total_amount_label")} <strong className="text-primary">819 $ USD</strong> (~ 2 293 200 CDF)</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-surface-container text-secondary px-2.5 py-0.5 rounded-full">
                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified_user
                  </span>
                  <span>{t("tracking.secured_mwinda_pay")}</span>
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-outline-variant hover:border-secondary hover:bg-surface-container-low text-xs sm:text-sm font-bold text-on-surface transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-base text-secondary">print</span>
                <span>{t("tracking.btn_print_slip")}</span>
              </button>

              <a
                href="tel:+243818900125"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-base text-emerald-400">call</span>
                <span>{t("tracking.btn_contact_carrier")}</span>
              </a>
            </div>
          </div>
        </section>

        {/* 2-COLUMNS GRID: 7 COLS (MAP + COURIER + ITEMS) & 5 COLS (STATUS + TIMELINE + PIN + REASSURANCE) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT COLUMN (~7 COLS) ================= */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Interactive Stylized Cartography of Trajectory */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-card overflow-hidden flex flex-col">
              {/* Map Header */}
              <div className="px-5 py-3.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-lg">map</span>
                  <h3 className="font-bold text-sm text-primary font-display">
                    {t("tracking.map_title")}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <span className="inline-block w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
                  <span className="font-mono font-semibold">{t("tracking.gps_active")}</span>
                </div>
              </div>

              {/* Styled SVG Map Canvas */}
              <div className="relative w-full h-[360px] sm:h-[380px] bg-[#EEF4FB] overflow-hidden select-none">
                <svg
                  className="absolute inset-0 w-full h-full"
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 700 380"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern id="grid-pattern-order" width="24" height="24" patternUnits="userSpaceOnUse">
                      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#DCE6F2" strokeWidth="0.75" />
                    </pattern>
                    <linearGradient id="river-grad-order" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#CBE3F8" />
                      <stop offset="100%" stopColor="#A5CDEC" />
                    </linearGradient>
                  </defs>

                  {/* Grid base */}
                  <rect width="100%" height="100%" fill="url(#grid-pattern-order)" />

                  {/* Congo River (Pool Malebo) */}
                  <path
                    d="M-20,0 C150,45 280,30 420,70 C560,110 640,40 720,20 L720,0 L-20,0 Z"
                    fill="url(#river-grad-order)"
                    opacity="0.9"
                  />
                  <text
                    x="210"
                    y="32"
                    fill="#006398"
                    fontFamily="Plus Jakarta Sans"
                    fontSize="11"
                    fontWeight="700"
                    letterSpacing="0.1em"
                    opacity="0.7"
                  >
                    FLEUVE CONGO (POOL MALEBO)
                  </text>

                  {/* Communes Kinshasa */}
                  <path
                    d="M120,75 L380,85 L390,195 L140,185 Z"
                    fill="#FFFFFF"
                    fillOpacity="0.75"
                    stroke="#CBD5E1"
                    strokeWidth="1.5"
                  />
                  <text
                    x="220"
                    y="145"
                    fill="#45464E"
                    fontFamily="Inter"
                    fontSize="12"
                    fontWeight="700"
                    letterSpacing="0.05em"
                  >
                    GOMBE
                  </text>

                  <path
                    d="M20,110 L120,75 L140,185 L50,290 L0,260 Z"
                    fill="#F8FAFC"
                    fillOpacity="0.8"
                    stroke="#CBD5E1"
                    strokeDasharray="3 3"
                    strokeWidth="1.2"
                  />
                  <text x="45" y="195" fill="#75777F" fontFamily="Inter" fontSize="11" fontWeight="600">
                    KINTAMBO / NGALIEMA
                  </text>

                  <path
                    d="M380,85 L650,115 L620,320 L390,195 Z"
                    fill="#F8FAFC"
                    fillOpacity="0.75"
                    stroke="#CBD5E1"
                    strokeDasharray="3 3"
                    strokeWidth="1.2"
                  />
                  <text x="470" y="210" fill="#75777F" fontFamily="Inter" fontSize="11" fontWeight="600">
                    LIMETE INDUSTRIEL
                  </text>

                  {/* Road Network */}
                  <path d="M100,165 Q260,140 450,160" stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round" />
                  <path d="M100,165 Q260,140 450,160" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
                  <text
                    x="180"
                    y="172"
                    fill="#75777F"
                    fontFamily="Inter"
                    fontSize="9"
                    fontWeight="500"
                    transform="rotate(-6 180 172)"
                  >
                    Bd du 30 Juin
                  </text>

                  {/* Route trajectory */}
                  <path
                    d="M130,118 C170,135 210,142 270,140 C320,138 350,165 375,178 C400,190 420,205 450,215"
                    fill="none"
                    stroke="#0B1B3D"
                    strokeDasharray="6 6"
                    strokeLinecap="round"
                    strokeWidth="4"
                  />

                  {/* Active completed route */}
                  <path
                    d="M130,118 C170,135 210,142 270,140 C310,138 335,155 350,165"
                    fill="none"
                    stroke="#006398"
                    strokeLinecap="round"
                    strokeWidth="4"
                  />

                  {/* Marker A: Hub Solaris Mondjiba */}
                  <g transform="translate(130, 118)">
                    <circle r="16" fill="#0B1B3D" fillOpacity="0.15" />
                    <circle r="9" fill="#0B1B3D" />
                    <circle r="4" fill="#FFFFFF" />
                  </g>

                  {/* Marker B: Destination */}
                  <g transform="translate(450, 215)">
                    <circle r="18" fill="#BA1A1A" fillOpacity="0.15" />
                    <circle r="10" fill="#BA1A1A" />
                    <path d="M-4,-2 L0,-6 L4,-2 L0,5 Z" fill="#FFFFFF" />
                  </g>

                  {/* Moving courier marker */}
                  <g transform="translate(350, 165)">
                    <circle r="22" fill="#E55507" fillOpacity="0.25" className="animate-ping" />
                    <circle r="14" fill="#E55507" stroke="#FFFFFF" strokeWidth="2.5" />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontFamily="Material Symbols Outlined"
                      fontSize="14"
                    >
                      two_wheeler
                    </text>
                  </g>
                </svg>

                {/* Floating Callout A: Hub */}
                <div className="absolute top-8 left-4 sm:left-6 bg-surface-container-lowest/95 backdrop-blur-sm border border-outline-variant shadow-md rounded-xl p-2.5 max-w-[210px] text-left">
                  <div className="flex items-center gap-1.5 text-primary">
                    <span className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                      A
                    </span>
                    <span className="text-xs font-bold font-display">Hub Mwinda Kinshasa</span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">
                    Av. Colonel Mondjiba (Colis scellé à 13h20)
                  </p>
                </div>

                {/* Floating Callout Courier: In transit */}
                <div className="absolute top-[120px] left-[50%] -translate-x-1/2 bg-primary text-white border border-outline shadow-lg rounded-xl px-3 py-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
                  <div>
                    <p className="text-xs font-bold leading-tight">Patrick M. en route</p>
                    <p className="text-[10px] text-sky-200 leading-none">Rond-point Socimat (à ~850m)</p>
                  </div>
                </div>

                {/* Floating Callout B: Destination */}
                <div className="absolute bottom-5 right-4 sm:right-6 bg-surface-container-lowest/95 backdrop-blur-sm border border-outline-variant shadow-md rounded-xl p-2.5 max-w-[210px] text-left">
                  <div className="flex items-center gap-1.5 text-rose-600">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      home_pin
                    </span>
                    <span className="text-xs font-bold text-primary font-display">{t("tracking.destination_client")}</span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">
                    Av. de la Justice, Résidence Les Palmiers, Gombe
                  </p>
                </div>
              </div>

              {/* Courier Profile Section */}
              <div className="p-4 sm:p-5 bg-surface-container-lowest border-t border-outline-variant">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <Image
                        className="w-14 h-14 rounded-full object-cover border-2 border-secondary"
                        alt="Patrick M."
                        src="/images/driver-courier.jpg"
                        width={56}
                        height={56}
                      />
                      <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-secondary text-white flex items-center justify-center text-[9px] shadow">
                        <span className="material-symbols-outlined text-[10px]">check</span>
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm sm:text-base text-primary font-display">
                          Patrick M.
                        </h4>
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-secondary-fixed text-on-secondary-container">
                          <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                            verified
                          </span>
                          <span>{t("tracking.courier_verified")}</span>
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Moto Yamaha AG100 • <span className="font-mono text-primary font-semibold">Kin 4821 AA</span>
                      </p>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-tertiary mt-1">
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                        <span>4.9</span>
                        <span className="text-outline font-normal">({`184 ${t("tracking.successful_deliveries")}`})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-stretch sm:self-auto print:hidden">
                    <a
                      href="tel:+243818900125"
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-slate-800 transition shadow-sm"
                    >
                      <span className="material-symbols-outlined text-base">phone</span>
                      <span>{t("tracking.call_courier")} (+243 81...)</span>
                    </a>
                    <a
                      href="https://wa.me/243818900125"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#1EBE5D] transition shadow-sm"
                    >
                      <span className="material-symbols-outlined text-base">chat</span>
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Items summary transported in this parcel */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
                <h3 className="text-sm sm:text-base font-bold text-primary font-display flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">inventory_2</span>
                  <span>{t("tracking.items_in_parcel")} (3)</span>
                </h3>
                <span className="text-xs font-mono text-outline">{t("tracking.parcel_sealed")} #COL-8891-KIN</span>
              </div>

              <div className="divide-y divide-outline-variant/60">
                {/* Item 1 */}
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/images/products/station-energie-solaire-1000w.jpg"
                      alt="Station d'Énergie Solaire Hybride 1000W"
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-xl object-cover border border-outline-variant bg-surface-container-low shrink-0"
                    />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-primary line-clamp-1">
                        Station d&apos;Énergie Solaire Hybride 1000W
                      </h4>
                      <p className="text-[11px] text-on-surface-variant">
                        {t("tracking.vendor_label")} <span className="font-semibold text-secondary">Solaris RDC Gombe</span> • {t("tracking.qty_label")} 1
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <PriceTag usdPrice={640} size="sm" />
                  </div>
                </div>

                {/* Item 2 */}
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/images/products/brazza-robe-wax-ndoki.jpg"
                      alt="Robe Wax Kin Fashion Création"
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-xl object-cover border border-outline-variant bg-surface-container-low shrink-0"
                    />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-primary line-clamp-1">
                        Robe Wax Kin Fashion Création
                      </h4>
                      <p className="text-[11px] text-on-surface-variant">
                        {t("tracking.vendor_label")} <span className="font-semibold text-secondary">Kin Fashion Boutique</span> • Taille L • {t("tracking.qty_label")} 1
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <PriceTag usdPrice={95} size="sm" />
                  </div>
                </div>

                {/* Item 3 */}
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/images/products/ventilateur-solaire-16-pouces.jpg"
                      alt="Ventilateur Solaire Silencieux Rechargeable"
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-xl object-cover border border-outline-variant bg-surface-container-low shrink-0"
                    />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-primary line-clamp-1">
                        Ventilateur Solaire Silencieux Rechargeable
                      </h4>
                      <p className="text-[11px] text-on-surface-variant">
                        {t("tracking.vendor_label")} <span className="font-semibold text-secondary">Solaris RDC Gombe</span> • {t("tracking.qty_label")} 1
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <PriceTag usdPrice={84} size="sm" />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant">
                <span>{t("tracking.express_shipping_fee")}</span>
                <span className="font-bold text-emerald-600">{t("tracking.free_loyalty")}</span>
              </div>
            </div>

            {/* 3. Destination Client Info Block */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-card p-5 sm:p-6 space-y-2">
              <h3 className="text-sm sm:text-base font-bold text-primary font-display flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">pin_drop</span>
                <span>{t("tracking.destination_confirmed_title")}</span>
              </h3>
              <div className="text-xs sm:text-sm text-on-surface space-y-1">
                <p className="font-bold text-primary">Jean-Luc Mukendi</p>
                <p className="text-on-surface-variant">Avenue de la Justice, Résidence Les Palmiers, Apt 4B</p>
                <p className="text-on-surface-variant">Commune de la Gombe • Kinshasa, RDC</p>
                <p className="text-xs text-secondary font-medium pt-1">
                  {t("tracking.instructions_prefix")} Sonner à la barrière principale, gardiennage informé pour réception.
                </p>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN (~5 COLS) ================= */}
          <div className="lg:col-span-5 space-y-6">
            {/* Status & Dynamic ETA Card */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-card p-5 sm:p-6 space-y-5">
              {/* Badge Statut */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-container">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
                <span className="text-xs font-bold">
                  Commande #{reference} - {statusLabel}
                </span>
              </div>

              {/* Dynamic ETA */}
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-primary font-display">
                  {t("tracking.estimated_arrival")} <span className="text-tertiary">~ 35 minutes</span>
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                  {t("tracking.delivery_scheduled_today")} <strong className="text-primary font-bold">15h00 et 17h00</strong>.
                </p>
              </div>

              {/* Global Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-surface-container-high rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-tertiary h-full rounded-full transition-all duration-700"
                    style={{ width: isDelivered ? "100%" : isTransit ? "60%" : "80%" }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-outline font-semibold">
                  <span>{t("tracking.step_validated")}</span>
                  <span>{t("tracking.step_prepared")}</span>
                  <span>{t("tracking.step_hub")}</span>
                  <span className="text-tertiary font-bold">{t("tracking.step_last_mile")}</span>
                  <span>{t("tracking.step_delivered")}</span>
                </div>
              </div>

              <hr className="border-outline-variant" />

              {/* VERTICAL TIMELINE */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-3 before:w-0.5 before:bg-outline-variant">
                {/* Step 1: Commande confirmée */}
                <div className="relative">
                  <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-4 ring-white shadow-sm">
                    <span className="material-symbols-outlined text-xs font-bold">check</span>
                  </span>
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-primary font-display">{t("tracking.timeline_placed_title")}</h4>
                      <span className="text-[11px] text-outline font-medium">Aujourd&apos;hui, 09h15</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {t("tracking.timeline_placed_desc")}
                    </p>
                  </div>
                </div>

                {/* Step 2: Préparation boutique */}
                <div className="relative">
                  <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-4 ring-white shadow-sm">
                    <span className="material-symbols-outlined text-xs font-bold">check</span>
                  </span>
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-primary font-display">{t("tracking.timeline_confirmed_title")}</h4>
                      <span className="text-[11px] text-outline font-medium">Aujourd&apos;hui, 10h05</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {t("tracking.timeline_confirmed_desc")}
                    </p>
                  </div>
                </div>

                {/* Step 3: Expédition hub d'origine */}
                <div className="relative">
                  <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-4 ring-white shadow-sm">
                    <span className="material-symbols-outlined text-xs font-bold">check</span>
                  </span>
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-primary font-display">{t("tracking.timeline_shipped_title")}</h4>
                      <span className="text-[11px] text-outline font-medium">Aujourd&apos;hui, 13h20</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {t("tracking.timeline_shipped_desc")}
                    </p>
                  </div>
                </div>

                {/* Step 4: Dernier kilomètre (Active or Done) */}
                <div className="relative">
                  <span
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm ${
                      isDelivered ? "bg-emerald-600 text-white" : "bg-tertiary text-white ring-amber-100"
                    }`}
                  >
                    {isDelivered ? (
                      <span className="material-symbols-outlined text-xs font-bold">check</span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                    )}
                  </span>
                  <div className={`p-3 rounded-xl border ${isDelivered ? "bg-surface-container-low border-outline-variant" : "bg-surface-container-low border-secondary/30"}`}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-primary font-display flex items-center gap-1.5">
                        <span>{t("tracking.timeline_delivery_title")}</span>
                        {!isDelivered && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-tertiary text-white">
                            {t("tracking.timeline_delivery_badge")}
                          </span>
                        )}
                      </h4>
                      <span className="text-[11px] text-on-surface-variant font-bold">Aujourd&apos;hui, 14h45</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                      {t("tracking.timeline_delivery_desc")}
                    </p>
                  </div>
                </div>

                {/* Step 5: Remise & PIN */}
                <div className={`relative ${isDelivered ? "" : "opacity-60"}`}>
                  <span
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                      isDelivered
                        ? "bg-emerald-600 text-white"
                        : "bg-surface-container-lowest border-2 border-outline-variant text-outline"
                    }`}
                  >
                    {isDelivered ? (
                      <span className="material-symbols-outlined text-xs font-bold">check</span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-outline-variant"></span>
                    )}
                  </span>
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-primary font-display">
                        {t("tracking.timeline_delivered_title")}
                      </h4>
                      <span className="text-[11px] text-outline font-medium">Estimée : 15h30</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {t("tracking.timeline_delivered_desc")}
                    </p>
                  </div>
                </div>
              </div>

              {/* BLOC CODE PIN DE SÉCURITÉ */}
              <div className="p-4 rounded-xl bg-primary text-white space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-sky-200 text-xs font-bold uppercase tracking-wider">
                      <span className="material-symbols-outlined text-sm">key</span>
                      <span>{t("tracking.pin_title")}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      {t("tracking.pin_desc")}
                    </p>
                  </div>
                  <div className="bg-white text-primary px-3.5 py-2 rounded-lg font-mono font-black text-2xl tracking-widest shadow select-all text-center shrink-0">
                    8429
                  </div>
                </div>
              </div>

              {/* RÉASSURANCE MWINDA PAY */}
              <div className="p-3.5 rounded-xl bg-secondary/10 border border-secondary/20 flex items-start gap-2.5 text-xs text-on-surface">
                <span className="material-symbols-outlined text-secondary shrink-0 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  shield
                </span>
                <div>
                  <strong className="font-bold text-primary">{t("tracking.buyer_protection_title")}</strong>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    {t("tracking.buyer_protection_desc")}
                  </p>
                </div>
              </div>

              {/* SUPPORT & ASSISTANCE CONTACT */}
              <div className="pt-3 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <span className="text-on-surface-variant font-medium">{t("tracking.support_race")}</span>
                <div className="flex items-center gap-3">
                  <a href="tel:+243810009999" className="text-secondary font-bold hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">support_agent</span>
                    <span>{t("tracking.support_247")} (+243 81)</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
